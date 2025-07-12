# Customer Service System Documentation

## Overview

The AI Glossary Pro customer service system provides comprehensive support functionality including ticket management, knowledge base, refund workflows, automated responses, and email notifications. The system is designed to handle both authenticated users and guest customers effectively.

## Features

### 🎫 Support Ticket Management
- **Ticket Creation**: Both authenticated and guest users can create support tickets
- **Ticket Types**: General, Technical, Billing, Refund, Feature Request, Bug Report
- **Priority Levels**: Low, Medium, High, Urgent
- **Status Tracking**: Open, In Progress, Waiting for Customer, Resolved, Closed
- **Auto-generated Ticket Numbers**: Format: TICK-YYYY-###
- **Message Threading**: Full conversation history with support agents
- **File Attachments**: Support for document and image uploads

### 🏢 Admin Dashboard
- **Ticket Overview**: Real-time metrics and KPIs
- **Advanced Search**: Filter by status, priority, type, assigned agent, date range
- **Ticket Management**: View details, update status, add messages, assign agents
- **Internal Notes**: Private notes visible only to support team
- **Bulk Actions**: Handle multiple tickets efficiently
- **Agent Performance**: Track response times and resolution metrics

### 👤 Customer Portal
- **Self-Service**: Create and track support tickets
- **Ticket History**: View all previous support interactions
- **Knowledge Base Search**: Find answers before contacting support
- **Real-time Updates**: Get notified of ticket status changes
- **Guest Support**: Non-registered users can still get help

### 📚 Knowledge Base
- **Article Management**: Create, edit, and publish help articles
- **Search Functionality**: Full-text search across all content
- **Article Voting**: Helpful/Not helpful feedback system
- **View Tracking**: Monitor article popularity and effectiveness
- **SEO Optimization**: Meta titles and descriptions for better discoverability
- **Categorization**: Organize articles by topic and difficulty

### 💸 Refund Management
- **Gumroad Integration**: Seamless refund processing through Gumroad API
- **Refund Requests**: Structured refund request workflow
- **Status Tracking**: Pending, Approved, Rejected, Processed, Failed
- **Automated Processing**: Webhook integration for real-time updates
- **Email Notifications**: Keep customers informed throughout the process

### 📧 Email Notifications
- **Automated Responses**: Template-based auto-replies
- **Status Updates**: Notifications when ticket status changes
- **New Messages**: Alerts when support agents reply
- **Rich Templates**: HTML emails with professional styling
- **Variable Substitution**: Dynamic content based on ticket data

### 🤖 Automated Response System
- **Template Engine**: Flexible response templates with variable substitution
- **Trigger Conditions**: Automatic responses based on ticket type and status
- **Usage Tracking**: Monitor template effectiveness
- **Customization**: Easy template creation and modification

## Database Schema

