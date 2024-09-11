import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  type: process.env.DB_TYPE || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'pass1234',
  database: process.env.DB_NAME || 'postgres',
  autoLoadEntities: true,
  synchronize: process.env.NODE_ENV === 'development',
}));
