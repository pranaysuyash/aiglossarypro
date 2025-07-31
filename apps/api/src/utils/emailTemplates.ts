/**
 * Email templates for various system emails
 */

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export interface PremiumWelcomeEmailData {
  userName?: string;
  userEmail: string;
  purchaseDate: string;
  orderId: string;
  purchaseAmount: string;
}

const baseStyles = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.6;
  color: #333;
`;

const containerStyles = `
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  background-color: #ffffff;
`;

const buttonStyles = `
  display: inline-block;
  padding: 12px 24px;
  background-color: #2563eb;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 500;
  margin: 10px 0;
`;

const footerStyles = `
  margin-top: 40px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
  color: #6b7280;
  font-size: 14px;
`;

const premiumButtonStyles = `
  display: inline-block;
  padding: 12px 24px;
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 500;
  margin: 10px 0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
`;

/**
 * Welcome email template
 */
export function getWelcomeEmailTemplate(userName?: string): EmailTemplate {
  const displayName = userName || 'AI Enthusiast';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  return {
    subject: 'Welcome to AI Glossary Pro! 🚀',
    html: `
      <div style="${baseStyles}">
        <div style="${containerStyles}">
          <h1 style="color: #2563eb; margin-bottom: 20px;">Welcome to AI Glossary Pro!</h1>
          
          <p>Hi ${displayName},</p>
          
          <p>Thank you for joining AI Glossary Pro, your comprehensive AI/ML terminology and learning platform with over 10,000 expertly curated definitions.</p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #1e40af; margin-top: 0;">🎯 What you can do now:</h2>
            <ul style="margin: 0; padding-left: 20px;">
              <li>🔍 <strong>Search & Discover:</strong> Explore 10,000+ AI/ML terms with detailed explanations</li>
              <li>📚 <strong>Learn Systematically:</strong> Follow structured learning paths tailored to your level</li>
              <li>⭐ <strong>Save Favorites:</strong> Bookmark important terms for quick reference</li>
              <li>📊 <strong>Track Progress:</strong> Monitor your learning journey with detailed analytics</li>
              <li>🤖 <strong>AI Recommendations:</strong> Get personalized term suggestions</li>
              <li>🎨 <strong>Interactive Learning:</strong> Engage with 3D visualizations and code examples</li>
            </ul>
          </div>
          
          <p>Ready to start your AI learning journey?</p>
          
          <a href="${frontendUrl}" style="${buttonStyles}">
            Start Exploring AI Terms
          </a>
          
          <div style="margin: 30px 0; padding: 15px; background-color: #ecfdf5; border-left: 4px solid #10b981; border-radius: 4px;">
            <p style="margin: 0; color: #065f46;">
              💡 <strong>Pro Tip:</strong> Try searching for "machine learning" or "neural network" to see our enhanced definitions in action!
            </p>
          </div>
          
          <div style="${footerStyles}">
            <p>Need help getting started? Here are some useful links:</p>
            <ul style="margin: 10px 0;">
              <li><a href="${frontendUrl}/learning-paths" style="color: #2563eb;">Browse Learning Paths</a></li>
              <li><a href="${frontendUrl}/categories" style="color: #2563eb;">Explore Categories</a></li>
              <li><a href="${frontendUrl}/about" style="color: #2563eb;">About AI Glossary Pro</a></li>
            </ul>
            <p>Happy learning!<br>The AI Glossary Pro Team</p>
          </div>
        </div>
      </div>
    `,
    text: `
Welcome to AI Glossary Pro!

Hi ${displayName},

Thank you for joining AI Glossary Pro, your comprehensive AI/ML terminology and learning platform with over 10,000 expertly curated definitions.

What you can do now:
• Search & Discover: Explore 10,000+ AI/ML terms with detailed explanations
• Learn Systematically: Follow structured learning paths tailored to your level
• Save Favorites: Bookmark important terms for quick reference
• Track Progress: Monitor your learning journey with detailed analytics
• AI Recommendations: Get personalized term suggestions
• Interactive Learning: Engage with 3D visualizations and code examples

Ready to start your AI learning journey? Visit: ${frontendUrl}

Pro Tip: Try searching for "machine learning" or "neural network" to see our enhanced definitions in action!

Need help? Visit these links:
• Learning Paths: ${frontendUrl}/learning-paths
• Categories: ${frontendUrl}/categories
• About: ${frontendUrl}/about

