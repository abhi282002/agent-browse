import { Browserbase } from '@browserbasehq/sdk';

export async function GET(
  req: Request,
  {
    params,
  }: {
    params: Promise<{
      sessionId: string;
      pageId: string;
    }>;
  },
) {
  try {
    const { sessionId, pageId } = await params;

    if (!sessionId || !pageId) {
      return new Response('Missing sessionId or pageId', { status: 400 });
    }

    const apiKey = process.env.BROWSERBASE_API_KEY?.trim();
    if (!apiKey) {
      return new Response('Browserbase is not configured', {
        status: 503,
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
    }

    const bb = new Browserbase({ apiKey });
    const playlist = await bb.sessions.replays.retrievePage(sessionId, pageId);
    const m3u8 = await playlist.text();

    return new Response(m3u8, {
      headers: {
        'Content-Type': 'application/vnd.apple.mpegurl',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Replay not available';
    const errorStatus =
      typeof error === 'object' &&
      error !== null &&
      'status' in error &&
      typeof error.status === 'number'
        ? error.status
        : 404;

    console.warn(
      '[Browserbase Replay API] Error retrieving page replay:',
      errorMessage,
    );
    return new Response(errorMessage, {
      status: errorStatus,
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
  }
}
