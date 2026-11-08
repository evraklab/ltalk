import React, { useRef, useEffect, useState, memo } from 'react';
import {
  MicOff,
  Video,
  VideoOff,
  Monitor,
  PhoneOff,
  Volume2,
  Users,
  Music,
  Maximize,
  Sparkles,
  Sliders,
  Menu
} from 'lucide-react';

const SOUNDBOARD_ITEMS = [
  { id: 'airhorn', name: 'Korna 📢', desc: 'Havalı Korna' },
  { id: 'bruh', name: 'Bruh 🗿', desc: 'Klasik Bruh' },
  { id: 'quack', name: 'Vak Vak 🦆', desc: 'Ördek Sesi' },
  { id: 'coin', name: 'Altın 🪙', desc: 'Retro Coin' },
  { id: 'victory', name: 'Zafer 🏆', desc: 'Level Up' }
];

/**
 * Dedicated Video Stream Player.
 * Uses memoization and strictly sets srcObject ONLY once when stream changes.
 * This completely eliminates freezing, flickering, and screen blackout glitches.
 */
const VideoPlayer = memo(function VideoPlayer({
  stream,
  isLocal = false,
  isScreen = false,
  className = ''
}) {
  const videoRef = useRef(null);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || !stream) return;

    if (videoEl.srcObject !== stream) {
      videoEl.srcObject = stream;
      videoEl.play().catch(() => {});
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={isLocal} // Always mute local video to prevent echo
      className={`w-full h-full object-contain bg-black ${isLocal && !isScreen ? 'scale-x-[-1]' : ''} ${className}`}
    />
  );
});

