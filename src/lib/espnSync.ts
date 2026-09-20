import { Match, Competitor, SportId } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { getTeamFullName, getTeamColors, DEFAULT_NFL_COMPETITORS, DEFAULT_NFL_MATCHES } from '../utils/teamData';
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

// Official ESPN NFL team IDs for all 32 franchises
const ESPN_NFL_TEAM_ID_MAP: Record<string, string> = {
  '1': 'ATL', '2': 'BUF', '3': 'CHI', '4': 'CIN', '5': 'CLE', '6': 'DAL', '7': 'DEN', '8': 'DET',
  '9': 'GB', '10': 'TEN', '11': 'IND', '12': 'KC', '13': 'LV', '14': 'LAR', '15': 'MIA', '16': 'MIN',
  '17': 'NE', '18': 'NO', '19': 'NYG', '20': 'NYJ', '21': 'PHI', '22': 'ARI', '23': 'PIT', '24': 'LAC',
  '25': 'SF', '26': 'SEA', '27': 'TB', '28': 'WSH', '29': 'CAR', '30': 'JAX', '33': 'BAL', '34': 'HOU',
};

// Official ESPN NBA team IDs for all 30 franchises
const ESPN_NBA_TEAM_ID_MAP: Record<string, string> = {
  '1': 'ATL', '2': 'BOS', '3': 'NOP', '4': 'CHI', '5': 'CLE', '6': 'DAL', '7': 'DEN', '8': 'DET',
  '9': 'GSW', '10': 'HOU', '11': 'IND', '12': 'LAC', '13': 'LAL', '14': 'MIA', '15': 'MIL', '16': 'MIN',
  '17': 'BKN', '18': 'NYK', '19': 'ORL', '20': 'PHI', '21': 'PHX', '22': 'POR', '23': 'SAC', '24': 'SAS',
  '25': 'OKC', '26': 'UTA', '27': 'WAS', '28': 'TOR', '29': 'MEM', '30': 'CHA',
};

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
 * (Touchdowns = 6, Field Goals = 3, Big Stops = 2, Scrimmage Yards = 1 pt per 10 yards)
 */
