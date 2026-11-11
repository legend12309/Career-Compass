import {
  Profile,
  ProfileSchema,
  Skill,
  Certificate,
  Opportunity,
  Resume,
  RoadmapPlan,
  CareerResult,
  Resource,
  InterviewSessionState,
  GamificationState,
  DailyQuest,
} from '../types';
import { ResumeReviewOutput } from '../types/ai';
import { requireSessionUser, removeCurrentUserRecord } from './auth';

const PROFILES_KEY = 'cc_profiles_v2';
const SKILLS_KEY = 'cc_skills_v2';
const CERTS_KEY = 'cc_certificates_v2';
const OPPS_KEY = 'cc_opportunities_v2';
const RESUMES_KEY = 'cc_resumes_v2';
const ROADMAPS_KEY = 'cc_roadmaps_v2';
const CAREER_RESULTS_KEY = 'cc_career_results_v2';
const RESUME_REVIEWS_KEY = 'cc_resume_reviews_v2';
const INTERVIEW_SESSIONS_KEY = 'cc_interview_sessions_v2';
const RESOURCES_KEY = 'cc_resources_v2';
const GAMIFICATION_KEY = 'cc_gamification_v2';

function readStore<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function writeStore<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err: unknown) {
    if (
      err instanceof DOMException &&
      (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED')
    ) {
      throw new Error(
        'Browser storage is full. Please remove older certificate files or use a smaller file (<450KB).'
      );
    }
    throw new Error('Could not save data to storage.');
  }
}

const DEFAULT_RESOURCES: Resource[] = [
  {
    id: 'res-1',
    title: 'Full-Stack Web & Modern JavaScript Guide (MDN)',
    category: 'Technology & Software',
    link: 'https://developer.mozilla.org/en-US/docs/Learn',
    description:
      'Free, step-by-step web development tutorials covering HTML, CSS, JavaScript, accessibility, and backend fundamentals.',
    createdBy: 'admin-demo-1',
  },
  {
    id: 'res-2',
    title: 'World Health Organization — OpenWHO Learning Courses',
    category: 'Healthcare & Public Health',
    link: 'https://openwho.org/',
    description:
      'Free self-paced courses on public health, clinical care, community nursing, and health administration.',
    createdBy: 'admin-demo-1',
  },
  {
    id: 'res-3',
    title: 'Corporate Finance Institute — Free Accounting & Excel Foundations',
    category: 'Commerce, Finance & Business',
    link: 'https://corporatefinanceinstitute.com/',
    description:
      'Introductory guides on reading financial statements, bookkeeping, spreadsheet modeling, and business analysis.',
    createdBy: 'admin-demo-1',
  },
  {
    id: 'res-4',
    title: 'National Career Service & Skill Training Portal',
    category: 'Skilled Trades, Arts & Vocational',
    link: 'https://www.ncs.gov.in/',
    description:
      'Explore career guides across 3,000+ occupations including design, hospitality, legal services, education, and trades.',
    createdBy: 'admin-demo-1',
  },
];

