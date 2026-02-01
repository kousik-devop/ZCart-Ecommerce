<div align="center">
  <br />
  <br />

  <h3 align="center">ZCart – Microservice Based E-Commerce Backend</h3>
  <div>
    <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white">
    <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white">
    <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white">
    <img src="https://img.shields.io/badge/RabbitMQ-FF6600?style=for-the-badge&logo=rabbitmq&logoColor=white">
    <img src="https://img.shields.io/badge/NGINX-009639?style=for-the-badge&logo=nginx&logoColor=white">
  </div>

   <div align="center">
     A scalable, production-style e-commerce backend built using Node.js
     microservices, Docker, message queues, and API gateway architecture.
    </div>
</div>

---

## 📋 <a name="table">Table of Contents</a>

1. ✨ [Introduction](#introduction)
2. ⚙️ [Tech Stack](#tech-stack)
3. 🧱 [Architecture](#architecture)
4. 🔋 [Features](#features)
5. 🤸 [Quick Start](#quick-start)
6. 🎥 [Demo](#demo)
7. 🚀 [More](#more)

---

## <a name="introduction">✨ Introduction</a>

**ZCart** is a **microservice-based e-commerce backend platform** designed for
scalability, reliability, and real-world production use.

Each core business domain (Auth, Product, Cart, Order, Payment, etc.) is built as
an **independent Node.js service**, containerized using Docker, and connected
through **RabbitMQ for asynchronous communication**.

NGINX acts as a **reverse proxy and API gateway**, providing a single entry point
for all backend services.

---

## <a name="tech-stack">⚙️ Tech Stack</a>

- **Node.js** – Backend runtime
- **Express.js** – REST API framework
- **MongoDB** – Database (per service)
- **RabbitMQ** – Event-driven message broker
- **Redis** – Caching & session management
- **Docker & Docker Compose** – Containerization
- **NGINX** – Reverse proxy & API gateway
- **GitHub Actions** – CI/CD automation

---

## <a name="architecture">🧱 Architecture</a>

Each service runs independently in its own Docker container and communicates
asynchronously via RabbitMQ.

Service | Responsibility | Port
--- | --- | ---
Auth | User authentication & JWT | 3000
Product | Product management | 3001
Cart | Cart operations | 3002
Order | Order processing | 3003
Payment | Payment handling | 3004
Notification | Email / events | 3005
Seller | Seller management | 3006

Infrastructure:
- MongoDB – Persistent storage  
- RabbitMQ – Event messaging  
- Redis – Cache & sessions  

---

## <a name="features">🔋 Features</a>

👉 **Microservice architecture** with domain separation  
👉 **Event-driven communication** using RabbitMQ  
👉 **JWT-based authentication** service  
👉 **NGINX API Gateway** for routing  
👉 **Dockerized services** for consistency  
👉 **Scalable backend design**  
👉 **CI/CD-ready structure**  

---

## <a name="quick-start">🤸 Quick Start</a>

Follow these steps to run **ZCart locally**.

### **Prerequisites**

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/)
- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)

---

### **Cloning the Repository**

```bash
git clone https://github.com/kousik-devop/ZCart-Ecommerce.git
cd ZCart-Ecommerce
