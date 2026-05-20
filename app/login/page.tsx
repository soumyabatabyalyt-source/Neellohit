"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"

export default function Login() {

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  const router = useRouter()

  const handleLogin = async () => {

    if (!email || !password) {
      alert("Please enter both email and password")
      return
    }

    setLoading(true)

    try {
      const {
        data,
        error
      } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        alert(error.message || "Login failed. Please check your credentials.")
        setLoading(false)
        return
      }

      const user = data.user

      if (!user) {
        alert("Authentication failed. Please try again.")
        setLoading(false)
        return
      }

      // fetch profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, approved, suspended")
        .eq("id", user.id)
        .single()

      if (profileError || !profile) {
        console.error(profileError)
        alert("Failed to load profile data. Please try again.")
        setLoading(false)
        return
      }

      // Check if account is suspended
      if (profile.suspended) {
        alert("Your account has been suspended. Please contact support.")
        setLoading(false)
        return
      }

      // Check if account is approved
      if (!profile.approved) {
        router.push(`/pending-approval?email=${encodeURIComponent(email)}`)
        return
      }

      const role = profile?.role?.trim()?.toLowerCase()

      console.log("Login successful. Role:", role)

      // Smooth navigation instead of hard redirect
      if (role === "admin") {
        router.push("/admin")
      } else if (role === "manager") {
        router.push("/manager/tasks")
      } else {
        router.push("/dashboard/tasks")
      }
    } catch (err) {
      console.error("Login error:", err)
      alert("Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div style={page}>

      <div style={glowOne} />
      <div style={glowTwo} />

      <div style={card}>

        <div style={logo}>
          N
        </div>

        <h1 style={title}>
          Welcome Back
        </h1>

        <p style={subtitle}>
          Login to continue to Nillohit
        </p>

        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          style={input}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          style={input}
        />

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            ...button,
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading
            ? "Logging in..."
            : "Login"}
        </button>

        <p style={footer}>
          New here?{" "}
          <span
            style={link}
            onClick={() =>
              router.push("/auth")
            }
          >
            Create account
          </span>
        </p>

      </div>
    </div>
  )
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "linear-gradient(to bottom right, #050505, #0d0d0d)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  position: "relative",
  overflow: "hidden",
  padding: "20px",
}

const glowOne: React.CSSProperties = {
  position: "absolute",
  width: "400px",
  height: "400px",
  borderRadius: "999px",
  background: "rgba(255,0,80,0.18)",
  filter: "blur(120px)",
  top: "-100px",
  left: "-100px",
}

const glowTwo: React.CSSProperties = {
  position: "absolute",
  width: "400px",
  height: "400px",
  borderRadius: "999px",
  background: "rgba(120,0,255,0.12)",
  filter: "blur(120px)",
  bottom: "-100px",
  right: "-100px",
}

const card: React.CSSProperties = {
  width: "100%",
  maxWidth: "420px",
  padding: "40px",
  borderRadius: "28px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  boxShadow:
    "0 20px 60px rgba(0,0,0,0.45)",
  position: "relative",
  zIndex: 2,
}

const logo: React.CSSProperties = {
  width: "64px",
  height: "64px",
  borderRadius: "18px",
  background:
    "linear-gradient(135deg, #ff2d55, #ff4d6d)",
  color: "white",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "28px",
  fontWeight: 700,
  margin: "0 auto 24px auto",
}

const title: React.CSSProperties = {
  color: "white",
  textAlign: "center",
  fontSize: "38px",
  fontWeight: 700,
  marginBottom: "10px",
}

const subtitle: React.CSSProperties = {
  color: "#9ca3af",
  textAlign: "center",
  marginBottom: "32px",
  fontSize: "15px",
}

const input: React.CSSProperties = {
  width: "100%",
  padding: "16px",
  marginBottom: "16px",
  borderRadius: "16px",
  border: "1px solid rgba(255,255,255,0.08)",
  background: "rgba(255,255,255,0.03)",
  color: "white",
  fontSize: "15px",
  outline: "none",
  boxSizing: "border-box",
}

const button: React.CSSProperties = {
  width: "100%",
  padding: "16px",
  borderRadius: "16px",
  border: "none",
  background:
    "linear-gradient(135deg, #ff2d55, #ff4d6d)",
  color: "white",
  fontWeight: 700,
  fontSize: "16px",
  cursor: "pointer",
  marginTop: "8px",
}

const footer: React.CSSProperties = {
  marginTop: "24px",
  textAlign: "center",
  color: "#9ca3af",
  fontSize: "14px",
}

const link: React.CSSProperties = {
  color: "#ff4d6d",
  cursor: "pointer",
  fontWeight: 600,
}