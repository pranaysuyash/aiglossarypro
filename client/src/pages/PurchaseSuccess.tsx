import { useEffect } from 'react';
import { useLocation } from 'wouter';
import PremiumUpgradeSuccess from '../components/PremiumUpgradeSuccess';
import { useAuth } from '../hooks/useAuth';

export default function PurchaseSuccess() {
  const { refetch } = useAuth();
  const [, _navigate] = useLocation();

  useEffect(() => {
    // Immediately refetch user data to check for premium status
    refetch();

    // Track successful purchase
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'purchase_success', {
        event_category: 'ecommerce',
        event_label: 'lifetime_access',
        value: 179,
      });
    }
  }, [refetch]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <PremiumUpgradeSuccess autoRedirect={true} />
    </div>
  );
}