Happy learning!
The AI Glossary Pro Team
    `,
  };
}

/**
 * Password reset email template
 */
export function getPasswordResetEmailTemplate(resetToken: string): EmailTemplate {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

  return {
    subject: '🔐 Reset Your AI Glossary Pro Password',
    html: `
      <div style="${baseStyles}">
        <div style="${containerStyles}">
          <h1 style="color: #dc2626; margin-bottom: 20px;">Password Reset Request</h1>
          
          <p>You requested a password reset for your AI Glossary Pro account.</p>
          
          <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <p style="margin: 0; color: #991b1b;">
              <strong>⏰ This link will expire in 1 hour</strong> for your security.
            </p>
          </div>
          
          <p>Click the button below to reset your password:</p>
          
          <a href="${resetUrl}" style="${buttonStyles.replace('#2563eb', '#dc2626')}">
            Reset My Password
          </a>
          
          <p style="color: #6b7280; margin-top: 30px;">
            If you didn't request this reset, you can safely ignore this email. Your password won't be changed.
          </p>
          
          <div style="${footerStyles}">
            <p><strong>Having trouble with the button?</strong></p>
            <p>Copy and paste this link into your browser:</p>
            <p style="background-color: #f3f4f6; padding: 10px; border-radius: 4px; word-break: break-all; font-family: monospace; font-size: 12px;">
              ${resetUrl}
            </p>
            
            <p style="margin-top: 20px;">
              Best regards,<br>
              The AI Glossary Pro Team
            </p>
          </div>
        </div>
      </div>
    `,
    text: `
Password Reset Request

You requested a password reset for your AI Glossary Pro account.

⏰ This link will expire in 1 hour for your security.

To reset your password, visit this link:
${resetUrl}

If you didn't request this reset, you can safely ignore this email. Your password won't be changed.

Having trouble? Copy and paste the link above into your browser.

Best regards,
The AI Glossary Pro Team
    `,
  };
}

/**
 * Email verification template
 */
export function getEmailVerificationTemplate(
  verificationToken: string,
  userName?: string
): EmailTemplate {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const verificationUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;
  const displayName = userName || 'there';

  return {
    subject: '✉️ Verify Your AI Glossary Pro Email',
    html: `
      <div style="${baseStyles}">
        <div style="${containerStyles}">
          <h1 style="color: #2563eb; margin-bottom: 20px;">Verify Your Email Address</h1>
          
          <p>Hi ${displayName},</p>
          
          <p>Thanks for signing up for AI Glossary Pro! To complete your registration and start exploring AI/ML terminology, please verify your email address.</p>
          
          <a href="${verificationUrl}" style="${buttonStyles}">
            Verify My Email
          </a>
          
          <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
            <p style="margin: 0; color: #0c4a6e;">
              <strong>🎉 Once verified, you'll have access to:</strong><br>
              • Personalized learning paths<br>
              • Progress tracking<br>
              • Favorites and bookmarks<br>
              • AI-powered recommendations
            </p>
          </div>
          
          <div style="${footerStyles}">
            <p><strong>Verification link not working?</strong></p>
            <p>Copy and paste this link into your browser:</p>
            <p style="background-color: #f3f4f6; padding: 10px; border-radius: 4px; word-break: break-all; font-family: monospace; font-size: 12px;">
              ${verificationUrl}
            </p>
            
            <p style="margin-top: 20px;">
              If you didn't create an account with AI Glossary Pro, you can safely ignore this email.
            </p>
            
            <p>
              Welcome aboard!<br>
              The AI Glossary Pro Team
            </p>
          </div>
        </div>
      </div>
    `,
    text: `
Verify Your Email Address

Hi ${displayName},

Thanks for signing up for AI Glossary Pro! To complete your registration and start exploring AI/ML terminology, please verify your email address.

Verification link: ${verificationUrl}

Once verified, you'll have access to:
• Personalized learning paths
• Progress tracking
• Favorites and bookmarks
• AI-powered recommendations

If you didn't create an account with AI Glossary Pro, you can safely ignore this email.

