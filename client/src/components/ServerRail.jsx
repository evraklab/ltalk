import React from 'react';
import { Plus, Users, Radio, Bell } from 'lucide-react';

export default function ServerRail({
  servers = [],
  activeServerId,
  isFriendsViewActive,
  pendingInvitesCount = 0,
  pendingFriendRequestsCount = 0,
  onSelectServer,
  onOpenFriendsView,
  onOpenCreateServer
}) {
  const totalNotifications = pendingInvitesCount + pendingFriendRequestsCount;

  return (
    <div className="w-[72px] bg-[#0B0D13] flex flex-col items-center py-3 gap-2.5 shrink-0 select-none border-r border-[#1C202F] overflow-y-auto">
      {/* 1. HOME / FRIENDS HUB ICON */}
      <div className="relative group cursor-pointer" onClick={onOpenFriendsView}>
        {/* Active Pill indicator on left edge */}
        {isFriendsViewActive && (
          <div className="absolute -left-3 top-2.5 w-1.5 h-8 bg-white rounded-r-md transition-all" />
        )}

        <div
          className={`w-12 h-12 rounded-[22px] group-hover:rounded-[14px] flex items-center justify-center transition-all duration-300 shadow-lg ${
            isFriendsViewActive
              ? 'bg-[#6366F1] text-white shadow-[#6366F1]/30 rounded-[14px]'
              : 'bg-[#181B26] border border-[#2D3348] text-[#A5B4FC] hover:bg-[#6366F1] hover:text-white hover:border-[#6366F1]'
          }`}
        >
          <Users className="w-5 h-5" />
        </div>

        {/* Notification Badge */}
        {totalNotifications > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#EF4444] text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#0B0D13] shadow-md animate-pulse">
            {totalNotifications}
          </span>
        )}

        {/* Tooltip */}
        <div className="absolute left-[80px] top-2 bg-[#181B26] border border-[#2D3348] text-white text-xs font-bold px-2.5 py-1.5 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
          Arkadaşlar & İstekler
        </div>
      </div>

      <div className="w-8 h-[2px] bg-[#232736] rounded-full my-0.5" />

      {/* 2. JOINED SERVERS LIST */}
      <div className="flex flex-col gap-2.5 w-full items-center">
        {servers.map((server) => {
          const isActive = !isFriendsViewActive && activeServerId === server.id;
          return (
            <div
              key={server.id}
              className="relative group cursor-pointer"
              onClick={() => onSelectServer(server.id)}
            >
              {/* Active Indicator on left */}
              {isActive ? (
                <div className="absolute -left-3 top-2.5 w-1.5 h-8 bg-white rounded-r-md transition-all" />
              ) : (
                <div className="absolute -left-3 top-4 w-1.5 h-2 bg-white rounded-r-md transition-all opacity-0 group-hover:opacity-100" />
              )}

              <div
                className={`w-12 h-12 rounded-[22px] group-hover:rounded-[14px] flex items-center justify-center font-black text-sm tracking-wider transition-all duration-300 shadow-md ${
                  isActive
                    ? 'bg-linear-to-br from-[#6366F1] via-[#8B5CF6] to-[#06B6D4] text-white rounded-[14px] shadow-[#6366F1]/30'
                    : 'bg-[#181B26] border border-[#2D3348] text-[#A5B4FC] hover:border-[#6366F1] hover:text-white hover:bg-[#202433]'
                }`}
              >
                {server.icon || server.name.substring(0, 2).toUpperCase()}
              </div>

              {/* Tooltip with server name */}
              <div className="absolute left-[80px] top-2.5 bg-[#181B26] border border-[#2D3348] text-white text-xs font-bold px-2.5 py-1.5 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                {server.name}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. ADD / CREATE NEW SERVER BUTTON */}
      <div className="relative group cursor-pointer mt-1" onClick={onOpenCreateServer}>
        <div className="w-12 h-12 rounded-[22px] group-hover:rounded-[14px] bg-[#181B26] border border-[#2D3348] hover:bg-[#10B981] hover:border-[#10B981] text-[#10B981] hover:text-white flex items-center justify-center transition-all duration-300">
          <Plus className="w-6 h-6" />
        </div>
        <div className="absolute left-[80px] top-2.5 bg-[#181B26] border border-[#2D3348] text-white text-xs font-bold px-2.5 py-1.5 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
          Yeni Sunucu Oluştur
        </div>
      </div>
    </div>
  );
}
