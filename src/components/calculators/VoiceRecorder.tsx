import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2, CheckCircle2, Play, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../lib/api';

interface VoiceRecorderProps {
    onTranscriptionComplete: (transcript: string) => void;
    onError: (error: string) => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onTranscriptionComplete, onError }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [duration, setDuration] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (audioUrl) URL.revokeObjectURL(audioUrl);
        };
    }, [audioUrl]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                const url = URL.createObjectURL(blob);
                setAudioUrl(url);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setDuration(0);

            timerRef.current = setInterval(() => {
                setDuration(prev => prev + 1);
            }, 1000);
        } catch (error) {
            console.error('Error accessing microphone:', error);
            onError('Could not access microphone. Please check permissions.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
    };

    const processAudio = async () => {
        if (!audioBlob) return;

        setIsProcessing(true);
        try {
            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');

            const data = await api.uploadAudio(formData);

            onTranscriptionComplete(data.transcript);
            setIsComplete(true);
        } catch (error: any) {
            console.error('Transcription error:', error);
            onError(error.message || 'Failed to transcribe audio. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const togglePlayback = () => {
        if (!audioRef.current) {
            audioRef.current = new Audio(audioUrl!);
            audioRef.current.onended = () => setIsPlaying(false);
        }

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const reset = () => {
        setAudioBlob(null);
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
        setDuration(0);
        setIsComplete(false);
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
        setIsPlaying(false);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="space-y-4">
            <AnimatePresence mode="wait">
                {!audioBlob ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center"
                    >
                        <div className="flex flex-col items-center gap-6">
                            <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${isRecording
                                ? 'bg-red-100 animate-pulse'
                                : 'bg-blue-100'
                                }`}>
                                {isRecording ? (
                                    <div className="relative">
                                        <Mic className="w-10 h-10 text-red-600" />
                                        <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-sm font-semibold text-red-600 whitespace-nowrap">
                                            {formatTime(duration)}
                                        </span>
                                    </div>
                                ) : (
                                    <Mic className="w-10 h-10 text-blue-600" />
                                )}
                            </div>

                            <div>
                                <p className="text-lg font-semibold text-gray-900 mb-1">
                                    {isRecording ? 'Recording...' : 'Record your description'}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {isRecording
                                        ? 'Click stop when finished'
                                        : 'Click the button below to start recording'}
                                </p>
                            </div>

                            <button
                                onClick={isRecording ? stopRecording : startRecording}
                                className={`px-8 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${isRecording
                                    ? 'bg-red-600 hover:bg-red-700 text-white'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                    }`}
                            >
                                {isRecording ? (
                                    <>
                                        <Square className="w-5 h-5" />
                                        Stop Recording
                                    </>
                                ) : (
                                    <>
                                        <Mic className="w-5 h-5" />
                                        Start Recording
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="border-2 border-blue-200 bg-blue-50 rounded-2xl p-6 space-y-4"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                    {isProcessing ? (
                                        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                                    ) : isComplete ? (
                                        <CheckCircle2 className="w-6 h-6 text-blue-600" />
                                    ) : (
                                        <Mic className="w-6 h-6 text-blue-600" />
                                    )}
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">Recording</p>
                                    <p className="text-sm text-gray-500">
                                        {isProcessing
                                            ? 'Transcribing audio...'
                                            : isComplete
                                                ? 'Transcription complete!'
                                                : `Duration: ${formatTime(duration)}`}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {!isProcessing && !isComplete && (
                                    <button
                                        onClick={togglePlayback}
                                        className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                                    >
                                        {isPlaying ? (
                                            <Pause className="w-5 h-5 text-blue-600" />
                                        ) : (
                                            <Play className="w-5 h-5 text-blue-600" />
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>

                        {!isComplete && !isProcessing && (
                            <div className="flex gap-3">
                                <button
                                    onClick={processAudio}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all"
                                >
                                    Transcribe Audio
                                </button>
                                <button
                                    onClick={reset}
                                    className="px-6 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-xl transition-all"
                                >
                                    Re-record
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
