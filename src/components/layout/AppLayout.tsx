import React from 'react';
import { useStore } from '../../store';
import { Flame, Settings, Code, Image as ImageIcon, Trash2, MessageSquare } from 'lucide-react';
import { cn } from '../../lib/utils';
import { db } from '../../db/database';
import { useLiveQuery } from 'dexie-react-hooks';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { currentThreadId, setCurrentThreadId, activeView, setActiveView } = useStore();
  const threads = useLiveQuery(() => db.threads.orderBy('updatedAt').reverse().toArray()) || [];

  const createNewThread = async () => {
    const id = crypto.randomUUID();
    await db.threads.add({
      id,
      title: 'New Incantation',
      updatedAt: Date.now()
    });
    setCurrentThreadId(id);
    setActiveView('chat');
  };

  const deleteThread = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await db.messages.where('threadId').equals(id).delete();
    await db.threads.delete(id);
    if (currentThreadId === id) {
      setCurrentThreadId(null);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-forge-900 text-gray-200">
      {/* Sidebar */}
      <div className="w-72 flex-shrink-0 border-r border-forge-700 bg-forge-900 flex flex-col z-10 shadow-[5px_0_20px_rgba(0,0,0,0.9)] relative">
        <div className="absolute inset-0 bg-gradient-to-b from-brimstone-500/5 to-transparent pointer-events-none" />

        <div className="p-6 border-b border-forge-700/50 flex flex-col items-center gap-3 relative">
          <div className="relative">
            <Flame className="w-10 h-10 text-brimstone-500 animate-pulse drop-shadow-[0_0_15px_rgba(255,69,0,0.8)]" />
            <div className="absolute inset-0 bg-brimstone-500/20 blur-xl rounded-full animate-pulse" />
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-400 tracking-widest uppercase mb-1 opacity-80">Wizard Productions AI Studio</div>
            <h1 className="text-4xl uppercase magma-text font-sans tracking-widest">WPAI</h1>
            <div className="text-[10px] text-gray-500 tracking-[0.2em] uppercase mt-2 opacity-80">Forging the future of creative media</div>
          </div>
        </div>

        <div className="p-4 flex-1 overflow-y-auto relative z-10">
          <button
            onClick={createNewThread}
            className="w-full py-3 mb-6 bg-forge-800 hover:bg-blood-500/20 text-brimstone-400 hover:text-brimstone-500 border border-forge-700 hover:border-brimstone-500/50 transition-all rounded-md shadow-[0_4px_10px_rgba(0,0,0,0.5)] font-bold tracking-wide uppercase text-sm flex items-center justify-center gap-2"
          >
            <Flame className="w-4 h-4" /> IGNITE NEW
          </button>

          <div className="space-y-2">
            {threads.map(t => (
              <div
                key={t.id}
                onClick={() => { setCurrentThreadId(t.id); setActiveView('chat'); }}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 rounded-md text-sm cursor-pointer transition-all border group",
                  currentThreadId === t.id && activeView === 'chat'
                    ? "bg-forge-800 border-brimstone-500/50 text-gray-100 shadow-[inset_0_0_15px_rgba(255,69,0,0.1)]"
                    : "border-transparent hover:bg-forge-800/50 hover:border-forge-700 text-gray-500"
                )}
              >
                <div className="flex items-center gap-2 truncate">
                  <MessageSquare className="w-4 h-4 flex-shrink-0 opacity-50" />
                  <span className="truncate">{t.title}</span>
                </div>
                <button
                  onClick={(e) => deleteThread(e, t.id)}
                  className="text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Extinguish"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-forge-700/50 relative z-10 bg-forge-900 space-y-2">
          <button
            onClick={() => setActiveView('ide')}
            className={cn(
              "flex items-center gap-3 w-full px-4 py-3 rounded-md transition-all font-bold tracking-wide uppercase text-sm border",
              activeView === 'ide'
                ? "text-brimstone-500 bg-forge-800 border-brimstone-500/50 shadow-[inset_0_0_15px_rgba(255,69,0,0.1)]"
                : "text-gray-500 hover:text-gray-300 border-transparent hover:bg-forge-800/50 hover:border-forge-700"
            )}
          >
            <Code className="w-4 h-4" />
            <span>IDE</span>
          </button>
          <button
            onClick={() => setActiveView('media')}
            className={cn(
              "flex items-center gap-3 w-full px-4 py-3 rounded-md transition-all font-bold tracking-wide uppercase text-sm border",
              activeView === 'media'
                ? "text-brimstone-500 bg-forge-800 border-brimstone-500/50 shadow-[inset_0_0_15px_rgba(255,69,0,0.1)]"
                : "text-gray-500 hover:text-gray-300 border-transparent hover:bg-forge-800/50 hover:border-forge-700"
            )}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Media</span>
          </button>
          <button
            onClick={() => setActiveView('dashboard')}
            className={cn(
              "flex items-center gap-3 w-full px-4 py-3 rounded-md transition-all font-bold tracking-wide uppercase text-sm border",
              activeView === 'dashboard'
                ? "text-brimstone-500 bg-forge-800 border-brimstone-500/50 shadow-[inset_0_0_15px_rgba(255,69,0,0.1)]"
                : "text-gray-500 hover:text-gray-300 border-transparent hover:bg-forge-800/50 hover:border-forge-700"
            )}
          >
            <Settings className="w-4 h-4" />
            <span>Config</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative z-0 flex flex-col bg-transparent">
        {children}
      </div>
    </div>
  );
}
