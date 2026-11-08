import React from 'react';
import { Mic, MicOff, Headphones, Settings, VolumeX, LogOut, Crown } from 'lucide-react';

export default function UserBar({
  currentUser,
  isMuted,
  isDeafened,
  onToggleMute,
  onToggleDeafen,
  onOpenSettings,
  onOpenAdminPanel,
  onLogout
}) {
  const isAdmin = currentUser?.isAdmin || currentUser?.username?.toLowerCase() === 'fitoz';
  return (
    <div className="h-14 bg-[#0B0D13] px-2.5 py-1.5 flex items-center justify-between border-t border-[#1C202F] shrink-0">
      {/* User Info (Click opens settings) */}
      <button
        onClick={onOpenSettings}
        className="flex items-center gap-2 p-1 -ml-1 rounded-xl hover:bg-[#181B26] transition-colors text-left flex-1 min-w-0 mr-1 group cursor-pointer"
        title="Kullanıcı Ayarları"
      >
        <div className="relative shrink-0">
          <img
            src={currentUser?.avatar || 'https://api.dicebear.com/7.x/adventurer/svg?seed=Me'}
            alt="User Avatar"
            className="w-8 h-8 rounded-full bg-[#181B26] object-cover"
          />
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#10B981] rounded-full border-2 border-[#0B0D13]" />
        </div>
        <div className="flex flex-col min-w-0">
          <div className="flex items-baseline gap-1 truncate">
            <span className="text-xs font-bold text-white truncate group-hover:underline">
              {currentUser?.displayName || currentUser?.name || 'Ben'}
            </span>
          </div>
          <span className="text-[10px] text-[#A5B4FC] font-semibold truncate">
            #{currentUser?.tag || '0000'}
          </span>
        </div>
      </button>

      {/* Control Actions (Mic, Deafen, Settings, Logout) */}
      <div className="flex items-center gap-0.5 text-[#949ba4]">
        {/* Mute Mic */}
        <button
          onClick={onToggleMute}
          title={isMuted ? 'Mikrofonun Sesini Aç' : 'Mikrofonu Kapat'}
          className={`p-1.5 rounded-lg hover:bg-[#181B26] transition-colors cursor-pointer ${
            isMuted ? 'text-[#EF4444] bg-[#EF4444]/15' : 'hover:text-white'
          }`}
        >
          {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        {/* Deafen */}
        <button
          onClick={onToggleDeafen}
          title={isDeafened ? 'Kulaklığı Aç' : 'Sağırlaştır'}
          className={`p-1.5 rounded-lg hover:bg-[#181B26] transition-colors cursor-pointer ${
            isDeafened ? 'text-[#EF4444] bg-[#EF4444]/15' : 'hover:text-white'
          }`}
        >
          {isDeafened ? <VolumeX className="w-4 h-4" /> : <Headphones className="w-4 h-4" />}
        </button>

        {/* Admin Crown Button */}
        {isAdmin && (
          <button
            onClick={onOpenAdminPanel}
            title="Yönetici Paneli (Fitoz)"
            className="p-1.5 rounded-lg bg-[#F59E0B]/20 hover:bg-[#F59E0B] text-[#F59E0B] hover:text-black transition-all cursor-pointer shadow-sm animate-pulse"
          >
            <Crown className="w-4 h-4" />
          </button>
        )}

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          title="Ayarlar"
          className="p-1.5 rounded-lg hover:bg-[#181B26] hover:text-white transition-colors cursor-pointer"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Logout */}
        {onLogout && (
          <button
            onClick={onLogout}
            title="Çıkış Yap"
            className="p-1.5 rounded-lg hover:bg-[#EF4444]/20 hover:text-[#EF4444] text-[#949ba4] transition-colors cursor-pointer ml-0.5"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