### Support Tickets (`support_tickets`)
```sql
- id: UUID (Primary Key)
- ticket_number: VARCHAR(20) (Unique, Auto-generated)
- user_id: VARCHAR (Foreign Key to users, Optional)
- assigned_to_id: VARCHAR (Foreign Key to users, Optional)
- customer_email: VARCHAR(255) (Required)
- customer_name: VARCHAR(100) (Optional)
- subject: VARCHAR(255) (Required)
- description: TEXT (Required)
- type: VARCHAR(20) (general, technical, billing, refund, feature_request, bug_report)
- priority: VARCHAR(10) (low, medium, high, urgent)
- status: VARCHAR(20) (open, in_progress, waiting_for_customer, resolved, closed)
- purchase_id: UUID (Foreign Key to purchases, Optional)
- gumroad_order_id: VARCHAR (Optional)
- tags: TEXT[] (Searchable tags)
- metadata: JSONB (Additional context data)
- customer_context: JSONB (Browser, OS, etc.)
- first_response_at: TIMESTAMP
- last_response_at: TIMESTAMP
- resolved_at: TIMESTAMP
- closed_at: TIMESTAMP
- due_date: TIMESTAMP
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Ticket Messages (`ticket_messages`)
```sql
- id: UUID (Primary Key)
- ticket_id: UUID (Foreign Key to support_tickets)
- sender_id: VARCHAR (Foreign Key to users, Optional)
- sender_type: VARCHAR(20) (customer, agent, system)
- sender_email: VARCHAR(255)
- sender_name: VARCHAR(100)
- content: TEXT (Required)
- content_type: VARCHAR(20) (text, html, markdown)
- is_internal: BOOLEAN (Default: false)
- is_auto_response: BOOLEAN (Default: false)
- metadata: JSONB
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Knowledge Base Articles (`knowledge_base_articles`)
```sql
- id: UUID (Primary Key)
- slug: VARCHAR(255) (Unique)
- title: VARCHAR(255) (Required)
- content: TEXT (Required)
- excerpt: TEXT
- category_id: UUID (Foreign Key to categories)
- tags: TEXT[]
- is_published: BOOLEAN (Default: false)
- published_at: TIMESTAMP
- author_id: VARCHAR (Foreign Key to users)
- view_count: INTEGER (Default: 0)
- helpful_votes: INTEGER (Default: 0)
- not_helpful_votes: INTEGER (Default: 0)
- meta_title: VARCHAR(255)
- meta_description: TEXT
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Refund Requests (`refund_requests`)
```sql
- id: UUID (Primary Key)
- ticket_id: UUID (Foreign Key to support_tickets)
- purchase_id: UUID (Foreign Key to purchases)
- user_id: VARCHAR (Foreign Key to users)
- gumroad_order_id: VARCHAR (Required)
- gumroad_refund_id: VARCHAR (Set when processed)
- reason: TEXT (Required)
- refund_type: VARCHAR(20) (full, partial)
- requested_amount: INTEGER (in cents)
- refunded_amount: INTEGER (actual refunded amount)
- status: VARCHAR(20) (pending, approved, rejected, processed, failed)
- admin_notes: TEXT
- customer_notification: TEXT
- processed_at: TIMESTAMP
- approved_at: TIMESTAMP
- rejected_at: TIMESTAMP
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

## API Endpoints

### Support Tickets

#### Create Ticket
```http
POST /api/support/tickets
Content-Type: application/json

{
  "customerEmail": "customer@example.com",
  "customerName": "John Doe",
  "subject": "Unable to access premium features",
  "description": "I purchased the lifetime access but can't see premium content.",
  "type": "technical",
  "priority": "medium",
  "initialMessage": "Additional details about the issue..."
}
```

#### Get Ticket by ID
```http
GET /api/support/tickets/{ticketId}
Authorization: Bearer {token}
```

#### Get User's Tickets
```http
GET /api/support/tickets/user/{userId}?page=1&limit=10
Authorization: Bearer {token}
```

#### Update Ticket Status (Admin Only)
```http
PATCH /api/support/tickets/{ticketId}/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "resolved",
  "internalNote": "Issue resolved by updating user permissions"
}
```

#### Add Message to Ticket
```http
POST /api/support/tickets/{ticketId}/messages
Content-Type: application/json

{
  "content": "Thank you for the quick response!",
  "senderType": "customer"
}
```

#### Search Tickets (Admin Only)
```http
GET /api/support/tickets?query=billing&status=open,in_progress&priority=high,urgent&page=1&limit=20
Authorization: Bearer {token}
```

### Knowledge Base

#### Search Articles
```http
GET /api/support/knowledge-base/search?q=getting+started&category=getting-started
```

#### Get Article by Slug
```http
GET /api/support/knowledge-base/{slug}
```

#### Vote on Article
```http
POST /api/support/knowledge-base/{articleId}/vote
Content-Type: application/json

{
  "helpful": true
}
```

#### Create Article (Admin Only)
```http
POST /api/support/knowledge-base
Authorization: Bearer {token}
Content-Type: application/json

{
  "slug": "troubleshooting-login-issues",
  "title": "Troubleshooting Login Issues",
  "content": "# Login Issues...",
  "excerpt": "Common solutions for login problems",
  "tags": ["login", "troubleshooting", "authentication"],
  "isPublished": true
}
```

### Refund Requests

#### Create Refund Request
```http
POST /api/support/refunds
Authorization: Bearer {token}
Content-Type: application/json

{
  "gumroadOrderId": "GR_ORDER_123456",
  "reason": "Product doesn't meet my needs",
  "refundType": "full",
  "requestedAmount": 24900
}
```

