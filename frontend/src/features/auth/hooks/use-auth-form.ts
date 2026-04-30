import { useToast } from '@app/shared';
import { ACCESS_TOKEN_KEY, ApiErrorCode, rcClient } from '@app/shared/api';
import i18n from '@app/shared/i18n/i18n';
import { yupResolver } from '@hookform/resolvers/yup';
import Cookies from 'js-cookie';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useAsyncFn } from 'react-use';
import * as yup from 'yup';
import type { ProfileFormValues } from '../ui/auth-third-step';

export type AuthStep = 'phone' | 'otp' | 'profile';

type PhoneFormValues = { phone: string };
type OtpFormValues = { otp: string };

const phoneSchema = yup.object({
  phone: yup.string().required(() => i18n.t('auth.validation.phoneRequired')),
});

const otpSchema = yup.object({
  otp: yup
    .string()
    .required(() => i18n.t('auth.validation.otpRequired'))
    .length(6, () => i18n.t('auth.validation.otpLength')),
});

const profileSchema = yup.object({
  email: yup
    .string()
    .transform((v) => (v === '' ? undefined : v))
    .email(() => i18n.t('auth.validation.emailInvalid'))
    .optional(),
  username: yup
    .string()
    .transform((v) => (v === '' ? undefined : v))
    .min(3, () => i18n.t('auth.validation.usernameMin', { min: 3 }))
    .max(32, () => i18n.t('auth.validation.usernameMax', { max: 32 }))
    .matches(/^[a-zA-Z0-9_]+$/, () => i18n.t('auth.validation.usernameFormat'))
    .optional(),
});

export const useAuthForm = (onFinish?: () => void) => {
  const {
    i18n: { language },
  } = useTranslation();
  const [step, setStep] = useState<AuthStep>('phone');
  const [phone, setPhone] = useState('');
  const [ttlMin, setTtlMin] = useState(1);
  const [isPhoneValid, setIsPhoneValid] = useState(false);

  const toast = useToast();

  const [otpCode, setOtpCode] = useState('');

  const phoneForm = useForm<PhoneFormValues>({
    resolver: yupResolver(phoneSchema),
    defaultValues: { phone: '' },
  });

  const otpForm = useForm<OtpFormValues>({
    resolver: yupResolver(otpSchema),
    defaultValues: { otp: '' },
  });

  const profileForm = useForm<ProfileFormValues>({
    resolver: yupResolver(profileSchema) as never,
    defaultValues: { email: '', username: '', avatar: null },
  });

  const handlePhoneValidate = useCallback(
    (isValid: boolean) => {
      setIsPhoneValid(isValid);
      if (
        phoneForm.formState.errors.phone?.type === 'phoneInvalid' &&
        isValid
      ) {
        phoneForm.clearErrors('phone');
      }
    },
    [phoneForm],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: re-validate on language change to update error messages
  useEffect(() => {
    if (phoneForm.formState.errors.phone) {
      phoneForm.trigger();
    }
  }, [language, phoneForm]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: re-validate on language change to update error messages
  useEffect(() => {
    if (otpForm.formState.errors.otp) {
      otpForm.trigger();
    }
  }, [language, otpForm]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: re-validate on language change to update error messages
  useEffect(() => {
    const hasErrors =
      !!profileForm.formState.errors.email ||
      !!profileForm.formState.errors.username;
    if (hasErrors) {
      profileForm.trigger();
    }
  }, [language, profileForm]);

  const [sendOtpState, sendOtp] = useAsyncFn(
    async (data: PhoneFormValues) => {
      if (!isPhoneValid) {
        phoneForm.setError('phone', {
          type: 'phoneInvalid',
          message: i18n.t('auth.validation.phoneInvalid'),
        });
        return;
      }
      const res = await rcClient.auth.sendOtp({ phone: data.phone });
      if (res.error) {
        const isOTPWasSent = res.error === ApiErrorCode.OTP_ALREADY_SENT;
        toast.error(
          i18n.t(
            isOTPWasSent
              ? 'auth.validation.otpRecentlySent'
              : 'common.error.somethingWentWrong',
          ),
        );
        return;
      }
      res.otp && setOtpCode(res.otp);
      setPhone(data.phone);
      setTtlMin(res.ttlMin);
      setStep('otp');
    },
    [isPhoneValid, phoneForm],
  );

  const [resendOtpState, resendOtp] = useAsyncFn(async () => {
    const res = await rcClient.auth.sendOtp({ phone });
    if (res.error) {
      toast.error(i18n.t('common.error.somethingWentWrong'));
      return;
    }
    res.otp && setOtpCode(res.otp);
    setTtlMin(res.ttlMin);
    otpForm.reset();
  }, [phone, otpForm]);

  const [verifyOtpState, verifyOtp] = useAsyncFn(
    async (data: OtpFormValues) => {
      const res = await rcClient.auth.verifyOtp({ phone, code: data.otp });
      if (res.error) {
        if (res.error === ApiErrorCode.OTP_EXPIRED) {
          toast.error(i18n.t('auth.otp.error.otpExpired'));
          return otpForm.reset();
        }
        if (res.error === ApiErrorCode.INVALID_OTP)
          return toast.error(i18n.t('auth.otp.error.invalidOtp'));
        return toast.error(i18n.t('common.error.somethingWentWrong'));
      }
      const { accessToken, shouldShowUsernameForm } = res;
      if (accessToken) {
        Cookies.set(ACCESS_TOKEN_KEY, accessToken, { path: '/' });
      }
      shouldShowUsernameForm ? setStep('profile') : onFinish?.();
    },
    [phone, otpForm, onFinish],
  );

  const [updateProfileState, saveProfile] = useAsyncFn(
    async (data: ProfileFormValues) => {
      const payload = {
        ...(data.email ? { email: data.email } : {}),
        ...(data.username ? { username: data.username } : {}),
        ...(data.avatar ? { avatar: data.avatar } : {}),
      };
      if (Object.keys(payload).length === 0) {
        onFinish?.();
        return;
      }
      const res = await rcClient.auth.updateProfile(payload);
      profileForm.clearErrors();
      if (res.error) {
        if (
          res.error === ApiErrorCode.UNIQUE_FIELDS_TAKEN &&
          res.fields?.length
        ) {
          for (const field of res.fields) {
            profileForm.setError(field as keyof ProfileFormValues, {
              type: 'taken',
              message: i18n.t('auth.profile.error.fieldTaken'),
            });
          }
          return;
        }
        toast.error(i18n.t('common.error.somethingWentWrong'));
        return;
      }
      onFinish?.();
    },
    [onFinish, profileForm, toast],
  );

  const skipProfile = useCallback(() => {
    onFinish?.();
  }, [onFinish]);

  const goBack = useCallback(() => {
    setStep('phone');
    otpForm.reset();
  }, [otpForm]);

  return {
    step,
    setStep,
    phone,
    ttlMin,
    phoneForm,
    otpForm,
    profileForm,
    sendOtpState,
    sendOtp,
    resendOtpState,
    resendOtp,
    verifyOtpState,
    verifyOtp,
    updateProfileState,
    saveProfile,
    skipProfile,
    goBack,
    handlePhoneValidate,
    otpCode,
    isPhoneValid,
  };
};
