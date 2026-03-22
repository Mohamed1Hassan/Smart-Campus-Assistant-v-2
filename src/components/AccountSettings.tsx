"use client";
import { Lock, Bell, Shield } from "lucide-react";
import { useState } from "react";
import { Switch } from "./ui/switch";
import { apiClient } from "../services/api";
import { useToast } from "./common/ToastProvider";
import { Loader2 } from "lucide-react";

interface AccountSettingsProps {
  notificationsEnabled: boolean;
  onNotificationToggle: (checked: boolean) => void;
  userRole?: "STUDENT" | "PROFESSOR" | "ADMIN";
  chromeless?: boolean;
}

export default function AccountSettings({
  notificationsEnabled,
  onNotificationToggle,
  userRole = "STUDENT",
  chromeless = false,
}: AccountSettingsProps) {
  // Format role for display
  const accountTypeLabel =
    userRole === "STUDENT"
      ? "Student Account"
      : userRole === "PROFESSOR"
        ? "Professor Account"
        : "Admin Account";
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const { error: showError, success: showSuccess } = useToast();

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showError("New passwords do not match");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      showError("Password must be at least 6 characters long");
      return;
    }

    if (!passwordForm.oldPassword) {
      showError("Please enter your current password");
      return;
    }

    setIsChangingPassword(true);

    try {
      const response = await apiClient.post("/api/auth/change-password", {
        currentPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      });

      if (response.success) {
        showSuccess("Password changed successfully!");
        setPasswordForm({
          oldPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setShowPasswordForm(false);
      } else {
        showError(response.message || "Failed to change password");
      }
    } catch (error: unknown) {
      console.error("Password change error:", error);

      const err = error as {
        details?: { msg?: string; message?: string }[];
        message?: string;
      };
      console.error("Error details:", err?.details);

      // Extract validation errors if available
      const validationErrors = err?.details;
      if (validationErrors && Array.isArray(validationErrors)) {
        const errorMessages = validationErrors
          .map((vErr) => vErr.msg || vErr.message)
          .join(", ");
        showError(errorMessages);
      } else {
        const errorMessage =
          err?.message || "Failed to change password. Please try again.";
        showError(errorMessage);
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const content = (
      <div className="space-y-6">
        <div className="pb-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-blue-600 flex-shrink-0" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-textDark">
                  Account Type
                </h3>
                <p className="text-sm text-gray-600 dark:text-mutedDark">
                  {accountTypeLabel}
                </p>
              </div>
            </div>
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-sm font-medium rounded-full">
              Active
            </span>
          </div>
        </div>

        <div className="pb-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Bell className="w-5 h-5 text-orange-600 flex-shrink-0" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-textDark">
                  Notifications
                </h3>
                <p className="text-sm text-gray-600 dark:text-mutedDark">
                  Receive email and push notifications
                </p>
              </div>
            </div>
            <Switch
              checked={notificationsEnabled}
              onCheckedChange={onNotificationToggle}
              className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Toggle notifications"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Lock className="w-5 h-5 text-red-600 flex-shrink-0" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-textDark">
                  Change Password
                </h3>
                <p className="text-sm text-gray-600 dark:text-mutedDark">
                  Update your account password
                </p>
              </div>
            </div>
            {!showPasswordForm && (
              <button
                onClick={() => setShowPasswordForm(true)}
                className="px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              >
                Change
              </button>
            )}
          </div>

          {showPasswordForm && (
            <form
              onSubmit={handlePasswordChange}
              className="space-y-4 mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
            >
              <div>
                <label
                  className="block text-sm font-medium text-gray-700 dark:text-textDark mb-2"
                  aria-label="Current password"
                >
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordForm.oldPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      oldPassword: e.target.value,
                    })
                  }
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-textDark"
                  aria-label="Current password"
                />
              </div>

              <div>
                <label
                  className="block text-sm font-medium text-gray-700 dark:text-textDark mb-2"
                  aria-label="New password"
                >
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      newPassword: e.target.value,
                    })
                  }
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-textDark"
                  aria-label="New password"
                />
              </div>

              <div>
                <label
                  className="block text-sm font-medium text-gray-700 dark:text-textDark mb-2"
                  aria-label="Confirm new password"
                >
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({
                      ...passwordForm,
                      confirmPassword: e.target.value,
                    })
                  }
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-textDark"
                  aria-label="Confirm new password"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Changing...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPasswordForm({
                      oldPassword: "",
                      newPassword: "",
                      confirmPassword: "",
                    });
                  }}
                  disabled={isChangingPassword}
                  className="flex-1 px-4 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-textDark rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
  );

  if (chromeless) return content;

  return (
    <div className="bg-white dark:bg-cardDark rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-textDark mb-6">
        Account Settings
      </h2>
      {content}
    </div>
  );
}
