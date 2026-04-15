# Wedding Photos

Mobile-first wedding photo upload app built with Next.js, Vercel, and Supabase Storage.

## What it does

- Opens cleanly from a QR code on mobile
- Lets guests take a photo or upload from their gallery
- Compresses images in the browser before sending
- Uploads each image to Supabase Storage through a server-side route
- Optionally stores guest names in a `photos` table when configured

## Stack

- Next.js 16 App Router
- Vercel for hosting
- Supabase Storage for uploads
- `browser-image-compression` for client-side image optimization

## Environment variables

Copy `.env.example` to `.env.local` and set:

```bash
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_BUCKET=wedding-photos
WEDDING_DATE=2026-06-01
```

Only `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are required for uploads. Add `SUPABASE_PHOTOS_TABLE=photos` only after creating the optional metadata table.

## Local development

```bash
npm install
npm run dev
```

## Supabase setup

Create the bucket automatically after your env vars are in place:

```bash
set -a
source .env.local
set +a
npm run setup:supabase
```

If you want to save guest names and file paths, run [supabase/photos.sql](/Users/gaest/Wedding photos/supabase/photos.sql:1) in Supabase and then add `SUPABASE_PHOTOS_TABLE=photos` to your env:

## Deploy to Vercel

1. Add the same environment variables to your Vercel project.
2. Deploy with `vercel --prod` or connect the GitHub repo in Vercel.
3. Generate a QR code that points to the production URL.
