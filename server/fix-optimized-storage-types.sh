#!/bin/bash

# Script to fix all 'any' types in optimizedStorage.ts

# Backup the original file
cp server/optimizedStorage.ts server/optimizedStorage.ts.backup

# Apply all the type fixes using sed
cd /Users/pranay/Projects/AIMLGlossary/AIGlossaryPro

# Fix getUserProgress
sed -i '' 's/async getUserProgress(userId: string): Promise<any> {/async getUserProgress(userId: string): Promise<UserProgressStats> {/' server/optimizedStorage.ts

# Fix getTermsByCategory return type
sed -i '' '733s/): Promise<{ data: any\[\]; total: number }> {/): Promise<{ data: ITerm[]; total: number }> {/' server/optimizedStorage.ts

# Fix getUserFavoritesOptimized return type
sed -i '' '549s/): Promise<{ data: any\[\]; total: number; hasMore: boolean }> {/): Promise<OptimizedFavoritesResult> {/' server/optimizedStorage.ts

# Fix getPopularTerms
sed -i '' "s/async getPopularTerms(timeframe: 'day' | 'week' | 'month' = 'week'): Promise<any\[\]> {/async getPopularTerms(timeframe: 'day' | 'week' | 'month' = 'week'): Promise<ITerm[]> {/" server/optimizedStorage.ts

# Fix getTrendingTerms
sed -i '' 's/async getTrendingTerms(limit = 10): Promise<any\[\]> {/async getTrendingTerms(limit = 10): Promise<ITerm[]> {/' server/optimizedStorage.ts

# Fix updateTerm
sed -i '' 's/async updateTerm(termId: string, updates: any): Promise<any> {/async updateTerm(termId: string, updates: Partial<ITerm>): Promise<ITerm> {/' server/optimizedStorage.ts

# Fix getTermsOptimized
sed -i '' 's/async getTermsOptimized(options: { limit?: number } = {}): Promise<any\[\]> {/async getTermsOptimized(options: { limit?: number } = {}): Promise<OptimizedTerm[]> {/' server/optimizedStorage.ts

# Fix bulkCreateTerms
sed -i '' 's/async bulkCreateTerms(termsData: any\[\]): Promise<{ success: number; failed: number }> {/async bulkCreateTerms(termsData: Partial<ITerm>[]): Promise<{ success: number; failed: number }> {/' server/optimizedStorage.ts

# Fix getRecentPurchases
sed -i '' 's/async getRecentPurchases(limit = 10): Promise<any\[\]> {/async getRecentPurchases(limit = 10): Promise<RecentPurchase[]> {/' server/optimizedStorage.ts

# Fix getRevenueByPeriod
sed -i '' 's/async getRevenueByPeriod(period: string): Promise<any> {/async getRevenueByPeriod(period: string): Promise<RevenuePeriodData> {/' server/optimizedStorage.ts

# Fix getTopCountriesByRevenue
sed -i '' 's/async getTopCountriesByRevenue(limit = 10): Promise<any\[\]> {/async getTopCountriesByRevenue(limit = 10): Promise<CountryRevenue[]> {/' server/optimizedStorage.ts

# Fix getConversionFunnel
sed -i '' 's/async getConversionFunnel(): Promise<any> {/async getConversionFunnel(): Promise<ConversionFunnel> {/' server/optimizedStorage.ts

# Fix getRefundAnalytics
sed -i '' 's/async getRefundAnalytics(): Promise<any> {/async getRefundAnalytics(): Promise<RefundAnalytics> {/' server/optimizedStorage.ts

# Fix getPurchasesForExport
sed -i '' 's/async getPurchasesForExport(startDate?: Date, endDate?: Date): Promise<any\[\]> {/async getPurchasesForExport(startDate?: Date, endDate?: Date): Promise<PurchaseExport[]> {/' server/optimizedStorage.ts

