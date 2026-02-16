# Event Management Server

Backend API server for Event Management System built with Node.js, Express, TypeScript, and MongoDB.

## Features

- ✅ RESTful API with Express.js
- ✅ TypeScript for type safety
- ✅ MongoDB with native driver
- ✅ Zod for input validation and sanitization
- ✅ JWT authentication
- ✅ Comprehensive error handling
- ✅ Security middleware (Helmet, CORS, Rate Limiting)
- ✅ Senior developer practices

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or remote)
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the server directory:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/patients
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
ENABLE_BHANDARA_LOCK=true
```

## Development

Run the server in development mode with hot reload:
```bash
npm run dev
```

## Production

Build the TypeScript code:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/admin/login` - Login admin
- `POST /api/admin/create` - Create admin (requires super admin)
- `GET /api/admin/me` - Get current admin info

### Bhandara
- `GET /api/bhandara` - Get all bhandaras with stats
- `GET /api/bhandara/:id` - Get bhandara by ID
- `POST /api/bhandara` - Create bhandara (requires auth)
- `PUT /api/bhandara/:id` - Update bhandara (requires auth)
- `DELETE /api/bhandara/:id` - Delete bhandara (requires auth)

### Donor
- `GET /api/donor` - Get all donors with donations
- `GET /api/donor/:id` - Get donor by ID
- `POST /api/donor` - Create donor (requires auth)
- `PUT /api/donor/:id` - Update donor (requires auth)

### Donation
- `GET /api/donation` - Get all donations (requires auth)
- `GET /api/donation/:id` - Get donation by ID (requires auth)
- `GET /api/donation/bhandara/:id` - Get donations by bhandara
- `GET /api/donation/donor/:id` - Get donations by donor
- `POST /api/donation` - Create donation (requires auth)
- `PUT /api/donation/:id` - Update donation (requires auth)

### Stats
- `GET /api/stats` - Get overall statistics

### Upload
- `POST /api/upload/excel` - Bulk upload donations from Excel (requires auth)

## Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Validation

All input is validated using Zod schemas. Invalid input will return a 400 error with detailed validation messages.

## Error Handling

The server uses a centralized error handling middleware that:
- Returns appropriate HTTP status codes
- Provides clear error messages
- Logs errors for debugging
- Hides sensitive information in production

## Project Structure

```
server/
├── src/
│   ├── config/          # Configuration files
│   ├── middleware/     # Express middleware
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── services/       # Business logic
│   ├── utils/          # Utility functions
│   ├── validations/    # Zod validation schemas
│   └── index.ts        # Entry point
├── package.json
├── tsconfig.json
└── README.md
```

## License

ISC

