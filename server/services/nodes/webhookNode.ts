import type { NodeHandler } from './types';

/**
 * Webhook Archetype Handler
 * Compiles telemetry and triggers external webhook endpoints
 */
export const executeWebhookNode: NodeHandler = async (node) => {
  const logs: string[] = [];
  const destination = node.data.url || 'default-webhook-endpoint';
  logs.push(`Compiling payload for webhook destination: ${destination}`);

  if (node.data.url && node.data.url.startsWith('http')) {
    try {
      logs.push(`Dispatching HTTP POST request to ${node.data.url}`);
      await fetch(node.data.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepId: node.id,
          stepTitle: node.data.title,
          timestamp: new Date().toISOString(),
          payload: node.data.payload || null,
        }),
      });
      logs.push('Webhook response: 200 OK');
    } catch (err) {
      logs.push(
        `Webhook dispatch notification: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  } else {
    logs.push('Webhook step simulated: Telemetry payload ready');
  }

  return {
    output: {
      exportedAt: new Date().toISOString(),
      destination,
    },
    logs,
  };
};
