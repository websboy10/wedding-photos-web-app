/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { hasGalleryAccess } from "@/lib/gallery-auth";
import { listEventPhotos } from "@/lib/supabase-admin";
import styles from "./page.module.css";

type PageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

function LoginCard({ hasError }: { hasError: boolean }) {
  return (
    <main className={styles.pageShell}>
      <section className={styles.card}>
        <div className={styles.topBar}>
          <Link className={styles.ghostButton} href="/">
            Til upload
          </Link>
        </div>

        <div className={styles.copyBlock}>
          <p className={styles.eyebrow}>Brudepar</p>
          <h1 className={styles.title}>Låst galleri ❤️</h1>
          <p className={styles.description}>
            Indtast adgangskoden for at se alle billederne samlet.
          </p>
        </div>

        <form action="/api/gallery-login" className={styles.loginForm} method="post">
          <label className={styles.inputLabel} htmlFor="password">
            Adgangskode
          </label>
          <input
            className={styles.passwordInput}
            id="password"
            name="password"
            placeholder="Skriv adgangskoden"
            required
            type="password"
          />
          <button className={styles.primaryButton} type="submit">
            Åbn galleri
          </button>
        </form>

        <div
          aria-live="polite"
          className={`${styles.statusBanner} ${hasError ? styles.error : styles.idle}`}
        >
          {hasError
            ? "Forkert adgangskode. Prøv igen."
            : "Kun brudeparret har adgang til denne side."}
        </div>
      </section>
    </main>
  );
}

function GalleryCard({
  photos,
}: {
  photos: Awaited<ReturnType<typeof listEventPhotos>>;
}) {
  return (
    <main className={styles.pageShell}>
      <section className={`${styles.card} ${styles.galleryCard}`}>
        <div className={styles.topBar}>
          <Link className={styles.ghostButton} href="/">
            Til upload
          </Link>
          <form action="/api/gallery-logout" method="post">
            <button className={styles.ghostButton} type="submit">
              Log ud
            </button>
          </form>
        </div>

        <div className={styles.copyBlock}>
          <p className={styles.eyebrow}>Brudepar</p>
          <h1 className={styles.title}>Jeres billeder ❤️</h1>
          <p className={styles.description}>
            Alle uploadede billeder samlet i ét galleri.
          </p>
        </div>

        {photos.length === 0 ? (
          <div className={`${styles.statusBanner} ${styles.idle}`}>
            Der er ikke uploadet nogen billeder endnu.
          </div>
        ) : (
          <div className={styles.galleryGrid}>
            {photos.map((photo) => (
              <a
                className={styles.photoTile}
                href={photo.signedUrl}
                key={photo.path}
                rel="noreferrer"
                target="_blank"
              >
                <img
                  alt="Bryllupsbillede"
                  className={styles.photoImage}
                  loading="lazy"
                  src={photo.signedUrl}
                />
              </a>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default async function BrideAndGroomPage({ searchParams }: PageProps) {
  const [{ error }, isAuthorized] = await Promise.all([
    searchParams,
    hasGalleryAccess(),
  ]);

  if (!isAuthorized) {
    return <LoginCard hasError={error === "1"} />;
  }

  const photos = await listEventPhotos();
  return <GalleryCard photos={photos} />;
}
