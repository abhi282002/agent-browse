/**
 * Encodes a decoded AudioBuffer (raw PCM float samples) into a 16-bit mono WAV blob.
 * whisper.cpp expects 16 kHz mono PCM, so we mix down to mono and let the
 * browser's AudioContext handle resampling via OfflineAudioContext.
 */
export async function encodeAudioBufferToWav(audioBuffer: AudioBuffer): Promise<Blob> {
  // Resample to 16 kHz mono (whisper.cpp native rate)
  const TARGET_SAMPLE_RATE = 16000;
  const numChannels = 1;
  const numFrames = Math.ceil((audioBuffer.duration * TARGET_SAMPLE_RATE));

  const offlineContext = new OfflineAudioContext(numChannels, numFrames, TARGET_SAMPLE_RATE);
  const sourceNode = offlineContext.createBufferSource();
  sourceNode.buffer = audioBuffer;
  sourceNode.connect(offlineContext.destination);
  sourceNode.start(0);

  const resampledBuffer = await offlineContext.startRendering();
  const pcmFloat32 = resampledBuffer.getChannelData(0);

  // Convert float32 [-1, 1] → int16
  const int16Data = new Int16Array(pcmFloat32.length);
  for (let i = 0; i < pcmFloat32.length; i++) {
    const clamped = Math.max(-1, Math.min(1, pcmFloat32[i]));
    int16Data[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
  }

  // Build WAV file header + PCM data
  const byteRate = TARGET_SAMPLE_RATE * numChannels * 2; // 16-bit = 2 bytes/sample
  const blockAlign = numChannels * 2;
  const dataSize = int16Data.byteLength;
  const headerSize = 44;
  const buffer = new ArrayBuffer(headerSize + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);           // PCM chunk size
  view.setUint16(20, 1, true);            // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, TARGET_SAMPLE_RATE, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);           // bits per sample
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // Copy PCM int16 samples into the buffer
  new Int16Array(buffer, headerSize).set(int16Data);

  return new Blob([buffer], { type: 'audio/wav' });
}