export function initDbSeed(): void {
  const demoUserId = 'user-demo-1';

  const profiles = readStore<Record<string, Profile>>(PROFILES_KEY, {});
  if (!profiles[demoUserId]) {
    profiles[demoUserId] = {
      userId: demoUserId,
      currentStatus: 'undergraduate',
      educationLevel: 'Undergraduate Degree (BA, BCom, BSc, BTech, BBA, LLB, MBBS, etc.)',
      fieldOfStudy: 'Full-Stack Web Development & Software',
      experienceYears: 1,
      interests: [
        'Full-Stack Development',
        'React & TypeScript',
        'Node.js & REST APIs',
        'Database Design',
        'Accessible User Interfaces',
      ],
      careerGoal: 'Full-Stack Developer building helpful web applications',
      country: 'India',
      currency: 'INR',
      bio: 'Passionate about building clean, accessible web applications with modern JavaScript, TypeScript, React, and Node.js. Completed hands-on projects and eager to grow in a collaborative team.',
      preferredWorkStyle: 'Hybrid or Remote Collaborative Team',
    };
    writeStore(PROFILES_KEY, profiles);
  }

  const skills = readStore<Skill[]>(SKILLS_KEY, []);
  if (!skills.some((s) => s.userId === demoUserId)) {
    const demoSkills: Skill[] = [
      { id: 'sk-1', userId: demoUserId, name: 'JavaScript & TypeScript', category: 'technical', level: 4 },
      { id: 'sk-2', userId: demoUserId, name: 'React & Modern CSS', category: 'technical', level: 4 },
      { id: 'sk-3', userId: demoUserId, name: 'Node.js & REST APIs', category: 'technical', level: 3 },
      { id: 'sk-4', userId: demoUserId, name: 'SQL & Data Modeling', category: 'domain', level: 3 },
      { id: 'sk-5', userId: demoUserId, name: 'Clear Written Communication', category: 'soft', level: 4 },
      { id: 'sk-6', userId: demoUserId, name: 'English & Hindi', category: 'language', level: 5 },
    ];
    writeStore(SKILLS_KEY, [...skills, ...demoSkills]);
  }

  const certs = readStore<Certificate[]>(CERTS_KEY, []);
  if (!certs.some((c) => c.userId === demoUserId)) {
    const demoCerts: Certificate[] = [
      {
        id: 'cert-1',
        userId: demoUserId,
        title: 'Full-Stack Web Development Specialization',
        issuer: 'Open Online Academy',
        date: '2026-05-15',
      },
      {
        id: 'cert-2',
        userId: demoUserId,
        title: 'Relational Database & SQL Essentials',
        issuer: 'National Digital Learning Initiative',
        date: '2026-02-18',
      },
    ];
    writeStore(CERTS_KEY, [...certs, ...demoCerts]);
  }

  const resumes = readStore<Record<string, Resume>>(RESUMES_KEY, {});
  if (!resumes[demoUserId]) {
    resumes[demoUserId] = {
      userId: demoUserId,
      mode: 'fresher',
      personal: {
        name: 'Aarav Mehta',
        email: 'demo@careercompass.org',
        phone: '+91 98765 43210',
        location: 'Bengaluru, India',
        links: ['github.com/aaravmehta-dev', 'linkedin.com/in/aaravmehta'],
      },
      summary:
        'Full-Stack Developer skilled in React, TypeScript, Node.js, and SQL. Experienced in building responsive, accessible web tools and working closely with cross-functional teams.',
      education: [
        {
          degree: 'Undergraduate Degree in Computer Applications & Software',
          institution: 'City College of Arts, Commerce & Science',
          startYear: '2023',
          endYear: '2026',
          scoreOrCgpa: '8.6 CGPA',
        },
      ],
      experience: [
        {
          role: 'Full-Stack Web Intern',
          company: 'BrightPath Digital Studio',
          location: 'Remote',
          startDate: 'May 2026',
          endDate: 'Aug 2026',
          description:
            'Built reusable React UI views and Express API endpoints, cutting page load times by 25% and improving mobile usability.',
        },
      ],
      projects: [
        {
          title: 'Community Clinic Appointment & Health Record Tracker',
          techStack: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
          link: 'github.com/aaravmehta-dev/clinic-tracker',
          description:
            'Designed a lightweight scheduling web app for local clinics to manage patient visits and reduce waiting room queues.',
        },
      ],
      skills: [
        'TypeScript',
        'JavaScript',
        'React',
        'Node.js',
        'Express',
        'SQL',
        'Tailwind CSS',
        'Git',
      ],
      certifications: [
        'Full-Stack Web Development Specialization (2026)',
        'Relational Database & SQL Essentials (2026)',
      ],
      optionalSections: [
        {
          type: 'volunteering',
          title: 'Volunteering',
          items: ['Weekend Digital Literacy Mentor for local high school learners (2025–2026)'],
        },
        {
          type: 'languages',
          title: 'Languages',
          items: ['English (Fluent)', 'Hindi (Native)'],
        },
      ],
      lastScore: 84,
    };
    writeStore(RESUMES_KEY, resumes);
  }

  const opps = readStore<Opportunity[]>(OPPS_KEY, []);
  if (!opps.some((o) => o.userId === demoUserId)) {
    const demoOpps: Opportunity[] = [
      {
        id: 'opp-1',
        userId: demoUserId,
        title: 'Junior Full-Stack Developer',
        organization: 'Zoho Corporation',
        type: 'job',
        status: 'interview',
        deadline: '2026-11-20',
        appliedDate: '2026-10-25',
        notes: 'Completed practical web building round; technical conversation scheduled next week.',
      },
      {
        id: 'opp-2',
        userId: demoUserId,
        title: 'Frontend Web Apprenticeship',
        organization: 'Freshworks',
        type: 'internship',
        status: 'applied',
        deadline: '2026-11-28',
        appliedDate: '2026-11-01',
        notes: 'Submitted single-column PDF resume and portfolio link.',
      },
      {
        id: 'opp-3',
        userId: demoUserId,
        title: 'Open Source Fellowship Grant',
        organization: 'Public Digital Foundation',
        type: 'scholarship',
        status: 'saved',
        deadline: '2026-11-16',
        appliedDate: '2026-11-05',
        notes: 'Prepare 500-word project proposal before the deadline.',
      },
    ];
    writeStore(OPPS_KEY, [...opps, ...demoOpps]);
  }

  const resources = readStore<Resource[]>(RESOURCES_KEY, []);
  if (resources.length === 0) {
    writeStore(RESOURCES_KEY, DEFAULT_RESOURCES);
  }
}

