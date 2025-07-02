import type { Express, RequestHandler, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { storage } from '../storage';
import { features } from '../config';
import { log } from '../utils/logger';
import { captureAuthEvent } from '../utils/sentry';
import { AuthenticatedRequest } from '../types/express';

// OAuth provider configurations
interface OAuthConfig {
  google?: {
    clientId: string;
    clientSecret: string;
    callbackURL: string;
  };
  github?: {
    clientId: string;
    clientSecret: string;
    callbackURL: string;
  };
}

// OAuth user interface
interface OAuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl: string | null;
  provider: 'google' | 'github';
  providerId: string;
  accessToken: string;
  refreshToken?: string;
}

// Get OAuth configuration from environment variables
function getOAuthConfig(): OAuthConfig {
  const config: OAuthConfig = {};
  
  // Google OAuth configuration
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    config.google = {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback'
    };
  }
  
  // GitHub OAuth configuration
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    config.github = {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL || '/api/auth/github/callback'
    };
  }
  
  return config;
}

// Setup multiple OAuth providers
export async function setupMultiAuth(app: Express) {
  const oauthConfig = getOAuthConfig();
  
  log.info('Setting up multi-provider authentication', {
    providers: {
      google: !!oauthConfig.google,
      github: !!oauthConfig.github
    }
  });
  
  // Google OAuth Strategy
  if (oauthConfig.google) {
    passport.use(new GoogleStrategy({
      clientID: oauthConfig.google.clientId,
      clientSecret: oauthConfig.google.clientSecret,
      callbackURL: oauthConfig.google.callbackURL,
      scope: ['profile', 'email']
    }, async (accessToken: string, refreshToken: string, profile: any, done: any) => {
      try {
        const user: OAuthUser = {
          id: `google:${profile.id}`,
          email: profile.emails?.[0]?.value || '',
          firstName: profile.name?.givenName || '',
          lastName: profile.name?.familyName || '',
          profileImageUrl: profile.photos?.[0]?.value || null,
          provider: 'google',
          providerId: profile.id,
          accessToken,
          refreshToken
        };
        
        await storage.upsertUser(user);
        
        captureAuthEvent('google_login_success', {
          userId: user.id,
          email: user.email
        });
        
        log.info('Google OAuth login successful', {
          userId: user.id,
          email: user.email
        });
        
        return done(null, user);
      } catch (error) {
        log.error('Google OAuth error', { error: error instanceof Error ? error.message : 'Unknown error' });
        captureAuthEvent('google_login_error', { error: error instanceof Error ? error.message : 'Unknown error' });
        return done(error);
      }
    }));
    
    // Google OAuth routes
    app.get('/api/auth/google',
      passport.authenticate('google', { scope: ['profile', 'email'] })
    );
    
    app.get('/api/auth/google/callback',
      passport.authenticate('google', { failureRedirect: '/login?error=google_auth_failed' }),
      (req, res) => {
        log.info('Google OAuth callback successful');
        res.redirect('/?auth=success');
      }
    );
  }
  
  // GitHub OAuth Strategy  
  if (oauthConfig.github) {
    passport.use(new GitHubStrategy({
      clientID: oauthConfig.github.clientId,
      clientSecret: oauthConfig.github.clientSecret,
      callbackURL: oauthConfig.github.callbackURL,
      scope: ['user:email']
    }, async (accessToken: string, refreshToken: string, profile: any, done: any) => {
      try {
        const user = {
          id: `github:${profile.id}`,
          email: profile.emails?.[0]?.value || '',
          firstName: profile.displayName?.split(' ')[0] || profile.username || '',
          lastName: profile.displayName?.split(' ').slice(1).join(' ') || '',
          profileImageUrl: profile.photos?.[0]?.value || null,
          provider: 'github' as const,
          providerId: profile.id,
          accessToken,
          refreshToken
        };
        
        await storage.upsertUser(user);
        
        captureAuthEvent('github_login_success', {
          userId: user.id,
          email: user.email
        });
        
        log.info('GitHub OAuth login successful', {
          userId: user.id,
          email: user.email
        });
        
        return done(null, user);
      } catch (error) {
        log.error('GitHub OAuth error', { error: error instanceof Error ? error.message : 'Unknown error' });
        captureAuthEvent('github_login_error', { error: error instanceof Error ? error.message : 'Unknown error' });
        return done(error);
      }
    }));
    
    // GitHub OAuth routes
    app.get('/api/auth/github',
      passport.authenticate('github', { scope: ['user:email'] })
    );
    
    app.get('/api/auth/github/callback',
      passport.authenticate('github', { failureRedirect: '/login?error=github_auth_failed' }),
      (req, res) => {
        log.info('GitHub OAuth callback successful');
        res.redirect('/?auth=success');
      }
    );
  }
  
  // Enhanced logout that works with all providers
  app.get('/api/auth/logout', (req, res) => {
    const user = req.user;
    const provider = user?.provider;
    
    captureAuthEvent('logout', {
      userId: user?.id,
      provider
    });
    
    log.info('User logout', {
      userId: user?.id,
      provider
    });
    
    // Check if req.logout exists (Passport.js method)
    if (typeof req.logout === 'function') {
      req.logout((err) => {
        if (err) {
          log.error('Logout error', { error: err.message });
          return res.status(500).json({ success: false, message: 'Logout failed' });
        }
        
        (req as any).session?.destroy?.((err: any) => {
          if (err) {
            log.error('Session destruction error', { error: err.message });
          }
          res.clearCookie('connect.sid');
          res.redirect('/');
        });
      });
    } else {
      // Handle logout for mock auth or when Passport is not available
      req.user = undefined;
      
      // Clear session if it exists
      if ((req as any).session?.destroy) {
        (req as any).session.destroy((err: any) => {
          if (err) {
            log.error('Session destruction error', { error: err.message });
          }
          res.clearCookie('connect.sid');
          res.redirect('/');
        });
      } else {
        res.clearCookie('connect.sid');
        res.redirect('/');
      }
    }
  });
  
}

// Enhanced authentication middleware that works with all providers
export const multiAuthMiddleware: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated?.() || !req.user) {
    return res.status(401).json({ 
      success: false,
      message: 'Authentication required',
      availableProviders: {
        google: !!process.env.GOOGLE_CLIENT_ID,
        github: !!process.env.GITHUB_CLIENT_ID
      }
    });
  }
  
  const user = req.user as any;
  
  // For OAuth providers (Google/GitHub), check if user still exists in database
  if (user.provider) {
    try {
      const dbUser = await storage.getUser(user.id);
      if (!dbUser) {
        return res.status(401).json({ 
          success: false,
          message: 'User account not found' 
        });
      }
    } catch (error) {
      log.error('Database user lookup error', { 
        userId: user.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return res.status(500).json({ 
        success: false,
        message: 'Authentication verification failed' 
      });
    }
  }
  
  
  next();
};

// Utility function to get user info regardless of provider
export function getUserInfo(req: Request): { id: string; email: string; name: string; provider: string } | null {
  if (!req.user) return null;
  
  const user = req.user as any;
  
  
  // Handle Google/GitHub OAuth format
  return {
    id: user.id,
    email: user.email || '',
    name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown User',
    provider: user.provider || 'unknown'
  };
}
