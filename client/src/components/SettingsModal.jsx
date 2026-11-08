import React, { useState } from 'react';
import { X, Check, Copy, Share2, Sparkles, ShieldCheck, Mic, Sliders } from 'lucide-react';

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

export default function SettingsModal({
  isOpen,
  onClose,
  currentUser,
  onSave,
  noiseSuppressionEnabled,
  onToggleNoiseSuppression
}) {
  if (!isOpen) return null;

  const [name, setName] = useState(currentUser?.name || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || AVATAR_PRESETS[0]);
  const [copied, setCopied] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onSave({ name: name.trim(), avatar });
      onClose();
    }
  };

  const copyInvite = () => {
    navigator.clipboard.writeText(window.location.origin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-[#181B26] text-[#dbdee1] w-full max-w-lg rounded-2xl shadow-2xl border border-[#2D3348] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#232736] flex items-center justify-between bg-[#11131B]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#6366F1]" />
            <h2 className="text-lg font-bold text-white tracking-wide">Itown Profil & Ses Ayarları</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#949ba4] hover:text-white hover:bg-[#232736] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content (Scrollable) */}
        <form onSubmit={handleSave} className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Avatar preview and selector */}
          <div>
            <label className="block text-xs font-bold text-[#b5bac1] uppercase tracking-wider mb-2">
              Profil Avatarı Seç
            </label>
            <div className="flex items-center gap-4 mb-3">
              <img
                src={avatar}
                alt="Selected Avatar"
                className="w-16 h-16 rounded-full bg-[#11131B] p-1 border-2 border-[#6366F1] shadow-md object-cover"
              />
              <div className="text-xs text-[#949ba4]">
                Arkadaşlarınız ve kuzenlerinizin ses odalarında göreceği profil resmi.
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {AVATAR_PRESETS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAvatar(p)}
                  className={`relative p-1.5 rounded-xl border transition-all cursor-pointer ${
                    avatar === p
                      ? 'border-[#6366F1] bg-[#6366F1]/20 scale-105'
                      : 'border-[#2D3348] hover:border-[#6366F1]/50 bg-[#11131B]'
                  }`}
                >
                  <img src={p} alt={`Preset ${idx}`} className="w-10 h-10 mx-auto rounded-full" />
                </button>
              ))}
            </div>
          </div>

          {/* Nickname input */}
          <div>
            <label className="block text-xs font-bold text-[#b5bac1] uppercase tracking-wider mb-2">
              Görünen İsim (Takma Ad)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Adınızı veya takma adınızı yazın..."
              maxLength={24}
              required
              className="w-full bg-[#11131B] text-white border border-[#2D3348] rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#6366F1] transition-colors"
            />
          </div>

          {/* Noise Suppression & Audio DSP Section */}
          <div className="bg-[#11131B] p-4 rounded-xl border border-[#2D3348] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-[#10B981]" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Gelişmiş Gürültü Engelleme (DSP Filtre)
                </span>
              </div>
              <button
                type="button"
                onClick={onToggleNoiseSuppression}
                className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors cursor-pointer ${
                  noiseSuppressionEnabled ? 'bg-[#10B981]' : 'bg-[#2D3348]'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    noiseSuppressionEnabled ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <p className="text-xs text-[#949ba4] leading-relaxed">
              Arka plandaki vantilatör, fan gürültüsü, klavye tıkırtısı ve oda yankısını gerçek zamanlı Web Audio DSP filtreleri (High-pass + Low-pass + Compressor) ile yok eder.
            </p>
          </div>

          {/* Share with Friends / Cousins */}
          <div className="bg-[#11131B] p-4 rounded-xl border border-[#2D3348]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#b5bac1] uppercase tracking-wider flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-[#10B981]" /> Arkadaşları / Kuzenleri Davet Et
              </span>
              {copied && <span className="text-xs text-[#10B981] font-medium">Kopyalandı!</span>}
            </div>
            <p className="text-xs text-[#949ba4] mb-3">
              Bu bağlantıyı arkadaşlarına göndererek aynı odaya ve ses kanallarına katılmalarını sağlayabilirsin.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={window.location.origin}
                className="flex-1 bg-[#181B26] text-xs text-[#dbdee1] px-3 py-2 rounded-lg border border-[#2D3348] select-all cursor-pointer"
                onClick={copyInvite}
              />
              <button
                type="button"
                onClick={copyInvite}
                className="flex items-center gap-1.5 bg-[#6366F1] hover:bg-[#4F46E5] text-white text-xs font-medium px-3 py-2 rounded-lg transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Hazır' : 'Kopyala'}
              </button>
            </div>
          </div>

          {/* Copyright Safe & Privacy Notice */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#6366F1]/10 border border-[#6366F1]/20 text-[11px] text-[#A5B4FC]">
            <ShieldCheck className="w-4 h-4 shrink-0 text-[#6366F1] mt-0.5" />
            <div>
              <span className="font-bold">Itown Space Güvencesi:</span> Bu yazılım %100 özgün mimaride üretilmiştir. Ses ve görüntü doğrudan kullanıcılar arasında (Peer-to-Peer) şifrelenir; sunucularda hiçbir ses kaydı tutulmaz ve telifli hiçbir üçüncü taraf marka veya materyal kullanılmaz.
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-[#dbdee1] hover:underline cursor-pointer"
            >
              İptal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#6366F1] hover:bg-[#4F46E5] text-white text-sm font-semibold rounded-lg shadow-md transition-colors cursor-pointer"
            >
              Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
