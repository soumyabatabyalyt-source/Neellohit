"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

export default function Auth() {

  const router = useRouter()

  const [email, setEmail] =
    useState("")

  const [password, setPassword] =
    useState("")

  const [username, setUsername] =
    useState("")

  const [reddit, setReddit] =
    useState("")

  const [discord, setDiscord] =
    useState("")

  const [loading, setLoading] =
    useState(false)

  const [isSignup, setIsSignup] =
    useState(false)

  const wait = (ms: number) =>
    new Promise((resolve) =>
      setTimeout(resolve, ms)
    )

  const handleAuth = async () => {

    // =========================================
    // BASIC VALIDATION
    // =========================================

    if (!email || !password) {

      alert(
        "Enter email and password"
      )

      return
    }

    // =========================================
    // SIGNUP VALIDATION
    // =========================================

    if (isSignup) {

      if (
        !username ||
        !reddit ||
        !discord
      ) {

        alert(
          "Fill all signup fields"
        )

        return
      }

      if (
        !reddit.includes(
          "reddit.com"
        )
      ) {

        alert(
          "Enter valid Reddit URL"
        )

        return
      }
    }

    setLoading(true)

    try {

      // =========================================
      // SIGNUP
      // =========================================

      if (isSignup) {

        // =========================================
        // CALL SERVER SIGNUP API
        // =========================================
        //
        // The browser is anon-key only, and
        // `public.profiles` has RLS enabled with
        // NO insert policy and a tightly-scoped
        // select policy. Trying to create the
        // profile (or pre-check duplicates) from
        // the client silently fails or leaves an
        // orphan auth user behind. The signup
        // happens server-side via the service
        // role key in /api/signup, which also
        // rolls the auth user back if the
        // profile insert errors out.

        const signupRes =
          await fetch("/api/signup", {

            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              email,
              password,
              username,
              reddit,
              discord,
            }),
          })

        const signupJson =
          await signupRes
            .json()
            .catch(() => ({}))

        if (
          !signupRes.ok ||
          !signupJson.success
        ) {

          console.error(
            "SIGNUP FAILED:",
            signupJson
          )

          alert(
            signupJson?.error ||
            "Signup failed"
          )

          setLoading(false)

          return
        }

        // =========================================
        // REDIRECT TO PENDING APPROVAL
        // =========================================

        window.location.href = `/pending-approval?email=${encodeURIComponent(email)}`
        return
      }

      // =========================================
      // LOGIN
      // =========================================

      const {
        error: loginError,
      } = await supabase.auth.signInWithPassword({

        email,
        password,
      })

      if (loginError) {

        alert(
          loginError.message
        )

        setLoading(false)

        return
      }

      // =========================================
      // WAIT FOR SESSION
      // =========================================

      await wait(1200)

      const {
        data: {
          session,
        },
      } = await supabase.auth.getSession()

      const user =
        session?.user

      if (!user) {

        alert(
          "Session fetch failed"
        )

        setLoading(false)

        return
      }

      // =========================================
      // FETCH PROFILE
      // =========================================

      let profile = null
      let profileError = null

      for (
        let i = 0;
        i < 5;
        i++
      ) {

        const response =
          await supabase
            .from("profiles")
            .select(`
              approved,
              suspended,
              role
            `)
            .eq(
              "id",
              user.id
            )
            .maybeSingle()

        profile =
          response.data

        profileError =
          response.error

        if (profile) {
          break
        }

        await wait(800)
      }

      // =========================================
      // PROFILE FAILED
      // =========================================

      if (
        profileError ||
        !profile
      ) {

        console.error(
          profileError
        )

        alert(
          profileError?.message ||
          "Profile fetch failed"
        )

        setLoading(false)

        return
      }

      // =========================================
      // SUSPENDED
      // =========================================

      if (
        profile.suspended === true
      ) {

        alert(
          "Your account has been suspended. Please contact support."
        )

        setLoading(false)

        return
      }

      // =========================================
      // NOT APPROVED
      // =========================================

      if (
        profile.approved === false
      ) {

        window.location.href = `/pending-approval?email=${encodeURIComponent(email)}`
        return
      }

      // =========================================
      // ROLE REDIRECT
      // =========================================

      if (
        profile.role === "admin"
      ) {

        router.replace("/admin")

      } else if (
        profile.role === "manager"
      ) {

        router.replace(
          "/manager/tasks"
        )

      } else {

        router.replace(
          "/dashboard/tasks"
        )
      }

    } catch (err) {

      console.error(err)

      alert(
        "Something went wrong"
      )
    }

    setLoading(false)
  }

  return (

    <div className="
      min-h-screen
      bg-[#05070A]
      flex
      items-center
      justify-center
      px-4
      relative
      overflow-hidden
    ">

      {/* GLOW */}
      <div className="
        absolute
        w-[700px]
        h-[700px]
        bg-red-500/10
        rounded-full
        blur-[140px]
        top-[-20%]
        left-[-10%]
      " />

      {/* CARD */}
      <motion.div

        initial={{
          opacity: 0,
          y: 20,
        }}

        animate={{
          opacity: 1,
          y: 0,
        }}

        className="
          relative
          z-10
          w-full
          max-w-md
          bg-white/[0.04]
          border
          border-white/10
          backdrop-blur-2xl
          rounded-3xl
          p-8
          shadow-2xl
        "
      >

        <h1 className="
          text-3xl
          font-bold
          text-white
          mb-8
          text-center
        ">

          {isSignup
            ? "Create Account"
            : "Welcome Back"}

        </h1>

        {/* USERNAME */}
        {isSignup && (
          <input
            placeholder="Username"
            value={username}
            onChange={(e) =>
              setUsername(
                e.target.value
              )
            }
            className={input}
          />
        )}

        {/* EMAIL */}
        <input
          placeholder="Email Address"
          value={email}
          onChange={(e) =>
            setEmail(
              e.target.value
            )
          }
          className={input}
        />

        {/* PASSWORD */}
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(
              e.target.value
            )
          }
          className={input}
        />

        {/* REDDIT */}
        {isSignup && (
          <input
            placeholder="Reddit Profile URL"
            value={reddit}
            onChange={(e) =>
              setReddit(
                e.target.value
              )
            }
            className={input}
          />
        )}

        {/* DISCORD */}
        {isSignup && (
          <input
            placeholder="Discord Username"
            value={discord}
            onChange={(e) =>
              setDiscord(
                e.target.value
              )
            }
            className={input}
          />
        )}

        {/* BUTTON */}
        <button
          onClick={handleAuth}
          disabled={loading}
          className="
            w-full
            py-3
            rounded-xl
            bg-red-500
            hover:bg-red-600
            transition-all
            text-white
            font-semibold
            mt-2
            disabled:opacity-50
          "
        >

          {loading
            ? "Processing..."
            : isSignup
            ? "Create Account"
            : "Login"}

        </button>

        {/* TOGGLE */}
        <p className="
          text-center
          text-slate-400
          mt-6
          text-sm
        ">

          {isSignup
            ? "Already have an account?"
            : "New here?"}

          <span
            onClick={() =>
              setIsSignup(
                !isSignup
              )
            }
            className="
              text-red-400
              ml-2
              cursor-pointer
              hover:text-red-300
            "
          >

            {isSignup
              ? "Login"
              : "Sign Up"}

          </span>

        </p>

      </motion.div>

    </div>
  )
}

const input = `
  w-full
  bg-black/30
  border
  border-white/10
  rounded-xl
  px-4
  py-3
  text-white
  placeholder:text-slate-500
  outline-none
  mb-4
  focus:border-red-400/40
  transition-all
`
