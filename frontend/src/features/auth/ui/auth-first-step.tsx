import { PhoneNumberField } from '@app/shared';
import { Button } from '@app/shared/ui/button';
import type { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

type AuthFirstStepProps = {
  form: UseFormReturn<{ phone: string }>;
  onSubmit: (data: { phone: string }) => void;
  onPhoneValidate: (isValid: boolean) => void;
  isLoading: boolean;
  isPhoneValid: boolean;
};

export const AuthFirstStep = ({
  form,
  onSubmit,
  onPhoneValidate,
  isLoading,
  isPhoneValid,
}: AuthFirstStepProps) => {
  const { t, i18n } = useTranslation();

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <div className="flex flex-col items-center">
        <h4 className="text-[32px] max-md:text-[28px] max-md:mb-2 mt-[22px] mb-3.5">
          {t('auth.signin.title')}
        </h4>
        <span className="text-[#AAAAAA]">
          {t('auth.signin.phonePlaceholder')}
        </span>
        <div className="mt-[49px] max-md:mt-6">
          <PhoneNumberField
            name="phone"
            value={form.watch('phone')}
            onChange={(phone) => form.setValue('phone', phone)}
            onValidate={onPhoneValidate}
          />
        </div>
        <Button
          type="submit"
          disabled={isLoading || !isPhoneValid}
          className="text-lg w-[324px] h-[52px] mt-[49px] max-md:mt-8"
        >
          {t('auth.signin.submitButton')}
        </Button>
        <Button
          type="button"
          onClick={() =>
            i18n.language === 'ru'
              ? i18n.changeLanguage('en')
              : i18n.changeLanguage('ru')
          }
          variant="link"
          className="mt-4 h-[52px] text-lg"
        >
          {t('common.switchLanguage')}
        </Button>
      </div>
    </form>
  );
};
