# FOSSMEC Docker Workshop Cheat Sheet

## Check Docker

```bash
docker --version
docker run hello-world
```

## Images

```bash
docker pull IMAGE

docker images

docker rmi IMAGE
```

`docker pull` downloads an image. It does not create a running container.

## Containers

```bash
docker run IMAGE
docker run -d --name NAME IMAGE
docker ps
docker ps -a
docker stop NAME
docker start NAME
docker restart NAME
docker rm NAME
```

`docker run` creates + starts a new container.

`docker start` starts an existing stopped container.

## Interactive container

```bash
docker run -it ubuntu bash
```

- `-i` keeps standard input open
- `-t` allocates a terminal
- `-it` gives you an interactive shell
- `bash` is the command run inside the container

## Environment variables

```bash
docker run -d \
  --name app \
  -e PORT=5000 \
  -e MONGO_HOST=mongo \
  my-image
```

`-e NAME=value` passes configuration into the container.

## Ports

```bash
docker run -d --name mongo-express -p 8080:8081 IMAGE
```

```text
-p HOST:CONTAINER
```

Host port 8080 → container port 8081.

For the workshop:

```text
App            http://localhost:5000
Mongo Express  http://localhost:8080
```

## Networks

```bash
docker network create app-network

docker run -d --name mongo --network app-network mongo:7

docker run -d --name app --network app-network my-image
```

Containers on the same user-defined network can reach each other by container/service name.

For this project:

```text
mongo
```

is the MongoDB hostname.

`localhost` inside the app container means the app container itself.

## MongoDB + Mongo Express (Day 1)

```bash
docker run -d --name mongo --network app-network mongo:7

docker run -d --name mongo-express --network app-network -p 8080:8081 -e ME_CONFIG_MONGODB_URL=mongodb://mongo:27017/ -e ME_CONFIG_BASICAUTH_ENABLED=true -e ME_CONFIG_BASICAUTH_USERNAME=admin -e ME_CONFIG_BASICAUTH_PASSWORD=pass mongo-express:1.0.2-20-alpine3.19
```

Mongo Express:

```text
URL: http://localhost:8080
Username: admin
Password: pass
```

There is intentionally **no MongoDB volume in the Day 1 project**.

## Build the workshop app

From `manual/backend`:

```bash
docker build -t fossmec-backend .
```

`-t` names the image.

`.` is the build context.

## Run the workshop app

```bash
docker run -d \
  --name fossmec-backend \
  --network app-network \
  -p 5000:5000 \
  -e PORT=5000 \
  -e MONGO_HOST=mongo \
  -e MONGO_PORT=27017 \
  -e MONGO_DB=fossmec \
  fossmec-backend
```

## Logs and shell access

```bash
docker logs CONTAINER
docker logs -f CONTAINER
docker inspect CONTAINER
docker exec -it CONTAINER sh
```

## Volumes (Day 2)

Conceptually:

```yaml
volumes:
  - mongo-data:/data/db
```

A volume stores data outside the container's writable layer. Add this to the project on Day 2, not Day 1.

## Compose

From `compose/`:

```bash
docker compose up --build
docker compose up -d --build
docker compose ps
docker compose logs
docker compose logs app
docker compose down
docker compose down -v
```

`down` removes the Compose containers and network.

The Day 1 Compose project has no named volume, so `down -v` is not needed for normal cleanup.

## Docker Hub

```bash
docker login
docker tag fossmec-backend USERNAME/fossmec-backend:latest
docker push USERNAME/fossmec-backend:latest
docker pull USERNAME/fossmec-backend:latest
```
