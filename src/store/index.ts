import { create } from 'zustand';
import type { AppState } from '../types';

export const useStore = create<AppState>((set) => ({
  currentThreadId: null,
  pinVerified: false,
  chatModel: 'Llama-3-8B-Instruct-q4f16_1-MLC',
  ideModel: 'Llama-3-8B-Instruct-q4f16_1-MLC',
  mediaModel: 'Llama-3-8B-Instruct-q4f16_1-MLC',
  activeView: 'chat',
  setCurrentThreadId: (id) => set({ currentThreadId: id }),
  setPinVerified: (verified) => set({ pinVerified: verified }),
  setChatModel: (model) => set({ chatModel: model }),
  setIdeModel: (model) => set({ ideModel: model }),
  setMediaModel: (model) => set({ mediaModel: model }),
  setActiveView: (view) => set({ activeView: view }),
}));
