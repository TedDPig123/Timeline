# AWS S3 configuration

## CORS (`s3-cors.json`)

With client-side encryption, media is no longer shown via `<img src>` (which is
exempt from CORS). The browser now `fetch()`es the ciphertext from S3, decrypts
it, and renders a Blob URL. `fetch()` **is** subject to CORS, so the bucket must
allow `GET` from the app's origins, or:

- newly-encrypted media won't display (stuck on "Decrypting…"), and
- the migrate-at-first-unlock pass can't fetch legacy plaintext media to
  re-encrypt it (TEXT migration is unaffected).

Apply the config (once) with the AWS CLI:

```bash
aws s3api put-bucket-cors \
  --bucket "$AWS_BUCKET_NAME" \
  --cors-configuration file://server/aws/s3-cors.json
```

Or in the console: S3 → your bucket → Permissions → Cross-origin resource
sharing (CORS) → Edit → paste `s3-cors.json`.

Uploads still go browser → server (multer) → S3, so only `GET` needs to be
allowed here. Add new frontend origins to `AllowedOrigins` as needed.
