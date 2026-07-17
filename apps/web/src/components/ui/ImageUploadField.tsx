'use client';

import { ChangeEvent, ReactNode, useRef, useState } from 'react';
import { Button } from './Button';
import { FormError } from './CrudForm';
import { getUploadErrorMessage } from '@/lib/uploads';

interface ImageUploadFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  onUpload: (file: File) => Promise<string>;
  preview: ReactNode;
  hint?: string;
}

export function ImageUploadField({
  label,
  value,
  onChange,
  onUpload,
  preview,
  hint = 'JPG, PNG o WebP. Máximo 5 MB.',
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setUploading(true);
    setUploadError('');
    try {
      const url = await onUpload(file);
      onChange(url);
    } catch (err) {
      setUploadError(getUploadErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="block text-sm font-semibold text-foreground mb-1.5">
          {label}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
          >
            {uploading ? 'Subiendo...' : value ? 'Cambiar imagen' : 'Subir imagen'}
          </Button>
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={uploading}
              onClick={() => onChange('')}
            >
              Quitar
            </Button>
          )}
        </div>
        <p className="text-xs text-text-secondary mt-1.5">{hint}</p>
      </div>

      {uploadError && <FormError message={uploadError} />}

      <div>{preview}</div>
    </div>
  );
}
