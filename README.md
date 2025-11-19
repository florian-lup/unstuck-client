# Unstuck Client

> AI-powered gaming assistant overlay for real-time help while you play

**Unstuck** is a desktop overlay application that provides intelligent gaming assistance through voice and text chat.

## Features

### 🎮 Gaming Intelligence

- **30+ Supported Games** across multiple genres:
  - MMORPGs (World of Warcraft, Final Fantasy XIV, Guild Wars 2, etc.)
  - MOBAs (League of Legends, Dota 2, Smite, etc.)
  - Souls-likes (Elden Ring, Dark Souls 3, Sekiro, etc.)
  - ARPGs (Path of Exile 1 & 2, Diablo 4, Last Epoch, etc.)
  - Strategy (StarCraft 2, Age of Empires 4, Total War, etc.)
  - Survival (Valheim, Rust, Minecraft, etc.)
- **Game-Specific Context** for accurate, relevant answers
- **Custom Game Support** - add any game you're playing

### 💬 Intelligent Chat

- **Voice Chat** with OpenAI Realtime API (WebRTC)
- **Text Chat** with conversation history
- **Context-Aware Responses** tailored to your selected game
- **Conversation Management** - save and resume previous discussions
- **Web Search Integration** for up-to-date game information

### ⚡ Overlay Experience

- **Always-On-Top Overlay** that works while gaming
- **Customizable Transparency** (10-100%)
- **Global Hotkeys** for quick access:
  - Toggle overlay visibility
  - Open text chat
  - Start voice chat
  - View conversation history
  - Access settings
  - Start new conversation
- **Click-Through Mode** available for minimal interference

### 🔐 Security & Authentication

- **Auth0 Integration** for secure authentication
- **OAuth 2.0 Device Flow** for desktop apps
- **Secure Token Management** with system keychain
- **Session Validation** and automatic refresh

### 🚀 Performance & Updates

- **Auto-Update System** via Electron Builder
- **Auto-Launch on Startup** (optional)
- **Efficient Resource Management**
- **Local Conversation Caching**

## Tech Stack

### Frontend

- **React 18** with TypeScript
- **Vite** for blazing-fast builds
- **TailwindCSS v4** with custom animations
- **Radix UI** components (Slider, Toggle, Slot)
- **Lucide React** for icons
- **React Markdown** for message rendering

### Desktop Framework

- **Electron 30** for cross-platform desktop
- **Electron Builder** for packaging and distribution
- **Electron Updater** for automatic updates

### Development

- **TypeScript 5.2**
- **ESLint** with security plugins
- **Prettier** for code formatting
- **pnpm** for fast, disk-efficient package management

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **pnpm** 8+ (install via `npm install -g pnpm`)
- **Git**

## Installation

### Clone the Repository

```bash
git clone https://github.com/florian-lup/unstuck-client
cd unstuck-client
```

### Install Dependencies

```bash
pnpm install
```

### Configuration

Create a `config/auth.config.ts` file with your Auth0 credentials:

```typescript
export const auth0Config = {
  domain: 'your-auth0-domain.auth0.com',
  clientId: 'your-client-id',
  audience: 'your-api-audience',
  scope: 'openid profile email offline_access',
}
```

## Development

### Run in Development Mode

```bash
pnpm dev
```

This starts both the Vite dev server and Electron app with hot-reload enabled.

### Linting

```bash
# Check for issues
pnpm lint

# Auto-fix issues
pnpm lint:fix

# Production-level linting
pnpm lint:prod
```

### Code Formatting

```bash
# Format all files
pnpm format

# Check formatting
pnpm format:check
```

## Building

### Build for Production

```bash
pnpm build
```

This will:

1. Run linting checks
2. Compile TypeScript
3. Build the Vite app
4. Package with Electron Builder

Output will be in the `release/{version}` directory.

### Build and Publish

```bash
pnpm build:publish
```

Builds and publishes the release to GitHub (requires proper GitHub configuration).

## Project Structure

