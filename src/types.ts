export interface Thread {
  id: string;
  title: string;
  updatedAt: number;
}

export interface Message {
  id: string;
  threadId: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: number;
  metadata?: any;
}

export interface AppState {
  currentThreadId: string | null;
  pinVerified: boolean;
  chatModel: string;
  ideModel: string;
  mediaModel: string;
  activeView: 'chat' | 'dashboard' | 'ide' | 'media';
  setCurrentThreadId: (id: string | null) => void;
  setPinVerified: (verified: boolean) => void;
  setChatModel: (model: string) => void;
  setIdeModel: (model: string) => void;
  setMediaModel: (model: string) => void;
  setActiveView: (view: 'chat' | 'dashboard' | 'ide' | 'media') => void;
}
