# ShadowChat 1.0.0

This repository contains a simple real-time chat application built with **Node.js** and **Express**. The front end lives in the `/client` directory while all server code resides in `/server`.

## Development

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

This runs the Express server on port `3001` and the Vite development server on port `5173`. The client connects to the server using Socket.IO.

## Production build

To create a production build of the client run:

```bash
npm run build
```

After building, the Express server can serve the compiled files from the `dist` directory.

## Database configuration

The server uses [Supabase](https://supabase.com) for persistent storage. Copy `.env.example` to `.env` and provide your project credentials:

```
SUPABASE_URL=<your-supabase-url>
SUPABASE_ANON_KEY=<your-anon-key>
```

The `users` and `messages` tables should exist in your Supabase database. An `avatars` storage bucket is required for storing profile images.

## API endpoints

- `GET /api/chat-history` – returns the latest chat messages from the database.
- `POST /api/profile-image` – upload a profile picture for a user. Send `userId` in the request body and an `image` field containing the file.

