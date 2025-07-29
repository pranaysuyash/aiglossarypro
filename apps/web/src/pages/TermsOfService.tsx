import {
  AlertTriangle,
  BookOpen,
  Clock,
  DollarSign,
  FileText,
  Scale,
  Shield,
  Users,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { BaseComponentProps } from '@/types/common-props';

interface TermsOfServiceProps extends BaseComponentProps {}

export default function TermsOfService({ className }: TermsOfServiceProps = {}) {
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
              <Scale className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Terms of Service
              </h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              These terms govern your use of AI Glossary Pro and outline the rights and
              responsibilities of both parties.
            </p>
            <div className="flex justify-center items-center gap-2 mt-4">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-500">Last updated: {lastUpdated}</span>
            </div>
          </div>

          {/* Important Notice */}
          <Alert className="mb-6 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              <strong>Important:</strong> By using AI Glossary Pro, you agree to these terms. Please
              read them carefully before using our service.
            </AlertDescription>
          </Alert>

          {/* Introduction */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Agreement to Terms
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                These Terms of Service ("Terms") govern your use of AI Glossary Pro ("Service")
                operated by AI Glossary Pro LLC ("we," "us," or "our"). By accessing or using our
                Service, you agree to be bound by these Terms.
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                If you disagree with any part of these terms, then you may not access the Service.
                These Terms apply to all visitors, users, and others who access or use the Service.
              </p>
            </CardContent>
          </Card>

          {/* Service Description */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Service Description
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                AI Glossary Pro is a comprehensive digital resource providing definitions,
                explanations, and educational content related to artificial intelligence and machine
                learning terminology.
              </p>
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold mb-2">What We Provide:</h3>
                  <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                    <li>Comprehensive AI/ML terminology definitions</li>
                    <li>Interactive learning tools and quizzes</li>
                    <li>Code examples and practical implementations</li>
                    <li>Categorized content for easy navigation</li>
                    <li>Search and filtering capabilities</li>
                    <li>Personal progress tracking</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Service Tiers:</h3>
                  <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                    <li>Free tier with limited access to basic content</li>
                    <li>Premium lifetime access with full features</li>
                    <li>No recurring subscription fees</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Responsibilities */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Responsibilities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Badge variant="outline">Account Security</Badge>
                  </h3>
                  <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                    <li>Maintain the confidentiality of your account credentials</li>
                    <li>Notify us immediately of any unauthorized access</li>
                    <li>You are responsible for all activity under your account</li>
                    <li>Use strong, unique passwords</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Badge variant="outline">Acceptable Use</Badge>
                  </h3>
                  <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                    <li>Use the Service for lawful purposes only</li>
                    <li>Do not attempt to reverse engineer or copy our content</li>
                    <li>Do not share your account credentials with others</li>
                    <li>Do not use automated tools to scrape or download content</li>
                    <li>Respect intellectual property rights</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Badge variant="outline">Prohibited Activities</Badge>
                  </h3>
                  <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                    <li>Attempting to gain unauthorized access to our systems</li>
                    <li>Distributing malware or harmful code</li>
                    <li>Harassment or abuse of other users</li>
                    <li>Impersonation of others</li>
                    <li>Violation of applicable laws or regulations</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Terms and Refund Policy */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Payment Terms and Refund Policy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert className="mb-4 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <AlertDescription className="text-red-800 dark:text-red-200">
                  <strong>No Refunds Policy:</strong> All purchases are final. We do not offer
                  refunds for any reason.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Payment Processing</h3>
                  <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                    <li>All payments are processed securely through Stripe</li>
                    <li>We accept major credit cards and digital payment methods</li>
                    <li>Prices are displayed in USD unless otherwise specified</li>
                    <li>Payment must be completed before access is granted</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Lifetime Access</h3>
                  <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                    <li>
                      Premium purchase grants lifetime access to all current and future content
                    </li>
                    <li>No recurring fees or hidden charges</li>
                    <li>Access remains valid as long as the service operates</li>
                    <li>Free tier users have limited access to basic features</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Refund Policy Details</h3>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <p className="text-gray-700 dark:text-gray-300 mb-2">
                      <strong>All sales are final.</strong> We do not provide refunds under any
                      circumstances, including but not limited to:
                    </p>
                    <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                      <li>Change of mind after purchase</li>
                      <li>Dissatisfaction with content</li>
                      <li>Technical issues on user's end</li>
                      <li>Duplicate purchases</li>
                      <li>Unauthorized purchases (contact your payment provider)</li>
                    </ul>
                    <p className="text-gray-700 dark:text-gray-300 mt-2">
                      We encourage you to explore our free tier before purchasing to ensure the
                      service meets your needs.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Intellectual Property */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Intellectual Property and Licensing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Our Content</h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-2">
                    All content provided through AI Glossary Pro, including but not limited to:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
                    <li>Definitions and explanations</li>
                    <li>Code examples and implementations</li>
                    <li>Interactive elements and quizzes</li>
                    <li>Visual designs and user interface</li>
                    <li>Organizational structure and categorization</li>
                  </ul>
                  <p className="text-gray-700 dark:text-gray-300 mt-2">
                    This content is owned by AI Glossary Pro LLC and protected by copyright,
                    trademark, and other intellectual property laws.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">License to Use</h3>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <p className="text-blue-900 dark:text-blue-100 mb-2">
                      <strong>Personal Use License:</strong> We grant you a limited, non-exclusive,
                      non-transferable license to:
                    </p>
                    <ul className="list-disc list-inside text-blue-800 dark:text-blue-200 space-y-1">
                      <li>Access and use the Service for personal, non-commercial purposes</li>
                      <li>View, read, and interact with our content</li>
                      <li>Download content for offline viewing (where available)</li>
                    </ul>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Restrictions</h3>
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                    <p className="text-red-900 dark:text-red-100 mb-2">
                      <strong>You may NOT:</strong>
                    </p>
                    <ul className="list-disc list-inside text-red-800 dark:text-red-200 space-y-1">
                      <li>Redistribute, sell, or sublicense our content</li>
                      <li>Use our content for commercial purposes without written permission</li>
                      <li>Create derivative works based on our content</li>
                      <li>Remove or alter copyright notices</li>
                      <li>Use automated tools to extract or copy content</li>
                      <li>Share your account access with others</li>
                    </ul>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Educational and Fair Use</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Limited use for educational purposes (such as citing definitions in academic
                    work) may be permitted under fair use doctrine, provided proper attribution is
                    given. For commercial or extensive educational use, please contact us for
                    licensing arrangements.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Limitation of Liability */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Limitation of Liability</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Service Availability</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    While we strive to maintain continuous service availability, we do not guarantee
                    uninterrupted access. We reserve the right to modify, suspend, or discontinue
                    the Service at any time without notice.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Content Accuracy</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    We make every effort to ensure content accuracy, but information is provided "as
                    is" without warranties. Users should verify critical information independently.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Liability Limitation</h3>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <p className="text-gray-700 dark:text-gray-300">
                      To the fullest extent permitted by law, AI Glossary Pro LLC shall not be
                      liable for any indirect, incidental, special, or consequential damages arising
                      from your use of the Service, including but not limited to lost profits, data
                      loss, or business interruption.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data and Privacy */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Data and Privacy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Your privacy is important to us. Our collection, use, and protection of your
                personal information is governed by our Privacy Policy, which is incorporated into
                these Terms by reference.
              </p>
              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  • We collect only necessary information to provide our service
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  • We use industry-standard security measures to protect your data
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  • We do not sell your personal information to third parties
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  • You have rights regarding your personal data under applicable laws
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Termination */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Account Termination</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Termination by You</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    You may terminate your account at any time by contacting us. Upon termination,
                    you will lose access to the Service, but your purchase remains final with no
                    refund.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Termination by Us</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    We may terminate or suspend your account immediately if you violate these Terms,
                    without prior notice or liability. This includes but is not limited to
                    unauthorized use, content piracy, or abusive behavior.
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Effect of Termination</h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Upon termination, your right to use the Service ceases immediately. All
                    provisions of these Terms that should survive termination (including payment
                    obligations, warranty disclaimers, and liability limitations) shall survive.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Updates to Terms */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Changes to Terms</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                We reserve the right to modify these Terms at any time. If we make material changes,
                we will notify you by:
              </p>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1 mb-4">
                <li>Posting the updated Terms on our website</li>
                <li>Sending you an email notification (if you have an account)</li>
                <li>Displaying a notice in the application</li>
              </ul>
              <p className="text-gray-700 dark:text-gray-300">
                Your continued use of the Service after any changes constitutes acceptance of the
                new Terms. If you do not agree to the modified Terms, you must stop using the
                Service.
              </p>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                If you have questions about these Terms, please contact us:
              </p>
              <div className="space-y-2">
                <p className="text-sm">
                  <strong>Email:</strong> legal@aiglosspro.com
                </p>
                <p className="text-sm">
                  <strong>Support:</strong> support@aiglosspro.com
                </p>
                <p className="text-sm">
                  <strong>Business Inquiries:</strong> business@aiglosspro.com
                </p>
              </div>
              <Separator className="my-4" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                These Terms are effective as of {lastUpdated} and will remain in effect except with
                respect to any changes in provisions, which will be in effect immediately after
                being posted on this page.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
