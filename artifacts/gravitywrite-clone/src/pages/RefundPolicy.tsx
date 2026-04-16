export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <a href="/" className="inline-flex items-center gap-2 text-primary hover:underline mb-8 text-sm">
          ← Back to Marketingstuffs
        </a>
        <h1 className="text-3xl font-bold text-white mb-2">Cancellation & Refund Policy</h1>
        <p className="text-muted-foreground mb-10 text-sm">Last updated: April 16, 2026</p>

        <div className="prose prose-invert max-w-none space-y-8 text-muted-foreground leading-relaxed">

          <section>
            <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 mb-6">
              <p className="text-white font-medium">Summary: We offer a 7-day refund for unused paid plans. Top-up credits are non-refundable once any credits have been used.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Subscription Plans</h2>
            <p>Marketingstuffs offers monthly subscription plans (Plus, Pro, Enterprise) billed in Indian Rupees (INR) through Razorpay.</p>

            <h3 className="text-lg font-medium text-white mt-4 mb-2">Cancellation</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>You may cancel your subscription at any time by contacting us at <a href="mailto:support@marketingstuffs.site" className="text-primary hover:underline">support@marketingstuffs.site</a>.</li>
              <li>Cancellation stops future billing. Your plan remains active until the end of the current 30-day billing cycle, after which your account reverts to the free plan.</li>
              <li>There is no auto-renewal — each plan period requires a new payment.</li>
            </ul>

            <h3 className="text-lg font-medium text-white mt-4 mb-2">Refunds</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-white">7-day refund window:</strong> If you are unsatisfied with your plan, you may request a full refund within 7 days of purchase, provided you have used fewer than 10% of your plan credits.</li>
              <li><strong className="text-white">No refund after 7 days:</strong> Refund requests made after 7 days from the purchase date will not be eligible.</li>
              <li><strong className="text-white">No refund if credits used:</strong> If more than 10% of credits have been consumed, no refund will be issued as the service has been substantially used.</li>
              <li><strong className="text-white">Technical failure:</strong> If you are unable to use the service due to a technical fault on our side that we cannot resolve within 72 hours, you are entitled to a full refund regardless of usage.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Top-Up Credit Packs</h2>
            <p>Top-up credit packs (₹99 / 100 credits, ₹349 / 500 credits, ₹849 / 1500 credits) are non-refundable once purchased, as credits are delivered instantly and are consumed on use.</p>
            <p className="mt-2">Exception: If the payment was charged but credits were not added to your account, please contact us within 48 hours with your payment reference number and we will resolve it immediately.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Duplicate Payments</h2>
            <p>If you were charged more than once for the same order due to a technical error, we will refund the duplicate charge in full. Please email us with both payment reference numbers and we will process the refund within 5–7 business days.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. How Refunds Are Processed</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Approved refunds are processed through Razorpay back to the original payment method (UPI, card, wallet, or net banking).</li>
              <li>Refunds typically appear within <strong className="text-white">5–7 business days</strong>, depending on your bank or UPI provider.</li>
              <li>UPI refunds are usually faster (1–2 business days).</li>
              <li>Razorpay may take up to 10 business days for card refunds in some cases.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Non-Refundable Situations</h2>
            <p>Refunds will not be provided in the following cases:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Account suspension or termination due to violation of our Terms of Service</li>
              <li>Dissatisfaction with AI-generated content quality (subjective preference)</li>
              <li>Requests made after the 7-day window</li>
              <li>Top-up packs with any credits used</li>
              <li>Change of mind after substantial usage</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. How to Request a Refund</h2>
            <p>To request a refund, email us at <a href="mailto:support@marketingstuffs.site" className="text-primary hover:underline">support@marketingstuffs.site</a> with:</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>Your registered email address</li>
              <li>Razorpay payment ID or order ID</li>
              <li>Reason for the refund request</li>
              <li>Date of purchase</li>
            </ul>
            <p className="mt-2">We will review your request and respond within <strong className="text-white">2 business days</strong>.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Grievance Redressal</h2>
            <p>In accordance with the Information Technology Act, 2000 and Consumer Protection Act, 2019, if you have a grievance, please contact our Grievance Officer:</p>
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-sm mt-3">
              <p className="text-white font-semibold">Grievance Officer — Marketingstuffs</p>
              <p>Email: <a href="mailto:support@marketingstuffs.site" className="text-primary hover:underline">support@marketingstuffs.site</a></p>
              <p>Response time: Within 30 days of receiving complaint</p>
              <p>Country: India</p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
