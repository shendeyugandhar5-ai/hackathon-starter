/**
 * Knowledge Service
 * Centralizes concept ontology, DAG node states, and prerequisite dependencies.
 */

import { api } from './api';
import { studentService } from './studentService';

export const BASE_CONCEPT_NODES = [
  {
    id: 'cond_prob',
    name: 'Conditional Probability',
    subject: 'maths',
    category: 'Foundational Maths',
    baseScore: 42,
    score: 42,
    defaultState: 'weak',
    state: 'weak',
    prerequisites: ['set_theory', 'sample_space'],
    unlocks: ['bayes_rule', 'naive_bayes'],
    description: 'Calculates the probability of event A occurring given that event B has already taken place.',
    misconception: 'Conflating P(A|B) with P(B|A) (Inverse Fallacy / Prosecutor Fallacy)',
    actionPlanTime: '12 min',
  },
  {
    id: 'bayes_rule',
    name: 'Bayes Theorem',
    subject: 'maths',
    category: 'Foundational Maths',
    baseScore: 68,
    score: 68,
    defaultState: 'learning',
    state: 'learning',
    prerequisites: ['cond_prob'],
    unlocks: ['naive_bayes', 'mle_map'],
    description: 'Formal mathematical framework for updating prior degrees of belief in light of new observational evidence.',
    misconception: 'Neglecting marginal evidence denominator normalization.',
    actionPlanTime: '15 min',
  },
  {
    id: 'naive_bayes',
    name: 'Naive Bayes Classifier',
    subject: 'aiml',
    category: 'Applied ML Models',
    baseScore: 67,
    score: 67,
    defaultState: 'learning',
    state: 'learning',
    prerequisites: ['cond_prob', 'bayes_rule'],
    unlocks: ['text_classification', 'spam_filter'],
    description: 'Probabilistic classification algorithm operating under feature conditional independence assumption.',
    misconception: 'Assuming zero probability for unseen words without Laplace smoothing.',
    actionPlanTime: '20 min',
  },
  {
    id: 'dp_knapsack',
    name: 'Dynamic Programming (Knapsack)',
    subject: 'dsa',
    category: 'Algorithmic Rigor',
    baseScore: 74,
    score: 74,
    defaultState: 'learning',
    state: 'learning',
    prerequisites: ['recursion', 'memoization'],
    unlocks: ['subset_sum', 'bounded_dp'],
    description: 'Recursive subproblem optimal substructure with state table memoization.',
    misconception: 'Off-by-one weight constraint indexing in 2D tabulation.',
    actionPlanTime: '18 min',
  },
  {
    id: 'sql_indexing',
    name: 'B-Tree Indexing & Query Plans',
    subject: 'dbms',
    category: 'Relational Engines',
    baseScore: 92,
    score: 92,
    defaultState: 'mastered',
    state: 'mastered',
    prerequisites: ['relational_algebra', 'disk_storage'],
    unlocks: ['query_optimizer', 'hash_joins'],
    description: 'Multi-level self-balancing search tree structure minimizing random disk block I/O.',
    misconception: 'Assuming composite index order is commutative.',
    actionPlanTime: '10 min',
  },
  {
    id: 'loss_gradient',
    name: 'Gradient Descent & Loss Surfaces',
    subject: 'aiml',
    category: 'Optimization Theory',
    baseScore: 81,
    score: 81,
    defaultState: 'mastered',
    state: 'mastered',
    prerequisites: ['vector_calculus', 'matrix_derivatives'],
    unlocks: ['backprop', 'adam_optimizer'],
    description: 'Iterative first-order optimization algorithm navigating multi-dimensional parameter loss landscapes.',
    misconception: 'Confusing local saddle points with global minima.',
    actionPlanTime: '15 min',
  },
];

