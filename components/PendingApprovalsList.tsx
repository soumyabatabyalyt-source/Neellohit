"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import { CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react"

interface PendingUser {
  id: string
  email: string
  username: string
  reddit: string
  discord: string
  created_at: string
  approved: boolean
  suspended: boolean
}

export default function PendingApprovalsList() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState<string | null>(null)
  const [rejecting, setRejecting] = useState<string | null>(null)

  useEffect(() => {
    fetchPendingUsers()
  }, [])

  const fetchPendingUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("approved", false)
        .eq("suspended", false)
        .order("created_at", { ascending: false })

      if (error) throw error
      setPendingUsers(data || [])
    } catch (err) {
      console.error("Failed to fetch pending users:", err)
    } finally {
      setLoading(false)
    }
  }

  const approveUser = async (userId: string) => {
    setApproving(userId)
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ approved: true })
        .eq("id", userId)

      if (error) throw error

      setPendingUsers(pendingUsers.filter(u => u.id !== userId))
      alert("User approved!")
    } catch (err) {
      console.error("Failed to approve user:", err)
      alert("Failed to approve user")
    } finally {
      setApproving(null)
    }
  }

  const rejectUser = async (userId: string) => {
    setRejecting(userId)
    try {
      // Delete the user's auth account using the service role
      const response = await fetch("/api/admin/delete-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) throw new Error("Failed to delete user")

      setPendingUsers(pendingUsers.filter(u => u.id !== userId))
      alert("User rejected and deleted!")
    } catch (err) {
      console.error("Failed to reject user:", err)
      alert("Failed to reject user")
    } finally {
      setRejecting(null)
    }
  }

  if (loading) {
    return (
      <div style={container}>
        <p style={{ color: "#9ca3af", textAlign: "center" }}>
          Loading pending approvals...
        </p>
      </div>
    )
  }

  if (pendingUsers.length === 0) {
    return (
      <div style={container}>
        <div style={emptyState}>
          <CheckCircle2 size={48} style={{ color: "#10b981" }} />
          <p style={emptyText}>No pending approvals</p>
        </div>
      </div>
    )
  }

  return (
    <div style={container}>
      <div style={header}>
        <h2 style={title}>Pending Approvals</h2>
        <span style={badge}>{pendingUsers.length}</span>
      </div>

      <div style={listContainer}>
        {pendingUsers.map((user) => (
          <div key={user.id} style={userCard}>
            <div style={userInfo}>
              <div style={userHeader}>
                <h3 style={username}>{user.username}</h3>
                <span style={timestamp}>
                  {new Date(user.created_at).toLocaleDateString()}
                </span>
              </div>

              <div style={infoGrid}>
                <div style={infoItem}>
                  <span style={label}>Email:</span>
                  <span style={value}>{user.email}</span>
                </div>
                <div style={infoItem}>
                  <span style={label}>Reddit:</span>
                  <span style={value}>{user.reddit}</span>
                </div>
                <div style={infoItem}>
                  <span style={label}>Discord:</span>
                  <span style={value}>{user.discord}</span>
                </div>
              </div>
            </div>

            <div style={actions}>
              <button
                onClick={() => approveUser(user.id)}
                disabled={approving === user.id}
                style={{
                  ...approveBtn,
                  opacity: approving === user.id ? 0.6 : 1,
                }}
              >
                <CheckCircle2 size={18} />
                {approving === user.id ? "Approving..." : "Approve"}
              </button>

              <button
                onClick={() => rejectUser(user.id)}
                disabled={rejecting === user.id}
                style={{
                  ...rejectBtn,
                  opacity: rejecting === user.id ? 0.6 : 1,
                }}
              >
                <XCircle size={18} />
                {rejecting === user.id ? "Rejecting..." : "Reject"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const container: React.CSSProperties = {
  width: "100%",
  maxWidth: "900px",
  margin: "0 auto",
}

const header: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "24px",
}

const title: React.CSSProperties = {
  color: "white",
  fontSize: "24px",
  fontWeight: 700,
  margin: 0,
}

const badge: React.CSSProperties = {
  background: "linear-gradient(135deg, #ff2d55, #ff4d6d)",
  color: "white",
  padding: "6px 12px",
  borderRadius: "20px",
  fontSize: "13px",
  fontWeight: 600,
}

const listContainer: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "16px",
}

const userCard: React.CSSProperties = {
  background: "rgba(255, 255, 255, 0.04)",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  borderRadius: "16px",
  padding: "20px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: "20px",
}

const userInfo: React.CSSProperties = {
  flex: 1,
}

const userHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "16px",
}

const username: React.CSSProperties = {
  color: "white",
  fontSize: "16px",
  fontWeight: 600,
  margin: 0,
}

const timestamp: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "13px",
}

const infoGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "12px",
}

const infoItem: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "4px",
}

const label: React.CSSProperties = {
  color: "#6b7280",
  fontSize: "12px",
  fontWeight: 600,
  textTransform: "uppercase",
}

const value: React.CSSProperties = {
  color: "#d1d5db",
  fontSize: "14px",
  wordBreak: "break-all",
}

const actions: React.CSSProperties = {
  display: "flex",
  gap: "12px",
  minWidth: "200px",
}

const approveBtn: React.CSSProperties = {
  flex: 1,
  padding: "10px 16px",
  borderRadius: "10px",
  border: "none",
  background: "linear-gradient(135deg, #10b981, #059669)",
  color: "white",
  fontWeight: 600,
  fontSize: "13px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  transition: "all 0.3s ease",
}

const rejectBtn: React.CSSProperties = {
  flex: 1,
  padding: "10px 16px",
  borderRadius: "10px",
  border: "none",
  background: "rgba(239, 68, 68, 0.1)",
  color: "#f87171",
  fontWeight: 600,
  fontSize: "13px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  transition: "all 0.3s ease",
}

const emptyState: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "60px 20px",
  textAlign: "center",
}

const emptyText: React.CSSProperties = {
  color: "#9ca3af",
  fontSize: "16px",
  marginTop: "16px",
}
