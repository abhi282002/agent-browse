import { NodeArchetype } from '@/components/workflow/flow/types';

// Contextual role descriptions for prompt guidance
export const KNOWN_DESCRIPTIONS: Record<string, string> = {
  open_url:
    'Allocates a cloud Chromium sandbox and navigates to target starting URL',
  action:
    'Interacts with DOM elements via simulated clicks, hover, typing, or keypresses',
  extraction:
    'Extracts structured data, text, links, or tables from the DOM into JSON telemetry',
  summarization:
    'Synthesizes extracted webpage data using LLM reasoning under organization directives',
  email:
    'Dispatches an executive HTML report or alert email via Resend or Nodemailer',
  webhook:
    'Dispatches structured JSON telemetry payload to an external HTTP webhook endpoint',
  news_gather:
    'Discovers and gathers trending articles or stories matching query keywords',
  news_summary:
    'Categorizes and summarizes collected news articles into structured briefings',
  form: 'Identifies and fills form fields, dropdowns, and form submissions',
  fill_form:
    'Fills text fields, dropdowns, checkboxes, and other form controls before submitting the form',
  grounding:
    'Locates and verifies visual DOM elements and bounding box coordinates',
  navigation:
    'Performs in-page navigation, link following, or pagination clicks',
  authentication:
    'Handles login credentials, 2FA prompt, and session cookie persistence',
};

// Robust archetype normalizer that ensures the node always maps to a valid system archetype
export const resolveArchetype =
  (validArchetypeSet: Set<string>) =>
  (rawArchetype?: string): NodeArchetype => {
    if (!rawArchetype) return 'action';
    const cleaned = rawArchetype.toLowerCase().trim();
    if (validArchetypeSet.has(cleaned)) {
      return cleaned as NodeArchetype;
    }
    // Common LLM alias mapping
    if (
      cleaned.includes('url') ||
      cleaned.includes('navigate') ||
      cleaned.includes('goto')
    )
      return 'open_url';
    if (
      cleaned.includes('extract') ||
      cleaned.includes('scrape') ||
      cleaned.includes('parse')
    )
      return 'extraction';
    if (
      cleaned.includes('summar') ||
      cleaned.includes('llm') ||
      cleaned.includes('gpt') ||
      cleaned.includes('ai')
    )
      return 'summarization';
    if (cleaned.includes('mail')) return 'email';
    if (cleaned.includes('hook')) return 'webhook';
    if (cleaned.includes('auth') || cleaned.includes('login'))
      return 'authentication';
    if (cleaned.includes('form') || cleaned.includes('input')) return 'form';
    if (cleaned.includes('news_sum')) return 'news_summary';
    if (cleaned.includes('news')) return 'news_gather';
    return 'action';
  };
