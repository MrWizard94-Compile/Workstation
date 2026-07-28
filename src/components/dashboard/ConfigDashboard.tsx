import React, { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { Lock, Unlock, Database, Cloud, ScrollText, Wrench, Download, Trash2, CheckCircle2, Plus } from 'lucide-react';
import { getAvailableModels, checkModelCached, deleteModelCache, addCustomModel, removeCustomModel, pullModel } from '../../lib/llm';

function ModelList() {
  const [modelStatus, setModelStatus] = useState<Record<string, boolean>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [customModelId, setCustomModelId] = useState('');
  const [downloadProgress, setDownloadProgress] = useState<Record<string, string>>({});

  const checkModels = async () => {
    setIsRefreshing(true);
    const status: Record<string, boolean> = {};
    for (const model of getAvailableModels()) {
      status[model] = await checkModelCached(model);
    }
    setModelStatus(status);
    setIsRefreshing(false);
  };

  useEffect(() => {
    checkModels();
  }, []);

  const handleDelete = async (modelId: string) => {
    await deleteModelCache(modelId);
    removeCustomModel(modelId); // if it was custom, remove it from list
    checkModels();
  };

  const handlePull = async (modelId: string) => {
    try {
      await pullModel(modelId, (report) => {
        setDownloadProgress(prev => ({ ...prev, [modelId]: report.text }));
      });
      setDownloadProgress(prev => {
        const next = { ...prev };
        delete next[modelId];
        return next;
      });
      checkModels();
    } catch (e: any) {
      setDownloadProgress(prev => ({ ...prev, [modelId]: 'Error: ' + e.message }));
    }
  };

  const handleAddCustomModel = (e: React.FormEvent) => {
    e.preventDefault();
    if (customModelId.trim()) {
      addCustomModel(customModelId.trim());
      setCustomModelId('');
      checkModels();
    }
  };

  return (
    <div className="space-y-4 mt-4">
      <form onSubmit={handleAddCustomModel} className="flex gap-2">
        <input
          type="text"
          value={customModelId}
          onChange={(e) => setCustomModelId(e.target.value)}
          placeholder="HuggingFace MLC Model ID (e.g., Llama-3-8B-Instruct-q4f16_1-MLC)"
          className="flex-1 bg-forge-800 border border-forge-700 text-gray-300 rounded p-2 text-sm focus:outline-none focus:border-brimstone-500"
        />
        <button
          type="submit"
          disabled={!customModelId.trim()}
          className="bg-forge-700 hover:bg-forge-600 border border-forge-600 disabled:opacity-50 text-gray-200 px-4 py-2 rounded text-sm font-bold flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Custom
        </button>
      </form>

      <div className="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
        {getAvailableModels().map(model => (
          <div key={model} className="flex items-center justify-between p-3 bg-forge-900 border border-forge-700 rounded text-sm text-gray-300">
            <span className="font-mono">{model}</span>
            <div className="flex items-center gap-4">
              {modelStatus[model] ? (
                <>
                  <span className="flex items-center gap-1 text-green-500 font-bold tracking-widest text-xs uppercase">
                    <CheckCircle2 className="w-4 h-4" /> Cached
                  </span>
                  <button
                    onClick={() => handleDelete(model)}
                    className="p-1 hover:bg-forge-800 rounded text-gray-500 hover:text-red-500 transition-colors"
                    title="Purge from Cache"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  {downloadProgress[model] ? (
                    <span className="text-brimstone-500 text-xs font-mono max-w-[200px] truncate" title={downloadProgress[model]}>
                      {downloadProgress[model]}
                    </span>
                  ) : (
                    <>
                      <span className="text-gray-500 font-bold tracking-widest text-xs uppercase flex items-center gap-1">
                        Not Cached
                      </span>
                      <button
                        onClick={() => handlePull(model)}
                        className="px-2 py-1 bg-forge-800 hover:bg-forge-700 text-brimstone-500 rounded text-xs font-bold flex items-center gap-1 transition-colors border border-forge-600"
                        title="Download model to cache"
                      >
                        <Download className="w-3 h-3" /> Pull
                      </button>
                      <button
                        onClick={() => handleDelete(model)}
                        className="p-1 hover:bg-forge-800 rounded text-gray-500 hover:text-red-500 transition-colors"
                        title="Remove custom model"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="pt-2 flex justify-end">
        <button
          onClick={checkModels}
          disabled={isRefreshing}
          className="text-xs uppercase tracking-widest text-brimstone-500 hover:text-brimstone-400 font-bold"
        >
          {isRefreshing ? 'Scanning...' : 'Refresh Status'}
        </button>
      </div>
    </div>
  );
}

export function ConfigDashboard() {
  const { pinVerified, setPinVerified } = useStore();
  const [pinInput, setPinInput] = useState('');
  const [soulContent, setSoulContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const EXPECTED_PIN = "666";

  useEffect(() => {
    const fetchSoul = async () => {
      const stored = localStorage.getItem('soul_config');
      if (stored) {
        setSoulContent(stored);
      } else {
        try {
          const res = await fetch('/SOULv2.0.0.md');
          const text = await res.text();
          setSoulContent(text);
          localStorage.setItem('soul_config', text);
        } catch (e) {
          console.error('Failed to load SOUL.md', e);
        }
      }
    };
    fetchSoul();
  }, []);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === EXPECTED_PIN) {
      setPinVerified(true);
      setErrorMsg('');
    } else {
      setErrorMsg('INCORRECT SEAL. ACCESS DENIED.');
    }
  };

  const saveSoul = () => {
    setIsSaving(true);
    localStorage.setItem('soul_config', soulContent);
    setTimeout(() => setIsSaving(false), 800);
  };

  return (
    <div className="h-full overflow-y-auto p-8 max-w-5xl mx-auto space-y-12">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold font-sans tracking-widest text-gray-200">
          FORGE CONFIGURATION
        </h2>
        <p className="text-gray-500">Fine-tune your local demonic entity.</p>
      </div>

      <div className="industrial-panel p-6 rounded-lg space-y-4">
        <div className="flex items-center gap-3 border-b border-forge-700 pb-4">
          <Database className="text-brimstone-500" />
          <h3 className="text-xl font-sans tracking-wide text-gray-200 uppercase">Demonic Entities (Models)</h3>
        </div>
        <p className="text-sm text-gray-400">Manage local neural networks. Downloaded models are cached in your browser's local storage.</p>
        <ModelList />
      </div>

      <div className="industrial-panel p-6 rounded-lg space-y-4">
        <div className="flex items-center gap-3 border-b border-forge-700 pb-4">
          <Wrench className="text-brimstone-500" />
          <h3 className="text-xl font-sans tracking-wide text-gray-200 uppercase">Tool Binding</h3>
        </div>
        <p className="text-sm text-gray-400">The entity is bound with ALL THE TOOLS (Custom Function Calling enabled).</p>
        <div className="flex gap-2 flex-wrap">
          <span className="px-3 py-1 bg-forge-900 border border-forge-700 rounded text-xs text-gray-500 shadow-inner hover:text-brimstone-500 hover:border-brimstone-500/50 transition-colors cursor-pointer">search_database()</span>
          <span className="px-3 py-1 bg-forge-900 border border-forge-700 rounded text-xs text-gray-500 shadow-inner hover:text-brimstone-500 hover:border-brimstone-500/50 transition-colors cursor-pointer">modify_soul()</span>
          <span className="px-3 py-1 bg-forge-900 border border-forge-700 rounded text-xs text-gray-500 shadow-inner hover:text-brimstone-500 hover:border-brimstone-500/50 transition-colors cursor-pointer">cast_hellfire()</span>
          <span className="px-3 py-1 bg-forge-900 border border-forge-700 rounded text-xs text-gray-500 shadow-inner hover:text-brimstone-500 hover:border-brimstone-500/50 transition-colors cursor-pointer">sys_vectorize_logs()</span>
          <span className="px-3 py-1 bg-forge-900 border border-forge-700 rounded text-xs text-gray-500 shadow-inner hover:text-brimstone-500 hover:border-brimstone-500/50 transition-colors cursor-pointer">filesystem_read()</span>
          <span className="px-3 py-1 bg-forge-900 border border-forge-700 rounded text-xs text-gray-500 shadow-inner hover:text-brimstone-500 hover:border-brimstone-500/50 transition-colors cursor-pointer">filesystem_write()</span>
          <span className="px-3 py-1 bg-forge-900 border border-forge-700 rounded text-xs text-gray-500 shadow-inner hover:text-brimstone-500 hover:border-brimstone-500/50 transition-colors cursor-pointer">web_search()</span>
          <span className="px-3 py-1 bg-forge-900 border border-forge-700 rounded text-xs text-gray-500 shadow-inner hover:text-brimstone-500 hover:border-brimstone-500/50 transition-colors cursor-pointer">generate_image()</span>
          <span className="px-3 py-1 bg-forge-900 border border-forge-700 rounded text-xs text-gray-500 shadow-inner hover:text-brimstone-500 hover:border-brimstone-500/50 transition-colors cursor-pointer">generate_video()</span>
        </div>
      </div>

      <div className="industrial-panel p-6 rounded-lg space-y-4 opacity-75">
        <div className="flex items-center gap-3 border-b border-forge-700 pb-4">
          <Cloud className="text-forge-600" />
          <h3 className="text-xl font-sans tracking-wide text-gray-400 uppercase">Multi-Platform Cloud Sync</h3>
        </div>
        <p className="text-sm text-gray-500">Cloud synchronization is currently disabled. Operating in strict offline-first mode.</p>
        <button disabled className="px-6 py-2 bg-forge-900 border border-forge-700 rounded text-forge-600 cursor-not-allowed shadow-inner uppercase tracking-wider text-sm font-bold">
          Cloud Sync Unavailable
        </button>
      </div>

      <div className="industrial-panel border-blood-500/30 p-6 rounded-lg space-y-4 mb-12">
        <div className="flex items-center gap-3 border-b border-blood-500/20 pb-4">
          <ScrollText className="text-blood-500" />
          <h3 className="text-xl font-sans tracking-wide text-red-500 uppercase">SOULv2.0.0.md - The Constitution</h3>
        </div>

        {!pinVerified ? (
          <form onSubmit={handlePinSubmit} className="space-y-4 py-8">
            <div className="flex items-center justify-center gap-4">
              <Lock className="w-8 h-8 text-forge-600" />
              <div className="flex flex-col gap-2 w-64">
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Enter PIN (666)"
                  className="bg-forge-900 border border-forge-600 rounded p-3 text-center tracking-[0.5em] focus:border-blood-500 outline-none w-full shadow-inner"
                  maxLength={6}
                />
                <button type="submit" className="w-full bg-forge-800 border border-blood-500/50 hover:bg-blood-500/20 hover:border-blood-500 text-gray-300 hover:text-white font-bold py-2 rounded transition-all">
                  BREAK THE SEAL
                </button>
                {errorMsg && <p className="text-red-500 text-sm text-center font-bold animate-pulse mt-2">{errorMsg}</p>}
              </div>
            </div>
          </form>
        ) : (
          <div className="space-y-4 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-brimstone-500">
                <Unlock className="w-5 h-5" />
                <span className="text-sm font-bold tracking-widest uppercase">Seal Broken. Editing Permitted.</span>
              </div>
              <button
                onClick={() => setPinVerified(false)}
                className="text-xs text-gray-500 hover:text-gray-300 underline uppercase tracking-wider"
              >
                Re-Seal Constitution
              </button>
            </div>

            <textarea
              value={soulContent}
              onChange={(e) => setSoulContent(e.target.value)}
              className="w-full h-[500px] bg-forge-900 border border-blood-500/30 rounded p-4 text-gray-300 font-mono text-sm focus:outline-none focus:border-brimstone-500/50 shadow-inner"
            />

            <button
              onClick={saveSoul}
              className="px-6 py-2 bg-forge-800 border border-blood-500 hover:bg-blood-500/20 text-gray-200 font-bold rounded transition-colors tracking-widest uppercase"
            >
              {isSaving ? 'INSCRIBING...' : 'SAVE CONSTITUTION'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
