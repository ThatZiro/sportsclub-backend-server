/**
 * Swagger/OpenAPI Configuration
 * Configures API documentation with comprehensive schemas and examples
 */

import swaggerJsdoc from 'swagger-jsdoc';
import { SwaggerDefinition } from 'swagger-jsdoc';

// Basic API information
const swaggerDefinition: SwaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'PBSportsClub API',
    version: '1.0.0',
    description: 'A minimal TypeScript/Node.js backend for sports league player registration',
    contact: {
      name: 'API Support',
      email: 'support@pbsportsclub.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: process.env['API_BASE_URL'] || 'http://localhost:3000',
      description: 'Development server'
    }
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'token',
        description: 'JWT token stored in HTTP-only cookie'
      }
    },
    schemas: {
      // User schemas
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Unique user identifier',
            example: 'clw1234567890abcdef'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
            example: 'john.doe@example.com'
          },
          name: {
            type: 'string',
            description: 'User full name',
            example: 'John Doe'
          },
          role: {
            type: 'string',
            enum: ['USER', 'ORGANIZER', 'ADMIN'],
            description: 'User role in the system',
            example: 'USER'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Account creation timestamp'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last profile update timestamp'
          }
        },
        required: ['id', 'email', 'name', 'role']
      },
      
      // League schemas
      League: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Unique league identifier',
            example: 'clw1234567890abcdef'
          },
          name: {
            type: 'string',
            description: 'League name',
            example: 'Spring 2024 Basketball League'
          },
          slug: {
            type: 'string',
            description: 'URL-friendly league identifier',
            example: 'spring-2024-basketball'
          },
          season: {
            type: 'string',
            nullable: true,
            description: 'League season',
            example: 'Spring 2024'
          },
          isActive: {
            type: 'boolean',
            description: 'Whether the league is currently active',
            example: true
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'League creation timestamp'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last league update timestamp'
          }
        },
        required: ['id', 'name', 'slug', 'isActive']
      },
      
      // Team schemas
      Team: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Unique team identifier',
            example: 'clw1234567890abcdef'
          },
          name: {
            type: 'string',
            description: 'Team name',
            example: 'Thunder Bolts'
          },
          color: {
            type: 'string',
            nullable: true,
            description: 'Team color',
            example: '#FF5733'
          },
          leagueId: {
            type: 'string',
            description: 'League identifier this team belongs to',
            example: 'clw1234567890abcdef'
          },
          captainId: {
            type: 'string',
            description: 'User ID of the team captain',
            example: 'clw1234567890abcdef'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Team creation timestamp'
          }
        },
        required: ['id', 'name', 'leagueId', 'captainId']
      },
      
      TeamWithMembers: {
        allOf: [
          { $ref: '#/components/schemas/Team' },
          {
            type: 'object',
            properties: {
              captain: {
                $ref: '#/components/schemas/User'
              },
              members: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/TeamMemberWithUser'
                }
              },
              memberCount: {
                type: 'number',
                description: 'Total number of approved members',
                example: 5
              }
            }
          }
        ]
      },
      
      TeamSummary: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            example: 'clw1234567890abcdef'
          },
          name: {
            type: 'string',
            example: 'Thunder Bolts'
          },
          color: {
            type: 'string',
            nullable: true,
            example: '#FF5733'
          },
          captainName: {
            type: 'string',
            example: 'John Doe'
          },
          memberCount: {
            type: 'number',
            example: 5
          }
        },
        required: ['id', 'name', 'captainName', 'memberCount']
      },
      
      // TeamMember schemas
      TeamMember: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Unique membership identifier',
            example: 'clw1234567890abcdef'
          },
          teamId: {
            type: 'string',
            description: 'Team identifier',
            example: 'clw1234567890abcdef'
          },
          userId: {
            type: 'string',
            description: 'User identifier',
            example: 'clw1234567890abcdef'
          },
          role: {
            type: 'string',
            enum: ['CAPTAIN', 'MEMBER'],
            description: 'Member role in the team',
            example: 'MEMBER'
          },
          status: {
            type: 'string',
            enum: ['PENDING', 'APPROVED', 'REJECTED'],
            description: 'Membership status',
            example: 'APPROVED'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Membership creation timestamp'
          }
        },
        required: ['id', 'teamId', 'userId', 'role', 'status']
      },
      
      TeamMemberWithUser: {
        allOf: [
          { $ref: '#/components/schemas/TeamMember' },
          {
            type: 'object',
            properties: {
              user: {
                $ref: '#/components/schemas/User'
              }
            }
          }
        ]
      },
      
      // Request/Response DTOs
      SignupRequest: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
            example: 'john.doe@example.com'
          },
          password: {
            type: 'string',
            minLength: 8,
            description: 'User password (minimum 8 characters)',
            example: 'securePassword123'
          },
          name: {
            type: 'string',
            minLength: 1,
            description: 'User full name',
            example: 'John Doe'
          }
        },
        required: ['email', 'password', 'name']
      },
      
      LoginRequest: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
            example: 'john.doe@example.com'
          },
          password: {
            type: 'string',
            description: 'User password',
            example: 'securePassword123'
          }
        },
        required: ['email', 'password']
      },
      
      CreateTeamRequest: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            minLength: 1,
            description: 'Team name',
            example: 'Thunder Bolts'
          },
          color: {
            type: 'string',
            nullable: true,
            description: 'Team color (hex code)',
            example: '#FF5733'
          },
          leagueId: {
            type: 'string',
            description: 'League identifier',
            example: 'clw1234567890abcdef'
          }
        },
        required: ['name', 'leagueId']
      },
      
      CreateLeagueRequest: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            minLength: 1,
            description: 'League name',
            example: 'Spring 2024 Basketball League'
          },
          slug: {
            type: 'string',
            minLength: 1,
            description: 'URL-friendly identifier',
            example: 'spring-2024-basketball'
          },
          season: {
            type: 'string',
            nullable: true,
            description: 'League season',
            example: 'Spring 2024'
          },
          isActive: {
            type: 'boolean',
            description: 'Whether the league is active',
            example: true
          }
        },
        required: ['name', 'slug']
      },
      
      UpdateUserRequest: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            minLength: 1,
            description: 'Updated user name',
            example: 'John Smith'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'Updated email address',
            example: 'john.smith@example.com'
          }
        }
      },
      
      // Response schemas
      AuthResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          message: {
            type: 'string',
            example: 'Authentication successful'
          },
          user: {
            $ref: '#/components/schemas/User'
          }
        },
        required: ['success', 'message', 'user']
      },
      
      SuccessResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          message: {
            type: 'string',
            example: 'Operation completed successfully'
          }
        },
        required: ['success', 'message']
      },
      
      ErrorResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false
          },
          message: {
            type: 'string',
            example: 'An error occurred'
          },
          error: {
            type: 'string',
            description: 'Error details (development only)',
            example: 'Validation failed'
          }
        },
        required: ['success', 'message']
      },
      
      ValidationErrorResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false
          },
          message: {
            type: 'string',
            example: 'Validation failed'
          },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: {
                  type: 'string',
                  example: 'email'
                },
                message: {
                  type: 'string',
                  example: 'Invalid email format'
                }
              }
            }
          }
        },
        required: ['success', 'message', 'errors']
      }
    },
    
    responses: {
      UnauthorizedError: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            },
            example: {
              success: false,
              message: 'Authentication required'
            }
          }
        }
      },
      
      ForbiddenError: {
        description: 'Insufficient permissions',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            },
            example: {
              success: false,
              message: 'Insufficient permissions'
            }
          }
        }
      },
      
      NotFoundError: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            },
            example: {
              success: false,
              message: 'Resource not found'
            }
          }
        }
      },
      
      ValidationError: {
        description: 'Validation failed',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ValidationErrorResponse'
            }
          }
        }
      },
      
      RateLimitError: {
        description: 'Rate limit exceeded',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            },
            example: {
              success: false,
              message: 'Too many requests, please try again later'
            }
          }
        }
      }
    }
  },
  
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and authorization endpoints'
    },
    {
      name: 'User Profile',
      description: 'User profile management endpoints'
    },
    {
      name: 'Leagues',
      description: 'League management endpoints (organizer/admin only)'
    },
    {
      name: 'Teams',
      description: 'Team management and membership endpoints'
    },
    {
      name: 'Public',
      description: 'Public endpoints for league and team information'
    },
    {
      name: 'System',
      description: 'System health and status endpoints'
    }
  ]
};

// Swagger JSDoc options
const swaggerOptions = {
  definition: swaggerDefinition,
  apis: [
    './src/api/routes/*.ts',
    './src/api/controllers/*.ts'
  ]
};

// Generate swagger specification
export const swaggerSpec = swaggerJsdoc(swaggerOptions);

export default swaggerSpec;