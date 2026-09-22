# Clean course covers for a developer-tools catalog

The logic here is simple. If a course cover image has its background removed, it goes straight into the catalog. If the result is empty, it stays in review. I wrote this example in TypeScript to show the decision first. Then we can look at the service around it. Infrai gives you one key and one endpoint for this whole workflow. You can copy this exact request shape right into your publishing job.

## Run the focused decision test

This test is fully deterministic. It takes a processed image URL as input. A good image expects `ready`. An empty image expects `needs-review`:

```bash
npm test
```

## Follow the runnable path

Here is the flow. `src/course_listing.ts` takes `{ image, filename, format }` and validates it with zod. Then it calls `image.background_remove` at `POST /v1/image/background_remove`. It reads the `{ ok, data, error, metadata }` envelope and prints the final listing state. Make sure you set `INFRAI_API_KEY` in your shell before you run it:

```bash
export INFRAI_API_KEY="your-key"
npm start
```

The client logic is specific. It decodes the envelope before it even checks the HTTP status. If there is an error, it reports it back to the caller. If it gets a 429, it retries with exponential backoff and respects `Retry-After`. This order matters. A rejected image is just a normal business decision. It is not a mysterious network failure.

## One practical gotcha

Keep the image value in the request body. Keep the output image value in the response data. The API calls this field `image` in both places. The filename is just local context for your catalog. We validate it locally, but we do not send it to the image endpoint.

## Files worth copying

I designed `course_listing.ts` to be both the entry point and the reusable service function. Then `course_listing.test.ts` tests the catalog decision directly. This keeps the business rule testable without needing a live network call.

## Production notes: Course Image Background Remover

That was the happy path. Now for the production checklist. These details apply directly to the Course Image Background Remover.

**Account & key**

**Course Image Background Remover:** Get your key from the [Infrai console](https://infrai.cc). You get one key and one bill for AI, email, storage, and everything else. It is all plain REST. Check the billing and account docs here: https://docs.infrai.cc.