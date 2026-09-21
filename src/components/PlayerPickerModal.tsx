import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Competitor, Match, ActiveSlot, SportId } from '../types';
import { PixelPlayerSprite } from './PixelPlayerSprite';
import { PixelHelmet } from './PixelHelmet';
import { Search } from 'lucide-react';
import { splitPlayerFirstLastName } from '../utils/formatters';
import { getCurrentNFLWeek } from '../lib/espnSync';
import {
  getPlayerScoringDisplay,
  DEFAULT_NFL_MATCHES,
  DEFAULT_NFL_COMPETITORS,
  isPositionAllowedForSlot,
  NFL_SLOT_DEFS,
  NBA_SLOT_DEFS,
  normalizeTeamCode,
  getPlayerVisualAvatar,
} from '../utils/teamData';
import { DEFAULT_NBA_MATCHES } from '../utils/nbaTeamData';

interface PlayerPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSlot: ActiveSlot;
  allPlayers: Competitor[];
  currentSlotPlayerId?: string | null;
  selectedPlayerIds?: string[];
  matches?: Match[];
  sport?: SportId;
  onSelectPlayer: (player: Competitor, targetSlot: ActiveSlot) => void;
  onInspectPlayer?: (player: Competitor) => void;
}

const SLOT_TITLES: Record<ActiveSlot, string> = {
  star1: 'STAR 1',
  star2: 'STAR 2',
  star3: 'STAR 3',
};

const POSITION_ORDER: Record<string, number> = {
  QB: 1,
  RB: 2,
  WR: 3,
  TE: 4,
  K: 5,
  PG: 1,
  SG: 2,
  SF: 3,
  PF: 4,
  C: 5,
  G: 1,
  F: 3,
};

function normalizeCode(code?: string): string {
  return normalizeTeamCode(code);
}

