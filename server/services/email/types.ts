export type EmailProviderType = 'resend' | 'nodemailer';

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
}

export interface SendEmailResult {
  id: string;
  recipient: string;
  subject: string;
  mode: 'live' | 'simulation';
  deliveredAt: string;
  provider: EmailProviderType;
  details?: Record<string, unknown>;
}

export interface EmailProviderStatus {
  isConfigured: boolean;
  provider: EmailProviderType;
  name: string;
  fromEmail: string;
  details?: string;
}

export interface EmailProvider {
  readonly type: EmailProviderType;
  readonly name: string;
  getStatus(): EmailProviderStatus;
  sendEmail(input: SendEmailInput): Promise<SendEmailResult>;
}
