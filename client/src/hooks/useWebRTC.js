import { useState, useRef, useEffect, useCallback } from 'react';

const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
    { urls: 'stun:stun.services.mozilla.com' }
  ]
};

export function useWebRTC(socket, currentUser, activeVoiceChannel) {
  // Remote streams: map of userId -> MediaStream
  const [remoteStreams, setRemoteStreams] = useState({});
  // Remote screen streams: map of userId -> MediaStream
  const [remoteScreenStreams, setRemoteScreenStreams] = useState({});

  // Local media streams
  const [localAudioStream, setLocalAudioStream] = useState(null);
  const [localVideoStream, setLocalVideoStream] = useState(null);
  const [localScreenStream, setLocalScreenStream] = useState(null);

  // States
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [noiseSuppressionEnabled, setNoiseSuppressionEnabled] = useState(true);

  // Peer connections: map of userId -> RTCPeerConnection
  const peerConnectionsRef = useRef(new Map());
  const pendingCandidatesRef = useRef(new Map());

  // Web Audio Processing references for Noise Gate & Suppression
  const audioContextRef = useRef(null);
  const rawMicrophoneStreamRef = useRef(null);
  const processedStreamRef = useRef(null);

  // References to keep latest values in socket event listeners
  const localAudioStreamRef = useRef(null);
  const localVideoStreamRef = useRef(null);
  const localScreenStreamRef = useRef(null);
  const activeVoiceChannelRef = useRef(activeVoiceChannel);
  const isMutedRef = useRef(isMuted);

  useEffect(() => {
    activeVoiceChannelRef.current = activeVoiceChannel;
  }, [activeVoiceChannel]);

  useEffect(() => {
    localAudioStreamRef.current = localAudioStream;
  }, [localAudioStream]);

  useEffect(() => {
    localVideoStreamRef.current = localVideoStream;
  }, [localVideoStream]);

  useEffect(() => {
    localScreenStreamRef.current = localScreenStream;
  }, [localScreenStream]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // NAT & AudioContext Keep-Alive Loop: prevents router drop & mobile tab suspend
  useEffect(() => {
    const keepaliveTimer = setInterval(() => {
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().catch(() => {});
      }
    }, 7000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume().catch(() => {});
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(keepaliveTimer);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  /**
   * Builds an advanced Web Audio API noise reduction graph:
   * rawMic -> Highpass Filter (cuts 0-85Hz low rumbling, fan & desk vibrations)
   *        -> Lowpass Filter (cuts >8500Hz high pitched hiss)
   *        -> DynamicsCompressor (smooths peaks and levels background noise)
   *        -> AnalyserNode (voice detection & speaking indicator)
   *        -> MediaStreamDestination (crystal clean outgoing audio for WebRTC)
   */
  const createProcessedAudioStream = useCallback((rawStream, enableFilters = true) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx({ sampleRate: 48000 });
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(rawStream);
      const destination = ctx.createMediaStreamDestination();

      if (enableFilters) {
        // 1. Highpass filter to eliminate low frequency ambient noise (fans, bumps)
        const highpass = ctx.createBiquadFilter();
        highpass.type = 'highpass';
        highpass.frequency.setValueAtTime(85, ctx.currentTime);
        highpass.Q.setValueAtTime(0.7, ctx.currentTime);

        // 2. Lowpass filter to cut high frequency electronic hiss
        const lowpass = ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.setValueAtTime(8500, ctx.currentTime);
        lowpass.Q.setValueAtTime(0.7, ctx.currentTime);

        // 3. Dynamics Compressor (studio style noise leveller)
        const compressor = ctx.createDynamicsCompressor();
        compressor.threshold.setValueAtTime(-28, ctx.currentTime);
        compressor.knee.setValueAtTime(30, ctx.currentTime);
        compressor.ratio.setValueAtTime(10, ctx.currentTime);
        compressor.attack.setValueAtTime(0.003, ctx.currentTime);
        compressor.release.setValueAtTime(0.25, ctx.currentTime);

        source.connect(highpass);
        highpass.connect(lowpass);
        lowpass.connect(compressor);
        compressor.connect(destination);
      } else {
        source.connect(destination);
      }

      // Analyser for speaking indicator
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.3;
      source.connect(analyser);

      return {
        stream: destination.stream,
        analyser,
        ctx
      };
    } catch (err) {
      console.warn('Web Audio DSP graph fallback to raw stream:', err);
      return { stream: rawStream, analyser: null, ctx: null };
    }
  }, []);

  // Speaking indicator detector with Web Audio API (Runs continuously in background)
  useEffect(() => {
    if (!localAudioStream) return;

    let audioContext;
    let analyser;
    let microphone;
    let animationFrameId;
    let speakingTimeout;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      audioContext = new AudioCtx();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.4;

      microphone = audioContext.createMediaStreamSource(localAudioStream);
      microphone.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkVolume = () => {
        if (isMutedRef.current) {
          setIsSpeaking(false);
          socket?.emit('user:update-state', { isSpeaking: false });
          animationFrameId = requestAnimationFrame(checkVolume);
          return;
        }

        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;

        // Threshold for human voice (ignores silent room noise)
        if (average > 18) {
          setIsSpeaking(true);
          socket?.emit('user:update-state', { isSpeaking: true });
          clearTimeout(speakingTimeout);
          speakingTimeout = setTimeout(() => {
            setIsSpeaking(false);
            socket?.emit('user:update-state', { isSpeaking: false });
          }, 350);
        }

        animationFrameId = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (e) {
      console.warn('Audio analyser error:', e);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearTimeout(speakingTimeout);
      if (microphone) microphone.disconnect();
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close();
      }
    };
  }, [localAudioStream, socket]);

  // Helper to add all current local tracks to a peer connection
  const addLocalTracksToPC = (pc) => {
    if (localAudioStreamRef.current) {
      localAudioStreamRef.current.getAudioTracks().forEach(track => {
        pc.addTrack(track, localAudioStreamRef.current);
      });
    }

    if (localVideoStreamRef.current) {
      localVideoStreamRef.current.getVideoTracks().forEach(track => {
        pc.addTrack(track, localVideoStreamRef.current);
      });
    }

    if (localScreenStreamRef.current) {
      localScreenStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localScreenStreamRef.current);
      });
    }
  };

  // Helper to renegotiate all peer connections when a track is added/removed
  const renegotiateAllPeers = useCallback(async () => {
    for (const [peerId, pc] of peerConnectionsRef.current.entries()) {
      try {
        if (pc.signalingState !== 'stable') {
          continue;
        }
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket?.emit('webrtc:signal', {
          targetUserId: peerId,
          signal: offer,
          type: 'offer'
        });
      } catch (err) {
        console.error(`Error renegotiating with ${peerId}:`, err);
      }
    }
  }, [socket]);

  // Create Peer Connection for a specific user
  const createPeerConnection = useCallback((targetUserId, isInitiator) => {
    if (peerConnectionsRef.current.has(targetUserId)) {
      return peerConnectionsRef.current.get(targetUserId);
    }

    const pc = new RTCPeerConnection(RTC_CONFIG);
    peerConnectionsRef.current.set(targetUserId, pc);

    addLocalTracksToPC(pc);

    // Keep UDP NAT pinhole open in routers
    try {
      pc.createDataChannel('keepalive', { ordered: false, maxRetransmits: 0 });
    } catch {}

    pc.ondatachannel = (e) => {
      e.channel.onmessage = () => {};
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket?.emit('webrtc:signal', {
          targetUserId,
          signal: event.candidate,
          type: 'candidate'
        });
      }
    };

    pc.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (!remoteStream) return;

      const track = event.track;

      // Identify whether this track is from a Screen Share or Webcam
      const isScreenTrack =
        Boolean(track.getSettings && track.getSettings().displaySurface) ||
        track.label.toLowerCase().includes('screen') ||
        track.label.toLowerCase().includes('window') ||
        track.label.toLowerCase().includes('display') ||
        track.label.toLowerCase().includes('tab');

      if (track.kind === 'video') {
        if (isScreenTrack) {
          setRemoteScreenStreams(prev => {
            const currentStream = prev[targetUserId] || new MediaStream();
            const exists = currentStream.getVideoTracks().some(t => t.id === track.id);
            if (!exists) {
              currentStream.addTrack(track);
            }
            return { ...prev, [targetUserId]: currentStream };
          });
        } else {
          setRemoteStreams(prev => {
            const currentStream = prev[targetUserId] || new MediaStream();
            const exists = currentStream.getVideoTracks().some(t => t.id === track.id);
            if (!exists) {
              currentStream.addTrack(track);
            }
            return { ...prev, [targetUserId]: currentStream };
          });
        }
      } else if (track.kind === 'audio') {
        setRemoteStreams(prev => {
          const currentStream = prev[targetUserId] || new MediaStream();
          const exists = currentStream.getAudioTracks().some(t => t.id === track.id);
          if (!exists) {
            currentStream.addTrack(track);
          }
          return { ...prev, [targetUserId]: currentStream };
        });
      }

      track.onended = () => {
        if (isScreenTrack) {
          setRemoteScreenStreams(prev => {
            const next = { ...prev };
            delete next[targetUserId];
            return next;
          });
        }
      };
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        cleanupPeer(targetUserId);
      }
    };

    if (isInitiator) {
      pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true })
        .then(offer => pc.setLocalDescription(offer))
        .then(() => {
          socket?.emit('webrtc:signal', {
            targetUserId,
            signal: pc.localDescription,
            type: 'offer'
          });
        })
        .catch(err => console.error('Error creating offer:', err));
    }

    return pc;
  }, [socket]);

  const cleanupPeer = useCallback((userId) => {
    const pc = peerConnectionsRef.current.get(userId);
    if (pc) {
      pc.close();
      peerConnectionsRef.current.delete(userId);
    }
    pendingCandidatesRef.current.delete(userId);
    setRemoteStreams(prev => {
      const next = { ...prev };
      delete next[userId];
      return next;
    });
    setRemoteScreenStreams(prev => {
      const next = { ...prev };
      delete next[userId];
      return next;
    });
  }, []);

  const cleanupAll = useCallback(() => {
    peerConnectionsRef.current.forEach((pc) => pc.close());
    peerConnectionsRef.current.clear();
    pendingCandidatesRef.current.clear();
    setRemoteStreams({});
    setRemoteScreenStreams({});

    if (rawMicrophoneStreamRef.current) {
      rawMicrophoneStreamRef.current.getTracks().forEach(t => t.stop());
      rawMicrophoneStreamRef.current = null;
    }
    if (localAudioStreamRef.current) {
      localAudioStreamRef.current.getTracks().forEach(t => t.stop());
      setLocalAudioStream(null);
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (localVideoStreamRef.current) {
      localVideoStreamRef.current.getTracks().forEach(t => t.stop());
      setLocalVideoStream(null);
      setIsCameraOn(false);
    }
    if (localScreenStreamRef.current) {
      localScreenStreamRef.current.getTracks().forEach(t => t.stop());
      setLocalScreenStream(null);
      setIsScreenSharing(false);
    }
    setIsSpeaking(false);
  }, []);

  // WebRTC socket signaling
  useEffect(() => {
    if (!socket) return;

    const handleRoomUsers = ({ users: existingUsers }) => {
      existingUsers.forEach(peer => {
        if (peer.id !== socket.id) {
          createPeerConnection(peer.id, true);
        }
      });
    };

    const handleSignal = async ({ senderUserId, signal, type }) => {
      let pc = peerConnectionsRef.current.get(senderUserId);

      if (type === 'offer') {
        if (!pc) {
          pc = createPeerConnection(senderUserId, false);
        }
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(signal));
          const pending = pendingCandidatesRef.current.get(senderUserId) || [];
          for (const cand of pending) {
            await pc.addIceCandidate(new RTCIceCandidate(cand));
          }
          pendingCandidatesRef.current.delete(senderUserId);

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          socket.emit('webrtc:signal', {
            targetUserId: senderUserId,
            signal: answer,
            type: 'answer'
          });
        } catch (err) {
          console.error('Error handling offer:', err);
        }
      } else if (type === 'answer') {
        if (pc) {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(signal));
            const pending = pendingCandidatesRef.current.get(senderUserId) || [];
            for (const cand of pending) {
              await pc.addIceCandidate(new RTCIceCandidate(cand));
            }
            pendingCandidatesRef.current.delete(senderUserId);
          } catch (err) {
            console.error('Error handling answer:', err);
          }
        }
      } else if (type === 'candidate') {
        if (pc && pc.remoteDescription && pc.remoteDescription.type) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(signal));
          } catch (err) {
            console.error('Error adding ICE candidate:', err);
          }
        } else {
          const list = pendingCandidatesRef.current.get(senderUserId) || [];
          list.push(signal);
          pendingCandidatesRef.current.set(senderUserId, list);
        }
      }
    };

    const handlePeerLeft = ({ userId }) => {
      cleanupPeer(userId);
    };

    socket.on('voice:room-users', handleRoomUsers);
    socket.on('webrtc:signal', handleSignal);
    socket.on('voice:peer-left', handlePeerLeft);

    return () => {
      socket.off('voice:room-users', handleRoomUsers);
      socket.off('webrtc:signal', handleSignal);
      socket.off('voice:peer-left', handlePeerLeft);
    };
  }, [socket, createPeerConnection, cleanupPeer]);

  // Join Voice Channel with Hardware & Software Noise Suppression
  const joinVoiceChannel = async (channelId) => {
    if (activeVoiceChannelRef.current === channelId) return;

    cleanupAll();

    try {
      // 1. Hardware & Driver Level Noise Suppression constraints
      const rawAudioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: { ideal: true },
          noiseSuppression: { ideal: true },
          autoGainControl: { ideal: true },
          channelCount: { ideal: 1 },
          sampleRate: { ideal: 48000 }
        },
        video: false
      });

      rawMicrophoneStreamRef.current = rawAudioStream;

      // 2. Software Level Real-Time DSP Audio Processing (Highpass + Lowpass + Compressor)
      const { stream: processedAudioStream } = createProcessedAudioStream(rawAudioStream, noiseSuppressionEnabled);

      setLocalAudioStream(processedAudioStream);
      localAudioStreamRef.current = processedAudioStream;

      socket?.emit('voice:join', { channelId });
      socket?.emit('user:update-state', {
        isMuted: false,
        isDeafened: false,
        isCameraOn: false,
        isScreenSharing: false
      });
      setIsMuted(false);
      setIsDeafened(false);
    } catch (err) {
      console.error('Microphone access denied or error:', err);
      socket?.emit('voice:join', { channelId });
    }
  };

  // Leave Voice Channel
  const leaveVoiceChannel = () => {
    cleanupAll();
    socket?.emit('voice:leave');
    socket?.emit('user:update-state', {
      isMuted: false,
      isDeafened: false,
      isCameraOn: false,
      isScreenSharing: false,
      isSpeaking: false
    });
  };

  // Toggle Microphone Mute
  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    // Mute both raw and processed tracks
    if (localAudioStreamRef.current) {
      localAudioStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !nextMuted;
      });
    }
    if (rawMicrophoneStreamRef.current) {
      rawMicrophoneStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !nextMuted;
      });
    }

    socket?.emit('user:update-state', { isMuted: nextMuted });
    return nextMuted;
  };

  // Toggle Deafen
  const toggleDeafen = () => {
    const nextDeafened = !isDeafened;
    setIsDeafened(nextDeafened);

    if (nextDeafened) {
      setIsMuted(true);
      if (localAudioStreamRef.current) {
        localAudioStreamRef.current.getAudioTracks().forEach(track => {
          track.enabled = false;
        });
      }
      socket?.emit('user:update-state', { isDeafened: true, isMuted: true });
    } else {
      socket?.emit('user:update-state', { isDeafened: false });
    }
    return nextDeafened;
  };

  // Toggle Camera
  const toggleCamera = async () => {
    if (isCameraOn) {
      if (localVideoStreamRef.current) {
        localVideoStreamRef.current.getTracks().forEach(t => {
          t.stop();
          peerConnectionsRef.current.forEach(pc => {
            const senders = pc.getSenders();
            const sender = senders.find(s => s.track === t);
            if (sender) pc.removeTrack(sender);
          });
        });
      }
      setLocalVideoStream(null);
      localVideoStreamRef.current = null;
      setIsCameraOn(false);
      socket?.emit('user:update-state', { isCameraOn: false });
      renegotiateAllPeers();
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { max: 30 } },
          audio: false
        });
        setLocalVideoStream(stream);
        localVideoStreamRef.current = stream;
        setIsCameraOn(true);
        socket?.emit('user:update-state', { isCameraOn: true });

        const videoTrack = stream.getVideoTracks()[0];
        peerConnectionsRef.current.forEach(pc => {
          pc.addTrack(videoTrack, stream);
        });
        renegotiateAllPeers();
      } catch (err) {
        console.error('Camera access failed:', err);
        alert('Kamera erişimine izin verilmedi veya kamera bulunamadı.');
      }
    }
  };

  // Toggle Screen Sharing
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (localScreenStreamRef.current) {
        localScreenStreamRef.current.getTracks().forEach(t => {
          t.stop();
          peerConnectionsRef.current.forEach(pc => {
            const senders = pc.getSenders();
            const sender = senders.find(s => s.track === t);
            if (sender) pc.removeTrack(sender);
          });
        });
      }
      setLocalScreenStream(null);
      localScreenStreamRef.current = null;
      setIsScreenSharing(false);
      socket?.emit('user:update-state', { isScreenSharing: false });
      renegotiateAllPeers();
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: 'always',
            frameRate: { ideal: 30, max: 30 },
            width: { ideal: 1920, max: 1920 },
            height: { ideal: 1080, max: 1080 }
          },
          audio: true
        });

        // W3C hint to WebRTC engine: optimize for detail and text clarity
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.contentHint = 'detail';
        }

        stream.getVideoTracks()[0].onended = () => {
          setLocalScreenStream(null);
          localScreenStreamRef.current = null;
          setIsScreenSharing(false);
          socket?.emit('user:update-state', { isScreenSharing: false });
          renegotiateAllPeers();
        };

        setLocalScreenStream(stream);
        localScreenStreamRef.current = stream;
        setIsScreenSharing(true);
        socket?.emit('user:update-state', { isScreenSharing: true });

        stream.getTracks().forEach(track => {
          peerConnectionsRef.current.forEach(pc => {
            const sender = pc.addTrack(track, stream);
            if (track.kind === 'video' && sender && sender.getParameters) {
              try {
                const params = sender.getParameters();
                params.degradationPreference = 'maintain-resolution';
                sender.setParameters(params);
              } catch {}
            }
          });
        });
        renegotiateAllPeers();
      } catch (err) {
        console.warn('Screen sharing cancelled or error:', err);
      }
    }
  };

  // Toggle Noise Suppression Filter
  const toggleNoiseSuppression = () => {
    const next = !noiseSuppressionEnabled;
    setNoiseSuppressionEnabled(next);
    return next;
  };

  return {
    remoteStreams,
    remoteScreenStreams,
    localAudioStream,
    localVideoStream,
    localScreenStream,
    isMuted,
    isDeafened,
    isCameraOn,
    isScreenSharing,
    isSpeaking,
    noiseSuppressionEnabled,
    joinVoiceChannel,
    leaveVoiceChannel,
    toggleMute,
    toggleDeafen,
    toggleCamera,
    toggleScreenShare,
    toggleNoiseSuppression
  };
}
