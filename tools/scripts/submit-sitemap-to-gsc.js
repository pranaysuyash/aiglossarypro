#!/usr/bin/env npx tsx
/**
 * Google Search Console Sitemap Submission Script
 *
 * This script submits the updated sitemap to Google Search Console
 * for improved SEO indexing of the sample terms pages.
 */
import { google } from 'googleapis';
class GoogleSearchConsoleSubmitter {
    searchconsole;
    config;
    constructor(config) {
        this.config = config;
    }
    /**
     * Initialize Google Search Console API client
     */
    async initialize() {
        try {
            const auth = await this.createAuth();
            this.searchconsole = google.searchconsole({ version: 'v1', auth });
            console.log('✅ Google Search Console API client initialized');
        }
        catch (error) {
            console.error('❌ Failed to initialize GSC API client:', error);
            throw error;
        }
    }
    /**
     * Create authentication for Google APIs
     */
    async createAuth() {
        if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
            // Use service account from environment variable
            const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
            const auth = new google.auth.GoogleAuth({
                credentials,
                scopes: ['https://www.googleapis.com/auth/webmasters'],
            });
            if (this.config.delegatedEmail) {
                return auth.getClient().then(client => {
                    client.subject = this.config.delegatedEmail;
                    return client;
                });
            }
            return auth.getClient();
        }
        else if (this.config.serviceAccountPath) {
            // Use service account file
            const auth = new google.auth.GoogleAuth({
                keyFile: this.config.serviceAccountPath,
                scopes: ['https://www.googleapis.com/auth/webmasters'],
            });
            return auth.getClient();
        }
        else {
            throw new Error('No authentication method provided. Set GOOGLE_SERVICE_ACCOUNT_JSON environment variable or provide serviceAccountPath');
        }
    }
    /**
     * Submit sitemap to Google Search Console
     */
    async submitSitemap(sitemapUrl) {
        try {
            console.log(`📡 Submitting sitemap: ${sitemapUrl}`);
            const response = await this.searchconsole.sitemaps.submit({
                siteUrl: this.config.siteUrl,
                feedpath: sitemapUrl,
            });
            if (response.status === 200) {
                console.log(`✅ Successfully submitted sitemap: ${sitemapUrl}`);
                return true;
            }
            else {
                console.warn(`⚠️ Unexpected response status ${response.status} for ${sitemapUrl}`);
                return false;
            }
        }
        catch (error) {
            if (error.code === 400 && error.message?.includes('already exists')) {
                console.log(`ℹ️ Sitemap ${sitemapUrl} already exists in GSC`);
                return true;
            }
            else {
                console.error(`❌ Failed to submit sitemap ${sitemapUrl}:`, error.message);
                return false;
            }
        }
    }
    /**
     * Get sitemap status from Google Search Console
     */
    async getSitemapStatus(sitemapUrl) {
        try {
            const response = await this.searchconsole.sitemaps.get({
                siteUrl: this.config.siteUrl,
                feedpath: sitemapUrl,
            });
            return response.data;
        }
        catch (error) {
            if (error.code === 404) {
                return null; // Sitemap not found
            }
            throw error;
        }
    }
    /**
     * List all sitemaps for the site
     */
    async listSitemaps() {
        try {
            const response = await this.searchconsole.sitemaps.list({
                siteUrl: this.config.siteUrl,
            });
            return response.data.sitemap || [];
        }
        catch (error) {
            console.error('❌ Failed to list sitemaps:', error);
            return [];
        }
    }
    /**
     * Submit all configured sitemaps
     */
    async submitAllSitemaps() {
        console.log(`🚀 Starting sitemap submission for ${this.config.siteUrl}`);
        console.log(`📋 Sitemaps to submit: ${this.config.sitemapUrls.length}`);
        let successCount = 0;
        const totalCount = this.config.sitemapUrls.length;
        for (const sitemapUrl of this.config.sitemapUrls) {
            const success = await this.submitSitemap(sitemapUrl);
            if (success) {
                successCount++;
            }
            // Add delay between submissions to be respectful
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        console.log(`\n📊 Submission Results:`);
        console.log(`✅ Successful: ${successCount}/${totalCount}`);
        console.log(`❌ Failed: ${totalCount - successCount}/${totalCount}`);
        if (successCount === totalCount) {
            console.log(`🎉 All sitemaps submitted successfully!`);
        }
        else {
            console.log(`⚠️ Some sitemaps failed to submit. Check the logs above for details.`);
        }
    }
    /**
     * Verify sitemap accessibility
     */
    async verifySitemapAccessibility(sitemapUrl) {
        try {
            const response = await fetch(sitemapUrl);
            if (response.ok) {
                const content = await response.text();
                if (content.includes('<?xml') && content.includes('<urlset')) {
                    console.log(`✅ Sitemap is accessible and valid: ${sitemapUrl}`);
                    return true;
                }
                else {
                    console.error(`❌ Sitemap content is invalid: ${sitemapUrl}`);
                    return false;
                }
            }
            else {
                console.error(`❌ Sitemap is not accessible (${response.status}): ${sitemapUrl}`);
                return false;
            }
        }
        catch (error) {
            console.error(`❌ Failed to verify sitemap accessibility: ${sitemapUrl}`, error);
            return false;
        }
    }
    /**
     * Generate submission report
     */
    async generateReport() {
        console.log(`\n📋 Generating Sitemap Submission Report for ${this.config.siteUrl}`);
        console.log(`=`.repeat(60));
        try {
            const sitemaps = await this.listSitemaps();
            console.log(`\n📊 Current Sitemaps in GSC (${sitemaps.length}):`);
            sitemaps.forEach((sitemap, index) => {
                console.log(`${index + 1}. ${sitemap.feedpath}`);
                console.log(`   Status: ${sitemap.status || 'Unknown'}`);
                console.log(`   Last Downloaded: ${sitemap.lastDownloaded || 'Never'}`);
                console.log(`   URLs Submitted: ${sitemap.contents?.[0]?.submitted || 'Unknown'}`);
                console.log(`   URLs Indexed: ${sitemap.contents?.[0]?.indexed || 'Unknown'}`);
                console.log('');
            });
            // Verify accessibility of our sitemaps
            console.log(`\n🔍 Verifying Sitemap Accessibility:`);
            for (const sitemapUrl of this.config.sitemapUrls) {
                await this.verifySitemapAccessibility(sitemapUrl);
            }
        }
        catch (error) {
            console.error('❌ Failed to generate report:', error);
        }
    }
}
/**
 * Main execution function
 */
