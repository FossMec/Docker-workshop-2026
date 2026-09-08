# Manual Docker Setup

This guide runs the FOSSMEC registration demo **without Docker Compose**. You will create and connect each container yourself so you can see what Docker is doing underneath Compose.

## What you will run

```text
Browser
   │
   │ http://localhost:5000
   ▼
fossmec-backend
   │
   │ Docker network: app-network
   ▼
mongo
   ▲
   │
   └── mongo-express
          │
          │ http://localhost:8080
          ▼
        Browser
```

There is **no MongoDB volume in this Day 1 setup**. This is intentional. Persistence and Docker volumes are introduced separately on Day 2.

MongoDB is also **not published to a host port**. The backend and Mongo Express reach it through the Docker network using the hostname `mongo`.

## Before you start

Make sure Docker Desktop is running and check:

```bash
docker --version
docker run hello-world
```

You do **not** need Node.js or `npm` installed on your computer. Docker installs the Node dependencies while building the backend image.

## Step 0: Open the backend folder

From the repository root:

```bash
cd manual/backend
```

You should see:

```text
Dockerfile
package.json
server.js
public/
```

Do **not** run `npm install` on your computer.

## Step 1: Create a Docker network

Run:

```bash
docker network create app-network
```

Check it:

```bash
docker network ls
```

### Why do we need a network?

The backend, MongoDB and Mongo Express are separate containers. They still need a way to communicate.

The user-defined network gives them a private Docker-to-Docker connection. Containers on this network can reach MongoDB using:

```text
mongo
```

That works because `mongo` is the name of the MongoDB container.

## Step 2: Start MongoDB

Run:

```bash
docker run -d --name mongo --network app-network mongo:7
```

PowerShell users can use the same one-line command.

Check that it is running:

```bash
docker ps
```

Check MongoDB logs:

```bash
docker logs mongo
```

Notice that we did **not** use `-p` here. MongoDB does not need to be directly reachable from your browser. Other containers on `app-network` can reach it internally.

Also notice that there is **no `-v` option**. The MongoDB container has no persistent volume in this Day 1 exercise.

## Step 3: Start Mongo Express

Run:

```bash
docker run -d --name mongo-express --network app-network -p 8080:8081 -e ME_CONFIG_MONGODB_URL=mongodb://mongo:27017/ -e ME_CONFIG_BASICAUTH_ENABLED=true -e ME_CONFIG_BASICAUTH_USERNAME=admin -e ME_CONFIG_BASICAUTH_PASSWORD=pass mongo-express:1.0.2-20-alpine3.19
```

Open:

**http://localhost:8080**

### Mongo Express login

Use:

| Field | Value |
| -------- | ------- |
| Username | `admin` |
| Password | `pass` |

### Understanding the ports

```text
-p 8080:8081
   │      │
   │      └── port inside the Mongo Express container
   └───────── port on your computer
```

Your browser uses `localhost:8080`. Docker forwards that traffic to port `8081` inside the container.

### Understanding the MongoDB connection

Mongo Express connects using:

```text
mongodb://mongo:27017/
```

The hostname is `mongo`, not `localhost`.

Inside the Mongo Express container, `localhost` would mean the Mongo Express container itself.

## Step 4: Use Mongo Express

Mongo Express is available at:

`[http://localhost:8080](http://localhost:8080)`

Use the following credentials:

| Field | Value |
| -------- | ------- |
| Username | `admin` |
| Password | `pass` |

After logging in, you can use Mongo Express to:

1. Create a database named `fossmec`.
2. Create a collection named `registrations`.
3. Add a fake registration document.
4. Open the collection and inspect its documents.
5. Later, submit a registration from the app and refresh the collection.

Example document:

```json
{
  "name": "Mongo Demo",
  "email": "mongo@example.com",
  "password": "demo123",
  "source": "mongo-express"
}
```

Use fake values only.

## Step 5: Build the backend image

You should still be inside `manual/backend`.

