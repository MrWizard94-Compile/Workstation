import React, { useState, useEffect, useRef } from 'react';
import { Code2, Terminal, Play, FolderTree, Search, FileCode2, Settings, Plus, Trash2, Send, Loader2, Eye, Layout } from 'lucide-react';
import { useStore } from '../../store';
import { getAvailableModels, getEngine, initEngine } from '../../lib/llm';
import { readDir, readFile, writeFile, deleteFile, VFile } from '../../lib/vfs';

export function IdeView() {
  const { ideModel, setIdeModel } = useStore();

  const [files, setFiles] = useState<VFile[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [viewMode, setViewMode] = useState<'code' | 'preview'>('code');
  const [previewUrl, setPreviewUrl] = useState('');

  const [terminalInput, setTerminalInput] = useState('');
  const [terminalLog, setTerminalLog] = useState<{role: string, content: string}[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadFiles();
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLog]);

  const loadFiles = async () => {
    const fs = await readDir();
    setFiles(fs);
    if (fs.length > 0 && !activeFile) {
      handleOpenFile(fs[0].path);
    }
  };

  const handleOpenFile = async (path: string) => {
    setActiveFile(path);
    const content = await readFile(path);
    setFileContent(content);
  };

  const handleCreateFile = async () => {
    const name = prompt('Enter file name (e.g., index.html):');
    if (name) {
      await writeFile(name, '<!-- new file -->');
      await loadFiles();
      handleOpenFile(name);
    }
  };

  const handleDeleteFile = async (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Delete ${path}?`)) {
      await deleteFile(path);
      if (activeFile === path) {
        setActiveFile(null);
        setFileContent('');
      }
      loadFiles();
    }
  };

  const handleSave = async (content: string) => {
    setFileContent(content);
    if (activeFile) {
      await writeFile(activeFile, content);
      loadFiles();
    }
  };

  const updatePreview = async () => {
    try {
      const fs = await readDir();
      const indexFile = fs.find(f => f.path === 'index.html');

      let htmlContent = indexFile ? await readFile(indexFile.path) : '<h1>No index.html found</h1>';

      // Inject CSS if style.css exists
      const cssFile = fs.find(f => f.path === 'style.css');
      if (cssFile) {
        const cssContent = await readFile(cssFile.path);
        htmlContent = htmlContent.replace('</head>', `<style>${cssContent}</style></head>`);
      }

      // Inject JS if script.js exists
      const jsFile = fs.find(f => f.path === 'script.js');
      if (jsFile) {
        const jsContent = await readFile(jsFile.path);
        htmlContent = htmlContent.replace('</body>', `<script>${jsContent}</script></body>`);
      }

      const blob = new Blob([htmlContent], { type: 'text/html' });
      setPreviewUrl(URL.createObjectURL(blob));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (viewMode === 'preview') {
      updatePreview();
    }
  }, [viewMode, files, fileContent]);

  const executeAgentCommand = async (input: string) => {
    if (!input.trim()) return;

    setTerminalLog(prev => [...prev, { role: 'user', content: input }]);
    setTerminalInput('');
    setIsProcessing(true);

    try {
      let engine = getEngine();
      if (!engine) {
        setTerminalLog(prev => [...prev, { role: 'system', content: `Forging local connection to demon realm (${ideModel})...` }]);
        engine = await initEngine(ideModel, (report) => {});
      }

      const fs = await readDir();
      let fileContext = 'CURRENT VIRTUAL FILESYSTEM:\n';
      for (const f of fs) {
        const c = await readFile(f.path);
        fileContext += `\n--- FILE: ${f.path} ---\n${c}\n--- END FILE ---\n`;
      }

      const systemPrompt = `You are a demonic AI coding agent bound to the Hell Forge.
You act like Codex or Claude Desktop, capable of reading and modifying files.
You MUST output your response and, if you wish to write or overwrite a file, you MUST use the exact format:
[WRITE_FILE path/to/file.ext]
file content goes here
[/WRITE_FILE]

If you want to read a file, it's already provided in the context below.
You should be helpful, concise, and edgy. Always ensure the user has a working index.html if you are generating web apps.

${fileContext}`;

      const chatHistory = terminalLog.map(l => ({ role: l.role as any, content: l.content }));
      chatHistory.push({ role: 'user', content: input });
      const recentHistory = chatHistory.slice(-10);

      const request = {
        messages: [
          { role: 'system', content: systemPrompt },
          ...recentHistory
        ]
      };

      const completion = await engine.chat.completions.create(request as any);
      const responseText = completion.choices[0]?.message?.content || 'The forge is silent.';

      setTerminalLog(prev => [...prev, { role: 'assistant', content: responseText }]);

      const writeRegex = /\[WRITE_FILE\s+(.+?)\]([\s\S]*?)\[\/WRITE_FILE\]/g;
      let match;
      let wroteFiles = false;
      while ((match = writeRegex.exec(responseText)) !== null) {
        const path = match[1].trim();
        const content = match[2].trim();
        await writeFile(path, content);
        wroteFiles = true;
      }

      if (wroteFiles) {
        await loadFiles();
        if (activeFile) {
          const updated = await readFile(activeFile).catch(() => null);
          if (updated) setFileContent(updated);
        }
      }
    } catch (e: any) {
      setTerminalLog(prev => [...prev, { role: 'system', content: `ERROR: ${e.message}` }]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold font-sans tracking-widest text-gray-200 uppercase flex items-center gap-3">
            <Layout className="w-8 h-8 text-brimstone-500" />
            Forge Codex
          </h2>
          <p className="text-gray-500">Claude-style Artifacts & Agent IDE.</p>
        </div>

        <select
          value={ideModel}
          onChange={(e) => setIdeModel(e.target.value)}
          className="bg-forge-900 border border-forge-700 text-gray-300 text-xs rounded px-2 py-1 focus:outline-none focus:border-brimstone-500"
        >
          {getAvailableModels().map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">

        {/* Left Panel: Codex Chat */}
        <div className="w-[400px] industrial-panel rounded-lg flex flex-col overflow-hidden flex-shrink-0">
          <div className="bg-forge-900 border-b border-forge-700 p-3 flex items-center gap-3">
            <Terminal className="text-forge-600 w-5 h-5" />
            <span className="font-mono text-sm text-gray-400 uppercase tracking-widest">Agent Chat</span>
          </div>
          <div className="flex-1 p-4 bg-forge-900/50 overflow-y-auto custom-scrollbar space-y-4">
            {terminalLog.length === 0 && (
              <div className="text-center py-10 text-gray-600 font-sans tracking-widest uppercase text-xs">
                Agent is dormant. Ask it to build a web app.
              </div>
            )}
            {terminalLog.map((log, i) => (
              <div key={i} className={`flex flex-col ${log.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`px-4 py-3 rounded-lg max-w-[95%] text-sm font-sans leading-relaxed ${
                  log.role === 'user' ? 'bg-forge-700 text-gray-200' :
                  log.role === 'system' ? 'text-red-500 border border-red-500/20' : 'bg-forge-800 text-brimstone-100 border border-brimstone-500/20'
                }`}>
                  <div className="prose prose-invert prose-sm max-w-none">
                    {/* Just render simple text for now, or you could add react-markdown here */}
                    {log.content.split('\n').map((line, j) => (
                       <p key={j} className="m-0 min-h-[1em]">{line}</p>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex items-center gap-2 text-brimstone-500 font-mono text-xs p-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Forging response...
              </div>
            )}
            <div ref={logEndRef} />
          </div>
          <div className="p-4 bg-forge-900 border-t border-forge-700">
            <form
              onSubmit={(e) => { e.preventDefault(); executeAgentCommand(terminalInput); }}
              className="flex items-end gap-2 bg-forge-800 rounded-lg border border-forge-600 p-2 focus-within:border-brimstone-500 transition-colors"
            >
              <textarea
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    executeAgentCommand(terminalInput);
                  }
                }}
                placeholder="Ask Codex to build something..."
                disabled={isProcessing}
                className="flex-1 bg-transparent border-none px-2 py-1 text-sm text-gray-200 focus:outline-none resize-none max-h-32 min-h-[40px] custom-scrollbar"
                rows={1}
              />
              <button
                type="submit"
                disabled={isProcessing || !terminalInput.trim()}
                className="p-2 bg-brimstone-500 text-white rounded hover:bg-brimstone-400 disabled:opacity-50 transition-colors flex-shrink-0 mb-1"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Right Panel: Artifacts / Editor */}
        <div className="flex-1 industrial-panel rounded-lg flex flex-col overflow-hidden min-w-0 bg-[#0a0a0c]">
          <div className="bg-forge-900 border-b border-forge-700 p-0 flex items-center justify-between">
            <div className="flex">
              <button
                onClick={() => setViewMode('code')}
                className={`px-6 py-3 font-sans text-sm tracking-widest uppercase transition-colors border-r border-forge-700 ${viewMode === 'code' ? 'bg-[#0a0a0c] text-brimstone-500 font-bold border-b-2 border-b-brimstone-500' : 'text-gray-500 hover:text-gray-300 hover:bg-forge-800'}`}
              >
                <div className="flex items-center gap-2">
                  <Code2 className="w-4 h-4" /> Code
                </div>
              </button>
              <button
                onClick={() => setViewMode('preview')}
                className={`px-6 py-3 font-sans text-sm tracking-widest uppercase transition-colors border-r border-forge-700 ${viewMode === 'preview' ? 'bg-[#0a0a0c] text-brimstone-500 font-bold border-b-2 border-b-brimstone-500' : 'text-gray-500 hover:text-gray-300 hover:bg-forge-800'}`}
              >
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4" /> Preview
                </div>
              </button>
            </div>

            {viewMode === 'preview' && (
              <button onClick={updatePreview} className="mr-4 px-3 py-1 bg-forge-800 hover:bg-forge-700 text-gray-300 rounded text-xs tracking-widest uppercase border border-forge-600 transition-colors flex items-center gap-2">
                <Play className="w-3 h-3 text-brimstone-500" /> Run
              </button>
            )}
          </div>

          {viewMode === 'code' ? (
            <div className="flex-1 flex min-h-0">
              {/* File Tree */}
              <div className="w-48 border-r border-forge-800 bg-forge-900/30 flex flex-col">
                <div className="p-2 flex items-center justify-between border-b border-forge-800">
                  <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">Files</span>
                  <button onClick={handleCreateFile} className="text-gray-500 hover:text-brimstone-500">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                  {files.map(f => (
                    <div
                      key={f.path}
                      onClick={() => handleOpenFile(f.path)}
                      className={`flex items-center justify-between cursor-pointer px-2 py-1.5 rounded text-xs font-mono group ${activeFile === f.path ? 'bg-forge-800 text-brimstone-400' : 'text-gray-400 hover:bg-forge-800/50 hover:text-gray-200'}`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileCode2 className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{f.path}</span>
                      </div>
                      <button onClick={(e) => handleDeleteFile(f.path, e)} className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-500">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Code Editor */}
              <div className="flex-1 relative">
                {activeFile ? (
                  <textarea
                    className="w-full h-full bg-transparent resize-none outline-none text-gray-300 p-4 font-mono text-sm custom-scrollbar leading-relaxed"
                    spellCheck="false"
                    value={fileContent}
                    onChange={(e) => handleSave(e.target.value)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-forge-700 font-sans tracking-widest uppercase text-sm">
                    Select a file
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 bg-white relative">
              {previewUrl ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-full border-none bg-white"
                  title="Preview"
                  sandbox="allow-scripts allow-modals allow-forms allow-popups"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 font-sans">
                  No index.html to preview
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