// ============================================================================
// SESSION-SCOPED DATA ACCESS (Never accepts userId from the UI)
// ============================================================================

export async function getProfile(): Promise<Profile | null> {
  initDbSeed();
  const user = await requireSessionUser();
  const profiles = readStore<Record<string, Profile>>(PROFILES_KEY, {});
  return profiles[user.id] || null;
}

export async function saveProfile(
  input: Omit<Profile, 'userId'>
): Promise<Profile> {
  const user = await requireSessionUser();
  const parsed = ProfileSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || 'Please check your profile fields.');
  }

  const profiles = readStore<Record<string, Profile>>(PROFILES_KEY, {});
  const updated: Profile = {
    ...input,
    userId: user.id,
  };
  profiles[user.id] = updated;
  writeStore(PROFILES_KEY, profiles);
  return updated;
}

export async function listSkills(): Promise<Skill[]> {
  initDbSeed();
  const user = await requireSessionUser();
  const all = readStore<Skill[]>(SKILLS_KEY, []);
  return all.filter((s) => s.userId === user.id);
}

export async function saveSkill(
  input: Omit<Skill, 'userId' | 'id'> & { id?: string }
): Promise<Skill> {
  const user = await requireSessionUser();
  const cleanName = input.name.trim().slice(0, 80);
  if (!cleanName) throw new Error('Skill name cannot be empty.');
  const clampedLevel = Math.min(5, Math.max(1, Math.round(Number(input.level) || 3)));

  const all = readStore<Skill[]>(SKILLS_KEY, []);
  const duplicate = all.find(
    (s) =>
      s.userId === user.id &&
      s.id !== input.id &&
      s.name.trim().toLowerCase() === cleanName.toLowerCase()
  );
  if (duplicate) {
    throw new Error(`"${cleanName}" is already in your skills list.`);
  }

  const record: Skill = {
    id: input.id || `sk-${Date.now()}`,
    userId: user.id,
    name: cleanName,
    category: input.category,
    level: clampedLevel,
  };

  const idx = all.findIndex((s) => s.id === record.id && s.userId === user.id);
  if (idx >= 0) {
    all[idx] = record;
  } else {
    all.push(record);
  }
  writeStore(SKILLS_KEY, all);
  return record;
}

