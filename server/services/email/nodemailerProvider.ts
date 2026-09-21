import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { BaseEmailProvider } from './baseProvider';
import type {
  EmailProviderStatus,
  EmailProviderType,
  SendEmailInput,
  SendEmailResult,
} from './types';

/**
 * Nodemailer Email Provider
 * Standard SMTP transport supporting local mail servers, Postmark, AWS SES, SendGrid, Gmail, etc.
 */
export class NodemailerEmailProvider extends BaseEmailProvider {
  readonly type: EmailProviderType = 'nodemailer';
  readonly name = 'Nodemailer SMTP Mail Engine';

  private transporter: Transporter | null = null;

  private getSmtpConfig() {
    const host =
      process.env.SMTP_HOST?.trim() ||
      process.env.NODEMAILER_HOST?.trim() ||
      process.env.EMAIL_SERVER_HOST?.trim();

    const portRaw =
      process.env.SMTP_PORT?.trim() ||
      process.env.NODEMAILER_PORT?.trim() ||
      process.env.EMAIL_SERVER_PORT?.trim();
    const port = portRaw ? parseInt(portRaw, 10) : 587;

    const secure =
      process.env.SMTP_SECURE?.trim() === 'true' || port === 465;

    const user =
      process.env.SMTP_USER?.trim() ||
      process.env.NODEMAILER_USER?.trim() ||
      process.env.EMAIL_SERVER_USER?.trim();

    const pass =
      process.env.SMTP_PASS?.trim() ||
      process.env.NODEMAILER_PASS?.trim() ||
      process.env.EMAIL_SERVER_PASSWORD?.trim();

    const defaultFrom =
      process.env.SMTP_FROM_EMAIL?.trim() ||
      process.env.NODEMAILER_FROM?.trim() ||
      process.env.EMAIL_FROM?.trim() ||
      'alerts@agentbrowse.com';

    return {
      host,
      port,
      secure,
      auth: user ? { user, pass: pass || '' } : undefined,
      defaultFrom,
      isConfigured: Boolean(host),
    };
  }

  getTransporter(): Transporter | null {
    const config = this.getSmtpConfig();
    if (!config.isConfigured || !config.host) {
      return null;
    }

    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: config.auth,
        tls: {
          rejectUnauthorized: process.env.NODE_ENV === 'production',
        },
      });
    }

    return this.transporter;
  }

  getStatus(): EmailProviderStatus {
    const config = this.getSmtpConfig();

    return {
      isConfigured: config.isConfigured,
      provider: this.type,
      name: this.name,
      fromEmail: config.defaultFrom,
      details: config.isConfigured
        ? `SMTP configured for ${config.host}:${config.port} (secure=${config.secure})`
        : 'SMTP credentials (SMTP_HOST) not configured; running in safe simulation mode',
    };
  }

  async sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
    const config = this.getSmtpConfig();
    const recipient = this.formatRecipient(input.to);
    const fromAddress = this.resolveFromAddress(
      input.from,
      config.defaultFrom,
      'alerts@agentbrowse.com',
    );

    const transporter = this.getTransporter();

    if (transporter && config.isConfigured) {
      try {
        const info = await transporter.sendMail({
          from: fromAddress,
          to: input.to,
          subject: input.subject,
          html:
            input.html ||
            `<p>${input.text || 'Automated alert from AgentBrowse workflow automation.'}</p>`,
          text: input.text,
          cc: input.cc,
          bcc: input.bcc,
          replyTo: input.replyTo,
        });

        return {
          id: info.messageId || `smtp-${Date.now().toString(36)}`,
          recipient,
          subject: input.subject,
          mode: 'live',
          deliveredAt: this.getTimestamp(),
          provider: this.type,
          details: {
            messageId: info.messageId,
            response: info.response,
            accepted: info.accepted,
          },
        };
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.warn(
          '[NodemailerEmailProvider] SMTP delivery failed, falling back to simulated delivery:',
          errorMsg,
        );
        return this.createSimulatedResult(input, `SMTP error: ${errorMsg}`);
      }
    }

    // Graceful simulation when SMTP host is not configured
    return this.createSimulatedResult(
      input,
      'SMTP credentials (SMTP_HOST) not configured in environment',
    );
  }
}
