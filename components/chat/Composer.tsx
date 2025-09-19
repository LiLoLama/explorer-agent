'use client';

import * as React from 'react';
import {
  Loader2,
  Mic,
  MicOff,
  Send,
  StopCircle,
  Trash2,
  Play,
  Pause,
} from 'lucide-react';

import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  createRecorder,
  getPreferredMimeType,
  isRecordingSupported,
} from '@/lib/audio';

interface ComposerProps {
  onSend: (content: string, audioBlob?: Blob) => Promise<void> | void;
  disabled?: boolean;
  isStreaming?: boolean;
  onStop?: () => void;
}

export function Composer({
  onSend,
  disabled,
  isStreaming,
  onStop,
}: ComposerProps) {
  const { toast } = useToast();
  const [message, setMessage] = React.useState('');
  const [audioBlob, setAudioBlob] = React.useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = React.useState<string | null>(null);
  const [recording, setRecording] = React.useState(false);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const audioChunksRef = React.useRef<Blob[]>([]);
  const audioElementRef = React.useRef<HTMLAudioElement | null>(null);

  const canRecord = React.useMemo(() => isRecordingSupported(), []);

  React.useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const resetAudio = () => {
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setIsPlaying(false);
    audioChunksRef.current = [];
  };

  const handleRecorderData = (event: BlobEvent) => {
    if (event.data.size > 0) {
      audioChunksRef.current.push(event.data);
    }
  };

  const startRecording = async () => {
    if (!canRecord) {
      toast({ title: 'Recording not supported in this browser' });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getPreferredMimeType();
      const recorder = createRecorder(stream, mimeType);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];
      recorder.ondataavailable = handleRecorderData;
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, {
          type: mimeType ?? 'audio/webm',
        });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setRecording(false);
      };
      recorder.start();
      setRecording(true);
      toast({ title: 'Recording started' });
    } catch (error) {
      console.error('Microphone access denied', error);
      toast({ title: 'Microphone access denied' });
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
      recorder.stream.getTracks().forEach((track) => track.stop());
    }
  };

  const togglePlayback = () => {
    if (!audioUrl) {
      return;
    }
    let audio = audioElementRef.current;
    if (!audio) {
      audio = new Audio(audioUrl);
      audioElementRef.current = audio;
      audio.onended = () => setIsPlaying(false);
    }
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      void audio.play();
      setIsPlaying(true);
    }
  };

  const handleSend = async () => {
    const trimmed = message.trim();
    if (!trimmed && !audioBlob) {
      return;
    }
    await onSend(trimmed, audioBlob ?? undefined);
    setMessage('');
    resetAudio();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  const isSendDisabled = Boolean(
    isStreaming || disabled || (!message.trim() && !audioBlob),
  );

  return (
    <div className="border-t border-white/5 bg-transparent p-4 dark:border-white/10">
      <div className="rounded-2xl border border-black/10 bg-white/70 p-4 shadow-pill focus-within:ring-2 focus-within:[--tw-ring-color:var(--ring)] dark:border-white/10 dark:bg-white/[0.04]">
        <Textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          aria-label="Message"
          disabled={Boolean(disabled || isStreaming)}
          className="min-h-[120px] rounded-2xl border-none bg-transparent text-[var(--text)] placeholder:text-[var(--muted)] focus-visible:ring-0"
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={recording ? 'destructive' : 'outline'}
            onClick={recording ? stopRecording : startRecording}
            disabled={!canRecord || Boolean(disabled || isStreaming)}
            aria-label={recording ? 'Stop recording' : 'Start recording'}
          >
            {recording ? (
              <MicOff className="mr-2 h-4 w-4" />
            ) : (
              <Mic className="mr-2 h-4 w-4" />
            )}
            {recording ? 'Stop' : 'Record'}
          </Button>
          {audioBlob ? (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={togglePlayback}
                aria-label="Play recording"
              >
                {isPlaying ? (
                  <Pause className="mr-2 h-4 w-4" />
                ) : (
                  <Play className="mr-2 h-4 w-4" />
                )}{' '}
                {isPlaying ? 'Pause' : 'Listen'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={resetAudio}
                aria-label="Discard recording"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Discard
              </Button>
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {isStreaming ? (
            <Button
              type="button"
              variant="destructive"
              onClick={onStop}
              aria-label="Stop response"
            >
              <StopCircle className="mr-2 h-4 w-4" /> Stop
            </Button>
          ) : null}
          <Button
            type="button"
            onClick={() => void handleSend()}
            disabled={isSendDisabled}
          >
            {disabled ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}{' '}
            Send
          </Button>
        </div>
        </div>
      </div>
    </div>
  );
}
