// Predefined responses for common student queries
// Predefined responses for common student queries
export const predefinedResponses = [
  // Predefined responses removed to allow AI to handle all interactions naturally.
  // If offline mode is needed, the backend handles it.
];

// Helper functions
export const findBestMatch = (userMessage, responses = predefinedResponses) => {
  const message = userMessage.toLowerCase().trim();

  for (const response of responses) {
    for (const pattern of response.patterns) {
      if (message.includes(pattern.toLowerCase())) {
        return response;
      }
    }
  }

  return null;
};

export const detectLanguage = (text) => {
  const arabicRegex = /[\u0600-\u06FF]/;
  return arabicRegex.test(text) ? "ar" : "en";
};

export const getReply = (response, language = "en") => {
  if (!response) return null;
  return language === "ar" ? response.reply_ar : response.reply_en;
};
