"use client";
import {
  Mail,
  Phone,
  Calendar,
  MapPin,
  AlertCircle,
  Building,
  GraduationCap,
  Clock,
  BookOpen,
} from "lucide-react";
import { Label } from "./ui/label";

interface ProfessorProfileFormProps {
  profile: {
    name: string;
    email: string;
    phone: string;
    dob: string;
    address: string;
    department: string;
    title: string;
    officeHours: string;
    researchInterests: string;
    emergencyContact: string;
  };
  isEditing: boolean;
  onChange: (field: string, value: string) => void;
  errors?: {
    name?: string;
    email?: string;
    phone?: string;
    department?: string;
    title?: string;
    dob?: string;
  };
}

export default function ProfessorProfileForm({
  profile,
  isEditing,
  onChange,
  errors = {},
}: ProfessorProfileFormProps) {
  const inputClass = isEditing
    ? "w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-textDark"
    : "w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-transparent rounded-lg text-gray-700 dark:text-textDark";

  const inputErrorClass = isEditing
    ? "w-full px-4 py-2.5 border-2 border-red-300 dark:border-red-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-textDark"
    : inputClass;

  return (
    <div className="bg-white dark:bg-cardDark rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-textDark mb-6">
        Personal Information
      </h2>

      <fieldset className="space-y-6">
        <legend className="sr-only">Personal information form fields</legend>
        <div>
          <Label className="block text-sm font-medium text-gray-700 dark:text-textDark mb-2">
            Full Name
          </Label>
          <input
            type="text"
            value={profile.name}
            onChange={(e) => onChange("name", e.target.value)}
            disabled={!isEditing}
            className={errors.name ? inputErrorClass : inputClass}
            placeholder="Enter your full name"
            aria-label="Full name"
            aria-invalid={errors.name ? "true" : "false"}
            aria-describedby={errors.name ? "name-error" : undefined}
          />
          {errors.name && (
            <p
              id="name-error"
              className="mt-1 text-sm text-red-600 dark:text-red-400"
              role="alert"
            >
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <Label className="flex text-sm font-medium text-gray-700 mb-2 items-center gap-2">
            <Mail className="w-4 h-4" />
            Email Address
          </Label>
          <input
            type="email"
            value={profile.email}
            onChange={(e) => onChange("email", e.target.value)}
            disabled={!isEditing}
            className={errors.email ? inputErrorClass : inputClass}
            placeholder="your.email@university.edu"
            aria-label="Email address"
            aria-invalid={errors.email ? "true" : "false"}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
          {errors.email && (
            <p
              id="email-error"
              className="mt-1 text-sm text-red-600 dark:text-red-400"
              role="alert"
            >
              {errors.email}
            </p>
          )}
        </div>

        <div>
          <Label className="flex text-sm font-medium text-gray-700 mb-2 items-center gap-2">
            <Phone className="w-4 h-4" />
            Phone Number
          </Label>
          <input
            type="tel"
            value={profile.phone}
            onChange={(e) => onChange("phone", e.target.value)}
            disabled={!isEditing}
            className={errors.phone ? inputErrorClass : inputClass}
            placeholder="+20 10 1234 5678"
            aria-label="Phone number"
            aria-invalid={errors.phone ? "true" : "false"}
            aria-describedby={errors.phone ? "phone-error" : undefined}
          />
          {errors.phone && (
            <p
              id="phone-error"
              className="mt-1 text-sm text-red-600 dark:text-red-400"
              role="alert"
            >
              {errors.phone}
            </p>
          )}
        </div>

        <div>
          <Label className="flex text-sm font-medium text-gray-700 mb-2 items-center gap-2">
            <Calendar className="w-4 h-4" />
            Date of Birth
          </Label>
          <input
            type="date"
            value={profile.dob}
            onChange={(e) => onChange("dob", e.target.value)}
            disabled={!isEditing}
            className={errors.dob ? inputErrorClass : inputClass}
            aria-label="Date of birth"
            aria-invalid={errors.dob ? "true" : "false"}
            aria-describedby={errors.dob ? "dob-error" : undefined}
          />
          {errors.dob && (
            <p
              id="dob-error"
              className="mt-1 text-sm text-red-600 dark:text-red-400"
              role="alert"
            >
              {errors.dob}
            </p>
          )}
        </div>

        <div>
          <Label className="flex text-sm font-medium text-gray-700 mb-2 items-center gap-2">
            <MapPin className="w-4 h-4" />
            Office Address
          </Label>
          <textarea
            value={profile.address}
            onChange={(e) => onChange("address", e.target.value)}
            disabled={!isEditing}
            rows={2}
            className={inputClass}
            placeholder="Enter your office address"
            aria-label="Office address"
          />
        </div>

        <div>
          <Label className="flex text-sm font-medium text-gray-700 mb-2 items-center gap-2">
            <Building className="w-4 h-4" />
            Department
          </Label>
          <input
            type="text"
            value={profile.department}
            onChange={(e) => onChange("department", e.target.value)}
            disabled={!isEditing}
            className={errors.department ? inputErrorClass : inputClass}
            placeholder="Course names (e.g., Applications in computer programming)"
            aria-label="Department"
            aria-invalid={errors.department ? "true" : "false"}
            aria-describedby={
              errors.department ? "department-error" : undefined
            }
          />
          {errors.department && (
            <p
              id="department-error"
              className="mt-1 text-sm text-red-600 dark:text-red-400"
              role="alert"
            >
              {errors.department}
            </p>
          )}
        </div>

        <div>
          <Label className="flex text-sm font-medium text-gray-700 mb-2 items-center gap-2">
            <GraduationCap className="w-4 h-4" />
            Academic Title
          </Label>
          <input
            type="text"
            value={profile.title}
            onChange={(e) => onChange("title", e.target.value)}
            disabled={!isEditing}
            className={errors.title ? inputErrorClass : inputClass}
            placeholder="Associate Professor"
            aria-label="Academic title"
            aria-invalid={errors.title ? "true" : "false"}
            aria-describedby={errors.title ? "title-error" : undefined}
          />
          {errors.title && (
            <p
              id="title-error"
              className="mt-1 text-sm text-red-600 dark:text-red-400"
              role="alert"
            >
              {errors.title}
            </p>
          )}
        </div>

        <div>
          <Label className="flex text-sm font-medium text-gray-700 mb-2 items-center gap-2">
            <Clock className="w-4 h-4" />
            Office Hours
          </Label>
          <input
            type="text"
            value={profile.officeHours}
            onChange={(e) => onChange("officeHours", e.target.value)}
            disabled={!isEditing}
            className={inputClass}
            placeholder="Mon-Wed 10:00-12:00, Thu 14:00-16:00"
            aria-label="Office hours"
          />
        </div>

        <div>
          <Label className="flex text-sm font-medium text-gray-700 mb-2 items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Research Interests
          </Label>
          <textarea
            value={profile.researchInterests}
            onChange={(e) => onChange("researchInterests", e.target.value)}
            disabled={!isEditing}
            rows={3}
            className={inputClass}
            placeholder="Machine Learning, Artificial Intelligence, Data Science"
            aria-label="Research interests"
          />
        </div>

        <div>
          <Label className="flex text-sm font-medium text-gray-700 mb-2 items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Emergency Contact
          </Label>
          <input
            type="tel"
            value={profile.emergencyContact}
            onChange={(e) => onChange("emergencyContact", e.target.value)}
            disabled={!isEditing}
            className={inputClass}
            placeholder="+20 10 9876 5432"
            aria-label="Emergency contact"
          />
        </div>
      </fieldset>
    </div>
  );
}
