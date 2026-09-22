import type { NodeHandler } from './types';

/**
 * Webhook Archetype Handler
 * Compiles telemetry and triggers external webhook endpoints
 */
export const executeWebhookNode: NodeHandler = async (node) => {
  const logs: string[] = [];
  const destination = node.data.url || 'default-webhook-endpoint';
  logs.push(`Compiling payload for webhook destination: ${destination}`);

  if (!node.data.url || !node.data.url.startsWith('http')) {
    throw new Error('A valid HTTP/HTTPS destination URL is required for Webhook step.');
  }

  logs.push(`Dispatching HTTP POST request to ${node.data.url}`);
  const res = await fetch(node.data.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      stepId: node.id,
      stepTitle: node.data.title,
      timestamp: new Date().toISOString(),
      payload: node.data.payload || null,
    }),
  });

  if (!res.ok) {
    throw new Error(`Webhook dispatch failed with HTTP ${res.status} (${res.statusText})`);
  }

  logs.push(`Webhook response: ${res.status} ${res.statusText}`);

  return {
    output: {
      exportedAt: new Date().toISOString(),
      destination,
    },
    logs,
  };
};
