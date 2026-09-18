import React from 'react';
import { Competitor, ActiveSlot, SquadSlots, Match, SportId } from '../types';
import { PixelPlayerSprite } from './PixelPlayerSprite';
import { Sparkles, X } from 'lucide-react';
import { splitPlayerFirstLastName } from '../utils/formatters';
import { formatRealtimeGameSituationCompact } from '../utils/teamData';
import { getCurrentNFLWeek } from '../lib/espnSync';

interface MyTeamViewProps {
  slots: SquadSlots;
  userName: string;
  roomCode: string;
  previousRoom?: string;
  sport?: SportId;
  isLocked?: boolean;
  matches?: Match[];
  onCommitUserName?: (name: string) => void;
  onCommitRoomCode?: (code: string) => void;
  onSelectSlot: (slotKey: ActiveSlot) => void;
  onClearSlot: (slotKey: ActiveSlot) => void;
  onToggleLock?: () => void;
  onLockedSlotAttempt?: () => void;
  onInspectPlayer?: (player: Competitor) => void;
  onRequestCreateSquad?: () => void;
}

const SLOT_CONFIG: { key: ActiveSlot; label: string }[] = [
  { key: 'star1', label: 'STAR 1' },
  { key: 'star2', label: 'STAR 2' },
  { key: 'star3', label: 'STAR 3' },
];

