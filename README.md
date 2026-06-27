# NexTalk Real-Time Chat Application

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

- Real-time messages via Socket.IO
- Direct messages (1-to-1)
- Group chats (up to 500 members)
- Channels (broadcast, public or private)
- Message reactions (emoji)
- Reply to messages (threaded replies)
- Edit and delete messages
- Pin important messages
- @mentions and #tags
- File sharing (images, video, audio, documents)
- Typing indicators
- Read receipts

### Voice & Video

- Peer-to-peer WebRTC calls (no third-party service required)
- Audio calls and video calls
- Mute / camera toggle
- Call duration display
- Full call history

### Authentication & Security

- Email + password registration with verification
- OAuth login: Google and GitHub
- Two-Factor Authentication (TOTP Google Authenticator compatible)
- Backup codes for 2FA recovery
- Password reset via email
- JWT sessions (30-day expiry)
- Account roles: User, Moderator, Admin

### Social

- Friend system with requests
- User profiles with bio, status, and badges
- Online/Away/Busy/Invisible status
- Block users
- Mutual friends count

### Communities

- Public channel discovery
- Invite links with optional expiry and max-use limits
- Email invitations
- Room member management (roles: owner, admin, moderator, member)
- Room settings: slow mode, read-only, approval required
- Audit log for admin actions

### Admin Dashboard

- Platform statistics and charts (30-day trends)
- User management: search, ban, change roles
- Audit log viewer with severity levels
- Most active rooms and users

### Other

- Progressive Web App (PWA) installable
- Fully responsive (mobile-first)
- Dark theme with glassmorphism design
- Email notifications (beautiful HTML templates)
- Notification center in-app

---

## Tech Stack

| Layer        | Technology                                 |
| ------------ | ------------------------------------------ |
| Frontend     | Next.js 14 (App Router), React, TypeScript |
| Styling      | Tailwind CSS, custom CSS variables         |
| Real-time    | Socket.IO                                  |
| Database     | MongoDB, Mongoose ODM                      |
| Auth         | NextAuth v4 (JWT strategy)                 |
| File uploads | UploadThing (free, no credit card)         |
| Email        | Nodemailer (SMTP)                          |
| Charts       | Recharts                                   |
| State        | Zustand                                    |
| Animations   | Framer Motion                              |
| Validation   | Zod + React Hook Form                      |
| 2FA          | otplib (TOTP) + qrcode                     |
| Video/Audio  | WebRTC (native browser API)                |
| Deployment   | Vercel + MongoDB Atlas                     |

---

## Project Structure

```
nextalk/
├── server.ts                    # Custom server (Next.js + Socket.IO)
├── public/
│   └── manifest.json            # PWA manifest
├── src/
│   ├── app/
│   │   ├── (landing)/           # Marketing / homepage
│   │   ├── (auth)/              # Login, register, password reset, verify
│   │   ├── (app)/               # Protected app routes
│   │   │   ├── chat/            # Chat list + room view
│   │   │   ├── friends/         # Friend management
│   │   │   ├── channels/        # Channel discovery
│   │   │   ├── calls/           # Call history
│   │   │   ├── notifications/   # Notification center
│   │   │   ├── settings/        # Profile, security, 2FA, appearance
│   │   │   ├── admin/           # Admin dashboard
│   │   │   └── profile/[username]/ # Public profile
│   │   ├── api/                 # API routes (REST)
│   │   └── invite/[code]/       # Invite link redemption
│   ├── components/
│   │   ├── auth/                # AuthProvider
│   │   ├── chat/                # ChatRoom, MessageList, MessageInput, etc.
│   │   ├── layout/              # AppSidebar, SocketInitializer
│   │   ├── modals/              # CreateRoom, Invite, Call, UserProfile
│   │   └── shared/              # UserAvatar
│   ├── hooks/
│   │   └── useSocket.ts         # Socket.IO client hook
│   ├── lib/
│   │   ├── auth/options.ts      # NextAuth configuration
│   │   ├── db/mongoose.ts       # MongoDB connection
│   │   ├── email/mailer.ts      # Nodemailer + email templates
│   │   ├── socket/server.ts     # Socket.IO server logic
│   │   ├── upload/uploadthing.ts # File upload config
│   │   └── utils/index.ts       # Shared utilities
│   ├── models/                  # Mongoose schemas
│   │   ├── User.ts
│   │   ├── Message.ts
│   │   ├── Room.ts
│   │   └── index.ts             # Notification, Invitation, AuditLog, Call
│   ├── store/
│   │   └── chatStore.ts         # Zustand global state
│   └── types/
│       └── next-auth.d.ts       # NextAuth type extensions
```

---

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- MongoDB (local or Atlas)
- Google OAuth credentials
- GitHub OAuth credentials
- SMTP email server (Gmail, SendGrid, etc.)

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/nextalk.git
cd nextalk
```

### 2. Install dependencies

```bash
npm install
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

> **Note:** The development server uses a custom Next.js server (`server.ts`) to integrate Socket.IO. It starts automatically with `npm run dev`.

---

## Environment Variables

Create a `.env.local` file (copy from `.env.example`):

