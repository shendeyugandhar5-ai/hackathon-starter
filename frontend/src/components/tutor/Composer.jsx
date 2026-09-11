import { useTranslation } from '../../i18n';
import React, { useEffect, useRef, useState } from 'react';
import { Send, Mic, MicOff, ImagePlus, X, Loader2 } from 'lucide-react';
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';
import { useImageAttachment } from '../../hooks/useImageAttachment';

/**
 * Message composer: type, speak, or attach a question as an image.
 *
 * Voice is transcribed in the browser and appended to the textbox, so the
 * student can edit it before sending. Images are downscaled client-side and
 * sent as a data URL alongside whatever text was typed.
 */
export default function Composer({ onSend, sending, error }) {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  const image = useImageAttachment();

  const speech = useSpeechRecognition({
    onResult: (transcript) => {
      // Append rather than replace, so dictation can extend a typed question
      setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
      textareaRef.current?.focus();
    },
  });

  // Grow the textarea with its content, up to a cap
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  }, [text, speech.interim]);

  const canSend = (text.trim() || image.image) && !sending && !image.processing;

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!canSend) return;
    if (speech.listening) speech.stop();

    const payloadText = text.trim();
    const payloadImage = image.image;
    setText('');
    image.clear();

    await onSend(payloadText, payloadImage);
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (file) image.attach(file);
    e.target.value = ''; // let the same file be picked again
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-[#EAE5DC] p-3">
      {/* Errors */}
      {(error || speech.error || image.error) && (
        <p className="mb-2 font-sans text-[11px] text-red-600">
          {error || speech.error || image.error}
        </p>
      )}

      {/* Attached image preview */}
      {image.image && (
        <div className="mb-2 inline-flex items-center gap-2 rounded-lg border border-[#EAE5DC] bg-[#FAF7F2] p-1.5 pr-2">
          <img
            src={image.image.dataUrl}
            alt={t('tutor.attachedQuestion')}
            className="h-12 w-12 rounded object-cover"
          />
          <div className="min-w-0">
            <p className="max-w-[180px] truncate font-sans text-[11px] font-medium text-[#1C1917]">
              {image.image.name}
            </p>
            <p className="font-mono text-[10px] text-[#8C827A]">
              {image.image.width}×{image.image.height}
            </p>
          </div>
          <button
            type="button"
            onClick={image.clear}
            className="rounded p-1 text-[#8C827A] transition-colors hover:bg-white hover:text-[#1C1917]"
            title={t('tutor.removeImage')}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Listening indicator */}
      {speech.listening && (
        <div className="mb-2 flex items-center gap-2 rounded-lg bg-[#FDF4F0] px-2.5 py-1.5">
          <span className="flex gap-0.5">
            {[0, 150, 300].map((d) => (
              <span
                key={d}
                className="h-3 w-0.5 animate-pulse rounded-full bg-[#A8421E]"
                style={{ animationDelay: `${d}ms` }}
              />
            ))}
          </span>
          <span className="font-sans text-[11px] text-[#A8421E]">
            {speech.interim || 'Listening… speak your question'}
          </span>
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Attach image */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFile}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={image.processing}
          title={t('tutor.attachImage')}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#EAE5DC] bg-white text-[#57534E] transition-colors hover:bg-[#FAF7F2] disabled:opacity-40"
        >
          {image.processing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ImagePlus className="h-4 w-4" />
          )}
        </button>

        {/* Voice — hidden entirely where the browser has no support */}
        {speech.supported && (
          <button
            type="button"
            onClick={speech.toggle}
            title={speech.listening ? 'Stop listening' : 'Ask with your voice'}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition-colors ${
              speech.listening
                ? 'border-[#A8421E] bg-[#A8421E] text-white'
                : 'border-[#EAE5DC] bg-white text-[#57534E] hover:bg-[#FAF7F2]'
            }`}
          >
            {speech.listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </button>
        )}

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onPaste={image.attachFromPaste}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) handleSubmit(e);
          }}
          rows={1}
          placeholder={
            image.image
              ? 'Add a note about the image, or just send it…'
              : 'Ask your tutor…  (Enter to send, or paste a screenshot)'
          }
          className="max-h-32 flex-1 resize-none rounded-lg border border-[#EAE5DC] bg-[#FAF7F2] px-3 py-2 font-sans text-sm text-[#1C1917] outline-none transition-colors placeholder:text-[#A8A29E] focus:border-[#A8421E]"
        />

        <button
          type="submit"
          disabled={!canSend}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#A8421E] text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
