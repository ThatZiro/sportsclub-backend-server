/**
 * AWS Secrets Manager Integration
 * Handles retrieving database credentials from AWS Secrets Manager
 */

import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';

interface DatabaseCredentials {
  username: string;
  password: string;
  host: string;
  port: number;
  dbname: string;
}

class AWSSecretsManager {
  private client: SecretsManagerClient;
  private region: string;

  constructor(region: string = process.env['AWS_REGION'] || 'us-east-1') {
    this.region = region;
    this.client = new SecretsManagerClient({ region: this.region });
  }

  /**
   * Retrieve database credentials from AWS Secrets Manager
   */
  async getDatabaseCredentials(
    secretArn: string
  ): Promise<DatabaseCredentials> {
    try {
      const command = new GetSecretValueCommand({
        SecretId: secretArn,
      });

      const response = await this.client.send(command);

      if (!response.SecretString) {
        throw new Error('Secret value is empty');
      }

      const secret = JSON.parse(response.SecretString);

      // AWS RDS secrets typically have this structure
      return {
        username: secret.username,
        password: secret.password,
        host: secret.host,
        port: secret.port || 5432,
        dbname: secret.dbname || process.env['DB_NAME'] || 'pbsports',
      };
    } catch (error) {
      console.error(
        'Failed to retrieve database credentials from Secrets Manager:',
        error
      );
      throw new Error(`Failed to retrieve database credentials: ${error}`);
    }
  }

  /**
   * Build DATABASE_URL from Secrets Manager credentials
   */
  async buildDatabaseUrl(secretArn: string): Promise<string> {
    const credentials = await this.getDatabaseCredentials(secretArn);

    return `postgresql://${credentials.username}:${credentials.password}@${credentials.host}:${credentials.port}/${credentials.dbname}`;
  }
}

/**
 * Get database URL - either from environment or Secrets Manager
 */
export async function getDatabaseUrl(): Promise<string> {
  // If DATABASE_URL is already set, use it
  if (process.env['DATABASE_URL']) {
    return process.env['DATABASE_URL'];
  }

  // If AWS_SECRET_ARN is set, retrieve from Secrets Manager
  const secretArn = process.env['AWS_SECRET_ARN'];
  if (secretArn) {
    const secretsManager = new AWSSecretsManager();
    return await secretsManager.buildDatabaseUrl(secretArn);
  }

  // Fallback to individual environment variables
  const host = process.env['DB_HOST'];
  const port = process.env['DB_PORT'] || '5432';
  const username = process.env['DB_USERNAME'];
  const password = process.env['DB_PASSWORD'];
  const dbname = process.env['DB_NAME'] || 'pbsports';

  if (!host || !username || !password) {
    throw new Error(
      'Database configuration is incomplete. Set DATABASE_URL, AWS_SECRET_ARN, or individual DB_* variables.'
    );
  }

  return `postgresql://${username}:${password}@${host}:${port}/${dbname}`;
}

export { AWSSecretsManager, DatabaseCredentials };
