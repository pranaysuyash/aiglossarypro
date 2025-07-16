// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    lifetimeAccess: boolean;
    isAdmin: boolean;
    subscriptionTier?: string;
    purchaseDate?: string;
  };
}

export interface PurchaseVerificationResponse {
  success: boolean;
  message: string;
  user?: {
    email: string;
    subscriptionTier: string;
    lifetimeAccess: boolean;
    purchaseDate: string;
  };
}

export interface TestPurchaseData {
  orderId: string;
  amount: string;
  environment: string;
}
