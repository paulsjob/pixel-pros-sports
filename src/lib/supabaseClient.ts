import { createClient } from '@supabase/supabase-js';
import { Competitor, Match, SportId, UserRoster } from '../types';
import { getDeviceId } from './deviceIdentity';
import { getCurrentNFLWeek } from './espnSync';
import {
  DEFAULT_NFL_COMPETITORS,
  DEFAULT_NFL_MATCHES,
  getTeamColors,
  getTeamFullName,
  getUniformNumber,
} from '../utils/teamData';
import {
  DEFAULT_NBA_COMPETITORS,
  DEFAULT_NBA_MATCHES,
  getNBATeamColors,
  getNBATeamFullName,
} from '../utils/nbaTeamData';

const metaEnv = typeof import.meta !== 'undefined' ? (import.meta as any).env : {};
const procEnv = typeof process !== 'undefined' ? process.env : {};

export const SUPABASE_URL =
  procEnv?.NEXT_PUBLIC_SUPABASE_URL ||
  procEnv?.SUPABASE_URL ||
  metaEnv?.VITE_SUPABASE_URL ||
  'https://sqntjgjqtwbcqpxcqzbg.supabase.co';

const rawKey =
  procEnv?.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  procEnv?.SUPABASE_ANON_KEY ||
  procEnv?.SUPABASE_SERVICE_ROLE_KEY ||
  metaEnv?.VITE_SUPABASE_ANON_KEY ||
  '';

export const isSupabaseConfigured = Boolean(
  rawKey &&
  rawKey.trim() !== '' &&
  !rawKey.startsWith('your-') &&
  rawKey !== 'anon-key-placeholder'
);

// Fallback to a non-empty string so createClient never throws "supabaseKey is required."
export const SUPABASE_ANON_KEY = isSupabaseConfigured
  ? rawKey.trim()
  : 'anon-key-placeholder';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

const SKIN_TONES = ['#f7d7b5', '#d98c55', '#8c532b', '#e6ba8c', '#5c3509'];
function getSkinTone(name?: string): string {
  if (!name) return '#d98c55';
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
  }
  return SKIN_TONES[Math.abs(hash) % SKIN_TONES.length];
}

