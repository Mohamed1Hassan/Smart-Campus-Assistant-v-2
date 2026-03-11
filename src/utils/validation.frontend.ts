/**
 * Validation utilities for form validation (Frontend Safe)
 */

export type ValidationRule = {
  test: (value: unknown) => boolean;
  message: string;
};

export type FieldValidation = {
  isValid: boolean;
  error?: string;
};

export const validators = {
  required: (message = "This field is required"): ValidationRule => ({
    test: (value: unknown) => {
      if (typeof value === "string") {
        return value.trim().length > 0;
      }
      return value !== null && value !== undefined && value !== "";
    },
    message,
  }),

  minLength: (length: number, message?: string): ValidationRule => ({
    test: (value: unknown) =>
      typeof value === "string" && value.length >= length,
    message: message || `Must be at least ${length} characters`,
  }),

  maxLength: (length: number, message?: string): ValidationRule => ({
    test: (value: unknown) =>
      typeof value === "string" && value.length <= length,
    message: message || `Must be no more than ${length} characters`,
  }),

  exactLength: (length: number, message?: string): ValidationRule => ({
    test: (value: unknown) =>
      typeof value === "string" && value.length === length,
    message: message || `Must be exactly ${length} characters`,
  }),

  email: (message = "Please enter a valid email address"): ValidationRule => ({
    test: (value: unknown) => {
      if (typeof value !== "string") return false;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    },
    message,
  }),

  phone: (message = "Please enter a valid phone number"): ValidationRule => ({
    test: (value: unknown) => {
      if (typeof value !== "string") return false;
      const digitsOnly = value.replace(/\D/g, "");
      return digitsOnly.length >= 10 && digitsOnly.length <= 15;
    },
    message,
  }),

  numeric: (message = "Must be a number"): ValidationRule => ({
    test: (value: unknown) => typeof value === "string" && /^\d+$/.test(value),
    message,
  }),

  pattern: (pattern: RegExp, message: string): ValidationRule => ({
    test: (value: unknown) => typeof value === "string" && pattern.test(value),
    message,
  }),

  universityId: (
    message = "University ID must be between 7 and 10 digits",
  ): ValidationRule => ({
    test: (value: unknown) =>
      typeof value === "string" && /^\d{7,10}$/.test(value),
    message,
  }),

  password: (
    message = "Password must be at least 6 characters",
  ): ValidationRule => ({
    test: (value: unknown) =>
      typeof value === "string" && value.length >= 6 && value.length <= 100,
    message,
  }),

  url: (message = "Please enter a valid URL"): ValidationRule => ({
    test: (value: unknown) => {
      if (typeof value !== "string") return false;
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    message,
  }),

  date: (message = "Please enter a valid date"): ValidationRule => ({
    test: (value: unknown) => {
      if (typeof value !== "string") return false;
      const date = new Date(value);
      return !isNaN(date.getTime());
    },
    message,
  }),

  min: (min: number, message?: string): ValidationRule => ({
    test: (value: unknown) => typeof value === "number" && value >= min,
    message: message || `Must be at least ${min}`,
  }),

  max: (max: number, message?: string): ValidationRule => ({
    test: (value: unknown) => typeof value === "number" && value <= max,
    message: message || `Must be no more than ${max}`,
  }),

  custom: (
    test: (value: unknown) => boolean,
    message: string,
  ): ValidationRule => ({
    test,
    message,
  }),
};

/**
 * Validate a field value against a set of rules
 */
export function validateField(
  value: unknown,
  rules: ValidationRule[],
  touched = true,
): FieldValidation {
  if (!touched) {
    return { isValid: true };
  }

  for (const rule of rules) {
    if (!rule.test(value)) {
      return { isValid: false, error: rule.message };
    }
  }

  return { isValid: true };
}

/**
 * Validate multiple fields at once
 */
export function validateForm(
  fields: Record<
    string,
    { value: unknown; rules: ValidationRule[]; touched?: boolean }
  >,
): Record<string, FieldValidation> {
  const results: Record<string, FieldValidation> = {};

  for (const [key, field] of Object.entries(fields)) {
    results[key] = validateField(
      field.value,
      field.rules,
      field.touched ?? true,
    );
  }

  return results;
}

/**
 * Check if form is valid
 */
export function isFormValid(
  validations: Record<string, FieldValidation>,
): boolean {
  return Object.values(validations).every((v) => v.isValid);
}

/**
 * Input masks for different input types
 */
export const inputMasks = {
  phone: (value: string): string => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
  },

  date: (value: string): string => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
  },

  time: (value: string): string => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
  },

  universityId: (value: string): string => {
    return value.replace(/\D/g, "").slice(0, 10);
  },

  numeric: (value: string): string => {
    return value.replace(/\D/g, "");
  },
};
