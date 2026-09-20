import React from 'react';
import { Competitor, SportId, Match } from '../types';
import { PixelPlayerSprite } from './PixelPlayerSprite';
import { X, Activity } from 'lucide-react';
import { getPlayerScoringDisplay } from '../utils/teamData';

interface PlayerCardModalProps {
  player: Competitor | null;
  match?: Match | null;
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
  match,
  sport = 'nfl',
  isLocked = false,
  onClose,
  onSelectForTeam,
  onSwapThisStar,
  onDropPlayer,
  isSelectedForTeam,
}) => {
  if (!selectedPlayer) return null;

  const scoringInfo = getPlayerScoringDisplay(selectedPlayer, match, sport);

  const rawStats = scoringInfo.gameState === 'pre'
    ? (selectedPlayer.last_game_stats || selectedPlayer.stats || {})
    : (selectedPlayer.current_stats || selectedPlayer.stats || {});
  const statsToUse: Record<string, any> = typeof rawStats === 'object' && rawStats !== null ? (rawStats as Record<string, any>) : {};

  // NFL Stats
  const passYds = Number(
    statsToUse.pass_yds ??
    statsToUse.passing_yards ??
    statsToUse.passingYards ??
    0
  );
  const rushYds = Number(
    statsToUse.rush_yds ??
    statsToUse.rushing_yards ??
    statsToUse.rushingYards ??
    0
  );
  const recYds = Number(
    statsToUse.rec_yds ??
    statsToUse.receiving_yards ??
    statsToUse.receivingYards ??
    0
  );
  const tds = Number(
    statsToUse.tds ??
    statsToUse.touchdowns ??
    0
  );

  // Separate passing vs rushing vs receiving points
  const tdPoints = tds * 6;
  const passPoints = Math.floor(passYds / 25);
  const rushPoints = Math.floor(rushYds / 10);
  const recPoints = Math.floor(recYds / 10);
  const calculatedNflTotal = tdPoints + passPoints + rushPoints + recPoints;

  // NBA Stats
  const threePm = Number(statsToUse.three_pm ?? statsToUse.threes ?? 0);
  const reb = Number(statsToUse.reb ?? statsToUse.rebounds ?? 0);
  const ast = Number(statsToUse.ast ?? statsToUse.assists ?? 0);
  const pts = Number(statsToUse.pts ?? statsToUse.points ?? 0);
  const bigStops = Number(statsToUse.big_stops ?? 0);
  const nbaThreePts = threePm * 2;
  const nbaAstPts = ast * 1;
  const nbaRebPts = reb * 1;
  const nbaStopPts = bigStops * 3;
  const nbaGamePts = Math.floor(pts / 3);
  const calculatedNbaTotal = nbaThreePts + nbaAstPts + nbaRebPts + nbaStopPts + nbaGamePts;

  // Hero card score reflects current game state
  const heroScore = scoringInfo.gameState === 'pre' ? 0 : scoringInfo.activeScore;

  // Target score for the breakdown table
  const breakdownTargetScore = scoringInfo.gameState === 'pre'
    ? (scoringInfo.hasHistoricalData ? scoringInfo.historicalScore : (sport === 'nba' ? calculatedNbaTotal : calculatedNflTotal))
    : scoringInfo.activeScore;

  // NFL Adjustment so breakdown line items sum exactly to breakdownTargetScore
  const nflRawSum = tdPoints + passPoints + rushPoints + recPoints;
  const nflAdjustment = breakdownTargetScore - nflRawSum;

  // NBA Adjustment so breakdown line items sum exactly to breakdownTargetScore
  const nbaRawSum = calculatedNbaTotal;
  const nbaAdjustment = breakdownTargetScore - nbaRawSum;

  const isOnFire = sport === 'nba' && heroScore >= 40;

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
              <span>•</span>
              {scoringInfo.gameState === 'pre' ? (
                <span className="px-1.5 py-0.5 bg-[#475569] text-[#fae5b8] font-pixel text-[9px] rounded-2xs font-bold shrink-0">
                  PRE-GAME • {scoringInfo.contextBadgeText}
                </span>
              ) : scoringInfo.gameState === 'in' ? (
                <span className="px-1.5 py-0.5 bg-[#b91c1c] text-[#fef08a] font-pixel text-[9px] rounded-2xs font-bold shrink-0 animate-pulse">
                  🔴 LIVE • {scoringInfo.contextBadgeText}
                </span>
              ) : (
                <span className="px-1.5 py-0.5 bg-[#12579b] text-[#93c5fd] font-pixel text-[9px] rounded-2xs font-bold shrink-0">
                  FINAL • {scoringInfo.contextBadgeText}
                </span>
              )}
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

        {/* Presentation: Sprite + Live / Pre-Game Score */}
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

          {scoringInfo.gameState === 'pre' ? (
            <div className="bg-[#ebd2a4] border-2 border-[#64748b] p-2 sm:p-3 rounded-xs text-center flex flex-col items-center justify-center min-h-[110px] sm:min-h-[150px] shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-1 text-[#475569] font-pixel text-[9px] sm:text-[11px] uppercase tracking-wider mb-0.5 font-bold">
                <Activity size={12} className="text-[#64748b]" />
                <span>ACTIVE SCORE</span>
              </div>
              
              <div className="font-pixel text-2xl sm:text-4xl text-[#475569] tracking-wider font-bold my-0.5 drop-shadow-[0_1px_0_#fae5b8]">
                0 PTS
              </div>

              <div className="mt-1 text-[9px] sm:text-[10px] font-retro text-[#475569] px-1.5 sm:px-2 py-0.5 bg-[#e2e8f0] border border-[#cbd5e1] rounded-xs whitespace-nowrap font-bold">
                READY FOR KICKOFF
              </div>

              {scoringInfo.hasHistoricalData && (
                <div className="mt-1.5 text-[9px] sm:text-[10px] font-pixel text-[#b45309] font-bold">
                  LAST GAME: {scoringInfo.historicalScore} PTS
                </div>
              )}
            </div>
          ) : scoringInfo.gameState === 'in' ? (
            <div className="bg-[#ebd2a4] border-2 border-[#ef4444] p-2 sm:p-3 rounded-xs text-center flex flex-col items-center justify-center min-h-[110px] sm:min-h-[150px] shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-1 text-[#b91c1c] font-pixel text-[9px] sm:text-[11px] uppercase tracking-wider mb-0.5 font-bold">
                <span className="w-2 h-2 rounded-full bg-[#ef4444] animate-pulse shrink-0" />
                <span>LIVE SCORE</span>
              </div>
              
              <div className="font-pixel text-2xl sm:text-4xl text-[#b91c1c] tracking-wider font-bold my-0.5 drop-shadow-[0_1px_0_#fae5b8]">
                {heroScore} PTS
              </div>

              <div className="mt-1 text-[9px] sm:text-[10px] font-pixel text-white px-1.5 sm:px-2 py-0.5 bg-[#b91c1c] border border-[#7f1d1d] rounded-xs whitespace-nowrap font-bold animate-pulse">
                LIVE IN PROGRESS
              </div>
            </div>
          ) : (
            <div className="bg-[#ebd2a4] border-2 border-[#12579b] p-2 sm:p-3 rounded-xs text-center flex flex-col items-center justify-center min-h-[110px] sm:min-h-[150px] shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-1 text-[#12579b] font-pixel text-[9px] sm:text-[11px] uppercase tracking-wider mb-0.5 font-bold">
                <Activity size={12} className="text-[#12579b]" />
                <span>FINAL SCORE</span>
              </div>
              
              <div className="font-pixel text-2xl sm:text-4xl text-[#12579b] tracking-wider font-bold my-0.5 drop-shadow-[0_1px_0_#fae5b8]">
                {heroScore} PTS
              </div>

              <div className="mt-1 text-[9px] sm:text-[10px] font-retro text-[#12579b] px-1.5 sm:px-2 py-0.5 bg-[#dbeafe] border border-[#93c5fd] rounded-xs whitespace-nowrap font-bold">
                OFFICIAL FINAL
              </div>
            </div>
          )}
        </div>

        {/* Stats Row */}
        <div className="mt-2.5 sm:mt-3 w-full box-border">
          <div className="mb-1 flex items-center justify-between">
            <span className="font-pixel text-[9px] sm:text-[10px] text-[#784610] uppercase font-bold">
              {scoringInfo.gameState === 'pre' ? 'LAST GAME STATS' : 'ACTIVE GAME STATS'}
            </span>
            {scoringInfo.gameState === 'pre' && (
              <span className="font-pixel text-[8px] sm:text-[9px] text-[#64748b]">
                (PRE-GAME STATS ARE ZEROED)
              </span>
            )}
          </div>
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
              <span>{scoringInfo.gameState === 'pre' ? 'LAST GAME BREAKDOWN' : 'POINTS BREAKDOWN'}</span>
            </span>
            <span className="font-pixel text-[8px] sm:text-[9px] text-[#784610] bg-[#fae9c8] px-1.5 py-0.5 border border-[#d4a86a] rounded-2xs font-bold">
              WHOLE NUMBERS
            </span>
          </div>

          <div className="space-y-1.5 text-xs font-retro text-[#5c3509] pr-1">
            {sport === 'nba' ? (
              <>
                <div className="flex items-center justify-between pl-2.5 pr-3 sm:pr-3.5 py-1.5 bg-[#fae5b8] border border-[#d4a86a] rounded-xs font-pixel text-[11px] sm:text-xs whitespace-nowrap overflow-hidden">
                  <span className="flex items-center gap-1.5 font-bold text-[#5c3509] shrink-0 whitespace-nowrap">
                    <span>🎯</span><span>{threePm} 3-POINTERS</span>
                  </span>
                  <span className="mx-1.5 text-[#c99a57] font-normal flex-1 overflow-hidden whitespace-nowrap select-none opacity-70">
                    ....................................................................
                  </span>
                  <span className="text-[#b45309] font-bold shrink-0 ml-1.5 pr-1 whitespace-nowrap">+{nbaThreePts} PTS</span>
                </div>

                <div className="flex items-center justify-between pl-2.5 pr-3 sm:pr-3.5 py-1.5 bg-[#fae5b8] border border-[#d4a86a] rounded-xs font-pixel text-[11px] sm:text-xs whitespace-nowrap overflow-hidden">
                  <span className="flex items-center gap-1.5 font-bold text-[#5c3509] shrink-0 whitespace-nowrap">
                    <span>🤝</span><span>{ast} ASSISTS</span>
                  </span>
                  <span className="mx-1.5 text-[#c99a57] font-normal flex-1 overflow-hidden whitespace-nowrap select-none opacity-70">
                    ....................................................................
                  </span>
                  <span className="text-[#12579b] font-bold shrink-0 ml-1.5 pr-1 whitespace-nowrap">+{nbaAstPts} PTS</span>
                </div>

                <div className="flex items-center justify-between pl-2.5 pr-3 sm:pr-3.5 py-1.5 bg-[#fae5b8] border border-[#d4a86a] rounded-xs font-pixel text-[11px] sm:text-xs whitespace-nowrap overflow-hidden">
                  <span className="flex items-center gap-1.5 font-bold text-[#5c3509] shrink-0 whitespace-nowrap">
                    <span>🏀</span><span>{reb} REBOUNDS</span>
                  </span>
                  <span className="mx-1.5 text-[#c99a57] font-normal flex-1 overflow-hidden whitespace-nowrap select-none opacity-70">
                    ....................................................................
                  </span>
                  <span className="text-[#12579b] font-bold shrink-0 ml-1.5 pr-1 whitespace-nowrap">+{nbaRebPts} PTS</span>
                </div>

                {bigStops > 0 && (
                  <div className="flex items-center justify-between pl-2.5 pr-3 sm:pr-3.5 py-1.5 bg-[#fae5b8] border border-[#d4a86a] rounded-xs font-pixel text-[11px] sm:text-xs whitespace-nowrap overflow-hidden">
                    <span className="flex items-center gap-1.5 font-bold text-[#5c3509] shrink-0 whitespace-nowrap">
                      <span>🛡️</span><span>{bigStops} BIG STOPS</span>
                    </span>
                    <span className="mx-1.5 text-[#c99a57] font-normal flex-1 overflow-hidden whitespace-nowrap select-none opacity-70">
                      ....................................................................
                    </span>
                    <span className="text-[#15803d] font-bold shrink-0 ml-1.5 pr-1 whitespace-nowrap">+{nbaStopPts} PTS</span>
                  </div>
                )}

                <div className="flex items-center justify-between pl-2.5 pr-3 sm:pr-3.5 py-1.5 bg-[#fae5b8] border border-[#d4a86a] rounded-xs font-pixel text-[11px] sm:text-xs whitespace-nowrap overflow-hidden">
                  <span className="flex items-center gap-1.5 font-bold text-[#5c3509] shrink-0 whitespace-nowrap">
                    <span>⚡</span><span>{pts} REAL PTS (1/3)</span>
                  </span>
                  <span className="mx-1.5 text-[#c99a57] font-normal flex-1 overflow-hidden whitespace-nowrap select-none opacity-70">
                    ....................................................................
                  </span>
                  <span className="text-[#12579b] font-bold shrink-0 ml-1.5 pr-1 whitespace-nowrap">+{nbaGamePts} PTS</span>
                </div>

                {nbaAdjustment !== 0 && (
                  <div className="flex items-center justify-between pl-2.5 pr-3 sm:pr-3.5 py-1.5 bg-[#fae5b8] border border-[#d4a86a] rounded-xs font-pixel text-[11px] sm:text-xs whitespace-nowrap overflow-hidden">
                    <span className="flex items-center gap-1.5 font-bold text-[#5c3509] shrink-0 whitespace-nowrap">
                      <span>{nbaAdjustment > 0 ? '🌟' : '⚠️'}</span>
                      <span>{nbaAdjustment > 0 ? 'BONUS / ADJUSTMENT' : 'DEDUCTIONS'}</span>
                    </span>
                    <span className="mx-1.5 text-[#c99a57] font-normal flex-1 overflow-hidden whitespace-nowrap select-none opacity-70">
                      ....................................................................
                    </span>
                    <span className={`font-bold shrink-0 ml-1.5 pr-1 whitespace-nowrap ${nbaAdjustment > 0 ? 'text-[#15803d]' : 'text-[#b91c1c]'}`}>
                      {nbaAdjustment > 0 ? `+${nbaAdjustment}` : `${nbaAdjustment}`} PTS
                    </span>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex items-center justify-between pl-2.5 pr-3 sm:pr-3.5 py-1.5 bg-[#fae5b8] border border-[#d4a86a] rounded-xs font-pixel text-[11px] sm:text-xs whitespace-nowrap overflow-hidden">
                  <span className="flex items-center gap-1.5 font-bold text-[#5c3509] shrink-0 whitespace-nowrap">
                    <span>🏈</span><span>{tds} TOUCHDOWNS (6/td)</span>
                  </span>
                  <span className="mx-1.5 text-[#c99a57] font-normal flex-1 overflow-hidden whitespace-nowrap select-none opacity-70">
                    ....................................................................
                  </span>
                  <span className="text-[#b45309] font-bold shrink-0 ml-1.5 pr-1 whitespace-nowrap">+{tdPoints} PTS</span>
                </div>

                <div className="flex items-center justify-between pl-2.5 pr-3 sm:pr-3.5 py-1.5 bg-[#fae5b8] border border-[#d4a86a] rounded-xs font-pixel text-[11px] sm:text-xs whitespace-nowrap overflow-hidden">
                  <span className="flex items-center gap-1.5 font-bold text-[#5c3509] shrink-0 whitespace-nowrap">
                    <span>⚡</span><span>{passYds} PASSING YDS (25/pt)</span>
                  </span>
                  <span className="mx-1.5 text-[#c99a57] font-normal flex-1 overflow-hidden whitespace-nowrap select-none opacity-70">
                    ....................................................................
                  </span>
                  <span className="text-[#12579b] font-bold shrink-0 ml-1.5 pr-1 whitespace-nowrap">+{passPoints} PTS</span>
                </div>

                <div className="flex items-center justify-between pl-2.5 pr-3 sm:pr-3.5 py-1.5 bg-[#fae5b8] border border-[#d4a86a] rounded-xs font-pixel text-[11px] sm:text-xs whitespace-nowrap overflow-hidden">
                  <span className="flex items-center gap-1.5 font-bold text-[#5c3509] shrink-0 whitespace-nowrap">
                    <span>🏃</span><span>{rushYds} RUSHING YDS (10/pt)</span>
                  </span>
                  <span className="mx-1.5 text-[#c99a57] font-normal flex-1 overflow-hidden whitespace-nowrap select-none opacity-70">
                    ....................................................................
                  </span>
                  <span className="text-[#12579b] font-bold shrink-0 ml-1.5 pr-1 whitespace-nowrap">+{rushPoints} PTS</span>
                </div>

                {recYds > 0 && (
                  <div className="flex items-center justify-between pl-2.5 pr-3 sm:pr-3.5 py-1.5 bg-[#fae5b8] border border-[#d4a86a] rounded-xs font-pixel text-[11px] sm:text-xs whitespace-nowrap overflow-hidden">
                    <span className="flex items-center gap-1.5 font-bold text-[#5c3509] shrink-0 whitespace-nowrap">
                      <span>🙌</span><span>{recYds} RECEIVING YDS (10/pt)</span>
                    </span>
                    <span className="mx-1.5 text-[#c99a57] font-normal flex-1 overflow-hidden whitespace-nowrap select-none opacity-70">
                      ....................................................................
                    </span>
                    <span className="text-[#12579b] font-bold shrink-0 ml-1.5 pr-1 whitespace-nowrap">+{recPoints} PTS</span>
                  </div>
                )}

                {nflAdjustment !== 0 && (
                  <div className="flex items-center justify-between pl-2.5 pr-3 sm:pr-3.5 py-1.5 bg-[#fae5b8] border border-[#d4a86a] rounded-xs font-pixel text-[11px] sm:text-xs whitespace-nowrap overflow-hidden">
                    <span className="flex items-center gap-1.5 font-bold text-[#5c3509] shrink-0 whitespace-nowrap">
                      <span>{nflAdjustment > 0 ? '🌟' : '⚠️'}</span>
                      <span>{nflAdjustment > 0 ? '2-PT CONV / BONUS' : 'TURNOVER / SACK DEDUCTIONS'}</span>
                    </span>
                    <span className="mx-1.5 text-[#c99a57] font-normal flex-1 overflow-hidden whitespace-nowrap select-none opacity-70">
                      ....................................................................
                    </span>
                    <span className={`font-bold shrink-0 ml-1.5 pr-1 whitespace-nowrap ${nflAdjustment > 0 ? 'text-[#15803d]' : 'text-[#b91c1c]'}`}>
                      {nflAdjustment > 0 ? `+${nflAdjustment}` : `${nflAdjustment}`} PTS
                    </span>
                  </div>
                )}
              </>
            )}

            <div className="flex items-center justify-between pl-2.5 pr-3 sm:pr-3.5 py-1.5 bg-[#12579b] text-[#fae5b8] border-2 border-[#0a2d52] rounded-xs font-pixel text-xs sm:text-sm font-bold shadow-xs mt-1.5">
              <span className="tracking-wider">
                {scoringInfo.gameState === 'pre' ? 'LAST GAME TOTAL:' : 'TOTAL SCORE:'}
              </span>
              <span className="text-[#fde047] text-sm sm:text-base font-bold">
                {breakdownTargetScore} PTS
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