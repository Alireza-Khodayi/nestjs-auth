import { registerAs } from '@nestjs/config';

export default registerAs('iam', () => {
  return {
    adminEmail: process.env.INITIAL_ADMIN_EMAIL,
    adminPassword: process.env.INITIAL_ADMIN_PASSWORD,
    defaultUserRoleName: process.env.DEFAULT_USER_ROLE_NAME,
    defaultAdminRoleName: process.env.DEFAULT_ADMIN_ROLE_NAME,
    pgViolationErrorCode: parseInt(
      process.env.PG_UNIQUE_VIOLATION_ERROR_CODE ?? '23505',
      10,
    ),
  };
});
