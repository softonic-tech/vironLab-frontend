import { ArrowLeft, Scale, FileCheck, AlertTriangle, UserCheck, Package, Truck, CreditCard, Ban } from 'lucide-react';
import { SEO } from '@/components/SEO';

export default function Terms() {
  return (
    <div className="min-h-screen bg-[#070A12]">
      <SEO
        title="Terms & Conditions | Viron Labs"
        description="Viron Labs Terms & Conditions - British Consumer Law compliant. Read our terms of service before purchasing."
      />

      {/* Navigation */}
      <nav className="px-4 py-4 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <a href="/" className="inline-flex items-center">
            <img
              src="/logo.png"
              alt="Viron Labs"
              className="h-9 w-auto object-contain select-none"
              draggable={false}
            />
          </a>
          <a href="/" className="text-sm text-gray-400 flex items-center gap-2 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </a>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <Scale className="w-16 h-16 mx-auto text-[#2ED1B4] mb-4" />
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">Terms & Conditions</h1>
          <p className="text-gray-400">Last Updated: {new Date().toLocaleDateString('en-GB')}</p>
          <p className="text-sm text-[#2ED1B4] mt-2">Compliant with British Consumer Law (ACL)</p>
        </div>

        <div className="space-y-8">
          {/* Agreement */}
          <section className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-[#8B5CF6]" />
              1. Agreement to Terms
            </h2>
            <p className="text-gray-400 leading-relaxed">
              By accessing <strong className="text-white">www.vironlabs.com</strong> ("the Website") and purchasing products from Viron Labs
              ("we," "us," or "our"), you agree to be bound by these Terms & Conditions. If you do not agree with any part of these terms,
              you must not use our Website or services.
            </p>
            <p className="text-gray-400 leading-relaxed mt-4">
              These terms are governed by the laws of <strong className="text-white">New South Wales, UK</strong> and
              the <strong className="text-white">British Consumer Law (ACL)</strong> as set out in Schedule 2 of the
              Competition and Consumer Act 2010 (Cth).
            </p>
          </section>

          {/* Eligibility */}
          <section className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[#8B5CF6]" />
              2. Eligibility & Age Requirement
            </h2>
            <div className="p-4 rounded-xl bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] mb-4">
              <p className="text-[#EF4444] font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                You must be 18 years or older to purchase from Viron Labs.
              </p>
            </div>
            <p className="text-gray-400 leading-relaxed">
              By placing an order, you confirm that:
            </p>
            <ul className="space-y-2 text-gray-400 mt-4">
              <li className="flex items-start gap-2">
                <span className="text-[#2ED1B4]">•</span>
                <span>You are at least 18 years of age</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#2ED1B4]">•</span>
                <span>You are legally capable of entering into binding contracts</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#2ED1B4]">•</span>
                <span>You are purchasing products for lawful research purposes only</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#2ED1B4]">•</span>
                <span>All information you provide is accurate and complete</span>
              </li>
            </ul>
            <p className="text-gray-400 leading-relaxed mt-4">
              We reserve the right to refuse service, terminate accounts, or cancel orders at our discretion,
              including if we suspect false information or unlawful use.
            </p>
          </section>

          {/* Products */}
          <section className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-[#8B5CF6]" />
              3. Products & Intended Use
            </h2>
            <div className="p-4 rounded-xl bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.2)] mb-4">
              <p className="text-[#F59E0B] font-medium">
                ⚠️ FOR RESEARCH PURPOSES ONLY — NOT FOR HUMAN CONSUMPTION
              </p>
            </div>
            <p className="text-gray-400 leading-relaxed">
              All products sold by Viron Labs are intended for <strong className="text-white">laboratory research purposes only</strong>.
              By purchasing, you acknowledge and agree that:
            </p>
            <ul className="space-y-2 text-gray-400 mt-4">
              <li className="flex items-start gap-2">
                <span className="text-[#EF4444]">•</span>
                <span>Products are NOT for human or animal consumption</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#EF4444]">•</span>
                <span>Products are NOT for therapeutic, diagnostic, or cosmetic use</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#EF4444]">•</span>
                <span>Products are NOT approved by the TGA (Therapeutic Goods Administration)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#EF4444]">•</span>
                <span>You assume full responsibility for proper handling, storage, and use</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#EF4444]">•</span>
                <span>You will use products only in compliance with all applicable laws and regulations</span>
              </li>
            </ul>
            <p className="text-gray-400 leading-relaxed mt-4">
              <strong className="text-white">Prescription Products:</strong> Certain products (Semaglutide, Cagrilintide,
              and related combinations) are marked as requiring prescription verification. By purchasing these products,
              you confirm you have a valid prescription or are purchasing for legitimate research purposes in accordance with British law.
            </p>
          </section>

          {/* Ordering */}
          <section className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-[#8B5CF6]" />
              4. Ordering & Payment
            </h2>
            <p className="text-gray-400 leading-relaxed">
              All orders are subject to acceptance and availability. We reserve the right to:
            </p>
            <ul className="space-y-2 text-gray-400 mt-4">
              <li className="flex items-start gap-2">
                <span className="text-[#2ED1B4]">•</span>
                <span>Refuse or cancel any order for any reason</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#2ED1B4]">•</span>
                <span>Limit quantities per customer</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#2ED1B4]">•</span>
                <span>Request additional verification before processing</span>
              </li>
            </ul>
            <p className="text-gray-400 leading-relaxed mt-4">
              <strong className="text-white">Payment Methods:</strong> We accept bank transfer, cash on pickup, and other
              methods as specified at checkout. Orders will not be shipped until payment is received and cleared.
            </p>
            <p className="text-gray-400 leading-relaxed mt-4">
              <strong className="text-white">Pricing:</strong> All prices are in Swedish Krona (SEK) and include GST where applicable.
              Prices are subject to change without notice.
            </p>
          </section>

          {/* Shipping */}
          <section className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5 text-[#8B5CF6]" />
              5. Shipping & Delivery
            </h2>
            <p className="text-gray-400 leading-relaxed">
              We ship UK-wide. Delivery times are estimates and may vary based on location and circumstances beyond our control.
            </p>
            <ul className="space-y-2 text-gray-400 mt-4">
              <li className="flex items-start gap-2">
                <span className="text-[#2ED1B4]">•</span>
                <span><strong className="text-white">Standard Shipping:</strong> 5-8 business days, 149 SEK or free over 2500 SEK</span>
              </li>
            </ul>
            <p className="text-gray-400 leading-relaxed mt-4">
              Risk of loss and title for items pass to you upon delivery to the carrier. We are not responsible for
              delays caused by customs, weather, or other circumstances beyond our control.
            </p>
          </section>

          {/* Returns */}
          <section className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Ban className="w-5 h-5 text-[#8B5CF6]" />
              6. Returns & Refunds
            </h2>
            <p className="text-gray-400 leading-relaxed">
              Due to the nature of our products, <strong className="text-white">we do not accept returns</strong> for:
            </p>
            <ul className="space-y-2 text-gray-400 mt-4">
              <li className="flex items-start gap-2">
                <span className="text-[#EF4444]">•</span>
                <span>Opened or used products</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#EF4444]">•</span>
                <span>Products that have been tampered with</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#EF4444]">•</span>
                <span>Products damaged due to improper storage by customer</span>
              </li>
            </ul>
            <p className="text-gray-400 leading-relaxed mt-4">
              <strong className="text-white">Damaged or Defective Products:</strong> If you receive a damaged or defective product,
              please contact us within 48 hours of delivery with photos. We will assess and may offer replacement or refund at our discretion.
            </p>
            <p className="text-gray-400 leading-relaxed mt-4">
              See our full <a href="/refund" className="text-[#2ED1B4] hover:underline">Returns & Refunds Policy</a> for details.
            </p>
          </section>

          {/* Consumer Guarantees */}
          <section className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Scale className="w-5 h-5 text-[#8B5CF6]" />
              7. British Consumer Law (ACL) Rights
            </h2>
            <p className="text-gray-400 leading-relaxed">
              Nothing in these Terms & Conditions excludes, restricts, or modifies any right or remedy you have under the
              <strong className="text-white"> British Consumer Law (ACL)</strong>.
            </p>
            <p className="text-gray-400 leading-relaxed mt-4">
              Our products come with guarantees that cannot be excluded under the ACL. You are entitled to a replacement or refund
              for a major failure and compensation for any other reasonably foreseeable loss or damage. You are also entitled to
              have the goods repaired or replaced if the goods fail to be of acceptable quality and the failure does not amount to a major failure.
            </p>
            <p className="text-gray-400 leading-relaxed mt-4">
              However, the ACL consumer guarantees do not apply where:
            </p>
            <ul className="space-y-2 text-gray-400 mt-4">
              <li className="flex items-start gap-2">
                <span className="text-[#A9B3C7]">•</span>
                <span>Products are used for purposes other than laboratory research</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#A9B3C7]">•</span>
                <span>Products are not stored or handled as directed</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#A9B3C7]">•</span>
                <span>Products are altered, tampered with, or damaged after delivery</span>
              </li>
            </ul>
          </section>

          {/* Liability */}
          <section className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#8B5CF6]" />
              8. Limitation of Liability
            </h2>
            <p className="text-gray-400 leading-relaxed">
              To the maximum extent permitted by law:
            </p>
            <ul className="space-y-2 text-gray-400 mt-4">
              <li className="flex items-start gap-2">
                <span className="text-[#A9B3C7]">•</span>
                <span>PELAB is not liable for any misuse, mishandling, or unlawful use of products</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#A9B3C7]">•</span>
                <span>We make no claims regarding safety, efficacy, or suitability outside controlled research</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#A9B3C7]">•</span>
                <span>Our liability for breach of any condition or warranty is limited to replacement, repair, or refund</span>
              </li>
            </ul>
          </section>

          {/* Intellectual Property */}
          <section className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-4">9. Intellectual Property</h2>
            <p className="text-gray-400 leading-relaxed">
              All content on this Website, including text, graphics, logos, images, and software, is the property of Viron Labs
              or its licensors and is protected by British and international copyright laws. You may not reproduce,
              distribute, or create derivative works without our express written permission.
            </p>
          </section>

          {/* Changes */}
          <section className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-4">10. Changes to Terms</h2>
            <p className="text-gray-400 leading-relaxed">
              We may modify these Terms & Conditions at any time. Changes will be effective immediately upon posting to the Website.
              Your continued use of the Website after changes constitutes acceptance of the modified terms.
            </p>
          </section>

          {/* Contact */}
          <section className="p-6 rounded-2xl bg-white/5 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-4">11. Contact Us</h2>
            <div className="p-4 rounded-xl bg-[rgba(46,209,180,0.1)] border border-[rgba(46,209,180,0.2)]">
              <p className="text-white font-medium">Viron Labs</p>
              <p className="text-gray-400">Email: <a href="mailto:contact@vironlabs.com" className="text-[#2ED1B4] hover:underline">contact@vironlabs.com</a></p>
              <p className="text-gray-400">Telegram: <a href="https://t.me/vironlabs" target="_blank" rel="noopener noreferrer" className="text-[#2ED1B4] hover:underline">@VironLabs</a></p>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} Viron Labs. All rights reserved.
            <a href="/privacy" className="text-[#2ED1B4] hover:underline ml-2">Privacy</a>
            <a href="/refund" className="text-[#2ED1B4] hover:underline ml-2">Returns</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
