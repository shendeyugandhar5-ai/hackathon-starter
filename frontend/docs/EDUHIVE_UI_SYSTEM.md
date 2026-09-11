# EduHive Design System & UI Specification

**Version:** 2.4 (Academic Salon Edition)  
**Permanent Design Memory & Source of Truth**  
**Tagline:** AI TUTORS. BRIGHTER LEARNERS.

---

## 1. Brand Identity & Creative North Star

EduHive is an agentic AI learning platform where multiple specialized AI tutors collaborate synchronously to provide deeply personalized, adaptive engineering education.

### Official Brand Emblem & Typography:
- **Emblem:** 3-dimensional isometric honeycomb stack with circuit trace nodes, rising above an open book with radiant golden pages.
- **Typography:** Bold `Edu` (near-black ink `#1C1917` / pure white `#FFFFFF` in dark mode) paired with `Hive` in rich terracotta (`#C85A32` / `#A8421E`).
- **Tagline:** `AI TUTORS. BRIGHTER LEARNERS.` in tracked uppercase monospace typography.

### Aesthetic Archetype:
**"Premium Academic Software + Intelligent Research Workspace + Modern Editorial Journal"**

- **Editorial & Scholarly:** Inspired by high-end university presses, research journals, and modern academic salons.
- **Warm & Organic Intelligence:** Warm ivory and cream tones replace sterile cold whites; earthy terracotta replaces generic AI purple/neon cyan.
- **Agentic & Computational:** Monospace coordinates, Bayesian belief badges, telemetry update deltas, and live DAG graphs give an authentic multi-agent instrumentation feel.
- **Zero Generic SaaS Clichés:** No exaggerated neon gradients, no cartoonish icons, no glassmorphic blur overdoses, and no generic chat widget templates.

---

## 2. Color System & Design Tokens

EduHive utilizes a curated warm neutral palette anchored by terracotta accents and academic state colors.

### Core Swatches (Tailwind & CSS Tokens)

```css
:root {
  /* Canvas / Backgrounds */
  --bg-primary: #FAF7F2;      /* Warm ivory / canvas */
  --bg-secondary: #F3EFE6;    /* Warm beige / sidebar header / sub-card */
  --bg-card: #FFFFFF;         /* Crisp white card surface */
  --bg-card-muted: #F8F5EE;   /* Off-white recessed card / badge area */
  
  /* Dark Surfaces (Sidebar & Terminal) */
  --bg-dark-sidebar: #161514; /* Near-black charcoal */
  --bg-dark-surface: #1C1B19; /* Dark card/module */
  --bg-dark-border: #2A2724;  /* Dark line divider */
  --text-dark-muted: #8E8880; /* Dark mode subtext */

  /* Text & Ink */
  --text-primary: #1C1917;    /* Stone 900 ink */
  --text-secondary: #57534E;  /* Stone 600 body text */
  --text-muted: #8C827A;      /* Stone 400 captions & labels */
  --text-inv: #FFFFFF;        /* Inverted white text */

  /* Terracotta Brand / Primary Action */
  --terracotta-50: #FDF4F0;
  --terracotta-100: #FCE8E1;
  --terracotta-200: #F7CFC2;
  --terracotta-500: #C85A32;
  --terracotta-600: #A8421E;  /* Primary brand button / active state */
  --terracotta-700: #8C3415;  /* Hover / dark accent */

  /* Curricular & Cognitive State Accents */
  --mastery-green: #2E7D52;   /* Mastered state / positive delta */
  --mastery-green-bg: #EAF4EE;
  --learning-amber: #C07D1C;  /* In-progress / learning state */
  --learning-amber-bg: #FCF4E6;
  --weak-red: #B93826;        /* Blocker / weak prerequisite */
  --weak-red-bg: #FDF0ED;
  --aiml-peach: #DF7356;
  --aiml-peach-bg: #FDF2EE;
  --dbms-cyan: #3B7A8C;
  --dbms-cyan-bg: #EEF6F8;

  /* Borders & Rules */
  --border-light: #E7E2D7;    /* Primary crisp divider */
  --border-card: #EAE5DC;     /* Card stroke */
  --border-dark: #2A2724;     /* Dark sidebar border */
}
```

---

## 3. Typography Hierarchy

| Role | Font Family | Example Classes / Sizes | Usage |
| :--- | :--- | :--- | :--- |
| **Editorial H1** | `Newsreader` / `Playfair Display`, serif | `font-serif text-3xl md:text-4xl font-normal text-stone-900 leading-tight` | Major page titles ("Your Learning Brain", "Knowledge Graph & Prerequisite Ontology") |
| **Editorial H2** | `Newsreader` / `Playfair Display`, serif | `font-serif text-xl md:text-2xl font-normal text-stone-900` | Section headings, diagnostic titles |
| **Editorial H3** | `Newsreader` / `Playfair Display`, serif | `font-serif text-lg font-medium text-stone-900` | Co-synthesis numbered steps, module titles |
| **UI Body** | `Plus Jakarta Sans` / `Inter`, sans-serif | `font-sans text-sm text-stone-700 leading-relaxed` | Explanations, pedagogical dialogue |
| **UI Medium/Bold** | `Plus Jakarta Sans`, sans-serif | `font-sans text-sm font-semibold text-stone-900` | Metric numbers, buttons, card labels |
| **Telemetry / Code** | `JetBrains Mono`, monospace | `font-mono text-xs tracking-wider uppercase` | Badges, node IDs (`ONT-MTH-PR-024`), math formulas (`P(A\|B)`) |

