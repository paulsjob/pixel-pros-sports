import React, { useState } from 'react';
import { Competitor, Match, SportId, UserProfile, UserRoster } from '../types';
import { PixelPlayerSprite } from './PixelPlayerSprite';
import { PixelShieldIcon } from './PixelBadges';
import { PixelHelmet } from './PixelHelmet';
import { Users, Sparkles } from 'lucide-react';
import { splitPlayerFirstLastName, formatPlayerInitialLastName, formatTeamPosSubtitle } from '../utils/formatters';
import { getDeviceId } from '../lib/deviceIdentity';
import { isGhostUser } from '../lib/supabaseClient';
import { getPlayerScoringDisplay, resolvePlayerInPool, findMatchForPlayer, getPlayerVisualAvatar } from '../utils/teamData';

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

  const safeNflPlayers = Array.isArray(nflCompetitors) ? nflCompetitors : [];
  const safeRoomRosters = Array.isArray(roomRosters) ? roomRosters : [];
  const cleanRoom = (roomCode || 'COUCH').trim().toUpperCase();
  const activeNormalizedName = (userName || '').trim().toUpperCase();

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

  // Map to deduplicate strictly by user_name.toUpperCase() in this room
  const rosterMap = new Map<string, UserRoster>();

  // 1. Add synced room rosters strictly belonging to this room_code (ignoring ghost users)
  safeRoomRosters.forEach((r) => {
    if (isGhostUser(r.user_name)) return;
    if ((r.room_code || '').toUpperCase() === cleanRoom) {
      const key = (r.user_name || '').trim().toUpperCase();
      if (key) {
        rosterMap.set(key, r);
      }
    }
  });

  // 2. Always enforce currently active squad's live picks if active user exists
  if (activeNormalizedName) {
    rosterMap.set(activeNormalizedName, currentUserRoster);
  }

  const familyListWithDynamicTotals = Array.from(rosterMap.values())
    .filter((entry) => !isGhostUser(entry.user_name))
    .map((entry) => {
    const entryName = (entry.user_name || '').trim().toUpperCase();
    const isUser = entryName === activeNormalizedName;

    const star1 = resolvePlayerInPool(entry.star_1_id, safeNflPlayers, sport);
    const star2 = resolvePlayerInPool(entry.star_2_id, safeNflPlayers, sport);
    const star3 = resolvePlayerInPool(entry.star_3_id, safeNflPlayers, sport);
    const starPlayers = [star1, star2, star3].filter(Boolean) as Competitor[];

    // Calculate dynamic total: (Star 1 live pts) + (Star 2 live pts) + (Star 3 live pts)
    const sumPoints = starPlayers.reduce((sum, p) => sum + getPlayerLivePoints(p), 0);

    return {
      userName: entryName,
      isYou: isUser,
      isLocked: Boolean(entry.is_locked || entry.device_id === 'LOCKED'),
      starPlayers,
      totalScore: sumPoints,
      stars: [star1, star2, star3],
    };
  }).sort((a, b) => b.totalScore - a.totalScore);

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
        <div className="flex items-center justify-between pb-2.5 sm:pb-3 mb-3 border-b-2 border-[#d4a86a]">
          <div>
            <h2 className="font-pixel text-xs sm:text-sm text-[#5c3509] tracking-wider uppercase">
              {activeTier === 'family'
                ? `ROOM "${roomCode.toUpperCase()}"`
                : sport === 'nba'
                ? 'TOP NBA ATHLETES'
                : 'TOP NFL ATHLETES'}
            </h2>
          </div>

          <span className="font-pixel text-[10px] sm:text-[11px] text-[#12579b] bg-[#fae9c8] px-2 py-0.5 border border-[#d4a86a] rounded-xs shrink-0 whitespace-nowrap">
            {activeTier === 'family'
              ? `${familyListWithDynamicTotals.length === 1 ? '1 SQUAD' : `${familyListWithDynamicTotals.length} SQUADS`}`
              : `${top20Players.length} STARS`}
          </span>
        </div>

        {/* 2-Column Table Column Headers */}
        <div className="flex items-center justify-between px-2.5 sm:px-3 py-1.5 mb-2 bg-[#d4a86a]/30 border border-[#d4a86a] rounded-xs font-pixel text-[10px] text-[#784610]">
          <span className="tracking-wider">{activeTier === 'family' ? 'RANK' : 'RANK & PLAYER'}</span>
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

              return (
                <div
                  key={entry.userName}
                  onClick={() => onSelectSquad && onSelectSquad(entry.userName)}
                  className={`w-full flex items-center justify-between p-2.5 sm:p-3 border-2 rounded-xs transition-all box-border ${
                    onSelectSquad ? 'cursor-pointer' : ''
                  } ${
                    isUser
                      ? 'bg-[#155e9e] text-[#fae5b8] border-[#38bdf8] shadow-[0_3px_0_0_#051a30]'
                      : 'bg-[#ebd2a4] text-[#5c3509] border-[#c99a57] hover:bg-[#fae9c8]'
                  }`}
                  title={onSelectSquad ? (isUser ? `Active squad: ${entry.userName}` : `Tap to manage ${entry.userName}'s squad`) : undefined}
                >
                  {/* Column 1: Rank Badge + Helmet Icon + Name + 3 Mini Star Badges */}
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

                    {/* Name + 3 Mini Star Badges */}
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
                              className={`font-pixel text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded-2xs border cursor-pointer hover:underline transition-all whitespace-nowrap ${
                                isUser
                                  ? 'bg-[#0a2d52] text-[#fae5b8] border-[#38bdf8]/50 hover:bg-[#0c3764]'
                                  : 'bg-[#fae5b8] text-[#5c3509] border-[#c99a57] hover:bg-[#fff7ed]'
                              }`}
                              title={`${star.displayName} (${star.teamCode})`}
                            >
                              ★ {formatPlayerInitialLastName(star.displayName)} ({getPlayerLivePoints(star)}p)
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Total Points Right-Aligned (shrink-0 and whitespace-nowrap) */}
                  <div className="shrink-0 whitespace-nowrap ml-2">
                    <div
                      className={`px-2.5 py-1 font-pixel text-xs sm:text-sm font-bold border rounded-xs shadow-xs text-right whitespace-nowrap ${
                        isUser
                          ? 'bg-[#38bdf8] text-[#080d1a] border-[#0284c7]'
                          : 'bg-[#12579b] text-[#fae5b8] border-[#0a2d52]'
                      }`}
                    >
                      {entry.totalScore ? `${entry.totalScore.toLocaleString()} PTS` : '0 PTS'}
                    </div>
                  </div>
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
