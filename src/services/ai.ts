import { z } from 'zod';
import {
  CareerIdeasInput,
  CareerIdeasOutput,
  CareerIdeasOutputSchema,
  ResumeReviewOutput,
  ResumeReviewOutputSchema,
  MockInterviewQuestionsOutput,
  MockInterviewQuestionsOutputSchema,
  AnswerEvaluationOutput,
  AnswerEvaluationOutputSchema,
  LearningRoadmapOutput,
  LearningRoadmapOutputSchema,
} from '../types/ai';

const inFlightRequests = new Set<string>();
const lastCallTimestamp = new Map<string, number>();
const COOLDOWN_MS = 2000;

async function postWithZodRetry<T>(
  endpoint: string,
  payload: unknown,
  schema: z.ZodType<T>
): Promise<T> {
  if (inFlightRequests.has(endpoint)) {
    throw new Error('A request is already running. Please wait a moment.');
  }

  const now = Date.now();
  const prev = lastCallTimestamp.get(endpoint) || 0;
  if (now - prev < COOLDOWN_MS) {
    throw new Error('Please wait a couple of seconds before requesting again.');
  }

  inFlightRequests.add(endpoint);
  lastCallTimestamp.set(endpoint, now);

  try {
    let lastError: Error | null = null;
    // Validate at runtime with Zod; on invalid output, retry once automatically
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const body = await res.json().catch(() => null);
        if (!res.ok) {
          const msg =
            body && typeof body === 'object' && 'error' in body && typeof body.error === 'string'
              ? body.error
              : `AI service error (HTTP ${res.status}).`;
          throw new Error(msg);
        }

        const parsed = schema.safeParse(body);
        if (parsed.success) {
          return parsed.data;
        }
        lastError = new Error('AI returned an unexpected format. Please click Retry.');
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error('Could not reach AI service.');
      }
    }
    throw lastError || new Error('Could not complete AI request. Please click Retry.');
  } finally {
    inFlightRequests.delete(endpoint);
  }
}

export async function getCareerIdeas(input: CareerIdeasInput): Promise<CareerIdeasOutput> {
  return postWithZodRetry('/api/ai/career-recommendations', input, CareerIdeasOutputSchema);
}

export async function reviewResume(
  resume: unknown,
  options?: { targetRole?: string; experienceLevel?: string }
): Promise<ResumeReviewOutput> {
  return postWithZodRetry(
    '/api/ai/resume-review',
    { resume, ...options },
    ResumeReviewOutputSchema
  );
}

export async function generateInterviewQuestions(params: {
  role: string;
  field: string;
  difficulty: string;
  type: 'technical' | 'hr' | 'mixed' | 'viva';
}): Promise<MockInterviewQuestionsOutput> {
  return postWithZodRetry(
    '/api/ai/interview-questions',
    params,
    MockInterviewQuestionsOutputSchema
  );
}

export async function evaluateAnswer(
  question: string,
  userAnswer: string
): Promise<AnswerEvaluationOutput> {
  return postWithZodRetry(
    '/api/ai/interview-evaluate',
    { question: question.trim().slice(0, 500), userAnswer: userAnswer.trim().slice(0, 2500) },
    AnswerEvaluationOutputSchema
  );
}

export async function generateRoadmap(params: {
  targetRole: string;
  currentSkills: string[];
  weeksAvailable: number;
  hoursPerWeek: number;
  budget: 'free' | 'low' | 'flexible';
}): Promise<LearningRoadmapOutput> {
  return postWithZodRetry('/api/ai/learning-roadmap', params, LearningRoadmapOutputSchema);
}
