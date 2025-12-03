import { GoogleGenAI, Modality } from "@google/genai";
import { decodeAudioData } from "../utils/audioUtils";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Shared AudioContext to prevent running out of hardware resources
let audioContext: AudioContext | null = null;

const getAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  }
  return audioContext;
};

// Helper to strip markdown code blocks
const cleanJsonString = (str: string): string => {
  return str.replace(/```json/g, '').replace(/```/g, '').trim();
};

// --- Text Generation ---
export const generateText = async (prompt: string, systemInstruction?: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { systemInstruction }
    });
    return response.text;
  } catch (error) {
    console.error("Text Gen Error:", error);
    throw error;
  }
};

// --- Image Generation (Characters) ---
export const generateCharacterImage = async (description: string, referenceImageBase64?: string): Promise<string> => {
  try {
    let contents: any;
    
    // Strict instruction to prevent text/labels on the image
    const negativePrompt = "no text, no letters, no labels, no watermark, no signature, white background only";
    
    if (referenceImageBase64) {
        // Image-to-Image (Sketch to Render)
        contents = {
            parts: [
                {
                    inlineData: {
                        mimeType: 'image/png',
                        data: referenceImageBase64
                    }
                },
                {
                    text: `Turn this child's drawing into a cute, high-quality 3D rendered character. Keep the colors and shape. Style: Hay Day cute cartoon, magical garden theme, soft lighting, 3d render. ${description}. ${negativePrompt}`
                }
            ]
        };
    } else {
        // Text-to-Image
        contents = `A cute, 3D rendered, Hay Day style cartoon character for a kids game: ${description}. White background, bright pastel colors, soft lighting, high quality render, isometric view. ${negativePrompt}`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: contents,
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
         return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image generated");
  } catch (error) {
    console.error("Image Gen Error:", error);
    return `https://picsum.photos/200/200?random=${Math.random()}`;
  }
};

// --- Video Frame Generation (Storyboarding) ---
export const generateVideoFrames = async (prompt: string): Promise<string[]> => {
  try {
    const basePrompt = `Generate a cute, pastel, 3D rendered scene for a kids story.
    Story context: "${prompt}".
    Style: 3D cartoon, soft lighting, toy-like, pastel colors (mint green, baby blue, pink, soft yellow), magic garden theme.
    Constraint: NO text in image. High quality 3d render. Same composition style.`;
    
    const sequencePrompts = [
        `${basePrompt} Scene 1: The beginning. Establish the characters and setting.`,
        `${basePrompt} Scene 2: The middle. The action is happening.`,
        `${basePrompt} Scene 3: The end. The conclusion of the moment.`
    ];

    // Generate 3 frames in parallel
    const promises = sequencePrompts.map(p => 
        ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: p,
        })
    );

    const responses = await Promise.all(promises);
    const images: string[] = [];

    for (const res of responses) {
        const part = res.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
        if (part?.inlineData?.data) {
            images.push(`data:image/png;base64,${part.inlineData.data}`);
        }
    }
    
    return images;

  } catch (error) {
    console.error("Frame Gen Error:", error);
    return [];
  }
};

// --- Video Generation (Deprecated / Fallback) ---
export const generateVideo = async (prompt: string): Promise<string | null> => {
  return null; // Video generation replaced by Frame generation
};


// --- Text to Speech (Generates AND Plays) ---
export const speakText = async (text: string): Promise<void> => {
  if (!('speechSynthesis' in window)) return;
  
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'tr-TR';
  
  // Fairy-like settings
  utterance.rate = 0.85; 
  utterance.pitch = 1.4; 
  
  const voices = window.speechSynthesis.getVoices();
  const trVoice = voices.find(v => v.lang.includes('tr'));
  if (trVoice) utterance.voice = trVoice;

  window.speechSynthesis.speak(utterance);
};

