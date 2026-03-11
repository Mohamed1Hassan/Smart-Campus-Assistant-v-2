import { DeviceFingerprint, DeviceValidationResult } from "./types";

/**
 * Device Fingerprint Service
 * Handles device identification, tracking, and validation
 */
export class DeviceFingerprintService {
  private readonly MAX_DEVICES_PER_USER = 3;
  private readonly FINGERPRINT_SIMILARITY_THRESHOLD = 0.85;
  private readonly DEVICE_CHANGE_THRESHOLD = 0.3;

  /**
   * Generate device fingerprint from browser data
   */
  public generateFingerprint(): DeviceFingerprint {
    const canvas = this.getCanvasFingerprint();
    const webgl = this.getWebGLFingerprint();
    const audio = this.getAudioFingerprint();
    const fonts = this.getFontsList();
    const plugins = this.getPluginsList();

    return {
      id: this.generateFingerprintId(),
      userAgent: navigator.userAgent,
      screen: {
        width: screen.width,
        height: screen.height,
        colorDepth: screen.colorDepth,
      },
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform,
      hardware: {
        cores: navigator.hardwareConcurrency || 0,
        memory:
          (navigator as Navigator & { deviceMemory?: number }).deviceMemory ||
          0,
        devicePixelRatio: window.devicePixelRatio,
      },
      canvas,
      webgl,
      audio,
      fonts,
      plugins,
      battery: this.getBatteryInfo(),
      network: this.getNetworkInfo(),
      timestamp: Date.now(),
    };
  }

  /**
   * Generate unique fingerprint ID
   */
  private generateFingerprintId(): string {
    const components = [
      navigator.userAgent,
      screen.width.toString(),
      screen.height.toString(),
      screen.colorDepth.toString(),
      navigator.language,
      navigator.platform,
      navigator.hardwareConcurrency?.toString() || "0",
      window.devicePixelRatio.toString(),
    ];

    return this.hashString(components.join("|"));
  }