// Participant video / avatar tile
function StreamTile({
  user,
  stream,
  isLocal = false,
  isScreen = false,
  isSpeaking = false,
  isMuted = false,
  volume = 1,
  onVolumeChange
}) {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const hasVideo = stream && stream.getVideoTracks().length > 0;

  return (
    <div
      className={`relative bg-[#181B26] rounded-xl overflow-hidden flex items-center justify-center border-2 transition-all shadow-lg aspect-video group ${
        isSpeaking ? 'border-[#10B981] shadow-[#10B981]/25 shadow-lg' : 'border-[#2D3348]'
      }`}
    >
      {/* Video Element */}
      {hasVideo ? (
        <VideoPlayer
          stream={stream}
          isLocal={isLocal}
          isScreen={isScreen}
        />
      ) : (
        /* Large Avatar fallback when video is off */
        <div className="flex flex-col items-center justify-center p-4">
          <div className="relative">
            <img
              src={user?.avatar}
              alt={user?.name}
              className={`w-24 h-24 rounded-full bg-[#11131B] p-1 object-cover transition-all duration-200 ${
                isSpeaking ? 'ring-4 ring-[#10B981] scale-105' : 'ring-2 ring-[#2D3348]'
              }`}
            />
            {isSpeaking && (
              <span className="absolute inset-0 rounded-full animate-ping ring-2 ring-[#10B981] opacity-40 pointer-events-none" />
            )}
          </div>
        </div>
      )}

      {/* Badges / Name Overlay */}
      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md text-xs font-semibold text-white">
        <span>{user?.name} {isLocal ? '(Sen)' : ''}</span>
        {isScreen && <span className="bg-[#6366F1] text-[10px] px-1.5 py-0.2 rounded font-bold">EKRAN</span>}
        {isMuted && <MicOff className="w-3.5 h-3.5 text-[#EF4444]" />}
      </div>

      {/* Individual Volume Control for Remote Peers */}
      {!isLocal && onVolumeChange && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="relative">
            <button
              onClick={() => setShowVolumeSlider(!showVolumeSlider)}
              className="p-1.5 bg-black/70 hover:bg-black/90 text-white rounded-md backdrop-blur-xs transition-colors cursor-pointer"
              title="Kullanıcı Ses Düzeyi"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>
            {showVolumeSlider && (
              <div className="absolute right-0 top-8 bg-[#181B26] p-2.5 rounded-xl border border-[#2D3348] shadow-xl z-20 w-36 flex flex-col gap-1.5">
                <div className="flex justify-between text-[10px] font-bold text-[#b5bac1]">
                  <span>SES</span>
                  <span>{Math.round(volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                  className="w-full accent-[#6366F1] cursor-pointer"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function VoiceRoomView({
  channel,
  participants = [],
  currentUser,
  localAudioStream,
  localVideoStream,
  localScreenStream,
  remoteStreams = {},
  remoteScreenStreams = {},
  isMuted,
  isDeafened,
  isCameraOn,
  isScreenSharing,
  isSpeaking,
  onToggleMute,
  onToggleCamera,
  onToggleScreenShare,
  onLeaveVoice,
  onTriggerSoundboard,
  onToggleMobileMenu
}) {
  const [showSoundboard, setShowSoundboard] = useState(false);
  const [peerVolumes, setPeerVolumes] = useState({});
  const mainStageRef = useRef(null);

  // Check if someone is screen sharing
  const screenSharer = participants.find(p => p.isScreenSharing);
  const isAnyScreenSharing = Boolean(screenSharer || isScreenSharing);

  // Identify active screen stream
  const activeScreenStream = isScreenSharing
    ? localScreenStream
    : screenSharer
    ? (remoteScreenStreams[screenSharer.id] || remoteStreams[screenSharer.id])
    : null;

  const localParticipant = {
    ...currentUser,
    isSpeaking,
    isMuted,
    isCameraOn,
    isScreenSharing
  };

  const otherParticipants = participants.filter(p => p.id !== currentUser?.id);

  const handleFullscreen = () => {
    if (mainStageRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        mainStageRef.current.requestFullscreen();
      }
    }
  };

  const handleVolumeChange = (peerId, vol) => {
    setPeerVolumes(prev => ({ ...prev, [peerId]: vol }));
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0F1117] h-full overflow-hidden relative">
      {/* Voice Room Top Header */}
      <div className="h-12 border-b border-[#1C202F] px-4 flex items-center justify-between bg-[#11131B] shrink-0">
        <div className="flex items-center gap-2">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="p-1 rounded-md text-[#949ba4] hover:text-white md:hidden cursor-pointer mr-1"
              title="Menüyü Aç"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <Volume2 className="w-5 h-5 text-[#10B981]" />
          <h2 className="text-white font-bold text-sm tracking-wide">{channel?.name}</h2>
          <span className="text-xs text-[#949ba4] ml-2 flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {participants.length} Katılımcı
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Soundboard Button */}
          <button
            onClick={() => setShowSoundboard(!showSoundboard)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
              showSoundboard
                ? 'bg-[#6366F1] text-white shadow-md'
                : 'bg-[#181B26] hover:bg-[#232736] text-[#dbdee1] hover:text-white'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>Ses Tahtası</span>
          </button>

          <button
            onClick={onLeaveVoice}
            className="flex items-center gap-1.5 px-3 py-1 bg-[#EF4444] hover:bg-[#DC2626] text-white text-xs font-bold rounded-md shadow-xs transition-colors cursor-pointer"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            <span>Ayrıl</span>
          </button>
        </div>
      </div>

      {/* Main Grid / Spotlight Area */}
      <div className="flex-1 p-4 overflow-y-auto flex flex-col justify-center items-center">
        {/* If Screen Share is active, show Spotlight View */}
        {isAnyScreenSharing ? (
          <div className="w-full h-full flex flex-col gap-3">
            {/* Screen Share Main Stage */}
            <div
              ref={mainStageRef}
              className="flex-1 bg-black rounded-2xl overflow-hidden relative border border-[#2D3348] flex items-center justify-center group"
            >
              {activeScreenStream ? (
                <VideoPlayer
                  stream={activeScreenStream}
                  isLocal={isScreenSharing}
                  isScreen={true}
                />
              ) : (
                <div className="text-sm text-[#949ba4] animate-pulse">
                  Ekran akışı bağlanıyor...
                </div>
              )}

              <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs font-bold text-white flex items-center gap-2">
                <Monitor className="w-4 h-4 text-[#6366F1]" />
                <span>
                  {isScreenSharing
                    ? 'Senin Ekran Paylaşımın (Canlı)'
                    : `${screenSharer?.name} kullanıcısının ekranı`}
                </span>
              </div>

              {/* Fullscreen Button */}
              <button
                onClick={handleFullscreen}
                className="absolute top-3 right-3 p-2 bg-black/70 hover:bg-black/90 text-white rounded-lg backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                title="Tam Ekran Yap"
              >
                <Maximize className="w-4 h-4" />
              </button>
            </div>

            {/* Thumbnail Row of participants */}
            <div className="h-28 flex gap-3 overflow-x-auto py-1 shrink-0">
              <div className="w-44 h-full shrink-0">
                <StreamTile
                  user={localParticipant}
                  stream={localVideoStream}
                  isLocal={true}
                  isSpeaking={isSpeaking}
                  isMuted={isMuted}
                />
              </div>

              {otherParticipants.map((peer) => (
                <div key={peer.id} className="w-44 h-full shrink-0">
                  <StreamTile
                    user={peer}
                    stream={remoteStreams[peer.id]}
                    isLocal={false}
                    isSpeaking={peer.isSpeaking}
                    isMuted={peer.isMuted}
                    volume={peerVolumes[peer.id] ?? 1}
                    onVolumeChange={(vol) => handleVolumeChange(peer.id, vol)}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Normal Grid View (Cameras & Avatars) */
          <div
            className={`w-full max-w-5xl grid gap-4 items-center justify-center ${
              participants.length <= 1
                ? 'grid-cols-1 max-w-md'
                : participants.length === 2
                ? 'grid-cols-1 md:grid-cols-2 max-w-3xl'
                : participants.length <= 4
                ? 'grid-cols-2 max-w-4xl'
                : 'grid-cols-2 md:grid-cols-3'
            }`}
          >
            <StreamTile
              user={localParticipant}
              stream={localVideoStream}
              isLocal={true}
              isSpeaking={isSpeaking}
              isMuted={isMuted}
            />

            {otherParticipants.map((peer) => (
              <StreamTile
                key={peer.id}
                user={peer}
                stream={remoteStreams[peer.id]}
                isLocal={false}
                isSpeaking={peer.isSpeaking}
                isMuted={peer.isMuted}
                volume={peerVolumes[peer.id] ?? 1}
                onVolumeChange={(vol) => handleVolumeChange(peer.id, vol)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating Soundboard Drawer */}
      {showSoundboard && (
        <div className="absolute bottom-24 right-6 bg-[#181B26] p-3.5 rounded-2xl border border-[#2D3348] shadow-2xl z-30 w-64 animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#232736]">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#6366F1]" /> Ses Tahtası (Soundboard)
            </span>
            <span className="text-[10px] text-[#949ba4]">Odadakiler duyar</span>
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            {SOUNDBOARD_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onTriggerSoundboard?.(item.id);
                }}
                className="flex items-center justify-between p-2 rounded-xl bg-[#11131B] hover:bg-[#6366F1] hover:text-white text-xs font-semibold text-[#dbdee1] transition-all cursor-pointer group"
              >
                <span>{item.name}</span>
                <span className="text-[10px] text-[#949ba4] group-hover:text-white/80">{item.desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* In-Call Controls Floating Bottom Bar */}
      <div className="p-4 flex items-center justify-center shrink-0">
        <div className="bg-[#181B26]/95 backdrop-blur-md px-5 py-2.5 rounded-2xl flex items-center gap-3 border border-[#2D3348] shadow-2xl">
          {/* Mute Button */}
          <button
            onClick={onToggleMute}
            title={isMuted ? 'Mikrofonu Aç' : 'Mikrofonu Kapat'}
            className={`p-3 rounded-full transition-all cursor-pointer ${
              isMuted
                ? 'bg-[#EF4444] text-white hover:bg-[#DC2626]'
                : 'bg-[#11131B] hover:bg-[#232736] text-white'
            }`}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <MicOff className="w-5 h-5 opacity-0 absolute" />}
            {!isMuted && <Volume2 className="w-5 h-5" />}
          </button>

          {/* Camera Button */}
          <button
            onClick={onToggleCamera}
            title={isCameraOn ? 'Kamerayı Kapat' : 'Kamerayı Aç'}
            className={`p-3 rounded-full transition-all cursor-pointer ${
              isCameraOn
                ? 'bg-[#10B981] text-white hover:bg-[#059669]'
                : 'bg-[#11131B] hover:bg-[#232736] text-white'
            }`}
          >
            {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          {/* Screen Share Button */}
          <button
            onClick={onToggleScreenShare}
            title={isScreenSharing ? 'Ekran Paylaşımını Durdur' : 'Ekranını Paylaş'}
            className={`p-3 rounded-full transition-all cursor-pointer ${
              isScreenSharing
                ? 'bg-[#6366F1] text-white hover:bg-[#4F46E5] ring-2 ring-[#6366F1]/50'
                : 'bg-[#11131B] hover:bg-[#232736] text-white'
            }`}
          >
            <Monitor className="w-5 h-5" />
          </button>

          {/* End Call Button */}
          <button
            onClick={onLeaveVoice}
            title="Aramadan Ayrıl"
            className="p-3 bg-[#EF4444] hover:bg-[#DC2626] text-white rounded-full transition-all shadow-md cursor-pointer ml-2"
          >
            <PhoneOff className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