```
unstuck-client/
├── electron/                # Electron main process
│   ├── auth0/              # Auth0 authentication services
│   ├── utils/              # Utilities (logger, etc.)
│   ├── main.ts             # Main process entry
│   ├── preload.ts          # Preload script
│   └── window-manager.ts   # Window management
├── src/                    # React application
│   ├── components/         # React components
│   │   ├── ui/            # Reusable UI components
│   │   ├── text-chat.tsx
│   │   ├── navigation-bar.tsx
│   │   ├── settings-menu.tsx
│   │   └── ...
│   ├── hooks/             # Custom React hooks (organized by domain)
│   │   ├── app-logic/     # App state composition
│   │   │   ├── use-app-logic.ts      # Main orchestrator
│   │   │   ├── use-conversation.ts   # Message handling
│   │   │   ├── use-keybinds.ts       # Keybind management
│   │   │   ├── use-panels.ts         # Panel visibility
│   │   │   ├── use-transparency.ts   # Transparency feature
│   │   │   └── index.ts              # Barrel export
│   │   ├── auth/          # Authentication hooks
│   │   │   ├── use-auth.ts           # Auth state
│   │   │   ├── use-auth-flow.ts      # Device auth flow
│   │   │   └── index.ts
│   │   ├── chat/          # Chat feature hooks
│   │   │   ├── use-voice-chat.ts     # Voice chat
│   │   │   ├── use-text-chat.ts      # Text chat
│   │   │   └── index.ts
│   │   ├── utilities/     # Generic utility hooks
│   │   │   ├── use-click-through.ts
│   │   │   ├── use-keyboard-toggle.ts
│   │   │   ├── use-countdown-timer.ts
│   │   │   ├── use-auto-launch.ts
│   │   │   └── index.ts
│   │   ├── use-subscription.ts       # Subscription management
│   │   └── index.ts       # Top-level barrel export
│   ├── lib/               # Core libraries (organized by domain)
│   │   ├── api/           # API client and utilities
│   │   │   ├── api-client.ts         # Backend API client
│   │   │   ├── api-error-handler.ts  # Error handling
│   │   │   ├── http-client.ts        # HTTP wrapper
│   │   │   └── index.ts
│   │   ├── auth/          # Authentication
│   │   │   ├── auth-client.ts        # Auth0 client
│   │   │   └── index.ts
│   │   ├── chat/          # Chat services
│   │   │   ├── chat-service.ts       # Text chat service
│   │   │   ├── voice-session-service.ts  # Voice sessions
│   │   │   ├── openai-realtime-webrtc-manager.ts  # WebRTC manager
│   │   │   ├── realtime/  # WebRTC realtime modules
│   │   │   │   ├── audio-manager.ts        # Audio capture/playback
│   │   │   │   ├── data-channel-manager.ts # WebRTC messaging
│   │   │   │   ├── message-handler.ts      # Event processing
│   │   │   │   ├── webrtc-connection.ts    # Connection management
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── data/          # Game data and constants
│   │   │   ├── games.ts              # Game library
│   │   │   └── index.ts
│   │   ├── utils.ts       # Standalone utilities
│   │   └── index.ts       # Top-level barrel export
│   ├── services/          # Service layer
│   │   └── conversation-cache.ts
│   └── types/             # TypeScript definitions
│       ├── api-types.ts
│       └── electron.d.ts
├── build/                 # Build configuration
├── config/                # Application configuration
├── public/                # Static assets
└── release/               # Build output
```

## Architecture

### Main Process (Electron)

- **Window Management**: Creates and manages overlay window
- **Auth0 Service**: Handles device flow authentication
- **Token Manager**: Secure storage and refresh of tokens
- **Auto-Updater**: Manages application updates
- **IPC Handlers**: Communication bridge with renderer

### Renderer Process (React)

- **App Logic**: Core application state and business logic
- **API Client**: Communication with backend services
- **Voice Chat Manager**: WebRTC connection handling
- **UI Components**: Modern, accessible interface
- **Conversation Cache**: Local storage for chat history

### Backend API

- **Text Chat**: AI-powered text responses
- **Gaming Chat**: Game-specific answers with web search
- **Voice Sessions**: Realtime voice conversation
- **Subscription Management**: Stripe integration
- **User Management**: Auth0 user synchronization

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Use TypeScript for all new code
- Follow the existing ESLint configuration
- Format code with Prettier before committing
- Write descriptive commit messages

## License

This project is proprietary software. All rights reserved.

## 👤 Author

**Florian Lup**

- Email: contact@florianup.com
- GitHub: [@florian-lup](https://github.com/florian-lup)

## 🐛 Support

For support, email contact@florianup.com or open an issue in the repository.
