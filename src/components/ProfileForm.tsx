"use client";
import { Mail, Phone, Calendar, MapPin } from "lucide-react";
import { FormField } from "./ui/FormField";
import { validators, inputMasks } from "../utils/validation.frontend";

interface ProfileFormProps {
  profile: {
    name: string;
    email: string;
    phone: string;
    dob: string;
    address: string;
    emergencyContact: string;
  };
  isEditing: boolean;
  onChange: (field: string, value: string) => void;
  errors?: Record<string, string>;
  touched?: Record<string, boolean>;
  onBlur?: (field: string) => void;
  chromeless?: boolean;
}

export default function ProfileForm({
  profile,
  isEditing,
  onChange,
  errors = {},
  touched = {},
  onBlur,
  chromeless = false,
}: ProfileFormProps) {
  if (!isEditing) {
    // Read-only view
    const content = (
      <div className="space-y-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
            <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-0.5">
              Email Address
            </p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {profile.email || "Not provided"}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0">
            <Phone className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-0.5">
              Phone Number
            </p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {profile.phone || "Not provided"}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
            <MapPin className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-0.5">
              Address
            </p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {profile.address || "Not provided"}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center flex-shrink-0">
            <Calendar className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-0.5">
              Date of Birth
            </p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {profile.dob || "Not provided"}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
            <Phone className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-0.5">
              Emergency Contact
            </p>
            <p className="font-semibold text-gray-900 dark:text-white">
              {profile.emergencyContact || "Not provided"}
            </p>
          </div>
        </div>
      </div>
    );

    if (chromeless) return content;

    return (
      <div className="bg-white dark:bg-cardDark rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-textDark mb-6">
          Personal Information
        </h2>
        {content}
      </div>
    );
  }

  const formContent = (
    <fieldset className="space-y-6">
      <legend className="sr-only">Personal information form fields</legend>
      <FormField
        label="Full Name"
        name="name"
        type="text"
        value={profile.name}
        onChange={(value) => onChange("name", value)}
        onBlur={() => onBlur?.("name")}
        rules={[
          validators.required("Full name is required"),
          validators.minLength(2, "Name must be at least 2 characters"),
        ]}
        placeholder="Enter your full name (e.g., Ahmed Hassan)"
        autoComplete="name"
        error={errors.name}
        touched={touched.name}
        required
      />

      <FormField
        label="Email Address"
        name="email"
        type="email"
        value={profile.email}
        onChange={(value) => onChange("email", value)}
        onBlur={() => onBlur?.("email")}
        rules={[validators.required("Email is required"), validators.email()]}
        placeholder="your.email@example.edu"
        autoComplete="email"
        inputMode="email"
        error={errors.email}
        touched={touched.email}
        required
        helperText="Your university email address"
      />

      <FormField
        label="Phone Number"
        name="phone"
        type="tel"
        value={profile.phone}
        onChange={(value) => onChange("phone", value)}
        onBlur={() => onBlur?.("phone")}
        rules={[
          validators.required("Phone number is required"),
          validators.phone(),
        ]}
        placeholder="+20 10 1234 5678"
        autoComplete="tel"
        inputMode="tel"
        mask={inputMasks.phone}
        error={errors.phone}
        touched={touched.phone}
        required
        helperText="Include country code (e.g., +20)"
      />

      <FormField
        label="Date of Birth"
        name="dob"
        type="date"
        value={profile.dob}
        onChange={(value) => onChange("dob", value)}
        onBlur={() => onBlur?.("dob")}
        rules={[
          validators.required("Date of birth is required"),
          validators.date(),
        ]}
        autoComplete="bday"
        error={errors.dob}
        touched={touched.dob}
        required
      />

      <FormField
        label="Address"
        name="address"
        type="textarea"
        value={profile.address}
        onChange={(value) => onChange("address", value)}
        onBlur={() => onBlur?.("address")}
        rules={[
          validators.required("Address is required"),
          validators.minLength(10, "Please provide a complete address"),
        ]}
        placeholder="Enter your full address"
        autoComplete="street-address"
        error={errors.address}
        touched={touched.address}
        required
        helperText="Include street, city, and postal code"
      />

      <FormField
        label="Emergency Contact"
        name="emergencyContact"
        type="text"
        value={profile.emergencyContact}
        onChange={(value) => onChange("emergencyContact", value)}
        onBlur={() => onBlur?.("emergencyContact")}
        rules={[
          validators.required("Emergency contact is required"),
          validators.minLength(5, "Please provide full contact information"),
        ]}
        placeholder="Name and phone number (e.g., John Doe +20 10 1234 5678)"
        error={errors.emergencyContact}
        touched={touched.emergencyContact}
        required
        helperText="Contact person name and phone number"
      />
    </fieldset>
  );

  if (chromeless) return formContent;

  return (
    <div className="bg-white dark:bg-cardDark rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-textDark mb-6">
        Personal Information
      </h2>
      {formContent}
    </div>
  );
}
