import type {
  EmailProvider,
  EmailProviderStatus,
  EmailProviderType,
  SendEmailInput,
  SendEmailResult,
} from './types';

/**
 * Abstract Base Email Provider
 * Contains shared helpers for recipient normalization, simulated execution, and fallback formatting.
 */
export abstract class BaseEmailProvider implements EmailProvider {
  abstract readonly type: EmailProviderType;
  abstract readonly name: string;

  abstract getStatus(): EmailProviderStatus;
  abstract sendEmail(input: SendEmailInput): Promise<SendEmailResult>;

  /**
   * Format recipient list into a display string
   */
  protected formatRecipient(to: string | string[]): string {
    return Array.isArray(to) ? to.join(', ') : to;
  }

  /**
   * Standard ISO timestamp string
   */
  protected getTimestamp(): string {
    return new Date().toISOString();
  }

  /**
   * Generates a simulated send result when credentials are unconfigured or live dispatch fails
   */
  protected createSimulatedResult(
    input: SendEmailInput,
    reason?: string,
  ): SendEmailResult {
    return {
      id: `sim-${this.type}-${Date.now().toString(36)}`,
      recipient: this.formatRecipient(input.to),
      subject: input.subject,
      mode: 'simulation',
      deliveredAt: this.getTimestamp(),
      provider: this.type,
      details: reason ? { reason } : undefined,
    };
  }

  /**
   * Resolves sender address in order of priority: explicit > env > default
   */
  protected resolveFromAddress(
    explicitFrom?: string,
    defaultEnvAddress?: string,
    fallback = 'alerts@agentbrowse.com',
  ): string {
    return explicitFrom?.trim() || defaultEnvAddress?.trim() || fallback;
  }
}
