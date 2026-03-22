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
      <div className="space-y-4">
        <div className="flex items-start gap-4 p-4 bg-gray-50/50 dark:bg-gray-800/30 rounded-2xl border border-gray-100 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-800 hover:shadow-md hover:-translate-y-0.5 hover:border-blue-200 dark:hover:border-blue-900/50 transition-all group">
          <div className="w-12 h-12 rounded-xl bg-blue-100/50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
            <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Email Address
            </p>
            <p className="font-bold text-gray-900 dark:text-white truncate">
              {profile.email || "Not provided"}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 bg-gray-50/50 dark:bg-gray-800/30 rounded-2xl border border-gray-100 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-800 hover:shadow-md hover:-translate-y-0.5 hover:border-purple-200 dark:hover:border-purple-900/50 transition-all group">
          <div className="w-12 h-12 rounded-xl bg-purple-100/50 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
            <Phone className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Phone Number
            </p>
            <p className="font-bold text-gray-900 dark:text-white truncate">
              {profile.phone || "Not provided"}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 bg-gray-50/50 dark:bg-gray-800/30 rounded-2xl border border-gray-100 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-800 hover:shadow-md hover:-translate-y-0.5 hover:border-green-200 dark:hover:border-green-900/50 transition-all group">
          <div className="w-12 h-12 rounded-xl bg-green-100/50 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
            <MapPin className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Address
            </p>
            <p className="font-bold text-gray-900 dark:text-white line-clamp-2">
              {profile.address || "Not provided"}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 bg-gray-50/50 dark:bg-gray-800/30 rounded-2xl border border-gray-100 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-800 hover:shadow-md hover:-translate-y-0.5 hover:border-orange-200 dark:hover:border-orange-900/50 transition-all group">
          <div className="w-12 h-12 rounded-xl bg-orange-100/50 dark:bg-orange-900/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
            <Calendar className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Date of Birth
            </p>
            <p className="font-bold text-gray-900 dark:text-white">
              {profile.dob || "Not provided"}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 bg-gray-50/50 dark:bg-gray-800/30 rounded-2xl border border-gray-100 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-800 hover:shadow-md hover:-translate-y-0.5 hover:border-red-200 dark:hover:border-red-900/50 transition-all group">
          <div className="w-12 h-12 rounded-xl bg-red-100/50 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
            <Phone className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
              Emergency Contact
            </p>
            <p className="font-bold text-gray-900 dark:text-white line-clamp-2">
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
