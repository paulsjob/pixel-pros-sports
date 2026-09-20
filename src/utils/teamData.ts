/**
 * Official NFL 32 Team Metadata & Formatting Helpers
 * Strictly authentic colors, full names, and game situation formatters.
 */

import { Competitor, Match, SportId } from '../types';
import { NFL_ROSTER_MANIFEST, validateTeamRoster } from '../data/nflRosterManifest';

export interface TeamMeta {
  code: string;
  name: string;
  helmetColor: string;
  jerseyColor: string;
  stripeColor: string;
}

export const NFL_TEAMS: Record<string, TeamMeta> = {
  ARI: { code: 'ARI', name: 'Arizona Cardinals', helmetColor: '#97233f', jerseyColor: '#97233f', stripeColor: '#ffffff' },
  ATL: { code: 'ATL', name: 'Atlanta Falcons', helmetColor: '#a71930', jerseyColor: '#000000', stripeColor: '#ffffff' },
  BAL: { code: 'BAL', name: 'Baltimore Ravens', helmetColor: '#241773', jerseyColor: '#241773', stripeColor: '#ffffff' },
  BUF: { code: 'BUF', name: 'Buffalo Bills', helmetColor: '#00338d', jerseyColor: '#00338d', stripeColor: '#c60c30' },
  CAR: { code: 'CAR', name: 'Carolina Panthers', helmetColor: '#0085ca', jerseyColor: '#0085ca', stripeColor: '#ffffff' },
  CHI: { code: 'CHI', name: 'Chicago Bears', helmetColor: '#0b162a', jerseyColor: '#0b162a', stripeColor: '#c83803' },
  CIN: { code: 'CIN', name: 'Cincinnati Bengals', helmetColor: '#fb4f14', jerseyColor: '#000000', stripeColor: '#ffffff' },
  CLE: { code: 'CLE', name: 'Cleveland Browns', helmetColor: '#ff3c00', jerseyColor: '#311d00', stripeColor: '#ffffff' },
  DAL: { code: 'DAL', name: 'Dallas Cowboys', helmetColor: '#041e42', jerseyColor: '#003594', stripeColor: '#ffffff' },
  DEN: { code: 'DEN', name: 'Denver Broncos', helmetColor: '#002244', jerseyColor: '#fb4f14', stripeColor: '#ffffff' },
  DET: { code: 'DET', name: 'Detroit Lions', helmetColor: '#0076b6', jerseyColor: '#0076b6', stripeColor: '#b0b7bc' },
  GB:  { code: 'GB',  name: 'Green Bay Packers', helmetColor: '#ffb612', jerseyColor: '#203731', stripeColor: '#ffffff' },
  HOU: { code: 'HOU', name: 'Houston Texans', helmetColor: '#03202f', jerseyColor: '#03202f', stripeColor: '#a71930' },
  IND: { code: 'IND', name: 'Indianapolis Colts', helmetColor: '#002c5f', jerseyColor: '#002c5f', stripeColor: '#ffffff' },
  JAX: { code: 'JAX', name: 'Jacksonville Jaguars', helmetColor: '#006778', jerseyColor: '#006778', stripeColor: '#d7a22a' },
  KC:  { code: 'KC',  name: 'Kansas City Chiefs', helmetColor: '#e31837', jerseyColor: '#e31837', stripeColor: '#ffb81c' },
  LAC: { code: 'LAC', name: 'Los Angeles Chargers', helmetColor: '#0080c6', jerseyColor: '#0080c6', stripeColor: '#ffc20e' },
  LAR: { code: 'LAR', name: 'Los Angeles Rams', helmetColor: '#003594', jerseyColor: '#003594', stripeColor: '#ffa300' },
  LV:  { code: 'LV',  name: 'Las Vegas Raiders', helmetColor: '#a5acaf', jerseyColor: '#000000', stripeColor: '#ffffff' },
  MIA: { code: 'MIA', name: 'Miami Dolphins', helmetColor: '#008e97', jerseyColor: '#008e97', stripeColor: '#fc4c02' },
  MIN: { code: 'MIN', name: 'Minnesota Vikings', helmetColor: '#4f2683', jerseyColor: '#4f2683', stripeColor: '#ffc62f' },
  NE:  { code: 'NE',  name: 'New England Patriots', helmetColor: '#002244', jerseyColor: '#002244', stripeColor: '#c60c30' },
  NO:  { code: 'NO',  name: 'New Orleans Saints', helmetColor: '#d3bc8d', jerseyColor: '#101820', stripeColor: '#d3bc8d' },
  NYG: { code: 'NYG', name: 'New York Giants', helmetColor: '#0b2265', jerseyColor: '#0b2265', stripeColor: '#a71930' },
  NYJ: { code: 'NYJ', name: 'New York Jets', helmetColor: '#125740', jerseyColor: '#125740', stripeColor: '#ffffff' },
  PHI: { code: 'PHI', name: 'Philadelphia Eagles', helmetColor: '#004c54', jerseyColor: '#004c54', stripeColor: '#a5acaf' },
  PIT: { code: 'PIT', name: 'Pittsburgh Steelers', helmetColor: '#101820', jerseyColor: '#101820', stripeColor: '#ffb612' },
  SEA: { code: 'SEA', name: 'Seattle Seahawks', helmetColor: '#002244', jerseyColor: '#002244', stripeColor: '#69be28' },
  SF:  { code: 'SF',  name: 'San Francisco 49ers', helmetColor: '#aa0000', jerseyColor: '#aa0000', stripeColor: '#b3995d' },
  TB:  { code: 'TB',  name: 'Tampa Bay Buccaneers', helmetColor: '#d50a0a', jerseyColor: '#d50a0a', stripeColor: '#34302b' },
  TEN: { code: 'TEN', name: 'Tennessee Titans', helmetColor: '#0c2340', jerseyColor: '#4b92db', stripeColor: '#c8102e' },
  WSH: { code: 'WSH', name: 'Washington Commanders', helmetColor: '#5a1414', jerseyColor: '#5a1414', stripeColor: '#ffb612' },
};

