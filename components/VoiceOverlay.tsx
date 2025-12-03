import React from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useVoice } from '../hooks/useVoice';

export const VoiceOverlay: React.FC = () => {
  const { isListening, transcript, startListening, stopListening } = useVoice();

  const toggleListening = () => {
    if (isListening) {
        stopListening();
    } else {
        startListening();
    }
  };

  return (
    <>
      {/* Magical Speech Cloud Bubble */}
      <div className={`fixed bottom-32 left-1/2 transform -translate-x-1/2 z-[60] transition-all duration-700 pointer-events-none w-full max-w-lg px-4 flex justify-center
          ${transcript ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-90'}
      `}>
          <div className="relative bg-white/95 backdrop-blur-xl px-10 py-8 rounded-[3rem] shadow-[0_20px_60px_rgba(236,72,153,0.3)] border-4 border-pink-100 animate-float">
             {/* Cloud Decoration Bumps */}
             <div className="absolute -top-6 left-10 w-20 h-20 bg-white rounded-full opacity-90"></div>
             <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-24 h-24 bg-white rounded-full opacity-90"></div>
             <div className="absolute -top-6 right-10 w-16 h-16 bg-white rounded-full opacity-90"></div>
             
             {/* Text Content */}
             <p className="text-xl md:text-3xl font-bold text-center text-pink-600 font-['Fredoka'] relative z-10 leading-relaxed drop-shadow-sm">
                "{transcript}"
             </p>
             
             {/* Sparkles */}
             <div className="absolute -right-4 -top-4 text-3xl animate-bounce text-yellow-400">✨</div>
             <div className="absolute -left-2 bottom-4 text-2xl animate-pulse text-blue-300">✦</div>
             
             {/* Speech Tail */}
             <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-10 h-10 bg-white rotate-45 border-b-4 border-r-4 border-pink-100"></div>
          </div>
      </div>

      {/* Fixed Floating Mic Button - Bottom Right */}
      <button
        id="micBtn"
        onClick={toggleListening}
        className={`fixed bottom-6 right-6 z-[70] p-5 rounded-full shadow-[0_10px_40px_rgba(236,72,153,0.4)] border-[6px] transition-all duration-300 transform
            ${isListening 
                ? 'bg-gradient-to-r from-pink-500 to-purple-500 border-white text-white scale-110 shadow-[0_0_0_12px_rgba(236,72,153,0.2)] animate-pulse' 
                : 'bg-white border-pink-100 text-pink-400 hover:scale-105 hover:-translate-y-2'}
        `}
      >
        {isListening ? (
            <Mic className="w-8 h-8 md:w-10 md:h-10" />
        ) : (
            <MicOff className="w-8 h-8 md:w-10 md:h-10 opacity-60" />
        )}
      </button>
    </>
  );
};