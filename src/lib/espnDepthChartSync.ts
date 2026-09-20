import { Competitor, SportId } from '../types';
import { getTeamColors, getTeamFullName, normalizeTeamCode } from '../utils/teamData';
import { supabase, isSupabaseConfigured } from './supabaseClient';

export interface DynamicDepthChartResult {
  success: boolean;
  totalCompetitors: number;
  teamsCount: number;
  competitors: Competitor[];
  count?: number;
  error?: string;
}

export interface DynamicAthleteRecord {
  id: string;
  athlete_id: string;
  name: string;
  jersey: string;
  position: 'QB' | 'RB' | 'WR' | 'TE';
  team: string;
  game_id: string;
  sport: 'nfl';
  current_score: number;
  score: number;
  stats?: Record<string, any>;
  updated_at: string;
}

/**
 * Checks if an athlete is inactive according to ESPN's injury report
 * (Status includes 'Out' or 'Injured Reserve', or type abbreviation is 'IR' or 'O')
 */
export function isInjuryInactive(athlete: any): boolean {
  if (!athlete) return false;
  const injuries = athlete.injuries || [];
  return injuries.some((inj: any) => {
    const status = (inj?.status || '').toLowerCase();
    const typeAbbr = (inj?.type?.abbreviation || '').toLowerCase();
    return (
      status.includes('out') ||
      status.includes('injured reserve') ||
      typeAbbr === 'ir' ||
      typeAbbr === 'o'
    );
  });
}

/**
 * Safe fetch helper with fallback from proxy to direct ESPN API
 */
async function safeFetchJson(proxyUrl: string, directUrl: string): Promise<any> {
  try {
    const res = await fetch(proxyUrl);
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // ignore and try direct
  }

  try {
    const res = await fetch(directUrl);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn(`[SafeFetch] Failed both proxy and direct for ${directUrl}:`, err);
  }
  return null;
}

/**
 * Pure Dynamic Data Pipeline:
 * Queries ESPN Scoreboard, fetches live Depth Charts for all participating teams,
 * programmatically parses active starters (QB, RB, WR, TE) by rank and injury status,
 * and upserts directly into Supabase and local application storage.
 * 
 * ZERO HARDCODED NAMES OR JERSEY NUMBERS.
 */
