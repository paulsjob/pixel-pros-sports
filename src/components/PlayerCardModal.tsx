import React from 'react';
import { Competitor, SportId } from '../types';
import { PixelPlayerSprite } from './PixelPlayerSprite';
import { X, Activity } from 'lucide-react';

interface PlayerCardModalProps {
  player: Competitor | null;
  sport?: SportId;
  isLocked?: boolean;
  onClose: () => void;
  onSelectForTeam?: (player: Competitor) => void;
  onSwapThisStar?: (player: Competitor) => void;
  onDropPlayer?: (player: Competitor) => void;
  isSelectedForTeam?: boolean;
}

export const PlayerCardModal: React.FC<PlayerCardModalProps> = ({
  player: selectedPlayer,
  sport = 'nfl',
  isLocked = false,
  onClose,
  onSelectForTeam,
  onSwapThisStar,
  onDropPlayer,
  isSelectedForTeam,
}) => {
  if (!selectedPlayer) return null;

  // NFL Stats
  const passYds = Number(
    selectedPlayer.stats?.pass_yds ??
    selectedPlayer.stats?.passing_yards ??
    selectedPlayer.stats?.passingYards ??
    0
  );
  const rushYds = Number(
    selectedPlayer.stats?.rush_yds ??
    selectedPlayer.stats?.rushing_yards ??
    selectedPlayer.stats?.rushingYards ??
    0
  );
  const recYds = Number(
    selectedPlayer.stats?.rec_yds ??
    selectedPlayer.stats?.receiving_yards ??
    selectedPlayer.stats?.receivingYards ??
    0
  );
  const totalScrimmageYds = passYds + rushYds + recYds;
  const tds = Number(
    selectedPlayer.stats?.tds ??
    selectedPlayer.stats?.touchdowns ??
    0
  );
  const tdPoints = tds * 6;
  const yardPoints = Math.floor(totalScrimmageYds / 10);
  const calculatedNflTotal = tdPoints + yardPoints;

  // NBA Stats
  const threePm = Number(selectedPlayer.stats?.three_pm ?? selectedPlayer.stats?.threes ?? 0);
  const reb = Number(selectedPlayer.stats?.reb ?? selectedPlayer.stats?.rebounds ?? 0);
  const ast = Number(selectedPlayer.stats?.ast ?? selectedPlayer.stats?.assists ?? 0);
  const pts = Number(selectedPlayer.stats?.pts ?? selectedPlayer.stats?.points ?? 0);
  const bigStops = Number(selectedPlayer.stats?.big_stops ?? 0);
  const nbaThreePts = threePm * 2;
  const nbaAstPts = ast * 1;
  const nbaRebPts = reb * 1;
  const nbaStopPts = bigStops * 3;
  const nbaGamePts = Math.floor(pts / 3);
  const calculatedNbaTotal = nbaThreePts + nbaAstPts + nbaRebPts + nbaStopPts + nbaGamePts;

  const displayScore =
    selectedPlayer.score ?? (sport === 'nba' ? calculatedNbaTotal : calculatedNflTotal);
  const isOnFire = sport === 'nba' && displayScore >= 40;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="inspector-modal w-[92vw] max-w-[440px] mx-auto box-border overflow-x-hidden relative p-3.5 sm:p-4 bg-[#fae5b8] border-4 border-[#1a2238] shadow-[0_8px_0_0_#0a0f1d] rounded-xs my-auto max-h-[90vh] flex flex-col justify-between overflow-y-auto">
        
        {/* Header */}
        <div className="modal-header flex justify-between items-start w-full mb-2 sm:mb-3 pb-2 sm:pb-2.5 border-b-2 border-[#e2ba7d] shrink-0">
          <div className="text-left flex-1 min-w-0 pr-2">
            <h2 className="font-pixel text-lg sm:text-2xl text-[#5c3509] tracking-wider uppercase leading-tight truncate">
              {selectedPlayer.displayName}
            </h2>
            <div className="text-[11px] sm:text-xs font-retro text-[#784610] mt-1 flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <span className="px-1.5 sm:px-2 py-0.5 bg-[#fae9c8] border border-[#d4a86a] text-[#12579b] font-pixel text-[9px] sm:text-[10px] font-bold rounded-2xs shrink-0">
                {selectedPlayer.teamCode}
              </span>
              <span className="font-bold truncate max-w-[120px] sm:max-w-none">{selectedPlayer.teamName}</span>
              <span>•</span>
              <span className="font-pixel text-[10px] sm:text-[11px] text-[#451a03] shrink-0">#{selectedPlayer.uniformNumber}</span>
              <span>•</span>
              <span className="px-1.5 py-0.5 bg-[#ebd2a4] border border-[#c99a57] font-pixel text-[9px] text-[#5c3509] rounded-2xs font-bold shrink-0">
                {selectedPlayer.position || 'STAR'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="touch-manipulation shrink-0 w-8 h-8 sm:w-9 sm:h-9 bg-[#b91c1c] hover:bg-[#dc2626] text-[#fae5b8] border-2 border-[#1a2238] flex items-center justify-center cursor-pointer shadow-[0_2px_0_0_#450a0a] active:translate-y-0.5 transition-all font-pixel text-xs rounded-2xs"
            title="Cancel / Close Card"
          >
            <X size={16} strokeWidth={3} />
          </button>
        </div>

        {/* Presentation: Sprite + Live Score */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 shrink-0">
          <div className="bg-[#ebd2a4] border-2 border-[#c99a57] rounded-xs flex flex-col items-center justify-center p-2 sm:p-3 min-h-[110px] sm:min-h-[150px] shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]">
            <div className="sm:hidden scale-80 origin-center -my-2">
              <PixelPlayerSprite
                avatar={selectedPlayer.avatar}
                number={selectedPlayer.uniformNumber}
                size="md"
                withShadow={true}
                animate={true}
                sport={sport}
                isOnFire={isOnFire}
              />
            </div>
            <div className="hidden sm:block">
              <PixelPlayerSprite
                avatar={selectedPlayer.avatar}
                number={selectedPlayer.uniformNumber}
                size="lg"
                withShadow={true}
                animate={true}
                sport={sport}
                isOnFire={isOnFire}
              />
            </div>
            <div className="mt-1 sm:mt-2 px-1.5 sm:px-2.5 py-0.5 bg-[#fae5b8] border border-[#c99a57] text-[#5c3509] font-pixel text-[8px] sm:text-[9px] rounded-xs uppercase tracking-wider font-bold truncate max-w-full">
              #{selectedPlayer.uniformNumber} · {selectedPlayer.teamCode}
            </div>
          </div>

          <div className="bg-[#ebd2a4] border-2 border-[#c99a57] p-2 sm:p-3 rounded-xs text-center flex flex-col items-center justify-center min-h-[110px] sm:min-h-[150px] shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]">
            <div className="flex items-center gap-1 text-[#5c3509] font-pixel text-[9px] sm:text-[11px] uppercase tracking-wider mb-0.5">
              <Activity size={12} className="text-[#16a34a]" />
              <span>SCORE</span>
            </div>
            
            <div className="font-pixel text-2xl sm:text-4xl text-[#12579b] tracking-wider font-bold my-0.5 drop-shadow-[0_1px_0_#fae5b8]">
              {displayScore} PTS
            </div>

            <div className="mt-1 text-[9px] sm:text-[10px] font-retro text-[#784610] px-1.5 sm:px-2 py-0.5 bg-[#fae9c8] border border-[#d4a86a] rounded-xs whitespace-nowrap">
              WHOLE NUMBER
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="mt-2.5 sm:mt-3 w-full box-border">
          {sport === 'nba' ? (
            <div className="grid grid-cols-4 gap-1 w-full box-border text-center">
              <div className="min-w-0 p-1 bg-[#fae9c8] border border-[#d4a86a] rounded-xs flex flex-col justify-center items-center shadow-2xs text-center">
                <span className="block font-retro text-[8px] sm:text-[9px] text-[#784610] uppercase tracking-wider font-bold whitespace-nowrap">3PM</span>
                <span className="font-pixel text-xs sm:text-base text-[#b45309] font-bold truncate">{threePm}</span>
              </div>
              <div className="min-w-0 p-1 bg-[#fae9c8] border border-[#d4a86a] rounded-xs flex flex-col justify-center items-center shadow-2xs text-center">
                <span className="block font-retro text-[8px] sm:text-[9px] text-[#784610] uppercase tracking-wider font-bold whitespace-nowrap">REB</span>
                <span className="font-pixel text-xs sm:text-base text-[#5c3509] truncate">{reb}</span>
              </div>
              <div className="min-w-0 p-1 bg-[#fae9c8] border border-[#d4a86a] rounded-xs flex flex-col justify-center items-center shadow-2xs text-center">
                <span className="block font-retro text-[8px] sm:text-[9px] text-[#784610] uppercase tracking-wider font-bold whitespace-nowrap">AST</span>
                <span className="font-pixel text-xs sm:text-base text-[#5c3509] truncate">{ast}</span>
              </div>
              <div className="min-w-0 p-1 bg-[#fae9c8] border border-[#d4a86a] rounded-xs flex flex-col justify-center items-center shadow-2xs text-center">
                <span className="block font-retro text-[8px] sm:text-[9px] text-[#784610] uppercase tracking-wider font-bold whitespace-nowrap">PTS</span>
                <span className="font-pixel text-xs sm:text-base text-[#12579b] font-bold truncate">{pts}</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-1 w-full box-border text-center">
              <div className="min-w-0 p-1 bg-[#fae9c8] border border-[#d4a86a] rounded-xs flex flex-col justify-center items-center shadow-2xs text-center">
                <span className="block font-retro text-[8px] sm:text-[9px] text-[#784610] uppercase tracking-wider font-bold whitespace-nowrap">PASS YDS</span>
                <span className="font-pixel text-xs sm:text-base text-[#5c3509] truncate">{passYds}</span>
              </div>
              <div className="min-w-0 p-1 bg-[#fae9c8] border border-[#d4a86a] rounded-xs flex flex-col justify-center items-center shadow-2xs text-center">
                <span className="block font-retro text-[8px] sm:text-[9px] text-[#784610] uppercase tracking-wider font-bold whitespace-nowrap">RUSH YDS</span>
                <span className="font-pixel text-xs sm:text-base text-[#5c3509] truncate">{rushYds}</span>
              </div>
              <div className="min-w-0 p-1 bg-[#fae9c8] border border-[#d4a86a] rounded-xs flex flex-col justify-center items-center shadow-2xs text-center">
                <span className="block font-retro text-[8px] sm:text-[9px] text-[#784610] uppercase tracking-wider font-bold whitespace-nowrap">REC YDS</span>
                <span className="font-pixel text-xs sm:text-base text-[#5c3509] truncate">{recYds}</span>
              </div>
              <div className="min-w-0 p-1 bg-[#fae9c8] border border-[#d4a86a] rounded-xs flex flex-col justify-center items-center shadow-2xs text-center">
                <span className="block font-retro text-[8px] sm:text-[9px] text-[#784610] uppercase tracking-wider font-bold whitespace-nowrap">TD</span>
                <span className="font-pixel text-xs sm:text-base text-[#b45309] font-bold truncate">{tds}</span>
              </div>
            </div>
          )}
        </div>

        {/* Points Breakdown */}
        <div className="mt-3 p-2.5 bg-[#ebd2a4] border-2 border-[#c99a57] rounded-xs shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]">
          <div className="pb-1 mb-1.5 border-b border-[#c99a57] flex items-center justify-between">
            <span className="font-pixel text-[10px] sm:text-[11px] text-[#5c3509] tracking-wider uppercase flex items-center gap-1 font-bold">
              <span>🧮</span>
              <span>POINTS BREAKDOWN</span>
            </span>
            <span className="font-pixel text-[8px] sm:text-[9px] text-[#784610] bg-[#fae9c8] px-1.5 py-0.5 border border-[#d4a86a] rounded-2xs">
              NO DECIMALS
            </span>
          </div>

          <div className="space-y-1.5 text-xs font-retro text-[#5c3509]">
            {sport === 'nba' ? (
              <>
                <div className="flex items-center justify-between px-2.5 py-1.5 bg-[#fae5b8] border border-[#d4a86a] rounded-xs font-pixel text-[11px] sm:text-xs whitespace-nowrap overflow-hidden">
                  <span className="flex items-center gap-1.5 font-bold text-[#5c3509] shrink-0 whitespace-nowrap">
                    <span>🎯</span><span>{threePm} 3-POINTERS</span>
                  </span>
                  <span className="mx-1.5 text-[#c99a57] font-normal flex-1 overflow-hidden whitespace-nowrap select-none opacity-70">
                    ....................................................................
                  </span>
                  <span className="text-[#b45309] font-bold shrink-0 ml-1.5 whitespace-nowrap">+{nbaThreePts} PTS</span>
                </div>

                <div className="flex items-center justify-between px-2.5 py-1.5 bg-[#fae5b8] border border-[#d4a86a] rounded-xs font-pixel text-[11px] sm:text-xs whitespace-nowrap overflow-hidden">
                  <span className="flex items-center gap-1.5 font-bold text-[#5c3509] shrink-0 whitespace-nowrap">
                    <span>🤝</span><span>{ast} ASSISTS</span>
                  </span>
                  <span className="mx-1.5 text-[#c99a57] font-normal flex-1 overflow-hidden whitespace-nowrap select-none opacity-70">
                    ....................................................................
                  </span>
                  <span className="text-[#12579b] font-bold shrink-0 ml-1.5 whitespace-nowrap">+{nbaAstPts} PTS</span>
                </div>

                <div className="flex items-center justify-between px-2.5 py-1.5 bg-[#fae5b8] border border-[#d4a86a] rounded-xs font-pixel text-[11px] sm:text-xs whitespace-nowrap overflow-hidden">
                  <span className="flex items-center gap-1.5 font-bold text-[#5c3509] shrink-0 whitespace-nowrap">
                    <span>🏀</span><span>{reb} REBOUNDS</span>
                  </span>
                  <span className="mx-1.5 text-[#c99a57] font-normal flex-1 overflow-hidden whitespace-nowrap select-none opacity-70">
                    ....................................................................
                  </span>
                  <span className="text-[#12579b] font-bold shrink-0 ml-1.5 whitespace-nowrap">+{nbaRebPts} PTS</span>
                </div>

                {bigStops > 0 && (
                  <div className="flex items-center justify-between px-2.5 py-1.5 bg-[#fae5b8] border border-[#d4a86a] rounded-xs font-pixel text-[11px] sm:text-xs whitespace-nowrap overflow-hidden">
                    <span className="flex items-center gap-1.5 font-bold text-[#5c3509] shrink-0 whitespace-nowrap">
                      <span>🛡️</span><span>{bigStops} BIG STOPS</span>
                    </span>
                    <span className="mx-1.5 text-[#c99a57] font-normal flex-1 overflow-hidden whitespace-nowrap select-none opacity-70">
                      ....................................................................
                    </span>
                    <span className="text-[#15803d] font-bold shrink-0 ml-1.5 whitespace-nowrap">+{nbaStopPts} PTS</span>
                  </div>
                )}

                <div className="flex items-center justify-between px-2.5 py-1.5 bg-[#fae5b8] border border-[#d4a86a] rounded-xs font-pixel text-[11px] sm:text-xs whitespace-nowrap overflow-hidden">
                  <span className="flex items-center gap-1.5 font-bold text-[#5c3509] shrink-0 whitespace-nowrap">
                    <span>⚡</span><span>{pts} REAL PTS (1/3)</span>
                  </span>
                  <span className="mx-1.5 text-[#c99a57] font-normal flex-1 overflow-hidden whitespace-nowrap select-none opacity-70">
                    ....................................................................
                  </span>
                  <span className="text-[#12579b] font-bold shrink-0 ml-1.5 whitespace-nowrap">+{nbaGamePts} PTS</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between px-2.5 py-1.5 bg-[#fae5b8] border border-[#d4a86a] rounded-xs font-pixel text-[11px] sm:text-xs whitespace-nowrap overflow-hidden">
                  <span className="flex items-center gap-1.5 font-bold text-[#5c3509] shrink-0 whitespace-nowrap">
                    <span>🏈</span><span>{tds} TOUCHDOWNS</span>
                  </span>
                  <span className="mx-1.5 text-[#c99a57] font-normal flex-1 overflow-hidden whitespace-nowrap select-none opacity-70">
                    ....................................................................
                  </span>
                  <span className="text-[#b45309] font-bold shrink-0 ml-1.5 whitespace-nowrap">+{tdPoints} PTS</span>
                </div>

                <div className="flex items-center justify-between px-2.5 py-1.5 bg-[#fae5b8] border border-[#d4a86a] rounded-xs font-pixel text-[11px] sm:text-xs whitespace-nowrap overflow-hidden">
                  <span className="flex items-center gap-1.5 font-bold text-[#5c3509] shrink-0 whitespace-nowrap">
                    <span>⚡</span><span>{totalScrimmageYds} SCRIMMAGE YDS</span>
                  </span>
                  <span className="mx-1.5 text-[#c99a57] font-normal flex-1 overflow-hidden whitespace-nowrap select-none opacity-70">
                    ....................................................................
                  </span>
                  <span className="text-[#12579b] font-bold shrink-0 ml-1.5 whitespace-nowrap">+{yardPoints} PTS</span>
                </div>
              </>
            )}

            <div className="flex items-center justify-between px-2.5 py-1.5 bg-[#12579b] text-[#fae5b8] border-2 border-[#0a2d52] rounded-xs font-pixel text-xs sm:text-sm font-bold shadow-xs mt-1.5">
              <span className="tracking-wider">TOTAL SCORE:</span>
              <span className="text-[#fde047] text-sm sm:text-base font-bold">
                {displayScore} PTS
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-3.5 space-y-1.5">
          {isLocked ? (
            <div className="w-full py-2.5 px-3 bg-[#064e3b] text-[#fde047] border-3 border-[#047857] shadow-[0_2px_0_0_#022c22] font-pixel text-[10px] sm:text-xs rounded-xs text-center flex items-center justify-center gap-2 font-bold select-none">
              <span>🔒</span>
              <span>SQUAD IS LOCKED (READ-ONLY)</span>
            </div>
          ) : (
            <>
              {isSelectedForTeam ? (
                <button
                  type="button"
                  onClick={() => {
                    if (onSwapThisStar) {
                      onSwapThisStar(selectedPlayer);
                    } else if (onSelectForTeam) {
                      onSelectForTeam(selectedPlayer);
                    }
                  }}
                  className="touch-manipulation w-full py-2.5 px-3 bg-[#12579b] hover:bg-[#186abb] text-[#fae5b8] border-3 border-[#0a2d52] font-pixel text-[11px] sm:text-xs rounded-xs cursor-pointer shadow-[0_3px_0_0_#051a30] active:translate-y-0.5 transition-all text-center flex items-center justify-center gap-2 font-bold"
                >
                  <span>⇄</span>
                  <span>SWAP THIS STAR</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    onSelectForTeam?.(selectedPlayer);
                  }}
                  className="touch-manipulation w-full py-2.5 px-3 bg-[#15803d] hover:bg-[#16a34a] text-white border-3 border-[#052e16] font-pixel text-[11px] sm:text-xs rounded-xs cursor-pointer shadow-[0_3px_0_0_#022c11] active:translate-y-0.5 transition-all text-center flex items-center justify-center gap-2 font-bold"
                >
                  <span>+</span>
                  <span>PICK AS A STAR</span>
                </button>
              )}

              {isSelectedForTeam && onDropPlayer && (
                <div className="text-center pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      onDropPlayer(selectedPlayer);
                      onClose();
                    }}
                    className="touch-manipulation font-retro text-[11px] text-[#784610]/80 hover:text-[#b91c1c] underline cursor-pointer transition-colors"
                  >
                    Drop player
                  </button>
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
};