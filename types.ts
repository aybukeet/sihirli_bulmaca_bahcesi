export interface Character {
  id: string;
  name: string;
  imageUrl: string;
  description: string;
  stickers: string[]; // Emojis won as rewards
}

export enum GameMode {
  MENU = 'MENU',
  GAME_SELECTION = 'GAME_SELECTION', // New mode for the secondary menu
  CHARACTER_CREATOR = 'CHARACTER_CREATOR',
  DECRYPTION = 'DECRYPTION',
  CUBE = 'CUBE',
  PATTERN = 'PATTERN',
  STORY = 'STORY',
  FIND_DIFF = 'FIND_DIFF',
  MEMORY_MATCH = 'MEMORY_MATCH',
  PUZZLE_GAME = 'PUZZLE_GAME',
  SPATIAL_DIRECTION = 'SPATIAL_DIRECTION',
  LABYRINTH_GAME = 'LABYRINTH_GAME',
  VIDEO_CREATOR = 'VIDEO_CREATOR'
}

export enum SoundState {
  IDLE = 'IDLE',
  LISTENING = 'LISTENING',
  PROCESSING = 'PROCESSING',
  SPEAKING = 'SPEAKING',
}