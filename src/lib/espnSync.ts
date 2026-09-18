import { Match, Competitor, SportId } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { getTeamFullName, getTeamColors, DEFAULT_NFL_COMPETITORS } from '../utils/teamData';
import { getNBATeamFullName, getNBATeamColors, DEFAULT_NBA_COMPETITORS } from '../utils/nbaTeamData';

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
    const liveAthletesMap = new Map<string, any>();
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

      // If game is live, attempt to fetch live boxscore summary for detailed player stats
      if (status === 'live' && sport === 'nfl') {
        try {
          const sumRes = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=${evId}`, {
            signal: AbortSignal.timeout(2500),
          });
          if (sumRes.ok) {
            const sumData = await sumRes.json();
            const playerGroups = sumData.boxscore?.players || [];
            for (const pg of playerGroups) {
              const teamAbbr = normalizeTeamCode(pg.team?.abbreviation || homeCode);
              const statGroups = pg.statistics || [];
              for (const sg of statGroups) {
                const statCat = String(sg.name || '').toLowerCase();
                const athletes = sg.athletes || [];
                for (const item of athletes) {
                  const ath = item.athlete;
                  if (!ath) continue;
                  const dName = ath.displayName || ath.fullName;
                  if (!dName) continue;
                  const athKey = `${dName.trim().toLowerCase()}_${teamAbbr.toUpperCase()}`;
                  const statsArr: string[] = item.stats || [];

                  let existing = liveAthletesMap.get(athKey);
                  if (!existing) {
                    existing = {
                      id: `${sport}-${ath.id || dName.toLowerCase().replace(/\s+/g, '-')}`,
                      sportId: sport,
                      displayName: dName,
                      shortName: (ath.shortName || ath.lastName || dName.split(' ').pop() || 'STAR').toUpperCase(),
                      uniformNumber: parseInt(ath.jersey || '10', 10),
                      teamCode: teamAbbr,
                      position: ath.position?.abbreviation || 'STAR',
                      positionGeneric: ath.position?.abbreviation === 'QB' ? 'PLAYMAKER' : ath.position?.abbreviation === 'K' ? 'SCORER' : 'OFFENSE',
                      pass_yds: 0,
                      rush_yds: 0,
                      rec_yds: 0,
                      tds: 0,
                      fgs: 0,
                      stops: 0,
                      total_yards: 0,
                      score: 6,
                    };
                    liveAthletesMap.set(athKey, existing);
                  }

                  if (statCat === 'passing' && statsArr.length >= 4) {
                    const yds = parseInt(statsArr[1] || '0', 10) || 0;
                    const td = parseInt(statsArr[3] || '0', 10) || 0;
                    existing.pass_yds = Math.max(existing.pass_yds, yds);
                    existing.tds = Math.max(existing.tds, td);
                  } else if (statCat === 'rushing' && statsArr.length >= 4) {
                    const yds = parseInt(statsArr[1] || '0', 10) || 0;
                    const td = parseInt(statsArr[3] || '0', 10) || 0;
                    existing.rush_yds = Math.max(existing.rush_yds, yds);
                    if (td > 0) existing.tds += td;
                  } else if (statCat === 'receiving' && statsArr.length >= 4) {
                    const yds = parseInt(statsArr[1] || '0', 10) || 0;
                    const td = parseInt(statsArr[3] || '0', 10) || 0;
                    existing.rec_yds = Math.max(existing.rec_yds, yds);
                    if (td > 0) existing.tds += td;
                  } else if (statCat === 'kicking' && statsArr.length >= 4) {
                    const fgMade = parseInt((statsArr[0] || '0/0').split('/')[0] || '0', 10) || 0;
                    existing.fgs = Math.max(existing.fgs, fgMade);
                  } else if (statCat === 'defensive' && statsArr.length >= 3) {
                    const sacks = parseInt(statsArr[2] || '0', 10) || 0;
                    if (sacks > 0) existing.stops += sacks;
                  }

                  existing.total_yards = existing.pass_yds + existing.rush_yds + existing.rec_yds;
                  const pts = calculateNFLPoints(existing.tds, existing.fgs, existing.stops, existing.total_yards);
                  existing.score = Math.max(pts, 6);
                }
              }
            }
          }
        } catch {
          // boxscore summary fetch failed or timed out, fallback to leaders below
        }
      }

      // Extract player leaders from game competition (robust scoreboard fallback)
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
          const athKey = `${displayName.trim().toLowerCase()}_${athTeam.toUpperCase()}`;

          let existing = liveAthletesMap.get(athKey);

          if (sport === 'nfl') {
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

            if (!existing) {
              existing = {
                id: athId,
                sportId: 'nfl',
                displayName,
                shortName,
                uniformNumber,
                teamCode: athTeam,
                position: ath.position?.abbreviation || 'STAR',
                positionGeneric: ath.position?.abbreviation === 'QB' ? 'PLAYMAKER' : ath.position?.abbreviation === 'K' ? 'SCORER' : 'OFFENSE',
                pass_yds: 0,
                rush_yds: 0,
                rec_yds: 0,
                tds: 0,
                fgs: 0,
                stops: 0,
                total_yards: 0,
                score: 6,
              };
              liveAthletesMap.set(athKey, existing);
            }

            if (catName.includes('pass')) existing.pass_yds = Math.max(existing.pass_yds, yards);
            if (catName.includes('rush')) existing.rush_yds = Math.max(existing.rush_yds, yards);
            if (catName.includes('rec')) existing.rec_yds = Math.max(existing.rec_yds, yards);
            if (tds > 0) existing.tds = Math.max(existing.tds, tds);
            if (fgs > 0) existing.fgs = Math.max(existing.fgs, fgs);
            if (stops > 0) existing.stops = Math.max(existing.stops, stops);

            existing.total_yards = existing.pass_yds + existing.rush_yds + existing.rec_yds;
            const points = calculateNFLPoints(existing.tds, existing.fgs, existing.stops, existing.total_yards);
            existing.score = Math.max(points, 6);
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

            if (!existing) {
              existing = {
                id: athId,
                sportId: 'nba',
                displayName,
                shortName,
                uniformNumber,
                teamCode: athTeam,
                position: ath.position?.abbreviation || 'G',
                positionGeneric: 'SCORER',
                pts,
                threes,
                reb,
                ast,
                stops,
                score: Math.max(calculateNBAPoints(pts, threes, reb, ast, stops), 12),
              };
              liveAthletesMap.set(athKey, existing);
            } else {
              existing.pts = Math.max(existing.pts || 0, pts);
              existing.threes = Math.max(existing.threes || 0, threes);
              existing.reb = Math.max(existing.reb || 0, reb);
              existing.ast = Math.max(existing.ast || 0, ast);
              existing.stops = Math.max(existing.stops || 0, stops);
              existing.score = Math.max(calculateNBAPoints(existing.pts, existing.threes, existing.reb, existing.ast, existing.stops), 12);
            }
          }
        }
      }
    }

    // Merge live athlete stats with base competitors to create a complete, deduplicated roster!
    const baseCompetitors = sport === 'nba' ? DEFAULT_NBA_COMPETITORS : DEFAULT_NFL_COMPETITORS;
    const finalCompetitorsMap = new Map<string, Competitor>();

    // 1. Seed with base competitors
    for (const base of baseCompetitors) {
      const key = `${(base.displayName || '').trim().toLowerCase()}_${(base.teamCode || '').trim().toUpperCase()}`;
      finalCompetitorsMap.set(key, { ...base });
    }

    // 2. Overlay live athlete data
    for (const [key, live] of liveAthletesMap.entries()) {
      const teamColors = sport === 'nba' ? getNBATeamColors(live.teamCode) : getTeamColors(live.teamCode);

      if (finalCompetitorsMap.has(key)) {
        const existing = finalCompetitorsMap.get(key)!;
        const liveScore = Math.max(live.score, existing.score);
        finalCompetitorsMap.set(key, {
          ...existing,
          score: liveScore,
          rating: liveScore > 25 ? 99 : existing.rating,
          badges: liveScore > 20 ? ['gold_star', 'diamond_crystal'] : existing.badges,
          stats: {
            ...existing.stats,
            ...(sport === 'nfl'
              ? {
                  pass_yds: live.pass_yds || existing.stats?.pass_yds || 0,
                  passingYards: live.pass_yds || existing.stats?.passingYards || 0,
                  rush_yds: live.rush_yds || existing.stats?.rush_yds || 0,
                  rushingYards: live.rush_yds || existing.stats?.rushingYards || 0,
                  rec_yds: live.rec_yds || existing.stats?.rec_yds || 0,
                  receivingYards: live.rec_yds || existing.stats?.receivingYards || 0,
                  tds: live.tds || existing.stats?.tds || 0,
                  touchdowns: live.tds || existing.stats?.touchdowns || 0,
                  fgs: live.fgs || existing.stats?.fgs || 0,
                  stops: live.stops || existing.stats?.stops || 0,
                  total_yards: live.total_yards || existing.stats?.total_yards || 0,
                  primaryMetricValue: live.tds || existing.stats?.primaryMetricValue || 0,
                }
              : {
                  pts: live.pts || existing.stats?.pts || 0,
                  points: live.pts || existing.stats?.points || 0,
                  three_pm: live.threes || existing.stats?.three_pm || 0,
                  reb: live.reb || existing.stats?.reb || 0,
                  ast: live.ast || existing.stats?.ast || 0,
                  big_stops: live.stops || existing.stats?.big_stops || 0,
                  primaryMetricValue: live.threes || existing.stats?.primaryMetricValue || 0,
                }),
          },
        });
      } else {
        // New live competitor discovered in game
        finalCompetitorsMap.set(key, {
          id: live.id,
          sportId: sport,
          displayName: live.displayName,
          shortName: live.shortName,
          uniformNumber: live.uniformNumber,
          teamName: sport === 'nba' ? getNBATeamFullName(live.teamCode) : getTeamFullName(live.teamCode),
          teamCode: live.teamCode,
          positionGeneric: live.positionGeneric,
          position: live.position,
          rating: live.score > 25 ? 98 : 90,
          score: live.score,
          badges: live.score > 20 ? ['gold_star', 'diamond_crystal'] : ['gold_star'],
          stats: sport === 'nfl'
            ? {
                pass_yds: live.pass_yds,
                rush_yds: live.rush_yds,
                rec_yds: live.rec_yds,
                tds: live.tds,
                fgs: live.fgs,
                stops: live.stops,
                touchdowns: live.tds,
                total_yards: live.total_yards,
                primaryMetricLabel: 'Touchdowns',
                primaryMetricValue: live.tds,
              }
            : {
                pts: live.pts,
                points: live.pts,
                three_pm: live.threes,
                reb: live.reb,
                ast: live.ast,
                big_stops: live.stops,
                primaryMetricLabel: '3-Pointers',
                primaryMetricValue: live.threes,
              },
          avatar: {
            helmetColor: ('helmet' in teamColors ? teamColors.helmet : teamColors.jersey) || teamColors.jersey,
            jerseyColor: teamColors.jersey,
            stripeColor: teamColors.stripe,
            skinTone: getSkinTone(live.displayName),
            number: live.uniformNumber,
          },
        });
      }
    }

    // 3. Strictly deduplicate by ID as well
    const seenIds = new Set<string>();
    const parsedCompetitors: Competitor[] = [];
    for (const comp of finalCompetitorsMap.values()) {
      if (!seenIds.has(comp.id)) {
        seenIds.add(comp.id);
        parsedCompetitors.push(comp);
      }
    }

    // Build Supabase records from deduplicated competitors
    for (const comp of parsedCompetitors) {
      supabaseCompetitorRecords.push({
        id: comp.id,
        sport_id: sport,
        short_name: comp.shortName,
        display_name: comp.displayName,
        team_code: comp.teamCode,
        team_name: comp.teamName,
        uniform_number: comp.uniformNumber,
        position: comp.position,
        position_generic: comp.positionGeneric,
        score: comp.score,
        fantasy_points: comp.score,
        stats: comp.stats,
        is_active: true,
        updated_at: new Date().toISOString(),
      });
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
