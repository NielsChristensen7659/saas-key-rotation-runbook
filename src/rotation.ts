import { z } from "zod";

const RotationInput = z.object({ oldKeyId: z.string().min(1), graceHours: z.number().int().min(1).max(168) });
export type RotationInput = z.infer<typeof RotationInput>;

type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };

export class InfraiClient {
  private readonly baseUrl: string;
  private readonly key: string;
  constructor(baseUrl: string, key: string) {
    this.baseUrl = baseUrl;
    this.key = key;
  }

  private async request<T>(path: string, method: string, body?: unknown, query?: Record<string, string>): Promise<T> {
    const url = new URL(path, this.baseUrl);
    for (const [name, value] of Object.entries(query ?? {})) url.searchParams.set(name, value);
    for (let attempt = 0; attempt < 4; attempt++) {
      const response = await fetch(url, { method, headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
      const envelope = (await response.json()) as Envelope<T>;
      if (!envelope.ok) throw new Error(envelope.error?.message ?? envelope.error?.code ?? "Infrai request rejected");
      if (response.status === 429 && attempt < 3) {
        const retryAfter = Number(response.headers.get("retry-after"));
        await new Promise((resolve) => setTimeout(resolve, Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt));
        continue;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return envelope.data as T;
    }
    throw new Error("Request retry limit reached");
  }

  createKey() { return this.request<{ id: string; key: string }>("/v1/account/keys/create", "POST", { name: "rotation-check", scopes: ["logs:read"], idempotency_key: crypto.randomUUID() }); }
  rotateKey(input: RotationInput) { const valid = RotationInput.parse(input); return this.request<{ id: string }>(`/v1/account/keys/rotate/${valid.oldKeyId}`, "POST", { grace_hours: valid.graceHours, idempotency_key: crypto.randomUUID() }); }
  searchLogs(term: string) { return this.request<unknown>("/v1/logs/search", "GET", undefined, { q: term }); }
}

export function rotationPlan(input: RotationInput) {
  const valid = RotationInput.parse(input);
  return { action: "rotate", keyId: valid.oldKeyId, graceHours: valid.graceHours, zeroDowntime: valid.graceHours > 0 };
}
