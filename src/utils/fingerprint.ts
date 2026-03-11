/**
 * Generate a semi-stable device fingerprint for the browser
 * This combines browser-specific attributes to create a unique identifier
 */
export async function getDeviceFingerprint(): Promise<string> {
  const components = [
    navigator.userAgent,
    navigator.language,
    new Date().getTimezoneOffset(),
    screen.colorDepth,
    screen.width + "x" + screen.height,
    // navigator.hardwareConcurrency is typed in modern TS
    navigator.hardwareConcurrency || "unknown",
    // deviceMemory isn't standard yet, cast to any safely
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (navigator as any).deviceMemory || "unknown",
  ];

  // Create a simple hash of the components string
  const str = components.join("|");
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return "df-" + Math.abs(hash).toString(16);
}
