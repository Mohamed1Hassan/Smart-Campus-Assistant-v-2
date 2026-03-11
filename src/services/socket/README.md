# Enhanced Socket.io Service

## Overview

The Enhanced Socket.io Service provides comprehensive real-time features for the secure attendance system, including attendance tracking, fraud detection, security monitoring, and notification management.

## Features

### 🔄 Real-time Events

#### Attendance Events

- `attendance:marked` - Real-time attendance updates
- `attendance:failed` - Attendance failure notifications
- `attendance:fraud_detected` - Fraud detection alerts
- `attendance:location_warning` - Location verification issues
- `attendance:device_warning` - Device verification issues

#### Security Events

- `security:fraud_alert` - Real-time fraud alerts
- `security:risk_high` - High-risk activity notifications
- `security:device_change` - Device change alerts
- `security:location_spoof` - Location spoofing detection

#### Session Events

- `session:started` - Session start notifications
- `session:ended` - Session end notifications
- `session:updated` - Session update notifications
- `session:emergency_stop` - Emergency session stop

#### Notification Events

- `notification:security` - Security notifications
- `notification:attendance` - Attendance notifications
- `notification:system` - System notifications
- `notification:emergency` - Emergency notifications

### 🏠 Room-based Architecture

#### User Rooms

- `user:{userId}` - User-specific notifications
- `role:{role}` - Role-based broadcasting (PROFESSOR, STUDENT, ADMIN)

#### Session Rooms

- `session:{sessionId}` - Session-specific events
- `course:{courseId}` - Course-wide notifications

### 🔐 Authentication & Authorization

#### JWT Authentication

```typescript
socket.emit("authenticate", { token: "jwt_token" });
```

#### Role-based Access Control

- **PROFESSOR**: Full access to session management and fraud detection
- **STUDENT**: Limited access to attendance and personal notifications
- **ADMIN**: System-wide access and monitoring

### 📊 Real-time Components

#### LiveAttendanceTracking

- Real-time attendance statistics
- Live attendance updates
- Fraud detection alerts
- Connection status monitoring

#### RealTimeFraudAlerts

- Live fraud alert management
- Severity-based filtering
- Alert resolution tracking
- Investigation tools

#### SecurityStatusUpdates

- Comprehensive security metrics
- Real-time security status
- Risk level assessment
- Performance monitoring

#### NotificationManager

- Multi-channel notifications
- Priority-based delivery
- Notification history
- Settings management

#### ConnectionStatusIndicator

- Connection quality monitoring
- Latency tracking
- Auto-reconnection
- Health checks

## Usage

### Server-side Integration

```typescript
import {
  initializeSocketService,
  getSocketService,
} from "./services/socket.service";

// Initialize in your server
const socketService = initializeSocketService(server);

// Emit events
socketService.emitAttendanceMarked({
  sessionId: "session-123",
  studentId: "student-456",
  studentName: "John Doe",
  timestamp: new Date(),
  status: "PRESENT",
  location: { latitude: 40.7128, longitude: -74.006, accuracy: 5 },
  fraudScore: 15,
});

// Broadcast to session
socketService.broadcastToSession("session-123", "attendance:marked", data);

// Send notification
socketService.sendNotification({
  type: "SECURITY",
  priority: "HIGH",
  title: "Fraud Alert",
  message: "Suspicious activity detected",
  sessionId: "session-123",
  timestamp: new Date(),
});
```

### Client-side Integration

```typescript
// Initialize socket connection
const socket = io("ws://localhost:3000");

// Authenticate
socket.emit("authenticate", { token: localStorage.getItem("token") });

// Join session
socket.emit("join_session", { sessionId: "session-123" });

// Listen for events
socket.on("attendance:marked", (data) => {
  console.log("Attendance marked:", data);
});

socket.on("security:fraud_alert", (data) => {
  console.log("Fraud alert:", data);
});

socket.on("notification", (data) => {
  console.log("Notification:", data);
});
```

### React Component Usage

```tsx
import {
  LiveAttendanceTracking,
  RealTimeFraudAlerts,
  SecurityStatusUpdates,
  NotificationManager,
  ConnectionStatusIndicator,
} from "@/components/realtime";

function AttendanceDashboard() {
  return (
    <div className="space-y-6">
      <ConnectionStatusIndicator showDetails={true} />

      <LiveAttendanceTracking sessionId="session-123" isProfessor={true} />

      <RealTimeFraudAlerts
        sessionId="session-123"
        isProfessor={true}
        showResolved={false}
      />

      <SecurityStatusUpdates
        sessionId="session-123"
        isProfessor={true}
        showDetails={true}
      />

      <NotificationManager
        userId="user-123"
        sessionId="session-123"
        showFilters={true}
        showSettings={true}
      />
    </div>
  );
}
```

## Configuration

### Environment Variables

