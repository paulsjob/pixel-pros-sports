import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Competitor, Match, SportId, UserProfile, UserRoster } from '../types';
import { PixelPlayerSprite } from './PixelPlayerSprite';
import { PixelShieldIcon } from './PixelBadges';
import { PixelHelmet } from './PixelHelmet';
import { Users, Sparkles, ChevronLeft, ChevronRight, Trophy, ChevronDown, ChevronUp, Flame, CheckCircle2, ArrowRight } from 'lucide-react';
import { splitPlayerFirstLastName, formatPlayerInitialLastName, formatTeamPosSubtitle } from '../utils/formatters';
import { getDeviceId } from '../lib/deviceIdentity';
import { isGhostUser } from '../lib/supabaseClient';
import {
  getPlayerScoringDisplay,
  resolvePlayerInPool,
  findMatchForPlayer,
  getPlayerVisualAvatar,
  sortMatchesByKickoffAndStatus,
  isMatchEnded,
} from '../utils/teamData';

function formatPickedByName(rawName: string): string {
  const trimmed = (rawName || '').trim();
  if (trimmed.toUpperCase() === 'MOM') return 'Mom';
  if (trimmed.toUpperCase() === 'DAD') return 'Dad';
  if (trimmed.toUpperCase() === 'BROTHER') return 'Brother';
  if (trimmed.toUpperCase() === 'SISTER') return 'Sister';
  if (trimmed.toUpperCase() === 'YOU') return 'You';
  if (trimmed === trimmed.toUpperCase()) {
    return trimmed
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }
  return trimmed;
}

