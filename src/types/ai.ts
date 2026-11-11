import { z } from 'zod';

// A) Career Ideas
export interface CareerIdeasInput {
  educationLevel: string;
  fieldOfStudy: string;
  currentStatus: string;
  experienceYears: number;
  interests: string[];
  skills: string[];
  preferredWorkStyle: string;
  country: string;
  currency: string;
}

export const CareerIdeaItemSchema = z.object({
  title: z.string().min(1),
  category: z.enum(['best-fit', 'adjacent', 'stretch']).catch('best-fit'),
  matchPercent: z.number().min(0).max(100),
  whyItFits: z.string().min(1),
  requiredSkills: z.array(z.string()),
  missingSkills: z.array(z.string()),
  typicalEntryRoutes: z.array(z.string()).default(['Entry-level role or apprenticeship']),
  approxSalaryRange: z.string().min(1),
  growthOutlook: z.string().min(1),
});

export const CareerIdeasOutputSchema = z.object({
  careers: z.array(CareerIdeaItemSchema).min(1).max(6),
});

export type CareerIdeaItem = z.infer<typeof CareerIdeaItemSchema>;
export type CareerIdeasOutput = z.infer<typeof CareerIdeasOutputSchema>;

// B) Resume Review
export const ResumeSuggestionSchema = z.object({
  section: z.string().min(1),
  issue: z.string().min(1),
  improvedText: z.string().min(1),
});

export const ResumeReviewOutputSchema = z.object({
  score: z.number().min(0).max(100),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  suggestions: z.array(ResumeSuggestionSchema),
  keywordsMissing: z.array(z.string()).default([]),
});

export type ResumeReviewSuggestion = z.infer<typeof ResumeSuggestionSchema>;
export type ResumeReviewOutput = z.infer<typeof ResumeReviewOutputSchema>;

// C) Mock Interview
export const InterviewQuestionSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(1),
  type: z.string().min(1),
  idealAnswerPoints: z.array(z.string()),
});

export const MockInterviewQuestionsOutputSchema = z.object({
  questions: z.array(InterviewQuestionSchema).min(1).max(8),
});

export const AnswerEvaluationOutputSchema = z.object({
  score: z.number().min(0).max(10),
  feedback: z.string().min(1),
  improvedAnswer: z.string().min(1),
});

export type InterviewQuestion = z.infer<typeof InterviewQuestionSchema>;
export type MockInterviewQuestionsOutput = z.infer<typeof MockInterviewQuestionsOutputSchema>;
export type AnswerEvaluationOutput = z.infer<typeof AnswerEvaluationOutputSchema>;

// D) Learning Roadmap
export const RoadmapResourceSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
});

export const RoadmapPhaseSchema = z.object({
  title: z.string().min(1),
  weeks: z.string().min(1),
  topics: z.array(z.string()),
  practiceIdea: z.string().min(1),
  freeResources: z.array(RoadmapResourceSchema),
});

export const LearningRoadmapOutputSchema = z.object({
  phases: z.array(RoadmapPhaseSchema).min(1),
});

export type RoadmapPhase = z.infer<typeof RoadmapPhaseSchema>;
export type LearningRoadmapOutput = z.infer<typeof LearningRoadmapOutputSchema>;