Welcome aboard!
The AI Glossary Pro Team
    `,
  };
}

/**
 * Learning progress notification template
 */
export function getLearningProgressTemplate(
  userName: string,
  milestone: string,
  progress: number
): EmailTemplate {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  return {
    subject: `🎉 Congratulations! You've reached ${milestone}`,
    html: `
      <div style="${baseStyles}">
        <div style="${containerStyles}">
          <h1 style="color: #059669; margin-bottom: 20px;">🎉 Amazing Progress!</h1>
          
          <p>Hi ${userName},</p>
          
          <p>Congratulations! You've just reached an important milestone in your AI/ML learning journey.</p>
          
          <div style="background-color: #ecfdf5; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center; border-left: 4px solid #059669;">
            <h2 style="color: #065f46; margin-top: 0; font-size: 24px;">${milestone}</h2>
            <div style="background-color: #d1fae5; border-radius: 50px; padding: 8px; margin: 15px 0;">
              <div style="background-color: #059669; height: 8px; border-radius: 50px; width: ${progress}%;"></div>
            </div>
            <p style="color: #047857; margin: 0; font-weight: 500;">${progress}% Complete</p>
          </div>
          
          <p>Keep up the excellent work! Your dedication to learning AI/ML concepts is truly impressive.</p>
          
          <a href="${frontendUrl}/dashboard" style="${buttonStyles.replace('#2563eb', '#059669')}">
            View Your Progress
          </a>
          
          <div style="${footerStyles}">
            <p>Ready for the next challenge? Check out our recommended learning paths tailored to your progress.</p>
            <p>
              Keep learning!<br>
              The AI Glossary Pro Team
            </p>
          </div>
        </div>
      </div>
    `,
    text: `
Amazing Progress!

Hi ${userName},

Congratulations! You've just reached an important milestone in your AI/ML learning journey.

🎉 ${milestone}
Progress: ${progress}% Complete

Keep up the excellent work! Your dedication to learning AI/ML concepts is truly impressive.

View your progress: ${frontendUrl}/dashboard

Ready for the next challenge? Check out our recommended learning paths tailored to your progress.

Keep learning!
The AI Glossary Pro Team
    `,
  };
}

/**
 * System notification template
 */
export function getSystemNotificationTemplate(
  title: string,
  message: string,
  actionUrl?: string,
  actionText?: string
): EmailTemplate {
  return {
    subject: `AI Glossary Pro: ${title}`,
    html: `
      <div style="${baseStyles}">
        <div style="${containerStyles}">
          <h1 style="color: #2563eb; margin-bottom: 20px;">${title}</h1>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;">${message}</p>
          </div>
          
          ${
            actionUrl && actionText
              ? `
            <a href="${actionUrl}" style="${buttonStyles}">
              ${actionText}
            </a>
          `
              : ''
          }
          
          <div style="${footerStyles}">
            <p>
              Best regards,<br>
              The AI Glossary Pro Team
            </p>
          </div>
        </div>
      </div>
    `,
    text: `
${title}

${message}

${actionUrl && actionText ? `${actionText}: ${actionUrl}` : ''}

Best regards,
The AI Glossary Pro Team
    `,
  };
}

/**
 * Premium welcome email template
 */
