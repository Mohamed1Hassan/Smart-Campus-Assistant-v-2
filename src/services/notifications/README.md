# Notification System

A comprehensive notification system for the Smart Campus Assistant, providing multi-channel notifications with advanced features like templates, scheduling, retry mechanisms, and delivery tracking.

## Overview

The notification system provides a unified interface for sending notifications across multiple channels (email, push, SMS, in-app) with support for templates, multi-language content, scheduling, and comprehensive delivery tracking.

## Services

### 1. Attendance Notifications Service (`attendance-notifications.service.ts`)

**Purpose**: Real-time attendance notifications, fraud alerts, and security warnings.

**Key Features**:

- Real-time attendance status notifications
- Fraud alert notifications with severity levels
- Location verification alerts
- Session status updates
- Emergency notifications
- Security warning notifications
- Priority-based delivery
- Retry mechanisms with exponential backoff

**Usage**:

```typescript
import { AttendanceNotificationsService } from "./attendance-notifications.service";

const attendanceService = new AttendanceNotificationsService(
  retryConfig,
  rateLimit,
);

// Send attendance notification
const delivery = await attendanceService.sendAttendanceNotification(
  user,
  attendanceData,
  channels,
);

// Send fraud alert
const fraudDelivery = await attendanceService.sendFraudAlertNotification(
  user,
  fraudData,
  channels,
);
```

### 2. Email Notifications Service (`email-notifications.service.ts`)

**Purpose**: Email delivery with templates, attachments, and advanced features.

**Key Features**:

- SMTP email delivery
- HTML email templates
- Email attachments support
- Template-based email generation
- Email validation
- Delivery tracking
- Bounce handling
- Rate limiting

**Usage**:

```typescript
import { EmailNotificationsService } from "./email-notifications.service";

const emailService = new EmailNotificationsService(
  retryConfig,
  rateLimit,
  smtpConfig,
);

// Send simple email
const delivery = await emailService.sendEmail(
  "user@example.com",
  "Subject",
  "Content",
  { from: "noreply@smartcampus.edu" },
);

// Send template email
const templateDelivery = await emailService.sendTemplateEmail(
  "user@example.com",
  "attendance-confirmation",
  { firstName: "John", lastName: "Doe" },
);
```

### 3. Push Notifications Service (`push-notifications.service.ts`)

**Purpose**: Mobile and web push notifications with scheduling and priority-based delivery.

**Key Features**:

- Web push notifications
- Mobile push notifications
- Push subscription management
- Notification actions
- Priority-based delivery
- VAPID authentication
- Delivery tracking
- Silent notifications

**Usage**:

```typescript
import { PushNotificationsService } from "./push-notifications.service";

const pushService = new PushNotificationsService(
  retryConfig,
  rateLimit,
  pushConfig,
);

// Subscribe user
await pushService.subscribeUser(userId, subscription);

// Send push notification
const delivery = await pushService.sendPushNotification(
  "user@example.com",
  "Title",
  "Body",
  { data: "value" },
);
```

### 4. Notification Templates Service (`notification-templates.service.ts`)

**Purpose**: Template management, multi-language support, and dynamic content generation.

**Key Features**:

- Template creation and management
- Multi-language support
- Dynamic content generation
- Template versioning
- Template validation
- Variable extraction
- Template cloning
- Template search

**Usage**:

```typescript
import { NotificationTemplatesService } from "./notification-templates.service";

const templateService = new NotificationTemplatesService();

// Create template
const template = await templateService.createTemplate({
  id: "welcome-email",
  name: "Welcome Email",
  type: NotificationType.ATTENDANCE,
  category: "welcome",
  language: "en",
  version: "1.0",
  subject: "Welcome {{firstName}}!",
  content: "Hello {{firstName}}, welcome to Smart Campus Assistant!",
  variables: [
    {
      name: "firstName",
      type: "STRING",
      required: true,
      description: "User first name",
    },
  ],
  metadata: {
    created: new Date(),
    updated: new Date(),
    author: "system",
    tags: ["welcome", "email"],
  },
});

// Render template
const rendered = await templateService.renderTemplate("welcome-email", {
  firstName: "John",
});
```

## Configuration

### Default Configuration