const CHARACTER_PARSER_INSTRUCTION = `
You are a speech-to-text meaning extractor.

Your ONLY job:
Given anything a child says, extract:

1. "name"
2. "description"

Rules:
- Do not talk.
- Do not read anything aloud.
- Do not explain.
- Do not add extra text.
- Only output this JSON:

{
 "name": "...",
 "description": "..."
}

Examples:

Child: "Karakterimin adı Limon. Sarı elbiseli bir kedi olsun."
Output:
{
 "name": "Limon",
 "description": "sarı elbiseli bir kedi"
}

Child: "Adı Boncuk olsun. Üstü pembe. Saçları mor."
Output:
{
 "name": "Boncuk",
 "description": "pembe kıyafetli, mor saçlı"
}
`;

// --- Audio Transcription & Intent Parsing ---
export const transcribeAudio = async (audioBase64: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "audio/webm",
              data: audioBase64
            }
          },
          {
            text: CHARACTER_PARSER_INSTRUCTION
          }
        ]
      },
      config: {
        responseMimeType: "application/json"
      }
    });
    
    return cleanJsonString(response.text || "{}");
  } catch (error) {
    console.error("Transcription Error:", error);
    return "{}";
  }
};

// --- Analyze Text Input (For typed input) ---
export const analyzeCharacterText = async (text: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Text input: "${text}". ` + CHARACTER_PARSER_INSTRUCTION,
      config: {
        responseMimeType: "application/json"
      }
    });
    return cleanJsonString(response.text || "{}");
  } catch (error) {
    console.error("Text Analysis Error:", error);
    return JSON.stringify({ name: "", description: text });
  }
};

// --- Game Content Generation ---
export const generateGameContent = async (mode: string, level: number, characters: any[] = []): Promise<any> => {
  let prompt = "";
  
  // Base system instruction for Game Logic Generation
  const commonInstruction = `You are generating logic for a children's visual puzzle game.
  IMPORTANT RULES:
  - Do NOT use TTS.
  - Do NOT read anything aloud.
  - The game must stay silent.
  - Never add text to the puzzles.
  - Always use visual logic only.
  - Output valid JSON.
  `;

  // Format characters for the model to understand the context
  const charMap = characters.map((c, i) => `char${String(i+1).padStart(2, '0')}`);
  const context = `Available Character IDs: ${charMap.join(', ')}. Use these IDs in your sequences.`;

  switch (mode) {
    case 'DECRYPTION':
      prompt = `
      ${context}
      Create a "Symbol-to-Number" code puzzle.
      - Select 3 random characters from the available IDs.
      - Assign a random single-digit number (1-9) to each character.
      - Create a "questionSequence" using these characters (length 3).
      - Calculate the answer string (e.g. if char1=2, char2=5, sequence=[char1, char2] answer="25").
      
      Output JSON format:
      {
        "type": "decryption_puzzle",
        "legend": [
          { "charId": "char01", "number": 2 },
          { "charId": "char02", "number": 5 },
          { "charId": "char03", "number": 9 }
        ],
        "questionSequence": ["char02", "char01", "char03"],
        "answer": "529"
      }
      `;
      break;
    case 'PATTERN':
      prompt = `Create a pattern completion task using emojis or simple shapes. Level ${level}.
      The sequence should have one missing item represented by '?'.
      Example format: { "question": "Sıradaki ne?", "sequence": ["🔴", "🔵", "🔴", "?"], "options": ["🔴", "🔵", "🟢"], "answer": "🔵" }`;
      break;
    case 'CUBE':
      const cubeTypes = [
          'missing_face',
          'cube_net',
          'neighbor_logic',
          'rotation',
          'same_diff'
      ];
      const selectedType = cubeTypes[Math.floor(Math.random() * cubeTypes.length)];
      
      let typeSpecificPrompt = "";
      if (selectedType === 'missing_face') {
        typeSpecificPrompt = `Task: Missing Face. "One face is hidden (?). Pick the correct symbol." Image: Cube with 3 faces (Square, Circle, ?) visible. Options: [Triangle, Star, Cross].`;
      } else if (selectedType === 'cube_net') {
        typeSpecificPrompt = `Task: Cube Net. "Unfolded cube. Which face is opposite to Red?" Image: Colorful net. Options: [Blue, Yellow, Green].`;
      } else if (selectedType === 'neighbor_logic') {
        typeSpecificPrompt = `Task: Neighbor Logic. "What is to the right of the Blue face?" Image: Cube view. Options: [Red, Yellow, Green].`;
      } else if (selectedType === 'rotation') {
        typeSpecificPrompt = `Task: Rotation. "Rotate this cube to the right. Which view is correct?" Image: Initial cube. Options: [View A, View B, View C].`;
      } else {
        typeSpecificPrompt = `Task: Same/Different. "Are these two cubes the same?" Image: Two cubes. Options: ["Aynı", "Farklı"].`;
      }

      prompt = `Create a 3D Shape Spatial Reasoning puzzle for a 5-year-old.
      Type: ${selectedType}.
      ${typeSpecificPrompt}
      
      Required Output JSON format: 
      { 
        "question": "Short question text in Turkish", 
        "imageDescription": "Detailed visual description of the 3D shape/scene for generation",
        "options": ["Option1", "Option2", "Option3"], 
        "answer": "CorrectOption" 
      }
      `;
      break;
    case 'STORY':
      prompt = `Create a 3-step Story Sequencing puzzle about animals in the forest.
      Output format:
      {
         "type": "story_order",
         "steps": [
            { "id": 1, "imageDescription": "A cute bunny waking up in a burrow, morning sun" },
            { "id": 2, "imageDescription": "The bunny finding a big orange carrot in the garden" },
            { "id": 3, "imageDescription": "The bunny eating the carrot happily" }
         ]
      }
      Return the steps in the CORRECT logical order (1, 2, 3). The frontend will shuffle them.
      `;
      break;
    case 'FIND_DIFF':
      prompt = `Create a scene description for a "Find the Differences" game for kids.
      Theme: Forest, Animals, Picnic or Playground.
      
      Output format:
      {
        "type": "find_diff",
        "imageDescription": "A cheerful forest scene with a bear eating honey near a tree, blue sky, green grass, flowers."
      }
      `;
      break;
    case 'MEMORY_MATCH':
      prompt = `Create a list of 6 distinct emojis for a Memory Match game. Theme: Animals or Fruits.
      Output format:
      {
        "type": "memory_match",
        "emojis": ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊"]
      }
      `;
      break;
    case 'PUZZLE_GAME':
      prompt = `Create a description for a cute 3D cartoon image suitable for a sliding tile puzzle. Theme: Forest Animals.
      Output format:
      {
        "type": "puzzle_game",
        "imageDescription": "A cute squirrel sitting on a pile of acorns in a sunny forest."
      }
      `;
      break;
    case 'SPATIAL_DIRECTION':
      prompt = `Create a Spatial Direction question for kids.
      Example: "Where is the butterfly?" (Above the flower).
      Output format:
      {
        "type": "spatial_direction",
        "question": "Kelebek çiçeğin neresinde?",
        "imageDescription": "A scene with a large red flower and a blue butterfly flying directly ABOVE it.",
        "options": ["Üstünde", "Altında", "Yanında"],
        "answer": "Üstünde"
      }
      `;
      break;
    case 'LABYRINTH_GAME':
      prompt = `Create a simple 5x5 maze grid for a 5-year-old child's game.
      0 = Path, 1 = Wall.
      Ensure there is a valid simple path from top-left [0,0] to bottom-right [4,4].
      Walls should not be too dense.
      
      Output JSON format:
      {
        "type": "labyrinth",
        "grid": [
          [0, 0, 1, 0, 0],
          [1, 0, 0, 0, 1],
          [0, 0, 1, 0, 0],
          [0, 1, 1, 1, 0],
          [0, 0, 0, 0, 0]
        ],
        "start": [0, 0],
        "end": [4, 4]
      }
      `;
      break;
    default:
      return null;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: commonInstruction,
        responseMimeType: "application/json"
      }
    });
    
    const text = cleanJsonString(response.text || "");
    if (!text) return null;
    return JSON.parse(text);
  } catch (error) {
    console.error("Game Content Gen Error:", error);
    return null;
  }
};