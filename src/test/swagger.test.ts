/**
 * Swagger Documentation Tests
 * Tests for API documentation configuration
 */

import { swaggerSpec } from '../config/swagger';

describe('Swagger Configuration', () => {
  it('should have valid OpenAPI specification', () => {
    const spec = swaggerSpec as any;

    // Basic structure validation
    expect(spec).toHaveProperty('openapi');
    expect(spec).toHaveProperty('info');
    expect(spec).toHaveProperty('paths');
    expect(spec).toHaveProperty('components');
    expect(spec).toHaveProperty('tags');

    // Info validation
    expect(spec.info.title).toBe('PBSportsClub API');
    expect(spec.info.version).toBe('1.0.0');
    expect(spec.info.description).toContain('TypeScript/Node.js backend');
  });

  it('should have comprehensive API endpoints', () => {
    const spec = swaggerSpec as any;
    const paths = Object.keys(spec.paths);

    expect(paths.length).toBeGreaterThan(0);
    expect(paths).toContain('/auth/signup');
    expect(paths).toContain('/auth/login');
    expect(paths).toContain('/health');
    expect(paths).toContain('/teams');
    expect(paths).toContain('/leagues');
  });

  it('should have proper schemas defined', () => {
    const spec = swaggerSpec as any;
    const schemas = Object.keys(spec.components.schemas);

    // Core entity schemas
    expect(schemas).toContain('User');
    expect(schemas).toContain('League');
    expect(schemas).toContain('Team');
    expect(schemas).toContain('TeamMember');

    // Request schemas
    expect(schemas).toContain('SignupRequest');
    expect(schemas).toContain('LoginRequest');
    expect(schemas).toContain('CreateTeamRequest');

    // Response schemas
    expect(schemas).toContain('AuthResponse');
    expect(schemas).toContain('ErrorResponse');
  });

  it('should have security scheme configured', () => {
    const spec = swaggerSpec as any;

    expect(spec.components).toHaveProperty('securitySchemes');
    expect(spec.components.securitySchemes).toHaveProperty('cookieAuth');
    expect(spec.components.securitySchemes.cookieAuth.type).toBe('apiKey');
    expect(spec.components.securitySchemes.cookieAuth.in).toBe('cookie');
  });

  it('should have proper tags defined', () => {
    const spec = swaggerSpec as any;

    expect(spec.tags).toBeInstanceOf(Array);
    expect(spec.tags.length).toBeGreaterThan(0);

    const tagNames = spec.tags.map((tag: any) => tag.name);
    expect(tagNames).toContain('Authentication');
    expect(tagNames).toContain('Teams');
    expect(tagNames).toContain('Public');
  });
});
