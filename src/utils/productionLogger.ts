const logger = {
  // Production mode check
  isDev: process.env.NODE_ENV === "development",

  // Log levels
  info: (...args: unknown[]) => {
    if (logger.isDev) {
      console.log("[INFO]", ...args);
    }
  },

  warn: (...args: unknown[]) => {
    console.warn("[WARN]", ...args);
  },

  error: (...args: unknown[]) => {
    console.error("[ERROR]", ...args);
  },

  debug: (...args: unknown[]) => {
    if (logger.isDev) {
      console.log("[DEBUG]", ...args);
    }
  },

  // Silent in production
  log: (...args: unknown[]) => {
    if (logger.isDev) {
      console.log(...args);
    }
  },
};

export default logger;
