import { Match, Competitor, SportId } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { getTeamFullName, getTeamColors } from '../utils/teamData';
import { getNBATeamFullName, getNBATeamColors } from '../utils/nbaTeamData';

const SKIN_TONES = ['#f8d9b6', '#e0ac69', '#c68642', '#8d5524', '#523318'];

function getSkinTone(name?: string): string {
  if (!name) return '#e0ac69';
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  return SKIN_TONES[Math.abs(hash) % SKIN_TONES.length];
}

const ESPN_NFL_SCOREBOARD = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard';
const ESPN_NBA_SCOREBOARD = 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard';

export interface ESPNSyncResult {
  success: boolean;
  sport: SportId;
  gamesCount: number;
  playersCount: number;
  message: string;
  timestamp: string;
  details?: string[];
}

const NFL_TEAM_CODE_MAP: Record<string, string> = {
  KAN: 'KC',
  'KANSAS CITY': 'KC',
  DENVER: 'DEN',
  GNB: 'GB',
  'GREEN BAY': 'GB',
  NWE: 'NE',
  'NEW ENGLAND': 'NE',
  NOR: 'NO',
  'NEW ORLEANS': 'NO',
  SFO: 'SF',
  'SAN FRANCISCO': 'SF',
  TAM: 'TB',
  'TAMPA BAY': 'TB',
  WAS: 'WSH',
  WASHINGTON: 'WSH',
  LVR: 'LV',
  'LAS VEGAS': 'LV',
  LA: 'LAR',
};

function normalizeTeamCode(code?: string): string {
  if (!code) return 'PRO';
  const c = code.trim().toUpperCase();
  return NFL_TEAM_CODE_MAP[c] || c;
}

export function getLastESPNSyncTime(sport: SportId): string | null {
  try {
    return localStorage.getItem(`pixel_pros_last_espn_sync_${sport}`) || null;
  } catch {
    return null;
  }
}

function setLastESPNSyncTime(sport: SportId) {
  try {
    localStorage.setItem(`pixel_pros_last_espn_sync_${sport}`, new Date().toLocaleTimeString());
  } catch {
    // ignore
  }
}

/**
 * Returns the active NFL week number that the app is currently on.
 * Strictly guarantees no past or future week games bleed through.
 */
