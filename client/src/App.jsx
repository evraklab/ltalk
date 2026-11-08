import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import ServerRail from './components/ServerRail';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import VoiceRoomView from './components/VoiceRoomView';
import MemberList from './components/MemberList';
import SettingsModal from './components/SettingsModal';
import GlobalAudioPlayer from './components/GlobalAudioPlayer';
import AuthModal from './components/AuthModal';
import FriendsView from './components/FriendsView';
import CreateServerModal from './components/CreateServerModal';
import InviteFriendModal from './components/InviteFriendModal';
import CreateChannelModal from './components/CreateChannelModal';
import AdminPanelModal from './components/AdminPanelModal';
import { useWebRTC } from './hooks/useWebRTC';
import {
  playJoinSound,
  playLeaveSound,
  playMuteSound,
  playMessageSound,
  playSoundboardSound
} from './utils/soundEffects';
import { Volume2, ArrowRight, Mic, MicOff, PhoneOff, Sparkles, Check, X } from 'lucide-react';

export default function App() {
  const [socket, setSocket] = useState(null);

  // Authenticated user state
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('itown_user_session');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return null;
  });

  // Servers and Channels
  const [servers, setServers] = useState([]);
  const [activeServerId, setActiveServerId] = useState('s-main');
  const [activeTextChannel, setActiveTextChannel] = useState('');
  const [activeVoiceChannel, setActiveVoiceChannel] = useState(null);
  const [messages, setMessages] = useState({});
  const [voiceRooms, setVoiceRooms] = useState({});

  // Friends & Social System
  const [isFriendsViewActive, setIsFriendsViewActive] = useState(false);
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [invites, setInvites] = useState([]);

  // Modals
  const [isCreateServerOpen, setIsCreateServerOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
  const [createChannelType, setCreateChannelType] = useState('text');
  const [inviteFriendTarget, setInviteFriendTarget] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [currentView, setCurrentView] = useState('chat'); // 'chat' or 'voice'
  const [peerVolumes, setPeerVolumes] = useState({});

  // WebRTC custom hook
  const {
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
  } = useWebRTC(socket, currentUser, activeVoiceChannel);

  // Initialize Socket.io connection with keepalive and reconnection
  useEffect(() => {
    const newSocket = io({
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000
    });
    setSocket(newSocket);

    // Heartbeat ping every 7 seconds
    const heartbeatInterval = setInterval(() => {
      if (newSocket.connected) {
        newSocket.emit('heartbeat');
      }
    }, 7000);

    newSocket.on('connect', () => {
      const saved = localStorage.getItem('itown_user_session');
      if (saved) {
        try {
          const userObj = JSON.parse(saved);
          newSocket.emit('auth:restore', { userId: userObj.id }, (res) => {
            if (res?.success) {
              applyFullState(res);
            }
          });
        } catch {}
      }
    });

    // Real-time friend list & request updates
    newSocket.on('friend:list-updated', ({ friends: newFriends, friendRequests: newReqs }) => {
      if (newFriends) setFriends(newFriends);
      if (newReqs) setFriendRequests(newReqs);
    });

    newSocket.on('friend:request-received', ({ from }) => {
      setFriendRequests(prev => [...prev, { id: `req-${Date.now()}`, fromUserId: from.id, sender: from }]);
      playMessageSound();
    });

    // Real-time server invites
    newSocket.on('server:invite-received', (invite) => {
      setInvites(prev => [...prev.filter(i => i.id !== invite.id), invite]);
      playMessageSound();
    });

    newSocket.on('server:list-updated', ({ servers: newServers, invites: newInvites }) => {
      if (newServers) setServers(newServers);
      if (newInvites) setInvites(newInvites);
    });

    newSocket.on('server:channels-updated', ({ serverId, channels: newChannels }) => {
      setServers(prev => prev.map(s => (s.id === serverId ? { ...s, channels: newChannels } : s)));
    });

    newSocket.on('voice:rooms-updated', (updatedVoiceRooms) => {
      setVoiceRooms(updatedVoiceRooms);
    });

    // Chat messages
    newSocket.on('chat:new-message', ({ channelId, message }) => {
      setMessages(prev => ({
        ...prev,
        [channelId]: [...(prev[channelId] || []), message]
      }));

      if (message.senderId !== newSocket.id && message.senderId !== 'system') {
        playMessageSound();
      }
    });

    // Soundboard
    newSocket.on('voice:soundboard-play', ({ soundId }) => {
      playSoundboardSound(soundId);
    });

    return () => {
      clearInterval(heartbeatInterval);
      newSocket.disconnect();
    };
  }, []);

  function applyFullState(data) {
    if (data.user) {
      setCurrentUser(data.user);
      localStorage.setItem('itown_user_session', JSON.stringify(data.user));
    }
    if (data.servers) {
      setServers(data.servers);
      const firstServer = data.servers[0];
      if (firstServer) {
        setActiveServerId(firstServer.id);
        const firstText = firstServer.channels.find(c => c.type === 'text');
        if (firstText) setActiveTextChannel(firstText.id);
      }
    }
    if (data.friends) setFriends(data.friends);
    if (data.friendRequests) setFriendRequests(data.friendRequests);
    if (data.invites) setInvites(data.invites);
    if (data.voiceRooms) setVoiceRooms(data.voiceRooms);
  }

  // Auth: Login
  const handleLogin = (credentials, callback) => {
    socket?.emit('auth:login', credentials, (res) => {
      if (res?.success) {
        applyFullState(res);
      }
      callback?.(res);
    });
  };

  // Auth: Register
  const handleRegister = (userData, callback) => {
    socket?.emit('auth:register', userData, (res) => {
      if (res?.success) {
        applyFullState(res);
      }
      callback?.(res);
    });
  };

  // Auth: Logout
  const handleLogout = () => {
    localStorage.removeItem('itown_user_session');
    setCurrentUser(null);
    setServers([]);
    setFriends([]);
    setFriendRequests([]);
    setInvites([]);
    if (activeVoiceChannel) {
      leaveVoiceChannel();
      setActiveVoiceChannel(null);
    }
  };

  // Select a Server
  const handleSelectServer = (serverId) => {
    setIsFriendsViewActive(false);
    setActiveServerId(serverId);

    const s = servers.find(x => x.id === serverId);
    if (s && s.channels) {
      const firstText = s.channels.find(c => c.type === 'text');
      if (firstText) {
        setActiveTextChannel(firstText.id);
        setCurrentView('chat');
      }
    }
  };

  // Create Server
  const handleCreateServer = ({ name, icon }) => {
    socket?.emit('server:create', { name, icon }, (res) => {
      if (res?.success) {
        setServers(res.servers);
        handleSelectServer(res.server.id);
      } else if (res?.error) {
        alert(res.error);
      }
    });
  };

  // Send Server Invite to Friend
  const handleSendInvite = ({ serverId, targetUserId }, callback) => {
    socket?.emit('server:invite-friend', { serverId, targetUserId }, callback);
  };

  // Respond to Server Invite
  const handleRespondInvite = (inviteId, action) => {
    socket?.emit('server:respond-invite', { inviteId, action }, (res) => {
      if (res?.success && action === 'accept') {
        setInvites(prev => prev.filter(i => i.id !== inviteId));
        handleSelectServer(res.serverId);
      } else {
        setInvites(prev => prev.filter(i => i.id !== inviteId));
      }
    });
  };

  // Create Channel in current server
  const handleCreateChannel = ({ name, type, description }) => {
    if (!activeServerId) return;
    socket?.emit('channel:create', { serverId: activeServerId, name, type, description }, (res) => {
      if (res?.success) {
        if (type === 'text') {
          setActiveTextChannel(res.channel.id);
          setCurrentView('chat');
        } else {
          handleJoinVoiceChannel(res.channel.id);
        }
      } else if (res?.error) {
        alert(res.error);
      }
    });
  };

  // Friend Request
  const handleSendFriendRequest = (targetQuery, callback) => {
    socket?.emit('friend:send-request', { targetQuery }, callback);
  };

  const handleRespondFriendRequest = (fromUserId, action) => {
    socket?.emit('friend:respond-request', { fromUserId, action });
  };

  // Voice Chat
  const handleJoinVoiceChannel = (channelId) => {
    if (activeVoiceChannel === channelId) {
      setCurrentView('voice');
      return;
    }
    playJoinSound();
    setActiveVoiceChannel(channelId);
    setCurrentView('voice');
    joinVoiceChannel(channelId);
  };

  const handleLeaveVoiceChannel = () => {
    playLeaveSound();
    leaveVoiceChannel();
    setActiveVoiceChannel(null);
    setCurrentView('chat');
  };

  const handleToggleMute = () => {
    const newMuted = toggleMute();
    playMuteSound(newMuted);
  };

  const handleToggleDeafen = () => {
    const newDeafened = toggleDeafen();
    playMuteSound(newDeafened);
  };

  const handleTriggerSoundboard = (soundId) => {
    playSoundboardSound(soundId);
    socket?.emit('voice:soundboard', { soundId });
  };

  const handleSendMessage = ({ channelId, text, image }) => {
    if (!socket || !channelId) return;
    socket.emit('chat:send-message', {
      channelId,
      text,
      image
    });
  };

  // Active server & channel objects
  const activeServer = servers.find(s => s.id === activeServerId) || servers[0];
  const activeChannels = activeServer ? (activeServer.channels || []) : [];
  const activeTextObj = activeChannels.find(c => c.id === activeTextChannel);

  // Find voice channel object across all servers
  let activeVoiceObj = null;
  servers.forEach(s => {
    const found = (s.channels || []).find(c => c.id === activeVoiceChannel);
    if (found) activeVoiceObj = found;
  });

  const activeVoiceParticipants = activeVoiceChannel ? (voiceRooms[activeVoiceChannel] || []) : [];

  // If not logged in, show AuthModal
  if (!currentUser) {
    return (
      <div className="flex h-screen w-screen overflow-hidden bg-[#0F1117] text-[#dbdee1]">
        <AuthModal onLogin={handleLogin} onRegister={handleRegister} />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0F1117] text-[#dbdee1]">
      <GlobalAudioPlayer
        remoteStreams={remoteStreams}
        isDeafened={isDeafened}
        peerVolumes={peerVolumes}
      />

      {/* 1. Leftmost Server Rail */}
      <ServerRail
        servers={servers}
        activeServerId={activeServerId}
        isFriendsViewActive={isFriendsViewActive}
        pendingInvitesCount={invites.length}
        pendingFriendRequestsCount={friendRequests.length}
        onSelectServer={handleSelectServer}
        onOpenFriendsView={() => setIsFriendsViewActive(true)}
        onOpenCreateServer={() => setIsCreateServerOpen(true)}
      />

      {/* 2. Desktop Sidebar */}
      <div className="hidden md:flex h-full shrink-0">
        <Sidebar
          server={activeServer}
          channels={activeChannels}
          activeTextChannel={activeTextChannel}
          activeVoiceChannel={activeVoiceChannel}
          voiceRooms={voiceRooms}
          currentUser={currentUser}
          invites={invites}
          isMuted={isMuted}
          isDeafened={isDeafened}
          onSelectTextChannel={(id) => {
            setActiveTextChannel(id);
            setCurrentView('chat');
          }}
          onJoinVoiceChannel={handleJoinVoiceChannel}
          onLeaveVoiceChannel={handleLeaveVoiceChannel}
          onToggleMute={handleToggleMute}
          onToggleDeafen={handleToggleDeafen}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenInviteModal={() => {
            setInviteFriendTarget(null);
            setIsInviteModalOpen(true);
          }}
          onOpenCreateChannel={(type) => {
            setCreateChannelType(type);
            setIsCreateChannelOpen(true);
          }}
          onOpenAdminPanel={() => setIsAdminPanelOpen(true)}
          onRespondInvite={handleRespondInvite}
          onLogout={handleLogout}
        />
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative flex h-full z-10 animate-in slide-in-from-left duration-200 shadow-2xl">
            <Sidebar
              server={activeServer}
              channels={activeChannels}
              activeTextChannel={activeTextChannel}
              activeVoiceChannel={activeVoiceChannel}
              voiceRooms={voiceRooms}
              currentUser={currentUser}
              invites={invites}
              isMuted={isMuted}
              isDeafened={isDeafened}
              onSelectTextChannel={(id) => {
                setActiveTextChannel(id);
                setCurrentView('chat');
                setIsMobileMenuOpen(false);
              }}
              onJoinVoiceChannel={(id) => {
                handleJoinVoiceChannel(id);
                setIsMobileMenuOpen(false);
              }}
              onLeaveVoiceChannel={() => {
                handleLeaveVoiceChannel();
                setIsMobileMenuOpen(false);
              }}
              onToggleMute={handleToggleMute}
              onToggleDeafen={handleToggleDeafen}
              onOpenSettings={() => {
                setIsSettingsOpen(true);
                setIsMobileMenuOpen(false);
              }}
              onOpenInviteModal={() => {
                setInviteFriendTarget(null);
                setIsInviteModalOpen(true);
                setIsMobileMenuOpen(false);
              }}
              onOpenCreateChannel={(type) => {
                setCreateChannelType(type);
                setIsCreateChannelOpen(true);
                setIsMobileMenuOpen(false);
              }}
              onOpenAdminPanel={() => {
                setIsAdminPanelOpen(true);
                setIsMobileMenuOpen(false);
              }}
              onRespondInvite={handleRespondInvite}
              onLogout={handleLogout}
            />
          </div>
        </div>
      )}

      {/* 3. Center Main View: Friends View OR Server Channels */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Active Voice Status Bar while navigating text chat */}
        {activeVoiceChannel && currentView === 'chat' && (
          <div className="bg-[#111827] border-b border-[#1F2937] text-white px-4 py-2 flex items-center justify-between shadow-lg shrink-0 z-10 animate-in slide-in-from-top duration-200">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${isSpeaking ? 'bg-[#10B981] animate-ping' : 'bg-[#10B981]'}`} />
                <Volume2 className="w-4 h-4 text-[#10B981]" />
                <span className="text-xs font-bold">{activeVoiceObj?.name}</span>
              </div>
              <span className="text-[11px] text-[#9CA3AF] hidden sm:inline">
                (Metin kanalındasınız, sesiniz gitmeye ve odadakileri duymaya devam ediyorsunuz)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleMute}
                title={isMuted ? 'Mikrofonu Aç' : 'Yazarken Sesim Gitmesin (Mikrofonu Kapat)'}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  isMuted ? 'bg-[#EF4444] text-white' : 'bg-[#1F2937] hover:bg-[#374151] text-[#D1D5DB]'
                }`}
              >
                {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                <span className="hidden md:inline">{isMuted ? 'Susturuldu' : 'Mikrofon Açık'}</span>
              </button>

              <button
                onClick={() => setCurrentView('voice')}
                className="flex items-center gap-1.5 bg-[#6366F1] hover:bg-[#4F46E5] px-3 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer text-white shadow-sm"
              >
                <span>Ses & Kamera Ekranı</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={handleLeaveVoiceChannel}
                title="Aramadan Ayrıl"
                className="p-1.5 bg-[#EF4444]/20 hover:bg-[#EF4444] text-[#EF4444] hover:text-white rounded-md transition-colors cursor-pointer"
              >
                <PhoneOff className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* View Selection */}
        {isFriendsViewActive ? (
          <FriendsView
            currentUser={currentUser}
            friends={friends}
            friendRequests={friendRequests}
            servers={servers}
            onSendFriendRequest={handleSendFriendRequest}
            onRespondFriendRequest={handleRespondFriendRequest}
            onOpenInviteModal={(friend) => {
              setInviteFriendTarget(friend);
              setIsInviteModalOpen(true);
            }}
          />
        ) : currentView === 'voice' && activeVoiceChannel ? (
          <VoiceRoomView
            channel={activeVoiceObj}
            participants={activeVoiceParticipants}
            currentUser={currentUser}
            localAudioStream={localAudioStream}
            localVideoStream={localVideoStream}
            localScreenStream={localScreenStream}
            remoteStreams={remoteStreams}
            remoteScreenStreams={remoteScreenStreams}
            isMuted={isMuted}
            isDeafened={isDeafened}
            isCameraOn={isCameraOn}
            isScreenSharing={isScreenSharing}
            isSpeaking={isSpeaking}
            onToggleMute={handleToggleMute}
            onToggleCamera={toggleCamera}
            onToggleScreenShare={toggleScreenShare}
            onLeaveVoice={handleLeaveVoiceChannel}
            onTriggerSoundboard={handleTriggerSoundboard}
            onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
          />
        ) : (
          <ChatArea
            channel={activeTextObj}
            messages={messages[activeTextChannel] || []}
            currentUser={currentUser}
            activeVoiceChannel={activeVoiceChannel}
            voiceRooms={voiceRooms}
            onSendMessage={handleSendMessage}
            onOpenSettings={() => {
              setInviteFriendTarget(null);
              setIsInviteModalOpen(true);
            }}
            onJoinVoice={handleJoinVoiceChannel}
            onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
          />
        )}
      </div>

      {/* 4. Rightmost Member List (only in servers) */}
      {!isFriendsViewActive && (
        <MemberList users={friends.filter(f => f.isOnline)} currentUser={currentUser} />
      )}

      {/* MODALS */}
      <CreateServerModal
        isOpen={isCreateServerOpen}
        onClose={() => setIsCreateServerOpen(false)}
        onCreateServer={handleCreateServer}
      />

      <InviteFriendModal
        isOpen={isInviteModalOpen}
        onClose={() => {
          setIsInviteModalOpen(false);
          setInviteFriendTarget(null);
        }}
        servers={servers}
        activeServerId={activeServerId}
        friends={friends}
        preselectedFriend={inviteFriendTarget}
        onSendInvite={handleSendInvite}
      />

      <CreateChannelModal
        isOpen={isCreateChannelOpen}
        onClose={() => setIsCreateChannelOpen(false)}
        serverName={activeServer?.name || 'Sunucu'}
        onCreateChannel={handleCreateChannel}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentUser={currentUser}
        onSave={(data) => {
          setCurrentUser(prev => ({ ...prev, ...data }));
          localStorage.setItem('itown_user_session', JSON.stringify({ ...currentUser, ...data }));
        }}
        noiseSuppressionEnabled={noiseSuppressionEnabled}
        onToggleNoiseSuppression={toggleNoiseSuppression}
      />

      <AdminPanelModal
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
        socket={socket}
        currentUser={currentUser}
      />
    </div>
  );
}