```typescript
const defaultNotificationConfig = {
  retry: {
    maxAttempts: 3,
    backoffStrategy: "EXPONENTIAL",
    initialDelay: 1000,
    maxDelay: 30000,
    retryableErrors: ["TIMEOUT", "NETWORK_ERROR", "RATE_LIMIT"],
  },
  rateLimit: {
    enabled: true,
    maxPerMinute: 60,
    maxPerHour: 1000,
    maxPerDay: 10000,
    windowSize: 1,
  },
  smtp: {
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    from: "noreply@smartcampus.edu",
    replyTo: "support@smartcampus.edu",
  },
  push: {
    vapid: {
      subject: "mailto:admin@smartcampus.edu",
      publicKey: process.env.VAPID_PUBLIC_KEY,
      privateKey: process.env.VAPID_PRIVATE_KEY,
    },
    ttl: 86400,
    topic: "smart-campus-assistant",
    icon: "/icons/notification-icon.png",
    badge: "/icons/badge-icon.png",
  },
  analytics: {
    enabled: true,
    retentionDays: 90,
    metricsInterval: 60,
    alertThresholds: {
      deliveryRate: 0.95,
      failureRate: 0.05,
      responseTime: 5000,
    },
  },
};
```

## Service Factory

Use the NotificationServiceFactory for centralized service management:

```typescript
import { NotificationServiceFactory, defaultNotificationConfig } from "./index";

// Initialize factory
const factory = NotificationServiceFactory.getInstance(
  defaultNotificationConfig,
);

// Get services
const attendanceService = factory.getAttendanceNotificationsService();
const emailService = factory.getEmailNotificationsService();
const pushService = factory.getPushNotificationsService();
const templateService = factory.getNotificationTemplatesService();
const manager = factory.getNotificationManager();
```

## Notification Manager

The NotificationManager provides a unified interface for sending notifications across all channels:

```typescript
import { NotificationManager } from "./index";

const manager = factory.getNotificationManager();

// Send comprehensive notification
const deliveries = await manager.sendNotification(
  user,
  NotificationType.ATTENDANCE,
  attendanceData,
  ["EMAIL", "PUSH", "IN_APP"],
);

// Send attendance notification
const attendanceDeliveries = await manager.sendAttendanceNotification(
  user,
  attendanceData,
);

// Send fraud alert
const fraudDeliveries = await manager.sendFraudAlertNotification(
  user,
  fraudData,
);

// Send emergency notification
const emergencyDeliveries = await manager.sendEmergencyNotification(
  users,
  emergencyData,
);
```

## Template System

### Template Syntax

Templates support Handlebars-like syntax:

```html
Dear {{firstName}} {{lastName}}, Your attendance has been recorded for session
{{sessionId}}. {{#if location}} Location: {{location}} {{/if}} {{#each
instructions}} - {{this}} {{/each}} Best regards, Smart Campus Assistant
```

### Template Variables

```typescript
const variables = [
  {
    name: "firstName",
    type: "STRING",
    required: true,
    description: "User first name",
  },
  {
    name: "lastName",
    type: "STRING",
    required: true,
    description: "User last name",
  },
  {
    name: "sessionId",
    type: "STRING",
    required: true,
    description: "Session ID",
  },
  {
    name: "location",
    type: "STRING",
    required: false,
    description: "Attendance location",
  },
  {
    name: "instructions",
    type: "OBJECT",
    required: false,
    description: "Instructions array",
  },
];
```

### Multi-language Support

```typescript
// English template
const enTemplate = await templateService.createTemplate({
  id: "welcome-en",
  name: "Welcome Email",
  language: "en",
  content: "Welcome {{firstName}}!",
});

// Spanish template
const esTemplate = await templateService.createTemplate({
  id: "welcome-es",
  name: "Email de Bienvenida",
  language: "es",
  content: "¡Bienvenido {{firstName}}!",
});
```

## Notification Types

### Attendance Notifications

```typescript
const attendanceData: AttendanceNotificationData = {
  studentId: 123,
  courseId: 456,
  sessionId: "session-789",
  status: "PRESENT",
  timestamp: new Date(),
  location: {
    latitude: 40.7128,
    longitude: -74.006,
    accuracy: 10,
  },
  deviceInfo: {
    fingerprint: "device-fingerprint",
    userAgent: "Mozilla/5.0...",
  },
};
```

### Fraud Alert Notifications

```typescript
const fraudData: FraudAlertNotificationData = {
  alertId: "alert-123",
  studentId: 123,
  type: "LOCATION_SPOOFING",
  severity: "HIGH",
  description: "Suspicious location pattern detected",
  timestamp: new Date(),
  location: {
    latitude: 40.7128,
    longitude: -74.006,
  },
  riskScore: 85,
  actions: ["Review location", "Contact support"],
};
```

