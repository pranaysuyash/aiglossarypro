import { Request } from 'express';

declare global {
  namespace Express {
    interface User {
      claims: {
        sub: string;
        email: string;
        name: string;
        first_name?: string;
        last_name?: string;
      };
      access_token?: string;
      expires_at?: number;
      isAdmin?: boolean;
      id?: string;
      provider?: 'google' | 'github' | 'replit';
    }

    interface Request {
      user?: User;
      requestId?: string;
      isAuthenticated?: () => boolean;
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user: NonNullable<Request['user']>;
}

export interface AdminRequest extends AuthenticatedRequest {
  user: AuthenticatedRequest['user'] & {
    isAdmin: true;
  };
}

export {};