export const knowledgeService = {
  /**
   * Fetch full personalized Obsidian-inspired Student Learning Journey Graph
   */
  async getLearningGraph(student_id) {
    if (!student_id) {
      return {
        ok: true,
        data: {
          student_id,
          nodes: [],
          edges: [],
          summary: {
            total_concepts: 0,
            mastered_concepts: 0,
            learning_concepts: 0,
            weak_concepts: 0,
            subjects_covered: [],
            agents_used: [],
            total_questions: 0,
            diversification_score: 0.0,
            top_bottleneck: null,
          },
          timeline: [],
          is_empty: true,
        }
      };
    }

    try {
      const res = await api.getLearningGraph(student_id);
      if (res.ok && res.data) {
        return { ok: true, data: res.data };
      }
    } catch (err) {
      console.warn('Backend learning graph fetch note:', err);
    }

    // Fallback: build concept graph locally if backend is temporarily unreachable
    const conceptGraph = await this.getConceptGraph(student_id);
    const nodes = conceptGraph.nodes.map((n) => ({
      id: n.id,
      label: n.name,
      node_type: 'concept',
      subject: n.subject,
      mastery: n.score,
      state: n.state,
      metadata: {
        category: n.category,
        description: n.description,
        misconception: n.misconception,
        prerequisites: n.prerequisites,
        unlocks: n.unlocks,
        supporting_agents: [n.subject.toUpperCase() + ' Agent'],
      },
    }));

    return {
      ok: true,
      data: {
        student_id,
        nodes,
        edges: [
          { id: 'e_cp_br', source: 'cond_prob', target: 'bayes_rule', edge_type: 'prerequisite_of', label: 'Gates', weight: 0.95 },
          { id: 'e_br_nb', source: 'bayes_rule', target: 'naive_bayes', edge_type: 'prerequisite_of', label: 'Gates', weight: 0.9 },
          { id: 'e_cp_nb', source: 'cond_prob', target: 'naive_bayes', edge_type: 'prerequisite_of', label: 'Gates', weight: 0.85 },
        ],
        summary: {
          total_concepts: nodes.length,
          mastered_concepts: nodes.filter((n) => n.state === 'mastered').length,
          learning_concepts: nodes.filter((n) => n.state === 'learning').length,
          weak_concepts: nodes.filter((n) => n.state === 'weak').length,
          subjects_covered: ['maths', 'dsa', 'aiml', 'dbms'],
          agents_used: ['Maths Agent', 'AIML Agent', 'DSA Agent'],
          total_questions: 6,
          diversification_score: 0.85,
          top_bottleneck: 'Conditional Probability',
        },
        timeline: [],
        is_empty: false,
      },
    };
  },

  /**
   * Fetch concept graph nodes merged with student's live topic mastery
   */
  async getConceptGraph(student_id) {
    try {
      if (!student_id) {
        return {
          nodes: BASE_CONCEPT_NODES,
          bottlenecks: BASE_CONCEPT_NODES.filter((n) => n.state === 'weak' || n.score < 50),
        };
      }

      const masteryRes = await studentService.getMastery(student_id);
      const topics = masteryRes?.data?.topics || [];

      const mergedNodes = BASE_CONCEPT_NODES.map((node) => {
        const match = topics.find(
          (t) =>
            t.topic?.toLowerCase().replace(/_/g, '') === node.id.toLowerCase().replace(/_/g, '') ||
            node.name.toLowerCase().includes(t.topic?.toLowerCase().replace(/_/g, ' ') || '')
        );

        if (match) {
          const scorePct = Math.round((match.score || 0) * 100);
          return {
            ...node,
            score: scorePct,
            state: match.state || (scorePct >= 80 ? 'mastered' : scorePct >= 50 ? 'learning' : 'weak'),
          };
        }

        return {
          ...node,
          score: node.baseScore ?? node.score ?? 50,
          state: node.defaultState ?? node.state ?? 'learning',
        };
      });

      return {
        nodes: mergedNodes,
        bottlenecks: mergedNodes.filter((n) => n.state === 'weak' || n.score < 50),
      };
    } catch (err) {
      console.error('Failed to load concept ontology:', err);
      return {
        nodes: BASE_CONCEPT_NODES,
        bottlenecks: BASE_CONCEPT_NODES.filter((n) => n.state === 'weak' || n.score < 50),
      };
    }
  }
};

export default knowledgeService;
