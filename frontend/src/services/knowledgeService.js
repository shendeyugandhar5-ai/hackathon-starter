import { api } from "./api";
import { studentService } from "./studentService";

export const BASE_CONCEPT_NODES = [
  {
    id: "conditional_probability",
    aliases: ["cond_prob"],
    name: "Conditional Probability",
    subject: "maths",
    category: "Foundational Maths",
    baseScore: 42,
    defaultState: "weak",
    prerequisites: ["probability"],
    description: "Conditional probability foundations.",
    misconception: "Conflating P(A|B) with P(B|A)",
    actionPlanTime: "12 min",
  },
  {
    id: "bayes_rule",
    aliases: ["bayes_theorem"],
    name: "Bayes' Theorem",
    subject: "maths",
    category: "Foundational Maths",
    baseScore: 68,
    defaultState: "learning",
    prerequisites: ["conditional_probability"],
    description: "Bayesian updating and posterior reasoning.",
    misconception: "Neglecting marginal evidence normalization.",
    actionPlanTime: "15 min",
  },
  {
    id: "naive_bayes",
    aliases: ["naive_bayes_classifier"],
    name: "Naive Bayes Classifier",
    subject: "aiml",
    category: "Applied ML Models",
    baseScore: 67,
    defaultState: "learning",
    prerequisites: ["conditional_probability", "bayes_rule"],
    description: "Probabilistic classification.",
    misconception: "Assuming zero probability for unseen words.",
    actionPlanTime: "20 min",
  },
  {
    id: "dynamic_programming",
    aliases: ["dp_knapsack"],
    name: "Dynamic Programming",
    subject: "dsa",
    category: "Algorithmic Rigor",
    baseScore: 74,
    defaultState: "learning",
    prerequisites: ["recursion", "memoization"],
    description: "Subproblem optimization and memoization.",
    misconception: "Off-by-one indexing in tabulation.",
    actionPlanTime: "18 min",
  },
  {
    id: "sql_indexing",
    aliases: [],
    name: "SQL Indexing",
    subject: "dbms",
    category: "Relational Engines",
    baseScore: 92,
    defaultState: "mastered",
    prerequisites: [],
    description: "Indexes and query execution.",
    misconception: "Assuming composite index order is commutative.",
    actionPlanTime: "10 min",
  },
  {
    id: "gradient_descent",
    aliases: ["loss_gradient"],
    name: "Gradient Descent",
    subject: "aiml",
    category: "Optimization Theory",
    baseScore: 81,
    defaultState: "mastered",
    prerequisites: ["linear_algebra"],
    description: "Optimization and loss surfaces.",
    misconception: "Confusing saddle points with global minima.",
    actionPlanTime: "15 min",
  },
];

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function pretty(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function metadataFor(topic) {
  return BASE_CONCEPT_NODES.find(
    (node) =>
      normalize(node.id) === normalize(topic) ||
      node.aliases.some((alias) => normalize(alias) === normalize(topic)),
  );
}

export const knowledgeService = {
  async getConceptGraph(studentId) {
    const masteryRes = await studentService.getMastery(studentId);
    const topics = masteryRes?.data?.topics || [];
    const nodes = topics.length
      ? topics.map((topic) => {
          const metadata = metadataFor(topic.topic);
          return {
            ...(metadata || {}),
            id: topic.topic,
            name: metadata?.name || pretty(topic.topic),
            subject: topic.subject,
            score: Math.round(Number(topic.score || 0) * 100),
            state: topic.state || "new",
            description:
              metadata?.description ||
              `${pretty(topic.topic)} tracked from your activity.`,
            prerequisites: metadata?.prerequisites || [],
            unlocks: metadata?.unlocks || [],
          };
        })
      : BASE_CONCEPT_NODES.map((node) => ({
          ...node,
          score: node.baseScore,
          state: node.defaultState,
        }));

    const edges = [];
    nodes.forEach((node) => {
      (node.prerequisites || []).forEach((prerequisite) => {
        const target = nodes.find(
          (candidate) =>
            normalize(candidate.id) === normalize(prerequisite) ||
            candidate.aliases?.some(
              (alias) => normalize(alias) === normalize(prerequisite),
            ),
        );
        if (target) edges.push({ from: target.id, to: node.id });
      });
    });

    return {
      nodes,
      edges,
      bottlenecks: nodes.filter(
        (node) => node.state === "weak" || node.score < 50,
      ),
    };
  },

  async getLearningGraph(studentId) {
    if (studentId) {
      const response = await api.getLearningGraph(studentId);
      if (response.ok && response.data)
        return { ok: true, data: response.data };
    }

    const graph = await this.getConceptGraph(studentId);
    const nodes = graph.nodes.map((node) => ({
      id: node.id,
      label: node.name,
      node_type: "concept",
      subject: node.subject,
      mastery: node.score,
      state: node.state,
      metadata: {
        category: node.category,
        description: node.description,
        prerequisites: node.prerequisites,
      },
    }));

    return {
      ok: true,
      data: {
        student_id: studentId,
        nodes,
        edges: graph.edges.map((edge, index) => ({
          id: `edge-${index}`,
          source: edge.from,
          target: edge.to,
          edge_type: "prerequisite_of",
          label: "Gates",
        })),
        summary: {
          total_concepts: nodes.length,
          mastered_concepts: nodes.filter((node) => node.state === "mastered")
            .length,
          learning_concepts: nodes.filter((node) => node.state === "learning")
            .length,
          weak_concepts: nodes.filter((node) => node.state === "weak").length,
          subjects_covered: [...new Set(nodes.map((node) => node.subject))],
        },
        timeline: [],
        is_empty: nodes.length === 0,
      },
    };
  },
};

export default knowledgeService;
