'use client';

import { cn } from '@app/shared/lib/utils';
import { ROUTES } from '@app/shared/navigation';
import { AnimatePresence, motion } from 'motion/react';
import Image from 'next/image';
import { useState } from 'react';
import RocketGif from '../assets/rocket-black.gif';
import { useAuthForm } from '../hooks/use-auth-form';
import { AuthFirstStep } from './auth-first-step';
import { AuthSecondStep } from './auth-second-step';
import { AuthThirdStep } from './auth-third-step';

const TRANSITION = { duration: 0.3 };

export const AuthForm = () => {
  const onFinish = () => {
    window.location.href = ROUTES.home;
  };

  const {
    step,
    phone,
    ttlMin,
    otpCode,
    phoneForm,
    otpForm,
    profileForm,
    sendOtp,
    sendOtpState,
    resendOtp,
    resendOtpState,
    verifyOtp,
    verifyOtpState,
    updateProfileState,
    saveProfile,
    skipProfile,
    goBack,
    handlePhoneValidate,
    isPhoneValid,
  } = useAuthForm(onFinish);

  const [counter, setCounter] = useState(0);
  const isDevMode = counter > 10;

  return (
    <AnimatePresence mode="wait">
      {(step === 'phone' || step === 'otp') && (
        <motion.div
          key="auth-with-rocket"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={TRANSITION}
          className="pt-12 flex flex-col items-center justify-center max-md:pt-2"
        >
          <Image
            src={RocketGif}
            alt="Rocket"
            onClick={() => step === 'otp' && setCounter((prev) => prev + 1)}
            onKeyDown={(e) =>
              e.key === 'Enter' &&
              step === 'otp' &&
              setCounter((prev) => prev + 1)
            }
            className={cn(
              'size-[228px] max-md:size-[180px] transition-transform',
              step === 'otp' && isDevMode && 'rotate-270',
            )}
          />

          <AnimatePresence mode="wait">
            {step === 'phone' && (
              <motion.div
                key="phone"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.15 }}
              >
                <AuthFirstStep
                  form={phoneForm}
                  onSubmit={sendOtp}
                  isLoading={sendOtpState.loading}
                  onPhoneValidate={handlePhoneValidate}
                  isPhoneValid={isPhoneValid}
                />
              </motion.div>
            )}

            {step === 'otp' && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.15 }}
              >
                {isDevMode && (
                  <span className="absolute top-4 left-4 text-xs text-gray-500">
                    {otpCode}
                  </span>
                )}
                <AuthSecondStep
                  form={otpForm}
                  phone={phone}
                  ttlMin={ttlMin}
                  onSubmit={verifyOtp}
                  onResend={resendOtp}
                  onGoBack={goBack}
                  isLoading={verifyOtpState.loading}
                  isResending={resendOtpState.loading}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {step === 'profile' && (
        <motion.div
          key="profile"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={TRANSITION}
          className="pt-12 flex flex-col items-center justify-center max-md:pt-2"
        >
          <AuthThirdStep
            form={profileForm}
            onSubmit={saveProfile}
            onSkip={skipProfile}
            isLoading={updateProfileState.loading}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
