'use client';

import { cn } from '@app/lib/utils';
import type { ErrorMessageType } from '@app/shared/types';
import isoCountries from 'i18n-iso-countries';
import enLocale from 'i18n-iso-countries/langs/en.json';
import ruLocale from 'i18n-iso-countries/langs/ru.json';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  defaultCountries,
  FlagImage,
  parseCountry,
  usePhoneInput,
} from 'react-international-phone';
import 'react-international-phone/style.css';

isoCountries.registerLocale(enLocale);
isoCountries.registerLocale(ruLocale);

type PhoneNumberFieldProps = ErrorMessageType & {
  name?: string;
  value?: string;
  defaultCountry?: string;
  onChange?: (phone: string) => void;
  onValidate?: (isValid: boolean) => void;
  className?: string;
};

const fixedCountries = defaultCountries.map((c) => {
  const { iso2 } = parseCountry(c);
  if (iso2 === 'ru') return [c[0], c[1], c[2], c[3], 0] as typeof c;
  if (iso2 === 'kz')
    return [c[0], c[1], c[2], c[3], 1, ['76', '77']] as typeof c;
  return c;
});

const baseCountries = fixedCountries.map(parseCountry);

export const PhoneNumberField = ({
  name,
  errorMessage,
  defaultCountry = 'ru',
  value,
  onChange,
  onValidate,
  className,
}: PhoneNumberFieldProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { i18n } = useTranslation();

  const { inputValue, handlePhoneValueChange, inputRef, country, setCountry, phone } =
    usePhoneInput({
      defaultCountry,
      countries: fixedCountries,
      value,
      onChange: ({ phone: p }) => onChange?.(p),
    });

  const { iso2 } = country;

  useEffect(() => {
    if (!onValidate) return;
    const digits = phone.replace(/\D/g, '');
    const format = typeof country.format === 'string' ? country.format : '';
    const maskDigits = format.replace(/[^.]/g, '').length;
    const expectedLength = country.dialCode.length + maskDigits;
    onValidate(digits.length >= expectedLength && expectedLength > 0);
  }, [phone, country, onValidate]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    // Use rAF to ensure cursor is placed after autoFocus
    requestAnimationFrame(() => {
      const len = el.value.length;
      el.setSelectionRange(len, len);
    });
  }, [inputRef]);

  const getLocalizedName = (countryIso2: string, fallback: string) =>
    isoCountries.getName(countryIso2.toUpperCase(), i18n.language) ?? fallback;

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex gap-2.5 flex-col">
        {/* Country selector */}
        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            onClick={() => setIsOpen((v) => !v)}
            className="cursor-pointer phone-field-trigger flex items-center gap-2 px-3 w-[324px] justify-between"
          >
            <div className="flex items-center gap-4">
              <FlagImage iso2={iso2} size={32} />
              <span className="font-medium whitespace-nowrap max-w-[240px] text-ellipsis overflow-hidden">
                {getLocalizedName(country.iso2, country.name)}
              </span>
            </div>
            <svg
              aria-hidden="true"
              className={cn(
                'phone-field-chevron size-6 transition-transform right-0',
                isOpen && 'rotate-180',
              )}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                d="M6 9l6 6 6-6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Dropdown */}
          {isOpen && (
            <div className="w-full bg-background phone-field-dropdown absolute top-full z-50 mt-1 max-h-60 w-56 overflow-y-auto py-1">
              {baseCountries.map((c) => (
                <button
                  key={c.iso2}
                  type="button"
                  onClick={() => {
                    setCountry(c.iso2);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'cursor-pointer phone-field-option flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm',
                    c.iso2 === iso2 && 'phone-field-option--active',
                  )}
                >
                  <FlagImage iso2={c.iso2} size={28} />
                  <span className="flex-1 ml-2 truncate">
                    {getLocalizedName(c.iso2, c.name)}
                  </span>
                  <span className="text-xs opacity-50">+{c.dialCode}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Phone input */}
        <div className="relative">
          <input
            // biome-ignore lint/a11y/noAutofocus: <>
            autoFocus
            ref={inputRef}
            name={name}
            value={inputValue}
            onChange={handlePhoneValueChange}
            type="tel"
            className="phone-field-input flex-1 px-4 w-full text-lg"
          />
        </div>
      </div>

      {errorMessage && (
        <span className="text-sm text-destructive">{errorMessage}</span>
      )}
    </div>
  );
};
