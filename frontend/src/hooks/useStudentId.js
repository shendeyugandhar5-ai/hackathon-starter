/**
 * Resolves the backend `student_id` for the signed-in user.
 *
 * The backend auto-creates a student row on first chat (`ensure_student`),
 * so any stable id works. For the demo we default to the seeded student
 * ('rahul'), which already has mastery scores, prerequisite edges, and
 * recommendations — so the dashboard isn't empty on first load.
 *
 * Set VITE_DEMO_STUDENT_ID='' to use real per-user ids instead.
 */
import { useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const DEMO_STUDENT_ID =
  import.meta.env.VITE_DEMO_STUDENT_ID !== undefined
    ? import.meta.env.VITE_DEMO_STUDENT_ID
    : 'rahul';

export function useStudentId() {
  const { profile } = useAuth();

  const studentId = useMemo(() => {
    if (DEMO_STUDENT_ID) return DEMO_STUDENT_ID;
    return profile?.id || 'guest';
  }, [profile?.id]);

  // Make sure the row exists so mastery/trace writes have somewhere to land
  useEffect(() => {
    if (!studentId) return;
    api.createStudent({
      id: studentId,
      name: profile?.full_name || null,
      goal: profile?.goal || null,
    });
  }, [studentId, profile?.full_name, profile?.goal]);

  return studentId;
}

export default useStudentId;
