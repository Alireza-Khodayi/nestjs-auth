import { ConfigService, ConfigType } from '@nestjs/config';
import { createLogger } from 'winston';
import { Scope } from '@nestjs/common';
import { INQUIRER } from '@nestjs/core';
import loggerConfig, { LOGGER_CONFIG_KEY } from '../config/logger.config';

export const LOGGER = 'logger';

export const loggerFactory = {
  provide: LOGGER,
  useFactory: (configService: ConfigService, parentClass: object) => {
    const config =
      configService.get<ConfigType<typeof loggerConfig>>(LOGGER_CONFIG_KEY);
    if (!config) {
      throw new Error('Logger configuration is not defined');
    }
    return createLogger({
      ...config.winston,
      defaultMeta: {
        ...config.winston.defaultMeta,
        context: parentClass?.constructor?.name,
      },
    });
  },
  scope: Scope.TRANSIENT,
  inject: [ConfigService, INQUIRER],
};
