import { randomUUID } from "node:crypto";
import { PostHog } from "posthog-node";

type AiMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type AiGeneration = {
  distinctId: string;
  traceId: string;
  model: string;
  provider: string;
  input: AiMessage[];
  outputChoices?: AiMessage[];
  inputTokens?: number;
  outputTokens?: number;
  latency: number;
  httpStatus?: number;
  isError?: boolean;
  error?: string;
  temperature?: number;
  maxTokens?: number;
  stopReason?: string;
};

const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
const aiSessionId = `process-${process.pid}-${randomUUID()}`;

let posthogAiClient: PostHog | null = null;

if (!projectToken) {
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN is configured"
    );
  }
} else if (!host) {
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      "NEXT_PUBLIC_POSTHOG_HOST variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once NEXT_PUBLIC_POSTHOG_HOST is configured"
    );
  }
} else {
  posthogAiClient = new PostHog(projectToken, {
    host,
    privacyMode: false,
    enableExceptionAutocapture: false,
    flushAt: 1,
    flushInterval: 0,
    requestTimeout: 2000,
    fetchRetryCount: 0,
  });
}

export async function captureAiGeneration(generation: AiGeneration): Promise<void> {
  if (!posthogAiClient) return;

  try {
    posthogAiClient.capture({
      distinctId: generation.distinctId,
      event: "$ai_generation",
      properties: {
        $ai_trace_id: generation.traceId,
        $ai_session_id: aiSessionId,
        $ai_span_id: randomUUID(),
        $ai_span_name: "lookup_word",
        $ai_model: generation.model,
        $ai_provider: generation.provider,
        $ai_input: generation.input,
        $ai_output_choices: generation.outputChoices,
        $ai_input_tokens: generation.inputTokens,
        $ai_output_tokens: generation.outputTokens,
        $ai_latency: generation.latency,
        $ai_http_status: generation.httpStatus,
        $ai_is_error: generation.isError,
        $ai_error: generation.error,
        $ai_temperature: generation.temperature,
        $ai_max_tokens: generation.maxTokens,
        $ai_stop_reason: generation.stopReason,
      },
    });

    await posthogAiClient.flush().catch(() => undefined);
  } catch {
    // AI observability must not affect a completed lookup.
  }
}
