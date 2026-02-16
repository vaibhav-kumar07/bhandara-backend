# Project Structure & Configuration Guide

## Package.json Structure

### Scripts
- `dev`: Development server with hot reload (tsx watch)
- `build`: Compile TypeScript to JavaScript
- `start`: Run production server
- `lint`: Run ESLint
- `type-check`: Type check without emitting files

### Dependencies
- **express**: Web framework
- **mongoose**: MongoDB ODM (optional, project uses native mongodb)
- **mongodb**: Native MongoDB driver
- **zod**: Schema validation
- **bcryptjs**: Password hashing
- **jsonwebtoken**: JWT authentication
- **cors**: CORS middleware
- **helmet**: Security headers
- **express-rate-limit**: Rate limiting
- **dotenv**: Environment variables
- **express-validator**: Request validation (optional)

### Dev Dependencies
- TypeScript and type definitions
- **tsx**: TypeScript execution
- **ts-node**: TypeScript Node.js execution

## TypeScript Configuration (tsconfig.json)

### Key Settings
- **target**: ES2020
- **module**: commonjs
- **outDir**: ./dist (compiled output)
- **rootDir**: . (root directory, includes index.ts at root)
- **strict**: true (strict type checking)
- **noUnusedLocals**: true
- **noUnusedParameters**: false (allows unused params in Express handlers)
- **paths**: @/* maps to src/*

### Include/Exclude
- Includes: `src/**/*` and `index.ts` (root level)
- Excludes: `node_modules`, `dist`

## Project Structure

```
server/
├── index.ts                    # Entry point (root level)
├── package.json
├── tsconfig.json
├── src/
│   ├── config/
│   │   ├── constants.ts        # App constants (collections, roles, etc.)
│   │   └── database.ts         # MongoDB connection
│   ├── middleware/
│   │   ├── auth.middleware.ts  # JWT authentication
│   │   ├── error.middleware.ts # Error handling
│   │   └── validation.middleware.ts # Request validation
│   ├── models/
│   │   ├── *.model.ts          # MongoDB model classes (CRUD operations)
│   ├── routes/
│   │   ├── *.routes.ts         # Express route handlers
│   ├── services/
│   │   ├── *.service.ts        # Business logic layer
│   ├── utils/
│   │   ├── auth.ts             # Auth utilities
│   │   └── utils.ts            # Helper functions
│   └── validations/
│       ├── *.schema.ts         # Zod validation schemas
└── dist/                       # Compiled JavaScript output
```

## Code Architecture Patterns

### 1. Entry Point (index.ts)
- Loads environment variables FIRST
- Sets up Express app
- Configures middleware (helmet, cors, rate-limit, body-parser)
- Registers routes
- Connects to database
- Starts server

### 2. Routes Pattern (*.routes.ts)
- Uses Express Router
- Imports: Service, Middleware, Validation schemas
- Structure:
  ```typescript
  router.METHOD('/path', middleware1, middleware2, async (req, res, next) => {
    try {
      // Handler logic
      // Call service methods
      // Return response
    } catch (error) {
      next(error);
    }
  });
  ```
- Response format: `{ success: boolean, message?: string, data?: any }`

### 3. Services Pattern (*.service.ts)
- Static class methods
- Contains business logic
- Calls Model methods
- Returns typed interfaces
- Throws errors for error handling middleware

### 4. Models Pattern (*.model.ts)
- Static class methods
- Direct MongoDB collection access
- CRUD operations (create, findById, findAll, update, delete)
- Uses `getDatabase()` from config/database.ts
- Returns MongoDB documents or ObjectIds

### 5. Validation Pattern (*.schema.ts)
- Uses Zod schemas
- Exports schemas for body, params, query validation
- Used with `validateBody()`, `validateParams()` middleware

### 6. Middleware Pattern
- **auth.middleware.ts**: JWT token verification, role checking
- **error.middleware.ts**: Centralized error handling
- **validation.middleware.ts**: Request validation using Zod

### 7. Response Format
- Success: `{ success: true, data?: any, message?: string }`
- Error: `{ success: false, message: string, errors?: any }`
- Status codes: 200 (success), 201 (created), 400 (bad request), 401 (unauthorized), 403 (forbidden), 404 (not found), 409 (conflict), 500 (server error)

## Environment Variables Required

- `MONGODB_URI`: MongoDB connection string
- `PORT`: Server port (default: 5000)
- `NODE_ENV`: Environment (development/production)
- `CORS_ORIGIN`: Allowed CORS origin
- `JWT_SECRET`: JWT signing secret
- `JWT_EXPIRES_IN`: JWT expiration (default: '7d')
- `ENABLE_BHANDARA_LOCK`: Feature flag (true/false)

## Import Patterns

- Absolute imports from root: `import { ... } from './src/...'`
- Relative imports within src: `import { ... } from '../...'`
- Path alias (if configured): `import { ... } from '@/...'`

## TypeScript Conventions

- Use interfaces for data structures
- Use classes for Models and Services (static methods)
- Unused parameters prefixed with `_` (e.g., `_req`, `_next`)
- Strict typing enabled
- No unused locals allowed
- Unused parameters allowed (for Express handlers)

## How to Add New Functionality

1. **Create Model** (`src/models/entity.model.ts`): MongoDB operations
2. **Create Service** (`src/services/entity.service.ts`): Business logic
3. **Create Validation** (`src/validations/entity.schema.ts`): Zod schemas
4. **Create Routes** (`src/routes/entity.routes.ts`): Express handlers
5. **Register Route** in `index.ts`: `app.use('/api/entity', entityRoutes)`

