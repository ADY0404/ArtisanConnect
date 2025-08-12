import React from "react";

export default function AboutUs() {
  return (
    <main className="relative min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/10 py-0 md:py-0 flex flex-col justify-center">
      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center py-2 md:py-8 px-4">
        <h1 className="text-4xl md:text-5xl font-extrabold text-primary drop-shadow mb-4 tracking-tight">About Us</h1>
        <p className="text-lg text-gray-700 max-w-2xl mx-auto mb-6">Building trust, empowering artisans, and connecting communities—one project at a time.</p>
      </section>
      {/* Glassmorphism Card Section */}
      <section className="relative z-20 max-w-3xl mx-auto w-full px-2 md:px-0">
        <div className="backdrop-blur-lg bg-white/80 border border-primary/10 rounded-3xl shadow-2xl p-8 animate-fade-in">
          <h2 className="text-2xl font-bold text-primary mb-4">Our Mission</h2>
          <p className="text-gray-800 text-base md:text-lg mb-6">
            At ArtisanConnect, we believe in creating meaningful connections between people. Our mission is simple: to make it easier, safer, and more transparent for everyday individuals to find trusted artisans in their communities.
          </p>
          <h2 className="text-2xl font-bold text-primary mb-4">Why We Exist</h2>
          <p className="text-gray-800 text-base md:text-lg mb-6">
            We understand the frustration of unreliable service and the struggle skilled artisans face in reaching new clients. That’s why we built ArtisanConnect—a place where trust is earned, communication is clear, and great work is rewarded.
          </p>
          <h2 className="text-2xl font-bold text-primary mb-4">More Than a Platform</h2>
          <p className="text-gray-800 text-base md:text-lg">
            We’re more than just a platform. We’re a community. Whether you're looking to fix a leak, paint a room, or build something new, we’re here to help you find the right hands for the job.
          </p>
        </div>
      </section>
      {/* Decorative Blobs */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl -z-10 animate-float-slow" />
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-yellow-300/10 rounded-full blur-3xl -z-10 animate-float-slow2" />
    </main>
  );
}
