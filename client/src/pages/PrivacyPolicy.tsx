import { Clock, Cookie, Database, Eye, FileText, Globe, Mail, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { BaseComponentProps } from '@/types/common-props';

interface PrivacyPolicyProps extends BaseComponentProps {}

export default function PrivacyPolicy({ className }: PrivacyPolicyProps = {}) {
  const lastUpdated = 'July 4, 2025';

  return (
    <div
      className={cn(
        'min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800',
        className
      )}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center items-center gap-2 mb-4">
              <Shield className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Privacy Policy
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              We are committed to protecting your privacy and being transparent about how we
              collect, use, and protect your personal information.
            </p>
            <div className="flex justify-center items-center gap-2 mt-4">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-500">Last updated: {lastUpdated}</span>
            </div>
          </div>

          {/* Introduction */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Introduction
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300">
                AI Glossary Pro ("we," "our," or "us") operates the AI/ML Glossary application. This
                Privacy Policy informs you of our policies regarding the collection, use, and
                disclosure of personal data when you use our Service and the choices you have
                associated with that data.
              </p>
              <p className="text-gray-700 dark:text-gray-300 mt-4">
                By using our Service, you agree to the collection and use of information in
                accordance with this policy. This policy complies with the General Data Protection
                Regulation (GDPR) and California Consumer Privacy Act (CCPA).
              </p>
            </CardContent>
          </Card>

          {/* Data Collection */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Information We Collect
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Badge variant="outline">Personal Information</Badge>
                </h3>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                  <li>Email address (for account creation and communication)</li>
                  <li>Name (if provided during registration)</li>
                  <li>Profile preferences and settings</li>
                  <li>Payment information (processed by secure third-party providers)</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Badge variant="outline">Usage Information</Badge>
                </h3>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                  <li>Search queries and browsing behavior</li>
                  <li>Terms viewed and favorited</li>
                  <li>Time spent on pages and interaction patterns</li>
                  <li>Device information and IP address</li>
                  <li>Browser type and version</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Badge variant="outline">Cookies and Tracking</Badge>
                </h3>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                  <li>Essential cookies for authentication and preferences</li>
                  <li>Analytics cookies to improve our service</li>
                  <li>Performance cookies to optimize loading times</li>
                  <li>Local storage for offline functionality</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* How We Use Data */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                How We Use Your Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Service Provision</h3>
                  <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                    <li>Provide access to the AI/ML Glossary content</li>
                    <li>Maintain your account and preferences</li>
                    <li>Process payments and manage subscriptions</li>
                    <li>Provide customer support</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Service Improvement</h3>
                  <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                    <li>Analyze usage patterns to improve content</li>
                    <li>Optimize search functionality and recommendations</li>
                    <li>Enhance user experience and interface design</li>
                    <li>Develop new features and functionality</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Communication</h3>
                  <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                    <li>Send important service updates and notifications</li>
                    <li>Respond to your inquiries and support requests</li>
                    <li>Send optional newsletters (with your consent)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* GDPR Compliance */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                GDPR Compliance - Your Rights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Under the General Data Protection Regulation (GDPR), you have the following rights:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                      Right to Access
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Request a copy of your personal data we hold
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <h4 className="font-semibold text-green-900 dark:text-green-100">
                      Right to Rectification
                    </h4>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Correct inaccurate or incomplete data
                    </p>
                  </div>
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <h4 className="font-semibold text-red-900 dark:text-red-100">
                      Right to Erasure
                    </h4>
                    <p className="text-sm text-red-700 dark:text-red-300">
                      Request deletion of your personal data
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <h4 className="font-semibold text-purple-900 dark:text-purple-100">
                      Right to Portability
                    </h4>
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      Transfer your data to another service
                    </p>
                  </div>
                  <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <h4 className="font-semibold text-orange-900 dark:text-orange-100">
                      Right to Restrict
                    </h4>
                    <p className="text-sm text-orange-700 dark:text-orange-300">
                      Limit how we process your data
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                      Right to Object
                    </h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Object to processing for direct marketing
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                To exercise these rights, contact us at privacy@aiglosspro.com
              </p>
            </CardContent>
          </Card>

          {/* CCPA Compliance */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                CCPA Compliance - California Residents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Under the California Consumer Privacy Act (CCPA), California residents have specific
                rights:
              </p>
              <div className="space-y-4">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-semibold">Right to Know</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    You have the right to know what personal information we collect, use, disclose,
                    and sell about you.
                  </p>
                </div>
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-semibold">Right to Delete</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    You have the right to request that we delete your personal information.
                  </p>
                </div>
                <div className="border-l-4 border-red-500 pl-4">
                  <h4 className="font-semibold">Right to Opt-Out</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    You have the right to opt-out of the sale of your personal information. Note: We
                    do not sell personal information.
                  </p>
                </div>
                <div className="border-l-4 border-purple-500 pl-4">
                  <h4 className="font-semibold">Right to Non-Discrimination</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    We will not discriminate against you for exercising your privacy rights.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cookies */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cookie className="h-5 w-5" />
                Cookies and Tracking Technologies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Essential Cookies</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Required for basic functionality, authentication, and security. Cannot be
                    disabled.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Analytics Cookies</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Help us understand how you use our service to improve performance and user
                    experience.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Preference Cookies</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Remember your settings and preferences for a better experience.
                  </p>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 border-t pt-4">
                  You can manage your cookie preferences through our cookie banner or your browser
                  settings.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Third-Party Services */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Third-Party Services</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We use the following third-party services that may collect information:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Firebase (Google)</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Authentication and database services
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Stripe</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Payment processing (PCI compliant)
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Vercel</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Hosting and content delivery
                  </p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">PostHog</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Privacy-focused analytics
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Security */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Data Security</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We implement appropriate technical and organizational security measures to protect
                your personal information:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                <li>End-to-end encryption for data transmission</li>
                <li>Secure database storage with access controls</li>
                <li>Regular security audits and updates</li>
                <li>Limited access to personal data on a need-to-know basis</li>
                <li>Data backup and recovery procedures</li>
              </ul>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Contact Us
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                If you have any questions about this Privacy Policy or wish to exercise your rights,
                please contact us:
              </p>
              <div className="space-y-2">
                <p className="text-sm">
                  <strong>Email:</strong> privacy@aiglosspro.com
                </p>
                <p className="text-sm">
                  <strong>Response Time:</strong> We will respond to your request within 30 days (or
                  sooner as required by law)
                </p>
                <p className="text-sm">
                  <strong>Data Protection Officer:</strong> Available upon request for GDPR-related
                  inquiries
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Updates */}
          <Card>
            <CardHeader>
              <CardTitle>Policy Updates</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300">
                We may update this Privacy Policy from time to time. We will notify you of any
                changes by posting the new Privacy Policy on this page and updating the "Last
                updated" date. We encourage you to review this Privacy Policy periodically for any
                changes.
              </p>
              <Separator className="my-4" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This policy is effective as of {lastUpdated} and will remain in effect except with
                respect to any changes in its provisions in the future, which will be in effect
                immediately after being posted on this page.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
