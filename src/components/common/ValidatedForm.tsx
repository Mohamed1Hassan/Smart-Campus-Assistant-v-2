"use client";
/**
 * ValidatedForm Component
 * A comprehensive form component with built-in validation
 */

import React, { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import {
  useFormValidation,
  UseFormValidationOptions,
} from "../../hooks/useFormValidation";
import { ValidationRule } from "../../utils/validation.frontend";
import ValidationField from "./ValidationField";

export interface ValidatedFormProps<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  children: ReactNode;
  initialValues?: T;
  validationSchema?: Record<string, ValidationRule[]>;
  onSubmit: (values: T) => void | Promise<void>;
  className?: string;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  sanitizeOnChange?: boolean;
  showValidationSummary?: boolean;
  submitButtonText?: string;
  resetButtonText?: string;
  showResetButton?: boolean;
  disabled?: boolean;
}

const ValidatedForm = <T extends Record<string, unknown>>({
  children,
  initialValues = {} as T,
  validationSchema = {},
  onSubmit,
  className = "",
  showValidationSummary = false,
  submitButtonText = "Submit",
  resetButtonText = "Reset",
  showResetButton = true,
  disabled = false,
}: ValidatedFormProps<T>) => {
  const options: UseFormValidationOptions<T> = {
    initialValues,
    validationRules: validationSchema,
    onSubmit,
  };

  const {
    values,
    errors,
    touched,
    isValid,
    isSubmitting,
    reset,
    handleSubmit,
    handleBlur,
    handleChange,
  } = useFormValidation(options);

  // Get all error messages for validation summary
  const allErrors = Object.values(errors).flat();
  const hasErrors = allErrors.length > 0;

  // Clone children and inject form props
  const renderChildren = (children: ReactNode): ReactNode => {
    return React.Children.map(children, (child) => {
      if (React.isValidElement(child)) {
        const element = child as React.ReactElement<{
          name: string;
          children?: ReactNode;
          value?: unknown;
          onChange?: (val: unknown) => void;
          onBlur?: () => void;
          errors?: string[];
          touched?: boolean;
        }>;

        // If it's a ValidationField, inject the form props
        if (element.type === ValidationField) {
          const fieldName = element.props.name;
          return React.cloneElement(element, {
            onChange: (
              e:
                | React.ChangeEvent<
                    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
                  >
                | unknown,
            ) => {
              const value =
                typeof e === "object" && e !== null && "target" in e
                  ? (e as { target: { value: unknown } }).target.value
                  : e;
              handleChange(fieldName, value);
            },
            onBlur: () => handleBlur(fieldName),
            errors: (errors as Record<string, string>)[fieldName]
              ? [(errors as Record<string, string>)[fieldName]]
              : [],
            touched: touched[fieldName] || false,
          });
        }

        // If it's a form element, inject the form props
        if (
          element.props.name &&
          typeof element.type === "string" &&
          ["input", "textarea", "select"].includes(element.type)
        ) {
          const fieldName = element.props.name;
          return React.cloneElement(
            element as React.ReactElement<{
              value: unknown;
              onChange: (e: unknown) => void;
              onBlur: () => void;
            }>,
            {
              value: (values as Record<string, unknown>)[fieldName] || "",
              onChange: (
                e:
                  | React.ChangeEvent<
                      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
                    >
                  | unknown,
              ) => {
                const value =
                  typeof e === "object" && e !== null && "target" in e
                    ? (e as { target: { value: unknown } }).target.value
                    : e;
                handleChange(fieldName, value);
              },
              onBlur: () => handleBlur(fieldName),
            },
          );
        }

        // Recursively process nested children
        if (element.props.children) {
          return React.cloneElement(element, {
            children: renderChildren(element.props.children),
          });
        }

        return element;
      }
      return child;
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`space-y-6 ${className}`}
      noValidate
    >
      {/* Validation Summary */}
      {showValidationSummary && hasErrors && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Please correct the following errors:
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc list-inside space-y-1">
                  {allErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Fields */}
      <div className="space-y-4">{renderChildren(children)}</div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3">
        {showResetButton && (
          <button
            type="button"
            onClick={reset}
            disabled={disabled || isSubmitting}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resetButtonText}
          </button>
        )}

        <button
          type="submit"
          disabled={disabled || isSubmitting || !isValid}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
              Submitting...
            </>
          ) : (
            submitButtonText
          )}
        </button>
      </div>

      {/* Form State Debug (only in development) */}
      {process.env.NODE_ENV === "development" && (
        <details className="mt-4 p-4 bg-gray-100 rounded-md">
          <summary className="cursor-pointer font-medium">
            Form State (Debug)
          </summary>
          <pre className="mt-2 text-xs overflow-auto">
            {JSON.stringify(
              { values, errors, touched, isValid, isSubmitting },
              null,
              2,
            )}
          </pre>
        </details>
      )}
    </form>
  );
};

export default ValidatedForm;
