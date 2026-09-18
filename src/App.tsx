import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { INITIAL_USER } from './data/mockData';
import { Competitor, UserProfile, Match, UserRoster, ActiveSlot, SquadSlots, SportId } from './types';
import {
  resetRoomRosters,
  subscribeToRealtimeScores,
  subscribeToRoomRosters,
  fetchLiveCompetitors,
  fetchLiveMatches,
  upsertUserRoster,
  fetchRoomRosters,
  deleteUserRoster,
  getSquadLockState,
  setSquadLockState,
  isGhostUser,
  fetchAllActiveRooms,
  ActiveRoomSummary,
} from './lib/supabaseClient';
import { MyTeamView } from './components/MyTeamView';
import { LeaderboardView } from './components/LeaderboardView';
import { FamilySquadSwitcher } from './components/FamilySquadSwitcher';
import { SimpleRulesView } from './components/SimpleRulesView';
import { PlayerCardModal } from './components/PlayerCardModal';
import { PlayerPickerModal } from './components/PlayerPickerModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PixelHelmetIcon } from './components/PixelBadges';
import { SportSwitcher } from './components/SportSwitcher';
import { CommissionerModal } from './components/CommissionerModal';
import { getCurrentNFLWeek, syncESPNData } from './lib/espnSync';
import { DEFAULT_NFL_MATCHES } from './utils/teamData';
import { DEFAULT_NBA_MATCHES } from './utils/nbaTeamData';
import { Users, Trophy, HelpCircle, Share2, ShieldAlert } from 'lucide-react';

