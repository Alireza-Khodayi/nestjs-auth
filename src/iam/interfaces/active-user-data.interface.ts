export interface ActiveUserData {
  /**
   * The "subject" of the token. The value of this property is the user ID
   * that garanted this token.
   */
  sub: number;
  /**
   * The subject's (user) email.
   */
  email: string;
}
