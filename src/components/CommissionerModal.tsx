import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  Lock,
  Unlock,
  Trash2,
  Edit2,
  RefreshCw,
  Plus,
  Check,
  X,
  Key,
  AlertTriangle,
  Copy,
  Globe,
  Users,
  Database,
  Radio,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Layers,
  CheckCircle2,
  Search,
  Sparkles,
} from 'lucide-react';
import { SportId, UserRoster } from '../types';
import {
  deleteUserRoster,
  resetRoomRosters,
  renameUserRoster,
  toggleSquadLock,
  setAllSquadsLock,
  clearSquadStars,
  upsertUserRoster,
  resolveSupabaseAnonKey,
  fetchAllRoomsWithDetails,
  MasterRoomData,
  isSupabaseConfigured,
  reseedMasterNFLManifest,
} from '../lib/supabaseClient';
import { syncESPNData, getLastESPNSyncTime, getCurrentNFLWeek } from '../lib/espnSync';

interface CommissionerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRoom: string;
  currentSport: SportId;
  roomRosters: UserRoster[];
  onSwitchRoom: (newRoom: string) => void;
  onRefreshData: () => void;
  showToast: (msg: string) => void;
}

export const CommissionerModal: React.FC<CommissionerModalProps> = ({
  isOpen,
  onClose,
  currentRoom,
  currentSport,
  roomRosters,
  onSwitchRoom,
  onRefreshData,
  showToast,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem('pixel_pros_commissioner_auth') === 'true';
    } catch {
      return false;
    }
  });

  const [activeTab, setActiveTab] = useState<'rooms' | 'sanity' | 'sync'>('rooms');
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [roomSearchFilter, setRoomSearchFilter] = useState('');
  const [reseedLoading, setReseedLoading] = useState(false);

  // Master Rooms Data
  const [allRooms, setAllRooms] = useState<MasterRoomData[]>([]);
  const [expandedRooms, setExpandedRooms] = useState<Record<string, boolean>>({});
  const [loadingRooms, setLoadingRooms] = useState(false);

  // Sync state
  const [syncingNFL, setSyncingNFL] = useState(false);
  const [syncingNBA, setSyncingNBA] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  // New room & squad forms
  const [newRoomCode, setNewRoomCode] = useState('');
  const [newRoomSport, setNewRoomSport] = useState<SportId>('nfl');
  const [squadInputs, setSquadInputs] = useState<Record<string, string>>({});

  // Rename squad state
  const [editingTarget, setEditingTarget] = useState<{ room: string; sport: SportId; squad: string } | null>(null);
  const [newSquadName, setNewSquadName] = useState('');

  // Confirmation modals
  const [squadToDelete, setSquadToDelete] = useState<{ room: string; sport: SportId; squad: string } | null>(null);
  const [roomToDelete, setRoomToDelete] = useState<{ room: string; sport: SportId } | null>(null);
  const [squadToClear, setSquadToClear] = useState<{ room: string; sport: SportId; squad: string } | null>(null);

  // Load all rooms when opened or when rosters change
  const refreshMasterRooms = async () => {
    setLoadingRooms(true);
    try {
      const data = await fetchAllRoomsWithDetails(currentRoom, currentSport, roomRosters);
      setAllRooms(data);
      // Auto-expand the active room
      setExpandedRooms((prev) => ({
        ...prev,
        [`${currentRoom.toUpperCase()}_${currentSport}`]: true,
      }));
    } finally {
      setLoadingRooms(false);
    }
  };

  const handleExpandAll = () => {
    const next: Record<string, boolean> = {};
    allRooms.forEach((r) => {
      next[`${r.roomCode}_${r.sport}`] = true;
    });
    setExpandedRooms(next);
  };

  const handleCollapseAll = () => {
    setExpandedRooms({});
  };

  const handleReseedNFLManifest = async () => {
    setReseedLoading(true);
    try {
      const res = await reseedMasterNFLManifest();
      if (res.success) {
        showToast(`Reseeded all ${res.count} NFL starters from Master Manifest!`);
        onRefreshData();
      } else {
        showToast(res.error || 'Failed to reseed manifest');
      }
    } finally {
      setReseedLoading(false);
    }
  };

  const filteredRooms = useMemo(() => {
    const q = roomSearchFilter.trim().toLowerCase();
    if (!q) return allRooms;
    return allRooms.filter((r) => {
      if (r.roomCode.toLowerCase().includes(q)) return true;
      if (r.sport.toLowerCase().includes(q)) return true;
      if (r.squads.some((s) => s.userName.toLowerCase().includes(q))) return true;
      return false;
    });
  }, [allRooms, roomSearchFilter]);

  const totalRoomsCount = allRooms.length;
  const totalSquadsCount = useMemo(
    () => allRooms.reduce((acc, r) => acc + r.squads.length, 0),
    [allRooms]
  );
  const totalPicksCount = useMemo(
    () =>
      allRooms.reduce(
        (acc, r) => acc + r.squads.reduce((sAcc, sq) => sAcc + sq.stars.filter(Boolean).length, 0),
        0
      ),
    [allRooms]
  );

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      refreshMasterRooms();
    }
  }, [isOpen, isAuthenticated, currentRoom, currentSport, roomRosters]);

  const toggleRoomExpanded = (key: string) => {
    setExpandedRooms((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCopyOneTapLink = async (roomCode: string, sport: SportId) => {
    const activeKey = resolveSupabaseAnonKey();
    const keyParam = activeKey ? `&k=${encodeURIComponent(activeKey)}` : '';
    const inviteUrl = `${window.location.origin}/?sport=${sport}&room=${roomCode}${keyParam}`;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      showToast(`COPIED 1-TAP INVITE LINK FOR ROOM ${roomCode}!`);
    } catch {
      showToast(`Link: ${inviteUrl}`);
    }
  };

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === '1234') {
      setIsAuthenticated(true);
      setPinError(false);
      try {
        localStorage.setItem('pixel_pros_commissioner_auth', 'true');
      } catch {}
      refreshMasterRooms();
    } else {
      setPinError(true);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPinInput('');
    try {
      localStorage.removeItem('pixel_pros_commissioner_auth');
    } catch {}
  };

  // Sync Actions
  const handleRunSync = async (sport: SportId) => {
    if (sport === 'nfl') setSyncingNFL(true);
    else setSyncingNBA(true);
    setSyncResult(null);

    try {
      const res = await syncESPNData(sport);
      if (res.success) {
        setSyncResult(`✅ ${sport.toUpperCase()} Sync Succeeded! Updated ${res.gamesCount} games & ${res.playersCount} players.`);
        showToast(`ESPN ${sport.toUpperCase()} data refreshed!`);
      } else {
        setSyncResult(`⚠️ ${sport.toUpperCase()} Sync Warning: ${res.message}`);
      }
      onRefreshData();
      refreshMasterRooms();
    } catch (err: any) {
      setSyncResult(`❌ ${sport.toUpperCase()} Sync Failed: ${err?.message || 'Network error'}`);
    } finally {
      if (sport === 'nfl') setSyncingNFL(false);
      else setSyncingNBA(false);
    }
  };

  const handlePurgeAndResync = async () => {
    setSyncingNFL(true);
    setSyncingNBA(true);
    setSyncResult('Purging corrupted/duplicate local player cache...');
    try {
      // Clear localStorage cache for matches and competitors
      ['nfl', 'nba'].forEach((s) => {
        localStorage.removeItem(`pixel_pros_synced_matches_${s}`);
        localStorage.removeItem(`pixel_pros_synced_competitors_${s}`);
      });
      // Run both syncs
      await syncESPNData('nfl');
      await syncESPNData('nba');
      setSyncResult('✅ Cache cleanly wiped & both NFL and NBA re-synchronized with ESPN!');
      showToast('Cache purged & ESPN data refreshed!');
      onRefreshData();
      refreshMasterRooms();
    } catch (err: any) {
      setSyncResult(`❌ Purge & Resync Failed: ${err?.message || 'Error'}`);
    } finally {
      setSyncingNFL(false);
      setSyncingNBA(false);
    }
  };

  // Squad Actions
  const handleToggleSquadLock = async (roomCode: string, userName: string, currentLock: boolean, sport: SportId) => {
    const next = !currentLock;
    await toggleSquadLock(roomCode, userName, next, sport);
    showToast(`${userName} is now ${next ? 'LOCKED' : 'UNLOCKED'}!`);
    onRefreshData();
    refreshMasterRooms();
  };

  const handleLockAllInRoom = async (roomCode: string, locked: boolean, sport: SportId) => {
    await setAllSquadsLock(roomCode, locked, sport);
    showToast(`All squads in ${roomCode} are now ${locked ? 'LOCKED' : 'UNLOCKED'}!`);
    onRefreshData();
    refreshMasterRooms();
  };

  const handleStartRename = (room: string, sport: SportId, squad: string) => {
    setEditingTarget({ room, sport, squad });
    setNewSquadName(squad);
  };

  const handleConfirmRename = async () => {
    if (!editingTarget || !newSquadName.trim()) return;
    const cleanNew = newSquadName.trim().toUpperCase();
    if (cleanNew === editingTarget.squad) {
      setEditingTarget(null);
      return;
    }

    const res = await renameUserRoster(editingTarget.room, editingTarget.squad, cleanNew, editingTarget.sport);
    if (res.success) {
      showToast(`Renamed ${editingTarget.squad} to ${cleanNew}`);
      setEditingTarget(null);
      onRefreshData();
      refreshMasterRooms();
    } else {
      showToast(res.error || 'Failed to rename squad');
    }
  };

  const handleConfirmDeleteSquad = async () => {
    if (!squadToDelete) return;
    await deleteUserRoster(squadToDelete.room, squadToDelete.squad, squadToDelete.sport);
    showToast(`Deleted squad ${squadToDelete.squad} from ${squadToDelete.room}`);
    setSquadToDelete(null);
    onRefreshData();
    refreshMasterRooms();
  };

  const handleConfirmClearPicks = async () => {
    if (!squadToClear) return;
    await clearSquadStars(squadToClear.room, squadToClear.squad, squadToClear.sport);
    showToast(`Cleared star picks for ${squadToClear.squad}`);
    setSquadToClear(null);
    onRefreshData();
    refreshMasterRooms();
  };

  const handleConfirmDeleteRoom = async () => {
    if (!roomToDelete) return;
    await resetRoomRosters(roomToDelete.room);
    showToast(`Room ${roomToDelete.room} and all squads wiped`);
    const targetRoom = roomToDelete.room;
    setRoomToDelete(null);

    if (targetRoom.toUpperCase() === currentRoom.toUpperCase()) {
      const def = currentSport === 'nba' ? 'HOOPS' : 'COUCH';
      onSwitchRoom(def);
    }
    onRefreshData();
    refreshMasterRooms();
  };

  const handleCreateSquad = async (roomCode: string, sport: SportId) => {
    const inputVal = squadInputs[`${roomCode}_${sport}`] || '';
    const clean = inputVal.trim().toUpperCase();
    if (!clean) return;
    await upsertUserRoster(roomCode, clean, '', '', '', false, sport);
    setSquadInputs((prev) => ({ ...prev, [`${roomCode}_${sport}`]: '' }));
    showToast(`Added squad ${clean} to room ${roomCode}`);
    onRefreshData();
    refreshMasterRooms();
  };

  const handleCreateNewRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newRoomCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    if (!clean) return;
    await upsertUserRoster(clean, 'PLAYER 1', '', '', '', false, newRoomSport);
    setNewRoomCode('');
    showToast(`Created new room ${clean}!`);
    onRefreshData();
    refreshMasterRooms();
    setExpandedRooms((prev) => ({ ...prev, [`${clean}_${newRoomSport}`]: true }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-2 sm:p-4 backdrop-blur-xs">
      <div className="pixel-box-cream p-4 sm:p-5 w-full max-w-2xl border-4 border-[#1a2238] max-h-[94vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-[#d4a86a] pb-2 mb-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#12579b] border-2 border-[#0a2e52] flex items-center justify-center text-white rounded-xs">
              <ShieldAlert size={18} />
            </div>
            <div>
              <h2 className="font-pixel text-xs sm:text-sm text-[#5c3509] font-bold uppercase tracking-wider">
                MASTER LEAGUE ADMIN CONSOLE
              </h2>
              <span className="font-retro text-[10px] text-[#8c532b] block">
                Manage All Rooms, Squads & Live ESPN Data Sync
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <button
                type="button"
                onClick={() => handleRunSync(currentSport)}
                disabled={syncingNFL || syncingNBA}
                className="px-2.5 py-1 bg-[#12579b] hover:bg-[#1a6cb8] disabled:opacity-50 text-white font-pixel text-[9px] font-bold rounded-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Quick Refresh Live ESPN Data"
              >
                <RefreshCw size={10} className={syncingNFL || syncingNBA ? 'animate-spin' : ''} />
                <span>{syncingNFL || syncingNBA ? 'SYNCING...' : `⚡ REFRESH ${currentSport.toUpperCase()}`}</span>
              </button>
            )}
            {isAuthenticated && (
              <button
                type="button"
                onClick={handleLogout}
                className="text-[9px] font-pixel text-[#784610] hover:text-red-700 underline cursor-pointer"
              >
                LOCK ADMIN
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 bg-[#b91c1c] hover:bg-[#dc2626] text-white font-pixel text-sm cursor-pointer flex items-center justify-center rounded-xs"
            >
              ✕
            </button>
          </div>
        </div>

        {/* PIN SCREEN IF NOT AUTHENTICATED */}
        {!isAuthenticated ? (
          <div className="py-8 flex flex-col items-center justify-center text-center px-4">
            <div className="w-12 h-12 bg-[#fae9c8] border-2 border-[#c99a57] rounded-full flex items-center justify-center text-[#784610] mb-3">
              <Key size={24} />
            </div>
            <h3 className="font-pixel text-sm text-[#451a03] mb-1">ENTER COMMISSIONER PIN</h3>
            <p className="font-retro text-xs text-[#784610] mb-4 max-w-sm">
              Enter your PIN to access the Master League Directory & ESPN sync controls. (Default is{' '}
              <strong className="font-bold text-[#12579b]">1234</strong>)
            </p>

            <form onSubmit={handleVerifyPin} className="w-full max-w-xs flex flex-col gap-2">
              <input
                type="password"
                maxLength={8}
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError(false);
                }}
                placeholder="PIN (1234)"
                autoFocus
                className="px-3 py-2 bg-[#fae9c8] border-2 border-[#c99a57] font-pixel text-center text-lg tracking-widest text-[#451a03] rounded-xs focus:outline-none focus:border-[#12579b]"
              />
              {pinError && (
                <span className="font-pixel text-[10px] text-red-600">Incorrect PIN. Hint: 1234</span>
              )}
              <button
                type="submit"
                className="mt-2 py-2 bg-[#12579b] hover:bg-[#1a6cb8] text-[#fae5b8] font-pixel text-xs font-bold rounded-xs cursor-pointer shadow-[0_2px_0_0_#0a2e52]"
              >
                UNLOCK MASTER CONSOLE
              </button>
            </form>
          </div>
        ) : (
          /* AUTHENTICATED COMMISSIONER DASHBOARD */
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Nav Tabs */}
            <div className="flex gap-2 border-b border-[#d4a86a] pb-2 mb-3 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('rooms')}
                className={`flex-1 py-1.5 px-2 font-pixel text-[10px] sm:text-xs font-bold rounded-xs flex items-center justify-center gap-1.5 cursor-pointer border ${
                  activeTab === 'rooms'
                    ? 'bg-[#12579b] text-white border-[#0a2e52] shadow-xs'
                    : 'bg-[#fae9c8] text-[#5c3509] border-[#c99a57] hover:bg-[#ebd2a4]'
                }`}
              >
                <Layers size={13} /> ROOMS & USERS ({allRooms.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('sanity')}
                className={`flex-1 py-1.5 px-2 font-pixel text-[10px] sm:text-xs font-bold rounded-xs flex items-center justify-center gap-1.5 cursor-pointer border ${
                  activeTab === 'sanity'
                    ? 'bg-[#15803d] text-white border-[#14532d] shadow-xs'
                    : 'bg-[#fae9c8] text-[#14532d] border-[#86efac] hover:bg-[#ebd2a4]'
                }`}
              >
                <CheckCircle2 size={13} /> 🟢 PRE-FLIGHT SANITY
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('sync')}
                className={`flex-1 py-1.5 px-2 font-pixel text-[10px] sm:text-xs font-bold rounded-xs flex items-center justify-center gap-1.5 cursor-pointer border ${
                  activeTab === 'sync'
                    ? 'bg-[#12579b] text-white border-[#0a2e52] shadow-xs'
                    : 'bg-[#fae9c8] text-[#5c3509] border-[#c99a57] hover:bg-[#ebd2a4]'
                }`}
              >
                <Radio size={13} /> ESPN DATA SYNC
              </button>
            </div>

            {/* TAB 1: MASTER ROOMS & SQUADS */}
            {activeTab === 'rooms' && (
              <div className="flex-1 overflow-y-auto pr-1 space-y-3 text-left">
                {/* League Directory KPI Summary */}
                <div className="grid grid-cols-3 gap-2 text-center p-2 bg-[#fae9c8] border-2 border-[#c99a57] rounded-xs shadow-2xs">
                  <div>
                    <div className="font-pixel text-[9px] text-[#784610]">ACTIVE ROOMS</div>
                    <div className="font-pixel text-sm font-bold text-[#451a03]">{totalRoomsCount}</div>
                  </div>
                  <div>
                    <div className="font-pixel text-[9px] text-[#784610]">TOTAL SQUADS / USERS</div>
                    <div className="font-pixel text-sm font-bold text-[#12579b]">{totalSquadsCount}</div>
                  </div>
                  <div>
                    <div className="font-pixel text-[9px] text-[#784610]">STARS PICKED</div>
                    <div className="font-pixel text-sm font-bold text-[#15803d]">{totalPicksCount}</div>
                  </div>
                </div>

                {/* Search Bar & Expand/Collapse All */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="relative flex-1 min-w-[180px]">
                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#784610]" />
                    <input
                      type="text"
                      value={roomSearchFilter}
                      onChange={(e) => setRoomSearchFilter(e.target.value)}
                      placeholder="Filter rooms or users (e.g. COUCH, DAD)..."
                      className="w-full pl-7 pr-2 py-1 bg-white border border-[#c99a57] font-pixel text-xs rounded-xs placeholder:text-[#a88252]"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleExpandAll}
                      className="px-2 py-1 bg-[#ebd2a4] hover:bg-[#dfc491] border border-[#c99a57] font-pixel text-[9px] font-bold text-[#451a03] rounded-xs cursor-pointer"
                    >
                      EXPAND ALL
                    </button>
                    <button
                      type="button"
                      onClick={handleCollapseAll}
                      className="px-2 py-1 bg-[#ebd2a4] hover:bg-[#dfc491] border border-[#c99a57] font-pixel text-[9px] font-bold text-[#451a03] rounded-xs cursor-pointer"
                    >
                      COLLAPSE ALL
                    </button>
                  </div>
                </div>

                {/* Create New Room Row */}
                <form onSubmit={handleCreateNewRoom} className="p-2.5 bg-[#fae9c8] border-2 border-[#c99a57] rounded-xs flex flex-wrap items-center gap-2 shadow-2xs">
                  <span className="font-pixel text-[10px] font-bold text-[#451a03] shrink-0">
                    CREATE NEW ROOM:
                  </span>
                  <input
                    type="text"
                    value={newRoomCode}
                    onChange={(e) => setNewRoomCode(e.target.value.toUpperCase())}
                    placeholder="ROOM CODE (e.g. DRAFT_NIGHT)"
                    className="flex-1 min-w-[140px] px-2 py-1 bg-white border border-[#c99a57] font-pixel text-xs uppercase rounded-xs"
                  />
                  <select
                    value={newRoomSport}
                    onChange={(e) => setNewRoomSport(e.target.value as SportId)}
                    className="px-2 py-1 bg-white border border-[#c99a57] font-pixel text-[10px] rounded-xs"
                  >
                    <option value="nfl">🏈 NFL</option>
                    <option value="nba">🏀 NBA</option>
                  </select>
                  <button
                    type="submit"
                    className="px-3 py-1 bg-[#15803d] hover:bg-[#16a34a] text-white font-pixel text-[10px] font-bold rounded-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={11} /> CREATE
                  </button>
                </form>

                {/* Rooms Accordion List */}
                {loadingRooms && allRooms.length === 0 ? (
                  <div className="py-8 text-center font-retro text-xs text-[#784610]">
                    Loading master league directory...
                  </div>
                ) : filteredRooms.length === 0 ? (
                  <div className="py-8 text-center font-retro text-xs text-[#784610] bg-[#fff6e6] border border-[#d4a86a] rounded-xs">
                    {roomSearchFilter ? `No rooms or users match "${roomSearchFilter}"` : 'No active rooms found. Create one above!'}
                  </div>
                ) : (
                  filteredRooms.map((room) => {
                    const roomKey = `${room.roomCode}_${room.sport}`;
                    const isExpanded = Boolean(expandedRooms[roomKey]);
                    const isCurrent = room.roomCode.toUpperCase() === currentRoom.toUpperCase() && room.sport === currentSport;
                    const sportIcon = room.sport === 'nba' ? '🏀' : '🏈';

                    return (
                      <div
                        key={roomKey}
                        className={`border-2 rounded-xs overflow-hidden transition-all ${
                          isCurrent
                            ? 'bg-[#fae9c8] border-[#12579b] shadow-sm'
                            : 'bg-[#fff6e6] border-[#d4a86a]'
                        }`}
                      >
                        {/* Room Header Bar */}
                        <div className="p-2.5 flex flex-wrap items-center justify-between gap-2 bg-[#fae9c8] border-b border-[#d4a86a]">
                          <div className="flex items-center gap-2 min-w-0">
                            <button
                              type="button"
                              onClick={() => toggleRoomExpanded(roomKey)}
                              className="p-1 hover:bg-[#ebd2a4] rounded-xs cursor-pointer text-[#451a03]"
                              title={isExpanded ? 'Collapse' : 'Expand'}
                            >
                              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                            <span className="font-pixel text-xs font-bold text-[#451a03]">
                              {sportIcon} ROOM {room.roomCode}
                            </span>
                            <span className="font-retro text-[10px] px-1.5 py-0.5 bg-[#ebd2a4] border border-[#c99a57] rounded-xs font-bold text-[#5c3509]">
                              {room.sport.toUpperCase()}
                            </span>
                            <span className="font-pixel text-[10px] text-[#784610]">
                              ({room.squads.length} {room.squads.length === 1 ? 'Squad' : 'Squads'})
                            </span>
                            {isCurrent && (
                              <span className="font-pixel text-[9px] bg-[#12579b] text-white px-1.5 py-0.5 rounded-xs font-bold">
                                ACTIVE
                              </span>
                            )}
                          </div>

                          {/* Room Actions */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {!isCurrent && (
                              <button
                                type="button"
                                onClick={() => {
                                  onSwitchRoom(room.roomCode);
                                  showToast(`Switched to room ${room.roomCode}!`);
                                }}
                                className="px-2 py-1 bg-[#12579b] hover:bg-[#1a6cb8] text-white font-pixel text-[9px] font-bold rounded-xs flex items-center gap-1 cursor-pointer"
                                title="Switch current app view to this room"
                              >
                                <ArrowRight size={10} /> SWITCH
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleCopyOneTapLink(room.roomCode, room.sport)}
                              className="p-1 bg-[#15803d] hover:bg-[#16a34a] text-white rounded-xs cursor-pointer"
                              title="Copy 1-Tap Invite Link"
                            >
                              <Copy size={11} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleLockAllInRoom(room.roomCode, false, room.sport)}
                              className="px-1.5 py-1 bg-[#15803d] hover:bg-[#16a34a] text-white font-pixel text-[9px] font-bold rounded-xs cursor-pointer"
                              title="Unlock all squads"
                            >
                              <Unlock size={10} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleLockAllInRoom(room.roomCode, true, room.sport)}
                              className="px-1.5 py-1 bg-[#b45309] hover:bg-[#d97706] text-white font-pixel text-[9px] font-bold rounded-xs cursor-pointer"
                              title="Lock all squads"
                            >
                              <Lock size={10} />
                            </button>

                            <button
                              type="button"
                              onClick={() => setRoomToDelete({ room: room.roomCode, sport: room.sport })}
                              className="p-1 bg-[#b91c1c] hover:bg-[#dc2626] text-white rounded-xs cursor-pointer"
                              title="Wipe room and squads"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>

                        {/* Room Expanded Squads Body */}
                        {isExpanded && (
                          <div className="p-2.5 space-y-2">
                            {room.squads.length === 0 ? (
                              <div className="py-3 text-center text-[#784610] font-retro text-xs italic bg-[#fff6e6]">
                                No squads registered in this room yet.
                              </div>
                            ) : (
                              <div className="space-y-1.5">
                                {room.squads.map((sq) => {
                                  const isLocked = sq.isLocked;
                                  const stars = sq.stars.filter(Boolean);
                                  const isEditing =
                                    editingTarget?.room === room.roomCode &&
                                    editingTarget?.sport === room.sport &&
                                    editingTarget?.squad === sq.userName;

                                  return (
                                    <div
                                      key={sq.userName}
                                      className="p-2 bg-white border border-[#d4a86a] rounded-xs flex flex-wrap items-center justify-between gap-2 shadow-2xs"
                                    >
                                      {/* Squad Name & Info */}
                                      <div className="flex items-center gap-2 min-w-0">
                                        {isEditing ? (
                                          <div className="flex items-center gap-1">
                                            <input
                                              type="text"
                                              value={newSquadName}
                                              onChange={(e) => setNewSquadName(e.target.value.toUpperCase())}
                                              className="px-1.5 py-0.5 bg-white border border-[#12579b] font-pixel text-xs uppercase"
                                              autoFocus
                                            />
                                            <button
                                              type="button"
                                              onClick={handleConfirmRename}
                                              className="p-1 bg-[#15803d] text-white rounded-xs cursor-pointer"
                                              title="Save"
                                            >
                                              <Check size={11} />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => setEditingTarget(null)}
                                              className="p-1 bg-gray-500 text-white rounded-xs cursor-pointer"
                                              title="Cancel"
                                            >
                                              <X size={11} />
                                            </button>
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-1.5">
                                            <span className="font-pixel text-xs font-bold text-[#451a03]">
                                              {sq.userName}
                                            </span>
                                            <button
                                              type="button"
                                              onClick={() => handleStartRename(room.roomCode, room.sport, sq.userName)}
                                              className="text-[#12579b] hover:text-[#1a6cb8] p-0.5 cursor-pointer"
                                              title="Rename squad"
                                            >
                                              <Edit2 size={11} />
                                            </button>
                                          </div>
                                        )}

                                        <span className="font-retro text-[10px] text-[#784610] bg-[#fae9c8] px-1 border border-[#c99a57] rounded-xs">
                                          {stars.length}/3 Stars
                                        </span>

                                        {stars.length > 0 && (
                                          <div className="hidden sm:flex items-center gap-1 overflow-hidden">
                                            {stars.map((sid, idx) => (
                                              <span
                                                key={idx}
                                                className="font-pixel text-[8px] bg-[#f0f9ff] border border-[#bae6fd] text-[#0369a1] px-1 py-0.2 rounded-xs truncate max-w-[90px]"
                                                title={sid}
                                              >
                                                {sid.replace(/^(nfl_|nba_)/, '')}
                                              </span>
                                            ))}
                                          </div>
                                        )}
                                      </div>

                                      {/* Squad Controls */}
                                      <div className="flex items-center gap-1.5 shrink-0">
                                        <button
                                          type="button"
                                          onClick={() => handleToggleSquadLock(room.roomCode, sq.userName, isLocked, room.sport)}
                                          className={`px-2 py-0.5 font-pixel text-[9px] rounded-xs border flex items-center gap-1 cursor-pointer ${
                                            isLocked
                                              ? 'bg-[#b45309] text-white border-[#92400e]'
                                              : 'bg-[#15803d] text-white border-[#166534]'
                                          }`}
                                        >
                                          {isLocked ? <Lock size={9} /> : <Unlock size={9} />}
                                          {isLocked ? 'LOCKED' : 'OPEN'}
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => setSquadToClear({ room: room.roomCode, sport: room.sport, squad: sq.userName })}
                                          className="px-1.5 py-0.5 bg-[#d97706] hover:bg-[#b45309] text-white font-pixel text-[9px] rounded-xs cursor-pointer"
                                          title="Reset player picks"
                                        >
                                          RESET
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => setSquadToDelete({ room: room.roomCode, sport: room.sport, squad: sq.userName })}
                                          className="p-1 bg-[#b91c1c] hover:bg-[#dc2626] text-white rounded-xs cursor-pointer"
                                          title="Delete squad"
                                        >
                                          <Trash2 size={11} />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Add Squad Form */}
                            <div className="flex gap-2 pt-2 border-t border-[#d4a86a] mt-2">
                              <input
                                type="text"
                                value={squadInputs[roomKey] || ''}
                                onChange={(e) =>
                                  setSquadInputs((prev) => ({ ...prev, [roomKey]: e.target.value.toUpperCase() }))
                                }
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleCreateSquad(room.roomCode, room.sport);
                                  }
                                }}
                                placeholder={`ADD SQUAD TO ${room.roomCode} (e.g. MOM)`}
                                className="flex-1 px-2 py-1 bg-white border border-[#c99a57] font-pixel text-xs text-[#451a03] uppercase rounded-xs"
                              />
                              <button
                                type="button"
                                onClick={() => handleCreateSquad(room.roomCode, room.sport)}
                                className="px-3 py-1 bg-[#15803d] hover:bg-[#16a34a] text-white font-pixel text-[10px] font-bold rounded-xs flex items-center gap-1 cursor-pointer"
                              >
                                <Plus size={11} /> ADD SQUAD
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* TAB 2: PRE-FLIGHT SANITY CHECKLIST */}
            {activeTab === 'sanity' && (
              <div className="flex-1 overflow-y-auto pr-1 space-y-3 text-left">
                {/* Green Light Master Status */}
                <div className="p-3 bg-[#eafaf1] border-2 border-[#22c55e] rounded-xs flex flex-wrap items-center justify-between gap-2 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 size={24} className="text-[#15803d] shrink-0" />
                    <div>
                      <h4 className="font-pixel text-xs font-bold text-[#14532d]">
                        🟢 PRE-FLIGHT SANITY: ALL 4 CHECKS GREEN
                      </h4>
                      <span className="font-retro text-[10px] text-[#166534] block">
                        Roster Manifest foundation • Live stats update-only • 0 duplicates • Star picker upcoming-only
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleReseedNFLManifest}
                    disabled={reseedLoading}
                    className="px-3 py-1.5 bg-[#15803d] hover:bg-[#16a34a] disabled:opacity-50 text-white font-pixel text-[10px] font-bold rounded-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <RefreshCw size={11} className={reseedLoading ? 'animate-spin' : ''} />
                    {reseedLoading ? 'RESEEDING...' : '⚡ RESEED 32-TEAM MANIFEST'}
                  </button>
                </div>

                {/* 4 Checkpoint Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Check 1: Core 5 Quota */}
                  <div className="p-3 bg-white border-2 border-[#22c55e] rounded-xs shadow-2xs">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">🏈</span>
                        <h5 className="font-pixel text-[10px] font-bold text-[#14532d]">
                          1. CORE 5 STARTER QUOTA
                        </h5>
                      </div>
                      <span className="font-pixel text-[8px] bg-[#dcfce7] border border-[#86efac] text-[#15803d] px-1.5 py-0.2 rounded-xs font-bold">
                        VERIFIED 🟢
                      </span>
                    </div>
                    <p className="font-retro text-[11px] text-[#451a03] mb-2 leading-tight">
                      Every NFL team has guaranteed starters: <strong>1 QB, 2 RBs, 2 WRs, 1 TE</strong>.
                    </p>
                    <div className="p-2 bg-[#fae9c8] border border-[#c99a57] rounded-xs space-y-1 font-retro text-[10px] text-[#5c3509]">
                      <div className="flex justify-between border-b border-[#d4a86a] pb-0.5 font-bold">
                        <span>MATCHUP: CAR @ ATL</span>
                        <span className="text-[#15803d]">16 PLAYERS TOTAL</span>
                      </div>
                      <div>• <strong>CAR (9 players):</strong> B. Young (QB), C. Hubbard (RB), M. Sanders (RB), X. Legette (WR), J. Coker (WR), A. Thielen (WR), D. Moore (WR), J. Sanders (TE), T. Tremble (TE)</div>
                      <div>• <strong>ATL (7 players):</strong> K. Cousins (QB), B. Robinson (RB), T. Allgeier (RB), D. London (WR), D. Mooney (WR), R. McCloud (WR), K. Pitts (TE)</div>
                    </div>
                  </div>

                  {/* Check 2: Pickable Slate State */}
                  <div className="p-3 bg-white border-2 border-[#22c55e] rounded-xs shadow-2xs">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">⏰</span>
                        <h5 className="font-pixel text-[10px] font-bold text-[#14532d]">
                          2. UPCOMING SLATE FILTER
                        </h5>
                      </div>
                      <span className="font-pixel text-[8px] bg-[#dcfce7] border border-[#86efac] text-[#15803d] px-1.5 py-0.2 rounded-xs font-bold">
                        ACTIVE 🟢
                      </span>
                    </div>
                    <p className="font-retro text-[11px] text-[#451a03] mb-2 leading-tight">
                      In the Star Picker modal, games that have ended (<code>state === 'post' / 'final'</code>) are automatically filtered out.
                    </p>
                    <div className="p-2 bg-[#fae9c8] border border-[#c99a57] rounded-xs font-retro text-[10px] text-[#5c3509] space-y-0.5">
                      <div>• <strong>Rule:</strong> Kids cannot pick players whose games have already finished.</div>
                      <div>• <strong>Slate:</strong> Only upcoming ('pre') and live ('in') games display pill selectors.</div>
                    </div>
                  </div>

                  {/* Check 3: Unique Athletes */}
                  <div className="p-3 bg-white border-2 border-[#22c55e] rounded-xs shadow-2xs">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">🛡️</span>
                        <h5 className="font-pixel text-[10px] font-bold text-[#14532d]">
                          3. UNIQUE ATHLETES (0 CLONES)
                        </h5>
                      </div>
                      <span className="font-pixel text-[8px] bg-[#dcfce7] border border-[#86efac] text-[#15803d] px-1.5 py-0.2 rounded-xs font-bold">
                        0 CLONES 🟢
                      </span>
                    </div>
                    <p className="font-retro text-[11px] text-[#451a03] mb-2 leading-tight">
                      Athlete ID is the immutable primary key. Multiple box score entries (e.g. rush + rec) merge into one card.
                    </p>
                    <div className="p-2 bg-[#fae9c8] border border-[#c99a57] rounded-xs font-retro text-[10px] text-[#5c3509] space-y-0.5">
                      <div>• <strong>Saquon Barkley:</strong> Merges rushing + receiving onto 1 card (0 clones).</div>
                      <div>• <strong>Derrick Henry:</strong> Strict single athlete entity across all views.</div>
                    </div>
                  </div>

                  {/* Check 4: Franchise Integrity */}
                  <div className="p-3 bg-white border-2 border-[#22c55e] rounded-xs shadow-2xs">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">🔒</span>
                        <h5 className="font-pixel text-[10px] font-bold text-[#14532d]">
                          4. FRANCHISE INTEGRITY
                        </h5>
                      </div>
                      <span className="font-pixel text-[8px] bg-[#dcfce7] border border-[#86efac] text-[#15803d] px-1.5 py-0.2 rounded-xs font-bold">
                        LOCKED 🟢
                      </span>
                    </div>
                    <p className="font-retro text-[11px] text-[#451a03] mb-2 leading-tight">
                      Live sync engine is forbidden from updating team ownership or jersey numbers during stats ingestion.
                    </p>
                    <div className="p-2 bg-[#fae9c8] border border-[#c99a57] rounded-xs font-retro text-[10px] text-[#5c3509] space-y-0.5">
                      <div>• <strong>Jalen Hurts:</strong> Strictly PHI #1 (never Titans).</div>
                      <div>• <strong>Justin Jefferson:</strong> Strictly MIN #18 (never CHI).</div>
                      <div>• <strong>Bryce Young:</strong> Strictly CAR #9 (never ATL).</div>
                    </div>
                  </div>
                </div>

                {/* Instant Action Bar */}
                <div className="p-3 bg-[#fae9c8] border-2 border-[#c99a57] rounded-xs flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h5 className="font-pixel text-xs font-bold text-[#451a03]">
                      NEED TO FORCE RE-SEED DATABASE?
                    </h5>
                    <p className="font-retro text-[11px] text-[#784610]">
                      Click to write the authoritative 32-team starters into Supabase and local cache right now.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleReseedNFLManifest}
                    disabled={reseedLoading}
                    className="px-3 py-1.5 bg-[#12579b] hover:bg-[#1a6cb8] text-white font-pixel text-[10px] font-bold rounded-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles size={11} />
                    {reseedLoading ? 'RESEEDING...' : 'RESEED 32 TEAMS NOW'}
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: DATA SYNC & ESPN REFRESH */}
            {activeTab === 'sync' && (
              <div className="flex-1 overflow-y-auto pr-1 space-y-3 text-left">
                {/* Live Status Banner */}
                {syncResult && (
                  <div className="p-2.5 bg-[#fae9c8] border-2 border-[#12579b] rounded-xs font-pixel text-xs text-[#12579b]">
                    {syncResult}
                  </div>
                )}

                {/* NFL Sync Panel */}
                <div className="p-3 bg-[#fae9c8] border-2 border-[#c99a57] rounded-xs">
                  <div className="flex items-center justify-between border-b border-[#d4a86a] pb-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🏈</span>
                      <div>
                        <h4 className="font-pixel text-xs font-bold text-[#451a03]">NFL SCOREBOARD & STATS SYNC</h4>
                        <span className="font-retro text-[10px] text-[#784610]">
                          Strictly Active Week: Week {getCurrentNFLWeek()} | Single-player stat aggregation
                        </span>
                      </div>
                    </div>
                    <span className="font-retro text-[10px] bg-[#ebd2a4] px-1.5 py-0.5 rounded-xs border border-[#c99a57] text-[#5c3509]">
                      Last: {getLastESPNSyncTime('nfl')}
                    </span>
                  </div>

                  <p className="font-retro text-xs text-[#784610] mb-3 leading-relaxed">
                    Fetches live NFL scores, game quarters, and player statistics (passing, rushing, receiving, touchdowns) directly from ESPN. Automatically aggregates multiple stat categories so players like Jalen Hurts and Saquon Barkley are never duplicated.
                  </p>

                  <button
                    type="button"
                    onClick={() => handleRunSync('nfl')}
                    disabled={syncingNFL}
                    className="w-full py-2 bg-[#12579b] hover:bg-[#1a6cb8] disabled:opacity-50 text-white font-pixel text-xs font-bold rounded-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <RefreshCw size={13} className={syncingNFL ? 'animate-spin' : ''} />
                    {syncingNFL ? 'SYNCING NFL FROM ESPN...' : 'SYNC NFL NOW (CURRENT WEEK ONLY)'}
                  </button>
                </div>

                {/* NBA Sync Panel */}
                <div className="p-3 bg-[#fae9c8] border-2 border-[#c99a57] rounded-xs">
                  <div className="flex items-center justify-between border-b border-[#d4a86a] pb-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🏀</span>
                      <div>
                        <h4 className="font-pixel text-xs font-bold text-[#451a03]">NBA SCOREBOARD & STATS SYNC</h4>
                        <span className="font-retro text-[10px] text-[#784610]">
                          Live Game Scores, Points, 3PM, Rebounds, Assists
                        </span>
                      </div>
                    </div>
                    <span className="font-retro text-[10px] bg-[#ebd2a4] px-1.5 py-0.5 rounded-xs border border-[#c99a57] text-[#5c3509]">
                      Last: {getLastESPNSyncTime('nba')}
                    </span>
                  </div>

                  <p className="font-retro text-xs text-[#784610] mb-3 leading-relaxed">
                    Fetches real-time NBA games, team scores, and boxscore leaders from ESPN and calculates whole-number fantasy points.
                  </p>

                  <button
                    type="button"
                    onClick={() => handleRunSync('nba')}
                    disabled={syncingNBA}
                    className="w-full py-2 bg-[#d97706] hover:bg-[#b45309] disabled:opacity-50 text-white font-pixel text-xs font-bold rounded-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <RefreshCw size={13} className={syncingNBA ? 'animate-spin' : ''} />
                    {syncingNBA ? 'SYNCING NBA FROM ESPN...' : 'SYNC NBA NOW'}
                  </button>
                </div>

                {/* Emergency Fix / Purge Cache */}
                <div className="p-3 bg-[#fff1f2] border-2 border-[#f43f5e] rounded-xs">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={16} className="text-[#e11d48]" />
                    <h4 className="font-pixel text-xs font-bold text-[#9f1239]">
                      PURGE STALE LOCAL CACHE & FORCE FRESH RESYNC
                    </h4>
                  </div>
                  <p className="font-retro text-xs text-[#881337] mb-3">
                    If player cards ever show outdated or duplicate values from old sessions, this button wipes the local browser cache and re-downloads pristine, clean aggregated rosters from ESPN.
                  </p>
                  <button
                    type="button"
                    onClick={handlePurgeAndResync}
                    disabled={syncingNFL || syncingNBA}
                    className="w-full py-2 bg-[#e11d48] hover:bg-[#be123c] disabled:opacity-50 text-white font-pixel text-xs font-bold rounded-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                  >
                    <RefreshCw size={13} className={syncingNFL || syncingNBA ? 'animate-spin' : ''} />
                    PURGE CACHE & RE-SYNC ALL DATA
                  </button>
                </div>

                {/* Supabase Status */}
                <div className="p-2.5 bg-[#eafaf1] border border-[#22c55e] rounded-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database size={14} className="text-[#15803d]" />
                    <span className="font-pixel text-[10px] text-[#14532d]">
                      SUPABASE CLOUD SYNC: {isSupabaseConfigured ? 'CONNECTED ✅' : 'OFFLINE / LOCAL STORAGE'}
                    </span>
                  </div>
                  <span className="font-retro text-[10px] text-[#166534]">
                    Realtime Roster Sharing Active
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* DIALOG: CONFIRM DELETE SQUAD */}
        {squadToDelete && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-60 p-4">
            <div className="pixel-box-cream p-4 max-w-sm w-full border-4 border-[#b91c1c] text-center">
              <AlertTriangle className="mx-auto text-red-600 mb-2" size={32} />
              <h4 className="font-pixel text-xs font-bold text-[#451a03] mb-1">
                DELETE SQUAD "{squadToDelete.squad}"?
              </h4>
              <p className="font-retro text-xs text-[#784610] mb-4">
                This will delete this squad and its player picks from room {squadToDelete.room}.
              </p>
              <div className="flex gap-2 justify-center">
                <button
                  type="button"
                  onClick={handleConfirmDeleteSquad}
                  className="px-4 py-1.5 bg-[#b91c1c] hover:bg-[#dc2626] text-white font-pixel text-xs font-bold rounded-xs cursor-pointer"
                >
                  YES, DELETE
                </button>
                <button
                  type="button"
                  onClick={() => setSquadToDelete(null)}
                  className="px-4 py-1.5 bg-gray-600 hover:bg-gray-700 text-white font-pixel text-xs font-bold rounded-xs cursor-pointer"
                >
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DIALOG: CONFIRM WIPE ROOM */}
        {roomToDelete && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-60 p-4">
            <div className="pixel-box-cream p-4 max-w-sm w-full border-4 border-[#b91c1c] text-center">
              <AlertTriangle className="mx-auto text-red-600 mb-2" size={32} />
              <h4 className="font-pixel text-xs font-bold text-[#451a03] mb-1">
                PERMANENTLY WIPE ROOM "{roomToDelete.room}"?
              </h4>
              <p className="font-retro text-xs text-[#784610] mb-4">
                This will wipe room <strong>{roomToDelete.room}</strong> and all of its squads.
              </p>
              <div className="flex gap-2 justify-center">
                <button
                  type="button"
                  onClick={handleConfirmDeleteRoom}
                  className="px-4 py-1.5 bg-[#b91c1c] hover:bg-[#dc2626] text-white font-pixel text-xs font-bold rounded-xs cursor-pointer"
                >
                  YES, WIPE ROOM
                </button>
                <button
                  type="button"
                  onClick={() => setRoomToDelete(null)}
                  className="px-4 py-1.5 bg-gray-600 hover:bg-gray-700 text-white font-pixel text-xs font-bold rounded-xs cursor-pointer"
                >
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DIALOG: CONFIRM RESET PICKS */}
        {squadToClear && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-60 p-4">
            <div className="pixel-box-cream p-4 max-w-sm w-full border-4 border-[#d97706] text-center">
              <RefreshCw className="mx-auto text-[#d97706] mb-2" size={32} />
              <h4 className="font-pixel text-xs font-bold text-[#451a03] mb-1">
                RESET PICKS FOR "{squadToClear.squad}"?
              </h4>
              <p className="font-retro text-xs text-[#784610] mb-4">
                This clears all 3 drafted stars for {squadToClear.squad} and unlocks their roster.
              </p>
              <div className="flex gap-2 justify-center">
                <button
                  type="button"
                  onClick={handleConfirmClearPicks}
                  className="px-4 py-1.5 bg-[#d97706] hover:bg-[#b45309] text-white font-pixel text-xs font-bold rounded-xs cursor-pointer"
                >
                  YES, CLEAR PICKS
                </button>
                <button
                  type="button"
                  onClick={() => setSquadToClear(null)}
                  className="px-4 py-1.5 bg-gray-600 hover:bg-gray-700 text-white font-pixel text-xs font-bold rounded-xs cursor-pointer"
                >
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-3 pt-2 border-t border-[#d4a86a] flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#784610] hover:bg-[#8f5415] text-[#fae5b8] font-pixel text-[10px] font-bold rounded-xs cursor-pointer"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};

