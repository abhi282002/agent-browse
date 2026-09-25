'use client';

import { useRef, useState, useCallback } from 'react';
import { encodeAudioBufferToWav } from './encodeAudioBufferToWav';

export type SpeechRecordingState = 'idle' | 'recording' | 'transcribing' | 'error';

const WHISPER_ENDPOINT = 'http://127.0.0.1:8080/inference';

interface UseWhisperSpeechToTextOptions {
  onTranscript: (text: string) => void;
}

export function useWhisperSpeechToText({ onTranscript }: UseWhisperSpeechToTextOptions) {
  const [recordingState, setRecordingState] = useState<SpeechRecordingState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    setErrorMessage(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMessage('Microphone access is not supported by this browser.');
      setRecordingState('error');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Pick the best MIME type the browser supports
      const preferredMimeType = ['audio/ogg;codecs=opus', 'audio/webm;codecs=opus', 'audio/webm', '']
        .find((type) => !type || MediaRecorder.isTypeSupported(type)) ?? '';

      const mediaRecorder = new MediaRecorder(
        stream,
        preferredMimeType ? { mimeType: preferredMimeType } : undefined,
      );
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Release the mic indicator immediately
        stream.getTracks().forEach((track) => track.stop());
        setRecordingState('transcribing');

        try {
          const rawBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });

          // Decode browser audio (webm/ogg/etc.) → raw PCM via Web Audio API
          const arrayBuffer = await rawBlob.arrayBuffer();
          const audioContext = new AudioContext();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          await audioContext.close();

          // Re-encode as 16 kHz mono WAV — the format whisper.cpp natively reads
          const wavBlob = await encodeAudioBufferToWav(audioBuffer);

          const formData = new FormData();
          formData.append('file', wavBlob, 'recording.wav');
          formData.append('response_format', 'json');

          const response = await fetch(WHISPER_ENDPOINT, {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const errorText = await response.text().catch(() => '');
            throw new Error(
              `Whisper server responded with ${response.status}${errorText ? `: ${errorText}` : ''}`,
            );
          }

          const data = await response.json();
          // whisper.cpp returns { text: "..." }
          const transcript: string = (data.text ?? '').trim();

          if (transcript) {
            onTranscript(transcript);
            setRecordingState('idle');
          } else {
            setErrorMessage('No speech detected. Please try again.');
            setRecordingState('error');
          }
        } catch (transcriptionError) {
          console.error('[Whisper STT] Transcription failed:', transcriptionError);
          setErrorMessage(
            transcriptionError instanceof Error
              ? transcriptionError.message
              : 'Could not reach the local Whisper server at 127.0.0.1:8080.',
          );
          setRecordingState('error');
        }
      };

      mediaRecorder.start();
      setRecordingState('recording');
    } catch (micError) {
      console.error('[Whisper STT] Mic access denied:', micError);
      setErrorMessage('Microphone permission denied.');
      setRecordingState('error');
    }
  }, [onTranscript]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const toggleRecording = useCallback(() => {
    if (recordingState === 'recording') {
      stopRecording();
    } else if (recordingState === 'idle' || recordingState === 'error') {
      startRecording();
    }
  }, [recordingState, startRecording, stopRecording]);

  return {
    recordingState,
    errorMessage,
    toggleRecording,
    isRecording: recordingState === 'recording',
    isTranscribing: recordingState === 'transcribing',
  };
}
