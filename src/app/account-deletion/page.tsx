import type { Metadata } from "next";
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Mail,
  ShieldCheck,
  Trash2,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Request account deletion | Transpo24",
  description:
    "Request deletion of a Transpo24 customer or transport-provider account and its associated personal data.",
};

const deletionRequestEmail =
  "mailto:info@transpo24.com" +
  "?subject=Transpo24%20account%20deletion%20request" +
  "&body=I%20request%20deletion%20of%20my%20Transpo24%20account.%0A%0A" +
  "Account%20type%20(customer%20or%20transport%20provider):%20%0A" +
  "Registered%20phone%20number%20including%20country%20code:%20%0A" +
  "Registered%20name:%20%0A%0A" +
  "I%20understand%20that%20Transpo24%20may%20contact%20me%20to%20verify%20my%20identity%20before%20deleting%20the%20account.";

const deletionScope = [
  "Your Transpo24 account and authentication access",
  "Profile and contact information associated with the account",
  "Saved locations, device tokens, and account preferences",
  "Other personal data associated with the account, unless retention is legally required",
];

export default function AccountDeletionPage() {
  return (
    <main className="min-h-screen bg-[#f7f7f4] text-[#111827]">
      <header className="border-b border-black/10 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-4 sm:px-8">
          <a className="text-xl font-black tracking-[-0.04em]" href="https://transpo24.com">
            Transpo<span className="text-[#d89a1a]">24</span>
          </a>
          <a
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#68768a] transition hover:text-[#111827]"
            href="https://transpo24.com"
          >
            <ArrowLeft className="h-4 w-4" />
            Main website
          </a>
        </div>
      </header>

      <section className="mx-auto w-full max-w-5xl px-5 py-14 sm:px-8 sm:py-20">
        <div className="max-w-3xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#e2ba54] bg-[#fff7dc] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#805a00]">
            <ShieldCheck className="h-4 w-4" />
            Privacy request
          </div>
          <h1 className="text-4xl font-black tracking-[-0.055em] sm:text-6xl">
            Request account deletion
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-[#586579] sm:text-lg">
            This public page lets you request deletion of a Transpo24 customer or transport-provider
            account without reinstalling or signing in to the mobile app.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
          <article className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-[0_28px_80px_-55px_rgba(17,24,39,.6)] sm:p-9">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ffc548]">
              <Trash2 className="h-6 w-6" />
            </div>
            <h2 className="mt-6 text-2xl font-extrabold tracking-[-0.035em]">Send your request</h2>
            <p className="mt-3 leading-7 text-[#68768a]">
              Use the button below to email our privacy team. Include your account type, registered
              name, and registered phone number with country code so we can identify the correct account.
            </p>

            <a
              className="mt-7 inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-full bg-[#111827] px-6 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#222d3f] sm:w-auto"
              href={deletionRequestEmail}
            >
              <Mail className="h-5 w-5" />
              Email deletion request
            </a>

            <div className="mt-6 rounded-2xl border border-[#e5e8ef] bg-[#fafafa] p-4 text-sm leading-6 text-[#586579]">
              If the button does not open your email application, send your request directly to{" "}
              <a className="font-bold text-[#805a00] underline" href="mailto:info@transpo24.com">
                info@transpo24.com
              </a>{" "}
              with the subject “Transpo24 account deletion request”.
            </div>
          </article>

          <aside className="rounded-[2rem] bg-[#111827] p-6 text-white sm:p-9">
            <h2 className="text-xl font-extrabold tracking-[-0.03em]">What happens next</h2>
            <ol className="mt-6 space-y-5 text-sm leading-6 text-[#c8d0dc]">
              <li className="flex gap-3"><span className="font-black text-[#ffc548]">01</span><span>We confirm receipt of your deletion request.</span></li>
              <li className="flex gap-3"><span className="font-black text-[#ffc548]">02</span><span>We may ask you to verify control of the registered phone number or provide other limited verification information.</span></li>
              <li className="flex gap-3"><span className="font-black text-[#ffc548]">03</span><span>After verification, we delete the account and associated personal data, subject to required retention.</span></li>
            </ol>
            <p className="mt-7 border-t border-white/15 pt-6 text-xs leading-5 text-[#98a4b5]">
              Never send a password, one-time verification code, full payment-card number, or identity-document image by email.
            </p>
          </aside>
        </div>

        <article className="mt-6 rounded-[2rem] border border-black/10 bg-white p-6 sm:p-9">
          <h2 className="text-2xl font-extrabold tracking-[-0.035em]">Data included in deletion</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {deletionScope.map((item) => (
              <div className="flex gap-3 rounded-2xl bg-[#fafafa] p-4" key={item}>
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#b17a00]" />
                <p className="text-sm leading-6 text-[#586579]">{item}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm leading-7 text-[#68768a]">
            Some information may be retained where reasonably necessary for legal obligations, tax or
            accounting requirements, payment records, unresolved disputes, fraud prevention, safety
            investigations, or legal claims. Retained information remains protected and is deleted when
            the applicable retention requirement ends.
          </p>
        </article>

        <div className="mt-8 flex flex-wrap gap-4 text-sm font-bold">
          <a className="inline-flex items-center gap-2 text-[#805a00] hover:underline" href="https://transpo24.com/privacy">
            Read the Privacy Policy <ExternalLink className="h-4 w-4" />
          </a>
          <a className="inline-flex items-center gap-2 text-[#805a00] hover:underline" href="https://transpo24.com/terms">
            Read the Terms of Service <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </section>

      <footer className="border-t border-black/10 bg-white px-5 py-7 text-center text-xs text-[#68768a]">
        © 2026 Transpo24 · Privacy contact: info@transpo24.com
      </footer>
    </main>
  );
}
