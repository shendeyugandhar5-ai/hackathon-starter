/**
 * Knowledge Service
 * Centralizes concept ontology, DAG node states, and prerequisite dependencies.
 */

import { studentService } from './studentService';

export const BASE_CONCEPT_NODES = [
  {
    id: 'cond_prob',
    name: 'Conditional Probability',
    subject: 'maths',
    category: 'Foundational Maths',
    baseScore: 42,
    defaultState: 'weak',
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
    defaultState: 'learning',
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
    defaultState: 'learning',
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
    defaultState: 'learning',
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
    defaultState: 'mastered',
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
    defaultState: 'mastered',
    prerequisites: ['vector_calculus', 'matrix_derivatives'],
    unlocks: ['backprop', 'adam_optimizer'],
    description: 'Iterative first-order optimization algorithm navigating multi-dimensional parameter loss landscapes.',
    misconception: 'Confusing local saddle points with global minima.',
    actionPlanTime: '15 min',
  },
];

export const knowledgeService = {
  /**
   * Fetch concept graph nodes merged with student's live topic mastery
   */
  async getConceptGraph(student_id) {
    const masteryRes = await studentService.getMastery(student_id);
    const topics = masteryRes.data?.topics || [];

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
        score: node.baseScore,
        state: node.defaultState,
      };
    });

    return {
      nodes: mergedNodes,
      bottlenecks: mergedNodes.filter((n) => n.state === 'weak' || n.score < 50),
    };
  }
};

export default knowledgeService;
