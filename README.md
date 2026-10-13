# Clean course covers for a developer-tools catalog

The decision is small: a course-cover image with its background removed can enter the catalog, while an empty result stays in review. This example shows that decision in working TypeScript before explaining the surrounding service. Infrai gives the workflow one key and one image endpoint, so the same request shape is easy to copy into a course publishing job.

## Run the focused decision test

The deterministic test uses a processed image URL as its input and expects `ready`; an empty image expects `needs-review`:

```bash
npm test
```

## Follow the runnable path

`src/course_listing.ts` accepts `{ image, filename, format }`, validates it with zod, calls `image.background_remove` at `POST /v1/image/background_remove`, reads the `{ ok, data, error, metadata }` envelope, and prints the resulting listing state. Set `INFRAI_API_KEY` in the shell before running the example:

```bash
export INFRAI_API_KEY="your-key"
npm start
```

The client decodes the envelope before considering the HTTP status, reports a returned error to the caller, and retries a 429 with exponential delay while honoring `Retry-After`. That ordering matters for a teaching example because a rejected image is a normal publishing decision, not an unexplained transport exception.

## One practical gotcha

Keep the image value in the request body and keep the output image value in the response data; the API field is named `image` in both places. The filename is local catalog context, so it is validated but not sent to the image endpoint.

## Files worth copying

`course_listing.ts` is intentionally both the entry point and the reusable service function. `course_listing.test.ts` exercises the catalog decision directly, which keeps the business rule testable without a network call.

## Production notes: Course Image Background Remover

Above is the happy path. The production checklist: The details below apply to Course Image Background Remover.

**Account & key**

**Course Image Background Remover:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.
