"use client";
import Image from "next/image";
import { Camera, X } from "lucide-react";
import { useState, useRef } from "react";

interface AvatarUploaderProps {
  currentAvatar: string | null;
  userName: string;
  onAvatarChange: (file: File | null) => void;
  isEditing: boolean;
  preview?: string | null;
}

export default function AvatarUploader({
  currentAvatar,
  userName,
  onAvatarChange,
  isEditing,
  preview,
}: AvatarUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    currentAvatar || preview || null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Derive the current preview URL: local preview takes priority, then prop preview, then current avatar.
  const activePreviewUrl = previewUrl || preview || currentAvatar;

  // We only need state for local file selections.
  // Clear local preview when currentAvatar changes (upload successful)
  // No-op effect removed. Resetting previewUrl is now handled in the change handler
  // or by the fact that activePreviewUrl prioritizes previewUrl which starts as null.

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!/^image\/(png|jpe?g)$/i.test(file.type)) {
        // Error will be handled by parent component via Toast
        return;
      }

      // Validate file size (2MB limit)
      if (file.size > 2 * 1024 * 1024) {
        // Error will be handled by parent component via Toast
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
        onAvatarChange(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageError = () => {
    // If the image fails to load, clear local preview and notify parent
    setPreviewUrl(null);
    onAvatarChange(null);
  };

  const handleRemoveAvatar = () => {
    setPreviewUrl(null);
    onAvatarChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClick = () => {
    if (isEditing) {
      fileInputRef.current?.click();
    }
  };

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div className="relative">
      <div
        className={`w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg ${
          isEditing ? "cursor-pointer" : ""
        }`}
        onClick={handleClick}
        role="button"
        tabIndex={isEditing ? 0 : -1}
        aria-label={isEditing ? "Upload profile picture" : "Profile picture"}
        onKeyDown={(e) => {
          if (isEditing && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        {activePreviewUrl ? (
          <div className="relative w-full h-full">
            <Image
              src={activePreviewUrl}
              alt={userName}
              fill
              className="object-cover"
              onError={handleImageError}
              unoptimized
            />
          </div>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-3xl font-bold">
            {initials}
          </div>
        )}

        {isEditing && (
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200">
            <Camera className="w-8 h-8 text-white" />
          </div>
        )}
      </div>

      {isEditing && activePreviewUrl && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleRemoveAvatar();
          }}
          className="absolute top-0 right-0 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors shadow-lg"
          aria-label="Remove avatar"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Avatar file input"
      />
    </div>
  );
}
