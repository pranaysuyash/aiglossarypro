# CDN Setup Guide for AI Glossary Pro

This guide provides detailed instructions for setting up a Content Delivery Network (CDN) to improve performance and reduce server load for AI Glossary Pro.

## Why Use a CDN?

- **Faster Load Times**: Serve static assets from edge locations closer to users
- **Reduced Server Load**: Offload static file serving to CDN
- **Better Scalability**: Handle traffic spikes without impacting server
- **Improved SEO**: Faster page loads improve search rankings
- **DDoS Protection**: Built-in protection from many CDN providers

## Cloudflare Setup (Recommended)

### Step 1: Create Cloudflare Account

1. Go to [Cloudflare](https://dash.cloudflare.com/sign-up)
2. Sign up for a free account
3. Add your domain when prompted

### Step 2: Update Nameservers

1. Cloudflare will scan your existing DNS records
2. Review and confirm the DNS records are correct
3. Update your domain's nameservers at your registrar:
   - Replace existing nameservers with Cloudflare's (e.g., `john.ns.cloudflare.com`)
   - Wait for propagation (usually 5-30 minutes)

### Step 3: Configure SSL/TLS

1. Go to SSL/TLS in Cloudflare dashboard
2. Set encryption mode to "Full (strict)"
3. Enable "Always Use HTTPS"
4. Enable "Automatic HTTPS Rewrites"

### Step 4: Create Page Rules

Go to Rules > Page Rules and create these rules:

#### Rule 1: Bypass Cache for API
- URL: `*yourdomain.com/api/*`
- Settings:
  - Cache Level: Bypass
  - Disable Performance

#### Rule 2: Cache Static Assets
- URL: `*yourdomain.com/assets/*`
- Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 month
  - Browser Cache TTL: 1 week

#### Rule 3: Cache JavaScript Files
- URL: `*yourdomain.com/*.js`
- Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 week
  - Browser Cache TTL: 4 hours

#### Rule 4: Cache CSS Files
- URL: `*yourdomain.com/*.css`
- Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 week
  - Browser Cache TTL: 4 hours

### Step 5: Configure Caching

1. Go to Caching > Configuration
2. Set Caching Level to "Standard"
3. Set Browser Cache TTL to "4 hours"
4. Enable "Always Online" (serves cached pages if origin is down)

### Step 6: Enable Performance Features

1. Go to Speed > Optimization
2. Enable:
   - Auto Minify (JavaScript, CSS, HTML)
   - Brotli compression
   - Early Hints
   - Rocket Loader (test first, may conflict with some JS)

### Step 7: Configure Security

1. Go to Security > Settings
2. Set Security Level to "Medium"
3. Enable "Bot Fight Mode"
4. Configure Challenge Passage to 30 minutes

### Step 8: Set Up Firewall Rules

Create custom firewall rules for additional protection:

#### Block Bad Bots
```
(cf.client.bot) and not (cf.verified_bot)
```
Action: Block

#### Rate Limit API
```
(http.request.uri.path contains "/api/") and (rate_limit)
```
Action: Challenge (configure rate limit separately)

### Step 9: Configure Workers (Optional)

For advanced caching and edge computing:

```javascript
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  // Custom cache keys for different routes
  const cacheKey = new Request(url.toString(), request)
  const cache = caches.default
  
  // Check cache first
  let response = await cache.match(cacheKey)
  
  if (!response) {
    // Cache miss, fetch from origin
    response = await fetch(request)
    
    // Cache successful responses
    if (response.status === 200) {
      const headers = new Headers(response.headers)
      
      // Set custom cache headers based on path
      if (url.pathname.startsWith('/assets/')) {
        headers.set('Cache-Control', 'public, max-age=31536000, immutable')
      } else if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
        headers.set('Cache-Control', 'public, max-age=604800')
      }
      
      response = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: headers
      })
      
      // Store in cache
      event.waitUntil(cache.put(cacheKey, response.clone()))
    }
  }
  
  return response
}
```

### Step 10: Monitor Performance

1. Go to Analytics & Logs
2. Monitor:
   - Cache hit ratio (aim for >80%)
   - Bandwidth saved
   - Requests served from edge
   - Origin response time

## AWS CloudFront Setup

### Step 1: Create Distribution

1. Go to AWS CloudFront Console
2. Click "Create Distribution"
3. Choose "Web" distribution

### Step 2: Configure Origin

- Origin Domain Name: Your server domain (e.g., `api.yourdomain.com`)
- Origin Protocol Policy: HTTPS Only
- Origin SSL Protocols: TLSv1.2, TLSv1.3
- Origin Custom Headers:
  - `X-CloudFront-Secret`: [generate a secret to verify requests]

### Step 3: Configure Behaviors

#### Default Behavior
- Viewer Protocol Policy: Redirect HTTP to HTTPS
- Allowed HTTP Methods: GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE
- Cache Based on Selected Request Headers: All
- Object Caching: Use Origin Cache Headers
- Compress Objects Automatically: Yes

#### API Behavior (/api/*)
- Path Pattern: `/api/*`
- Cache Policy: CachingDisabled
- Origin Request Policy: AllViewer

#### Assets Behavior (/assets/*)
- Path Pattern: `/assets/*`
- Cache Policy: CachingOptimized
- TTL Settings:
  - Minimum TTL: 0
  - Maximum TTL: 31536000
  - Default TTL: 86400

### Step 4: Configure Distribution Settings

- Price Class: Use appropriate for your audience
- Alternate Domain Names: `yourdomain.com`, `www.yourdomain.com`
- SSL Certificate: Request or import ACM certificate
- Security Policy: TLSv1.2_2021
- HTTP/2: Enabled
- IPv6: Enabled

### Step 5: Configure Origins

Add custom headers to verify requests from CloudFront:

```javascript
// In your Express server
app.use((req, res, next) => {
  const cloudFrontSecret = req.headers['x-cloudfront-secret'];
  if (process.env.NODE_ENV === 'production' && cloudFrontSecret !== process.env.CLOUDFRONT_SECRET) {
    return res.status(403).send('Forbidden');
  }
  next();
});
```

### Step 6: Invalidation Strategy

Create Lambda function for smart invalidation:

```javascript
const AWS = require('aws-sdk');
const cloudfront = new AWS.CloudFront();

exports.handler = async (event) => {
  const paths = event.paths || ['/*'];
  
  const params = {
    DistributionId: process.env.DISTRIBUTION_ID,
    InvalidationBatch: {
      CallerReference: Date.now().toString(),
      Paths: {
        Quantity: paths.length,
        Items: paths
      }
    }
  };
  
  try {
    const result = await cloudfront.createInvalidation(params).promise();
    return {
      statusCode: 200,
      body: JSON.stringify(result)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
```

## Application Configuration

### Update Cache Headers

In `server/middleware/cdnCache.ts`:

```typescript
export function cdnCacheMiddleware(req: Request, res: Response, next: NextFunction) {
  // Skip caching for API routes
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return next();
  }

  // Aggressive caching for static assets
  if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    const isAsset = req.path.startsWith('/assets/');
    const isVendor = req.path.includes('/vendor/');
    
    if (isAsset || isVendor) {
      // Immutable assets with hash in filename
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else {
      // Other static files
      res.setHeader('Cache-Control', 'public, max-age=604800'); // 1 week
    }
  }

  // HTML files - short cache
  if (req.path.endsWith('.html') || req.path === '/') {
    res.setHeader('Cache-Control', 'public, max-age=300, must-revalidate'); // 5 minutes
  }

  next();
}
```

### Configure Build Output

Update `vite.config.ts` for better CDN caching:

```typescript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        // Use content hash in filenames
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: (chunkInfo) => {
          if (chunkInfo.facadeModuleId?.includes('node_modules')) {
            return 'vendor/[name]-[hash].js';
          }
          return 'chunks/[name]-[hash].js';
        },
        assetFileNames: (assetInfo) => {
          const ext = assetInfo.name?.split('.').pop();
          if (ext === 'css') {
            return 'assets/styles/[name]-[hash].css';
          }
          if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'ico'].includes(ext || '')) {
            return 'assets/images/[name]-[hash].[ext]';
          }
          if (['woff', 'woff2', 'ttf', 'eot'].includes(ext || '')) {
            return 'assets/fonts/[name]-[hash].[ext]';
          }
          return 'assets/[name]-[hash].[ext]';
        },
      },
    },
  },
});
```

## Monitoring and Optimization

### Key Metrics to Track

1. **Cache Hit Ratio**: Should be >80% for static assets
2. **Origin Response Time**: Monitor for performance issues
3. **Bandwidth Saved**: Calculate cost savings
4. **Error Rate**: Track 4xx and 5xx errors

### Cache Purging Strategy

```bash
#!/bin/bash
# purge-cdn.sh

if [ "$1" == "all" ]; then
  # Purge everything
  curl -X POST "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/purge_cache" \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    -H "Content-Type: application/json" \
    --data '{"purge_everything":true}'
else
  # Purge specific files
  curl -X POST "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/purge_cache" \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    -H "Content-Type: application/json" \
    --data "{\"files\":[\"$1\"]}"
fi
```

### Deployment Integration

Add CDN purging to your deployment process:

```javascript
// deploy.js
const axios = require('axios');

async function purgeCloudflareCache() {
  try {
    const response = await axios.post(
      `https://api.cloudflare.com/client/v4/zones/${process.env.CLOUDFLARE_ZONE_ID}/purge_cache`,
      {
        purge_everything: false,
        files: [
          'https://yourdomain.com/index.html',
          'https://yourdomain.com/assets/*',
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    console.log('✅ CDN cache purged successfully');
  } catch (error) {
    console.error('❌ Failed to purge CDN cache:', error.message);
  }
}

// Call after deployment
purgeCloudflareCache();
```

## Best Practices

1. **Use Versioned URLs**: Include hash in filenames for cache busting
2. **Set Appropriate TTLs**: Longer for assets, shorter for HTML
3. **Monitor Cache Performance**: Track hit ratios and adjust rules
4. **Test Thoroughly**: Verify caching doesn't break functionality
5. **Use Vary Headers**: For content that changes based on headers
6. **Implement Stale-While-Revalidate**: Serve stale content while fetching fresh
7. **Configure Error Pages**: Serve cached error pages when origin is down
8. **Use Cache Tags**: For granular cache invalidation

## Troubleshooting

### Content Not Updating
- Check cache headers in browser DevTools
- Verify CDN cache has been purged
- Check if browser is caching locally

### API Requests Being Cached
- Verify page rules exclude `/api/*`
- Check cache headers on API responses
- Add `Cache-Control: no-cache` to API routes

### SSL/TLS Issues
- Ensure SSL mode is "Full (strict)"
- Verify origin certificate is valid
- Check for mixed content warnings

### Performance Issues
- Review cache hit ratio
- Check origin response times
- Optimize images and assets
- Enable compression