"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { Clock, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react"
import { useState, Suspense } from "react"

function PendingApprovalContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const email = searchParams.get("email") || "your account"
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div style={page}>
      {/* Gradient background */}
      <div style={glowOne} />
      <div style={glowTwo} />

      {/* Main container */}
      <div style={card}>
        {/* Icon */}
        <div style={iconContainer}>
          <Clock size={48} style={iconStyle} />
        </div>

        {/* Title */}
        <h1 style={title}>
          Account Pending Approval
        </h1>

        {/* Description */}
        <p style={description}>
          Welcome! Your account has been created successfully. A manager will review and approve your account shortly.
        </p>

        {/* Email display */}
        <div style={emailBox}>
          <p style={emailLabel}>Email:</p>
          <p style={emailValue}>{email}</p>
        </div>

        {/* Timeline */}
        <div style={timeline}>
          <div style={timelineItem}>
            <div style={timelineCheckmark}>
              <CheckCircle2 size={20} style={{ color: "#10b981" }} />
            </div>
            <p style={timelineText}>Account created</p>
          </div>

          <div style={timelineLine} />

          <div style={timelineItem}>
            <div style={timelineCheckmark}>
              <Clock size={20} style={{ color: "#f59e0b" }} />
            </div>
            <p style={timelineText}>Awaiting manager review</p>
          </div>

          <div style={timelineLine} />

          <div style={timelineItem}>
            <div style={timelineCheckmark}>
              <CheckCircle2 size={20} style={{ color: "#9ca3af" }} />
            </div>
            <p style={timelineText}>Account approved</p>
          </div>
        </div>

        {/* Info box */}
        <div style={infoBox}>
          <AlertCircle size={20} style={{ color: "#3b82f6" }} />
          <div>
            <p style={infoTitle}>What happens next?</p>
            <p style={infoText}>
              Our team will verify your Reddit account and Discord username. You'll be able to login once your account is approved.
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div style={buttonsContainer}>
          <button
            onClick={() => router.push("/login")}
            style={secondaryButton}
          >
            Back to Login
          </button>

          <button
            onClick={() => router.push("/")}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
              ...primaryButton,
              transform: isHovered ? "translateY(-2px)" : "translateY(0)",
              boxShadow: isHovered
                ? "0 20px 40px rgba(255, 77, 109, 0.3)"
                : "0 10px 20px rgba(255, 77, 109, 0.2)",
            }}
          >
            Go Home
            <ArrowRight size={18} style={{ marginLeft: "8px" }} />
          </button>
        </div>

        {/* Help text */}
        <p style={helpText}>
          Need help? Check your email for more information or contact support.
        </p>
      </div>
    </div>
  )
}

export default function PendingApproval() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PendingApprovalContent />
    </Suspense>
  )
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background: "linear-gradient(to bottom right, #050505, #0d0d0d)",
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
  background: "rgba(255, 100, 100, 0.15)",
  filter: "blur(120px)",
  top: "-100px",
  left: "-100px",
}

const glowTwo: React.CSSProperties = {
  position: "absolute",
  width: "400px",
  height: "400px",
  borderRadius: "999px",
  background: "rgba(100, 100, 255, 0.1)",
  filter: "blur(120px)",
  bottom: "-100px",
  right: "-100px",
}

const card: React.CSSProperties = {
  width: "100%",
  maxWidth: "480px",
  padding: "48px 40px",
  borderRadius: "28px",
  background: "rgba(255, 255, 255, 0.04)",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  boxShadow: "0 20px 60px rgba(0, 0, 0, 0.45)",
  position: "relative",
  zIndex: 2,
}

const iconContainer: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  marginBottom: "32px",
}

const iconStyle: React.CSSProperties = {
  color: "#f59e0b",
  animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
}

const title: React.CSSProperties = {
  color: "white",
  textAlign: "center",
  fontSize: "32px",
  fontWeight: 700,
  marginBottom: "16px",
}

const description: React.CSSProperties = {
  color: "#9ca3af",
  textAlign: "center",
  fontSize: "15px",
  lineHeight: "1.6",
  marginBottom: "32px",
}

const emailBox: React.CSSProperties = {
  background: "rgba(255, 255, 255, 0.02)",
  border: "1px solid rgba(255, 255, 255, 0.05)",
  borderRadius: "12px",
  padding: "16px",
  marginBottom: "32px",
}

const emailLabel: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "12px",
  fontWeight: 600,
  textTransform: "uppercase",
  marginBottom: "8px",
  margin: 0,
}

const emailValue: React.CSSProperties = {
  color: "#fff",
  fontSize: "14px",
  wordBreak: "break-all",
  margin: 0,
}

const timeline: React.CSSProperties = {
  marginBottom: "32px",
}

const timelineItem: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "16px",
  marginBottom: "16px",
}

const timelineCheckmark: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: "40px",
  width: "40px",
}

const timelineText: React.CSSProperties = {
  color: "#d1d5db",
  fontSize: "14px",
  margin: 0,
}

const timelineLine: React.CSSProperties = {
  height: "16px",
  borderLeft: "2px solid rgba(255, 255, 255, 0.1)",
  marginLeft: "19px",
}

const infoBox: React.CSSProperties = {
  display: "flex",
  gap: "12px",
  background: "rgba(59, 130, 246, 0.05)",
  border: "1px solid rgba(59, 130, 246, 0.2)",
  borderRadius: "12px",
  padding: "16px",
  marginBottom: "32px",
}

const infoTitle: React.CSSProperties = {
  color: "#93c5fd",
  fontSize: "13px",
  fontWeight: 600,
  marginBottom: "4px",
  margin: 0,
}

const infoText: React.CSSProperties = {
  color: "#9ca3af",
  fontSize: "13px",
  lineHeight: "1.5",
  margin: 0,
}

const buttonsContainer: React.CSSProperties = {
  display: "flex",
  gap: "12px",
  marginBottom: "24px",
}

const primaryButton: React.CSSProperties = {
  flex: 1,
  padding: "14px 24px",
  borderRadius: "12px",
  border: "none",
  background: "linear-gradient(135deg, #ff2d55, #ff4d6d)",
  color: "white",
  fontWeight: 600,
  fontSize: "14px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.3s ease",
}

const secondaryButton: React.CSSProperties = {
  flex: 1,
  padding: "14px 24px",
  borderRadius: "12px",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  background: "rgba(255, 255, 255, 0.02)",
  color: "#d1d5db",
  fontWeight: 600,
  fontSize: "14px",
  cursor: "poi