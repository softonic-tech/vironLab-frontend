import { useState } from 'react';
import { Mail, Send, MessageCircle, Clock, MapPin } from 'lucide-react';
import PageTopBar from '@/components/PageTopBar';
import { CONFIG } from '@/lib/config';
import { useTranslation } from '@/i18n';

export default function Contact() {
  const { t } = useTranslation();
  const contactEmail = CONFIG.CONTACT_EMAIL;
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const mailtoLink = `mailto:${contactEmail}?subject=${encodeURIComponent(
      formData.subject || t('contact.enquirySubject')
    )}&body=${encodeURIComponent(
      `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`
    )}`;

    window.location.href = mailtoLink;

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSent(true);
    }, 1000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const subjectOptions = [
    { value: 'Product Inquiry', label: t('contact.subjectProduct') },
    { value: 'Order Status', label: t('contact.subjectOrder') },
    { value: 'Shipping Question', label: t('contact.subjectShipping') },
    { value: 'General Support', label: t('contact.subjectSupport') },
    { value: 'Other', label: t('contact.subjectOther') },
  ];

  return (
    <div className="min-h-screen" style={{ background: '#070A12' }}>
      <div className="absolute inset-0 grid-overlay opacity-60" />
      <PageTopBar backHref="/" backLabel={t('contact.backToShop')} />

      <main className="relative z-10 px-6 lg:px-12 py-12 lg:py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="eyebrow mb-4 block">{t('contact.eyebrow')}</span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#F4F6FA] mb-4">
              {t('contact.title')} <span className="gradient-text">{t('contact.titleHighlight')}</span>
            </h1>
            <p className="text-base sm:text-lg text-[#A9B3C7] max-w-xl mx-auto">{t('contact.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <div className="p-5 rounded-2xl bg-[rgba(17,24,39,0.6)] border border-[rgba(244,246,250,0.08)]">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-3">
                  <Mail className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="text-sm font-bold text-[#F4F6FA] mb-1">{t('contact.email')}</h3>
                <a
                  href={`mailto:${contactEmail}`}
                  className="text-sm text-[#A9B3C7] hover:text-amber-300 transition-colors"
                >
                  {contactEmail}
                </a>
              </div>

              <div className="p-5 rounded-2xl bg-[rgba(17,24,39,0.6)] border border-[rgba(244,246,250,0.08)]">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center mb-3">
                  <Clock className="w-5 h-5 text-sky-400" />
                </div>
                <h3 className="text-sm font-bold text-[#F4F6FA] mb-1">{t('contact.responseTime')}</h3>
                <p className="text-sm text-[#A9B3C7]">{t('contact.responseTimeValue')}</p>
              </div>

              <div className="p-5 rounded-2xl bg-[rgba(17,24,39,0.6)] border border-[rgba(244,246,250,0.08)]">
                <div className="w-10 h-10 rounded-xl bg-[rgba(59,130,246,0.1)] flex items-center justify-center mb-3">
                  <MapPin className="w-5 h-5 text-[#3B82F6]" />
                </div>
                <h3 className="text-sm font-bold text-[#F4F6FA] mb-1">{t('contact.location')}</h3>
                <p className="text-sm text-[#A9B3C7]">{t('contact.locationValue')}</p>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="p-6 sm:p-8 rounded-2xl bg-[rgba(17,24,39,0.6)] border border-[rgba(244,246,250,0.08)]">
                {isSent ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/15 flex items-center justify-center mb-4">
                      <MessageCircle className="w-8 h-8 text-amber-400" />
                    </div>
                    <h3 className="text-xl font-bold text-[#F4F6FA] mb-2">{t('contact.messageReady')}</h3>
                    <p className="text-sm text-[#A9B3C7] mb-6">
                      {t('contact.messageReadyDesc')}{' '}
                      <a href={`mailto:${contactEmail}`} className="text-amber-400 hover:text-amber-300 hover:underline">
                        {contactEmail}
                      </a>
                    </p>
                    <button
                      onClick={() => {
                        setIsSent(false);
                        setFormData({ name: '', email: '', subject: '', message: '' });
                      }}
                      className="btn-outline"
                    >
                      {t('contact.sendAnother')}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm text-[#A9B3C7] mb-2">{t('contact.name')}</label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 rounded-xl bg-[rgba(7,10,18,0.5)] border border-[rgba(244,246,250,0.1)] text-[#F4F6FA] placeholder-[#A9B3C7] focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/25 transition-colors"
                          placeholder={t('contact.namePlaceholder')}
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-[#A9B3C7] mb-2">{t('contact.emailLabel')}</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 rounded-xl bg-[rgba(7,10,18,0.5)] border border-[rgba(244,246,250,0.1)] text-[#F4F6FA] placeholder-[#A9B3C7] focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/25 transition-colors"
                          placeholder={t('auth.emailPlaceholder')}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-[#A9B3C7] mb-2">{t('contact.subject')}</label>
                      <select
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl bg-[rgba(7,10,18,0.5)] border border-[rgba(244,246,250,0.1)] text-[#F4F6FA] focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/25 transition-colors appearance-none cursor-pointer"
                      >
                        <option value="" className="bg-[#111827]">{t('contact.selectSubject')}</option>
                        {subjectOptions.map((opt) => (
                          <option key={opt.value} value={opt.value} className="bg-[#111827]">
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-[#A9B3C7] mb-2">{t('contact.message')}</label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={5}
                        className="w-full px-4 py-3 rounded-xl bg-[rgba(7,10,18,0.5)] border border-[rgba(244,246,250,0.1)] text-[#F4F6FA] placeholder-[#A9B3C7] focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/25 transition-colors resize-none"
                        placeholder={t('contact.messagePlaceholder')}
                      />
                    </div>

                    <button type="submit" disabled={isSubmitting} className="w-full btn-primary flex items-center justify-center gap-2">
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                          {t('contact.sending')}
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          {t('contact.sendMessage')}
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 px-6 lg:px-12 py-8 border-t border-amber-500/15">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-xs text-[#A9B3C7]">{t('contact.footer')}</p>
        </div>
      </footer>
    </div>
  );
}
