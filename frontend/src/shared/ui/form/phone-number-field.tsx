'use client';

import type { ErrorMessageType } from '@app/shared/types';
import { Controller, useFormContext } from 'react-hook-form';
import PhoneInput, { type PhoneInputProps } from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

type PhoneNumberFieldProps = PhoneInputProps &
  ErrorMessageType & {
    name: string;
  };

export const PhoneNumberField = ({
  name,
  errorMessage,
  ...rest
}: PhoneNumberFieldProps) => {
  return (
    <div className="flex flex-col gap-2">
      {/* <Controller
        name={name}
        control={control}
        render={({ field, fieldState }) => (
          <>
            <PhoneInput
              {...rest}
              value={field.value}
              onChange={field.onChange}
              inputProps={{ name, onBlur: field.onBlur }}
            />
            {(fieldState.error?.message ?? errorMessage) && (
              <span className="text-sm text-red-500">
                {fieldState.error?.message ?? errorMessage}
              </span>
            )}
          </>
        )}
      /> */}
      <PhoneInput {...rest} />
    </div>
  );
};
