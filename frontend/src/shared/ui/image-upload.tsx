'use client';

import { cn } from '@app/shared/lib/utils';
import { Camera, X } from 'lucide-react';
import { useEffect, useId, useMemo, useState } from 'react';

type ImageUploadValue = File | string | null | undefined;

type ImageUploadProps = {
  value?: ImageUploadValue;
  onChange?: (file: File | null) => void;
  accept?: string;
  disabled?: boolean;
  className?: string;
  alt?: string;
};

export const ImageUpload = ({
  value,
  onChange,
  accept = 'image/*',
  disabled,
  className,
  alt = '',
}: ImageUploadProps) => {
  const inputId = useId();
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState<File | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  const currentValue = isControlled ? value : internalValue;

  useEffect(() => {
    if (currentValue instanceof File) {
      const url = URL.createObjectURL(currentValue);
      setObjectUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setObjectUrl(null);
  }, [currentValue]);

  const previewUrl = useMemo(() => {
    if (typeof currentValue === 'string' && currentValue) return currentValue;
    return objectUrl;
  }, [currentValue, objectUrl]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!isControlled) setInternalValue(file);
    onChange?.(file);
    e.target.value = '';
  };

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isControlled) setInternalValue(null);
    onChange?.(null);
  };

  return (
    <div className={cn('group relative inline-block size-24', className)}>
      <label
        htmlFor={inputId}
        aria-disabled={disabled}
        className={cn(
          'relative flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[#1f1f1f] border border-[#333] transition-colors',
          disabled
            ? 'cursor-not-allowed opacity-60'
            : 'cursor-pointer hover:border-primary',
        )}
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={alt}
            className="h-full w-full object-cover"
          />
        ) : (
          <Camera
            className="text-[#888] transition-colors group-hover:text-primary"
            style={{ width: '34%', height: '34%' }}
          />
        )}
      </label>

      {previewUrl && !disabled && (
        <button
          type="button"
          aria-label="Remove image"
          onClick={handleClear}
          style={{ width: '28%', height: '28%' }}
          className="absolute right-0 bottom-0 flex items-center justify-center rounded-full bg-[#2a2a2a] border-2 border-[#0f0f0f] text-white opacity-0 transition-opacity hover:bg-[#3a3a3a] group-hover:opacity-100 focus-visible:opacity-100 cursor-pointer"
        >
          <X style={{ width: '55%', height: '55%' }} />
        </button>
      )}

      <input
        id={inputId}
        type="file"
        accept={accept}
        disabled={disabled}
        onChange={handleChange}
        className="sr-only"
      />
    </div>
  );
};
