"use client"

import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { useEffect, useState } from "react"

// =========================================
// STAR BACKGROUND
// =========================================

function StarField() {

  const [stars, setStars] = useState<
    {
      id: number
      left: string
      top: string
      size: number
      duration: number
      delay: number
    }[]
  >([])

  useEffect(() => {

    const generated = Array.from({
      length: 120,
    }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 4 + 2,
      delay: Math.random() * 5,
    }))

    setStars(generated)

  }, [])

  return (

    <div className="absolute inset-0 overflow-hidden z-0">

      {stars.map((star) => (

        <motion.div
          key={star.id}
          className="absolute rounded-full bg-white"
          style={{
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
          }}
          animate={{
            opacity: [0.2, 1, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            delay: star.delay,
          }}
        />

      ))}

      <div className="
        absolute
        top-[-10%]
        left-[-10%]
        w-[500px]
        h-[500px]
        bg-blue-500/10
        rounded-full
        blur-[120px]
      " />

      <div className="
        absolute
        bottom-[-20%]
        right-[-10%]
        w-[500px]
        h-[500px]
        bg-purple-500/10
        rounded-full
        blur-[120px]
      " />

    </div>
  )
}

// =========================================
// GLASS CARD
// =========================================

function GlassCard({
  children,
}: {
  children: React.ReactNode
}) {

  return (

    <div className="
      relative
      backdrop-blur-xl
      bg-white/[0.05]
      border
      border-white/10
      shadow-2xl
      rounded-3xl
    ">

      {children}

    </div>
  )
}

// =========================================
// LOGO
// =========================================

function BrandLogo() {

  return (

    <div className="flex items-center gap-3">

      <div className="
        relative
        w-11
        h-11
        rounded-2xl
        overflow-hidden
        border
        border-white/10
        bg-white/5
      ">

        <Image
          src="/logo.png"
          alt="Neellohit Logo"
          fill
          className="object-cover"
          priority
        />

      </div>

      <span className="
        text-white
        font-semibold
        text-lg
        tracking-[0.15em]
      ">

        NEELLOHIT

      </span>

    </div>
  )
}

// =========================================
// MAIN PAGE
// =========================================

export default function Home() {

  const router = useRouter()

  return (

    <main className="
      relative
      min-h-screen
      overflow-hidden
      bg-[#040816]
      text-white
      font-sans
    ">

      <StarField />

      {/* NAVBAR */}

      <header className="
        fixed
        top-0
        left-0
        right-0
        z-50
        px-4
        md:px-8
        pt-4
      ">

        <GlassCard>

          <div className="
            flex
            items-center
            justify-between
            px-5
            py-4
          ">

            <BrandLogo />

            {/* NAV LINKS */}

            <nav className="
              hidden
              md:flex
              items-center
              gap-8
              text-sm
              text-slate-300
            ">

              <button
                onClick={() => router.push("/features")}
                className="hover:text-white transition"
              >
                Features
              </button>

              <button
                onClick={() => router.push("/rewards")}
                className="hover:text-white transition"
              >
                Rewards
              </button>

              <button
                onClick={() => router.push("/community")}
                className="hover:text-white transition"
              >
                Community
              </button>

            </nav>

            {/* CTA */}

            <button
              onClick={() => router.push("/auth")}
              className="
                px-5
                py-2.5
                rounded-full
                bg-white
                text-black
                text-sm
                font-medium
                hover:scale-105
                transition
              "
            >

              Get Started

            </button>

          </div>

        </GlassCard>

      </header>

      {/* HERO */}

      <section className="
        relative
        z-10
        flex
        items-center
        justify-center
        min-h-screen
        px-4
        pt-32
        pb-20
      ">

        <div className="max-w-6xl mx-auto w-full">

          <GlassCard>

            <div className="
              px-6
              py-14
              md:px-14
              md:py-20
              text-center
            ">

              {/* BADGE */}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="
                  inline-flex
                  items-center
                  gap-2
                  px-4
                  py-2
                  rounded-full
                  border
                  border-white/10
                  bg-white/[0.04]
                  mb-8
                "
              >

                <div className="
                  w-2
                  h-2
                  rounded-full
                  bg-cyan-400
                  animate-pulse
                " />

                <span className="
                  text-xs
                  uppercase
                  tracking-[0.25em]
                  text-slate-300
                ">

                  Platform V2.0 Live

                </span>

              </motion.div>

              {/* HEADLINE */}

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="
                  text-[2.8rem]
                  sm:text-[4.5rem]
                  md:text-[6.5rem]
                  leading-[0.95]
                  font-black
                  tracking-tight
                  mb-6
                "
              >

                Your online

                <br />

                <span className="
                  text-transparent
                  bg-clip-text
                  bg-gradient-to-r
                  from-blue-400
                  via-cyan-300
                  to-purple-400
                ">

                  presence

                </span>

                {" "}has value.

              </motion.h1>

              {/* DESCRIPTION */}

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
                className="
                  max-w-2xl
                  mx-auto
                  text-slate-300
                  text-base
                  md:text-xl
                  leading-relaxed
                  mb-12
                "
              >

                Neellohit transforms digital influence into real-world earnings.
                Complete bounties, grow communities, and earn through your online presence.

              </motion.p>

              {/* BUTTONS */}

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1.2 }}
                className="
                  flex
                  flex-col
                  sm:flex-row
                  items-center
                  justify-center
                  gap-4
                "
              >

                {/* PRIMARY */}

                <button
                  onClick={() => router.push("/auth")}
                  className="
                    group
                    relative
                    overflow-hidden
                    px-8
                    py-4
                    rounded-full
                    bg-gradient-to-r
                    from-blue-500
                    via-cyan-500
                    to-purple-500
                    text-white
                    font-semibold
                    text-sm
                    tracking-wide
                    shadow-2xl
                    shadow-cyan-500/20
                    hover:scale-105
                    transition-all
                    duration-300
                    w-full
                    sm:w-auto
                  "
                >

                  <span className="
                    flex
                    items-center
                    justify-center
                    gap-2
                  ">

                    Start Earning

                    <ArrowRight size={16} />

                  </span>

                </button>

                {/* CLIENT BUTTON */}

                <button
                  onClick={() => router.push("/client")}
                  className="
                    px-8
                    py-4
                    rounded-full
                    border
                    border-cyan-400/20
                    bg-cyan-500/10
                    text-cyan-200
                    text-sm
                    font-medium
                    hover:bg-cyan-500/20
                    transition-all
                    duration-300
                    w-full
                    sm:w-auto
                  "
                >

                  Become a Client

                </button>

              </motion.div>

            </div>

          </GlassCard>

        </div>

      </section>

      {/* FOOTER */}

      <footer className="
        relative
        z-10
        px-4
        pb-10
      ">

        <div className="max-w-6xl mx-auto">

          <GlassCard>

            <div className="
              px-6
              py-6
              flex
              flex-col
              md:flex-row
              items-center
              justify-between
              gap-4
            ">

              <div className="
                text-sm
                text-slate-400
              ">

                © 2026 Neellohit. All rights reserved.

              </div>

              <div className="
                flex
                items-center
                gap-6
                text-sm
                text-slate-400
              ">

                <button
                  onClick={() => router.push("/terms")}
                  className="hover:text-white transition"
                >
                  Terms
                </button>

                <button
                  onClick={() => router.push("/privacy")}
                  className="hover:text-white transition"
                >
                  Privacy
                </button>

                <button
                  onClick={() => router.push("/client")}
                  className="hover:text-white transition"
                >
                  Contact
                </button>

              </div>

            </div>

          </GlassCard>

        </div>

      </footer>

    </main>
  )
}