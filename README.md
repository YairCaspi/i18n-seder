# Seder-18

A translations editor. UI is built with React (Vite) during development and then served as static files by Express.
At runtime the user does NOT need React or Vite — just Node to run the server.

## Setup

```bash
# in project root
npm install

# prepare frontend build
cd frontend
npm install
npm run build
cd ..

# run server with translations directory
node src/cli.js --dir /path/to/translations --main en
