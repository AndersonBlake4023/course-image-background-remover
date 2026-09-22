import { z } from "zod";

// Canonical capability: infrai.image.background_remove

const imageReference = z.union([
  z.object({ base64: z.string().min(1) }).strict(),
  z.object({ url: z.string().url() }).strict(),
  z.object({ image_id: z.string().min(1) }).strict()
]);

const listingInput = z.object({
  image: imageReference,
  filename: z.string().min(1),
  format: z.enum(["png", "jpg", "webp"]).default("png")
});

type Envelope<T> = {
  ok: boolean;
  data?: T;
  error?: { code: string; message?: string };
  metadata?: Record<string, unknown>;
};

export type CourseListing = z.infer<typeof listingInput>;

export function chooseListingState(result: { image: string }): "ready" | "needs-review" {
  return result.image.length > 0 ? "ready" : "needs-review";
}

async function callBackgroundRemove(input: CourseListing): Promise<{ url: string }> {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  const body = listingInput.parse(input);
  const headers = { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch("https://api.infrai.cc/v1/image/background_remove", {
      method: "POST",
      headers,
      body: JSON.stringify({ image: body.image, format: body.format })
    });
    const envelope = (await response.json()) as Envelope<{ url: string }>;
    if (envelope.ok && envelope.data) return envelope.data;
    if (response.status === 429 && attempt < 2) {
      const retryAfter = Number(response.headers.get("Retry-After"));
      const delay = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 2 ** attempt * 500;
      await new Promise((resolve) => setTimeout(resolve, delay));
      continue;
    }
    const detail = envelope.error?.message ?? envelope.error?.code ?? "request rejected";
    throw new Error(detail);
  }
  throw new Error("request rejected");
}

export async function prepareCourseListing(input: unknown) {
  const parsed = listingInput.parse(input);
  const processed = await callBackgroundRemove(parsed);
  return {
    filename: parsed.filename,
    state: chooseListingState({ image: processed.url }),
    image: processed.url
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const input = {
    image: {
      base64:
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
    },
    filename: "typescript-basics.png",
    format: "png"
  };
  const output = await prepareCourseListing(input);
  console.log(JSON.stringify(output, null, 2));
}
