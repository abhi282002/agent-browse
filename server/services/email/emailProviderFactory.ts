import { ResendEmailProvider } from './resendProvider';
import { NodemailerEmailProvider } from './nodemailerProvider';
import type {
  EmailProvider,
  EmailProviderStatus,
  EmailProviderType,
} from './types';

/**
 * Factory and Registry for Email Providers
 */
export class EmailProviderFactory {
  private static resendProvider: ResendEmailProvider = new ResendEmailProvider();
  private static nodemailerProvider: NodemailerEmailProvider = new NodemailerEmailProvider();

  /**
   * Resolve an EmailProvider instance by provider type
   */
  static getProvider(type?: EmailProviderType | string | null): EmailProvider {
    const normalized = (type || 'resend').trim().toLowerCase();

    if (normalized === 'nodemailer' || normalized === 'smtp') {
      return this.nodemailerProvider;
    }

    // Default to Resend
    return this.resendProvider;
  }

  /**
   * Get statuses of all registered providers
   */
  static getAllStatuses(): Record<EmailProviderType, EmailProviderStatus> {
    return {
      resend: this.resendProvider.getStatus(),
      nodemailer: this.nodemailerProvider.getStatus(),
    };
  }

  /**
   * List of supported providers with metadata
   */
  static getSupportedProviders() {
    return [
      {
        type: 'resend' as EmailProviderType,
        name: this.resendProvider.name,
        status: this.resendProvider.getStatus(),
      },
      {
        type: 'nodemailer' as EmailProviderType,
        name: this.nodemailerProvider.name,
        status: this.nodemailerProvider.getStatus(),
      },
    ];
  }
}
