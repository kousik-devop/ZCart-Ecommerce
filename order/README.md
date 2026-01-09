# Order Service

Order service is a Node.js/Express microservice responsible for creating and managing orders. It integrates with Product and Cart services and publishes order events to RabbitMQ for downstream consumers.

Contents
- Overview
- Prerequisites
- Environment variables
- Local development
- Docker
- API reference
- Testing
- Deployment (AWS EC2)
- Troubleshooting

## Overview

Key behaviors:
- Create orders using items from the Cart service and product information from Product service.
- Validate stock and compute order totals.
- Persist orders in MongoDB using Mongoose (`src/models/order.model.js`).
- Publish order-created messages to RabbitMQ queue `ORDER_SELLER_DASHBOARD.ORDER_CREATED`.
- Provide endpoints for users, sellers and admins (role-based access via middleware).

Important files
- `server.js` — app entry point and DB + broker connection
- `src/app.js` — Express app and routing
- `src/db/db.js` — MongoDB connection helper
- `src/broker/broker.js` — RabbitMQ helper (publish/subscribe)
- `src/models/order.model.js` — Mongoose schema
- `src/controllers/order.controllers.js` — request handlers and business logic
- `src/routes/order.routes.js` — route definitions

## Prerequisites
- Node 18+ and npm
- MongoDB accessible by `MONGO_URI`
- RabbitMQ accessible by `RABBITMQ_URL`
- Product service (expected at `http://localhost:3001`) and Cart service (`http://localhost:3002`) when running locally, or replace with real URLs
- Docker (optional, recommended for containerized runs)

## Environment variables
Create a `.env` file (copy from `.env.example`) and set the following:

- `PORT` — port to run the service (default: `3003`)
- `MONGO_URI` — MongoDB connection string
- `RABBITMQ_URL` — RabbitMQ connection URL
- `JWT_SECRET` — JWT secret used by authentication middleware
- `NODE_ENV` — `development` or `production`

## Local development

1. Install deps

```bash
npm install
```

2. Create `.env` from `.env.example` and update values

3. Start services required by this service (MongoDB, RabbitMQ, Product service, Cart service) or mock them

4. Run the app

```bash
# development with auto reload
npm run dev

# production mode
npm start
```

Health check: GET `/` responds with `{ message: "Order service is running" }`.

## Docker

Build image locally

```bash
docker build -t order:latest .
```

Run with `.env` file

```bash
docker run -d --name order_service --env-file .env -p 3003:3003 order:latest
```

Or use `docker-compose`:

```bash
docker-compose up -d --build
```

Notes: the image uses `node:18-alpine` and runs `node server.js`. The Dockerfile installs only production dependencies.

## API Reference

Base path: `/api/orders`

Common auth note: endpoints require a JWT-bearing user. The service reads token from a cookie named `user_token` or the `Authorization: Bearer <token>` header. Roles used: `user`, `seller`, `admin`.

Endpoints

- POST `/api/orders/` — Create an order (role: `user`)
  - Body: `shippingAddress` object with `street`, `city`, `state`, `pincode`, `country`.
  - Behavior: fetches user cart from Cart service, fetches product details from Product service, validates stock, persists a `PENDING` order, and publishes to RabbitMQ queue `ORDER_SELLER_DASHBOARD.ORDER_CREATED`.

- GET `/api/orders/me` — Get current user's orders (role: `user`)
  - Query params: `page`, `limit` for pagination

- GET `/api/orders/seller` — Get orders for seller (role: `seller`)
  - Behavior: fetches seller products from Product service and returns orders that include seller's products (only those items are returned per order).

- POST `/api/orders/:id/cancel` — Cancel an order (role: `user`)
  - Only orders with status `PENDING` can be cancelled.

- PATCH `/api/orders/:id/address` — Update shipping address (role: `user`)
  - Only allowed when order status is `PENDING`.

- GET `/api/orders/:id` — Get order by id (roles: `user`, `admin`)
  - Users may only access their own orders; admins can access any order.

Example cURL (replace token and host):

```bash
curl -H "Authorization: Bearer <JWT>" -H "Content-Type: application/json" \
  -d '{"shippingAddress":{"street":"1 A St","city":"City","state":"S","pincode":"12345","country":"Country"}}' \
  http://localhost:3003/api/orders/
```

## Testing

Run unit/integration tests with jest

```bash
npm test
```

Tests expect an in-memory MongoDB (see `mongodb-memory-server`) — test configuration is under `test/setup`.

## Deployment (AWS EC2)

Minimal steps to deploy the container on an EC2 instance:

1. Provision an EC2 instance and open port `3003` in the security group.
2. Install Docker and Docker Compose on the instance.
3. Clone this repository on the instance and create a real `.env` (update `MONGO_URI`, `RABBITMQ_URL`, `JWT_SECRET`).
4. Use `docker-compose up -d --build` or `docker run` to start the container.

Optional: push your image to ECR or Docker Hub and run `docker pull` on EC2, then `docker run`.

Systemd example (run container on boot): place a unit file at `/etc/systemd/system/order.service` that executes a `docker run` with the service image and `.env` path, then `systemctl enable --now order.service`.

## Troubleshooting

- Cannot reach Cart/Product services: verify the services are running and reachable from this host, or update the URLs they are called from in the controllers (they currently point to `http://localhost:3002` and `http://localhost:3001`).
- RabbitMQ connection retries: the broker helper retries with backoff — ensure `RABBITMQ_URL` is correct and broker is reachable.
- Docker on Windows: if using Docker Desktop, ensure it is running and WSL2 is configured correctly (see Docker Desktop docs).

## Notes & Considerations

- This service relies on other microservices (Product, Cart) and on message consumers. For production, prefer environment values pointing to stable hosts or managed services.
- Add proper observability (metrics, structured logs) and tracing if deploying to production.
- Ensure secrets (JWT secret, DB credentials) are stored securely (AWS Secrets Manager, SSM Parameter Store, or Docker secrets) and not committed to repo.

If you want, I can also:
- Add an OpenAPI spec for these endpoints
- Add a GitHub Actions workflow to build and push Docker images
- Provide an EC2 user-data script to auto-deploy the container
🛒 Order Service — Docker & AWS EC2 Deployment

This repository contains the Order microservice, built with Node.js and designed to run as a containerized service.
The service is production-ready and can be deployed locally using Docker or on an AWS EC2 instance.

📦 What’s Included

The following files make the service container-ready and easy to deploy:

Dockerfile — Builds a production-grade Node.js 18 image

.dockerignore — Reduces image size by excluding unnecessary files

docker-compose.yml — Local development & simple EC2 orchestration

.env.example — Lists all required environment variables

⚙️ Prerequisites

Docker >= 20.x

Docker Compose >= 2.x

Node.js >= 18 (only for local development)

MongoDB, RabbitMQ, Redis (containerized or managed)

🔐 Environment Variables

Create a .env file using .env.example as reference.

PORT=3003

MONGO_URI=mongodb://mongodb:27017/ZCart_Order
RABBITMQ_URL=amqp://rabbitmq:5672
REDIS_URL=redis://redis:6379

JWT_SECRET=your_jwt_secret_here


⚠️ Do not commit .env
Always add .env to .gitignore.

🚀 Run Locally with Docker
Build the Docker image
docker build -t order:latest .

Run the container
docker run -d \
  --name order_service \
  --env-file .env \
  -p 3003:3003 \
  order:latest

OR use Docker Compose (recommended)
docker compose up -d --build


This will automatically start:

Order Service

MongoDB

RabbitMQ

Redis

🌐 Service Access

Once running, the service is available at:

http://localhost:3003

☁️ Deploy to AWS EC2 (Ubuntu)
1️⃣ Create an EC2 Instance

OS: Ubuntu

Open inbound port 3003 in the Security Group

2️⃣ Install Docker & Docker Compose on EC2
sudo apt update
sudo apt install -y docker.io docker-compose
sudo usermod -aG docker $USER
newgrp docker

3️⃣ Deploy the Service
Option A — Build on the EC2 instance
git clone <repo-url>
cd order
cp .env.example .env
# edit .env with real values
docker compose up -d --build

Option B — Use Docker Hub (Recommended for production)
Build & push locally
docker build -t yourdockerhubid/order:latest .
docker push yourdockerhubid/order:latest

Pull & run on EC2
docker pull yourdockerhubid/order:latest
docker run -d \
  --name order_service \
  --env-file .env \
  -p 3003:3003 \
  yourdockerhubid/order:latest

🔁 Optional: Run as a systemd Service on EC2

Create the service file:

sudo nano /etc/systemd/system/order.service

[Unit]
Description=Order Service (Docker)
After=docker.service

[Service]
Restart=always
ExecStart=/usr/bin/docker run --rm \
  --name order_service \
  --env-file /home/ubuntu/order/.env \
  -p 3003:3003 \
  yourdockerhubid/order:latest
ExecStop=/usr/bin/docker stop order_service

[Install]
WantedBy=multi-user.target


Enable and start:

sudo systemctl daemon-reload
sudo systemctl enable order.service
sudo systemctl start order.service

🧠 Architecture Notes

Uses Docker DNS for service discovery (mongodb, rabbitmq, redis)

Implements retry-based RabbitMQ connection for startup resilience

Runs as a non-root user inside the container (security best practice)

Designed for microservice-based architectures