export function mapRowToCompetitor(row: any): Competitor {
  const rowSport = String(row.sport || row.sport_id || 'nfl').toLowerCase();
  const rawId = String(row.id || '');
  const rawName = String(row.name || row.display_name || (rowSport === 'nba' ? 'NBA Star' : 'NFL Pro')).trim();
  const rawTeam = String(row.team || row.team_code || (rowSport === 'nba' ? 'NBA' : 'NFL')).trim().toUpperCase();
  const rawPos = String(row.position || 'STAR').trim().toUpperCase();
  const rawScore = Math.max(0, Math.round(Number(row.score ?? row.fantasy_points ?? 0)));

  const statsObj = typeof row.stats === 'object' && row.stats !== null ? row.stats : {};
  const parts = rawName.split(/\s+/);
  const shortName = (row.short_name || parts[parts.length - 1] || 'PRO').toUpperCase();
  const uniformNum = Number(row.uniform_number || row.jersey_number || getUniformNumber(rawName, rawId));

  if (rowSport === 'nba') {
    const nbaColors = getNBATeamColors(rawTeam);
    const pts = Number(statsObj.pts ?? statsObj.points ?? 0);
    const threePm = Number(statsObj.three_pm ?? statsObj.threes ?? 0);
    const reb = Number(statsObj.reb ?? statsObj.rebounds ?? 0);
    const ast = Number(statsObj.ast ?? statsObj.assists ?? 0);
    const blk = Number(statsObj.blk ?? statsObj.blocks ?? 0);
    const stl = Number(statsObj.stl ?? statsObj.steals ?? 0);
    const bigStops = Number(statsObj.big_stops ?? (blk + stl));

    return {
      id: rawId,
      sportId: 'nba',
      displayName: rawName,
      shortName,
      uniformNumber: uniformNum,
      teamName: getNBATeamFullName(rawTeam),
      teamCode: rawTeam,
      positionGeneric:
        rawPos === 'PG' || rawPos === 'SG'
          ? 'PLAYMAKER'
          : rawPos === 'C' || rawPos === 'PF'
          ? 'OFFENSE'
          : 'SCORER',
      position: rawPos !== 'STAR' ? rawPos : 'PG',
      rating: rawScore > 42 ? 99 : rawScore > 35 ? 95 : 90,
      score: rawScore,
      stats: {
        ...statsObj,
        pts,
        points: pts,
        three_pm: threePm,
        threes: threePm,
        reb,
        rebounds: reb,
        ast,
        assists: ast,
        blocks: blk,
        steals: stl,
        big_stops: bigStops,
        primaryMetricLabel: '3-Pointers',
        primaryMetricValue: threePm,
      },
      badges: rawScore >= 42 ? ['diamond_crystal', 'gold_star'] : ['gold_star'],
      avatar: {
        helmetColor: nbaColors.jersey,
        jerseyColor: nbaColors.jersey,
        stripeColor: nbaColors.stripe,
        skinTone: getSkinTone(rawName),
        number: uniformNum,
      },
    };
  }

  // NFL Mapping
  const passYds = Number(statsObj.pass_yds ?? statsObj.passing_yards ?? statsObj.passingYards ?? 0);
  const rushYds = Number(statsObj.rush_yds ?? statsObj.rushing_yards ?? statsObj.rushingYards ?? 0);
  const recYds = Number(statsObj.rec_yds ?? statsObj.receiving_yards ?? statsObj.receivingYards ?? 0);
  const tds = Number(statsObj.tds ?? statsObj.touchdowns ?? 0);
  const fgs = Number(statsObj.fgs ?? statsObj.field_goals ?? 0);
  const stops = Number(statsObj.stops ?? statsObj.defensive_stops ?? 0);
  const totalScrimmageYards = passYds + rushYds + recYds;
  const teamColors = getTeamColors(rawTeam);

  return {
    id: rawId,
    sportId: 'nfl',
    displayName: rawName,
    shortName,
    uniformNumber: uniformNum,
    teamName: getTeamFullName(rawTeam),
    teamCode: rawTeam,
    positionGeneric: rawPos === 'K' ? 'SCORER' : 'OFFENSE',
    position: rawPos,
    rating: rawScore > 30 ? 99 : rawScore > 15 ? 93 : 88,
    score: rawScore,
    stats: {
      ...statsObj,
      pass_yds: passYds,
      rush_yds: rushYds,
      rec_yds: recYds,
      tds: tds,
      fgs: fgs,
      stops: stops,
      passingYards: passYds,
      rushingYards: rushYds,
      receivingYards: recYds,
      touchdowns: tds,
      total_yards: totalScrimmageYards,
      primaryMetricLabel: 'Touchdowns',
      primaryMetricValue: tds,
    },
    badges: rawScore >= 30 ? ['diamond_crystal', 'gold_star'] : rawScore >= 15 ? ['gold_star'] : ['shield_badge'],
    avatar: {
      helmetColor: teamColors.helmet,
      jerseyColor: teamColors.jersey,
      stripeColor: teamColors.stripe,
      skinTone: getSkinTone(rawName),
      number: uniformNum,
    },
  };
}

