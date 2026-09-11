/**
 * Progress Service - all values are derived from the authenticated student's
 * current mastery/attempt history and goal. No demo profile fallback.
 */
import { studentService } from './studentService';

const ROLE_RULES = [
  { match: ['data science', 'data scientist', 'ds'], role: 'Data Scientist', multiplier: 1.10 },
  { match: ['ai', 'machine learning', 'ml', 'aiml'], role: 'AI / ML Engineer', multiplier: 1.05 },
  { match: ['software', 'swe', 'developer'], role: 'Software Engineer', multiplier: 1.12 },
];

export const progressService = {
  async getStudentProgress(student_id, studentGoal = 'Placement Preparation') {
    const masteryRes = await studentService.getMastery(student_id);
    const data = masteryRes.data || { topics: [], subjects: [], overall_score: 0 };
    const topics = data.topics || [];
    const overall = Math.round((data.overall_score || 0) * 100);
    const attempts = topics.reduce((sum, topic) => sum + Number(topic.attempts || 0), 0);

    const rule = ROLE_RULES.find((item) => item.match.some((term) => String(studentGoal).toLowerCase().includes(term)));
    const targetRole = rule?.role || (studentGoal || 'Learner').replace(/Preparation/gi, '').trim() || 'Learner';
    const placementFit = topics.length ? Math.min(100, Math.max(0, Math.round(overall * (rule?.multiplier || 1)))) : 0;

    const currentWeek = topics.length
      ? Math.min(8, Math.max(1, Math.ceil((overall || 1) / 12.5)))
      : 1;

    const velocity = attempts
      ? Math.round(((overall / Math.max(attempts, 1)) * 10) * 10) / 10
      : 0;

    return {
      overallMastery: overall,
      subjects: data.subjects || [],
      topics,
      targetRole,
      placementFit,
      sprintPace: { currentWeek, totalWeeks: 8 },
      velocity: {
        rate: `${velocity >= 0 ? '+' : ''}${velocity}%`,
        status: !topics.length ? 'Not started' : velocity >= 8 ? 'Healthy' : 'Needs Practice',
        target: 'Based on your attempts',
        pacePercentile: attempts ? `${Math.min(99, 50 + Math.round(velocity * 3))}th pace` : 'Awaiting data',
      },
      focusedHours: {
        // There is no duration column in the supplied schema, so we only
        // estimate from recorded attempts instead of pretending fixed hours.
        total: Math.round(attempts * 0.25 * 10) / 10,
        recentDelta: attempts ? `${Math.min(9.9, Math.round(attempts * 0.1 * 10) / 10)} hrs activity` : 'No activity yet',
        scope: `${data.subjects?.length || 0} active domain${data.subjects?.length === 1 ? '' : 's'}`,
      },
      retentionRate: topics.length ? `${Math.min(99, Math.max(1, Math.round(overall * 0.9 + 10)))}%` : '0%',
      milestones: buildMilestones(topics, overall, targetRole),
    };
  },
};

function buildMilestones(topics, overall, targetRole) {
  const weak = topics.filter((topic) => topic.state === 'weak').sort((a, b) => a.score - b.score)[0];
  const focus = weak ? pretty(weak.topic) : topics[0] ? pretty(topics[0].topic) : 'Diagnostic baseline';

  return [
    { week: 'W1', title: 'Initial diagnostic & foundations', status: overall >= 30 ? 'completed' : topics.length ? 'in-progress' : 'upcoming' },
    { week: 'W2', title: `${focus} practice`, status: overall >= 50 ? 'completed' : topics.length ? 'in-progress' : 'upcoming' },
    { week: 'W3', title: `${targetRole} core skills`, status: overall >= 70 ? 'completed' : overall >= 45 ? 'in-progress' : 'upcoming' },
    { week: 'W4', title: 'Applied problem solving', status: overall >= 85 ? 'completed' : overall >= 65 ? 'in-progress' : 'upcoming' },
    { week: 'W5', title: 'Advanced assessment gate', status: overall >= 95 ? 'completed' : 'upcoming' },
    { week: 'W6-8', title: 'Placement capstone', status: 'upcoming' },
  ];
}

function pretty(value) {
  return String(value || '').replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}

export default progressService;
