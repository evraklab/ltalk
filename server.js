import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data directory & persistent storage file
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const storageFile = path.join(dataDir, 'storage.json');

const DEFAULT_SERVER = {
  id: 's-main',
  name: 'Itown Ana Merkez',
  icon: 'IT',
  ownerId: 'system',
  members: [],
  channels: [
    { id: 'c-general', name: 'genel-sohbet', type: 'text', description: 'Tüm arkadaşların ortak sohbet alanı' },
    { id: 'c-games', name: 'oyun-sohbeti', type: 'text', description: 'Oyun davetleri, klipler ve taktikler' },
    { id: 'c-memes', name: 'makara-medya', type: 'text', description: 'Görseller, capsler ve komik şeyler' },
    { id: 'v-general', name: 'Genel Ses Odası', type: 'voice', description: 'Ana ses odası' },
    { id: 'v-gaming', name: 'Oyun Odası 🎮', type: 'voice', description: 'Oyun oynayanlar için ses kanalı' },
    { id: 'v-chill', name: 'Muhabbet & Müzik 🎧', type: 'voice', description: 'Sessiz ve sakin sohbet köşesi' }
  ]
};

// Application persistent database in memory
let db = {
  users: [],
  servers: [{ ...DEFAULT_SERVER }],
  messages: {
    'c-general': [
      {
        id: 'welcome-1',
        senderId: 'system',
        senderName: 'Itown Bot 🤖',
        senderAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ItownBot',
        senderColor: '#6366F1',
        text: 'Itown Space sistemine hoş geldiniz! Hesabınızı oluşturdunuz. Artık sol taraftan "+" butonuna basarak kendi sunucunuzu açabilir, arkadaşlarınızı davet edebilir ve sesli/görüntülü sohbet başlatabilirsiniz! 🎉',
        timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
      }
    ]
  },
  invites: [] // pending server invites: { id, serverId, serverName, senderId, senderName, targetUserId, timestamp }
};

// Load storage
try {
  if (fs.existsSync(storageFile)) {
    const raw = fs.readFileSync(storageFile, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed.users) db.users = parsed.users;
    if (parsed.servers && parsed.servers.length > 0) db.servers = parsed.servers;
    if (parsed.messages) db.messages = parsed.messages;
    if (parsed.invites) db.invites = parsed.invites;
  }
} catch (e) {
  console.warn('Could not load storage.json, starting with fresh DB:', e.message);
}

