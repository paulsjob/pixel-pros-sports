import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Competitor, ActiveSlot, SquadSlots, Match, SportId } from '../types';
import { PixelPlayerSprite } from './PixelPlayerSprite';
import { PixelHelmet } from './PixelHelmet';
import { Sparkles, X, ChevronLeft, ChevronRight, HelpCircle, CheckCircle2, ListFilter } from 'lucide-react';
import { splitPlayerFirstLastName } from '../utils/formatters';
import {
  formatRealtimeGameSituationCompact,
  getPlayerScoringDisplay,
  NFL_SLOT_DEFS,
  NBA_SLOT_DEFS,
  isPositionAllowedForSlot,
  sortMatchesByKickoffAndStatus,
  isMatchEnded,
  DEFAULT_NFL_COMPETITORS,
  resolvePlayerInPool,
} from '../utils/teamData';
import { getCurrentNFLWeek } from '../lib/espnSync';

interface MyTeamViewProps {
  slots: SquadSlots;
  userName: string;
  roomCode: string;
  previousRoom?: string;
  sport?: SportId;
  isLocked?: boolean;
  matches?: Match[];
  activeSlateId?: string;
  onSelectSlate?: (slateId: string) => void;
  slatePicksStatus?: Record<string, { filled?: number; count?: number; isLocked: boolean }>;
  onCommitUserName?: (name: string) => void;
  onCommitRoomCode?: (code: string) => void;
  onSelectSlot: (slotKey: ActiveSlot) => void;
  onClearSlot: (slotKey: ActiveSlot) => void;
  onToggleLock?: () => void;
  onLockedSlotAttempt?: () => void;
  onInspectPlayer?: (player: Competitor) => void;
  onRequestCreateSquad?: () => void;
}

