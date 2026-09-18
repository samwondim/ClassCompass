// Uses the Claude API to turn the raw text of an uploaded .docx lesson into a
// structured Course draft. The result is always a human-reviewable draft - callers
// must let the admin/manager edit it before saving, never persist it directly.

import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';

const CourseDraftSchema = z.object({
  course_name: z.string().nullable(),
  verse: z.string().nullable(),
  course_description: z.string().nullable(),
  objectives: z.array(z.string()),
  age_group: z.string().nullable(),
  duration_minutes: z.number().nullable(),
  lesson_plan: z.object({
    opening: z.string().nullable(),
    teaching: z.string().nullable(),
    application: z.string().nullable(),
    activity: z.string().nullable(),
    memory_verse: z.string().nullable(),
    closing: z.string().nullable(),
  }),
});

export type ExtractedCourseDraft = z.infer<typeof CourseDraftSchema>;

export class AiExtractionError extends Error {
  retryable: boolean;

  constructor(message: string, retryable = false) {
    super(message);
    this.name = 'AiExtractionError';
    this.retryable = retryable;
  }
}

const EMPTY_DRAFT: ExtractedCourseDraft = {
  course_name: null,
  verse: null,
  course_description: null,
  objectives: [],
  age_group: null,
  duration_minutes: null,
  lesson_plan: {
    opening: null,
    teaching: null,
    application: null,
    activity: null,
    memory_verse: null,
    closing: null,
  },
};

// Generous cap on a single lesson document - Claude's context window comfortably
// covers this, this just keeps cost/latency bounded for a pathological upload.
export const MAX_INPUT_CHARS = 20000;

const SYSTEM_PROMPT = `You extract structured Sunday School lesson data from raw document text.
Only use information present in the source text. If a field cannot be determined, use null (or an empty array for objectives). Never invent facts, verses, or ages that are not in the text. Preserve the original language of the source text verbatim in every field - the source is most often Amharic; never translate it to English or any other language.`;

function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new AiExtractionError('ANTHROPIC_API_KEY is not configured');
  }
  return new Anthropic();
}

export async function extractCourseFromText(documentText: string): Promise<ExtractedCourseDraft> {
  const trimmed = documentText.trim();
  if (!trimmed) return EMPTY_DRAFT;

  const input = trimmed.slice(0, MAX_INPUT_CHARS);

  try {
    const response = await getClient().messages.parse({
      model: 'claude-opus-5',
      max_tokens: 16000,
      output_config: { effort: 'low', format: zodOutputFormat(CourseDraftSchema) },
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: input }],
    });

    if (!response.parsed_output) {
      throw new AiExtractionError('AI extraction did not return a parseable result');
    }
    return response.parsed_output;
  } catch (error) {
    if (error instanceof AiExtractionError) throw error;
    if (error instanceof Anthropic.AuthenticationError) {
      throw new AiExtractionError(`AI extraction authentication failed: ${error.message}`);
    }
    if (error instanceof Anthropic.RateLimitError) {
      throw new AiExtractionError(`AI extraction rate limited: ${error.message}`, true);
    }
    if (error instanceof Anthropic.APIConnectionError) {
      throw new AiExtractionError(`AI extraction connection failed: ${error.message}`, true);
    }
    if (error instanceof Anthropic.APIError) {
      throw new AiExtractionError(`AI extraction request failed (${error.status}): ${error.message}`, (error.status ?? 0) >= 500);
    }
    throw new AiExtractionError(`AI extraction failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