export function normalizeTeamCode(code?: string): string {
  if (!code) return 'NFL';
  const c = code.trim().toUpperCase();
  const aliasMap: Record<string, string> = {
    WSH: 'WAS',
    JAC: 'JAX',
    LAR: 'LA',
  };
  return aliasMap[c] || c;
}

export function getTeamFullName(teamCode?: string): string {
  if (!teamCode) return 'NFL';
  const clean = teamCode.trim().toUpperCase();
  return NFL_TEAMS[clean]?.name || clean;
}

export function getTeamColors(teamCode?: string): { helmet: string; jersey: string; stripe: string } {
  if (!teamCode) return { helmet: '#12579b', jersey: '#12579b', stripe: '#ffffff' };
  const clean = teamCode.trim().toUpperCase();
  const found = NFL_TEAMS[clean];
  if (found) {
    return {
      helmet: found.helmetColor,
      jersey: found.jerseyColor,
      stripe: found.stripeColor,
    };
  }
  return { helmet: '#12579b', jersey: '#12579b', stripe: '#ffffff' };
}

// Known superstar uniform numbers
const KNOWN_NUMBERS: Record<string, number> = {
  'josh allen': 17,
  'patrick mahomes': 15,
  'derrick henry': 22,
  'ceedee lamb': 88,
  'saquon barkley': 26,
  'jalen hurts': 1,
  'justin jefferson': 18,
  'christian mccaffrey': 23,
  'trevor lawrence': 16,
  'lamar jackson': 8,
  'travis kelce': 87,
  'rashee rice': 4,
  'tyler shough': 12,
  'c.j. stroud': 7,
  'joe burrow': 9,
  'baker mayfield': 6,
  'drake maye': 10,
  'jahmyr gibbs': 26,
  'drew lock': 2,
  'amon-ra st. brown': 14,
  'jayden daniels': 5,
  'stefon diggs': 1,
  'caleb williams': 18,
  'dj moore': 2,
  'dallas goedert': 88,
  'cam ward': 1,
  'tony pollard': 20,
  'calvin ridley': 0,
  'will levis': 8,
  'tyjae spears': 2,
  'elic ayomanor': 5,
  'a.j. brown': 11,
  'devonta smith': 6,
  'jahan dotson': 4,
  'kenneth gainwell': 14,
  'julius chestnut': 36,
  'daniel bellinger': 82,
  'chimere dike': 17,
  'mitchell trubisky': 10,
};

export function getUniformNumber(name?: string, id?: string): number {
  if (name) {
    const key = name.trim().toLowerCase();
    if (KNOWN_NUMBERS[key]) return KNOWN_NUMBERS[key];
  }
  if (id) {
    const numPart = id.replace(/\D/g, '');
    if (numPart) {
      const val = parseInt(numPart.slice(-2), 10);
      return val > 0 && val <= 99 ? val : 11;
    }
  }
  return 10;
}

export interface FormattedGameSituation {
  statusLine: string;
  scoreLine: string;
  singleLine: string;
  isLive: boolean;
  isFinal: boolean;
}

/**
 * Formats game situation compactly for mobile cards to prevent any score truncation
 */
