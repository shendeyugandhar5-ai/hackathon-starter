/**
 * Image question attachment.
 *
 * A phone photo is often 4-8MB, which is wasteful to base64 into a JSON body
 * and slow for the model to ingest. We downscale to a sane max dimension and
 * re-encode as JPEG before sending — text in a question stays perfectly
 * legible at 1600px, and payloads drop by an order of magnitude.
 */
import { useCallback, useState } from 'react';

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.85;
const MAX_INPUT_BYTES = 15 * 1024 * 1024;

/** Downscale + re-encode a File into a data URL. */
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Could not read that file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('That file is not a readable image.'));
      img.onload = () => {
        const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        // White backdrop so transparent PNGs don't turn black as JPEG
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        resolve({
          dataUrl: canvas.toDataURL('image/jpeg', JPEG_QUALITY),
          width,
          height,
        });
      };
      img.src = reader.result;
    };

    reader.readAsDataURL(file);
  });
}

export function useImageAttachment() {
  const [image, setImage] = useState(null); // { dataUrl, name, width, height }
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const attach = useCallback(async (file) => {
    if (!file) return null;

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return null;
    }
    if (file.size > MAX_INPUT_BYTES) {
      setError('That image is too large (max 15MB).');
      return null;
    }

    setError(null);
    setProcessing(true);
    try {
      const { dataUrl, width, height } = await fileToDataUrl(file);
      const next = { dataUrl, name: file.name, width, height };
      setImage(next);
      return next;
    } catch (e) {
      setError(e.message || 'Could not process that image.');
      return null;
    } finally {
      setProcessing(false);
    }
  }, []);

  /** Accept an image pasted straight into the composer (Ctrl+V a screenshot). */
  const attachFromPaste = useCallback(
    async (event) => {
      const item = Array.from(event.clipboardData?.items || []).find((i) =>
        i.type.startsWith('image/')
      );
      if (!item) return null;
      event.preventDefault();
      return attach(item.getAsFile());
    },
    [attach]
  );

  const clear = useCallback(() => {
    setImage(null);
    setError(null);
  }, []);

  return { image, processing, error, attach, attachFromPaste, clear };
}

export default useImageAttachment;
