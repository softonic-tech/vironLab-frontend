import { ArrowLeft, Mail, MessageCircle, Clock, MapPin, ExternalLink, Send } from 'lucide-react';

export default function ContactInfo() {
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
              Contact <span className="gradient-text">Information</span>
            </h1>
            <p className="text-base sm:text-lg text-[#A9B3C7] max-w-xl mx-auto">
              We're here to help. Reach out to us through any of the channels below.
            </p>
          </div>

          {/* Contact Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {/* Email */}
            <div className="p-6 rounded-2xl bg-[rgba(17,24,39,0.6)] border border-[rgba(244,246,250,0.08)] hover:border-amber-500/35 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-lg font-bold text-[#F4F6FA] mb-2">Email</h3>
              <p className="text-sm text-[#A9B3C7] mb-4">
                Send us an email and we'll respond within 24-48 hours.
              </p>
              <a
                href="mailto:contact@vironlabs.com"
                className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 hover:underline"
              >
                contact@vironlabs.com
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {/* Telegram */}
            <div className="p-6 rounded-2xl bg-[rgba(17,24,39,0.6)] border border-[rgba(244,246,250,0.08)] hover:border-sky-500/35 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-[rgba(59,130,246,0.1)] flex items-center justify-center mb-4">
                <Send className="w-6 h-6 text-[#3B82F6]" />
              </div>
              <h3 className="text-lg font-bold text-[#F4F6FA] mb-2">Telegram</h3>
              <p className="text-sm text-[#A9B3C7] mb-4">
                Get instant support via Telegram messaging.
              </p>
              <a
                href="https://t.me/vironlabs"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[#3B82F6] hover:underline"
              >
                @VironLabs
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {/* Response Time */}
            <div className="p-6 rounded-2xl bg-[rgba(17,24,39,0.6)] border border-[rgba(244,246,250,0.08)] hover:border-amber-500/25 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-amber-500/8 flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-amber-300" />
              </div>
              <h3 className="text-lg font-bold text-[#F4F6FA] mb-2">Response Time</h3>
              <p className="text-sm text-[#A9B3C7] mb-4">
                We aim to respond to all inquiries quickly.
              </p>
              <span className="text-amber-200/95 font-medium">Within 24-48 hours</span>
            </div>
          </div>

          {/* Telegram Support Section */}
          <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-sky-500/10 via-amber-500/8 to-red-500/6 border border-sky-500/20 mb-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#3B82F6] flex items-center justify-center">
                    <Send className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-[#F4F6FA]">Telegram Support</h2>
                </div>
                <p className="text-[#A9B3C7] mb-6">
                  Get instant support and quick responses through our Telegram channel.
                  Scan the QR code or click the button below to start a conversation with our team.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="w-5 h-5 text-[#3B82F6]" />
                    <span className="text-[#F4F6FA]">Username: <span className="text-[#3B82F6]">@VironLabs</span></span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-amber-400" />
                    <span className="text-[#F4F6FA]">Response time: <span className="text-amber-300">Usually within minutes</span></span>
                  </div>
                </div>
                <a
                  href="https://t.me/vironlabs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-xl bg-[#3B82F6] text-white font-medium hover:bg-[#2563EB] transition-colors"
                >
                  <Send className="w-4 h-4" />
                  Message us on Telegram
                </a>
              </div>
              <div className="flex justify-center">
                <div className="p-4 rounded-2xl bg-white">
                  {/* Telegram QR Code */}
                  <svg
                    viewBox="0 0 200 200"
                    className="w-48 h-48"
                  >
                    {/* Background */}
                    <rect width="200" height="200" fill="white" />

                    {/* Telegram Logo in center */}
                    <circle cx="100" cy="100" r="35" fill="#3B82F6" />
                    <path
                      d="M125 75 L85 110 L75 100 L115 65 Z"
                      fill="white"
                      transform="translate(5, 5)"
                    />
                    <path
                      d="M125 75 L85 110 L95 120 L135 85 Z"
                      fill="white"
                      transform="translate(5, 5)"
                    />

                    {/* QR Code Pattern - Simplified representation */}
                    {/* Position detection patterns */}
                    <rect x="15" y="15" width="40" height="40" fill="none" stroke="#070A12" strokeWidth="4" />
                    <rect x="25" y="25" width="20" height="20" fill="#070A12" />

                    <rect x="145" y="15" width="40" height="40" fill="none" stroke="#070A12" strokeWidth="4" />
                    <rect x="155" y="25" width="20" height="20" fill="#070A12" />

                    <rect x="15" y="145" width="40" height="40" fill="none" stroke="#070A12" strokeWidth="4" />
                    <rect x="25" y="155" width="20" height="20" fill="#070A12" />

                    {/* Data modules - stylized pattern */}
                    <g fill="#070A12">
                      <rect x="65" y="15" width="8" height="8" />
                      <rect x="85" y="15" width="8" height="8" />
                      <rect x="105" y="15" width="8" height="8" />
                      <rect x="65" y="30" width="8" height="8" />
                      <rect x="95" y="30" width="8" height="8" />
                      <rect x="115" y="30" width="8" height="8" />
                      <rect x="75" y="45" width="8" height="8" />
                      <rect x="105" y="45" width="8" height="8" />
                      <rect x="125" y="45" width="8" height="8" />

                      <rect x="15" y="65" width="8" height="8" />
                      <rect x="35" y="65" width="8" height="8" />
                      <rect x="55" y="65" width="8" height="8" />
                      <rect x="15" y="80" width="8" height="8" />
                      <rect x="45" y="80" width="8" height="8" />
                      <rect x="55" y="95" width="8" height="8" />
                      <rect x="25" y="110" width="8" height="8" />
                      <rect x="45" y="110" width="8" height="8" />
                      <rect x="35" y="125" width="8" height="8" />

                      <rect x="145" y="65" width="8" height="8" />
                      <rect x="165" y="65" width="8" height="8" />
                      <rect x="185" y="65" width="8" height="8" />
                      <rect x="155" y="80" width="8" height="8" />
                      <rect x="175" y="80" width="8" height="8" />
                      <rect x="145" y="95" width="8" height="8" />
                      <rect x="165" y="95" width="8" height="8" />
                      <rect x="185" y="110" width="8" height="8" />
                      <rect x="155" y="125" width="8" height="8" />

                      <rect x="65" y="145" width="8" height="8" />
                      <rect x="85" y="145" width="8" height="8" />
                      <rect x="105" y="145" width="8" height="8" />
                      <rect x="125" y="155" width="8" height="8" />
                      <rect x="145" y="155" width="8" height="8" />
                      <rect x="75" y="170" width="8" height="8" />
                      <rect x="95" y="170" width="8" height="8" />
                      <rect x="115" y="170" width="8" height="8" />
                      <rect x="165" y="170" width="8" height="8" />
                      <rect x="185" y="185" width="8" height="8" />
                    </g>
                  </svg>
                  <p className="text-center text-sm text-[#070A12] mt-2 font-medium">
                    Scan to chat on Telegram
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-[rgba(17,24,39,0.6)] border border-[rgba(244,246,250,0.08)]">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="w-5 h-5 text-sky-400" />
                <h3 className="text-lg font-bold text-[#F4F6FA]">Location</h3>
              </div>
              <p className="text-[#A9B3C7]">
                We are a UK-based company with shipping facilities in the UK and the EU.
                All orders are dispatched from our British warehouse for domestic orders.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[rgba(72, 78, 92, 0.6)] border border-[rgba(244,246,250,0.08)]">
              <div className="flex items-center gap-3 mb-4">
                <MessageCircle className="w-5 h-5 text-amber-400" />
                <h3 className="text-lg font-bold text-[#F4F6FA]">Support Hours</h3>
              </div>
              <p className="text-[#A9B3C7]">
                Our support team is available Monday through Friday, 9:00 AM to 6:00 PM AEDT.
                Telegram support may have extended availability for urgent inquiries.
              </p>
            </div>
          </div>

          {/* Contact Form Link */}
          <div className="mt-12 text-center">
            <p className="text-[#A9B3C7] mb-4">
              Prefer to send us a message directly?
            </p>
            <a
              href="/contact"
              className="inline-flex items-center gap-2 btn-primary"
            >
              <MessageCircle className="w-4 h-4" />
              Go to Contact Form
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-6 lg:px-12 py-8 border-t border-amber-500/15">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#A9B3C7]">
            © 2026 Viron Labs. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-[#A9B3C7]">
            <a href="/privacy" className="hover:text-[#F4F6FA] transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-[#F4F6FA] transition-colors">Terms</a>
            <a href="/refund" className="hover:text-[#F4F6FA] transition-colors">Refunds</a>
            <a href="/shipping" className="hover:text-[#F4F6FA] transition-colors">Shipping</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