export default function App() {
  const [currentSport, setCurrentSport] = useState<SportId>(() => {
    try {
      const saved = localStorage.getItem('pixel_pros_sport');
      if (saved === 'nba' || saved === 'nfl') return saved;
    } catch {}
    return 'nfl';
  });

  const [currentTab, setCurrentTab] = useState<'squad' | 'couch'>('squad');
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isCommissionerOpen, setIsCommissionerOpen] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshTick((t) => t + 1);
  }, []);

  const [roomCode, setRoomCode] = useState<string>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlRoom = params.get('room') || params.get('r');
      if (urlRoom && urlRoom.trim()) {
        return urlRoom.trim().toUpperCase();
      }
      const sport = (localStorage.getItem('pixel_pros_sport') as SportId) || 'nfl';
      return (localStorage.getItem(`pixel_pros_room_code_${sport}`) || (sport === 'nba' ? 'HOOPS' : 'COUCH')).toUpperCase();
    } catch {
      return 'COUCH';
    }
  });

  const [userName, setUserName] = useState<string>(() => {
    try {
      const sport = (localStorage.getItem('pixel_pros_sport') as SportId) || 'nfl';
      const r = (localStorage.getItem(`pixel_pros_room_code_${sport}`) || 'COUCH').toUpperCase();
      const saved = localStorage.getItem(`pixel_pros_user_${sport}_${r}`);
      return saved ? saved.trim().toUpperCase() : '';
    } catch {
      return '';
    }
  });
  const userNameRef = useRef<string>(userName);
  userNameRef.current = userName;

  const [isAddSquadDrawerOpen, setIsAddSquadDrawerOpen] = useState(false);
  const userExplicitlyJoinedRoomRef = useRef<string | null>(null);

  const [roster, setRoster] = useState<Competitor[]>([]);
  const rosterRef = useRef<Competitor[]>([]);
  rosterRef.current = roster;

  const [matches, setMatches] = useState<Match[]>(() =>
    currentSport === 'nba' ? DEFAULT_NBA_MATCHES : DEFAULT_NFL_MATCHES
  );
  const [roomRosters, setRoomRosters] = useState<UserRoster[]>([]);

  const [squadSlots, setSquadSlots] = useState<SquadSlots>({
    star1: null,
    star2: null,
    star3: null,
  });

  const [activeSlot, setActiveSlot] = useState<ActiveSlot | null>(null);

  const [isLocked, setIsLocked] = useState<boolean>(() => {
    try {
      const sport = (localStorage.getItem('pixel_pros_sport') as SportId) || 'nfl';
      const r = (localStorage.getItem(`pixel_pros_room_code_${sport}`) || 'COUCH').toUpperCase();
      const u = (localStorage.getItem(`pixel_pros_user_${sport}_${r}`) || '').toUpperCase();
      return u ? getSquadLockState(r, u, sport) : false;
    } catch {
      return false;
    }
  });

  const [recentRooms, setRecentRooms] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`pixel_pros_recent_rooms_${currentSport}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return currentSport === 'nba' ? ['HOOPS', 'FINALS', 'COUCH'] : ['COUCH', 'CUSE001', 'SUPERBOWL'];
  });

  const [detailedPlayer, setDetailedPlayer] = useState<Competitor | null>(null);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [tempRoomCode, setTempRoomCode] = useState(roomCode);
  const [availableRooms, setAvailableRooms] = useState<ActiveRoomSummary[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isRoomModalOpen) {
      setTempRoomCode(roomCode);
      setIsLoadingRooms(true);
      fetchAllActiveRooms()
        .then((rooms) => {
          setAvailableRooms(rooms);
        })
        .finally(() => {
          setIsLoadingRooms(false);
        });
    }
  }, [isRoomModalOpen, roomCode]);

  const consolidatedCouches = useMemo(() => {
    const map = new Map<string, { roomCode: string; sport: SportId; squadCount: number }>();

    // 1. Only include active rooms that actually have squads in Supabase for this sport
    availableRooms
      .filter((r) => r.squadCount > 0 && r.sport === currentSport)
      .forEach((r) => {
        const code = (r.roomCode || '').trim().toUpperCase();
        if (!code) return;
        map.set(code, {
          roomCode: code,
          sport: r.sport,
          squadCount: r.squadCount,
        });
      });

    // 2. Default room COUCH / HOOPS is always available
    const defaultCode = currentSport === 'nba' ? 'HOOPS' : 'COUCH';
    if (!map.has(defaultCode)) {
      map.set(defaultCode, {
        roomCode: defaultCode,
        sport: currentSport,
        squadCount: 0,
      });
    }

    // Sort by squad count descending (most populated couch first)
    return Array.from(map.values()).sort((a, b) => b.squadCount - a.squadCount);
  }, [availableRooms, currentSport]);

  const previousRoom = useMemo(() => {
    const defaultCode = currentSport === 'nba' ? 'HOOPS' : 'COUCH';
    const alt = consolidatedCouches.find((c) => c.roomCode.toUpperCase() !== roomCode.toUpperCase());
    if (alt) return alt.roomCode;
    return defaultCode;
  }, [consolidatedCouches, roomCode, currentSport]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 3200);
  };

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlRoom = params.get('room') || params.get('r');
      const urlSport = (params.get('sport') || params.get('s') || '').toLowerCase() as SportId;

      if (urlSport === 'nba' || urlSport === 'nfl') {
        setCurrentSport(urlSport);
        localStorage.setItem('pixel_pros_sport', urlSport);
      }

      if (urlRoom && urlRoom.trim()) {
        const clean = urlRoom.trim().toUpperCase();
        setRoomCode(clean);
        setTempRoomCode(clean);
        localStorage.setItem(`pixel_pros_room_code_${urlSport || currentSport}`, clean);
        showToast(`Joined Room ${clean} via invite!`);
      }
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch {}
  }, []);

  const handleSportChange = (sport: SportId) => {
    if (sport === currentSport) return;
    setCurrentSport(sport);
    localStorage.setItem('pixel_pros_sport', sport);

    const scopedRoom = (localStorage.getItem(`pixel_pros_room_code_${sport}`) || (sport === 'nba' ? 'HOOPS' : 'COUCH')).toUpperCase();
    setRoomCode(scopedRoom);
    setTempRoomCode(scopedRoom);

    const scopedUser = (localStorage.getItem(`pixel_pros_user_${sport}_${scopedRoom}`) || '').toUpperCase();
    setUserName(scopedUser);

    setSquadSlots({ star1: null, star2: null, star3: null });
    setIsLocked(false);

    try {
      const savedRecent = localStorage.getItem(`pixel_pros_recent_rooms_${sport}`);
      setRecentRooms(savedRecent ? JSON.parse(savedRecent) : (sport === 'nba' ? ['HOOPS', 'FINALS'] : ['COUCH', 'CUSE001']));
    } catch {}

    showToast(sport === 'nba' ? 'Switched to NBA Edition!' : 'Switched to NFL Edition!');
  };

  const handleShareRoom = async () => {
    const cleanRoom = (roomCode || 'COUCH').trim().toUpperCase();
    const inviteUrl = `${window.location.origin}/?sport=${currentSport}&room=${cleanRoom}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Pixel Pros ${currentSport.toUpperCase()}`,
          text: `Join room "${cleanRoom}" on Pixel Pros and draft your 3 ${currentSport.toUpperCase()} stars!`,
          url: inviteUrl,
        });
        return;
      } catch {}
    }

    try {
      await navigator.clipboard.writeText(inviteUrl);
      showToast(`COPIED ROOM ${cleanRoom} INVITE LINK!`);
    } catch {
      showToast(`Link: ${inviteUrl}`);
    }
  };

  const syncLineupToSupabase = useCallback(
    async (
      rCode: string,
      uName: string,
      slotsObj: SquadSlots,
      lockedFlag?: boolean,
      targetSport?: SportId
    ) => {
      const activeSport = targetSport || currentSport;
      const normalizedRoom = (rCode || (activeSport === 'nba' ? 'HOOPS' : 'COUCH')).trim().toUpperCase();
      const cleanName = (uName || '').trim().toUpperCase();
      if (!cleanName) return;

      const s1 = slotsObj.star1?.id || '';
      const s2 = slotsObj.star2?.id || '';
      const s3 = slotsObj.star3?.id || '';
      const filledIds = [s1, s2, s3].filter(Boolean);
      const distinctIds = new Set(filledIds);
      const hasThreeDistinct = filledIds.length === 3 && distinctIds.size === 3;
      const rawLocked = typeof lockedFlag === 'boolean' ? lockedFlag : isLocked;
      const guardedLocked = hasThreeDistinct && Boolean(rawLocked);

      setSquadLockState(normalizedRoom, cleanName, guardedLocked, activeSport);
      localStorage.setItem(`pixel_pros_roster_${activeSport}_${normalizedRoom}_${cleanName}`, JSON.stringify([s1, s2, s3]));

      const result = await upsertUserRoster(
        normalizedRoom,
        cleanName,
        s1,
        s2,
        s3,
        guardedLocked,
        activeSport
      );

      if (!result.success) {
        console.error('Failed to sync squad to room in Supabase:', result.error);
        showToast('Failed to sync squad to room!');
      }

      const updated = await fetchRoomRosters(normalizedRoom, activeSport);
      setRoomRosters(updated);
    },
    [isLocked, currentSport]
  );

  const handleSelectSquad = async (squadName: string) => {
    const cleanName = squadName.trim().toUpperCase();
    if (!cleanName) return;

    setUserName(cleanName);
    localStorage.setItem(`pixel_pros_user_${currentSport}_${roomCode}`, cleanName);

    let existingRoster = roomRosters.find(
      (r) => (r.room_code || '').toUpperCase() === roomCode && r.user_name.toUpperCase() === cleanName
    );

    if (!existingRoster) {
      const freshRosters = await fetchRoomRosters(roomCode, currentSport);
      setRoomRosters(freshRosters);
      existingRoster = freshRosters.find(
        (r) => (r.room_code || '').toUpperCase() === roomCode && r.user_name.toUpperCase() === cleanName
      );
    }

    let s1: Competitor | null = null;
    let s2: Competitor | null = null;
    let s3: Competitor | null = null;
    let isLockedFromDb = false;

    if (existingRoster) {
      const masterList = rosterRef.current.length > 0 ? rosterRef.current : roster;
      s1 = masterList.find((p) => p.id === existingRoster!.star_1_id) || null;
      s2 = masterList.find((p) => p.id === existingRoster!.star_2_id) || null;
      s3 = masterList.find((p) => p.id === existingRoster!.star_3_id) || null;
      isLockedFromDb = Boolean(existingRoster.is_locked || existingRoster.device_id === 'LOCKED');
    }

    const filledStars = [s1, s2, s3].filter(Boolean) as Competitor[];
    const distinctIds = new Set(filledStars.map((p) => p.id));
    const hasThreeDistinct = filledStars.length === 3 && distinctIds.size === 3;
    const squadLocked = hasThreeDistinct && isLockedFromDb;

    setSquadSlots({ star1: s1, star2: s2, star3: s3 });
    setIsLocked(squadLocked);
    setSquadLockState(roomCode, cleanName, squadLocked, currentSport);
    setCurrentTab('squad');
    showToast(`Switched active squad to "${cleanName}"`);
  };

  const handleCreateSquad = async (squadName: string) => {
    const cleanName = squadName.trim().toUpperCase();
    if (!cleanName) return;

    setUserName(cleanName);
    localStorage.setItem(`pixel_pros_user_${currentSport}_${roomCode}`, cleanName);
    localStorage.setItem(`pixel_pros_roster_${currentSport}_${roomCode}_${cleanName}`, JSON.stringify(['', '', '']));
    setSquadLockState(roomCode, cleanName, false, currentSport);

    setSquadSlots({ star1: null, star2: null, star3: null });
    setIsLocked(false);

    await upsertUserRoster(roomCode, cleanName, null, null, null, false, currentSport);
    const updated = await fetchRoomRosters(roomCode, currentSport);
    setRoomRosters(updated);

    setCurrentTab('squad');
    showToast(`Created squad "${cleanName}" in ${currentSport.toUpperCase()}!`);
  };

  const handleDeleteSquad = async (targetUserName: string) => {
    const cleanName = (targetUserName || '').trim().toUpperCase();
    if (!cleanName) return;

    await deleteUserRoster(roomCode, cleanName, currentSport);
    setSquadLockState(roomCode, cleanName, false, currentSport);
    localStorage.removeItem(`pixel_pros_roster_${currentSport}_${roomCode}_${cleanName}`);

    const updatedRosters = roomRosters.filter(
      (r) => !(r.room_code.toUpperCase() === roomCode && r.user_name.toUpperCase() === cleanName)
    );
    setRoomRosters(updatedRosters);

    if (userName.toUpperCase() === cleanName) {
      if (updatedRosters.length > 0) {
        const nextName = updatedRosters[0].user_name.toUpperCase();
        setUserName(nextName);
        localStorage.setItem(`pixel_pros_user_${currentSport}_${roomCode}`, nextName);
        handleSelectSquad(nextName);
      } else {
        setUserName('');
        localStorage.removeItem(`pixel_pros_user_${currentSport}_${roomCode}`);
        setSquadSlots({ star1: null, star2: null, star3: null });
        setIsLocked(false);
      }
    }
    showToast(`Dropped squad "${cleanName}".`);
  };

  const handleCommitRoomCode = (newCode: string) => {
    const clean = (newCode || (currentSport === 'nba' ? 'HOOPS' : 'COUCH')).trim().toUpperCase();
    userExplicitlyJoinedRoomRef.current = clean;
    setRoomCode(clean);
    setTempRoomCode(clean);
    localStorage.setItem(`pixel_pros_room_code_${currentSport}`, clean);

    try {
      const url = new URL(window.location.href);
      url.searchParams.set('room', clean);
      window.history.replaceState({}, '', url.toString());
    } catch {}

    setRecentRooms((prev) => {
      const updated = [clean, ...prev.filter((r) => r !== clean)].slice(0, 8);
      localStorage.setItem(`pixel_pros_recent_rooms_${currentSport}`, JSON.stringify(updated));
      return updated;
    });

    const scopedUser = (localStorage.getItem(`pixel_pros_user_${currentSport}_${clean}`) || '').toUpperCase();
    setUserName(scopedUser);

    showToast(`Switched to Room ${clean}!`);
  };

  const handleRemoveRecentRoom = (roomToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const clean = roomToRemove.trim().toUpperCase();
    setRecentRooms((prev) => {
      const updated = prev.filter((r) => r !== clean);
      localStorage.setItem(`pixel_pros_recent_rooms_${currentSport}`, JSON.stringify(updated));
      return updated;
    });
  };

  const handleResetCurrentRoom = async () => {
    const confirmed = window.confirm(`Clear all ${currentSport.toUpperCase()} squads in room "${roomCode}"?`);
    if (!confirmed) return;

    try {
      await resetRoomRosters(roomCode);
    } catch {}

    setRoomRosters([]);
    setUserName('');
    setSquadSlots({ star1: null, star2: null, star3: null });
    setIsLocked(false);
    localStorage.removeItem(`pixel_pros_user_${currentSport}_${roomCode}`);

    setIsRoomModalOpen(false);
    showToast(`Room ${roomCode} reset.`);
  };

  const handleAssignSlot = (player: Competitor, targetSlot: ActiveSlot) => {
    if (!userName) {
      setIsAddSquadDrawerOpen(true);
      showToast('Please create a squad first!');
      return;
    }

    const filledCount = [squadSlots.star1, squadSlots.star2, squadSlots.star3].filter(Boolean).length;
    if (filledCount === 3 && isLocked) {
      showToast('Lineup is LOCKED! Tap UNLOCK PICKS to make changes.');
      return;
    }

    setSquadSlots((prev) => {
      const next: SquadSlots = { ...prev };
      if (next.star1?.id === player.id && targetSlot !== 'star1') next.star1 = null;
      if (next.star2?.id === player.id && targetSlot !== 'star2') next.star2 = null;
      if (next.star3?.id === player.id && targetSlot !== 'star3') next.star3 = null;

      next[targetSlot] = player;
      const newCount = [next.star1, next.star2, next.star3].filter(Boolean).length;
      const willBeLocked = newCount === 3 && isLocked;

      setIsLocked(willBeLocked);
      setSquadLockState(roomCode, userName, willBeLocked, currentSport);
      syncLineupToSupabase(roomCode, userName, next, willBeLocked);
      return next;
    });

    const slotLabel = targetSlot === 'star1' ? 'STAR 1' : targetSlot === 'star2' ? 'STAR 2' : 'STAR 3';
    showToast(`${player.displayName} assigned to ${slotLabel}!`);
  };

  const handleClearSlot = (slotKey: ActiveSlot) => {
    if (!userName) return;
    setSquadSlots((prev) => {
      const next = { ...prev, [slotKey]: null };
      setIsLocked(false);
      setSquadLockState(roomCode, userName, false, currentSport);
      syncLineupToSupabase(roomCode, userName, next, false);
      return next;
    });
    showToast(`Cleared ${slotKey.toUpperCase()} slot.`);
  };

  const handleToggleLock = () => {
    if (!userName) {
      setIsAddSquadDrawerOpen(true);
      return;
    }

    const filledCount = [squadSlots.star1, squadSlots.star2, squadSlots.star3].filter(Boolean).length;
    if (!isLocked && filledCount < 3) {
      showToast(`Select all 3 Stars before locking! (${filledCount}/3 picked)`);
      return;
    }

    const nextLocked = !isLocked && filledCount === 3;
    setIsLocked(nextLocked);
    setSquadLockState(roomCode, userName, nextLocked, currentSport);
    syncLineupToSupabase(roomCode, userName, squadSlots, nextLocked);

    showToast(nextLocked ? `PICKS LOCKED for ${userName}!` : `PICKS UNLOCKED for ${userName}!`);
  };

  useEffect(() => {
    let active = true;
    async function sync() {
      try {
        const [compData, matchData, rost, allRooms] = await Promise.all([
          fetchLiveCompetitors(currentSport),
          fetchLiveMatches(currentSport),
          fetchRoomRosters(roomCode, currentSport),
          fetchAllActiveRooms(),
        ]);

        if (!active) return;

        setRoster(compData || []);
        setMatches(matchData || []);
        setAvailableRooms(allRooms || []);

        const validRosters = (rost || []).filter((r) => !isGhostUser(r.user_name));
        const currentRoomHasSquads = validRosters.length > 0;
        const wasExplicitlyEntered = userExplicitlyJoinedRoomRef.current === roomCode;

        // Auto-reconciliation: If current room has 0 squads in Supabase and was not explicitly entered,
        // switch to the active populated room (e.g. COUCH)
        if (!currentRoomHasSquads && !wasExplicitlyEntered) {
          const activeSportRooms = (allRooms || []).filter(
            (r) => r.sport === currentSport && r.squadCount > 0
          );
          if (activeSportRooms.length > 0) {
            const primaryRoom = activeSportRooms[0].roomCode.toUpperCase();
            if (primaryRoom !== roomCode) {
              setRoomCode(primaryRoom);
              setTempRoomCode(primaryRoom);
              localStorage.setItem(`pixel_pros_room_code_${currentSport}`, primaryRoom);
              try {
                const url = new URL(window.location.href);
                if (url.searchParams.has('room') || url.searchParams.has('r')) {
                  url.searchParams.delete('room');
                  url.searchParams.delete('r');
                  window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
                }
              } catch {}
              return;
            }
          }
        }

        // Prune any dead rooms from recentRooms in localStorage
        const activeRoomCodes = new Set(
          (allRooms || [])
            .filter((r) => r.squadCount > 0 && r.sport === currentSport)
            .map((r) => r.roomCode.toUpperCase())
        );
        activeRoomCodes.add(currentSport === 'nba' ? 'HOOPS' : 'COUCH');
        setRecentRooms((prev) => {
          const cleaned = prev.filter((r) => activeRoomCodes.has((r || '').toUpperCase()));
          if (cleaned.length === 0) cleaned.push(currentSport === 'nba' ? 'HOOPS' : 'COUCH');
          try {
            localStorage.setItem(`pixel_pros_recent_rooms_${currentSport}`, JSON.stringify(cleaned));
          } catch {}
          return cleaned;
        });

        setRoomRosters(rost || []);

        let activeUserClean = userName;

        if (activeUserClean && !validRosters.some((r) => r.user_name.toUpperCase() === activeUserClean)) {
          if (validRosters.length > 0) {
            activeUserClean = validRosters[0].user_name.toUpperCase();
            setUserName(activeUserClean);
            localStorage.setItem(`pixel_pros_user_${currentSport}_${roomCode}`, activeUserClean);
          } else {
            activeUserClean = '';
            setUserName('');
          }
        } else if (!activeUserClean && validRosters.length > 0) {
          activeUserClean = validRosters[0].user_name.toUpperCase();
          setUserName(activeUserClean);
          localStorage.setItem(`pixel_pros_user_${currentSport}_${roomCode}`, activeUserClean);
        }

        let s1: Competitor | null = null;
        let s2: Competitor | null = null;
        let s3: Competitor | null = null;
        let initialLock = false;

        if (activeUserClean) {
          const dbRoster = validRosters.find((r) => r.user_name.toUpperCase() === activeUserClean);
          if (dbRoster) {
            s1 = (compData || []).find((a) => a.id === dbRoster.star_1_id) || null;
            s2 = (compData || []).find((a) => a.id === dbRoster.star_2_id) || null;
            s3 = (compData || []).find((a) => a.id === dbRoster.star_3_id) || null;
            initialLock = Boolean(dbRoster.is_locked || dbRoster.device_id === 'LOCKED');
          }
        }

        const filledCount = [s1, s2, s3].filter(Boolean).length;
        const finalLock = activeUserClean ? filledCount === 3 && initialLock : false;

        setSquadSlots({ star1: s1, star2: s2, star3: s3 });
        setIsLocked(finalLock);
      } catch (err) {
        console.warn('Room sync error:', err);
      }
    }

    sync();
    return () => {
      active = false;
    };
  }, [roomCode, currentSport, refreshTick]);

  useEffect(() => {
    const unsubscribeScores = subscribeToRealtimeScores(
      (competitorPayload) => {
        const updated = competitorPayload?.new as any;
        if (updated && (updated.id || updated.short_name)) {
          setRoster((prev) =>
            (prev || []).map((p) =>
              p.id === updated.id ? { ...p, score: Math.round(Number(updated.score ?? p.score) || 0) } : p
            )
          );
        }
      },
      () => {}
    );

    return () => {
      unsubscribeScores();
    };
  }, []);

  // Background ESPN Live Scoreboard Synchronization on mount & periodically
  useEffect(() => {
    let mounted = true;
    const runESPNLiveSync = async () => {
      try {
        await syncESPNData(currentSport);
      } catch (err) {
        console.warn('Auto ESPN live sync notice:', err);
      }
    };

    // Run on sport change / mount
    runESPNLiveSync();

    // Auto-poll ESPN live scoreboard every 30 seconds to keep live scores, quarters, and game state fresh
    const pollTimer = setInterval(runESPNLiveSync, 30000);
    return () => {
      mounted = false;
      clearInterval(pollTimer);
    };
  }, [currentSport]);

  useEffect(() => {
    const handleMatchesUpdate = (e: any) => {
      if (e.detail?.matches && (!e.detail?.sport || e.detail?.sport === currentSport)) {
        const currentNFLWeek = getCurrentNFLWeek();
        const incoming: Match[] = Array.isArray(e.detail.matches) ? e.detail.matches : [];
        const filtered = incoming.filter((m) => {
          if (currentSport === 'nfl' && m.week && m.week !== currentNFLWeek) return false;
          return true;
        });
        const sorted = [...filtered].sort((a, b) => {
          if (a.status === 'live' && b.status !== 'live') return -1;
          if (b.status === 'live' && a.status !== 'live') return 1;
          if (a.status === 'upcoming' && b.status === 'final') return -1;
          if (b.status === 'upcoming' && a.status === 'final') return 1;
          const dateA = a.gameDate ? new Date(a.gameDate).getTime() : 0;
          const dateB = b.gameDate ? new Date(b.gameDate).getTime() : 0;
          return dateA - dateB;
        });
        setMatches(sorted);
      }
    };
    const handleScoresUpdate = (e: any) => {
      if (e.detail?.competitors && (!e.detail?.sport || e.detail?.sport === currentSport)) {
        setRoster(e.detail.competitors);
      }
    };

    window.addEventListener('pixel_pros_live_matches_updated', handleMatchesUpdate);
    window.addEventListener('pixel_pros_scores_updated', handleScoresUpdate);
    return () => {
      window.removeEventListener('pixel_pros_live_matches_updated', handleMatchesUpdate);
      window.removeEventListener('pixel_pros_scores_updated', handleScoresUpdate);
    };
  }, [currentSport]);

  useEffect(() => {
    const unsubscribeRoom = subscribeToRoomRosters(roomCode, currentSport, async () => {
      const fresh = await fetchRoomRosters(roomCode, currentSport);
      setRoomRosters(fresh);

      const currentClean = (userNameRef.current || '').trim().toUpperCase();
      if (currentClean) {
        const remoteSquad = fresh.find((r) => r.user_name.toUpperCase() === currentClean);
        if (remoteSquad) {
          const currentRoster = rosterRef.current;
          const remoteS1Id = remoteSquad.star_1_id || '';
          const remoteS2Id = remoteSquad.star_2_id || '';
          const remoteS3Id = remoteSquad.star_3_id || '';

          // Re-sync squadSlots ONLY if the remote record changed to avoid overriding local unsaved slot selections
          setSquadSlots((prev) => {
            const curS1 = prev.star1?.id || '';
            const curS2 = prev.star2?.id || '';
            const curS3 = prev.star3?.id || '';
            const hasChanged = curS1 !== remoteS1Id || curS2 !== remoteS2Id || curS3 !== remoteS3Id;
            if (hasChanged) {
              return {
                star1: currentRoster.find((p) => p.id === remoteS1Id) || null,
                star2: currentRoster.find((p) => p.id === remoteS2Id) || null,
                star3: currentRoster.find((p) => p.id === remoteS3Id) || null,
              };
            }
            return prev;
          });

          const isRemoteLocked = Boolean(remoteSquad.is_locked || remoteSquad.device_id === 'LOCKED');
          setIsLocked((prevLocked) => {
            if (prevLocked !== isRemoteLocked) {
              setSquadLockState(roomCode, currentClean, isRemoteLocked, currentSport);
              return isRemoteLocked;
            }
            return prevLocked;
          });
        }
      }
      showToast(`ROOM UPDATE in ${roomCode}!`);
    });

    return () => {
      unsubscribeRoom();
    };
  }, [roomCode, currentSport]);

  const filledStars = [squadSlots.star1, squadSlots.star2, squadSlots.star3].filter(Boolean) as Competitor[];
  const userTotalPoints = filledStars.reduce((sum, p) => sum + (p?.score || 0), 0);

  const selectedPlayerIdsArray = [
    squadSlots.star1?.id || '',
    squadSlots.star2?.id || '',
    squadSlots.star3?.id || '',
  ].filter(Boolean);

  const isCurrentSquadLocked =
    Boolean(userName) &&
    selectedPlayerIdsArray.length === 3 &&
    Boolean(isLocked || getSquadLockState(roomCode, userName, currentSport));

  const squadPillsData = roomRosters
    .filter((r) => !isGhostUser(r.user_name) && (r.room_code || '').toUpperCase() === roomCode)
    .map((r) => {
      const s1 = roster.find((p) => p.id === r.star_1_id);
      const s2 = roster.find((p) => p.id === r.star_2_id);
      const s3 = roster.find((p) => p.id === r.star_3_id);
      const stars = [s1, s2, s3].filter(Boolean) as Competitor[];
      const isCurrent = userName && r.user_name.toUpperCase() === userName;
      const squadLocked = isCurrent
        ? isCurrentSquadLocked
        : stars.length === 3 && Boolean(r.is_locked || r.device_id === 'LOCKED' || getSquadLockState(roomCode, r.user_name, currentSport));

      return {
        userName: r.user_name.toUpperCase(),
        isLocked: squadLocked,
        starCount: stars.length,
        totalScore: stars.reduce((sum, p) => sum + (p.score || 0), 0),
      };
    });

  if (userName && !squadPillsData.some((s) => s.userName === userName)) {
    squadPillsData.unshift({
      userName: userName,
      isLocked: isCurrentSquadLocked,
      starCount: filledStars.length,
      totalScore: userTotalPoints,
    });
  }

  const activeUser: UserProfile = {
    ...INITIAL_USER,
    username: userName,
    totalScore: userTotalPoints,
    selectedPlayerIds: selectedPlayerIdsArray,
    isLocked: isCurrentSquadLocked,
  };

  return (
    <ErrorBoundary>
      <div className="h-[100dvh] flex flex-col overflow-hidden bg-[#0b1021] text-[#fae5b8] selection:bg-[#12579b] selection:text-white">
        <header className="flex-shrink-0 z-40 bg-[#080d1a] border-b-2 border-[#1a264a] w-full shadow-md overflow-x-hidden box-border">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 w-full py-1.5 sm:py-2 flex items-center justify-between gap-1 sm:gap-3 flex-nowrap box-border">
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              <button
                onClick={() => setCurrentTab('squad')}
                className="touch-manipulation flex items-center gap-1.5 sm:gap-2 cursor-pointer group bg-transparent border-0 p-0 text-left shrink-0"
              >
                <PixelHelmetIcon size={22} color={currentSport === 'nba' ? '#ea580c' : '#155e9e'} />
                <span className="font-pixel text-[11px] sm:text-base text-[#fae5b8] tracking-wider group-hover:text-white transition-colors whitespace-nowrap">
                  PIXEL PROS
                </span>
              </button>

              <SportSwitcher currentSport={currentSport} onSportChange={handleSportChange} />
            </div>

            <nav className="flex items-center gap-1 sm:gap-2 shrink-0">
              <button
                onClick={() => setCurrentTab('squad')}
                className={`touch-manipulation px-2 py-1 sm:px-4 sm:py-1.5 flex items-center justify-center gap-1 font-pixel text-[10px] sm:text-xs border-2 cursor-pointer transition-all ${
                  currentTab === 'squad'
                    ? 'bg-[#12579b] text-[#fae5b8] border-[#0a2d52] font-bold'
                    : 'bg-[#1a2238] text-[#fae5b8]/75 border-[#273552]'
                }`}
              >
                <Users size={13} className={currentTab === 'squad' ? 'text-[#38bdf8]' : ''} />
                <span className="md:hidden">SQUAD</span>
                <span className="hidden md:inline">MY SQUAD</span>
              </button>

              <button
                onClick={() => setCurrentTab('couch')}
                className={`touch-manipulation px-2 py-1 sm:px-4 sm:py-1.5 flex items-center justify-center gap-1 font-pixel text-[10px] sm:text-xs border-2 cursor-pointer transition-all ${
                  currentTab === 'couch'
                    ? 'bg-[#12579b] text-[#fae5b8] border-[#0a2d52] font-bold'
                    : 'bg-[#1a2238] text-[#fae5b8]/75 border-[#273552]'
                }`}
              >
                <Trophy size={13} className={currentTab === 'couch' ? 'text-[#38bdf8]' : ''} />
                <span className="md:hidden">BOARD</span>
                <span className="hidden md:inline">COUCH BOARD</span>
              </button>
            </nav>

            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={handleShareRoom}
                className="touch-manipulation flex items-center gap-1 px-1.5 sm:px-2 py-1 bg-[#064e3b] hover:bg-[#047857] text-[#34d399] hover:text-white border border-[#059669] rounded-xs font-pixel text-[9px] sm:text-xs cursor-pointer shadow-xs"
                title="Invite to Room"
              >
                <Share2 size={12} />
                <span className="hidden xs:inline">INVITE</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTempRoomCode(roomCode);
                  setIsRoomModalOpen(true);
                }}
                className="hidden sm:flex touch-manipulation items-center gap-1 px-1.5 sm:px-2 py-1 bg-[#1a2238] hover:bg-[#232e4b] border border-[#273552] rounded-xs font-pixel text-[9px] sm:text-xs text-[#fae5b8] shadow-xs"
              >
                <span className="text-[#38bdf8]">ROOM:</span>
                <span className="text-[#f59e0b] font-bold">{roomCode}</span>
                <span className="text-[9px]">Edit</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCommissionerOpen(true)}
                className="touch-manipulation flex items-center gap-1 px-1.5 sm:px-2 py-1 bg-[#1a2238] hover:bg-[#283554] border border-[#3b82f6]/50 hover:border-[#38bdf8] text-[#38bdf8] rounded-xs font-pixel text-[9px] sm:text-xs cursor-pointer shadow-xs"
                title="Commissioner & Admin Mode (Manage Rooms, Squads & Locks)"
              >
                <ShieldAlert size={13} className="text-[#38bdf8]" />
                <span className="hidden xs:inline">COMMISH</span>
              </button>

              <button
                onClick={() => setIsRulesModalOpen(true)}
                className="touch-manipulation w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-[#1a2238] text-[#fde047] border-2 border-[#273552] rounded-xs cursor-pointer"
                title="How Scoring Works"
              >
                <HelpCircle size={15} />
              </button>
            </div>
          </div>
        </header>

        <FamilySquadSwitcher
          activeUserName={userName}
          roomCode={roomCode}
          squads={squadPillsData}
          onSelectSquad={handleSelectSquad}
          onCreateSquad={handleCreateSquad}
          onDeleteSquad={handleDeleteSquad}
          isAddDrawerOpen={isAddSquadDrawerOpen}
          onOpenAddDrawer={() => setIsAddSquadDrawerOpen(true)}
          onCloseAddDrawer={() => setIsAddSquadDrawerOpen(false)}
          onOpenRoomModal={() => {
            setTempRoomCode(roomCode);
            setIsRoomModalOpen(true);
          }}
        />

        {toastMessage && (
          <div className="fixed bottom-4 left-4 right-4 md:bottom-auto md:top-4 md:left-1/2 md:right-auto md:-translate-x-1/2 z-50 pointer-events-none">
            <div className="bg-[#064e3b] text-[#fae5b8] px-4 py-2 border-2 border-[#10b981] rounded-xs font-pixel text-xs shadow-lg flex items-center justify-center gap-2">
              <span className="font-bold">{toastMessage}</span>
            </div>
          </div>
        )}

        <main
          className={`flex-1 overflow-y-auto overflow-x-hidden px-2 py-2 sm:px-6 sm:py-4 overscroll-contain relative box-border ${
            currentSport === 'nba' ? 'basketball-court' : 'football-field'
          }`}
        >
          {currentSport === 'nfl' && (
            <div className="pointer-events-none absolute inset-0 overflow-hidden flex justify-between items-center opacity-15 px-4 sm:px-8 text-white font-pixel text-2xl sm:text-4xl select-none">
              <span>10</span><span>20</span><span>30</span><span>40</span><span>50</span><span>40</span><span>30</span><span>20</span><span>10</span>
            </div>
          )}

          {currentSport === 'nba' && (
            <div className="pointer-events-none absolute inset-0 overflow-hidden flex justify-between items-center opacity-15 px-4 sm:px-8 text-[#fae5b8] font-pixel text-xl sm:text-3xl select-none">
              <span>KEY</span><span>3-PT</span><span>HALF</span><span>3-PT</span><span>KEY</span>
            </div>
          )}

          <div className="relative z-10 max-w-5xl mx-auto px-2 sm:px-4 py-2 sm:py-4 box-border">
            {currentTab === 'squad' && (
              <MyTeamView
                slots={squadSlots}
                userName={userName}
                roomCode={roomCode}
                previousRoom={previousRoom}
                isLocked={isCurrentSquadLocked}
                matches={matches}
                sport={currentSport}
                onCommitUserName={(name) => setUserName(name.toUpperCase())}
                onCommitRoomCode={handleCommitRoomCode}
                onSelectSlot={(slotKey) => setActiveSlot(slotKey)}
                onClearSlot={handleClearSlot}
                onToggleLock={handleToggleLock}
                onLockedSlotAttempt={() => showToast('Lineup is LOCKED!')}
                onInspectPlayer={(player) => setDetailedPlayer(player)}
                onRequestCreateSquad={() => setIsAddSquadDrawerOpen(true)}
              />
            )}

            {currentTab === 'couch' && (
              <LeaderboardView
                user={activeUser}
                nflCompetitors={roster}
                roomRosters={roomRosters}
                roomCode={roomCode}
                userName={userName}
                sport={currentSport}
                onCommitRoomCode={handleCommitRoomCode}
                onCommitUserName={(name) => setUserName(name.toUpperCase())}
                onOpenPlayerDetail={(player) => setDetailedPlayer(player)}
                onSelectSquad={handleSelectSquad}
              />
            )}
          </div>
        </main>

        <footer className="flex-shrink-0 bg-[#080d1a] border-t-2 border-[#1a264a] py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] text-center text-[10px] sm:text-xs font-retro text-[#fae5b8]/75 z-20">
          <div className="max-w-5xl mx-auto px-4 w-full flex items-center justify-center gap-2">
            <span className="font-bold text-[#fae5b8]">PIXEL PROS {currentSport.toUpperCase()}</span>
            <span className="text-[#38bdf8]/60">·</span>
            <span>WHOLE NUMBERS ONLY</span>
            <span className="text-[#38bdf8]/60">·</span>
            <button
              onClick={() => setIsRulesModalOpen(true)}
              className="hover:underline text-[#fde047] cursor-pointer font-bold"
            >
              RULES (?)
            </button>
          </div>
        </footer>

        {isRulesModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85">
            <div className="relative w-full max-w-lg bg-[#0b1021] border-4 border-[#1a264a] p-4 text-[#fae5b8]">
              <div className="flex items-center justify-between border-b-2 border-[#1a264a] pb-2 mb-3">
                <h2 className="font-pixel text-xs text-[#fae5b8] uppercase font-bold">
                  {currentSport.toUpperCase()} SCORING RULES
                </h2>
                <button
                  onClick={() => setIsRulesModalOpen(false)}
                  className="px-2 py-1 bg-[#b91c1c] text-white font-pixel text-xs"
                >
                  Close
                </button>
              </div>
              <SimpleRulesView sport={currentSport} />
            </div>
          </div>
        )}

        {activeSlot !== null && (
          <PlayerPickerModal
            isOpen={activeSlot !== null}
            onClose={() => setActiveSlot(null)}
            activeSlot={activeSlot}
            allPlayers={roster}
            currentSlotPlayerId={squadSlots[activeSlot]?.id || null}
            selectedPlayerIds={selectedPlayerIdsArray}
            matches={matches}
            sport={currentSport}
            onInspectPlayer={(player) => setDetailedPlayer(player)}
            onSelectPlayer={(player, targetSlot) => {
              handleAssignSlot(player, targetSlot);
              setActiveSlot(null);
              setDetailedPlayer(null);
            }}
          />
        )}

        {detailedPlayer && (
          <PlayerCardModal
            player={detailedPlayer}
            onClose={() => setDetailedPlayer(null)}
            sport={currentSport}
            isLocked={isCurrentSquadLocked}
            isSelectedForTeam={selectedPlayerIdsArray.includes(detailedPlayer.id)}
            onSelectForTeam={(player) => {
              if (isCurrentSquadLocked) {
                showToast('Squad is LOCKED! Click [ 🔓 UNLOCK SQUAD ] to make substitutions.');
                return;
              }
              const target: ActiveSlot = activeSlot || (!squadSlots.star1 ? 'star1' : !squadSlots.star2 ? 'star2' : !squadSlots.star3 ? 'star3' : 'star1');
              handleAssignSlot(player, target);
              setDetailedPlayer(null);
              setActiveSlot(null);
            }}
            onSwapThisStar={() => {
              if (isCurrentSquadLocked) {
                showToast('Squad is LOCKED! Click [ 🔓 UNLOCK SQUAD ] to make substitutions.');
                return;
              }
              setDetailedPlayer(null);
              setActiveSlot('star1');
            }}
            onDropPlayer={(player) => {
              if (isCurrentSquadLocked) {
                showToast('Squad is LOCKED! Click [ 🔓 UNLOCK SQUAD ] to make substitutions.');
                return;
              }
              const slotKey: ActiveSlot | null = squadSlots.star1?.id === player.id
                ? 'star1'
                : squadSlots.star2?.id === player.id
                ? 'star2'
                : squadSlots.star3?.id === player.id
                ? 'star3'
                : null;
              if (slotKey) {
                handleClearSlot(slotKey);
              }
              setDetailedPlayer(null);
            }}
          />
        )}

        {isRoomModalOpen && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="pixel-box-cream p-4 sm:p-5 w-full max-w-[440px] border-4 border-[#1a2238] max-h-[90vh] overflow-y-auto overflow-x-hidden">
              <div className="flex items-center justify-between border-b-2 border-[#d4a86a] pb-2 mb-3">
                <h3 className="font-pixel text-xs sm:text-sm text-[#5c3509] font-bold uppercase tracking-wider">
                  SWITCH {currentSport.toUpperCase()} COUCH
                </h3>
                <button
                  type="button"
                  onClick={() => setIsRoomModalOpen(false)}
                  className="w-6 h-6 bg-[#b91c1c] hover:bg-[#dc2626] text-white font-pixel text-xs cursor-pointer flex items-center justify-center rounded-xs"
                >
                  ✕
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (tempRoomCode.trim()) {
                    handleCommitRoomCode(tempRoomCode);
                    setIsRoomModalOpen(false);
                  }
                }}
              >
                <label className="block font-pixel text-[10px] text-[#5c3509] mb-1 font-bold">
                  ROOM CODE:
                </label>
                <div className="flex gap-2 mb-3.5">
                  <input
                    type="text"
                    value={tempRoomCode}
                    onChange={(e) => setTempRoomCode(e.target.value.toUpperCase())}
                    placeholder="e.g. COUCH or GAMEDAY"
                    className="flex-1 min-w-0 px-3 py-2 bg-[#fae9c8] border-2 border-[#c99a57] font-pixel text-xs sm:text-sm text-[#451a03] text-center uppercase tracking-wider rounded-xs focus:outline-none focus:border-[#12579b]"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-3 sm:px-4 py-2 bg-[#12579b] hover:bg-[#1a6cb8] text-[#fae5b8] font-pixel text-xs font-bold rounded-xs cursor-pointer shadow-[0_2px_0_0_#0a2e52] active:translate-y-0.5 whitespace-nowrap"
                  >
                    JOIN ROOM
                  </button>
                </div>

                {/* Consolidated Active Couches */}
                <div className="mb-3.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-pixel text-[10px] text-[#5c3509] font-bold">
                      ⭐ ACTIVE COUCHES (Tap to Join):
                    </span>
                    {isLoadingRooms && (
                      <span className="font-retro text-[10px] text-[#8c532b] animate-pulse">Syncing...</span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto pr-0.5">
                    {consolidatedCouches.map((c) => {
                      const isCurrent = (roomCode || '').toUpperCase() === c.roomCode.toUpperCase();
                      const teamCountLabel = c.squadCount === 1 ? '1 Team' : `${c.squadCount} Teams`;
                      const icon = c.sport === 'nba' ? '🏀' : '🛋️';

                      return (
                        <button
                          key={c.roomCode}
                          type="button"
                          onClick={() => {
                            setTempRoomCode(c.roomCode);
                            handleCommitRoomCode(c.roomCode);
                            setIsRoomModalOpen(false);
                          }}
                          className={`touch-manipulation px-2.5 py-1.5 font-pixel text-[10px] rounded-xs border-2 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:translate-y-0.5 ${
                            isCurrent
                              ? 'bg-[#12579b] text-white border-[#0a2e52] shadow-[0_2px_0_0_#0a2e52]'
                              : 'bg-[#ebd2a4] hover:bg-[#fae5b8] text-[#5c3509] border-[#c99a57] hover:border-[#b48340]'
                          }`}
                        >
                          <span className="text-xs">{icon}</span>
                          <span className="font-bold tracking-wider">{c.roomCode}</span>
                          <span className={`text-[9px] ${isCurrent ? 'text-[#bfdbfe]' : 'text-[#784610] font-retro font-bold'}`}>
                            ({teamCountLabel})
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Friendly Retro Tip Banner */}
                <div className="p-2.5 bg-[#f4e0bc] border border-[#d4a86a] rounded-xs text-[11px] text-[#5c3509] font-retro leading-relaxed mb-3">
                  💡 <strong>TIP:</strong> Pick an active couch above or type a new code to start fresh!
                </div>

                {/* Commissioner Mode Link in Room Modal */}
                <div className="mb-3 pt-2.5 border-t border-[#d4a86a] flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRoomModalOpen(false);
                      setIsCommissionerOpen(true);
                    }}
                    className="text-[10px] font-pixel text-[#12579b] hover:text-[#1a6cb8] flex items-center gap-1 cursor-pointer underline"
                  >
                    <ShieldAlert size={12} />
                    MANAGE ROOMS & DELETIONS (COMMISSIONER MODE)
                  </button>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsRoomModalOpen(false)}
                    className="px-4 py-1.5 bg-[#784610] hover:bg-[#8f5415] text-[#fae5b8] font-pixel text-[10px] font-bold rounded-xs cursor-pointer"
                  >
                    CLOSE
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <CommissionerModal
          isOpen={isCommissionerOpen}
          onClose={() => setIsCommissionerOpen(false)}
          currentRoom={roomCode}
          currentSport={currentSport}
          roomRosters={roomRosters}
          onSwitchRoom={(newRoom) => {
            handleCommitRoomCode(newRoom);
          }}
          onRefreshData={triggerRefresh}
          showToast={showToast}
        />
      </div>
    </ErrorBoundary>
  );
}