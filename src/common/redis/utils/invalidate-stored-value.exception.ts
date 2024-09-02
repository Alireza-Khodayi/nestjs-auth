import { BadRequestException } from '@nestjs/common';

export class InvalidatedStoredValueException extends BadRequestException {}
