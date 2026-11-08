import React, { useState, useEffect } from 'react';
import {
  Crown,
  X,
  Users,
  Radio,
  Server,
  RefreshCw,
  Search,
  Volume2,
  Trash2,
  PhoneOff,
  ShieldAlert,
  ShieldCheck,
  Check
} from 'lucide-react';

export default function AdminPanelModal({ isOpen, onClose, socket, currentUser }) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'servers'
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionMsg, setActionMsg] = useState(null);

  const fetchAdminData = () => {
    setLoading(true);
    socket?.emit('admin:get-data', (res) => {
      setLoading(false);
      if (res?.success) {
        setData(res);
      } else if (res?.error) {
        alert(res.error);
        onClose();
      }
    });
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleKickVoice = (targetUserId) => {
    socket?.emit('admin:kick-voice', { targetUserId }, (res) => {
      if (res?.success) {
        setActionMsg('Kullanıcı sesten atıldı.');
        fetchAdminData();
        setTimeout(() => setActionMsg(null), 3000);
      }
    });
  };

  const handleDeleteUser = (targetUserId, name) => {
    if (!window.confirm(`"${name}" kullanıcısını sistemden kalıcı olarak silmek istediğinize emin misiniz?`)) return;
    socket?.emit('admin:delete-user', { targetUserId }, (res) => {
      if (res?.success) {
        setActionMsg('Kullanıcı hesabı silindi.');
        fetchAdminData();
        setTimeout(() => setActionMsg(null), 3000);
      } else if (res?.error) {
        alert(res.error);
      }
    });
  };

  const filteredUsers = (data?.users || []).filter(u =>
    u.displayName?.toLowerCase().includes(search.toLowerCase()) ||
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.tag?.includes(search)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#181B26] text-[#dbdee1] w-full max-w-4xl rounded-3xl shadow-2xl border-2 border-[#F59E0B]/40 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#232736] flex items-center justify-between bg-[#11131B]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-[#F59E0B] to-[#D97706] text-black flex items-center justify-center shadow-lg shadow-[#F59E0B]/30 font-black">
              <Crown className="w-6 h-6 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white tracking-wide">Yönetici Paneli (Fitoz)</h2>
                <span className="bg-[#F59E0B] text-black font-extrabold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Admin Yetkili
                </span>
              </div>
              <p className="text-xs text-[#949ba4]">Tüm sistemin aktif üyeleri, sunucuları ve anlık ses durumu</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchAdminData}
              disabled={loading}
              className="p-2 rounded-xl bg-[#232736] hover:bg-[#2D3348] text-[#dbdee1] hover:text-white transition-colors cursor-pointer"
              title="Yenile"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#949ba4] hover:text-white hover:bg-[#232736] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats Cards Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-[#141620] border-b border-[#232736]">
          <div className="bg-[#181B26] p-3 rounded-2xl border border-[#2D3348] flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#6366F1]/20 text-[#6366F1] flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-[#949ba4] uppercase">Kayıtlı Üye</div>
              <div className="text-lg font-black text-white">{data?.stats?.totalUsers ?? '...'}</div>
            </div>
          </div>

          <div className="bg-[#181B26] p-3 rounded-2xl border border-[#2D3348] flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#10B981]/20 text-[#10B981] flex items-center justify-center">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-[#949ba4] uppercase">Çevrim İçi</div>
              <div className="text-lg font-black text-[#10B981]">{data?.stats?.onlineUsers ?? '...'}</div>
            </div>
          </div>

          <div className="bg-[#181B26] p-3 rounded-2xl border border-[#2D3348] flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#06B6D4]/20 text-[#06B6D4] flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-[#949ba4] uppercase">Toplam Sunucu</div>
              <div className="text-lg font-black text-white">{data?.stats?.totalServers ?? '...'}</div>
            </div>
          </div>

          <div className="bg-[#181B26] p-3 rounded-2xl border border-[#2D3348] flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#F59E0B]/20 text-[#F59E0B] flex items-center justify-center">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-[#949ba4] uppercase">Sesteki Kişiler</div>
              <div className="text-lg font-black text-[#F59E0B]">{data?.stats?.activeVoiceUsers ?? 0}</div>
            </div>
          </div>
        </div>

        {/* Tab Switcher & Search */}
        <div className="px-5 py-3 border-b border-[#232736] flex flex-wrap items-center justify-between gap-3 bg-[#11131B]">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-[#F59E0B] text-black shadow-md'
                  : 'bg-[#181B26] text-[#949ba4] hover:text-white'
              }`}
            >
              Tüm Üyeler ({data?.users?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('servers')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'servers'
                  ? 'bg-[#F59E0B] text-black shadow-md'
                  : 'bg-[#181B26] text-[#949ba4] hover:text-white'
              }`}
            >
              Tüm Sunucular ({data?.servers?.length || 0})
            </button>
          </div>

          {activeTab === 'users' && (
            <div className="flex items-center gap-2 bg-[#181B26] border border-[#2D3348] rounded-xl px-3 py-1.5 w-64">
              <Search className="w-3.5 h-3.5 text-[#80848e]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Üye ara..."
                className="flex-1 bg-transparent text-xs text-white placeholder-[#80848e] focus:outline-none"
              />
            </div>
          )}
        </div>

        {actionMsg && (
          <div className="bg-[#10B981]/20 border-b border-[#10B981]/30 text-[#10B981] px-4 py-2 text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4" /> {actionMsg}
          </div>
        )}

        {/* Tab 1: Users List */}
        <div className="flex-1 p-5 overflow-y-auto space-y-2">
          {activeTab === 'users' && (
            <div className="space-y-2">
              {filteredUsers.map((u) => {
                const isFitoz = u.username?.toLowerCase() === 'fitoz';
                return (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-3.5 bg-[#141620] hover:bg-[#181B26] rounded-2xl border border-[#232736] transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <img src={u.avatar} alt={u.displayName} className="w-10 h-10 rounded-full object-cover" />
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#141620] ${
                            u.isOnline ? 'bg-[#10B981]' : 'bg-[#6B7280]'
                          }`}
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-sm font-bold text-white truncate">{u.displayName}</span>
                          <span className="text-xs text-[#949ba4]">#{u.tag}</span>
                          {isFitoz && (
                            <span className="bg-[#F59E0B] text-black text-[9px] font-black px-1.5 py-0.2 rounded font-mono">
                              YÖNETİCİ
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-[#949ba4] mt-0.5">
                          <span className={u.isOnline ? 'text-[#10B981] font-medium' : 'text-[#6B7280]'}>
                            {u.isOnline ? '● Çevrim İçi' : '○ Çevrim Dışı'}
                          </span>
                          {u.voiceChannelName && (
                            <span className="text-[#F59E0B] font-semibold flex items-center gap-1">
                              <Volume2 className="w-3.5 h-3.5 animate-pulse" /> {u.voiceChannelName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Admin Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {u.currentVoiceChannel && (
                        <button
                          onClick={() => handleKickVoice(u.id)}
                          className="px-3 py-1.5 bg-[#EF4444]/15 hover:bg-[#EF4444] text-[#EF4444] hover:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                          title="Ses Odasından At"
                        >
                          <PhoneOff className="w-3.5 h-3.5" />
                          <span>Sesten At</span>
                        </button>
                      )}

                      {!isFitoz && (
                        <button
                          onClick={() => handleDeleteUser(u.id, u.displayName)}
                          className="p-2 text-[#949ba4] hover:text-[#EF4444] hover:bg-[#EF4444]/15 rounded-xl transition-colors cursor-pointer"
                          title="Hesabı Kalıcı Olarak Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tab 2: Servers List */}
          {activeTab === 'servers' && (
            <div className="space-y-3">
              {(data?.servers || []).map((srv) => (
                <div
                  key={srv.id}
                  className="p-4 bg-[#141620] rounded-2xl border border-[#232736] flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-[#6366F1] to-[#06B6D4] text-white flex items-center justify-center font-black text-base shadow-md">
                      {srv.icon || srv.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{srv.name}</h3>
                      <div className="text-xs text-[#949ba4] flex items-center gap-3 mt-0.5">
                        <span>Kurucu: <span className="text-[#A5B4FC] font-semibold">{srv.ownerName}</span></span>
                        <span>•</span>
                        <span>{srv.memberCount} Üye</span>
                        <span>•</span>
                        <span>{(srv.channels || []).length} Kanal</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