export async function deleteSkill(id: string): Promise<boolean> {
  const user = await requireSessionUser();
  const all = readStore<Skill[]>(SKILLS_KEY, []);
  const filtered = all.filter((s) => !(s.id === id && s.userId === user.id));
  writeStore(SKILLS_KEY, filtered);
  return filtered.length !== all.length;
}

export async function listCertificates(): Promise<Certificate[]> {
  initDbSeed();
  const user = await requireSessionUser();
  const all = readStore<Certificate[]>(CERTS_KEY, []);
  return all.filter((c) => c.userId === user.id);
}

export async function saveCertificate(
  input: Omit<Certificate, 'userId' | 'id'> & { id?: string }
): Promise<Certificate> {
  const user = await requireSessionUser();
  const record: Certificate = {
    ...input,
    id: input.id || `cert-${Date.now()}`,
    userId: user.id,
    title: input.title.trim().slice(0, 120),
    issuer: input.issuer.trim().slice(0, 120),
  };
  const all = readStore<Certificate[]>(CERTS_KEY, []);
  const idx = all.findIndex((c) => c.id === record.id && c.userId === user.id);
  if (idx >= 0) {
    all[idx] = record;
  } else {
    all.push(record);
  }
  writeStore(CERTS_KEY, all);
  return record;
}

export async function deleteCertificate(id: string): Promise<boolean> {
  const user = await requireSessionUser();
  const all = readStore<Certificate[]>(CERTS_KEY, []);
  const filtered = all.filter((c) => !(c.id === id && c.userId === user.id));
  writeStore(CERTS_KEY, filtered);
  return filtered.length !== all.length;
}

export async function listOpportunities(): Promise<Opportunity[]> {
  initDbSeed();
  const user = await requireSessionUser();
  const all = readStore<Opportunity[]>(OPPS_KEY, []);
  return all.filter((o) => o.userId === user.id);
}

export async function saveOpportunity(
  input: Omit<Opportunity, 'userId' | 'id'> & { id?: string }
): Promise<Opportunity> {
  const user = await requireSessionUser();
  const record: Opportunity = {
    ...input,
    id: input.id || `opp-${Date.now()}`,
    userId: user.id,
    title: input.title.trim().slice(0, 120),
    organization: input.organization.trim().slice(0, 120),
    notes: (input.notes || '').trim().slice(0, 500),
  };
  const all = readStore<Opportunity[]>(OPPS_KEY, []);
  const idx = all.findIndex((o) => o.id === record.id && o.userId === user.id);
  if (idx >= 0) {
    all[idx] = record;
  } else {
    all.unshift(record);
  }
  writeStore(OPPS_KEY, all);
  return record;
}

export async function deleteOpportunity(id: string): Promise<boolean> {
  const user = await requireSessionUser();
  const all = readStore<Opportunity[]>(OPPS_KEY, []);
  const filtered = all.filter((o) => !(o.id === id && o.userId === user.id));
  writeStore(OPPS_KEY, filtered);
  return filtered.length !== all.length;
}

export async function getResume(): Promise<Resume | null> {
  initDbSeed();
  const user = await requireSessionUser();
  const store = readStore<Record<string, Resume>>(RESUMES_KEY, {});
  return store[user.id] || null;
}

export async function saveResume(input: Omit<Resume, 'userId'>): Promise<Resume> {
  const user = await requireSessionUser();
  const store = readStore<Record<string, Resume>>(RESUMES_KEY, {});
  const record: Resume = { ...input, userId: user.id };
  store[user.id] = record;
  writeStore(RESUMES_KEY, store);
  return record;
}

export async function getLastResumeReview(): Promise<ResumeReviewOutput | null> {
  const user = await requireSessionUser();
  const store = readStore<Record<string, ResumeReviewOutput>>(RESUME_REVIEWS_KEY, {});
  return store[user.id] || null;
}

