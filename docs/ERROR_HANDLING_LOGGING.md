# Error Handling and Logging Implementation

## Overview

This document describes the comprehensive error handling and logging system implemented for the PBSportsClub API. The implementation includes custom error classes, structured logging with Winston, request context tracking, and production-safe error sanitization.

## Features Implemented

### 1. Custom Error Classes ✅

Located in `src/api/middleware/errorHandler.ts`:

- **AppError**: Base application error class with status codes and operational flags
- **ValidationError**: 400 status for input validation failures
- **AuthenticationError**: 401 status for authentication failures
- **AuthorizationError**: 403 status for permission denied
- **NotFoundError**: 404 status for resource not found
- **ConflictError**: 409 status for resource conflicts

```typescript
// Example usage
throw new ValidationError('Email is required');
throw new NotFoundError('User');
throw new ConflictError('Email already exists');
```

### 2. Structured Logging with Winston ✅

Located in `src/config/logger.ts`:

- **Environment-based configuration**: Different log levels and formats for development/production
- **Multiple transports**: Console for development, file logging for production
- **Request context tracking**: Automatic correlation of logs with request IDs
- **Sensitive data sanitization**: Automatic redaction of passwords and secrets

```typescript
// Logger usage
appLogger.info('User created successfully', requestContext, { userId: user.id });
appLogger.error('Database connection failed', requestContext, { error: error.message });
```

### 3. Request Logging Middleware ✅

Located in `src/api/middleware/requestLogger.ts`:

- **Request ID generation**: Automatic generation or preservation of request IDs
- **Request/response logging**: Automatic logging of all HTTP requests and responses
- **Response time tracking**: Measures and logs request processing time
- **Context preservation**: Maintains request context throughout the request lifecycle

### 4. Global Error Handler ✅

Enhanced error handling middleware with:

- **Prisma error mapping**: Automatic conversion of database errors to HTTP responses
- **Production error sanitization**: Safe error messages that don't leak internal details
- **Request context logging**: Full error logging with request context
- **Structured error responses**: Consistent error response format

### 5. Error Sanitization for Production ✅

- **Message sanitization**: Removes sensitive patterns from error messages
- **Stack trace removal**: No stack traces in production responses
- **Generic 5xx messages**: Internal server errors use generic messages
- **Sensitive field redaction**: Automatic removal of passwords, tokens, etc.

## File Structure

```
src/
├── config/
│   └── logger.ts                    # Winston logger configuration
├── api/middleware/
│   ├── errorHandler.ts             # Global error handler and custom error classes
│   ├── requestLogger.ts            # Request logging middleware
│   └── index.ts                    # Middleware exports
└── test/
    ├── errorHandling.simple.test.ts      # Basic error class tests
    └── errorHandling.integration.test.ts # Integration tests
```

## Configuration

### Environment Variables

- `NODE_ENV`: Controls log level and error detail exposure
- `LOG_LEVEL`: Override default log level (debug, info, warn, error)

### Log Levels

- **Development**: `debug` level (all logs)
- **Production**: `warn` level (warnings and errors only)

### Log Formats

- **Development**: Colorized console output with timestamps
- **Production**: JSON format for structured logging

## Usage Examples

### Custom Error Handling

```typescript
// In service layer
if (!user) {
  throw new NotFoundError('User');
}

if (user.email === existingEmail) {
  throw new ConflictError('Email already exists');
}

// In controller
try {
  const result = await userService.createUser(userData);
  res.status(201).json(result);
} catch (error) {
  // Error automatically handled by global error handler
  next(error);
}
```

### Structured Logging

```typescript
// Log with context
const context = createRequestContext(req);
appLogger.info('User login attempt', context, { 
  email: userData.email,
  userAgent: req.get('User-Agent')
});

// Error logging
appLogger.logError(error, req, { 
  operation: 'createUser',
  userData: sanitizedUserData
});
```

### Request Tracking

```typescript
// Middleware automatically adds request IDs
app.use(requestId);
app.use(requestLogger);

// All subsequent logs will include the request context
// Response headers will include X-Request-ID for client tracing
```

## Error Response Format

### Development Response
```json
{
  "error": "Bad Request",
  "message": "Email is required",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/auth/signup",
  "requestId": "abc123def456",
  "details": {
    "stack": "ValidationError: Email is required\n    at ...",
    "originalError": "Email is required",
    "name": "ValidationError"
  }
}
```

### Production Response
```json
{
  "error": "Internal Server Error",
  "message": "An internal server error occurred",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/auth/signup",
  "requestId": "abc123def456"
}
```

## Testing

### Test Coverage

- ✅ Custom error class creation and properties
- ✅ Logger configuration and basic functionality
- ✅ Error handler middleware with different error types
- ✅ Request logging middleware functionality
- ✅ Error sanitization in production mode
- ✅ Request ID generation and preservation

### Running Tests

```bash
# Run error handling tests
npm test -- --testPathPattern=errorHandling

# Run specific test file
npm test -- --testPathPattern=errorHandling.simple.test.ts
```

## Integration with Existing Code

The error handling and logging system has been integrated throughout the application:

- **Middleware**: All middleware now uses structured logging
- **Services**: Error logging in service layers
- **Controllers**: Automatic error handling via global middleware
- **Database**: Database connection errors are properly logged
- **Server startup**: Application lifecycle events are logged

## Security Considerations

- **Sensitive data redaction**: Passwords, tokens, and secrets are automatically redacted
- **Production error messages**: Generic messages prevent information leakage
- **Request sanitization**: Request bodies are sanitized before logging
- **Stack trace protection**: No stack traces exposed in production

## Performance Considerations

- **Async logging**: Non-blocking log operations
- **Log level filtering**: Only relevant logs are processed
- **File rotation**: Production logs can be rotated (configurable)
- **Memory management**: Proper cleanup of log contexts

## Requirements Satisfied

This implementation satisfies the following requirements from the task:

- ✅ **1.2, 1.3**: Authentication error handling with proper logging
- ✅ **2.2**: Login error handling and logging
- ✅ **3.3**: Public endpoint error handling
- ✅ **4.3, 5.3**: Team creation and joining error handling
- ✅ **6.4**: Member approval error handling

All error scenarios are properly logged with context and handled gracefully with appropriate HTTP status codes and sanitized error messages.