```env
# App
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-very-long-random-secret-here
JWT_SECRET=another-random-secret

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/nextalk

# OAuth  Google
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# OAuth  GitHub
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Email (SMTP)
EMAIL_SERVER_HOST=smtp.gmail.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your@gmail.com
EMAIL_SERVER_PASSWORD=your-app-password
EMAIL_FROM=NexTalk <noreply@nextalk.app>

# File uploads  UploadThing (free at uploadthing.com)
UPLOADTHING_SECRET=sk_live_...
UPLOADTHING_APP_ID=your-app-id

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
2. Set Homepage URL: `http://localhost:3000`
3. Set Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
4. Copy Client ID and Secret to `.env.local`

### Setting up Gmail SMTP

1. Enable 2FA on your Google account
2. Go to Security → App passwords
3. Create an app password for "Mail"
4. Use that password as `EMAIL_SERVER_PASSWORD`

---

## Architecture

### Real-Time Layer

NexTalk uses a custom Next.js server (`server.ts`) that runs Socket.IO alongside the Next.js request handler on the same HTTP server. This eliminates the need for a separate WebSocket server.

```
Browser ←→ Socket.IO ←→ server.ts ←→ Next.js (App Router)
                ↓
           MongoDB (events persistence)
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
Caller → [socket: call:initiate] → Receiver
Caller → [socket: webrtc:offer]  → Receiver
Receiver → [socket: webrtc:answer] → Caller
Both ↔ [socket: webrtc:ice-candidate] ↔ Both
Both ←→ [WebRTC peer connection] ←→ Both
```

STUN server: `stun:stun.l.google.com:19302` (free, Google's public STUN server)

### Database Schema

**User** accounts, auth, friends, preferences  
**Room** DMs, groups, channels with member roles  
**Message** text, media, reactions, mentions, reply chains  
**Notification** in-app notifications by type  
**Invitation** invite codes with expiry and usage tracking  
**AuditLog** admin action history with severity levels  
**Call** call records with participants and duration

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

### Rooms

| Method | Endpoint               | Description                                 |
| ------ | ---------------------- | ------------------------------------------- |
| GET    | `/api/rooms`           | List user rooms or discover public channels |
| POST   | `/api/rooms`           | Create group or channel                     |
| GET    | `/api/rooms/[id]`      | Get room details                            |
| PATCH  | `/api/rooms/[id]`      | Update room (owner/admin only)              |
| DELETE | `/api/rooms/[id]`      | Delete room (owner/admin only)              |
| POST   | `/api/rooms/[id]/join` | Join a public room                          |

### Users

| Method | Endpoint                        | Description               |
| ------ | ------------------------------- | ------------------------- |
| GET    | `/api/users/search?q=`          | Search users              |
| GET    | `/api/users/me`                 | Current user profile      |
| PATCH  | `/api/users/me`                 | Update profile            |
| GET    | `/api/users/me/friends`         | Friends list and requests |
| GET    | `/api/users/[id]`               | Get user by ID            |
| POST   | `/api/users/[id]/friend`        | Send friend request       |
| DELETE | `/api/users/[id]/friend`        | Remove friend             |
| GET    | `/api/users/profile/[username]` | Public profile            |

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
| GET    | `/api/admin?view=overview\|users\|logs` | Dashboard data                       |
| POST   | `/api/admin`                            | Ban, unban, change role, delete user |

---

## Deployment

### Vercel + MongoDB Atlas (Recommended Free)

1. **MongoDB Atlas:** Create a free M0 cluster at [cloud.mongodb.com](https://cloud.mongodb.com). Get your connection string.

2. **UploadThing:** Sign up free at [uploadthing.com](https://uploadthing.com). Create an app and get your keys.

3. **Vercel:** Push to GitHub, then:

   ```bash
   npm i -g vercel
   vercel --prod
   ```

   Add all environment variables in Vercel Dashboard → Project → Settings → Environment Variables.

4. **Update OAuth redirects:** Add your Vercel URL to Google and GitHub OAuth allowed redirect URIs.

> **Socket.IO on Vercel:** Vercel's serverless functions don't support persistent WebSocket connections. For production with Socket.IO, deploy to a VPS (Railway, Render, Fly.io) or use [Vercel's new Long Polling support](https://socket.io/docs/v4/serverless-environments/). Alternatively, migrate to [Pusher](https://pusher.com) (free tier available) which works with Vercel.

### Railway (Recommended for Socket.IO)

```bash
# Install Railway CLI
npm install -g @railway/cli
railway login
railway up
```

Set environment variables in the Railway dashboard.

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t nextalk .
docker run -p 3000:3000 --env-file .env.local nextalk
```

---

## Scripts

```bash
npm run dev      # Development server (custom server with Socket.IO)
npm run build    # Production build
npm run start    # Production server
npm run lint     # ESLint
```

---

## License

MIT License free to use for educational and personal projects.

---

## Acknowledgements

- [Next.js](https://nextjs.org) React framework
- [Socket.IO](https://socket.io) Real-time engine
- [MongoDB](https://mongodb.com) Database
- [NextAuth.js](https://next-auth.js.org) Authentication
- [UploadThing](https://uploadthing.com) File uploads
- [Tailwind CSS](https://tailwindcss.com) Styling
- [Lucide](https://lucide.dev) Icons
- [Recharts](https://recharts.org) Charts

---

_Built as a Final Year Project demonstrating full-stack development with real-time communication, authentication, security, and modern UI/UX design._
