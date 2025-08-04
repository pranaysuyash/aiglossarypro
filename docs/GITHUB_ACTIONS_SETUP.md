# GitHub Actions Setup for AIGlossaryPro

This document explains how to set up GitHub Actions for automated deployment of AIGlossaryPro to AWS.

## Prerequisites

1. **AWS Account** with appropriate services:
   - ECS Fargate cluster (`aiglossarypro`)
   - ECR repository (`aiglossarypro-api`)
   - S3 bucket for frontend
   - CloudFront distribution (optional but recommended)

2. **GitHub Repository Secrets** that need to be added:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `FIREBASE_API_KEY`
   - `POSTHOG_API_KEY`

## Setting Up GitHub Secrets

1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add each secret:

### Required Secrets:

```bash
AWS_ACCESS_KEY_ID: <Your AWS Access Key>
AWS_SECRET_ACCESS_KEY: <Your AWS Secret Key>
FIREBASE_API_KEY: <Your Firebase Web API Key>
POSTHOG_API_KEY: <Your PostHog API Key>
```

## AWS IAM Permissions

The AWS user/role used by GitHub Actions needs the following permissions:

### For Backend (ECS) Deployment:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload",
        "ecr:BatchGetImage"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecs:DescribeTaskDefinition",
        "ecs:RegisterTaskDefinition",
        "ecs:UpdateService",
        "ecs:DescribeServices",
        "ecs:DescribeTasks",
        "ecs:ListTasks"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "iam:PassRole"
      ],
      "Resource": "arn:aws:iam::*:role/ecsTaskExecutionRole"
    }
  ]
}
```

### For Frontend (S3/CloudFront) Deployment:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:CreateBucket",
        "s3:GetBucketWebsite",
        "s3:PutBucketWebsite",
        "s3:ListBucket",
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:PutBucketPolicy",
        "s3:GetBucketPolicy"
      ],
      "Resource": [
        "arn:aws:s3:::aiglossarypro-frontend",
        "arn:aws:s3:::aiglossarypro-frontend/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:HeadBucket",
        "s3:ListAllMyBuckets"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudfront:ListDistributions",
        "cloudfront:CreateInvalidation"
      ],
      "Resource": "*"
    }
  ]
}
```

## Workflow Details

The workflow (`.github/workflows/deploy-production.yml`) does the following:

### Backend Deployment:
1. Builds Docker image on GitHub's Ubuntu runner (native x86_64)
2. Pushes to ECR with both commit SHA and `latest` tags
3. Updates ECS task definition with new image
4. Deploys to ECS service and waits for stability

### Frontend Deployment:
1. Builds the React app with production environment variables
2. Uploads to S3 with appropriate cache headers
3. Invalidates CloudFront cache (if distribution exists)

## Triggering Deployments

Deployments are triggered:
- **Automatically**: On every push to the `main` branch
- **Manually**: Via GitHub Actions UI using "workflow_dispatch"

## Monitoring Deployments

1. Go to Actions tab in GitHub
2. Click on the workflow run to see progress
3. Each job shows detailed logs
4. The workflow will fail if deployment has issues

## Troubleshooting

### Common Issues:

1. **AWS Credentials Error**:
   - Ensure secrets are set correctly
   - Check IAM permissions

2. **Docker Build Failures**:
   - Check Dockerfile syntax
   - Ensure all files are committed

3. **ECS Deployment Stuck**:
   - Check ECS task logs in CloudWatch
   - Verify task definition is valid
   - Check security groups and networking

4. **S3 Sync Errors**:
   - Ensure bucket name is unique
   - Check S3 permissions

## Environment Variables

The following are set during build:

### Backend (via AWS Secrets Manager):
- `DATABASE_URL`
- `JWT_SECRET`
- `OPENAI_API_KEY`
- `SESSION_SECRET`
- `FIREBASE_PRIVATE_KEY_BASE64`

### Frontend (via GitHub Secrets):
- `VITE_API_BASE_URL`: https://aiglossarypro.com/api
- `VITE_FIREBASE_PROJECT_ID`: aiglossarypro
- `VITE_FIREBASE_API_KEY`: From GitHub secret
- `VITE_POSTHOG_API_KEY`: From GitHub secret

## Next Steps

1. Add the required secrets to GitHub
2. Ensure AWS infrastructure is set up
3. Test the workflow with a push to main
4. Monitor the first deployment carefully
5. Set up CloudWatch alarms for production monitoring