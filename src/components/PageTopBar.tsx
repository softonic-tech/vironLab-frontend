import { ArrowLeft } from 'lucide-react';
import LanguageSwitcher from '@/components/LanguageSwitcher';

type PageTopBarProps = {
  backHref: string;
  backLabel: string;
};

/** Shared top bar for standalone pages (login, checkout, etc.) with language flags. */
export default function PageTopBar({ backHref, backLabel }: PageTopBarProps) {
  return (
    <nav className="relative z-50 px-6 lg:px-12 py-4">
      <div className="flex items-center justify-between gap-4">
        <a href="/" className="flex flex-col items-start shrink-0">
          <img
            src="/logo.png"
            alt="Viron Labs"
            className="h-10 sm:h-12 lg:h-14 w-auto object-contain select-none"
            draggable={false}
          />
        </a>
        <div className="flex items-center gap-3 sm:gap-4">
          <LanguageSwitcher />
          <a
            href={backHref}
            className="flex items-center gap-2 text-sm text-[#A9B3C7] hover:text-[#F4F6FA] transition-colors whitespace-nowrap"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            {backLabel}
          </a>
        </div>
      </div>
    </nav>
  );
}
