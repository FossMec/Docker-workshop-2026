# Docker Compose Setup

This folder contains the same FOSSMEC registration demo, but this time Docker Compose manages the containers and network for you.

The manual setup is important first. Compose should feel like a cleaner way to describe the commands you already understand, not like a completely new system.

## Important: no volume in this version

This Compose setup intentionally has **no MongoDB volume**.

That means Day 1 can demonstrate that containers are replaceable and that persistence is a separate Docker concept. **Volumes are introduced on Day 2.**

## What Compose will create

```text
Browser
   │
   │ http://localhost:5000
   ▼
app
   │
   │ Compose network
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

## Step 1: Open the Compose folder

From the repository root:

```bash
cd compose
```

You should see:

```text
compose.yaml
backend/
README.md
```

You do **not** need Node.js or `npm` installed on your computer.

## Step 2: Read the Compose file before running it

Open `compose.yaml`.

It defines three services:

- `app`: Node.js + Express application
- `mongo`: MongoDB database
- `mongo-express`: browser-based MongoDB UI

The services automatically get a Compose network, so they can communicate using their service names.

For example, the app uses:

```text
MONGO_HOST=mongo
```

and Mongo Express uses:

```text
mongodb://mongo:27017/
```

Inside the Docker network, `mongo` is the MongoDB service name.

## Step 3: Start the whole project

Run:

```bash
docker compose up --build
```

The first run may take longer because Docker may need to pull images and build the app image.

When the services are up, open:

**Application:**

http://localhost:5000

**Mongo Express:**

http://localhost:8080

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

## Step 5: Submit a registration from the app

Open:

**http://localhost:5000**

Enter fake data and submit the form.

The flow is:

```text
Browser
   ↓
POST /api/register
   ↓
Express backend
   ↓
MongoDB
```

Then return to Mongo Express and refresh the `registrations` collection.

You should see the new document.

## Step 6: Understand the ports

The app uses:

```yaml
ports:
  - "5000:5000"
```

That means:

```text
host 5000 → app container 5000
```

Mongo Express uses:

```yaml
ports:
  - "8080:8081"
```

That means:

```text
host 8080 → mongo-express container 8081
```

MongoDB has **no `ports` entry** because it does not need to be accessed directly from your browser. The other containers reach it internally through the Compose network.

## Step 7: Understand the environment variables

The app service contains:

```yaml
environment:
  PORT: 5000
  MONGO_HOST: mongo
  MONGO_PORT: 27017
  MONGO_DB: fossmec
```

These values configure the application without changing the image itself.

Mongo Express contains:

```yaml
environment:
  ME_CONFIG_MONGODB_URL: mongodb://mongo:27017/
  ME_CONFIG_BASICAUTH_ENABLED: "true"
  ME_CONFIG_BASICAUTH_USERNAME: admin
  ME_CONFIG_BASICAUTH_PASSWORD: pass
```

This configures Mongo Express to connect to the `mongo` service and require the workshop login.

## Step 8: Check the services

In another terminal, run:

```bash
docker compose ps
```

You should see three services/containers.

To view all logs:

```bash
docker compose logs
```

To view only the app:

```bash
docker compose logs app
```

To follow app logs live:

```bash
docker compose logs -f app
```

## Step 9: Stop the project

Use:

```bash
docker compose down
```

This removes the Compose containers and network.

Because this workshop version has **no volume**, there is no named volume keeping MongoDB data outside the container.

## Step 10: Start it again

Start the project again:

```bash
docker compose up -d
```

Then check:

```bash
docker compose ps
```

Open the app and Mongo Express again.

For the workshop, this is a useful point to discuss the difference between:

```text
container filesystem
```

and:

```text
persistent storage
```

The second concept is what we will introduce with Docker volumes on Day 2.

## Step 11: Read the Compose file as Docker commands

The `app` service:

```yaml
app:
  build: ./backend
  ports:
    - "5000:5000"
  environment:
    PORT: 5000
    MONGO_HOST: mongo
    MONGO_PORT: 27017
    MONGO_DB: fossmec
  depends_on:
    - mongo
```

Conceptually, this replaces a `docker build` followed by a `docker run` with the same settings.

The `mongo` service:

```yaml
mongo:
  image: mongo:7
```

This tells Compose to create a MongoDB container from the `mongo:7` image.

The `mongo-express` service:

```yaml
mongo-express:
  image: mongo-express:1.0.2-20-alpine3.19
  ports:
    - "8080:8081"
  environment:
    ME_CONFIG_MONGODB_URL: mongodb://mongo:27017/
    ME_CONFIG_BASICAUTH_ENABLED: "true"
    ME_CONFIG_BASICAUTH_USERNAME: admin
    ME_CONFIG_BASICAUTH_PASSWORD: pass
```

This creates the Mongo Express container, publishes its web UI, and configures its MongoDB connection and login.

## Step 12: Day 2 volume addition

**Do not add this yet.**

On Day 2, we will modify the MongoDB service to add:

```yaml
volumes:
  - mongo-data:/data/db
```

and then declare the named volume:

```yaml
volumes:
  mongo-data:
```

That gives MongoDB persistent storage outside the container itself.

## Common problems

### Port 5000 is already in use

Stop the program/container using port 5000 so the workshop can use the standard URL.

### Port 8080 is already in use

Temporarily change:

```yaml
- "8080:8081"
```

to:

```yaml
- "8082:8081"
```

Then open `http://localhost:8082`.

### Mongo Express cannot connect to MongoDB

Check the services:

```bash
docker compose ps
```

Check its logs:

```bash
docker compose logs mongo-express
```

The MongoDB URL should contain:

```text
mongodb://mongo:27017/
```

Do not change `mongo` to `localhost`.

### The app cannot connect to MongoDB

Check:

```bash
docker compose logs app
```

The app should have:

```text
MONGO_HOST=mongo
```

## Full cleanup

From the `compose` folder:

```bash
docker compose down
```

There is no volume to remove in this version.
