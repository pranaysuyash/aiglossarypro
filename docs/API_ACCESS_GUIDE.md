# API Documentation Access Guide

## Overview
The AI/ML Glossary Pro now includes comprehensive interactive API documentation powered by Swagger/OpenAPI.

## Access Points

### Primary Documentation
- **URL**: `http://localhost:3001/api/docs`
- **Description**: Full interactive Swagger UI with testing capabilities
- **Features**: 
  - Complete API schema documentation
  - Interactive endpoint testing
  - Authentication support
  - Request/response examples

### Alternative Access
- **Redirect URL**: `http://localhost:3001/docs`
- **Description**: Convenient redirect to main documentation

### Raw Specification
- **JSON Spec**: `http://localhost:3001/api/docs/swagger.json`
- **Description**: Raw OpenAPI 3.0 specification
- **Use Case**: For importing into other tools like Postman

## Production URLs
When deployed to production, replace `localhost:3001` with your production domain:
- `https://yourdomain.com/api/docs`
- `https://yourdomain.com/docs`
- `https://yourdomain.com/api/docs/swagger.json`

## Features

### Interactive Testing
- Test API endpoints directly from the browser
- Authentication token support
- Real-time response viewing
- Parameter validation

### Comprehensive Documentation
- All endpoints documented with descriptions
- Request/response schemas
- Error code documentation
- Authentication requirements
- Rate limiting information

### Custom Styling
- Brand-specific purple theme (#7C3AED)
- Color-coded HTTP methods
- Professional layout
- Mobile-responsive design

## API Categories Documented

### Authentication
- `/api/auth/*` - User authentication endpoints
- Firebase Auth integration
- OAuth provider support

### Terms Management
- `/api/terms/*` - Term CRUD operations
- Search and filtering
- Category management
- Relationships and favorites

### User Management
- `/api/users/*` - User profile operations
- Progress tracking
- Subscription management

### Admin Operations
- `/api/admin/*` - Administrative functions
- Content import/export
- User management
- Analytics and monitoring

### Payment Integration
- `/api/gumroad/*` - Payment webhooks
- Purchase verification
- Subscription management

## Authentication in Swagger UI

1. Click the "Authorize" button in the top-right
2. Enter your Bearer token:
   ```
   Bearer your_jwt_token_here
   ```
3. All subsequent requests will include authentication

## Getting Your API Token

### For Testing
1. Log into the application
2. Open browser developer tools
3. Check localStorage for `authToken`
4. Use this token in Swagger UI

### For Production
Use proper authentication flows:
- OAuth providers (Google, GitHub)
- Firebase Auth tokens
- JWT tokens from login endpoints

## Common Use Cases

### Import API Testing
1. Navigate to `/api/docs`
2. Find the "Admin" section
3. Test file upload endpoints
4. Monitor job progress endpoints

### Search API Testing
1. Test search endpoints with various queries
2. Try different filter combinations
3. Test pagination parameters

### User Management
1. Test user CRUD operations
2. Try progress tracking endpoints
3. Test favorites functionality

## Configuration

The Swagger setup is configured in `/server/swagger/setup.ts` with:
- Custom styling matching brand colors
- Persistent authorization
- Filter capabilities
- Operation expansion settings

## Troubleshooting

### Documentation Not Loading
1. Ensure server is running on port 3001
2. Check console for JavaScript errors
3. Verify `/api/docs` route is accessible

### Authentication Issues
1. Ensure valid Bearer token format
2. Check token hasn't expired
3. Verify admin permissions for admin endpoints

### API Calls Failing
1. Check CORS settings in production
2. Verify request format matches schema
3. Check rate limiting headers

## Development Notes

### Adding New Endpoints
1. Update schema definitions in `/server/swagger/config.ts`
2. Add proper JSDoc comments to route handlers
3. Include authentication requirements
4. Document error responses

### Updating Documentation
1. Modify schemas in swagger configuration
2. Update endpoint descriptions
3. Test changes in development
4. Verify in production after deployment

## Security Considerations

### Production Deployment
- Disable Swagger in production if needed
- Restrict access to admin documentation
- Use HTTPS for all API calls
- Implement proper rate limiting

### API Key Management
- Never expose API keys in documentation
- Use environment variables
- Rotate keys regularly
- Monitor API usage