```env
# Socket.io Configuration
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your_jwt_secret

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/attendance

# Notification Settings
NOTIFICATION_SOUND_ENABLED=true
DESKTOP_NOTIFICATIONS_ENABLED=true
EMAIL_NOTIFICATIONS_ENABLED=true
```

### Socket.io Options

```typescript
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
  pingTimeout: 60000,
  pingInterval: 25000,
});
```

## Security Features

### 🔒 Authentication

- JWT token validation
- User role verification
- Session-based access control
- Permission checking

### 🛡️ Fraud Detection

- Real-time fraud scoring
- Location spoofing detection
- Device fingerprinting
- Behavioral analysis

### 📍 Location Security

- GPS coordinate validation
- Geofencing enforcement
- Location accuracy verification
- Distance calculation

### 📱 Device Security

- Device fingerprinting
- Device registration
- Change detection
- Sharing prevention

## Performance Optimization

### 🚀 Connection Management

- Automatic reconnection
- Connection pooling
- Latency monitoring
- Quality assessment

### 📊 Analytics

- Connection statistics
- Performance metrics
- Error tracking
- Usage analytics

### 🔄 Message Queuing

- Priority-based delivery
- Retry mechanisms
- Rate limiting
- Message persistence

## Error Handling

### 🔧 Connection Errors

- Automatic reconnection
- Exponential backoff
- Error logging
- User notifications

### 📱 Client-side Errors

- Graceful degradation
- Fallback mechanisms
- Error boundaries
- User feedback

### 🖥️ Server-side Errors

- Error logging
- Monitoring
- Alerting
- Recovery procedures

## Monitoring & Analytics

### 📈 Metrics

- Connection count
- Message throughput
- Error rates
- Performance metrics

### 🔍 Debugging

- Connection logs
- Event tracking
- Error analysis
- Performance profiling

### 📊 Reporting

- Usage statistics
- Performance reports
- Error summaries
- Security alerts

## Best Practices

### 🏗️ Architecture

- Modular design
- Separation of concerns
- Event-driven architecture
- Scalable patterns

### 🔒 Security

- Input validation
- Authentication
- Authorization
- Data encryption

### 📱 User Experience

- Real-time updates
- Responsive design
- Error handling
- Performance optimization

### 🧪 Testing

- Unit tests
- Integration tests
- E2E tests
- Performance tests

## Troubleshooting

### Common Issues

#### Connection Problems

```typescript
// Check connection status
socket.on("connect", () => {
  console.log("Connected");
});

socket.on("disconnect", (reason) => {
  console.log("Disconnected:", reason);
});
```

#### Authentication Issues

```typescript
// Verify token
socket.emit("authenticate", { token: "your_token" });

socket.on("authenticated", (data) => {
  console.log("Authenticated:", data);
});

socket.on("auth_error", (error) => {
  console.error("Auth error:", error);
});
```

#### Event Handling

```typescript
// Check event listeners
socket.on("attendance:marked", (data) => {
  console.log("Event received:", data);
});

// Verify room membership
socket.emit("join_session", { sessionId: "session-123" });
```

### Debug Mode

```typescript
// Enable debug logging
socket.on("connect", () => {
  console.log("Socket connected");
});

socket.on("disconnect", () => {
  console.log("Socket disconnected");
});

socket.on("error", (error) => {
  console.error("Socket error:", error);
});
```

## API Reference

### SocketService Methods

#### Broadcasting

- `broadcastToSession(sessionId, event, data)`
- `broadcastToCourse(courseId, event, data)`
- `broadcastToUser(userId, event, data)`
- `broadcastToRole(role, event, data)`

#### Event Emission

- `emitAttendanceMarked(data)`
- `emitFraudDetected(data)`
- `emitSessionStarted(data)`
- `emitEmergencyStop(data)`

#### Notifications

- `sendNotification(notification)`
- `storeNotification(notification)`

#### Utilities

- `getConnectionStats()`
- `getSessionConnections(sessionId)`
- `getUserConnections(userId)`
- `isUserConnected(userId)`

### Client Events

#### Authentication

- `authenticate` - Authenticate user
- `authenticated` - Authentication success
- `auth_error` - Authentication error

#### Session Management

- `join_session` - Join session room
- `leave_session` - Leave session room
- `session_joined` - Session joined confirmation
- `session_left` - Session left confirmation

#### Real-time Events

- `attendance:marked` - Attendance marked
- `attendance:failed` - Attendance failed
- `security:fraud_alert` - Fraud alert
- `notification` - General notification

## Contributing

### Development Setup

1. Install dependencies
2. Configure environment variables
3. Start development server
4. Test socket connections

### Code Style

- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting
- Jest for testing

### Testing

- Unit tests for services
- Integration tests for components
- E2E tests for workflows
- Performance tests for scalability

## License

This project is licensed under the MIT License - see the LICENSE file for details.
