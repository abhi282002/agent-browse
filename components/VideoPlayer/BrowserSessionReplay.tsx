"use client";

import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";

interface BrowserReplayProps {
  sessionId: string;
  pageId: string;
  className?: string;
  autoPlay?: boolean;
}

export function BrowserReplay({
  sessionId,
  pageId,
  className,
  autoPlay = false,
}: BrowserReplayProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !sessionId || !pageId) return;

    setIsLoading(true);
    setError(null);

    const url = `/api/browserbase/replay/${encodeURIComponent(sessionId)}/${encodeURIComponent(pageId)}`;
    let hls: Hls | undefined;

    if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
      });

      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        setError(null);
        if (autoPlay) {
          video.play().catch(() => {
            // Autoplay blocked by browser policy
          });
        }
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.warn('[HLS] Network error encountered, attempting recovery...', data);
              hls?.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.warn('[HLS] Media error encountered, attempting recovery...', data);
              hls?.recoverMediaError();
              break;
            default:
              console.error('[HLS] Fatal unrecoverable error:', data);
              setIsLoading(false);
              setError('Failed to load session replay stream. Recording may still be processing.');
              hls?.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Native Safari HLS
      video.src = url;

      const handleLoaded = () => {
        setIsLoading(false);
        setError(null);
        if (autoPlay) {
          video.play().catch(() => {});
        }
      };

      const handleError = () => {
        setIsLoading(false);
        setError('Failed to load session replay stream.');
      };

      video.addEventListener('loadedmetadata', handleLoaded);
      video.addEventListener('error', handleError);

      return () => {
        video.removeEventListener('loadedmetadata', handleLoaded);
        video.removeEventListener('error', handleError);
      };
    } else {
      setIsLoading(false);
      setError('HLS playback is not supported in this browser.');
    }

    return () => {
      hls?.destroy();
    };
  }, [sessionId, pageId, autoPlay, reloadKey]);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black/90 rounded-xl overflow-hidden min-h-[300px]">
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/70 z-10 gap-2 text-zinc-400">
          <Loader2 className="h-7 w-7 text-emerald-400 animate-spin" />
          <span className="text-xs font-mono">Loading replay video stream...</span>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/90 text-zinc-400 p-6 text-center z-10 gap-3">
          <AlertCircle className="h-8 w-8 text-rose-400" />
          <p className="text-xs text-zinc-300 max-w-sm">{error}</p>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setIsLoading(true);
              setReloadKey((prev) => prev + 1);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition-colors cursor-pointer border border-zinc-700"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      <video
        ref={videoRef}
        controls
        playsInline
        className={className || "w-full h-full max-h-full object-contain rounded-xl"}
      />
    </div>
  );
}