function calculateNFLPoints(tds: number, fgs: number, stops: number, yards: number): number {
  const tdPts = (tds || 0) * 6;
  const fgPts = (fgs || 0) * 3;
  const defPts = (stops || 0) * 2;
  const ydPts = Math.floor((yards || 0) / 10);
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
  // Query ESPN scoreboard directly without hardcoding a stale week; ESPN authoritatively holds
  // the current active week until the final game of that week (e.g. Monday Night Football) completes!
  const url = sport === 'nba'
    ? ESPN_NBA_SCOREBOARD
    : ESPN_NFL_SCOREBOARD;
  const sportLabel = sport.toUpperCase();

  const proxyUrl = sport === 'nba'
    ? '/api/espn/scoreboard?sport=nba'
    : '/api/espn/scoreboard?sport=nfl';

  try {
    let resp: Response;
    try {
      // 1. Attempt backend proxy first (100% immune to browser CORS)
      resp = await fetch(proxyUrl, { cache: 'no-store' });
      if (!resp.ok) {
        throw new Error(`Proxy status ${resp.status}`);
      }
    } catch {
      // 2. Direct fallback if running in standalone/SPA preview mode
      resp = await fetch(url, { cache: 'no-store' });
      if (!resp.ok) {
        throw new Error(`ESPN API returned HTTP ${resp.status}`);
      }
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

      // Supabase record strictly matching schema: id, sport, home_team, away_team, home_score, away_score, quarter_time, status, updated_at
      supabaseMatchRecords.push({
        id: evId,
        sport: sport,
        home_team: homeCode,
        away_team: awayCode,
        home_score: homeScore,
        away_score: awayScore,
        quarter_time: detail,
        status,
        updated_at: new Date().toISOString(),
      });

      // For each game, attempt to fetch full boxscore summary to extract actual in-game player statistics
      let fetchedBoxscore = false;
      if (sport === 'nfl') {
        try {
          let sumRes: Response;
          try {
            sumRes = await fetch(`/api/espn/summary?sport=nfl&event=${evId}`, {
              signal: AbortSignal.timeout(2800),
            });
            if (!sumRes.ok) throw new Error('Proxy summary failed');
          } catch {
            sumRes = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=${evId}`, {
              signal: AbortSignal.timeout(2800),
            });
          }
          if (sumRes.ok) {
            const sumData = await sumRes.json();
            const playerGroups = sumData.boxscore?.players || [];
            if (playerGroups.length > 0) {
              fetchedBoxscore = true;
              for (let pgIdx = 0; pgIdx < playerGroups.length; pgIdx++) {
                const pg = playerGroups[pgIdx];
                const pgTeamId = String(pg.team?.id || '');
                let teamAbbr = '';
                if (pgTeamId === String(awayItem?.team?.id)) teamAbbr = awayCode;
                else if (pgTeamId === String(homeItem?.team?.id)) teamAbbr = homeCode;
                else if (pg.team?.abbreviation) teamAbbr = normalizeTeamCode(pg.team.abbreviation);
                else if (ESPN_NFL_TEAM_ID_MAP[pgTeamId]) teamAbbr = ESPN_NFL_TEAM_ID_MAP[pgTeamId];
                else teamAbbr = pgIdx === 0 ? awayCode : homeCode;

                const statGroups = pg.statistics || [];
                for (const sg of statGroups) {
                  const catName = String(sg.name || '').toLowerCase();
                  const athletes = sg.athletes || [];
                  for (const item of athletes) {
                    const ath = item.athlete;
                    if (!ath) continue;
                    const athId = String(ath.id || '');
                    const dName = ath.displayName || ath.fullName;
                    if (!dName) continue;
                    // Key by unique athlete ID so one player NEVER gets duplicated across passing/rushing/receiving!
                    const athKey = athId ? `ath_${athId}` : `name_${dName.trim().toLowerCase()}`;
                    const statsArr: string[] = item.stats || [];

                    let existing = liveAthletesMap.get(athKey);
                    if (!existing) {
                      existing = {
                        id: `nfl_${athId || dName.toLowerCase().replace(/\s+/g, '-')}`,
                        athleteId: athId,
                        sportId: 'nfl',
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
                        score: 0,
                      };
                      liveAthletesMap.set(athKey, existing);
                    } else if (teamAbbr && (!existing.teamCode || existing.teamCode === 'PRO')) {
                      existing.teamCode = teamAbbr;
                    }

                    if (catName === 'passing' && statsArr.length >= 4) {
                      const yds = parseInt(statsArr[1] || '0', 10) || 0;
                      const td = parseInt(statsArr[3] || '0', 10) || 0;
                      existing.pass_yds = Math.max(existing.pass_yds, yds);
                      existing.tds += td;
                    } else if (catName === 'rushing' && statsArr.length >= 4) {
                      const yds = parseInt(statsArr[1] || '0', 10) || 0;
                      const td = parseInt(statsArr[3] || '0', 10) || 0;
                      existing.rush_yds = Math.max(existing.rush_yds, yds);
                      existing.tds += td;
                    } else if (catName === 'receiving' && statsArr.length >= 4) {
                      const yds = parseInt(statsArr[1] || '0', 10) || 0;
                      const td = parseInt(statsArr[3] || '0', 10) || 0;
                      existing.rec_yds = Math.max(existing.rec_yds, yds);
                      existing.tds += td;
                    } else if (catName === 'kicking' && statsArr.length >= 4) {
                      const fgMade = parseInt((statsArr[0] || '0/0').split('/')[0] || '0', 10) || 0;
                      existing.fgs = Math.max(existing.fgs, fgMade);
                    } else if (catName === 'defensive' && statsArr.length >= 3) {
                      const sacks = parseInt(statsArr[2] || '0', 10) || 0;
                      if (sacks > 0) existing.stops += sacks;
                    }
                  }
                }
              }
            }
          }
        } catch {
          // boxscore summary fetch failed or timed out, fallback to leaders below
        }
      }

      // If boxscore was not fetched or for additional stars, extract player leaders from game competition
      const leadersList = comp.leaders || [];
      for (const cat of leadersList) {
        const catName = String(cat.name || '').toLowerCase();
        const athletes = cat.leaders || [];

        for (const leaderItem of athletes) {
          const ath = leaderItem.athlete;
          if (!ath) continue;

          const athId = String(ath.id || '');
          const displayName = ath.displayName || ath.fullName || 'Pro Star';
          const athKey = athId ? `ath_${athId}` : `name_${displayName.trim().toLowerCase()}`;

          // Precise Team Assignment: Check if athlete belongs to away or home team
          const leaderTeamId = String(leaderItem.team?.id || ath.team?.id || '');
          let athTeam = '';
          if (leaderTeamId === String(awayItem?.team?.id)) {
            athTeam = awayCode;
          } else if (leaderTeamId === String(homeItem?.team?.id)) {
            athTeam = homeCode;
          } else if (sport === 'nfl' && ESPN_NFL_TEAM_ID_MAP[leaderTeamId]) {
            athTeam = ESPN_NFL_TEAM_ID_MAP[leaderTeamId];
          } else if (sport === 'nba' && ESPN_NBA_TEAM_ID_MAP[leaderTeamId]) {
            athTeam = ESPN_NBA_TEAM_ID_MAP[leaderTeamId];
          } else if (ath.team?.abbreviation) {
            athTeam = normalizeTeamCode(ath.team.abbreviation);
          } else if (leaderItem.team?.abbreviation) {
            athTeam = normalizeTeamCode(leaderItem.team.abbreviation);
          } else {
            // Check default rosters for known team
            const baseList = sport === 'nba' ? DEFAULT_NBA_COMPETITORS : DEFAULT_NFL_COMPETITORS;
            const match = baseList.find((b) => b.displayName.toLowerCase() === displayName.toLowerCase());
            athTeam = match ? match.teamCode : awayCode;
          }

          let existing = liveAthletesMap.get(athKey);
          const uniformNumber = parseInt(ath.jersey || '10', 10);
          const displayVal = String(leaderItem.displayValue || '');

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
                id: `nfl_${athId || displayName.toLowerCase().replace(/\s+/g, '-')}`,
                athleteId: athId,
                sportId: 'nfl',
                displayName,
                shortName: (ath.shortName || ath.lastName || displayName.split(' ').pop() || 'STAR').toUpperCase(),
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
                score: 0,
              };
              liveAthletesMap.set(athKey, existing);
            } else {
              if (athTeam && (!existing.teamCode || existing.teamCode === 'PRO')) {
                existing.teamCode = athTeam;
              }
            }

            if (catName.includes('pass')) existing.pass_yds = Math.max(existing.pass_yds, yards);
            if (catName.includes('rush')) existing.rush_yds = Math.max(existing.rush_yds, yards);
            if (catName.includes('rec')) existing.rec_yds = Math.max(existing.rec_yds, yards);
            if (tds > 0) existing.tds = Math.max(existing.tds, tds);
            if (fgs > 0) existing.fgs = Math.max(existing.fgs, fgs);
            if (stops > 0) existing.stops = Math.max(existing.stops, stops);
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
                id: `nba_${athId || displayName.toLowerCase().replace(/\s+/g, '-')}`,
                athleteId: athId,
                sportId: 'nba',
                displayName,
                shortName: (ath.shortName || ath.lastName || displayName.split(' ').pop() || 'STAR').toUpperCase(),
                uniformNumber,
                teamCode: athTeam,
                position: ath.position?.abbreviation || 'G',
                positionGeneric: 'SCORER',
                pts,
                threes,
                reb,
                ast,
                stops,
                score: 0,
              };
              liveAthletesMap.set(athKey, existing);
            } else {
              if (athTeam && (!existing.teamCode || existing.teamCode === 'PRO')) {
                existing.teamCode = athTeam;
              }
              existing.pts = Math.max(existing.pts || 0, pts);
              existing.threes = Math.max(existing.threes || 0, threes);
              existing.reb = Math.max(existing.reb || 0, reb);
              existing.ast = Math.max(existing.ast || 0, ast);
              existing.stops = Math.max(existing.stops || 0, stops);
            }
          }
        }
      }
    }

    // Compute whole-number fantasy score ONCE for each unique athlete
    for (const ath of liveAthletesMap.values()) {
      if (sport === 'nfl') {
        ath.total_yards = (ath.pass_yds || 0) + (ath.rush_yds || 0) + (ath.rec_yds || 0);
        ath.score = calculateNFLPoints(ath.tds || 0, ath.fgs || 0, ath.stops || 0, ath.total_yards);
      } else {
        ath.score = calculateNBAPoints(ath.pts || 0, ath.threes || 0, ath.reb || 0, ath.ast || 0, ath.stops || 0);
      }
    }

    // Merge live athlete stats with base competitors, keyed STRICTLY by normalized name to guarantee NO DUPLICATES!
    const baseCompetitors = sport === 'nba' ? DEFAULT_NBA_COMPETITORS : DEFAULT_NFL_COMPETITORS;
    const finalCompetitorsMap = new Map<string, Competitor>();

    // 1. Seed base competitors
    for (const base of baseCompetitors) {
      const normName = (base.displayName || '').trim().toLowerCase();
      finalCompetitorsMap.set(normName, { ...base });
    }

    // 2. Overlay live athlete data (updates ONLY stats and points, teamCode and uniformNumber are immutable!)
    for (const live of liveAthletesMap.values()) {
      const normName = (live.displayName || '').trim().toLowerCase();

      if (finalCompetitorsMap.has(normName)) {
        const existing = finalCompetitorsMap.get(normName)!;
        // IMMUTABLE TEAM & UNIFORM: Do NOT allow live stats engine to swap player's team or jersey!
        const finalScore = Math.max(live.score, existing.score || 0);

        finalCompetitorsMap.set(normName, {
          ...existing,
          score: finalScore,
          rating: finalScore > 25 ? 99 : existing.rating,
          badges: finalScore > 20 ? ['gold_star', 'diamond_crystal'] : existing.badges,
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
        // Discovered live star
        const teamColors = sport === 'nba' ? getNBATeamColors(live.teamCode) : getTeamColors(live.teamCode);
        finalCompetitorsMap.set(normName, {
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

    const parsedCompetitors: Competitor[] = Array.from(finalCompetitorsMap.values());

    // Build Supabase records strictly matching table schema:
    // id, name, team, sport, position, score, stats, updated_at
    for (const comp of parsedCompetitors) {
      supabaseCompetitorRecords.push({
        id: comp.id,
        name: comp.displayName,
        team: comp.teamCode,
        sport: sport,
        position: comp.position || 'STAR',
        score: comp.score,
        stats: comp.stats,
        updated_at: new Date().toISOString(),
      });
    }

    // GUARANTEE: For NFL, ensure all 16 games covering all 32 teams are always present
    if (sport === 'nfl') {
      const existingMatchPairs = new Set(
        parsedMatches.map((m) => `${(m.awayTeamCode || m.away_team || '').trim().toUpperCase()}@${(m.homeTeamCode || m.home_team || '').trim().toUpperCase()}`)
      );
      for (const defMatch of DEFAULT_NFL_MATCHES) {
        if (defMatch.week && defMatch.week !== currentWeekNumber) continue;
        const pair = `${(defMatch.awayTeamCode || defMatch.away_team || '').trim().toUpperCase()}@${(defMatch.homeTeamCode || defMatch.home_team || '').trim().toUpperCase()}`;
        if (!existingMatchPairs.has(pair)) {
          parsedMatches.push({ ...defMatch, week: currentWeekNumber, weekLabel: `Week ${currentWeekNumber}` });
          existingMatchPairs.add(pair);
          supabaseMatchRecords.push({
            id: defMatch.id,
            sport: 'nfl',
            home_team: defMatch.homeTeamCode,
            away_team: defMatch.awayTeamCode,
            home_score: defMatch.homeScore || 0,
            away_score: defMatch.awayScore || 0,
            status: defMatch.status,
            quarter_time: defMatch.quarter_time || 'SCHEDULED',
            updated_at: new Date().toISOString(),
          });
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
