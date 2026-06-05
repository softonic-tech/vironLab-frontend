import { useState } from 'react';
import { Mail, Send, ArrowLeft, MessageCircle, Clock, MapPin } from 'lucide-react';

export default function Contact() {
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
    
    // Create mailto link
    const mailtoLink = `mailto:contact@vironlabs.com?subject=${encodeURIComponent(
      formData.subject || 'Enquiry from Viron Labs Website'
    )}&body=${encodeURIComponent(
      `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`
    )}`;
    
    // Open email client
    window.location.href = mailtoLink;
    
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSent(true);
    }, 1000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen" style={{ background: '#070A12' }}>
      {/* Grid Overlay */}
      <div className="absolute inset-0 grid-overlay opacity-60" />

      {/* Navigation */}
      <nav className="relative z-50 px-6 lg:px-12 py-6">
        <div className="flex items-center justify-between">
          <a href="/" className="flex flex-col items-start">
            <img
              src="/logo.png"
              alt="Viron Labs"
              className="h-10 sm:h-12 lg:h-14 w-auto object-contain select-none"
              draggable={false}
            />
          </a>
          <a
            href="/"
            className="flex items-center gap-2 text-sm text-[#A9B3C7] hover:text-[#F4F6FA] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Shop
          </a>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 px-6 lg:px-12 py-12 lg:py-20">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <span className="eyebrow mb-4 block">GET IN TOUCH</span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#F4F6FA] mb-4">
              Contact <span className="gradient-text">Us</span>
            </h1>
            <p className="text-base sm:text-lg text-[#A9B3C7] max-w-xl mx-auto">
              Have questions about our peptides? Our team is here to help with your research needs.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Info */}
            <div className="lg:col-span-1 space-y-6">
              <div className="p-5 rounded-2xl bg-[rgba(17,24,39,0.6)] border border-[rgba(244,246,250,0.08)]">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-3">
                  <Mail className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="text-sm font-bold text-[#F4F6FA] mb-1">Email</h3>
                <a
                  href="mailto:contact@vironlabs.com"
                  className="text-sm text-[#A9B3C7] hover:text-amber-300 transition-colors"
                >
                  contact@vironlabs.com
                </a>
              </div>

              <div className="p-5 rounded-2xl bg-[rgba(17,24,39,0.6)] border border-[rgba(244,246,250,0.08)]">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center mb-3">
                  <Clock className="w-5 h-5 text-sky-400" />
                </div>
                <h3 className="text-sm font-bold text-[#F4F6FA] mb-1">Response Time</h3>
                <p className="text-sm text-[#A9B3C7]">Within 24-48 hours</p>
              </div>

              <div className="p-5 rounded-2xl bg-[rgba(17,24,39,0.6)] border border-[rgba(244,246,250,0.08)]">
                <div className="w-10 h-10 rounded-xl bg-[rgba(59,130,246,0.1)] flex items-center justify-center mb-3">
                  <MapPin className="w-5 h-5 text-[#3B82F6]" />
                </div>
                <h3 className="text-sm font-bold text-[#F4F6FA] mb-1">Location</h3>
                <p className="text-sm text-[#A9B3C7]">UK & EU Shipping</p>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="p-6 sm:p-8 rounded-2xl bg-[rgba(17,24,39,0.6)] border border-[rgba(244,246,250,0.08)]">
                {isSent ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/15 flex items-center justify-center mb-4">
                      <MessageCircle className="w-8 h-8 text-amber-400" />
                    </div>
                    <h3 className="text-xl font-bold text-[#F4F6FA] mb-2">Message Ready!</h3>
                    <p className="text-sm text-[#A9B3C7] mb-6">
                      Your email client should have opened. If not, you can email us directly at{' '}
                      <a href="mailto:contact@vironlabs.com" className="text-amber-400 hover:text-amber-300 hover:underline">
                        contact@vironlabs.com
                      </a>
                    </p>
                    <button
                      onClick={() => {
                        setIsSent(false);
                        setFormData({ name: '', email: '', subject: '', message: '' });
                      }}
                      className="btn-outline"
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm text-[#A9B3C7] mb-2">Name</label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 rounded-xl bg-[rgba(7,10,18,0.5)] border border-[rgba(244,246,250,0.1)] text-[#F4F6FA] placeholder-[#A9B3C7] focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/25 transition-colors"
                          placeholder="Your name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-[#A9B3C7] mb-2">Email</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 rounded-xl bg-[rgba(7,10,18,0.5)] border border-[rgba(244,246,250,0.1)] text-[#F4F6FA] placeholder-[#A9B3C7] focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/25 transition-colors"
                          placeholder="your@email.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-[#A9B3C7] mb-2">Subject</label>
                      <select
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl bg-[rgba(7,10,18,0.5)] border border-[rgba(244,246,250,0.1)] text-[#F4F6FA] focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/25 transition-colors appearance-none cursor-pointer"
                      >
                        <option value="" className="bg-[#111827]">Select a subject</option>
                        <option value="Product Inquiry" className="bg-[#111827]">Product Inquiry</option>
                        <option value="Order Status" className="bg-[#111827]">Order Status</option>
                        <option value="Shipping Question" className="bg-[#111827]">Shipping Question</option>
                        <option value="General Support" className="bg-[#111827]">General Support</option>
                        <option value="Other" className="bg-[#111827]">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-[#A9B3C7] mb-2">Message</label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={5}
                        className="w-full px-4 py-3 rounded-xl bg-[rgba(7,10,18,0.5)] border border-[rgba(244,246,250,0.1)] text-[#F4F6FA] placeholder-[#A9B3C7] focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/25 transition-colors resize-none"
                        placeholder="How can we help you?"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full btn-primary flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Send Message
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

      {/* Footer */}
      <footer className="relative z-10 px-6 lg:px-12 py-8 border-t border-amber-500/15">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-xs text-[#A9B3C7]">
            © 2026 Viron Labs. All rights reserved. For research use only.
          </p>
        </div>
      </footer>
    </div>
  );
}