export async function saveResumeReview(review: ResumeReviewOutput): Promise<void> {
  const user = await requireSessionUser();
  const store = readStore<Record<string, ResumeReviewOutput>>(RESUME_REVIEWS_KEY, {});
  store[user.id] = review;
  writeStore(RESUME_REVIEWS_KEY, store);
}

export async function getCareerResult(): Promise<CareerResult | null> {
  const user = await requireSessionUser();
  const store = readStore<Record<string, CareerResult>>(CAREER_RESULTS_KEY, {});
  return store[user.id] || null;
}

export async function saveCareerResult(data: CareerResult['data']): Promise<CareerResult> {
  const user = await requireSessionUser();
  const store = readStore<Record<string, CareerResult>>(CAREER_RESULTS_KEY, {});
  const record: CareerResult = {
    userId: user.id,
    data,
    createdAt: new Date().toISOString(),
  };
  store[user.id] = record;
  writeStore(CAREER_RESULTS_KEY, store);
  return record;
}

export async function getRoadmap(): Promise<RoadmapPlan | null> {
  const user = await requireSessionUser();
  const store = readStore<Record<string, RoadmapPlan>>(ROADMAPS_KEY, {});
  return store[user.id] || null;
}

export async function saveRoadmap(
  input: Omit<RoadmapPlan, 'userId'>
): Promise<RoadmapPlan> {
  const user = await requireSessionUser();
  const store = readStore<Record<string, RoadmapPlan>>(ROADMAPS_KEY, {});
  const record: RoadmapPlan = { ...input, userId: user.id };
  store[user.id] = record;
  writeStore(ROADMAPS_KEY, store);
  return record;
}

export async function getInterviewSession(): Promise<InterviewSessionState | null> {
  const user = await requireSessionUser();
  const store = readStore<Record<string, InterviewSessionState>>(INTERVIEW_SESSIONS_KEY, {});
  return store[user.id] || null;
}

export async function saveInterviewSession(
  input: Omit<InterviewSessionState, 'userId'>
): Promise<InterviewSessionState> {
  const user = await requireSessionUser();
  const store = readStore<Record<string, InterviewSessionState>>(INTERVIEW_SESSIONS_KEY, {});
  const record: InterviewSessionState = { ...input, userId: user.id };
  store[user.id] = record;
  writeStore(INTERVIEW_SESSIONS_KEY, store);
  return record;
}

export async function clearInterviewSession(): Promise<void> {
  const user = await requireSessionUser();
  const store = readStore<Record<string, InterviewSessionState>>(INTERVIEW_SESSIONS_KEY, {});
  delete store[user.id];
  writeStore(INTERVIEW_SESSIONS_KEY, store);
}

// ============================================================================
// DUOLINGO-STYLE GAMIFICATION & QUEST ENGINE
// ============================================================================

const DEFAULT_DAILY_QUESTS: DailyQuest[] = [
  { id: 'q1', title: 'Complete 1 Roadmap Lesson', xpReward: 50, completed: true, link: '/roadmap' },
  { id: 'q2', title: 'Practice 1 Mock Interview Question', xpReward: 30, completed: false, link: '/interview' },
  { id: 'q3', title: 'Review or Update ATS Resume', xpReward: 25, completed: true, link: '/resume' },
  { id: 'q4', title: 'Explore 1 New Career Pathway', xpReward: 20, completed: false, link: '/career-ideas' },
];

function getLevelTitle(level: number): string {
  if (level <= 1) return 'Career Novice';
  if (level === 2) return 'Eager Explorer';
  if (level === 3) return 'Skill Apprentice';
  if (level === 4) return 'Career Pathfinder';
  if (level === 5) return 'Master Strategist';
  return 'Legendary Pioneer';
}

