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

The server can persist data to a Supabase instance. Set the following environment
variables before starting the server:

```
SUPABASE_URL=<your supabase url>
SUPABASE_KEY=<your supabase anon key>
```

SQL definitions for the required tables can be found in `server/db/schema.sql`.

## API

Additional endpoints are available:

- `GET /api/chat-history` – retrieve full chat history from the database.
- `POST /api/users/:id/profile-image` – store a user's profile image (base64 string) in the database.

