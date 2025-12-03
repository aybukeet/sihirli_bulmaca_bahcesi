import React, { useState, useEffect } from 'react';
import { GameMode, Character } from './types';
import { CharacterCreator } from './components/CharacterCreator';
import { GameSession } from './components/GameSession';
import { FruitButton } from './components/FruitButton';
import { VoiceProvider } from './voice/VoiceEngine';
import { useVoice } from './hooks/useVoice';
import { VoiceOverlay } from './components/VoiceOverlay';
import { ArrowLeft } from 'lucide-react';

const AppContent = () => {
  const [currentMode, setCurrentMode] = useState<GameMode>(GameMode.MENU);
  const [characters, setCharacters] = useState<Character[]>([]);
  const { lastCommand, speak } = useVoice();

  // Global Navigation Logic
  useEffect(() => {
    if (!lastCommand) return;
    const cmd = lastCommand.toLowerCase();
    
    if (cmd.includes('ana sayfa') || cmd.includes('menü') || cmd.includes('geri')) {
        if (currentMode === GameMode.GAME_SELECTION) setCurrentMode(GameMode.MENU);
        else if (currentMode !== GameMode.MENU) setCurrentMode(GameMode.GAME_SELECTION);
    }
    else if (currentMode === GameMode.MENU) {
        if (cmd.includes('karakter')) setCurrentMode(GameMode.CHARACTER_CREATOR);
        else if (cmd.includes('oyuna')) setCurrentMode(GameMode.GAME_SELECTION);
    }
    else {
        // Direct game jumping
        if (cmd.includes('şifre')) setCurrentMode(GameMode.DECRYPTION);
        else if (cmd.includes('küp')) setCurrentMode(GameMode.CUBE);
        else if (cmd.includes('örüntü')) setCurrentMode(GameMode.PATTERN);
        else if (cmd.includes('hikaye')) setCurrentMode(GameMode.STORY);
        else if (cmd.includes('fark')) setCurrentMode(GameMode.FIND_DIFF);
        else if (cmd.includes('hafıza')) setCurrentMode(GameMode.MEMORY_MATCH);
        else if (cmd.includes('puzzle')) setCurrentMode(GameMode.PUZZLE_GAME);
        else if (cmd.includes('yön')) setCurrentMode(GameMode.SPATIAL_DIRECTION);
        else if (cmd.includes('labirent')) setCurrentMode(GameMode.LABYRINTH_GAME);
        else if (cmd.includes('video')) setCurrentMode(GameMode.VIDEO_CREATOR);
    }
  }, [lastCommand]);

  useEffect(() => {
    if (currentMode === GameMode.MENU) {
        setTimeout(() => speak("Sihirli Bahçeye hoş geldin! Karakter mi yapalım, oyun mu oynayalım?"), 800);
    } else if (currentMode === GameMode.GAME_SELECTION) {
        setTimeout(() => speak("Hangi oyunu oynamak istersin? Tavşan, Sincap, Baykuş... hepsi seni bekliyor!"), 500);
    }
  }, [currentMode]);

  const handleCharacterCreated = (char: Character) => setCharacters([...characters, char]);

  // --- MAIN MENU ---
  const renderMainMenu = () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 pb-48 animate-fade-in relative z-20">
        <h1 className="text-6xl md:text-8xl mb-20 text-center magic-title leading-tight relative">
            Sihirli Bulmaca <br/> Bahçesi ✨
            <div className="absolute -top-10 -right-10 text-6xl animate-bounce-slow">🧚‍♀️</div>
            <div className="absolute -bottom-4 -left-10 text-5xl animate-pulse">🌟</div>
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full max-w-5xl px-4">
            <FruitButton
                type="pink"
                label="Karakter Yap"
                variant="large"
                icon="🦄"
                onClick={() => setCurrentMode(GameMode.CHARACTER_CREATOR)}
            />
            <FruitButton
                type="green"
                label="Oyuna Başla"
                variant="large"
                icon="🎮"
                onClick={() => setCurrentMode(GameMode.GAME_SELECTION)}
            />
        </div>
        
        {/* REDESIGNED CHARACTER DOCK (Spacious) */}
        <div className="fixed bottom-0 left-0 right-0 h-48 bg-white/40 backdrop-blur-xl border-t-2 border-white/50 z-40 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] overflow-x-auto">
            <div className="flex items-center gap-6 p-4 min-w-max mx-auto px-10">
                {characters.length === 0 && <span className="text-pink-600/60 font-bold font-['Pacifico'] text-xl mx-auto">Karakterlerin burada yaşayacak...</span>}
                {characters.map((char) => (
                    <div key={char.id} className="relative group cursor-pointer flex flex-col items-center gap-2 transform transition-all hover:-translate-y-2">
                        <div className="w-28 h-28 rounded-[2rem] bg-white border-4 border-pink-100 shadow-lg overflow-hidden relative">
                             <img src={char.imageUrl} className="w-full h-full object-cover" />
                        </div>
                        <span className="bg-white/80 px-4 py-1 rounded-full text-lg font-bold text-pink-600 border border-pink-100 shadow-sm whitespace-nowrap">
                            {char.name}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );

  // --- GAME SELECTION ---
  const renderGameSelection = () => (
    <div className="flex flex-col items-center min-h-screen p-4 pt-8 animate-fade-in pb-40 relative z-20">
        <div className="w-full max-w-7xl flex items-center justify-between mb-12 px-4">
             <button onClick={() => setCurrentMode(GameMode.MENU)} className="bg-white p-4 rounded-full shadow-lg hover:scale-110 transition-transform text-pink-500 border-2 border-pink-100">
                <ArrowLeft size={36} />
             </button>
             <h2 className="text-5xl md:text-6xl text-center flex-1 magic-title drop-shadow-md">Oyun Bahçesi</h2>
             <div className="w-16"></div>
        </div>

        {/* Animal Icons: Rabbit, Squirrel, Owl, Bear, Fox, Turtle, Butterfly, Snail, Hedgehog, Bird */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 md:gap-8 max-w-[90rem] w-full px-4">
            <FruitButton type="orange" label="Şifre" icon="🐰" onClick={() => setCurrentMode(GameMode.DECRYPTION)} />
            <FruitButton type="yellow" label="Küp" icon="🐿️" onClick={() => setCurrentMode(GameMode.CUBE)} />
            <FruitButton type="blue" label="Örüntü" icon="🦉" onClick={() => setCurrentMode(GameMode.PATTERN)} />
            <FruitButton type="green" label="Hikaye" icon="🐻" onClick={() => setCurrentMode(GameMode.STORY)} />
            <FruitButton type="purple" label="Fark Bul" icon="🦊" onClick={() => setCurrentMode(GameMode.FIND_DIFF)} />
            <FruitButton type="teal" label="Hafıza" icon="🐢" onClick={() => setCurrentMode(GameMode.MEMORY_MATCH)} />
            <FruitButton type="indigo" label="Puzzle" icon="🦋" onClick={() => setCurrentMode(GameMode.PUZZLE_GAME)} />
            <FruitButton type="cyan" label="Yön" icon="🐌" onClick={() => setCurrentMode(GameMode.SPATIAL_DIRECTION)} />
            <FruitButton type="rose" label="Labirent" icon="🦔" onClick={() => setCurrentMode(GameMode.LABYRINTH_GAME)} />
            <FruitButton type="red" label="Video" icon="🐦" onClick={() => setCurrentMode(GameMode.VIDEO_CREATOR)} />
        </div>
    </div>
  );

  return (
    <div className="magic-bg">
      {/* --- DECORATIVE CHARACTERS (Static for performance) --- */}
      <div className="absolute top-20 -left-10 text-8xl opacity-90 pointer-events-none z-0 transform hover:translate-x-10 transition-transform">🦄</div>
      <div className="absolute bottom-40 -right-6 text-8xl opacity-90 pointer-events-none z-0">🧚‍♀️</div>
      <div className="absolute top-1/4 right-20 text-6xl opacity-50 pointer-events-none z-0 text-yellow-300">✨</div>
      <div className="absolute bottom-32 left-20 text-7xl opacity-80 pointer-events-none z-0">🐦</div>
      <div className="absolute top-40 left-40 text-5xl opacity-60 pointer-events-none z-0">🍄</div>
      
      {/* Garden Bottom Border */}
      <div className="garden-border"></div>
      
      {/* Particles */}
      <div className="particle" style={{left:'10%', animationDuration:'12s'}}></div>
      <div className="particle" style={{left:'30%', animationDelay:'2s', animationDuration:'15s'}}></div>
      <div className="particle" style={{left:'60%', animationDelay:'5s', animationDuration:'10s'}}></div>
      <div className="particle" style={{left:'85%', animationDelay:'1s', animationDuration:'18s'}}></div>

      <VoiceOverlay />
      
      <div className="relative z-10 h-screen overflow-y-auto overflow-x-hidden">
        {currentMode === GameMode.MENU && renderMainMenu()}
        {currentMode === GameMode.GAME_SELECTION && renderGameSelection()}
        
        {currentMode === GameMode.CHARACTER_CREATOR && (
          <CharacterCreator 
            onCharacterCreated={handleCharacterCreated}
            onBack={() => setCurrentMode(GameMode.MENU)}
          />
        )}

        {(currentMode !== GameMode.MENU && currentMode !== GameMode.GAME_SELECTION && currentMode !== GameMode.CHARACTER_CREATOR) && (
          <GameSession 
            mode={currentMode}
            characters={characters}
            onBack={() => setCurrentMode(GameMode.GAME_SELECTION)}
          />
        )}
      </div>
    </div>
  );
};

export default function App() {
    return (
        <VoiceProvider>
            <AppContent />
        </VoiceProvider>
    );
}