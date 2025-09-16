# AtlasIT Auth

Reusable authentication helpers for AtlasIT services. The initial module focuses on API key validation so Cloudflare Worker handlers and services can share consistent, secure logic.

## Features

- Parse allow-lists from environment variables (supports optional labels and SHA-256 hashes).
- Timing-safe comparisons to avoid leaking key information.
- Sanitised logging helpers for traceability without exposing secrets.
- Simple API that returns structured verification results for middleware.

## Usage

```ts
import { ApiKeyAuthenticator } from '@atlasit/auth';

const authenticator = ApiKeyAuthenticator.fromEnv(env.API_ALLOWED_KEYS, {
  description: 'onboarding-service'
});

const result = await authenticator.verify(request.headers.get('x-api-key') ?? undefined);
if (result.status !== 'valid') {
  // handle missing/invalid keys
}
```

See `atlasit/onboarding` for a reference integration.
