export const studentProfile = {
  name: "Rahul Sharma",
  initials: "RS",
  cohort: "Data Science & ML Engineering Cohort",
  track: "Data Science Track",
  subTrack: "Week 1 Foundations",
  sprintCode: "#ML-2025-Q2",
  overallMastery: 68,
  bktWeight: 0.89,
  nodesUnlocked: 18,
  totalNodes: 26,
  syncRate: "99.4%",
  latency: "28ms",
  meshStatus: "Orchestrator Mesh Active",
  readyAgentsCount: 5,
  cognitiveLoad: {
    zone: "Optimal Zone",
    cliIndex: 0.64,
    description: "Working memory allocated efficiently; no sensory saturation detected.",
    segments: [1, 1, 1, 0.6, 0]
  },
  retention: {
    halfLifeDays: 8.4,
    meanStability: "High",
    scaleName: "Ebbinghaus scale",
    microRetrievalHours: 18,
    sevenDayRetention: "92.4%",
    curvePoints: [100, 94, 88, 83, 79, 75, 72, 69]
  },
  teachingStrategy: {
    primary: "Worked Examples & Socratic Grounding",
    scaffoldingLevel: "High Scaffolding",
    codingLevel: "Dual Coding"
  },
  velocity: {
    rate: "+16.2%",
    status: "Optimal",
    target: "+12%/wk",
    pacePercentile: "P92 Pace"
  },
  focusedHours: {
    total: 38.4,
    recentDelta: "+4.2 hrs",
    scope: "Across 4 domain tracks"
  },
  upcomingGate: {
    gateNumber: 2,
    daysRemaining: 3,
    title: "Bayes & Supervised Capstone"
  },
  placementFit: 74,
  sprintPace: {
    currentWeek: 2,
    totalWeeks: 8
  }
};

export const specialistAgents = [
  { id: "coord", name: "Coordinator", handle: "@Coord_Agent", role: "Bayesian Knowledge Orchestrator", status: "Active", activeDot: true, color: "#A8421E", bg: "#FDF4F0" },
  { id: "dsa", name: "DSA", handle: "@DSA_Tutor", role: "Algorithms & Complexity Rigor", status: "Active", activeDot: true, color: "#C07D1C", bg: "#FCF4E6" },
  { id: "dbms", name: "DBMS", handle: "@DBMS_Tutor", role: "Relational Engines & Indexing", status: "Active", activeDot: true, color: "#3B7A8C", bg: "#EEF6F8" },
  { id: "maths", name: "Maths", handle: "@Maths_Tutor", role: "Linear Algebra & Probability", status: "Active", activeDot: true, color: "#B93826", bg: "#FDF0ED" },
  { id: "aiml", name: "AIML", handle: "@AIML_Tutor", role: "Loss Geometry & Neural Architectures", status: "Active", activeDot: true, color: "#DF7356", bg: "#FDF2EE" },
  { id: "general", name: "General", handle: "@General_Strat", role: "Pedagogy & Socratic Scaffolding", status: "Active", activeDot: true, color: "#57534E", bg: "#F5F5F4" }
];

export const prerequisiteBlocker = {
  detected: true,
  agent: "COORDINATOR AGENT DIAGNOSTIC",
  priority: "High (0.82)",
  title: "Structural Impediment to Machine Learning Progression",
  description: "Your Naive Bayes classifier mastery is plateauing because the conditional independence formulation P(x|y) draws directly on joint/marginal conditional probability. Repairing this gap is estimated to boost your AIML mastery index by +14%.",
  estResolutionTime: "18 min",
  sourceNode: {
    id: "#14",
    category: "Maths Node",
    score: 42,
    state: "WEAK",
    title: "Conditional Probability",
    subtitle: "Foundational Mathematics Pillar"
  },
  targetNode: {
    id: "#21",
    category: "AIML Node",
    score: 67,
    state: "LEARNING",
    title: "Naive Bayes Classifier",
    subtitle: "Target AIML Competency"
  }
};

export const curricularFacets = [
  {
    id: "dsa",
    discipline: "Data Structures & Algorithms",
    icon: "Code2",
    mastery: 74,
    status: "LEARNING",
    statusColor: "#C07D1C",
    conceptCount: 9,
    topStrength: { title: "Dynamic Programming", score: 86, badge: "86% Mastery" },
    activeFocus: { title: "Graph Traversals", detail: "BFS / DFS Trees" }
  },
  {
    id: "dbms",
    discipline: "Database Systems",
    icon: "Database",
    mastery: 61,
    status: "LEARNING",
    statusColor: "#C07D1C",
    conceptCount: 6,
    topStrength: { title: "SQL Joins & Window", score: 92, badge: "92% Mastery" },
    activeFocus: { title: "B+ Trees & Indexing", detail: "52% Target Remediation", isGap: true }
  },
  {
    id: "maths",
    discipline: "Mathematical Foundations",
    icon: "Sigma",
    mastery: 48,
    status: "WEAK",
    statusColor: "#B93826",
    hasLeftAccent: true,
    conceptCount: 7,
    topStrength: { title: "Conditional Probability", score: 42, badge: "42% Blocker Node", isWeak: true },
    activeFocus: { title: "Bayes Rule Formulations", detail: "Prerequisite for ML" }
  },
  {
    id: "aiml",
    discipline: "AI & Machine Learning",
    icon: "Sparkles",
    mastery: 72,
    status: "LEARNING",
    statusColor: "#C07D1C",
    conceptCount: 6,
    topStrength: { title: "Loss Functions & Grad", score: 84, badge: "84% Mastery" },
    activeFocus: { title: "Naive Bayes Classifiers", detail: "Prereq Constrained" }
  }
];