export async function getGamificationState(): Promise<GamificationState> {
  const user = await requireSessionUser();
  const store = readStore<Record<string, GamificationState>>(GAMIFICATION_KEY, {});
  const existing = store[user.id];

  if (existing) {
    return existing;
  }

  // Default seeded gamification state for rich instant engagement
  const defaultState: GamificationState = {
    userId: user.id,
    xp: 420,
    gems: 180,
    streakDays: 5,
    lastActiveDate: new Date().toISOString().slice(0, 10),
    level: 4,
    levelTitle: getLevelTitle(4),
    quests: DEFAULT_DAILY_QUESTS,
  };

  store[user.id] = defaultState;
  writeStore(GAMIFICATION_KEY, store);
  return defaultState;
}

export async function awardXp(amount: number, _reason: string): Promise<GamificationState> {
  const user = await requireSessionUser();
  const store = readStore<Record<string, GamificationState>>(GAMIFICATION_KEY, {});
  const current = store[user.id] || (await getGamificationState());

  const nextXp = current.xp + amount;
  const nextGems = current.gems + Math.round(amount / 2);
  const nextLevel = Math.max(1, Math.floor(nextXp / 100) + 1);

  const updated: GamificationState = {
    ...current,
    xp: nextXp,
    gems: nextGems,
    level: nextLevel,
    levelTitle: getLevelTitle(nextLevel),
    lastActiveDate: new Date().toISOString().slice(0, 10),
  };

  store[user.id] = updated;
  writeStore(GAMIFICATION_KEY, store);
  return updated;
}

export async function toggleQuest(questId: string): Promise<GamificationState> {
  const user = await requireSessionUser();
  const store = readStore<Record<string, GamificationState>>(GAMIFICATION_KEY, {});
  const current = store[user.id] || (await getGamificationState());

  let xpToAdd = 0;
  const updatedQuests = current.quests.map((q) => {
    if (q.id === questId) {
      const nextState = !q.completed;
      if (nextState) xpToAdd += q.xpReward;
      return { ...q, completed: nextState };
    }
    return q;
  });

  const nextXp = current.xp + xpToAdd;
  const nextLevel = Math.max(1, Math.floor(nextXp / 100) + 1);

  const updated: GamificationState = {
    ...current,
    xp: nextXp,
    level: nextLevel,
    levelTitle: getLevelTitle(nextLevel),
    quests: updatedQuests,
  };

  store[user.id] = updated;
  writeStore(GAMIFICATION_KEY, store);
  return updated;
}

// ============================================================================
// PRIVACY: EXPORT MY DATA (JSON) & DELETE MY ACCOUNT AND ALL DATA
// ============================================================================

