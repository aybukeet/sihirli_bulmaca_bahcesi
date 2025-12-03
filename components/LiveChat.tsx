import React, { useEffect, useRef, useState } from 'react';
import { Modality, LiveServerMessage } from "@google/genai";
import { float32ToPCM16Base64, decodeAudioData } from '../utils/audioUtils';
import { Mic, MicOff, PhoneOff } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

interface LiveChatProps {
    onClose: () => void;
}

export const LiveChat: React.FC<LiveChatProps> = ({ onClose }) => {
    const [connected, setConnected] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    
    // Audio Contexts
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    
    // Helper to keep track of active sources to stop them if interrupted
    const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const sessionRef = useRef<any>(null);

    useEffect(() => {
        connectLive();
        return () => disconnectLive();
    }, []);

    const connectLive = async () => {
        setErrorMsg(null);
        try {
            // Setup Audio Output
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
            
            // Setup Audio Input
            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 16000});
            
            // Only Audio
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: {
                        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } },
                    },
                    systemInstruction: "You are a friendly forest spirit in a kids game. Speak Turkish. Keep answers very short and simple for a 5 year old. Be enthusiastic.",
                },
                callbacks: {
                    onopen: () => {
                        setConnected(true);
                        // Stream audio from the microphone to the model.
                        const ctx = inputAudioContextRef.current!;
                        const source = ctx.createMediaStreamSource(stream);
                        const processor = ctx.createScriptProcessor(4096, 1, 1);
                        
                        processor.onaudioprocess = (e) => {
                            if (isMuted) return;
                            const inputData = e.inputBuffer.getChannelData(0);
                            const base64Data = float32ToPCM16Base64(inputData);
                            
                            sessionPromise.then(session => {
                                session.sendRealtimeInput({
                                    media: {
                                        mimeType: 'audio/pcm;rate=16000',
                                        data: base64Data
                                    }
                                });
                            });
                        };

                        source.connect(processor);
                        processor.connect(ctx.destination);
                        
                        sourceRef.current = source;
                        processorRef.current = processor;
                    },
                    onmessage: async (msg: LiveServerMessage) => {
                        const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                        if (audioData && outputAudioContextRef.current) {
                             const ctx = outputAudioContextRef.current;
                             nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                             
                             const buffer = await decodeAudioData(audioData, ctx, 24000);
                             const source = ctx.createBufferSource();
                             source.buffer = buffer;
                             source.connect(ctx.destination);
                             source.start(nextStartTimeRef.current);
                             
                             nextStartTimeRef.current += buffer.duration;
                             audioSourcesRef.current.add(source);
                             source.onended = () => audioSourcesRef.current.delete(source);
                        }

                        if (msg.serverContent?.interrupted) {
                            audioSourcesRef.current.forEach(s => s.stop());
                            audioSourcesRef.current.clear();
                            nextStartTimeRef.current = 0;
                        }
                    },
                    onclose: () => {
                         setConnected(false);
                         console.log("Session closed");
                    },
                    onerror: (err) => {
                        console.error("Live API Error", err);
                    }
                }
            });
            sessionRef.current = sessionPromise;

        } catch (e) {
            console.error("Connection failed", e);
            if (e instanceof DOMException && e.name === "NotAllowedError") {
                setErrorMsg("Mikrofon izni reddedildi. Lütfen tarayıcı ayarlarından izin verin.");
            } else {
                setErrorMsg("Bağlantı hatası oluştu.");
            }
        }
    };

    const disconnectLive = () => {
        if (sessionRef.current) {
           sessionRef.current.then((s: any) => s.close()); // Close connection
        }
        sourceRef.current?.disconnect();
        processorRef.current?.disconnect();
        inputAudioContextRef.current?.close();
        outputAudioContextRef.current?.close();
    };

    return (
        <div className="flex flex-col items-center justify-center h-full animate-fade-in relative p-4 w-full">
            {/* Audio Only Interface */}
            <div className="bg-gradient-to-b from-green-800 to-green-950 rounded-full shadow-2xl relative w-72 h-72 flex flex-col items-center justify-center border-8 border-amber-600/50">
                
                {/* Visualizer Effect */}
                <div className={`absolute inset-0 rounded-full bg-green-400 opacity-20 ${connected && !isMuted ? 'animate-ping' : ''}`}></div>
                <div className="absolute inset-4 rounded-full border-4 border-green-500/30"></div>

                {/* Spirit Avatar */}
                <div className="z-10 text-center">
                    <div className="text-6xl mb-2">🌿</div>
                    <div className="text-green-100 font-bold text-lg">Orman Ruhu</div>
                </div>

                {/* Connection Badge */}
                <div className={`absolute bottom-8 px-4 py-1 rounded-full text-xs font-bold ${connected ? 'bg-green-500 text-white' : 'bg-yellow-500 text-black'}`}>
                    {errorMsg ? 'HATA' : connected ? 'BAĞLI' : 'ARANIYOR...'}
                </div>
            </div>

            {errorMsg && (
                <div className="mt-4 bg-red-100 text-red-800 px-4 py-2 rounded-lg font-bold">
                    {errorMsg}
                </div>
            )}

            {/* Controls */}
            <div className="mt-12 flex gap-6">
                    <button 
                    onClick={() => setIsMuted(!isMuted)}
                    className={`p-6 rounded-full shadow-lg transition-transform active:scale-95 ${isMuted ? 'bg-red-500 text-white' : 'bg-white text-green-800'}`}
                    >
                        {isMuted ? <MicOff size={32} /> : <Mic size={32} />}
                    </button>
                    <button 
                    onClick={onClose}
                    className="p-6 rounded-full bg-red-600 text-white hover:bg-red-700 transition-transform active:scale-95 shadow-lg"
                    >
                        <PhoneOff size={32} />
                    </button>
            </div>
        </div>
    );
};