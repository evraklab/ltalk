import React, { useEffect, useRef } from 'react';

/**
 * GlobalAudioPlayer stays mounted at root level.
 * Guarantees voice chat continues uninterrupted indefinitely,
 * even when tabs lose focus, users navigate text channels, or browse elsewhere.
 */
function SinglePeerAudio({ stream, isDeafened, volume = 1 }) {
  const audioRef = useRef(null);

  useEffect(() => {
    const el = audioRef.current;
    if (!el || !stream) return;

    if (el.srcObject !== stream) {
      el.srcObject = stream;
    }
    el.volume = Math.max(0, Math.min(1, volume));
    el.muted = isDeafened;
    el.play().catch(() => {});

    // Background power saving protection: if browser tries to pause audio in background, resume it
    const handlePause = () => {
      if (!isDeafened) {
        el.play().catch(() => {});
      }
    };

    el.addEventListener('pause', handlePause);
    return () => {
      el.removeEventListener('pause', handlePause);
    };
  }, [stream, isDeafened, volume]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isDeafened;
    }
  }, [isDeafened]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, volume));
    }
  }, [volume]);

  return <audio ref={audioRef} autoPlay playsInline />;
}

export default function GlobalAudioPlayer({ remoteStreams = {}, isDeafened = false, peerVolumes = {} }) {
  return (
    <div style={{ display: 'none' }} aria-hidden="true">
      {Object.entries(remoteStreams).map(([peerId, stream]) => (
        <SinglePeerAudio
          key={peerId}
          stream={stream}
          isDeafened={isDeafened}
          volume={peerVolumes[peerId] ?? 1}
        />
      ))}
    </div>
  );
}
