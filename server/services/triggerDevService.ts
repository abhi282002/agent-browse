import { tasks, runs, schedules } from '@trigger.dev/sdk';
import { BrowserbaseService } from './browserbaseService';
import type { executeWorkflowPipelineTask } from '@/trigger/workflowExecution';
import type { TriggerWorkflowPayload } from '@/trigger/workflowTypes';

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
    } else {
      //throw the error
      throw new Error('Trigger.dev is not configured');
    }
  }

  static async getRunStatus(runId: string) {
    if (runId.startsWith('local-') || runId.startsWith('sim-')) {
      return {
        id: runId,
        status: 'COMPLETED',
        output: null,
        metadata: null,
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
        metadata: run.metadata || null,
      };
    } catch (err) {
      return {
        id: runId,
        status: 'UNKNOWN' as const,
        output: null,
        metadata: null,
        startedAt: undefined,
        finishedAt: undefined,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  /**
   * Create or update a dynamic schedule for a workflow
   */

  /**
   * Some IANA timezone aliases are rejected by Trigger.dev's API.
   * Map them to the canonical names Trigger.dev accepts.
   */
  private static normalizeTriggerTimezone(tz: string): string {
    const aliases: Record<string, string> = {
      'Asia/Kolkata': 'Asia/Calcutta',
      'Asia/Kathmandu': 'Asia/Katmandu',
      'America/Indiana/Indianapolis': 'America/Indianapolis',
      'Pacific/Honolulu': 'US/Hawaii',
    };
    return aliases[tz] ?? tz;
  }

  static async createWorkflowSchedule(params: {
    workflowId: string;
    cron?: string;
    timezone?: string;
  }) {
    const status = this.getStatus();
    const cron = params.cron || '0 9 * * *';
    const timezone = TriggerDevService.normalizeTriggerTimezone(
      params.timezone || 'Asia/Calcutta',
    );
    const deduplicationKey = `wf-sched-${params.workflowId}`;

    if (!status.isConfigured) {
      return {
        id: `sim-sched-${params.workflowId}`,
        workflowId: params.workflowId,
        cron,
        timezone,
        active: true,
        isSimulated: true,
        nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        message: 'Trigger.dev simulated schedule registered.',
      };
    }

    try {
      const schedule = await schedules.create({
        task: 'execute-scheduled-workflow',
        cron,
        timezone,
        externalId: params.workflowId,
        deduplicationKey,
      });

      return {
        id: schedule.id,
        workflowId: params.workflowId,
        cron: schedule.generator.expression,
        timezone: schedule.timezone,
        active: schedule.active,
        nextRun: schedule.nextRun ? schedule.nextRun.toISOString() : null,
        isSimulated: false,
        message: `Workflow scheduled successfully to run at ${cron} (${timezone}).`,
      };
    } catch (err) {
      console.error('[TriggerDevService] Failed to create schedule:', err);
      throw new Error(
        `Failed to create Trigger.dev schedule: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  /**
   * Retrieve active schedule details for a specific workflow
   */
  static async getWorkflowSchedule(workflowId: string) {
    const status = this.getStatus();
    if (!status.isConfigured) {
      return null;
    }

    try {
      const scheduleList = await schedules.list({ perPage: 100 });
      const found = scheduleList.data.find(
        (s) =>
          s.externalId === workflowId ||
          s.deduplicationKey === `wf-sched-${workflowId}`,
      );

      if (!found) return null;

      return {
        id: found.id,
        workflowId,
        cron: found.generator.expression,
        timezone: found.timezone,
        active: found.active,
        nextRun: found.nextRun ? found.nextRun.toISOString() : null,
      };
    } catch (err) {
      console.warn('[TriggerDevService] Failed to get schedule:', err);
      return null;
    }
  }

  /**
   * Delete schedule for a workflow
   */
  static async deleteWorkflowSchedule(workflowId: string) {
    const status = this.getStatus();
    if (!status.isConfigured) {
      return { success: true, message: 'Simulated schedule deleted' };
    }

    try {
      const existing = await this.getWorkflowSchedule(workflowId);
      if (existing) {
        await schedules.del(existing.id);
        return {
          success: true,
          scheduleId: existing.id,
          message: 'Schedule deleted from Trigger.dev.',
        };
      }
      return { success: true, message: 'No active schedule found to delete.' };
    } catch (err) {
      console.error('[TriggerDevService] Failed to delete schedule:', err);
      throw new Error(
        `Failed to delete schedule: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  /**
   * Toggle active state (pause/resume) of a workflow schedule
   */
  static async toggleWorkflowSchedule(workflowId: string, active: boolean) {
    const status = this.getStatus();
    if (!status.isConfigured) {
      return { workflowId, active, isSimulated: true };
    }

    const existing = await this.getWorkflowSchedule(workflowId);
    if (!existing) {
      throw new Error(`No active schedule found for workflow: ${workflowId}`);
    }

    if (active) {
      await schedules.activate(existing.id);
    } else {
      await schedules.deactivate(existing.id);
    }

    return {
      scheduleId: existing.id,
      workflowId,
      active,
    };
  }
}