# Fix getRecentWebhookActivity
sed -i '' 's/async getRecentWebhookActivity(limit = 20): Promise<any\[\]> {/async getRecentWebhookActivity(limit = 20): Promise<WebhookActivity[]> {/' server/optimizedStorage.ts

# Fix getPurchaseByOrderId
sed -i '' 's/async getPurchaseByOrderId(orderId: string): Promise<any> {/async getPurchaseByOrderId(orderId: string): Promise<PurchaseDetails | null> {/' server/optimizedStorage.ts

# Fix updateUserAccess
sed -i '' 's/async updateUserAccess(orderId: string, updates: any): Promise<void> {/async updateUserAccess(orderId: string, updates: UserAccessUpdate): Promise<void> {/' server/optimizedStorage.ts

# Fix getUserByEmail
sed -i '' 's/async getUserByEmail(email: string): Promise<any> {/async getUserByEmail(email: string): Promise<User | null> {/' server/optimizedStorage.ts

# Fix updateUser
sed -i '' 's/async updateUser(userId: string, updates: any): Promise<any> {/async updateUser(userId: string, updates: Partial<User>): Promise<User> {/' server/optimizedStorage.ts

# Fix createPurchase
sed -i '' 's/async createPurchase(purchaseData: any): Promise<any> {/async createPurchase(purchaseData: PurchaseData): Promise<Purchase> {/' server/optimizedStorage.ts

# Fix getUserSettings
sed -i '' 's/async getUserSettings(userId: string): Promise<any> {/async getUserSettings(userId: string): Promise<UserSettings | null> {/' server/optimizedStorage.ts

# Fix updateUserSettings
sed -i '' 's/async updateUserSettings(userId: string, settings: any): Promise<void> {/async updateUserSettings(userId: string, settings: Partial<UserSettings>): Promise<void> {/' server/optimizedStorage.ts

# Fix exportUserData
sed -i '' 's/async exportUserData(userId: string): Promise<any> {/async exportUserData(userId: string): Promise<UserDataExport> {/' server/optimizedStorage.ts

# Fix getUserStreak
sed -i '' 's/async getUserStreak(userId: string): Promise<any> {/async getUserStreak(userId: string): Promise<LearningStreak> {/' server/optimizedStorage.ts

# Fix getAllUsers
sed -i '' '1716s/}): Promise<{ data: any\[\]; total: number; page: number; limit: number; hasMore: boolean }> {/}): Promise<UserListResult> {/' server/optimizedStorage.ts

# Fix getAdminStats
sed -i '' 's/async getAdminStats(): Promise<any> {/async getAdminStats(): Promise<AdminStats> {/' server/optimizedStorage.ts

# Fix getPendingContent
sed -i '' 's/async getPendingContent(): Promise<any\[\]> {/async getPendingContent(): Promise<PendingContent[]> {/' server/optimizedStorage.ts

# Fix approveContent
sed -i '' 's/async approveContent(id: string): Promise<any> {/async approveContent(id: string): Promise<PendingContent> {/' server/optimizedStorage.ts

# Fix rejectContent
sed -i '' 's/async rejectContent(id: string): Promise<any> {/async rejectContent(id: string): Promise<PendingContent> {/' server/optimizedStorage.ts

# Fix getTermsByIds
sed -i '' 's/async getTermsByIds(ids: string\[\]): Promise<any\[\]> {/async getTermsByIds(ids: string[]): Promise<Term[]> {/' server/optimizedStorage.ts

# Fix submitFeedback
sed -i '' 's/async submitFeedback(_data: any): Promise<any> {/async submitFeedback(_data: FeedbackData): Promise<FeedbackResult> {/' server/optimizedStorage.ts

# Fix storeFeedback
sed -i '' 's/async storeFeedback(data: any): Promise<any> {/async storeFeedback(data: FeedbackData): Promise<FeedbackResult> {/' server/optimizedStorage.ts

echo "Type fixes applied to optimizedStorage.ts"