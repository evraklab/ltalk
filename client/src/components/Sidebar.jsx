import React, { useState } from 'react';
import {
  Hash,
  Volume2,
  PhoneOff,
  Radio,
  Monitor,
  MicOff,
  UserPlus,
  Plus,
  ChevronDown,
  Sparkles,
  Check,
  X
} from 'lucide-react';
import UserBar from './UserBar';

export default function Sidebar({
  server,
  channels = [],
  activeTextChannel,
  activeVoiceChannel,
  voiceRooms = {},
  currentUser,
  invites = [],
  isMuted,
  isDeafened,
  onSelectTextChannel,
  onJoinVoiceChannel,
  onLeaveVoiceChannel,
  onToggleMute,
  onToggleDeafen,
  onOpenSettings,
  onOpenInviteModal,
  onOpenCreateChannel,
  onOpenAdminPanel,
  onRespondInvite,
  onLogout
}) {
  const [showServerMenu, setShowServerMenu] = useState(false);

  const textChannels = channels.filter(c => c.type === 'text');
  const voiceChannels = channels.filter(c => c.type === 'voice');
  const currentVoiceObj = channels.find(c => c.id === activeVoiceChannel);

  return (
    <div className="w-60 bg-[#11131B] flex flex-col h-full border-r border-[#1C202F] shrink-0 select-none">
      {/* Server Header with Dropdown */}
      <div className="relative">
        <div
          onClick={() => setShowServerMenu(!showServerMenu)}
          className="h-12 border-b border-[#1C202F] px-4 flex items-center justify-between font-bold text-white shadow-xs bg-[#11131B] hover:bg-[#181B26] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2 truncate">
            <span className="w-2.5 h-2.5 bg-[#6366F1] rounded-full inline-block" />
            <span className="truncate tracking-wide font-extrabold text-sm">{server?.name || 'Itown Space'}</span>
          </div>
          <ChevronDown className={`w-4 h-4 text-[#949ba4] transition-transform ${showServerMenu ? 'rotate-180 text-white' : ''}`} />
        </div>

        {/* Server Dropdown Menu */}
        {showServerMenu && (
          <div className="absolute top-13 left-2 right-2 bg-[#181B26] p-2 rounded-2xl border border-[#2D3348] shadow-2xl z-30 space-y-1 animate-in fade-in duration-150">
            <button
              onClick={() => { setShowServerMenu(false); onOpenInviteModal?.(); }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[#A5B4FC] hover:bg-[#6366F1] hover:text-white transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Arkadaşlarını Davet Et</span>
            </button>
            <button
              onClick={() => { setShowServerMenu(false); onOpenCreateChannel?.('text'); }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[#dbdee1] hover:bg-[#232736] hover:text-white transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Kanal Oluştur</span>
            </button>
          </div>
        )}
      </div>

      {/* Pending Server Invites Banner */}
      {invites.length > 0 && (
        <div className="p-2 bg-[#6366F1]/10 border-b border-[#6366F1]/20">
          <div className="text-[10px] font-bold text-[#A5B4FC] uppercase tracking-wider mb-1.5 px-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#6366F1]" /> Gelen Sunucu Daveti ({invites.length})
          </div>
          <div className="space-y-1.5">
            {invites.map((inv) => (
              <div key={inv.id} className="p-2 bg-[#181B26] rounded-xl border border-[#2D3348] text-xs">
                <div className="text-white font-bold truncate">{inv.serverName}</div>
                <div className="text-[10px] text-[#949ba4] truncate mb-1.5">{inv.senderName} davet etti</div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => onRespondInvite(inv.id, 'accept')}
                    className="flex-1 py-1 bg-[#10B981] hover:bg-[#059669] text-white text-[10px] font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    Katıl
                  </button>
                  <button
                    onClick={() => onRespondInvite(inv.id, 'decline')}
                    className="py-1 px-2 bg-[#2D3348] hover:bg-[#EF4444] text-[#949ba4] hover:text-white text-[10px] rounded-lg transition-colors cursor-pointer"
                  >
                    Reddet
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Channels List (Scrollable) */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {/* TEXT CHANNELS */}
        <div>
          <div className="flex items-center justify-between text-[11px] font-bold text-[#949ba4] uppercase tracking-wider px-2 mb-1 group">
            <span>Metin Kanalları</span>
            <button
              onClick={() => onOpenCreateChannel?.('text')}
              title="Metin Kanalı Ekle"
              className="text-[#949ba4] hover:text-white transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-0.5">
            {textChannels.map((channel) => {
              const isActive = activeTextChannel === channel.id;
              return (
                <button
                  key={channel.id}
                  onClick={() => onSelectTextChannel(channel.id)}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#232736] text-white'
                      : 'text-[#949ba4] hover:bg-[#181B26] hover:text-[#dbdee1]'
                  }`}
                >
                  <Hash className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#6366F1]' : 'text-[#80848e]'}`} />
                  <span className="truncate">{channel.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* VOICE CHANNELS */}
        <div>
          <div className="flex items-center justify-between text-[11px] font-bold text-[#949ba4] uppercase tracking-wider px-2 mb-1 group">
            <span>Ses Kanalları</span>
            <button
              onClick={() => onOpenCreateChannel?.('voice')}
              title="Ses Kanalı Ekle"
              className="text-[#949ba4] hover:text-white transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1">
            {voiceChannels.map((channel) => {
              const isUserInThisVoice = activeVoiceChannel === channel.id;
              const participants = voiceRooms[channel.id] || [];

              return (
                <div key={channel.id} className="space-y-0.5">
                  <button
                    onClick={() => onJoinVoiceChannel(channel.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                      isUserInThisVoice
                        ? 'bg-[#181B26] text-[#10B981]'
                        : 'text-[#949ba4] hover:bg-[#181B26] hover:text-[#dbdee1]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Volume2 className={`w-4 h-4 shrink-0 ${isUserInThisVoice ? 'text-[#10B981]' : 'text-[#80848e]'}`} />
                      <span className="truncate font-semibold">{channel.name}</span>
                    </div>
                    {participants.length > 0 && (
                      <span className="text-[10px] bg-[#181B26] text-[#A5B4FC] px-1.5 py-0.5 rounded-full font-bold border border-[#2D3348]">
                        {participants.length}
                      </span>
                    )}
                  </button>

                  {/* List of members inside this voice channel */}
                  {participants.length > 0 && (
                    <div className="pl-6 pr-1 space-y-1 py-0.5">
                      {participants.map((user) => {
                        const isSpeaking = user.isSpeaking;
                        return (
                          <div
                            key={user.id}
                            className="flex items-center justify-between py-1 px-1.5 rounded-md hover:bg-[#181B26] text-xs text-[#dbdee1] transition-all"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <img
                                src={user.avatar}
                                alt={user.name}
                                className={`w-5 h-5 rounded-full object-cover transition-all ${
                                  isSpeaking ? 'ring-2 ring-[#10B981] scale-105' : ''
                                }`}
                              />
                              <span className={`truncate font-medium ${isSpeaking ? 'text-[#10B981]' : ''}`}>
                                {user.displayName || user.name} {user.id === currentUser?.id ? '(Sen)' : ''}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 shrink-0 text-[#949ba4]">
                              {user.isScreenSharing && (
                                <span title="Ekran Paylaşıyor" className="text-[#6366F1]">
                                  <Monitor className="w-3.5 h-3.5" />
                                </span>
                              )}
                              {user.isMuted && (
                                <span title="Susturuldu" className="text-[#EF4444]">
                                  <MicOff className="w-3.5 h-3.5" />
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Active Voice Connection Status Banner */}
      {activeVoiceChannel && (
        <div className="bg-[#0B0D13] px-3 py-2 border-t border-[#1C202F] flex items-center justify-between">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#10B981]">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>Ses Bağlandı</span>
            </div>
            <span className="text-[11px] text-[#949ba4] truncate font-medium">
              {currentVoiceObj?.name || 'Ses Kanalı'}
            </span>
          </div>
          <button
            onClick={onLeaveVoiceChannel}
            title="Bağlantıyı Kes"
            className="p-1.5 bg-[#EF4444]/15 hover:bg-[#EF4444] text-[#EF4444] hover:text-white rounded-md transition-colors cursor-pointer"
          >
            <PhoneOff className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bottom User Bar */}
      <UserBar
        currentUser={currentUser}
        isMuted={isMuted}
        isDeafened={isDeafened}
        onToggleMute={onToggleMute}
        onToggleDeafen={onToggleDeafen}
        onOpenSettings={onOpenSettings}
        onOpenAdminPanel={onOpenAdminPanel}
        onLogout={onLogout}
      />
    </div>
  );
}
