"use client";
/**
 * ValidationField Component
 * A reusable form field component with built-in validation
 */

import React, { forwardRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import {
  shake,
  checkmark,
  errorX,
  prefersReducedMotion,
} from "../../utils/animations";

export interface ValidationFieldProps {
  name: string;
  label?: string;
  type?:
    | "text"
    | "email"
    | "password"
    | "number"
    | "tel"
    | "url"
    | "textarea"
    | "select";
  placeholder?: string;
  value: string | number | readonly string[] | undefined;
  onChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => void;
  onBlur?: (
    e: React.FocusEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => void;
  errors?: string[];
  touched?: boolean;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  labelClassName?: string;
  errorClassName?: string;
  options?: Array<{ value: string; label: string }>;
  rows?: number;
  cols?: number;
  min?: number;
  max?: number;
  step?: number;
  pattern?: string;
  autoComplete?: string;
  autoFocus?: boolean;
  readOnly?: boolean;
  helpText?: string;
  showValidationIcon?: boolean;
}

const ValidationField = forwardRef<
  HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  ValidationFieldProps
>(
  (
    {
      name,
      label,
      type = "text",
      placeholder,
      value,
      onChange,
      onBlur,
      errors = [],
      touched = false,
      required = false,
      disabled = false,
      className = "",
      inputClassName = "",
      labelClassName = "",
      errorClassName = "",
      options = [],
      rows = 3,
      cols,
      min,
      max,
      step,
      pattern,
      autoComplete,
      autoFocus = false,
      readOnly = false,
      helpText,
      showValidationIcon = true,
      ...props
    },
    ref,
  ) => {
    const hasError = touched && errors && errors.length > 0;
    const errorMessage = hasError ? errors[0] : "";
    const isValid = touched && !hasError;
    const [showShake, setShowShake] = useState(false);

    // Trigger shake animation when error occurs
    useEffect(() => {
      if (hasError && touched) {
        const animationFrame = requestAnimationFrame(() => {
          setShowShake(true);
        });
        const timer = setTimeout(() => setShowShake(false), 400);
        return () => {
          cancelAnimationFrame(animationFrame);
          clearTimeout(timer);
        };
      }
    }, [hasError, touched]);

    const shouldAnimate = !prefersReducedMotion();

    const baseInputClasses = `
    w-full px-3 py-2 border rounded-md shadow-sm transition-colors duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:bg-gray-100 disabled:cursor-not-allowed
    ${
      hasError
        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
        : isValid
          ? "border-green-300 focus:border-green-500 focus:ring-green-500"
          : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
    }
    ${inputClassName}
  `.trim();

    const labelClasses = `
    block text-sm font-medium mb-1
    ${hasError ? "text-red-700" : "text-gray-700"}
    ${labelClassName}
  `.trim();

    const errorClasses = `
    mt-1 text-sm text-red-600
    ${errorClassName}
  `.trim();

    const helpClasses = `
    mt-1 text-sm text-gray-500
  `.trim();

    const renderInput = () => {
      const commonProps = {
        id: name,
        name,
        value: value || "",
        onChange,
        onBlur,
        disabled,
        required,
        autoComplete,
        autoFocus,
        readOnly,
        className: baseInputClasses,
        ...props,
      };

      switch (type) {
        case "textarea":
          return (
            <textarea
              ref={ref as React.Ref<HTMLTextAreaElement>}
              placeholder={placeholder}
              rows={rows}
              cols={cols}
              {...commonProps}
            />
          );

        case "select":
          return (
            <select ref={ref as React.Ref<HTMLSelectElement>} {...commonProps}>
              {placeholder && (
                <option value="" disabled>
                  {placeholder}
                </option>
              )}
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          );

        default:
          return (
            <input
              ref={ref as React.Ref<HTMLInputElement>}
              type={type}
              placeholder={placeholder}
              min={min}
              max={max}
              step={step}
              pattern={pattern}
              {...commonProps}
            />
          );
      }
    };

    const renderValidationIcon = () => {
      if (!showValidationIcon || !touched) return null;

      if (hasError) {
        return (
          <motion.div
            className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"
            variants={shouldAnimate ? errorX : undefined}
            initial={shouldAnimate ? "hidden" : undefined}
            animate={shouldAnimate ? "visible" : undefined}
          >
            <svg
              className="h-5 w-5 text-red-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </motion.div>
        );
      }

      if (isValid) {
        return (
          <motion.div
            className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"
            variants={shouldAnimate ? checkmark : undefined}
            initial={shouldAnimate ? "hidden" : undefined}
            animate={shouldAnimate ? "visible" : undefined}
          >
            <motion.svg
              className="h-5 w-5 text-green-500"
              fill="currentColor"
              viewBox="0 0 20 20"
              variants={shouldAnimate ? checkmark : undefined}
            >
              <motion.path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
                variants={shouldAnimate ? checkmark : undefined}
              />
            </motion.svg>
          </motion.div>
        );
      }

      return null;
    };

    return (
      <motion.div
        className={`relative ${className}`}
        variants={shouldAnimate ? shake : undefined}
        animate={showShake ? "shake" : "rest"}
      >
        {label && (
          <label htmlFor={name} className={labelClasses}>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {renderInput()}
          {renderValidationIcon()}
        </div>

        <AnimatePresence>
          {hasError && errorMessage && (
            <motion.p
              className={errorClasses}
              role="alert"
              initial={shouldAnimate ? { opacity: 0, y: -10 } : false}
              animate={shouldAnimate ? { opacity: 1, y: 0 } : undefined}
              exit={shouldAnimate ? { opacity: 0 } : undefined}
              transition={{ duration: 0.2 }}
            >
              {errorMessage}
            </motion.p>
          )}
        </AnimatePresence>

        {helpText && !hasError && <p className={helpClasses}>{helpText}</p>}
      </motion.div>
    );
  },
);

ValidationField.displayName = "ValidationField";

export default ValidationField;
