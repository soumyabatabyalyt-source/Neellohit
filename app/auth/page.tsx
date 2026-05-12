"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

export default function Auth() {

  const [email, setEmail] =
    useState("")

  const [password, setPassword] =
    useState("")

  const [reddit, setReddit] =
    useState("")

  const [username, setUsername] =
    useState("")

  const [discord, setDiscord] =
    useState("")

  const [loading, setLoading] =
    useState(false)

  const [isSignup, setIsSignup] =
    useState(false)

  const router = useRouter()

  const handleAuth = async () => {

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

    // =========================================
    // 🔥 SIGNUP
    // =========================================

    if (isSignup) {

      try {

        // =========================================
        // CHECK DUPLICATE USERNAME
        // =========================================

        const {
          data: existingUsername,
        } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", username)
          .maybeSingle()

        if (existingUsername) {

          alert(
            "Username already taken"
          )

          setLoading(false)

          return
        }

        // =========================================
        // CHECK DUPLICATE REDDIT
        // =========================================

        const {
          data: existingReddit,
        } = await supabase
          .from("profiles")
          .select("id")
          .eq("reddit", reddit)
          .maybeSingle()

        if (existingReddit) {

          alert(
            "Reddit already used"
          )

          setLoading(false)

          return
        }

        // =========================================
        // CREATE AUTH USER
        // =========================================

        const {
          data,
          error,
        } = await supabase.auth.signUp({

          email,

          password,

          options: {

            emailRedirectTo:
              window.location.origin +
              "/auth",
          },
        })

        if (error) {

          alert(error.message)

          setLoading(false)

          return
        }

        // =========================================
        // CREATE PROFILE
        // =========================================

        if (data.user) {

          const {
            error: profileError,
          } = await supabase
            .from("profiles")
            .insert({

              id: data.user.id,

              email,

              username,

              reddit,

              discord,

              role: "user",

              approved: false,

              suspended: false,
            })

          if (profileError) {

            console.error(
              profileError
            )

            alert(
              "Profile creation failed"
            )

            setLoading(false)

            return
          }
        }

        alert(
          "Verification email sent ✅ Verify your email before login."
        )

        // RESET FORM
        setUsername("")
        setDiscord("")
        setReddit("")
        setEmail("")
        setPassword("")

        setIsSignup(false)

      } catch (err) {

        console.error(err)

        alert(
          "Something went wrong"
        )
      }
    }

    // =========================================
    // 🔐 LOGIN
    // =========================================

    else {

      const { error } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        })

      if (error) {

        alert(error.message)

        setLoading(false)

        return
      }

      // =========================================
      // CHECK PROFILE
      // =========================================

      const {
        data: userData,
      } = await supabase.auth.getUser()

      const user =
        userData.user

      if (!user) {

        alert(
          "User fetch failed"
        )

        setLoading(false)

        return
      }

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select(
          "approved, suspended, role"
        )
        .eq("id", user.id)
        .single()

      if (
        profileError ||
        !profile
      ) {

        alert(
          "Profile fetch failed"
        )

        await supabase.auth.signOut()

        setLoading(false)

        return
      }

      // =========================================
      // SUSPENDED
      // =========================================

      if (
        profile.suspended
      ) {

        await supabase.auth.signOut()

        alert(
          "Account suspended"
        )

        setLoading(false)

        return
      }

      // =========================================
      // NOT APPROVED
      // =========================================

      if (
        !profile.approved
      ) {

        await supabase.auth.signOut()

        alert(
          "Await manager approval"
        )

        setLoading(false)

        return
      }

      // =========================================
      // SUCCESS LOGIN
      // =========================================

      alert(
        "Login successful ✅"
      )

      // ROLE REDIRECT
      if (profile.role === "admin") {
        router.push("/admin")
      } else if (profile.role === "manager") {
        router.push("/manager/tasks")
      } else {
        router.push("/dashboard/tasks")
      }
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
              setIsSignup(!isSignup)
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