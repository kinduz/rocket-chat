import { cn } from '@app/lib/utils';
import { AnimatePresence, motion } from 'motion/react';
import Image from 'next/image';
import { useState } from 'react';
import Rocket from '../assets/rocket-black.gif';
import { useAuthForm } from '../hooks/use-auth-form';
import { AuthFirstStep } from './auth-first-step';
import { AuthSecondStep } from './auth-second-step';

export const AuthForm = () => {
  const {
    step,
    phone,
    ttlMin,
    otpCode,
    phoneForm,
    otpForm,
    sendOtp,
    sendOtpState,
    resendOtp,
    resendOtpState,
    verifyOtp,
    verifyOtpState,
    goBack,
    handlePhoneValidate,
    isPhoneValid,
  } = useAuthForm();

  const [counter, setCounter] = useState(0);
  const isDevMode = counter > 10;

  return (
    <div className="pt-12 flex flex-col items-center justify-center max-md:pt-2">
      <Image
        onClick={() => (step === 'otp' ? setCounter((prev) => prev + 1) : null)}
        className={cn(
          'size-[228px] max-md:size-[180px] transition-transform',
          step === 'otp' && isDevMode && 'rotate-270',
        )}
        src={Rocket}
        alt="Rocket"
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
    </div>
  );
};
