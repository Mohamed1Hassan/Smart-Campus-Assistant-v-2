/**
 * Hook for form validation and state management
 */
/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useCallback, useEffect, useRef } from "react";
import {
  ValidationRule,
  validateField,
  validateForm,
  isFormValid,
  FieldValidation,
} from "../utils/validation.frontend";

export interface UseFormValidationOptions<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  onSubmit?: (values: T) => void | Promise<void>;
  initialValues?: T;
  validationRules?: Record<string, ValidationRule[]>;
  enableAutoSave?: boolean;
  autoSaveKey?: string;
  warnUnsavedChanges?: boolean;
}

export function useFormValidation<T extends Record<string, unknown>>(
  options: UseFormValidationOptions<T> = {},
) {
  const {
    onSubmit,
    initialValues = {} as T,
    validationRules = {},
    enableAutoSave = false,
    autoSaveKey,
    warnUnsavedChanges = false,
  } = options;

  const [values, setValues] = useState<T>(initialValues as T);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);

  // Load auto-saved values
  useEffect(() => {
    if (enableAutoSave && autoSaveKey) {
      try {
        const saved = localStorage.getItem(autoSaveKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          setValues(parsed);
          setHasUnsavedChanges(true);
        }
      } catch (error) {
        console.warn("Failed to load auto-saved form data:", error);
      }
    }
  }, [enableAutoSave, autoSaveKey]);

  // Auto-save to localStorage
  useEffect(() => {
    if (enableAutoSave && autoSaveKey && hasUnsavedChanges) {
      try {
        localStorage.setItem(autoSaveKey, JSON.stringify(values));
      } catch (error) {
        console.warn("Failed to auto-save form data:", error);
      }
    }
  }, [values, enableAutoSave, autoSaveKey, hasUnsavedChanges]);

  // Warn about unsaved changes
  useEffect(() => {
    if (!warnUnsavedChanges || !hasUnsavedChanges) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [warnUnsavedChanges, hasUnsavedChanges]);

  // Validate a single field
  const validateFieldValue = useCallback(
    (fieldName: string, value: unknown): FieldValidation => {
      const rules = validationRules[fieldName] || [];
      const fieldTouched = touched[fieldName] || false;
      return validateField(value, rules, fieldTouched);
    },
    [validationRules, touched],
  );

  // Validate all fields
  const validateAll = useCallback((): Record<string, FieldValidation> => {
    const fields: Record<
      string,
      { value: unknown; rules: ValidationRule[]; touched: boolean }
    > = {};

    for (const [key, rules] of Object.entries(validationRules)) {
      fields[key] = {
        value: values[key],
        rules,
        touched: touched[key] || false,
      };
    }

    return validateForm(fields);
  }, [values, validationRules, touched]);

  // Update field value
  const setValue = useCallback(
    (fieldName: string, value: unknown) => {
      setValues((prev) => ({ ...prev, [fieldName]: value }));
      setHasUnsavedChanges(true);

      // Validate immediately if field is touched
      if (touched[fieldName]) {
        const validation = validateFieldValue(fieldName, value);
        if (validation.error) {
          setErrors((prev) => ({ ...prev, [fieldName]: validation.error! }));
        } else {
          setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors[fieldName];
            return newErrors;
          });
        }
      }
    },
    [touched, validateFieldValue],
  );

  // Mark field as touched
  const setFieldTouched = useCallback(
    (fieldName: string) => {
      if (touched[fieldName]) return;

      setTouched((prev) => ({ ...prev, [fieldName]: true }));

      // Validate when touched
      const validation = validateFieldValue(fieldName, values[fieldName]);
      if (validation.error) {
        setErrors((prev) => ({ ...prev, [fieldName]: validation.error! }));
      }
    },
    [touched, validateFieldValue, values],
  );

  // Handle field change
  const handleChange = useCallback(
    (fieldName: string, value: unknown) => {
      setValue(fieldName, value);
    },
    [setValue],
  );

  // Handle field blur
  const handleBlur = useCallback(
    (fieldName: string) => {
      setFieldTouched(fieldName);
    },
    [setFieldTouched],
  );

  // Clear auto-saved data
  const clearAutoSave = useCallback(() => {
    if (autoSaveKey) {
      localStorage.removeItem(autoSaveKey);
    }
    setHasUnsavedChanges(false);
  }, [autoSaveKey]);

  // Handle form submit
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) {
        e.preventDefault();
      }

      // Mark all fields as touched
      const allTouched: Record<string, boolean> = {};
      Object.keys(validationRules).forEach((key) => {
        allTouched[key] = true;
      });
      setTouched(allTouched);

      // Validate all fields ignoring untouched status for submission
      const fieldsToValidate: Record<
        string,
        { value: unknown; rules: ValidationRule[]; touched: boolean }
      > = {};

      for (const [key, rules] of Object.entries(validationRules)) {
        fieldsToValidate[key] = {
          value: values[key as keyof T],
          rules,
          touched: true,
        };
      }

      const validations = validateForm(fieldsToValidate);
      const validationErrors: Record<string, string> = {};

      for (const [key, validation] of Object.entries(validations)) {
        if (!validation.isValid && validation.error) {
          validationErrors[key] = validation.error;
        }
      }

      setErrors(validationErrors);

      // Check if form is valid
      if (!isFormValid(validations)) {
        // Focus first error field
        const firstErrorField = Object.keys(validationErrors)[0];
        if (firstErrorField && formRef.current) {
          const errorInput = formRef.current.querySelector<HTMLInputElement>(
            `[name="${firstErrorField}"]`,
          );
          if (errorInput) {
            errorInput.focus();
          }
        }
        return;
      }

      // Submit form
      if (onSubmit) {
        setIsSubmitting(true);
        setSubmitError(null);

        try {
          await onSubmit(values);
          clearAutoSave();
        } catch (error: unknown) {
          const message =
            error instanceof Error
              ? error.message
              : "An error occurred while submitting the form";
          setSubmitError(message);
        } finally {
          setIsSubmitting(false);
        }
      }
    },
    [values, validationRules, validateAll, onSubmit, clearAutoSave],
  );

  // Reset form
  const reset = useCallback(() => {
    setValues(initialValues as T);
    setTouched({});
    setErrors({});
    setSubmitError(null);
    setHasUnsavedChanges(false);
    clearAutoSave();
  }, [initialValues, clearAutoSave]);

  // Get field error
  const getFieldError = useCallback(
    (fieldName: string): string | undefined => {
      return errors[fieldName];
    },
    [errors],
  );

  // Check if field is valid
  const isFieldValid = useCallback(
    (fieldName: string): boolean => {
      const validation = validateFieldValue(fieldName, values[fieldName]);
      return validation.isValid;
    },
    [validateFieldValue, values],
  );

  // Check if form is valid
  const isValid = isFormValid(validateAll());

  return {
    values,
    errors,
    touched,
    isSubmitting,
    submitError,
    hasUnsavedChanges,
    isValid,
    formRef,
    setValue,
    handleChange,
    handleBlur,
    setFieldTouched,
    handleSubmit,
    reset,
    getFieldError,
    isFieldValid,
    clearAutoSave,
  };
}
