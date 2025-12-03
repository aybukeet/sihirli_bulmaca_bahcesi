import React, { useState, useRef, useEffect } from 'react';
import { Mic, Check, RefreshCw, ArrowLeft, Palette, Brush, Eraser, Trash2, Undo } from 'lucide-react';
import { generateCharacterImage } from '../services/geminiService';
import { Character } from '../types';
import { useVoice } from '../hooks/useVoice';

interface CharacterCreatorProps {
  onCharacterCreated: (char: Character) => void;
  onBack: () => void;
}

const PASTEL_COLORS = [
  '#fca5a5', // Red
  '#fdba74', // Orange
  '#fcd34d', // Yellow
  '#86efac', // Green
  '#93c5fd', // Blue
  '#c4b5fd', // Purple
  '#f9a8d4', // Pink
  '#000000', // Black
];

export const CharacterCreator: React.FC<CharacterCreatorProps> = ({ onCharacterCreated, onBack }) => {
  const { transcript, speak, isListening, startListening } = useVoice();
  const [step, setStep] = useState<'INPUT' | 'PREVIEW'>('INPUT');
  const [creationMode, setCreationMode] = useState<'VOICE' | 'DRAW'>('VOICE');
  const [guideMessage, setGuideMessage] = useState<string>("Dinliyorum...");
  const [nameInput, setNameInput] = useState("");
  const [descInput, setDescInput] = useState("");
  const [previewImage, setPreviewImage] = useState<string>("");

  // Drawing State
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState(PASTEL_COLORS[7]);
  const [tool, setTool] = useState<'BRUSH' | 'ERASER'>('BRUSH');
  
  useEffect(() => {
    speak("Yeni karakter yapalım! İster anlat, ister çiz!");
    startListening();
  }, []);

  useEffect(() => {
    if (!transcript) return;
    const cleanText = transcript.trim();
    if (cleanText) {
        if (!nameInput) {
            setNameInput(cleanText);
            setGuideMessage(`Adı ${cleanText} olsun!`);
        } else if (creationMode === 'VOICE') {
            setDescInput(cleanText); 
            setGuideMessage("Harika! Şimdi oluşturabiliriz.");
        }
    }
  }, [transcript]);

  // --- CANVAS LOGIC FIXED ---
  const getCoords = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      if ('touches' in e) {
          return {
              offsetX: (e.touches[0].clientX - rect.left) * scaleX,
              offsetY: (e.touches[0].clientY - rect.top) * scaleY
          };
      } else {
          return {
              offsetX: ((e as React.MouseEvent).clientX - rect.left) * scaleX,
              offsetY: ((e as React.MouseEvent).clientY - rect.top) * scaleY
          };
      }
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault(); 
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      setIsDrawing(true);
      const { offsetX, offsetY } = getCoords(e, canvas);
      ctx.beginPath();
      ctx.moveTo(offsetX, offsetY);
      ctx.strokeStyle = tool === 'ERASER' ? '#ffffff' : brushColor;
      ctx.lineWidth = tool === 'ERASER' ? 30 : 12;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      if (!isDrawing) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const { offsetX, offsetY } = getCoords(e, canvas);
      ctx.lineTo(offsetX, offsetY);
      ctx.stroke();
  };

  const stopDraw = () => {
      setIsDrawing(false);
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      ctx?.closePath();
  };

  const clearCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
  };

  useEffect(() => {
      if (creationMode === 'DRAW' && canvasRef.current) {
          // Set internal resolution match
          canvasRef.current.width = canvasRef.current.offsetWidth;
          canvasRef.current.height = canvasRef.current.offsetHeight;
      }
  }, [creationMode]);

  const handleGenerate = async () => {
    setStep('PREVIEW');
    setGuideMessage("Sihir yapılıyor... ✨");
    speak("Sihir yapıyorum, bekle!");
    
    let prompt = `Name: ${nameInput}. `;
    let refImage = undefined;

    if (creationMode === 'DRAW' && canvasRef.current) {
        refImage = canvasRef.current.toDataURL('image/png').split(',')[1];
        prompt += "Based on this child's drawing.";
    } else {
        prompt += `Desc: ${descInput}`;
    }
    
    const img = await generateCharacterImage(prompt, refImage);
    setPreviewImage(img);
    setGuideMessage("İşte karakterin!");
    speak("İşte karakterin! Beğendin mi?");
  };

  const handleSave = () => {
      onCharacterCreated({ id: Date.now().toString(), name: nameInput, description: descInput, imageUrl: previewImage, stickers: [] });
      speak("Kaydettim!");
      onBack();
  };

  return (
    <div className="flex flex-col items-center min-h-full p-4 pt-8 max-w-5xl mx-auto relative z-20">
       <button onClick={onBack} className="self-start mb-6 p-4 bg-white rounded-full shadow-[0_4px_15px_rgba(0,0,0,0.1)] hover:scale-110 transition-transform text-pink-500 border-2 border-pink-100">
           <ArrowLeft size={36}/>
       </button>
       
       {/* Magical Guide */}
       <div className="flex items-end gap-6 mb-8 w-full justify-center">
           <div className="text-8xl animate-float filter drop-shadow-lg">🧚‍♀️</div>
           <div className="bg-white/95 p-6 rounded-[2.5rem] rounded-bl-none shadow-xl border-4 border-pink-200 relative max-w-lg flex-1">
               <p className="text-2xl font-bold text-pink-600 font-['Fredoka']">{guideMessage}</p>
               <div className="absolute -left-1 bottom-0 w-8 h-8 bg-white border-l-4 border-b-4 border-pink-200 transform skew-x-12 translate-y-[4px]"></div>
           </div>
       </div>

       {step === 'INPUT' ? (
           <div className="w-full bg-white/70 backdrop-blur-xl rounded-[3rem] p-8 shadow-[0_20px_60px_rgba(0,0,0,0.1)] border-[6px] border-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-20 text-9xl pointer-events-none">✨</div>

              {/* Name Input */}
              <input 
                value={nameInput} 
                onChange={e => setNameInput(e.target.value)}
                placeholder="Karakterin Adı Ne?"
                className="w-full p-6 rounded-[2rem] border-4 border-pink-100 bg-white/90 mb-8 text-center text-3xl font-bold text-pink-500 focus:outline-none focus:border-pink-300 placeholder-pink-200 shadow-inner"
              />

              {/* Toggle Buttons */}
              <div className="flex gap-4 mb-8 justify-center">
                  <button 
                    onClick={() => setCreationMode('VOICE')} 
                    className={`flex items-center gap-3 px-8 py-4 rounded-[2rem] font-bold text-xl transition-all shadow-md border-4
                        ${creationMode === 'VOICE' ? 'bg-pink-100 border-pink-400 text-pink-600 scale-105 shadow-pink-200' : 'bg-white border-pink-100 text-pink-400 hover:bg-pink-50'}
                    `}
                  >
                      <span className="text-3xl">🐰</span> Sesle Anlat
                  </button>
                  <button 
                    onClick={() => setCreationMode('DRAW')} 
                    className={`flex items-center gap-3 px-8 py-4 rounded-[2rem] font-bold text-xl transition-all shadow-md border-4
                        ${creationMode === 'DRAW' ? 'bg-blue-100 border-blue-400 text-blue-600 scale-105 shadow-blue-200' : 'bg-white border-blue-100 text-blue-400 hover:bg-blue-50'}
                    `}
                  >
                      <span className="text-3xl">🎨</span> Çizerek Yap
                  </button>
              </div>

              {creationMode === 'VOICE' ? (
                  <textarea 
                    value={descInput}
                    onChange={e => setDescInput(e.target.value)}
                    placeholder="Nasıl görünüyor? (Örn: Pembe elbiseli bir kedi)"
                    className="w-full p-6 rounded-[2rem] border-4 border-pink-100 bg-white/90 mb-4 h-64 text-2xl text-gray-700 focus:outline-none focus:border-pink-300 resize-none shadow-inner"
                  />
              ) : (
                  <div className="flex flex-col gap-6">
                      {/* Canvas Toolbar */}
                      <div className="flex justify-between items-center bg-white p-4 rounded-[2rem] shadow-sm border-2 border-gray-100">
                          <div className="flex gap-3 overflow-x-auto pb-2">
                              {PASTEL_COLORS.map(c => (
                                  <button 
                                    key={c} 
                                    onClick={() => { setBrushColor(c); setTool('BRUSH'); }}
                                    className={`w-12 h-12 rounded-full border-4 transition-transform hover:scale-110 shadow-sm ${brushColor === c && tool === 'BRUSH' ? 'border-gray-300 scale-110' : 'border-white'}`}
                                    style={{backgroundColor: c}}
                                  />
                              ))}
                          </div>
                          <div className="flex gap-2 text-gray-400 bg-gray-50 p-2 rounded-2xl">
                              <button onClick={() => setTool('BRUSH')} className={`p-3 rounded-xl transition-colors ${tool==='BRUSH'?'bg-blue-100 text-blue-600 shadow-sm':''}`}><Brush size={28}/></button>
                              <button onClick={() => setTool('ERASER')} className={`p-3 rounded-xl transition-colors ${tool==='ERASER'?'bg-pink-100 text-pink-600 shadow-sm':''}`}><Eraser size={28}/></button>
                              <button onClick={clearCanvas} className="p-3 hover:text-red-500"><Trash2 size={28}/></button>
                          </div>
                      </div>
                      
                      {/* Canvas with Glow Border */}
                      <div className="w-full aspect-square md:h-96 bg-white rounded-[2.5rem] border-[8px] border-blue-200 overflow-hidden relative cursor-crosshair touch-none shadow-[0_0_20px_rgba(147,197,253,0.5)]">
                          <canvas 
                            ref={canvasRef} 
                            className="w-full h-full"
                            onMouseDown={startDraw}
                            onMouseMove={draw}
                            onMouseUp={stopDraw}
                            onMouseLeave={stopDraw}
                            onTouchStart={startDraw}
                            onTouchMove={draw}
                            onTouchEnd={stopDraw}
                          />
                      </div>
                  </div>
              )}

              <button 
                onClick={handleGenerate} 
                disabled={!nameInput}
                className={`w-full py-6 rounded-[2rem] font-bold text-3xl shadow-[0_10px_30px_rgba(236,72,153,0.3)] transition-all transform mt-8 border-b-8 active:border-b-0 active:translate-y-2
                    ${!nameInput ? 'bg-gray-200 border-gray-300 text-gray-400' : 'bg-gradient-to-r from-pink-500 to-purple-500 border-purple-700 text-white hover:scale-[1.02]'}
                `}
              >
                  ✨ OLUŞTUR ✨
              </button>
           </div>
       ) : (
           <div className="flex flex-col items-center w-full max-w-lg">
               <div className="relative p-3 bg-gradient-to-br from-pink-200 via-purple-200 to-blue-200 rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] mb-10 transform hover:scale-105 transition-transform duration-500">
                   <div className="absolute top-0 left-0 w-full h-full bg-white/50 rounded-[3rem] blur-xl -z-10"></div>
                   <img src={previewImage} className="w-96 h-96 rounded-[2.5rem] object-cover bg-white shadow-inner" />
                   <div className="absolute -top-6 -right-6 text-7xl animate-bounce">🌟</div>
                   <div className="absolute -bottom-4 -left-4 text-6xl animate-pulse delay-100">✨</div>
               </div>
               
               <div className="flex gap-6 w-full">
                   <button onClick={() => setStep('INPUT')} className="flex-1 bg-white text-gray-500 p-6 rounded-[2rem] font-bold text-2xl shadow-xl border-b-8 border-gray-200 active:border-b-0 active:translate-y-2 flex items-center justify-center gap-3 hover:bg-gray-50">
                       <RefreshCw/> Tekrar
                   </button>
                   <button onClick={handleSave} className="flex-1 bg-emerald-500 text-white p-6 rounded-[2rem] font-bold text-2xl shadow-xl border-b-8 border-emerald-700 active:border-b-0 active:translate-y-2 flex items-center justify-center gap-3 hover:bg-emerald-400 animate-pulse">
                       <Check/> KAYDET
                   </button>
               </div>
           </div>
       )}
    </div>
  );
};