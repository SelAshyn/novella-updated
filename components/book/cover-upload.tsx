"use client";

import { useState, useRef } from "react";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

interface CoverUploadProps {
  bookId?: string;
  currentCover?: string | null;
  onUploadComplete?: (url: string) => void;
  onRemove?: () => void;
}

export function CoverUpload({
  bookId,
  currentCover,
  onUploadComplete,
  onRemove,
}: CoverUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentCover || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB");
      return;
    }

    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // If bookId is provided, upload immediately
    if (bookId) {
      await uploadImage(file);
    } else {
      // Otherwise, just keep the preview and call onUploadComplete with base64
      if (onUploadComplete) {
        const base64 = await fileToBase64(file);
        onUploadComplete(base64);
      }
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const uploadImage = async (file: File) => {
    try {
      setUploading(true);
      setError(null);

      const base64 = await fileToBase64(file);

      // Get Firebase token
      const { getAuth } = await import("firebase/auth");
      const { app } = await import("@/lib/firebase");
      const auth = getAuth(app);
      const user = auth.currentUser;

      if (!user) {
        throw new Error("Not authenticated");
      }

      const token = await user.getIdToken();

      // Upload to API
      const response = await fetch("/api/upload/book-cover", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookId,
          image: base64,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const { url } = await response.json();
      setPreview(url);

      if (onUploadComplete) {
        onUploadComplete(url);
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "Failed to upload image");
      setPreview(currentCover || null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (onRemove) {
      onRemove();
    }
  };

  return (
    <div className="space-y-2">
      <label className="kicker text-muted-foreground">Book Cover</label>

      <div className="relative">
        {preview ? (
          <div className="relative sticker overflow-hidden" style={{ aspectRatio: "2/3", maxWidth: "200px" }}>
            <Image
              src={preview}
              alt="Book cover"
              fill
              className="object-cover"
              sizes="200px"
            />
            {!uploading && (
              <button
                type="button"
                onClick={handleRemove}
                className="absolute top-2 right-2 grid size-8 place-items-center rounded-full bg-black/50 text-white hover:bg-black/70"
                aria-label="Remove cover"
              >
                <X className="size-4" />
              </button>
            )}
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Loader2 className="size-8 animate-spin text-white" />
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex flex-col items-center justify-center gap-3 p-8 text-center rounded-2xl border-2 border-dashed border-border/80 bg-secondary/30 hover:bg-secondary/60 hover:border-amber-500/50 transition-all disabled:opacity-50"
            style={{ aspectRatio: "2/3", maxWidth: "200px" }}
          >
            {uploading ? (
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            ) : (
              <>
                <ImageIcon className="size-12 text-muted-foreground" />
                <div>
                  <p className="kicker text-sm">Click to upload</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                </div>
              </>
            )}
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <p className="text-xs text-muted-foreground">
        Recommended: 400x600px or 2:3 aspect ratio
      </p>
    </div>
  );
}
