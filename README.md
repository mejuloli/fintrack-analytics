
# FinTrack Analytics

A full-stack application for importing, validating, and analyzing synthetic financial transactions.

> **Disclaimer:** This project uses exclusively synthetic data for educational and demonstration purposes. It does not represent real customers or financial operations.

## Overview

FinTrack Analytics is a full-stack project designed to explore financial data processing, REST API development, authentication, relational databases, and containerized application deployment.

The application combines a React-based frontend with a Django REST Framework backend and PostgreSQL database.

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- Ant Design
- Axios
- React Router

### Backend

- Python
- Django
- Django REST Framework
- Simple JWT
- PostgreSQL

### Infrastructure

- Docker
- Docker Compose

## Requirements

- Git
- Docker
- Docker Compose

Python, Node.js, and PostgreSQL do not need to be installed directly on your machine.

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/mejuloli/fintrack-analytics.git
cd fintrack-analytics
```

### 2. Configure environment variables

Create a local environment configuration file:

```bash
cp .env.example .env
```

Generate a Django secret key:

```bash
openssl rand -hex 40
```

Replace the `DJANGO_SECRET_KEY` value in your `.env` file with the generated key.

### 3. Start the application

Build and start all services:

```bash
docker compose up --build
```

To run the application in detached mode:

```bash
docker compose up --build -d
```

## Local Services

| Service | Address |
|---|---|
| Frontend | http://localhost:5174 |
| Backend | http://localhost:8001 |
| Django Admin | http://localhost:8001/admin |
| PostgreSQL | localhost:5433 |

## Create an Administrator

Run the following command:

```bash
docker compose exec backend \
  python manage.py createsuperuser
```

Follow the instructions to create a Django administrator account.

## API Endpoints

### Health Check

```http
GET /api/health/
```

### Authentication

```http
POST /api/auth/login/
POST /api/auth/refresh/
GET /api/auth/me/
```

The `/api/auth/me/` endpoint requires a valid access token.

Include the token in the request header:

```http
Authorization: Bearer ACCESS_TOKEN
```

## Validation

### Backend

Run Django system checks:

```bash
docker compose exec backend \
  python manage.py check
```

### Frontend

Run ESLint:

```bash
docker compose exec frontend \
  npm run lint
```

Build the frontend:

```bash
docker compose exec frontend \
  npm run build
```

## Key Concepts

This project explores:

- Full-stack web development
- RESTful API integration
- Financial transaction data processing
- Data validation
- JWT-based authentication
- Relational database management
- Containerized development environments
- Separation of frontend and backend responsibilities

## Disclaimer

All financial information used in this project is entirely fictional and generated exclusively for educational and demonstration purposes.

No real financial transactions, customer information, or banking data are involved.
