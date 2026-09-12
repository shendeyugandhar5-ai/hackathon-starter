import { useTranslation } from '../../i18n';
import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github-dark.min.css';
import { AGENT_STYLES } from '../../services/api';

/**
 * Renders an agent's Markdown/LaTeX response (GFM tables/lists/bold, inline
 * and block math via KaTeX, syntax-highlighted code fences) as formatted
 * HTML instead of raw syntax.
 */
function AgentMarkdown({ content, isError }) {
  return (
    <div
      className={`markdown-body font-sans text-sm leading-relaxed ${
        isError ? 'text-red-700' : 'text-[#1C1917]'
      }`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, [rehypeHighlight, { detect: true }]]}
        components={{
          p: ({ children }) => <p className="mb-2.5 last:mb-0">{children}</p>,
          h1: ({ children }) => (
            <h1 className="mb-2 mt-3 font-sans text-lg font-bold text-[#1C1917] first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-2 mt-3 font-sans text-base font-bold text-[#1C1917] first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-1.5 mt-2.5 font-sans text-sm font-bold text-[#1C1917] first:mt-0">
              {children}
            </h3>
          ),
          ul: ({ children }) => (
            <ul className="mb-2.5 ml-4 list-disc space-y-1 last:mb-0">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-2.5 ml-4 list-decimal space-y-1 last:mb-0">{children}</ol>
          ),
          li: ({ children }) => <li className="pl-0.5">{children}</li>,
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#A8421E] underline underline-offset-2 hover:text-[#8C351A]"
            >
              {children}
            </a>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-[#1C1917]">{children}</strong>
          ),
          blockquote: ({ children }) => (
            <blockquote className="mb-2.5 border-l-2 border-[#EAE5DC] pl-3 text-[#57534E] last:mb-0">
              {children}
            </blockquote>
          ),
          hr: () => <hr className="my-3 border-[#EAE5DC]" />,
          table: ({ children }) => (
            <div className="mb-2.5 overflow-x-auto last:mb-0">
              <table className="min-w-full border-collapse text-xs">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-[#FAF7F2]">{children}</thead>,
          th: ({ children }) => (
            <th className="border border-[#EAE5DC] px-2 py-1 text-left font-bold text-[#1C1917]">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-[#EAE5DC] px-2 py-1 align-top">{children}</td>
          ),
          // react-markdown v10 no longer passes an `inline` flag; fenced
          // blocks are the only ones that arrive with a `language-*`
          // className (added by rehype-highlight), so its absence means
          // this is inline code.
          code: ({ className, children, ...props }) =>
            className ? (
              <code className={`block p-3 font-mono text-[0.85em] leading-relaxed ${className}`} {...props}>
                {children}
              </code>
            ) : (
              <code
                className="rounded bg-[#F2ECE0] px-1 py-0.5 font-mono text-[0.85em] text-[#A8421E]"
                {...props}
              >
                {children}
              </code>
            ),
          pre: ({ children }) => (
            <pre className="mb-2.5 overflow-x-auto rounded-lg last:mb-0">{children}</pre>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

/** One message bubble. Agent messages carry the badge of whichever agent answered. */
function MessageBubble({ message }) {
  const { t } = useTranslation();
  const isStudent = message.role === 'student';
  const style = AGENT_STYLES[message.agent] || AGENT_STYLES.general;

  if (isStudent) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] overflow-hidden rounded-2xl rounded-br-sm bg-[#1C1917]">
          {message.imageUrl && (
            <img
              src={message.imageUrl}
              alt={t('tutor.studentImageAlt')}
              className="max-h-64 w-full object-contain"
            />
          )}
          {message.content && (
            <p className="whitespace-pre-wrap px-4 py-2.5 font-sans text-sm leading-relaxed text-white">
              {message.content}
            </p>
          )}
          {/* What OCR actually read. Shown so a misread is visible to the
              student rather than silently answered as if it were correct. */}
          {message.ocr?.ok && (
            <div className="border-t border-white/10 px-4 py-2.5">
              <p className="font-mono text-[10px] uppercase tracking-wider text-white/40">
                {t('tutor.readFromImage')} &middot; {message.ocr.engine} &middot;{' '}
                {Math.round((message.ocr.confidence || 0) * 100)}%
              </p>
              <p className="mt-1 whitespace-pre-wrap font-mono text-xs leading-relaxed text-white/70">
                {message.ocr.text}
              </p>
            </div>
          )}
          {message.ocr && !message.ocr.ok && (
            <div className="border-t border-white/10 px-4 py-2.5">
              <p className="font-sans text-xs text-amber-300/80">
{t('tutor.imageUnreadable')}
              </p>
            </div>
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
          <AgentMarkdown content={message.content} isError={message.isError} />
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
