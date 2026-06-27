# NexTalk — Real-Time Chat Application

> Final Year Project | Full-Stack Web Development

A real-time messaging platform built with Next.js 14, MongoDB, Socket.IO, and WebRTC. Supports direct messages, group chats, channels, voice/video calls, file sharing, and more.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Architecture](#architecture)
- [API Reference](#api-reference)
- [Deployment](#deployment)
- [Screenshots](#screenshots)

---

## Features

### Messaging

- Real-time messages via Socket.IO (no polling)
- Direct messages (1-to-1)
- Group chats (up to 500 members)
- Channels (broadcast, public or private)
- Message reactions (emoji)
- Reply to messages (threaded replies)
- Edit and delete messages
- Pin important messages
- @mentions and #tags
- File sharing via Cloudinary (images, video, audio, documents)
- Typing indicators with real username
- Read receipts
- Messages displayed right (own) / left (others) — WhatsApp style

### Voice & Video

- Peer-to-peer WebRTC calls (no third-party service required)
- Audio calls and video calls
- Mute / camera toggle
- Call duration display
- Incoming call popup with Accept / Decline
- Full call history

### Authentication & Security

- Email + password registration with email verification
- OAuth login: Google and GitHub
- Two-Factor Authentication (TOTP — Google Authenticator compatible)
- Backup codes for 2FA recovery
- Password reset via email
- JWT sessions (30-day expiry)
- Account roles: User, Moderator, Admin
- Banned account detection

### Social

- Friend system with requests (send / accept / decline)
- User profiles with bio, status, and badges
- Online / Away / Busy / Invisible status
- Block users
- Mutual friends count

### Communities

- Public channel discovery
- Invite links with optional expiry and max-use limits
- Email invitations
- Room member management (roles: owner, admin, moderator, member)
- Room settings: slow mode, read-only, approval required
- Audit log for all admin actions

### Admin Dashboard

- Platform statistics and charts (30-day trends)
- User management: search, ban/unban, change roles
- Audit log viewer with severity levels (low / medium / high / critical)
- Most active rooms and users

### Other

- Progressive Web App (PWA) — installable on mobile
- Fully responsive (mobile-first)
- Dark theme with glassmorphism design
- Beautiful HTML email templates
- In-app notification center

---

## Tech Stack

| Layer        | Technology                                 |
| ------------ | ------------------------------------------ |
| Frontend     | Next.js 14 (App Router), React, TypeScript |
| Styling      | Tailwind CSS, custom CSS variables         |
| Real-time    | Socket.IO                                  |
| Database     | MongoDB, Mongoose ODM                      |
| Auth         | NextAuth v4 (JWT strategy)                 |
| File uploads | Cloudinary (free tier, 25 GB)              |
| Email        | Nodemailer (SMTP)                          |
| Charts       | Recharts                                   |
| State        | Zustand                                    |
| Animations   | Framer Motion                              |
| Validation   | Zod + React Hook Form                      |
| 2FA          | otplib (TOTP) + qrcode                     |
| Video/Audio  | WebRTC (native browser API)                |
| Deployment   | Railway (Socket.IO support)                |

---

## Project Structure

```
nextalk/
├── server.ts                      # Custom server (Next.js + Socket.IO)
├── tsconfig.server.json           # ts-node config for server.ts
├── .npmrc                         # legacy-peer-deps=true
├── public/
│   └── manifest.json              # PWA manifest
├── src/
│   ├── app/
│   │   ├── (landing)/             # Marketing / homepage
│   │   ├── (auth)/                # Login, register, password reset, verify
│   │   ├── (app)/                 # Protected app routes
│   │   │   ├── chat/              # Chat list + room view
│   │   │   ├── friends/           # Friend management
│   │   │   ├── channels/          # Channel discovery
│   │   │   ├── calls/             # Call history
│   │   │   ├── notifications/     # Notification center
│   │   │   ├── settings/          # Profile, security, 2FA, appearance
│   │   │   ├── admin/             # Admin dashboard
│   │   │   └── profile/[username] # Public profile
│   │   ├── api/                   # REST API routes
│   │   └── invite/[code]/         # Invite link redemption
│   ├── components/
│   │   ├── auth/                  # AuthProvider
│   │   ├── chat/                  # ChatRoom, MessageList, MessageInput…
│   │   ├── layout/                # AppSidebar, SocketInitializer
│   │   ├── modals/                # CreateRoom, Invite, CallModal…
│   │   └── shared/                # UserAvatar
│   ├── hooks/
│   │   └── useSocket.ts           # Socket.IO client hook
│   ├── lib/
│   │   ├── auth/options.ts        # NextAuth configuration
│   │   ├── db/mongoose.ts         # MongoDB connection
│   │   ├── email/mailer.ts        # Nodemailer + HTML email templates
│   │   ├── socket/server.ts       # Socket.IO server logic
│   │   └── utils/index.ts         # Shared utilities
│   ├── models/
│   │   ├── User.ts
│   │   ├── Message.ts
│   │   ├── Room.ts
│   │   └── index.ts               # Notification, Invitation, AuditLog, Call
│   ├── store/
│   │   └── chatStore.ts           # Zustand global state
│   └── types/
│       └── next-auth.d.ts         # NextAuth type extensions
```

---

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- MongoDB (local or Atlas)
- Google OAuth credentials
- GitHub OAuth credentials
- SMTP email server (Gmail, SendGrid…)
- Cloudinary account (free)

### 1. Clone the repository

```bash
git clone https://github.com/daniel10027/NexTalk.git
cd NexTalk
```

### 2. Install dependencies

```bash
npm install --legacy-peer-deps
```

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in all values in `.env.local` (see [Environment Variables](#environment-variables)).

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> **Note:** The dev server uses a custom Next.js server (`server.ts`) to run Socket.IO on the same port. It starts automatically with `npm run dev`.

---

## Environment Variables

```env
# App
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-very-long-random-secret
JWT_SECRET=another-random-secret

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/nextalk

# OAuth — Google
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# OAuth — GitHub
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Email (SMTP)
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your@gmail.com
EMAIL_SERVER_PASSWORD=your-app-password
EMAIL_FROM=NexTalk <noreply@nextalk.app>

# File uploads — Cloudinary (free at cloudinary.com)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# 2FA
TOTP_ENCRYPTION_KEY=32-character-random-string

# Admin
ADMIN_EMAILS=admin@example.com
```

### Setting up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project → Credentials → OAuth 2.0 Client ID
3. Add `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI
4. Copy Client ID and Secret to `.env.local`

### Setting up GitHub OAuth

1. Go to GitHub → Settings → Developer settings → OAuth Apps → New OAuth App
2. Homepage URL: `http://localhost:3000`
3. Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
4. Copy Client ID and Secret to `.env.local`

### Setting up Gmail SMTP

1. Enable 2FA on your Google account
2. Go to Security → App passwords → Create one for "Mail"
3. Use that password as `EMAIL_SERVER_PASSWORD`

### Setting up Cloudinary

1. Sign up free at [cloudinary.com](https://cloudinary.com)
2. Go to Dashboard → copy Cloud Name, API Key, API Secret
3. Add them to `.env.local`

---

## Architecture

### Real-Time Layer

NexTalk uses a custom Next.js server (`server.ts`) that runs Socket.IO alongside the Next.js request handler on the same HTTP server. This eliminates the need for a separate WebSocket server.

```
Browser ←→ Socket.IO ←→ server.ts ←→ Next.js (App Router)
                ↓
           MongoDB (event persistence)
```

**Socket.IO Events:**

| Event                  | Direction       | Description            |
| ---------------------- | --------------- | ---------------------- |
| `message:send`         | Client → Server | Send a message         |
| `message:new`          | Server → Client | Receive a new message  |
| `message:edit`         | Client → Server | Edit a message         |
| `message:delete`       | Client → Server | Delete a message       |
| `message:react`        | Client → Server | Add/remove a reaction  |
| `message:pin`          | Client → Server | Pin/unpin a message    |
| `typing:start`         | Client → Server | Start typing indicator |
| `typing:stop`          | Client → Server | Stop typing indicator  |
| `status:update`        | Client → Server | Update online status   |
| `call:initiate`        | Client → Server | Start a call           |
| `call:accept`          | Client → Server | Accept a call          |
| `call:decline`         | Client → Server | Decline a call         |
| `call:end`             | Client → Server | End a call             |
| `webrtc:offer`         | Client → Server | WebRTC SDP offer       |
| `webrtc:answer`        | Client → Server | WebRTC SDP answer      |
| `webrtc:ice-candidate` | Client → Server | ICE candidate          |

### WebRTC Calls

Calls use native browser WebRTC with Socket.IO as the signaling server:

```
Caller   → [socket: call:initiate]        → Receiver
Caller   → [socket: webrtc:offer]         → Receiver
Receiver → [socket: webrtc:answer]        → Caller
Both    ↔ [socket: webrtc:ice-candidate] ↔ Both
Both    ←→ [WebRTC peer connection]       ←→ Both
```

STUN server: `stun:stun.l.google.com:19302` (Google's free public STUN server)

### Database Schema

| Model        | Description                                    |
| ------------ | ---------------------------------------------- |
| User         | Account, auth, friends, preferences, roles     |
| Room         | DMs, groups, channels with member roles        |
| Message      | Text, media, reactions, mentions, reply chains |
| Notification | In-app notifications by type                   |
| Invitation   | Invite codes with expiry and usage tracking    |
| AuditLog     | Admin action history with severity levels      |
| Call         | Call records with participants and duration    |

---

## API Reference

### Authentication

| Method   | Endpoint                    | Description                   |
| -------- | --------------------------- | ----------------------------- |
| POST     | `/api/auth/register`        | Register with email           |
| GET      | `/api/auth/verify-email`    | Verify email token            |
| POST     | `/api/auth/forgot-password` | Request password reset        |
| POST     | `/api/auth/reset-password`  | Reset password                |
| GET/POST | `/api/auth/two-factor`      | Get QR / enable / disable 2FA |

### Messages

| Method | Endpoint                        | Description               |
| ------ | ------------------------------- | ------------------------- |
| GET    | `/api/messages?roomId=&before=` | Paginated message history |
| POST   | `/api/messages`                 | Send a message            |
| PATCH  | `/api/messages/[id]`            | Edit a message            |
| DELETE | `/api/messages/[id]`            | Delete a message          |

### Rooms

| Method | Endpoint               | Description                                 |
| ------ | ---------------------- | ------------------------------------------- |
| GET    | `/api/rooms`           | List user rooms or discover public channels |
| POST   | `/api/rooms`           | Create group or channel                     |
| POST   | `/api/rooms/dm`        | Create or find a direct message room        |
| GET    | `/api/rooms/[id]`      | Get room details                            |
| PATCH  | `/api/rooms/[id]`      | Update room (owner/admin only)              |
| DELETE | `/api/rooms/[id]`      | Delete room (owner/admin only)              |
| POST   | `/api/rooms/[id]/join` | Join a public room                          |

### Users

| Method | Endpoint                         | Description               |
| ------ | -------------------------------- | ------------------------- |
| GET    | `/api/users/search?q=`           | Search users              |
| GET    | `/api/users/me`                  | Current user profile      |
| PATCH  | `/api/users/me`                  | Update profile            |
| GET    | `/api/users/me/friends`          | Friends list and requests |
| GET    | `/api/users/[id]`                | Get user by ID            |
| POST   | `/api/users/[id]/friend`         | Send friend request       |
| POST   | `/api/users/[id]/friend/accept`  | Accept friend request     |
| POST   | `/api/users/[id]/friend/decline` | Decline friend request    |
| DELETE | `/api/users/[id]/friend`         | Remove friend             |
| GET    | `/api/users/profile/[username]`  | Public profile            |

### Uploads

| Method | Endpoint      | Description               |
| ------ | ------------- | ------------------------- |
| POST   | `/api/upload` | Upload file to Cloudinary |

### Invitations

| Method | Endpoint                      | Description                        |
| ------ | ----------------------------- | ---------------------------------- |
| POST   | `/api/invitations`            | Create invite link or email invite |
| GET    | `/api/invitations/[code]`     | Get invite info                    |
| POST   | `/api/invitations/[code]/use` | Redeem invite                      |

### Notifications

| Method | Endpoint                  | Description         |
| ------ | ------------------------- | ------------------- |
| GET    | `/api/notifications`      | Get notifications   |
| PATCH  | `/api/notifications`      | Mark all as read    |
| PATCH  | `/api/notifications/[id]` | Mark one as read    |
| DELETE | `/api/notifications/[id]` | Delete notification |

### Calls

| Method | Endpoint     | Description  |
| ------ | ------------ | ------------ |
| GET    | `/api/calls` | Call history |

### Search

| Method | Endpoint               | Description                            |
| ------ | ---------------------- | -------------------------------------- |
| GET    | `/api/search?q=&type=` | Global search (users, rooms, messages) |

### Admin

| Method | Endpoint                                | Description                          |
| ------ | --------------------------------------- | ------------------------------------ |
| GET    | `/api/admin?view=overview\|users\|logs` | Dashboard statistics and data        |
| POST   | `/api/admin`                            | Ban, unban, change role, delete user |
| GET    | `/api/admin/promote?email=&secret=`     | Promote user to admin (setup only)   |

---

## Deployment

### Railway (Recommended — supports Socket.IO)

1. Push your code to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Select your repo and branch `main`
4. Add all environment variables in Railway Dashboard → Variables
5. Railway auto-deploys on every push to `main`

**Update OAuth callbacks after getting your Railway URL:**

- Google: `https://your-app.railway.app/api/auth/callback/google`
- GitHub: `https://your-app.railway.app/api/auth/callback/github`

### Scripts

```bash
npm run dev      # Development server (custom server + Socket.IO)
npm run build    # Production build
npm run start    # Production server
npm run lint     # ESLint
```

---

## License

MIT License — free to use for educational and personal projects.

---

## Acknowledgements

- [Next.js](https://nextjs.org) — React framework
- [Socket.IO](https://socket.io) — Real-time engine
- [MongoDB](https://mongodb.com) — Database
- [NextAuth.js](https://next-auth.js.org) — Authentication
- [Cloudinary](https://cloudinary.com) — File uploads
- [Tailwind CSS](https://tailwindcss.com) — Styling
- [Lucide](https://lucide.dev) — Icons
- [Recharts](https://recharts.org) — Charts
- [WebRTC](https://webrtc.org) — Peer-to-peer calls

---

_Built as a Final Year Project demonstrating full-stack development with real-time communication, authentication, security, and modern UI/UX design._

---

## Screenshots

|                                                   |                                                          |
| ------------------------------------------------- | -------------------------------------------------------- |
| ![Home](./Results/home.png)                       | ![Login](./Results/login_create_account.png)             |
| **Landing Page**                                  | **Login & Register**                                     |
| ![Private Chat](./Results/private_discussion.png) | ![Group Channel](./Results/group_channel_discussion.png) |
| **Private Messages**                              | **Group & Channel Chat**                                 |
| ![Incoming Call](./Results/incomming_call.png)    | ![Call Started](./Results/call_stared.png)               |
| **Incoming Call**                                 | **Active Call**                                          |
| ![Call History](./Results/call_history.png)       | ![Friend Profile](./Results/friend_profil.png)           |
| **Call History**                                  | **Friend Profile**                                       |
| ![Forgot Password](./Results/foget_password.png)  | ![Admin Dashboard](./Results/admin_dash.png)             |
| **Password Reset**                                | **Admin Dashboard**                                      |
| ![User List](./Results/user_list.png)             |                                                          |
| **User Management**                               |                                                          |
