'use client';

import { useState } from 'react';

/**
 * Lets the super admin pick an image; converts it to a compressed data URL and
 * stores it in a hidden input so it posts with the form. Keeping photos as data
 * URLs avoids needing object storage for this internal-tool scale. Large images
 * are downscaled to keep the row well under the column limit.
 */
export function ImageUploadField({ name, defaultUrl }: { name: string; defaultUrl: string | null }) {
  const [preview, setPreview] = useState<string | null>(defaultUrl);
  const [value, setValue] = useState<string>(defaultUrl ?? '');
  const [busy, setBusy] = useState(false);

  async function onPick(file: File) {
    setBusy(true);
    try {
      const dataUrl = await downscale(file, 800, 0.8);
      setPreview(dataUrl);
      setValue(dataUrl);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="field">
      <label>Photo</label>
      <input type="hidden" name={name} value={value} />
      <div className="row" style={{ alignItems: 'flex-start', gap: 12 }}>
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Preview" style={{ width: 96, height: 72, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--line)' }} />
        ) : (
          <div className="menu-item-photo-fallback" style={{ width: 96, height: 72, borderRadius: 8 }}>?</div>
        )}
        <div className="stack" style={{ gap: 6 }}>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f); }}
          />
          {busy && <span className="small muted">Processing…</span>}
          {value && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setPreview(null); setValue(''); }}>
              Remove photo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function downscale(file: File, maxW: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('no canvas'));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
