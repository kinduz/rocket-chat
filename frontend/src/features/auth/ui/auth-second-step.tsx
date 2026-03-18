import { Button } from '@app/shared/ui/button';
import { Hint } from '@app/shared/ui/hint';
import { OTPInput } from 'input-otp';
import { useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useCountdown } from '../hooks/use-countdown';
import { formatCountdown } from '../lib/format-countdown';
import { maskPhone } from '../lib/mask-phone';
import { OtpSlot } from './otp-slot';

type AuthSecondStepProps = {
  form: UseFormReturn<{ otp: string }>;
  phone: string;
  ttlMin: number;
  onSubmit: (data: { otp: string }) => void;
  onResend: () => void;
  onGoBack: () => void;
  isLoading: boolean;
  isResending: boolean;
};

const OTP_LENGTH = 6;

export const AuthSecondStep = ({
  form,
  phone,
  ttlMin,
  onSubmit,
  onResend,
  onGoBack,
  isLoading,
  isResending,
}: AuthSecondStepProps) => {
  const { t } = useTranslation();
  const { watch, handleSubmit, setValue } = form;
  const otp = watch('otp');

  const [expired, setExpired] = useState(false);
  const [resendKey, setResendKey] = useState(0);
  const secondsLeft = useCountdown(ttlMin, () => setExpired(true), resendKey);

  const handleResend = () => {
    setExpired(false);
    setResendKey((k) => k + 1);
    onResend();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-2 mt-[22px] mb-3.5 max-md:mb-2">
          <h4 className="text-[32px] max-md:text-[28px] text-center">
            {t('auth.otp.title')}
          </h4>
          <Hint content={t('auth.otp.devHint')} />
        </div>
        <span className="text-[#AAAAAA] text-center">
          {t('auth.otp.subtitle', { phone: maskPhone(phone) })}
        </span>

        <div className="mt-[49px] max-md:mt-6">
          <OTPInput
            maxLength={OTP_LENGTH}
            value={otp}
            onChange={(val) => setValue('otp', val)}
            render={({ slots }) => (
              <div className="flex gap-3 max-md:gap-2">
                {slots.map((slot, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: OTP slots are positional
                  <OtpSlot key={i} {...slot} />
                ))}
              </div>
            )}
          />
        </div>

        <div className="mt-5 h-6">
          {expired ? (
            <Button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              variant="link"
              className="text-primary hover:text-primary-contrast text-sm transition-colors disabled:opacity-50"
            >
              {t('auth.otp.resendButton')}
            </Button>
          ) : (
            <span className="text-[#AAAAAA] text-sm">
              {t('auth.otp.resendCountdown', {
                time: formatCountdown(secondsLeft),
              })}
            </span>
          )}
        </div>

        <Button
          type="submit"
          disabled={isLoading || otp.length < OTP_LENGTH}
          className="text-lg w-[324px] h-[52px] mt-[49px] max-md:mt-8"
        >
          {t('auth.otp.submitButton')}
        </Button>

        <Button
          type="button"
          variant="link"
          onClick={onGoBack}
          className="mt-4 h-[52px] text-lg"
        >
          {t('auth.otp.changePhone')}
        </Button>
      </div>
    </form>
  );
};
