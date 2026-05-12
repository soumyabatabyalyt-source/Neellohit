"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Send,
  MessageCircle,
  Rocket,
  ArrowRight,
} from "lucide-react";

export default function StartCampaignPage() {
  const copyDiscord = async () => {
    await navigator.clipboard.writeText("storm_sb");
    alert("Discord username copied!");
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#0f172a_0%,#020617_45%,#000000_100%)]" />

      {/* Stars */}
      <div className="absolute inset-0 opacity-40">
        <div className="stars" />
      </div>

      {/* Glow */}
      <div className="absolute left-1/4 top-0 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />

      <section className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h1 className="text-5xl font-bold md:text-7xl">
            Choose Your <span className="text-cyan-400">Platform</span>
          </h1>

          <p className="mt-6 text-lg text-gray-300 md:text-xl">
            Select your preferred communication method to begin onboarding.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="mt-16 grid w-full gap-6 md:grid-cols-3">
          {/* Telegram */}
          <motion.div
            whileHover={{ y: -5 }}
            className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-2xl"
          >
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-black/40">
              <Send className="h-7 w-7 text-sky-400" />
            </div>

            <h2 className="text-2xl font-semibold">Telegram</h2>

            <p className="mt-3 text-gray-400">
              Fast onboarding and direct communication.
            </p>

            <Link
              href="https://t.me/Sb_12390?text=Hello%20I%20want%20to%20start%20a%20campaign"
              target="_blank"
              className="mt-8 inline-flex items-center gap-2 text-sky-400 hover:text-sky-300"
            >
              Open Telegram
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>

          {/* Discord */}
          <motion.div
            whileHover={{ y: -5 }}
            className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-2xl"
          >
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-black/40">
              <MessageCircle className="h-7 w-7 text-indigo-400" />
            </div>

            <h2 className="text-2xl font-semibold">Discord</h2>

            <p className="mt-3 text-gray-400">
              Best for long-term campaign management.
            </p>

            <button
              onClick={copyDiscord}
              className="mt-8 inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300"
            >
              Copy Username
              <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>

          {/* X */}
          <motion.div
            whileHover={{ y: -5 }}
            className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-2xl"
          >
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-black/40">
              <Rocket className="h-7 w-7 text-cyan-400" />
            </div>

            <h2 className="text-2xl font-semibold">X</h2>

            <p className="mt-3 text-gray-400">
              Partnerships, networking, and inquiries.
            </p>

            <Link
              href="https://x.com/BatabyalSo58110"
              target="_blank"
              className="mt-8 inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300"
            >
              Open X Profile
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stars Animation */}
      <style jsx>{`
        .stars {
          width: 100%;
          height: 100%;
          background-image:
            radial-gradient(white 1px, transparent 1px),
            radial-gradient(white 1px, transparent 1px);
          background-size: 50px 50px;
          background-position: 0 0, 25px 25px;
          animation: moveStars 120s linear infinite;
        }

        @keyframes moveStars {
          from {
            transform: translateY(0);
          }
          to {
            transform: translateY(-2000px);
          }
        }
      `}</style>
    </main>
  );
}