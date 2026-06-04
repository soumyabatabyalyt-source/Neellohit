import { NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  try {
    const { to, invoiceNo, invoiceHtml } = await req.json()

    if (!to || !invoiceHtml) {
      return NextResponse.json({ error: "Missing required fields: to, invoiceHtml" }, { status: 400 })
    }

    const { data, error } = await resend.emails.send({
      from: "Soumya Batabyal <invoices@neellohit.xyz>",
      to: [to],
      subject: `Invoice ${invoiceNo ?? ""} from Soumya Batabyal / neellohit.xyz`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <style>
              body { margin: 0; padding: 20px; background: #f0f2f5; font-family: 'Segoe UI', Arial, sans-serif; }
              .wrapper { max-width: 860px; margin: 0 auto; }
            </style>
          </head>
          <body>
            <div class="wrapper">
              ${invoiceHtml}
            </div>
          </body>
        </html>
      `,
    })

    if (error) {
      console.error("Resend error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: data?.id })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("send-invoice error:", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
