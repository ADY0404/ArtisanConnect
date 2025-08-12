import React from "react";

export default function CookiePolicy() {
  return (
    <main className="relative min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/10 py-0 md:py-0 flex flex-col justify-center">
      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center py-4 md:py-8 px-4">
        <h1 className="text-4xl md:text-5xl font-extrabold text-primary drop-shadow mb-4 tracking-tight">Cookie Policy</h1>
        <p className="text-lg text-gray-700 max-w-2xl mx-auto mb-6">Effective Date: <span className="font-semibold">[Insert Date]</span></p>
      </section>
      {/* Glassmorphism Card Section */}
      <section className="relative z-20 max-w-3xl mx-auto w-full px-2 md:px-0">
        <div className="backdrop-blur-lg bg-white/80 border border-primary/10 rounded-3xl shadow-2xl p-8 animate-fade-in">
          <ol className="space-y-6 text-gray-800 text-base md:text-lg">
            <li>
              <h2 className="text-xl font-bold text-primary mb-1">1. What Are Cookies?</h2>
              <p>Cookies are small files stored on your device to help websites work better — like keeping you logged in or remembering your preferences.</p>
            </li>
            <li>
              <h2 className="text-xl font-bold text-primary mb-1">2. Why We Use Them</h2>
              <ul className="list-disc ml-6 text-gray-700">
                <li>Keep your session active</li>
                <li>Remember your preferences (like region or service category)</li>
                <li>Collect analytics so we know what’s working and what’s not</li>
              </ul>
            </li>
            <li>
              <h2 className="text-xl font-bold text-primary mb-1">3. Your Choices</h2>
              <p>You can disable cookies in your browser settings. Just keep in mind that some features might not work as smoothly without them.</p>
            </li>
            <li>
              <h2 className="text-xl font-bold text-primary mb-1">4. Third-Party Tools</h2>
              <p>We use tools like Google Analytics to track site performance. These tools may set their own cookies — we try to keep it minimal and respectful.</p>
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
