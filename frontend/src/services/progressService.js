/**
 * Progress Service
 * Computes dynamic pathway milestones, velocity metrics, and placement benchmarks.
 */

import { studentService } from './studentService';
import { studentProfile } from '../data/mockData';

export const progressService = {
  /**
   * Get aggregated progress, roadmap timeline, and placement match
   */
  async getStudentProgress(student_id, studentGoal = 'Placement Preparation') {
    const masteryRes = await studentService.getMastery(student_id);
    const masteryData = masteryRes.data || {};
    const overallScore = Math.round((masteryData.overall_score || 0.68) * 100);

    // Dynamic placement fit based on goal and mastery
    let targetRole = studentGoal || 'Placement Preparation';
    let targetBench = 74;
    if (targetRole.toLowerCase().includes('data science') || targetRole.toLowerCase().includes('ds')) {
      targetRole = 'Data Scientist';
      targetBench = Math.min(96, Math.max(45, Math.round(overallScore * 1.1)));
    } else if (targetRole.toLowerCase().includes('ai') || targetRole.toLowerCase().includes('machine')) {
      targetRole = 'AI / ML Engineer';
      targetBench = Math.min(94, Math.max(40, Math.round(overallScore * 1.05)));
    } else if (targetRole.toLowerCase().includes('software') || targetRole.toLowerCase().includes('swe')) {
      targetRole = 'Software Engineer';
      targetBench = Math.min(95, Math.max(50, Math.round(overallScore * 1.12)));
    }

    return {
      overallMastery: overallScore,
      placementFit: targetBench,
      targetRole: targetRole,
      sprintPace: {
        currentWeek: Math.min(8, Math.max(1, Math.ceil((overallScore / 100) * 8))),
        totalWeeks: 8,
      },
      velocity: {
        rate: `+${Math.round((overallScore / 4.2) * 10) / 10}%`,
        status: overallScore >= 60 ? 'Optimal' : 'Needs Acceleration',
        target: '+12%/wk',
        pacePercentile: overallScore >= 70 ? 'P92 Pace' : 'P78 Pace',
      },
      focusedHours: {
        total: Math.round(overallScore * 0.56 * 10) / 10,
        recentDelta: '+4.2 hrs',
        scope: 'Across active domain tracks',
      },
      retentionRate: `${Math.min(99, Math.round(85 + overallScore * 0.12))}%`,
      milestones: [
        { week: 'W1', title: 'Mathematical Foundations & Probability', status: overallScore >= 30 ? 'completed' : 'in-progress' },
        { week: 'W2', title: 'Bayes Reasoning & Classification Models', status: overallScore >= 50 ? 'completed' : (overallScore >= 25 ? 'in-progress' : 'upcoming') },
        { week: 'W3', title: 'Graph Algorithms & Relational Indexing', status: overallScore >= 70 ? 'completed' : (overallScore >= 45 ? 'in-progress' : 'upcoming') },
        { week: 'W4', title: 'Neural Architectures & Loss Geometry', status: overallScore >= 85 ? 'completed' : (overallScore >= 65 ? 'in-progress' : 'upcoming') },
        { week: 'W5', title: 'System Design & Scalable ML Pipelines', status: overallScore >= 95 ? 'completed' : 'upcoming' },
        { week: 'W6-8', title: 'Placement Capstones & Mock Socratic Salons', status: 'upcoming' },
      ],
    };
  }
};

export default progressService;
