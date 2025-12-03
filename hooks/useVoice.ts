import { useContext } from 'react';
import { VoiceContext } from '../voice/VoiceEngine';

export const useVoice = () => {
  return useContext(VoiceContext);
};