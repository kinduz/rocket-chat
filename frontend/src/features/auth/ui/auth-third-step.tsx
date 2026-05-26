'use client';

import { ImageUpload } from '@app/shared';
import { Button } from '@app/shared/ui/button';
import { Controller, type UseFormReturn, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

export type ProfileFormValues = {
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatar: File | null;
};

type AuthThirdStepProps = {
  form: UseFormReturn<ProfileFormValues>;
  onSubmit: (data: ProfileFormValues) => void;
  isLoading: boolean;
};

export const AuthThirdStep = ({
  form,
  onSubmit,
  isLoading,
}: AuthThirdStepProps) => {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = form;

  const [firstNameValue] = useWatch({
    control,
    name: ['firstName'],
  });
  const isSaveDisabled = isLoading || !firstNameValue?.trim();

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

        <div className="mt-6 max-md:mt-6 flex flex-col items-center gap-4 w-80">
          <Controller
            control={control}
            name="avatar"
            render={({ field }) => (
              <ImageUpload
                className="size-36"
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />

          <div className="flex flex-col gap-1.5 w-full">
            <label htmlFor="firstName" className="text-sm text-[#AAAAAA]">
              {t('auth.profile.firstNameLabel')}
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              id="firstName"
              {...register('firstName')}
              type="text"
              placeholder={t('auth.profile.firstNamePlaceholder')}
              className={inputClass(!!errors.firstName)}
            />
            {errors.firstName?.message && (
              <span className="text-sm text-red-500">
                {errors.firstName.message}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1.5 w-full">
            <label htmlFor="lastName" className="text-sm text-[#AAAAAA]">
              {t('auth.profile.lastNameLabel')}
            </label>
            <input
              id="lastName"
              {...register('lastName')}
              type="text"
              placeholder={t('auth.profile.lastNamePlaceholder')}
              className={inputClass(!!errors.lastName)}
            />
            {errors.lastName?.message && (
              <span className="text-sm text-red-500">
                {errors.lastName.message}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1.5 w-full">
            <label htmlFor="email" className="text-sm text-[#AAAAAA]">
              {t('auth.profile.emailLabel')}
            </label>
            <input
              id="email"
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

          <div className="flex flex-col gap-1.5 w-full">
            <label htmlFor="username" className="text-sm text-[#AAAAAA]">
              {t('auth.profile.usernameLabel')}
            </label>
            <input
              id="username"
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
      </div>
    </form>
  );
};
