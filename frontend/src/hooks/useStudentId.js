/**
 * Resolves the backend `student_id` for the signed-in user.
 *
 * The backend auto-creates a student row on first chat (`ensure_student`),
 * so each authenticated user keeps an independent mastery record.
 *
 * Set VITE_DEMO_STUDENT_ID only when intentionally using a shared demo account.
 */
import { useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const DEMO_STUDENT_ID =
  import.meta.env.VITE_DEMO_STUDENT_ID !== undefined
    ? import.meta.env.VITE_DEMO_STUDENT_ID
    : "";

export function useStudentId() {
  const { profile } = useAuth();

  const studentId = useMemo(
    () => DEMO_STUDENT_ID || profile?.student_id || profile?.id || "guest",
    [profile?.student_id, profile?.id],
  );

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
