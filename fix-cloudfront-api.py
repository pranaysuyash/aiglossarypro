#!/usr/bin/env python3
"""
Fix CloudFront API routing by updating cache and origin request policies
"""
import json
import subprocess
import time

DISTRIBUTION_ID = "ESF8YR50LSGU8"

# Policy IDs
CACHING_DISABLED_POLICY = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad"  # Current (bad)
ALL_VIEWER_POLICY = "216adef6-5c7f-47e4-b989-5492eafa07d3"  # What we need

print(f"Fixing CloudFront distribution {DISTRIBUTION_ID}")
print("=" * 60)

# Get current configuration
result = subprocess.run(
    ["aws", "cloudfront", "get-distribution-config", "--id", DISTRIBUTION_ID],
    capture_output=True,
    text=True,
    check=True
)

config_data = json.loads(result.stdout)
etag = config_data['ETag']
config = config_data['DistributionConfig']

print(f"Current ETag: {etag}")
print(f"Cache behaviors: {config['CacheBehaviors']['Quantity']}")

# Update the /api/* cache behavior
api_behavior = None
for behavior in config['CacheBehaviors']['Items']:
    if behavior['PathPattern'] == '/api/*':
        api_behavior = behavior
        break

if api_behavior:
    print(f"\nCurrent /api/* behavior:")
    print(f"  - Cache Policy ID: {api_behavior.get('CachePolicyId', 'None')}")
    print(f"  - Origin Request Policy ID: {api_behavior.get('OriginRequestPolicyId', 'None')}")
    
    # Update to use AllViewer policy which forwards all query strings
    api_behavior['OriginRequestPolicyId'] = ALL_VIEWER_POLICY
    
    print(f"\nUpdated /api/* behavior:")
    print(f"  - Cache Policy ID: {api_behavior.get('CachePolicyId', 'None')}")
    print(f"  - Origin Request Policy ID: {api_behavior.get('OriginRequestPolicyId', 'None')}")
else:
    print("ERROR: Could not find /api/* cache behavior!")
    exit(1)

# Save the updated configuration
with open('cloudfront-fixed-config.json', 'w') as f:
    json.dump(config, f, indent=2)

print("\nConfiguration saved to cloudfront-fixed-config.json")

# Apply the update
print("\nApplying CloudFront update...")
update_cmd = [
    "aws", "cloudfront", "update-distribution",
    "--id", DISTRIBUTION_ID,
    "--distribution-config", "file://cloudfront-fixed-config.json",
    "--if-match", etag
]

try:
    result = subprocess.run(update_cmd, capture_output=True, text=True, check=True)
    print("✅ CloudFront distribution updated successfully!")
    
    # Parse the response to get the new ETag
    update_response = json.loads(result.stdout)
    new_etag = update_response.get('ETag', 'Unknown')
    status = update_response.get('Distribution', {}).get('Status', 'Unknown')
    
    print(f"\nNew ETag: {new_etag}")
    print(f"Status: {status}")
    print("\nThe distribution is now being deployed. This typically takes 5-10 minutes.")
    print("You can check the status with:")
    print(f"aws cloudfront get-distribution --id {DISTRIBUTION_ID} --query 'Distribution.Status'")
    
except subprocess.CalledProcessError as e:
    print(f"❌ Error updating distribution: {e}")
    print(f"Error output: {e.stderr}")
    exit(1)

print("\n" + "=" * 60)
print("Next steps:")
print("1. Wait for the distribution to finish deploying (Status: Deployed)")
print("2. Test the search endpoint: curl 'https://d1m7nnfj3im4kp.cloudfront.net/api/search?q=Machine'")
print("3. Test other API endpoints to ensure they're working")