function getLocalSyncedCompetitors(sport: SportId): Competitor[] | null {
  try {
    const raw = localStorage.getItem(`pixel_pros_synced_competitors_${sport}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

function getLocalSyncedMatches(sport: SportId): Match[] | null {
  try {
    const raw = localStorage.getItem(`pixel_pros_synced_matches_${sport}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (sport === 'nfl') {
          const hasDetOrBuf = parsed.some(
            (m) =>
              m.homeTeamCode === 'BUF' ||
              m.awayTeamCode === 'BUF' ||
              m.home_team === 'BUF' ||
              m.away_team === 'BUF' ||
              m.homeTeamCode === 'DET' ||
              m.awayTeamCode === 'DET'
          );
          const hasStaleDenKc = parsed.some(
            (m) =>
              (m.homeTeamCode === 'KC' && m.awayTeamCode === 'DEN') ||
              (m.home_team === 'KC' && m.away_team === 'DEN')
          );
          if (!hasDetOrBuf || hasStaleDenKc) {
            localStorage.removeItem(`pixel_pros_synced_matches_${sport}`);
            return null;
          }
        }
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

export async function fetchLiveCompetitors(sport: SportId = 'nfl'): Promise<Competitor[]> {
  const fallback =
    getLocalSyncedCompetitors(sport) ||
    (sport === 'nba' ? DEFAULT_NBA_COMPETITORS : DEFAULT_NFL_COMPETITORS);
  if (!isSupabaseConfigured) {
    return fallback;
  }
  try {
    const { data, error } = await supabase
      .from('competitors')
      .select('*')
      .order('score', { ascending: false });

    if (error) {
      console.warn(`Error fetching ${sport} competitors:`, error.message);
      return fallback;
    }

    if (!data || data.length === 0) {
      return fallback;
    }

    const filtered = data.filter((row: any) => {
      const rowSport = String(row.sport || row.sport_id || '').toLowerCase();
      if (sport === 'nba') {
        return rowSport === 'nba';
      }
      return rowSport !== 'nba';
    });

    if (filtered.length === 0) {
      return fallback;
    }

    return filtered.map(mapRowToCompetitor).sort((a, b) => b.score - a.score);
  } catch (err) {
    console.warn(`Exception during ${sport} competitors fetch:`, err);
    return fallback;
  }
}

export async function fetchLiveNFLCompetitors(): Promise<Competitor[]> {
  return fetchLiveCompetitors('nfl');
}

export async function fetchLiveMatches(sport: SportId = 'nfl'): Promise<Match[]> {
  const currentNFLWeek = getCurrentNFLWeek();
  const localSynced = getLocalSyncedMatches(sport);
  const defaultMatches = sport === 'nba' ? DEFAULT_NBA_MATCHES : DEFAULT_NFL_MATCHES;
  const rawFallback = localSynced || defaultMatches;

  // Safe fallback ensuring only current week matches are returned
  const fallback = sport === 'nfl'
    ? rawFallback.filter((m) => !m.week || m.week === currentNFLWeek)
    : rawFallback;

  if (!isSupabaseConfigured) {
    return fallback;
  }
  try {
    const { data, error } = await supabase.from('matches').select('*');

    if (error) {
      console.warn(`Error fetching ${sport} matches:`, error.message);
      return fallback;
    }

    if (!data || data.length === 0) {
      return fallback;
    }

    const filtered = data.filter((row: any) => {
      const rowSport = String(row.sport || row.sport_id || '').toLowerCase();
      if (sport === 'nba') {
        return rowSport === 'nba';
      }
      return rowSport !== 'nba';
    });

    if (filtered.length === 0) {
      return fallback;
    }

    const mappedMatches = filtered.map((row: any): Match => {
      const homeCode = String(row.home_team || row.home_team_code || row.home_competitor_name || '').trim().toUpperCase();
      const awayCode = String(row.away_team || row.away_team_code || row.away_competitor_name || '').trim().toUpperCase();
      const rawStatus = String(row.status || '').toLowerCase();
      const qTime = String(row.quarter_time || row.period_label || '').trim();

      const isFinal = rawStatus === 'final' || qTime.toLowerCase().includes('final');
      const isLive =
        rawStatus === 'live' ||
        (!isFinal &&
          (qTime.includes('th') ||
            qTime.includes('1st') ||
            qTime.includes('2nd') ||
            qTime.includes('3rd') ||
            qTime.includes('4th') ||
            qTime.includes('Q') ||
            qTime.includes('Half') ||
            qTime.includes('OT')));
      const isScheduled = !isFinal && !isLive;

      const awayScore = Number(row.away_score || 0);
      const homeScore = Number(row.home_score || 0);

      const homeName = sport === 'nba' ? getNBATeamFullName(homeCode) : getTeamFullName(homeCode);
      const awayName = sport === 'nba' ? getNBATeamFullName(awayCode) : getTeamFullName(awayCode);

      const rowWeek = row.week ? Number(row.week) : (sport === 'nfl' ? currentNFLWeek : undefined);

      return {
        id: String(row.id),
        sportId: sport,
        homeTeam: homeName,
        awayTeam: awayName,
        homeTeamCode: homeCode,
        awayTeamCode: awayCode,
        home_team: homeCode,
        away_team: awayCode,
        home_score: homeScore,
        away_score: awayScore,
        quarter_time: qTime || (isScheduled ? 'SCHEDULED' : isFinal ? 'Final' : 'LIVE'),
        quarterTime: qTime || (isScheduled ? 'SCHEDULED' : isFinal ? 'Final' : 'LIVE'),
        status: isFinal ? 'final' : isLive ? 'live' : 'upcoming',
        periodLabel: qTime || (isScheduled ? 'SCHEDULED' : isFinal ? 'Final' : 'LIVE'),
        homeScore,
        awayScore,
        week: rowWeek,
        weekLabel: rowWeek ? `Week ${rowWeek}` : undefined,
        gameDate: row.scheduled_at,
      };
    });

    const sortLiveFirst = (list: Match[]) =>
      [...list].sort((a, b) => {
        if (a.status === 'live' && b.status !== 'live') return -1;
        if (b.status === 'live' && a.status !== 'live') return 1;
        if (a.status === 'upcoming' && b.status === 'final') return -1;
        if (b.status === 'upcoming' && a.status === 'final') return 1;
        const dateA = a.gameDate ? new Date(a.gameDate).getTime() : 0;
        const dateB = b.gameDate ? new Date(b.gameDate).getTime() : 0;
        return dateA - dateB;
      });

    if (sport === 'nfl') {
      const hasDetOrBuf = mappedMatches.some(
        (m) =>
          m.homeTeamCode === 'BUF' ||
          m.awayTeamCode === 'BUF' ||
          m.home_team === 'BUF' ||
          m.away_team === 'BUF' ||
          m.homeTeamCode === 'DET' ||
          m.awayTeamCode === 'DET'
      );
      if (!hasDetOrBuf) {
        return sortLiveFirst(fallback);
      }
      // STRICT FILTER: No games apart from the week that we are on (no past weeks, no future weeks)
      const currentWeekOnly = mappedMatches.filter((m) => !m.week || m.week === currentNFLWeek);
      return sortLiveFirst(currentWeekOnly.length > 0 ? currentWeekOnly : mappedMatches);
    }

    return sortLiveFirst(mappedMatches);
  } catch (err) {
    console.warn(`Exception during ${sport} matches fetch:`, err);
    return fallback;
  }
}

export async function fetchLiveNFLMatches(): Promise<Match[]> {
  return fetchLiveMatches('nfl');
}

function sanitizeCompetitorId(id?: string | null): string | null {
  if (!id || typeof id !== 'string') return null;
  const trimmed = id.trim();
  if (!trimmed || trimmed === '' || trimmed === 'null' || trimmed === 'undefined') return null;
  return trimmed;
}

export async function upsertUserRoster(
  roomCode: string,
  userName: string,
  star1Id?: string | null,
  star2Id?: string | null,
  star3Id?: string | null,
  isLocked?: boolean,
  sport: SportId = 'nfl'
): Promise<{ success: boolean; data?: UserRoster; error?: string }> {
  const cleanRoom = (roomCode || (sport === 'nba' ? 'HOOPS' : 'COUCH')).trim().toUpperCase();
  const cleanName = (userName || 'DAD').trim().toUpperCase();

  const sanitizedS1 = sanitizeCompetitorId(star1Id);
  const sanitizedS2 = sanitizeCompetitorId(star2Id);
  const sanitizedS3 = sanitizeCompetitorId(star3Id);

  const starIds = [sanitizedS1, sanitizedS2, sanitizedS3].filter(Boolean) as string[];
  const distinctIds = new Set(starIds);
  const hasThreeDistinct = starIds.length === 3 && distinctIds.size === 3;
  const guardedLocked = hasThreeDistinct && Boolean(isLocked);

  const record: UserRoster = {
    room_code: cleanRoom,
    user_name: cleanName,
    sport,
    device_id: guardedLocked ? 'LOCKED' : 'UNLOCKED',
    star_1_id: sanitizedS1 || '',
    star_2_id: sanitizedS2 || '',
    star_3_id: sanitizedS3 || '',
    is_locked: guardedLocked,
    updated_at: new Date().toISOString(),
  };

  try {
    const localKey = sport === 'nba' ? `pixel_pros_rosters_${cleanRoom}_nba` : `pixel_pros_rosters_${cleanRoom}`;
    const raw = localStorage.getItem(localKey);
    let rosters: UserRoster[] = raw ? JSON.parse(raw) : [];
    const idx = rosters.findIndex(
      (r) => r.user_name.toUpperCase() === cleanName
    );
    if (idx >= 0) {
      rosters[idx] = { ...rosters[idx], ...record };
    } else {
      rosters.push(record);
    }
    localStorage.setItem(localKey, JSON.stringify(rosters));

    const lockKey = sport === 'nba'
      ? `pixel_pros_picks_locked_${cleanRoom}_${cleanName}_nba`
      : `pixel_pros_picks_locked_${cleanRoom}_${cleanName}`;
    localStorage.setItem(lockKey, guardedLocked ? 'true' : 'false');

    const rosterKey = sport === 'nba'
      ? `pixel_pros_roster_${cleanRoom}_${cleanName}_nba`
      : `pixel_pros_roster_${cleanRoom}_${cleanName}`;
    localStorage.setItem(rosterKey, JSON.stringify([record.star_1_id, record.star_2_id, record.star_3_id]));
    window.dispatchEvent(new CustomEvent('pixel_pros_roster_update', { detail: record }));
  } catch {
    // ignore local storage errors
  }

  try {
    if (!isSupabaseConfigured) {
      return { success: true, data: record };
    }

    const payload: any = {
      room_code: cleanRoom,
      user_name: cleanName,
      sport,
      star_1_id: sanitizedS1 || '',
      star_2_id: sanitizedS2 || '',
      star_3_id: sanitizedS3 || '',
      is_locked: guardedLocked,
      device_id: guardedLocked ? 'LOCKED' : 'UNLOCKED',
      updated_at: record.updated_at,
    };

    let { error } = await supabase
      .from('user_rosters')
      .upsert(payload, { onConflict: 'room_code,user_name,sport' });

    // Fallback if postgres database constraint is still the legacy (room_code, user_name)
    if (error && (error.code === '42P10' || error.message?.includes('conflict') || error.message?.includes('constraint'))) {
      const fallback = await supabase
        .from('user_rosters')
        .upsert(payload, { onConflict: 'room_code,user_name' });
      error = fallback.error;
    }

    if (error) {
      console.error('Supabase user_rosters upsert error:', error);
      return { success: false, data: record, error: error.message };
    }
    return { success: true, data: record };
  } catch (err: any) {
    console.error('Supabase user_rosters network error:', err);
    return { success: false, data: record, error: err?.message || String(err) };
  }
}

export const GHOST_USER_NAMES: string[] = [];

export function isGhostUser(name?: string | null): boolean {
  if (!name || !name.trim()) return true;
  return false;
}

export interface ActiveRoomSummary {
  roomCode: string;
  sport: SportId;
  squadCount: number;
  squadNames: string[];
}

export async function fetchAllActiveRooms(): Promise<ActiveRoomSummary[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await supabase
      .from('user_rosters')
      .select('room_code, user_name, sport')
      .not('room_code', 'is', null)
      .not('user_name', 'is', null);

    if (error || !data) return [];

    const roomMap = new Map<string, { sport: SportId; squads: Set<string> }>();
    data.forEach((row: any) => {
      const code = (row.room_code || '').trim().toUpperCase();
      const user = (row.user_name || '').trim().toUpperCase();
      const sport = (row.sport || 'nfl').toLowerCase() === 'nba' ? 'nba' : 'nfl';
      if (!code || !user) return;

      if (!roomMap.has(code)) {
        roomMap.set(code, { sport, squads: new Set() });
      }
      roomMap.get(code)!.squads.add(user);
    });

    return Array.from(roomMap.entries()).map(([roomCode, val]) => ({
      roomCode,
      sport: val.sport,
      squadCount: val.squads.size,
      squadNames: Array.from(val.squads),
    }));
  } catch {
    return [];
  }
}

export function getSquadLockState(roomCode: string, userName: string, sport: SportId = 'nfl'): boolean {
  const cleanRoom = (roomCode || 'COUCH').trim().toUpperCase();
  const cleanName = (userName || 'DAD').trim().toUpperCase();
  try {
    if (sport === 'nba') {
      return localStorage.getItem(`pixel_pros_picks_locked_${cleanRoom}_${cleanName}_nba`) === 'true';
    }
    return (
      localStorage.getItem(`pixel_locked_${cleanRoom}_${cleanName}`) === 'true' ||
      localStorage.getItem(`pixel_pros_picks_locked_${cleanRoom}_${cleanName}`) === 'true'
    );
  } catch {
    return false;
  }
}

export function setSquadLockState(roomCode: string, userName: string, locked: boolean, sport: SportId = 'nfl'): void {
  const cleanRoom = (roomCode || 'COUCH').trim().toUpperCase();
  const cleanName = (userName || 'DAD').trim().toUpperCase();
  try {
    if (sport === 'nba') {
      localStorage.setItem(`pixel_pros_picks_locked_${cleanRoom}_${cleanName}_nba`, String(locked));
    } else {
      localStorage.setItem(`pixel_locked_${cleanRoom}_${cleanName}`, String(locked));
      localStorage.setItem(`pixel_pros_picks_locked_${cleanRoom}_${cleanName}`, String(locked));
    }
  } catch {
    // ignore
  }
}

export async function fetchRoomRosters(roomCode: string, sport: SportId = 'nfl'): Promise<UserRoster[]> {
  const cleanRoom = (roomCode || 'COUCH').trim().toUpperCase();

  let localRosters: UserRoster[] = [];
  try {
    const localKey = sport === 'nba' ? `pixel_pros_rosters_${cleanRoom}_nba` : `pixel_pros_rosters_${cleanRoom}`;
    const raw = localStorage.getItem(localKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        localRosters = parsed.filter((r: UserRoster) => !isGhostUser(r.user_name));
      }
    }
  } catch {
    // ignore
  }

  if (!isSupabaseConfigured) {
    return localRosters;
  }

  try {
    const { data, error } = await supabase
      .from('user_rosters')
      .select('*')
      .eq('room_code', cleanRoom)
      .not('user_name', 'is', null)
      .order('updated_at', { ascending: false });

    if (error || !data) {
      return localRosters;
    }

    const sportFiltered = data.filter((r: any) => {
      const rowSport = String(r.sport || 'nfl').toLowerCase();
      return sport === 'nba' ? rowSport === 'nba' : rowSport !== 'nba';
    });

    const map = new Map<string, UserRoster>();
    localRosters.forEach((r) => {
      if (isGhostUser(r.user_name)) return;
      const key = r.user_name.trim().toUpperCase();
      map.set(key, r);
    });

    sportFiltered.forEach((r: any) => {
      if (isGhostUser(r.user_name)) return;
      const key = (r.user_name || '').trim().toUpperCase();
      if (!key) return;

      const starIds = [r.star_1_id, r.star_2_id, r.star_3_id].filter(
        (id) => id && typeof id === 'string' && id.trim() !== ''
      );
      const distinctStars = new Set(starIds);
      const hasThreeDistinct = starIds.length === 3 && distinctStars.size === 3;

      // Synchronize the lock state directly from the database column is_locked
      const rawLocked = Boolean(r.is_locked === true || r.device_id === 'LOCKED');
      const isLocked = hasThreeDistinct && rawLocked;

      const entry: UserRoster = {
        id: r.id,
        room_code: (r.room_code || '').toUpperCase(),
        user_name: key,
        sport: r.sport || sport,
        device_id: isLocked ? 'LOCKED' : 'UNLOCKED',
        star_1_id: r.star_1_id || '',
        star_2_id: r.star_2_id || '',
        star_3_id: r.star_3_id || '',
        is_locked: isLocked,
        updated_at: r.updated_at,
      };
      map.set(key, entry);
      setSquadLockState(cleanRoom, key, isLocked, sport);
    });

    return Array.from(map.values());
  } catch {
    return localRosters;
  }
}

export async function deleteUserRoster(roomCode: string, userName: string, sport: SportId = 'nfl'): Promise<boolean> {
  const cleanRoom = (roomCode || 'COUCH').trim().toUpperCase();
  const cleanName = (userName || '').trim().toUpperCase();
  if (!cleanName) return false;

  try {
    const localKeys = [
      sport === 'nba' ? `pixel_pros_rosters_${cleanRoom}_nba` : `pixel_pros_rosters_${cleanRoom}`,
      `pixel_pros_rosters_${cleanRoom}`,
      `pixel_pros_rosters_${cleanRoom}_${sport}`,
    ];
    localKeys.forEach((key) => {
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          const rosters: UserRoster[] = JSON.parse(raw);
          const filtered = rosters.filter((r) => r.user_name.toUpperCase() !== cleanName);
          localStorage.setItem(key, JSON.stringify(filtered));
        } catch {
          // ignore
        }
      }
    });
    localStorage.removeItem(`pixel_pros_roster_${cleanRoom}_${cleanName}`);
    localStorage.removeItem(`pixel_pros_roster_${cleanRoom}_${cleanName}_${sport}`);
    localStorage.removeItem(`pixel_pros_picks_locked_${cleanRoom}_${cleanName}`);
    localStorage.removeItem(`pixel_pros_picks_locked_${cleanRoom}_${cleanName}_${sport}`);
    localStorage.removeItem(`pixel_locked_${cleanRoom}_${cleanName}`);

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('user_rosters')
          .delete()
          .eq('room_code', cleanRoom)
          .eq('user_name', cleanName);
      } catch {}
    }

    window.dispatchEvent(new CustomEvent('pixel_pros_roster_update', { detail: { room_code: cleanRoom, user_name: cleanName, deleted: true, sport } }));
    return true;
  } catch (err) {
    console.warn('deleteUserRoster error:', err);
    return false;
  }
}

