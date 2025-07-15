import React from 'react';
import { Shield, Zap, Gift, ArrowRight } from 'lucide-react';
import { Link } from 'wouter';

export const TrustBadge: React.FC = () => {
  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 rounded-full">
      <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
      <span className="text-sm font-medium text-green-800 dark:text-green-300">
        No Risk - Start Free Today
      </span>
    </div>
  );
};

export const FreeTierBanner: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 text-center">
      <div className="max-w-2xl mx-auto">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Try Before You Buy
        </h3>
        <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
          Start with 50 free AI term explanations daily - forever. No credit card required.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span className="font-semibold text-gray-900 dark:text-white">
              50 Terms Daily
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span className="font-semibold text-gray-900 dark:text-white">
              Forever Free
            </span>
          </div>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Get Started Free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};

interface TrustPointProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const TrustPoint: React.FC<TrustPointProps> = ({ icon, title, description }) => {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
        {icon}
      </div>
      <div>
        <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{title}</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
      </div>
    </div>
  );
};

export const TrustSection: React.FC = () => {
  const trustPoints = [
    {
      icon: <Gift className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
      title: "Start Free, Stay Free",
      description: "50 daily AI explanations forever - no hidden fees or trials"
    },
    {
      icon: <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
      title: "No Credit Card Required",
      description: "Begin learning immediately without any payment information"
    },
    {
      icon: <Zap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
      title: "Upgrade When Ready",
      description: "Love it? Unlock unlimited access with a one-time lifetime purchase"
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
        Why AI Glossary Pro?
      </h3>
      <div className="space-y-6">
        {trustPoints.map((point, index) => (
          <TrustPoint key={index} {...point} />
        ))}
      </div>
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Join thousands of learners who started free and upgraded to lifetime access
        </p>
        <Link
          to="/signup"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-105"
        >
          Start Learning Free
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

export const RiskFreeBadge: React.FC = () => {
  return (
    <div className="inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-full border border-green-200 dark:border-green-800">
      <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
      <div className="text-left">
        <div className="text-sm font-bold text-green-800 dark:text-green-300">
          Risk-Free Trial
        </div>
        <div className="text-xs text-green-700 dark:text-green-400">
          50 terms daily - forever free
        </div>
      </div>
    </div>
  );
};