import { useTranslation } from '@/i18n';

const FLAG_SV = '🇸🇪';
const FLAG_EN = '🇬🇧';

type LanguageSwitcherProps = {
  /** Compact: flags only. Full: shows label on larger screens. */
  variant?: 'compact' | 'full';
  className?: string;
};

export default function LanguageSwitcher({ variant = 'compact', className = '' }: LanguageSwitcherProps) {
  const { language, setLanguage, t } = useTranslation();

  const btnBase =
    'flex h-9 w-9 items-center justify-center rounded-full border text-base transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-400/40';
  const active =
    'border-amber-400/55 bg-amber-500/18 shadow-[0_0_16px_rgba(234,179,8,0.2)]';
  const inactive =
    'border-white/10 bg-white/[0.04] hover:border-amber-400/35 hover:bg-amber-500/10';

  return (
    <div
      className={`flex items-center gap-1 ${className}`}
      role="group"
      aria-label={t('nav.language')}
    >
      <button
        type="button"
        onClick={() => setLanguage('sv')}
        className={`${btnBase} ${language === 'sv' ? active : inactive}`}
        aria-label={t('nav.switchToSwedish')}
        aria-pressed={language === 'sv'}
        title={t('nav.switchToSwedish')}
      >
        <span aria-hidden>{FLAG_SV}</span>
      </button>
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`${btnBase} ${language === 'en' ? active : inactive}`}
        aria-label={t('nav.switchToEnglish')}
        aria-pressed={language === 'en'}
        title={t('nav.switchToEnglish')}
      >
        <span aria-hidden>{FLAG_EN}</span>
      </button>
      {variant === 'full' && (
        <span className="hidden min-[1180px]:inline text-xs font-medium text-slate-400 ml-0.5">
          {language === 'sv' ? 'SV' : 'EN'}
        </span>
      )}
    </div>
  );
}