export async function runPureDynamicDepthChartSync(
  onProgress?: (step: string) => void
): Promise<DynamicDepthChartResult> {
  try {
    onProgress?.('Fetching active NFL schedule from ESPN...');

    // 1. Fetch upcoming NFL scoreboard
    const scoreboardData = await safeFetchJson(
      '/api/espn/scoreboard?sport=nfl',
      'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard'
    );

    if (!scoreboardData || !Array.isArray(scoreboardData.events)) {
      throw new Error('Failed to retrieve active NFL scoreboard from ESPN');
    }

    const events = scoreboardData.events;
    onProgress?.(`Found ${events.length} NFL games. Resolving live depth charts...`);

    // Collect unique team IDs and map to game IDs and abbreviations
    interface TeamGameRef {
      teamId: string;
      teamAbbr: string;
      gameId: string;
    }

    const teamRefs = new Map<string, TeamGameRef>();

    for (const ev of events) {
      const gameId = String(ev.id);
      const competitors = ev.competitions?.[0]?.competitors || [];
      for (const comp of competitors) {
        const teamId = String(comp.id);
        const rawAbbr = comp.team?.abbreviation || '';
        const teamAbbr = normalizeTeamCode(rawAbbr) || rawAbbr.toUpperCase();
        if (teamId && !teamRefs.has(teamId)) {
          teamRefs.set(teamId, { teamId, teamAbbr, gameId });
        }
      }
    }

    const teamList = Array.from(teamRefs.values());
    onProgress?.(`Fetching live depth charts and active rosters for ${teamList.length} teams...`);

    // Fetch depth charts and rosters in parallel for maximum speed
    const depthChartAndRosterMap = new Map<
      string,
      { depthChart: any; jerseyMap: Map<string, string> }
    >();

    await Promise.all(
      teamList.map(async ({ teamId }) => {
        try {
          const [dcData, rData] = await Promise.all([
            safeFetchJson(
              `/api/espn/depthchart?teamId=${teamId}`,
              `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${teamId}/depthcharts`
            ),
            safeFetchJson(
              `/api/espn/roster?teamId=${teamId}`,
              `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${teamId}/roster`
            ),
          ]);

          const jerseyMap = new Map<string, string>();
          if (rData && Array.isArray(rData.athletes)) {
            for (const grp of rData.athletes) {
              if (Array.isArray(grp.items)) {
                for (const ath of grp.items) {
                  if (ath.id) {
                    jerseyMap.set(String(ath.id), String(ath.jersey || ''));
                  }
                }
              }
            }
          }

          if (dcData) {
            depthChartAndRosterMap.set(teamId, { depthChart: dcData, jerseyMap });
          }
        } catch (teamErr) {
          console.warn(`[DepthChart] Failed to load depth chart for team ${teamId}:`, teamErr);
        }
      })
    );

    // Helper to select active athletes by rank with injury fallback
    function pickActiveAthletes(athletes: any[], targetCount: number): any[] {
      if (!Array.isArray(athletes)) return [];
      const active: any[] = [];
      for (const ath of athletes) {
        if (!isInjuryInactive(ath)) {
          active.push(ath);
          if (active.length >= targetCount) break;
        }
      }
      // If all are marked injured/inactive, fallback to top ranked
      if (active.length === 0 && athletes.length > 0) {
        active.push(athletes[0]);
      }
      return active;
    }

    const dynamicCompetitors: Competitor[] = [];
    const dbUpsertRecords: DynamicAthleteRecord[] = [];

    // Parse each team's depth chart programmatically
    for (const { teamId, teamAbbr, gameId } of teamList) {
      const data = depthChartAndRosterMap.get(teamId);
      if (!data || !data.depthChart) continue;

      const { depthChart, jerseyMap } = data;
      const offGroup = (depthChart.depthchart || []).find(
        (g: any) => g.positions && (g.positions.qb || g.positions.rb)
      );

      if (!offGroup || !offGroup.positions) continue;

      const positions = offGroup.positions;
      const teamColors = getTeamColors(teamAbbr);
      const teamFullName = getTeamFullName(teamAbbr);

      const addAthlete = (athlete: any, positionAbbr: 'QB' | 'RB' | 'WR' | 'TE') => {
        if (!athlete || !athlete.id) return;
        const athleteId = String(athlete.id);
        const name = athlete.displayName || `${teamAbbr} ${positionAbbr}`;
        const rawJersey = jerseyMap.get(athleteId) || athlete.jersey || '';
        const uniformNumber = parseInt(rawJersey, 10) || 10;
        const shortName = (
          athlete.shortName ||
          name.split(' ').pop() ||
          positionAbbr
        )
          .toUpperCase()
          .replace(/[^A-Z]/g, '');

        // 1. Supabase database record strictly following spec
        dbUpsertRecords.push({
          id: `nfl_${athleteId}`,
          athlete_id: athleteId,
          name: name,
          jersey: String(rawJersey || uniformNumber),
          position: positionAbbr,
          team: teamAbbr,
          game_id: gameId,
          sport: 'nfl',
          current_score: 0,
          score: 0,
          stats: {
            pass_yds: 0,
            rush_yds: 0,
            rec_yds: 0,
            tds: 0,
            fgs: 0,
            stops: 0,
            touchdowns: 0,
            total_yards: 0,
            primaryMetricLabel: 'Touchdowns',
            primaryMetricValue: 0,
          },
          updated_at: new Date().toISOString(),
        });

        // 2. Full interactive frontend Competitor object
        dynamicCompetitors.push({
          id: `nfl_${athleteId}`,
          athleteId: athleteId,
          sportId: 'nfl',
          displayName: name,
          shortName: shortName,
          uniformNumber: uniformNumber,
          teamName: teamFullName,
          teamCode: teamAbbr,
          positionGeneric: positionAbbr === 'QB' ? 'PLAYMAKER' : 'OFFENSE',
          position: positionAbbr,
          rating: 90,
          score: 0,
          stats: {
            pass_yds: 0,
            rush_yds: 0,
            rec_yds: 0,
            tds: 0,
            fgs: 0,
            stops: 0,
            touchdowns: 0,
            total_yards: 0,
            primaryMetricLabel: 'Touchdowns',
            primaryMetricValue: 0,
          },
          badges: ['gold_star'],
          avatar: {
            helmetColor: teamColors.helmet,
            jerseyColor: teamColors.jersey,
            stripeColor: teamColors.stripe,
            skinTone: '#e0ac69',
            number: uniformNumber,
          },
        });
      };

      // 1. Quarterback (QB): Rank 1, fallback to 2 if Out/IR
      const qbAthletes = positions.qb?.athletes || [];
      const activeQBs = pickActiveAthletes(qbAthletes, 1);
      activeQBs.forEach((a) => addAthlete(a, 'QB'));

      // 2. Running Backs (RB): Rank 1 & 2 active
      const rbAthletes = positions.rb?.athletes || [];
      const activeRBs = pickActiveAthletes(rbAthletes, 2);
      activeRBs.forEach((a) => addAthlete(a, 'RB'));

      // 3. Wide Receivers (WR): Rank 1, 2, 3 active (inspect wr1, wr2, wr3)
      const wrCandidates: any[] = [];
      ['wr1', 'wr2', 'wr3'].forEach((slot) => {
        const slotAthletes = positions[slot]?.athletes || [];
        const chosen = pickActiveAthletes(slotAthletes, 1);
        if (chosen[0]) wrCandidates.push(chosen[0]);
      });
      // Fallback from general WR pool if less than 3
      if (wrCandidates.length < 3) {
        const remaining = pickActiveAthletes(positions.wr1?.athletes || [], 3 - wrCandidates.length);
        for (const rem of remaining) {
          if (!wrCandidates.some((w) => w.id === rem.id)) {
            wrCandidates.push(rem);
          }
        }
      }
      wrCandidates.slice(0, 3).forEach((a) => addAthlete(a, 'WR'));

      // 4. Tight End (TE): Rank 1 active
      const teAthletes = positions.te?.athletes || [];
      const activeTEs = pickActiveAthletes(teAthletes, 1);
      activeTEs.forEach((a) => addAthlete(a, 'TE'));
    }

    onProgress?.(`Resolved ${dynamicCompetitors.length} dynamic starters. Upserting to database...`);

    // 2. Dynamic Database Upsert to Supabase
    if (isSupabaseConfigured && dbUpsertRecords.length > 0) {
      try {
        // Attempt onConflict: 'athlete_id,game_id' as requested
        const { error: err1 } = await supabase
          .from('competitors')
          .upsert(dbUpsertRecords, { onConflict: 'athlete_id,game_id' } as any);

        if (err1) {
          // Fallback to onConflict: 'id' for databases with id primary key
          console.warn('[DepthChart Sync] onConflict(athlete_id,game_id) returned:', err1.message, '- retrying with id');
          const { error: err2 } = await supabase
            .from('competitors')
            .upsert(dbUpsertRecords, { onConflict: 'id' });
          if (err2) {
            console.warn('[DepthChart Sync] Supabase upsert error:', err2.message);
          }
        }
      } catch (dbErr) {
        console.warn('[DepthChart Sync] Error writing competitors to Supabase:', dbErr);
      }
    }

    // 3. Cache pure dynamic competitors into localStorage
    try {
      localStorage.setItem('pixel_pros_synced_competitors_nfl', JSON.stringify(dynamicCompetitors));
    } catch (lsErr) {
      console.warn('[DepthChart Sync] LocalStorage write error:', lsErr);
    }

    // 4. Broadcast window events so UI updates seamlessly
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pixel_pros_scores_updated', { detail: { sport: 'nfl' } }));
      window.dispatchEvent(new CustomEvent('pixel_pros_live_matches_updated', { detail: { sport: 'nfl' } }));
    }

    return {
      success: true,
      totalCompetitors: dynamicCompetitors.length,
      count: dynamicCompetitors.length,
      teamsCount: teamList.length,
      competitors: dynamicCompetitors,
    };
  } catch (err: any) {
    console.error('[DepthChart Sync] Error running dynamic pipeline:', err);
    return {
      success: false,
      totalCompetitors: 0,
      count: 0,
      teamsCount: 0,
      competitors: [],
      error: err.message || 'Unknown error during depth chart synchronization',
    };
  }
}
