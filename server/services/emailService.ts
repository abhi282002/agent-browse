import { Resend } from "resend";

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
}

export interface SendEmailResult {
  id: string;
  recipient: string;
  subject: string;
  mode: "live" | "simulation";
  deliveredAt: string;
}

export class EmailService {
  private static resendClient: Resend | null = null;

  static getClient(): Resend | null {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    if (!apiKey) return null;
    if (!this.resendClient) {
      this.resendClient = new Resend(apiKey);
    }
    return this.resendClient;
  }

  static getStatus() {
    const apiKey = process.env.RESEND_API_KEY?.trim();
    return {
      isConfigured: Boolean(apiKey && apiKey.startsWith("re_")),
      provider: "Resend Transactional Email Engine",
      fromEmail: process.env.RESEND_FROM_EMAIL?.trim() || "onboarding@resend.dev",
    };
  }

  static async sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
    const client = this.getClient();
    const recipient = Array.isArray(input.to) ? input.to.join(", ") : input.to;
    const fromAddress =
      input.from || process.env.RESEND_FROM_EMAIL?.trim() || "onboarding@resend.dev";
    const now = new Date().toISOString();

    if (client) {
      try {
        const { data, error } = await client.emails.send({
          from: fromAddress,
          to: input.to,
          subject: input.subject,
          html:
            input.html ||
            `<p>${input.text || "Automated alert from AgentBrowse workflow automation."}</p>`,
          text: input.text,
        });

        if (error) {
          throw new Error(`Resend error (${error.name}): ${error.message}`);
        }

        return {
          id: data?.id || `msg-${Date.now().toString(36)}`,
          recipient,
          subject: input.subject,
          mode: "live",
          deliveredAt: now,
        };
      } catch (err) {
        console.warn("[EmailService] Live Resend delivery failed, falling back to simulated delivery:", err);
      }
    }

    // Graceful simulation when RESEND_API_KEY is not configured
    return {
      id: `sim-email-${Date.now().toString(36)}`,
      recipient,
      subject: input.subject,
      mode: "simulation",
      deliveredAt: now,
    };
  }
}