---

## 4. Component Patterns & UI Anatomy

### A. Navigation & AppShell
1. **Dark Navigation Sidebar (`w-64 bg-[#161514]`)**:
   - Header with official EduHive emblem + `v2.4` + status `● Orchestrator Mesh Active`.
   - `COGNITIVE WORKSPACE` navigation items (`Tutor Orchestration`, `Student Brain`, `Knowledge Map`, `Progress & Roadmap`, `Session History`).
   - `Specialist Agents` panel displaying online status (`4 Online`) and quick agent pills (`MATH`, `AIML`, `DSA`, `DBMS`).
   - `Teacher Escalation` quick action button with `Ready` indicator.
   - User Profile Footer: Initials avatar (`RS`), "Rahul Sharma", cohort label ("Data Scientist Track • W1").

### B. Tutor Orchestration (Batch 2 Pattern)
1. **Learner Inquiry Card:**
   - Student context depth badge (`Inquiry session context depth: 4 prior interactions`).
   - High-contrast editorial query display.
   - Monospace detected intent tags with sensitivity flags (`⚠ Prerequisite Gap Sensitivity`).
2. **Coordinator Event Dispatch Bar:**
   - Visual dispatch alert (`Event #CO-902`) highlighting cognitive state (`42% Weak`) and routed specialist agents.
3. **Co-Synthesis Multi-Agent Derivation Module:**
   - Multi-agent header with verification confidence (`Σ Maths Agent 95% + ⚡ AIML Agent 87% • Synthesized & Verified`).
   - Numbered step progression (`1. Intuition`, `2. Bayes Theorem`, `3. Naive Bayes in Action`, `4. Visual Worked Example`).
   - Monospace math formula blocks with pedagogical anchors (`📍 Pedagogical Anchor`).
   - Structured academic table with Prior, Likelihood, Unnormalized Score, and Normalized Posterior breakdowns.
   - Quick Socratic action buttons (`Step-by-Step`, `ELI5`, `Hint`, `Test My Understanding`, `Escalate to Human Teacher`).

### C. Knowledge Graph & Prerequisite Ontology (Batch 2 Pattern)
1. **Interactive Directed Acyclic Graph (DAG):**
   - Foundation nodes (`Linear Algebra 95%`, `Vector Spaces 92%`, `Gradient Descent 91%`).
   - Intermediate blocker nodes with animated pulse warning box (`! Conditional Prob. ONT-MTH-PR-024 CRITICAL 42% WEAK`).
   - Downstream locked competencies (`🔒 Naive Bayes LOCKED`).
2. **Bottom Analytics Strip:**
   - `Identified Bottlenecks` (Critical node blocker count).
   - `Velocity to Target` (+14%/Week pacing & optimal retention).
   - `Graph Auto-Repair` (Socratic loop readiness & prompt inspect).
3. **Node Diagnostic Inspector Panel:**
   - Accuracy & attempt history metrics (`7 Sets`, `3/8 37.5%`).
   - Cognitive Misconception Detection block with agent attribution.
   - Prerequisite dependency chain showing upstream foundations and downstream gated nodes.
   - 12-min Adaptive Action Plan with direct drill triggers.
   - Interactive Sample Space Venn diagram ($P(A|B) = P(A \cap B) / P(B)$).

---

## 5. Route Registry

| Route | Page | Component |
| :--- | :--- | :--- |
| `/` | Landing Page | [Landing.jsx](file:///c:/Users/soham%20parab/.gemini/antigravity-ide/scratch/kurukshetra/frontend/src/pages/Landing.jsx) |
| `/login` | Login | [Login.jsx](file:///c:/Users/soham%20parab/.gemini/antigravity-ide/scratch/kurukshetra/frontend/src/pages/Login.jsx) |
| `/register` | Register & Onboarding | [Register.jsx](file:///c:/Users/soham%20parab/.gemini/antigravity-ide/scratch/kurukshetra/frontend/src/pages/Register.jsx) |
| `/app/student-brain` | Student Brain | [StudentBrain.jsx](file:///c:/Users/soham%20parab/.gemini/antigravity-ide/scratch/kurukshetra/frontend/src/pages/StudentBrain.jsx) |
| `/app/progress` | Progress & Roadmap | [ProgressRoadmap.jsx](file:///c:/Users/soham%20parab/.gemini/antigravity-ide/scratch/kurukshetra/frontend/src/pages/ProgressRoadmap.jsx) |
| `/app/tutor` | Tutor Orchestration | [Tutor.jsx](file:///c:/Users/soham%20parab/.gemini/antigravity-ide/scratch/kurukshetra/frontend/src/pages/Tutor.jsx) |
| `/app/knowledge-map` | Knowledge Graph & Ontology | [KnowledgeMap.jsx](file:///c:/Users/soham%20parab/.gemini/antigravity-ide/scratch/kurukshetra/frontend/src/pages/KnowledgeMap.jsx) |
| `/app/history` | Session History | [History.jsx](file:///c:/Users/soham%20parab/.gemini/antigravity-ide/scratch/kurukshetra/frontend/src/pages/History.jsx) |
