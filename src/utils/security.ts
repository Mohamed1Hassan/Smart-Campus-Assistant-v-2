export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

export interface FraudScoreData {
  location?: { latitude: number; longitude: number };
  sessionLocation?: { latitude: number; longitude: number; radius: number };
  deviceFingerprint?: string;
  registeredFingerprints: string[];
  sessionStartTime: Date;
  sessionEndTime: Date;
  currentTime?: Date;
}

export const calculateFraudScore = (data: FraudScoreData): number => {
  let score = 0;
  const now = data.currentTime || new Date();

  // 1. Location fraud detection (Highest weight: 50)
  if (data.location && data.sessionLocation) {
    const distance = calculateDistance(
      data.location.latitude,
      data.location.longitude,
      data.sessionLocation.latitude,
      data.sessionLocation.longitude,
    );

    if (distance > data.sessionLocation.radius) {
      score += 50;
    }
  }

  // 2. Device fraud detection (Weight: 30)
  if (data.deviceFingerprint) {
    if (!data.registeredFingerprints.includes(data.deviceFingerprint)) {
      score += 30;
    }
  }

  // 3. Time fraud detection (Weight: 40)
  const sessionStart = new Date(data.sessionStartTime);
  const sessionEnd = new Date(data.sessionEndTime);

  if (now < sessionStart || now > sessionEnd) {
    score += 40;
  }

  return Math.min(100, score);
};
