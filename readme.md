# API

A modular, scalable backend for a file-sharing app with team-based permissions. Built with Node.js, Express, MongoDB, and AWS S3, this project is designed with clean architecture, full test coverage, and modern DevOps tooling.

## Features

- Node.js 18 + Express with ES Modules
- JWT Auth (Access & Refresh tokens)
- AWS S3 integration via AWS SDK v3
- MongoDB Atlas via Mongoose
- Tooling: ESLint, Prettier, Docker, GitHub Actions
- Auto-generated Swagger docs (/docs)
- Tested with Jest + Supertest

## Tech Stack

| Layer        | Tech                     |
| ------------ | ------------------------ |
| Runtime      | Node.js 18               |
| Framework    | Express.js               |
| DB           | MongoDB Atlas + Mongoose |
| Auth         | JWT (HS256)              |
| File Storage | AWS S3 (via LocalStack)  |
| Docs         | Swagger/OpenAPI          |
| Testing      | Jest, Supertest          |
| DevOps       | Docker, GitHub Actions   |

## Environment Variables

Create a `.env` file at the root with the following keys:

```
PORT=3000

# MongoDB
MONGO_URI=mongodb://mongo:27017/fileshare

# JWT
JWT_SECRET=supersecretkey

# AWS
AWS_ACCESS_KEY_ID=dummy
AWS_SECRET_ACCESS_KEY=dummy
AWS_REGION=us-east-1

# SendGrid (optional for email support)
SENDGRID_API_KEY=your-sendgrid-api-key
```

## Running with Docker

```
docker-compose up --build
```

Services:

- api: your Node.js backend
- mongo: MongoDB instance
- localstack: Local AWS S3 emulator (port 4566)

## Project Structure

```
src/
├── config/             # App + DB config, roles, logger
├── utils/              # Helpers (APIError, JWT, email, validators)
├── api/
│   ├── routes/         # Express routes
│   ├── controllers/    # Request handlers
│   ├── services/       # Business logic
│   ├── models/         # Mongoose models
│   └── middlewares/    # Auth, validation, error handling
├── templates/          # Email templates (HTML)
├── loaders/            # Express & Mongoose loaders
├── libs/               # AWS S3 client
├── server.js           # App entrypoint
```

## Testing

```
npm run test
```

Basic health check test is available at:

```
GET /health
```

## API Documentation

Swagger is auto-generated and available at:

```
http://localhost:3000/docs
```

## GitHub Actions CI

Included workflow:

- Lint
- Test
- Build
- Docker Push (optional to configure)

## Scripts

```
npm run dev        # Start dev server with nodemon
npm run lint       # Run ESLint
npm run format     # Run Prettier
npm run test       # Run unit/integration tests
npm run build      # (Optional) Prepare for production
```

## Contact

Questions or feedback? Raise an issue or email at team@example.com.
