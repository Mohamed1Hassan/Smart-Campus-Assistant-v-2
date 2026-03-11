# Security Services

A comprehensive security system for the Smart Campus Assistant attendance system, providing advanced fraud detection, device tracking, location validation, and security analytics.

## Overview

The security services provide multi-layered protection against various forms of fraud and security violations in the attendance system. Each service is designed to work independently while integrating seamlessly with the overall security framework.

## Services

### 1. Location Service (`location.service.ts`)

**Purpose**: GPS validation, geofencing, and location spoofing detection.

**Key Features**:

- Haversine formula for accurate distance calculations
- Geofencing with configurable radius
- Location spoofing detection algorithms
- Timezone handling and conversion
- Location accuracy verification

**Usage**:

```typescript
import { LocationService } from "./location.service";

const locationService = new LocationService();
const result = locationService.validateLocation(
  locationData,
  geofenceConfig,
  previousLocations,
);
```

### 2. Device Fingerprint Service (`device-fingerprint.service.ts`)

**Purpose**: Device identification, tracking, and validation.

**Key Features**:

- Comprehensive device fingerprinting
- Browser and hardware fingerprinting
- Device sharing detection
- Canvas and WebGL fingerprinting
- Audio fingerprinting
- Font detection

**Usage**:

```typescript
import { DeviceFingerprintService } from "./device-fingerprint.service";

const deviceService = new DeviceFingerprintService();
const fingerprint = deviceService.generateFingerprint();
const result = deviceService.validateDevice(
  fingerprint,
  storedFingerprints,
  userId,
);
```

### 3. Fraud Detection Service (`fraud-detection.service.ts`)

**Purpose**: Machine learning-based fraud detection with pattern recognition.

**Key Features**:

- Multi-factor fraud scoring
- Behavior pattern analysis
- Risk assessment algorithms
- Real-time fraud alerts
- Historical analysis
- Machine learning-based detection

**Usage**:

```typescript
import { FraudDetectionService } from "./fraud-detection.service";

const fraudService = new FraudDetectionService(config);
const fraudScore = fraudService.calculateFraudScore(
  context,
  locationData,
  deviceData,
);
const alerts = fraudService.generateFraudAlerts(fraudScore, context);
```

### 4. Time Validation Service (`time-validation.service.ts`)

**Purpose**: Time window validation, timezone handling, and time manipulation detection.

**Key Features**:

- Time window validation
- Timezone conversion
- Grace period handling
- Time manipulation detection
- Server-client time synchronization
- Business hours validation

**Usage**:

```typescript
import { TimeValidationService } from "./time-validation.service";

const timeService = new TimeValidationService(config);
const result = timeService.validateTimeWindow(
  clientTime,
  validFrom,
  validTo,
  gracePeriodMinutes,
);
```

### 5. Photo Verification Service (`photo-verification.service.ts`)

**Purpose**: Photo capture, validation, and metadata verification.

**Key Features**:

- Camera integration
- Photo quality assessment
- Face detection (optional)
- Image metadata verification
- Photo manipulation detection
- Compression and optimization

**Usage**:

```typescript
import { PhotoVerificationService } from "./photo-verification.service";

const photoService = new PhotoVerificationService(config);
const photoData = await photoService.capturePhoto(videoElement, canvasElement);
const result = photoService.validatePhoto(photoData);
```

### 6. Security Analytics Service (`security-analytics.service.ts`)

**Purpose**: Security metrics, reporting, and trend analysis.

**Key Features**:

- Real-time security metrics
- Fraud trend analysis
- Performance monitoring
- Security reporting
- Alert management
- Data export capabilities

**Usage**:

```typescript
import { SecurityAnalyticsService } from "./security-analytics.service";

const analyticsService = new SecurityAnalyticsService(config);
const report = analyticsService.generateSecurityReport(startDate, endDate);
const dashboard = analyticsService.getRealTimeDashboard();
```

## Configuration

### Default Security Configuration

```typescript
const defaultSecurityConfig = {
  location: {
    enableGeofencing: true,
    maxAccuracy: 100,
    minAccuracy: 1,
    spoofingDetection: true,
  },
  device: {
    enableFingerprinting: true,
    allowDeviceChanges: true,
    maxDevicesPerUser: 3,
  },
  fraud: {
    locationWeight: 0.3,
    deviceWeight: 0.25,
    timeWeight: 0.2,
    behaviorWeight: 0.15,
    photoWeight: 0.1,
    thresholds: {
      low: 0.3,
      medium: 0.5,
      high: 0.7,
      critical: 0.9,
    },
  },
  time: {
    gracePeriod: 5,
    timezone: "UTC",
    serverTimeOffset: 0,
    maxTimeDrift: 300000,
  },
  photo: {
    minQuality: 0.6,
    maxFileSize: 5 * 1024 * 1024,
    allowedFormats: ["jpeg", "jpg", "png", "webp"],
    requireFaceDetection: false,
    maxDimensions: { width: 4096, height: 4096 },
    minDimensions: { width: 320, height: 240 },
  },
  analytics: {
    enableRealTimeMonitoring: true,
    reportInterval: 60,
    alertThresholds: {
      fraudScore: 0.7,
      attemptRate: 10,
    },
  },
};
```