export function getPremiumWelcomeEmailTemplate(data: PremiumWelcomeEmailData): EmailTemplate {
  const { userName, userEmail, purchaseDate, orderId, purchaseAmount } = data;
  const displayName = userName || 'Premium Member';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const dashboardUrl = `${frontendUrl}/dashboard?welcome=premium`;

  return {
    subject: '🎉 Welcome to AI Glossary Pro Premium\! Your Lifetime Access is Ready',
    html: `
      <div style="${baseStyles}">
        <div style="${containerStyles}">
          <\!-- Header with Premium Badge -->
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); color: white; padding: 12px 24px; border-radius: 25px; display: inline-block; font-weight: bold; margin-bottom: 20px;">
              👑 Premium Member
            </div>
            <h1 style="color: #1f2937; margin: 0; font-size: 28px;">Welcome to Premium\!</h1>
          </div>
          
          <p style="font-size: 18px; color: #4b5563;">Hi ${displayName},</p>
          
          <p style="font-size: 16px; color: #4b5563;">
            🎉 <strong>Congratulations\!</strong> Your upgrade to AI Glossary Pro Premium is now complete. You now have unlimited lifetime access to our entire AI/ML knowledge base.
          </p>

          <\!-- Purchase Summary -->
          <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 20px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #0ea5e9;">
            <h3 style="color: #0c4a6e; margin-top: 0; font-size: 18px;">📋 Purchase Summary</h3>
            <div style="background: white; padding: 15px; border-radius: 8px;">
              <p style="margin: 5px 0; color: #374151;"><strong>Order ID:</strong> ${orderId}</p>
              <p style="margin: 5px 0; color: #374151;"><strong>Amount:</strong> ${purchaseAmount}</p>
              <p style="margin: 5px 0; color: #374151;"><strong>Purchase Date:</strong> ${purchaseDate}</p>
              <p style="margin: 5px 0; color: #374151;"><strong>Access Type:</strong> Lifetime Premium</p>
            </div>
          </div>

          <\!-- What's Included -->
          <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); padding: 20px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #10b981;">
            <h3 style="color: #065f46; margin-top: 0; font-size: 18px;">🚀 What's Included in Your Premium Access</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin-top: 15px;">
              <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #d1fae5;">
                <div style="color: #059669; font-weight: bold; margin-bottom: 8px;">📚 Complete Knowledge Base</div>
                <div style="color: #374151; font-size: 14px;">10,000+ AI/ML terms and definitions</div>
              </div>
              <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #d1fae5;">
                <div style="color: #059669; font-weight: bold; margin-bottom: 8px;">🎯 42 Specialized Categories</div>
                <div style="color: #374151; font-size: 14px;">From basics to advanced topics</div>
              </div>
              <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #d1fae5;">
                <div style="color: #059669; font-weight: bold; margin-bottom: 8px;">🔄 Lifetime Updates</div>
                <div style="color: #374151; font-size: 14px;">Always stay current with AI trends</div>
              </div>
              <div style="background: white; padding: 15px; border-radius: 8px; border: 1px solid #d1fae5;">
                <div style="color: #059669; font-weight: bold; margin-bottom: 8px;">🤖 AI-Powered Tools</div>
                <div style="color: #374151; font-size: 14px;">Advanced search and recommendations</div>
              </div>
            </div>
          </div>

          <\!-- CTA Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${dashboardUrl}" style="${premiumButtonStyles}">
              🚀 Access Your Premium Dashboard
            </a>
          </div>

          <\!-- Footer -->
          <div style="${footerStyles}">
            <p style="text-align: center; color: #6b7280; font-size: 16px; margin-bottom: 20px;">
              Thank you for choosing AI Glossary Pro Premium\! 🚀
            </p>
            
            <div style="text-align: center; margin-bottom: 20px;">
              <a href="${frontendUrl}" style="color: #0ea5e9; text-decoration: none; margin: 0 10px;">Visit Website</a>
              <span style="color: #d1d5db;">•</span>
              <a href="${frontendUrl}/dashboard" style="color: #0ea5e9; text-decoration: none; margin: 0 10px;">Dashboard</a>
              <span style="color: #d1d5db;">•</span>
              <a href="${frontendUrl}/categories" style="color: #0ea5e9; text-decoration: none; margin: 0 10px;">Browse Categories</a>
            </div>
            
            <p style="text-align: center; color: #9ca3af; font-size: 12px;">
              This email was sent to ${userEmail} because you purchased AI Glossary Pro Premium.<br>
              If you have any questions, please contact us at support@aiglossarypro.com
            </p>
          </div>
        </div>
      </div>
    `,
    text: `
🎉 Welcome to AI Glossary Pro Premium\!

Hi ${displayName},

Congratulations\! Your upgrade to AI Glossary Pro Premium is now complete. You now have unlimited lifetime access to our entire AI/ML knowledge base.

Purchase Summary:
- Order ID: ${orderId}
- Amount: ${purchaseAmount}
- Purchase Date: ${purchaseDate}
- Access Type: Lifetime Premium

What's Included:
• 10,000+ AI/ML terms and definitions
• 42 specialized categories
• Lifetime updates
• AI-powered tools and search
• Priority support

Quick Start:
1. Access your Premium Dashboard: ${dashboardUrl}
2. Explore all 42 AI/ML categories
3. Use advanced search to find specific topics
4. Track your learning progress

Premium Support:
Email: support@aiglossarypro.com
Help Center: ${frontendUrl}/help
Contact Us: ${frontendUrl}/contact

Thank you for choosing AI Glossary Pro Premium\!

---
This email was sent to ${userEmail}
Contact us: support@aiglossarypro.com
    `,
  };
}