export function formatRealtimeGameSituationCompact(match: {
  quarter_time?: string;
  quarterTime?: string;
  periodLabel?: string;
  away_team?: string;
  awayTeamCode?: string;
  home_team?: string;
  homeTeamCode?: string;
  away_score?: number;
  awayScore?: number;
  home_score?: number;
  homeScore?: number;
  status?: string;
}): FormattedGameSituation {
  const away = (match.away_team || match.awayTeamCode || '').trim().toUpperCase();
  const home = (match.home_team || match.homeTeamCode || '').trim().toUpperCase();
  const aScore = match.away_score ?? match.awayScore ?? 0;
  const hScore = match.home_score ?? match.homeScore ?? 0;
  const rawTime = (match.quarter_time || match.quarterTime || match.periodLabel || '').trim();
  const status = (match.status || '').toLowerCase();

  const isUpcoming = status === 'upcoming' || status === 'scheduled' || status === 'pre';
  const isFinal = !isUpcoming && (status === 'final' || rawTime.toLowerCase().includes('final'));

  const isLive =
    !isUpcoming &&
    !isFinal &&
    (status === 'live' ||
      /\b(q[1-4]|ot|half|halftime|overtime)\b/i.test(rawTime) ||
      /\b(1st|2nd|3rd|4th)\s*(q|quarter|qtr)\b/i.test(rawTime));

  let statusLine = 'LIVE';
  let scoreLine = `${away} ${aScore}-${hScore}`;

  if (isFinal) {
    statusLine = 'FINAL';
    scoreLine = `${away} ${aScore}-${hScore}`;
  } else if (isLive) {
    let qLabel = 'LIVE';
    if (rawTime.includes('1st') || rawTime.includes('Q1')) qLabel = 'Q1';
    else if (rawTime.includes('2nd') || rawTime.includes('Q2')) qLabel = 'Q2';
    else if (rawTime.includes('3rd') || rawTime.includes('Q3')) qLabel = 'Q3';
    else if (rawTime.includes('4th') || rawTime.includes('Q4')) qLabel = 'Q4';
    else if (rawTime.toLowerCase().includes('half')) qLabel = 'HALF';
    else if (rawTime.includes('OT')) qLabel = 'OT';
    else if (rawTime && !rawTime.toLowerCase().includes('live')) qLabel = rawTime;

    statusLine = `🔴 ${qLabel}`;
    scoreLine = `${away} ${aScore}-${hScore}`;
  } else {
    // Scheduled / upcoming e.g. SUN 4:25P · WSH @ PHI
    let kickoff = rawTime || 'SUN 4:25P';
    kickoff = kickoff.replace(/\s*PM/i, 'P').replace(/\s*AM/i, 'A');
    statusLine = kickoff;
    scoreLine = `${away} @ ${home}`;
  }

  const singleLine = `${statusLine} · ${scoreLine}`;

  return { statusLine, scoreLine, singleLine, isLive, isFinal };
}

/**
 * Renders real-time game situation string strictly according to spec:
 * `{match.quarter_time} · {match.away_team} {match.away_score} - {match.home_team} {match.home_score}`
 */
export function formatRealtimeGameSituation(
  match: {
    quarter_time?: string;
    quarterTime?: string;
    periodLabel?: string;
    away_team?: string;
    awayTeamCode?: string;
    home_team?: string;
    homeTeamCode?: string;
    away_score?: number;
    awayScore?: number;
    home_score?: number;
    homeScore?: number;
    status?: string;
  }
): string {
  const compact = formatRealtimeGameSituationCompact(match);
  return compact.singleLine;
}

/**
 * Master Manifest Competitor Builder:
 * Converts the locked 32-team Starter Manifest into immutable Competitors.
 * Strictly guarantees every NFL team has:
 * - >= 1 QB
 * - >= 2 RBs
 * - >= 2 WRs
 * - >= 1 TE
 */
export function buildManifestCompetitors(): Competitor[] {
  const list: Competitor[] = [];
  const registeredIds = new Set<string>();

  for (const [teamCode, athletes] of Object.entries(NFL_ROSTER_MANIFEST)) {
    // Hard runtime assertion: throws if any team violates the Core Starter Quota
    validateTeamRoster(teamCode, athletes);

    const teamFullName = getTeamFullName(teamCode);
    const colors = getTeamColors(teamCode);

    for (const ath of athletes) {
      const compId = `nfl_${ath.athleteId}`;
      if (registeredIds.has(compId)) {
        console.warn(`[Manifest] Duplicate athleteId ignored: ${compId} (${ath.displayName})`);
        continue;
      }
      registeredIds.add(compId);

      const isPlaymaker = ath.position === 'QB';
      const isScorer = ath.position === 'WR' || ath.position === 'K';
      const posGeneric = isPlaymaker ? 'PLAYMAKER' : isScorer ? 'SCORER' : 'OFFENSE';

      list.push({
        id: compId,
        athleteId: ath.athleteId,
        sportId: 'nfl',
        displayName: ath.displayName,
        shortName: ath.shortName,
        uniformNumber: ath.uniformNumber,
        teamName: teamFullName,
        teamCode: teamCode,
        positionGeneric: posGeneric,
        position: ath.position,
        rating: 90,
        score: 0,
        stats: {
          pass_yds: 0,
          rush_yds: 0,
          rec_yds: 0,
          tds: 0,
          fgs: 0,
          stops: 0,
          total_yards: 0,
          primaryMetricLabel: 'Touchdowns',
          primaryMetricValue: 0,
        },
        badges: ['gold_star'],
        avatar: {
          helmetColor: colors.helmet,
          jerseyColor: colors.jersey,
          stripeColor: colors.stripe,
          skinTone: ath.skinTone || '#e0ac69',
          number: ath.uniformNumber,
        },
      });
    }
  }

  return list;
}

const RAW_KNOWN_COMPETITORS: Competitor[] = [];

function initializeDefaultNFLCompetitors(): Competitor[] {
  return buildManifestCompetitors();
}

export const DEFAULT_NFL_COMPETITORS: Competitor[] = initializeDefaultNFLCompetitors();

