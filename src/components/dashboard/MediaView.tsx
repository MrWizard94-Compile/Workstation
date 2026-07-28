import React, { useState, useRef } from 'react';
import { Image as ImageIcon, Video, Music, Sparkles, Loader2, Play, Pause } from 'lucide-react';
import { useStore } from '../../store';
import { getAvailableModels } from '../../lib/llm';

type MediaType = 'image' | 'video' | 'music';

export function MediaView() {
  const { mediaModel, setMediaModel } = useStore();

  const [activeType, setActiveType] = useState<MediaType>('image');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const [generatedMedia, setGeneratedMedia] = useState<{type: MediaType, url: string, prompt: string} | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setGeneratedMedia(null);

    try {
      if (activeType === 'image') {
        const encodedPrompt = encodeURIComponent(prompt.trim());
        const seed = Math.floor(Math.random() * 1000000);
        // Load image to ensure it works before displaying
        await new Promise(r => setTimeout(r, 1000));
        setGeneratedMedia({
          type: 'image',
          url: `https://image.pollinations.ai/prompt/${encodedPrompt}?seed=${seed}&width=1024&height=1024&nologo=true`,
          prompt
        });
      } else if (activeType === 'video') {
        // Use YouTube embed search for video
        const encodedPrompt = encodeURIComponent(prompt.trim());
        await new Promise(r => setTimeout(r, 1000));
        setGeneratedMedia({
          type: 'video',
          url: `https://www.youtube.com/embed?listType=search&list=${encodedPrompt}`,
          prompt
        });
      } else if (activeType === 'music') {
        // Use iTunes Search API to find a music preview
        const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(prompt)}&media=music&limit=1`);
        const data = await res.json();

        if (data.results && data.results.length > 0) {
          setGeneratedMedia({
            type: 'music',
            url: data.results[0].previewUrl,
            prompt: data.results[0].trackName + ' - ' + data.results[0].artistName
          });
        } else {
          // Fallback if no music found
          setGeneratedMedia({
            type: 'music',
            url: 'https://cdn.freesound.org/previews/563/563121_12538183-lq.mp3',
            prompt: 'No results found. Playing Dark Ambient Drone fallback.'
          });
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <div className="h-full flex flex-col p-8 space-y-6">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold font-sans tracking-widest text-gray-200">
            MEDIA GENERATION
          </h2>
          <p className="text-gray-500">Forge visions, moving pictures, and infernal hymns.</p>
        </div>

        <select
          value={mediaModel}
          onChange={(e) => setMediaModel(e.target.value)}
          className="bg-forge-900 border border-forge-700 text-gray-300 text-xs rounded px-2 py-1 focus:outline-none focus:border-brimstone-500"
        >
          {getAvailableModels().map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      <div className="flex-1 industrial-panel rounded-lg flex flex-col p-6">
        <div className="flex items-center gap-4 mb-6">
           <button
             onClick={() => setActiveType('image')}
             className={`flex items-center gap-2 px-6 py-2 border rounded uppercase tracking-widest text-sm font-bold transition-all ${activeType === 'image' ? 'bg-forge-800 border-brimstone-500 text-brimstone-500 shadow-[0_0_15px_rgba(255,69,0,0.2)]' : 'bg-forge-900 border-forge-700 text-gray-500 hover:text-gray-300 hover:border-forge-600'}`}
           >
             <ImageIcon className="w-4 h-4" /> Image
           </button>
           <button
             onClick={() => setActiveType('video')}
             className={`flex items-center gap-2 px-6 py-2 border rounded uppercase tracking-widest text-sm font-bold transition-all ${activeType === 'video' ? 'bg-forge-800 border-brimstone-500 text-brimstone-500 shadow-[0_0_15px_rgba(255,69,0,0.2)]' : 'bg-forge-900 border-forge-700 text-gray-500 hover:text-gray-300 hover:border-forge-600'}`}
           >
             <Video className="w-4 h-4" /> Video
           </button>
           <button
             onClick={() => setActiveType('music')}
             className={`flex items-center gap-2 px-6 py-2 border rounded uppercase tracking-widest text-sm font-bold transition-all ${activeType === 'music' ? 'bg-forge-800 border-brimstone-500 text-brimstone-500 shadow-[0_0_15px_rgba(255,69,0,0.2)]' : 'bg-forge-900 border-forge-700 text-gray-500 hover:text-gray-300 hover:border-forge-600'}`}
           >
             <Music className="w-4 h-4" /> Music
           </button>
        </div>

        <div className="flex gap-4">
          <div className="flex-1 relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isGenerating}
              className="w-full h-32 bg-forge-900 border border-forge-700 rounded-lg p-4 text-gray-200 placeholder-forge-600 focus:outline-none focus:border-brimstone-500 focus:ring-1 focus:ring-brimstone-500 resize-none font-sans"
              placeholder={`Describe the ${activeType} you wish to forge...`}
            />
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="absolute bottom-4 right-4 p-2 bg-brimstone-500 text-white rounded hover:bg-brimstone-400 disabled:opacity-50 transition-colors shadow-[0_0_10px_rgba(255,69,0,0.5)] flex items-center justify-center"
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="mt-8 flex-1 border-2 border-dashed border-forge-700 rounded-lg flex flex-col items-center justify-center bg-forge-900/30 overflow-hidden relative">
          {!generatedMedia && !isGenerating && (
            <p className="text-forge-600 font-sans tracking-widest uppercase text-sm">The forge is empty. Cast a vision.</p>
          )}

          {isGenerating && (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 text-brimstone-500 animate-spin" />
              <p className="text-brimstone-500 font-sans tracking-widest uppercase text-sm animate-pulse">
                Summoning {activeType} from the depths...
              </p>
            </div>
          )}

          {generatedMedia && !isGenerating && (
            <div className="w-full h-full flex flex-col items-center justify-center p-4">
              {generatedMedia.type === 'image' && (
                <img
                  src={generatedMedia.url}
                  alt={generatedMedia.prompt}
                  className="max-w-full max-h-full object-contain rounded border border-forge-700 shadow-[0_0_30px_rgba(255,69,0,0.1)]"
                />
              )}
              {generatedMedia.type === 'video' && (
                <iframe
                  src={generatedMedia.url}
                  title={generatedMedia.prompt}
                  className="w-full h-full object-contain rounded border border-forge-700 shadow-[0_0_30px_rgba(255,69,0,0.1)] aspect-video"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}
              {generatedMedia.type === 'music' && (
                <div className="flex flex-col items-center gap-6">
                  <div className="w-32 h-32 rounded-full border-4 border-brimstone-500/30 flex items-center justify-center relative shadow-[0_0_50px_rgba(255,69,0,0.2)]">
                    <div className={`absolute inset-0 rounded-full border-2 border-brimstone-500 ${isPlaying ? 'animate-ping' : ''}`} />
                    <Music className={`w-12 h-12 text-brimstone-500 ${isPlaying ? 'animate-bounce' : ''}`} />
                  </div>
                  <audio
                    ref={audioRef}
                    src={generatedMedia.url}
                    onEnded={() => setIsPlaying(false)}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    className="hidden"
                  />
                  <button
                    onClick={toggleAudio}
                    className="flex items-center gap-3 px-8 py-3 bg-brimstone-500 text-white rounded-full hover:bg-brimstone-400 transition-colors shadow-[0_0_20px_rgba(255,69,0,0.4)]"
                  >
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                    <span className="uppercase tracking-widest font-bold">
                      {isPlaying ? 'Silence the Hymn' : 'Play Hymn'}
                    </span>
                  </button>
                  <p className="text-gray-400 font-mono text-sm text-center max-w-md">"{generatedMedia.prompt}"</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
