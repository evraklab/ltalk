import React from 'react';
import { Volume2, Monitor, MicOff } from 'lucide-react';

export default function MemberList({ users = [], currentUser }) {
  return (
    <div className="w-60 bg-[#2b2d31] hidden lg:flex flex-col h-full border-l border-[#1f2023] shrink-0 select-none p-3 overflow-y-auto">
      <div className="text-[11px] font-bold text-[#949ba4] uppercase tracking-wider px-2 mb-2">
        Çevrim İçi — {users.length}
      </div>

      <div className="space-y-1">
        {users.map((user) => {
          const isCurrent = user.id === currentUser?.id;
          return (
            <div
              key={user.id}
              className="flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-[#35373c] transition-colors group cursor-pointer"
            >
              <div className="relative shrink-0">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-full bg-[#1e1f22] object-cover"
                />
                {/* Online status indicator */}
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#23a55a] rounded-full border-2 border-[#2b2d31]" />
              </div>

              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className="text-sm font-semibold truncate"
                    style={{ color: user.color || '#dbdee1' }}
                  >
                    {user.name} {isCurrent ? '(Sen)' : ''}
                  </span>
                </div>
                {user.currentVoiceChannel && (
                  <span className="text-[10px] text-[#23a55a] flex items-center gap-1">
                    <Volume2 className="w-3 h-3 shrink-0" />
                    Seste
                  </span>
                )}
              </div>

              {/* Badges */}
              <div className="flex items-center gap-1 shrink-0 text-[#949ba4]">
                {user.isScreenSharing && (
                  <span title="Ekran Paylaşıyor" className="text-[#5865F2]">
                    <Monitor className="w-3.5 h-3.5" />
                  </span>
                )}
                {user.isMuted && (
                  <span title="Susturuldu" className="text-[#f23f43]">
                    <MicOff className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

