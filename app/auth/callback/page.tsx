"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"

export default function Callback() {
  const router = useRouter()

  useEffect(() => {
    const handle = async () => {
      const { data, error } = await supabase.auth.getSession()

      console.log("SESSION:", data)

      if (error) {
        console.error(error)
        return
      }

      if (data.session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.session.user.id)
          .single()

        if (profile?.role === "admin") {
          router.push("/admin")
        } else if (profile?.role === "manager") {
          router.push("/manager/tasks")
        } else {
          router.push("/dashboard/tasks")
        }
      } else {
        router.push("/auth")
      }
    }

    handle()
  }, [])

  return <p>Loading...</p>
}