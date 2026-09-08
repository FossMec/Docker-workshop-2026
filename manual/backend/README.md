# Manual Backend

This folder contains the Node.js + Express application that is built into a Docker image during the workshop.

## You do not need Node installed to run this project

Do not run `npm install` on the host machine.

The Dockerfile does this during image build:

```dockerfile
COPY package*.json ./
RUN npm install --omit=dev
```

Then the container starts the application with:

```dockerfile
CMD ["npm", "start"]
```

## Files

- `Dockerfile` — instructions for building the application image
- `package.json` — Node dependencies and start script
- `server.js` — Express server and MongoDB API
- `public/index.html` — registration form
- `public/app.js` — browser-side requests to the Express API
- `public/style.css` — page styling

## Configuration

The application reads its MongoDB configuration from environment variables:

```text
PORT
MONGO_HOST
MONGO_PORT
MONGO_DB
```

For the manual workshop run, these become:

```text
PORT=5000
MONGO_HOST=mongo
MONGO_PORT=27017
MONGO_DB=fossmec
```

The important networking idea is that the backend connects to `mongo`, not `localhost`.

## Build

From this folder:

```bash
docker build -t fossmec-backend .
```

## Run

```bash
docker run -d --name fossmec-backend --network app-network -p 5000:5000 -e PORT=5000 -e MONGO_HOST=mongo -e MONGO_PORT=27017 -e MONGO_DB=fossmec fossmec-backend
```
