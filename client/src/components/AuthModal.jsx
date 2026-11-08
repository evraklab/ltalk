import React, { useState } from 'react';
import { Sparkles, User, Lock, ArrowRight, ShieldCheck, Check } from 'lucide-react';

const AVATAR_PRESETS = [
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Midnight',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Shadow',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Cyber',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Gamer',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Buster',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Zoe'
];

export default function AuthModal({ onLogin, onRegister }) {
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatar, setAvatar] = useState(AVATAR_PRESETS[0]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isLoginTab) {
      onLogin({ username, password }, (res) => {
        setLoading(false);
        if (res?.error) setError(res.error);
      });
    } else {
      if (password.length < 4) {
        setLoading(false);
        setError('Şifre en az 4 karakter olmalıdır.');
        return;
      }
      onRegister({ username, password, displayName: displayName || username, avatar }, (res) => {
        setLoading(false);
        if (res?.error) setError(res.error);
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-[#181B26] text-[#dbdee1] w-full max-w-md rounded-3xl shadow-2xl border border-[#2D3348] overflow-hidden flex flex-col">
        {/* Top Header */}
        <div className="p-6 pb-4 text-center border-b border-[#232736] bg-[#11131B]">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-linear-to-br from-[#6366F1] via-[#8B5CF6] to-[#06B6D4] text-white flex items-center justify-center font-black text-xl shadow-lg shadow-[#6366F1]/30 mb-3">
            IT
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-wide">
            {isLoginTab ? 'Itown Space Girişi' : 'Yeni Hesap Oluştur'}
          </h2>
          <p className="text-xs text-[#949ba4] mt-1">
            {isLoginTab
              ? 'Arkadaşlarınız ve sunucularınız sizi bekliyor!'
              : 'Arkadaşlarınızı ekleyin, kendi sunucunuzu açın ve sesli sohbete başlayın!'}
          </p>
        </div>

        {/* Tab switch buttons */}
        <div className="flex border-b border-[#232736] bg-[#141620]">
          <button
            type="button"
            onClick={() => { setIsLoginTab(true); setError(''); }}
            className={`flex-1 py-3 text-xs font-bold transition-all cursor-pointer ${
              isLoginTab
                ? 'text-white border-b-2 border-[#6366F1] bg-[#181B26]'
                : 'text-[#949ba4] hover:text-white'
            }`}
          >
            Giriş Yap
          </button>
          <button
            type="button"
            onClick={() => { setIsLoginTab(false); setError(''); }}
            className={`flex-1 py-3 text-xs font-bold transition-all cursor-pointer ${
              !isLoginTab
                ? 'text-white border-b-2 border-[#6366F1] bg-[#181B26]'
                : 'text-[#949ba4] hover:text-white'
            }`}
          >
            Kayıt Ol (Yeni Hesap)
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] text-xs px-3.5 py-2.5 rounded-xl font-medium animate-in shake duration-200">
              {error}
            </div>
          )}

          {/* Registration avatar selection */}
          {!isLoginTab && (
            <div>
              <label className="block text-[11px] font-bold text-[#b5bac1] uppercase tracking-wider mb-2">
                Profil Avatarı Seç
              </label>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {AVATAR_PRESETS.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatar(p)}
                    className={`relative p-1 rounded-xl border shrink-0 transition-all cursor-pointer ${
                      avatar === p
                        ? 'border-[#6366F1] bg-[#6366F1]/20 scale-105'
                        : 'border-[#2D3348] hover:border-[#6366F1]/50 bg-[#11131B]'
                    }`}
                  >
                    <img src={p} alt={`Avatar ${idx}`} className="w-9 h-9 rounded-full" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Username */}
          <div>
            <label className="block text-[11px] font-bold text-[#b5bac1] uppercase tracking-wider mb-1.5">
              {isLoginTab ? 'Kullanıcı Adı veya Kullanıcı#Etiket' : 'Kullanıcı Adı'}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#80848e] absolute left-3.5 top-3" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={isLoginTab ? 'Örn: ahmet veya ahmet#1234' : 'Örn: ahmet'}
                required
                className="w-full bg-[#11131B] text-white border border-[#2D3348] rounded-xl pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#6366F1] transition-colors"
              />
            </div>
            {!isLoginTab && (
              <span className="text-[10px] text-[#949ba4] mt-1 block">
                Sistem otomatik olarak Discord tarzı benzersiz bir etiket (örn: #4812) atayacaktır.
              </span>
            )}
          </div>

          {/* Display Name (Optional on register) */}
          {!isLoginTab && (
            <div>
              <label className="block text-[11px] font-bold text-[#b5bac1] uppercase tracking-wider mb-1.5">
                Görünen İsim (Takma Ad)
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Örn: Ahmet Yılmaz"
                className="w-full bg-[#11131B] text-white border border-[#2D3348] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#6366F1] transition-colors"
              />
            </div>
          )}

          {/* Password */}
          <div>
            <label className="block text-[11px] font-bold text-[#b5bac1] uppercase tracking-wider mb-1.5">
              Şifre
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#80848e] absolute left-3.5 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-[#11131B] text-white border border-[#2D3348] rounded-xl pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#6366F1] transition-colors"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-[#6366F1] hover:bg-[#4F46E5] text-white text-sm font-bold rounded-xl shadow-lg shadow-[#6366F1]/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <span>{loading ? 'İşleniyor...' : isLoginTab ? 'Giriş Yap' : 'Kayıt Ol ve Başla'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