  /**
   * Get canvas fingerprint
   */
  private getCanvasFingerprint(): string {
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return "";

      canvas.width = 200;
      canvas.height = 50;

      ctx.textBaseline = "top";
      ctx.font = "14px Arial";
      ctx.fillStyle = "#f60";
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = "#069";
      ctx.fillText("Device fingerprint", 2, 15);
      ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
      ctx.fillText("Device fingerprint", 4, 17);

      return canvas.toDataURL();
    } catch (error) {
      console.warn("Canvas fingerprint failed:", error);
      return "";
    }
  }

  /**
   * Get WebGL fingerprint
   */
  private getWebGLFingerprint(): string {
    try {
      const canvas = document.createElement("canvas");
      const gl = (canvas.getContext("webgl") ||
        canvas.getContext(
          "experimental-webgl",
        )) as WebGLRenderingContext | null;
      if (!gl) return "";

      const renderer = gl.getParameter(gl.RENDERER);
      const vendor = gl.getParameter(gl.VENDOR);
      const version = gl.getParameter(gl.VERSION);
      const shadingLanguageVersion = gl.getParameter(
        gl.SHADING_LANGUAGE_VERSION,
      );

      return `${renderer}|${vendor}|${version}|${shadingLanguageVersion}`;
    } catch (error) {
      console.warn("WebGL fingerprint failed:", error);
      return "";
    }
  }

  /**
   * Get audio fingerprint
   */
  private getAudioFingerprint(): string {
    try {
      const audioContext = new (
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext
      )();
      const oscillator = audioContext.createOscillator();
      const analyser = audioContext.createAnalyser();
      const gainNode = audioContext.createGain();
      const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);

      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(10000, audioContext.currentTime);

      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      oscillator.connect(analyser);
      analyser.connect(scriptProcessor);
      scriptProcessor.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start(0);

      const audioData = new Float32Array(analyser.frequencyBinCount);
      analyser.getFloatFrequencyData(audioData);

      oscillator.stop();
      audioContext.close();

      return Array.from(audioData).slice(0, 10).join(",");
    } catch (error) {
      console.warn("Audio fingerprint failed:", error);
      return "";
    }
  }

  /**
   * Get installed fonts list
   */
  private getFontsList(): string[] {
    const baseFonts = [
      "Arial",
      "Arial Black",
      "Arial Narrow",
      "Arial Rounded MT Bold",
      "Calibri",
      "Cambria",
      "Candara",
      "Century Gothic",
      "Comic Sans MS",
      "Consolas",
      "Courier New",
      "Georgia",
      "Helvetica",
      "Impact",
      "Lucida Console",
      "Lucida Sans Unicode",
      "Microsoft Sans Serif",
      "Palatino Linotype",
      "Segoe UI",
      "Tahoma",
      "Times New Roman",
      "Trebuchet MS",
      "Verdana",
    ];

    const availableFonts: string[] = [];
    const testString = "abcdefghijklmnopqrstuvwxyz0123456789";
    const testSize = "72px";
    const h = document.getElementsByTagName("body")[0];
    const s = document.createElement("span");
    s.style.fontSize = testSize;
    s.innerHTML = testString;
    const defaultWidth: { [key: string]: number } = {};
    const defaultHeight: { [key: string]: number } = {};

    // Get default dimensions
    for (const font of baseFonts) {
      s.style.fontFamily = font;
      h.appendChild(s);
      defaultWidth[font] = s.offsetWidth;
      defaultHeight[font] = s.offsetHeight;
      h.removeChild(s);
    }

    // Check for available fonts
    for (const font of baseFonts) {
      let detected = false;
      for (const baseFont of baseFonts) {
        s.style.fontFamily = `${font}, ${baseFont}`;
        h.appendChild(s);
        const matched =
          s.offsetWidth !== defaultWidth[baseFont] ||
          s.offsetHeight !== defaultHeight[baseFont];
        h.removeChild(s);
        if (matched) {
          detected = true;
          break;
        }
      }
      if (detected) {
        availableFonts.push(font);
      }
    }

    return availableFonts;
  }

  /**
   * Get browser plugins list
   */
  private getPluginsList(): string[] {
    const plugins: string[] = [];
    for (let i = 0; i < navigator.plugins.length; i++) {
      plugins.push(navigator.plugins[i].name);
    }
    return plugins;
  }

  /**
   * Get battery information
   */
  private getBatteryInfo(): { level: number; charging: boolean } | undefined {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const battery =
        (navigator as Navigator & { battery?: any; webkitBattery?: any })
          .battery ||
        (navigator as Navigator & { battery?: any; webkitBattery?: any })
          .webkitBattery;
      if (battery) {
        return {
          level: battery.level,
          charging: battery.charging,
        };
      }
    } catch (error) {
      console.warn("Battery info not available:", error);
    }
    return undefined;
  }

  /**
   * Get network information
   */
  private getNetworkInfo(): { connection: string; effectiveType: string } {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const connection =
      (navigator as Navigator & { connection?: any; webkitConnection?: any })
        .connection ||
      (navigator as Navigator & { connection?: any; webkitConnection?: any })
        .webkitConnection;
    if (connection) {
      return {
        connection: connection.type || "unknown",
        effectiveType: connection.effectiveType || "unknown",
      };
    }
    return {
      connection: "unknown",
      effectiveType: "unknown",
    };
  }

  /**
   * Calculate fingerprint similarity
   */
  private calculateSimilarity(
    fingerprint1: DeviceFingerprint,
    fingerprint2: DeviceFingerprint,
  ): number {
    let similarity = 0;
    let totalWeight = 0;

    // User agent similarity
    const userAgentWeight = 0.2;
    const userAgentSimilarity = this.stringSimilarity(
      fingerprint1.userAgent,
      fingerprint2.userAgent,
    );
    similarity += userAgentSimilarity * userAgentWeight;
    totalWeight += userAgentWeight;

    // Screen similarity
    const screenWeight = 0.15;
    const screenSimilarity =
      ((fingerprint1.screen.width === fingerprint2.screen.width ? 1 : 0) +
        (fingerprint1.screen.height === fingerprint2.screen.height ? 1 : 0) +
        (fingerprint1.screen.colorDepth === fingerprint2.screen.colorDepth
          ? 1
          : 0)) /
      3;
    similarity += screenSimilarity * screenWeight;
    totalWeight += screenWeight;

    // Hardware similarity
    const hardwareWeight = 0.15;
    const hardwareSimilarity =
      ((fingerprint1.hardware.cores === fingerprint2.hardware.cores ? 1 : 0) +
        (fingerprint1.hardware.memory === fingerprint2.hardware.memory
          ? 1
          : 0) +
        (Math.abs(
          fingerprint1.hardware.devicePixelRatio -
            fingerprint2.hardware.devicePixelRatio,
        ) < 0.1
          ? 1
          : 0)) /
      3;
    similarity += hardwareSimilarity * hardwareWeight;
    totalWeight += hardwareWeight;

    // Canvas similarity
    const canvasWeight = 0.2;
    const canvasSimilarity =
      fingerprint1.canvas === fingerprint2.canvas ? 1 : 0;
    similarity += canvasSimilarity * canvasWeight;
    totalWeight += canvasWeight;

    // WebGL similarity
    const webglWeight = 0.15;
    const webglSimilarity = fingerprint1.webgl === fingerprint2.webgl ? 1 : 0;
    similarity += webglSimilarity * webglWeight;
    totalWeight += webglWeight;

    // Fonts similarity
    const fontsWeight = 0.1;
    const fontsSimilarity = this.arraySimilarity(
      fingerprint1.fonts,
      fingerprint2.fonts,
    );
    similarity += fontsSimilarity * fontsWeight;
    totalWeight += fontsWeight;

    // Plugins similarity
    const pluginsWeight = 0.05;
    const pluginsSimilarity = this.arraySimilarity(
      fingerprint1.plugins,
      fingerprint2.plugins,
    );
    similarity += pluginsSimilarity * pluginsWeight;
    totalWeight += pluginsWeight;

    return totalWeight > 0 ? similarity / totalWeight : 0;
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private stringSimilarity(str1: string, str2: string): number {
    const maxLength = Math.max(str1.length, str2.length);
    if (maxLength === 0) return 1;

    const distance = this.levenshteinDistance(str1, str2);
    return 1 - distance / maxLength;
  }

  /**
   * Calculate array similarity
   */
  private arraySimilarity(arr1: string[], arr2: string[]): number {
    const set1 = new Set(arr1);
    const set2 = new Set(arr2);
    const intersection = new Set([...set1].filter((x) => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Calculate Levenshtein distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1)
      .fill(null)
      .map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator,
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Hash string using simple hash function
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Validate device fingerprint
   */
  public validateDevice(
    currentFingerprint: DeviceFingerprint,
    storedFingerprints: DeviceFingerprint[],
  ): DeviceValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];

    let isNewDevice = true;
    let maxSimilarity = 0;
    let mostSimilarFingerprint: DeviceFingerprint | null = null;

    // Check against stored fingerprints
    for (const stored of storedFingerprints) {
      const similarity = this.calculateSimilarity(currentFingerprint, stored);
      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
        mostSimilarFingerprint = stored;
      }

      if (similarity >= this.FINGERPRINT_SIMILARITY_THRESHOLD) {
        isNewDevice = false;
        break;
      }
    }

    // Check for device changes
    if (!isNewDevice && mostSimilarFingerprint) {
      const changeScore = 1 - maxSimilarity;
      if (changeScore > this.DEVICE_CHANGE_THRESHOLD) {
        warnings.push(
          `Significant device changes detected (${(changeScore * 100).toFixed(1)}% change)`,
        );
      }
    }

    // Check device count limit
    if (isNewDevice && storedFingerprints.length >= this.MAX_DEVICES_PER_USER) {
      errors.push(
        `Maximum device limit reached (${this.MAX_DEVICES_PER_USER} devices)`,
      );
    }

    // Validate fingerprint completeness
    if (!currentFingerprint.canvas) {
      warnings.push("Canvas fingerprint not available");
    }
    if (!currentFingerprint.webgl) {
      warnings.push("WebGL fingerprint not available");
    }
    if (currentFingerprint.fonts.length === 0) {
      warnings.push("Font detection failed");
    }

    // Calculate risk score
    let riskScore = 0;
    if (isNewDevice) riskScore += 0.3;
    if (warnings.length > 2) riskScore += 0.2;
    if (errors.length > 0) riskScore += 0.5;
    if (maxSimilarity < 0.5 && !isNewDevice) riskScore += 0.4;

    const confidence = Math.max(0, 1 - riskScore);

    return {
      isValid: errors.length === 0,
      isNewDevice,
      confidence,
      riskScore,
      warnings,
      errors,
      deviceInfo: currentFingerprint,
    };
  }

  /**
   * Detect device sharing patterns
   */
  public detectDeviceSharing(
    fingerprints: DeviceFingerprint[],
    timeWindow: number = 24 * 60 * 60 * 1000, // 24 hours
  ): { isSharing: boolean; confidence: number; patterns: string[] } {
    const patterns: string[] = [];
    let confidence = 0;

    // Check for rapid device switching
    const sortedFingerprints = fingerprints.sort(
      (a, b) => a.timestamp - b.timestamp,
    );
    let deviceSwitches = 0;

    for (let i = 1; i < sortedFingerprints.length; i++) {
      const prev = sortedFingerprints[i - 1];
      const curr = sortedFingerprints[i];
      const timeDiff = curr.timestamp - prev.timestamp;

      if (timeDiff < timeWindow / 4) {
        // Less than 6 hours
        const similarity = this.calculateSimilarity(prev, curr);
        if (similarity < this.FINGERPRINT_SIMILARITY_THRESHOLD) {
          deviceSwitches++;
        }
      }
    }

    if (deviceSwitches > 2) {
      patterns.push(
        `Rapid device switching detected (${deviceSwitches} switches)`,
      );
      confidence += 0.4;
    }

    // Check for simultaneous usage patterns
    const uniqueFingerprints = new Set(fingerprints.map((f) => f.id));
    if (uniqueFingerprints.size > 2) {
      patterns.push(
        `Multiple unique devices detected (${uniqueFingerprints.size} devices)`,
      );
      confidence += 0.3;
    }

    return {
      isSharing: confidence > 0.5,
      confidence,
      patterns,
    };
  }

  /**
   * Log device validation
   */
  private logDeviceValidation(
    fingerprint: DeviceFingerprint,
    result: DeviceValidationResult,
    context: string,
  ): void {
    const logData = {
      timestamp: new Date().toISOString(),
      context,
      device: {
        id: fingerprint.id,
        userAgent: fingerprint.userAgent,
        screen: fingerprint.screen,
        platform: fingerprint.platform,
      },
      validation: {
        isValid: result.isValid,
        isNewDevice: result.isNewDevice,
        confidence: result.confidence,
        riskScore: result.riskScore,
        warnings: result.warnings,
        errors: result.errors,
      },
    };

    if (result.errors.length > 0) {
      console.error("Device validation failed:", logData);
    } else if (result.warnings.length > 0) {
      console.warn("Device validation warnings:", logData);
    } else {
      console.log("Device validation successful:", logData);
    }
  }
}
