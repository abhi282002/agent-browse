import { executePollTick } from './executePollTick';
import type { PollBackgroundRunParams } from './types';

export async function pollBackgroundRun(params: PollBackgroundRunParams) {
  params.activeSessionIdRef.current = params.runId;
  let isFinished = false;
  let consecutiveErrors = 0;

  while (!isFinished && !params.isAbortedRef.current) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    if (params.isAbortedRef.current) break;

    try {
      isFinished = await executePollTick(params);
      consecutiveErrors = 0;
    } catch (pollError) {
      if (++consecutiveErrors > 10) {
        throw new Error('Lost connection to background execution status.');
      }
    }
  }
}
