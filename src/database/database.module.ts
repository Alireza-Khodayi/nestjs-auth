import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm'; // Import TypeOrmModuleOptions
import databaseConfig from './config/database.config'; // Adjust the path as necessary

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [databaseConfig], // Load the database configuration
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule], // Import ConfigModule to access ConfigService
      useFactory: async (
        configService: ConfigService,
      ): Promise<TypeOrmModuleOptions> => ({
        type: configService.get<string>('database.type') as 'postgres', // Assert type as string
        host: configService.get<string>('database.host'), // Assert type as string
        port: configService.get<number>('database.port'), // Assert type as number
        username: configService.get<string>('database.username'), // Assert type as string
        password: configService.get<string>('database.password'), // Assert type as string
        database: configService.get<string>('database.database'), // Assert type as string
        autoLoadEntities: true,
        synchronize: configService.get<string>('NODE_ENV') === 'development', // Assert type as string
      }),
      inject: [ConfigService], // Inject ConfigService
    }),
  ],
})
export class DatabaseModule {}
