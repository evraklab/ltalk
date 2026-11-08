import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Check,
  X,
  Radio,
  Share2,
  Volume2,
  Clock,
  Sparkles,
  Search
} from 'lucide-react';

export default function FriendsView({
  currentUser,
  friends = [],
  friendRequests = [],
  servers = [],
  onSendFriendRequest,
  onRespondFriendRequest,
  onOpenInviteModal
}) {
  const [activeTab, setActiveTab] = useState('online'); // 'online' | 'all' | 'pending' | 'add'
  const [targetQuery, setTargetQuery] = useState('');
  const [statusMsg, setStatusMsg] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');

  const onlineFriends = friends.filter(f => f.isOnline);
  const pendingCount = friendRequests.length;

  const handleSend = (e) => {
    e.preventDefault();
    if (!targetQuery.trim()) return;

    onSendFriendRequest(targetQuery.trim(), (res) => {
      if (res.error) {
        setStatusMsg({ type: 'error', text: res.error });
      } else {
        setStatusMsg({ type: 'success', text: res.message || 'İstek gönderildi!' });
        setTargetQuery('');
      }
      setTimeout(() => setStatusMsg(null), 4000);
    });
  };

  const displayedFriends = (activeTab === 'online' ? onlineFriends : friends).filter(f =>
    f.displayName?.toLowerCase().includes(searchFilter.toLowerCase()) ||
    f.username?.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col bg-[#0F1117] h-full overflow-hidden">
      {/* Top Navigation Bar */}
      <div className="h-12 border-b border-[#1C202F] px-4 flex items-center justify-between shadow-xs bg-[#11131B] shrink-0">
        <div className="flex items-center gap-4 overflow-x-auto">
          <div className="flex items-center gap-2 text-white font-bold text-sm shrink-0 pr-2 border-r border-[#232736]">
            <Users className="w-5 h-5 text-[#6366F1]" />
            <span>Arkadaşlar</span>
          </div>

          <div className="flex items-center gap-1 shrink-0 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('online')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'online'
                  ? 'bg-[#181B26] text-white shadow-xs'
                  : 'text-[#949ba4] hover:bg-[#181B26]/50 hover:text-[#dbdee1]'
              }`}
            >
              Çevrim İçi ({onlineFriends.length})
            </button>

            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-[#181B26] text-white shadow-xs'
                  : 'text-[#949ba4] hover:bg-[#181B26]/50 hover:text-[#dbdee1]'
              }`}
            >
              Tümü ({friends.length})
            </button>

            <button
              onClick={() => setActiveTab('pending')}
              className={`relative px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'pending'
                  ? 'bg-[#181B26] text-white shadow-xs'
                  : 'text-[#949ba4] hover:bg-[#181B26]/50 hover:text-[#dbdee1]'
              }`}
            >
              <span>Bekleyen İstekler</span>
              {pendingCount > 0 && (
                <span className="w-4 h-4 bg-[#EF4444] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('add')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-bold flex items-center gap-1.5 ${
                activeTab === 'add'
                  ? 'bg-[#10B981] text-white shadow-md'
                  : 'bg-[#10B981]/20 hover:bg-[#10B981] text-[#10B981] hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Arkadaş Ekle</span>
            </button>
          </div>
        </div>

        {/* Current user tag badge */}
        <div className="hidden sm:flex items-center gap-1.5 bg-[#181B26] px-3 py-1 rounded-lg border border-[#2D3348] text-xs">
          <span className="text-[#949ba4]">Etiketiniz:</span>
          <span className="font-bold text-white">{currentUser?.username}</span>
          <span className="text-[#6366F1] font-bold">#{currentUser?.tag}</span>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 p-6 overflow-y-auto">
        {/* TAB 1: ADD FRIEND */}
        {activeTab === 'add' && (
          <div className="max-w-xl mx-auto space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-lg font-bold text-white mb-1">ARKADAŞ EKLE</h2>
              <p className="text-xs text-[#949ba4]">
                Arkadaşlarınızı ve kuzenlerinizi eklemek için onların <span className="text-[#6366F1] font-semibold">KullanıcıAdı#Etiket</span> kodunu girin.
              </p>
            </div>

            <form onSubmit={handleSend} className="bg-[#181B26] p-4 rounded-2xl border border-[#2D3348] shadow-xl space-y-3">
              <div className="flex items-center gap-2 bg-[#11131B] border border-[#2D3348] rounded-xl px-3.5 py-1 focus-within:border-[#6366F1] transition-colors">
                <input
                  type="text"
                  value={targetQuery}
                  onChange={(e) => setTargetQuery(e.target.value)}
                  placeholder="Örn: ahmet#1234 veya Kullanıcı ID..."
                  className="flex-1 bg-transparent py-2.5 text-sm text-white placeholder-[#80848e] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!targetQuery.trim()}
                  className="px-4 py-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  İstek Gönder
                </button>
              </div>

              {statusMsg && (
                <div
                  className={`text-xs p-3 rounded-xl font-medium animate-in fade-in duration-150 ${
                    statusMsg.type === 'error'
                      ? 'bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444]'
                      : 'bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981]'
                  }`}
                >
                  {statusMsg.text}
                </div>
              )}
            </form>

            <div className="bg-[#181B26]/60 p-4 rounded-2xl border border-[#232736] text-xs text-[#949ba4] flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-[#6366F1] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block mb-0.5">Kendi Etiketinizi Paylaşın:</span>
                Arkadaşınızın sizi ekleyebilmesi için sağ üstte yazan <span className="text-[#6366F1] font-bold">{currentUser?.username}#{currentUser?.tag}</span> bilginizi ona gönderin!
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PENDING REQUESTS */}
        {activeTab === 'pending' && (
          <div className="max-w-2xl mx-auto space-y-4 animate-in fade-in duration-200">
            <h2 className="text-xs font-bold text-[#b5bac1] uppercase tracking-wider mb-2">
              Gelen Arkadaşlık İstekleri — {pendingCount}
            </h2>

            {pendingCount === 0 ? (
              <div className="text-center py-16 text-[#949ba4]">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-40 text-[#6366F1]" />
                <p className="text-sm">Bekleyen arkadaşlık isteğiniz bulunmuyor.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {friendRequests.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between p-3.5 bg-[#181B26] hover:bg-[#202433] rounded-2xl border border-[#2D3348] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={req.sender.avatar}
                        alt={req.sender.displayName}
                        className="w-10 h-10 rounded-full bg-[#11131B] object-cover"
                      />
                      <div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-sm font-bold text-white">{req.sender.displayName}</span>
                          <span className="text-xs text-[#949ba4]">#{req.sender.tag}</span>
                        </div>
                        <span className="text-[11px] text-[#80848e]">Gelen Arkadaşlık İsteği</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onRespondFriendRequest(req.fromUserId, 'accept')}
                        className="p-2 bg-[#10B981] hover:bg-[#059669] text-white rounded-xl shadow-md transition-colors cursor-pointer"
                        title="Kabul Et"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onRespondFriendRequest(req.fromUserId, 'reject')}
                        className="p-2 bg-[#EF4444]/20 hover:bg-[#EF4444] text-[#EF4444] hover:text-white rounded-xl transition-colors cursor-pointer"
                        title="Reddet"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3 & 4: ONLINE & ALL FRIENDS */}
        {(activeTab === 'online' || activeTab === 'all') && (
          <div className="max-w-4xl mx-auto space-y-4 animate-in fade-in duration-200">
            {/* Search Bar */}
            <div className="flex items-center gap-2 bg-[#181B26] border border-[#2D3348] rounded-xl px-3 py-2">
              <Search className="w-4 h-4 text-[#80848e]" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Arkadaşlarında ara..."
                className="flex-1 bg-transparent text-xs text-white placeholder-[#80848e] focus:outline-none"
              />
            </div>

            <div className="text-[11px] font-bold text-[#b5bac1] uppercase tracking-wider mb-2">
              {activeTab === 'online' ? `Çevrim İçi — ${displayedFriends.length}` : `Tüm Arkadaşlar — ${displayedFriends.length}`}
            </div>

            {displayedFriends.length === 0 ? (
              <div className="text-center py-16 text-[#949ba4]">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-40 text-[#6366F1]" />
                <p className="text-sm">
                  {friends.length === 0
                    ? 'Henüz hiç arkadaş eklemediniz. "Arkadaş Ekle" butonuna basarak kuzenlerinizi ekleyin!'
                    : 'Aramanızla eşleşen arkadaş bulunamadı.'}
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {displayedFriends.map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center justify-between p-3 bg-[#181B26] hover:bg-[#202433] rounded-2xl border border-[#232736] hover:border-[#2D3348] transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <img
                          src={friend.avatar}
                          alt={friend.displayName}
                          className="w-10 h-10 rounded-full bg-[#11131B] object-cover"
                        />
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#181B26] ${
                            friend.isOnline ? 'bg-[#10B981]' : 'bg-[#6B7280]'
                          }`}
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-baseline gap-1.5 truncate">
                          <span className="text-sm font-bold text-white truncate">{friend.displayName}</span>
                          <span className="text-xs text-[#949ba4]">#{friend.tag}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className={friend.isOnline ? 'text-[#10B981] font-medium' : 'text-[#6B7280]'}>
                            {friend.isOnline ? 'Çevrim içi' : 'Çevrim dışı'}
                          </span>
                          {friend.currentVoiceChannel && (
                            <span className="text-[#6366F1] font-semibold flex items-center gap-1 text-[11px]">
                              <Volume2 className="w-3 h-3 animate-pulse" /> Seste
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onOpenInviteModal(friend)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#6366F1]/15 hover:bg-[#6366F1] text-[#A5B4FC] hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                        title="Kendi Sunucuna Davet Et"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Sunucuna Davet Et</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