Run:

```bash
docker build -t fossmec-backend .
```

Check the image:

```bash
docker images
```

### What the Dockerfile does

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

The important point is that the `npm install` command runs **inside the image build**. Participants do not need Node dependencies installed on the host.

## Step 6: Run the backend

Run:

```bash
docker run -d --name fossmec-backend --network app-network -p 5000:5000 -e PORT=5000 -e MONGO_HOST=mongo -e MONGO_PORT=27017 -e MONGO_DB=fossmec fossmec-backend
```

Check:

```bash
docker ps
```

Check logs:

```bash
docker logs fossmec-backend
```

## Step 7: Open the application

Open:

**http://localhost:5000**

Enter fake values such as:

```text
Name: Demo Student
Email: student@example.com
Password: docker123
```

Submit the form.

The request flow is:

```text
Browser
   ↓
POST /api/register
   ↓
Express backend
   ↓
MongoDB container
   ↓
fossmec.registrations
```

## Step 8: See the registration in Mongo Express

Open:

**http://localhost:8080**

Log in with:

```text
Username: admin
Password: pass
```

Open:

```text
fossmec
  └── registrations
```

Refresh the collection.

You should now see the registration submitted through the web application.

This is the main data-flow demonstration:

```text
Browser → Express → MongoDB → Mongo Express
```

Mongo Express is simply giving you a graphical way to inspect the MongoDB data.

## Step 9: Understand the `localhost` trap

The backend connects to:

```text
mongodb://mongo:27017/
```

not:

```text
mongodb://localhost:27017/
```

Why?

Because the backend is running **inside its own container**.

```text
localhost
   ↓
backend container
```

To reach another container, use the other container's network name:

```text
mongo
```

This is one of the most important Docker networking concepts in the workshop.

## Step 10: Demonstrate container replacement

Remove only the backend container:

```bash
docker rm -f fossmec-backend
```

The image is still there, so run a new backend container:

```bash
docker run -d --name fossmec-backend --network app-network -p 5000:5000 -e PORT=5000 -e MONGO_HOST=mongo -e MONGO_PORT=27017 -e MONGO_DB=fossmec fossmec-backend
```

The app comes back because the container can be recreated from the image.

## Step 11: Day 2 volume demonstration

**Do not add a volume yet.** This project intentionally has no MongoDB volume so that Day 2 can introduce the concept clearly.

For the workshop demonstration, you can first explain:

```text
Container
   ↓
MongoDB data is stored inside the container's filesystem
```

Then on Day 2, add:

```yaml
volumes:
  - mongo-data:/data/db
```

and show how the data can survive container recreation.

## Full cleanup

Stop and remove the containers:

```bash
docker rm -f fossmec-backend mongo-express mongo
```

Remove the network:

```bash
docker network rm app-network
```

Because this version has **no named volume**, there is no volume cleanup step.

## Common recovery commands

See all containers:

```bash
docker ps -a
```

See backend logs:

```bash
docker logs fossmec-backend
```

See MongoDB logs:

```bash
docker logs mongo
```

See Mongo Express logs:

```bash
docker logs mongo-express
```

See the network:

```bash
docker network inspect app-network
```

## Common problems

### Port 5000 is already in use

Another program or container is using port 5000. For the workshop, stop the process/container using it so everyone can use the same URL.

### Port 8080 is already in use

Another program or container is using port 8080. Stop it, or temporarily change the host side of the mapping, for example:

```bash
-p 8082:8081
```

Then open `http://localhost:8082`.

### Mongo Express cannot connect to MongoDB

Check that both containers are on the same network:

```bash
docker network inspect app-network
```

Also check that the Mongo Express connection uses:

```text
mongodb://mongo:27017/
```

### The app cannot connect to MongoDB

Check the backend logs:

```bash
docker logs fossmec-backend
```

Make sure the backend was started with:

```text
-e MONGO_HOST=mongo
```

Do not replace `mongo` with `localhost`.