### Emergency Notifications

```typescript
const emergencyData: EmergencyNotificationData = {
  type: "SECURITY_BREACH",
  severity: "CRITICAL",
  message: "Security breach detected in the system",
  affectedUsers: [123, 456, 789],
  timestamp: new Date(),
  instructions: [
    "Change your password immediately",
    "Review your account activity",
    "Contact IT support if you notice any suspicious activity",
  ],
  contactInfo: {
    phone: "+1-555-0123",
    email: "emergency@smartcampus.edu",
    emergency: "+1-555-911",
  },
};
```

## Error Handling

All services include comprehensive error handling:

```typescript
try {
  const delivery = await emailService.sendEmail(
    "user@example.com",
    "Subject",
    "Content",
  );
} catch (error) {
  if (error.message.includes("Rate limit exceeded")) {
    // Handle rate limiting
    console.log("Rate limit exceeded, retrying later...");
  } else if (error.message.includes("Invalid email address")) {
    // Handle invalid email
    console.log("Invalid email address provided");
  } else {
    // Handle other errors
    console.error("Email delivery failed:", error);
  }
}
```

## Retry Mechanisms

The system includes sophisticated retry mechanisms:

```typescript
const retryConfig = {
  maxAttempts: 3,
  backoffStrategy: "EXPONENTIAL", // LINEAR, EXPONENTIAL, FIXED
  initialDelay: 1000, // milliseconds
  maxDelay: 30000, // milliseconds
  retryableErrors: ["TIMEOUT", "NETWORK_ERROR", "RATE_LIMIT"],
};
```

## Rate Limiting

Rate limiting is built into all services:

```typescript
const rateLimit = {
  enabled: true,
  maxPerMinute: 60,
  maxPerHour: 1000,
  maxPerDay: 10000,
  windowSize: 1, // minutes
};
```

## Delivery Tracking

All notifications include comprehensive delivery tracking:

```typescript
// Get delivery status
const status = await emailService.getEmailStatus(messageId);

// Get delivery history
const history = await emailService.getDeliveryHistory(messageId);

// Check delivery status
if (status.status === "DELIVERED") {
  console.log("Email delivered successfully");
} else if (status.status === "FAILED") {
  console.log("Email delivery failed:", status.errorMessage);
}
```

## Analytics and Reporting

The system provides comprehensive analytics:

```typescript
// Get template statistics
const stats = await templateService.getTemplateStatistics();

// Search templates
const results = await templateService.searchTemplates("attendance");

// Get template versions
const versions = await templateService.getTemplateVersions(
  "attendance-confirmation",
);
```

## Performance Considerations

- **Caching**: Template rendering results are cached for performance
- **Batch Processing**: Notifications are processed in batches for efficiency
- **Queue Management**: Message queues prevent system overload
- **Rate Limiting**: Built-in rate limiting prevents abuse
- **Retry Logic**: Intelligent retry mechanisms handle temporary failures

## Security Features

- **VAPID Authentication**: Secure push notification authentication
- **Email Validation**: Comprehensive email address validation
- **Rate Limiting**: Protection against spam and abuse
- **Template Validation**: Secure template rendering
- **Error Handling**: Secure error handling without information leakage

## Monitoring and Logging

- **Structured Logging**: JSON-formatted logs for easy parsing
- **Delivery Tracking**: Complete delivery history and status
- **Performance Metrics**: Response time and throughput monitoring
- **Error Tracking**: Comprehensive error logging and analysis

## Testing

Each service includes comprehensive unit tests covering:

- Normal operation scenarios
- Error conditions and edge cases
- Performance benchmarks
- Security vulnerability testing
- Template rendering validation

## Dependencies

- **Node.js**: Runtime environment
- **TypeScript**: Full TypeScript support with strict typing
- **SMTP**: Email delivery (nodemailer recommended)
- **Web Push**: Push notification delivery
- **Template Engine**: Handlebars-like template rendering

## Future Enhancements

- **SMS Integration**: SMS notification support
- **Voice Notifications**: Voice call notifications
- **Advanced Analytics**: Machine learning-based analytics
- **A/B Testing**: Template A/B testing capabilities
- **Real-time Dashboard**: Live notification monitoring dashboard