export async function exportMyDataAsJson(): Promise<string> {
  const user = await requireSessionUser();
  const [profile, skills, certificates, opportunities, resume, roadmap, careerResult, gamification] =
    await Promise.all([
      getProfile(),
      listSkills(),
      listCertificates(),
      listOpportunities(),
      getResume(),
      getRoadmap(),
      getCareerResult(),
      getGamificationState(),
    ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    account: user,
    profile,
    skills,
    certificates,
    resume,
    careerIdeas: careerResult,
    roadmap,
    opportunities,
    gamification,
  };

  return JSON.stringify(payload, null, 2);
}

export async function deleteMyAccountAndAllData(): Promise<void> {
  const user = await requireSessionUser();
  const uid = user.id;

  const profiles = readStore<Record<string, Profile>>(PROFILES_KEY, {});
  delete profiles[uid];
  writeStore(PROFILES_KEY, profiles);

  const resumes = readStore<Record<string, Resume>>(RESUMES_KEY, {});
  delete resumes[uid];
  writeStore(RESUMES_KEY, resumes);

  const reviews = readStore<Record<string, ResumeReviewOutput>>(RESUME_REVIEWS_KEY, {});
  delete reviews[uid];
  writeStore(RESUME_REVIEWS_KEY, reviews);

  const roadmaps = readStore<Record<string, RoadmapPlan>>(ROADMAPS_KEY, {});
  delete roadmaps[uid];
  writeStore(ROADMAPS_KEY, roadmaps);

  const careerResults = readStore<Record<string, CareerResult>>(CAREER_RESULTS_KEY, {});
  delete careerResults[uid];
  writeStore(CAREER_RESULTS_KEY, careerResults);

  const sessions = readStore<Record<string, InterviewSessionState>>(INTERVIEW_SESSIONS_KEY, {});
  delete sessions[uid];
  writeStore(INTERVIEW_SESSIONS_KEY, sessions);

  const gamification = readStore<Record<string, GamificationState>>(GAMIFICATION_KEY, {});
  delete gamification[uid];
  writeStore(GAMIFICATION_KEY, gamification);

  const skills = readStore<Skill[]>(SKILLS_KEY, []).filter((s) => s.userId !== uid);
  writeStore(SKILLS_KEY, skills);

  const certs = readStore<Certificate[]>(CERTS_KEY, []).filter((c) => c.userId !== uid);
  writeStore(CERTS_KEY, certs);

  const opps = readStore<Opportunity[]>(OPPS_KEY, []).filter((o) => o.userId !== uid);
  writeStore(OPPS_KEY, opps);

  await removeCurrentUserRecord();
}

// ============================================================================
// RESOURCES & ADMIN PLATFORM METRICS (Role checked inside service layer)
// ============================================================================

export async function listResources(): Promise<Resource[]> {
  initDbSeed();
  return readStore<Resource[]>(RESOURCES_KEY, DEFAULT_RESOURCES);
}

export async function saveResource(
  input: Omit<Resource, 'createdBy'>
): Promise<Resource> {
  const actor = await requireSessionUser();
  if (actor.role !== 'admin') {
    throw new Error('Unauthorized: Only administrators can add or edit resources.');
  }
  const list = readStore<Resource[]>(RESOURCES_KEY, DEFAULT_RESOURCES);
  const record: Resource = {
    ...input,
    id: input.id || `res-${Date.now()}`,
    title: input.title.trim().slice(0, 140),
    category: input.category.trim().slice(0, 80),
    link: input.link.trim().slice(0, 300),
    description: input.description.trim().slice(0, 500),
    createdBy: actor.id,
  };
  const idx = list.findIndex((r) => r.id === record.id);
  if (idx >= 0) {
    list[idx] = record;
  } else {
    list.unshift(record);
  }
  writeStore(RESOURCES_KEY, list);
  return record;
}

export async function deleteResource(id: string): Promise<boolean> {
  const actor = await requireSessionUser();
  if (actor.role !== 'admin') {
    throw new Error('Unauthorized: Only administrators can delete resources.');
  }
  const list = readStore<Resource[]>(RESOURCES_KEY, DEFAULT_RESOURCES);
  const filtered = list.filter((r) => r.id !== id);
  writeStore(RESOURCES_KEY, filtered);
  return filtered.length !== list.length;
}

export async function getPlatformStats() {
  const actor = await requireSessionUser();
  if (actor.role !== 'admin') {
    throw new Error('Unauthorized: Admin access is required to view platform statistics.');
  }
  return {
    totalProfiles: Object.keys(readStore<Record<string, Profile>>(PROFILES_KEY, {})).length,
    totalResumes: Object.keys(readStore<Record<string, Resume>>(RESUMES_KEY, {})).length,
    totalSkills: readStore<Skill[]>(SKILLS_KEY, []).length,
    totalCertificates: readStore<Certificate[]>(CERTS_KEY, []).length,
    totalOpportunities: readStore<Opportunity[]>(OPPS_KEY, []).length,
    totalRoadmaps: Object.keys(readStore<Record<string, RoadmapPlan>>(ROADMAPS_KEY, {})).length,
    totalResources: readStore<Resource[]>(RESOURCES_KEY, DEFAULT_RESOURCES).length,
  };
}