## Service Factory

Use the SecurityServiceFactory for centralized service management:

```typescript
import { SecurityServiceFactory } from "./index";

const factory = SecurityServiceFactory.getInstance();
const locationService = factory.getLocationService();
const fraudService = factory.getFraudDetectionService(config);
```

## Integration Example

```typescript
import { SecurityServiceFactory, defaultSecurityConfig } from "./index";

class AttendanceSecurityManager {
  private factory: SecurityServiceFactory;
  private config: any;

  constructor() {
    this.factory = SecurityServiceFactory.getInstance();
    this.config = defaultSecurityConfig;
  }

  async validateAttendanceAttempt(context: SecurityContext) {
    // Location validation
    const locationService = this.factory.getLocationService();
    const locationResult = locationService.validateLocation(
      context.location!,
      geofenceConfig,
      previousLocations,
    );

    // Device validation
    const deviceService = this.factory.getDeviceFingerprintService();
    const deviceResult = deviceService.validateDevice(
      context.device!,
      storedFingerprints,
      context.studentId,
    );

    // Time validation
    const timeService = this.factory.getTimeValidationService(this.config.time);
    const timeResult = timeService.validateTimeWindow(
      context.timestamp,
      validFrom,
      validTo,
    );

    // Photo validation (if required)
    let photoResult = null;
    if (context.photo) {
      const photoService = this.factory.getPhotoVerificationService(
        this.config.photo,
      );
      photoResult = photoService.validatePhoto(context.photo);
    }

    // Fraud detection
    const fraudService = this.factory.getFraudDetectionService(
      this.config.fraud,
    );
    const fraudScore = fraudService.calculateFraudScore(
      context,
      context.location,
      context.device,
      context.photo,
    );

    // Generate alerts
    const alerts = fraudService.generateFraudAlerts(fraudScore, context);

    // Record analytics
    const analyticsService = this.factory.getSecurityAnalyticsService(
      this.config.analytics,
    );
    analyticsService.recordSecurityEvent(
      fraudScore.overall > 0.5 ? "FRAUD_DETECTED" : "SUCCESS",
      context,
      fraudScore,
      alerts,
    );

    return {
      isValid:
        locationResult.isValid &&
        deviceResult.isValid &&
        timeResult.isValid &&
        (!photoResult || photoResult.isValid),
      fraudScore,
      alerts,
      results: {
        location: locationResult,
        device: deviceResult,
        time: timeResult,
        photo: photoResult,
      },
    };
  }
}
```

## Security Features

### Fraud Detection

- **Location Spoofing**: Detects impossible location jumps and suspicious GPS patterns
- **Device Sharing**: Identifies multiple devices per user and device switching patterns
- **Time Manipulation**: Detects client-side time tampering and suspicious timing
- **Behavior Analysis**: Learns user patterns and detects anomalies
- **Photo Verification**: Validates photo authenticity and quality

### Security Analytics

- **Real-time Monitoring**: Live security dashboard with key metrics
- **Trend Analysis**: Identifies security trends and patterns
- **Performance Metrics**: Tracks system performance and response times
- **Alert Management**: Centralized alert handling and resolution
- **Reporting**: Comprehensive security reports with recommendations

### Data Protection

- **Privacy Compliance**: GDPR-compliant data handling
- **Secure Storage**: Encrypted storage of sensitive data
- **Audit Trails**: Complete audit logging for compliance
- **Data Retention**: Configurable data retention policies

## Error Handling

All services include comprehensive error handling with:

- Graceful degradation on service failures
- Detailed error logging
- Fallback mechanisms
- User-friendly error messages

## Performance Considerations

- **Caching**: Intelligent caching of frequently accessed data
- **Async Operations**: Non-blocking async operations where possible
- **Memory Management**: Automatic cleanup of old data
- **Optimization**: Optimized algorithms for real-time processing

## Monitoring and Logging

- **Structured Logging**: JSON-formatted logs for easy parsing
- **Performance Metrics**: Detailed performance tracking
- **Security Events**: Comprehensive security event logging
- **Alert Notifications**: Real-time alert notifications

## Testing

Each service includes comprehensive unit tests covering:

- Normal operation scenarios
- Edge cases and error conditions
- Performance benchmarks
- Security vulnerability testing

## Dependencies

- **Browser APIs**: Camera, Geolocation, Canvas, WebGL
- **TypeScript**: Full TypeScript support with strict typing
- **Modern JavaScript**: ES6+ features for optimal performance

## Future Enhancements

- **Machine Learning**: Advanced ML models for fraud detection
- **Biometric Integration**: Face recognition and biometric verification
- **Blockchain**: Immutable audit trails using blockchain technology
- **AI Integration**: AI-powered security recommendations
