import React, { useState } from 'react';
import { X, Share2, Check, Users } from 'lucide-react';

export default function InviteFriendModal({
  isOpen,
  onClose,
  servers = [],
  activeServerId,
  friends = [],
  preselectedFriend,
  onSendInvite
}) {
  if (!isOpen) return null;

  const [selectedServerId, setSelectedServerId] = useState(activeServerId || servers[0]?.id);
  const [invitedMap, setInvitedMap] = useState({});

  const targetServer = servers.find(s => s.id === selectedServerId) || servers[0];

  const handleInvite = (friendId) => {
    if (!targetServer) return;
    onSendInvite({ serverId: targetServer.id, targetUserId: friendId }, (res) => {
      if (res?.success) {
        setInvitedMap(prev => ({ ...prev, [friendId]: true }));
      } else if (res?.error) {
        alert(res.error);
      }
    });
  };

  // If friend was preselected (clicked from FriendsView)
  const friendList = preselectedFriend ? [preselectedFriend] : friends;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-[#181B26] text-[#dbdee1] w-full max-w-md rounded-3xl shadow-2xl border border-[#2D3348] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-[#232736] flex items-center justify-between bg-[#11131B]">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-[#6366F1]" />
            <h2 className="text-lg font-bold text-white tracking-wide">Sunucuya Arkadaş Davet Et</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#949ba4] hover:text-white hover:bg-[#232736] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Server Selector if multiple servers exist */}
          {servers.length > 1 && (
            <div>
              <label className="block text-[11px] font-bold text-[#b5bac1] uppercase tracking-wider mb-1.5">
                Davet Edilecek Sunucu
              </label>
              <select
                value={selectedServerId}
                onChange={(e) => setSelectedServerId(e.target.value)}
                className="w-full bg-[#11131B] text-white border border-[#2D3348] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#6366F1]"
              >
                {servers.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-[#b5bac1] uppercase tracking-wider mb-2">
              Arkadaş Listeniz ({friendList.length})
            </label>

            {friendList.length === 0 ? (
              <div className="text-center py-8 text-[#949ba4] text-xs">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#6366F1]" />
                Henüz arkadaş listenizde kimse yok. Önce "Arkadaşlar" sayfasından arkadaşlarınızı ekleyin.
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {friendList.map(f => {
                  const isInvited = invitedMap[f.id];
                  const isAlreadyMember = targetServer?.members?.includes(f.id);

                  return (
                    <div
                      key={f.id}
                      className="flex items-center justify-between p-2.5 bg-[#11131B] rounded-xl border border-[#232736]"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img src={f.avatar} alt={f.displayName} className="w-8 h-8 rounded-full object-cover" />
                        <div className="truncate">
                          <div className="text-xs font-bold text-white truncate">{f.displayName}</div>
                          <div className="text-[10px] text-[#949ba4]">#{f.tag}</div>
                        </div>
                      </div>

                      {isAlreadyMember ? (
                        <span className="text-[11px] text-[#10B981] font-semibold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Üye
                        </span>
                      ) : isInvited ? (
                        <span className="text-[11px] text-[#6366F1] font-semibold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Gönderildi
                        </span>
                      ) : (
                        <button
                          onClick={() => handleInvite(f.id)}
                          className="px-3 py-1.5 bg-[#6366F1] hover:bg-[#4F46E5] text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                        >
                          Davet Et
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

