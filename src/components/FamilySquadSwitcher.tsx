import React, { useState, useRef, useEffect } from 'react';
import { Users, Plus, Lock, Check, X, ShieldAlert, ChevronLeft, ChevronRight } from 'lucide-react';

interface FamilySquadSwitcherProps {
  activeUserName: string;
  roomCode: string;
  squads: Array<{
    userName: string;
    isLocked?: boolean;
    starCount?: number;
    totalScore?: number;
  }>;
  onSelectSquad: (squadName: string) => void;
  onCreateSquad: (squadName: string) => void;
  onDeleteSquad?: (squadName: string) => void;
  onOpenRoomModal?: () => void;
  isAddDrawerOpen?: boolean;
  onOpenAddDrawer?: () => void;
  onCloseAddDrawer?: () => void;
}

export const FamilySquadSwitcher: React.FC<FamilySquadSwitcherProps> = ({
  activeUserName,
  roomCode,
  squads,
  onSelectSquad,
  onCreateSquad,
  onDeleteSquad,
  onOpenRoomModal,
  isAddDrawerOpen,
  onOpenAddDrawer,
  onCloseAddDrawer,
}) => {
  const [internalIsAdding, setInternalIsAdding] = useState(false);
  const isAdding = isAddDrawerOpen !== undefined ? isAddDrawerOpen : internalIsAdding;

  const [newSquadName, setNewSquadName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [squadToDrop, setSquadToDrop] = useState<string | null>(null);

  // Normalize active user name for clean comparison (DO NOT default to 'DAD'!)
  const normalizedActive = (activeUserName || '').trim().toUpperCase();

  // Ensure current active user is included in the list of squads ONLY if non-empty
  const squadMap = new Map<string, { userName: string; isLocked?: boolean; starCount?: number; totalScore?: number }>();
  squads.forEach((s) => {
    const key = (s.userName || '').trim().toUpperCase();
    if (key) {
      squadMap.set(key, { ...s, userName: key });
    }
  });

  if (normalizedActive && !squadMap.has(normalizedActive)) {
    squadMap.set(normalizedActive, { userName: normalizedActive, isLocked: false, starCount: 0 });
  }

  const squadList = Array.from(squadMap.values());

  // Household gamification: find highest score in room
  const maxScore = Math.max(0, ...squadList.map((s) => s.totalScore ?? 0));

  const mobileCarouselRef = useRef<HTMLDivElement>(null);
  const desktopCarouselRef = useRef<HTMLDivElement>(null);
  const [mobileCanLeft, setMobileCanLeft] = useState(false);
  const [mobileCanRight, setMobileCanRight] = useState(false);
  const [desktopCanLeft, setDesktopCanLeft] = useState(false);
  const [desktopCanRight, setDesktopCanRight] = useState(false);

  const checkScroll = () => {
    if (mobileCarouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = mobileCarouselRef.current;
      setMobileCanLeft(scrollLeft > 6);
      setMobileCanRight(scrollLeft < scrollWidth - clientWidth - 6);
    }
    if (desktopCarouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = desktopCarouselRef.current;
      setDesktopCanLeft(scrollLeft > 6);
      setDesktopCanRight(scrollLeft < scrollWidth - clientWidth - 6);
    }
  };

  useEffect(() => {
    checkScroll();
    const mEl = mobileCarouselRef.current;
    const dEl = desktopCarouselRef.current;
    if (mEl) mEl.addEventListener('scroll', checkScroll, { passive: true });
    if (dEl) dEl.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      if (mEl) mEl.removeEventListener('scroll', checkScroll);
      if (dEl) dEl.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [squadList.length]);

  // Whenever the active squad changes or list updates, auto-scroll the active squad into full view
  useEffect(() => {
    const timer = setTimeout(() => {
      [mobileCarouselRef.current, desktopCarouselRef.current].forEach((el) => {
        if (!el) return;
        const activeEl = el.querySelector<HTMLElement>('[data-active="true"]');
        if (activeEl) {
          activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      });
      checkScroll();
    }, 60);
    return () => clearTimeout(timer);
  }, [normalizedActive, squadList.length]);

  const scrollToSquad = (direction: 'left' | 'right', el: HTMLDivElement | null) => {
    if (!el) return;
    const items = Array.from(el.querySelectorAll<HTMLElement>('[data-squad-item="true"]'));
    if (items.length === 0) return;

    const currentScroll = el.scrollLeft;

    if (direction === 'right') {
      const nextItem = items.find((item) => item.offsetLeft > currentScroll + 15);
      if (nextItem) {
        nextItem.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      } else {
        el.scrollBy({ left: 160, behavior: 'smooth' });
      }
    } else {
      const prevItems = items.filter((item) => item.offsetLeft < currentScroll - 15);
      const prevItem = prevItems[prevItems.length - 1];
      if (prevItem) {
        prevItem.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      } else {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      }
    }
  };

  const handleStartAdd = () => {
    if (onOpenAddDrawer) onOpenAddDrawer();
    setInternalIsAdding(true);
    setNewSquadName('');
    setErrorMsg(null);
  };

  const handleCancelAdd = () => {
    if (onCloseAddDrawer) onCloseAddDrawer();
    setInternalIsAdding(false);
    setNewSquadName('');
    setErrorMsg(null);
  };

  const handleCommitNewSquad = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = newSquadName.trim().toUpperCase();
    if (!clean) {
      setErrorMsg('Please enter a squad name');
      return;
    }
    if (squadMap.has(clean)) {
      // If squad already exists, simply switch to it!
      onSelectSquad(clean);
      if (onCloseAddDrawer) onCloseAddDrawer();
      setInternalIsAdding(false);
      setNewSquadName('');
      return;
    }

    onCreateSquad(clean);
    if (onCloseAddDrawer) onCloseAddDrawer();
    setInternalIsAdding(false);
    setNewSquadName('');
    setErrorMsg(null);
  };

  const quickFamilySuggestions = ['DAD', 'MOM', 'LEO', 'VIOLET', 'KID 1', 'KID 2'];

  return (
    <>
      {/* Mobile Portrait Dedicated 2-Row Layout (< 640px) */}
      <div className="sm:hidden w-full bg-[#080d1a] border-b-2 border-[#1a264a] px-2.5 py-1.5 box-border">
        {/* Sub-row 1: Room button & +SQUAD button */}
        <div className="flex items-center justify-between gap-2 w-full mb-1.5">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onOpenRoomModal}
              className="touch-manipulation flex items-center gap-1 px-2 py-1 bg-[#15233d] active:bg-[#1f345b] border border-[#38bdf8]/60 text-[#fae5b8] rounded-xs font-pixel text-[10px] font-bold whitespace-nowrap active:scale-95 cursor-pointer shadow-xs"
              title="Click to switch room"
            >
              <span className="text-xs">🛋️</span>
              <span className="text-[#38bdf8] font-bold">ROOM:</span>
              <span className="text-[#f59e0b] font-bold tracking-wider">{roomCode}</span>
              <span className="text-[9px] text-[#93c5fd]">✏️</span>
            </button>
            <span className="font-pixel text-[10px] text-[#38bdf8] font-bold tracking-wide">
              SQUADS ({squadList.length})
            </span>
          </div>

          <button
            type="button"
            onClick={handleStartAdd}
            className="touch-manipulation flex items-center gap-1 px-3 py-1 font-pixel text-[10px] rounded-xs border-2 border-[#16a34a] bg-[#14532d] active:bg-[#16a34a] text-[#86efac] font-bold whitespace-nowrap active:scale-95 shadow-xs"
            title="Add family squad to this room"
          >
            <Plus size={12} strokeWidth={3} />
            <span>+SQUAD</span>
          </button>
        </div>

        {/* Sub-row 2: Full-width carousel with prominent, easy-to-tap left/right arrow buttons */}
        <div className="flex items-center gap-1 w-full">
          <button
            type="button"
            onClick={() => scrollToSquad('left', mobileCarouselRef.current)}
            className={`touch-manipulation shrink-0 w-9 h-9 flex items-center justify-center bg-[#15233d] active:bg-[#20365c] text-[#38bdf8] border-2 border-[#38bdf8]/70 rounded-xs font-pixel active:scale-95 cursor-pointer shadow-xs select-none ${
              !mobileCanLeft ? 'opacity-40' : 'opacity-100'
            }`}
            title="Previous squads"
            aria-label="Previous squads"
          >
            <ChevronLeft size={20} strokeWidth={3} />
          </button>

          <div
            ref={mobileCarouselRef}
            className="snap-x snap-mandatory flex-1 min-w-0 flex items-center gap-2 overflow-x-auto no-scrollbar touch-pan-x px-1 py-1 scroll-smooth"
          >
            {squadList.map((squad) => {
              const isActive = squad.userName === normalizedActive;
              const isLeader = maxScore > 0 && (squad.totalScore ?? 0) === maxScore;
              const scoreVal = squad.totalScore ?? 0;

              return (
                <button
                  key={squad.userName}
                  type="button"
                  data-squad-item="true"
                  data-active={isActive ? 'true' : undefined}
                  onClick={(e) => {
                    onSelectSquad(squad.userName);
                    e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                  }}
                  className={`snap-start touch-manipulation shrink-0 flex items-center gap-1.5 px-3 py-1.5 font-pixel text-xs rounded-xs border-2 transition-all cursor-pointer select-none whitespace-nowrap active:translate-y-0.5 ${
                    isActive
                      ? 'bg-[#155e9e] text-[#fae5b8] border-[#38bdf8] shadow-[0_2px_0_0_#051a30] font-bold ring-1 ring-[#38bdf8]/50'
                      : 'bg-[#1a2238] text-[#94a3b8] active:text-[#fae5b8] border-[#273552] active:border-[#38bdf8]/60 active:bg-[#232e4b]'
                  }`}
                >
                  {isLeader ? (
                    <span className="text-xs select-none">👑</span>
                  ) : isActive ? (
                    <span className="text-[#fde047]">★</span>
                  ) : null}
                  <span className="font-bold">{squad.userName}</span>
                  {squad.isLocked && <span className="text-[10px]" title="Locked">🔒</span>}
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-2xs shrink-0 ${
                      isActive
                        ? 'bg-[#0a2d52] text-[#fde047]'
                        : isLeader
                        ? 'bg-[#451a03] text-[#fde047]'
                        : 'bg-[#0f172a] text-[#94a3b8]'
                    }`}
                  >
                    {scoreVal}p
                  </span>
                  {isActive && !squad.isLocked && onDeleteSquad && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSquadToDrop(squad.userName);
                      }}
                      className="ml-1 w-4 h-4 flex items-center justify-center text-[#fae5b8]/70 hover:text-white hover:bg-red-600 rounded-2xs cursor-pointer active:scale-90"
                      title={`Drop squad ${squad.userName}`}
                    >
                      <X size={11} strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => scrollToSquad('right', mobileCarouselRef.current)}
            className={`touch-manipulation shrink-0 w-9 h-9 flex items-center justify-center bg-[#15233d] active:bg-[#20365c] text-[#38bdf8] border-2 border-[#38bdf8]/70 rounded-xs font-pixel active:scale-95 cursor-pointer shadow-xs select-none ${
              !mobileCanRight ? 'opacity-40' : 'opacity-100'
            }`}
            title="Next squads"
            aria-label="Next squads"
          >
            <ChevronRight size={20} strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* Tablet & Desktop Single-Row Header (>= 640px) */}
      <div className="hidden sm:block w-full bg-[#080d1a] border-b-2 border-[#1a264a] box-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 w-full py-1.5 box-border">
          <div className="flex items-center justify-between gap-2.5 flex-nowrap w-full">
            
            {/* Left: Interactive Room Code Button & SQUADS Label */}
            <div className="flex items-center gap-2 shrink-0 select-none">
              <button
                type="button"
                id="squad-switcher-room-button"
                onClick={onOpenRoomModal}
                className="touch-manipulation flex items-center gap-1.5 px-2.5 py-1 bg-[#15233d] hover:bg-[#1f345b] border border-[#38bdf8]/60 hover:border-[#38bdf8] text-[#fae5b8] rounded-xs font-pixel text-[10px] sm:text-xs font-bold whitespace-nowrap active:scale-95 cursor-pointer shadow-xs transition-all"
                title="Click to view and switch rooms"
              >
                <span className="text-xs">🛋️</span>
                <span className="text-[#38bdf8] font-bold">ROOM:</span>
                <span className="text-[#f59e0b] font-bold tracking-wider">{roomCode}</span>
                <span className="text-[9px] text-[#93c5fd]">✏️</span>
              </button>

              <span className="font-pixel text-xs text-[#38bdf8] whitespace-nowrap font-bold">
                SQUADS:
              </span>
            </div>

            {/* Center: Scrollable Squad Pills List with Visual Chevrons */}
            <div className="relative flex-1 min-w-0 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => scrollToSquad('left', desktopCarouselRef.current)}
                className={`touch-manipulation shrink-0 w-7 h-8 flex items-center justify-center bg-[#15233d] hover:bg-[#20365c] text-[#38bdf8] border border-[#38bdf8]/60 rounded-xs font-pixel active:scale-95 cursor-pointer shadow-xs z-10 select-none transition-all ${
                  !desktopCanLeft ? 'opacity-40' : 'opacity-100'
                }`}
                title="Scroll squads left"
                aria-label="Scroll squads left"
              >
                <ChevronLeft size={16} strokeWidth={3} />
              </button>

              <div
                ref={desktopCarouselRef}
                className="snap-x snap-mandatory flex-1 min-w-0 flex items-center gap-2 overflow-x-auto no-scrollbar touch-pan-x px-1 py-1 scroll-smooth"
              >
                {squadList.map((squad) => {
                  const isActive = squad.userName === normalizedActive;
                  const isLeader = maxScore > 0 && (squad.totalScore ?? 0) === maxScore;
                  const scoreVal = squad.totalScore ?? 0;

                  return (
                    <button
                      key={squad.userName}
                      type="button"
                      data-squad-item="true"
                      data-active={isActive ? 'true' : undefined}
                      onClick={(e) => {
                        onSelectSquad(squad.userName);
                        e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                      }}
                      className={`snap-start touch-manipulation shrink-0 flex items-center gap-1.5 px-3 py-1 font-pixel text-xs rounded-xs border-2 transition-all cursor-pointer select-none whitespace-nowrap active:translate-y-0.5 ${
                        isActive
                          ? 'bg-[#155e9e] text-[#fae5b8] border-[#38bdf8] shadow-[0_2px_0_0_#051a30] font-bold ring-1 ring-[#38bdf8]/50'
                          : 'bg-[#1a2238] text-[#94a3b8] hover:text-[#fae5b8] border-[#273552] hover:border-[#38bdf8]/60 hover:bg-[#232e4b]'
                      }`}
                      title={
                        isLeader
                          ? `👑 Household Leader! ${squad.userName} (${scoreVal} pts)`
                          : isActive
                          ? `Currently editing ${squad.userName}'s squad`
                          : `Switch to ${squad.userName}'s squad`
                      }
                    >
                      {isLeader ? (
                        <span className="text-xs select-none">👑</span>
                      ) : isActive ? (
                        <span className="text-[#fde047]">★</span>
                      ) : null}

                      <span className="font-bold">{squad.userName}</span>

                      {squad.isLocked && (
                        <span className="text-[10px]" title="Picks Locked">
                          🔒
                        </span>
                      )}

                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded-2xs shrink-0 ${
                          isActive
                            ? 'bg-[#0a2d52] text-[#fde047]'
                            : isLeader
                            ? 'bg-[#451a03] text-[#fde047]'
                            : 'bg-[#0f172a] text-[#94a3b8]'
                        }`}
                      >
                        {scoreVal}p
                      </span>

                      {isActive && !squad.isLocked && onDeleteSquad && (
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSquadToDrop(squad.userName);
                          }}
                          className="ml-0.5 w-3.5 h-3.5 flex items-center justify-center text-[#fae5b8]/70 hover:text-white hover:bg-red-600 rounded-2xs cursor-pointer active:scale-90 transition-colors"
                          title={`Drop squad ${squad.userName} from room`}
                        >
                          <X size={10} strokeWidth={3} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => scrollToSquad('right', desktopCarouselRef.current)}
                className={`touch-manipulation shrink-0 w-7 h-8 flex items-center justify-center bg-[#15233d] hover:bg-[#20365c] text-[#38bdf8] border border-[#38bdf8]/60 rounded-xs font-pixel active:scale-95 cursor-pointer shadow-xs z-10 select-none transition-all ${
                  !desktopCanRight ? 'opacity-40' : 'opacity-100'
                }`}
                title="Scroll squads right"
                aria-label="Scroll squads right"
              >
                <ChevronRight size={16} strokeWidth={3} />
              </button>
            </div>

            {/* Right Side: Pinned [+SQUAD] button & ● LIVE SYNC status dot */}
            <div className="flex items-center gap-2 shrink-0 select-none pl-1">
              <button
                type="button"
                id="squad-switcher-add-btn"
                onClick={handleStartAdd}
                className="touch-manipulation shrink-0 flex items-center gap-1 px-2.5 sm:px-3 py-1 font-pixel text-xs rounded-xs border-2 border-[#16a34a] bg-[#14532d] hover:bg-[#16a34a] text-[#86efac] hover:text-white transition-all cursor-pointer select-none whitespace-nowrap active:translate-y-0.5 shadow-xs font-bold"
                title="Add family squad to this room"
              >
                <Plus size={12} strokeWidth={3} />
                <span>+SQUAD</span>
              </button>

              <div className="flex items-center gap-1.5 font-pixel text-[10px] text-[#22c55e] whitespace-nowrap select-none">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse"></span>
                <span className="hidden xs:inline sm:inline tracking-wider font-bold">LIVE SYNC</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Squad Drawer (Responsive: bottom sheet on mobile, centered modal dialog on desktop) */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0"
            onClick={handleCancelAdd}
          />
          
          <div className="relative z-10 w-full sm:max-w-md p-4 sm:p-5 bg-[#0d1527] border-t-2 sm:border-2 border-[#38bdf8]/70 shadow-[0_-8px_20px_rgba(0,0,0,0.8)] sm:shadow-[0_12px_40px_rgba(0,0,0,0.9)] rounded-t-lg sm:rounded-md animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 box-border">
            <div className="max-w-md mx-auto w-full">
              <form onSubmit={handleCommitNewSquad}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-pixel text-[11px] sm:text-xs text-[#38bdf8] font-bold tracking-wider">
                    NEW FAMILY SQUAD
                  </span>
                  <span className="font-pixel text-[9px] text-[#94a3b8]">
                    ROOM: {roomCode}
                  </span>
                </div>

                <input
                  id="new-squad-name-input"
                  type="text"
                  autoFocus
                  value={newSquadName}
                  onChange={(e) => {
                    setNewSquadName(e.target.value.toUpperCase());
                    setErrorMsg(null);
                  }}
                  placeholder="e.g. MOM or LEO"
                  maxLength={14}
                  className="bg-[#1a2238] border-2 border-[#38bdf8] text-[#fae5b8] font-pixel text-xs px-3 py-2 rounded-xs focus:outline-none w-full uppercase placeholder:text-gray-500 mb-2 box-border"
                />

                {/* Quick family names row */}
                <div className="flex overflow-x-auto whitespace-nowrap gap-1.5 py-1 no-scrollbar mb-2 touch-pan-x">
                  <span className="font-pixel text-[9px] text-[#64748b] self-center shrink-0">QUICK:</span>
                  {quickFamilySuggestions.map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setNewSquadName(sug)}
                      className="touch-manipulation font-pixel text-[9px] px-2 py-1 bg-[#1a2238] hover:bg-[#232e4b] text-[#94a3b8] hover:text-[#fae5b8] border border-[#273552] rounded-2xs cursor-pointer shrink-0 whitespace-nowrap"
                    >
                      {sug}
                    </button>
                  ))}
                </div>

                {/* Action Buttons: 2-column grid */}
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button
                    type="button"
                    onClick={handleCancelAdd}
                    className="touch-manipulation py-2 bg-[#334155] hover:bg-[#475569] text-white border border-[#1e293b] font-pixel text-xs rounded-xs cursor-pointer active:translate-y-0.5 text-center"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    className="touch-manipulation py-2 bg-[#16a34a] hover:bg-[#22c55e] text-white border border-[#14532d] font-pixel text-xs rounded-xs cursor-pointer shadow-sm active:translate-y-0.5 font-bold flex items-center justify-center gap-1.5 text-center whitespace-nowrap"
                  >
                    <Check size={14} strokeWidth={3} />
                    <span>CREATE SQUAD</span>
                  </button>
                </div>
              </form>

              {errorMsg && (
                <div className="mt-2 flex items-center gap-1.5 text-[#f87171] font-retro text-xs">
                  <ShieldAlert size={14} />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Squad Confirmation Modal */}
      {squadToDrop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xs">
          <div className="pixel-box-cream p-4 sm:p-5 max-w-sm w-full border-4 border-[#1a2238] shadow-[0_6px_0_0_#0a0f1d] rounded-xs text-center">
            <div className="font-pixel text-xs sm:text-sm text-[#991b1b] mb-2 font-bold flex items-center justify-center gap-2">
              <span className="text-base">⚠️</span>
              <span>DELETE SQUAD?</span>
            </div>
            <p className="font-retro text-xs sm:text-sm text-[#5c3509] mb-4 leading-relaxed">
              Remove <strong className="font-pixel text-[#12579b]">{squadToDrop}</strong> from room <strong className="font-pixel text-[#f59e0b]">{roomCode}</strong>? All picks will be lost.
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setSquadToDrop(null)}
                className="touch-manipulation py-2 px-3 bg-[#475569] hover:bg-[#64748b] text-white font-pixel text-[11px] rounded-xs cursor-pointer active:translate-y-0.5 font-bold"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = squadToDrop;
                  setSquadToDrop(null);
                  onDeleteSquad?.(target);
                }}
                className="touch-manipulation py-2 px-3 bg-[#dc2626] hover:bg-[#b91c1c] text-white font-pixel text-[11px] rounded-xs cursor-pointer font-bold active:translate-y-0.5 border border-[#7f1d1d] shadow-xs flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <span>🗑️</span>
                <span>DELETE SQUAD</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
