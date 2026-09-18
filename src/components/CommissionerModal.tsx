import React, { useState, useEffect } from 'react';
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
  DoorOpen,
  Users,
  AlertTriangle,
  Zap,
  Radio,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { SportId, UserRoster } from '../types';
import {
  fetchAllActiveRooms,
  ActiveRoomSummary,
  deleteUserRoster,
  resetRoomRosters,
  renameUserRoster,
  toggleSquadLock,
  setAllSquadsLock,
  clearSquadStars,
} from '../lib/supabaseClient';
import {
  syncESPNData,
  getLastESPNSyncTime,
  getCurrentNFLWeek,
  setCurrentNFLWeek,
  purgeStaleWeekMatches,
} from '../lib/espnSync';

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

  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [allRooms, setAllRooms] = useState<ActiveRoomSummary[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);

  // Rename squad state
  const [editingSquad, setEditingSquad] = useState<string | null>(null);
  const [newSquadName, setNewSquadName] = useState('');

  // Confirmation modals
  const [squadToDelete, setSquadToDelete] = useState<string | null>(null);
  const [roomToDelete, setRoomToDelete] = useState<string | null>(null);
  const [squadToClear, setSquadToClear] = useState<string | null>(null);

  // New room/squad creation
  const [createRoomInput, setCreateRoomInput] = useState('');
  const [createSquadInput, setCreateSquadInput] = useState('');

  // ESPN Live Data & Schedule Sync state
  const [isSyncingESPN, setIsSyncingESPN] = useState(false);
  const [espnSyncStatus, setEspnSyncStatus] = useState<string | null>(null);
  const [lastSyncNFL, setLastSyncNFL] = useState<string | null>(() => getLastESPNSyncTime('nfl'));
  const [lastSyncNBA, setLastSyncNBA] = useState<string | null>(() => getLastESPNSyncTime('nba'));

  // Active NFL Week state
  const [activeNFLWeek, setActiveNFLWeekState] = useState<number>(() => getCurrentNFLWeek());
  const [isPurgingWeeks, setIsPurgingWeeks] = useState(false);

  const handleSetNFLWeek = (newWeek: number) => {
    setActiveNFLWeekState(newWeek);
    setCurrentNFLWeek(newWeek);
    showToast(`Active NFL Week set to Week ${newWeek}`);
    onRefreshData();
  };

  const handlePurgeStaleWeeks = async () => {
    setIsPurgingWeeks(true);
    try {
      const res = await purgeStaleWeekMatches('nfl');
      showToast(res.message);
      onRefreshData();
    } catch (err: any) {
      showToast(`Purge failed: ${err.message}`);
    } finally {
      setIsPurgingWeeks(false);
    }
  };

  const handleSyncESPN = async (sportToSync: SportId) => {
    setIsSyncingESPN(true);
    setEspnSyncStatus(`Querying ESPN live ${sportToSync.toUpperCase()} Scoreboard API...`);
    try {
      const result = await syncESPNData(sportToSync);
      setEspnSyncStatus(result.message);
      if (sportToSync === 'nfl') setLastSyncNFL(result.timestamp);
      if (sportToSync === 'nba') setLastSyncNBA(result.timestamp);
      showToast(result.message);
      onRefreshData();
    } catch (err: any) {
      const errMsg = `ESPN sync error: ${err.message || 'Failed'}`;
      setEspnSyncStatus(errMsg);
      showToast(errMsg);
    } finally {
      setIsSyncingESPN(false);
    }
  };

  const handleSyncBothSports = async () => {
    setIsSyncingESPN(true);
    setEspnSyncStatus('Querying ESPN live NFL and NBA Scoreboards...');
    try {
      const nflRes = await syncESPNData('nfl');
      const nbaRes = await syncESPNData('nba');
      const summaryMsg = `ESPN Synced: ${nflRes.gamesCount} NFL games & ${nbaRes.gamesCount} NBA games!`;
      setEspnSyncStatus(summaryMsg);
      setLastSyncNFL(nflRes.timestamp);
      setLastSyncNBA(nbaRes.timestamp);
      showToast(summaryMsg);
      onRefreshData();
    } catch (err: any) {
      const errMsg = `ESPN sync error: ${err.message || 'Failed'}`;
      setEspnSyncStatus(errMsg);
      showToast(errMsg);
    } finally {
      setIsSyncingESPN(false);
    }
  };

  // Load active rooms when open and authenticated
  const loadRooms = async () => {
    setIsLoadingRooms(true);
    try {
      const rooms = await fetchAllActiveRooms();
      setAllRooms(rooms);
    } catch {
      // ignore
    } finally {
      setIsLoadingRooms(false);
    }
  };

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      loadRooms();
    }
  }, [isOpen, isAuthenticated]);

  if (!isOpen) return null;

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    // Default commissioner PIN is 1234
    if (pinInput.trim() === '1234') {
      setIsAuthenticated(true);
      setPinError(false);
      try {
        localStorage.setItem('pixel_pros_commissioner_auth', 'true');
      } catch {}
      loadRooms();
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

  // Squad Actions
  const handleToggleSquadLock = async (userName: string, currentLock: boolean) => {
    const next = !currentLock;
    await toggleSquadLock(currentRoom, userName, next, currentSport);
    showToast(`${userName} is now ${next ? 'LOCKED' : 'UNLOCKED'}!`);
    onRefreshData();
  };

  const handleLockAll = async (locked: boolean) => {
    await setAllSquadsLock(currentRoom, locked, currentSport);
    showToast(`All squads in ${currentRoom} are now ${locked ? 'LOCKED' : 'UNLOCKED'}!`);
    onRefreshData();
  };

  const handleStartRename = (oldName: string) => {
    setEditingSquad(oldName);
    setNewSquadName(oldName);
  };

  const handleConfirmRename = async () => {
    if (!editingSquad || !newSquadName.trim()) return;
    const cleanNew = newSquadName.trim().toUpperCase();
    if (cleanNew === editingSquad) {
      setEditingSquad(null);
      return;
    }

    const res = await renameUserRoster(currentRoom, editingSquad, cleanNew, currentSport);
    if (res.success) {
      showToast(`Renamed ${editingSquad} to ${cleanNew}`);
      setEditingSquad(null);
      onRefreshData();
      loadRooms();
    } else {
      showToast(res.error || 'Failed to rename squad');
    }
  };

  const handleConfirmDeleteSquad = async () => {
    if (!squadToDelete) return;
    const user = squadToDelete;
    await deleteUserRoster(currentRoom, user, currentSport);
    showToast(`Deleted squad ${user} from ${currentRoom}`);
    setSquadToDelete(null);
    onRefreshData();
    loadRooms();
  };

  const handleConfirmClearPicks = async () => {
    if (!squadToClear) return;
    const user = squadToClear;
    await clearSquadStars(currentRoom, user, currentSport);
    showToast(`Cleared draft picks for ${user}`);
    setSquadToClear(null);
    onRefreshData();
  };

  // Room Actions
  const handleConfirmDeleteRoom = async () => {
    if (!roomToDelete) return;
    const target = roomToDelete;
    await resetRoomRosters(target);
    showToast(`Room ${target} and all squads wiped from database`);
    setRoomToDelete(null);

    // If we deleted the room we are currently inside, switch to default
    if (target.toUpperCase() === currentRoom.toUpperCase()) {
      const def = currentSport === 'nba' ? 'HOOPS' : 'COUCH';
      onSwitchRoom(def);
    }
    onRefreshData();
    loadRooms();
  };

  const handleCreateNewRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = createRoomInput.trim().toUpperCase();
    if (!clean) return;
    onSwitchRoom(clean);
    setCreateRoomInput('');
    showToast(`Switched to room ${clean}`);
    onClose();
  };

  // Filter current room's squads
  const currentRoomSquads = roomRosters.filter(
    (r) => (r.room_code || '').toUpperCase() === currentRoom.toUpperCase()
  );

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-2 sm:p-4 backdrop-blur-xs">
      <div className="pixel-box-cream p-4 sm:p-5 w-full max-w-2xl border-4 border-[#1a2238] max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-[#d4a86a] pb-2 mb-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-[#12579b] border border-[#0a2e52] flex items-center justify-center text-white rounded-xs">
              <ShieldAlert size={16} />
            </div>
            <div>
              <h2 className="font-pixel text-xs sm:text-sm text-[#5c3509] font-bold uppercase tracking-wider">
                COMMISSIONER & ADMIN MODE
              </h2>
              <span className="font-retro text-[10px] text-[#8c532b] block">
                Manage Couches, Squads, Locks & Deletions
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
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
              className="w-6 h-6 bg-[#b91c1c] hover:bg-[#dc2626] text-white font-pixel text-xs cursor-pointer flex items-center justify-center rounded-xs"
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
              Enter your PIN to manage rooms, unlock rosters, or delete old couches. (Default is{' '}
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
                UNLOCK COMMISSIONER MODE
              </button>
            </form>
          </div>
        ) : (
          /* AUTHENTICATED COMMISSIONER DASHBOARD */
          <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-left">
            {/* SECTION 1: CURRENT COUCH CONTROLS */}
            <div className="p-3 bg-[#fae9c8] border-2 border-[#c99a57] rounded-xs shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#d4a86a] pb-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-pixel text-xs font-bold text-[#451a03]">
                    🛋️ CURRENT ROOM: <span className="text-[#12579b] underline">{currentRoom}</span>
                  </span>
                  <span className="font-retro text-[10px] bg-[#ebd2a4] px-1.5 py-0.5 border border-[#c99a57] rounded-xs font-bold text-[#5c3509]">
                    {currentSport.toUpperCase()}
                  </span>
                  <span className="font-pixel text-[10px] text-[#784610]">
                    ({currentRoomSquads.length} {currentRoomSquads.length === 1 ? 'Squad' : 'Squads'})
                  </span>
                </div>

                {/* Bulk Room Actions */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleLockAll(false)}
                    className="px-2 py-1 bg-[#15803d] hover:bg-[#16a34a] text-white font-pixel text-[9px] rounded-xs flex items-center gap-1 cursor-pointer"
                    title="Unlock all squads in this room"
                  >
                    <Unlock size={10} /> UNLOCK ALL
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLockAll(true)}
                    className="px-2 py-1 bg-[#b45309] hover:bg-[#d97706] text-white font-pixel text-[9px] rounded-xs flex items-center gap-1 cursor-pointer"
                    title="Lock all squads in this room"
                  >
                    <Lock size={10} /> LOCK ALL
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoomToDelete(currentRoom)}
                    className="px-2 py-1 bg-[#b91c1c] hover:bg-[#dc2626] text-white font-pixel text-[9px] rounded-xs flex items-center gap-1 cursor-pointer"
                    title="Delete this room and its squads"
                  >
                    <Trash2 size={10} /> WIPE ROOM
                  </button>
                </div>
              </div>

              {/* Squads in Current Room Table */}
              {currentRoomSquads.length === 0 ? (
                <div className="py-4 text-center text-[#784610] font-retro text-xs italic">
                  No squads currently registered in room {currentRoom}.
                </div>
              ) : (
                <div className="space-y-2">
                  {currentRoomSquads.map((sq) => {
                    const isLocked = Boolean(sq.is_locked || sq.device_id === 'LOCKED');
                    const stars = [sq.star_1_id, sq.star_2_id, sq.star_3_id].filter(Boolean);
                    const isEditing = editingSquad === sq.user_name.toUpperCase();

                    return (
                      <div
                        key={sq.user_name}
                        className="p-2 bg-[#fff6e6] border border-[#d4a86a] rounded-xs flex flex-wrap items-center justify-between gap-2 shadow-2xs"
                      >
                        {/* Name & Stars */}
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
                                title="Save Name"
                              >
                                <Check size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingSquad(null)}
                                className="p-1 bg-gray-500 text-white rounded-xs cursor-pointer"
                                title="Cancel"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="font-pixel text-xs font-bold text-[#451a03]">
                                {sq.user_name}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleStartRename(sq.user_name)}
                                className="text-[#12579b] hover:text-[#1a6cb8] p-0.5 cursor-pointer"
                                title="Rename Squad"
                              >
                                <Edit2 size={11} />
                              </button>
                            </div>
                          )}

                          <span className="font-retro text-[10px] text-[#784610] bg-[#fae9c8] px-1 border border-[#c99a57] rounded-xs">
                            {stars.length}/3 Stars
                          </span>
                        </div>

                        {/* Squad Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Lock Toggle */}
                          <button
                            type="button"
                            onClick={() => handleToggleSquadLock(sq.user_name, isLocked)}
                            className={`px-2 py-0.5 font-pixel text-[9px] rounded-xs border flex items-center gap-1 cursor-pointer ${
                              isLocked
                                ? 'bg-[#b45309] text-white border-[#92400e]'
                                : 'bg-[#15803d] text-white border-[#166534]'
                            }`}
                          >
                            {isLocked ? <Lock size={10} /> : <Unlock size={10} />}
                            {isLocked ? 'LOCKED' : 'OPEN'}
                          </button>

                          {/* Reset Picks */}
                          <button
                            type="button"
                            onClick={() => setSquadToClear(sq.user_name)}
                            className="px-1.5 py-0.5 bg-[#d97706] hover:bg-[#b45309] text-white font-pixel text-[9px] rounded-xs cursor-pointer"
                            title="Clear this squad's 3 star picks"
                          >
                            RESET PICKS
                          </button>

                          {/* Delete Squad */}
                          <button
                            type="button"
                            onClick={() => setSquadToDelete(sq.user_name)}
                            className="p-1 bg-[#b91c1c] hover:bg-[#dc2626] text-white rounded-xs cursor-pointer"
                            title="Delete Squad"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SECTION 2: ESPN LIVE DATA & SCHEDULE SYNC */}
            <div className="p-3 bg-[#fae9c8] border-2 border-[#12579b] rounded-xs shadow-xs">
              <div className="flex items-center justify-between border-b border-[#d4a86a] pb-2 mb-2">
                <div className="flex items-center gap-1.5">
                  <Zap size={14} className="text-[#d97706] fill-[#d97706]" />
                  <span className="font-pixel text-xs font-bold text-[#12579b]">
                    ⚡ ESPN SCHEDULE & LIVE SCORES SYNC
                  </span>
                  {isSyncingESPN && (
                    <RefreshCw size={11} className="animate-spin text-[#12579b]" />
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-pixel text-[8px] bg-[#12579b] text-white px-1.5 py-0.5 rounded-xs">
                    DIRECT ESPN API
                  </span>
                </div>
              </div>

              <p className="font-retro text-[11px] text-[#784610] mb-2 leading-tight">
                Instantly pull live game schedules, quarter clocks, final scores, and athlete stats directly from ESPN's public Scoreboard API into your database and app.
              </p>

              {/* Status or last sync line */}
              <div className="flex flex-wrap items-center justify-between gap-1 mb-2.5 px-2 py-1 bg-[#f3d9a8] border border-[#d4a86a] rounded-xs text-[10px] font-retro text-[#451a03]">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <Clock size={10} className="text-[#784610]" />
                    NFL Last Sync: <strong>{lastSyncNFL || 'Not yet'}</strong>
                  </span>
                  <span className="text-[#b08048]">|</span>
                  <span>
                    NBA Last Sync: <strong>{lastSyncNBA || 'Not yet'}</strong>
                  </span>
                </div>
                <span className="font-pixel text-[8px] text-emerald-800 flex items-center gap-0.5">
                  <CheckCircle2 size={9} /> NO POLLER REQUIRED
                </span>
              </div>

              {espnSyncStatus && (
                <div className="mb-2.5 p-2 bg-[#e0f2fe] border border-[#38bdf8] text-[#0369a1] font-retro text-xs rounded-xs flex items-center gap-1.5">
                  <Radio size={12} className="shrink-0 text-[#0284c7]" />
                  <span className="font-bold">{espnSyncStatus}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2.5">
                <button
                  type="button"
                  disabled={isSyncingESPN}
                  onClick={() => handleSyncESPN('nfl')}
                  className="px-2.5 py-2 bg-[#12579b] hover:bg-[#1a6cb8] disabled:bg-gray-400 text-white font-pixel text-[10px] font-bold rounded-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <RefreshCw size={11} className={isSyncingESPN ? 'animate-spin' : ''} />
                  <span>REFRESH NFL (ESPN)</span>
                </button>

                <button
                  type="button"
                  disabled={isSyncingESPN}
                  onClick={() => handleSyncESPN('nba')}
                  className="px-2.5 py-2 bg-[#d97706] hover:bg-[#b45309] disabled:bg-gray-400 text-white font-pixel text-[10px] font-bold rounded-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <RefreshCw size={11} className={isSyncingESPN ? 'animate-spin' : ''} />
                  <span>REFRESH NBA (ESPN)</span>
                </button>

                <button
                  type="button"
                  disabled={isSyncingESPN}
                  onClick={handleSyncBothSports}
                  className="px-2.5 py-2 bg-[#1b4332] hover:bg-[#2d6a4f] disabled:bg-gray-400 text-white font-pixel text-[10px] font-bold rounded-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <Zap size={11} className="text-[#a7f3d0]" />
                  <span>SYNC BOTH SPORTS</span>
                </button>
              </div>

              {/* Active NFL Week Controller (No past/future games allowed) */}
              <div className="pt-2 border-t border-[#d4a86a] flex flex-wrap items-center justify-between gap-2 bg-[#f4deb3] p-2 rounded-xs">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-pixel text-[9px] sm:text-[10px] text-[#451a03] font-bold">
                    ACTIVE NFL WEEK (GAMES SHOWN):
                  </span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((wk) => (
                      <button
                        key={wk}
                        type="button"
                        onClick={() => handleSetNFLWeek(wk)}
                        className={`px-2 py-0.5 font-pixel text-[9px] rounded-2xs border cursor-pointer transition-all ${
                          activeNFLWeek === wk
                            ? 'bg-[#12579b] text-[#fae5b8] border-[#0a2e52] font-bold shadow-xs'
                            : 'bg-[#fff6e6] hover:bg-white text-[#5c3509] border-[#c99a57]'
                        }`}
                      >
                        WK {wk}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isPurgingWeeks}
                  onClick={handlePurgeStaleWeeks}
                  className="px-2 py-1 bg-[#b91c1c] hover:bg-[#dc2626] disabled:bg-gray-400 text-white font-pixel text-[9px] rounded-2xs border border-[#7f1d1d] cursor-pointer flex items-center gap-1 shadow-xs"
                  title="Purge past and future week games so only current week games remain visible"
                >
                  <Trash2 size={10} />
                  <span>{isPurgingWeeks ? 'CLEANING...' : 'PURGE PAST/FUTURE GAMES'}</span>
                </button>
              </div>
            </div>

            {/* SECTION 3: ALL ROOMS MANAGER (DELETE / CLEAN ROOMS) */}
            <div className="p-3 bg-[#fae9c8] border-2 border-[#c99a57] rounded-xs shadow-xs">
              <div className="flex items-center justify-between border-b border-[#d4a86a] pb-2 mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="font-pixel text-xs font-bold text-[#451a03]">
                    🌐 ALL ACTIVE ROOMS IN DATABASE
                  </span>
                  {isLoadingRooms && (
                    <RefreshCw size={11} className="animate-spin text-[#12579b]" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={loadRooms}
                  className="font-pixel text-[9px] text-[#12579b] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw size={9} /> REFRESH
                </button>
              </div>

              <p className="font-retro text-[11px] text-[#784610] mb-2 leading-tight">
                Here are all room codes currently stored. Tap <strong>WIPE</strong> to permanently delete test rooms or typo rooms (like <code>PCCLT1</code>) in one click!
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {allRooms.map((r) => {
                  const isCur = r.roomCode.toUpperCase() === currentRoom.toUpperCase();
                  return (
                    <div
                      key={`${r.roomCode}-${r.sport}`}
                      className={`p-2 rounded-xs border flex items-center justify-between gap-1.5 ${
                        isCur
                          ? 'bg-[#e0f2fe] border-[#0284c7]'
                          : 'bg-[#fff6e6] border-[#d4a86a]'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-pixel text-xs font-bold text-[#1a2238]">
                            {r.roomCode}
                          </span>
                          <span className="font-retro text-[9px] text-[#5c3509] uppercase px-1 bg-[#fae9c8] border border-[#c99a57] rounded-xs">
                            {r.sport}
                          </span>
                          {isCur && (
                            <span className="font-pixel text-[8px] bg-[#0284c7] text-white px-1 rounded-xs">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <span className="font-retro text-[10px] text-[#784610] block truncate">
                          {r.squadCount} {r.squadCount === 1 ? 'Squad' : 'Squads'}:{' '}
                          {r.squadNames.join(', ')}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {!isCur && (
                          <button
                            type="button"
                            onClick={() => {
                              onSwitchRoom(r.roomCode);
                              showToast(`Switched to room ${r.roomCode}`);
                            }}
                            className="px-1.5 py-0.5 bg-[#12579b] hover:bg-[#1a6cb8] text-white font-pixel text-[9px] rounded-xs cursor-pointer"
                          >
                            JOIN
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setRoomToDelete(r.roomCode)}
                          className="px-1.5 py-0.5 bg-[#b91c1c] hover:bg-[#dc2626] text-white font-pixel text-[9px] rounded-xs flex items-center gap-0.5 cursor-pointer"
                          title={`Permanently delete room ${r.roomCode}`}
                        >
                          <Trash2 size={10} /> WIPE
                        </button>
                      </div>
                    </div>
                  );
                })}

                {allRooms.length === 0 && !isLoadingRooms && (
                  <div className="col-span-2 py-3 text-center font-retro text-xs text-[#784610] italic">
                    No active rooms found in the database.
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 3: QUICK CREATE ROOM */}
            <div className="p-3 bg-[#fae9c8] border-2 border-[#c99a57] rounded-xs shadow-xs">
              <span className="font-pixel text-xs font-bold text-[#451a03] block mb-1">
                ➕ CREATE OR JUMP TO NEW ROOM
              </span>
              <form onSubmit={handleCreateNewRoom} className="flex gap-2">
                <input
                  type="text"
                  value={createRoomInput}
                  onChange={(e) => setCreateRoomInput(e.target.value.toUpperCase())}
                  placeholder="NEW ROOM CODE (e.g. GAMEDAY)"
                  className="flex-1 px-2.5 py-1.5 bg-white border border-[#c99a57] font-pixel text-xs text-[#451a03] uppercase rounded-xs"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[#12579b] hover:bg-[#1a6cb8] text-white font-pixel text-xs font-bold rounded-xs cursor-pointer"
                >
                  START ROOM
                </button>
              </form>
            </div>
          </div>
        )}

        {/* DIALOG: CONFIRM DELETE SQUAD */}
        {squadToDelete && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-60 p-4">
            <div className="pixel-box-cream p-4 max-w-sm w-full border-4 border-[#b91c1c] text-center">
              <AlertTriangle className="mx-auto text-red-600 mb-2" size={32} />
              <h4 className="font-pixel text-xs font-bold text-[#451a03] mb-1">
                DELETE SQUAD "{squadToDelete}"?
              </h4>
              <p className="font-retro text-xs text-[#784610] mb-4">
                This will delete this squad and its player picks from room {currentRoom} in the database.
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
                PERMANENTLY WIPE ROOM "{roomToDelete}"?
              </h4>
              <p className="font-retro text-xs text-[#784610] mb-4">
                This will completely remove room <strong>{roomToDelete}</strong> and all of its squads from the Supabase database.
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
                RESET PICKS FOR "{squadToClear}"?
              </h4>
              <p className="font-retro text-xs text-[#784610] mb-4">
                This clears all 3 drafted stars for {squadToClear} and unlocks their roster so they can pick again.
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
