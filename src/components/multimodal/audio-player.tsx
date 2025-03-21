import { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Mic, Square, Download, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { toast } from '@/components/ui/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { UploadedFile } from './file-upload';

interface AudioPlayerProps {
  file?: UploadedFile;
  onRecordingComplete?: (file: UploadedFile) => void;
  enableRecording?: boolean;
}

export function AudioPlayer({
  file,
  onRecordingComplete,
  enableRecording = false,
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (file?.file && file.uploadType === 'audio') {
      const url = URL.createObjectURL(file.file);
      setAudioUrl(url);
      
      return () => {
        if (url) URL.revokeObjectURL(url);
      };
    } else {
      setAudioUrl(null);
    }
  }, [file]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedData = () => {
      setDuration(audio.duration);
      setCurrentTime(0);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      audio.currentTime = 0;
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl]);

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const restartAudio = () => {
    if (!audioRef.current) return;
    
    audioRef.current.currentTime = 0;
    setCurrentTime(0);
    
    if (!isPlaying) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const skipForward = () => {
    if (!audioRef.current) return;
    
    const newTime = Math.min(audioRef.current.currentTime + 10, duration);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const skipBackward = () => {
    if (!audioRef.current) return;
    
    const newTime = Math.max(audioRef.current.currentTime - 10, 0);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleTimeChange = (values: number[]) => {
    if (!audioRef.current) return;
    
    const newTime = values[0];
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (values: number[]) => {
    if (!audioRef.current) return;
    
    const newVolume = values[0];
    audioRef.current.volume = newVolume;
    setVolume(newVolume);
    
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    
    if (isMuted) {
      audioRef.current.volume = volume;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const startRecording = async () => {
    if (!enableRecording) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      recordedChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        if (onRecordingComplete) {
          const now = new Date();
          const fileName = `recording_${now.toISOString().replace(/[:.]/g, '-')}.webm`;
          const file = new File([blob], fileName, { type: 'audio/webm' });
          
          onRecordingComplete({
            id: crypto.randomUUID(),
            name: fileName,
            size: blob.size,
            type: 'audio/webm',
            file: file,
            uploadType: 'audio',
          });
        }
        
        // Stop all audio tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: 'Recording Failed',
        description: 'Failed to access microphone. Please check permissions.',
        variant: 'destructive',
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const downloadAudio = () => {
    if (!audioUrl) return;
    
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = file?.name || 'audio-download.webm';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        {isRecording ? (
          <div className="flex flex-col items-center justify-center space-y-2 py-6">
            <div className="relative flex items-center justify-center w-16 h-16">
              <div className="absolute w-full h-full bg-red-500/20 rounded-full animate-ping" />
              <Mic className="w-8 h-8 text-red-500 animate-pulse" />
            </div>
            <p className="text-center font-medium">Recording... {formatTime(recordingTime)}</p>
          </div>
        ) : audioUrl ? (
          <>
            <audio ref={audioRef} src={audioUrl} className="hidden" />
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">{formatTime(currentTime)}</span>
                <span className="text-sm">{formatTime(duration)}</span>
              </div>
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={0.1}
                onValueChange={handleTimeChange}
              />
              <div className="flex justify-center space-x-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon" variant="outline" onClick={skipBackward}>
                        <SkipBack className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>-10 seconds</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon" variant="outline" onClick={restartAudio}>
                        <SkipBack className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Restart</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <Button size="icon" onClick={togglePlayPause}>
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon" variant="outline" onClick={skipForward}>
                        <SkipForward className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>+10 seconds</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size="icon" variant="outline" onClick={downloadAudio}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Download</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-2 py-6">
            <p className="text-center text-muted-foreground">
              {enableRecording 
                ? 'Record or upload an audio file to play it' 
                : 'Upload an audio file to play it'}
            </p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="px-4 py-2 flex justify-between">
        <div className="flex items-center space-x-2 w-1/2">
          <Button size="icon" variant="ghost" onClick={toggleMute}>
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          <Slider
            value={[isMuted ? 0 : volume]}
            max={1}
            step={0.01}
            onValueChange={handleVolumeChange}
            className="w-24"
          />
        </div>
        
        {enableRecording && (
          <div>
            {isRecording ? (
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={stopRecording}
                className="gap-1"
              >
                <Square className="h-4 w-4" />
                Stop
              </Button>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={startRecording}
                className="gap-1"
              >
                <Mic className="h-4 w-4" />
                Record
              </Button>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
