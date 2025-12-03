import React, { createContext, useState, useEffect, useRef } from 'react';
import { startSTT, stopSTT } from './stt';
import { speak as ttsSpeak } from './tts';

interface VoiceContextType {
  transcript: string;
  isListening: boolean;
  lastCommand: string;
  speak: (text: string) => void;
  startListening: () => void;
  stopListening: () => void;
}

export const VoiceContext = createContext<VoiceContextType>({
  transcript: '',
  isListening: false,
  lastCommand: '',
  speak: () => {},
  startListening: () => {},
  stopListening: () => {},
});

export const VoiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transcript, setTranscript] = useState("");
  const [lastCommand, setLastCommand] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const startListening = () => {
    if (recognitionRef.current) return;
    
    setIsListening(true);
    recognitionRef.current = startSTT((data: any) => {
        // Update transcript for visual feedback
        setTranscript(data.interim || data.final);

        // Process Commands on Final Result
        if (data.final) {
            const cmd = data.final.toLowerCase();
            setLastCommand(cmd); // Broadcast command
            
            // Allow command to clear after a bit so same command can trigger again if needed
            setTimeout(() => setLastCommand(""), 2000);
        }
    });
  };

  const stopListening = () => {
    if (recognitionRef.current) {
        stopSTT(recognitionRef.current);
        recognitionRef.current = null;
        setIsListening(false);
    }
  };

  const speak = (text: string) => {
    ttsSpeak(text);
  };

  // Auto-start on mount (interaction required usually, but we try)
  useEffect(() => {
    // We can't auto-start audio context without interaction, but STT might work.
    // For now, we wait for user to click the Mic button or interact.
  }, []);

  return (
    <VoiceContext.Provider value={{ transcript, isListening, lastCommand, speak, startListening, stopListening }}>
      {children}
    </VoiceContext.Provider>
  );
};