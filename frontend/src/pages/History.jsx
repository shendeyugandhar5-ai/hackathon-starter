import React from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Clock, MessageSquare, ArrowRight } from "lucide-react";
import TopBar from "../components/layout/TopBar";
import { useConversations } from "../hooks/useStudent";
import { useStudentId } from "../hooks/useStudentId";

/** "3 days ago" / "Today, 14:20" style stamps from an ISO timestamp. */
function formatWhen(iso) {
  if (!iso) return "—";

  const then = new Date(iso);
  const days = Math.floor((Date.now() - then.getTime()) / 86400000);

  const time = then.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (days === 0) return `Today, ${time}`;
  if (days === 1) return `Yesterday, ${time}`;

  return `${days} days ago`;
}

/**
 * Session history — real conversation threads from the database.
 * Clicking one opens it in the Tutor page, where it can be continued.
 */
export default function History() {
  const { setSidebarOpen } = useOutletContext();
  const navigate = useNavigate();
  const studentId = useStudentId();

  const { conversations, loading, error } = useConversations(studentId, 50);

  return (
    <div className="min-h-screen bg-[#FAF7F2] pb-12">
      <TopBar onMenuClick={() => setSidebarOpen(true)} />

      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-6 space-y-6">
        {/* Page Header */}
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#8C827A] font-semibold mb-1">
            ACADEMIC LOGS &amp; DIAGNOSTIC ARCHIVE
          </div>

          <h1 className="font-serif text-3xl font-normal text-[#1C1917]">
            Session History
          </h1>

          <p className="text-xs text-[#57534E] mt-1">
            Every tutoring thread, persisted and resumable — the coordinator
            reloads the last turns as context when you continue one.
          </p>
        </div>

        {/* Session List */}
        <div className="max-w-5xl">
          <div className="space-y-3">
            {/* Loading */}
            {loading && (
              <>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-24 animate-pulse rounded-xl bg-white/60"
                  />
                ))}
              </>
            )}

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-5">
                <p className="font-sans text-xs font-bold text-red-800">
                  Could not load session history
                </p>

                <p className="mt-1 font-sans text-[11px] text-red-700">
                  {error}
                </p>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && conversations.length === 0 && (
              <div className="rounded-xl border border-[#EAE5DC] bg-white p-8 text-center">
                <MessageSquare className="mx-auto h-6 w-6 text-[#8C827A]" />

                <h3 className="mt-2 font-sans text-sm font-bold text-[#1C1917]">
                  No sessions yet
                </h3>

                <p className="mt-1 font-sans text-xs text-[#8C827A]">
                  Start a conversation in the Tutor workspace and it will appear
                  here.
                </p>

                <button
                  onClick={() => navigate("/app/tutor")}
                  className="
                      mt-4
                      inline-flex
                      items-center
                      gap-1.5
                      rounded-full
                      bg-[#A8421E]
                      px-4
                      py-1.5
                      font-sans
                      text-xs
                      font-semibold
                      text-white
                    "
                >
                  Open Tutor
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            )}

            {/* Conversations */}
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => navigate(`/app/tutor?conversation=${c.id}`)}
                className="
                  flex
                  w-full
                  flex-col
                  justify-between
                  gap-4
                  rounded-xl
                  border
                  border-[#EAE5DC]
                  bg-white
                  p-5
                  text-left
                  shadow-[0_1px_3px_rgba(0,0,0,0.02)]
                  transition-colors
                  hover:border-[#D4CCBE]
                  sm:flex-row
                  sm:items-center
                  cursor-pointer
                "
              >
                <div className="min-w-0">
                  {/* Session ID + Time */}
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#A8421E]">
                      {c.id.slice(0, 8)}
                    </span>

                    <span className="font-mono text-[10px] text-[#8C827A]">
                      • {formatWhen(c.last_message_at || c.created_at)}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="mt-1 truncate text-sm font-semibold text-[#1C1917]">
                    {c.title || "Untitled session"}
                  </h3>

                  {/* Message Count */}
                  <div className="mt-2 flex items-center gap-1.5 font-mono text-[10px] text-[#57534E]">
                    <Clock className="h-3 w-3" />
                    {c.message_count} messages
                  </div>
                </div>

                {/* Continue */}
                <div className="shrink-0 text-right">
                  <span className="inline-flex items-center gap-1 font-sans text-[11px] font-semibold text-[#A8421E]">
                    Continue
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
