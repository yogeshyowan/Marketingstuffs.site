import { useState } from "react";
import { Mail, MessageSquare, Clock, MapPin } from "lucide-react";

export default function ContactUs() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const mailtoLink = `mailto:support@marketingstuffs.site?subject=${encodeURIComponent(form.subject || "Contact from " + form.name)}&body=${encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`)}`;
    window.location.href = mailtoLink;
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <a href="/" className="inline-flex items-center gap-2 text-primary hover:underline mb-8 text-sm">
          ← Back to Marketingstuffs
        </a>

        <h1 className="text-3xl font-bold text-white mb-2">Contact Us</h1>
        <p className="text-muted-foreground mb-12">Have a question, issue, or feedback? We're here to help.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">

          <div className="space-y-8">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Email Support</h3>
                <p className="text-muted-foreground text-sm mb-1">For billing, refunds, account issues, or general queries:</p>
                <a href="mailto:support@marketingstuffs.site" className="text-primary hover:underline font-medium">
                  support@marketingstuffs.site
                </a>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Response Time</h3>
                <p className="text-muted-foreground text-sm">We typically respond within <strong className="text-white">24–48 hours</strong> on business days (Monday–Saturday, IST).</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Business Information</h3>
                <p className="text-muted-foreground text-sm">
                  <span className="block text-white font-medium">Marketingstuffs</span>
                  <span className="block">India</span>
                  <span className="block">Website: marketingstuffs.site</span>
                  <span className="block">Email: support@marketingstuffs.site</span>
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-white font-semibold mb-1">Common Topics</h3>
                <ul className="text-muted-foreground text-sm space-y-1">
                  <li>• Payment & billing issues</li>
                  <li>• Refund requests</li>
                  <li>• Credits not added after payment</li>
                  <li>• Account access problems</li>
                  <li>• Feature suggestions</li>
                  <li>• Bug reports</li>
                </ul>
              </div>
            </div>
          </div>

          <div>
            {submitted ? (
              <div className="bg-primary/10 border border-primary/30 rounded-xl p-8 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">Email Client Opened</h3>
                <p className="text-muted-foreground text-sm">Your default email app should have opened with your message pre-filled. If not, email us directly at <a href="mailto:support@marketingstuffs.site" className="text-primary hover:underline">support@marketingstuffs.site</a></p>
                <button onClick={() => setSubmitted(false)} className="mt-4 text-primary hover:underline text-sm">Send another message</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
                <h3 className="text-white font-semibold mb-4">Send us a message</h3>

                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Your Name *</label>
                  <input
                    type="text" required
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Rahul Sharma"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Email Address *</label>
                  <input
                    type="email" required
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="rahul@example.com"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Subject *</label>
                  <select
                    required
                    value={form.subject}
                    onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary/50 text-sm"
                  >
                    <option value="" className="bg-background">Select a topic</option>
                    <option value="Payment / Billing Issue" className="bg-background">Payment / Billing Issue</option>
                    <option value="Refund Request" className="bg-background">Refund Request</option>
                    <option value="Credits Not Added" className="bg-background">Credits Not Added After Payment</option>
                    <option value="Account Access Issue" className="bg-background">Account Access Issue</option>
                    <option value="Bug Report" className="bg-background">Bug Report</option>
                    <option value="Feature Request" className="bg-background">Feature Request</option>
                    <option value="General Query" className="bg-background">General Query</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-muted-foreground mb-1">Message *</label>
                  <textarea
                    required rows={5}
                    value={form.message}
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    placeholder="Please describe your issue or question in detail..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 text-sm resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-2.5 rounded-lg transition-colors text-sm"
                >
                  Send Message
                </button>

                <p className="text-white/30 text-xs text-center">
                  For urgent payment issues, email us directly at support@marketingstuffs.site
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
