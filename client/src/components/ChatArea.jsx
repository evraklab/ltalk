import React, { useState, useRef, useEffect } from 'react';
import {
  Hash,
  Send,
  Image as ImageIcon,
  Smile,
  X,
  Share2,
  Volume2,
  Menu
} from 'lucide-react';

const QUICK_EMOJIS = ['😂', '🔥', '🎮', '❤️', '🚀', '😎', '👍', '👀', '🎉', '💀'];

export default function ChatArea({
  channel,
  messages = [],
  currentUser,
  activeVoiceChannel,
  voiceRooms = {},
  onSendMessage,
  onOpenSettings,
  onJoinVoice,
  onToggleMobileMenu
}) {
  const [text, setText] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e?.preventDefault();
    if (!text.trim() && !imagePreview) return;

    onSendMessage({
      channelId: channel?.id,
      text: text.trim(),
      image: imagePreview
    });

    setText('');
    setImagePreview(null);
    setShowEmojiPicker(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        alert('Görsel boyutu en fazla 8MB olabilir.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setImagePreview(uploadEvent.target?.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Allow pasting screenshots directly from clipboard (Ctrl+V)
  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        const reader = new FileReader();
        reader.onload = (uploadEvent) => {
          setImagePreview(uploadEvent.target?.result);
        };
        reader.readAsDataURL(blob);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#313338] h-full overflow-hidden">
      {/* Channel Header */}
      <div className="h-12 border-b border-[#1f2023] px-4 flex items-center justify-between shadow-xs bg-[#313338] shrink-0">
        <div className="flex items-center gap-2 overflow-hidden">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="p-1 rounded-md text-[#949ba4] hover:text-white md:hidden cursor-pointer mr-1"
              title="Menüyü Aç"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <Hash className="w-6 h-6 text-[#80848e] shrink-0" />
          <h3 className="font-bold text-white text-base truncate">{channel?.name}</h3>
          {channel?.description && (
            <>
              <div className="w-[1px] h-4 bg-[#3f4147] mx-2 hidden sm:block" />
              <span className="text-xs text-[#949ba4] truncate hidden sm:block">
                {channel.description}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3 py-1 bg-[#2b2d31] hover:bg-[#35373c] text-[#dbdee1] hover:text-white rounded-md text-xs font-medium transition-colors cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-[#5865F2]" />
            <span className="hidden md:inline">Davet Et</span>
          </button>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Welcome Banner for the Channel */}
        <div className="py-6 border-b border-[#3f4147]/50 mb-2">
          <div className="w-16 h-16 rounded-full bg-[#2b2d31] flex items-center justify-center mb-3">
            <Hash className="w-9 h-9 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-1">#{channel?.name} kanalına hoş geldin!</h2>
          <p className="text-sm text-[#949ba4]">
            Burası #{channel?.name} kanalının başlangıcı. Arkadaşların ve kuzenlerinle yazışmaya başla!
          </p>
        </div>

        {/* Message Items */}
        {messages.map((msg) => {
          const isSystem = msg.senderId === 'system';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3.5 group hover:bg-[#2e3035]/60 -mx-4 px-4 py-1.5 rounded-sm transition-colors ${
                isSystem ? 'bg-[#5865F2]/5' : ''
              }`}
            >
              <img
                src={msg.senderAvatar}
                alt={msg.senderName}
                className="w-10 h-10 rounded-full bg-[#1e1f22] object-cover shrink-0 mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span
                    className="font-semibold text-sm hover:underline cursor-pointer"
                    style={{ color: msg.senderColor || '#ffffff' }}
                  >
                    {msg.senderName}
                  </span>
                  <span className="text-[11px] text-[#949ba4]">{msg.timestamp}</span>
                </div>

                {msg.text && (
                  <p className="text-sm text-[#dbdee1] break-words whitespace-pre-wrap leading-relaxed mt-0.5 select-text">
                    {msg.text}
                  </p>
                )}

                {msg.image && (
                  <div className="mt-2 max-w-sm rounded-xl overflow-hidden border border-[#3f4147]">
                    <img
                      src={msg.image}
                      alt="Uploaded media"
                      className="w-full max-h-80 object-cover rounded-lg cursor-pointer hover:opacity-95 transition-opacity"
                      onClick={() => window.open(msg.image, '_blank')}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 pt-1 shrink-0 relative">
        {/* Image Preview before send */}
        {imagePreview && (
          <div className="mb-2 relative inline-block bg-[#2b2d31] p-2 rounded-xl border border-[#3f4147]">
            <img
              src={imagePreview}
              alt="Attach Preview"
              className="w-24 h-24 object-cover rounded-lg"
            />
            <button
              onClick={() => setImagePreview(null)}
              className="absolute -top-2 -right-2 p-1 bg-[#f23f43] text-white rounded-full shadow-md hover:bg-[#d83a3e] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Emoji Selector Popup */}
        {showEmojiPicker && (
          <div className="absolute bottom-16 right-6 bg-[#2b2d31] p-2 rounded-xl border border-[#3f4147] shadow-xl flex gap-1 z-20">
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  setText((prev) => prev + emoji);
                  setShowEmojiPicker(false);
                }}
                className="text-lg p-1.5 hover:bg-[#35373c] rounded-md transition-transform hover:scale-125 cursor-pointer"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Text Input Box */}
        <div className="bg-[#383a40] rounded-lg flex items-center px-4 py-2.5 gap-3">
          {/* File upload button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Görsel / Ekran Görüntüsü Yükle"
            className="text-[#b5bac1] hover:text-white transition-colors cursor-pointer"
          >
            <ImageIcon className="w-5 h-5" />
          </button>

          {/* Text input */}
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={`#${channel?.name || 'genel-sohbet'} kanalına mesaj gönder... (Ctrl+V ile ekran görüntüsü yapıştırabilirsin)`}
            className="flex-1 bg-transparent text-sm text-white placeholder-[#80848e] focus:outline-none select-text"
          />

          {/* Emoji Toggle */}
          <button
            type="button"
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            className="text-[#b5bac1] hover:text-white transition-colors cursor-pointer"
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Send Button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!text.trim() && !imagePreview}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              text.trim() || imagePreview
                ? 'bg-[#5865F2] text-white hover:bg-[#4752c4]'
                : 'text-[#80848e] cursor-not-allowed opacity-50'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

