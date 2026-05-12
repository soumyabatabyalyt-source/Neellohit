"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  Rocket,
  ShieldCheck,
  MessageSquareMore,
} from "lucide-react";

export default function ClientPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#0f172a_0%,#020617_45%,#000000_100%)]" />

      {/* Stars */}
      <div className="absolute inset-0 opacity-40">
        <div className="stars" />
      </div>

      {/* Glow Effects */}
      <div className="absolute left-1/4 top-0 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />

      <section className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 py-20">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl text-center"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-xl">
            <Sparkles className="h-4 w-4 text-cyan-400" />
            <span className="text-sm text-gray-300">
              Neellohit Campaign Portal
            </span>
          </div>

          <h1 className="text-5xl font-bold leading-tight md:text-7xl">
            Reddit Growth <span className="text-cyan-400">Infrastructure</span>
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-gray-300 md:text-xl">
            We help brands scale visibility through strategic Reddit campaigns,
            engagement systems, stealth marketing, community positioning, and
            long-term growth operations designed for modern audiences.
          </p>

          {/* CTA Button */}
          <Link
            href="/start-campaign"
            className="mt-12 inline-flex items-center gap-3 rounded-2xl bg-cyan-500 px-8 py-4 text-lg font-semibold text-black transition hover:scale-105 hover:bg-cyan-400"
          >
            Start a Campaign
            <ArrowRight className="h-5 w-5" />
          </Link>
        </motion.div>

        {/* What We Offer */}
        <div className="mt-24 grid w-full gap-6 md:grid-cols-3">
          {/* Card 1 */}
          <motion.div
            whileHover={{ y: -5 }}
            className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-2xl"
          >
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-black/40">
              <Rocket className="h-7 w-7 text-cyan-400" />
            </div>

            <h2 className="text-2xl font-semibold">
              Strategic Campaign Deployment
            </h2>

            <p className="mt-4 leading-relaxed text-gray-400">
              We design and execute Reddit campaigns tailored to your niche,
              audience, and growth objectives across targeted communities.
            </p>
          </motion.div>

          {/* Card 2 */}
          <motion.div
            whileHover={{ y: -5 }}
            className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-2xl"
          >
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-black/40">
              <MessageSquareMore className="h-7 w-7 text-indigo-400" />
            </div>

            <h2 className="text-2xl font-semibold">
              Engagement Infrastructure
            </h2>

            <p className="mt-4 leading-relaxed text-gray-400">
              From discussion threads to community interaction systems, we help
              campaigns feel natural, authentic, and scalable.
            </p>
          </motion.div>

          {/* Card 3 */}
          <motion.div
            whileHover={{ y: -5 }}
            className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-2xl"
          >
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-black/40">
              <ShieldCheck className="h-7 w-7 text-green-400" />
            </div>

            <h2 className="text-2xl font-semibold">
              Monitoring & Optimization
            </h2>

            <p className="mt-4 leading-relaxed text-gray-400">
              Campaigns are continuously monitored and optimized for reach,
              engagement quality, audience response, and long-term performance.
            </p>
          </motion.div>
        </div>

        {/* Process Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-24 w-full rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur-2xl"
        >
          <h2 className="text-center text-4xl font-bold">
            How We <span className="text-cyan-400">Work</span>
          </h2>

          <div className="mt-12 grid gap-10 md:grid-cols-3">
            <div>
              <div className="mb-3 text-4xl font-bold text-cyan-400">01</div>

              <h3 className="text-2xl font-semibold">
                Campaign Consultation
              </h3>

              <p className="mt-4 text-gray-400">
                We understand your niche, audience, growth goals, and desired
                market positioning before deployment.
              </p>
            </div>

            <div>
              <div className="mb-3 text-4xl font-bold text-cyan-400">02</div>

              <h3 className="text-2xl font-semibold">
                Strategy & Infrastructure
              </h3>

              <p className="mt-4 text-gray-400">
                We build a custom Reddit engagement strategy optimized for your
                specific campaign objectives.
              </p>
            </div>

            <div>
              <div className="mb-3 text-4xl font-bold text-cyan-400">03</div>

              <h3 className="text-2xl font-semibold">
                Launch & Scale
              </h3>

              <p className="mt-4 text-gray-400">
                Campaigns are launched, monitored, optimized, and scaled through
                ongoing management systems.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Online Status */}
        <div className="mt-16 rounded-2xl border border-green-500/20 bg-green-500/10 px-6 py-4 backdrop-blur-xl">
          <p className="text-sm text-green-300">
            ● Team Online — Average response time: ~15 minutes
          </p>
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