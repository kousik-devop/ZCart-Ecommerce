🛒 ZCart – Microservice Based E-Commerce Backend

ZCart is a production-ready, microservice-based backend platform designed for scalable e-commerce applications.
Each core domain is implemented as an independent Node.js service, containerized with Docker, deployed on AWS EC2, and automatically delivered using GitHub Actions CI/CD.
NGINX is used as a reverse proxy and API gateway.

---

📌 Tech Stack

Backend: Node.js, Express  
Database: MongoDB (per service)  
Message Broker: RabbitMQ (AMQP)  
Cache / Session: Redis  
Containerization: Docker, Docker Compose  
CI/CD: GitHub Actions  
Cloud: AWS EC2  
Reverse Proxy: NGINX  
Architecture: Microservices  

---

🧱 Architecture Overview

Each service runs independently in its own Docker container and communicates asynchronously via RabbitMQ.

Service | Responsibility | Internal Port
--- | --- | ---
Auth | User registration, login, JWT handling | 3000
Product | Product listing & management | 3001
Cart | Shopping cart operations | 3002
Order | Order creation & tracking | 3003
Payment | Payment processing | 3004
Notification | Email / notification service | 3005
Seller | Seller management | 3006

Infrastructure Services:
- MongoDB – Persistent storage
- RabbitMQ – Event-based communication
- Redis – Caching & session management

---

🌐 Live Backend URLs (Deployed on AWS EC2)

Public Server IP:
43.205.191.46


### 🔀 NGINX API Gateway (Recommended)

Base URL:
http://43.205.191.46:8080

yaml
কোড কপি করুন

Example routes:
http://43.205.191.46:8080/auth
http://43.205.191.46:8080/products
http://43.205.191.46:8080/cart
http://43.205.191.46:8080/orders
http://43.205.191.46:8080/payments


---

### 🔗 Direct Service URLs (Development / Debug)

Service | URL
--- | ---
Auth | http://43.205.191.46:3000
Product | http://43.205.191.46:3001
Cart | http://43.205.191.46:3002
Order | http://43.205.191.46:3003
Payment | http://43.205.191.46:3004
Notification | http://43.205.191.46:3005
Seller | http://43.205.191.46:3006

---

### 🐰 RabbitMQ Management UI

http://43.205.191.46:15673
Username: guest
Password: guest


---

📂 Repository Structure

ZCart-Ecommerce/
│
├── auth/
├── product/
├── cart/
├── order/
├── payment/
├── notification/
├── seller/
│
├── env/
│ ├── auth.env
│ ├── product.env
│ ├── cart.env
│ ├── order.env
│ ├── payment.env
│ ├── notification.env
│ └── seller.env
│
├── nginx/
│ └── nginx.conf
│
├── docker-compose.yml
└── README.md

---

🔑 Environment Variables

### Common Variables

MONGO_URI=mongodb://mongo:27017/<DB_NAME>
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=


### Auth Service (env/auth.env)

PORT=3000
MONGO_URI=mongodb://mongo:27017/ZCart_Auth
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
REDIS_HOST=redis
REDIS_PORT=6379
JWT_SECRET=your_jwt_secret


(Other services follow the same pattern with their own DB names.)

---

🚀 Deployment & CI/CD Flow

1. Code pushed to `main` branch
2. GitHub Actions pipeline:
   - Builds Docker images
   - Pushes images to Docker Hub
   - SSH deploys to AWS EC2
3. Docker Compose pulls latest images
4. NGINX routes traffic to services

---

▶️ Manual Deployment (First Time Only)

docker-compose pull
docker-compose up -d


---

🧪 Health & Debugging

Check containers:
docker ps


Check logs:
docker logs auth-service
docker logs nginx


Check from server:
curl http://localhost:3000


---

🔐 Security Notes

❌ Do not commit real secrets  
✅ Use env files (git-ignored)  
✅ Restrict direct service ports in production  
✅ Expose only NGINX (80 / 443) publicly  

---

📌 Future Enhancements

- HTTPS with SSL (Certbot)
- API Gateway improvements
- Centralized logging (ELK)
- Kubernetes (EKS)
- Rate limiting & auth middleware
- Blue-Green deployments

---

👤 Author

Kousik Maiti  
Microservices • Backend • Docker • Cloud • Node.js
