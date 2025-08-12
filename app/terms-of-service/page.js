import React from "react";

export default function TermsOfService() {
  return (
    <main className="relative min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/10 py-0 md:py-0 flex flex-col justify-center">
      <section className="relative z-10 flex flex-col items-center justify-center text-center py-4 md:py-8 px-4">
        <h1 className="text-4xl md:text-5xl font-extrabold text-primary drop-shadow mb-4 tracking-tight">Terms of Service</h1>
        <p className="text-lg text-gray-700 max-w-2xl mx-auto mb-6">Effective Date: <span className="font-semibold">[Insert Date]</span></p>
      </section>
      <section className="relative z-20 max-w-3xl mx-auto w-full px-2 md:px-0">
        <div className="backdrop-blur-lg bg-white/80 border border-primary/10 rounded-3xl shadow-2xl p-8 animate-fade-in">
          <ol className="space-y-6 text-gray-800 text-base md:text-lg">
            <li>
              <h2 className="text-xl font-bold text-primary mb-1">1. Using Our Platform</h2>
              <p>We welcome anyone over 18 years old to use ArtisanConnect. You’re responsible for your account, so keep your password secure and don’t share your login.</p>
            </li>
            <li>
              <h2 className="text-xl font-bold text-primary mb-1">2. What We Do (and Don’t)</h2>
              <p>We connect customers with artisans. We do our best to verify providers, but we don’t perform the jobs ourselves. You agree to handle payments and feedback honestly, and to treat each other respectfully.</p>
            </li>
            <li>
              <h2 className="text-xl font-bold text-primary mb-1">3. Artisan Verification</h2>
              <p>We check IDs and certifications submitted by artisans, but we encourage users to always review provider profiles, past jobs, and ratings before booking.</p>
            </li>
            <li>
              <h2 className="text-xl font-bold text-primary mb-1">4. Play Fair</h2>
              <p>Please avoid any illegal or misleading behavior. This includes creating fake accounts, leaving dishonest reviews, or misusing someone’s information.</p>
            </li>
            <li>
              <h2 className="text-xl font-bold text-primary mb-1">5. No Guarantees</h2>
              <p>We do our best to keep the platform running smoothly, but we can’t promise perfection. We’re not responsible for damages or disputes that occur off-platform.</p>
            </li>
            <li>
              <h2 className="text-xl font-bold text-primary mb-1">6. Updates to These Terms</h2>
              <p>We’ll notify you if we change these terms. Using ArtisanConnect after that means you’re okay with the changes.</p>
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
