import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import express from "express";
import { WebSocketServer, WebSocket } from "ws";
import { registerAiResearchRoutes } from "./ai-research.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const IS_PROD = process.env.NODE_ENV === "production";
const DATA_DIR = path.join(__dirname, ".data");
const STORE_PATH = path.join(DATA_DIR, "academic-network.json");

interface ScholarProfile {
  id: string;
  username: string;
  name: string;
  field: string;
  university: string;
  level: string;
  bio: string;
  avatar: string;
  avatarUrl?: string;
  verified?: boolean;
  updatedAt: number;
}

interface ConnectionRecord {
  id: string;
  fromId: string;
  fromName: string;
  fromHandle: string;
  fromField: string;
  fromUniversity: string;
  toId: string;
  toName: string;
  toHandle: string;
  toField: string;
  status: "pending" | "accepted" | "declined";
  createdAt: number;
  updatedAt: number;
}

interface StudyRoomRecord {
  id: string;
  code: string;
  title: string;
  field: string;
  description: string;
  hostId: string;
  hostName: string;
  hostHandle: string;
  visibility: "public" | "private";
  scheduledAt: string | null;
  durationMin: number;
  linkedItem?: Record<string, unknown> | null;
  createdAt: number;
}

interface RoomChatMessage {
  id: string;
  roomId: string;
  peerId: string;
  name: string;
  handle: string;
  text: string;
  attachment?: Record<string, unknown> | null;
  createdAt: number;
}

interface CommunityPostRecord {
  id: string;
  userId: string;
  authorName: string;
  authorHandle: string;
  authorField: string;
  authorUniversity: string;
  authorAvatar: string;
  kind: "post" | "question" | "research" | "deck" | "transcript" | "experience" | "video";
  field: string;
  title: string;
  body: string;
  doi?: string;
  videoUrl?: string;
  deckPayload?: Record<string, unknown> | null;
  transcriptPayload?: Record<string, unknown> | null;
  likes: string[];
  comments: Array<{
    id: string;
    userId: string;
    authorName: string;
    authorHandle: string;
    body: string;
    createdAt: number;
  }>;
  createdAt: number;
}

interface AcademicGroupRecord {
  id: string;
  title: string;
  field: string;
  level: string;
  university: string;
  description: string;
  visibility: "public" | "private";
  inviteCode: string;
  creatorId: string;
  creatorName: string;
  members: Array<{ id: string; name: string; handle: string; joinedAt: number }>;
  roomId: string;
  createdAt: number;
  lastAt: number;
}

interface GroupMessageRecord {
  id: string;
  groupId: string;
  userId: string;
  authorName: string;
  authorHandle: string;
  body: string;
  createdAt: number;
}

interface NetworkStore {
  profiles: Record<string, ScholarProfile>;
  connections: ConnectionRecord[];
  rooms: StudyRoomRecord[];
  roomMessages: Record<string, RoomChatMessage[]>;
  roomShared: Record<string, Record<string, unknown> | null>;
  posts: CommunityPostRecord[];
  groups: AcademicGroupRecord[];
  groupMessages: Record<string, GroupMessageRecord[]>;
}

function emptyStore(): NetworkStore {
  return {
    profiles: {},
    connections: [],
    rooms: [],
    roomMessages: {},
    roomShared: {},
    posts: [],
    groups: [],
    groupMessages: {}
  };
}

function loadStore(): NetworkStore {
  try {
    if (!fs.existsSync(STORE_PATH)) return emptyStore();
    const raw = JSON.parse(fs.readFileSync(STORE_PATH, "utf8"));
    return { ...emptyStore(), ...(raw && typeof raw === "object" ? raw : {}) };
  } catch {
    return emptyStore();
  }
}

const store: NetworkStore = loadStore();
let saveTimer: NodeJS.Timeout | null = null;
function scheduleSave() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      const tmp = STORE_PATH + ".tmp";
      fs.writeFileSync(tmp, JSON.stringify(store, null, 2), "utf8");
      fs.renameSync(tmp, STORE_PATH);
    } catch (err) {
      console.error("[store] failed to persist", err);
    }
  }, 150);
}

const cleanStr = (v: unknown, max = 300) =>
  String(v == null ? "" : v)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .trim()
    .slice(0, max);