interface LeaderboardViewProps {
  user: UserProfile;
  nflCompetitors?: Competitor[];
  roomRosters?: UserRoster[];
  matches?: Match[];
  roomCode: string;
  userName: string;
  sport?: SportId;
  onCommitRoomCode: (code: string) => void;
  onCommitUserName: (name: string) => void;
  onOpenPlayerDetail?: (player: Competitor) => void;
  onSelectSquad?: (squadName: string) => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  user,
  nflCompetitors = [],
  roomRosters = [],
  matches = [],
  roomCode,
  userName,
  sport = 'nfl',
  onCommitRoomCode,
  onCommitUserName,
  onOpenPlayerDetail,
  onSelectSquad,
}) => {
  // Two bold retro toggle buttons: [ FAMILY ] (default) and [ TOP SCORES ]
  const [activeTier, setActiveTier] = useState<'family' | 'top_scores'>('family');
  const [leagueSlateFilter, setLeagueSlateFilter] = useState<string>('MEGA_TOTAL');
  const [sortBy, setSortBy] = useState<'score' | 'slates'>('score');
  const [expandedSquadName, setExpandedSquadName] = useState<string | null>(null);

  const safeNflPlayers = Array.isArray(nflCompetitors) ? nflCompetitors : [];
  const safeRoomRosters = Array.isArray(roomRosters) ? roomRosters : [];
  const cleanRoom = (roomCode || 'COUCH').trim().toUpperCase();
  const activeNormalizedName = (userName || '').trim().toUpperCase();

  const sortedMatches = useMemo(() => {
    return sortMatchesByKickoffAndStatus(matches || []);
  }, [matches]);

  const standingsSlateOptions = useMemo(() => {
    const list = ['MEGA_TOTAL', 'SUPERSTARS'];
    sortedMatches.forEach((m) => {
      const away = (m.awayTeamCode || m.away_team || '').trim().toUpperCase();
      const home = (m.homeTeamCode || m.home_team || '').trim().toUpperCase();
      list.push(`${away}@${home}`);
    });
    return list;
  }, [sortedMatches]);

  const currentStandingSlateIdx = Math.max(0, standingsSlateOptions.indexOf(leagueSlateFilter));
  const handlePrevStandingSlate = () => {
    if (currentStandingSlateIdx > 0) {
      setLeagueSlateFilter(standingsSlateOptions[currentStandingSlateIdx - 1]);
    }
  };
  const handleNextStandingSlate = () => {
    if (currentStandingSlateIdx < standingsSlateOptions.length - 1) {
      setLeagueSlateFilter(standingsSlateOptions[currentStandingSlateIdx + 1]);
    }
  };

  const standingSlateScrollRef = useRef<HTMLDivElement>(null);
  const activeStandingSlateBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (activeStandingSlateBtnRef.current && standingSlateScrollRef.current) {
      activeStandingSlateBtnRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [leagueSlateFilter]);

  const getPlayerLivePoints = (p: Competitor) => {
    if (!p) return 0;
    const match = findMatchForPlayer(p, matches);
    const info = getPlayerScoringDisplay(p, match, sport);
    // Lock in scoring: if player has a recorded score or computed stats, never wipe it to 0
    return info.activeScore > 0 ? info.activeScore : (p.score || 0);
  };

  // Top 20 NFL Competitors ordered by score DESC with duplicate ID filtering
  const seenPlayerIds = new Set<string>();
  const top20Players = safeNflPlayers
    .filter((p) => {
      if (!p || !p.id) return false;
      if (seenPlayerIds.has(p.id)) return false;
      seenPlayerIds.add(p.id);
      return true;
    })
    .sort((a, b) => {
      const scoreB = getPlayerLivePoints(b);
      const scoreA = getPlayerLivePoints(a);
      if (scoreB !== scoreA && (scoreB > 0 || scoreA > 0)) return scoreB - scoreA;
      return (b.score || 0) - (a.score || 0);
    })
    .slice(0, 20);

  // Current active user roster entry for this room
  const currentUserRoster: UserRoster = {
    room_code: cleanRoom,
    user_name: activeNormalizedName,
    star_1_id: user.selectedPlayerIds?.[0] || '',
    star_2_id: user.selectedPlayerIds?.[1] || '',
    star_3_id: user.selectedPlayerIds?.[2] || '',
    is_locked: (user as any).isLocked || false,
    updated_at: new Date().toISOString(),
  };

  const familyListWithDynamicTotals = useMemo(() => {
    // 1. Gather all unique user names in this room across ALL slates
    const userNames = new Set<string>();
    safeRoomRosters.forEach((r) => {
      const rCode = (r.room_code || '').toUpperCase();
      if (rCode === cleanRoom || rCode.startsWith(`${cleanRoom}__`)) {
        const u = (r.user_name || '').trim().toUpperCase();
        if (u && !isGhostUser(u)) userNames.add(u);
      }
    });
    if (activeNormalizedName) userNames.add(activeNormalizedName);

    return Array.from(userNames).map((entryName) => {
      const isUser = entryName === activeNormalizedName;

      if (leagueSlateFilter === 'MEGA_TOTAL') {
        // Accumulate across ALL slates for this user in this room
        let totalScore = 0;
        let slatesCount = 0;
        let superstarsScore = 0;
        const allUserRosters = safeRoomRosters.filter(
          (r) =>
            (r.user_name || '').trim().toUpperCase() === entryName &&
            ((r.room_code || '').toUpperCase() === cleanRoom ||
              (r.room_code || '').toUpperCase().startsWith(`${cleanRoom}__`))
        );

        // If current user, make sure their current live slate roster is represented
        const superstarRoster =
          allUserRosters.find((r) => (r.room_code || '').toUpperCase() === cleanRoom) ||
          (isUser ? currentUserRoster : null);
        const star1 = superstarRoster ? resolvePlayerInPool(superstarRoster.star_1_id, safeNflPlayers, sport) : null;
        const star2 = superstarRoster ? resolvePlayerInPool(superstarRoster.star_2_id, safeNflPlayers, sport) : null;
        const star3 = superstarRoster ? resolvePlayerInPool(superstarRoster.star_3_id, safeNflPlayers, sport) : null;
        const superstarPlayers = [star1, star2, star3].filter(Boolean) as Competitor[];
        if (superstarPlayers.length > 0) {
          superstarsScore = superstarPlayers.reduce((s, p) => s + getPlayerLivePoints(p), 0);
        }

        allUserRosters.forEach((r) => {
          const s1 = resolvePlayerInPool(r.star_1_id, safeNflPlayers, sport);
          const s2 = resolvePlayerInPool(r.star_2_id, safeNflPlayers, sport);
          const s3 = resolvePlayerInPool(r.star_3_id, safeNflPlayers, sport);
          const stars = [s1, s2, s3].filter(Boolean) as Competitor[];
          if (stars.length > 0) {
            slatesCount++;
            totalScore += stars.reduce((s, p) => s + getPlayerLivePoints(p), 0);
          }
        });

        const slateBreakdowns: Array<{
          slateId: string;
          label: string;
          points: number;
          stars: (Competitor | null)[];
          isLocked: boolean;
        }> = [];

        if (superstarPlayers.length > 0) {
          slateBreakdowns.push({
            slateId: 'SUPERSTARS',
            label: '⭐ SUPERSTARS',
            points: superstarsScore,
            stars: [star1, star2, star3],
            isLocked: Boolean(superstarRoster?.is_locked || superstarRoster?.device_id === 'LOCKED'),
          });
        }

        allUserRosters.forEach((r) => {
          const rCode = (r.room_code || '').toUpperCase();
          if (rCode.startsWith(`${cleanRoom}__`)) {
            const rawSlateId = rCode.replace(`${cleanRoom}__`, '').replace('_', '@');
            const s1 = resolvePlayerInPool(r.star_1_id, safeNflPlayers, sport);
            const s2 = resolvePlayerInPool(r.star_2_id, safeNflPlayers, sport);
            const s3 = resolvePlayerInPool(r.star_3_id, safeNflPlayers, sport);
            const stars = [s1, s2, s3];
            const validStars = stars.filter(Boolean) as Competitor[];
            if (validStars.length > 0) {
              const pts = validStars.reduce((s, p) => s + getPlayerLivePoints(p), 0);
              slateBreakdowns.push({
                slateId: rawSlateId,
                label: `🏈 ${rawSlateId}`,
                points: pts,
                stars,
                isLocked: Boolean(r.is_locked || r.device_id === 'LOCKED'),
              });
            }
          }
        });

        if (allUserRosters.length === 0 && isUser) {
          totalScore = superstarsScore;
          slatesCount = superstarPlayers.length > 0 ? 1 : 0;
        }

        return {
          userName: entryName,
          isYou: isUser,
          isLocked: false,
          starPlayers: superstarPlayers,
          totalScore,
          slatesCount: Math.max(slatesCount, 1),
          superstarsScore,
          stars: [star1, star2, star3],
          slateBreakdowns,
        };
      }

      // Filtered to a specific slate ('SUPERSTARS' or 'ATL@GB')
      const targetRoomCode =
        leagueSlateFilter === 'SUPERSTARS'
          ? cleanRoom
          : `${cleanRoom}__${leagueSlateFilter.replace('@', '_')}`;

      const rosterEntry =
        safeRoomRosters.find(
          (r) =>
            (r.room_code || '').toUpperCase() === targetRoomCode &&
            (r.user_name || '').trim().toUpperCase() === entryName
        ) || (isUser && leagueSlateFilter === 'SUPERSTARS' ? currentUserRoster : null);

      const star1 = rosterEntry ? resolvePlayerInPool(rosterEntry.star_1_id, safeNflPlayers, sport) : null;
      const star2 = rosterEntry ? resolvePlayerInPool(rosterEntry.star_2_id, safeNflPlayers, sport) : null;
      const star3 = rosterEntry ? resolvePlayerInPool(rosterEntry.star_3_id, safeNflPlayers, sport) : null;
      const starPlayers = [star1, star2, star3].filter(Boolean) as Competitor[];
      const sumPoints = starPlayers.reduce((sum, p) => sum + getPlayerLivePoints(p), 0);

      return {
        userName: entryName,
        isYou: isUser,
        isLocked: Boolean(rosterEntry?.is_locked || rosterEntry?.device_id === 'LOCKED'),
        starPlayers,
        totalScore: sumPoints,
        slatesCount: 1,
        superstarsScore: sumPoints,
        stars: [star1, star2, star3],
        slateBreakdowns: [],
      };
    }).sort((a, b) => {
      if (sortBy === 'slates') {
        if (b.slatesCount !== a.slatesCount) return b.slatesCount - a.slatesCount;
      }
      return b.totalScore - a.totalScore;
    });
  }, [safeRoomRosters, cleanRoom, activeNormalizedName, leagueSlateFilter, safeNflPlayers, sport, currentUserRoster, sortBy]);

  // Helper for rank medal styling
  const getRankBadge = (rankNumber: number) => {
    if (rankNumber === 1) {
      return 'bg-[#f59e0b] text-[#78350f] border-[#b45309]';
    }
    if (rankNumber === 2) {
      return 'bg-[#94a3b8] text-[#0f172a] border-[#64748b]';
    }
    if (rankNumber === 3) {
      return 'bg-[#b45309] text-[#fae5b8] border-[#78350f]';
    }
    return 'bg-[#1e293b] text-[#94a3b8] border-[#334155]';
  };

  return (
    <div className="w-full box-border space-y-3 sm:space-y-4 overflow-hidden">
      {/* Top Header - No repetitive text */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 sm:gap-3 mb-1">
          <PixelShieldIcon size={30} color="#155e9e" />
          <h1 className="font-pixel text-lg sm:text-2xl text-[#fae5b8] tracking-widest drop-shadow-[0_4px_0_#0f172a]">
            LEADERBOARD
          </h1>
        </div>
      </div>

      {/* 2-Tier Retro Toggle Buttons: [ FAMILY ] and [ TOP SCORES ] */}
      <div className="flex justify-center w-full max-w-md mx-auto gap-3 sm:gap-4 px-2">
        <button
          onClick={() => setActiveTier('family')}
          className={`touch-manipulation flex-1 py-2.5 sm:py-3 px-3 sm:px-5 font-pixel text-xs sm:text-sm border-3 cursor-pointer transition-all active:translate-y-0.5 flex items-center justify-center gap-2 ${
            activeTier === 'family'
              ? 'bg-[#12579b] text-[#fae5b8] border-[#0a2d52] shadow-[0_4px_0_0_#051a30]'
              : 'bg-[#ebd2a4] text-[#5c3509] border-[#c99a57] hover:bg-[#fae9c8]'
          }`}
        >
          <Users size={16} />
          <span>FAMILY</span>
        </button>

        <button
          onClick={() => setActiveTier('top_scores')}
          className={`touch-manipulation flex-1 py-2.5 sm:py-3 px-3 sm:px-5 font-pixel text-xs sm:text-sm border-3 cursor-pointer transition-all active:translate-y-0.5 flex items-center justify-center gap-2 ${
            activeTier === 'top_scores'
              ? 'bg-[#12579b] text-[#fae5b8] border-[#0a2d52] shadow-[0_4px_0_0_#051a30]'
              : 'bg-[#ebd2a4] text-[#5c3509] border-[#c99a57] hover:bg-[#fae9c8]'
          }`}
        >
          <Sparkles size={16} />
          <span>TOP SCORES</span>
        </button>
      </div>

      {/* Main Container: Strict 2 Columns with Zero Horizontal Scrolling */}
      <div className="pixel-box-cream p-3 sm:p-5 rounded-xs w-full max-w-full overflow-hidden box-border">
        
        {/* Tier Subheader Banner */}
        <div className="flex items-center justify-between pb-2.5 sm:pb-3 mb-2 border-b-2 border-[#d4a86a]">
          <div>
            <h2 className="font-pixel text-xs sm:text-sm text-[#5c3509] tracking-wider uppercase">
              {activeTier === 'family'
                ? `LEAGUE ROOM "${roomCode.toUpperCase()}"`
                : sport === 'nba'
                ? 'TOP NBA ATHLETES'
                : 'TOP NFL ATHLETES'}
            </h2>
          </div>

          <span className="font-pixel text-[10px] sm:text-[11px] text-[#12579b] bg-[#fae9c8] px-2 py-0.5 border border-[#d4a86a] rounded-xs shrink-0 whitespace-nowrap font-bold">
            {activeTier === 'family'
              ? `${familyListWithDynamicTotals.length === 1 ? '1 SQUAD' : `${familyListWithDynamicTotals.length} SQUADS`}`
              : `${top20Players.length} STARS`}
          </span>
        </div>

        {/* Arcade Top 3 Podium Showcase */}
        {activeTier === 'family' && familyListWithDynamicTotals.length >= 2 && (
          <div className="mb-3 p-2.5 sm:p-3 bg-linear-to-b from-[#10223f] to-[#0a1628] border-2 border-[#38bdf8] rounded-xs shadow-[0_4px_0_0_#051a30] text-[#fae5b8]">
            <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-[#38bdf8]/30">
              <div className="flex items-center gap-1.5 font-pixel text-[10px] sm:text-xs text-[#fde047] font-bold">
                <Trophy size={14} className="text-[#facc15]" />
                <span>CHAMPIONSHIP PODIUM</span>
              </div>
              <span className="font-retro text-[10px] text-[#93c5fd]">
                {leagueSlateFilter === 'MEGA_TOTAL' ? 'ALL GAMES' : leagueSlateFilter}
              </span>
            </div>

            {/* 3 Pedestals: 2nd (left), 1st (center, tallest), 3rd (right) */}
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2 items-end pt-1">
              {/* 🥈 #2 Silver */}
              {familyListWithDynamicTotals[1] && (
                <div
                  onClick={() => setExpandedSquadName((prev) => (prev === familyListWithDynamicTotals[1].userName ? null : familyListWithDynamicTotals[1].userName))}
                  className="flex flex-col items-center p-1.5 bg-[#1e293b] hover:bg-[#334155] border-2 border-[#94a3b8] rounded-xs cursor-pointer transition-transform active:scale-95 text-center min-h-[92px] justify-between shadow-xs"
                >
                  <div className="font-pixel text-[9px] sm:text-[10px] text-[#cbd5e1] font-bold flex items-center gap-0.5">
                    <span>🥈</span> #2
                  </div>
                  <div className="my-0.5">
                    <div className="font-pixel text-[10px] sm:text-xs text-white truncate max-w-[85px] sm:max-w-[110px] font-bold">
                      {familyListWithDynamicTotals[1].userName}
                    </div>
                    <div className="font-pixel text-xs sm:text-sm text-[#facc15] font-bold">
                      {familyListWithDynamicTotals[1].totalScore.toFixed(1)}p
                    </div>
                  </div>
                  <div className="text-[8px] font-retro text-[#94a3b8]">
                    -{Math.max(0, familyListWithDynamicTotals[0].totalScore - familyListWithDynamicTotals[1].totalScore).toFixed(1)}p
                  </div>
                </div>
              )}

              {/* 🥇 #1 Gold (TALLEST / HIGHLIGHTED) */}
              {familyListWithDynamicTotals[0] && (
                <div
                  onClick={() => setExpandedSquadName((prev) => (prev === familyListWithDynamicTotals[0].userName ? null : familyListWithDynamicTotals[0].userName))}
                  className="flex flex-col items-center p-2 bg-[#854d0e]/90 hover:bg-[#a16207] border-2 border-[#fde047] rounded-xs cursor-pointer transition-transform active:scale-95 text-center min-h-[110px] justify-between shadow-[0_0_12px_rgba(250,204,21,0.35)] ring-2 ring-[#facc15]/50 relative"
                >
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-sm select-none">
                    👑
                  </div>
                  <div className="font-pixel text-[10px] sm:text-xs text-[#fef08a] font-bold flex items-center gap-1">
                    <span>🥇</span> #1 LEADER
                  </div>
                  <div className="my-0.5">
                    <div className="font-pixel text-xs sm:text-sm text-white truncate max-w-[95px] sm:max-w-[125px] font-bold">
                      {familyListWithDynamicTotals[0].userName}
                    </div>
                    <div className="font-pixel text-sm sm:text-base text-[#fde047] font-bold">
                      {familyListWithDynamicTotals[0].totalScore.toFixed(1)}p
                    </div>
                  </div>
                  <div className="text-[8px] font-pixel text-[#fef08a] bg-[#713f12] px-1 py-0.2 rounded-2xs">
                    {familyListWithDynamicTotals[0].slatesCount} SLATES
                  </div>
                </div>
              )}

              {/* 🥉 #3 Bronze */}
              {familyListWithDynamicTotals[2] ? (
                <div
                  onClick={() => setExpandedSquadName((prev) => (prev === familyListWithDynamicTotals[2].userName ? null : familyListWithDynamicTotals[2].userName))}
                  className="flex flex-col items-center p-1.5 bg-[#1e293b] hover:bg-[#334155] border-2 border-[#b45309] rounded-xs cursor-pointer transition-transform active:scale-95 text-center min-h-[85px] justify-between shadow-xs"
                >
                  <div className="font-pixel text-[9px] sm:text-[10px] text-[#fed7aa] font-bold flex items-center gap-0.5">
                    <span>🥉</span> #3
                  </div>
                  <div className="my-0.5">
                    <div className="font-pixel text-[10px] sm:text-xs text-white truncate max-w-[85px] sm:max-w-[110px] font-bold">
                      {familyListWithDynamicTotals[2].userName}
                    </div>
                    <div className="font-pixel text-xs sm:text-sm text-[#facc15] font-bold">
                      {familyListWithDynamicTotals[2].totalScore.toFixed(1)}p
                    </div>
                  </div>
                  <div className="text-[8px] font-retro text-[#cbd5e1]">
                    -{Math.max(0, familyListWithDynamicTotals[0].totalScore - familyListWithDynamicTotals[2].totalScore).toFixed(1)}p
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-1.5 bg-[#1e293b]/40 border-2 border-dashed border-[#475569] rounded-xs min-h-[85px] text-center">
                  <span className="font-pixel text-[8px] text-[#64748b]">OPEN SPOT</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* League Slate Scope Carousel + Sort Filter */}
        {activeTier === 'family' && (
          <div className="mb-3 p-1.5 bg-[#ecd7ab]/90 border-2 border-[#c99a57] rounded-xs shadow-inner">
            <div className="flex items-center justify-between pb-1 mb-1 border-b border-[#c99a57]/40 text-[9px] font-pixel text-[#5c3509]">
              <div className="flex items-center gap-1 font-bold">
                <span>🏆</span>
                <span>
                  {leagueSlateFilter === 'MEGA_TOTAL'
                    ? 'WEEKLY TOTAL (ALL GAMES)'
                    : leagueSlateFilter === 'SUPERSTARS'
                    ? 'WEEKLY SUPERSTARS'
                    : `GAME: ${leagueSlateFilter}`}
                </span>
              </div>

              {/* Sort Filter Buttons */}
              <div className="flex items-center gap-1 text-[8px] sm:text-[9px]">
                <span className="text-[#784610] font-bold">SORT:</span>
                <button
                  type="button"
                  onClick={() => setSortBy('score')}
                  className={`touch-manipulation px-1.5 py-0.5 rounded-2xs border font-bold cursor-pointer ${
                    sortBy === 'score'
                      ? 'bg-[#12579b] text-[#fae5b8] border-[#0a2d52]'
                      : 'bg-[#fae5b8] text-[#5c3509] border-[#c99a57]'
                  }`}
                >
                  🔥 PTS
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy('slates')}
                  className={`touch-manipulation px-1.5 py-0.5 rounded-2xs border font-bold cursor-pointer ${
                    sortBy === 'slates'
                      ? 'bg-[#12579b] text-[#fae5b8] border-[#0a2d52]'
                      : 'bg-[#fae5b8] text-[#5c3509] border-[#c99a57]'
                  }`}
                >
                  🎯 SLATES
                </button>
              </div>
            </div>

            <div className="relative flex items-center gap-1 w-full">
              {/* Left Arrow Button */}
              <button
                type="button"
                onClick={handlePrevStandingSlate}
                disabled={currentStandingSlateIdx === 0}
                className="touch-manipulation p-1 bg-[#ebd2a4] hover:bg-[#fae5b8] text-[#5c3509] border border-[#c99a57] rounded-xs font-pixel text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed shadow-xs active:translate-y-0.5 shrink-0 flex items-center justify-center cursor-pointer"
                title="Previous Standings Slate"
                aria-label="Previous Standings Slate"
              >
                <ChevronLeft size={14} className="text-[#5c3509]" />
              </button>

              <div
                ref={standingSlateScrollRef}
                className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 scroll-smooth"
              >
                {/* Option 1: 🏆 WEEKLY MEGA BATTLE (TOTAL) */}
                <button
                  ref={leagueSlateFilter === 'MEGA_TOTAL' ? activeStandingSlateBtnRef : undefined}
                  type="button"
                  onClick={() => setLeagueSlateFilter('MEGA_TOTAL')}
                  className={`touch-manipulation px-2.5 py-1 rounded-xs font-pixel text-[9px] sm:text-[10px] border-2 cursor-pointer transition-all flex items-center gap-1 shrink-0 whitespace-nowrap shadow-xs ${
                    leagueSlateFilter === 'MEGA_TOTAL'
                      ? 'bg-[#12579b] text-[#fae5b8] border-[#0a2d52] ring-2 ring-[#38bdf8] font-bold'
                      : 'bg-[#fae5b8] hover:bg-[#fff7ed] text-[#5c3509] border-[#c99a57]'
                  }`}
                >
                  <span>🏆 MEGA BATTLE</span>
                  <span className="text-[8px] bg-[#f59e0b] text-[#78350f] px-1 rounded-2xs font-black">TOTAL</span>
                </button>

                {/* Option 2: ⭐ WEEKLY SUPERSTARS */}
                <button
                  ref={leagueSlateFilter === 'SUPERSTARS' ? activeStandingSlateBtnRef : undefined}
                  type="button"
                  onClick={() => setLeagueSlateFilter('SUPERSTARS')}
                  className={`touch-manipulation px-2 py-1 rounded-xs font-pixel text-[9px] sm:text-[10px] border-2 cursor-pointer transition-all flex items-center gap-1 shrink-0 whitespace-nowrap shadow-xs ${
                    leagueSlateFilter === 'SUPERSTARS'
                      ? 'bg-[#12579b] text-[#fae5b8] border-[#0a2d52] ring-2 ring-[#38bdf8] font-bold'
                      : 'bg-[#fae5b8] hover:bg-[#fff7ed] text-[#5c3509] border-[#c99a57]'
                  }`}
                >
                  <Sparkles size={10} className="text-[#f59e0b]" />
                  <span>SUPERSTARS</span>
                </button>

                {/* Option 3..N: Games in order */}
                {sortedMatches.map((m) => {
                  const away = (m.awayTeamCode || m.away_team || '').trim().toUpperCase();
                  const home = (m.homeTeamCode || m.home_team || '').trim().toUpperCase();
                  const pairKey = `${away}@${home}`;
                  const isSelected = leagueSlateFilter === pairKey;
                  return (
                    <button
                      key={pairKey || m.id}
                      ref={isSelected ? activeStandingSlateBtnRef : undefined}
                      type="button"
                      onClick={() => setLeagueSlateFilter(pairKey)}
                      className={`touch-manipulation px-2 py-1 rounded-xs font-pixel text-[9px] sm:text-[10px] border-2 cursor-pointer transition-all shrink-0 whitespace-nowrap shadow-xs ${
                        isSelected
                          ? 'bg-[#12579b] text-[#fae5b8] border-[#0a2d52] ring-2 ring-[#38bdf8] font-bold'
                          : 'bg-[#fae5b8] hover:bg-[#fff7ed] text-[#5c3509] border-[#c99a57]'
                      }`}
                    >
                      <span>{away}@{home}</span>
                    </button>
                  );
                })}
              </div>

              {/* Right Arrow Button */}
              <button
                type="button"
                onClick={handleNextStandingSlate}
                disabled={currentStandingSlateIdx === standingsSlateOptions.length - 1}
                className="touch-manipulation p-1 bg-[#ebd2a4] hover:bg-[#fae5b8] text-[#5c3509] border border-[#c99a57] rounded-xs font-pixel text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed shadow-xs active:translate-y-0.5 shrink-0 flex items-center justify-center cursor-pointer"
                title="Next Standings Slate"
                aria-label="Next Standings Slate"
              >
                <ChevronRight size={14} className="text-[#5c3509]" />
              </button>
            </div>
          </div>
        )}

        {/* 2-Column Table Column Headers */}
        <div className="flex items-center justify-between px-2.5 sm:px-3 py-1.5 mb-2 bg-[#d4a86a]/30 border border-[#d4a86a] rounded-xs font-pixel text-[10px] text-[#784610]">
          <span className="tracking-wider">{activeTier === 'family' ? 'RANK & SQUAD (TAP TO INSPECT)' : 'RANK & PLAYER'}</span>
          <span className="tracking-wider text-right">PTS</span>
        </div>

        {/* List Content */}
        <div className="space-y-2 w-full">
          {activeTier === 'family' ? (
            /* TIER 1: FAMILY RANKING (Dynamic sum of chosen 3 Stars) */
            familyListWithDynamicTotals.length === 0 ? (
              <div className="p-6 sm:p-8 text-center border-2 border-dashed border-[#c99a57] rounded-xs bg-[#fae9c8]/50 flex flex-col items-center justify-center">
                <span className="text-2xl mb-2">{sport === 'nba' ? '🏀' : '🏈'}</span>
                <p className="font-pixel text-xs sm:text-sm text-[#5c3509] mb-1">NO SQUADS IN ROOM "{cleanRoom}" YET</p>
                <p className="font-retro text-xs text-[#784610]">Create your first squad to start the household competition!</p>
              </div>
            ) : (
              familyListWithDynamicTotals.map((entry, index) => {
                const displayRank = index + 1;
                const isUser = entry.isYou;
                const isExpanded = expandedSquadName === entry.userName;

                return (
                  <div
                    key={entry.userName}
                    className={`w-full border-2 rounded-xs transition-all box-border overflow-hidden ${
                      isUser
                        ? 'bg-[#155e9e] text-[#fae5b8] border-[#38bdf8] shadow-[0_3px_0_0_#051a30]'
                        : 'bg-[#ebd2a4] text-[#5c3509] border-[#c99a57]'
                    }`}
                  >
                    {/* Main Row: Click to toggle expand */}
                    <div
                      onClick={() => setExpandedSquadName((prev) => (prev === entry.userName ? null : entry.userName))}
                      className="w-full flex items-center justify-between p-2.5 sm:p-3 cursor-pointer select-none"
                    >
                      {/* Column 1: Rank Badge + Helmet + Name + Badges */}
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 pr-2">
                        {/* Rank Badge */}
                        <span
                          className={`font-pixel text-[10px] sm:text-xs px-2 py-0.5 border rounded-xs shrink-0 font-bold ${getRankBadge(
                            displayRank
                          )}`}
                        >
                          #{displayRank}
                        </span>

                        {/* Real PNG Helmet / Icon */}
                        <div className="shrink-0">
                          {sport === 'nfl' ? (
                            <PixelHelmet
                              teamCode={entry.stars.find((s) => s?.teamCode)?.teamCode || 'KC'}
                              size={24}
                              className="shrink-0"
                            />
                          ) : (
                            <span className="text-xl select-none">🏀</span>
                          )}
                        </div>

                        {/* Name + Badges */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-pixel text-xs sm:text-sm tracking-wide truncate font-bold">
                              {entry.userName}
                            </span>
                            {isUser && (
                              <span className="font-pixel text-[9px] px-1.5 py-0.2 bg-[#fde047] text-[#78350f] border border-[#b45309] rounded-2xs shrink-0 font-bold">
                                YOU
                              </span>
                            )}
                            {entry.isLocked && (
                              <span className="font-pixel text-[8px] sm:text-[9px] px-1.5 py-0.2 bg-[#166534] text-[#bbf7d0] border border-[#14532d] rounded-2xs shrink-0 flex items-center gap-0.5 font-bold">
                                <span>🔒</span>
                                <span>LOCKED</span>
                              </span>
                            )}
                          </div>

                          <div className="font-retro text-[9px] sm:text-[10px] opacity-90 font-bold mt-0.5">
                            {leagueSlateFilter === 'MEGA_TOTAL' ? (
                              <span>
                                {entry.slatesCount} {entry.slatesCount === 1 ? 'game battle' : 'game battles'} • Superstars: {entry.superstarsScore.toFixed(1)}p
                              </span>
                            ) : (
                              <span>
                                {entry.stars.filter(Boolean).length}/3 stars picked
                              </span>
                            )}
                          </div>

                          {/* 3 Mini Star Badges */}
                          <div className="flex items-center gap-1 mt-1 flex-wrap">
                            {[0, 1, 2].map((sIdx) => {
                              const star = entry.stars[sIdx];
                              if (!star) {
                                return (
                                  <span
                                    key={sIdx}
                                    className={`font-pixel text-[8px] px-1.5 py-0.5 rounded-2xs border ${
                                      isUser
                                        ? 'bg-[#0f3d6b] text-[#93c5fd] border-[#38bdf8]/30'
                                        : 'bg-[#fae5b8] text-[#784610] border-[#d4a86a]'
                                    }`}
                                  >
                                    ★ EMPTY
                                  </span>
                                );
                              }

                              return (
                                <span
                                  key={sIdx}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenPlayerDetail && onOpenPlayerDetail(star);
                                  }}
                                  className={`font-pixel text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded-2xs border cursor-pointer hover:underline transition-all whitespace-nowrap inline-flex items-center gap-1 ${
                                    star.injuryStatus === 'I' || star.injuryStatus === 'Q'
                                      ? 'bg-[#d8d9dc] text-[#374151] border-[#9ca3af]'
                                      : isUser
                                      ? 'bg-[#0a2d52] text-[#fae5b8] border-[#38bdf8]/50 hover:bg-[#0c3764]'
                                      : 'bg-[#fae5b8] text-[#5c3509] border-[#c99a57] hover:bg-[#fff7ed]'
                                  }`}
                                  title={`${star.displayName} (${star.teamCode})`}
                                >
                                  <span>★ {formatPlayerInitialLastName(star.displayName)} ({getPlayerLivePoints(star)}p)</span>
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Column 2: Total Points Right-Aligned + Expand Chevron */}
                      <div className="shrink-0 flex items-center gap-1.5 ml-2">
                        <div
                          className={`px-2.5 py-1 font-pixel text-xs sm:text-sm font-bold border rounded-xs shadow-xs text-right whitespace-nowrap ${
                            isUser
                              ? 'bg-[#38bdf8] text-[#080d1a] border-[#0284c7]'
                              : 'bg-[#12579b] text-[#fae5b8] border-[#0a2d52]'
                          }`}
                        >
                          {entry.totalScore ? `${entry.totalScore.toLocaleString()} PTS` : '0 PTS'}
                        </div>
                        <div className="text-current opacity-70">
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                      </div>
                    </div>

                    {/* Expandable Squad Details Drawer */}
                    {isExpanded && (
                      <div className={`p-2.5 sm:p-3 border-t-2 ${isUser ? 'bg-[#0e4475] border-[#38bdf8]/40' : 'bg-[#f7edd9] border-[#c99a57]'}`}>
                        <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-current/20">
                          <span className="font-pixel text-[10px] sm:text-xs font-bold tracking-wide">
                            🔍 {entry.userName}'S SQUAD BREAKDOWN
                          </span>
                          {onSelectSquad && (
                            <button
                              type="button"
                              onClick={() => onSelectSquad(entry.userName)}
                              className="touch-manipulation px-2 py-0.5 bg-[#facc15] hover:bg-[#fde047] text-[#451a03] font-pixel text-[8px] sm:text-[9px] font-bold rounded-2xs border border-[#ca8a04] cursor-pointer shadow-xs active:translate-y-0.5 flex items-center gap-1"
                            >
                              <span>✏️</span>
                              <span>{isUser ? 'MANAGE YOUR ROSTER' : `SWITCH TO ${entry.userName}`}</span>
                            </button>
                          )}
                        </div>

                        {/* 3 Stars Detailed Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-2">
                          {[0, 1, 2].map((idx) => {
                            const star = entry.stars[idx];
                            if (!star) {
                              return (
                                <div
                                  key={idx}
                                  className="p-2 bg-[#ebd2a4]/50 border border-dashed border-[#c99a57] rounded-xs text-center flex flex-col items-center justify-center min-h-[60px]"
                                >
                                  <span className="font-pixel text-[9px] text-[#784610]/70">★ STAR {idx + 1}: EMPTY</span>
                                </div>
                              );
                            }

                            const livePts = getPlayerLivePoints(star);
                            return (
                              <div
                                key={star.id || idx}
                                onClick={() => onOpenPlayerDetail && onOpenPlayerDetail(star)}
                                className="p-1.5 sm:p-2 bg-[#fae5b8] text-[#5c3509] border border-[#c99a57] rounded-xs cursor-pointer hover:bg-white transition-colors flex items-center justify-between gap-1.5 shadow-2xs"
                              >
                                <div className="min-w-0">
                                  <div className="font-pixel text-[10px] sm:text-xs font-bold truncate">
                                    {star.displayName}
                                  </div>
                                  <div className="font-retro text-[9px] text-[#784610] font-bold">
                                    #{star.uniformNumber} · {star.teamCode} · {star.position}
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <div className="font-pixel text-xs sm:text-sm font-bold text-[#12579b]">
                                    {livePts}p
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* In MEGA_TOTAL: Game Slates Breakdown list */}
                        {leagueSlateFilter === 'MEGA_TOTAL' && entry.slateBreakdowns && entry.slateBreakdowns.length > 0 && (
                          <div className="mt-2.5 pt-2 border-t border-current/15">
                            <div className="font-pixel text-[9px] sm:text-[10px] font-bold mb-1.5 opacity-90">
                              🏈 GAMES CONTRIBUTING TO TOTAL:
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {entry.slateBreakdowns.map((sb) => (
                                <button
                                  key={sb.slateId}
                                  type="button"
                                  onClick={() => setLeagueSlateFilter(sb.slateId)}
                                  className="touch-manipulation px-2 py-1 bg-[#faebd0] hover:bg-white text-[#5c3509] border border-[#c99a57] rounded-2xs font-pixel text-[8px] sm:text-[9px] font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                                  title={`Tap to jump to ${sb.label} standings`}
                                >
                                  <span>{sb.label}:</span>
                                  <span className="text-[#12579b]">{sb.points.toFixed(1)}p</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )
          ) : (
          /* TIER 2: TOP SCORES (Top 20 Real NFL Athletes from competitors table) */
            top20Players.map((player, index) => {
              const displayRank = index + 1;
              const { firstName, lastName } = splitPlayerFirstLastName(player.displayName);
              const teamPosSubtitle = formatTeamPosSubtitle(player.teamCode, player.position || player.positionGeneric);

              // Find all members in the current room who picked this athlete
              const pickedByUsers: string[] = [];
              familyListWithDynamicTotals.forEach((fam) => {
                const hasPlayer = fam.stars.some(
                  (s) =>
                    s &&
                    (s.id.toLowerCase() === player.id.toLowerCase() ||
                      s.shortName.toLowerCase() === player.shortName.toLowerCase())
                );
                if (hasPlayer) {
                  pickedByUsers.push(formatPickedByName(fam.userName));
                }
              });
              const pickedByLabel = pickedByUsers.join(' & ');

              return (
                <div
                  key={player.id || index}
                  onClick={() => onOpenPlayerDetail && onOpenPlayerDetail(player)}
                  className="w-full flex items-center justify-between p-2 sm:p-2.5 bg-[#ebd2a4] hover:bg-[#fae9c8] text-[#5c3509] border-2 border-[#c99a57] rounded-xs cursor-pointer transition-all active:translate-y-0.5 box-border"
                >
                  {/* Column 1: Rank Badge + Sprite + Stacked Name + [TEAM] · [POS] */}
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 pr-2">
                    {/* Rank Badge */}
                    <span
                      className={`font-pixel text-[10px] sm:text-xs px-2 py-0.5 border rounded-xs shrink-0 font-bold ${getRankBadge(
                        displayRank
                      )}`}
                    >
                      #{displayRank}
                    </span>

                    {/* Sprite */}
                    <div className="shrink-0">
                      {(() => {
                        const playerMatch = findMatchForPlayer(player, matches);
                        const visualAvatar = getPlayerVisualAvatar(player, playerMatch);
                        const livePts = getPlayerLivePoints(player);
                        return (
                          <PixelPlayerSprite
                            avatar={visualAvatar}
                            number={visualAvatar.number}
                            size="sm"
                            withShadow={false}
                            sport={sport}
                            isOnFire={sport === 'nba' && livePts >= 40}
                          />
                        );
                      })()}
                    </div>

                    {/* Stacked Name + (TEAM · POS) + Picked By Arcade Tag */}
                    <div className="min-w-0 flex-1">
                      <div className="leading-tight">
                        {firstName && (
                          <div className="font-pixel text-[9px] sm:text-[10px] text-[#784610] uppercase opacity-85">
                            {firstName}
                          </div>
                        )}
                        <div className="font-pixel text-xs sm:text-sm text-[#451a03] font-bold uppercase tracking-wide break-words">
                          {lastName}
                        </div>
                      </div>
                      <div className="font-retro text-[10px] sm:text-[11px] text-[#784610] mt-0.5">
                        {teamPosSubtitle} • #{player.uniformNumber}
                      </div>

                      {/* Arcade Tag: 🏷️ Picked by [User Name] */}
                      {pickedByUsers.length > 0 && (
                        <div className="mt-1 flex items-center">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#fef3c7] text-[#92400e] border border-[#f59e0b] font-pixel text-[8px] sm:text-[9px] rounded-2xs shadow-2xs font-bold whitespace-nowrap">
                            🏷️ Picked by {pickedByLabel}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Column 2: Total Points Right-Aligned */}
                  <div className="shrink-0 whitespace-nowrap ml-2">
                    <div className="px-2.5 py-1 bg-[#12579b] text-[#fae5b8] font-pixel text-xs sm:text-sm font-bold border border-[#0a2d52] shadow-xs rounded-xs text-right whitespace-nowrap">
                      {(() => {
                        const pts = getPlayerLivePoints(player);
                        return pts ? `${pts.toLocaleString()} PTS` : '0 PTS';
                      })()}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

    </div>
  );
};
