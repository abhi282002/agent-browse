import { Browserbase } from '@browserbasehq/sdk';

const bb = new Browserbase({
  apiKey: process.env.BROWSERBASE_API_KEY!,
});

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

    const playlist = await bb.sessions.replays.retrievePage(sessionId, pageId);
    const m3u8 = await playlist.text();

    return new Response(m3u8, {
      headers: {
        'Content-Type': 'application/vnd.apple.mpegurl',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: any) {
    console.warn('[Browserbase Replay API] Error retrieving page replay:', error?.message || error);
    return new Response(error?.message || 'Replay not available', {
      status: error?.status || 404,
      headers: {
        'Cache-Control': 'no-cache',
      },
    });
  }
}