function saveStorage() {
  try {
    fs.writeFileSync(storageFile, JSON.stringify(db, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving storage.json:', e);
  }
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password + '_itown_salt_2026').digest('hex');
}

function generateTag(username) {
  let tag = '';
  let exists = true;
  while (exists) {
    tag = Math.floor(1000 + Math.random() * 9000).toString();
    exists = db.users.some(u => u.username.toLowerCase() === username.toLowerCase() && u.tag === tag);
  }
  return tag;
}

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  pingInterval: 8000,
  pingTimeout: 15000,
  upgradeTimeout: 30000,
  maxHttpBufferSize: 1e7 // 10MB
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve static frontend build
const clientDistPath = path.join(__dirname, 'client', 'dist');
app.use(express.static(clientDistPath));

// Live active sessions: socketId -> userId
const socketUserMap = new Map();
// Live active users: userId -> Set of socketIds (supports multi-tab / reconnection)
const userSocketsMap = new Map();

// Live user state: userId -> { isMuted, isDeafened, isCameraOn, isScreenSharing, isSpeaking, currentVoiceChannel, currentServerId }
const userLiveStates = new Map();

// Voice rooms: channelId -> Set of userIds
const voiceRooms = new Map();

function getVoiceRoomsState() {
  const state = {};
  for (const [channelId, userIds] of voiceRooms.entries()) {
    state[channelId] = Array.from(userIds).map(id => {
      const u = db.users.find(x => x.id === id);
      const live = userLiveStates.get(id) || {};
      return u ? { ...formatUserPublic(u), ...live } : null;
    }).filter(Boolean);
  }
  return state;
}

function formatUserPublic(u) {
  const isAdmin = u.username.toLowerCase() === 'fitoz';
  return {
    id: u.id,
    username: u.username,
    tag: u.tag,
    displayName: u.displayName || u.username,
    name: `${u.displayName || u.username}`,
    avatar: u.avatar,
    color: isAdmin ? '#F59E0B' : (u.color || '#6366F1'),
    role: isAdmin ? 'admin' : 'member',
    isAdmin
  };
}

function getUserFullState(userId) {
  const user = db.users.find(u => u.id === userId);
  if (!user) return null;

  // Servers user belongs to
  const userServers = db.servers.filter(s => s.members.includes(userId) || s.ownerId === userId);

  // Friends list with live online status
  const friendsList = (user.friends || []).map(fId => {
    const f = db.users.find(x => x.id === fId);
    if (!f) return null;
    const isOnline = userSocketsMap.has(fId) && (userSocketsMap.get(fId).size > 0);
    const live = userLiveStates.get(fId) || {};
    return {
      ...formatUserPublic(f),
      isOnline,
      currentVoiceChannel: live.currentVoiceChannel || null
    };
  }).filter(Boolean);

  // Pending incoming friend requests
  const pendingFriendRequests = (user.friendRequests || []).map(req => {
    const sender = db.users.find(x => x.id === req.fromUserId);
    return sender ? { ...req, sender: formatUserPublic(sender) } : null;
  }).filter(Boolean);

  // Pending incoming server invites
  const pendingServerInvites = (db.invites || []).filter(inv => inv.targetUserId === userId);

  return {
    user: formatUserPublic(user),
    servers: userServers,
    friends: friendsList,
    friendRequests: pendingFriendRequests,
    invites: pendingServerInvites,
    voiceRooms: getVoiceRoomsState()
  };
}

io.on('connection', (socket) => {
  console.log(`[Socket Connected] ID: ${socket.id}`);

  // 1. REGISTER NEW USER
  socket.on('auth:register', ({ username, password, displayName, avatar, color }, callback) => {
    try {
      if (!username || !password) {
        return callback?.({ error: 'Kullanıcı adı ve şifre zorunludur.' });
      }

      const cleanUsername = username.trim().toLowerCase();
      if (cleanUsername.length < 3 || cleanUsername.length > 20) {
        return callback?.({ error: 'Kullanıcı adı 3 ile 20 karakter arasında olmalıdır.' });
      }

      // Check if exact username#tag match (tags allow same username like Discord, but let's check max duplicates)
      const existingCount = db.users.filter(u => u.username.toLowerCase() === cleanUsername).length;
      if (existingCount >= 100) {
        return callback?.({ error: 'Bu kullanıcı adı çok fazla kullanılmış, lütfen başka bir ad deneyin.' });
      }

      const userId = `u-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
      const tag = generateTag(cleanUsername);

      const newUser = {
        id: userId,
        username: cleanUsername,
        tag,
        displayName: displayName?.trim() || username.trim(),
        passwordHash: hashPassword(password),
        avatar: avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${cleanUsername}`,
        color: color || '#6366F1',
        friends: [],
        friendRequests: [],
        serverIds: ['s-main'],
        createdAt: new Date().toISOString()
      };

      // Add to default main server
      const mainServer = db.servers.find(s => s.id === 's-main');
      if (mainServer && !mainServer.members.includes(userId)) {
        mainServer.members.push(userId);
      }

      db.users.push(newUser);
      saveStorage();

      // Bind session
      bindUserSocket(socket, userId);

      const fullState = getUserFullState(userId);
      callback?.({ success: true, ...fullState });
      broadcastFriendsUpdate(userId);
    } catch (err) {
      console.error('Register error:', err);
      callback?.({ error: 'Kayıt sırasında bir hata oluştu.' });
    }
  });

  // 2. LOGIN USER
  socket.on('auth:login', ({ username, password }, callback) => {
    try {
      if (!username || !password) {
        return callback?.({ error: 'Kullanıcı adı ve şifre gereklidir.' });
      }

      const cleanInput = username.trim();
      let user = null;

      // Support login by username#tag or username
      if (cleanInput.includes('#')) {
        const [uName, uTag] = cleanInput.split('#');
        user = db.users.find(u => u.username.toLowerCase() === uName.toLowerCase() && u.tag === uTag);
      } else {
        user = db.users.find(u => u.username.toLowerCase() === cleanInput.toLowerCase());
      }

      if (!user) {
        return callback?.({ error: 'Kullanıcı bulunamadı.' });
      }

      if (user.passwordHash !== hashPassword(password)) {
        return callback?.({ error: 'Hatalı şifre girdiniz.' });
      }

      bindUserSocket(socket, user.id);
      const fullState = getUserFullState(user.id);
      callback?.({ success: true, ...fullState });
      broadcastFriendsUpdate(user.id);
    } catch (err) {
      console.error('Login error:', err);
      callback?.({ error: 'Giriş yapılırken bir hata oluştu.' });
    }
  });

  // 3. RESTORE SESSION (From localStorage)
  socket.on('auth:restore', ({ userId }, callback) => {
    const user = db.users.find(u => u.id === userId);
    if (!user) {
      return callback?.({ error: 'Oturum bulunamadı' });
    }

    bindUserSocket(socket, user.id);
    const fullState = getUserFullState(user.id);
    callback?.({ success: true, ...fullState });
    broadcastFriendsUpdate(user.id);
  });

  // 4. FRIEND SYSTEM: Send Friend Request
  socket.on('friend:send-request', ({ targetQuery }, callback) => {
    const currentUserId = socketUserMap.get(socket.id);
    if (!currentUserId) return callback?.({ error: 'Oturum açmalısınız.' });

    const currentUser = db.users.find(u => u.id === currentUserId);
    if (!currentUser) return callback?.({ error: 'Kullanıcı bulunamadı.' });

    const query = targetQuery?.trim();
    if (!query) return callback?.({ error: 'Arkadaş kullanıcı adı veya ID giriniz.' });

    let targetUser = null;

    if (query.includes('#')) {
      const [uName, uTag] = query.split('#');
      targetUser = db.users.find(u => u.username.toLowerCase() === uName.toLowerCase().trim() && u.tag === uTag.trim());
    } else {
      // By ID or by unique username
      targetUser = db.users.find(u => u.id === query || u.username.toLowerCase() === query.toLowerCase());
    }

    if (!targetUser) {
      return callback?.({ error: 'Kullanıcı bulunamadı! Lütfen "Ad#1234" şeklinde tam etiketi girdiğinizden emin olun.' });
    }

    if (targetUser.id === currentUserId) {
      return callback?.({ error: 'Kendinizi arkadaş olarak ekleyemezsiniz!' });
    }

    if ((currentUser.friends || []).includes(targetUser.id)) {
      return callback?.({ error: 'Bu kullanıcı zaten arkadaş listenizde ekli.' });
    }

    targetUser.friendRequests = targetUser.friendRequests || [];
    const alreadyRequested = targetUser.friendRequests.some(r => r.fromUserId === currentUserId);
    if (alreadyRequested) {
      return callback?.({ error: 'Bu kullanıcıya zaten bekleyen bir arkadaşlık isteği gönderdiniz.' });
    }

    // Add friend request
    targetUser.friendRequests.push({
      id: `req-${Date.now()}`,
      fromUserId: currentUserId,
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    });
    saveStorage();

    // Notify target user in real-time if online
    sendToUser(targetUser.id, 'friend:request-received', {
      from: formatUserPublic(currentUser)
    });

    callback?.({ success: true, message: `${targetUser.displayName} (#${targetUser.tag}) kullanıcısına arkadaşlık isteği gönderildi!` });
  });

  // 5. FRIEND SYSTEM: Respond to Friend Request (Accept / Reject)
  socket.on('friend:respond-request', ({ fromUserId, action }, callback) => {
    const currentUserId = socketUserMap.get(socket.id);
    if (!currentUserId) return;

    const currentUser = db.users.find(u => u.id === currentUserId);
    const fromUser = db.users.find(u => u.id === fromUserId);
    if (!currentUser || !fromUser) return;

    // Remove pending request
    currentUser.friendRequests = (currentUser.friendRequests || []).filter(r => r.fromUserId !== fromUserId);

    if (action === 'accept') {
      currentUser.friends = currentUser.friends || [];
      fromUser.friends = fromUser.friends || [];

      if (!currentUser.friends.includes(fromUserId)) currentUser.friends.push(fromUserId);
      if (!fromUser.friends.includes(currentUserId)) fromUser.friends.push(currentUserId);
    }

    saveStorage();

    // Send updated lists to both
    const myState = getUserFullState(currentUserId);
    const theirState = getUserFullState(fromUserId);

    socket.emit('friend:list-updated', { friends: myState.friends, friendRequests: myState.friendRequests });
    sendToUser(fromUserId, 'friend:list-updated', { friends: theirState.friends, friendRequests: theirState.friendRequests });

    callback?.({ success: true });
  });

  // 6. SERVER SYSTEM: Create Custom Server
  socket.on('server:create', ({ name, icon }, callback) => {
    const currentUserId = socketUserMap.get(socket.id);
    if (!currentUserId) return callback?.({ error: 'Giriş yapmalısınız.' });

    const serverName = name?.trim();
    if (!serverName) return callback?.({ error: 'Sunucu adı gereklidir.' });

    const serverId = `s-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const initials = serverName.substring(0, 2).toUpperCase();

    const newServer = {
      id: serverId,
      name: serverName,
      icon: icon || initials,
      ownerId: currentUserId,
      members: [currentUserId],
      channels: [
        { id: `c-${serverId}-genel`, name: 'genel-sohbet', type: 'text', description: `${serverName} genel sohbeti` },
        { id: `v-${serverId}-ses1`, name: 'Ses Odası 1', type: 'voice', description: 'Ana ses kanalı' },
        { id: `v-${serverId}-ses2`, name: 'Oyun Odası 🎮', type: 'voice', description: 'Oyun ses kanalı' }
      ]
    };

    db.servers.push(newServer);

    const currentUser = db.users.find(u => u.id === currentUserId);
    if (currentUser) {
      currentUser.serverIds = currentUser.serverIds || [];
      currentUser.serverIds.push(serverId);
    }

    // Initialize messages for default text channel
    db.messages[`c-${serverId}-genel`] = [
      {
        id: `msg-${Date.now()}`,
        senderId: 'system',
        senderName: 'Itown Bot 🤖',
        senderAvatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=ItownBot',
        senderColor: '#6366F1',
        text: `"${serverName}" sunucusu başarıyla oluşturuldu! Arkadaş listenizdeki arkadaşlarınızı davet edebilir veya yeni kanallar açabilirsiniz.`,
        timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
      }
    ];

    saveStorage();

    const fullState = getUserFullState(currentUserId);
    callback?.({ success: true, server: newServer, servers: fullState.servers });
  });

  // 7. SERVER SYSTEM: Invite Friend to Server
  socket.on('server:invite-friend', ({ serverId, targetUserId }, callback) => {
    const currentUserId = socketUserMap.get(socket.id);
    if (!currentUserId) return callback?.({ error: 'Giriş yapmalısınız.' });

    const serverObj = db.servers.find(s => s.id === serverId);
    const currentUser = db.users.find(u => u.id === currentUserId);
    const targetUser = db.users.find(u => u.id === targetUserId);

    if (!serverObj || !currentUser || !targetUser) {
      return callback?.({ error: 'Sunucu veya kullanıcı bulunamadı.' });
    }

    if (serverObj.members.includes(targetUserId)) {
      return callback?.({ error: `${targetUser.displayName} zaten bu sunucuya üye.` });
    }

    // Create invite
    const inviteId = `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const invite = {
      id: inviteId,
      serverId: serverObj.id,
      serverName: serverObj.name,
      serverIcon: serverObj.icon,
      senderId: currentUser.id,
      senderName: currentUser.displayName,
      senderAvatar: currentUser.avatar,
      targetUserId,
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    };

    db.invites = db.invites || [];
    db.invites.push(invite);
    saveStorage();

    // Send real-time notification to target friend
    sendToUser(targetUserId, 'server:invite-received', invite);

    callback?.({ success: true, message: `${targetUser.displayName} kullanıcısına sunucu daveti gönderildi!` });
  });

  // 8. SERVER SYSTEM: Respond to Server Invite (Join or Decline)
  socket.on('server:respond-invite', ({ inviteId, action }, callback) => {
    const currentUserId = socketUserMap.get(socket.id);
    if (!currentUserId) return;

    const inviteIndex = (db.invites || []).findIndex(i => i.id === inviteId && i.targetUserId === currentUserId);
    if (inviteIndex === -1) return callback?.({ error: 'Davet bulunamadı.' });

    const invite = db.invites[inviteIndex];
    db.invites.splice(inviteIndex, 1);

    if (action === 'accept') {
      const serverObj = db.servers.find(s => s.id === invite.serverId);
      const currentUser = db.users.find(u => u.id === currentUserId);

      if (serverObj && currentUser) {
        if (!serverObj.members.includes(currentUserId)) {
          serverObj.members.push(currentUserId);
        }
        currentUser.serverIds = currentUser.serverIds || [];
        if (!currentUser.serverIds.includes(serverObj.id)) {
          currentUser.serverIds.push(serverObj.id);
        }
      }
    }

    saveStorage();

    const fullState = getUserFullState(currentUserId);
    socket.emit('server:list-updated', { servers: fullState.servers, invites: fullState.invites });

    callback?.({ success: true, serverId: invite.serverId });
  });

  // 9. CHANNEL CREATION
  socket.on('channel:create', ({ serverId, name, type, description }, callback) => {
    const currentUserId = socketUserMap.get(socket.id);
    if (!currentUserId) return callback?.({ error: 'Giriş yapmalısınız.' });

    const serverObj = db.servers.find(s => s.id === serverId);
    if (!serverObj) return callback?.({ error: 'Sunucu bulunamadı.' });

    const cleanName = name?.trim().toLowerCase().replace(/\s+/g, '-');
    if (!cleanName) return callback?.({ error: 'Kanal adı zorunludur.' });

    const channelId = `${type === 'voice' ? 'v' : 'c'}-${Date.now().toString(36)}`;
    const newChannel = {
      id: channelId,
      name: cleanName,
      type: type || 'text',
      description: description || ''
    };

    serverObj.channels.push(newChannel);
    if (type === 'voice') {
      voiceRooms.set(channelId, new Set());
    } else {
      db.messages[channelId] = [];
    }

    saveStorage();

    // Broadcast updated server to all its members
    serverObj.members.forEach(memberId => {
      sendToUser(memberId, 'server:channels-updated', {
        serverId,
        channels: serverObj.channels
      });
    });

    callback?.({ success: true, channel: newChannel });
  });

  // 10. TEXT CHAT
  socket.on('chat:send-message', ({ channelId, text, image }) => {
    const currentUserId = socketUserMap.get(socket.id);
    if (!currentUserId || (!text && !image)) return;

    const user = db.users.find(u => u.id === currentUserId);
    if (!user) return;

    const newMsg = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      senderId: user.id,
      senderName: user.displayName,
      senderTag: user.tag,
      senderAvatar: user.avatar,
      senderColor: user.color || '#6366F1',
      text: text || '',
      image: image || null,
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    };

    if (!db.messages[channelId]) {
      db.messages[channelId] = [];
    }
    db.messages[channelId].push(newMsg);
    if (db.messages[channelId].length > 200) db.messages[channelId].shift();

    saveStorage();

    io.emit('chat:new-message', {
      channelId,
      message: newMsg
    });
  });

  // 11. VOICE CHAT: Join
  socket.on('voice:join', ({ channelId, serverId }) => {
    const currentUserId = socketUserMap.get(socket.id);
    if (!currentUserId) return;

    const user = db.users.find(u => u.id === currentUserId);
    if (!user) return;

    leaveCurrentVoiceRoom(socket);

    if (!voiceRooms.has(channelId)) {
      voiceRooms.set(channelId, new Set());
    }
    const room = voiceRooms.get(channelId);
    room.add(currentUserId);
    socket.join(channelId);

    const live = userLiveStates.get(currentUserId) || {};
    live.currentVoiceChannel = channelId;
    live.currentServerId = serverId;
    userLiveStates.set(currentUserId, live);

    // Existing peers in this voice room
    const existingPeers = Array.from(room)
      .filter(id => id !== currentUserId)
      .map(id => {
        const u = db.users.find(x => x.id === id);
        return u ? { ...formatUserPublic(u), ...userLiveStates.get(id) } : null;
      }).filter(Boolean);

    socket.emit('voice:room-users', {
      channelId,
      users: existingPeers
    });

    io.emit('voice:rooms-updated', getVoiceRoomsState());
    broadcastFriendsUpdate(currentUserId);
  });

  // 12. VOICE CHAT: Leave
  socket.on('voice:leave', () => {
    leaveCurrentVoiceRoom(socket);
    io.emit('voice:rooms-updated', getVoiceRoomsState());
  });

  // 13. USER STATE UPDATE (Mute, Camera, Screen, Speaking)
  socket.on('user:update-state', (updates) => {
    const currentUserId = socketUserMap.get(socket.id);
    if (!currentUserId) return;

    const live = userLiveStates.get(currentUserId) || {};
    Object.assign(live, updates);
    userLiveStates.set(currentUserId, live);

    io.emit('user:state-changed', {
      userId: currentUserId,
      updates
    });

    if (live.currentVoiceChannel) {
      socket.to(live.currentVoiceChannel).emit('voice:peer-state-changed', {
        userId: currentUserId,
        updates
      });
    }
  });

  // 14. SOUNDBOARD
  socket.on('voice:soundboard', ({ soundId }) => {
    const currentUserId = socketUserMap.get(socket.id);
    const live = userLiveStates.get(currentUserId);
    if (!live || !live.currentVoiceChannel) return;

    io.to(live.currentVoiceChannel).emit('voice:soundboard-play', {
      soundId,
      senderId: currentUserId
    });
  });

  // 15. WEBRTC SIGNALING
  socket.on('webrtc:signal', ({ targetUserId, signal, type }) => {
    const currentUserId = socketUserMap.get(socket.id);
    if (!currentUserId) return;

    // Send to target user's active sockets
    sendToUser(targetUserId, 'webrtc:signal', {
      senderUserId: currentUserId,
      signal,
      type
    });
  });

  // 16. HEARTBEAT
  socket.on('heartbeat', () => {
    socket.emit('heartbeat:ack');
  });

  // 17. ADMIN DASHBOARD & POWERS (Exclusively for 'fitoz')
  socket.on('admin:get-data', (callback) => {
    const currentUserId = socketUserMap.get(socket.id);
    const currentUser = db.users.find(u => u.id === currentUserId);
    if (!currentUser || currentUser.username.toLowerCase() !== 'fitoz') {
      return callback?.({ error: 'Bu alana sadece yönetici (fitoz) erişebilir.' });
    }

    const allUsers = db.users.map(u => {
      const isOnline = userSocketsMap.has(u.id) && userSocketsMap.get(u.id).size > 0;
      const live = userLiveStates.get(u.id) || {};
      let voiceChannelName = null;
      if (live.currentVoiceChannel) {
        for (const s of db.servers) {
          const ch = s.channels.find(c => c.id === live.currentVoiceChannel);
          if (ch) {
            voiceChannelName = `${s.name} > ${ch.name}`;
            break;
          }
        }
      }
      return {
        ...formatUserPublic(u),
        createdAt: u.createdAt || 'Kayıtlı',
        isOnline,
        currentVoiceChannel: live.currentVoiceChannel || null,
        voiceChannelName,
        serversCount: (u.serverIds || []).length,
        friendsCount: (u.friends || []).length
      };
    });

    const allServers = db.servers.map(s => {
      const owner = db.users.find(u => u.id === s.ownerId);
      return {
        id: s.id,
        name: s.name,
        icon: s.icon,
        ownerName: owner ? owner.displayName : 'Sistem',
        memberCount: (s.members || []).length,
        channels: s.channels
      };
    });

    callback?.({
      success: true,
      stats: {
        totalUsers: db.users.length,
        onlineUsers: Array.from(userSocketsMap.keys()).length,
        totalServers: db.servers.length,
        activeVoiceUsers: Array.from(voiceRooms.values()).reduce((acc, set) => acc + set.size, 0)
      },
      users: allUsers,
      servers: allServers,
      voiceRooms: getVoiceRoomsState()
    });
  });

  // Admin: Sesten At (Kick from voice)
  socket.on('admin:kick-voice', ({ targetUserId }, callback) => {
    const currentUserId = socketUserMap.get(socket.id);
    const currentUser = db.users.find(u => u.id === currentUserId);
    if (!currentUser || currentUser.username.toLowerCase() !== 'fitoz') {
      return callback?.({ error: 'Yetkisiz işlem.' });
    }

    leaveCurrentVoiceRoomByUserId(targetUserId);
    io.emit('voice:rooms-updated', getVoiceRoomsState());
    sendToUser(targetUserId, 'admin:kicked-voice');
    callback?.({ success: true });
  });

  // Admin: Kullanıcıyı Sil (Delete user)
  socket.on('admin:delete-user', ({ targetUserId }, callback) => {
    const currentUserId = socketUserMap.get(socket.id);
    const currentUser = db.users.find(u => u.id === currentUserId);
    if (!currentUser || currentUser.username.toLowerCase() !== 'fitoz') {
      return callback?.({ error: 'Yetkisiz işlem.' });
    }

    const target = db.users.find(u => u.id === targetUserId);
    if (target && target.username.toLowerCase() === 'fitoz') {
      return callback?.({ error: 'Yönetici hesabı silinemez!' });
    }

    db.users = db.users.filter(u => u.id !== targetUserId);
    leaveCurrentVoiceRoomByUserId(targetUserId);
    saveStorage();

    const sockets = userSocketsMap.get(targetUserId);
    if (sockets) {
      sockets.forEach(sockId => {
        const s = io.sockets.sockets.get(sockId);
        if (s) s.disconnect(true);
      });
    }

    callback?.({ success: true });
  });

  // 17. DISCONNECT
  socket.on('disconnect', (reason) => {
    console.log(`[Socket Disconnected] ID: ${socket.id}, reason: ${reason}`);
    const userId = socketUserMap.get(socket.id);
    socketUserMap.delete(socket.id);

    if (userId) {
      const sockSet = userSocketsMap.get(userId);
      if (sockSet) {
        sockSet.delete(socket.id);
        if (sockSet.size === 0) {
          userSocketsMap.delete(userId);

          // Grace period for network switch
          setTimeout(() => {
            if (!userSocketsMap.has(userId)) {
              leaveCurrentVoiceRoomByUserId(userId);
              userLiveStates.delete(userId);
              io.emit('voice:rooms-updated', getVoiceRoomsState());
              broadcastFriendsUpdate(userId);
            }
          }, 12000);
        }
      }
    }
  });

  function bindUserSocket(sock, userId) {
    socketUserMap.set(sock.id, userId);
    if (!userSocketsMap.has(userId)) {
      userSocketsMap.set(userId, new Set());
    }
    userSocketsMap.get(userId).add(sock.id);

    if (!userLiveStates.has(userId)) {
      userLiveStates.set(userId, {
        isMuted: false,
        isDeafened: false,
        isCameraOn: false,
        isScreenSharing: false,
        isSpeaking: false,
        currentVoiceChannel: null,
        currentServerId: null
      });
    }
  }

  function leaveCurrentVoiceRoom(sock) {
    const userId = socketUserMap.get(sock.id);
    if (userId) leaveCurrentVoiceRoomByUserId(userId, sock);
  }

  function leaveCurrentVoiceRoomByUserId(userId, sock = null) {
    const live = userLiveStates.get(userId);
    if (live && live.currentVoiceChannel) {
      const room = voiceRooms.get(live.currentVoiceChannel);
      if (room) {
        room.delete(userId);
        if (sock) sock.leave(live.currentVoiceChannel);
        io.to(live.currentVoiceChannel).emit('voice:peer-left', {
          userId,
          channelId: live.currentVoiceChannel
        });
      }
      live.currentVoiceChannel = null;
      live.isCameraOn = false;
      live.isScreenSharing = false;
      live.isSpeaking = false;
      userLiveStates.set(userId, live);
    }
  }

  function sendToUser(targetUserId, event, data) {
    const sockets = userSocketsMap.get(targetUserId);
    if (sockets) {
      sockets.forEach(sockId => {
        io.to(sockId).emit(event, data);
      });
    }
  }

  function broadcastFriendsUpdate(changedUserId) {
    const user = db.users.find(u => u.id === changedUserId);
    if (!user) return;
    (user.friends || []).forEach(fId => {
      const state = getUserFullState(fId);
      if (state) {
        sendToUser(fId, 'friend:list-updated', { friends: state.friends, friendRequests: state.friendRequests });
      }
    });
  }
});

const PORT = process.env.PORT || 3001;

app.use((req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('Itown Discord Server Running. Open Client on http://localhost:5173');
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`===============================================`);
  console.log(`🚀 Itown Discord Space running on port ${PORT}`);
  console.log(`🔗 Local: http://localhost:${PORT}`);
  console.log(`===============================================`);
});
