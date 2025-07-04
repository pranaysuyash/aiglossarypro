import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Gift, Users, Zap, Shield } from "lucide-react";

interface FreeForeverMessagingProps {
  className?: string;
  variant?: 'full' | 'compact' | 'inline';
}

export function FreeForeverMessaging({ className = "", variant = 'full' }: FreeForeverMessagingProps) {
  
  const freeFeatures = [
    {
      icon: <Users className="w-4 h-4 text-green-500" />,
      title: "Full Access",
      description: "Browse all 10,000+ AI/ML terms with definitions"
    },
    {
      icon: <Zap className="w-4 h-4 text-blue-500" />,
      title: "Advanced Search",
      description: "Find exactly what you need with powerful filters"
    },
    {
      icon: <Gift className="w-4 h-4 text-purple-500" />,
      title: "Code Examples",
      description: "Get practical implementation examples"
    },
    {
      icon: <Shield className="w-4 h-4 text-indigo-500" />,
      title: "No Limits",
      description: "Use as much as you want, forever"
    }
  ];

  const premiumPreview = [
    "Interactive quizzes and exercises",
    "Advanced AI-powered explanations",
    "Personalized learning paths",
    "Priority support and updates",
    "Export and offline access",
    "Advanced progress tracking"
  ];

  if (variant === 'inline') {
    return (
      <div className={`bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Free Forever
          </Badge>
          <span className="text-sm text-gray-600">No credit card required</span>
        </div>
        <div className="text-sm text-gray-700">
          <strong>Start free</strong> with full access to all 10,000+ terms. 
          Upgrade anytime for premium features like personalized learning paths and advanced AI explanations.
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <Card className={`border-green-200 bg-green-50 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Gift className="w-5 h-5 text-green-600" />
            <div>
              <div className="font-semibold text-green-900">Free Forever Model</div>
              <div className="text-sm text-green-700">No credit card required</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-1">
              <Check className="w-3 h-3 text-green-600" />
              <span>All 10,000+ terms</span>
            </div>
            <div className="flex items-center gap-1">
              <Check className="w-3 h-3 text-green-600" />
              <span>Code examples</span>
            </div>
            <div className="flex items-center gap-1">
              <Check className="w-3 h-3 text-green-600" />
              <span>Advanced search</span>
            </div>
            <div className="flex items-center gap-1">
              <Check className="w-3 h-3 text-green-600" />
              <span>Forever access</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-2 border-green-200 shadow-lg ${className}`}>
      <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl text-green-900 flex items-center gap-2">
              <Gift className="w-5 h-5 text-green-600" />
              Free Forever Model
            </CardTitle>
            <div className="text-sm text-green-700 mt-1">
              No credit card required • Start immediately
            </div>
          </div>
          <Badge variant="secondary" className="bg-green-600 text-white">
            Always Free
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">
            What's Free Forever:
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {freeFeatures.map((feature, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 mt-0.5">
                  {feature.icon}
                </div>
                <div>
                  <div className="font-medium text-gray-900 text-sm">
                    {feature.title}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {feature.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-purple-600" />
            Premium Preview Available:
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {premiumPreview.map((feature, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                <div className="w-1.5 h-1.5 bg-purple-600 rounded-full flex-shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="text-sm text-purple-900">
              <strong>Early Bird Special:</strong> Get lifetime access to all premium features 
              for just $179 (originally $249). Limited to first 500 customers.
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-medium text-blue-900 text-sm mb-1">
                Why This Model Works
              </div>
              <div className="text-xs text-blue-700 space-y-1">
                <p>• You get real value immediately with no barriers</p>
                <p>• Only pay if you want advanced features</p>
                <p>• No recurring subscriptions or hidden fees</p>
                <p>• Fair pricing with lifetime access</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}