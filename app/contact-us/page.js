"use client";

import React, { useState } from "react";
import {
  Mail,
  Info,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Users,
} from "lucide-react";

export default function Contact() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    message: "",
  });
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Simple validation
    if (!form.fullName || !form.email || !form.message) {
      setError("Please fill in all required fields.");
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (form.message.length < 10) {
      setError("Message should be at least 10 characters.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setSuccess("Your message has been sent successfully!");
      setForm({ fullName: "", email: "", phone: "", message: "" });
      setLoading(false);
    }, 1000);
  };

  return (
    <main className="relative min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/10 py-0 md:py-0 flex flex-col justify-center">
      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center py-4 md:py-8 px-4">
        <h1 className="text-4xl md:text-5xl font-extrabold text-primary drop-shadow mb-4 tracking-tight">
          Contact <span className="text-primary">Us</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto mb-6">
          We'd love to hear from you! Reach out for support, partnership, or just to say hello.
        </p>
      </section>
      {/* Glassmorphism Card Section */}
      <section className="relative z-20 max-w-5xl mx-auto w-full px-2 md:px-0">
        <div className="grid md:grid-cols-2 gap-8 items-stretch">
          {/* Info Card */}
          <div className="backdrop-blur-lg bg-white/70 border border-primary/10 rounded-3xl shadow-2xl p-8 flex flex-col gap-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-primary mb-4 flex items-center gap-2">
              <Users className="w-7 h-7 text-primary" />
              Contact Information
            </h2>
            <ul className="space-y-4 text-base">
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary" />
                <span className="font-semibold">Email:</span>{" "}
                <span className="text-gray-700">support@artisanConnect.com</span>
              </li>
              <li className="flex items-center gap-3">
                <Info className="w-5 h-5 text-primary" />
                <span className="font-semibold">Info Email:</span>{" "}
                <span className="text-gray-700">info@artisanConnect.com</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary" />
                <span className="font-semibold">Phone:</span>{" "}
                <span className="text-gray-700">+233 55 059 0714</span>
              </li>
              <li className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-primary" />
                <span className="font-semibold">Address:</span>{" "}
                <span className="text-gray-700">
                First Floor, Friendly Heights Building, Accra – Ghana
                </span>
              </li>
            </ul>
            <div className="mt-8 rounded-lg overflow-hidden shadow-lg border border-primary/10">
              <iframe
                title="Google Map"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3971.073964479836!2d-0.1208506846750136!3d5.570370995954095!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xfdf9b1e2e2b1b1b%3A0x7e2b1b1b1b1b1b1b!2sS-03%20First%20Floor%2C%20Friendly%20Heights%20Building%2C%20Mahama%20Road%2C%20Tse%20Addo%2C%20Accra%20%E2%80%93%20Ghana!5e0!3m2!1sen!2sgh!4v1691500000000!5m2!1sen!2sgh"
                width="100%"
                height="180"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-44 md:h-48"
              ></iframe>
            </div>
                        <div className="flex gap-4 mt-6">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:scale-110 transition-transform"
              >
                <Facebook className="w-6 h-6 text-primary" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:scale-110 transition-transform"
              >
                <Twitter className="w-6 h-6 text-primary" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:scale-110 transition-transform"
              >
                <Instagram className="w-6 h-6 text-primary" />
              </a>
            </div>
          </div>
          {/* Contact Form Card */}
          <form
            onSubmit={handleSubmit}
            className="backdrop-blur-lg bg-white/80 border border-primary/10 rounded-3xl shadow-2xl p-8 flex flex-col gap-4 animate-fade-in"
          >
            {/* <h2 className="text-2xl font-bold mb-2 text-primary">Send Us a Message</h2> */}
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="fullName">
                Full Name<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/60 bg-white/90"
                value={form.fullName}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="email">
                Email<span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/60 bg-white/90"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="phone">
                Phone
              </label>
              <input
                type="text"
                id="phone"
                name="phone"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/60 bg-white/90"
                value={form.phone}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="message">
                Message<span className="text-red-500">*</span>
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/60 bg-white/90"
                value={form.message}
                onChange={handleChange}
                required
              />
            </div>
            {error && <div className="text-red-600 text-sm font-medium">{error}</div>}
            {success && <div className="text-green-600 text-sm font-medium">{success}</div>}
            <button
              type="submit"
              className="bg-primary text-white px-6 py-2 rounded-lg font-semibold shadow hover:scale-105 transition disabled:opacity-60 mt-2"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Send Message"}
            </button>
          </form>
        </div>
      </section>
      {/* Decorative Blobs */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl -z-10 animate-float-slow" />
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-yellow-300/10 rounded-full blur-3xl -z-10 animate-float-slow2" />
    </main>
  );
}
