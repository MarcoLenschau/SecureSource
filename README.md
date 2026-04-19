# SecureSource

A self-hosted, end-to-end encrypted one-time note sharing app. Messages are encrypted in the browser before being sent to the server — the server never sees the plaintext. Each note can only be opened once and is permanently deleted afterwards.

## Table of Contents

- [Features](#features)
- [How It Works](#how-it-works)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Security](#security)

## Features

- **End-to-end encryption** — AES-256-GCM, key never leaves the browser
- **One-time links** — note is deleted from the server on first read
- **16-character note IDs** — short, clean share links
- **Auto-expiry** — notes expire after 24 hours if unread
- **Zero dependencies on the frontend** — plain HTML + Tailwind CDN

## How It Works

1. User writes a message and clicks **Link erstellen**
2. The browser generates an AES-256-GCM key and encrypts the message locally
3. Only the ciphertext is sent to the server — the key stays in the URL fragment
4. The generated link encodes `noteId.key.iv` in the hash — never sent to the server
5. When the recipient opens the link, the browser fetches the ciphertext and decrypts it locally
6. The note is deleted from the server immediately after retrieval

## Tech Stack

- **Backend:** Node.js, Express, TypeScript
- **Frontend:** HTML, Tailwind CSS (CDN)
- **Crypto:** Web Crypto API (AES-256-GCM)

## Getting Started

**Requirements:** Node.js 18+

```bash
# Install dependencies
npm install

# Development (with hot reload)
npm run dev

# Production build
npm run build
npm start
```

The app runs on `http://localhost:3000` by default. Set the `PORT` environment variable to change it.

## Project Structure

```
secure-drop/
├── src/
│   ├── server.ts       # Express server & API routes
│   └── store.ts        # In-memory note store with TTL eviction
├── public/
│   ├── index.html      # Note creation page
│   └── note.html       # Note reading page
├── dist/               # Compiled output (tsc)
└── tsconfig.json
```

## Security

- The encryption key is only ever in the URL fragment (`#…`), which is never sent to the server by browsers
- The server stores only ciphertext — it cannot read any message
- Notes are deleted on first read; a HEAD endpoint allows checking existence without consuming the note
- Maximum ciphertext size is 64 KB to prevent abuse