export const MyTeamView: React.FC<MyTeamViewProps> = ({
  slots,
  userName,
  roomCode,
  previousRoom,
  sport = 'nfl',
  isLocked = false,
  matches = [],
  onCommitRoomCode,
  onSelectSlot,
  onClearSlot,
  onToggleLock,
  onLockedSlotAttempt,
  onInspectPlayer,
  onRequestCreateSquad,
}) => {
  const isEmptySquadState = !userName || !userName.trim();

  // Count how many stars are set
  const filledSlots = [slots.star1, slots.star2, slots.star3].filter(Boolean) as Competitor[];
  const filledCount = filledSlots.length;
  const distinctStarIds = new Set(filledSlots.map((s) => s.id));
  const hasThreeDistinct = filledSlots.length === 3 && distinctStarIds.size === 3;
  // Strict guard condition: A squad with < 3 distinct stars CAN NEVER BE LOCKED
  const effectiveIsLocked = !isEmptySquadState && hasThreeDistinct && Boolean(isLocked);

  return (
    <div className="w-full box-border">
      
      {/* Centered Hero Focus: 3 Star Podiums */}
      <div className="pixel-box-cream p-3.5 sm:p-5 md:p-6 rounded-xs w-full shadow-[0_8px_0_0_#0a0f1d] border-4 border-[#1a2238] box-border">
        
        {/* Clean Header Bar */}
        <div className="flex items-center justify-between border-b-2 border-[#d4a86a] pb-2 mb-3 sm:mb-4">
          <h2 className="font-pixel text-xs sm:text-base text-[#5c3509] tracking-wider uppercase flex items-center gap-2">
            <Sparkles size={16} className="text-[#b45309]" />
            <span>
              {sport === 'nba'
                ? userName
                  ? `${userName.toUpperCase()}'S 3 NBA STARS`
                  : 'YOUR 3 NBA STARS'
                : userName
                ? `${userName.toUpperCase()}'S 3 NFL STARS`
                : 'YOUR 3 NFL STARS'}
            </span>
          </h2>
          <span className="font-pixel text-[11px] sm:text-xs text-[#fae5b8] bg-[#12579b] px-2.5 py-1 border border-[#0a2d52] rounded-xs shrink-0 whitespace-nowrap font-bold">
            {isEmptySquadState ? 'NO SQUAD' : `${filledCount}/3 SET`}
          </span>
        </div>

        {/* 3 Prominent Star Podiums with generous breathing room & Empty State Overlay */}
        <div className="relative">
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6 w-full transition-opacity duration-200 ${isEmptySquadState ? 'opacity-25 pointer-events-none select-none' : ''}`}>
            {SLOT_CONFIG.map(({ key, label }) => {
              const player = slots[key];
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

              const statsLine =
                sport === 'nba'
                  ? `${threePm} 3PM · ${reb} REB · ${ast} AST`
                  : tds > 0 || totalYds > 0
                  ? `${tds} TD · ${totalYds} YDS`
                  : '0 TD · 0 YDS';

              const isOnFire = sport === 'nba' && (player?.score || 0) >= 40;

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
                  className={`touch-manipulation rounded-xs transition-all box-border min-h-0 md:min-h-[310px] flex flex-col justify-between p-2.5 sm:p-3.5 md:p-4 ${
                    effectiveIsLocked && !player
                      ? 'bg-[#e4cb9c] border-3 border-[#94713a] cursor-not-allowed shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]'
                      : 'bg-[#ebd2a4] border-3 border-[#c99a57] cursor-pointer hover:bg-[#fae9c8] group shadow-[0_4px_0_0_#a77b3b] active:translate-y-0.5'
                  }`}
                >
                  {/* Star Slot Badge Header */}
                  <div className="w-full flex items-center justify-between mb-1.5 md:mb-2">
                    <span className="px-2 py-0.5 md:px-2.5 md:py-1 bg-[#12579b] text-[#fae5b8] font-pixel text-[9px] md:text-xs border border-[#0a2d52] rounded-xs shadow-xs font-bold tracking-wider whitespace-nowrap">
                      {label}
                    </span>

                    {/* [X] Reset button */}
                    {player && !effectiveIsLocked && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onClearSlot(key);
                        }}
                        className="touch-manipulation w-5 h-5 md:w-6 md:h-6 bg-[#b91c1c] hover:bg-[#dc2626] text-[#fae5b8] border border-[#1a2238] flex items-center justify-center font-pixel text-[10px] md:text-xs rounded-2xs active:translate-y-0.5 shrink-0 shadow-xs cursor-pointer"
                        title={`Clear ${label}`}
                      >
                        <X size={12} className="md:w-3.5 md:h-3.5" />
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
                      <div className="md:hidden flex items-center gap-2.5 w-full my-0.5">
                        <div className="shrink-0 w-[54px] flex flex-col items-center justify-center">
                          <PixelPlayerSprite
                            avatar={player.avatar}
                            number={player.uniformNumber}
                            size="sm"
                            withShadow={true}
                            animate={true}
                            sport={sport}
                            isOnFire={isOnFire}
                          />
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col justify-center leading-tight">
                          <div className="font-pixel text-xs text-[#451a03] font-bold uppercase truncate">
                            {player.displayName}
                          </div>
                          <div className="font-retro text-[11px] text-[#5c3509] font-bold truncate mt-0.5">
                            #{player.uniformNumber} · {player.teamCode} · {player.position || 'STAR'}
                          </div>

                          {gameSituation && (
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
                          )}

                          <div className="font-pixel text-[9px] text-[#5c3509] font-bold truncate mt-0.5">
                            {statsLine}
                          </div>
                        </div>

                        <div className="shrink-0 flex flex-col items-end justify-center pl-1">
                          <div className="px-2 py-1.5 bg-[#12579b] text-[#fae5b8] font-pixel text-xs border-2 border-[#0a2d52] shadow-[0_2px_0_0_#051a30] rounded-xs font-bold whitespace-nowrap text-center">
                            {player.score ? `${player.score.toLocaleString()} PTS` : '0 PTS'}
                          </div>
                        </div>
                      </div>

                      {/* Desktop Vertical Layout */}
                      <div className="hidden md:flex md:flex-1 md:flex-col md:items-center md:justify-between md:w-full">
                        <div className="my-2">
                          <PixelPlayerSprite
                            avatar={player.avatar}
                            number={player.uniformNumber}
                            size="md"
                            withShadow={true}
                            animate={true}
                            sport={sport}
                            isOnFire={isOnFire}
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

                          <div className="mt-0.5 font-retro text-xs sm:text-[13px] text-[#5c3509] font-bold">
                            (#{player.uniformNumber} · {player.teamCode} · {player.position || 'STAR'})
                          </div>

                          {gameSituation ? (
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

                        <div className="w-full text-center mt-1.5">
                          <span className="font-pixel text-[10px] sm:text-[11px] text-[#5c3509] font-bold whitespace-nowrap">
                            {statsLine}
                          </span>
                        </div>

                        <div className="w-full mt-2 text-center">
                          <div className="w-full py-1.5 sm:py-2 bg-[#12579b] text-[#fae5b8] font-pixel text-xs sm:text-sm border-2 border-[#0a2d52] shadow-[0_3px_0_0_#051a30] rounded-xs font-bold whitespace-nowrap">
                            {player.score ? `${player.score.toLocaleString()} PTS` : '0 PTS'}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Mobile Empty Slot */}
                      <div className="md:hidden flex items-center justify-center gap-2.5 py-3 px-3 w-full border-2 border-dashed border-[#b45309] rounded-xs group-hover:border-[#12579b] group-hover:bg-[#f6ebd4] transition-all my-1 animate-pulse">
                        <div className="w-7 h-7 rounded-full bg-[#fae5b8] border-2 border-[#b45309] flex items-center justify-center text-[#b45309] group-hover:text-[#12579b] group-hover:border-[#12579b] font-pixel text-sm font-bold shrink-0">
                          +
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="font-pixel text-[11px] text-[#b45309] group-hover:text-[#12579b] font-bold">
                            + TAP TO PICK STAR
                          </span>
                          <span className="font-retro text-[10px] text-[#784610]">
                            ASSIGN {label}
                          </span>
                        </div>
                      </div>

                      {/* Desktop Empty Slot */}
                      <div className="hidden md:flex md:flex-1 md:flex-col md:items-center md:justify-center md:py-6 md:w-full md:border-2 md:border-dashed md:border-[#b45309] rounded-xs group-hover:border-[#12579b] group-hover:bg-[#f6ebd4] transition-all my-2 animate-pulse">
                        <div className="w-12 h-12 rounded-full bg-[#fae5b8] border-2 border-[#b45309] flex items-center justify-center text-[#b45309] group-hover:text-[#12579b] group-hover:border-[#12579b] group-hover:scale-110 transition-all mb-2 shadow-xs">
                          <span className="font-pixel text-xl font-bold">+</span>
                        </div>
                        <span className="font-pixel text-xs sm:text-sm text-[#b45309] group-hover:text-[#12579b] text-center px-1 font-bold">
                          + TAP TO PICK STAR
                        </span>
                        <span className="font-retro text-[11px] text-[#784610] mt-1">
                          ASSIGN {label}
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
                {sport === 'nba' ? '🏀' : '🛋️'} ROOM [{roomCode}] • NEW ROOM
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
        <div className="mt-3 sm:mt-4 w-full box-border">
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
          ) : hasThreeDistinct ? (
            <div className="w-full px-3 sm:px-5 py-2 sm:py-3 bg-[#0f172a] text-[#fae5b8] border-3 border-[#1e293b] shadow-[0_4px_0_0_#020617] rounded-xs flex items-center justify-between gap-2 sm:gap-4 box-border">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 shrink-0">
                <span className="px-2 sm:px-2.5 py-1 bg-[#1e293b] border border-[#334155] rounded-2xs font-pixel text-[9px] sm:text-xs text-[#38bdf8] font-bold tracking-wider whitespace-nowrap">
                  ⭐ 3/3 READY!
                </span>
              </div>
              <button
                type="button"
                onClick={onToggleLock}
                className="touch-manipulation flex-1 sm:flex-initial px-3 sm:px-6 py-2 bg-[#facc15] hover:bg-[#fde047] text-[#451a03] font-pixel text-[10px] sm:text-xs border-2 border-[#ca8a04] rounded-xs cursor-pointer shadow-[0_2px_0_0_#854d0e] animate-pulse active:translate-y-0.5 whitespace-nowrap text-center font-bold tracking-wide"
              >
                ⚡ LOCK SQUAD ⚡
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled
              className="w-full py-2 sm:py-3 px-3 sm:px-4 bg-[#ebd2a4] text-[#784610] border-3 border-[#c99a57] rounded-xs font-pixel text-[10px] sm:text-xs flex items-center justify-center gap-2 opacity-80 cursor-not-allowed font-bold select-none box-border"
            >
              <span>🔒</span>
              <span>PICK 3 DISTINCT STARS TO LOCK ({distinctStarIds.size}/3)</span>
            </button>
          )}
        </div>
      )}

    </div>
  );
};

export default MyTeamView;