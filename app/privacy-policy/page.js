import React from "react";

export default function PrivacyPolicy() {
  return (
    <main className="relative min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/10 py-0 md:py-0 flex flex-col justify-center">
      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center py-4 md:py-8 px-4">
        <h1 className="text-4xl md:text-5xl font-extrabold text-primary drop-shadow mb-4 tracking-tight">Privacy Policy</h1>
        <p className="text-lg text-gray-700 max-w-2xl mx-auto mb-6">Effective Date: <span className="font-semibold">[Insert Date]</span></p>
      </section>
      {/* Glassmorphism Card Section */}
      <section className="relative z-20 max-w-3xl mx-auto w-full px-2 md:px-0">
        <div className="backdrop-blur-lg bg-white/80 border border-primary/10 rounded-3xl shadow-2xl p-8 animate-fade-in">
          <ol className="space-y-6 text-gray-800 text-base md:text-lg">
            <li>
              <h2 className="text-xl font-bold text-primary mb-1">1. What We Collect</h2>
              <p>We collect things like your name, contact info, location, and booking activity. Artisans may also provide IDs or licenses for verification.</p>
            </li>
            <li>
              <h2 className="text-xl font-bold text-primary mb-1">2. Why We Collect It</h2>
              <p>We use your information to match you with the right services, improve your experience, and keep our platform safe for everyone.</p>
            </li>
            <li>
              <h2 className="text-xl font-bold text-primary mb-1">3. Who We Share It With</h2>
              <p>Only with those who need it — like artisans you book or services that help us send emails or handle payments. We never sell your data.</p>
            </li>
            <li>
              <h2 className="text-xl font-bold text-primary mb-1">4. How We Keep It Safe</h2>
              <p>We use encryption, access controls, and other tools to protect your information. If something goes wrong, we’ll let you know and fix it fast.</p>
            </li>
            <li>
              <h2 className="text-xl font-bold text-primary mb-1">5. Your Rights</h2>
              <p>You can request a copy of your data, ask us to delete your account, or opt out of marketing messages. We're here to help if you need anything.</p>
            </li>
          </ol>
        </div>
      </section>
      {/* Decorative Blobs */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl -z-10 animate-float-slow" />
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-yellow-300/10 rounded-full blur-3xl -z-10 animate-float-slow2" />
    </main>
  );
}
