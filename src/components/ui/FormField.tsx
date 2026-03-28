"use client";
import React, { useState } from "react";
import { Input } from "./input";
import { Label } from "./label";
import { AlertCircle, Eye, EyeOff, LucideIcon } from "lucide-react";
import { ValidationRule } from "../../utils/validation.frontend";

export interface FormFieldProps {
  label: string;
  name: string;
  type?:
    | "text"
    | "email"
    | "password"
    | "number"
    | "tel"
    | "url"
    | "textarea"
    | "date";
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  rules?: ValidationRule[];
  placeholder?: string;
  autoComplete?: string;
  inputMode?: "text" | "numeric" | "email" | "tel" | "url";
  mask?: (value: string) => string;
  error?: string;
  touched?: boolean;
  disabled?: boolean;
  required?: boolean;
  helperText?: string;
  showPasswordToggle?: boolean;
  icon?: LucideIcon | React.ReactNode;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  onBlur,
  placeholder,
  autoComplete,
  inputMode,
  mask,
  error,
  touched,
  disabled = false,
  required = false,
  helperText,
  showPasswordToggle = false,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;
    const originalValue = newValue;

    // Apply mask if provided
    if (mask) {
      newValue = mask(newValue);
      // Log mask application for debugging
      if (name === "universityId" && originalValue !== newValue) {
        console.log("🎭 FormField - Mask applied:", {
          field: name,
          original: originalValue,
          masked: newValue,
          maskFunction: mask.toString(),
        });
      }
    }

    onChange(newValue);
  };

  const hasError = touched && error;
  const inputType =
    type === "password" && showPasswordToggle && showPassword ? "text" : type;

  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>

      <div className="relative">
        <Input
          id={name}
          name={name}
          type={inputType}
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          placeholder={placeholder}
          autoComplete={autoComplete}
          inputMode={inputMode}
          disabled={disabled}
          required={required}
          className={
            hasError
              ? "border-red-500 focus:ring-red-500 dark:border-red-500"
              : ""
          }
          style={
            showPasswordToggle && type === "password"
              ? { paddingRight: "2.5rem" }
              : undefined
          }
        />

        {showPasswordToggle && type === "password" && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none"
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        )}

        {hasError && !showPasswordToggle && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <AlertCircle className="h-5 w-5 text-red-500" />
          </div>
        )}

        {hasError && showPasswordToggle && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2">
            <AlertCircle className="h-5 w-5 text-red-500" />
          </div>
        )}
      </div>

      {helperText && !hasError && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
      )}

      {hasError && (
        <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
          <AlertCircle className="h-4 w-4" />
          {error}
        </p>
      )}
    </div>
  );
};