export const DEFAULT_NFL_MATCHES: Match[] = [
  // -------------------------------------------------------------
  // WEEK 3 SLATE (16 Real ESPN Matchups covering all 32 NFL Teams)
  // -------------------------------------------------------------
  {
    id: 'espn-401872948',
    sportId: 'nfl',
    homeTeam: 'Green Bay Packers',
    awayTeam: 'Atlanta Falcons',
    homeTeamCode: 'GB',
    awayTeamCode: 'ATL',
    home_team: 'GB',
    away_team: 'ATL',
    homeScore: 0,
    awayScore: 0,
    home_score: 0,
    away_score: 0,
    quarter_time: 'Thu 8:15 PM',
    quarterTime: 'Thu 8:15 PM',
    periodLabel: 'Thu 8:15 PM',
    status: 'upcoming',
    week: 3,
    weekLabel: 'Week 3',
    gameDate: '2026-09-25T00:15Z',
  },
  {
    id: 'espn-401872953',
    sportId: 'nfl',
    homeTeam: 'Buffalo Bills',
    awayTeam: 'Los Angeles Chargers',
    homeTeamCode: 'BUF',
    awayTeamCode: 'LAC',
    home_team: 'BUF',
    away_team: 'LAC',
    homeScore: 0,
    awayScore: 0,
    home_score: 0,
    away_score: 0,
    quarter_time: 'Sun 1:00 PM',
    quarterTime: 'Sun 1:00 PM',
    periodLabel: 'Sun 1:00 PM',
    status: 'upcoming',
    week: 3,
    weekLabel: 'Week 3',
    gameDate: '2026-09-27T17:00Z',
  },
  {
    id: 'espn-401872949',
    sportId: 'nfl',
    homeTeam: 'Cleveland Browns',
    awayTeam: 'Carolina Panthers',
    homeTeamCode: 'CLE',
    awayTeamCode: 'CAR',
    home_team: 'CLE',
    away_team: 'CAR',
    homeScore: 0,
    awayScore: 0,
    home_score: 0,
    away_score: 0,
    quarter_time: 'Sun 1:00 PM',
    quarterTime: 'Sun 1:00 PM',
    periodLabel: 'Sun 1:00 PM',
    status: 'upcoming',
    week: 3,
    weekLabel: 'Week 3',
    gameDate: '2026-09-27T17:00Z',
  },
  {
    id: 'espn-401872954',
    sportId: 'nfl',
    homeTeam: 'Detroit Lions',
    awayTeam: 'New York Jets',
    homeTeamCode: 'DET',
    awayTeamCode: 'NYJ',
    home_team: 'DET',
    away_team: 'NYJ',
    homeScore: 0,
    awayScore: 0,
    home_score: 0,
    away_score: 0,
    quarter_time: 'Sun 1:00 PM',
    quarterTime: 'Sun 1:00 PM',
    periodLabel: 'Sun 1:00 PM',
    status: 'upcoming',
    week: 3,
    weekLabel: 'Week 3',
    gameDate: '2026-09-27T17:00Z',
  },
  {
    id: 'espn-401872951',
    sportId: 'nfl',
    homeTeam: 'Indianapolis Colts',
    awayTeam: 'Houston Texans',
    homeTeamCode: 'IND',
    awayTeamCode: 'HOU',
    home_team: 'IND',
    away_team: 'HOU',
    homeScore: 0,
    awayScore: 0,
    home_score: 0,
    away_score: 0,
    quarter_time: 'Sun 1:00 PM',
    quarterTime: 'Sun 1:00 PM',
    periodLabel: 'Sun 1:00 PM',
    status: 'upcoming',
    week: 3,
    weekLabel: 'Week 3',
    gameDate: '2026-09-27T17:00Z',
  },
  {
    id: 'espn-401872952',
    sportId: 'nfl',
    homeTeam: 'Miami Dolphins',
    awayTeam: 'Kansas City Chiefs',
    homeTeamCode: 'MIA',
    awayTeamCode: 'KC',
    home_team: 'MIA',
    away_team: 'KC',
    homeScore: 0,
    awayScore: 0,
    home_score: 0,
    away_score: 0,
    quarter_time: 'Sun 1:00 PM',
    quarterTime: 'Sun 1:00 PM',
    periodLabel: 'Sun 1:00 PM',
    status: 'upcoming',
    week: 3,
    weekLabel: 'Week 3',
    gameDate: '2026-09-27T17:00Z',
  },
  {
    id: 'espn-401872956',
    sportId: 'nfl',
    homeTeam: 'New York Giants',
    awayTeam: 'Tennessee Titans',
    homeTeamCode: 'NYG',
    awayTeamCode: 'TEN',
    home_team: 'NYG',
    away_team: 'TEN',
    homeScore: 0,
    awayScore: 0,
    home_score: 0,
    away_score: 0,
    quarter_time: 'Sun 1:00 PM',
    quarterTime: 'Sun 1:00 PM',
    periodLabel: 'Sun 1:00 PM',
    status: 'upcoming',
    week: 3,
    weekLabel: 'Week 3',
    gameDate: '2026-09-27T17:00Z',
  },
  {
    id: 'espn-401872950',
    sportId: 'nfl',
    homeTeam: 'Pittsburgh Steelers',
    awayTeam: 'Cincinnati Bengals',
    homeTeamCode: 'PIT',
    awayTeamCode: 'CIN',
    home_team: 'PIT',
    away_team: 'CIN',
    homeScore: 0,
    awayScore: 0,
    home_score: 0,
    away_score: 0,
    quarter_time: 'Sun 1:00 PM',
    quarterTime: 'Sun 1:00 PM',
    periodLabel: 'Sun 1:00 PM',
    status: 'upcoming',
    week: 3,
    weekLabel: 'Week 3',
    gameDate: '2026-09-27T17:00Z',
  },
  {
    id: 'espn-401872955',
    sportId: 'nfl',
    homeTeam: 'Washington Commanders',
    awayTeam: 'Seattle Seahawks',
    homeTeamCode: 'WSH',
    awayTeamCode: 'SEA',
    home_team: 'WSH',
    away_team: 'SEA',
    homeScore: 0,
    awayScore: 0,
    home_score: 0,
    away_score: 0,
    quarter_time: 'Sun 1:00 PM',
    quarterTime: 'Sun 1:00 PM',
    periodLabel: 'Sun 1:00 PM',
    status: 'upcoming',
    week: 3,
    weekLabel: 'Week 3',
    gameDate: '2026-09-27T17:00Z',
  },
  {
    id: 'espn-401872957',
    sportId: 'nfl',
    homeTeam: 'Jacksonville Jaguars',
    awayTeam: 'New England Patriots',
    homeTeamCode: 'JAX',
    awayTeamCode: 'NE',
    home_team: 'JAX',
    away_team: 'NE',
    homeScore: 0,
    awayScore: 0,
    home_score: 0,
    away_score: 0,
    quarter_time: 'Sun 1:00 PM',
    quarterTime: 'Sun 1:00 PM',
    periodLabel: 'Sun 1:00 PM',
    status: 'upcoming',
    week: 3,
    weekLabel: 'Week 3',
    gameDate: '2026-09-27T17:00Z',
  },
  {
    id: 'espn-401872958',
    sportId: 'nfl',
    homeTeam: 'San Francisco 49ers',
    awayTeam: 'Arizona Cardinals',
    homeTeamCode: 'SF',
    awayTeamCode: 'ARI',
    home_team: 'SF',
    away_team: 'ARI',
    homeScore: 0,
    awayScore: 0,
    home_score: 0,
    away_score: 0,
    quarter_time: 'Sun 4:05 PM',
    quarterTime: 'Sun 4:05 PM',
    periodLabel: 'Sun 4:05 PM',
    status: 'upcoming',
    week: 3,
    weekLabel: 'Week 3',
    gameDate: '2026-09-27T20:05Z',
  },
  {
    id: 'espn-401872959',
    sportId: 'nfl',
    homeTeam: 'Tampa Bay Buccaneers',
    awayTeam: 'Minnesota Vikings',
    homeTeamCode: 'TB',
    awayTeamCode: 'MIN',
    home_team: 'TB',
    away_team: 'MIN',
    homeScore: 0,
    awayScore: 0,
    home_score: 0,
    away_score: 0,
    quarter_time: 'Sun 4:05 PM',
    quarterTime: 'Sun 4:05 PM',
    periodLabel: 'Sun 4:05 PM',
    status: 'upcoming',
    week: 3,
    weekLabel: 'Week 3',
    gameDate: '2026-09-27T20:05Z',
  },
  {
    id: 'espn-401872960',
    sportId: 'nfl',
    homeTeam: 'Dallas Cowboys',
    awayTeam: 'Baltimore Ravens',
    homeTeamCode: 'DAL',
    awayTeamCode: 'BAL',
    home_team: 'DAL',
    away_team: 'BAL',
    homeScore: 0,
    awayScore: 0,
    home_score: 0,
    away_score: 0,
    quarter_time: 'Sun 4:25 PM',
    quarterTime: 'Sun 4:25 PM',
    periodLabel: 'Sun 4:25 PM',
    status: 'upcoming',
    week: 3,
    weekLabel: 'Week 3',
    gameDate: '2026-09-27T20:25Z',
  },
  {
    id: 'espn-401872961',
    sportId: 'nfl',
    homeTeam: 'New Orleans Saints',
    awayTeam: 'Las Vegas Raiders',
    homeTeamCode: 'NO',
    awayTeamCode: 'LV',
    home_team: 'NO',
    away_team: 'LV',
    homeScore: 0,
    awayScore: 0,
    home_score: 0,
    away_score: 0,
    quarter_time: 'Sun 4:25 PM',
    quarterTime: 'Sun 4:25 PM',
    periodLabel: 'Sun 4:25 PM',
    status: 'upcoming',
    week: 3,
    weekLabel: 'Week 3',
    gameDate: '2026-09-27T20:25Z',
  },
  {
    id: 'espn-401872962',
    sportId: 'nfl',
    homeTeam: 'Denver Broncos',
    awayTeam: 'Los Angeles Rams',
    homeTeamCode: 'DEN',
    awayTeamCode: 'LAR',
    home_team: 'DEN',
    away_team: 'LAR',
    homeScore: 0,
    awayScore: 0,
    home_score: 0,
    away_score: 0,
    quarter_time: 'Sun 8:20 PM',
    quarterTime: 'Sun 8:20 PM',
    periodLabel: 'Sun 8:20 PM',
    status: 'upcoming',
    week: 3,
    weekLabel: 'Week 3',
    gameDate: '2026-09-28T00:20Z',
  },
  {
    id: 'espn-401872963',
    sportId: 'nfl',
    homeTeam: 'Chicago Bears',
    awayTeam: 'Philadelphia Eagles',
    homeTeamCode: 'CHI',
    awayTeamCode: 'PHI',
    home_team: 'CHI',
    away_team: 'PHI',
    homeScore: 0,
    awayScore: 0,
    home_score: 0,
    away_score: 0,
    quarter_time: 'Mon 8:15 PM',
    quarterTime: 'Mon 8:15 PM',
    periodLabel: 'Mon 8:15 PM',
    status: 'upcoming',
    week: 3,
    weekLabel: 'Week 3',
    gameDate: '2026-09-29T00:15Z',
  },

  // -------------------------------------------------------------
  // WEEK 2 SLATE (16 Matchups)
  // -------------------------------------------------------------
  {
    id: 'espn-401872932',
    sportId: 'nfl',
    homeTeam: 'Buffalo Bills',
    awayTeam: 'Detroit Lions',
    homeTeamCode: 'BUF',
    awayTeamCode: 'DET',
    home_team: 'BUF',
    away_team: 'DET',
    homeScore: 0,
    awayScore: 0,
    home_score: 0,
    away_score: 0,
    quarter_time: '1st Quarter',
    quarterTime: '1st Quarter',
    periodLabel: '🔴 LIVE (1st Qtr)',
    status: 'live',
    week: 2,
    weekLabel: 'Week 2',
    gameDate: '2026-09-18T00:15Z',
  },
  {
    id: 'espn-401872933',
    sportId: 'nfl',
    homeTeam: 'Atlanta Falcons',
    awayTeam: 'Carolina Panthers',
    homeTeamCode: 'ATL',
    awayTeamCode: 'CAR',
    home_team: 'ATL',
    away_team: 'CAR',
    homeScore: 0,
    awayScore: 0,
    home_score: 0,
    away_score: 0,
    quarter_time: 'Sun 1:00 PM',
    quarterTime: 'Sun 1:00 PM',
    periodLabel: 'Sun 1:00 PM',
    status: 'upcoming',
    week: 2,
    weekLabel: 'Week 2',
    gameDate: '2026-09-20T17:00Z',
  },
  {
    id: 'espn-401872937',
    sportId: 'nfl',
    homeTeam: 'Chicago Bears',
    awayTeam: 'Minnesota Vikings',
    homeTeamCode: 'CHI',
    awayTeamCode: 'MIN',
    home_team: 'CHI',
    away_team: 'MIN',
    homeScore: 0,
    awayScore: 0,
    home_score: 0,
    away_score: 0,
    quarter_time: 'Sun 1:00 PM',
    quarterTime: 'Sun 1:00 PM',
    periodLabel: 'Sun 1:00 PM',
    status: 'upcoming',
    week: 2,
    weekLabel: 'Week 2',
    gameDate: '2026-09-20T17:00Z',
  },
  {
    id: 'espn-401872939',
    sportId: 'nfl',
    homeTeam: 'Tennessee Titans',
    awayTeam: 'Philadelphia Eagles',
    homeTeamCode: 'TEN',
    awayTeamCode: 'PHI',
    home_team: 'TEN',
    away_team: 'PHI',
    homeScore: 0,
    awayScore: 0,
    home_score: 0,
    away_score: 0,
    quarter_time: 'Sun 1:00 PM',
    quarterTime: 'Sun 1:00 PM',
    periodLabel: 'Sun 1:00 PM',
    status: 'upcoming',
    week: 2,
    weekLabel: 'Week 2',
    gameDate: '2026-09-20T17:00Z',
  },
  {
    id: 'espn-401872946',
    sportId: 'nfl',
    homeTeam: 'New England Patriots',
    awayTeam: 'Pittsburgh Steelers',
    homeTeamCode: 'NE',
    awayTeamCode: 'PIT',
    home_team: 'NE',
    away_team: 'PIT',
    homeScore: 0,
    awayScore: 0,
    home_score: 0,
    away_score: 0,
    quarter_time: 'Sun 1:00 PM',
    quarterTime: 'Sun 1:00 PM',
    periodLabel: 'Sun 1:00 PM',
    status: 'upcoming',
    week: 2,
    weekLabel: 'Week 2',
    gameDate: '2026-09-20T17:00Z',
  },
  {
    id: 'espn-401872936',
    sportId: 'nfl',
    homeTeam: 'New York Jets',
    awayTeam: 'Green Bay Packers',
    homeTeamCode: 'NYJ',
    awayTeamCode: 'GB',
    home_team: 'NYJ',
    away_team: 'GB',
    homeScore: 0,
    awayScore: 0,
    home_score: 0,
    away_score: 0,
    quarter_time: 'Sun 1:00 PM',
    quarterTime: 'Sun 1:00 PM',
    periodLabel: 'Sun 1:00 PM',
    status: 'upcoming',
    week: 2,
    weekLabel: 'Week 2',
    gameDate: '2026-09-20T17:00Z',
  },
  {
    id: 'espn-401872935',
    sportId: 'nfl',
    homeTeam: 'Tampa Bay Buccaneers',
    awayTeam: 'Cleveland Browns',
    homeTeamCode: 'TB',
    awayTeamCode: 'CLE',
    home_team: 'TB',
    away_team: 'CLE',
    homeScore: 0,
    awayScore: 0,
    home_score: 0,
    away_score: 0,
    quarter_time: 'Sun 1:00 PM',
    quarterTime: 'Sun 1:00 PM',
    periodLabel: 'Sun 1:00 PM',
    status: 'upcoming',
    week: 2,
    weekLabel: 'Week 2',
    gameDate: '2026-09-20T17:00Z',
  },
  {
    id: 'espn-401872938',
    sportId: 'nfl',
    homeTeam: 'Baltimore Ravens',
    awayTeam: 'New Orleans Saints',
    homeTeamCode: 'BAL',
    awayTeamCode: 'NO',
    home_team: 'BAL',
    away_team: 'NO',
    homeScore: 0,
    awayScore: 0,
    home_score: 0,
    away_score: 0,
    quarter_time: 'Sun 1:00 PM',
    quarterTime: 'Sun 1:00 PM',
    periodLabel: 'Sun 1:00 PM',
    status: 'upcoming',
    week: 2,
    weekLabel: 'Week 2',
    gameDate: '2026-09-20T17:00Z',
  },
  {
    id: 'espn-401872934',
    sportId: 'nfl',
    homeTeam: 'Houston Texans',
    awayTeam: 'Cincinnati Bengals',
    homeTeamCode: 'HOU',
    awayTeamCode: 'CIN',
    home_team: 'HOU',
    away_team: 'CIN',
    homeScore: 0,
    awayScore: 0,
    home_score: 0,
    away_score: 0,
    quarter_time: 'Sun 1:00 PM',
    quarterTime: 'Sun 1:00 PM',
    periodLabel: 'Sun 1:00 PM',
    status: 'upcoming',
    week: 2,
    weekLabel: 'Week 2',
    gameDate: '2026-09-20T17:00Z',
  },
  {
    id: 'espn-401872940',
    sportId: 'nfl',
    homeTeam: 'Denver Broncos',
    awayTeam: 'Jacksonville Jaguars',
    homeTeamCode: 'DEN',
    awayTeamCode: 'JAX',
    home_team: 'DEN',
    away_team: 'JAX',
    homeScore: 0,
    awayScore: 0,
    home_score: 0,
    away_score: 0,
    quarter_time: 'Sun 4:05 PM',
    quarterTime: 'Sun 4:05 PM',
    periodLabel: 'Sun 4:05 PM',
    status: 'upcoming',
    week: 2,
    weekLabel: 'Week 2',
    gameDate: '2026-09-20T20:05Z',
  },
  {
    id: 'espn-401872941',
    sportId: 'nfl',
    homeTeam: 'Los Angeles Chargers',
    awayTeam: 'Las Vegas Raiders',
    homeTeamCode: 'LAC',
    awayTeamCode: 'LV',
    home_team: 'LAC',
    away_team: 'LV',
    homeScore: 0,
    awayScore: 0,
    home_score: 0,
    away_score: 0,
    quarter_time: 'Sun 4:05 PM',
    quarterTime: 'Sun 4:05 PM',
    periodLabel: 'Sun 4:05 PM',
    status: 'upcoming',
    week: 2,
    weekLabel: 'Week 2',
    gameDate: '2026-09-20T20:05Z',
  },
  {
    id: 'espn-401872944',
    sportId: 'nfl',
    homeTeam: 'Dallas Cowboys',
    awayTeam: 'Washington Commanders',
    homeTeamCode: 'DAL',
    awayTeamCode: 'WSH',
    home_team: 'DAL',
    away_team: 'WSH',
    homeScore: 0,
    awayScore: 0,
    home_score: 0,
    away_score: 0,
    quarter_time: 'Sun 4:25 PM',
    quarterTime: 'Sun 4:25 PM',
    periodLabel: 'Sun 4:25 PM',
    status: 'upcoming',
    week: 2,
    weekLabel: 'Week 2',
    gameDate: '2026-09-20T20:25Z',
  },
  {
    id: 'espn-401872943',
    sportId: 'nfl',
    homeTeam: 'Arizona Cardinals',
    awayTeam: 'Seattle Seahawks',
    homeTeamCode: 'ARI',
    awayTeamCode: 'SEA',
    home_team: 'ARI',
    away_team: 'SEA',
    homeScore: 0,
    awayScore: 0,
    home_score: 0,
    away_score: 0,
    quarter_time: 'Sun 4:25 PM',
    quarterTime: 'Sun 4:25 PM',
    periodLabel: 'Sun 4:25 PM',
    status: 'upcoming',
    week: 2,
    weekLabel: 'Week 2',
    gameDate: '2026-09-20T20:25Z',
  },
  {
    id: 'espn-401872942',
    sportId: 'nfl',
    homeTeam: 'San Francisco 49ers',
    awayTeam: 'Miami Dolphins',
    homeTeamCode: 'SF',
    awayTeamCode: 'MIA',
    home_team: 'SF',
    away_team: 'MIA',
    homeScore: 0,
    awayScore: 0,
    home_score: 0,
    away_score: 0,
    quarter_time: 'Sun 4:25 PM',
    quarterTime: 'Sun 4:25 PM',
    periodLabel: 'Sun 4:25 PM',
    status: 'upcoming',
    week: 2,
    weekLabel: 'Week 2',
    gameDate: '2026-09-20T20:25Z',
  },
  {
    id: 'espn-401872945',
    sportId: 'nfl',
    homeTeam: 'Kansas City Chiefs',
    awayTeam: 'Indianapolis Colts',
    homeTeamCode: 'KC',
    awayTeamCode: 'IND',
    home_team: 'KC',
    away_team: 'IND',
    homeScore: 0,
    awayScore: 0,
    home_score: 0,
    away_score: 0,
    quarter_time: 'Sun 8:20 PM',
    quarterTime: 'Sun 8:20 PM',
    periodLabel: 'Sun 8:20 PM',
    status: 'upcoming',
    week: 2,
    weekLabel: 'Week 2',
    gameDate: '2026-09-21T00:20Z',
  },
  {
    id: 'espn-401872947',
    sportId: 'nfl',
    homeTeam: 'Los Angeles Rams',
    awayTeam: 'New York Giants',
    homeTeamCode: 'LAR',
    awayTeamCode: 'NYG',
    home_team: 'LAR',
    away_team: 'NYG',
    homeScore: 0,
    awayScore: 0,
    home_score: 0,
    away_score: 0,
    quarter_time: 'Mon 8:15 PM',
    quarterTime: 'Mon 8:15 PM',
    periodLabel: 'Mon 8:15 PM',
    status: 'upcoming',
    week: 2,
    weekLabel: 'Week 2',
    gameDate: '2026-09-22T00:15Z',
  },
];

