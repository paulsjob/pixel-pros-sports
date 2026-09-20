import React, { useState, useMemo } from 'react';
import { Competitor, Match, ActiveSlot, SportId } from '../types';
import { PixelPlayerSprite } from './PixelPlayerSprite';
import { Search } from 'lucide-react';
import { splitPlayerFirstLastName } from '../utils/formatters';
import { getCurrentNFLWeek } from '../lib/espnSync';
import { getPlayerScoringDisplay, DEFAULT_NFL_MATCHES } from '../utils/teamData';
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

const TEAM_ALIAS_MAP: Record<string, string> = {
  KAN: 'KC',
  KANSASCITY: 'KC',
  DENVER: 'DEN',
  GNB: 'GB',
  GREENBAY: 'GB',
  NWE: 'NE',
  NEWENGLAND: 'NE',
  NOR: 'NO',
  NEWORLEANS: 'NO',
  SFO: 'SF',
  SANFRANCISCO: 'SF',
  TAM: 'TB',
  TAMPABAY: 'TB',
  WAS: 'WSH',
  WASHINGTON: 'WSH',
  LVR: 'LV',
  LASVEGAS: 'LV',
};

function normalizeCode(code?: string): string {
  if (!code) return '';
  const clean = code.trim().toUpperCase().replace(/\s+/g, '');
  return TEAM_ALIAS_MAP[clean] || clean;
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
  const currentNFLWeek = getCurrentNFLWeek();

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

  const filteredPlayers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let list = Array.isArray(allPlayers) ? [...allPlayers] : [];

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
  }, [allPlayers, selectedGameFilter, activeMatchObj, searchQuery]);

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
      <div className="relative w-full max-w-3xl bg-[#fae5b8] border-4 border-[#1a2238] shadow-[0_8px_0_0_#0a0f1d] p-3 sm:p-5 rounded-xs my-auto max-h-[92vh] flex flex-col box-border gap-2.5 sm:gap-3">
        <div className="flex items-center justify-between pb-2 sm:pb-3 border-b-2 border-[#d4a86a] shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-base sm:text-xl select-none">{sport === 'nba' ? '🏀' : '⭐'}</span>
            <h2 className="font-pixel text-sm sm:text-base text-[#5c3509] tracking-wider uppercase font-bold">
              PICK {targetTitle} ({sport.toUpperCase()})
            </h2>
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

        <div className="shrink-0 flex flex-nowrap items-center gap-1 sm:gap-1.5 p-1.5 bg-[#ecd7ab]/75 rounded-xs border-2 border-[#c99a57] overflow-x-auto overflow-y-hidden no-scrollbar touch-pan-x shadow-inner">
          <div className="px-2 py-1 bg-[#271604] text-[#fae5b8] font-pixel text-[9px] sm:text-[10px] rounded-xs border border-[#5c3509] shrink-0 font-bold whitespace-nowrap shadow-xs">
            {sport === 'nfl' ? `WEEK ${currentNFLWeek} (${activeMatches.length} GAMES)` : `TONIGHT (${activeMatches.length} GAMES)`}
          </div>

          <button
            type="button"
            onClick={() => setSelectedGameFilter('ALL')}
            className={`touch-manipulation px-2.5 py-1 font-pixel text-[10px] sm:text-xs border-2 rounded-xs shrink-0 whitespace-nowrap cursor-pointer transition-all active:translate-y-0.5 ${
              selectedGameFilter === 'ALL'
                ? 'bg-[#12579b] text-[#fae5b8] border-[#0a2d52] shadow-[0_2px_0_0_#051a30] font-bold ring-2 ring-[#38bdf8]'
                : 'bg-[#fae5b8] hover:bg-[#fff7ed] text-[#5c3509] border-[#c99a57]'
            }`}
          >
            ★ ALL {sport.toUpperCase()} STARS
          </button>

          {activeMatches.map((match) => {
            const away = normalizeCode(match.awayTeamCode || match.away_team || '');
            const home = normalizeCode(match.homeTeamCode || match.home_team || '');
            const pairKey = `${away}@${home}`;
            const isSelected = selectedGameFilter === pairKey || selectedGameFilter === match.id;

            const isLive = match.status === 'live';
            const isFinal = match.status === 'final' || String((match as any).status?.type?.state || '').toLowerCase() === 'post';

            return (
              <button
                key={pairKey || match.id}
                type="button"
                onClick={() => setSelectedGameFilter(isSelected ? 'ALL' : pairKey)}
                className={`touch-manipulation px-2 py-1 font-pixel text-[9px] sm:text-[10px] border-2 rounded-xs shrink-0 whitespace-nowrap cursor-pointer transition-all active:translate-y-0.5 flex items-center gap-1 ${
                  isSelected
                    ? 'bg-[#12579b] text-[#fae5b8] border-[#0a2d52] shadow-[0_2px_0_0_#051a30] font-bold ring-2 ring-[#38bdf8]'
                    : isLive
                    ? 'bg-[#ffe8e8] hover:bg-[#ffd5d5] text-[#900] border-[#c0392b] font-bold'
                    : isFinal
                    ? 'bg-[#d8c29a] hover:bg-[#fae5b8] text-[#5c3509]/85 border-[#b38947]'
                    : 'bg-[#fae5b8] hover:bg-[#fff7ed] text-[#5c3509] border-[#c99a57]'
                }`}
                title={`${away} vs ${home}${isLive ? ' (LIVE)' : isFinal ? ' (FINAL)' : ''}`}
              >
                {isLive && <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />}
                <span className="font-bold">{away}</span>
                <span className="opacity-70 mx-0.5">@</span>
                <span className="font-bold">{home}</span>
                {isFinal && <span className="text-[7px] text-[#784610] font-sans uppercase font-bold opacity-75 ml-0.5">FIN</span>}
              </button>
            );
          })}
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

                const playerMatch = matches?.find(m =>
                  m.home_team === player.teamCode ||
                  m.away_team === player.teamCode ||
                  m.homeTeamCode === player.teamCode ||
                  m.awayTeamCode === player.teamCode
                );
                const scoringInfo = getPlayerScoringDisplay(player, playerMatch, sport);

                return (
                  <div
                    key={player.id || `${player.displayName}_${index}`}
                    onClick={() => onInspectPlayer?.(player)}
                    className={`touch-manipulation bg-[#fae5b8] hover:bg-[#fff9ea] border-2 rounded-xs p-2.5 sm:p-3 flex flex-col items-center justify-between min-h-[290px] h-auto cursor-pointer transition-all shadow-[0_3px_0_0_#d4a86a] hover:shadow-[0_4px_0_0_#0a2d52] active:translate-y-0.5 relative select-none ${
                      isCurrentSlot
                        ? 'border-[#12579b] ring-2 ring-[#12579b]/40 bg-[#f8efdc]'
                        : isSelectedElsewhere
                        ? 'border-[#c99a57] opacity-60'
                        : 'border-[#c99a57] hover:border-[#12579b]'
                    }`}
                    title={`Tap to inspect stats for ${player.displayName}`}
                  >
                    <div className="w-full flex items-center justify-between gap-1 mb-1">
                      <span className="px-1.5 py-0.5 bg-[#12579b] text-[#fae5b8] font-pixel text-[9px] font-bold rounded-2xs">
                        {player.teamCode}
                      </span>
                      <div className="flex items-center gap-1 font-pixel text-[9px] font-bold text-[#784610]">
                        <span>#{player.uniformNumber || '—'}</span>
                        <span className="opacity-70">•</span>
                        <span>{player.position || 'STAR'}</span>
                      </div>
                    </div>

                    <div className="my-1 sm:my-2 flex items-center justify-center">
                      <PixelPlayerSprite
                        avatar={player.avatar}
                        number={player.uniformNumber}
                        size="md"
                        withShadow={false}
                        sport={sport}
                        animate={false}
                        isOnFire={false}
                      />
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