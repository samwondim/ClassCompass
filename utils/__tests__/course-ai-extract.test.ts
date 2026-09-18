import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockParse } = vi.hoisted(() => ({ mockParse: vi.fn() }));

vi.mock("@anthropic-ai/sdk", async () => {
  const actual = await vi.importActual<typeof import("@anthropic-ai/sdk")>("@anthropic-ai/sdk");
  class MockAnthropic {
    messages = { parse: mockParse };
  }
  // The real error classes (Anthropic.RateLimitError, etc.) are inherited statics
  // (defined on BaseAnthropic, not own properties of the default export), so
  // Object.assign misses them - mirror the prototype chain instead so `instanceof`
  // checks in the module under test keep resolving against the real classes.
  Object.setPrototypeOf(MockAnthropic, actual.default);
  return { ...actual, default: MockAnthropic };
});

import Anthropic from "@anthropic-ai/sdk";
import { AiExtractionError, extractCourseFromText, MAX_INPUT_CHARS } from "@/utils/course-ai-extract";

const validDraft = {
  course_name: "የደግ ሳምራዊው",
  verse: "ሉቃስ 10:25-37",
  course_description: "description",
  objectives: ["obj 1"],
  age_group: "8-10",
  duration_minutes: 45,
  lesson_plan: {
    opening: "opening",
    teaching: "teaching",
    application: "application",
    activity: "activity",
    memory_verse: "verse",
    closing: "closing",
  },
};

describe("extractCourseFromText", () => {
  beforeEach(() => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
    mockParse.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns an empty draft without calling the API for blank input", async () => {
    const draft = await extractCourseFromText("   \n  ");
    expect(draft.course_name).toBeNull();
    expect(draft.objectives).toEqual([]);
    expect(mockParse).not.toHaveBeenCalled();
  });

  it("returns the parsed draft on success", async () => {
    mockParse.mockResolvedValueOnce({ parsed_output: validDraft });

    const draft = await extractCourseFromText("some lesson text");

    expect(draft).toEqual(validDraft);
    expect(mockParse).toHaveBeenCalledTimes(1);
    const call = mockParse.mock.calls[0][0];
    expect(call.model).toBe("claude-opus-5");
    expect(call.output_config.effort).toBe("low");
  });

  it("truncates input beyond MAX_INPUT_CHARS before sending it", async () => {
    mockParse.mockResolvedValueOnce({ parsed_output: validDraft });

    await extractCourseFromText("a".repeat(MAX_INPUT_CHARS + 500));

    const sentContent = mockParse.mock.calls[0][0].messages[0].content;
    expect(sentContent.length).toBe(MAX_INPUT_CHARS);
  });

  it("throws a non-retryable error when ANTHROPIC_API_KEY is unset", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");

    await expect(extractCourseFromText("some text")).rejects.toMatchObject({
      retryable: false,
    });
    expect(mockParse).not.toHaveBeenCalled();
  });

  it("throws a non-retryable error when structured output parsing fails", async () => {
    mockParse.mockResolvedValueOnce({ parsed_output: null });

    await expect(extractCourseFromText("some text")).rejects.toMatchObject({
      retryable: false,
    });
  });

  it("wraps AuthenticationError as non-retryable", async () => {
    mockParse.mockRejectedValueOnce(new Anthropic.AuthenticationError(401, {}, "bad key", new Headers(), null));

    const error = await extractCourseFromText("x").catch((e) => e);
    expect(error).toBeInstanceOf(AiExtractionError);
    expect(error.retryable).toBe(false);
  });

  it("wraps RateLimitError as retryable", async () => {
    mockParse.mockRejectedValueOnce(new Anthropic.RateLimitError(429, {}, "rate limited", new Headers(), null));

    const error = await extractCourseFromText("x").catch((e) => e);
    expect(error).toBeInstanceOf(AiExtractionError);
    expect(error.retryable).toBe(true);
  });

  it("wraps APIConnectionError as retryable", async () => {
    mockParse.mockRejectedValueOnce(new Anthropic.APIConnectionError({ message: "network down" }));

    const error = await extractCourseFromText("x").catch((e) => e);
    expect(error).toBeInstanceOf(AiExtractionError);
    expect(error.retryable).toBe(true);
  });

  it("wraps a 5xx APIError as retryable and a 400 APIError as non-retryable", async () => {
    mockParse.mockRejectedValueOnce(new Anthropic.InternalServerError(500, {}, "server error", new Headers(), null));
    const serverError = await extractCourseFromText("x").catch((e) => e);
    expect(serverError.retryable).toBe(true);

    mockParse.mockRejectedValueOnce(new Anthropic.BadRequestError(400, {}, "bad request", new Headers(), null));
    const badRequestError = await extractCourseFromText("x").catch((e) => e);
    expect(badRequestError.retryable).toBe(false);
  });
});
