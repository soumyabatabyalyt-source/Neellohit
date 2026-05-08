"use client"

import { useRouter } from "next/navigation"

import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
} from "framer-motion"

import {
  ArrowRight,
  Zap,
  Shield,
  Trophy,
} from "lucide-react"

import {
  useRef,
  useEffect,
  useState,
} from "react"

// =========================================
// COUNTER
// =========================================

function useCounter(
  target: number,
  duration: number = 2000
) {

  const [count, setCount] =
    useState(0)

  const [started, setStarted] =
    useState(false)

  useEffect(() => {

    if (!started) return

    let startTime:
      | number
      | null = null

    const step = (
      timestamp: number
    ) => {

      if (!startTime)
        startTime =
          timestamp

      const progress =
        Math.min(
          (
            timestamp -
            startTime
          ) / duration,
          1
        )

      const eased =
        1 -
        Math.pow(
          1 - progress,
          3
        )

      setCount(
        Math.floor(
          eased * target
        )
      )

      if (progress < 1) {

        requestAnimationFrame(
          step
        )

      } else {

        setCount(target)
      }
    }

    requestAnimationFrame(step)

  }, [
    started,
    target,
    duration,
  ])

  return {
    count,
    start: () =>
      setStarted(true),
  }
}

// =========================================
// MAGNETIC BUTTON
// =========================================

function MagneticButton({

  children,
  className,
  onClick,

}: {

  children: React.ReactNode

  className?: string

  onClick?: () => void
}) {

  const ref =
    useRef<HTMLButtonElement>(
      null
    )

  const x =
    useMotionValue(0)

  const y =
    useMotionValue(0)

  const springX =
    useSpring(x, {
      stiffness: 300,
      damping: 30,
    })

  const springY =
    useSpring(y, {
      stiffness: 300,
      damping: 30,
    })

  const handleMouseMove = (
    e: React.MouseEvent
  ) => {

    if (!ref.current)
      return

    const rect =
      ref.current.getBoundingClientRect()

    const centerX =
      rect.left +
      rect.width / 2

    const centerY =
      rect.top +
      rect.height / 2

    x.set(
      (
        e.clientX -
        centerX
      ) * 0.25
    )

    y.set(
      (
        e.clientY -
        centerY
      ) * 0.25
    )
  }

  const handleMouseLeave =
    () => {

      x.set(0)
      y.set(0)
    }

  return (

    <motion.button
      ref={ref}
      style={{
        x: springX,
        y: springY,
      }}
      onMouseMove={
        handleMouseMove
      }
      onMouseLeave={
        handleMouseLeave
      }
      onClick={onClick}
      className={className}
    >

      {children}

    </motion.button>
  )
}

// =========================================
// TICKER
// =========================================

function Ticker() {

  const items = [

    "Instant payouts",

    "26,000+ active earners",

    "Verified bounties",

    "Karma multipliers",

    "Community-powered",

    "Zero waiting periods",

    "Premium tiers",

    "Real-world rewards",

    "Exclusive tasks",
  ]

  const doubled = [
    ...items,
    ...items,
  ]

  return (

    <div className="
      relative
      overflow-hidden
      border-y
      border-white/[0.04]
      py-4
      bg-white/[0.01]
    ">

      <motion.div
        animate={{
          x: [
            "0%",
            "-50%",
          ],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear",
        }}
        className="
          flex
          gap-16
          whitespace-nowrap
        "
      >

        {doubled.map(
          (item, i) => (

            <span
              key={i}
              className="
                flex
                items-center
                gap-4
                text-[11px]
                uppercase
                tracking-[0.25em]
                text-slate-500
                font-medium
              "
            >

              {item}

              <span className="
                w-1
                h-1
                rounded-full
                bg-orange-500/50
                inline-block
              " />

            </span>
          )
        )}

      </motion.div>

    </div>
  )
}

// =========================================
// CURSOR ORB
// =========================================

function CursorOrb() {

  const x =
    useMotionValue(0)

  const y =
    useMotionValue(0)

  const springX =
    useSpring(x, {
      stiffness: 60,
      damping: 25,
    })

  const springY =
    useSpring(y, {
      stiffness: 60,
      damping: 25,
    })

  useEffect(() => {

    const move = (
      e: MouseEvent
    ) => {

      x.set(
        e.clientX - 200
      )

      y.set(
        e.clientY - 200
      )
    }

    window.addEventListener(
      "mousemove",
      move
    )

    return () =>
      window.removeEventListener(
        "mousemove",
        move
      )

  }, [x, y])

  return (

    <motion.div
      style={{
        x: springX,
        y: springY,
      }}
      className="
        fixed
        top-0
        left-0
        w-[400px]
        h-[400px]
        rounded-full
        pointer-events-none
        z-0
      "
      aria-hidden
    >

      <div className="
        w-full
        h-full
        rounded-full
        bg-orange-600/[0.04]
        blur-[80px]
      " />

    </motion.div>
  )
}

// =========================================
// HOME
// =========================================

