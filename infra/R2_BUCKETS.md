# R2 Bucket Structure and Naming Convention

## Overview

To ensure scalability, flexibility, and organization for all current and future media/events/components, use a small number of R2 buckets with logical prefixes (folders) for each media type, event, or component. This approach is Cloudflare best practice and supports efficient management and access control.

## Bucket Design

- **Main bucket:** `jw-site-media`
  - Stores all production media assets.
  - Use prefixes for organization:
    - `images/` — All image files (e.g., avatars, banners, screenshots)
    - `videos/` — Video files
    - `audio/` — Audio files
    - `documents/` — PDFs, docs, etc.
    - `events/{eventId}/` — Event-specific assets
    - `components/{componentName}/` — Component-specific assets
    - `user_uploads/{userId}/` — User-generated content
    - (Add more as needed)
- **Preview bucket:** `jw-site-media-preview`
  - For temporary, staging, or preview assets.
  - Same prefix structure as above.

## Example Object Keys

- `images/profile/jw.png`
- `videos/launch/intro.mp4`
- `events/2025-summit/banner.jpg`
- `components/guestbook/cover.png`
- `user_uploads/12345/avatar.jpg`

## Creation Instructions

1. **In Cloudflare Dashboard:**
   - Go to R2 > Create Bucket
   - Name: `jw-site-media` (for production)
   - Name: `jw-site-media-preview` (for preview/staging)
2. **No need to pre-create folders:**
   - Prefixes are logical; just upload objects with the desired key (e.g., `images/foo.jpg`).
3. **Access Control:**
   - Use bucket policies or Workers to restrict access as needed.

## wrangler.toml Reference

Already configured:

```
[[r2_buckets]]
binding = "MEDIA"
bucket_name = "jw-site-media"
preview_bucket_name = "jw-site-media-preview"
```

## Future Growth

- Add more prefixes as new media types, events, or components are introduced.
- If a domain grows very large, consider a new bucket (e.g., `jw-site-archive`).

---
This structure is robust, organized, and ready for scale.
