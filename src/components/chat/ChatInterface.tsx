import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store';
import { db } from '../../db/database';
import { useLiveQuery } from 'dexie-react-hooks';
import { Send, Loader2, Bot, User, Wrench } from 'lucide-react';
import Markdown from 'react-markdown';
import { initEngine, getEngine, getAvailableModels } from '../../lib/llm';
import { cn } from '../../lib/utils';
import { buildSystemPrompt, readPersona } from '../../lib/persona';

export function ChatInterface() {
  const { currentThreadId, chatModel, setChatModel } = useStore();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');

  const messages = useLiveQuery(
    () => currentThreadId ? db.messages.where('threadId').equals(currentThreadId).sortBy('timestamp') : [],
    [currentThreadId]
  ) || [];

  const bottomRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || !currentThreadId) return;

    const userMsg = input;
    setInput('');
    setIsLoading(true);

    try {
      await db.messages.add({
        id: crypto.randomUUID(),
        threadId: currentThreadId,
        role: 'user',
        content: userMsg,
        timestamp: Date.now()
      });

      if (messages.length === 0) {
        await db.threads.update(currentThreadId, { title: userMsg.slice(0, 30) + '...' });
      }

      let engine = getEngine();
      if (!engine) {
        setLoadingStatus('Forging local connection to demon realm (Downloading Model)...');
        engine = await initEngine(chatModel, (report) => {
          setLoadingStatus(`Forging: ${report.text}`);
        });
      }

      let history = messages.map(m => ({ role: m.role, content: m.content }));

      // Sliding window to prevent exceeding context limit
      if (history.length > 10) {
        history = history.slice(history.length - 10);
      }
      history.push({ role: 'user', content: userMsg });

      setLoadingStatus('Communing with the deep...');

      const systemPrompt = buildSystemPrompt(readPersona(localStorage));
      const completion = await engine.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          ...history as any
        ],
        temperature: 0.7,
      });

      const reply = completion.choices[0].message.content || '...silence...';

      await db.messages.add({
        id: crypto.randomUUID(),
        threadId: currentThreadId,
        role: 'assistant',
        content: reply,
        timestamp: Date.now()
      });

      await db.threads.update(currentThreadId, { updatedAt: Date.now() });

    } catch (err: any) {
      console.error(err);
      await db.messages.add({
        id: crypto.randomUUID(),
        threadId: currentThreadId,
        role: 'system',
        content: `**ERROR SUMMONING ENTITY:** ${err.message}`,
        timestamp: Date.now()
      });
    } finally {
      setIsLoading(false);
      setLoadingStatus('');
    }
  };

  if (!currentThreadId) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center text-forge-600">
        <div className="w-32 h-32 rounded-full border-4 border-forge-600/50 flex items-center justify-center mb-6 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] bg-forge-900">
          <div className="w-24 h-24 rounded-full border-2 border-brimstone-500/20 flex items-center justify-center animate-[spin_20s_linear_infinite]">
            <div className="w-16 h-16 rounded-full bg-brimstone-500/5 shadow-[0_0_30px_rgba(255,69,0,0.2)] animate-pulse" />
          </div>
        </div>
        <p className="font-sans text-xl tracking-[0.3em] text-gray-500 uppercase">Awaiting Ignition</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative">
      <div className="absolute top-4 right-4 z-20">
        <select
          value={chatModel}
          onChange={(e) => setChatModel(e.target.value)}
          className="bg-forge-900 border border-forge-700 text-gray-300 text-xs rounded px-2 py-1 focus:outline-none focus:border-brimstone-500"
        >
          {getAvailableModels().map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 pt-16">
        {messages.length === 0 && (
          <div className="text-center py-20 text-gray-500 font-sans tracking-widest uppercase text-sm">
            The forge is cold. Speak to ignite it.
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={cn("flex w-full", m.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div className={cn(
              "flex gap-4 max-w-[85%] md:max-w-[75%]",
              m.role === 'user' ? 'flex-row-reverse' : 'flex-row'
            )}>
              <div className="flex-shrink-0 mt-1">
                {m.role === 'user' && <div className="w-8 h-8 rounded bg-forge-700 flex items-center justify-center border border-forge-600 shadow-[0_2px_5px_rgba(0,0,0,0.5)]"><User className="w-4 h-4 text-gray-400" /></div>}
                {m.role === 'assistant' && <div className="w-8 h-8 rounded bg-gradient-to-br from-brimstone-500 to-blood-500 flex items-center justify-center shadow-[0_0_15px_rgba(255,69,0,0.3)] border border-brimstone-400/50"><Bot className="w-4 h-4 text-white" /></div>}
                {m.role === 'system' && <div className="w-8 h-8 rounded bg-forge-800 flex items-center justify-center border border-blood-500/50 animate-pulse"><Loader2 className="w-4 h-4 text-blood-500" /></div>}
                {m.role === 'tool' && <div className="w-8 h-8 rounded bg-forge-800 flex items-center justify-center border border-forge-600"><Wrench className="w-3 h-3 text-gray-500" /></div>}
              </div>

              <div className={cn(
                "rounded-lg p-5 shadow-[0_10px_30px_rgba(0,0,0,0.5)]",
                m.role === 'user' ? 'industrial-panel text-gray-200' :
                m.role === 'system' ? 'bg-forge-900 border border-blood-500/50 text-red-400 font-mono text-sm' :
                m.role === 'tool' ? 'bg-forge-900 border border-forge-600 text-gray-400 font-mono text-sm' :
                'bg-forge-800 border border-forge-700 text-gray-300'
              )}>
                {m.role === 'tool' && (
                  <p className="text-xs text-amber-400 mb-2">Legacy simulated tool message; no action was executed.</p>
                )}
                <div className="markdown-body">
                  <Markdown>{m.content}</Markdown>
                </div>
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start w-full">
            <div className="flex gap-4 max-w-[85%] flex-row">
              <div className="flex-shrink-0 mt-1">
                <div className="w-8 h-8 rounded bg-forge-800 flex items-center justify-center border border-brimstone-500/30 animate-pulse shadow-[0_0_10px_rgba(255,69,0,0.2)]">
                  <Bot className="w-4 h-4 text-brimstone-500/70" />
                </div>
              </div>
              <div className="industrial-panel rounded-lg p-4 text-gray-400 flex items-center gap-3">
                <Loader2 className="w-4 h-4 animate-spin text-brimstone-500" />
                <span className="text-sm font-sans tracking-wide">{loadingStatus}</span>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 sm:p-6 bg-forge-900 border-t border-forge-700 z-10">
        <form onSubmit={handleSend} className="relative max-w-4xl mx-auto flex gap-4 items-end">
          <div className="relative flex-1">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={isLoading}
              placeholder="Inscribe your intent... (Shift+Enter for new line)"
              className="w-full bg-forge-800/50 border border-forge-600/50 focus:border-brimstone-500/50 rounded-lg pl-4 pr-4 py-4 text-gray-200 placeholder-forge-600 focus:outline-none focus:ring-1 focus:ring-brimstone-500/50 transition-all font-sans resize-none min-h-[60px] max-h-32 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]"
              rows={1}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-4 bg-forge-800 border border-forge-600 hover:border-brimstone-500/50 hover:bg-forge-700 text-brimstone-500 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_10px_rgba(0,0,0,0.5)] hover:shadow-[0_0_15px_rgba(255,69,0,0.3)] group"
          >
            <Send className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>
        </form>
      </div>
    </div>
  );
}
