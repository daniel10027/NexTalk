// @ts-nocheck
import { create } from "zustand";

export interface Message {
  _id: string;
  content: string;
  type: string;
  sender: {
    _id: string;
    username: string;
    displayName: string;
    avatar?: string;
    status: string;
  };
  room: string;
  replyTo?: Message | null;
  attachments: Attachment[];
  reactions: Reaction[];
  mentions: { _id: string; username: string; displayName: string }[];
  tags: string[];
  isEdited: boolean;
  editedAt?: string;
  isDeleted: boolean;
  isPinned: boolean;
  readBy: { user: string; readAt: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  url: string;
  key: string;
  name: string;
  size: number;
  type: string;
  thumbnailUrl?: string;
}

export interface Reaction {
  emoji: string;
  users: string[];
  count: number;
}

export interface Room {
  _id: string;
  name?: string;
  type: "direct" | "group" | "channel";
  avatar?: string;
  description?: string;
  owner: { _id: string; username: string; displayName: string; avatar?: string };
  members: RoomMember[];
  settings: RoomSettings;
  lastMessage?: Message;
  lastActivity: string;
  messageCount: number;
  inviteCode?: string;
  tags: string[];
  isPublic: boolean;
  unreadCount?: number;
}

export interface RoomMember {
  user: string | { _id: string; username: string; displayName: string; avatar?: string; status: string };
  role: "owner" | "admin" | "moderator" | "member";
  joinedAt: string;
  nickname?: string;
  isMuted: boolean;
  lastRead?: string;
  notificationLevel: "all" | "mentions" | "none";
}

export interface RoomSettings {
  slowMode: boolean;
  slowModeInterval: number;
  membersCanInvite: boolean;
  membersCanPin: boolean;
  isReadOnly: boolean;
  allowReactions: boolean;
  allowEditing: boolean;
  allowFiles: boolean;
  requireApproval: boolean;
}

export interface TypingUser {
  _id: string;
  username: string;
  displayName: string;
  avatar?: string;
}

interface ChatStore {
  // Current room
  activeRoomId: string | null;
  setActiveRoomId: (id: string | null) => void;

  // Rooms
  rooms: Room[];
  setRooms: (rooms: Room[]) => void;
  addRoom: (room: Room) => void;
  updateRoom: (roomId: string, updates: Partial<Room>) => void;
  removeRoom: (roomId: string) => void;

  // Messages per room
  messages: Record<string, Message[]>;
  setMessages: (roomId: string, messages: Message[]) => void;
  addMessage: (roomId: string, message: Message) => void;
  updateMessage: (roomId: string, messageId: string, updates: Partial<Message>) => void;
  deleteMessage: (roomId: string, messageId: string) => void;
  prependMessages: (roomId: string, messages: Message[]) => void;

  // Typing indicators
  typingUsers: Record<string, TypingUser[]>;
  setTypingUser: (roomId: string, user: TypingUser) => void;
  removeTypingUser: (roomId: string, userId: string) => void;

  // Online users
  onlineUsers: Record<string, string>; // userId -> status
  setUserStatus: (userId: string, status: string) => void;

  // Reply
  replyTo: Message | null;
  setReplyTo: (message: Message | null) => void;

  // Edit
  editingMessage: Message | null;
  setEditingMessage: (message: Message | null) => void;

  // UI
  showMemberList: boolean;
  setShowMemberList: (v: boolean) => void;
  showSearch: boolean;
  setShowSearch: (v: boolean) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  activeRoomId: null,
  setActiveRoomId: (id) => set({ activeRoomId: id }),

  rooms: [],
  setRooms: (rooms) => set({ rooms }),
  addRoom: (room) => set((s) => ({ rooms: [room, ...s.rooms.filter((r) => r._id !== room._id)] })),
  updateRoom: (roomId, updates) =>
    set((s) => ({ rooms: s.rooms.map((r) => (r._id === roomId ? { ...r, ...updates } : r)) })),
  removeRoom: (roomId) => set((s) => ({ rooms: s.rooms.filter((r) => r._id !== roomId) })),

  messages: {},
  setMessages: (roomId, messages) =>
    set((s) => ({ messages: { ...s.messages, [roomId]: messages } })),
  addMessage: (roomId, message) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [roomId]: [...(s.messages[roomId] || []), message],
      },
    })),
  updateMessage: (roomId, messageId, updates) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [roomId]: (s.messages[roomId] || []).map((m) =>
          m._id === messageId ? { ...m, ...updates } : m
        ),
      },
    })),
  deleteMessage: (roomId, messageId) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [roomId]: (s.messages[roomId] || []).map((m) =>
          m._id === messageId ? { ...m, isDeleted: true } : m
        ),
      },
    })),
  prependMessages: (roomId, messages) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [roomId]: [...messages, ...(s.messages[roomId] || [])],
      },
    })),

  typingUsers: {},
  setTypingUser: (roomId, user) =>
    set((s) => ({
      typingUsers: {
        ...s.typingUsers,
        [roomId]: [
          ...(s.typingUsers[roomId] || []).filter((u) => u._id !== user._id),
          user,
        ],
      },
    })),
  removeTypingUser: (roomId, userId) =>
    set((s) => ({
      typingUsers: {
        ...s.typingUsers,
        [roomId]: (s.typingUsers[roomId] || []).filter((u) => u._id !== userId),
      },
    })),

  onlineUsers: {},
  setUserStatus: (userId, status) =>
    set((s) => ({ onlineUsers: { ...s.onlineUsers, [userId]: status } })),

  replyTo: null,
  setReplyTo: (message) => set({ replyTo: message }),

  editingMessage: null,
  setEditingMessage: (message) => set({ editingMessage: message }),

  showMemberList: false,
  setShowMemberList: (v) => set({ showMemberList: v }),
  showSearch: false,
  setShowSearch: (v) => set({ showSearch: v }),
}));
