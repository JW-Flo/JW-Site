# How to Integrate R2 Storage in JW-Site

The R2 endpoints are implemented but not yet used by the main app. Here is a recommended path to integrate R2 storage for file upload and download:

## 1. Add API Routes (Optional)

- If you want to proxy R2 operations through `/api`, create routes like `/api/media/upload`, `/api/media/download`, etc., that forward requests to the `/functions/r2/` endpoints.

## 2. Add a File Upload UI

- Create a simple UI (e.g., `UploadMedia.astro` or `UploadMedia.js`) with a file input and upload button.
- On submit, POST the file to `/functions/r2/upload` (or your new API route).

## 3. Add a File List and Download UI

- Fetch the list of objects from `/functions/r2/list` and display them.
- For each object, provide a download link that points to `/functions/r2/download?key=OBJECT_KEY`.

## 4. (Optional) Add Delete Functionality

- Add a delete button for each object, calling `/functions/r2/delete?key=OBJECT_KEY`.

## Example: Minimal Upload UI (Astro/JS)

```jsx
<form id="media-upload-form">
  <input type="file" name="file" required />
  <button type="submit">Upload</button>
</form>
<script>
document.getElementById('media-upload-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const file = e.target.file.files[0];
  const formData = new FormData();
  formData.append('file', file);
  await fetch('/functions/r2/upload', { method: 'POST', body: formData });
  // Optionally refresh file list here
});
</script>
```

## Next Steps

- Place this UI in a page or component (e.g., `/src/pages/media.astro`).
- Test upload, list, download, and delete flows.

---

*This file provides a starting point for integrating R2 storage into the user experience.*