const cleanHandle = (v: unknown) =>
  cleanStr(v, 32)
    .toLowerCase()
    .replace(/^@+/, "")
    .replace(/[^a-z0-9_.-]/g, "") || "scholar";

function genRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    if (i === 3) code += "-";
    code += chars[crypto.randomInt(0, chars.length)];
  }
  return code;
}

interface LivePeer {
  ws: WebSocket;
  peerId: string;
  name: string;
  handle: string;
  field: string;
  university: string;
  avatar: string;
  rooms: Map<string, { mic: boolean; cam: boolean; screen: boolean }>;
  alive: boolean;
}

const onlinePeers = new Map<string, Set<LivePeer>>();
const roomMembers = new Map<string, Map<string, LivePeer>>();

function getRoomParticipants(roomId: string) {
  const map = roomMembers.get(roomId);
  if (!map) return [];
  const list: Array<{
    peerId: string;
    name: string;
    handle: string;
    field: string;
    university: string;
    avatar: string;
    mic: boolean;
    cam: boolean;
    screen: boolean;
  }> = [];
  for (const [peerId, peer] of map.entries()) {
    const media = peer.rooms.get(roomId) || { mic: true, cam: false, screen: false };
    list.push({
      peerId,
      name: peer.name,
      handle: peer.handle,
      field: peer.field,
      university: peer.university,
      avatar: peer.avatar,
      mic: media.mic,
      cam: media.cam,
      screen: media.screen
    });
  }
  return list;
}

function sendWs(ws: WebSocket, payload: unknown) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

function broadcastRoom(roomId: string, payload: unknown, exceptPeerId?: string) {
  const map = roomMembers.get(roomId);
  if (!map) return;
  for (const [pid, peer] of map.entries()) {
    if (exceptPeerId && pid === exceptPeerId) continue;
    sendWs(peer.ws, payload);
  }
}

function broadcastOnlinePeers() {
  const peers: Array<{ peerId: string; name: string; handle: string; field: string; avatar: string }> = [];
  for (const [peerId, set] of onlinePeers.entries()) {
    const first = set.values().next().value as LivePeer | undefined;
    if (first) {
      peers.push({
        peerId,
        name: first.name,
        handle: first.handle,
        field: first.field,
        avatar: first.avatar
      });
    }
  }
  const msg = JSON.stringify({ type: "online:peers", peers });
  for (const set of onlinePeers.values()) {
    for (const p of set) {
      if (p.ws.readyState === WebSocket.OPEN) p.ws.send(msg);
    }
  }
}

