"use client";

import imageCompression from "browser-image-compression";
import Link from "next/link";
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
  const basename = name.replace(/\.[^.]+$/, "").trim() || "bryllupsbillede";
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
        <div className={styles.topBar}>
          <span className={styles.topSpacer} />
          <Link className={styles.topButton} href="/brudepar">
            Brudepar
          </Link>
        </div>

        <div className={styles.copyBlock}>
          <p className={styles.eyebrow}>Bryllupsminder</p>
          <h1 className={styles.title}>Upload billeder til vores bryllup ❤️</h1>
          <p className={styles.description}>
            Tag et billede lige nu eller vælg et fra dit galleri.
          </p>
        </div>

        <label className={styles.inputLabel} htmlFor="guestName">
          Dit navn
        </label>
        <input
          id="guestName"
          className={styles.nameInput}
          disabled={isBusy}
          maxLength={80}
          onChange={(event) => setGuestName(event.target.value)}
          placeholder="Valgfrit"
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
            Tag billede
          </button>
          <button
            className={styles.secondaryButton}
            disabled={isBusy}
            onClick={() => galleryInputRef.current?.click()}
            type="button"
          >
            Upload billede
          </button>
        </div>

        <input
          accept="image/*"
          capture="environment"
          className={styles.hiddenInput}
          disabled={isBusy}
          onChange={(event) => handleFileSelection(event, "kamera")}
          ref={cameraInputRef}
          type="file"
        />
        <input
          accept="image/*"
          className={styles.hiddenInput}
          disabled={isBusy}
          onChange={(event) => handleFileSelection(event, "galleri")}
          ref={galleryInputRef}
          type="file"
        />

        <div
          aria-live="polite"
          className={`${styles.statusBanner} ${styles[status]}`}
        >
          {status === "idle" && "Et billede ad gangen."}
          {status === "compressing" && "Klargør dit billede…"}
          {status === "uploading" &&
            `Uploader${activeLabel ? ` fra ${activeLabel}` : ""}…`}
          {status === "success" && "Tak ❤️"}
          {status === "error" && "Noget gik galt. Prøv igen."}
        </div>
      </section>
    </main>
  );
}
