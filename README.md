# FOSSMEC Docker Workshop Project

This repository is the hands-on project used in the Docker workshop.

The project is intentionally simple:

- **Frontend:** HTML, CSS and JavaScript
- **Backend:** Node.js + Express
- **Database:** MongoDB
- **Database UI:** Mongo Express
- **Orchestration:** Docker Compose

The application is a small **registration demo**. Participants enter a mock name, email and password, the browser sends the data to the Express backend, and the backend stores it in MongoDB.

The workshop also uses Mongo Express so participants can see the database directly, create databases and collections, and add documents themselves.

> **Important:** Use fake data only. Do not enter a real password. This is a Docker teaching project, not a production authentication system.

## What participants will see

```text
Browser
   │
   │  http://localhost:5000
   ▼
Node.js + Express
   │
   │  Docker network: app-network
   ▼
MongoDB

Mongo Express
   │
   │  http://localhost:8080
   ▼
MongoDB
```

The browser-facing app runs on **port 5000**. Mongo Express runs on **port 8080** on the host and connects to MongoDB over the Docker network.

Mongo Express login:
- Username: `admin`
- Password: `pass`

## No local Node dependencies are required

Participants do **not** need to run `npm install` on their computer.

The Dockerfile installs the Node dependencies **inside the image while the image is being built**. The workshop therefore uses Docker to provide the application environment.

You only need Docker Desktop running. Git and VS Code are useful for working with the repository, but Node packages do not need to be installed on the host machine.

## Repository layout

```text
.
├── manual/
│   ├── README.md
│   └── backend/
│       ├── Dockerfile
│       ├── package.json
│       ├── server.js
│       └── public/
│
├── compose/
│   ├── README.md
│   ├── compose.yaml
│   └── backend/
│       ├── Dockerfile
│       ├── package.json
│       ├── server.js
│       └── public/
│
├── CHEATSHEET.md
└── INSTRUCTOR_GUIDE.md
```

There is deliberately **no starter folder** and **no debugging exercise folder**. The project is meant to be run with Docker from the beginning.

## Recommended workshop flow

### Part 1: Manual Docker setup

Use `manual/README.md`.

Participants will:

1. Create a Docker network.
2. Run MongoDB in a container.
3. Run Mongo Express in another container.
4. Use Mongo Express to create a database, collection and document.
5. Build the Node/Express application image with a Dockerfile.
6. Run the application container on the same Docker network.
7. Open the app at `http://localhost:5000`.
8. Submit mock registration data.
9. Refresh Mongo Express and see the document in MongoDB.
10. Preview Docker volumes as the Day 2 persistence topic.

### Part 2: Docker Compose

Use `compose/README.md`.

Participants will replace the multiple `docker run` commands with one Compose file and run:

```bash
docker compose up --build
```

Then they can use:

- App: `http://localhost:5000`
- Mongo Express: `http://localhost:8080`

## Cleaning everything up

Manual setup:

```bash
docker rm -f fossmec-backend mongo-express mongo

docker network rm app-network
```

This Day 1 project has no named MongoDB volume, so there is no volume cleanup step.

Compose setup:

```bash
docker compose down
```

## Troubleshooting checklist

### `docker: command not found` or Docker is not responding

Make sure Docker Desktop is open and running.

### The app does not open on port 5000

Check the container:

```bash
docker ps
```

Then check its logs:

```bash
docker logs fossmec-backend
```

For Compose:

```bash
docker compose ps
docker compose logs app
```

### The app says it cannot connect to MongoDB

Inside Docker, the MongoDB hostname is the **container/service name**, not `localhost`.

Manual setup uses:

```text
MONGO_HOST=mongo
```

Compose uses the service name:

```text
mongo
```

`localhost` inside the backend container means the backend container itself.

### Mongo Express does not open on port 8080

Check that the container is running:

```bash
docker ps
```

Then inspect its logs:

```bash
docker logs mongo-express
```

For Compose:

```bash
docker compose logs mongo-express
```

### Why is MongoDB not published to a host port?

It does not need one for this project. MongoDB and the other containers communicate over their Docker network. Only the browser-facing services need host ports published.

## Workshop reminder

The important lesson is not the registration application itself. The application exists to give you something real to put inside containers and connect together while learning:

**images → containers → ports → environment variables → networks → Dockerfiles → Compose**

Volumes and persistence are intentionally left for Day 2.
