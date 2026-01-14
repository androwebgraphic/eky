# EKY Dev Quickstart

This repo contains a React client (client/) and an Express/MongoDB server (server/).

## Run

- Stop any existing dev servers:

```bash
npm run stop
```

- Run both server (nodemon) and client together:

```bash
npm run dev
```

- Or individually:

```bash
npm run server      # start server (prod)
npm run server:dev  # start server (nodemon)
npm run client      # start client (React dev server)
```

## Health & APIs

- Server health: http://localhost:3001/health
- Dogs API: http://localhost:3001/api/dogs
- Login: POST http://localhost:3001/api/users/logiranje

The client dev server proxies to `http://localhost:3001` per `client/package.json`.

## Troubleshooting

- Port busy (3000/3001):

```bash
npm run stop
npm run dev
```

- CORS: Server allows localhost/LAN by default. Set `CLIENT_ORIGIN` in `server/.env` to whitelist a specific origin (comma-separated if multiple).

## Environment

- Server environment: `server/.env`

```
PORT=3001
MONGO_URI=your_mongodb_uri
```

MongoDB must be reachable for the server to start.