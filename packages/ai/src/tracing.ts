import { Langfuse } from "langfuse";

let _langfuse: Langfuse | null = null;

function getLangfuse(): Langfuse | null {
  if (_langfuse) return _langfuse;

  const secretKey = process.env.LANGFUSE_SECRET_KEY;
  const publicKey = process.env.LANGFUSE_PUBLIC_KEY;
  if (!secretKey || !publicKey || secretKey.startsWith("sk-lf-...")) {
    return null;
  }

  _langfuse = new Langfuse({
    secretKey,
    publicKey,
    baseUrl: process.env.LANGFUSE_HOST ?? "https://cloud.langfuse.com",
  });
  return _langfuse;
}

export function createTrace(name: string, metadata?: Record<string, unknown>) {
  const lf = getLangfuse();
  if (!lf) return null;
  return lf.trace({ name, metadata });
}

export function traceGeneration(
  trace: ReturnType<typeof createTrace>,
  opts: {
    name: string;
    model: string;
    input: unknown;
    output: unknown;
    promptTokens?: number;
    completionTokens?: number;
    latencyMs?: number;
  },
) {
  if (!trace) return;
  trace.generation({
    name: opts.name,
    model: opts.model,
    input: opts.input,
    output: opts.output,
    usage: {
      promptTokens: opts.promptTokens,
      completionTokens: opts.completionTokens,
    },
    metadata: opts.latencyMs ? { latencyMs: opts.latencyMs } : undefined,
  });
}

export async function flushTraces() {
  const lf = getLangfuse();
  if (lf) await lf.flushAsync();
}
