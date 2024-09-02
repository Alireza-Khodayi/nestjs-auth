import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis.service';

@Injectable()
export class RefreshTokenIdsStorageService {
  constructor(private readonly redisService: RedisService) {}

  async insert(
    fieldName: string,
    fieldId: number,
    fieldValue: string,
  ): Promise<void> {
    await this.redisService.insert(fieldName, fieldId, fieldValue);
  }

  async validate(
    fieldName: string,
    fieldId: number,
    fieldValue: string,
  ): Promise<boolean> {
    const isValid = await this.redisService.validate(
      fieldName,
      fieldId,
      fieldValue,
    );
    return isValid;
  }

  async inValidate(fieldName: string, fieldId: number): Promise<void> {
    await this.redisService.inValidate(fieldName, fieldId);
  }
}
