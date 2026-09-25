import React from 'react';
import { Competitor, SportId, Match } from '../types';
import { PixelPlayerSprite } from './PixelPlayerSprite';
import { PixelHelmet } from './PixelHelmet';
import { X, Activity, Trophy, Calendar } from 'lucide-react';
import { getPlayerScoringDisplay } from '../utils/teamData';
import { lookupNFLAthleteLeagueStats } from '../data/nflLeagueStats';

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

  // 1. LIVE IN-GAME STATS (Strictly for this specific game; 0 if game is pre-kickoff)
  const isPreGame = scoringInfo.gameState === 'pre';
  const liveStatsObj = (isPreGame ? {} : selectedPlayer.stats) || {};

  const passYds = isPreGame ? 0 : Number(liveStatsObj.pass_yds ?? liveStatsObj.passing_yards ?? liveStatsObj.passingYards ?? 0);
  const rushYds = isPreGame ? 0 : Number(liveStatsObj.rush_yds ?? liveStatsObj.rushing_yards ?? liveStatsObj.rushingYards ?? 0);
  const recYds = isPreGame ? 0 : Number(liveStatsObj.rec_yds ?? liveStatsObj.receiving_yards ?? liveStatsObj.receivingYards ?? 0);
  const tds = isPreGame ? 0 : Number(liveStatsObj.tds ?? liveStatsObj.touchdowns ?? 0);
  const fgs = isPreGame ? 0 : Number(liveStatsObj.fgs ?? 0);
  const stops = isPreGame ? 0 : Number(liveStatsObj.stops ?? liveStatsObj.big_stops ?? 0);

  // Points from this live game
  const tdPoints = tds * 6;
  const passPoints = Math.floor(passYds / 25);
  const rushPoints = Math.floor(rushYds / 10);
  const recPoints = Math.floor(recYds / 10);
  const fgPoints = fgs * 3;
  const stopPoints = stops * 2;

  // NBA Live Stats
  const threePm = isPreGame ? 0 : Number(liveStatsObj.three_pm ?? liveStatsObj.threes ?? 0);
  const reb = isPreGame ? 0 : Number(liveStatsObj.reb ?? liveStatsObj.rebounds ?? 0);
  const ast = isPreGame ? 0 : Number(liveStatsObj.ast ?? liveStatsObj.assists ?? 0);
  const pts = isPreGame ? 0 : Number(liveStatsObj.pts ?? liveStatsObj.points ?? 0);
  const bigStops = isPreGame ? 0 : Number(liveStatsObj.big_stops ?? 0);
  const nbaThreePts = threePm * 2;
  const nbaAstPts = ast * 1;
  const nbaRebPts = reb * 1;
  const nbaStopPts = bigStops * 3;
  const nbaGamePts = Math.floor(pts / 3);

  // Live score: 0 if pre-game; actual live score if in-progress or final
  const heroScore = isPreGame ? 0 : scoringInfo.activeScore;
  const breakdownTargetScore = heroScore;
  const nflRawSum = tdPoints + passPoints + rushPoints + recPoints + fgPoints + stopPoints;
  const nflAdjustment = breakdownTargetScore - nflRawSum;

  const isOnFire = sport === 'nba' && heroScore >= 40;

  // 2. 2026 SEASON TOTAL STATS (from ESPN / Season Database)
  const leagueStat = sport === 'nfl' ? lookupNFLAthleteLeagueStats(selectedPlayer.displayName, selectedPlayer.athleteId) : undefined;
  const seasonStats = selectedPlayer.seasonStats || selectedPlayer.season_stats;
  const seasonPass = Number(seasonStats?.pass_yds ?? leagueStat?.pass_yds ?? 0);
  const seasonRush = Number(seasonStats?.rush_yds ?? leagueStat?.rush_yds ?? 0);
  const seasonRec = Number(seasonStats?.rec_yds ?? leagueStat?.rec_yds ?? 0);
  const seasonTds = Number(seasonStats?.tds ?? seasonStats?.touchdowns ?? leagueStat?.tds ?? 0);
  const seasonTotalYds = Number(seasonStats?.total_yards ?? (seasonPass + seasonRush + seasonRec));

  // 3. LAST GAME PERFORMANCE (Prior Week)
  const lastGameScore = selectedPlayer.lastGameScore ?? selectedPlayer.last_game_score;
  const lastGameStats = selectedPlayer.lastGameStats ?? selectedPlayer.last_game_stats;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="inspector-modal w-[94vw] max-w-[440px] mx-auto box-border relative p-3 sm:p-4 bg-[#fae5b8] border-4 border-[#1a2238] shadow-[0_6px_0_0_#0a0f1d] rounded-xs my-auto max-h-[92vh] flex flex-col justify-between overflow-y-auto no-scrollbar">
        
        {/* Header: Compact, single line title & meta, no wrapping */}
        <div className="modal-header flex justify-between items-center w-full pb-2 border-b-2 border-[#e2ba7d] shrink-0 gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {sport === 'nfl' && selectedPlayer.teamCode && (
              <PixelHelmet teamCode={selectedPlayer.teamCode} size={28} className="shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h2 className="font-pixel text-sm sm:text-base text-[#5c3509] tracking-wide uppercase font-bold truncate">
                  {selectedPlayer.displayName}
                </h2>
                {selectedPlayer.injuryStatus === 'I' && (
                  <span
                    className="px-1.5 py-0.5 bg-[#dc2626] text-white font-pixel text-[9px] font-black rounded-2xs border border-[#991b1b] shadow-2xs tracking-wider shrink-0"
                    title="INJURED / OUT"
                  >
                    I
                  </span>
                )}
                {selectedPlayer.injuryStatus === 'Q' && (
                  <span
                    className="px-1.5 py-0.5 bg-[#ea580c] text-white font-pixel text-[9px] font-black rounded-2xs border border-[#c2410c] shadow-2xs tracking-wider shrink-0"
                    title="QUESTIONABLE"
                  >
                    Q
                  </span>
                )}
              </div>
              <div className="text-[10px] sm:text-[11px] font-retro text-[#784610] flex items-center gap-1.5 truncate">
                <span className="font-pixel text-[9px] text-[#12579b] font-bold">
                  {selectedPlayer.teamCode}
                </span>
                <span>•</span>
                <span className="font-pixel text-[9px] text-[#451a03]">#{selectedPlayer.uniformNumber}</span>
                <span>•</span>
                <span className="font-pixel text-[9px] text-[#5c3509] font-bold">
                  {selectedPlayer.depthOrder || (selectedPlayer.depthRank ? `${selectedPlayer.position}${selectedPlayer.depthRank}` : selectedPlayer.position) || 'STAR'}
                </span>
                <span>•</span>
                {scoringInfo.gameState === 'pre' ? (
                  <span className="text-[#475569] font-pixel text-[9px] font-bold">
                    PRE-GAME
                  </span>
                ) : scoringInfo.gameState === 'in' ? (
                  <span className="text-[#b91c1c] font-pixel text-[9px] font-bold animate-pulse">
                    🔴 LIVE
                  </span>
                ) : (
                  <span className="text-[#12579b] font-pixel text-[9px] font-bold">
                    FINAL
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="touch-manipulation shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-[#b91c1c] hover:bg-[#dc2626] text-[#fae5b8] border-2 border-[#1a2238] flex items-center justify-center cursor-pointer shadow-xs active:translate-y-0.5 transition-all font-pixel text-xs rounded-2xs"
            title="Cancel / Close Card"
          >
            <X size={14} strokeWidth={3} />
          </button>
        </div>

        {/* Injury Report Alert Banner */}
        {selectedPlayer.injuryStatus && (
          <div className={`mt-2 px-2.5 py-1.5 rounded-xs border-2 flex items-center justify-between gap-2 shrink-0 ${
            selectedPlayer.injuryStatus === 'I'
              ? 'bg-[#fef2f2] border-[#f87171] text-[#991b1b]'
              : 'bg-[#fffbeb] border-[#fde047] text-[#92400e]'
          }`}>
            <div className="flex items-center gap-1.5 text-xs font-pixel font-bold">
              <span className={`px-1.5 py-0.5 text-white rounded-2xs text-[9px] font-black ${
                selectedPlayer.injuryStatus === 'I' ? 'bg-[#dc2626]' : 'bg-[#ea580c]'
              }`}>
                {selectedPlayer.injuryStatus}
              </span>
              <span>{selectedPlayer.injuryStatus === 'I' ? 'INJURY STATUS: OUT' : 'INJURY STATUS: QUESTIONABLE'}</span>
            </div>
            <span className="font-retro text-[11px] font-bold truncate">
              {selectedPlayer.injuryDetail || (selectedPlayer.injuryStatus === 'I' ? 'Player is Out / Inactive' : 'Questionable for game')}
            </span>
          </div>
        )}

        {/* Presentation: Sprite + Live Game Score Banner */}
        <div className="grid grid-cols-2 gap-2 mt-2 shrink-0">
          <div className="bg-[#ebd2a4] border-2 border-[#c99a57] rounded-xs flex flex-col items-center justify-center p-1.5 sm:p-2 min-h-[90px] sm:min-h-[110px] shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]">
            <PixelPlayerSprite
              avatar={selectedPlayer.avatar}
              number={selectedPlayer.uniformNumber}
              size="md"
              withShadow={true}
              animate={true}
              sport={sport}
              isOnFire={isOnFire}
              injuryStatus={selectedPlayer.injuryStatus}
            />
            <div className="mt-1 px-1.5 py-0.5 bg-[#fae5b8] border border-[#c99a57] text-[#5c3509] font-pixel text-[8px] rounded-xs uppercase tracking-wider font-bold truncate max-w-full">
              #{selectedPlayer.uniformNumber} · {selectedPlayer.teamCode}
            </div>
          </div>

          {scoringInfo.gameState === 'pre' ? (
            <div className="bg-[#ebd2a4] border-2 border-[#64748b] p-1.5 sm:p-2 rounded-xs text-center flex flex-col items-center justify-center min-h-[90px] sm:min-h-[110px] shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-1 text-[#475569] font-pixel text-[9px] uppercase tracking-wider font-bold">
                <Activity size={11} className="text-[#64748b]" />
                <span>THIS GAME SCORE</span>
              </div>
              
              <div className="font-pixel text-xl sm:text-2xl text-[#475569] tracking-wider font-bold my-0.5 drop-shadow-[0_1px_0_#fae5b8]">
                0 PTS
              </div>

              <div className="text-[8px] sm:text-[9px] font-retro text-[#475569] px-1.5 py-0.5 bg-[#e2e8f0] border border-[#cbd5e1] rounded-xs whitespace-nowrap font-bold">
                READY FOR KICKOFF
              </div>
            </div>
          ) : scoringInfo.gameState === 'in' ? (
            <div className="bg-[#ebd2a4] border-2 border-[#ef4444] p-1.5 sm:p-2 rounded-xs text-center flex flex-col items-center justify-center min-h-[90px] sm:min-h-[110px] shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-1 text-[#b91c1c] font-pixel text-[9px] uppercase tracking-wider font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ef4444] animate-pulse shrink-0" />
                <span>LIVE GAME SCORE</span>
              </div>
              
              <div className="font-pixel text-xl sm:text-2xl text-[#b91c1c] tracking-wider font-bold my-0.5 drop-shadow-[0_1px_0_#fae5b8]">
                {heroScore} PTS
              </div>

              <div className="text-[8px] sm:text-[9px] font-pixel text-white px-1.5 py-0.5 bg-[#b91c1c] border border-[#7f1d1d] rounded-xs whitespace-nowrap font-bold animate-pulse">
                LIVE IN PROGRESS
              </div>
            </div>
          ) : (
            <div className="bg-[#ebd2a4] border-2 border-[#12579b] p-1.5 sm:p-2 rounded-xs text-center flex flex-col items-center justify-center min-h-[90px] sm:min-h-[110px] shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]">
              <div className="flex items-center gap-1 text-[#12579b] font-pixel text-[9px] uppercase tracking-wider font-bold">
                <Activity size={11} className="text-[#12579b]" />
                <span>FINAL GAME SCORE</span>
              </div>
              
              <div className="font-pixel text-xl sm:text-2xl text-[#12579b] tracking-wider font-bold my-0.5 drop-shadow-[0_1px_0_#fae5b8]">
                {heroScore} PTS
              </div>

              <div className="text-[8px] sm:text-[9px] font-retro text-[#12579b] px-1.5 py-0.5 bg-[#dbeafe] border border-[#93c5fd] rounded-xs whitespace-nowrap font-bold">
                OFFICIAL FINAL
              </div>
            </div>
          )}
        </div>

        {/* Live Game Stats Row */}
        <div className="mt-2 w-full box-border">
          <div className="mb-1 flex items-center justify-between">
            <span className="font-pixel text-[9px] sm:text-[10px] text-[#784610] uppercase font-bold">
              {scoringInfo.gameState === 'pre' ? 'IN-GAME STATS (NOT STARTED)' : scoringInfo.gameState === 'post' ? 'FINAL GAME STATS' : 'LIVE IN-GAME STATS'}
            </span>
            <span className="font-retro text-[10px] text-[#784610]/80">
              {scoringInfo.gameState === 'pre' ? '0 PTS BEFORE KICKOFF' : 'OFFICIAL BOXSCORE'}
            </span>
          </div>
          {sport === 'nba' ? (
            <div className="grid grid-cols-4 gap-1 w-full box-border text-center">
              <div className="min-w-0 p-1 bg-[#fae9c8] border border-[#d4a86a] rounded-xs flex flex-col justify-center items-center shadow-2xs text-center">
                <span className="block font-retro text-[8px] text-[#784610] uppercase tracking-wider font-bold whitespace-nowrap">3PM</span>
                <span className="font-pixel text-xs sm:text-sm text-[#b45309] font-bold truncate">{threePm}</span>
              </div>
              <div className="min-w-0 p-1 bg-[#fae9c8] border border-[#d4a86a] rounded-xs flex flex-col justify-center items-center shadow-2xs text-center">
                <span className="block font-retro text-[8px] text-[#784610] uppercase tracking-wider font-bold whitespace-nowrap">REB</span>
                <span className="font-pixel text-xs sm:text-sm text-[#5c3509] truncate">{reb}</span>
              </div>
              <div className="min-w-0 p-1 bg-[#fae9c8] border border-[#d4a86a] rounded-xs flex flex-col justify-center items-center shadow-2xs text-center">
                <span className="block font-retro text-[8px] text-[#784610] uppercase tracking-wider font-bold whitespace-nowrap">AST</span>
                <span className="font-pixel text-xs sm:text-sm text-[#5c3509] truncate">{ast}</span>
              </div>
              <div className="min-w-0 p-1 bg-[#fae9c8] border border-[#d4a86a] rounded-xs flex flex-col justify-center items-center shadow-2xs text-center">
                <span className="block font-retro text-[8px] text-[#784610] uppercase tracking-wider font-bold whitespace-nowrap">PTS</span>
                <span className="font-pixel text-xs sm:text-sm text-[#12579b] font-bold truncate">{pts}</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-1 w-full box-border text-center">
              <div className="min-w-0 p-1 bg-[#fae9c8] border border-[#d4a86a] rounded-xs flex flex-col justify-center items-center shadow-2xs text-center">
                <span className="block font-retro text-[8px] text-[#784610] uppercase tracking-wider font-bold whitespace-nowrap">PASS YDS</span>
                <span className="font-pixel text-xs sm:text-sm text-[#5c3509] truncate">{passYds}</span>
              </div>
              <div className="min-w-0 p-1 bg-[#fae9c8] border border-[#d4a86a] rounded-xs flex flex-col justify-center items-center shadow-2xs text-center">
                <span className="block font-retro text-[8px] text-[#784610] uppercase tracking-wider font-bold whitespace-nowrap">RUSH YDS</span>
                <span className="font-pixel text-xs sm:text-sm text-[#5c3509] truncate">{rushYds}</span>
              </div>
              <div className="min-w-0 p-1 bg-[#fae9c8] border border-[#d4a86a] rounded-xs flex flex-col justify-center items-center shadow-2xs text-center">
                <span className="block font-retro text-[8px] text-[#784610] uppercase tracking-wider font-bold whitespace-nowrap">REC YDS</span>
                <span className="font-pixel text-xs sm:text-sm text-[#5c3509] truncate">{recYds}</span>
              </div>
              <div className="min-w-0 p-1 bg-[#fae9c8] border border-[#d4a86a] rounded-xs flex flex-col justify-center items-center shadow-2xs text-center">
                <span className="block font-retro text-[8px] text-[#784610] uppercase tracking-wider font-bold whitespace-nowrap">TD</span>
                <span className="font-pixel text-xs sm:text-sm text-[#b45309] font-bold truncate">{tds}</span>
              </div>
            </div>
          )}
        </div>

        {/* Live Points Breakdown */}
        <div className="mt-2 p-2 bg-[#ebd2a4] border-2 border-[#c99a57] rounded-xs shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]">
          <div className="pb-1 mb-1 border-b border-[#c99a57] flex items-center justify-between">
            <span className="font-pixel text-[9px] sm:text-[10px] text-[#5c3509] tracking-wider uppercase flex items-center gap-1 font-bold">
              <span>🧮</span>
              <span>LIVE GAME POINTS BREAKDOWN</span>
            </span>
            <span className="font-pixel text-[8px] text-[#784610]">
              {scoringInfo.gameState === 'pre' ? 'KICKOFF PENDING' : scoringInfo.gameState === 'in' ? 'LIVE' : 'FINAL'}
            </span>
          </div>

          {scoringInfo.gameState === 'pre' ? (
            <div className="py-1.5 px-2 bg-[#fae5b8] border border-[#d4a86a] rounded-xs text-center font-retro text-xs text-[#784610]">
              Game has not kicked off yet. In-game points will accumulate as plays occur in real-time!
            </div>
          ) : (
            <div className="space-y-1 text-xs font-retro text-[#5c3509]">
              {sport === 'nba' ? (
                <>
                  <div className="flex items-center justify-between py-0.5 px-1.5 bg-[#fae5b8] border border-[#d4a86a] rounded-xs font-pixel text-[10px]">
                    <span className="font-bold text-[#5c3509]">🎯 {threePm} 3-POINTERS</span>
                    <span className="text-[#b45309] font-bold">+{nbaThreePts} PTS</span>
                  </div>

                  <div className="flex items-center justify-between py-0.5 px-1.5 bg-[#fae5b8] border border-[#d4a86a] rounded-xs font-pixel text-[10px]">
                    <span className="font-bold text-[#5c3509]">🤝 {ast} ASSISTS</span>
                    <span className="text-[#12579b] font-bold">+{nbaAstPts} PTS</span>
                  </div>

                  <div className="flex items-center justify-between py-0.5 px-1.5 bg-[#fae5b8] border border-[#d4a86a] rounded-xs font-pixel text-[10px]">
                    <span className="font-bold text-[#5c3509]">🏀 {reb} REBOUNDS</span>
                    <span className="text-[#12579b] font-bold">+{nbaRebPts} PTS</span>
                  </div>

                  <div className="flex items-center justify-between py-0.5 px-1.5 bg-[#fae5b8] border border-[#d4a86a] rounded-xs font-pixel text-[10px]">
                    <span className="font-bold text-[#5c3509]">⚡ {pts} PTS (1/3)</span>
                    <span className="text-[#12579b] font-bold">+{nbaGamePts} PTS</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between py-0.5 px-1.5 bg-[#fae5b8] border border-[#d4a86a] rounded-xs font-pixel text-[10px]">
                    <span className="font-bold text-[#5c3509]">🏈 {tds} TOUCHDOWNS</span>
                    <span className="text-[#b45309] font-bold">+{tdPoints} PTS</span>
                  </div>

                  {passYds > 0 && (
                    <div className="flex items-center justify-between py-0.5 px-1.5 bg-[#fae5b8] border border-[#d4a86a] rounded-xs font-pixel text-[10px]">
                      <span className="font-bold text-[#5c3509]">⚡ {passYds} PASS YDS</span>
                      <span className="text-[#12579b] font-bold">+{passPoints} PTS</span>
                    </div>
                  )}

                  {rushYds > 0 && (
                    <div className="flex items-center justify-between py-0.5 px-1.5 bg-[#fae5b8] border border-[#d4a86a] rounded-xs font-pixel text-[10px]">
                      <span className="font-bold text-[#5c3509]">🏃 {rushYds} RUSH YDS</span>
                      <span className="text-[#12579b] font-bold">+{rushPoints} PTS</span>
                    </div>
                  )}

                  {recYds > 0 && (
                    <div className="flex items-center justify-between py-0.5 px-1.5 bg-[#fae5b8] border border-[#d4a86a] rounded-xs font-pixel text-[10px]">
                      <span className="font-bold text-[#5c3509]">🙌 {recYds} REC YDS</span>
                      <span className="text-[#12579b] font-bold">+{recPoints} PTS</span>
                    </div>
                  )}

                  {nflAdjustment !== 0 && (
                    <div className="flex items-center justify-between py-0.5 px-1.5 bg-[#fae5b8] border border-[#d4a86a] rounded-xs font-pixel text-[10px]">
                      <span className="font-bold text-[#5c3509]">{nflAdjustment > 0 ? '🌟 BONUS' : '⚠️ ADJUSTMENT'}</span>
                      <span className={`font-bold ${nflAdjustment > 0 ? 'text-[#15803d]' : 'text-[#b91c1c]'}`}>
                        {nflAdjustment > 0 ? `+${nflAdjustment}` : `${nflAdjustment}`} PTS
                      </span>
                    </div>
                  )}
                </>
              )}

              <div className="flex items-center justify-between py-1 px-2 bg-[#12579b] text-[#fae5b8] border-2 border-[#0a2d52] rounded-xs font-pixel text-xs font-bold shadow-xs mt-1">
                <span className="tracking-wider">THIS GAME TOTAL:</span>
                <span className="text-[#fde047] text-xs sm:text-sm font-bold">
                  {breakdownTargetScore} PTS
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Dedicated 2026 Season Totals Card */}
        {sport === 'nfl' && (
          <div className="mt-2 p-2 bg-[#faebd7] border-2 border-[#b45309] rounded-xs shadow-2xs">
            <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-[#e2ba7d]">
              <span className="font-pixel text-[9px] sm:text-[10px] text-[#b45309] tracking-wider uppercase flex items-center gap-1 font-bold">
                <Trophy size={11} className="text-[#b45309]" />
                <span>2026 SEASON TOTALS</span>
              </span>
              <span className="font-pixel text-[8px] text-[#784610] bg-[#fae5b8] px-1.5 py-0.5 rounded-2xs border border-[#d4a86a] font-bold">
                OFFICIAL ESPN
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1 text-center font-retro">
              <div className="p-1 bg-[#fff8eb] border border-[#e2ba7d] rounded-xs">
                <span className="block font-pixel text-[8px] text-[#784610]">PASS YDS</span>
                <span className="font-pixel text-xs text-[#5c3509] font-bold">{seasonPass.toLocaleString()}</span>
              </div>
              <div className="p-1 bg-[#fff8eb] border border-[#e2ba7d] rounded-xs">
                <span className="block font-pixel text-[8px] text-[#784610]">RUSH YDS</span>
                <span className="font-pixel text-xs text-[#5c3509] font-bold">{seasonRush.toLocaleString()}</span>
              </div>
              <div className="p-1 bg-[#fff8eb] border border-[#e2ba7d] rounded-xs">
                <span className="block font-pixel text-[8px] text-[#784610]">REC YDS</span>
                <span className="font-pixel text-xs text-[#5c3509] font-bold">{seasonRec.toLocaleString()}</span>
              </div>
              <div className="p-1 bg-[#fff8eb] border border-[#e2ba7d] rounded-xs">
                <span className="block font-pixel text-[8px] text-[#784610]">TDS</span>
                <span className="font-pixel text-xs text-[#b45309] font-bold">{seasonTds}</span>
              </div>
            </div>
          </div>
        )}

        {/* Dedicated Prior Game Performance Card */}
        {lastGameStats && lastGameStats !== '0 TD · 0 YDS' && (
          <div className="mt-2 p-2 bg-[#f1f5f9] border-2 border-[#94a3b8] rounded-xs shadow-2xs">
            <div className="flex items-center justify-between pb-1 mb-1 border-b border-[#cbd5e1]">
              <span className="font-pixel text-[9px] sm:text-[10px] text-[#475569] tracking-wider uppercase flex items-center gap-1 font-bold">
                <Calendar size={11} className="text-[#64748b]" />
                <span>LAST GAME PERFORMANCE</span>
              </span>
              {typeof lastGameScore === 'number' && lastGameScore > 0 && (
                <span className="font-pixel text-[9px] text-[#0f172a] bg-[#e2e8f0] px-1.5 py-0.5 rounded-2xs border border-[#cbd5e1] font-bold">
                  {lastGameScore} PTS
                </span>
              )}
            </div>
            <div className="font-retro text-xs text-[#334155] flex items-center justify-between px-1">
              <span>Prior Week Stats:</span>
              <span className="font-pixel text-[10px] text-[#0f172a] font-bold">{lastGameStats}</span>
            </div>
          </div>
        )}

        {/* Actions: Always visible at bottom without scrolling */}
        <div className="mt-2.5 shrink-0 space-y-1">
          {isLocked ? (
            <div className="w-full py-2 px-3 bg-[#064e3b] text-[#fde047] border-2 border-[#047857] shadow-xs font-pixel text-[10px] sm:text-xs rounded-xs text-center flex items-center justify-center gap-1.5 font-bold select-none">
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
                  className="touch-manipulation w-full py-2 px-3 bg-[#12579b] hover:bg-[#186abb] text-[#fae5b8] border-2 border-[#0a2d52] font-pixel text-xs rounded-xs cursor-pointer shadow-[0_2px_0_0_#051a30] active:translate-y-0.5 transition-all text-center flex items-center justify-center gap-1.5 font-bold"
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
                  className="touch-manipulation w-full py-2 px-3 bg-[#15803d] hover:bg-[#16a34a] text-white border-2 border-[#052e16] font-pixel text-xs rounded-xs cursor-pointer shadow-[0_2px_0_0_#022c11] active:translate-y-0.5 transition-all text-center flex items-center justify-center gap-1.5 font-bold"
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