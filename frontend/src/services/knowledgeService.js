/**
 * Knowledge graph service.
 * The curriculum metadata is reusable, but node state/score comes exclusively
 * from the current student's mastery rows.
 */
import { studentService } from './studentService';

export const BASE_CONCEPT_NODES = [
  { id:'conditional_probability', aliases:['cond_prob'], name:'Conditional Probability', subject:'maths', prerequisites:['probability'], description:'Conditional probability foundations.' },
  { id:'bayes_rule', aliases:['bayes_theorem'], name:"Bayes' Theorem", subject:'maths', prerequisites:['conditional_probability'], description:'Bayesian updating and posterior reasoning.' },
  { id:'naive_bayes', aliases:['naive_bayes_classifier'], name:'Naive Bayes Classifier', subject:'aiml', prerequisites:['conditional_probability','bayes_rule'], description:'Probabilistic classification.' },
  { id:'dynamic_programming', aliases:['dp_knapsack'], name:'Dynamic Programming', subject:'dsa', prerequisites:['recursion','memoization'], description:'Subproblem optimization and memoization.' },
  { id:'sql_indexing', aliases:['sql_indexing'], name:'SQL Indexing', subject:'dbms', prerequisites:[], description:'Indexes and query execution.' },
  { id:'gradient_descent', aliases:['loss_gradient'], name:'Gradient Descent', subject:'aiml', prerequisites:['linear_algebra'], description:'Optimization and loss surfaces.' },
];

export const knowledgeService = {
  async getConceptGraph(student_id) {
    const masteryRes = await studentService.getMastery(student_id);
    const topics = masteryRes.data?.topics || [];
    const byKey = new Map(topics.map((topic) => [normalize(topic.topic), topic]));

    // Only render curriculum nodes that belong to this learner's actual
    // mastery state. This prevents every new account from seeing Rahul's graph.
    const nodes = topics.map((topic) => {
      const meta = BASE_CONCEPT_NODES.find((n) => normalize(n.id) === normalize(topic.topic) || n.aliases?.some((alias) => normalize(alias) === normalize(topic.topic)));
      return {
        id: topic.topic,
        name: meta?.name || pretty(topic.topic),
        subject: topic.subject,
        score: Math.round(Number(topic.score || 0) * 100),
        state: topic.state || 'new',
        description: meta?.description || `${pretty(topic.topic)} tracked from your activity.`,
        prerequisites: meta?.prerequisites || [],
      };
    });

    const nodeKeys = new Set(nodes.map((n) => normalize(n.id)));
    const edges = [];
    nodes.forEach((node) => {
      (node.prerequisites || []).forEach((pre) => {
        const target = nodes.find((candidate) => normalize(candidate.id) === normalize(pre) || BASE_CONCEPT_NODES.find((m) => normalize(m.id) === normalize(candidate.id))?.aliases?.some((alias) => normalize(alias) === normalize(pre))); 
        if (target) edges.push({ from: target.id, to: node.id });
      });
    });

    // If the database has per-student edges, prefer them when both endpoints
    // exist in the learner's current node set.
    if (nodes.length && typeof window !== 'undefined') {
      try {
        const { supabase, isSupabaseConfigured } = await import('../lib/supabase');
        if (isSupabaseConfigured && supabase) {
          const { data } = await supabase.from('student_topic_edges').select('topic_id,related_topic_id,relationship_type,weight').eq('student_id', student_id);
          if (data?.length) {
            edges.length = 0;
            data.filter(e => e.relationship_type === 'prerequisite_for').forEach(e => {
              if (nodeKeys.has(normalize(e.topic_id)) && nodeKeys.has(normalize(e.related_topic_id))) edges.push({ from:e.topic_id, to:e.related_topic_id, weight:e.weight });
            });
          }
        }
      } catch (err) { console.warn('Knowledge edge query skipped:', err); }
    }

    return { nodes, edges, bottlenecks: nodes.filter((n) => n.state === 'weak' || n.score < 50) };
  },
};

function normalize(value) { return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, ''); }
function pretty(value) { return String(value || '').replace(/_/g, ' ').replace(/\b\w/g, m => m.toUpperCase()); }
export default knowledgeService;
