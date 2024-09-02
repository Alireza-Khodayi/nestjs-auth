import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigType } from '@nestjs/config';
import redisConfig from './config/redis.config';
import { InvalidatedStoredValueException } from './utils/invalidate-stored-value.exception';

/**
 * This service should be used by modules that require direct access to ioredis client. The rest should use
 * redis microservice.
 */
@Injectable()
export class RedisService extends Redis implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);

  constructor(
    @Inject(redisConfig.KEY)
    private readonly redisConfiguration: ConfigType<typeof redisConfig>,
  ) {
    super({ ...redisConfiguration });

    this.on('connect', this.handleConnect.bind(this));
    this.on('ready', this.handleReady.bind(this));
    this.on('error', this.handleError.bind(this));
    this.on('close', this.handleClose.bind(this));
    this.on('reconnecting', this.handleReconnecting.bind(this));
    this.on('end', this.handleEnd.bind(this));
  }

  onModuleDestroy() {
    this.disconnect(false);
  }

  private handleConnect() {
    this.logger.log('Redis connecting...', { type: 'REDIS_CONNECTING' });
  }

  private handleReady() {
    this.logger.log('Redis connected!', { type: 'REDIS_CONNECTED' });
  }

  private handleClose() {
    this.logger.warn('Redis disconnected!', { type: 'REDIS_DISCONNECTED' });
  }

  private handleReconnecting() {
    this.logger.log('Redis reconnecting!', { type: 'REDIS_RECONNECTING' });
  }

  private handleEnd() {
    this.logger.warn('Redis connection ended!', { type: 'REDIS_CONN_ENDED' });
  }

  private handleError(err: any) {
    this.logger.error('Redis error occurred', { type: 'REDIS_ERROR', err });
  }

  async insert(
    collectionName: string,
    fieldName: number,
    fieldValue: string,
  ): Promise<void> {
    await this.set(this.getKey(collectionName, fieldName), fieldValue);
  }

  async validate(
    fieldName: string,
    fieldId: number,
    fieldValue: string,
  ): Promise<boolean> {
    const storedValue = await this.get(this.getKey(fieldName, fieldId));
    if (storedValue !== fieldValue) {
      throw new InvalidatedStoredValueException('Invalidated Stored Value');
    }
    return storedValue === fieldValue;
  }
  async inValidate(fieldName: string, fieldId: number): Promise<void> {
    await this.del(this.getKey(fieldName, fieldId));
  }

  private getKey(fieldName: string, fieldId: number): any {
    return `${fieldName}-${fieldId}`;
  }
}
