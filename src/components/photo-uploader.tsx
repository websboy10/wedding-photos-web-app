"use client";

import imageCompression from "browser-image-compression";
import { type ChangeEvent, useRef, useState } from "react";
import styles from "./photo-uploader.module.css";

type UploadStatus = "idle" | "compressing" | "uploading" | "success" | "error";

const compressionOptions = {
  fileType: "image/jpeg",
  initialQuality: 0.7,
  maxSizeMB: 1,
  maxWidthOrHeight: 1280,
  useWebWorker: true,
};

function toJpegFileName(name: string) {
  const basename = name.replace(/\.[^.]+$/, "").trim() || "wedding-photo";
  return `${basename}.jpg`;
}

export function PhotoUploader() {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [guestName, setGuestName] = useState("");
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [activeLabel, setActiveLabel] = useState<string | null>(null);

  const isBusy = status === "compressing" || status === "uploading";

  async function handleFileSelection(
    event: ChangeEvent<HTMLInputElement>,
    sourceLabel: string,
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    try {
      setActiveLabel(sourceLabel);
      setStatus("compressing");

      const compressedFile = await imageCompression(file, compressionOptions);
      const formData = new FormData();

      formData.append("photo", compressedFile, toJpegFileName(file.name));

      if (guestName.trim()) {
        formData.append("guestName", guestName.trim());
      }

      setStatus("uploading");

      const response = await fetch("/api/upload", {
        body: formData,
        method: "POST",
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(data?.error ?? "Upload failed");
      }

      setGuestName("");
      setStatus("success");
    } catch (error) {
      console.error(error);
      setStatus("error");
    }
  }

  return (
    <main className={styles.pageShell}>
      <section className={styles.card}>
        <div className={styles.copyBlock}>
          <p className={styles.eyebrow}>Wedding memories</p>
          <h1 className={styles.title}>Upload photos to our wedding ❤️</h1>
          <p className={styles.description}>
            Snap a moment or share one from your gallery. Each image is
            compressed before upload so it sends quickly on mobile.
          </p>
        </div>

        <label className={styles.inputLabel} htmlFor="guestName">
          Your name or table
        </label>
        <input
          id="guestName"
          className={styles.nameInput}
          disabled={isBusy}
          maxLength={80}
          onChange={(event) => setGuestName(event.target.value)}
          placeholder="Optional"
          type="text"
          value={guestName}
        />

        <div className={styles.buttonGroup}>
          <button
            className={styles.primaryButton}
            disabled={isBusy}
            onClick={() => cameraInputRef.current?.click()}
            type="button"
          >
            Take photo
          </button>
          <button
            className={styles.secondaryButton}
            disabled={isBusy}
            onClick={() => galleryInputRef.current?.click()}
            type="button"
          >
            Upload photo
          </button>
        </div>

        <input
          accept="image/*"
          capture="environment"
          className={styles.hiddenInput}
          disabled={isBusy}
          onChange={(event) => handleFileSelection(event, "camera")}
          ref={cameraInputRef}
          type="file"
        />
        <input
          accept="image/*"
          className={styles.hiddenInput}
          disabled={isBusy}
          onChange={(event) => handleFileSelection(event, "gallery")}
          ref={galleryInputRef}
          type="file"
        />

        <div
          aria-live="polite"
          className={`${styles.statusBanner} ${styles[status]}`}
        >
          {status === "idle" && "One photo at a time. Works best on your phone."}
          {status === "compressing" && "Preparing your photo…"}
          {status === "uploading" &&
            `Uploading${activeLabel ? ` from ${activeLabel}` : ""}…`}
          {status === "success" && "Thank you ❤️"}
          {status === "error" && "Something went wrong, try again"}
        </div>

        <p className={styles.footnote}>
          Photos are resized to 1280px and optimized to roughly 1 to 2 MB for
          faster uploads.
        </p>
      </section>
    </main>
  );
}
