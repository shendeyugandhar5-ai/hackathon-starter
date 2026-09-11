import React, { useEffect, useRef } from 'react';
import { AGENT_STYLES } from '../../services/api';

/** One message bubble. Agent messages carry the badge of whichever agent answered. */
function MessageBubble({ message }) {
  const isStudent = message.role === 'student';
  const style = AGENT_STYLES[message.agent] || AGENT_STYLES.general;

  if (isStudent) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] overflow-hidden rounded-2xl rounded-br-sm bg-[#1C1917]">
          {message.imageUrl && (
            <img
              src={message.imageUrl}
              alt="Question attached by the student"
              className="max-h-64 w-full object-contain"
            />
          )}
          {message.content && (
            <p className="whitespace-pre-wrap px-4 py-2.5 font-sans text-sm leading-relaxed text-white">
              {message.content}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%]">
        <div className="mb-1 flex items-center gap-1.5">
          <span
            className="rounded-md px-1.5 py-0.5 font-sans text-[10px] font-bold"
            style={{ background: style.bg, color: style.color }}
          >
            {style.label}
          </span>
          {message.trace?.confidence != null && (
            <span className="font-mono text-[10px] text-[#8C827A]">
              {Math.round(message.trace.confidence * 100)}% confidence
            </span>
          )}
        </div>
        <div
          className={`rounded-2xl rounded-bl-sm border px-4 py-2.5 ${
            message.isError
              ? 'border-red-200 bg-red-50'
              : 'border-[#EAE5DC] bg-white'
          }`}
        >
          <p
            className={`whitespace-pre-wrap font-sans text-sm leading-relaxed ${
              message.isError ? 'text-red-700' : 'text-[#1C1917]'
            }`}
          >
            {message.content}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Scrolling message list. Auto-scrolls to the newest message and shows a
 * typing indicator while the coordinator is routing.
 */
export default function ChatThread({ messages, sending, emptyState }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, sending]);

  if (messages.length === 0 && !sending) {
    return <div className="flex flex-1 items-center justify-center p-6">{emptyState}</div>;
  }

  return (
    <div className="flex-1 space-y-4 overflow-y-auto p-4">
      {messages.map((m) => (
        <MessageBubble key={m.id} message={m} />
      ))}

      {sending && (
        <div className="flex justify-start">
          <div className="rounded-2xl rounded-bl-sm border border-[#EAE5DC] bg-white px-4 py-3">
            <div className="flex gap-1">
              {[0, 150, 300].map((delay) => (
                <span
                  key={delay}
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#8C827A]"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <div ref={endRef} />
    </div>
  );
}