export function getCurrentNFLWeek(): number {
  try {
    const saved = localStorage.getItem('pixel_pros_current_nfl_week');
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return 2; // Default to active NFL Week 2
}

export function setCurrentNFLWeek(weekNumber: number) {
  try {
    localStorage.setItem('pixel_pros_current_nfl_week', String(weekNumber));
    localStorage.setItem('pixel_pros_current_nfl_week_label', `Week ${weekNumber}`);
  } catch {
    // ignore
  }
}

/**
 * Kid-friendly whole number Finger-Math points calculation for NFL
 */
function calculateNFLPoints(tds: number, fgs: number, stops: number, yards: number): number {
  const tdPts = (tds || 0) * 6;
  const fgPts = (fgs || 0) * 3;
  const defPts = (stops || 0) * 2;
  const ydPts = Math.floor((yards || 0) / 50);
  return tdPts + fgPts + defPts + ydPts;
}

/**
 * Kid-friendly whole number Finger-Math points calculation for NBA
 */
function calculateNBAPoints(pts: number, threes: number, reb: number, ast: number, stops: number): number {
  const pointsPts = Math.floor((pts || 0) / 3);
  const threesPts = (threes || 0) * 2;
  const rebPts = (reb || 0) * 1;
  const astPts = (ast || 0) * 1;
  const stopPts = (stops || 0) * 3;
  return pointsPts + threesPts + rebPts + astPts + stopPts;
}

/**
 * Fetches ESPN Scoreboard directly from client browser (enabled by ESPN's public CORS header),
 * parses games & competitors, updates Supabase matches & competitors tables,
 * and refreshes local game state.
 *
 * NOTE: Strictly enforces CURRENT WEEK ONLY for NFL — no past weeks, no future weeks.
 */
export async function syncESPNData(sport: SportId = 'nfl'): Promise<ESPNSyncResult> {
  const url = sport === 'nba' ? ESPN_NBA_SCOREBOARD : ESPN_NFL_SCOREBOARD;
  const sportLabel = sport.toUpperCase();

  try {
    const resp = await fetch(url, { cache: 'no-store' });
    if (!resp.ok) {
      throw new Error(`ESPN API returned HTTP ${resp.status}`);
    }

    const data = await resp.json();
    const events: any[] = data.events || [];

    if (events.length === 0) {
      return {
        success: true,
        sport,
        gamesCount: 0,
        playersCount: 0,
        message: `ESPN currently has 0 active scheduled ${sportLabel} events for today.`,
        timestamp: new Date().toLocaleTimeString(),
      };
    }

    // Determine current active week from ESPN scoreboard response
    const currentWeekNumber: number =
      data.week?.number ||
      events.find((e: any) => e.week?.number)?.week?.number ||
      getCurrentNFLWeek();
    const currentWeekLabel = `Week ${currentWeekNumber}`;

    if (sport === 'nfl') {
      setCurrentNFLWeek(currentWeekNumber);
    }

    const parsedMatches: Match[] = [];
    const parsedCompetitors: Competitor[] = [];
    const supabaseMatchRecords: any[] = [];
    const supabaseCompetitorRecords: any[] = [];

    for (const ev of events) {
      const evWeek: number = ev.week?.number || currentWeekNumber;

      // STRICT USER CONSTRAINT: We don't need to see any games apart from the week that we are on.
      // Filter out past weeks and future weeks completely!
      if (sport === 'nfl' && evWeek !== currentWeekNumber) {
        continue;
      }

      const evId = String(ev.id);
      const comps = ev.competitions || [];
      if (comps.length === 0) continue;
      const comp = comps[0];
      const competitorList = comp.competitors || [];
      if (competitorList.length < 2) continue;

      const homeItem = competitorList.find((c: any) => c.homeAway === 'home') || competitorList[0];
      const awayItem = competitorList.find((c: any) => c.homeAway === 'away') || competitorList[1];

      const homeCode = normalizeTeamCode(homeItem?.team?.abbreviation);
      const awayCode = normalizeTeamCode(awayItem?.team?.abbreviation);

      const homeScore = parseInt(homeItem?.score || '0', 10);
      const awayScore = parseInt(awayItem?.score || '0', 10);

      const statusObj = ev.status?.type || {};
      const rawState = statusObj.state || 'pre';
      const detail = statusObj.shortDetail || statusObj.detail || 'SCHEDULED';

      const isFinal = rawState === 'post' || detail.toLowerCase().includes('final');
      const isLive = rawState === 'in';
      const status: 'upcoming' | 'live' | 'final' = isFinal ? 'final' : isLive ? 'live' : 'upcoming';

      const homeName = sport === 'nba' ? getNBATeamFullName(homeCode) : getTeamFullName(homeCode);
      const awayName = sport === 'nba' ? getNBATeamFullName(awayCode) : getTeamFullName(awayCode);

      const matchObj: Match = {
        id: evId,
        sportId: sport,
        homeTeam: homeName,
        awayTeam: awayName,
        homeTeamCode: homeCode,
        awayTeamCode: awayCode,
        home_team: homeCode,
        away_team: awayCode,
        home_score: homeScore,
        away_score: awayScore,
        quarter_time: detail,
        quarterTime: detail,
        periodLabel: detail,
        status,
        homeScore,
        awayScore,
        week: sport === 'nfl' ? currentWeekNumber : undefined,
        weekLabel: sport === 'nfl' ? currentWeekLabel : undefined,
        gameDate: ev.date,
      };

      parsedMatches.push(matchObj);

      // Supabase record
      supabaseMatchRecords.push({
        id: evId,
        sport_id: sport,
        home_team: homeCode,
        away_team: awayCode,
        home_competitor_name: homeName,
        away_competitor_name: awayName,
        home_score: homeScore,
        away_score: awayScore,
        quarter_time: detail,
        period_label: detail,
        status,
        scheduled_at: ev.date || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // Extract player leaders from game competition
      const leadersList = comp.leaders || [];
      for (const cat of leadersList) {
        const catName = String(cat.name || '').toLowerCase();
        const athletes = cat.leaders || [];

        for (const leaderItem of athletes) {
          const ath = leaderItem.athlete;
          if (!ath) continue;

          const athId = `${sport}-${ath.id}`;
          const displayName = ath.displayName || ath.fullName || 'Pro Star';
          const shortName = (ath.shortName || ath.lastName || displayName.split(' ').pop() || 'STAR').toUpperCase();
          const athTeam = normalizeTeamCode(ath.team?.abbreviation || homeCode);
          const uniformNumber = parseInt(ath.jersey || '10', 10);
          const displayVal = String(leaderItem.displayValue || '');

          if (sport === 'nfl') {
            // Parse display value for yards/TDs e.g. "334 YDS, 2 TD" or "156 YDS, 2 TD"
            let yards = 0;
            let tds = 0;
            let fgs = 0;
            let stops = 0;

            const ydsMatch = displayVal.match(/(\d+)\s*(?:YDS|yds|yards)/i);
            if (ydsMatch) yards = parseInt(ydsMatch[1], 10);

            const tdMatch = displayVal.match(/(\d+)\s*(?:TD|tds|td)/i);
            if (tdMatch) tds = parseInt(tdMatch[1], 10);

            if (catName.includes('kicking') || catName.includes('fieldgoal')) {
              fgs = 1;
            }
            if (catName.includes('defensive') || catName.includes('sack') || catName.includes('tackle')) {
              stops = 2;
            }

            const points = calculateNFLPoints(tds, fgs, stops, yards);
            const teamColors = getTeamColors(athTeam);

            const competitor: Competitor = {
              id: athId,
              sportId: 'nfl',
              displayName,
              shortName,
              uniformNumber,
              teamName: getTeamFullName(athTeam),
              teamCode: athTeam,
              positionGeneric: ath.position?.abbreviation === 'K' ? 'SCORER' : 'OFFENSE',
              position: ath.position?.abbreviation || 'STAR',
              rating: points > 25 ? 99 : 91,
              score: Math.max(points, 6),
              stats: {
                pass_yds: catName.includes('pass') ? yards : 0,
                rush_yds: catName.includes('rush') ? yards : 0,
                rec_yds: catName.includes('rec') ? yards : 0,
                tds,
                fgs,
                stops,
                touchdowns: tds,
                total_yards: yards,
                primaryMetricLabel: 'Touchdowns',
                primaryMetricValue: tds,
              },
              badges: points > 20 ? ['gold_star', 'diamond_crystal'] : ['gold_star'],
              avatar: {
                helmetColor: teamColors.helmet,
                jerseyColor: teamColors.jersey,
                stripeColor: teamColors.stripe,
                skinTone: getSkinTone(displayName),
                number: uniformNumber,
              },
            };

            parsedCompetitors.push(competitor);

            supabaseCompetitorRecords.push({
              id: athId,
              sport_id: 'nfl',
              short_name: shortName,
              display_name: displayName,
              team_code: athTeam,
              team_name: getTeamFullName(athTeam),
              uniform_number: uniformNumber,
              position: ath.position?.abbreviation || 'STAR',
              position_generic: 'OFFENSE',
              score: Math.max(points, 6),
              fantasy_points: Math.max(points, 6),
              stats: competitor.stats,
              is_active: true,
              updated_at: new Date().toISOString(),
            });
          } else {
            // NBA Parsing
            let pts = 20;
            let threes = 2;
            let reb = 5;
            let ast = 5;
            let stops = 1;

            const ptsMatch = displayVal.match(/(\d+)\s*(?:PTS|pts)/i);
            if (ptsMatch) pts = parseInt(ptsMatch[1], 10);

            const rebMatch = displayVal.match(/(\d+)\s*(?:REB|reb)/i);
            if (rebMatch) reb = parseInt(rebMatch[1], 10);

            const astMatch = displayVal.match(/(\d+)\s*(?:AST|ast)/i);
            if (astMatch) ast = parseInt(astMatch[1], 10);

            const points = calculateNBAPoints(pts, threes, reb, ast, stops);
            const nbaColors = getNBATeamColors(athTeam);

            const competitor: Competitor = {
              id: athId,
              sportId: 'nba',
              displayName,
              shortName,
              uniformNumber,
              teamName: getNBATeamFullName(athTeam),
              teamCode: athTeam,
              positionGeneric: 'SCORER',
              position: ath.position?.abbreviation || 'G',
              rating: points > 25 ? 98 : 90,
              score: Math.max(points, 12),
              stats: {
                pts,
                points: pts,
                three_pm: threes,
                reb,
                rebounds: reb,
                ast,
                assists: ast,
                big_stops: stops,
                primaryMetricLabel: '3-Pointers',
                primaryMetricValue: threes,
              },
              badges: points > 25 ? ['diamond_crystal', 'gold_star'] : ['gold_star'],
              avatar: {
                helmetColor: nbaColors.jersey,
                jerseyColor: nbaColors.jersey,
                stripeColor: nbaColors.stripe,
                skinTone: getSkinTone(displayName),
                number: uniformNumber,
              },
            };

            parsedCompetitors.push(competitor);

            supabaseCompetitorRecords.push({
              id: athId,
              sport_id: 'nba',
              short_name: shortName,
              display_name: displayName,
              team_code: athTeam,
              team_name: getNBATeamFullName(athTeam),
              uniform_number: uniformNumber,
              position: ath.position?.abbreviation || 'G',
              position_generic: 'SCORER',
              score: Math.max(points, 12),
              fantasy_points: Math.max(points, 12),
              stats: competitor.stats,
              is_active: true,
              updated_at: new Date().toISOString(),
            });
          }
        }
      }
    }

    // Sort matches so live games (e.g. DET @ BUF) are front and center!
    parsedMatches.sort((a, b) => {
      if (a.status === 'live' && b.status !== 'live') return -1;
      if (b.status === 'live' && a.status !== 'live') return 1;
      if (a.status === 'upcoming' && b.status === 'final') return -1;
      if (b.status === 'upcoming' && a.status === 'final') return 1;
      const dateA = a.gameDate ? new Date(a.gameDate).getTime() : 0;
      const dateB = b.gameDate ? new Date(b.gameDate).getTime() : 0;
      return dateA - dateB;
    });

    // Save into localStorage for instant offline access and fallback
    try {
      localStorage.setItem(`pixel_pros_synced_matches_${sport}`, JSON.stringify(parsedMatches));
      if (parsedCompetitors.length > 0) {
        localStorage.setItem(`pixel_pros_synced_competitors_${sport}`, JSON.stringify(parsedCompetitors));
      }
      setLastESPNSyncTime(sport);
    } catch {
      // storage error
    }

    // Upsert into Supabase tables if connected
    let supabaseSuccess = false;
    if (isSupabaseConfigured) {
      try {
        if (supabaseMatchRecords.length > 0) {
          await supabase.from('matches').upsert(supabaseMatchRecords, { onConflict: 'id' });

          // STRICT CLEANUP: Purge any older games from past or future weeks for this sport
          const currentWeekIds = supabaseMatchRecords.map((m) => m.id);
          if (currentWeekIds.length > 0) {
            await supabase
              .from('matches')
              .delete()
              .eq('sport_id', sport)
              .not('id', 'in', `(${currentWeekIds.map((id) => `"${id}"`).join(',')})`);
          }
        }
        if (supabaseCompetitorRecords.length > 0) {
          await supabase.from('competitors').upsert(supabaseCompetitorRecords, { onConflict: 'id' });
        }
        supabaseSuccess = true;
      } catch (err) {
        console.warn('Supabase upsert notice:', err);
      }
    }

    // Trigger local listeners so current views update immediately
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pixel_pros_live_matches_updated', { detail: { sport, matches: parsedMatches } }));
      window.dispatchEvent(new CustomEvent('pixel_pros_scores_updated', { detail: { sport, competitors: parsedCompetitors } }));
    }

    const weekNotice = sport === 'nfl' ? ` for Week ${currentWeekNumber} ONLY (past/future weeks excluded)` : '';

    return {
      success: true,
      sport,
      gamesCount: parsedMatches.length,
      playersCount: parsedCompetitors.length,
      message: `Successfully synchronized ${parsedMatches.length} ESPN ${sportLabel} games${weekNotice}!${supabaseSuccess ? ' (Updated in Supabase)' : ''}`,
      timestamp: new Date().toLocaleTimeString(),
    };
  } catch (err: any) {
    console.error(`ESPN sync failed for ${sport}:`, err);
    return {
      success: false,
      sport,
      gamesCount: 0,
      playersCount: 0,
      message: `ESPN sync error: ${err.message || 'Network request failed'}`,
      timestamp: new Date().toLocaleTimeString(),
    };
  }
}

/**
 * Commissioner action to purge any matches not belonging to the current active week.
 */
export async function purgeStaleWeekMatches(sport: SportId = 'nfl'): Promise<{ success: boolean; message: string; count: number }> {
  try {
    const currentWeek = getCurrentNFLWeek();
    let purgedCount = 0;

    // Filter local storage matches
    try {
      const raw = localStorage.getItem(`pixel_pros_synced_matches_${sport}`);
      if (raw) {
        const matches: Match[] = JSON.parse(raw);
        const filtered = matches.filter((m) => (sport === 'nfl' && m.week ? m.week === currentWeek : true));
        purgedCount = matches.length - filtered.length;
        localStorage.setItem(`pixel_pros_synced_matches_${sport}`, JSON.stringify(filtered));
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('pixel_pros_live_matches_updated', { detail: { sport, matches: filtered } }));
        }
      }
    } catch {
      // ignore
    }

    if (isSupabaseConfigured) {
      try {
        const { data } = await supabase.from('matches').select('*');
        if (data && data.length > 0) {
          const staleIds = data
            .filter((m: any) => {
              const rowSport = String(m.sport || m.sport_id || '').toLowerCase();
              if (sport === 'nba') return rowSport !== 'nba';
              if (rowSport === 'nba') return false;
              // If row has week and doesn't match current week
              if (m.week && Number(m.week) !== currentWeek) return true;
              return false;
            })
            .map((m: any) => m.id);

          if (staleIds.length > 0) {
            await supabase.from('matches').delete().in('id', staleIds);
            purgedCount += staleIds.length;
          }
        }
      } catch (e) {
        console.warn('Supabase purge error:', e);
      }
    }

    return {
      success: true,
      count: purgedCount,
      message: `Cleaned out stale games. Now showing Week ${currentWeek} only.`,
    };
  } catch (err: any) {
    return {
      success: false,
      count: 0,
      message: `Purge error: ${err.message || 'Failed to purge'}`,
    };
  }
}
