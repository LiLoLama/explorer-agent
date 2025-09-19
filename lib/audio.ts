import type { ChatRequestPayload } from './types';

const MIME_PRIORITY = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/mpeg',
];

export function isRecordingSupported(): boolean {
  return (
    typeof window !== 'undefined' && typeof window.MediaRecorder !== 'undefined'
  );
}

export function getPreferredMimeType(): string | undefined {
  if (!isRecordingSupported()) {
    return undefined;
  }
  for (const type of MIME_PRIORITY) {
    if (window.MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return undefined;
}

export function createRecorder(
  stream: MediaStream,
  mimeType?: string,
): MediaRecorder {
  const type = mimeType ?? getPreferredMimeType();
  const options = type ? { mimeType: type } : undefined;
  return new MediaRecorder(stream, options);
}

export function blobToFile(
  blob: Blob,
  filename: string,
  mimeType?: string,
): File | Blob {
  const type = mimeType ?? blob.type;
  if (typeof File !== 'undefined') {
    return new File([blob], filename, { type });
  }
  return new Blob([blob], { type });
}

export function buildFormData(
  payload: ChatRequestPayload,
  audioBlob?: Blob,
  filename = 'voice-message.webm',
  mimeType?: string,
): FormData {
  const formData = new FormData();
  formData.set('conversationId', payload.conversationId);
  formData.set('messages', JSON.stringify(payload.messages));
  if (payload.userWebhook) {
    formData.set('userWebhook', payload.userWebhook);
  }
  if (payload.extraHeaders) {
    formData.set('extraHeaders', JSON.stringify(payload.extraHeaders));
  }
  if (typeof payload.stream === 'boolean') {
    formData.set('stream', String(payload.stream));
  }
  if (audioBlob) {
    const file = blobToFile(audioBlob, filename, mimeType ?? audioBlob.type);
    formData.append('audio', file, filename);
  }
  return formData;
}
