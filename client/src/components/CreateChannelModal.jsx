import React, { useState } from 'react';
import { X, Hash, Volume2 } from 'lucide-react';

export default function CreateChannelModal({ isOpen, onClose, serverName, onCreateChannel }) {
  if (!isOpen) return null;

  const [type, setType] = useState('text'); // 'text' | 'voice'
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    onCreateChannel({
      type,
      name: name.trim(),
      description: description.trim()
    });

    setName('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-[#181B26] text-[#dbdee1] w-full max-w-md rounded-3xl shadow-2xl border border-[#2D3348] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-[#232736] flex items-center justify-between bg-[#11131B]">
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide">Yeni Kanal Oluştur</h2>
            <span className="text-xs text-[#949ba4]">{serverName} sunucusunda</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#949ba4] hover:text-white hover:bg-[#232736] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Channel Type Selector */}
          <div>
            <label className="block text-[11px] font-bold text-[#b5bac1] uppercase tracking-wider mb-2">
              Kanal Türü
            </label>
            <div className="space-y-2">
              <label
                onClick={() => setType('text')}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  type === 'text'
                    ? 'border-[#6366F1] bg-[#6366F1]/15 text-white'
                    : 'border-[#2D3348] hover:border-[#6366F1]/50 bg-[#11131B]'
                }`}
              >
                <Hash className="w-5 h-5 text-[#80848e]" />
                <div>
                  <div className="text-xs font-bold">Metin Kanalı</div>
                  <div className="text-[10px] text-[#949ba4]">Görsel, ekran görüntüsü ve mesajlaşma alanı</div>
                </div>
              </label>

              <label
                onClick={() => setType('voice')}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  type === 'voice'
                    ? 'border-[#10B981] bg-[#10B981]/15 text-white'
                    : 'border-[#2D3348] hover:border-[#10B981]/50 bg-[#11131B]'
                }`}
              >
                <Volume2 className="w-5 h-5 text-[#10B981]" />
                <div>
                  <div className="text-xs font-bold">Ses Kanalı</div>
                  <div className="text-[10px] text-[#949ba4]">Sesli sohbet, ekran ve kamera paylaşım odası</div>
                </div>
              </label>
            </div>
          </div>

          {/* Channel Name */}
          <div>
            <label className="block text-[11px] font-bold text-[#b5bac1] uppercase tracking-wider mb-1.5">
              Kanal Adı
            </label>
            <div className="relative">
              {type === 'text' ? (
                <Hash className="w-4 h-4 text-[#80848e] absolute left-3.5 top-3" />
              ) : (
                <Volume2 className="w-4 h-4 text-[#10B981] absolute left-3.5 top-3" />
              )}
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Örn: oyun-sohbeti veya Turnuva Odası"
                maxLength={30}
                required
                className="w-full bg-[#11131B] text-white border border-[#2D3348] rounded-xl pl-10 pr-3.5 py-2.5 text-sm focus:outline-none focus:border-[#6366F1]"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-bold text-[#b5bac1] uppercase tracking-wider mb-1.5">
              Kanal Konusu / Açıklaması (İsteğe bağlı)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Kanalın amacını belirten kısa bir açıklama..."
              maxLength={60}
              className="w-full bg-[#11131B] text-white border border-[#2D3348] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#6366F1]"
            />
          </div>

          {/* Actions */}
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
              Kanalı Oluştur
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

