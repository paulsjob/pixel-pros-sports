import React, { useState } from 'react';
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
} from '../lib/supabaseClient';

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

  // Rename squad state
  const [editingSquad, setEditingSquad] = useState<string | null>(null);
  const [newSquadName, setNewSquadName] = useState('');

  // Confirmation modals
  const [squadToDelete, setSquadToDelete] = useState<string | null>(null);
  const [roomToDelete, setRoomToDelete] = useState<string | null>(null);
  const [squadToClear, setSquadToClear] = useState<string | null>(null);

  // Quick add squad
  const [createSquadInput, setCreateSquadInput] = useState('');

  const handleCopyOneTapLink = async () => {
    const activeKey = resolveSupabaseAnonKey();
    const keyParam = activeKey ? `&k=${encodeURIComponent(activeKey)}` : '';
    const inviteUrl = `${window.location.origin}/?sport=${currentSport}&room=${currentRoom}${keyParam}`;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      showToast(`COPIED 1-TAP INVITE LINK FOR ROOM ${currentRoom}!`);
    } catch {
      showToast(`Link: ${inviteUrl}`);
    }
  };

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
  };

  const handleConfirmClearPicks = async () => {
    if (!squadToClear) return;
    const user = squadToClear;
    await clearSquadStars(currentRoom, user, currentSport);
    showToast(`Cleared draft picks for ${user}`);
    setSquadToClear(null);
    onRefreshData();
  };

  const handleConfirmDeleteRoom = async () => {
    if (!roomToDelete) return;
    const target = roomToDelete;
    await resetRoomRosters(target);
    showToast(`Room ${target} and all squads wiped`);
    setRoomToDelete(null);

    if (target.toUpperCase() === currentRoom.toUpperCase()) {
      const def = currentSport === 'nba' ? 'HOOPS' : 'COUCH';
      onSwitchRoom(def);
    }
    onRefreshData();
  };

  const handleCreateSquad = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = createSquadInput.trim().toUpperCase();
    if (!clean) return;
    await upsertUserRoster(currentRoom, clean, '', '', '', false, currentSport);
    setCreateSquadInput('');
    showToast(`Added squad ${clean} to room ${currentRoom}`);
    onRefreshData();
  };

  // Filter current room's squads
  const currentRoomSquads = roomRosters.filter(
    (r) => (r.room_code || '').toUpperCase() === currentRoom.toUpperCase()
  );

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-2 sm:p-4 backdrop-blur-xs">
      <div className="pixel-box-cream p-4 sm:p-5 w-full max-w-xl border-4 border-[#1a2238] max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
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
                Manage Squads, Locks & Invites
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
              Enter your PIN to manage squads and room locks. (Default is{' '}
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
          <div className="flex-1 overflow-y-auto pr-1 space-y-3 text-left">
            {/* 1. ACTIVE ROOM CODE & LOCK ALL / UNLOCK ALL */}
            <div className="p-3 bg-[#fae9c8] border-2 border-[#c99a57] rounded-xs shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#d4a86a] pb-2 mb-3">
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

                {/* Lock All / Unlock All Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleLockAll(false)}
                    className="px-2.5 py-1.5 bg-[#15803d] hover:bg-[#16a34a] text-white font-pixel text-[10px] font-bold rounded-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title="Unlock all squads in this room"
                  >
                    <Unlock size={11} /> UNLOCK ALL
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLockAll(true)}
                    className="px-2.5 py-1.5 bg-[#b45309] hover:bg-[#d97706] text-white font-pixel text-[10px] font-bold rounded-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title="Lock all squads in this room"
                  >
                    <Lock size={11} /> LOCK ALL
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoomToDelete(currentRoom)}
                    className="p-1.5 bg-[#b91c1c] hover:bg-[#dc2626] text-white rounded-xs cursor-pointer shadow-xs"
                    title={`Wipe all squads in room ${currentRoom}`}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              {/* 2. 1-TAP INVITE LINK */}
              <div className="mb-3 p-2.5 bg-[#eafaf1] border border-[#22c55e] rounded-xs flex flex-col sm:flex-row items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-pixel text-[10px] font-bold text-[#14532d] flex items-center gap-1">
                    <Globe size={12} /> 1-TAP INVITE LINK (ROOM {currentRoom})
                  </div>
                  <div className="font-retro text-[10px] text-[#166534]">
                    Tap to copy direct invite link for friends & family
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyOneTapLink}
                  className="w-full sm:w-auto py-1.5 px-3 bg-[#15803d] hover:bg-[#16a34a] text-white font-pixel text-[10px] font-bold rounded-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs shrink-0"
                >
                  <Copy size={12} />
                  COPY INVITE LINK
                </button>
              </div>

              {/* 3. SQUAD LIST */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-pixel text-[10px] font-bold text-[#451a03]">
                    SQUADS IN ROOM ({currentRoomSquads.length}):
                  </span>
                </div>

                {currentRoomSquads.length === 0 ? (
                  <div className="py-4 text-center text-[#784610] font-retro text-xs italic bg-[#fff6e6] border border-[#d4a86a] rounded-xs">
                    No squads currently registered in room {currentRoom}.
                  </div>
                ) : (
                  <div className="space-y-1.5">
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

                {/* Add Squad to Room */}
                <form onSubmit={handleCreateSquad} className="flex gap-2 pt-2 border-t border-[#d4a86a] mt-2">
                  <input
                    type="text"
                    value={createSquadInput}
                    onChange={(e) => setCreateSquadInput(e.target.value.toUpperCase())}
                    placeholder="NEW SQUAD NAME (e.g. MOM)"
                    className="flex-1 px-2.5 py-1.5 bg-white border border-[#c99a57] font-pixel text-xs text-[#451a03] uppercase rounded-xs"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-[#15803d] hover:bg-[#16a34a] text-white font-pixel text-xs font-bold rounded-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={12} /> ADD SQUAD
                  </button>
                </form>
              </div>
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
                This will delete this squad and its player picks from room {currentRoom}.
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
                This will wipe room <strong>{roomToDelete}</strong> and all of its squads.
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
                This clears all 3 drafted stars for {squadToClear} and unlocks their roster.
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
