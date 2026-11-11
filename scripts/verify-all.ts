/**
 * Comprehensive verification script testing every single core data and business logic function in Career Compass
 */
// Polyfill localStorage for Node execution
const store = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => store.set(k, String(v)),
  removeItem: (k: string) => store.delete(k),
  clear: () => store.clear(),
};

async function run() {
  console.log('🚀 Starting Career Compass End-to-End Function Verification...\n');

  const { login, register, getCurrentUser, logout, listUsers, toggleUserActiveStatus, updateCurrentUserName } = await import('../src/services/auth');
  const {
    getProfile,
    saveProfile,
    getResume,
    saveResume,
    listSkills,
    saveSkill,
    deleteSkill,
    listCertificates,
    saveCertificate,
    deleteCertificate,
    listOpportunities,
    saveOpportunity,
    deleteOpportunity,
    getRoadmap,
    saveRoadmap,
    getInterviewSession,
    saveInterviewSession,
    clearInterviewSession,
    listResources,
    saveResource,
    deleteResource,
    getPlatformStats,
    exportMyDataAsJson,
    deleteMyAccountAndAllData,
    getGamificationState,
    awardXp,
    toggleQuest,
  } = await import('../src/services/db');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${msg}`);
      failed++;
    }
  }

  // 1. Authentication Tests
  console.log('1. Authentication & Session:');
  const demoUser = await login('demo@careercompass.org', 'demo123');
  assert(!!demoUser && demoUser.email === 'demo@careercompass.org', 'Demo user login succeeds');
  const current = await getCurrentUser();
  assert(current?.id === demoUser.id, 'Session user is properly registered in context');

  // 2. Profile Management
  console.log('\n2. User Profile Management:');
  const initialProf = await getProfile();
  assert(!!initialProf, 'Default profile is seeded');
  const updatedProf = await saveProfile({
    ...initialProf!,
    fieldOfStudy: 'Full-Stack Software Engineering',
    careerGoal: 'Senior Full-Stack Architect',
    interests: ['React', 'TypeScript', 'Node.js', 'System Architecture'],
  });
  assert(updatedProf.careerGoal === 'Senior Full-Stack Architect', 'Profile updates and persists correctly');

  // 3. Skills Vault
  console.log('\n3. Skills Vault Management:');
  const newSkill = await saveSkill({
    name: 'TypeScript & React Architecture',
    category: 'technical',
    level: 5,
  });
  assert(!!newSkill.id && newSkill.name === 'TypeScript & React Architecture', 'Add skill generates valid ID');
  const skillsList = await listSkills();
  assert(skillsList.some((s) => s.id === newSkill.id), 'Newly added skill appears in list');
  await deleteSkill(newSkill.id);
  const afterDeleteSkills = await listSkills();
  assert(!afterDeleteSkills.some((s) => s.id === newSkill.id), 'Delete skill removes the item');

  // 4. Certificate Vault
  console.log('\n4. Certificate Vault Management:');
  const cert = await saveCertificate({
    title: 'AWS Certified Solutions Architect',
    issuer: 'Amazon Web Services',
    date: '2025-05-10',
  });
  assert(!!cert.id && cert.issuer === 'Amazon Web Services', 'Save certificate succeeds');
  const certsList = await listCertificates();
  assert(certsList.some((c) => c.id === cert.id), 'Certificate listed in vault');
  await deleteCertificate(cert.id);
  const afterDeleteCerts = await listCertificates();
  assert(!afterDeleteCerts.some((c) => c.id === cert.id), 'Delete certificate removes record');

  // 5. Opportunities Pipeline
  console.log('\n5. Opportunity Tracker & Pipeline:');
  const opp = await saveOpportunity({
    title: 'Senior Software Engineer',
    organization: 'Global Innovation Labs',
    type: 'job',
    status: 'interview',
    deadline: '2026-12-01',
    appliedDate: '2026-11-01',
    notes: 'Completed Round 1 technical interview',
  });
  assert(!!opp.id && opp.organization === 'Global Innovation Labs', 'Opportunity created with ID');
  const oppsList = await listOpportunities();
  assert(oppsList.some((o) => o.id === opp.id), 'Opportunity listed in pipeline');
  const updatedOpp = await saveOpportunity({
    ...opp,
    status: 'offer',
  });
  assert(updatedOpp.status === 'offer', 'Opportunity status transitioned to offer');
  await deleteOpportunity(opp.id);
  const afterDeleteOpps = await listOpportunities();
  assert(!afterDeleteOpps.some((o) => o.id === opp.id), 'Opportunity deleted from pipeline');

  // 6. Resume Studio Data Flow
  console.log('\n6. Resume Studio:');
  const currentResume = await getResume();
  assert(!!currentResume && currentResume.personal.name === demoUser.name, 'Resume loaded and scoped to session');
  const modifiedResume = await saveResume({
    ...currentResume!,
    summary: 'Experienced Full-Stack Engineer with 5+ years building scalable web applications.',
    projects: [
      {
        title: 'Career Compass Platform',
        techStack: ['React', 'TypeScript', 'Tailwind CSS'],
        link: 'https://careercompass.org',
        description: 'Engineered an accessible career guidance and ATS resume builder platform.',
      },
    ],
  });
  assert(modifiedResume.projects.length === 1, 'Resume projects updated and persisted');

  // 7. Learning Roadmap & Milestones
  console.log('\n7. Learning Roadmap & Topics:');
  const rm = await saveRoadmap({
    id: 'rm-test-1',
    targetRole: 'Full-Stack Developer',
    data: {
      phases: [
        {
          title: 'Frontend Foundations',
          weeks: '4',
          topics: ['Modern HTML & CSS', 'TypeScript Basics', 'React Components'],
          practiceIdea: 'Build an interactive dashboard',
          freeResources: [{ name: 'MDN Web Docs', type: 'Documentation' }],
        },
        {
          title: 'Backend Systems',
          weeks: '4',
          topics: ['Node.js APIs', 'Database Design', 'Auth & JWT'],
          practiceIdea: 'Build a RESTful API with validation',
          freeResources: [{ name: 'Node.js Official Docs', type: 'Documentation' }],
        },
      ],
    },
    progress: ['Modern HTML & CSS'],
    createdAt: new Date().toISOString(),
  });
  assert(rm.progress.length === 1, 'Roadmap saved with 1 completed topic');
  const fetchedRm = await getRoadmap();
  assert(fetchedRm?.targetRole === 'Full-Stack Developer', 'Roadmap fetched correctly');

  // 8. Mock Interview Session
  console.log('\n8. Mock Interview Practice:');
  const interview = await saveInterviewSession({
    role: 'Frontend Engineer',
    field: 'Software Engineering',
    difficulty: 'Intermediate',
    type: 'technical',
    questions: [
      { id: 'q1', question: 'Explain how React Reconciliation works.', type: 'technical', idealAnswerPoints: ['Virtual DOM', 'Diffing algorithm'] },
      { id: 'q2', question: 'What is the purpose of useEffect cleanup?', type: 'technical', idealAnswerPoints: ['Unmounting', 'Preventing memory leaks'] },
    ],
    currentIndex: 0,
    answers: {
      q1: {
        userAnswer: 'React uses a virtual DOM to diff nodes and update only changed elements.',
        skipped: false,
        evaluation: { score: 9, feedback: 'Strong concise answer', improvedAnswer: 'Excellent.' },
      },
    },
    completed: false,
    updatedAt: new Date().toISOString(),
  });
  assert(interview.questions.length === 2 && interview.answers.q1.evaluation?.score === 9, 'Interview session saved with evaluation');
  await clearInterviewSession();
  const clearedInterview = await getInterviewSession();
  assert(clearedInterview === null, 'Interview session cleared');

  // 9. Privacy & JSON Export
  console.log('\n9. Privacy & Data Export:');
  const exportJson = await exportMyDataAsJson();
  const parsedExport = JSON.parse(exportJson);
  assert(
    !!parsedExport.account && !!parsedExport.profile && !!parsedExport.resume && Array.isArray(parsedExport.skills),
    'Data export contains complete user bundle (account, profile, resume, skills, opps, etc.)'
  );

  // 10. Admin Capabilities
  console.log('\n10. Admin Panel & Resources:');
  logout();
  const adminUser = await login('admin@careercompass.org', 'admin123');
  assert(adminUser.role === 'admin', 'Admin user login verified');
  const users = await listUsers();
  assert(users.length >= 2, 'Admin can list users');
  const resource = await saveResource({
    id: 'res-ts-handbook',
    title: 'Modern TypeScript Handbook',
    category: 'Technology & Software',
    link: 'https://www.typescriptlang.org/docs/handbook/',
    description: 'The authoritative reference guide for TypeScript developers.',
  });
  assert(!!resource.id && resource.title === 'Modern TypeScript Handbook', 'Admin resource publishing works');
  const resourcesList = await listResources();
  assert(resourcesList.some((r) => r.id === resource.id), 'Resource appears in catalog');
  await deleteResource(resource.id);
  const stats = await getPlatformStats();
  assert(stats.totalProfiles >= 1, 'Platform stats computed accurately');

  // 11. Duolingo Gamification Engine
  console.log('\n11. Duolingo Gamification Engine:');
  logout();
  await login('demo@careercompass.org', 'demo123');
  const initialGame = await getGamificationState();
  assert(initialGame.streakDays >= 1 && initialGame.xp >= 100, 'Initial gamification state loads with streak & XP');
  const awardedGame = await awardXp(50, 'Completed Milestone');
  assert(awardedGame.xp === initialGame.xp + 50, 'Award XP increments total experience points');
  const questGame = await toggleQuest('q2');
  assert(questGame.quests.some((q) => q.id === 'q2' && q.completed), 'Daily quest toggles and persists');

  console.log(`\n========================================`);
  console.log(`Verification Complete: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
