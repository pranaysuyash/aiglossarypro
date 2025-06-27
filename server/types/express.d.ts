import { Request } from 'express';

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string | null;
      firstName: string | null;
      lastName: string | null;
      profileImageUrl: string | null;
      isAdmin: boolean | null;
      claims?: any;
      access_token?: string;
      expires_at?: number;
      provider?: 'google' | 'github' | 'replit';
    }

    interface Request {
      user?: User;
      requestId: string;
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