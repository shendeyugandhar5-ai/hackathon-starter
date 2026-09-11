/**
 * Resolves the backend `student_id` for the current user.
 *
 * Precedence, highest first:
 *   1. The authenticated Supabase user's id  — real users always win
 *   2. VITE_DEMO_STUDENT_ID                   — explicit demo override
 *   3. 'guest'                                — unauthenticated fallback
 *
 * The demo id only applies when nobody is signed in, so a logged-in student
 * can never be silently served the seeded demo profile's data.
 *
 * The backend auto-creates the student row on first contact
 * (`ensure_student`), so any stable id works.
 */
import { useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const DEMO_STUDENT_ID = import.meta.env.VITE_DEMO_STUDENT_ID || '';

export function useStudentId() {
  const { profile, isAuthenticated } = useAuth();

  const studentId = useMemo(() => {
    // An authenticated user always uses their own id
    if (isAuthenticated && profile?.id) return profile.id;
    // Otherwise fall back to the demo profile, then to a guest bucket
    return DEMO_STUDENT_ID || 'guest';
  }, [isAuthenticated, profile?.id]);

  // Ensure the row exists so mastery/trace/conversation writes land somewhere
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
