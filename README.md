# FlowNote 🎙️

> AI Voice Notes for Mac — capture ideas instantly with a keyboard shortcut.

Press `⌘ + Shift + Space` from anywhere. Speak. Get a structured note in seconds.

---

## Development Setup

### Prerequisites
- Node.js 20+
- macOS (required for native Electron modules)

### Install & Run
```bash
npm install
npm run dev
```

### Available Commands
| Command | Description |
|---|---|
| `npm run dev` | Start app in development mode |
| `npm test` | Run tests |
| `npm run lint` | Check code style |
| `npm run build` | Build production app |

## Project Structure
```
src/
  main/         # Node.js backend (Electron main process)
  renderer/     # React frontend (what the user sees)
  shared/       # Code shared between main and renderer
.github/
  workflows/    # CI/CD automation
```

## Environment
Copy `.env.example` to `.env.local` and add your API keys for local development.
API keys in production are stored in the macOS Keychain.
