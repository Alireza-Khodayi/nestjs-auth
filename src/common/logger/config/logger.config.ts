import { registerAs } from '@nestjs/config';
import { format as winstonFormat, transports } from 'winston';
import { errorStackFormatter } from '../utils/error-stack-formatter.util';
import { errorStackFormatterInline } from '../utils/error-stack-formatter-inline.util.ts';
import { prettyConsoleFormatter } from '../utils/pretty-console-formatter.util';
import { envToBoolean } from 'src/common/env/utils/env-to-boolean.util';
import { envToNumber } from 'src/common/env/utils/env-to-number.util';

export const LOGGER_CONFIG_KEY = 'logger-config';

export default registerAs(LOGGER_CONFIG_KEY, () => {
  let format;
  const defaultMeta = {
    layer: 'App',
    service: process.env.SERVICE_NAME, // this is an optional meta field
    context: 'unspecified', // is overridden by the logger factory and the NestJSLoggerService
  };
  switch (process.env.NODE_ENV) {
    case 'production':
      console.log(winstonFormat);
      format = winstonFormat.combine(
        winstonFormat.timestamp(),
        errorStackFormatter(),
        winstonFormat.json(),
      );
      break;
    default:
      format = winstonFormat.combine(
        prettyConsoleFormatter(),
        errorStackFormatterInline(),
        errorStackFormatter(),
      );
      break;
  }
  return {
    winston: {
      level: process.env.LOGGER_MIN_LEVEL || 'debug',
      silent: envToBoolean('LOGGER_DISABLE', false),
      transports: [new transports.Console()],
      format,
      defaultMeta,
    },
    /* http log middleware configuration */
    http: {
      body: {
        enabled: envToBoolean('LOGGER_HTTP_BODY_ENABLED', true),
        maxSize: envToNumber('LOGGER_HTTP_BODY_MAX_SIZE', 3 * 1024), // default is 3KB
        // although, it's the endpoint's responsibility to remove any sensitive data, we can proactively remove some
        // well-known sensitive fields.
        blackListedFields: ['password'],
      },
      query: {
        enabled: envToBoolean('LOGGER_HTTP_QUERY_ENABLED', true),
        maxSize: envToNumber('LOGGER_HTTP_QUERY_MAX_SIZE', 3 * 1024), // default is 3KB
      },
      cookies: {
        enabled: envToBoolean('LOGGER_HTTP_COOKIES_ENABLED', true),
        maxSize: envToNumber('LOGGER_HTTP_COOKIES_MAX_SIZE', 3 * 1024), // default is 3KB
      },
    },
  };
});