export type PlayerGameState = 'pre' | 'in' | 'post';

export interface PlayerScoringInfo {
  gameState: PlayerGameState;
  activeScore: number;
  activeStatsLine: string;
  historicalScore: number;
  historicalStats: string;
  hasHistoricalData: boolean;
  contextBadgeText: string;
  isLive: boolean;
  isFinal: boolean;
}

export function getPlayerGameState(match: Match | null | undefined): PlayerGameState {
  if (!match) return 'pre';
  const rawStatus = (match.status || '').toLowerCase();
  const rawState = ((match as any).status?.type?.state || '').toLowerCase();
  const qTime = (match.quarterTime || match.quarter_time || match.periodLabel || '').toLowerCase();

  if (rawStatus === 'upcoming' || rawStatus === 'scheduled' || rawState === 'pre') {
    return 'pre';
  }

  if (rawStatus === 'final' || rawState === 'post' || /\bfinal\b/i.test(qTime)) {
    return 'post';
  }

  if (
    rawStatus === 'live' ||
    rawState === 'in' ||
    /\b(q[1-4]|ot|half|halftime|overtime)\b/i.test(qTime) ||
    /\b(1st|2nd|3rd|4th)\s*(q|quarter|qtr)\b/i.test(qTime)
  ) {
    return 'in';
  }
  return 'pre';
}

