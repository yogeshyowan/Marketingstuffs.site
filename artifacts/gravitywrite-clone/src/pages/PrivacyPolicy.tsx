export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <a href="/" className="inline-flex items-center gap-2 text-primary hover:underline mb-8 text-sm">
          ← Back to Marketingstuffs
        </a>
        <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground mb-10 text-sm">Last updated: April 16, 2026</p>

        <div className="prose prose-invert max-w-none space-y-8 text-muted-foreground leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Introduction</h2>
            <p>Marketingstuffs ("we", "our", or "us") operates the website <strong className="text-white">marketingstuffs.site</strong>. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our AI-powered marketing platform.</p>
            <p className="mt-2">By using our service, you agree to the collection and use of information in accordance with this policy.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Information We Collect</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-white">Account Information:</strong> When you sign in with Google, we collect your email address and display name.</li>
              <li><strong className="text-white">Usage Data:</strong> We log which tools you use, number of generations, and session activity for service improvement.</li>
              <li><strong className="text-white">Payment Information:</strong> For paid plans, payments are processed by Razorpay. We do not store your card or UPI details — Razorpay handles all sensitive payment data under PCI-DSS compliance.</li>
              <li><strong className="text-white">Technical Data:</strong> IP address, browser type, device information, and cookies for analytics (Google Analytics) and advertising (Google AdSense).</li>
              <li><strong className="text-white">Content You Generate:</strong> Inputs you provide to our AI tools (topics, prompts, business names) are sent to AI model providers to generate responses. We do not permanently store your generated content.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>To provide and maintain our AI tools and services</li>
              <li>To manage your account, credits, and subscription plan</li>
              <li>To process payments and send transaction confirmations</li>
              <li>To send important service-related emails (plan activation, expiry reminders)</li>
              <li>To improve our platform using anonymised usage analytics</li>
              <li>To display relevant advertisements via Google AdSense</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Third-Party Services</h2>
            <p>We share data with the following trusted third parties to operate our service:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li><strong className="text-white">Google (Sign-in, Analytics, AdSense):</strong> For authentication, analytics, and advertising. Governed by Google's Privacy Policy.</li>
              <li><strong className="text-white">Razorpay:</strong> Payment processing for Indian customers (UPI, cards, wallets). Governed by Razorpay's Privacy Policy. Razorpay is PCI-DSS compliant.</li>
              <li><strong className="text-white">OpenRouter / Anthropic:</strong> AI model providers that process your prompts to generate content. They do not retain your data for training without consent.</li>
              <li><strong className="text-white">Pollinations.ai:</strong> Image generation service for AI-generated images.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Cookies</h2>
            <p>We use cookies and similar tracking technologies for:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Keeping you signed in (session cookies)</li>
              <li>Storing your credits and plan locally (localStorage)</li>
              <li>Google Analytics to understand site usage</li>
              <li>Google AdSense to serve relevant ads</li>
            </ul>
            <p className="mt-2">You can disable cookies in your browser settings, though some features may not function correctly.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Data Retention</h2>
            <p>We retain your account data (email, plan, credit balance) for as long as your account is active. Payment records are retained for 7 years as required by Indian financial regulations. You may request deletion of your account data by contacting us.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Your Rights</h2>
            <p>Under applicable law (including India's IT Act and DPDP Act), you have the right to:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your account and data</li>
              <li>Opt out of marketing communications</li>
            </ul>
            <p className="mt-2">To exercise these rights, email us at <strong className="text-white">support@marketingstuffs.site</strong>.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Security</h2>
            <p>We implement industry-standard security measures including HTTPS encryption, secure database storage, and access controls. However, no method of internet transmission is 100% secure. We cannot guarantee absolute security.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Children's Privacy</h2>
            <p>Our service is not directed to individuals under the age of 18. We do not knowingly collect personal information from children. If you believe a child has provided us with personal data, please contact us immediately.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy on this page with an updated date. Continued use of our service after changes constitutes acceptance of the revised policy.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">11. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us:</p>
            <div className="mt-3 bg-white/5 border border-white/10 rounded-lg p-4 text-sm">
              <p className="text-white font-semibold">Marketingstuffs</p>
              <p>Email: <a href="mailto:support@marketingstuffs.site" className="text-primary hover:underline">support@marketingstuffs.site</a></p>
              <p>Website: <a href="https://marketingstuffs.site" className="text-primary hover:underline">marketingstuffs.site</a></p>
              <p>Country: India</p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
