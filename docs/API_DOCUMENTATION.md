# API Documentation

## Overview

The PBSportsClub API provides comprehensive documentation through Swagger/OpenAPI 3.0. The interactive documentation includes detailed endpoint descriptions, request/response schemas, and the ability to test endpoints directly from the browser.

## Accessing Documentation

### Interactive Documentation (Swagger UI)
- **URL**: `http://localhost:3000/docs`
- **Features**:
  - Interactive API testing
  - Detailed request/response examples
  - Schema definitions
  - Authentication testing
  - Real-time validation

### OpenAPI Specification (JSON)
- **URL**: `http://localhost:3000/docs.json`
- **Use Cases**:
  - Import into API testing tools (Postman, Insomnia)
  - Generate client SDKs
  - Integration with CI/CD pipelines

## Documentation Features

### 🔐 Authentication
- JWT token authentication via HTTP-only cookies
- Interactive login/logout testing
- Role-based access control documentation

### 📊 Comprehensive Schemas
- **User Management**: User profiles, roles, authentication
- **League Management**: League CRUD operations (organizer only)
- **Team Management**: Team creation, joining, member approval
- **Public Access**: Public league and team information

### 🏷️ Organized by Tags
- **Authentication**: User signup, login, logout
- **User Profile**: Profile management endpoints
- **Leagues**: League administration (organizer/admin only)
- **Teams**: Team operations and membership
- **Public**: Unauthenticated endpoints
- **System**: Health checks and status

### 📝 Detailed Examples
- Request body examples for all POST/PATCH endpoints
- Response examples for success and error cases
- Parameter descriptions and validation rules
- Error response formats and status codes

## Testing the Documentation

### Validate Swagger Configuration
```bash
npm run docs:test
```

### Start Development Server with Documentation
```bash
npm run dev
# Then visit http://localhost:3000/docs
```

### Test API Endpoints
1. Visit `http://localhost:3000/docs`
2. Click "Try it out" on any endpoint
3. Fill in required parameters
4. Execute the request
5. View the response

## Authentication in Documentation

### Testing Protected Endpoints
1. Use the `/auth/signup` or `/auth/login` endpoints first
2. The JWT token will be automatically stored in cookies
3. Protected endpoints will use the stored token automatically
4. Use `/auth/logout` to clear authentication

### Cookie-based Authentication
- JWT tokens are stored in HTTP-only cookies for security
- No manual token management required in the UI
- Automatic token inclusion in requests

## API Structure

### Base URL
- Development: `http://localhost:3000/api`
- Documentation: `http://localhost:3000/docs`

### Endpoint Categories

#### Public Endpoints (No Authentication)
- `GET /public/leagues/{slug}` - Get league information
- `GET /public/leagues/{slug}/teams` - Get teams in a league
- `GET /health` - API health check

#### Authentication Endpoints
- `POST /auth/signup` - User registration
- `POST /auth/login` - User authentication
- `POST /auth/logout` - Clear session

#### User Profile Endpoints (Authentication Required)
- `GET /me` - Get current user profile
- `PATCH /me` - Update user profile

#### Team Endpoints (Authentication Required)
- `POST /teams` - Create new team
- `GET /teams/{id}` - Get team details
- `PATCH /teams/{id}` - Update team (captain/organizer)
- `DELETE /teams/{id}` - Delete team (organizer only)
- `POST /teams/{id}/join` - Join a team
- `POST /teams/{id}/members/{userId}/approve` - Approve member

#### League Endpoints (Organizer/Admin Only)
- `POST /leagues` - Create league
- `GET /leagues` - Get all leagues
- `GET /leagues/{id}` - Get league by ID
- `PATCH /leagues/{id}` - Update league
- `DELETE /leagues/{id}` - Delete league

## Error Handling

### Standard Error Format
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (development only)"
}
```

### Validation Error Format
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request / Validation Error
- `401` - Unauthorized (Authentication Required)
- `403` - Forbidden (Insufficient Permissions)
- `404` - Not Found
- `409` - Conflict (Duplicate Resource)
- `429` - Too Many Requests (Rate Limited)
- `500` - Internal Server Error

## Rate Limiting

### Authentication Endpoints
- **Limit**: 10 requests per minute per IP
- **Endpoints**: `/auth/signup`, `/auth/login`, `/auth/logout`
- **Headers**: Rate limit information in response headers

### General API Endpoints
- **Limit**: 100 requests per minute per IP
- **Reset**: Sliding window algorithm

## Security Features

### JWT Authentication
- HTTP-only cookies prevent XSS attacks
- Secure flag in production
- Automatic expiration handling

### Input Validation
- Zod schema validation for all inputs
- SQL injection prevention via Prisma ORM
- XSS protection through input sanitization

### Role-based Access Control
- USER: Basic team operations
- ORGANIZER: League and team management
- ADMIN: Full system access

## Development Tools

### Swagger UI Features
- **Try it out**: Test endpoints directly
- **Authorize**: Set authentication tokens
- **Models**: View schema definitions
- **Download**: Export OpenAPI specification

### Integration with Development Workflow
- Auto-updating documentation from code comments
- Type-safe schemas from TypeScript interfaces
- Validation testing through interactive UI
- Export capabilities for external tools

## Troubleshooting

### Common Issues

#### Documentation Not Loading
- Ensure server is running on correct port
- Check for TypeScript compilation errors
- Verify Swagger configuration in `src/config/swagger.ts`

#### Authentication Not Working
- Clear browser cookies and try again
- Check JWT secret configuration
- Verify cookie settings in browser dev tools

#### Endpoints Not Appearing
- Check JSDoc comments in route files
- Verify file paths in swagger configuration
- Restart development server after changes

### Debug Commands
```bash
# Test swagger configuration
npm run docs:test

# Check for TypeScript errors
npm run build

# Validate API routes
npm run lint
```

## Contributing to Documentation

### Adding New Endpoints
1. Add JSDoc comments to route files
2. Include comprehensive examples
3. Document all parameters and responses
4. Test the documentation locally

### Updating Schemas
1. Modify schemas in `src/config/swagger.ts`
2. Ensure consistency with TypeScript interfaces
3. Add examples for all properties
4. Test with actual API responses

### Best Practices
- Include realistic examples
- Document error cases
- Keep descriptions concise but complete
- Test all documented endpoints
- Update documentation with code changes