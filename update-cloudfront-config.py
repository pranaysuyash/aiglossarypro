#!/usr/bin/env python3
"""
Update CloudFront configuration to fix API routing issues
"""
import json
import subprocess
import sys

# Read current configuration
with open('cloudfront-current-config.json', 'r') as f:
    config = json.load(f)

distribution_config = config['DistributionConfig']
etag = config['ETag']

print("Current CloudFront Configuration:")
print(f"- Distribution ID: ESF8YR50LSGU8")
print(f"- ETag: {etag}")
print(f"- Cache Behaviors: {distribution_config['CacheBehaviors']['Quantity']}")

# Find the API cache behavior
api_behavior = None
api_behavior_index = -1
for i, behavior in enumerate(distribution_config['CacheBehaviors']['Items']):
    if behavior['PathPattern'] == '/api/*':
        api_behavior = behavior
        api_behavior_index = i
        break

if api_behavior:
    print(f"\nFound API behavior at index {api_behavior_index}")
    print(f"Current QueryString setting: {api_behavior['ForwardedValues']['QueryString']}")
    
    # Update the API behavior to forward query strings
    api_behavior['ForwardedValues']['QueryString'] = True
    
    # Also ensure headers are forwarded properly
    if 'Headers' not in api_behavior['ForwardedValues']:
        api_behavior['ForwardedValues']['Headers'] = {
            'Quantity': 0,
            'Items': []
        }
    
    # Update allowed methods to include all HTTP methods
    api_behavior['AllowedMethods'] = {
        'Quantity': 7,
        'Items': ['GET', 'HEAD', 'OPTIONS', 'PUT', 'POST', 'PATCH', 'DELETE'],
        'CachedMethods': {
            'Quantity': 2,
            'Items': ['GET', 'HEAD']
        }
    }
    
    print("\nUpdated API behavior:")
    print(f"- QueryString: {api_behavior['ForwardedValues']['QueryString']}")
    print(f"- AllowedMethods: {api_behavior['AllowedMethods']['Items']}")

# Add more specific API path patterns if they don't exist
additional_patterns = [
    '/api/search*',
    '/api/auth/*',
    '/api/user/*',
    '/api/categories/*',
    '/api/terms/*',
    '/api/analytics/*',
    '/api/content/*',
    '/api/sections/*',
    '/api/daily-terms/*',
    '/api/export/*',
    '/api/admin/*',
    '/api/feedback/*',
    '/api/ai/*'
]

# Check which patterns already exist
existing_patterns = [b['PathPattern'] for b in distribution_config['CacheBehaviors']['Items']]
print(f"\nExisting path patterns: {existing_patterns}")

# Add new behaviors for missing patterns
new_behaviors = []
for pattern in additional_patterns:
    if pattern not in existing_patterns:
        new_behavior = {
            'PathPattern': pattern,
            'TargetOriginId': 'ALB-aiglossarypro-api',
            'TrustedSigners': {
                'Enabled': False,
                'Quantity': 0
            },
            'TrustedKeyGroups': {
                'Enabled': False,
                'Quantity': 0
            },
            'ViewerProtocolPolicy': 'redirect-to-https',
            'AllowedMethods': {
                'Quantity': 7,
                'Items': ['GET', 'HEAD', 'OPTIONS', 'PUT', 'POST', 'PATCH', 'DELETE'],
                'CachedMethods': {
                    'Quantity': 2,
                    'Items': ['GET', 'HEAD']
                }
            },
            'SmoothStreaming': False,
            'Compress': True,
            'LambdaFunctionAssociations': {
                'Quantity': 0
            },
            'FunctionAssociations': {
                'Quantity': 0
            },
            'FieldLevelEncryptionId': '',
            'ForwardedValues': {
                'QueryString': True,
                'Cookies': {
                    'Forward': 'all'
                },
                'Headers': {
                    'Quantity': 7,
                    'Items': ['Accept', 'Accept-Language', 'Authorization', 'Content-Type', 'Origin', 'Referer', 'User-Agent']
                },
                'QueryStringCacheKeys': {
                    'Quantity': 0
                }
            },
            'MinTTL': 0,
            'DefaultTTL': 0,
            'MaxTTL': 0
        }
        new_behaviors.append(new_behavior)
        print(f"Adding new behavior for: {pattern}")

# Add new behaviors to the configuration
if new_behaviors:
    distribution_config['CacheBehaviors']['Items'].extend(new_behaviors)
    distribution_config['CacheBehaviors']['Quantity'] = len(distribution_config['CacheBehaviors']['Items'])
    print(f"\nTotal behaviors after update: {distribution_config['CacheBehaviors']['Quantity']}")

# Also update the default cache behavior to ensure it doesn't interfere
default_behavior = distribution_config['DefaultCacheBehavior']
print(f"\nDefault behavior QueryString setting: {default_behavior['ForwardedValues']['QueryString']}")

# Save the updated configuration
updated_config = {
    'DistributionConfig': distribution_config,
    'ETag': etag
}

with open('cloudfront-updated-config.json', 'w') as f:
    json.dump(distribution_config, f, indent=2)

print("\nConfiguration updated and saved to cloudfront-updated-config.json")
print("\nTo apply the changes, run:")
print(f"aws cloudfront update-distribution --id ESF8YR50LSGU8 --distribution-config file://cloudfront-updated-config.json --if-match {etag}")