#### Update Refund Status (Admin Only)
```http
PATCH /api/support/refunds/{refundId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "approved",
  "adminNotes": "Approved per refund policy",
  "gumroadRefundId": "GR_REFUND_789"
}
```

### Customer Feedback

#### Submit Feedback
```http
POST /api/support/feedback
Content-Type: application/json

{
  "ticketId": "uuid-ticket-id",
  "rating": 5,
  "comment": "Excellent support, very helpful!",
  "feedbackType": "resolution"
}
```

### Metrics (Admin Only)

#### Get Daily Metrics
```http
GET /api/support/metrics/daily?date=2025-01-15
Authorization: Bearer {token}
```

## Gumroad Integration

### Webhook Endpoints

#### Sale Webhook
```http
POST /api/webhooks/gumroad/sale
X-Gumroad-Signature: {signature}
Content-Type: application/json

{
  "sale_id": "GR_SALE_123456",
  "product_id": "ai-glossary-pro",
  "email": "customer@example.com",
  "price": 249,
  "currency": "USD",
  "full_name": "John Doe",
  // ... other Gumroad fields
}
```

#### Refund Webhook
```http
POST /api/webhooks/gumroad/refund
X-Gumroad-Signature: {signature}
Content-Type: application/json

{
  "refund_id": "GR_REFUND_789",
  "sale_id": "GR_SALE_123456",
  "amount_refunded_in_cents": 24900,
  "refund_date": "2025-01-15T10:30:00Z"
}
```

#### Dispute Webhook
```http
POST /api/webhooks/gumroad/dispute
X-Gumroad-Signature: {signature}
Content-Type: application/json

{
  "sale_id": "GR_SALE_123456",
  "dispute_reason": "Product not as described",
  "dispute_won": false
}
```

## Email Templates

### Available Variables
- `{{ticket_number}}` - Ticket number (e.g., TICK-2025-001)
- `{{customer_name}}` - Customer's name
- `{{subject}}` - Ticket subject
- `{{status}}` - Current ticket status
- `{{priority}}` - Ticket priority
- `{{type}}` - Ticket type
- `{{support_url}}` - Link to support center

### Default Templates

#### Ticket Created
```
Subject: Support Ticket Created - #{{ticket_number}}

Hello {{customer_name}},

Thank you for contacting AI Glossary Pro support. We have received your ticket #{{ticket_number}} and will respond within 24 hours.

Ticket Details:
- Subject: {{subject}}
- Priority: {{priority}}
- Type: {{type}}

Our team is committed to providing you with the best possible assistance.

Best regards,
AI Glossary Pro Support Team
```

#### Ticket Resolved
```
Subject: Your support ticket has been resolved - #{{ticket_number}}

Hello {{customer_name}},

Your support ticket #{{ticket_number}} has been marked as resolved. If you need further assistance, please reply to this email and we will reopen your ticket.

Best regards,
AI Glossary Pro Support Team
```

## Frontend Components

### Admin Dashboard (`/client/src/components/admin/SupportDashboard.tsx`)
- Comprehensive ticket management interface
- Real-time metrics and KPIs
- Advanced filtering and search
- Ticket detail modal with message history
- Status update controls
- Internal note functionality

### Customer Support Center (`/client/src/components/support/SupportCenter.tsx`)
- Multi-tab interface (Knowledge Base, My Tickets, Contact)
- Ticket creation form
- Ticket tracking and history
- Knowledge base search
- Responsive design for all devices

## Configuration

### Environment Variables
```bash
# Email Service (AWS SES)
AWS_SES_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
SUPPORT_FROM_EMAIL=support@aiglossary.pro
SUPPORT_FROM_NAME="AI Glossary Pro Support"

# Gumroad Integration
GUMROAD_ACCESS_TOKEN=your_gumroad_token
GUMROAD_WEBHOOK_SECRET=your_webhook_secret

# Client URL for links in emails
CLIENT_URL=https://aiglossary.pro
```

## Installation and Setup

