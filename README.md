# FinTrack Analytics

Plataforma full stack para importação, validação e análise de
transações financeiras fictícias.

> Este projeto utiliza somente dados sintéticos e não representa
> clientes ou operações financeiras reais.

## Tecnologias

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

### Infraestrutura

- Docker
- Docker Compose

## Requisitos

- Git
- Docker
- Docker Compose

Não é necessário instalar Python, Node.js ou PostgreSQL diretamente
na máquina.

## Configuração

Crie o arquivo local de variáveis de ambiente:

```bash
cp .env.example .env
```

Gere uma chave para o Django e substitua o valor de
`DJANGO_SECRET_KEY` no arquivo `.env`:

```bash
openssl rand -hex 40
```

## Execução local

Suba os serviços:

```bash
docker compose up --build
```

Para executar em segundo plano:

```bash
docker compose up --build -d
```

## Serviços

- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- Django Admin: http://localhost:8000/admin
- PostgreSQL: localhost:5433

## Criar administrador

```bash
docker compose exec backend \
  python manage.py createsuperuser
```

## Endpoints iniciais

### Verificação de saúde

```text
GET /api/health/
```

### Autenticação

```text
POST /api/auth/login/
POST /api/auth/refresh/
GET  /api/auth/me/
```

O endpoint `/api/auth/me/` exige o access token:

```text
Authorization: Bearer ACCESS_TOKEN
```

## Validação

Backend:

```bash
docker compose exec backend \
  python manage.py check
```

Frontend:

```bash
docker compose exec frontend \
  npm run lint

docker compose exec frontend \
  npm run build
```

## Aviso

Os dados utilizados neste projeto são inteiramente fictícios e
gerados somente para fins de estudo e demonstração.