export async function resetRoomRosters(roomCode: string): Promise<boolean> {
  const cleanRoom = (roomCode || 'COUCH').trim().toUpperCase();
  if (!cleanRoom) return false;

  try {
    localStorage.removeItem(`pixel_pros_rosters_${cleanRoom}`);
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.includes(`_${cleanRoom}_`) || k.endsWith(`_${cleanRoom}`))) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));

    if (isSupabaseConfigured) {
      try {
        await supabase
          .from('user_rosters')
          .delete()
          .eq('room_code', cleanRoom);
      } catch {}
    }

    window.dispatchEvent(new CustomEvent('pixel_pros_roster_update', { detail: { room_code: cleanRoom, reset: true } }));
    return true;
  } catch (err) {
    console.warn('resetRoomRosters error:', err);
    return false;
  }
}

export async function renameUserRoster(
  roomCode: string,
  oldUserName: string,
  newUserName: string,
  sport: SportId = 'nfl'
): Promise<{ success: boolean; error?: string }> {
  const cleanRoom = (roomCode || 'COUCH').trim().toUpperCase();
  const cleanOld = (oldUserName || '').trim().toUpperCase();
  const cleanNew = (newUserName || '').trim().toUpperCase();

  if (!cleanOld || !cleanNew) return { success: false, error: 'Invalid squad name' };
  if (cleanOld === cleanNew) return { success: true };

  try {
    // 1. Update in Supabase
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('user_rosters')
        .update({ user_name: cleanNew, updated_at: new Date().toISOString() })
        .eq('room_code', cleanRoom)
        .eq('user_name', cleanOld);

      if (error) {
        return { success: false, error: error.message };
      }
    }

    // 2. Update localStorage
    const localKey = sport === 'nba' ? `pixel_pros_rosters_${cleanRoom}_nba` : `pixel_pros_rosters_${cleanRoom}`;
    const raw = localStorage.getItem(localKey);
    if (raw) {
      try {
        const rosters: UserRoster[] = JSON.parse(raw);
        const idx = rosters.findIndex((r) => r.user_name.toUpperCase() === cleanOld);
        if (idx >= 0) {
          rosters[idx].user_name = cleanNew;
          localStorage.setItem(localKey, JSON.stringify(rosters));
        }
      } catch {}
    }

    // Migrate lock state in local storage
    const oldLock = getSquadLockState(cleanRoom, cleanOld, sport);
    setSquadLockState(cleanRoom, cleanNew, oldLock, sport);

    window.dispatchEvent(
      new CustomEvent('pixel_pros_roster_update', {
        detail: { room_code: cleanRoom, user_name: cleanNew, renamedFrom: cleanOld, sport },
      })
    );
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

export async function toggleSquadLock(
  roomCode: string,
  userName: string,
  isLocked: boolean,
  sport: SportId = 'nfl'
): Promise<boolean> {
  const cleanRoom = (roomCode || 'COUCH').trim().toUpperCase();
  const cleanUser = (userName || '').trim().toUpperCase();
  if (!cleanUser) return false;

  try {
    setSquadLockState(cleanRoom, cleanUser, isLocked, sport);

    if (isSupabaseConfigured) {
      await supabase
        .from('user_rosters')
        .update({
          is_locked: isLocked,
          device_id: isLocked ? 'LOCKED' : 'UNLOCKED',
          updated_at: new Date().toISOString(),
        })
        .eq('room_code', cleanRoom)
        .eq('user_name', cleanUser);
    }

    window.dispatchEvent(
      new CustomEvent('pixel_pros_roster_update', {
        detail: { room_code: cleanRoom, user_name: cleanUser, lockChanged: true, isLocked, sport },
      })
    );
    return true;
  } catch (err) {
    console.warn('toggleSquadLock error:', err);
    return false;
  }
}

export async function setAllSquadsLock(
  roomCode: string,
  isLocked: boolean,
  sport: SportId = 'nfl'
): Promise<boolean> {
  const cleanRoom = (roomCode || 'COUCH').trim().toUpperCase();
  try {
    if (isSupabaseConfigured) {
      await supabase
        .from('user_rosters')
        .update({
          is_locked: isLocked,
          device_id: isLocked ? 'LOCKED' : 'UNLOCKED',
          updated_at: new Date().toISOString(),
        })
        .eq('room_code', cleanRoom);
    }

    // Also update local rosters
    const localKey = sport === 'nba' ? `pixel_pros_rosters_${cleanRoom}_nba` : `pixel_pros_rosters_${cleanRoom}`;
    const raw = localStorage.getItem(localKey);
    if (raw) {
      try {
        const rosters: UserRoster[] = JSON.parse(raw);
        rosters.forEach((r) => {
          r.is_locked = isLocked;
          r.device_id = isLocked ? 'LOCKED' : 'UNLOCKED';
          setSquadLockState(cleanRoom, r.user_name, isLocked, sport);
        });
        localStorage.setItem(localKey, JSON.stringify(rosters));
      } catch {}
    }

    window.dispatchEvent(
      new CustomEvent('pixel_pros_roster_update', {
        detail: { room_code: cleanRoom, allLockChanged: true, isLocked, sport },
      })
    );
    return true;
  } catch (err) {
    console.warn('setAllSquadsLock error:', err);
    return false;
  }
}

export async function clearSquadStars(
  roomCode: string,
  userName: string,
  sport: SportId = 'nfl'
): Promise<boolean> {
  const cleanRoom = (roomCode || 'COUCH').trim().toUpperCase();
  const cleanUser = (userName || '').trim().toUpperCase();
  if (!cleanUser) return false;

  try {
    setSquadLockState(cleanRoom, cleanUser, false, sport);

    if (isSupabaseConfigured) {
      await supabase
        .from('user_rosters')
        .update({
          star_1_id: '',
          star_2_id: '',
          star_3_id: '',
          is_locked: false,
          device_id: 'UNLOCKED',
          updated_at: new Date().toISOString(),
        })
        .eq('room_code', cleanRoom)
        .eq('user_name', cleanUser);
    }

    const localKey = sport === 'nba' ? `pixel_pros_rosters_${cleanRoom}_nba` : `pixel_pros_rosters_${cleanRoom}`;
    const raw = localStorage.getItem(localKey);
    if (raw) {
      try {
        const rosters: UserRoster[] = JSON.parse(raw);
        const target = rosters.find((r) => r.user_name.toUpperCase() === cleanUser);
        if (target) {
          target.star_1_id = '';
          target.star_2_id = '';
          target.star_3_id = '';
          target.is_locked = false;
          target.device_id = 'UNLOCKED';
          localStorage.setItem(localKey, JSON.stringify(rosters));
        }
      } catch {}
    }

    window.dispatchEvent(
      new CustomEvent('pixel_pros_roster_update', {
        detail: { room_code: cleanRoom, user_name: cleanUser, clearedStars: true, sport },
      })
    );
    return true;
  } catch (err) {
    console.warn('clearSquadStars error:', err);
    return false;
  }
}

export function subscribeToRoomRosters(
  roomCode: string,
  sportOrCb: SportId | (() => void) = 'nfl',
  maybeCb?: () => void
) {
  const sport: SportId = typeof sportOrCb === 'string' ? sportOrCb : 'nfl';
  const onUpdate: () => void = typeof sportOrCb === 'function' ? sportOrCb : (maybeCb || (() => {}));

  const clean = (roomCode || (sport === 'nba' ? 'HOOPS' : 'COUCH')).trim().toUpperCase();
  const channelName = `room-${clean}-${sport}`;

  const handleLocalUpdate = (e: any) => {
    const detail = e?.detail;
    if (detail) {
      if (detail.room_code && detail.room_code.trim().toUpperCase() !== clean) return;
      if (detail.sport && detail.sport !== sport) return;
    }
    onUpdate();
  };
  window.addEventListener('pixel_pros_roster_update', handleLocalUpdate);

  if (!isSupabaseConfigured) {
    return () => {
      window.removeEventListener('pixel_pros_roster_update', handleLocalUpdate);
    };
  }

  let channel: any = null;
  try {
    channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_rosters',
        },
        () => {
          onUpdate();
        }
      )
      .subscribe();
  } catch (err) {
    console.warn(`Error subscribing to channel ${channelName}:`, err);
  }

  return () => {
    window.removeEventListener('pixel_pros_roster_update', handleLocalUpdate);
    if (channel) {
      try {
        supabase.removeChannel(channel);
      } catch (err) {
        console.warn(`Error removing channel ${channelName}:`, err);
      }
    }
  };
}

export function subscribeToRealtimeScores(
  onCompetitorUpdate: (payload: any) => void,
  onMatchUpdate?: (payload: any) => void,
  onRosterUpdate?: (payload: any) => void
) {
  if (!isSupabaseConfigured) {
    return () => {};
  }

  try {
    const channel = supabase
      .channel('pixel-pros-realtime-wire')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'competitors',
        },
        (payload) => {
          onCompetitorUpdate(payload);
        }
      );

    if (onMatchUpdate) {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
        },
        (payload) => {
          onMatchUpdate(payload);
        }
      );
    }

    if (onRosterUpdate) {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_rosters',
        },
        (payload) => {
          onRosterUpdate(payload);
        }
      );
    }

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Supabase Realtime Wire Connected: competitors, matches, user_rosters');
      }
    });

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch {}
    };
  } catch (err) {
    console.warn('Realtime subscription error:', err);
    return () => {};
  }
}