export const MyTeamView: React.FC<MyTeamViewProps> = ({
  slots,
  userName,
  roomCode,
  previousRoom,
  sport = 'nfl',
  isLocked = false,
  matches = [],
  activeSlateId = 'SUPERSTARS',
  onSelectSlate,
  slatePicksStatus = {},
  onCommitRoomCode,
  onSelectSlot,
  onClearSlot,
  onToggleLock,
  onLockedSlotAttempt,
  onInspectPlayer,
  onRequestCreateSquad,
}) => {
  const slotDefs = sport === 'nba' ? NBA_SLOT_DEFS : NFL_SLOT_DEFS;
  const isEmptySquadState = !userName || !userName.trim();

  // UX-Led Handholding States
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showSlateJumpModal, setShowSlateJumpModal] = useState(false);

  // Sort games by kickoff time: live first, then upcoming chronologically, finals at end
  const sortedMatches = useMemo(() => {
    return sortMatchesByKickoffAndStatus(matches || []);
  }, [matches]);

  // Unified list of all slates in this league room: Superstars first, then chronological matchups
  const allSlates = useMemo(() => {
    const list: {
      id: string;
      label: string;
      subLabel: string;
      awayTeam?: string;
      homeTeam?: string;
      isSuperstars: boolean;
      match?: Match;
    }[] = [
      {
        id: 'SUPERSTARS',
        label: '⭐ WEEKLY SUPERSTARS',
        subLabel: 'Draft 3 from ANY team',
        isSuperstars: true,
      },
    ];

    sortedMatches.forEach((m) => {
      const away = (m.awayTeamCode || m.away_team || '').trim().toUpperCase();
      const home = (m.homeTeamCode || m.home_team || '').trim().toUpperCase();
      const pairKey = `${away}@${home}`;
      list.push({
        id: pairKey,
        label: pairKey,
        subLabel: `${away} vs ${home}`,
        awayTeam: away,
        homeTeam: home,
        isSuperstars: false,
        match: m,
      });
    });

    return list;
  }, [sortedMatches]);

  const currentSlateIndex = useMemo(() => {
    const idx = allSlates.findIndex((s) => s.id === activeSlateId);
    return idx >= 0 ? idx : 0;
  }, [allSlates, activeSlateId]);

  const currentSlate = allSlates[currentSlateIndex] || allSlates[0];
  const prevSlate = currentSlateIndex > 0 ? allSlates[currentSlateIndex - 1] : null;
  const nextSlate = currentSlateIndex < allSlates.length - 1 ? allSlates[currentSlateIndex + 1] : null;

  // Auto-scroll the horizontal carousel whenever the selected slate changes
  const slateScrollRef = useRef<HTMLDivElement>(null);
  const activeSlateBtnRef = useRef<HTMLButtonElement>(null);
  const previousActiveSlateRef = useRef(activeSlateId);

  useEffect(() => {
    if (previousActiveSlateRef.current === activeSlateId) {
      return;
    }
    previousActiveSlateRef.current = activeSlateId;

    const container = slateScrollRef.current;
    const btn = activeSlateBtnRef.current;
    if (container && btn) {
      const cRect = container.getBoundingClientRect();
      const bRect = btn.getBoundingClientRect();
      // Only scroll if the active button is not already fully visible in the carousel
      const isOffLeft = bRect.left < cRect.left;
      const isOffRight = bRect.right > cRect.right;
      if (isOffLeft || isOffRight) {
        const offset = isOffLeft
          ? bRect.left - cRect.left - 16
          : bRect.right - cRect.right + 16;
        container.scrollBy({ left: offset, behavior: 'smooth' });
      }
    }
  }, [activeSlateId]);

  const handleScrollCarousel = (direction: 'left' | 'right') => {
    if (slateScrollRef.current) {
      const scrollAmount = direction === 'left' ? -180 : 180;
      slateScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Quest / Progress calculations for hand-holding
  const superstarsStatus = slatePicksStatus?.['SUPERSTARS'];
  const superstarsFilled = superstarsStatus?.filled ?? superstarsStatus?.count ?? 0;
  const isSuperstarsComplete = superstarsFilled === 3;

  const totalGameSlates = Math.max(0, allSlates.length - 1);
  const gamesCompleteCount = allSlates.filter(
    (s) => !s.isSuperstars && ((slatePicksStatus?.[s.id]?.filled ?? slatePicksStatus?.[s.id]?.count ?? 0) === 3)
  ).length;

  const totalSlatesCompleted = (isSuperstarsComplete ? 1 : 0) + gamesCompleteCount;
  const totalPossiblePicks = allSlates.length * 3;
  const totalPicksMade = allSlates.reduce((sum, s) => {
    const st = slatePicksStatus?.[s.id];
    return sum + (st?.filled ?? st?.count ?? 0);
  }, 0);
  const totalProgressPercent = totalPossiblePicks > 0 ? Math.round((totalPicksMade / totalPossiblePicks) * 100) : 0;

  // Count how many stars are set in current slate
  const filledSlots = [slots.star1, slots.star2, slots.star3].filter(Boolean) as Competitor[];
  const filledCount = filledSlots.length;
  const distinctStarIds = new Set(filledSlots.map((s) => s.id));
  const hasThreeDistinct = filledSlots.length === 3 && distinctStarIds.size === 3;

  // Strict Roster Position Enforcement: In NFL, squad must be 1 QB, 1 RB, 1 WR/TE
  const areAllPositionsValid = slotDefs.every(({ key }) => {
    const p = slots[key];
    return p ? isPositionAllowedForSlot(key, p, sport) : false;
  });
  const isRosterValid = hasThreeDistinct && areAllPositionsValid;

  // Strict guard condition: A squad with < 3 distinct stars or invalid positions CAN NEVER BE LOCKED
  const effectiveIsLocked = !isEmptySquadState && isRosterValid && Boolean(isLocked);

  return (
    <div className="w-full box-border">
      
      {/* Centered Hero Focus: 3 Star Podiums */}
      <div className="pixel-box-cream p-2 sm:p-4 md:p-6 rounded-xs w-full shadow-[0_8px_0_0_#0a0f1d] border-4 border-[#1a2238] box-border">
        
        {/* Clean Header Bar: Squad Title on Left, Single All Games Jump on Right */}
        <div className="flex items-center justify-between border-b-2 border-[#d4a86a] pb-1.5 sm:pb-2 mb-2 sm:mb-3 gap-2">
          <h2 className="font-pixel text-xs sm:text-base text-[#5c3509] tracking-wider uppercase flex items-center gap-1.5 min-w-0 flex-1">
            <Sparkles size={14} className="text-[#b45309] shrink-0" />
            <span className="truncate">
              {sport === 'nba'
                ? userName
                  ? `${userName.toUpperCase()}'S NBA STARS`
                  : 'YOUR NBA STARS'
                : userName
                ? `${userName.toUpperCase()}'S NFL STARS`
                : 'YOUR NFL STARS'}
            </span>
          </h2>

          {/* Single Clean All Slates Jump Button */}
          <button
            type="button"
            onClick={() => setShowSlateJumpModal(true)}
            className="touch-manipulation px-2.5 py-1 bg-[#12579b] hover:bg-[#196bb5] text-[#fae5b8] border border-[#0a2d52] rounded-xs font-pixel text-[9px] sm:text-[10px] font-bold flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs whitespace-nowrap active:translate-y-0.5"
            title="Open game schedule & checklist"
          >
            <span>ALL GAMES ({totalSlatesCompleted}/{allSlates.length})</span>
            <span className="text-[9px] text-[#facc15]">▾</span>
          </button>
        </div>

        {/* Clean Slate Bar: Left Arrow, Full-Width Carousel, Right Arrow */}
        <div className="mb-2.5 sm:mb-3 p-1 sm:p-1.5 bg-[#ecd7ab]/90 border-2 border-[#c99a57] rounded-xs shadow-inner">
          <div className="flex items-center gap-1 w-full">
            {/* Left Slate Arrow: Scrolls button carousel left */}
            <button
              type="button"
              onClick={() => handleScrollCarousel('left')}
              className="touch-manipulation w-7 h-7 sm:w-8 sm:h-8 bg-[#ebd2a4] hover:bg-[#fae5b8] text-[#5c3509] border-2 border-[#c99a57] hover:border-[#b48340] rounded-xs font-pixel text-xs font-bold shadow-xs active:translate-y-0.5 shrink-0 flex items-center justify-center cursor-pointer"
              title="Scroll Games Left"
              aria-label="Scroll Games Left"
            >
              <ChevronLeft size={18} className="text-[#5c3509]" />
            </button>

            {/* Scrollable Slate Carousel - Full Remaining Width */}
            <div
              ref={slateScrollRef}
              className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 scroll-smooth px-1 scroll-px-2"
            >
              {/* 1. ⭐ SUPERSTARS */}
              <button
                ref={activeSlateId === 'SUPERSTARS' ? activeSlateBtnRef : undefined}
                type="button"
                onClick={() => onSelectSlate && onSelectSlate('SUPERSTARS')}
                className={`touch-manipulation px-2 sm:px-2.5 py-1 rounded-xs font-pixel text-[9px] sm:text-[10px] border-2 cursor-pointer transition-all flex items-center gap-1 sm:gap-1.5 shrink-0 whitespace-nowrap shadow-xs ${
                  activeSlateId === 'SUPERSTARS'
                    ? 'bg-[#12579b] text-[#fae5b8] border-[#0a2d52] ring-2 ring-[#38bdf8] font-bold'
                    : 'bg-[#fae5b8] hover:bg-[#fff7ed] text-[#5c3509] border-[#c99a57]'
                }`}
              >
                <Sparkles size={11} className={activeSlateId === 'SUPERSTARS' ? 'text-[#facc15]' : 'text-[#b45309]'} />
                <span>SUPERSTARS</span>
                {slatePicksStatus?.['SUPERSTARS']?.isLocked && (
                  <span className="text-[8px] px-1 py-0.2 rounded-2xs font-bold shrink-0 bg-[#0a2d52] text-[#38bdf8]">
                    🔒
                  </span>
                )}
              </button>

              {/* 2. All Matches in Kickoff Order */}
              {sortedMatches.map((m) => {
                const away = (m.awayTeamCode || m.away_team || '').trim().toUpperCase();
                const home = (m.homeTeamCode || m.home_team || '').trim().toUpperCase();
                const pairKey = `${away}@${home}`;
                const isSelected = activeSlateId === pairKey;
                const isLive = m.status === 'live';
                const isFinal = isMatchEnded(m);
                const statusInfo = slatePicksStatus?.[pairKey];

                return (
                  <button
                    key={pairKey || m.id}
                    ref={isSelected ? activeSlateBtnRef : undefined}
                    type="button"
                    onClick={() => onSelectSlate && onSelectSlate(pairKey)}
                    className={`touch-manipulation px-2 py-1 rounded-xs font-pixel text-[9px] sm:text-[10px] border-2 cursor-pointer transition-all flex items-center gap-1 shrink-0 whitespace-nowrap shadow-xs min-w-max ${
                      isSelected
                        ? 'bg-[#12579b] text-[#fae5b8] border-[#0a2d52] ring-2 ring-[#38bdf8] font-bold'
                        : isLive
                        ? 'bg-[#ffe8e8] hover:bg-[#fed7d7] text-[#900] border-[#c0392b]'
                        : isFinal
                        ? 'bg-[#d8c29a] hover:bg-[#ebd2a4] text-[#5c3509]/80 border-[#b38947]'
                        : 'bg-[#fae5b8] hover:bg-[#fff7ed] text-[#5c3509] border-[#c99a57]'
                    }`}
                    title={`${away} vs ${home}${isLive ? ' (LIVE)' : isFinal ? ' (FINAL)' : ''}`}
                  >
                    {isLive && <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse shrink-0" />}
                    <span>{away}@{home}</span>
                    {statusInfo?.isLocked && (
                      <span className="text-[8px] px-1 py-0.2 rounded-2xs font-bold shrink-0 bg-[#0a2d52] text-[#38bdf8]">
                        🔒
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Right Slate Arrow: Scrolls button carousel right */}
            <button
              type="button"
              onClick={() => handleScrollCarousel('right')}
              className="touch-manipulation w-7 h-7 sm:w-8 sm:h-8 bg-[#ebd2a4] hover:bg-[#fae5b8] text-[#5c3509] border-2 border-[#c99a57] hover:border-[#b48340] rounded-xs font-pixel text-xs font-bold shadow-xs active:translate-y-0.5 shrink-0 flex items-center justify-center cursor-pointer"
              title="Scroll Games Right"
              aria-label="Scroll Games Right"
            >
              <ChevronRight size={18} className="text-[#5c3509]" />
            </button>
          </div>
        </div>

        {/* 3 Prominent Star Podiums with generous breathing room & Empty State Overlay */}
        <div className="relative">
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3 md:gap-6 w-full transition-opacity duration-200 ${isEmptySquadState ? 'opacity-25 pointer-events-none select-none' : ''}`}>
            {slotDefs.map(({ key, label, positionReq, positionFullName }) => {
              const rawPlayer = slots[key];
              const player = rawPlayer
                ? (!rawPlayer.position || rawPlayer.position === 'STAR' || rawPlayer.position === 'ATHLETE'
                    ? resolvePlayerInPool(rawPlayer.id, DEFAULT_NFL_COMPETITORS) ||
                      DEFAULT_NFL_COMPETITORS.find(
                        (c) => c.displayName.toLowerCase() === rawPlayer.displayName?.toLowerCase()
                      ) ||
                      rawPlayer
                    : rawPlayer)
                : null;
              const isPositionValid = player ? isPositionAllowedForSlot(key, player, sport) : true;
              const { firstName, lastName } = player
                ? splitPlayerFirstLastName(player.displayName)
                : { firstName: '', lastName: '' };

              const playerTeam = (player?.teamCode || '').trim().toUpperCase();
              const currentNFLWeek = getCurrentNFLWeek();
              const playerMatch = player
                ? (matches || []).find((m) => {
                    if (sport === 'nfl' && m.week && m.week !== currentNFLWeek) return false;
                    const h = (m.homeTeamCode || m.home_team || '').trim().toUpperCase();
                    const a = (m.awayTeamCode || m.away_team || '').trim().toUpperCase();
                    return h === playerTeam || a === playerTeam;
                  })
                : null;

              const gameSituation = playerMatch ? formatRealtimeGameSituationCompact(playerMatch) : null;

              // NBA Stats
              const threePm = Number(player?.stats?.three_pm ?? player?.stats?.threes ?? 0);
              const reb = Number(player?.stats?.reb ?? player?.stats?.rebounds ?? 0);
              const ast = Number(player?.stats?.ast ?? player?.stats?.assists ?? 0);

              // NFL Stats
              const passYds = Number(
                player?.stats?.pass_yds ??
                player?.stats?.passing_yards ??
                player?.stats?.passingYards ??
                0
              );
              const rushYds = Number(
                player?.stats?.rush_yds ??
                player?.stats?.rushing_yards ??
                player?.stats?.rushingYards ??
                0
              );
              const recYds = Number(
                player?.stats?.rec_yds ??
                player?.stats?.receiving_yards ??
                player?.stats?.receivingYards ??
                0
              );
              const totalYds = passYds + rushYds + recYds;
              const tds = Number(
                player?.stats?.tds ??
                player?.stats?.touchdowns ??
                0
              );

              const scoringInfo = player ? getPlayerScoringDisplay(player, playerMatch, sport) : null;
              const statsLine = scoringInfo
                ? scoringInfo.activeStatsLine
                : sport === 'nba'
                ? `${threePm} 3PM · ${reb} REB · ${ast} AST`
                : tds > 0 || totalYds > 0
                ? `${tds} TD · ${totalYds} YDS`
                : '0 TD · 0 YDS';

              const isOnFire = sport === 'nba' && ((scoringInfo?.activeScore || player?.score || 0) >= 40);
              const isInjuredOrQuestionable = player?.injuryStatus === 'I' || player?.injuryStatus === 'Q';

              return (
                <div
                  key={key}
                  onClick={() => {
                    if (isEmptySquadState) {
                      onRequestCreateSquad?.();
                      return;
                    }
                    if (player) {
                      onInspectPlayer?.(player);
                    } else {
                      if (effectiveIsLocked) {
                        if (onLockedSlotAttempt) onLockedSlotAttempt();
                        return;
                      }
                      onSelectSlot(key);
                    }
                  }}
                  className={`touch-manipulation rounded-xs transition-all box-border min-h-0 overflow-hidden ${
                    player
                      ? 'min-h-[70px] md:min-h-[310px] p-2 sm:p-3.5 md:p-4'
                      : 'min-h-[56px] sm:min-h-[62px] md:min-h-[310px] p-1.5 md:p-4'
                  } flex flex-col justify-between ${
                    effectiveIsLocked && !player
                      ? 'bg-[#e4cb9c] border-3 border-[#94713a] cursor-not-allowed shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]'
                      : isInjuredOrQuestionable
                      ? 'bg-[#d8d9dc] border-3 border-[#9ca3af] cursor-pointer hover:bg-[#e2e3e6] group shadow-[0_3px_0_0_#9ca3af] active:translate-y-0.5'
                      : 'bg-[#ebd2a4] border-3 border-[#c99a57] cursor-pointer hover:bg-[#fae9c8] group shadow-[0_3px_0_0_#a77b3b] active:translate-y-0.5'
                  }`}
                >
                  {/* Star Slot Badge Header (Shown on desktop always, on mobile only when player selected) */}
                  <div className={`w-full ${player ? 'flex' : 'hidden md:flex'} items-center justify-between mb-1 md:mb-2`}>
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="px-2 py-0.5 md:px-2.5 md:py-1 bg-[#12579b] text-[#fae5b8] font-pixel text-[9px] md:text-xs border border-[#0a2d52] rounded-xs shadow-xs font-bold tracking-wider whitespace-nowrap">
                        {label}
                      </span>
                      <span className="px-1.5 py-0.5 bg-[#451a03] text-[#fde047] font-pixel text-[8px] md:text-[9px] border border-[#271604] rounded-2xs font-bold whitespace-nowrap">
                        {positionReq}
                      </span>
                      {player && player.injuryStatus === 'I' && (
                        <span
                          className="px-1.5 py-0.5 bg-[#dc2626] text-white font-pixel text-[8px] md:text-[9px] border border-[#991b1b] rounded-2xs font-bold whitespace-nowrap shadow-2xs"
                          title={player.injuryDetail || 'INJURED / OUT'}
                        >
                          I
                        </span>
                      )}
                      {player && player.injuryStatus === 'Q' && (
                        <span
                          className="px-1.5 py-0.5 bg-[#ea580c] text-white font-pixel text-[8px] md:text-[9px] border border-[#c2410c] rounded-2xs font-bold whitespace-nowrap shadow-2xs"
                          title={player.injuryDetail || 'QUESTIONABLE'}
                        >
                          Q
                        </span>
                      )}
                      {player && !isPositionValid && (
                        <span className="px-1 py-0.5 bg-[#b91c1c] text-white font-pixel text-[7px] md:text-[8px] rounded-2xs font-bold uppercase animate-pulse">
                          WRONG POS
                        </span>
                      )}
                    </div>

                    {/* [X] Reset button */}
                    {player && !effectiveIsLocked && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onClearSlot(key);
                        }}
                        className="touch-manipulation w-6 h-6 md:w-7 md:h-7 bg-[#b91c1c] hover:bg-[#dc2626] text-[#fae5b8] border border-[#1a2238] flex items-center justify-center font-pixel text-[11px] md:text-xs rounded-2xs active:translate-y-0.5 shrink-0 shadow-xs cursor-pointer"
                        title={`Clear ${label}`}
                      >
                        <X size={13} className="md:w-4 md:h-4" />
                      </button>
                    )}

                    {isLocked && (
                      <span className="text-[#15803d] font-pixel text-xs" title="Slot Locked">
                        🔒
                      </span>
                    )}
                  </div>

                  {player ? (
                    <>
                      {/* Mobile Horizontal Layout */}
                      <div
                        className="md:hidden flex items-center gap-2.5 w-full my-0.5"
                        style={isInjuredOrQuestionable ? { filter: 'grayscale(100%)' } : undefined}
                      >
                        <div className="shrink-0 w-[54px] flex flex-col items-center justify-center">
                          <PixelPlayerSprite
                            avatar={player.avatar}
                            number={player.uniformNumber}
                            size="sm"
                            withShadow={true}
                            animate={true}
                            sport={sport}
                            isOnFire={isOnFire}
                            injuryStatus={player.injuryStatus}
                          />
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col justify-center leading-tight">
                          <div className="font-pixel text-xs text-[#451a03] font-bold uppercase truncate">
                            {player.displayName}
                          </div>
                          <div className="font-retro text-[11px] text-[#5c3509] font-bold truncate mt-0.5 flex items-center gap-1.5">
                            <span>#{player.uniformNumber} · {player.teamCode} · {player.depthOrder || (player.depthRank ? `${player.position}${player.depthRank}` : player.position) || 'STAR'}</span>
                            {player.injuryStatus === 'I' && (
                              <span
                                className="px-1 py-0.2 bg-[#dc2626] text-white font-pixel text-[8px] font-black rounded-2xs border border-[#991b1b] shadow-2xs shrink-0"
                                title={player.injuryDetail || 'INJURED / OUT'}
                              >
                                I
                              </span>
                            )}
                            {player.injuryStatus === 'Q' && (
                              <span
                                className="px-1 py-0.2 bg-[#ea580c] text-white font-pixel text-[8px] font-black rounded-2xs border border-[#c2410c] shadow-2xs shrink-0"
                                title={player.injuryDetail || 'QUESTIONABLE'}
                              >
                                Q
                              </span>
                            )}
                          </div>

                          {/* Context / Game State line */}
                          {scoringInfo?.gameState === 'pre' ? (
                            <div className="font-pixel text-[9px] text-[#784610] font-bold truncate mt-0.5">
                              PRE-GAME · {scoringInfo.contextBadgeText}
                            </div>
                          ) : gameSituation ? (
                            <div className="font-pixel text-[9px] whitespace-nowrap overflow-hidden mt-0.5">
                              {gameSituation.isLive ? (
                                <span className="text-[#b91c1c] flex items-center gap-1 font-bold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] animate-pulse shrink-0" />
                                  {gameSituation.statusLine} · {gameSituation.scoreLine}
                                </span>
                              ) : gameSituation.isFinal ? (
                                <span className="text-[#64748b] font-bold">
                                  {gameSituation.statusLine} · {gameSituation.scoreLine}
                                </span>
                              ) : (
                                <span className="text-[#784610] font-bold">
                                  {gameSituation.statusLine} · {gameSituation.scoreLine}
                                </span>
                              )}
                            </div>
                          ) : null}

                          {scoringInfo?.gameState === 'pre' && scoringInfo.hasHistoricalData ? (
                            <div className="font-pixel text-[8px] text-[#784610] bg-[#fae5b8] px-1 py-0.5 rounded-2xs border border-[#c99a57] inline-block mt-0.5 truncate max-w-full">
                              LAST: {scoringInfo.historicalScore}p ({scoringInfo.historicalStats})
                            </div>
                          ) : (
                            <div className="font-pixel text-[9px] text-[#5c3509] font-bold truncate mt-0.5">
                              {statsLine}
                            </div>
                          )}
                        </div>

                        <div className="shrink-0 flex flex-col items-end justify-center pl-1">
                          {scoringInfo?.gameState === 'pre' ? (
                            <div className="px-2 py-1 bg-[#475569] text-[#fae5b8] font-pixel text-xs border-2 border-[#1e293b] shadow-[0_2px_0_0_#0f172a] rounded-xs font-bold whitespace-nowrap text-center">
                              0 PTS
                              <div className="text-[7px] font-retro text-[#cbd5e1] font-normal leading-none">PRE</div>
                            </div>
                          ) : scoringInfo?.gameState === 'in' ? (
                            <div className="px-2 py-1.5 bg-[#b91c1c] text-[#fef08a] font-pixel text-xs border-2 border-[#7f1d1d] shadow-[0_2px_0_0_#450a0a] rounded-xs font-bold whitespace-nowrap text-center animate-pulse">
                              {scoringInfo.activeScore} PTS
                            </div>
                          ) : (
                            <div className="px-2 py-1.5 bg-[#12579b] text-[#fae5b8] font-pixel text-xs border-2 border-[#0a2d52] shadow-[0_2px_0_0_#051a30] rounded-xs font-bold whitespace-nowrap text-center">
                              {scoringInfo ? `${scoringInfo.activeScore.toLocaleString()} PTS` : '0 PTS'}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Desktop Vertical Layout */}
                      <div
                        className="hidden md:flex md:flex-1 md:flex-col md:items-center md:justify-between md:w-full"
                        style={isInjuredOrQuestionable ? { filter: 'grayscale(100%)' } : undefined}
                      >
                        <div className="my-2">
                          <PixelPlayerSprite
                            avatar={player.avatar}
                            number={player.uniformNumber}
                            size="md"
                            withShadow={true}
                            animate={true}
                            sport={sport}
                            isOnFire={isOnFire}
                            injuryStatus={player.injuryStatus}
                          />
                        </div>

                        <div className="w-full text-center my-1 px-1">
                          {firstName && (
                            <div className="font-pixel text-xs sm:text-sm text-[#784610] tracking-wider leading-tight uppercase">
                              {firstName}
                            </div>
                          )}
                          <div className="font-pixel text-sm sm:text-base text-[#451a03] tracking-wide leading-tight font-bold uppercase break-words">
                            {lastName}
                          </div>

                          <div className="mt-0.5 font-retro text-xs sm:text-[13px] text-[#5c3509] font-bold flex items-center justify-center gap-1.5">
                            <span>#{player.uniformNumber} · {player.teamCode} · {player.depthOrder || (player.depthRank ? `${player.position}${player.depthRank}` : player.position) || 'STAR'}</span>
                            {player.injuryStatus === 'I' && (
                              <span
                                className="px-1 py-0.2 bg-[#dc2626] text-white font-pixel text-[8px] font-black rounded-2xs border border-[#991b1b] shadow-2xs"
                                title={player.injuryDetail || 'INJURED / OUT'}
                              >
                                I
                              </span>
                            )}
                            {player.injuryStatus === 'Q' && (
                              <span
                                className="px-1 py-0.2 bg-[#ea580c] text-white font-pixel text-[8px] font-black rounded-2xs border border-[#c2410c] shadow-2xs"
                                title={player.injuryDetail || 'QUESTIONABLE'}
                              >
                                Q
                              </span>
                            )}
                          </div>

                          {/* Desktop Game Situation & Matchup Line */}
                          {scoringInfo?.gameState === 'pre' ? (
                            <div className="w-full text-center mt-1">
                              <div className="font-pixel text-[10px] text-[#784610] font-bold">
                                {playerMatch ? `${playerMatch.awayTeamCode || playerMatch.away_team} @ ${playerMatch.homeTeamCode || playerMatch.home_team} · ` : ''}PRE-GAME · {scoringInfo.contextBadgeText}
                              </div>
                            </div>
                          ) : gameSituation ? (
                            <div className="w-full text-center mt-1">
                              {gameSituation.isLive ? (
                                <div className="flex items-center justify-center gap-1.5 font-pixel text-[10px] text-[#b91c1c] font-bold">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] animate-pulse shrink-0" />
                                  <span>{gameSituation.statusLine}</span>
                                  <span className="text-[#991b1b]">·</span>
                                  <span>{gameSituation.scoreLine}</span>
                                </div>
                              ) : gameSituation.isFinal ? (
                                <div className="font-pixel text-[10px] text-[#64748b] font-bold">
                                  {gameSituation.statusLine} · {gameSituation.scoreLine}
                                </div>
                              ) : (
                                <div className="font-retro text-xs sm:text-[13px] text-[#784610]/90 font-bold">
                                  {gameSituation.statusLine} · {gameSituation.scoreLine}
                                </div>
                              )}
                            </div>
                          ) : null}
                        </div>

                        {/* Middle Stat Section: Clean Single Line (Zero Bloat, No False Last-Game Rows) */}
                        <div className="w-full text-center mt-1.5">
                          <span className="font-pixel text-[10px] sm:text-[11px] text-[#5c3509] font-bold whitespace-nowrap">
                            {scoringInfo?.gameState === 'pre'
                              ? (sport === 'nba' ? '0 3PM · 0 REB · 0 AST' : '0 TD · 0 YDS')
                              : statsLine}
                          </span>
                        </div>

                        <div className="w-full mt-2 text-center">
                          {scoringInfo?.gameState === 'pre' ? (
                            <div className="w-full py-1.5 sm:py-2 bg-[#475569] text-[#fae5b8] font-pixel text-xs sm:text-sm border-2 border-[#1e293b] shadow-[0_3px_0_0_#0f172a] rounded-xs font-bold whitespace-nowrap">
                              0 PTS
                              <div className="text-[8px] sm:text-[9px] font-retro text-[#cbd5e1] font-normal">
                                (READY FOR KICKOFF)
                              </div>
                            </div>
                          ) : scoringInfo?.gameState === 'in' ? (
                            <div className="w-full py-1.5 sm:py-2 bg-[#b91c1c] text-[#fef08a] font-pixel text-xs sm:text-sm border-2 border-[#7f1d1d] shadow-[0_3px_0_0_#450a0a] rounded-xs font-bold whitespace-nowrap animate-pulse">
                              {scoringInfo.activeScore} PTS <span className="text-[9px] text-white">LIVE</span>
                            </div>
                          ) : (
                            <div className="w-full py-1.5 sm:py-2 bg-[#12579b] text-[#fae5b8] font-pixel text-xs sm:text-sm border-2 border-[#0a2d52] shadow-[0_3px_0_0_#051a30] rounded-xs font-bold whitespace-nowrap">
                              {scoringInfo ? `${scoringInfo.activeScore.toLocaleString()} PTS` : '0 PTS'}{' '}
                              <span className="text-[9px] text-[#93c5fd]">FINAL</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Mobile Empty Slot - Perfectly contained touch target within card */}
                      <div className="md:hidden flex-1 flex items-center justify-center w-full py-2.5 px-2 border-2 border-dashed border-[#b45309] rounded-xs group-hover:border-[#12579b] group-hover:bg-[#f6ebd4] transition-all animate-pulse box-border">
                        <span className="font-pixel text-[10px] sm:text-xs text-[#b45309] group-hover:text-[#12579b] font-bold whitespace-nowrap text-center">
                          + TAP TO PICK {positionReq}{' '}
                          {currentSlate.isSuperstars
                            ? '(ANY TEAM)'
                            : `(${currentSlate.awayTeam || ''} or ${currentSlate.homeTeam || ''})`}
                        </span>
                      </div>

                      {/* Desktop Empty Slot */}
                      <div className="hidden md:flex md:flex-1 md:flex-col md:items-center md:justify-center md:py-6 md:w-full md:border-2 md:border-dashed md:border-[#b45309] rounded-xs group-hover:border-[#12579b] group-hover:bg-[#f6ebd4] transition-all my-2 animate-pulse">
                        <div className="w-12 h-12 rounded-full bg-[#fae5b8] border-2 border-[#b45309] flex items-center justify-center text-[#b45309] group-hover:text-[#12579b] group-hover:border-[#12579b] group-hover:scale-110 transition-all mb-2 shadow-xs">
                          <span className="font-pixel text-xl font-bold">+</span>
                        </div>
                        <span className="font-pixel text-xs sm:text-sm text-[#b45309] group-hover:text-[#12579b] text-center px-1 font-bold">
                          + TAP TO PICK {positionReq}
                        </span>
                        <span className="font-retro text-[11px] text-[#784610] mt-1 font-bold text-center px-2">
                          {currentSlate.isSuperstars
                            ? 'Any team across the NFL'
                            : `${currentSlate.awayTeam} or ${currentSlate.homeTeam} only`}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Zero-State Arcade Card */}
          {isEmptySquadState && (
            <div
              onClick={onRequestCreateSquad}
              className="absolute inset-0 bg-[#080d1a]/85 backdrop-blur-[2px] rounded-xs flex flex-col items-center justify-center p-5 sm:p-8 cursor-pointer group z-10 transition-all border-3 border-[#16a34a] shadow-[0_0_25px_rgba(22,163,74,0.35)]"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#15233d] border-3 border-[#38bdf8] flex items-center justify-center text-2xl sm:text-3xl mb-3 shadow-[0_4px_0_0_#0a0f1d] group-hover:scale-110 transition-transform">
                {sport === 'nba' ? '🏀' : '🎮'}
              </div>

              <h3 className="font-pixel text-base sm:text-xl text-[#fde047] text-center font-bold tracking-wider mb-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                {sport === 'nba' ? 'READY FOR TIP-OFF?' : 'READY FOR KICKOFF?'}
              </h3>

              <div className="mb-3 px-3 py-1 bg-[#1e293b]/90 border border-[#38bdf8]/40 rounded-xs text-center font-pixel text-[10px] sm:text-xs text-[#e0f2fe]">
                {sport === 'nba' ? '🏀' : '🎮'} NEW LEAGUE ROOM • READY TO PLAY
              </div>

              <p className="font-retro text-xs sm:text-sm text-[#93c5fd] text-center max-w-sm mb-4 leading-relaxed font-bold">
                No squads drafted here yet. Tap below to create the first squad, or{' '}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const targetRoom = previousRoom || (sport === 'nba' ? 'HOOPS' : 'COUCH');
                    onCommitRoomCode?.(targetRoom);
                  }}
                  className="text-[#38bdf8] hover:text-white underline cursor-pointer font-bold inline-block"
                >
                  switch back to {previousRoom || (sport === 'nba' ? 'HOOPS' : 'COUCH')}
                </button>
                .
              </p>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRequestCreateSquad?.();
                }}
                className="touch-manipulation py-2.5 sm:py-3 px-5 sm:px-7 bg-[#16a34a] hover:bg-[#22c55e] text-white border-3 border-[#14532d] shadow-[0_4px_0_0_#052e16] rounded-xs font-pixel text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer font-bold select-none active:translate-y-0.5 animate-pulse transition-transform group-hover:scale-105"
              >
                <span className="text-[#fde047]">⚡</span>
                <span>CREATE FIRST SQUAD</span>
                <span className="text-[#fde047]">⚡</span>
              </button>
            </div>
          )}
        </div>

        {/* NBA Subtitle / Hint */}
        {sport === 'nba' && !isEmptySquadState && (
          <div className="mt-3 py-1.5 px-3 bg-[#f59e0b]/15 border border-[#b45309]/40 rounded-xs flex items-center justify-center gap-2 text-center">
            <span className="text-xs select-none">🏀</span>
            <span className="font-retro text-xs sm:text-[13px] text-[#78350f] font-bold">
              Zero position limits — pick any 3 superstars you want!
            </span>
          </div>
        )}
      </div>

      {/* Arcade Lock / Unlock Action Bar */}
      {!isEmptySquadState && (
        <div className="mt-2 sm:mt-4 w-full box-border">
          {hasThreeDistinct && effectiveIsLocked ? (
            <div className="w-full px-3 sm:px-5 py-2.5 sm:py-3.5 bg-[#064e3b] text-[#fae5b8] border-3 border-[#047857] shadow-[0_4px_0_0_#022c22] rounded-xs flex items-center justify-between gap-2 sm:gap-4 box-border">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <span className="font-pixel text-[11px] sm:text-sm text-[#fde047] font-bold tracking-wider truncate flex items-center gap-1.5 sm:gap-2">
                  <span className="text-xs sm:text-sm select-none">🔒</span>
                  <span>[ SQUAD LOCKED ]</span>
                </span>
              </div>
              {onToggleLock && (
                <button
                  type="button"
                  onClick={onToggleLock}
                  className="touch-manipulation px-3 sm:px-4 py-1.5 bg-[#b91c1c] hover:bg-[#dc2626] text-white font-pixel text-[10px] sm:text-xs border-2 border-[#7f1d1d] shadow-[0_2px_0_0_#450a0a] rounded-xs cursor-pointer transition-all whitespace-nowrap shrink-0 font-bold active:translate-y-0.5"
                  title="Unlock squad to make substitutions"
                >
                  <span>[ 🔓 UNLOCK SQUAD ]</span>
                </button>
              )}
            </div>
          ) : hasThreeDistinct && !areAllPositionsValid ? (
            <div className="w-full px-3 sm:px-5 py-2 sm:py-3 bg-[#450a0a] text-[#fef2f2] border-3 border-[#991b1b] shadow-[0_4px_0_0_#2b0606] rounded-xs flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 sm:gap-4 box-border">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <span className="font-pixel text-[10px] sm:text-xs text-[#fca5a5] font-bold tracking-wider">
                  ⚠️ ROSTER MUST BE: 1 QB, 1 RB, 1 WR/TE
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const invalidSlot = slotDefs.find(({ key }) => {
                    const p = slots[key];
                    return p && !isPositionAllowedForSlot(key, p, sport);
                  });
                  if (invalidSlot) {
                    onSelectSlot(invalidSlot.key);
                  }
                }}
                className="touch-manipulation px-3 sm:px-4 py-1.5 bg-[#dc2626] hover:bg-[#ef4444] text-white font-pixel text-[10px] sm:text-xs border-2 border-[#7f1d1d] shadow-[0_2px_0_0_#450a0a] rounded-xs cursor-pointer active:translate-y-0.5 whitespace-nowrap font-bold"
              >
                SWAP WRONG POSITION
              </button>
            </div>
          ) : isRosterValid ? (
            <div className="w-full p-2 sm:px-4 sm:py-2.5 bg-[#0f172a] text-[#fae5b8] border-3 border-[#1e293b] shadow-[0_4px_0_0_#020617] rounded-xs flex items-center justify-between gap-2 box-border overflow-hidden">
              <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                <span className="px-2 py-1 bg-[#1e293b] border border-[#334155] rounded-2xs font-pixel text-[10px] text-[#38bdf8] font-bold tracking-wider whitespace-nowrap">
                  ⭐ READY!
                </span>
              </div>
              <button
                type="button"
                onClick={onToggleLock}
                className="touch-manipulation w-full sm:w-auto sm:flex-1 py-2 sm:py-2.5 px-3 sm:px-6 bg-[#facc15] hover:bg-[#fde047] text-[#451a03] font-pixel text-xs sm:text-sm border-2 border-[#ca8a04] rounded-xs cursor-pointer shadow-[0_2px_0_0_#854d0e] active:translate-y-0.5 whitespace-nowrap text-center font-bold tracking-wider flex items-center justify-center gap-2"
              >
                <span>⚡</span>
                <span>LOCK SQUAD & NEXT GAME →</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled
              className="w-full py-2 sm:py-3 px-3 sm:px-4 bg-[#ebd2a4] text-[#784610] border-3 border-[#c99a57] rounded-xs font-pixel text-[10px] sm:text-xs flex items-center justify-center gap-2 opacity-80 cursor-not-allowed font-bold select-none box-border"
            >
              <span>🔒</span>
              <span>
                {sport === 'nfl'
                  ? 'PICK 1 QB, 1 RB, 1 WR/TE TO LOCK'
                  : 'PICK 3 DISTINCT STARS TO LOCK'}
              </span>
            </button>
          )}
        </div>
      )}

      {/* Grandparent & Kid Friendly: All Games Checklist Modal */}
      {showSlateJumpModal && (
        <div className="fixed inset-0 z-50 bg-[#080d1a]/85 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#faebd0] border-4 border-[#1a2238] rounded-xs max-w-lg w-full max-h-[85vh] flex flex-col shadow-[0_8px_0_0_#0a0f1d] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-3 bg-[#12579b] text-[#fae5b8] border-b-2 border-[#0a2d52] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-base select-none">📋</span>
                <h3 className="font-pixel text-xs sm:text-sm font-bold tracking-wide truncate">
                  ALL GAME SLATES ({totalSlatesCompleted}/{allSlates.length} SET)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSlateJumpModal(false)}
                className="w-7 h-7 bg-[#b91c1c] hover:bg-[#dc2626] text-white font-pixel text-xs rounded-2xs flex items-center justify-center cursor-pointer border border-[#7f1d1d] shadow-2xs active:translate-y-0.5 shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Sub-header instruction */}
            <div className="px-3 py-1.5 bg-[#fef3c7] border-b border-[#d97706]/30 font-retro text-[11px] sm:text-xs text-[#92400e]">
              Tap any game below to jump directly to it and pick your stars!
            </div>

            {/* Slate Cards List */}
            <div className="p-3 overflow-y-auto space-y-1.5 flex-1 max-h-[60vh]">
              {allSlates.map((s, idx) => {
                const isSelected = activeSlateId === s.id;
                const status = slatePicksStatus?.[s.id];
                const filled = status?.filled ?? status?.count ?? 0;
                const isLocked = Boolean(status?.isLocked);
                const isDone = filled === 3;
                const matchObj = s.match;
                const isLive = matchObj?.status === 'live';
                const isFinal = matchObj ? isMatchEnded(matchObj) : false;

                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      if (onSelectSlate) onSelectSlate(s.id);
                      setShowSlateJumpModal(false);
                    }}
                    className={`touch-manipulation w-full p-2.5 rounded-xs border-2 text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#12579b] text-[#fae5b8] border-[#0a2d52] ring-2 ring-[#38bdf8] shadow-xs'
                        : isDone
                        ? 'bg-[#dcfce7] hover:bg-[#bbf7d0] text-[#14532d] border-[#86efac]'
                        : 'bg-[#fff7ed] hover:bg-[#ffedd5] text-[#7c2d12] border-[#fed7aa]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-pixel text-[10px] text-[#784610] w-5 text-center shrink-0">
                        #{idx + 1}
                      </span>
                      <div className="shrink-0 text-base">
                        {s.isSuperstars ? '⭐' : '🏈'}
                      </div>
                      <div className="min-w-0">
                        <div className="font-pixel text-[10px] sm:text-xs font-bold truncate">
                          {s.isSuperstars ? 'WEEKLY SUPERSTARS' : s.label}
                        </div>
                        <div className="font-retro text-[9px] sm:text-[10px] opacity-80 truncate">
                          {s.subLabel}
                          {isLive && ' • LIVE NOW'}
                          {isFinal && ' • FINAL'}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5">
                      {isSelected && (
                        <span className="font-pixel text-[8px] px-1 py-0.2 bg-[#facc15] text-[#451a03] font-bold rounded-2xs">
                          CURRENT
                        </span>
                      )}
                      <span
                        className={`font-pixel text-[8px] sm:text-[9px] px-2 py-0.5 rounded-2xs font-bold ${
                          isLocked
                            ? 'bg-[#0a2d52] text-[#38bdf8]'
                            : isDone
                            ? 'bg-[#15803d] text-white'
                            : 'bg-[#ea580c] text-white animate-pulse'
                        }`}
                      >
                        {isLocked ? '🔒 LOCKED' : isDone ? '✅ READY' : '⏳ NEEDS PICKS'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-2.5 bg-[#ecd7ab] border-t-2 border-[#c99a57] flex items-center justify-between shrink-0">
              <span className="font-pixel text-[9px] text-[#5c3509] font-bold">
                {totalSlatesCompleted} of {allSlates.length} SLATES COMPLETED
              </span>
              <button
                type="button"
                onClick={() => setShowSlateJumpModal(false)}
                className="px-3 py-1 bg-[#12579b] hover:bg-[#1a6cb8] text-white font-pixel text-[10px] rounded-xs border border-[#0a2d52] font-bold cursor-pointer"
              >
                DONE
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MyTeamView;