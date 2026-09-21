import type { Resend } from 'resend';
import {
  EmailProviderFactory,
  type EmailProvider,
  type EmailProviderStatus,
  type EmailProviderType,
  type SendEmailInput,
  type SendEmailResult,
  type ResendEmailProvider,
} from './email';

export type {
  EmailProvider,
  EmailProviderStatus,
  EmailProviderType,
  SendEmailInput,
  SendEmailResult,
};

/**
 * Facade Email Service
 * Dispatches emails through the configured or selected provider (Resend or Nodemailer)
 */
export class EmailService {
  /**
   * Access underlying Resend client for backward compatibility
   */
  static getClient(): Resend | null {
    const resendProvider = EmailProviderFactory.getProvider(
      'resend',
    ) as ResendEmailProvider;
    return resendProvider.getClient();
  }

  /**
   * Get provider status for health check and dashboard integration status
   */
  static getStatus(providerType?: EmailProviderType | string) {
    const provider = EmailProviderFactory.getProvider(providerType);
    const status = provider.getStatus();
    const allStatuses = EmailProviderFactory.getAllStatuses();

    return {
      isConfigured: status.isConfigured,
      provider: status.name,
      fromEmail: status.fromEmail,
      activeProvider: status.provider,
      providers: allStatuses,
    };
  }

  /**
   * Send email using the specified provider ('resend' | 'nodemailer') or default provider
   */
  static async sendEmail(
    input: SendEmailInput,
    providerType?: EmailProviderType | string,
  ): Promise<SendEmailResult> {
    const provider = EmailProviderFactory.getProvider(providerType);
    return provider.sendEmail(input);
  }
}
