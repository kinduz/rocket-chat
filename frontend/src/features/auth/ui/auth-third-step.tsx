'use client';

import { Button } from '@app/shared/ui/button';
import { type UseFormReturn, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

export type ProfileFormValues = {
  email: string;
  username: string;
};

type AuthThirdStepProps = {
  form: UseFormReturn<ProfileFormValues>;
  onSubmit: (data: ProfileFormValues) => void;
  onSkip: () => void;
  isLoading: boolean;
};

export const AuthThirdStep = ({
  form,
  onSubmit,
  onSkip,
  isLoading,
}: AuthThirdStepProps) => {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = form;

  const [emailValue, usernameValue] = useWatch({
    control,
    name: ['email', 'username'],
  });
  const isSaveDisabled =
    isLoading || (!emailValue?.trim() && !usernameValue?.trim());

  const inputClass = (hasError: boolean) =>
    `w-full h-[52px] rounded-xl border bg-transparent px-4 text-base outline-none transition-colors ${
      hasError
        ? 'border-red-500 focus:border-red-500'
        : 'border-[#333] focus:border-primary'
    }`;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-col items-center">
        <h4 className="text-[32px] max-md:text-[28px] mt-[22px] mb-3.5 max-md:mb-2 text-center">
          {t('auth.profile.title')}
        </h4>
        <span className="text-[#AAAAAA] text-center">
          {t('auth.profile.subtitle')}
        </span>

        <div className="mt-[24px] max-md:mt-6 w-full flex flex-col gap-4 w-80">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-[#AAAAAA]">
              {t('auth.profile.emailLabel')}
            </label>
            <input
              {...register('email')}
              type="email"
              placeholder={t('auth.profile.emailPlaceholder')}
              className={inputClass(!!errors.email)}
            />
            {errors.email?.message && (
              <span className="text-sm text-red-500">
                {errors.email.message}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm text-[#AAAAAA]">
              {t('auth.profile.usernameLabel')}
            </label>
            <input
              {...register('username')}
              type="text"
              placeholder={t('auth.profile.usernamePlaceholder')}
              className={inputClass(!!errors.username)}
            />
            <span className="text-sm text-red-500">
              {errors?.username?.message ?? null}
            </span>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isSaveDisabled}
          className="text-lg w-[324px] h-[52px] mt-[49px] max-md:mt-8"
        >
          {t('auth.profile.saveButton')}
        </Button>

        <Button
          type="button"
          variant="link"
          onClick={onSkip}
          className="mt-4 h-[52px] text-lg"
        >
          {t('auth.profile.skipButton')}
        </Button>
      </div>
    </form>
  );
};
