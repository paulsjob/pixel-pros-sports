import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';

interface RoomSetupBarProps {
  userName: string;
  roomCode: string;
  onCommitUserName: (name: string) => void;
  onCommitRoomCode: (code: string) => void;
  memberCount?: number;
}

export const RoomSetupBar: React.FC<RoomSetupBarProps> = ({
  userName,
  roomCode,
  onCommitUserName,
  onCommitRoomCode,
  memberCount,
}) => {
  // Local state prevents keystroke Supabase network spam
  const [localName, setLocalName] = useState(userName);
  const [localRoom, setLocalRoom] = useState(roomCode);

  useEffect(() => {
    setLocalName(userName);
  }, [userName]);

  useEffect(() => {
    setLocalRoom(roomCode);
  }, [roomCode]);

  const handleNameBlurOrEnter = () => {
    const trimmed = localName.trim();
    if (trimmed && trimmed !== userName) {
      onCommitUserName(trimmed);
    } else if (!trimmed) {
      setLocalName(userName); // revert if empty
    }
  };

  const handleRoomBlurOrEnter = () => {
    const clean = (localRoom || 'COUCH').trim().toUpperCase();
    if (clean) {
      setLocalRoom(clean);
      onCommitRoomCode(clean);
    } else {
      setLocalRoom(roomCode); // revert if empty
    }
  };

  return (
    <div className="w-full bg-[#080d1a] border-3 border-[#1a264a] shadow-[0_4px_0_0_#050811] p-2 sm:p-2.5 mb-3 sm:mb-4 rounded-xs box-border">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3">
        
        {/* Inputs: NAME and ROOM */}
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto flex-wrap sm:flex-nowrap">
          {/* NAME INPUT */}
          <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
            <label htmlFor="user-name-input" className="font-pixel text-[10px] sm:text-xs text-[#38bdf8] whitespace-nowrap">
              NAME:
            </label>
            <div className="flex items-center gap-1 w-full sm:w-auto">
              <input
                id="user-name-input"
                type="text"
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                onBlur={handleNameBlurOrEnter}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    (e.target as HTMLInputElement).blur();
                  }
                }}
                placeholder="e.g. Dad"
                maxLength={14}
                className="bg-[#1a2238] border-2 border-[#273552] text-[#fae5b8] font-pixel text-[11px] sm:text-xs px-2 py-1 rounded-2xs focus:border-[#38bdf8] focus:outline-none w-full sm:w-28 uppercase"
              />
              {localName.trim() && localName.trim() !== userName && (
                <button
                  type="button"
                  onClick={handleNameBlurOrEnter}
                  className="touch-manipulation px-2 py-1 bg-[#16a34a] hover:bg-[#22c55e] text-white border border-[#14532d] font-pixel text-[10px] rounded-2xs cursor-pointer shadow-xs active:translate-y-0.5 shrink-0"
                  title="Save Name"
                >
                  SET
                </button>
              )}
            </div>
          </div>

          {/* ROOM INPUT */}
          <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
            <label htmlFor="room-code-input" className="font-pixel text-[10px] sm:text-xs text-[#f59e0b] whitespace-nowrap">
              ROOM:
            </label>
            <div className="flex items-center gap-1 w-full sm:w-auto">
              <input
                id="room-code-input"
                type="text"
                value={localRoom}
                onChange={(e) => setLocalRoom(e.target.value.toUpperCase())}
                onBlur={handleRoomBlurOrEnter}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    (e.target as HTMLInputElement).blur();
                  }
                }}
                placeholder="COUCH"
                maxLength={12}
                className="bg-[#1a2238] border-2 border-[#273552] text-[#fae5b8] font-pixel text-[11px] sm:text-xs px-2 py-1 rounded-2xs focus:border-[#f59e0b] focus:outline-none w-full sm:w-28 uppercase"
              />
              {localRoom.trim() && localRoom.trim().toUpperCase() !== roomCode && (
                <button
                  type="button"
                  onClick={handleRoomBlurOrEnter}
                  className="touch-manipulation px-2 py-1 bg-[#f59e0b] hover:bg-[#fbbf24] text-[#451a03] border border-[#b45309] font-pixel text-[10px] rounded-2xs cursor-pointer shadow-xs active:translate-y-0.5 shrink-0 font-bold"
                  title="Join Room"
                >
                  JOIN
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Live Multi-Device Sync Indicator */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end text-[10px] font-pixel">
          {memberCount !== undefined && (
            <div className="flex items-center gap-1 text-[#93c5fd] font-retro text-xs">
              <Users size={13} className="text-[#38bdf8]" />
              <span>{memberCount} ON COUCH</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 px-2 py-1 bg-[#12579b]/40 border border-[#12579b] text-[#38bdf8] rounded-2xs whitespace-nowrap">
            <span className="inline-block w-2 h-2 rounded-full bg-[#22c55e] animate-pulse"></span>
            <span className="text-[9px] sm:text-[10px]">LIVE SYNC</span>
          </div>
        </div>

      </div>
    </div>
  );
};