export const telemetryEvents = [
  {
    id: "evt-1",
    title: "Bayes' Theorem Posterior",
    type: "positive",
    delta: "+9% Lift",
    deltaColor: "text-emerald-700 bg-emerald-50 border-emerald-200",
    dotColor: "bg-emerald-600",
    description: "Verified worked calculation during Socratic session",
    timestamp: "Today, 14:22",
    agent: "Maths Agent"
  },
  {
    id: "evt-2",
    title: "Conditional Probability",
    type: "negative",
    delta: "-4% Dip",
    deltaColor: "text-rose-700 bg-rose-50 border-rose-200",
    dotColor: "bg-rose-500",
    description: "Marginal independence slip; flagged as critical blocker",
    timestamp: "Yesterday, 19:40",
    agent: "Diagnostic"
  },
  {
    id: "evt-3",
    title: "SQL Joins & Aggregations",
    type: "positive",
    delta: "+15% Lift",
    deltaColor: "text-emerald-700 bg-emerald-50 border-emerald-200",
    dotColor: "bg-emerald-600",
    description: "Passed advanced multi-table index verification",
    timestamp: "2 days ago",
    agent: "DBMS Agent"
  },
  {
    id: "evt-4",
    title: "Dynamic Programming Subproblems",
    type: "positive",
    delta: "+6%",
    deltaColor: "text-amber-800 bg-amber-50 border-amber-200",
    dotColor: "bg-amber-600",
    description: "Memoization formulation verified on Knapsack variants",
    timestamp: "3 days ago",
    agent: "DSA Agent"
  }
];

export const structuredRoadmapWeeks = [
  {
    weekNumber: 1,
    tag: "WEEK 01 • COMPLETED",
    hoursLogged: "40 hrs logged",
    masteryBadge: "89% Mastered",
    isCompleted: true,
    title: "Foundations & Mathematical Bedrock",
    description: "Linear Algebra (Eigenvalues, SVD), SQL aggregations, and differential calculus.",
    pills: [
      { label: "Vector Spaces", checked: true },
      { label: "Gradient Descent", checked: true },
      { label: "Capstone Score: 94/100", highlight: true }
    ]
  },
  {
    weekNumber: 2,
    tag: "WEEK 02 • CURRENT SPRINT",
    endsIn: "Ends in 3 days",
    progressBadge: "65% In Progress",
    isCurrent: true,
    title: "Core Probability & Supervised Learning",
    description: "Conditional independence, Bayes rule formulations, and loss surface geometry.",
    comparison: {
      left: { title: "Conditional Probability", badge: "42% Weak • Needs Fix", isWeak: true },
      right: { title: "Naive Bayes Classifier", badge: "58% In Progress" }
    },
    assignedAgents: "Assigned Agents: Maths + AIML",
    actionLabel: "Launch Sprint Diagnostic >"
  },
  {
    weekNumber: 3,
    tag: "WEEK 03 • UPCOMING",
    unlocksDate: "Unlocks Dec 16",
    isUpcoming: true,
    title: "Core DSA for Data Science & Algorithm Rigor",
    description: "Sliding window, vector space nearest neighbors, and memoization optimization."
  },
  {
    weekNumber: 4,
    tag: "WEEK 04 • UPCOMING",
    unlocksDate: "Unlocks Dec 23",
    isUpcoming: true,
    title: "Production DBMS, Indexing & Feature Stores",
    description: "B+ Tree indices, query plan optimization, and offline feature store architecture."
  },
  {
    weekNumber: "05-08",
    tag: "WEEKS 05–08: FUTURE GATES",
    isUpcoming: true,
    title: "Deep Learning, System Design & Placement",
    description: "4 Assessment Gates Ahead."
  }
];

export const placementBenchmarks = [
  {
    company: "Amazon",
    role: "ML Engineer I",
    fitPercentage: 76,
    tags: "DSA + SQL + System Scale",
    statusColor: "emerald"
  },
  {
    company: "Razorpay",
    role: "Data Scientist",
    fitPercentage: 68,
    tags: "Probability & Risk ML",
    statusColor: "amber"
  }
];

export const atsResumeMatch = {
  score: 68,
  keywords: [
    { name: "NumPy / SciPy", matched: true },
    { name: "SQL Indexing", matched: true },
    { name: "Bayes Theorem", matched: false, warning: true },
    { name: "XGBoost", locked: true }
  ]
};

export const mentorData = {
  name: "Dr. Aris Thorne",
  initials: "AT",
  title: "Faculty Pedagogical Mentor",
  action: "1:1 Sync"
};
