import React, { useState, useEffect } from 'react';
import { Database, Cloud, ScrollText, Download, Trash2, CheckCircle2, Plus } from 'lucide-react';
import { getAvailableModels, checkModelCached, deleteModelCache, addCustomModel, removeCustomModel, pullModel } from '../../lib/llm';
import { LEGACY_SOUL_STORAGE_KEY, MAX_PERSONA_LENGTH, PERSONA_STORAGE_KEY, readLegacySoul, readPersona } from '../../lib/persona';

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
  const [persona, setPersona] = useState('');
  const [legacySoul, setLegacySoul] = useState<string | null>(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    setPersona(readPersona(localStorage));
    setLegacySoul(readLegacySoul(localStorage));
  }, []);

  const savePersona = () => {
    try {
      localStorage.setItem(PERSONA_STORAGE_KEY, persona);
      setStatus('Local persona saved. It does not amend the WPAI Constitution.');
    } catch {
      setStatus('Browser storage is unavailable; the persona was not saved.');
    }
  };

  const exportLegacySoul = () => {
    if (legacySoul === null) return;
    const url = URL.createObjectURL(new Blob([legacySoul], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'workstation-legacy-soul.txt';
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const clearLegacySoul = () => {
    if (!window.confirm('Delete the browser-stored legacy SOUL draft? Export it first if you want a copy.')) return;
    try {
      localStorage.removeItem(LEGACY_SOUL_STORAGE_KEY);
      setLegacySoul(null);
      setStatus('Legacy browser draft removed. Its tracked original remains recoverable in Git history.');
    } catch {
      setStatus('Browser storage is unavailable; the legacy draft was not removed.');
    }
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
        <p className="text-sm text-gray-400">Manage local neural networks. Downloaded models use your browser's model cache.</p>
        <ModelList />
      </div>

      <div className="industrial-panel p-6 rounded-lg space-y-4">
        <div className="flex items-center gap-3 border-b border-forge-700 pb-4">
          <ScrollText className="text-brimstone-500" />
          <h3 className="text-xl font-sans tracking-wide text-gray-200 uppercase">Local Chat Capabilities</h3>
        </div>
        <p className="text-sm text-gray-400">The browser model can converse. This app does not execute model-requested tools or grant it file, database, web, image, or video access.</p>
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
          <h3 className="text-xl font-sans tracking-wide text-red-500 uppercase">Local Character Persona</h3>
        </div>
        <p className="text-sm text-gray-400">This text only styles the local chat character. It is not agent law. The binding <a className="text-brimstone-500 underline" href="https://github.com/MrWizard94-Compile/Agents-Constitution" target="_blank" rel="noopener noreferrer">WPAI Constitution</a> lives on GitHub.</p>
        <textarea
          value={persona}
          onChange={(e) => setPersona(e.target.value)}
          maxLength={MAX_PERSONA_LENGTH}
          aria-label="Local character persona"
          className="w-full h-48 bg-forge-900 border border-blood-500/30 rounded p-4 text-gray-300 font-mono text-sm focus:outline-none focus:border-brimstone-500/50 shadow-inner"
        />
        <button onClick={savePersona} className="px-6 py-2 bg-forge-800 border border-blood-500 hover:bg-blood-500/20 text-gray-200 font-bold rounded transition-colors tracking-widest uppercase">Save Local Persona</button>
        {status && <p role="status" className="text-sm text-gray-300">{status}</p>}
        {legacySoul !== null && (
          <div className="border-t border-forge-700 pt-4 space-y-3">
            <h4 className="font-bold text-gray-200">Legacy SOUL browser draft</h4>
            <p className="text-sm text-gray-400">An old browser-stored draft was found. It is no longer sent to the model. Export it before clearing if it contains edits you want to keep.</p>
            <div className="flex gap-3 flex-wrap">
              <button onClick={exportLegacySoul} className="px-4 py-2 bg-forge-800 border border-forge-600 text-gray-200 rounded">Export legacy draft</button>
              <button onClick={clearLegacySoul} className="px-4 py-2 bg-forge-800 border border-blood-500 text-red-300 rounded">Clear legacy browser draft</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
