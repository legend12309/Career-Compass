import { z } from 'zod';

export type Role = 'user' | 'admin';

export type UserStage =
  | 'school (class 9-12)'
  | 'undergraduate'
  | 'postgraduate'
  | 'diploma/vocational'
  | 'fresher'
  | 'working'
  | 'switching careers'
  | 'returning after a break'
  | 'self-taught';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  onboarded: boolean;
  createdAt: string;
}

export interface Profile {
  userId: string;
  currentStatus: UserStage;
  educationLevel: string;
  fieldOfStudy: string;
  experienceYears: number;
  interests: string[];
  careerGoal: string;
  country: string;
  currency: string;
  bio: string;
  preferredWorkStyle?: string;
}

export const ProfileSchema = z.object({
  currentStatus: z.string().min(1, 'Please select your current stage.'),
  educationLevel: z.string().trim().min(2, 'Please enter your education level.').max(150),
  fieldOfStudy: z.string().trim().min(2, 'Please enter your field of study or work.').max(150),
  experienceYears: z.number().min(0, 'Experience cannot be negative.').max(60),
  interests: z.array(z.string().trim().min(1).max(80)).min(1, 'Please add at least one interest.').max(20),
  careerGoal: z.string().trim().min(2, 'Please enter a career goal or target role.').max(180),
  country: z.string().trim().min(2, 'Please select a country.').max(80),
  currency: z.string().trim().min(2, 'Please select a currency.').max(10),
  bio: z.string().trim().max(1000),
});

export type ResumeMode = 'fresher' | 'experienced' | 'academic';

export type OptionalSectionType =
  | 'volunteering'
  | 'languages'
  | 'achievements'
  | 'publications'
  | 'extracurricular';

export interface OptionalSection {
  type: OptionalSectionType;
  title: string;
  items: string[];
}

export interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  links: string[];
}

export interface EducationItem {
  degree: string;
  institution: string;
  startYear: string;
  endYear: string;
  scoreOrCgpa: string;
}

export interface ExperienceItem {
  role: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface ProjectItem {
  title: string;
  techStack: string[];
  link?: string;
  description: string;
}

export interface Resume {
  userId: string;
  mode: ResumeMode;
  personal: PersonalInfo;
  summary: string;
  education: EducationItem[];
  experience: ExperienceItem[];
  projects: ProjectItem[];
  skills: string[];
  certifications: string[];
  optionalSections: OptionalSection[];
  lastScore?: number;
}

export type SkillCategory = 'technical' | 'soft' | 'domain' | 'language';

export interface Skill {
  id: string;
  userId: string;
  name: string;
  category: SkillCategory;
  level: number; // 1-5
}

export interface Certificate {
  id: string;
  userId: string;
  title: string;
  issuer: string;
  date: string;
  fileDataUrl?: string;
  fileName?: string;
}

export type OpportunityType =
  | 'job'
  | 'internship'
  | 'exam'
  | 'scholarship'
  | 'admission'
  | 'freelance';

export type OpportunityStatus =
  | 'saved'
  | 'applied'
  | 'interview'
  | 'offer'
  | 'rejected'
  | 'closed';

export interface Opportunity {
  id: string;
  userId: string;
  title: string;
  organization: string;
  type: OpportunityType;
  status: OpportunityStatus;
  deadline: string;
  appliedDate: string;
  notes: string;
}

export interface RoadmapPlan {
  id: string;
  userId: string;
  targetRole: string;
  data: {
    phases: {
      title: string;
      weeks: string;
      topics: string[];
      practiceIdea: string;
      freeResources: { name: string; type: string }[];
    }[];
  };
  progress: string[]; // checked topic keys
  createdAt: string;
}

export interface CareerResult {
  userId: string;
  data: {
    careers: {
      title: string;
      category: 'best-fit' | 'adjacent' | 'stretch';
      matchPercent: number;
      whyItFits: string;
      requiredSkills: string[];
      missingSkills: string[];
      typicalEntryRoutes: string[];
      approxSalaryRange: string;
      growthOutlook: string;
    }[];
  };
  createdAt: string;
}

export interface Resource {
  id: string;
  title: string;
  category: string;
  link: string;
  description: string;
  createdBy: string;
}

export interface InterviewSessionState {
  userId: string;
  role: string;
  field: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  type: 'technical' | 'hr' | 'mixed' | 'viva';
  questions: {
    id: string;
    question: string;
    type: string;
    idealAnswerPoints: string[];
  }[];
  currentIndex: number;
  answers: Record<
    string,
    {
      userAnswer: string;
      skipped?: boolean;
      evaluation?: {
        score: number;
        feedback: string;
        improvedAnswer: string;
      };
    }
  >;
  completed: boolean;
  updatedAt: string;
}

export interface DailyQuest {
  id: string;
  title: string;
  xpReward: number;
  completed: boolean;
  link: string;
}

export interface GamificationState {
  userId: string;
  xp: number;
  gems: number;
  streakDays: number;
  lastActiveDate: string;
  level: number;
  levelTitle: string;
  quests: DailyQuest[];
}
