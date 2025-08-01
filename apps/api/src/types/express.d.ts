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
      claims: {
        sub: string;
        [key: string]: any;
      };
      access_token?: string;
      expires_at?: number;
      provider?: 'google' | 'github';
    }

    interface Request {
      user?: User;
      firebaseUser?: User;
      requestId: string;
      userId?: string;
      startTime?: number;
      userIp?: string;
      sessionId?: string;
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
