import { tasks, runs } from '@trigger.dev/sdk';
import { BrowserbaseService } from './browserbaseService';
import type {
  executeWorkflowPipelineTask,
  TriggerWorkflowPayload,
} from '@/trigger/workflowExecution';

export class TriggerDevService {
  static getStatus() {
    const secretKey = process.env.TRIGGER_SECRET_KEY?.trim();
    const projectId = process.env.TRIGGER_PROJECT_ID?.trim();

    return {
      isConfigured: Boolean(secretKey && secretKey.startsWith('tr_')),
      secretKeyPresent: Boolean(secretKey),
      projectId: projectId || 'agentbrowse-automation',
      provider: 'Trigger.dev v3 Background Task Engine',
    };
  }

  static async triggerWorkflow(payload: TriggerWorkflowPayload) {
    const status = this.getStatus();

    if (status.isConfigured) {
      try {
        const handle = await tasks.trigger<typeof executeWorkflowPipelineTask>(
          'execute-workflow-pipeline',
          payload,
        );
        return {
          runId: handle.id,
          status: 'queued' as const,
          mode: 'trigger.dev' as const,
          isBackground: true,
          message: 'Durable workflow pipeline queued on Trigger.dev v3.',
        };
      } catch (err) {
        console.warn(
          '[TriggerDevService] Failed to queue on Trigger.dev, falling back to direct run:',
          err,
        );
      }
    }

    const result = await BrowserbaseService.executeWorkflow(payload);

    console.log('[TriggerDevService] Direct execution result:', result);

    return {
      runId: `local-${Date.now().toString(36)}`,
      status: result.status,
      mode: 'direct' as const,
      isBackground: false,
      result,
      message: 'Executed directly via Browserbase & Stagehand.',
    };
  }

  static async getRunStatus(runId: string) {
    if (runId.startsWith('local-') || runId.startsWith('sim-')) {
      return {
        id: runId,
        status: 'COMPLETED',
        output: null,
      };
    }

    try {
      const run = await runs.retrieve(runId);
      return {
        id: run.id,
        status: run.status,
        output: run.output,
        error: run.error,
        startedAt: run.startedAt,
        finishedAt: run.finishedAt,
      };
    } catch (err) {
      return {
        id: runId,
        status: 'UNKNOWN',
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}
