# Instructor Guide — FOSSMEC Registration Demo

## Teaching goal

The application is deliberately small. The goal is to use it to teach Docker concepts through a real flow:

**image → container → configuration → port → network → multi-container app → Compose**

Do not start with Compose. First make participants experience the individual containers and see why the Compose file is useful later.

## The demo architecture

```text
Browser
   │
   │ localhost:5000
   ▼
Node + Express
   │
   │ Docker network
   ▼
MongoDB

Mongo Express
   │
   │ Docker network
   ▼
MongoDB
```

There is no separate frontend server. The Express app serves the HTML/CSS/JavaScript and exposes the `/api/register` endpoint. This keeps the focus on Docker rather than adding an unnecessary server.

## Suggested flow

### 1. Introduce the project

Tell participants they are going to run a small registration application that stores mock registrations in MongoDB.

The final user-facing ports are:

```text
5000 → application
8080 → Mongo Express
```

### 2. Create the network

```bash
docker network create app-network
```

Pause and explain why the network exists before starting the containers.

### 3. Run MongoDB

```bash
docker run -d --name mongo --network app-network mongo:7
```

Show:

```bash
docker ps
docker logs mongo
```

Explain that MongoDB is not published to a host port. It is reachable by other containers on the network.

### 4. Run Mongo Express

```bash
docker run -d --name mongo-express --network app-network -p 8080:8081 -e ME_CONFIG_MONGODB_URL=mongodb://mongo:27017/ -e ME_CONFIG_BASICAUTH_ENABLED=true -e ME_CONFIG_BASICAUTH_USERNAME=admin -e ME_CONFIG_BASICAUTH_PASSWORD=pass mongo-express:1.0.2-20-alpine3.19
```

Open:

http://localhost:8080

Credentials:

```text
Username: admin
Password: pass
```

Demonstrate:

- create `fossmec` database
- create `registrations` collection
- insert a fake document
- view the document

This is the best moment to explain the difference between a host port and a Docker network connection.

### 5. Build the application image

From `manual/backend`:

```bash
docker build -t fossmec-backend .
```

Explain the Dockerfile line by line:

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

The important teaching point is that Node dependencies are installed during the image build. Participants do not need to install the project dependencies on their computers.

### 6. Run the app

```bash
docker run -d --name fossmec-backend --network app-network -p 5000:5000 -e PORT=5000 -e MONGO_HOST=mongo -e MONGO_PORT=27017 -e MONGO_DB=fossmec fossmec-backend
```

Open:

http://localhost:5000

Submit fake registration data.

### 7. Show the full data path

Explain:

```text
Browser form
   ↓
JavaScript fetch()
   ↓
POST /api/register
   ↓
Express
   ↓
MongoDB container
   ↓
registrations collection
```

Then open Mongo Express and refresh the collection to show the new document.

### 8. Demonstrate the container is replaceable

Remove the application container:

```bash
docker rm -f fossmec-backend
```

Run it again with the same image and configuration.

The application comes back because the image contains the application, while the database data lives in MongoDB.

### 9. Close Day 1 before volumes

Do not add a volume in the Day 1 project. This is intentional. Mention that MongoDB is currently storing its data in the container filesystem and that Docker volumes will be introduced on Day 2 as the persistence solution.

### 10. Introduce Compose

Move to `compose/` and run:

```bash
docker compose up --build
```

Ask participants to compare the Compose file with all the commands they just used manually. Then point out that this Day 1 Compose file still has **no volume**. Persistence will be added on Day 2.

Highlight:

```yaml
ports:
  - "5000:5000"
```

```yaml
environment:
  MONGO_HOST: mongo
```

```text
(no volume on Day 1)
```

Do not highlight a volume here. On Day 2, add the volume as a separate teaching step.

Then explain:

```yaml
ME_CONFIG_MONGODB_URL: mongodb://mongo:27017/
```

The main lesson is that Compose is not magic. It is a convenient way to define the same multi-container setup declaratively.

## Questions to ask during the demo

### Why is MongoDB called `mongo`?

Because the containers are on the same user-defined network and `mongo` is the MongoDB container/service name.

### Why not use `localhost` for MongoDB?

Because `localhost` inside the backend container refers to the backend container itself, not the MongoDB container.

### Why is the app on port 5000?

The Node process listens on port 5000 inside its container, and Docker publishes that port to port 5000 on the host.

### Why is Mongo Express on 8080 when it exposes 8081?

The host and container ports do not have to match:

```text
8080:8081
```

means host 8080 → container 8081.

### Why does deleting the backend container not delete registrations?

Because the registrations live in MongoDB, not in the backend container.

### Where is the MongoDB data stored on Day 1?

Inside the MongoDB container filesystem. Persistence is intentionally not configured yet.

### Why would we add a volume on Day 2?

Because a volume gives database data a persistent home outside the replaceable container.

### Why do participants not run `npm install`?

Because the Dockerfile runs the install during image build.

## Common workshop recovery commands

Check all containers:

```bash
docker ps -a
```

Check logs:

```bash
docker logs fossmec-backend
docker logs mongo
docker logs mongo-express
```

Check the network:

```bash
docker network inspect app-network
```

There is no MongoDB volume in the Day 1 project. Volume commands are introduced on Day 2.

Remove a stuck container and recreate it:

```bash
docker rm -f NAME
```

## Compose recovery

```bash
docker compose ps
docker compose logs app
docker compose logs mongo
docker compose logs mongo-express
```

Rebuild the app:

```bash
docker compose up -d --build
```

Full reset:

```bash
docker compose down
docker compose up --build
```
