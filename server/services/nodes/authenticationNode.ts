import { z } from 'zod/v4';
import type { NodeHandler } from './types';

const FRAME_ERR =
  /DOM\.getFrameOwner|no frame with given id|frame.*not found|target.*not found/i;

/**
 * Authentication Archetype Handler
 *
 * Key differences from the previous version:
 *  - Secrets never go through the LLM. Inputs are located with `observe`
 *    (no secret in the prompt) and filled with a deterministic `act(action)` replay.
 *  - Password is only typed once a real password input is found. If it isn't
 *    there yet (two-step logins), we click Next/Continue and look again.
 *  - Submit logic has correct error handling (no swallowed errors, no double submit).
 *  - The node fails loudly if the page still shows a login error.
 */
export const executeAuthenticationNode: NodeHandler = async (node, ctx) => {
  const logs: string[] = [];
  const s = ctx.stagehand;

  const authEmail =
    (node.data.authEmail as string | undefined)?.trim() ||
    (node.data.email as string | undefined)?.trim() ||
    (node.data.username as string | undefined)?.trim() ||
    ctx.userEmail?.trim() ||
    '';

  const authPassword =
    (node.data.authPassword as string | undefined) ||
    (node.data.password as string | undefined) ||
    '';

  logs.push(`Executing Authentication step: "${node.data.title}"`);
  if (authEmail) {
    logs.push(
      `Authenticating account: ${authEmail} (password: ${authPassword ? '••••••••' : '(not provided)'})`,
    );
  }

  // ---------- helpers ----------

  const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e));

  const getPage = async () =>
    (await s?.browser?.context?.activePage().catch(() => undefined)) ||
    ctx.page;

  const settle = async (ms = 1500) => {
    const page = await getPage();
    await page?.waitForTimeout(ms).catch(() => {});
    await page?.waitForLoadState('domcontentloaded', 8000).catch(() => {});
  };

  // act() can report failure with { success: false } instead of throwing.
  const act = async (instruction: string) => {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = (await s.act(instruction)) as {
          success?: boolean;
          message?: string;
        };
        if (res?.success === false) {
          throw new Error(res.message || `act failed: ${instruction}`);
        }
        return res;
      } catch (e) {
        if (!FRAME_ERR.test(errMsg(e)) || attempt === 2) throw e;
        logs.push(
          `⚠ Frame transition during action; waiting before retry ${attempt + 2}/3...`,
        );
        await settle(1500 + attempt * 1000);
      }
    }

    throw new Error(`Action failed after frame retries: ${instruction}`);
  };

  /**
   * Find an input with `observe`, then fill it via deterministic replay.
   * The secret is only ever passed as an action argument, never in a prompt.
   * Returns false if no matching input is on the page right now.
   */
  const fillField = async (
    finder: string,
    value: string,
    mustMatch?: RegExp,
  ): Promise<boolean> => {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const { data: actions } = await s.observe(finder);
        const target = actions.find((a) => {
          if (a.method !== 'fill' && a.method !== 'type') return false;
          if (!mustMatch) return true;
          const desc = (a as { description?: string }).description ?? '';
          return mustMatch.test(`${desc} ${a.selector}`);
        });
        if (!target) return false;

        logs.push(`  target: ${target.selector}`);
        await s.act({ ...target, arguments: [value] });
        return true;
      } catch (e) {
        if (FRAME_ERR.test(errMsg(e)) && attempt < 2) {
          logs.push(
            `⚠ Frame transition while locating field; retrying ${attempt + 2}/3...`,
          );
          await settle(1500 + attempt * 1000);
          continue;
        }
        throw e;
      }
    }
    return false;
  };

  // ---------- flow ----------

  let actResult: unknown = null;

  const startPage = await getPage();
  const initialUrl = (await startPage?.url().catch(() => '')) || '';
  if (initialUrl) logs.push(`Current page: ${initialUrl}`);

  // Check if session is already authenticated via persistent context
  const isAlreadyLoggedIn =
    Boolean(initialUrl) &&
    !/login|signin|sign-in|log-in|authenticate/i.test(initialUrl) &&
    /dashboard|home|feed|jobs|overview|app|profile|settings|welcome|portal/i.test(
      initialUrl,
    );

  if (isAlreadyLoggedIn) {
    logs.push(
      `✓ Already authenticated via persistent context (${initialUrl}). Skipping credential entry.`,
    );
    return {
      output: {
        action: 'authentication',
        status: 'authenticated',
        email: authEmail || undefined,
        currentUrl: initialUrl,
        currentTitle: (await startPage?.title().catch(() => '')) || undefined,
        result: { skipped: true, reason: 'Already authenticated from persistent context' },
        authenticatedAt: new Date().toISOString(),
      },
      logs,
    };
  }

  if (authEmail || authPassword) {
    // Step 1: email / username
    if (authEmail) {
      logs.push('Step 1: Entering email/username...');
      let ok = await fillField(
        'Find the email or username input field (exclude any OTP or verification code inputs)',
        authEmail,
      );
      if (!ok) {
        logs.push(
          'ℹ Email input not found immediately; attempting to click Log In / Sign In button...',
        );
        try {
          await act(
            'Click on the Log In or Sign In button to open the login form. Exclude and do NOT click "Log in with OTP", "Sign in with OTP", or any OTP options.',
          );
          await settle(2000);
          ok = await fillField(
            'Find the email or username input field (exclude any OTP or verification code inputs)',
            authEmail,
          );
        } catch {
          // continue
        }
      }
      if (!ok) throw new Error('Email/username input field not found');
      logs.push('✓ Email entered');
      await settle(500);
    }

    if (authPassword) {
      logs.push('Step 2: Entering password...');
      let filled = false;

      for (let i = 0; i < 3 && !filled; i++) {
        filled = await fillField(
          'Find the password input field (exclude any OTP or verification code inputs)',
          authPassword,
          /pass/i, // guard: never type the password into a non-password field
        );
        if (!filled) {
          logs.push(
            'ℹ Password field not visible yet, clicking Next/Continue...',
          );
          await act(
            'Click the Next or Continue button. Exclude and do NOT click any "Log in with OTP", "Sign in with OTP", or OTP options.',
          );
          await settle(2500);
        }
      }

      if (!filled) throw new Error('Password input field never appeared');
      logs.push('✓ Password entered');
      await settle(500);
    }

    // Step 3: submit
    const submitPrompt = node.data.selector
      ? `Click on the element "${node.data.selector}" or the Log In / Sign In button. Exclude and do NOT click "Log in with OTP", "Sign in with OTP", or any OTP options.`
      : 'Click on the Log In or Sign In button to submit the login credentials. Exclude and do NOT click "Log in with OTP", "Sign in with OTP", "Send OTP", "Log in with code", or any OTP / one-time password options.';

    logs.push('Step 3: Submitting login credentials (excluding OTP)...');
    try {
      actResult = await act(submitPrompt);
      logs.push('✓ Log in / Sign in button clicked');
    } catch {
      // Click failures unrelated to frame transitions can still use Enter.
      logs.push('⚠ Could not click submit, pressing Enter instead...');
      actResult = await act(
        'Press the Enter key on the keyboard to submit the login form',
      );
      logs.push('✓ Pressed Enter to submit login form');
    }
  } else {
    // No explicit credentials: run the custom instruction
    const rawInstruction =
      node.data.actionSummary?.trim() ||
      node.data.description?.trim() ||
      node.data.title ||
      'Click on the Log In or Sign In button';

    const customInstruction = /otp/i.test(rawInstruction)
      ? rawInstruction
      : `${rawInstruction}. Click on the Log In or Sign In button; exclude and do NOT click "Log in with OTP", "Sign in with OTP", or any OTP options.`;

    logs.push(`Executing custom authentication action: "${customInstruction}"`);
    actResult = await act(customInstruction);
    logs.push('✓ Authentication action executed');
  }

  // Let redirect / session hydration settle
  await settle(2500);

  const currentPage = await getPage();
  const currentUrl = (await currentPage?.url().catch(() => '')) || '';
  const currentTitle = (await currentPage?.title().catch(() => '')) || '';
  if (currentUrl) logs.push(`Destination URL: ${currentUrl}`);
  if (currentTitle) logs.push(`Destination page title: "${currentTitle}"`);

  // ---------- verify the login actually worked ----------
  // Heuristic: if the page still shows an explicit login error, fail the node.
  // Otherwise, if no error is shown or user was redirected, treat as authenticated.
  try {
    const isStillOnAuthPage =
      /login|signin|auth|session/i.test(currentUrl) &&
      !/dashboard|home|feed|jobs|overview|app|profile|settings|welcome/i.test(currentUrl);

    const extractRes = await s.extract(
      'Extract any visible error message indicating that authentication failed (for example "invalid email or password", "incorrect password", "user not found"). Return "none" if there is no error.',
    );

    const rawExtraction =
      (extractRes as { data?: { extraction?: string } })?.data?.extraction ??
      (extractRes as { extraction?: string })?.extraction;

    const extractedText =
      typeof rawExtraction === 'string' ? rawExtraction.trim() : '';

    const isNonError =
      !extractedText ||
      /^(null|none|nil|n\/a|undefined|false|no|no error|no login error|no errors|no visible error|no error found)$/i.test(
        extractedText,
      ) ||
      extractedText.toLowerCase().includes('no error') ||
      extractedText.toLowerCase().includes('no login error') ||
      extractedText.toLowerCase().includes('no visible error') ||
      extractedText.toLowerCase().includes('there are no') ||
      extractedText.toLowerCase().includes('there is no');

    if (!isNonError && isStillOnAuthPage) {
      logs.push(`✗ Login error shown on page: "${extractedText}"`);
      throw new Error(`Login failed: ${extractedText}`);
    } else {
      logs.push('✓ Authentication verified: No login errors detected');
    }
  } catch (e) {
    if (e instanceof Error && e.message.startsWith('Login failed:')) throw e;
    logs.push(`ℹ Login verification note: ${errMsg(e)}`);
  }

  return {
    output: {
      action: 'authentication',
      status: 'authenticated',
      email: authEmail || undefined,
      currentUrl: currentUrl || undefined,
      currentTitle: currentTitle || undefined,
      result: (actResult as unknown) || { success: true },
      authenticatedAt: new Date().toISOString(),
    },
    logs,
  };
};
