import { Resend } from 'resend';
import { BaseEmailProvider } from './baseProvider';
import type {
  EmailProviderStatus,
  EmailProviderType,
  SendEmailInput,
  SendEmailResult,
} from './types';

/**
 * Resend Email Provider
 * Cloud transactional email via the official Resend API SDK.
 */
export class ResendEmailProvider extends BaseEmailProvider {
  readonly type: EmailProviderType = 'resend';
  readonly name = 'Resend Transactional Email API';

  private resendClient: Resend | null = null;

  getClient(): Resend | null {
    const apiKey =
      process.env.RESEND_API_KEY?.trim() || process.env.RESENT_API_KEY?.trim();
    if (!apiKey) return null;
    if (!this.resendClient) {
      this.resendClient = new Resend(apiKey);
    }
    return this.resendClient;
  }

  getStatus(): EmailProviderStatus {
    const apiKey =
      process.env.RESEND_API_KEY?.trim() || process.env.RESENT_API_KEY?.trim();
    const isConfigured = Boolean(apiKey && apiKey.startsWith('re_'));
    const fromEmail = this.resolveFromAddress(
      undefined,
      process.env.RESEND_FROM_EMAIL,
      'onboarding@resend.dev',
    );

    return {
      isConfigured,
      provider: this.type,
      name: this.name,
      fromEmail,
      details: isConfigured
        ? 'Resend API key configured and ready'
        : 'RESEND_API_KEY is not configured; running in safe simulation mode',
    };
  }

  async sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
    const client = this.getClient();
    const recipient = this.formatRecipient(input.to);
    const fromAddress = this.resolveFromAddress(
      input.from,
      process.env.RESEND_FROM_EMAIL,
      'onboarding@resend.dev',
    );

    if (client) {
      try {
        const { data, error } = await client.emails.send({
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

        if (error) {
          throw new Error(`Resend error (${error.name}): ${error.message}`);
        }

        return {
          id: data?.id || `resend-${Date.now().toString(36)}`,
          recipient,
          subject: input.subject,
          mode: 'live',
          deliveredAt: this.getTimestamp(),
          provider: this.type,
          details: { id: data?.id },
        };
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.warn(
          '[ResendEmailProvider] Live Resend delivery failed, falling back to simulated delivery:',
          errorMsg,
        );
        return this.createSimulatedResult(input, `Live delivery error: ${errorMsg}`);
      }
    }

    // Graceful simulation when RESEND_API_KEY is not configured
    return this.createSimulatedResult(
      input,
      'RESEND_API_KEY is not configured in environment',
    );
  }
}