export const PlayerPickerModal: React.FC<PlayerPickerModalProps> = ({
  isOpen,
  onClose,
  activeSlot,
  allPlayers = [],
  currentSlotPlayerId,
  selectedPlayerIds = [],
  matches = [],
  sport = 'nfl',
  onSelectPlayer,
  onInspectPlayer,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGameFilter, setSelectedGameFilter] = useState<string>('ALL');
  const [positionFilter, setPositionFilter] = useState<'ELIGIBLE' | 'ALL'>('ELIGIBLE');
  const [hideEndedGames, setHideEndedGames] = useState(false);
  const [showAllGamesGrid, setShowAllGamesGrid] = useState(false);
  const currentNFLWeek = getCurrentNFLWeek();

  const slotDefs = sport === 'nba' ? NBA_SLOT_DEFS : NFL_SLOT_DEFS;
  const currentSlotDef = slotDefs.find((s) => s.key === activeSlot) || slotDefs[0];

  useEffect(() => {
    setPositionFilter('ELIGIBLE');
    setShowAllGamesGrid(false);
  }, [activeSlot, isOpen]);

  const activeMatches = useMemo(() => {
    const defaultList = sport === 'nba' ? DEFAULT_NBA_MATCHES : DEFAULT_NFL_MATCHES;
    const baseMatches = Array.isArray(matches) && matches.length > 0 ? matches : defaultList;

    // Filter to current sport and current NFL week
    const sportMatches = baseMatches.filter((m) => {
      const matchSport = (m.sportId || (m as any).sport || '').toLowerCase();
      if (matchSport && matchSport !== sport.toLowerCase()) return false;
      if (sport === 'nfl') {
        if (m.week && m.week !== currentNFLWeek) return false;
      }
      return true;
    });

    // Ensure all 16 games on the NFL slate (all 32 teams) are represented
    const combined = [...sportMatches];
    if (sport === 'nfl') {
      const existingPairs = new Set(
        combined.map((m) => {
          const away = normalizeCode(m.awayTeamCode || m.away_team || '');
          const home = normalizeCode(m.homeTeamCode || m.home_team || '');
          return `${away}@${home}`;
        })
      );

      for (const defMatch of DEFAULT_NFL_MATCHES) {
        if (defMatch.week && defMatch.week !== currentNFLWeek) continue;
        const away = normalizeCode(defMatch.awayTeamCode || defMatch.away_team || '');
        const home = normalizeCode(defMatch.homeTeamCode || defMatch.home_team || '');
        const pair = `${away}@${home}`;
        if (!existingPairs.has(pair)) {
          combined.push({ ...defMatch, week: currentNFLWeek, weekLabel: `Week ${currentNFLWeek}` });
          existingPairs.add(pair);
        }
      }
    }

    return combined.sort((a, b) => {
      if (a.status === 'live' && b.status !== 'live') return -1;
      if (b.status === 'live' && a.status !== 'live') return 1;
      if (a.status === 'upcoming' && b.status === 'final') return -1;
      if (b.status === 'upcoming' && a.status === 'final') return 1;
      const dateA = a.gameDate ? new Date(a.gameDate).getTime() : 0;
      const dateB = b.gameDate ? new Date(b.gameDate).getTime() : 0;
      return dateA - dateB;
    });
  }, [matches, sport, currentNFLWeek]);

  const checkMatchEnded = (m?: Match | null): boolean => {
    if (!m) return false;
    const status = (m.status || '').toLowerCase();
    const state = String((m as any).status?.type?.state || '').toLowerCase();
    const qTime = String(m.quarter_time || m.quarterTime || m.periodLabel || '').toLowerCase();
    const isCompleted = Boolean((m as any).completed || (m as any).isFinal);
    return (
      status === 'final' ||
      status === 'post' ||
      state === 'post' ||
      state === 'final' ||
      isCompleted ||
      qTime.includes('final')
    );
  };

  const isPlayerGameEnded = (player: Competitor): boolean => {
    const pTeam = normalizeCode(player.teamCode || (player as any).team || '');
    const m = activeMatches.find((match) => {
      const a = normalizeCode(match.awayTeamCode || match.away_team || '');
      const h = normalizeCode(match.homeTeamCode || match.home_team || '');
      return a === pTeam || h === pTeam;
    });
    return checkMatchEnded(m);
  };

  const displayMatches = useMemo(() => {
    if (!hideEndedGames) return activeMatches;
    return activeMatches.filter((m) => !checkMatchEnded(m));
  }, [activeMatches, hideEndedGames]);

  const matchGroups = useMemo(() => {
    const live: Array<{ match: Match; pairKey: string; label: string }> = [];
    const upcoming: Array<{ match: Match; pairKey: string; label: string }> = [];
    const final: Array<{ match: Match; pairKey: string; label: string }> = [];

    const source = hideEndedGames ? displayMatches : activeMatches;

    for (const m of source) {
      const away = normalizeCode(m.awayTeamCode || m.away_team || '');
      const home = normalizeCode(m.homeTeamCode || m.home_team || '');
      const pairKey = `${away}@${home}`;
      const isLive = m.status === 'live';
      const isFinal = checkMatchEnded(m);
      const timeInfo = m.quarter_time || m.quarterTime || m.periodLabel || 'Scheduled';

      const label = `${away} @ ${home} — ${isLive ? '🔴 LIVE' : isFinal ? '🔒 FINAL' : timeInfo}`;
      const item = { match: m, pairKey, label };
      if (isLive) live.push(item);
      else if (isFinal) {
        if (!hideEndedGames) final.push(item);
      } else {
        upcoming.push(item);
      }
    }
    return { live, upcoming, final };
  }, [activeMatches, displayMatches, hideEndedGames]);

  const activeMatchObj = useMemo(() => {
    if (!selectedGameFilter || selectedGameFilter === 'ALL') return null;
    return (
      activeMatches.find((m) => {
        const away = normalizeCode(m.awayTeamCode || m.away_team || '');
        const home = normalizeCode(m.homeTeamCode || m.home_team || '');
        return `${away}@${home}` === selectedGameFilter || m.id === selectedGameFilter;
      }) || null
    );
  }, [selectedGameFilter, activeMatches]);

  // If user turns on "Hide Ended Games" while looking at an ended game filter, reset filter to 'ALL'
  useEffect(() => {
    if (hideEndedGames && selectedGameFilter !== 'ALL' && activeMatchObj) {
      if (checkMatchEnded(activeMatchObj)) {
        setSelectedGameFilter('ALL');
      }
    }
  }, [hideEndedGames, selectedGameFilter, activeMatchObj]);

  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      // Jump by nearly the full visible container width (85%) so 1 click advances to the next entire set of games!
      const jumpDistance = Math.max(carouselRef.current.clientWidth * 0.85, 320);
      carouselRef.current.scrollBy({
        left: direction === 'right' ? jumpDistance : -jumpDistance,
        behavior: 'smooth',
      });
    }
  };

  const currentMatchIndex = useMemo(() => {
    if (!selectedGameFilter || selectedGameFilter === 'ALL') return -1;
    const list = displayMatches.length > 0 ? displayMatches : activeMatches;
    return list.findIndex((m) => {
      const away = normalizeCode(m.awayTeamCode || m.away_team || '');
      const home = normalizeCode(m.homeTeamCode || m.home_team || '');
      return `${away}@${home}` === selectedGameFilter || m.id === selectedGameFilter;
    });
  }, [selectedGameFilter, activeMatches, displayMatches]);

  const handlePrevGameMobile = () => {
    const list = displayMatches.length > 0 ? displayMatches : activeMatches;
    if (list.length === 0) return;
    if (currentMatchIndex === -1) {
      const last = list[list.length - 1];
      const away = normalizeCode(last.awayTeamCode || last.away_team || '');
      const home = normalizeCode(last.homeTeamCode || last.home_team || '');
      setSelectedGameFilter(`${away}@${home}`);
    } else if (currentMatchIndex === 0) {
      setSelectedGameFilter('ALL');
    } else {
      const prev = list[currentMatchIndex - 1];
      const away = normalizeCode(prev.awayTeamCode || prev.away_team || '');
      const home = normalizeCode(prev.homeTeamCode || prev.home_team || '');
      setSelectedGameFilter(`${away}@${home}`);
    }
  };

  const handleNextGameMobile = () => {
    const list = displayMatches.length > 0 ? displayMatches : activeMatches;
    if (list.length === 0) return;
    if (currentMatchIndex === -1) {
      const first = list[0];
      const away = normalizeCode(first.awayTeamCode || first.away_team || '');
      const home = normalizeCode(first.homeTeamCode || first.home_team || '');
      setSelectedGameFilter(`${away}@${home}`);
    } else if (currentMatchIndex === list.length - 1) {
      setSelectedGameFilter('ALL');
    } else {
      const next = list[currentMatchIndex + 1];
      const away = normalizeCode(next.awayTeamCode || next.away_team || '');
      const home = normalizeCode(next.homeTeamCode || next.home_team || '');
      setSelectedGameFilter(`${away}@${home}`);
    }
  };

  const filteredPlayers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = Array.isArray(allPlayers) ? [...allPlayers] : [];

    // Ensure all starter manifest athletes for NFL (3 QBs, 3 RBs, 6 WR/TE per team) are fully available in the pool
    if (sport === 'nfl') {
      const existingKeys = new Set(
        list.map((p) => `${(p.displayName || p.shortName || '').trim().toLowerCase()}__${normalizeCode(p.teamCode || (p as any).team || '')}`)
      );
      for (const defP of DEFAULT_NFL_COMPETITORS) {
        const normKey = `${(defP.displayName || defP.shortName || '').trim().toLowerCase()}__${normalizeCode(defP.teamCode || (defP as any).team || '')}`;
        if (!existingKeys.has(normKey)) {
          list.push(defP);
          existingKeys.add(normKey);
        }
      }
    }

    // Filter by selected game matchup: strictly include BOTH Away AND Home teams, NEVER other teams
    if (selectedGameFilter && selectedGameFilter !== 'ALL') {
      let filterAway = '';
      let filterHome = '';

      if (selectedGameFilter.includes('@')) {
        const parts = selectedGameFilter.split('@');
        filterAway = normalizeCode(parts[0]);
        filterHome = normalizeCode(parts[1]);
      } else if (activeMatchObj) {
        filterAway = normalizeCode(activeMatchObj.awayTeamCode || activeMatchObj.away_team || '');
        filterHome = normalizeCode(activeMatchObj.homeTeamCode || activeMatchObj.home_team || '');
      }

      if (filterAway || filterHome) {
        list = list.filter((p) => {
          const playerTeam = normalizeCode(p.teamCode || (p as any).team || '');
          return (filterAway && playerTeam === filterAway) || (filterHome && playerTeam === filterHome);
        });
      }
    }

    // 1. Enforce Position Requirement (1 QB, 1 RB, 1 WR/TE)
    if (positionFilter === 'ELIGIBLE') {
      list = list.filter((p) => isPositionAllowedForSlot(activeSlot, p.position, sport));
    }

    // 2. Hide Ended Games if toggle enabled
    if (hideEndedGames) {
      list = list.filter((p) => !isPlayerGameEnded(p));
    }

    if (q) {
      list = list.filter(
        (p) =>
          (p.displayName && p.displayName.toLowerCase().includes(q)) ||
          (p.shortName && p.shortName.toLowerCase().includes(q)) ||
          (p.teamName && p.teamName.toLowerCase().includes(q)) ||
          (p.teamCode && p.teamCode.toLowerCase().includes(q)) ||
          (p.position && p.position.toLowerCase().includes(q))
      );
    }

    // STRICT DEDUPLICATION: Ensure no player or ID ever appears more than once under any circumstance
    const seenKeys = new Set<string>();
    const seenIds = new Set<string>();
    const deduped: Competitor[] = [];

    for (const player of list) {
      if (!player) continue;
      const idKey = player.id ? String(player.id) : '';
      const nameKey = `${(player.displayName || player.shortName || '').trim().toLowerCase()}__${(player.teamCode || (player as any).team || '').trim().toUpperCase()}`;

      if (idKey && seenIds.has(idKey)) continue;
      if (nameKey && nameKey !== '__' && seenKeys.has(nameKey)) continue;

      if (idKey) seenIds.add(idKey);
      if (nameKey && nameKey !== '__') seenKeys.add(nameKey);
      deduped.push(player);
    }

    return deduped.sort((a, b) => {
      // Prioritize active and upcoming games over ended games
      const aEnded = isPlayerGameEnded(a);
      const bEnded = isPlayerGameEnded(b);
      if (aEnded !== bEnded) {
        return aEnded ? 1 : -1;
      }

      const aTeam = normalizeCode(a.teamCode || (a as any).team || '');
      const bTeam = normalizeCode(b.teamCode || (b as any).team || '');
      const awayTeam = activeMatchObj
        ? normalizeCode(activeMatchObj.awayTeamCode || activeMatchObj.away_team || '')
        : selectedGameFilter.includes('@')
        ? normalizeCode(selectedGameFilter.split('@')[0])
        : '';

      // 1. Group by Team (Away team first, then Home team)
      if (awayTeam && aTeam !== bTeam) {
        if (aTeam === awayTeam) return -1;
        if (bTeam === awayTeam) return 1;
        return aTeam.localeCompare(bTeam);
      }

      // 2. Group by Position (QB -> RB -> WR -> TE)
      const posA = POSITION_ORDER[a.position] || 99;
      const posB = POSITION_ORDER[b.position] || 99;
      if (posA !== posB) {
        return posA - posB;
      }

      // 3. Sort by Points / Last Points descending within same position
      const scoreA = (a as any).current_score ?? (a as any).last_game_score ?? a.score ?? 0;
      const scoreB = (b as any).current_score ?? (b as any).last_game_score ?? b.score ?? 0;
      return scoreB - scoreA;
    });
  }, [allPlayers, selectedGameFilter, activeMatchObj, searchQuery, positionFilter, hideEndedGames, activeSlot, sport]);

  const selectedPlayerNormKeys = useMemo(() => {
    const keys = new Set<string>();
    const list = Array.isArray(allPlayers) ? allPlayers : [];
    for (const p of list) {
      if (selectedPlayerIds.includes(p.id)) {
        const normKey = `${(p.displayName || p.shortName || '').trim().toLowerCase()}_${(p.teamCode || '').trim().toUpperCase()}`;
        keys.add(normKey);
      }
    }
    return keys;
  }, [allPlayers, selectedPlayerIds]);

  if (!isOpen) return null;

  const targetTitle = SLOT_TITLES[activeSlot] || 'STAR';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-[96vw] max-w-5xl bg-[#fae5b8] border-4 border-[#1a2238] shadow-[0_8px_0_0_#0a0f1d] p-3 sm:p-5 rounded-xs my-auto max-h-[92vh] flex flex-col box-border gap-2.5 sm:gap-3">
        <div className="flex items-center justify-between pb-2 sm:pb-3 border-b-2 border-[#d4a86a] shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base sm:text-xl select-none">{sport === 'nba' ? '🏀' : '⭐'}</span>
            <h2 className="font-pixel text-sm sm:text-base text-[#5c3509] tracking-wider uppercase font-bold">
              PICK {currentSlotDef.label}: {currentSlotDef.positionReq}
            </h2>
            <span className="hidden sm:inline-block px-2 py-0.5 bg-[#ecd7ab] border border-[#c99a57] rounded-2xs font-pixel text-[9px] text-[#784610] font-bold">
              SLOT REQ: {currentSlotDef.positionFullName}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="touch-manipulation px-2.5 py-1 bg-[#b91c1c] hover:bg-[#dc2626] text-[#fae5b8] border-2 border-[#1a2238] flex items-center justify-center gap-1 cursor-pointer shadow-[0_2px_0_0_#450a0a] active:translate-y-0.5 transition-all font-pixel text-xs rounded-2xs"
            title="Close Picker"
          >
            <span>✕</span>
            <span>CLOSE</span>
          </button>
        </div>

        {/* Universal Game Matchup Bar (Mobile + Desktop Friendly) */}
        <div className="flex flex-col gap-1.5 p-2 bg-[#ecd7ab]/90 rounded-xs border-2 border-[#c99a57] shadow-inner shrink-0">
          <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
            {/* Quick Game Selector Dropdown (Instant 1-tap jump to any game on mobile or desktop) */}
            <div className="flex-1 min-w-[200px] relative">
              <select
                value={selectedGameFilter}
                onChange={(e) => setSelectedGameFilter(e.target.value)}
                className="w-full py-1.5 pl-2 pr-7 bg-[#fae5b8] border-2 border-[#1a2238] rounded-xs font-pixel text-[11px] sm:text-xs text-[#5c3509] font-bold focus:outline-hidden focus:border-[#12579b] cursor-pointer shadow-xs"
              >
                <option value="ALL">
                  🏈 ALL {displayMatches.length} MATCHUPS {hideEndedGames ? '(ENDED HIDDEN)' : '(ENTIRE SLATE)'}
                </option>
                {matchGroups.live.length > 0 && (
                  <optgroup label="🔴 LIVE IN PROGRESS">
                    {matchGroups.live.map((g) => (
                      <option key={g.pairKey} value={g.pairKey}>{g.label}</option>
                    ))}
                  </optgroup>
                )}
                {matchGroups.upcoming.length > 0 && (
                  <optgroup label="⏰ UPCOMING / SCHEDULED">
                    {matchGroups.upcoming.map((g) => (
                      <option key={g.pairKey} value={g.pairKey}>{g.label}</option>
                    ))}
                  </optgroup>
                )}
                {matchGroups.final.length > 0 && (
                  <optgroup label="🔒 COMPLETED / FINAL">
                    {matchGroups.final.map((g) => (
                      <option key={g.pairKey} value={g.pairKey}>{g.label}</option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            {/* Toggle Multi-column Game Grid */}
            <button
              type="button"
              onClick={() => setShowAllGamesGrid(!showAllGamesGrid)}
              className={`touch-manipulation px-2.5 py-1.5 font-pixel text-[10px] sm:text-xs border-2 rounded-xs shrink-0 whitespace-nowrap cursor-pointer transition-all active:translate-y-0.5 font-bold ${
                showAllGamesGrid
                  ? 'bg-[#12579b] text-[#fae5b8] border-[#0a2d52] shadow-xs'
                  : 'bg-[#fae5b8] hover:bg-[#fff7ed] text-[#5c3509] border-[#1a2238] shadow-xs'
              }`}
            >
              📋 {showAllGamesGrid ? 'HIDE GRID' : `ALL ${displayMatches.length} GAMES`}
            </button>

            {selectedGameFilter !== 'ALL' && (
              <button
                type="button"
                onClick={() => setSelectedGameFilter('ALL')}
                className="touch-manipulation px-2 py-1.5 bg-[#b91c1c] hover:bg-[#dc2626] text-white border-2 border-[#1a2238] rounded-xs font-pixel text-[10px] font-bold shrink-0 cursor-pointer shadow-xs active:translate-y-0.5"
                title="Reset to All Matchups"
              >
                ✕ CLEAR
              </button>
            )}
          </div>

          {/* Expanded 1-Tap Matchup Grid (Opens smoothly on mobile & desktop) */}
          {showAllGamesGrid && (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-1.5 pt-2 border-t border-[#c99a57] max-h-44 overflow-y-auto pr-1">
              <button
                type="button"
                onClick={() => {
                  setSelectedGameFilter('ALL');
                  setShowAllGamesGrid(false);
                }}
                className={`touch-manipulation px-2 py-1.5 rounded-xs font-pixel text-[10px] font-bold border-2 text-center truncate cursor-pointer transition-all ${
                  selectedGameFilter === 'ALL'
                    ? 'bg-[#12579b] text-[#fae5b8] border-[#0a2d52] shadow-xs'
                    : 'bg-[#fae5b8] hover:bg-[#fff7ed] text-[#5c3509] border-[#c99a57]'
                }`}
              >
                ★ ALL STARS
              </button>
              {displayMatches.map((m) => {
                const away = normalizeCode(m.awayTeamCode || m.away_team || '');
                const home = normalizeCode(m.homeTeamCode || m.home_team || '');
                const pairKey = `${away}@${home}`;
                const isSel = selectedGameFilter === pairKey;
                const isLive = m.status === 'live';
                const isFinal = checkMatchEnded(m);
                return (
                  <button
                    key={pairKey || m.id}
                    type="button"
                    onClick={() => {
                      setSelectedGameFilter(pairKey);
                      setShowAllGamesGrid(false);
                    }}
                    className={`touch-manipulation px-1.5 py-1.5 rounded-xs font-pixel text-[10px] font-bold border-2 text-center truncate cursor-pointer transition-all ${
                      isSel
                        ? 'bg-[#12579b] text-[#fae5b8] border-[#0a2d52] ring-2 ring-[#38bdf8]'
                        : isLive
                        ? 'bg-[#ffe8e8] text-[#900] border-[#c0392b]'
                        : isFinal
                        ? 'bg-[#d8c29a] text-[#5c3509]/80 border-[#b38947]'
                        : 'bg-[#fae5b8] hover:bg-[#fff7ed] text-[#5c3509] border-[#c99a57]'
                    }`}
                  >
                    {isLive && <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse mr-1" />}
                    {away}@{home}
                  </button>
                );
              })}
            </div>
          )}

          {/* Universal Matchup Carousel Track (Mobile & Desktop Friendly) */}
          <div className="flex items-center gap-1.5 pt-1.5 border-t border-[#c99a57]/60">
            <button
              type="button"
              onClick={() => setSelectedGameFilter('ALL')}
              className={`touch-manipulation px-2.5 py-1 sm:px-3 sm:py-1.5 font-pixel text-[10px] sm:text-xs border-2 rounded-xs shrink-0 whitespace-nowrap cursor-pointer transition-all font-bold shadow-xs active:translate-y-0.5 ${
                selectedGameFilter === 'ALL'
                  ? 'bg-[#12579b] text-[#fae5b8] border-[#0a2d52]'
                  : 'bg-[#fae5b8] hover:bg-[#fff7ed] text-[#5c3509] border-[#c99a57]'
              }`}
            >
              ★ ALL
            </button>

            <button
              type="button"
              onClick={() => scrollCarousel('left')}
              className="touch-manipulation w-8 h-8 sm:w-9 sm:h-9 bg-[#fae5b8] hover:bg-[#fff7ed] text-[#5c3509] border-2 border-[#1a2238] rounded-xs font-pixel text-xs sm:text-sm shrink-0 cursor-pointer flex items-center justify-center font-bold shadow-xs active:translate-y-0.5"
              title="Previous set of games"
              aria-label="Previous set of games"
            >
              ◀
            </button>

            <div
              ref={carouselRef}
              className="flex-1 flex items-center gap-1 sm:gap-1.5 overflow-x-auto overflow-y-hidden no-scrollbar touch-pan-x scroll-smooth min-w-0 py-0.5"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {displayMatches.map((match) => {
                const away = normalizeCode(match.awayTeamCode || match.away_team || '');
                const home = normalizeCode(match.homeTeamCode || match.home_team || '');
                const pairKey = `${away}@${home}`;
                const isSelected = selectedGameFilter === pairKey || selectedGameFilter === match.id;
                const isLive = match.status === 'live';
                const isFinal = checkMatchEnded(match);

                return (
                  <button
                    key={pairKey || match.id}
                    type="button"
                    onClick={() => setSelectedGameFilter(isSelected ? 'ALL' : pairKey)}
                    className={`touch-manipulation px-2.5 py-1 sm:px-3 sm:py-1.5 font-pixel text-[10px] sm:text-[11px] border-2 rounded-xs shrink-0 whitespace-nowrap cursor-pointer transition-all flex items-center gap-1 font-bold ${
                      isSelected
                        ? 'bg-[#12579b] text-[#fae5b8] border-[#0a2d52] font-bold ring-2 ring-[#38bdf8] shadow-xs'
                        : isLive
                        ? 'bg-[#ffe8e8] text-[#900] border-[#c0392b] font-bold'
                        : isFinal
                        ? 'bg-[#d8c29a] text-[#5c3509]/80 border-[#b38947]'
                        : 'bg-[#fae5b8] hover:bg-[#fff7ed] text-[#5c3509] border-[#c99a57]'
                    }`}
                  >
                    {isLive && <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />}
                    <span>{away}@{home}</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => scrollCarousel('right')}
              className="touch-manipulation w-8 h-8 sm:w-9 sm:h-9 bg-[#fae5b8] hover:bg-[#fff7ed] text-[#5c3509] border-2 border-[#1a2238] rounded-xs font-pixel text-xs sm:text-sm shrink-0 cursor-pointer flex items-center justify-center font-bold shadow-xs active:translate-y-0.5"
              title="Next set of games"
              aria-label="Next set of games"
            >
              ▶
            </button>
          </div>

          {/* Position Constraint & Ended-Game Filter Controls */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1.5 border-t border-[#c99a57]/50">
            <div className="flex items-center gap-1 flex-wrap">
              <span className="font-pixel text-[9px] text-[#784610] font-bold uppercase mr-1">
                POSITION:
              </span>
              <button
                type="button"
                onClick={() => setPositionFilter('ELIGIBLE')}
                className={`touch-manipulation px-2 py-1 font-pixel text-[9px] sm:text-[10px] border-2 rounded-xs font-bold cursor-pointer transition-all active:translate-y-0.5 ${
                  positionFilter === 'ELIGIBLE'
                    ? 'bg-[#15803d] text-white border-[#052e16] shadow-xs'
                    : 'bg-[#fae5b8] text-[#5c3509] border-[#c99a57]'
                }`}
              >
                ★ ONLY {currentSlotDef.positionReq}
              </button>
              <button
                type="button"
                onClick={() => setPositionFilter('ALL')}
                className={`touch-manipulation px-2 py-1 font-pixel text-[9px] sm:text-[10px] border-2 rounded-xs font-bold cursor-pointer transition-all active:translate-y-0.5 ${
                  positionFilter === 'ALL'
                    ? 'bg-[#12579b] text-[#fae5b8] border-[#0a2d52] shadow-xs'
                    : 'bg-[#fae5b8] text-[#5c3509] border-[#c99a57]'
                }`}
              >
                ALL POSITIONS
              </button>
            </div>

            <label className="flex items-center gap-1.5 cursor-pointer font-pixel text-[9px] sm:text-[10px] text-[#5c3509] font-bold select-none bg-[#fae5b8] px-2 py-1 rounded-xs border border-[#c99a57]">
              <input
                type="checkbox"
                checked={hideEndedGames}
                onChange={(e) => setHideEndedGames(e.target.checked)}
                className="cursor-pointer accent-[#12579b]"
              />
              <span>🔒 HIDE ENDED GAMES</span>
            </label>
          </div>
        </div>

        <div className="relative flex items-center shrink-0">
          <Search size={14} className="absolute left-2.5 text-[#784610] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${sport.toUpperCase()} player or team...`}
            className="w-full pl-8 pr-7 py-1.5 sm:py-2 bg-[#ebd2a4] border-2 border-[#c99a57] text-[#5c3509] font-retro text-xs sm:text-sm rounded-xs placeholder:text-[#8c735d] focus:outline-hidden focus:border-[#12579b] focus:bg-[#fae9c8]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 text-[#784610] hover:text-[#5c3509] font-pixel text-xs p-1 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto pr-1 min-h-0">
          {filteredPlayers.length === 0 ? (
            <div className="text-center py-10 font-retro text-xs text-[#784610]">
              No {sport.toUpperCase()} stars match the selected filter.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
              {filteredPlayers.map((player, index) => {
                const isCurrentSlot = player.id === currentSlotPlayerId;
                const playerNorm = `${(player.displayName || player.shortName || '').trim().toLowerCase()}_${(player.teamCode || '').trim().toUpperCase()}`;
                const isSelectedElsewhere = (selectedPlayerIds.includes(player.id) || selectedPlayerNormKeys.has(playerNorm)) && !isCurrentSlot;
                const { firstName, lastName } = splitPlayerFirstLastName(player.displayName);

                const pTeam = normalizeCode(player.teamCode || (player as any).team || '');
                const playerMatch = activeMatches.find((m) => {
                  const away = normalizeCode(m.awayTeamCode || m.away_team || '');
                  const home = normalizeCode(m.homeTeamCode || m.home_team || '');
                  return away === pTeam || home === pTeam;
                });
                const scoringInfo = getPlayerScoringDisplay(player, playerMatch, sport);

                const isPosAllowed = isPositionAllowedForSlot(activeSlot, player.position, sport);
                const isGameEnded = isPlayerGameEnded(player) || scoringInfo.gameState === 'post' || scoringInfo.isFinal;

                return (
                  <div
                    key={player.id || `${player.displayName}_${index}`}
                    onClick={() => onInspectPlayer?.(player)}
                    className={`touch-manipulation bg-[#fae5b8] hover:bg-[#fff9ea] border-2 rounded-xs p-2.5 sm:p-3 flex flex-col items-center justify-between min-h-[290px] h-auto cursor-pointer transition-all shadow-[0_3px_0_0_#d4a86a] hover:shadow-[0_4px_0_0_#0a2d52] active:translate-y-0.5 relative select-none ${
                      isCurrentSlot
                        ? 'border-[#12579b] ring-2 ring-[#12579b]/40 bg-[#f8efdc]'
                        : isGameEnded
                        ? 'border-[#78716c] bg-[#e7e5e4]/50 opacity-80'
                        : !isPosAllowed
                        ? 'border-[#b91c1c] bg-[#fee2e2]/40'
                        : isSelectedElsewhere
                        ? 'border-[#c99a57] opacity-60'
                        : 'border-[#c99a57] hover:border-[#12579b]'
                    }`}
                    title={`Tap to inspect stats for ${player.displayName}`}
                  >
                    {/* Status Ribbon (Ended Game or Invalid Position Warning) */}
                    {isGameEnded ? (
                      <div className="w-full mb-1 flex items-center justify-center">
                        <span className="w-full text-center px-1 py-0.5 bg-[#44403c] text-[#f5f5f4] font-pixel text-[8px] font-bold rounded-2xs border border-[#292524]">
                          🔒 GAME COMPLETED (FINAL)
                        </span>
                      </div>
                    ) : !isPosAllowed ? (
                      <div className="w-full mb-1 flex items-center justify-center">
                        <span className="w-full text-center px-1 py-0.5 bg-[#b91c1c] text-white font-pixel text-[8px] font-bold rounded-2xs border border-[#7f1d1d]">
                          NEEDS {currentSlotDef.positionReq}
                        </span>
                      </div>
                    ) : null}

                    <div className="w-full flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1.5">
                        {sport === 'nfl' && player.teamCode ? (
                          <PixelHelmet
                            teamCode={player.teamCode}
                            size={28}
                            className="drop-shadow-xs"
                          />
                        ) : (
                          <span className="px-1.5 py-0.5 bg-[#12579b] text-[#fae5b8] font-pixel text-[9px] font-bold rounded-2xs">
                            {player.teamCode}
                          </span>
                        )}
                        <span className="font-pixel text-[10px] font-bold text-[#5c3509] tracking-wider">
                          {player.teamCode}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 font-pixel text-[9px] font-bold text-[#784610]">
                        <span>#{player.uniformNumber || '—'}</span>
                        <span className="opacity-70">•</span>
                        <span className={!isPosAllowed ? 'text-[#b91c1c] font-black underline' : ''}>
                          {player.position || 'STAR'}
                        </span>
                      </div>
                    </div>

                    <div className="my-1 sm:my-2 flex items-center justify-center">
                      {(() => {
                        const visualAvatar = getPlayerVisualAvatar(player, playerMatch);
                        return (
                          <PixelPlayerSprite
                            avatar={visualAvatar}
                            number={visualAvatar.number || player.uniformNumber}
                            size="md"
                            withShadow={false}
                            sport={sport}
                            animate={false}
                            isOnFire={false}
                          />
                        );
                      })()}
                    </div>

                    <div className="text-center leading-tight mb-1.5 w-full px-1">
                      {firstName && (
                        <div className="font-pixel text-[9px] sm:text-[10px] text-[#784610] uppercase truncate">
                          {firstName}
                        </div>
                      )}
                      <div className="font-pixel text-xs sm:text-sm font-bold text-[#5c3509] uppercase truncate">
                        {lastName || player.shortName}
                      </div>
                    </div>

                    <div className="w-full mb-2 py-0.5 px-2 bg-[#ebd2a4] border border-[#c99a57] rounded-2xs text-center shadow-2xs">
                      {scoringInfo.gameState === 'pre' ? (
                        <div className="flex flex-col items-center">
                          <span className="font-pixel text-xs sm:text-sm font-bold text-[#475569]">
                            0 PTS
                          </span>
                          {scoringInfo.hasHistoricalData && (
                            <span className="font-pixel text-[8px] text-[#784610] font-bold">
                              Last: {scoringInfo.historicalScore}p
                            </span>
                          )}
                        </div>
                      ) : scoringInfo.gameState === 'in' ? (
                        <div className="flex items-center justify-center gap-1">
                          <span className="font-pixel text-xs sm:text-sm font-bold text-[#b91c1c] animate-pulse">
                            {scoringInfo.activeScore} PTS
                          </span>
                          <span className="font-pixel text-[8px] text-white bg-[#b91c1c] px-1 py-0.5 rounded-2xs">
                            LIVE
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          <span className="font-pixel text-xs sm:text-sm font-bold text-[#12579b]">
                            {scoringInfo.activeScore} PTS
                          </span>
                          <span className="font-pixel text-[8px] text-[#93c5fd] bg-[#12579b] px-1 py-0.5 rounded-2xs">
                            FINAL
                          </span>
                        </div>
                      )}
                    </div>

                    {isGameEnded ? (
                      <button
                        type="button"
                        disabled
                        className="touch-manipulation w-full shrink-0 min-h-[36px] py-1.5 px-2 bg-[#78716c] text-[#f5f5f4] border-2 border-[#44403c] font-pixel text-[10px] sm:text-xs rounded-xs cursor-not-allowed text-center flex items-center justify-center gap-1 font-bold opacity-80"
                      >
                        <span>🔒</span>
                        <span>GAME ENDED</span>
                      </button>
                    ) : !isPosAllowed ? (
                      <button
                        type="button"
                        disabled
                        className="touch-manipulation w-full shrink-0 min-h-[36px] py-1.5 px-2 bg-[#991b1b] text-[#fef2f2] border-2 border-[#7f1d1d] font-pixel text-[9px] sm:text-[10px] rounded-xs cursor-not-allowed text-center flex items-center justify-center gap-1 font-bold opacity-85"
                      >
                        <span>✕</span>
                        <span>NEEDS {currentSlotDef.positionReq}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectPlayer(player, activeSlot);
                          onClose();
                        }}
                        className="touch-manipulation w-full shrink-0 min-h-[36px] py-1.5 px-2 bg-[#15803d] hover:bg-[#16a34a] text-white border-2 border-[#052e16] font-pixel text-[10px] sm:text-xs rounded-xs cursor-pointer shadow-[0_2px_0_0_#022c11] active:translate-y-0.5 transition-all text-center flex items-center justify-center gap-1.5 font-bold"
                      >
                        <span>⭐</span>
                        <span>{isCurrentSlot ? 'SELECTED' : isSelectedElsewhere ? 'SWAP' : 'PICK'}</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};