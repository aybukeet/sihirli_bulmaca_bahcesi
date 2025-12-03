import React, { useState, useEffect, useRef } from 'react';
import { generateCharacterImage, generateVideoFrames } from '../services/geminiService';
import { Character } from '../types';
import { Heart, ArrowLeft, ArrowUp, ArrowDown, ArrowRight, Video, RotateCw, CheckCircle, Star } from 'lucide-react';
import { useVoice } from '../hooks/useVoice';

interface GameSessionProps {
  mode: 'DECRYPTION' | 'PATTERN' | 'CUBE' | 'STORY' | 'FIND_DIFF' | 'MEMORY_MATCH' | 'PUZZLE_GAME' | 'SPATIAL_DIRECTION' | 'LABYRINTH_GAME' | 'VIDEO_CREATOR';
  characters: Character[];
  onBack: () => void;
}

// --- ASSETS ---
// High-quality 3D Pastel Assets (Fluent Style) for Memory and Fallback
const CUTE_ANIMALS = [
  { name: 'Tavşan', img: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Rabbit%20Face.png' },
  { name: 'Tilki', img: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Fox.png' },
  { name: 'Kurbağa', img: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Frog.png' },
  { name: 'Kedi', img: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Cat%20Face.png' },
  { name: 'Panda', img: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Panda.png' },
  { name: 'Unicorn', img: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Unicorn.png' },
  { name: 'Penguen', img: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Penguin.png' },
  { name: 'Koala', img: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Koala.png' },
];

const FALLBACK_ANIMALS = [
  { name: 'Tavşan', img: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Rabbit%20Face.png' },
  { name: 'Tilki', img: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Fox.png' },
  { name: 'Panda', img: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Panda.png' },
  { name: 'Kedi', img: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Cat%20Face.png' },
  { name: 'Koala', img: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Koala.png' },
  { name: 'Penguen', img: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Penguin.png' },
  { name: 'Kurbağa', img: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Frog.png' },
  { name: 'Unicorn', img: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Unicorn.png' },
];

const MagicHost: React.FC<{ text: React.ReactNode; avatar?: string }> = ({ text, avatar = "🧚‍♀️" }) => (
  <div className="flex items-end gap-3 md:gap-4 mb-4 w-full max-w-3xl justify-center animate-fade-in z-10 px-4">
     <div className="text-5xl md:text-7xl animate-[bounce_2s_infinite] origin-bottom cursor-pointer hover:scale-110 transition-transform filter drop-shadow-lg select-none">
        {avatar}
     </div>
     <div className="bg-white p-4 md:p-6 rounded-[2rem] rounded-bl-none shadow-xl border-4 border-amber-200 relative flex-1 max-w-xl">
        <div className="text-lg md:text-2xl font-bold text-amber-800 leading-snug font-['Fredoka']">
            {text}
        </div>
        <div className="absolute -left-[4px] bottom-0 w-6 h-6 bg-white border-l-4 border-b-4 border-amber-200 transform skew-x-12 translate-y-[3px]"></div>
     </div>
  </div>
);

export const GameSession: React.FC<GameSessionProps> = ({ mode, characters, onBack }) => {
  const { speak, lastCommand, startListening, transcript, isListening } = useVoice();
  
  // --- GLOBAL HUD STATE ---
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const MAX_LEVEL = 10;
  
  const [loading, setLoading] = useState(true);
  const [gameWon, setGameWon] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [hostMessage, setHostMessage] = useState("");

  // --- GAME SPECIFIC STATES ---
  // Decryption
  const [decryptionLegend, setDecryptionLegend] = useState<any[]>([]);
  const [decryptionPuzzle, setDecryptionPuzzle] = useState<any[]>([]);
  const [decryptionInputs, setDecryptionInputs] = useState<string[]>(["", "", ""]);
  
  // Cube
  const [cubeNetColors, setCubeNetColors] = useState<string[]>([]);
  const [cubeOptions, setCubeOptions] = useState<any[]>([]);
  
  // Find Diff
  const [diffBaseImage, setDiffBaseImage] = useState("");
  const [diffItems, setDiffItems] = useState<any[]>([]);
  const [foundDiffs, setFoundDiffs] = useState<number[]>([]);
  
  // Memory
  const [memoryCards, setMemoryCards] = useState<any[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<number[]>([]);
  const [memoryPreview, setMemoryPreview] = useState(false);
  
  // Spatial
  const [spatialChar, setSpatialChar] = useState<any>(null);
  const [spatialTarget, setSpatialTarget] = useState<string>("");
  const [spatialOptions, setSpatialOptions] = useState<any[]>([]);
  
  // Labyrinth
  const [mazeGrid, setMazeGrid] = useState<number[][]>([]);
  const [playerPos, setPlayerPos] = useState({ r: 0, c: 0 });
  
  // Video
  const [videoFrames, setVideoFrames] = useState<string[]>([]);
  const [manualVideoInput, setManualVideoInput] = useState("");

  // Puzzle (Drag and Drop)
  const [puzzlePieces, setPuzzlePieces] = useState<any[]>([]);
  const [puzzlePlaced, setPuzzlePlaced] = useState<boolean[]>([false, false, false, false]);
  const [genericImage, setGenericImage] = useState("");

  // Others
  const [genericQuestion, setGenericQuestion] = useState<any>(null);
  const [storyCards, setStoryCards] = useState<any[]>([]);
  const [storyOrder, setStoryOrder] = useState<number[]>([]);

  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    startListening(); 
    startGame();
  }, []);

  // Handle Video Creator Mode Microphone init
  useEffect(() => {
    if (mode === 'VIDEO_CREATOR') {
        setTimeout(() => {
            navigator.mediaDevices.getUserMedia({ audio: true })
              .then(() => startListening())
              .catch(err => console.log("Mic error:", err));
        }, 800);
    }
  }, [mode]);

  useEffect(() => {
      if (lastCommand) {
          if (lastCommand.includes('geri')) onBack();
      }
  }, [lastCommand]);

  const startGame = () => {
      if (lives <= 0) {
          setLives(3);
          setLevel(1);
          setGameOver(false);
      }
      loadLevel();
  };

  const loadLevel = async () => {
      if (level > MAX_LEVEL) return;
      setLoading(true);
      
      // Cleanup
      setDecryptionInputs(["", "", ""]);
      setFoundDiffs([]);
      setFlippedIndices([]);
      setMatchedPairs([]);
      setStoryOrder([]);
      setVideoFrames([]);
      setManualVideoInput("");
      setPuzzlePlaced([false, false, false, false]);

      // Delay slightly for smooth transition
      setTimeout(() => {
          switch (mode) {
              case 'DECRYPTION': setupDecryption(); break;
              case 'CUBE': setupCube(); break;
              case 'FIND_DIFF': setupFindDiff(); break;
              case 'MEMORY_MATCH': setupMemory(); break;
              case 'SPATIAL_DIRECTION': setupSpatial(); break;
              case 'LABYRINTH_GAME': setupLabyrinth(); break;
              case 'VIDEO_CREATOR': 
                  setLoading(false); 
                  setHostMessage("Ne videosu yapalım?");
                  speak("Ne videosu yapalım? İster söyle, ister yaz."); 
                  break;
              case 'PATTERN': setupPattern(); break;
              case 'STORY': setupStory(); break;
              case 'PUZZLE_GAME': setupPuzzle(); break;
          }
      }, 500);
  };

  // --- 1. ŞİFRE OYUNU ---
  const setupDecryption = () => {
      // Use user characters if available (limit 3), otherwise fill with fallbacks
      let pool = characters.slice(0, 3);
      if (pool.length < 3) {
          const needed = 3 - pool.length;
          const temps = FALLBACK_ANIMALS.slice(0, needed).map((t, i) => ({
              id: `temp_${i}`, name: t.name, imageUrl: t.img, description: t.name, stickers: []
          }));
          pool = [...pool, ...temps];
      }

      // Assign random numbers (1-9) to these 3 characters
      const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => 0.5 - Math.random()).slice(0, 3);
      
      const legend = pool.map((c, i) => ({ char: c, num: numbers[i] }));
      const questionSequence = [...pool].sort(() => 0.5 - Math.random());
      
      setDecryptionLegend(legend);
      setDecryptionPuzzle(questionSequence);
      
      setHostMessage("Resimlerin sayılarını bul ve şifreyi çöz!");
      speak("Resimlerin sayılarını bul ve şifreyi çöz!");
      setLoading(false);
  };

  // --- 2. KÜP OYUNU ---
  const setupCube = () => {
      const colors = ['#fca5a5', '#93c5fd', '#86efac', '#fcd34d', '#c4b5fd', '#fdba74'];
      const shuffled = [...colors].sort(() => 0.5 - Math.random());
      setCubeNetColors(shuffled);

      const correctFaces = [shuffled[2], shuffled[3], shuffled[0]];
      const wrong1 = [shuffled[2], shuffled[5], shuffled[3]];
      const wrong2 = [shuffled[0], shuffled[4], shuffled[1]];
      const wrong3 = [shuffled[1], shuffled[3], shuffled[0]];

      const opts = [
          { faces: correctFaces, correct: true },
          { faces: wrong1, correct: false },
          { faces: wrong2, correct: false },
          { faces: wrong3, correct: false },
      ].sort(() => 0.5 - Math.random());

      setCubeOptions(opts);
      setHostMessage("Hangi küp bu şeklin kapalı halidir?");
      speak("Hangi küp bu şeklin kapalı halidir?");
      setLoading(false);
  };

  // --- 3. FARK OYUNU ---
  const setupFindDiff = async () => {
      const bg = await generateCharacterImage("A simple cute cartoon forest scene with a tree and grass. White background, high quality, 3d render style.");
      setDiffBaseImage(bg);

      const diffCount = 3 + Math.floor(Math.random() * 3);
      const items = [];
      const emojis = ['🍄', '🦋', '🌸', '🐞', '🐌', '🐦'];
      
      for(let i=0; i<diffCount; i++) {
          items.push({
              id: i,
              emoji: emojis[i % emojis.length],
              top: 20 + Math.random() * 60,
              left: 20 + Math.random() * 60,
          });
      }
      setDiffItems(items);
      setHostMessage("İki resim arasındaki farkları bul!");
      speak("İki resim arasındaki farkları bul!");
      setLoading(false);
  };

  // --- 4. HAFIZA OYUNU ---
  const setupMemory = () => {
      // Ensure minimum 5 lives for Memory Game
      setLives(current => Math.max(current, 5));

      // Use HIGH QUALITY 3D assets
      const selectedAnimals = CUTE_ANIMALS.sort(() => 0.5 - Math.random()).slice(0, 6);
      
      const cards = [...selectedAnimals, ...selectedAnimals]
        .map((animal, i) => ({
            id: i,
            img: animal.img,
            name: animal.name,
            matched: false
        }))
        .sort(() => 0.5 - Math.random());

      setMemoryCards(cards);
      setHostMessage("Kartlara iyi bak! Ezberle!");
      speak("Kartlara iyi bak! Ezberle!");
      
      // PREVIEW PHASE: Show all cards
      setMemoryPreview(true);
      setFlippedIndices(cards.map((_, i) => i)); // Flip all

      // Hide after 3 seconds
      setTimeout(() => {
          setMemoryPreview(false);
          setFlippedIndices([]);
          setHostMessage("Şimdi eşlerini bul!");
          speak("Şimdi eşlerini bul!");
      }, 3000);

      setLoading(false);
  };

  // --- 5. YÖN OYUNU ---
  const setupSpatial = () => {
      const char = CUTE_ANIMALS[Math.floor(Math.random() * CUTE_ANIMALS.length)];
      setSpatialChar(char);
      
      const directions = [
          { type: 'UP', icon: <ArrowUp size={48}/>, label: 'Yukarı' },
          { type: 'DOWN', icon: <ArrowDown size={48}/>, label: 'Aşağı' },
          { type: 'LEFT', icon: <ArrowLeft size={48}/>, label: 'Sol' },
          { type: 'RIGHT', icon: <ArrowRight size={48}/>, label: 'Sağ' }
      ];
      
      const target = directions[Math.floor(Math.random() * directions.length)];
      setSpatialTarget(target.type);
      
      const wrong = directions.filter(d => d.type !== target.type).sort(() => 0.5 - Math.random()).slice(0, 2);
      const opts = [target, ...wrong].sort(() => 0.5 - Math.random());
      
      setSpatialOptions(opts);
      setHostMessage(`${char.name} ne tarafa bakıyor?`);
      speak(`${char.name} ne tarafa bakıyor?`);
      setLoading(false);
  };

  // --- 6. LABİRENT ---
  const setupLabyrinth = () => {
      const grid = [
          [0,0,1,0,0],
          [1,0,0,0,1],
          [0,0,1,0,0],
          [0,1,1,1,0],
          [0,0,0,0,0]
      ];
      setMazeGrid(grid);
      setPlayerPos({r: 0, c: 0});
      setHostMessage("Tavşanı havuca götür!");
      speak("Tavşanı havuca götür!");
      setLoading(false);
  };

  // --- 7. VIDEO ---
  // (Setup handled in useEffect)

  // --- 8. PATTERN ---
  const setupPattern = () => {
      const emojis = ['🍎', '🍌', '🍇', '🍓'];
      const a = emojis[0];
      const b = emojis[1];
      setGenericQuestion({
          sequence: [a, b, a, b, "?"],
          answer: a,
          options: [a, b, emojis[2]]
      });
      setHostMessage("Sırada ne var?");
      speak("Sırada ne var?");
      setLoading(false);
  };

  // --- 9. STORY ---
  const setupStory = async () => {
      const imgs = await Promise.all([
          generateCharacterImage("Step 1: A cute bunny sleeping in bed. 3d render style."),
          generateCharacterImage("Step 2: A cute bunny eating breakfast carrot. 3d render style."),
          generateCharacterImage("Step 3: A cute bunny playing outside. 3d render style.")
      ]);
      const cards = imgs.map((img, i) => ({ id: i+1, img }));
      setStoryCards(cards.sort(() => 0.5 - Math.random()));
      setHostMessage("Hikayeyi sıraya diz!");
      speak("Hikayeyi sıraya diz!");
      setLoading(false);
  };

  // --- 10. PUZZLE (TRUE DRAG & DROP) ---
  const setupPuzzle = async () => {
      const img = await generateCharacterImage("A cute 3d cartoon animal in a forest. High quality, vivid colors.");
      setGenericImage(img);
      // Create 4 pieces shuffled
      const pieces = [0, 1, 2, 3].sort(() => 0.5 - Math.random());
      setPuzzlePieces(pieces);
      setPuzzlePlaced([false, false, false, false]);
      
      setHostMessage("Parçaları sürükleyip yerine koy!");
      speak("Parçaları sürükleyip yerine koy!");
      setLoading(false);
  };


  // --- LOGIC HANDLERS ---
  const handleWin = () => {
      setGameWon(true);
      speak("Harika! Bildin!");
      setTimeout(() => {
          setGameWon(false);
          setLevel(l => l + 1);
          loadLevel();
      }, 2000);
  };

  const handleFail = () => {
      if (lives > 1) {
          setLives(l => l - 1);
          speak("Yanlış oldu, tekrar dene!");
      } else {
          setLives(0);
          setGameOver(true);
          speak("Canların bitti, baştan deneyelim!");
      }
  };

  const checkDecryption = (idx: number, val: string) => {
      const next = [...decryptionInputs];
      next[idx] = val;
      setDecryptionInputs(next);
      
      if (next.every(v => v !== "")) {
          const correct = decryptionPuzzle.map(p => {
              const leg = decryptionLegend.find(l => l.char.id === p.id);
              return leg?.num.toString();
          }).join("");
          
          if (next.join("") === correct) handleWin();
          else {
              setTimeout(() => {
                  setDecryptionInputs(["", "", ""]);
                  handleFail();
              }, 500);
          }
      }
  };

  const handleDiffClick = (id: number) => {
      if (!foundDiffs.includes(id)) {
          const newFound = [...foundDiffs, id];
          setFoundDiffs(newFound);
          speak("Buldun!");
          if (newFound.length === diffItems.length) handleWin();
      }
  };

  const handleCardFlip = (idx: number) => {
      if (memoryPreview) return; // Block interaction during preview
      if (flippedIndices.length >= 2 || flippedIndices.includes(idx) || matchedPairs.includes(idx)) return;
      
      const next = [...flippedIndices, idx];
      setFlippedIndices(next);
      
      if (next.length === 2) {
          const [a, b] = next;
          if (memoryCards[a].img === memoryCards[b].img) {
              setMatchedPairs([...matchedPairs, a, b]);
              setFlippedIndices([]);
              if (matchedPairs.length + 2 === memoryCards.length) handleWin();
              else speak("Süper!");
          } else {
              setTimeout(() => {
                  setFlippedIndices([]);
                  handleFail();
              }, 1000);
          }
      }
  };

  const moveMaze = (dr: number, dc: number) => {
      const nr = playerPos.r + dr;
      const nc = playerPos.c + dc;
      if (nr >= 0 && nr < 5 && nc >= 0 && nc < 5) {
          if (mazeGrid[nr][nc] === 0) {
              setPlayerPos({r: nr, c: nc});
              if (nr === 4 && nc === 4) handleWin();
          } else {
              speak("Duvar var!");
          }
      }
  };

  const handleVideoCreate = async () => {
      const textToUse = manualVideoInput || transcript;
      if (!textToUse) {
          speak("Bir şey söyle ya da yaz.");
          return;
      }
      setLoading(true);
      setVideoFrames([]);
      speak("Sihirli kareleri çiziyorum...");
      const frames = await generateVideoFrames(textToUse);
      setLoading(false);
      if (frames && frames.length > 0) {
          setVideoFrames(frames);
          speak("İşte hikayen!");
      } else {
          speak("Hata oluştu.");
      }
  };

  // --- PUZZLE DRAG LOGIC ---
  const handleDragStart = (e: React.DragEvent, id: number) => {
      e.dataTransfer.setData('text/plain', id.toString());
      e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, slotId: number) => {
      e.preventDefault();
      const droppedId = parseInt(e.dataTransfer.getData('text/plain'));
      
      if (droppedId === slotId) {
          // Correct drop
          const newPlaced = [...puzzlePlaced];
          newPlaced[slotId] = true;
          setPuzzlePlaced(newPlaced);
          
          // Remove from pieces tray
          const newPieces = puzzlePieces.filter(p => p !== droppedId);
          setPuzzlePieces(newPieces);
          
          speak("Harika!");
          if (newPlaced.every(Boolean)) handleWin();
      } else {
          speak("Oraya sığmadı!");
      }
  };


  // --- RENDER ---
  if (gameOver) return (
      <div className="flex flex-col items-center justify-center h-full animate-fade-in bg-white/60 backdrop-blur-lg rounded-[3rem] p-8 m-4 border-4 border-red-200">
          <div className="text-9xl mb-6 animate-pulse">💔</div>
          <h1 className="text-4xl font-bold text-red-500 text-center mb-8 font-['Fredoka']">Canların bitti!</h1>
          <button onClick={startGame} className="bg-red-500 text-white px-8 py-4 rounded-full text-2xl font-bold shadow-lg hover:scale-105 transition-transform flex items-center gap-2">
              <RotateCw size={32}/> Tekrar Dene
          </button>
      </div>
  );

  if (level > MAX_LEVEL) return (
       <div className="flex flex-col items-center justify-center h-full animate-fade-in bg-white/60 backdrop-blur-lg rounded-[3rem] p-8 m-4 border-4 border-yellow-300">
          <div className="text-9xl mb-6 animate-bounce">🏆</div>
          <h1 className="text-4xl font-bold text-amber-500 text-center mb-8 font-['Fredoka']">Tebrikler! <br/> Oyun bitti!</h1>
          <button onClick={onBack} className="bg-green-500 text-white px-8 py-4 rounded-full text-2xl font-bold shadow-lg hover:scale-105 transition-transform">
              Menüye Dön
          </button>
      </div>
  );

  return (
    <div className="flex flex-col h-full w-full max-w-5xl mx-auto p-2 relative">
       {/* HUD */}
       <div className="w-full flex justify-between items-center p-3 bg-white/90 rounded-2xl mb-4 shadow-md border-2 border-pink-100 relative z-30">
            <button onClick={onBack} className="p-2 rounded-full bg-gray-50 hover:bg-gray-100">
                <ArrowLeft size={28} className="text-gray-600"/>
            </button>
            <div className="flex gap-1 items-center bg-red-50 px-3 py-1 rounded-full border border-red-100">
                 {/* Show lives up to 5 if needed */}
                 {Array.from({length: Math.max(3, lives)}).map((_, i) => (
                     <Heart key={i} size={24} className={i < lives ? "fill-red-500 text-red-500" : "fill-gray-200 text-gray-200"} />
                 ))}
            </div>
            <div className="px-4 py-1 bg-yellow-100 text-yellow-700 rounded-full font-bold border border-yellow-200">
                Seviye {level} / {MAX_LEVEL}
            </div>
       </div>

       {loading ? (
           <div className="flex flex-col items-center justify-center flex-1">
               <div className="text-8xl animate-spin mb-4">⏳</div>
               <p className="text-2xl font-bold text-pink-500 animate-pulse">Hazırlanıyor...</p>
           </div>
       ) : (
           <div className="flex-1 flex flex-col items-center w-full relative pb-20 overflow-y-auto">
               
               {mode !== 'VIDEO_CREATOR' && <MagicHost text={hostMessage} />}

               {/* 1. DECRYPTION */}
               {mode === 'DECRYPTION' && (
                   <div className="flex flex-col items-center gap-8 w-full">
                       <div className="flex gap-4 md:gap-8 bg-white/80 p-4 rounded-3xl border-2 border-blue-100">
                           {decryptionLegend.map((item, i) => (
                               <div key={i} className="flex flex-col items-center gap-2">
                                   <div className="w-16 h-16 rounded-2xl bg-white shadow-sm p-1 border border-gray-100">
                                       <img src={item.char.imageUrl} className="w-full h-full object-contain" />
                                   </div>
                                   <span className="text-3xl font-bold text-blue-500">{item.num}</span>
                               </div>
                           ))}
                       </div>
                       
                       <div className="flex gap-2 items-center">
                           {decryptionPuzzle.map((char, i) => (
                               <div key={i} className="flex flex-col items-center gap-4 bg-white p-3 rounded-2xl shadow-lg border-b-4 border-gray-200">
                                    <div className="w-20 h-20">
                                        <img src={char.imageUrl} className="w-full h-full object-contain" />
                                    </div>
                                    <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center text-4xl font-bold text-gray-700 border-2 border-gray-200">
                                        {decryptionInputs[i]}
                                    </div>
                               </div>
                           ))}
                       </div>

                       <div className="grid grid-cols-5 gap-3 mt-4">
                           {[1,2,3,4,5,6,7,8,9].map(n => (
                               <button key={n} onClick={() => {
                                   const idx = decryptionInputs.findIndex(v => v === "");
                                   if(idx !== -1) checkDecryption(idx, n.toString());
                               }} className="w-14 h-14 bg-white rounded-xl shadow-md text-2xl font-bold text-blue-600 active:scale-95 border-b-4 border-gray-100 hover:bg-blue-50">
                                   {n}
                               </button>
                           ))}
                           <button onClick={() => setDecryptionInputs(["","",""])} className="col-span-2 bg-red-100 text-red-500 rounded-xl font-bold">Sil</button>
                       </div>
                   </div>
               )}

               {/* 2. CUBE */}
               {mode === 'CUBE' && (
                   <div className="flex flex-col items-center gap-12 w-full">
                       <div className="relative w-48 h-36 scale-125 origin-top mb-10">
                           <div className="absolute w-12 h-12 border-2 border-white shadow-sm" style={{top:0, left:48, background:cubeNetColors[0]}}></div>
                           <div className="absolute w-12 h-12 border-2 border-white shadow-sm" style={{top:48, left:0, background:cubeNetColors[1]}}></div>
                           <div className="absolute w-12 h-12 border-2 border-white shadow-sm" style={{top:48, left:48, background:cubeNetColors[2]}}></div>
                           <div className="absolute w-12 h-12 border-2 border-white shadow-sm" style={{top:48, left:96, background:cubeNetColors[3]}}></div>
                           <div className="absolute w-12 h-12 border-2 border-white shadow-sm" style={{top:96, left:48, background:cubeNetColors[4]}}></div>
                           <div className="absolute w-12 h-12 border-2 border-white shadow-sm" style={{top:144, left:48, background:cubeNetColors[5]}}></div>
                       </div>
                       
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                           {cubeOptions.map((opt, i) => (
                               <button key={i} onClick={() => opt.correct ? handleWin() : handleFail()} className="w-24 h-24 relative perspective-500 group cursor-pointer hover:scale-110 transition-transform">
                                    <div className="w-12 h-12 absolute left-6 top-6 transform-style-3d group-hover:rotate-x-12 group-hover:rotate-y-12 transition-transform duration-500">
                                        <div className="absolute inset-0 translate-z-6 border border-black/10" style={{background: opt.faces[0]}}></div>
                                        <div className="absolute inset-0 translate-y-n6 rotate-x-90 origin-bottom border border-black/10" style={{background: opt.faces[2]}}></div>
                                        <div className="absolute inset-0 translate-x-6 rotate-y-90 origin-left border border-black/10" style={{background: opt.faces[1]}}></div>
                                    </div>
                               </button>
                           ))}
                       </div>
                       <style>{`.transform-style-3d { transform-style: preserve-3d; } .translate-z-6 { transform: translateZ(24px); } .translate-y-n6 { transform: translateY(-24px); } .translate-x-6 { transform: translateX(24px); }`}</style>
                   </div>
               )}

               {/* 3. FIND DIFF */}
               {mode === 'FIND_DIFF' && (
                   <div className="flex flex-col items-center w-full">
                        <div className="flex flex-col md:flex-row gap-4 items-center">
                            <div className="w-72 h-72 rounded-3xl overflow-hidden shadow-lg border-4 border-gray-200">
                                <img src={diffBaseImage} className="w-full h-full object-cover" />
                            </div>
                            <div className="text-3xl font-bold text-gray-300">VS</div>
                            <div className="w-72 h-72 rounded-3xl overflow-hidden shadow-lg border-4 border-pink-400 relative">
                                <img src={diffBaseImage} className="w-full h-full object-cover" />
                                {diffItems.map(item => (
                                    <div key={item.id} onClick={() => handleDiffClick(item.id)} 
                                        className="absolute w-12 h-12 flex items-center justify-center text-4xl cursor-pointer hover:scale-110 transition-transform"
                                        style={{top: `${item.top}%`, left: `${item.left}%`}}
                                    >
                                        {foundDiffs.includes(item.id) ? 
                                            <CheckCircle className="text-green-500 bg-white rounded-full drop-shadow-md"/> : 
                                            <span className="opacity-80 hover:opacity-100">{item.emoji}</span>
                                        }
                                    </div>
                                ))}
                            </div>
                        </div>
                   </div>
               )}

               {/* 4. MEMORY MATCH */}
               {mode === 'MEMORY_MATCH' && (
                   <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                       {memoryCards.map((card, i) => {
                           const isOpen = memoryPreview || flippedIndices.includes(i) || matchedPairs.includes(i);
                           return (
                               <div key={i} onClick={() => handleCardFlip(i)} className={`w-24 h-24 md:w-28 md:h-28 bg-white rounded-2xl shadow-md cursor-pointer relative transition-all duration-300 transform ${isOpen ? 'rotate-y-180' : 'hover:scale-105'}`}>
                                   {isOpen ? (
                                       <img src={card.img} className="w-full h-full object-cover rounded-2xl p-1" />
                                   ) : (
                                       <div className="w-full h-full bg-gradient-to-br from-indigo-300 to-indigo-500 rounded-2xl flex items-center justify-center text-4xl text-white shadow-inner border-2 border-white/30">
                                           ?
                                       </div>
                                   )}
                               </div>
                           )
                       })}
                   </div>
               )}

               {/* 5. SPATIAL */}
               {mode === 'SPATIAL_DIRECTION' && spatialChar && (
                   <div className="flex flex-col items-center w-full gap-8">
                       <div className="w-64 h-64 relative bg-sky-100 rounded-full border-[6px] border-white shadow-xl flex items-center justify-center overflow-hidden">
                           <div className="absolute top-0 w-full h-1/2 bg-sky-200"></div>
                           <div className={`relative w-32 h-32 transition-transform duration-500
                                ${spatialTarget === 'UP' ? '-translate-y-12 rotate-180' : ''}
                                ${spatialTarget === 'DOWN' ? 'translate-y-12' : ''}
                                ${spatialTarget === 'LEFT' ? '-translate-x-12 -rotate-90' : ''}
                                ${spatialTarget === 'RIGHT' ? 'translate-x-12 rotate-90' : ''}
                           `}>
                               <img src={spatialChar.img} className="w-full h-full object-contain drop-shadow-lg" />
                           </div>
                       </div>
                       
                       <div className="flex gap-4">
                           {spatialOptions.map((opt, i) => (
                               <button key={i} onClick={() => opt.type === spatialTarget ? handleWin() : handleFail()}
                                    className="w-20 h-20 bg-white rounded-2xl shadow-lg border-b-8 border-gray-100 active:border-b-0 active:translate-y-2 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-all"
                               >
                                   {opt.icon}
                               </button>
                           ))}
                       </div>
                   </div>
               )}

               {/* 6. LABİRENT */}
               {mode === 'LABYRINTH_GAME' && (
                   <div className="flex flex-col items-center gap-6">
                       <div className="bg-amber-100 p-3 rounded-2xl shadow-xl border-4 border-amber-600">
                           <div className="grid gap-1" style={{gridTemplateColumns: 'repeat(5, 1fr)'}}>
                               {mazeGrid.map((row, r) => row.map((cell, c) => {
                                   const isPlayer = playerPos.r === r && playerPos.c === c;
                                   const isEnd = r === 4 && c === 4;
                                   return (
                                       <div key={`${r}-${c}`} className={`w-14 h-14 md:w-16 md:h-16 rounded-lg flex items-center justify-center
                                            ${cell === 1 ? 'bg-stone-600 shadow-inner' : 'bg-amber-50'}
                                            ${isEnd ? 'bg-green-300 ring-2 ring-green-500' : ''}
                                       `}>
                                           {isPlayer && <span className="text-4xl animate-bounce">🐰</span>}
                                           {isEnd && !isPlayer && <span className="text-3xl">🥕</span>}
                                           {cell === 1 && <span className="text-xl opacity-30">🌳</span>}
                                       </div>
                                   )
                               }))}
                           </div>
                       </div>
                       
                       <div className="grid grid-cols-3 gap-3 w-64">
                           <div/>
                           <button onClick={() => moveMaze(-1,0)} className="w-20 h-20 bg-blue-500 rounded-2xl shadow-lg text-white flex items-center justify-center active:scale-95 border-b-8 border-blue-700 active:border-b-0"><ArrowUp size={40}/></button>
                           <div/>
                           <button onClick={() => moveMaze(0,-1)} className="w-20 h-20 bg-blue-500 rounded-2xl shadow-lg text-white flex items-center justify-center active:scale-95 border-b-8 border-blue-700 active:border-b-0"><ArrowLeft size={40}/></button>
                           <button onClick={() => moveMaze(1,0)} className="w-20 h-20 bg-blue-500 rounded-2xl shadow-lg text-white flex items-center justify-center active:scale-95 border-b-8 border-blue-700 active:border-b-0"><ArrowDown size={40}/></button>
                           <button onClick={() => moveMaze(0,1)} className="w-20 h-20 bg-blue-500 rounded-2xl shadow-lg text-white flex items-center justify-center active:scale-95 border-b-8 border-blue-700 active:border-b-0"><ArrowRight size={40}/></button>
                       </div>
                   </div>
               )}

               {/* 7. VIDEO */}
               {mode === 'VIDEO_CREATOR' && (
                   <div className="flex flex-col items-center w-full max-w-5xl px-4 gap-6">
                       <div className="text-8xl animate-bounce">🎥</div>
                       
                       {/* Transcript Box */}
                       <div className="w-full bg-white rounded-[2.5rem] p-8 shadow-xl border-4 border-pink-100 min-h-[100px] relative flex items-center justify-center">
                           <p className="text-2xl font-bold text-gray-700 font-['Fredoka'] leading-relaxed text-center">
                               {transcript || "Mikrofona konuş…"}
                           </p>
                           {isListening && <div className="absolute bottom-4 right-4 w-3 h-3 bg-red-500 rounded-full animate-pulse"/>}
                       </div>

                       {/* Manual Input */}
                       <textarea 
                            value={manualVideoInput}
                            onChange={(e) => setManualVideoInput(e.target.value)}
                            placeholder="Buraya yazabilirsin…"
                            className="w-full p-5 rounded-2xl border-4 border-white bg-white/50 text-xl focus:border-pink-300 outline-none shadow-sm text-center resize-none h-32"
                       />

                       {videoFrames.length > 0 ? (
                            <div className="flex flex-col gap-4 w-full">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                                    {videoFrames.map((frame, idx) => (
                                        <div key={idx} className="aspect-square bg-white rounded-3xl overflow-hidden shadow-xl border-4 border-pink-200 relative group transition-transform hover:scale-105">
                                            <img src={frame} className="w-full h-full object-cover" />
                                            <div className="absolute top-2 left-2 bg-white/80 px-3 py-1 rounded-full text-pink-600 font-bold border border-pink-100 shadow-sm">
                                                {idx + 1}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-center text-lg font-bold text-gray-600 bg-white/50 rounded-xl p-2 mt-4">
                                   Konu: {manualVideoInput || transcript}
                               </p>
                               <button onClick={() => setVideoFrames([])} className="mt-2 bg-gray-200 text-gray-600 px-6 py-3 rounded-full font-bold">
                                   Yeni Video Yap
                               </button>
                            </div>
                       ) : (
                           <button onClick={handleVideoCreate} className={`w-full py-6 rounded-3xl text-2xl font-bold text-white shadow-xl transition-transform active:scale-95 flex items-center justify-center gap-3 border-b-8 active:border-b-0 active:translate-y-2
                                ${(manualVideoInput || transcript) ? 'bg-gradient-to-r from-pink-500 to-purple-500 border-purple-700' : 'bg-gray-300 border-gray-400'}
                           `}>
                               <Video size={36} /> VİDEOYU OLUŞTUR
                           </button>
                       )}
                   </div>
               )}

               {/* 8. PATTERN */}
               {mode === 'PATTERN' && genericQuestion && (
                   <div className="flex flex-col items-center gap-10">
                       <div className="flex gap-4 p-8 bg-white rounded-[2rem] shadow-lg border-2 border-pink-100">
                           {genericQuestion.sequence.map((item: string, i: number) => (
                               <div key={i} className="text-7xl drop-shadow-md transform hover:scale-110 transition-transform">{item}</div>
                           ))}
                       </div>
                       <div className="flex gap-6">
                           {genericQuestion.options.map((opt: string, i: number) => (
                               <button key={i} onClick={() => opt === genericQuestion.answer ? handleWin() : handleFail()} className="w-24 h-24 bg-white rounded-2xl shadow-lg text-6xl flex items-center justify-center hover:scale-110 transition-transform border-b-4 border-gray-200 active:border-b-0 active:translate-y-1">
                                   {opt}
                               </button>
                           ))}
                       </div>
                   </div>
               )}

               {/* 9. STORY */}
               {mode === 'STORY' && (
                   <div className="flex flex-col items-center w-full px-4 gap-6">
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                           {storyCards.map((card) => {
                               const selectedIdx = storyOrder.indexOf(card.id);
                               return (
                                   <div key={card.id} onClick={() => {
                                       if(selectedIdx !== -1) return;
                                       const next = [...storyOrder, card.id];
                                       setStoryOrder(next);
                                       if(next.length === 3) {
                                           if(JSON.stringify(next) === JSON.stringify([1,2,3])) handleWin();
                                           else {
                                               setTimeout(() => { setStoryOrder([]); handleFail(); }, 1000);
                                           }
                                       }
                                   }} className={`aspect-square rounded-3xl overflow-hidden border-8 shadow-lg relative cursor-pointer active:scale-95 transition-transform
                                        ${selectedIdx !== -1 ? 'border-green-400 scale-95' : 'border-white hover:border-pink-100'}
                                   `}>
                                       <img src={card.img} className="w-full h-full object-cover" />
                                       {selectedIdx !== -1 && (
                                           <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-8xl font-bold text-white backdrop-blur-sm animate-bounce">
                                               {selectedIdx + 1}
                                           </div>
                                       )}
                                   </div>
                               );
                           })}
                       </div>
                   </div>
               )}

               {/* 10. PUZZLE - TRUE DRAG & DROP */}
               {mode === 'PUZZLE_GAME' && genericImage && (
                   <div className="flex flex-col items-center gap-8">
                       {/* Drop Zone Board (2x2) */}
                       <div className="grid grid-cols-2 gap-1 bg-white p-2 rounded-2xl shadow-xl border-4 border-indigo-100 w-80 h-80">
                           {puzzlePlaced.map((isPlaced, i) => (
                               <div 
                                   key={i} 
                                   onDragOver={handleDragOver}
                                   onDrop={(e) => handleDrop(e, i)}
                                   className={`relative w-full h-full bg-indigo-50 rounded-xl border-2 border-dashed border-indigo-200 flex items-center justify-center overflow-hidden transition-all
                                        ${!isPlaced ? 'hover:bg-indigo-100' : ''}
                                   `}
                               >
                                   {!isPlaced && <span className="text-indigo-200 text-4xl font-bold opacity-50">{i + 1}</span>}
                                   {isPlaced && (
                                       <div className="w-full h-full animate-fade-in" style={{
                                           backgroundImage: `url(${genericImage})`,
                                           backgroundSize: '200% 200%',
                                           backgroundPosition: `${(i % 2) * 100}% ${Math.floor(i / 2) * 100}%`
                                       }} />
                                   )}
                               </div>
                           ))}
                       </div>

                       {/* Draggable Pieces Tray */}
                       <div className="flex gap-4 p-4 bg-white/50 backdrop-blur-sm rounded-3xl min-h-[120px] w-full justify-center flex-wrap">
                           {puzzlePieces.map(id => (
                               <div 
                                   key={id} 
                                   draggable 
                                   onDragStart={(e) => handleDragStart(e, id)}
                                   className="w-24 h-24 rounded-xl shadow-lg cursor-grab active:cursor-grabbing hover:scale-105 transition-transform relative overflow-hidden border-2 border-white"
                                   style={{
                                       backgroundImage: `url(${genericImage})`,
                                       backgroundSize: '200% 200%',
                                       backgroundPosition: `${(id % 2) * 100}% ${Math.floor(id / 2) * 100}%`
                                   }}
                               >
                               </div>
                           ))}
                           {puzzlePieces.length === 0 && (
                               <div className="text-xl text-indigo-400 font-bold animate-pulse">
                                   Harika! Hepsini yerleştirdin! 🌟
                               </div>
                           )}
                       </div>
                   </div>
               )}

           </div>
       )}
    </div>
  );
};