function leaveRoom(peer: LivePeer, roomId: string) {
  peer.rooms.delete(roomId);
  const map = roomMembers.get(roomId);
  if (!map) return;
  if (map.get(peer.peerId) === peer) {
    map.delete(peer.peerId);
    if (map.size === 0) {
      roomMembers.delete(roomId);
    } else {
      broadcastRoom(roomId, {
        type: "room:peer-left",
        roomId,
        peerId: peer.peerId,
        participants: getRoomParticipants(roomId)
      });
    }
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "30mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({
      ok: true,
      onlineCount: onlinePeers.size,
      activeRooms: roomMembers.size,
      totalRooms: store.rooms.length,
      totalPosts: store.posts.length
    });
  });

  registerAiResearchRoutes(app);

  // ---- Researcher Directory ----
  app.get("/api/directory", (req, res) => {
    const q = cleanStr(req.query.q, 80).toLowerCase();
    const field = cleanStr(req.query.field, 80).toLowerCase();
    let list = Object.values(store.profiles);
    if (field) {
      list = list.filter((p) => (p.field || "").toLowerCase().includes(field));
    }
    if (q) {
      list = list.filter((p) =>
        [p.name, p.username, p.field, p.university, p.bio].some((x) =>
          (x || "").toLowerCase().includes(q)
        )
      );
    }
    list.sort((a, b) => b.updatedAt - a.updatedAt);
    res.json({
      profiles: list.slice(0, 60).map((p) => ({
        ...p,
        online: onlinePeers.has(p.id)
      }))
    });
  });

  app.get("/api/directory/:idOrHandle", (req, res) => {
    const key = cleanStr(req.params.idOrHandle, 120).toLowerCase();
    const profile =
      store.profiles[req.params.idOrHandle] ||
      Object.values(store.profiles).find(
        (p) => p.id.toLowerCase() === key || p.username.toLowerCase() === key
      );
    if (!profile) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }
    res.json({ profile: { ...profile, online: onlinePeers.has(profile.id) } });
  });

  app.post("/api/directory/upsert", (req, res) => {
    const id = cleanStr(req.body?.id, 100);
    if (!id) {
      res.status(400).json({ error: "Missing profile id" });
      return;
    }
    const prev = store.profiles[id];
    const next: ScholarProfile = {
      id,
      username: cleanHandle(req.body?.username || prev?.username || id),
      name: cleanStr(req.body?.name || prev?.name || "Researcher", 80),
      field: cleanStr(req.body?.field ?? prev?.field ?? "", 80),
      university: cleanStr(req.body?.university ?? prev?.university ?? "", 100),
      level: cleanStr(req.body?.level ?? prev?.level ?? "", 24),
      bio: cleanStr(req.body?.bio ?? prev?.bio ?? "", 300),
      avatar: cleanStr(req.body?.avatar ?? prev?.avatar ?? "🎓", 8),
      avatarUrl: cleanStr(req.body?.avatarUrl ?? prev?.avatarUrl ?? "", 400) || undefined,
      verified: Boolean(req.body?.verified ?? prev?.verified),
      updatedAt: Date.now()
    };
    store.profiles[id] = next;
    scheduleSave();
    res.json({ profile: next });
  });

  // ---- Peer-to-Peer Academic Connection Requests ----
  app.get("/api/connections", (req, res) => {
    const peerId = cleanStr(req.query.peerId, 100);
    if (!peerId) {
      res.json({ connections: [], incoming: [], outgoing: [], accepted: [] });
      return;
    }
    const mine = store.connections.filter(
      (c) => c.fromId === peerId || c.toId === peerId
    );
    const incoming = mine.filter((c) => c.toId === peerId && c.status === "pending");
    const outgoing = mine.filter((c) => c.fromId === peerId && c.status === "pending");
    const accepted = mine.filter((c) => c.status === "accepted");
    res.json({ connections: mine, incoming, outgoing, accepted });
  });

  app.post("/api/connections/request", (req, res) => {
    const fromId = cleanStr(req.body?.fromId, 100);
    const toId = cleanStr(req.body?.toId, 100);
    if (!fromId || !toId || fromId === toId) {
      res.status(400).json({ error: "Valid fromId and toId are required" });
      return;
    }
    const existing = store.connections.find(
      (c) =>
        (c.fromId === fromId && c.toId === toId) ||
        (c.fromId === toId && c.toId === fromId)
    );
    if (existing) {
      if (existing.status === "declined") {
        existing.fromId = fromId;
        existing.toId = toId;
        existing.status = "pending";
        existing.updatedAt = Date.now();
        scheduleSave();
      }
      res.json({ connection: existing });
      return;
    }
    const rec: ConnectionRecord = {
      id: "conn_" + crypto.randomUUID(),
      fromId,
      fromName: cleanStr(req.body?.fromName || "Researcher", 80),
      fromHandle: cleanHandle(req.body?.fromHandle || fromId),
      fromField: cleanStr(req.body?.fromField || "", 80),
      fromUniversity: cleanStr(req.body?.fromUniversity || "", 100),
      toId,
      toName: cleanStr(req.body?.toName || "Researcher", 80),
      toHandle: cleanHandle(req.body?.toHandle || toId),
      toField: cleanStr(req.body?.toField || "", 80),
      status: "pending",
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    store.connections.unshift(rec);
    scheduleSave();
    // Notify online target peer in real time
    const targets = onlinePeers.get(toId);
    if (targets) {
      for (const peer of targets) {
        sendWs(peer.ws, { type: "connection:request", connection: rec });
      }
    }
    res.json({ connection: rec });
  });

  app.post("/api/connections/respond", (req, res) => {
    const id = cleanStr(req.body?.id, 100);
    const peerId = cleanStr(req.body?.peerId, 100);
    const action = req.body?.action === "accept" ? "accepted" : "declined";
    const rec = store.connections.find((c) => c.id === id);
    if (!rec) {
      res.status(404).json({ error: "Connection request not found" });
      return;
    }
    if (rec.toId !== peerId && rec.fromId !== peerId) {
      res.status(403).json({ error: "Not authorized" });
      return;
    }
    rec.status = action;
    rec.updatedAt = Date.now();
    scheduleSave();
    const otherId = rec.fromId === peerId ? rec.toId : rec.fromId;
    const targets = onlinePeers.get(otherId);
    if (targets) {
      for (const peer of targets) {
        sendWs(peer.ws, { type: "connection:updated", connection: rec });
      }
    }
    res.json({ connection: rec });
  });

  // ---- Study Rooms & Scheduling ----
  app.get("/api/rooms", (req, res) => {
    const field = cleanStr(req.query.field, 80).toLowerCase();
    const peerId = cleanStr(req.query.peerId, 100);
    let rooms = store.rooms.filter(
      (r) => r.visibility === "public" || r.hostId === peerId
    );
    if (field) {
      rooms = rooms.filter((r) => (r.field || "").toLowerCase().includes(field));
    }
    const enriched = rooms
      .map((r) => ({
        ...r,
        activeParticipants: getRoomParticipants(r.id)
      }))
      .sort((a, b) => {
        const diff = b.activeParticipants.length - a.activeParticipants.length;
        if (diff !== 0) return diff;
        return b.createdAt - a.createdAt;
      });
    res.json({ rooms: enriched });
  });

  app.get("/api/rooms/:idOrCode", (req, res) => {
    const key = cleanStr(req.params.idOrCode, 100).toUpperCase();
    const room = store.rooms.find(
      (r) => r.id === req.params.idOrCode || r.code.toUpperCase() === key
    );
    if (!room) {
      res.status(404).json({ error: "Study room not found" });
      return;
    }
    res.json({
      room: {
        ...room,
        activeParticipants: getRoomParticipants(room.id)
      },
      sharedMaterial: store.roomShared[room.id] || room.linkedItem || null,
      messages: store.roomMessages[room.id] || []
    });
  });

  app.post("/api/rooms", (req, res) => {
    const title = cleanStr(req.body?.title, 120);
    if (!title) {
      res.status(400).json({ error: "Room title is required" });
      return;
    }
    const room: StudyRoomRecord = {
      id: "room_" + crypto.randomUUID(),
      code: genRoomCode(),
      title,
      field: cleanStr(req.body?.field || "General", 80),
      description: cleanStr(req.body?.description || "", 400),
      hostId: cleanStr(req.body?.hostId || "anon", 100),
      hostName: cleanStr(req.body?.hostName || "Scholar", 80),
      hostHandle: cleanHandle(req.body?.hostHandle || "scholar"),
      visibility: req.body?.visibility === "private" ? "private" : "public",
      scheduledAt: req.body?.scheduledAt ? cleanStr(req.body.scheduledAt, 40) : null,
      durationMin: Math.min(240, Math.max(15, Number(req.body?.durationMin) || 60)),
      linkedItem:
        req.body?.linkedItem && typeof req.body.linkedItem === "object"
          ? req.body.linkedItem
          : null,
      createdAt: Date.now()
    };
    store.rooms.unshift(room);
    if (store.rooms.length > 150) store.rooms.length = 150;
    if (room.linkedItem) {
      store.roomShared[room.id] = room.linkedItem;
    }
    scheduleSave();
    res.json({ room: { ...room, activeParticipants: [] } });
  });

  app.delete("/api/rooms/:id", (req, res) => {
    const peerId = cleanStr(req.query.peerId || req.body?.peerId, 100);
    const idx = store.rooms.findIndex((r) => r.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: "Room not found" });
      return;
    }
    if (peerId && store.rooms[idx].hostId !== peerId) {
      res.status(403).json({ error: "Only the room host can close it" });
      return;
    }
    const [removed] = store.rooms.splice(idx, 1);
    delete store.roomMessages[removed.id];
    delete store.roomShared[removed.id];
    scheduleSave();
    broadcastRoom(removed.id, { type: "room:closed", roomId: removed.id });
    res.json({ ok: true });
  });

  // ---- Collaborative Community Feed (Flashcard & Transcript Exchange, Inquiries, Research) ----
  app.get("/api/community/feed", (req, res) => {
    const field = cleanStr(req.query.field, 80).toLowerCase();
    const kind = cleanStr(req.query.kind, 32).toLowerCase();
    const q = cleanStr(req.query.q, 80).toLowerCase();
    let list = store.posts.slice();
    if (field) {
      list = list.filter((p) => (p.field || "").toLowerCase().includes(field));
    }
    if (kind) {
      list = list.filter((p) => p.kind === kind);
    }
    if (q) {
      list = list.filter((p) =>
        [p.title, p.body, p.field, p.authorName, p.authorHandle].some((x) =>
          (x || "").toLowerCase().includes(q)
        )
      );
    }
    list.sort((a, b) => b.createdAt - a.createdAt);
    res.json({ posts: list.slice(0, 60) });
  });

  app.post("/api/community/posts", (req, res) => {
    const title = cleanStr(req.body?.title, 180);
    const body = cleanStr(req.body?.body, 4000);
    if (!title && !body) {
      res.status(400).json({ error: "Title or content is required" });
      return;
    }
    const allowedKinds = new Set([
      "post",
      "question",
      "research",
      "deck",
      "transcript",
      "experience",
      "video"
    ]);
    const kind = allowedKinds.has(req.body?.kind) ? req.body.kind : "post";
    const post: CommunityPostRecord = {
      id: "post_" + crypto.randomUUID(),
      userId: cleanStr(req.body?.userId || "anon", 100),
      authorName: cleanStr(req.body?.authorName || "Researcher", 80),
      authorHandle: cleanHandle(req.body?.authorHandle || "scholar"),
      authorField: cleanStr(req.body?.authorField || "", 80),
      authorUniversity: cleanStr(req.body?.authorUniversity || "", 100),
      authorAvatar: cleanStr(req.body?.authorAvatar || "🎓", 8),
      kind,
      field: cleanStr(req.body?.field || req.body?.authorField || "", 80),
      title: title || body.slice(0, 90),
      body,
      doi: cleanStr(req.body?.doi || "", 160) || undefined,
      videoUrl: cleanStr(req.body?.videoUrl || "", 400) || undefined,
      deckPayload:
        req.body?.deckPayload && typeof req.body.deckPayload === "object"
          ? req.body.deckPayload
          : null,
      transcriptPayload:
        req.body?.transcriptPayload && typeof req.body.transcriptPayload === "object"
          ? req.body.transcriptPayload
          : null,
      likes: [],
      comments: [],
      createdAt: Date.now()
    };
    store.posts.unshift(post);
    if (store.posts.length > 300) store.posts.length = 300;
    scheduleSave();
    res.json({ post });
  });

  app.post("/api/community/posts/:id/like", (req, res) => {
    const post = store.posts.find((p) => p.id === req.params.id);
    const userId = cleanStr(req.body?.userId, 100);
    if (!post || !userId) {
      res.status(404).json({ error: "Post or user not found" });
      return;
    }
    const idx = post.likes.indexOf(userId);
    if (idx === -1) post.likes.push(userId);
    else post.likes.splice(idx, 1);
    scheduleSave();
    res.json({ likes: post.likes });
  });

  app.post("/api/community/posts/:id/comments", (req, res) => {
    const post = store.posts.find((p) => p.id === req.params.id);
    const body = cleanStr(req.body?.body, 1000);
    if (!post || !body) {
      res.status(400).json({ error: "Post or comment body missing" });
      return;
    }
    const comment = {
      id: "cmt_" + crypto.randomUUID(),
      userId: cleanStr(req.body?.userId || "anon", 100),
      authorName: cleanStr(req.body?.authorName || "Researcher", 80),
      authorHandle: cleanHandle(req.body?.authorHandle || "scholar"),
      body,
      createdAt: Date.now()
    };
    post.comments.push(comment);
    scheduleSave();
    res.json({ comment, comments: post.comments });
  });

  app.delete("/api/community/posts/:id", (req, res) => {
    const userId = cleanStr(req.query.userId || req.body?.userId, 100);
    const idx = store.posts.findIndex((p) => p.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    if (userId && store.posts[idx].userId !== userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    store.posts.splice(idx, 1);
    scheduleSave();
    res.json({ ok: true });
  });

  // ---- Public & Private Academic Groups ----
  app.get("/api/groups", (req, res) => {
    const field = cleanStr(req.query.field, 80).toLowerCase();
    const q = cleanStr(req.query.q, 80).toLowerCase();
    const peerId = cleanStr(req.query.peerId, 100);
    let groups = store.groups.filter(
      (g) =>
        g.visibility === "public" ||
        g.creatorId === peerId ||
        g.members.some((m) => m.id === peerId)
    );
    if (field) groups = groups.filter((g) => (g.field || "").toLowerCase().includes(field));
    if (q) {
      groups = groups.filter((g) =>
        [g.title, g.field, g.university, g.description].some((x) =>
          (x || "").toLowerCase().includes(q)
        )
      );
    }
    groups.sort((a, b) => b.lastAt - a.lastAt);
    res.json({ groups });
  });

  app.post("/api/groups", (req, res) => {
    const title = cleanStr(req.body?.title, 100);
    const creatorId = cleanStr(req.body?.creatorId || "anon", 100);
    const creatorName = cleanStr(req.body?.creatorName || "Researcher", 80);
    const creatorHandle = cleanHandle(req.body?.creatorHandle || "scholar");
    if (!title) {
      res.status(400).json({ error: "Group title is required" });
      return;
    }
    const room: StudyRoomRecord = {
      id: "room_" + crypto.randomUUID(),
      code: genRoomCode(),
      title: title,
      field: cleanStr(req.body?.field || "General", 80),
      description: cleanStr(req.body?.description || "", 300),
      hostId: creatorId,
      hostName: creatorName,
      hostHandle: creatorHandle,
      visibility: req.body?.visibility === "private" ? "private" : "public",
      scheduledAt: null,
      durationMin: 90,
      linkedItem: null,
      createdAt: Date.now()
    };
    store.rooms.unshift(room);
    const group: AcademicGroupRecord = {
      id: "grp_" + crypto.randomUUID(),
      title,
      field: cleanStr(req.body?.field || "", 80),
      level: cleanStr(req.body?.level || "", 24),
      university: cleanStr(req.body?.university || "", 100),
      description: cleanStr(req.body?.description || "", 300),
      visibility: req.body?.visibility === "private" ? "private" : "public",
      inviteCode: genRoomCode(),
      creatorId,
      creatorName,
      members: [{ id: creatorId, name: creatorName, handle: creatorHandle, joinedAt: Date.now() }],
      roomId: room.id,
      createdAt: Date.now(),
      lastAt: Date.now()
    };
    store.groups.unshift(group);
    scheduleSave();
    res.json({ group, room });
  });

  app.post("/api/groups/join", (req, res) => {
    const groupId = cleanStr(req.body?.groupId, 100);
    const inviteCode = cleanStr(req.body?.inviteCode, 20).toUpperCase();
    const userId = cleanStr(req.body?.userId || "anon", 100);
    const name = cleanStr(req.body?.name || "Researcher", 80);
    const handle = cleanHandle(req.body?.handle || "scholar");
    const group = store.groups.find(
      (g) => (groupId && g.id === groupId) || (inviteCode && g.inviteCode.toUpperCase() === inviteCode)
    );
    if (!group) {
      res.status(404).json({ error: "Group not found" });
      return;
    }
    if (
      group.visibility === "private" &&
      inviteCode !== group.inviteCode.toUpperCase() &&
      !group.members.some((m) => m.id === userId)
    ) {
      res.status(403).json({ error: "Valid invite code required for private group" });
      return;
    }
    if (!group.members.some((m) => m.id === userId)) {
      group.members.push({ id: userId, name, handle, joinedAt: Date.now() });
      group.lastAt = Date.now();
      scheduleSave();
    }
    res.json({ group });
  });

  app.get("/api/groups/:id/messages", (req, res) => {
    const messages = store.groupMessages[req.params.id] || [];
    res.json({ messages });
  });

  app.post("/api/groups/:id/messages", (req, res) => {
    const group = store.groups.find((g) => g.id === req.params.id);
    const body = cleanStr(req.body?.body, 1500);
    if (!group || !body) {
      res.status(400).json({ error: "Group or message body missing" });
      return;
    }
    const msg: GroupMessageRecord = {
      id: "gmsg_" + crypto.randomUUID(),
      groupId: group.id,
      userId: cleanStr(req.body?.userId || "anon", 100),
      authorName: cleanStr(req.body?.authorName || "Researcher", 80),
      authorHandle: cleanHandle(req.body?.authorHandle || "scholar"),
      body,
      createdAt: Date.now()
    };
    const list = (store.groupMessages[group.id] = store.groupMessages[group.id] || []);
    list.push(msg);
    if (list.length > 200) list.splice(0, list.length - 200);
    group.lastAt = Date.now();
    scheduleSave();
    res.json({ message: msg });
  });

  // ---- HTTP + WebSocket Server ----
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws) => {
    const peer: LivePeer = {
      ws,
      peerId: "peer_" + crypto.randomUUID(),
      name: "Scholar",
      handle: "scholar",
      field: "",
      university: "",
      avatar: "🎓",
      rooms: new Map(),
      alive: true
    };

    ws.on("pong", () => {
      peer.alive = true;
    });

    ws.on("message", (raw) => {
      let msg: Record<string, any>;
      try {
        msg = JSON.parse(String(raw));
      } catch {
        return;
      }
      if (!msg || typeof msg.type !== "string") return;

      if (msg.type === "hello") {
        const nextId = cleanStr(msg.peerId, 100);
        if (nextId && nextId !== peer.peerId) {
          const oldSet = onlinePeers.get(peer.peerId);
          if (oldSet) {
            oldSet.delete(peer);
            if (oldSet.size === 0) onlinePeers.delete(peer.peerId);
          }
          peer.peerId = nextId;
        }
        peer.name = cleanStr(msg.name || peer.name, 80);
        peer.handle = cleanHandle(msg.handle || peer.handle);
        peer.field = cleanStr(msg.field || "", 80);
        peer.university = cleanStr(msg.university || "", 100);
        peer.avatar = cleanStr(msg.avatar || "🎓", 8);

        let set = onlinePeers.get(peer.peerId);
        if (!set) {
          set = new Set();
          onlinePeers.set(peer.peerId, set);
        }
        set.add(peer);

        // Keep directory fresh
        store.profiles[peer.peerId] = {
          id: peer.peerId,
          username: peer.handle,
          name: peer.name,
          field: peer.field,
          university: peer.university,
          level: cleanStr(msg.level || store.profiles[peer.peerId]?.level || "", 24),
          bio: store.profiles[peer.peerId]?.bio || "",
          avatar: peer.avatar,
          avatarUrl: store.profiles[peer.peerId]?.avatarUrl,
          verified: store.profiles[peer.peerId]?.verified,
          updatedAt: Date.now()
        };
        scheduleSave();

        sendWs(ws, { type: "hello:ack", peerId: peer.peerId });
        broadcastOnlinePeers();
        return;
      }

      if (msg.type === "room:join") {
        const roomId = cleanStr(msg.roomId, 100);
        if (!roomId) return;
        const room = store.rooms.find((r) => r.id === roomId || r.code === roomId);
        const targetRoomId = room ? room.id : roomId;

        peer.rooms.set(targetRoomId, {
          mic: msg.mic !== false,
          cam: Boolean(msg.cam),
          screen: Boolean(msg.screen)
        });
        let map = roomMembers.get(targetRoomId);
        if (!map) {
          map = new Map();
          roomMembers.set(targetRoomId, map);
        }
        map.set(peer.peerId, peer);

        const participants = getRoomParticipants(targetRoomId);
        sendWs(ws, {
          type: "room:state",
          roomId: targetRoomId,
          participants,
          messages: store.roomMessages[targetRoomId] || [],
          sharedMaterial: store.roomShared[targetRoomId] || room?.linkedItem || null
        });
        broadcastRoom(
          targetRoomId,
          {
            type: "room:peer-joined",
            roomId: targetRoomId,
            peerId: peer.peerId,
            participants
          },
          peer.peerId
        );
        return;
      }

      if (msg.type === "room:leave") {
        const roomId = cleanStr(msg.roomId, 100);
        if (roomId) leaveRoom(peer, roomId);
        return;
      }

      if (msg.type === "rtc:media") {
        const roomId = cleanStr(msg.roomId, 100);
        if (!roomId || !peer.rooms.has(roomId)) return;
        peer.rooms.set(roomId, {
          mic: Boolean(msg.mic),
          cam: Boolean(msg.cam),
          screen: Boolean(msg.screen)
        });
        broadcastRoom(roomId, {
          type: "room:presence",
          roomId,
          participants: getRoomParticipants(roomId)
        });
        return;
      }

      if (msg.type === "rtc:offer" || msg.type === "rtc:answer" || msg.type === "rtc:ice") {
        const roomId = cleanStr(msg.roomId, 100);
        const toPeerId = cleanStr(msg.toPeerId, 100);
        const map = roomMembers.get(roomId);
        const target = map?.get(toPeerId);
        if (target) {
          sendWs(target.ws, {
            type: msg.type,
            roomId,
            fromPeerId: peer.peerId,
            payload: msg.payload
          });
        }
        return;
      }

      if (msg.type === "chat:send") {
        const roomId = cleanStr(msg.roomId, 100);
        const text = cleanStr(msg.text, 1500);
        const msgId = cleanStr(msg.id, 100) || "msg_" + crypto.randomUUID();
        if (!roomId || (!text && !msg.attachment)) return;
        const list = (store.roomMessages[roomId] = store.roomMessages[roomId] || []);
        if (list.some((m) => m.id === msgId)) return;
        const entry: RoomChatMessage = {
          id: msgId,
          roomId,
          peerId: peer.peerId,
          name: peer.name,
          handle: peer.handle,
          text,
          attachment:
            msg.attachment && typeof msg.attachment === "object" ? msg.attachment : null,
          createdAt: Date.now()
        };
        list.push(entry);
        if (list.length > 200) list.splice(0, list.length - 200);
        scheduleSave();
        broadcastRoom(roomId, { type: "chat:message", roomId, message: entry });
        return;
      }

      if (msg.type === "study:sync") {
        const roomId = cleanStr(msg.roomId, 100);
        if (!roomId) return;
        store.roomShared[roomId] =
          msg.item && typeof msg.item === "object" ? msg.item : null;
        scheduleSave();
        broadcastRoom(roomId, {
          type: "study:synced",
          roomId,
          fromPeerId: peer.peerId,
          fromName: peer.name,
          item: store.roomShared[roomId]
        });
        return;
      }

      // Direct 1:1 Skype-style signaling across online peers
      if (
        msg.type === "call:invite" ||
        msg.type === "call:accept" ||
        msg.type === "call:decline" ||
        msg.type === "call:offer" ||
        msg.type === "call:answer" ||
        msg.type === "call:ice" ||
        msg.type === "call:media" ||
        msg.type === "call:bye"
      ) {
        const toPeerId = cleanStr(msg.toPeerId, 100);
        const targets = onlinePeers.get(toPeerId);
        if (!targets || targets.size === 0) {
          if (msg.type === "call:invite" || msg.type === "call:offer") {
            sendWs(ws, {
              type: "call:unavailable",
              callId: msg.callId,
              toPeerId
            });
          }
          return;
        }
        for (const t of targets) {
          sendWs(t.ws, {
            ...msg,
            fromPeerId: peer.peerId,
            fromName: peer.name,
            fromHandle: peer.handle,
            fromAvatar: peer.avatar
          });
        }
      }
    });

    ws.on("close", () => {
      for (const roomId of [...peer.rooms.keys()]) {
        leaveRoom(peer, roomId);
      }
      const set = onlinePeers.get(peer.peerId);
      if (set) {
        set.delete(peer);
        if (set.size === 0) onlinePeers.delete(peer.peerId);
      }
      broadcastOnlinePeers();
    });
  });

  const heartbeat = setInterval(() => {
    for (const set of onlinePeers.values()) {
      for (const peer of set) {
        if (!peer.alive) {
          peer.ws.terminate();
          continue;
        }
        peer.alive = false;
        peer.ws.ping();
      }
    }
  }, 30000);

  wss.on("close", () => clearInterval(heartbeat));

  if (!IS_PROD) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: "mpa"
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(__dirname, { index: "index.html" }));
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`7Salah Scholar server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