### 1. Database Migration
```bash
# Run the customer service migration
npm run tsx scripts/run-customer-service-migration.ts
```

### 2. Configure Environment Variables
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### 3. Configure Gumroad Webhooks
Set up webhooks in your Gumroad product settings:
- Sale webhook: `https://your-domain.com/api/webhooks/gumroad/sale`
- Refund webhook: `https://your-domain.com/api/webhooks/gumroad/refund`
- Dispute webhook: `https://your-domain.com/api/webhooks/gumroad/dispute`

### 4. Test Email Configuration
```bash
# Test email service
curl -X GET https://your-domain.com/api/support/metrics/daily \
  -H "Authorization: Bearer your_admin_token"
```

## Usage Examples

### Creating a Support Ticket (Guest User)
```javascript
const response = await fetch('/api/support/tickets', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    customerEmail: 'customer@example.com',
    customerName: 'John Doe',
    subject: 'Cannot access premium features',
    description: 'I purchased lifetime access but still see limited content.',
    type: 'technical',
    priority: 'medium',
  }),
});

const ticket = await response.json();
console.log('Ticket created:', ticket.data.ticketNumber);
```

### Searching Knowledge Base
```javascript
const response = await fetch('/api/support/knowledge-base/search?q=billing');
const articles = await response.json();

articles.data.forEach(article => {
  console.log(`${article.title}: ${article.excerpt}`);
});
```

### Admin: Updating Ticket Status
```javascript
const response = await fetch(`/api/support/tickets/${ticketId}/status`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`,
  },
  body: JSON.stringify({
    status: 'resolved',
    internalNote: 'Issue resolved by granting premium access',
  }),
});
```

## Best Practices

### For Administrators
1. **Response Time**: Aim to respond to tickets within 24 hours
2. **Internal Notes**: Use internal notes to document troubleshooting steps
3. **Status Updates**: Keep ticket statuses current for accurate metrics
4. **Knowledge Base**: Regularly update articles based on common questions
5. **Templates**: Customize response templates for your brand voice

### For Developers
1. **Error Handling**: Always handle email sending failures gracefully
2. **Rate Limiting**: Implement rate limiting on public endpoints
3. **Monitoring**: Set up alerts for high ticket volumes or long response times
4. **Backup**: Regular database backups including ticket data
5. **Performance**: Index database columns used in searches and filters

## Troubleshooting

### Common Issues

#### Email Not Sending
1. Check AWS SES credentials in environment variables
2. Verify SES region configuration
3. Ensure sending email is verified in SES
4. Check CloudWatch logs for SES errors

#### Gumroad Webhooks Failing
1. Verify webhook signature validation
2. Check Gumroad webhook URL configuration
3. Test webhook endpoints manually
4. Review server logs for webhook errors

#### Knowledge Base Search Not Working
1. Verify database indexes are created
2. Check search query formatting
3. Ensure articles are published
4. Test database connection

#### Ticket Creation Failures
1. Check required field validation
2. Verify database schema is up to date
3. Test with minimal ticket data
4. Review server error logs

### Performance Optimization
1. **Database Indexing**: Ensure proper indexes on search columns
2. **Caching**: Implement Redis caching for knowledge base articles
3. **File Uploads**: Use S3 for ticket attachments
4. **Email Queue**: Use job queue for email sending
5. **Pagination**: Implement proper pagination for large datasets

## Security Considerations

### Data Protection
- Hash customer IP addresses for privacy
- Encrypt sensitive ticket data
- Implement proper access controls
- Regular security audits

### Authentication
- Verify user permissions for ticket access
- Implement session management
- Use HTTPS for all communications
- Validate all input data

### Webhook Security
- Validate Gumroad webhook signatures
- Use HTTPS endpoints only
- Implement rate limiting
- Log all webhook events

## Monitoring and Analytics

### Key Metrics
- Average response time
- First response SLA compliance
- Resolution time
- Customer satisfaction scores
- Ticket volume trends
- Agent performance

### Alerts
- High ticket volume
- Long response times
- Failed email deliveries
- Webhook failures
- System errors

This comprehensive customer service system provides a complete solution for managing customer support, from initial contact through resolution, with seamless integration into the existing AI Glossary Pro platform.