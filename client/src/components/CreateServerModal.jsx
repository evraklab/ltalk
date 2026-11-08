import React, { useState } from 'react';
import { X, Plus, Sparkles } from 'lucide-react';

export default function CreateServerModal({ isOpen, onClose, onCreateServer }) {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    onCreateServer({
      name: name.trim(),
      icon: icon.trim() || name.trim().substring(0, 2).toUpperCase()
    });

    setName('');
    setIcon('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-[#181B26] text-[#dbdee1] w-full max-w-md rounded-3xl shadow-2xl border border-[#2D3348] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-[#232736] flex items-center justify-between bg-[#11131B]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#6366F1]" />
            <h2 className="text-lg font-bold text-white tracking-wide">Yeni Sunucu Oluştur</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#949ba4] hover:text-white hover:bg-[#232736] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-[#949ba4] leading-relaxed">
            Sunucun, arkadaşların ve kuzenlerinle birlikte sesli sohbet edip oyun oynayabileceğin özel bir alandır.
          </p>

          {/* Server Icon Preview */}
          <div className="flex justify-center my-2">
            <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-[#6366F1] to-[#06B6D4] text-white flex items-center justify-center font-black text-xl shadow-lg shadow-[#6366F1]/30">
              {icon.trim() || (name.trim() ? name.trim().substring(0, 2).toUpperCase() : 'IT')}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#b5bac1] uppercase tracking-wider mb-1.5">
              Sunucu Adı
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: Deneme veya Oyun Odası"
              maxLength={30}
              required
              className="w-full bg-[#11131B] text-white border border-[#2D3348] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#6366F1] transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#b5bac1] uppercase tracking-wider mb-1.5">
              Sunucu Simgesi / Baş Harfleri (İsteğe bağlı)
            </label>
            <input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="Örn: DN veya 🎮"
              maxLength={4}
              className="w-full bg-[#11131B] text-white border border-[#2D3348] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#6366F1] transition-colors"
            />
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-[#dbdee1] hover:underline cursor-pointer"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-5 py-2.5 bg-[#6366F1] hover:bg-[#4F46E5] text-white text-sm font-bold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
            >
              Sunucu Oluştur
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

