# Swagger/OpenAPI Documentation Setup

## Overview

The PBSportsClub API includes comprehensive Swagger/OpenAPI 3.0 documentation that provides:

- Interactive API testing interface
- Detailed endpoint documentation
- Request/response schemas
- Authentication testing
- Auto-updating documentation from code

## Implementation Details

### 🔧 Configuration Files

#### `src/config/swagger.ts`
- Main Swagger configuration
- OpenAPI 3.0 specification
- Comprehensive schemas for all entities
- Security schemes (JWT cookies)
- Response templates and error handling

#### `src/app.ts`
- Express app setup with Swagger UI middleware
- Serves documentation at `/docs`
- Provides JSON spec at `/docs.json`
- Redirects root path to documentation

### 📚 Documentation Features

#### Comprehensive Schemas
- **Entities**: User, League, Team, TeamMember
- **Requests**: Signup, Login, CreateTeam, CreateLeague, etc.
- **Responses**: Auth, Success, Error, Validation Error
- **DTOs**: TeamWithMembers, TeamSummary, etc.

#### Security Configuration
- JWT authentication via HTTP-only cookies
- Cookie-based security scheme
- Role-based access documentation
- Rate limiting information

#### Organized Endpoints
- **Authentication**: `/auth/*` endpoints
- **User Profile**: `/me` endpoints  
- **Teams**: `/teams/*` endpoints
- **Leagues**: `/leagues/*` endpoints (organizer only)
- **Public**: `/public/*` endpoints (no auth)
- **System**: `/health` endpoint

### 🏷️ Documentation Tags

1. **Authentication** - User signup, login, logout
2. **User Profile** - Profile management
3. **Leagues** - League administration (organizer/admin)
4. **Teams** - Team operations and membership
5. **Public** - Unauthenticated endpoints
6. **System** - Health checks and status

### 📝 JSDoc Integration

Documentation is generated from JSDoc comments in route files:

```typescript
/**
 * @swagger
 * /auth/signup:
 *   post:
 *     tags: [Authentication]
 *     summary: Register a new user account
 *     description: Creates a new user account with email, password, and name
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SignupRequest'
 *     responses:
 *       201:
 *         description: User account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 */
```

## Usage

### 🚀 Starting the Documentation Server

```bash
# Start development server
npm run dev

# Visit documentation
# http://localhost:3000/docs
```

### 🧪 Testing the Configuration

```bash
# Test Swagger configuration
npm run docs:test

# Run Swagger-specific tests
npx jest src/test/swagger.test.ts
```

### 📖 Accessing Documentation

#### Interactive Documentation
- **URL**: `http://localhost:3000/docs`
- **Features**: 
  - Try out endpoints
  - Authentication testing
  - Real-time validation
  - Response examples

#### OpenAPI JSON Specification
- **URL**: `http://localhost:3000/docs.json`
- **Use for**:
  - Importing into Postman/Insomnia
  - Generating client SDKs
  - CI/CD integration

### 🔐 Testing Authentication

1. Use `/auth/signup` or `/auth/login` endpoints
2. JWT token automatically stored in cookies
3. Protected endpoints use stored token
4. Use `/auth/logout` to clear session

## Development Workflow

### Adding New Endpoints

1. **Add JSDoc comments** to route files
2. **Include comprehensive examples**
3. **Document all parameters and responses**
4. **Test documentation locally**

Example:
```typescript
/**
 * @swagger
 * /teams/{id}:
 *   get:
 *     tags: [Teams]
 *     summary: Get team details
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: clw1234567890abcdef
 *     responses:
 *       200:
 *         description: Team details retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TeamWithMembers'
 */
```

### Updating Schemas

1. **Modify schemas** in `src/config/swagger.ts`
2. **Ensure consistency** with TypeScript interfaces
3. **Add realistic examples**
4. **Test with actual API responses**

### Best Practices

- **Include realistic examples** for all properties
- **Document error cases** with proper status codes
- **Keep descriptions concise** but complete
- **Test all documented endpoints**
- **Update documentation** with code changes

## File Structure

```
src/
├── config/
│   └── swagger.ts          # Main Swagger configuration
├── api/
│   └── routes/
│       ├── auth.ts         # Auth endpoints with JSDoc
│       ├── teams.ts        # Team endpoints with JSDoc
│       ├── leagues.ts      # League endpoints with JSDoc
│       ├── user.ts         # User endpoints with JSDoc
│       └── public.ts       # Public endpoints with JSDoc
├── app.ts                  # Express app with Swagger UI
├── test/
│   └── swagger.test.ts     # Swagger configuration tests
└── scripts/
    └── test-swagger.ts     # Swagger validation script
```

## Dependencies

### Production Dependencies
- `swagger-jsdoc` - Generate OpenAPI spec from JSDoc
- `swagger-ui-express` - Serve Swagger UI

### Development Dependencies  
- `@types/swagger-jsdoc` - TypeScript types
- `@types/swagger-ui-express` - TypeScript types

## Troubleshooting

### Common Issues

#### Documentation Not Loading
```bash
# Check server is running
npm run dev

# Verify Swagger config
npm run docs:test

# Check for TypeScript errors
npm run build
```

#### Endpoints Not Appearing
- Verify JSDoc comments in route files
- Check file paths in swagger configuration
- Restart development server after changes

#### Authentication Not Working
- Clear browser cookies
- Check JWT configuration
- Verify cookie settings in dev tools

### Debug Commands

```bash
# Test swagger configuration
npm run docs:test

# Validate API structure
npm run lint

# Check TypeScript compilation
npm run build

# Run swagger tests
npx jest src/test/swagger.test.ts
```

## Integration with Development Tools

### Postman Integration
1. Visit `http://localhost:3000/docs.json`
2. Copy the JSON specification
3. Import into Postman as OpenAPI 3.0

### Client SDK Generation
```bash
# Using OpenAPI Generator
npx @openapitools/openapi-generator-cli generate \
  -i http://localhost:3000/docs.json \
  -g typescript-fetch \
  -o ./generated-client
```

### CI/CD Integration
```yaml
# Example GitHub Action
- name: Validate API Documentation
  run: |
    npm run docs:test
    npm run build
```

## Security Considerations

### JWT Cookie Authentication
- HTTP-only cookies prevent XSS
- Secure flag in production
- Automatic token management

### Rate Limiting Documentation
- Auth endpoints: 10 req/min
- General endpoints: 100 req/min
- Headers documented in responses

### Input Validation
- Zod schema validation
- Request/response examples
- Error format documentation

## Future Enhancements

### Planned Features
- [ ] API versioning support
- [ ] Response caching documentation
- [ ] Webhook documentation
- [ ] Advanced filtering examples
- [ ] Pagination documentation

### Customization Options
- Custom CSS for Swagger UI
- Additional security schemes
- Extended error responses
- Performance metrics documentation