export function getPlayerScoringDisplay(
  player: Competitor,
  match: Match | null | undefined,
  sport: SportId = 'nfl'
): PlayerScoringInfo {
  const gameState = getPlayerGameState(match);

  // NBA baseline stats
  const threePm = Number(player.stats?.three_pm ?? player.stats?.threes ?? 0);
  const reb = Number(player.stats?.reb ?? player.stats?.rebounds ?? 0);
  const ast = Number(player.stats?.ast ?? player.stats?.assists ?? 0);

  // NFL baseline stats
  const passYds = Number(player.stats?.pass_yds ?? player.stats?.passing_yards ?? player.stats?.passingYards ?? 0);
  const rushYds = Number(player.stats?.rush_yds ?? player.stats?.rushing_yards ?? player.stats?.rushingYards ?? 0);
  const recYds = Number(player.stats?.rec_yds ?? player.stats?.receiving_yards ?? player.stats?.receivingYards ?? 0);
  const totalYds = passYds + rushYds + recYds;
  const tds = Number(player.stats?.tds ?? player.stats?.touchdowns ?? 0);

  const fullStatsLine = sport === 'nba'
    ? `${threePm} 3PM · ${reb} REB · ${ast} AST`
    : (tds > 0 || totalYds > 0)
    ? `${tds} TD · ${totalYds} YDS`
    : '0 TD · 0 YDS';

  const historicalScore = player.last_game_score ?? player.lastGameScore ?? player.score ?? 0;
  const historicalStats = player.last_game_stats ?? player.lastGameStats ?? fullStatsLine;

  const contextText = match
    ? (match.quarter_time || match.quarterTime || match.periodLabel || 'SUN 1:00 PM ET')
    : 'SCHEDULED';

  if (gameState === 'pre') {
    return {
      gameState: 'pre',
      activeScore: 0,
      activeStatsLine: sport === 'nba' ? '0 3PM · 0 REB · 0 AST' : '0 TD · 0 YDS',
      historicalScore,
      historicalStats,
      hasHistoricalData: historicalScore > 0,
      contextBadgeText: contextText,
      isLive: false,
      isFinal: false,
    };
  }

  if (gameState === 'in') {
    return {
      gameState: 'in',
      activeScore: player.score || 0,
      activeStatsLine: fullStatsLine,
      historicalScore,
      historicalStats,
      hasHistoricalData: true,
      contextBadgeText: contextText.toLowerCase().includes('live') || contextText.includes('Q') ? contextText : `LIVE · ${contextText}`,
      isLive: true,
      isFinal: false,
    };
  }

  // 'post' (Final)
  return {
    gameState: 'post',
    activeScore: player.score || 0,
    activeStatsLine: fullStatsLine,
    historicalScore,
    historicalStats,
    hasHistoricalData: true,
    contextBadgeText: 'FINAL',
    isLive: false,
    isFinal: true,
  };
}