async function main() {
    const config = {
        siteUrl: process.env.SITE_URL || 'https://aiglossarypro.com',
        sitemapUrls: [
            `${process.env.SITE_URL || 'https://aiglossarypro.com'}/sitemap.xml`,
            `${process.env.SITE_URL || 'https://aiglossarypro.com'}/sitemap-sample-terms.xml`,
        ],
        serviceAccountPath: process.env.GOOGLE_SERVICE_ACCOUNT_PATH,
        delegatedEmail: process.env.GOOGLE_DELEGATED_EMAIL,
    };
    console.log('🔧 AI Glossary Pro - Google Search Console Sitemap Submission');
    console.log('='.repeat(60));
    console.log(`Site URL: ${config.siteUrl}`);
    console.log(`Sitemaps: ${config.sitemapUrls.length}`);
    console.log('');
    // Check if we have the required credentials
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON && !config.serviceAccountPath) {
        console.log('⚠️ Manual Submission Required');
        console.log('');
        console.log('Google Search Console credentials not configured.');
        console.log('Please submit the following sitemaps manually:');
        console.log('');
        config.sitemapUrls.forEach((url, index) => {
            console.log(`${index + 1}. ${url}`);
        });
        console.log('');
        console.log('📝 Manual Submission Steps:');
        console.log('1. Go to https://search.google.com/search-console');
        console.log('2. Select your property: aiglossarypro.com');
        console.log('3. Navigate to Sitemaps in the left sidebar');
        console.log('4. Add each sitemap URL listed above');
        console.log('5. Click "Submit"');
        console.log('');
        console.log('🎯 Priority: Focus on sitemap-sample-terms.xml for SEO boost');
        return;
    }
    try {
        const submitter = new GoogleSearchConsoleSubmitter(config);
        await submitter.initialize();
        // Generate a pre-submission report
        await submitter.generateReport();
        // Submit all sitemaps
        await submitter.submitAllSitemaps();
        // Generate a post-submission report
        console.log('\n' + '='.repeat(60));
        console.log('📋 Post-Submission Report');
        await submitter.generateReport();
    }
    catch (error) {
        console.error('❌ Sitemap submission failed:', error);
        process.exit(1);
    }
}
// Export for use as a module
export { GoogleSearchConsoleSubmitter };
// Run if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Script execution failed:', error);
        process.exit(1);
    });
}