export default function Home() {

  const router =
    useRouter()

  const heroRef =
    useRef<HTMLDivElement>(
      null
    )

  const { scrollY } =
    useScroll()

  const heroOpacity =
    useTransform(
      scrollY,
      [0, 400],
      [1, 0]
    )

  const heroY =
    useTransform(
      scrollY,
      [0, 400],
      [0, -60]
    )

  // =====================================
  // VARIANTS
  // =====================================

  const containerVariants = {

    hidden: {
      opacity: 0,
    },

    visible: {

      opacity: 1,

      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  }

  const itemVariants = {

    hidden: {
      y: 40,
      opacity: 0,
    },

    visible: {

      y: 0,

      opacity: 1,

      transition: {

        type:
          "spring" as const,

        stiffness: 60,

        damping: 20,
      },
    },
  }

  return (

    <div className="
      relative
      min-h-screen
      bg-[#060709]
      overflow-x-hidden
      font-sans
      text-slate-200
    ">

      <CursorOrb />

      {/* MAIN CONTENT */}

      <motion.section
        ref={heroRef}
        style={{
          opacity:
            heroOpacity,
          y: heroY,
        }}
        className="
          relative
          z-10
          min-h-screen
          flex
          flex-col
          items-center
          justify-center
          pt-16
          px-4
        "
      >

        <motion.div
          initial="hidden"
          animate="visible"
          variants={
            containerVariants
          }
          className="
            max-w-5xl
            w-full
            mx-auto
            text-center
          "
        >

          {/* BADGE */}

          <motion.div
            variants={
              itemVariants
            }
            className="
              inline-flex
              items-center
              gap-3
              mb-12
            "
          >

            <div className="
              flex
              items-center
              gap-2
              px-4
              py-2
              rounded-full
              border
              border-orange-500/15
              bg-orange-500/5
              backdrop-blur-md
            ">

              <span className="
                relative
                flex
                h-1.5
                w-1.5
              ">

                <span className="
                  animate-ping
                  absolute
                  inline-flex
                  h-full
                  w-full
                  rounded-full
                  bg-orange-400
                  opacity-75
                " />

                <span className="
                  relative
                  inline-flex
                  rounded-full
                  h-1.5
                  w-1.5
                  bg-orange-500
                " />

              </span>

              <span className="
                text-[10px]
                uppercase
                tracking-[0.3em]
                text-orange-400/80
                font-semibold
              ">

                Platform V2.0 Live

              </span>

            </div>

          </motion.div>

          {/* TITLE */}

          <motion.h1
            variants={
              itemVariants
            }
            className="
              text-[clamp(3.5rem,10vw,8.5rem)]
              font-black
              leading-[0.9]
              tracking-tighter
              text-white
              mb-4
            "
          >

            Turn karma

          </motion.h1>

          <motion.h1
            variants={
              itemVariants
            }
            className="
              text-[clamp(3.5rem,10vw,8.5rem)]
              font-black
              leading-[0.9]
              tracking-tighter
              mb-10
            "
          >

            <span className="
              text-transparent
              bg-clip-text
              bg-gradient-to-r
              from-orange-400
              via-orange-500
              to-red-500
            ">

              into value.

            </span>

          </motion.h1>

          {/* DESCRIPTION */}

          <motion.p
            variants={
              itemVariants
            }
            className="
              text-slate-400
              text-lg
              md:text-xl
              font-light
              leading-relaxed
              max-w-xl
              mx-auto
              mb-16
              tracking-wide
            "
          >

            The premium tasking platform built for active Redditors.
            Complete bounties, curate content, earn rewards.

          </motion.p>

          {/* BUTTONS */}

          <motion.div
            variants={
              itemVariants
            }
            className="
              flex
              flex-col
              sm:flex-row
              items-center
              justify-center
              gap-4
            "
          >

            <MagneticButton
              onClick={() =>
                router.push(
                  "/dashboard/tasks"
                )
              }
              className="
                group
                relative
                w-full
                sm:w-auto
                px-10
                py-4
                rounded-full
                overflow-hidden
                cursor-pointer
              "
            >

              <div className="
                absolute
                inset-0
                bg-gradient-to-b
                from-orange-500
                to-red-600
                rounded-full
              " />

              <div className="
                relative
                flex
                items-center
                gap-2
                text-white
                font-semibold
                tracking-wide
                text-sm
              ">

                Start Earning Now

                <ArrowRight
                  size={16}
                />

              </div>

            </MagneticButton>

            <button
              onClick={() =>
                router.push(
                  "/auth"
                )
              }
              className="
                group
                relative
                w-full
                sm:w-auto
                px-10
                py-4
                rounded-full
                border
                border-white/[0.07]
                text-slate-400
                hover:text-slate-200
                text-sm
                font-medium
                tracking-wide
                transition-all
                duration-300
                backdrop-blur-md
              "
            >

              View Available Tasks

            </button>

          </motion.div>

          {/* SOCIAL */}

          <motion.div
            variants={
              itemVariants
            }
            className="
              mt-16
              flex
              items-center
              justify-center
              gap-2
              text-[11px]
              uppercase
              tracking-[0.2em]
              text-slate-600
            "
          >

            <span>
              Trusted by 26,000+ Redditors
            </span>

            <span className="
              w-1
              h-1
              rounded-full
              bg-slate-700
              inline-block
            " />

            <span>
              $2.4M paid out
            </span>

          </motion.div>

        </motion.div>

      </motion.section>

      {/* TICKER */}

      <div className="
        relative
        z-10
      ">

        <Ticker />

      </div>

    </div>
  )
}