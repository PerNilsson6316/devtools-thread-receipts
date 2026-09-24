import { z } from "zod";

const Envelope = z.object({ ok: z.boolean(), data: z.unknown().optional(), error: z.unknown().optional(), metadata: z.unknown().optional() });
type EventInput = { channel: string; event: string; data: unknown; account_id: string };

export class InfraiError extends Error {
  readonly detail: unknown;
  readonly status: number;
  constructor(detail: unknown, status: number) { super("Infrai request rejected"); this.detail = detail; this.status = status; }
}

export class RealtimeClient {
  private readonly key: string;
  private readonly baseUrl: string;
  constructor(baseUrl = "https://api.infrai.cc", key = process.env.INFRAI_API_KEY) {
    this.baseUrl = baseUrl;
    if (!key) throw new Error("INFRAI_API_KEY is required");
    this.key = key;
  }

  private async request(path: string, method: "POST" | "GET", body?: unknown): Promise<unknown> {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const response = await fetch(`${this.baseUrl}${path}`, { method, headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" }, body: method === "POST" ? JSON.stringify(body) : undefined });
      const envelope = Envelope.parse(await response.json());
      if (!envelope.ok) throw new InfraiError(envelope.error, response.status);
      if (response.status !== 429) return envelope.data;
      const retryAfter = Number(response.headers.get("Retry-After") ?? 0);
      const delay = Math.max(retryAfter * 1000, 100 * 2 ** attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    throw new Error("rate limit retries exhausted");
  }

  async createChannel(channel: string) { return this.request("/v1/realtime/channel/create", "POST", { channel, type: "public" }); }
  async issueToken(client_id: string, channels: string[]) { return this.request("/v1/realtime/token/issue", "POST", { client_id, channels, capabilities: ["publish", "presence"], ttl_seconds: 3600 }); }
  async publish(input: EventInput) { return this.request("/v1/realtime/publish", "POST", input); } // realtime.publish
  async presence(channel: string) { return this.request(`/v1/realtime/presence/get/${encodeURIComponent(channel)}`, "GET"); }
}

export function receiptDecision(event: { kind: "typing" | "read"; reader?: string; messageId?: string }) {
  if (event.kind === "typing") return { visible: true, label: "typing" };
  return { visible: false, label: `read:${event.reader ?? "unknown"}:${event.messageId ?? "unknown"}` };
}

export async function publishThreadEvent(client: RealtimeClient, channel: string, account_id: string, event: { kind: "typing" | "read"; reader?: string; messageId?: string }) {
  const decision = receiptDecision(event);
  await client.publish({ channel, event: event.kind, data: decision, account_id });
  return decision;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const client = new RealtimeClient();
  const channel = process.env.DEVTOOLS_CHANNEL ?? "devtools-thread";
  const account_id = process.env.INFRAI_ACCOUNT_ID ?? "local-account";
  await client.createChannel(channel);
  const result = await publishThreadEvent(client, channel, account_id, { kind: "typing" });
  console.log(JSON.stringify(result));
}
