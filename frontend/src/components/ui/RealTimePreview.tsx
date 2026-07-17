import React, { useState, useRef, useEffect } from 'react';
import { Play, Square, RefreshCw, Download, Settings, Maximize2 } from 'lucide-react';
import { usePreviewStream, PreviewStreamOptions } from '../../hooks/usePreviewStream';

interface RealTimePreviewProps {
  config: any;
  onError?: (error: string) => void;
  className?: string;
}

export function RealTimePreview({ config, onError, className = '' }: RealTimePreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [previewOptions, setPreviewOptions] = useState<PreviewStreamOptions>({
    startAt: 0,
    duration: 10,
    quality: 'draft',
    fps: 15,
    width: 640,
    height: 360,
    mode: 'live',
  });
  const [showSettings, setShowSettings] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const {
    isGenerating,
    progress,
    result,
    error,
    generatePreview,
    cancelPreview,
  } = usePreviewStream();

  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  useEffect(() => {
    if (result?.url && videoRef.current) {
      // Force reload video when new preview is ready
      videoRef.current.src = result.url;
      videoRef.current.load();
    }
  }, [result?.url]);

  const handleGenerate = async () => {
    try {
      await generatePreview(config, previewOptions);
    } catch (err) {
      console.error('Preview generation failed:', err);
    }
  };

  const handlePlayPause = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleStop = () => {
    if (!videoRef.current) return;
    videoRef.current.pause();
    videoRef.current.currentTime = 0;
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const time = parseFloat(e.target.value);
    videoRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleDownload = () => {
    if (!result?.url) return;
    const a = document.createElement('a');
    a.href = result.url;
    a.download = `preview-${result.id}.mp4`;
    a.click();
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;

    if (!isFullscreen) {
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`bg-gray-900 rounded-lg overflow-hidden ${className}`}>
      {/* Video Player */}
      <div className="relative bg-black aspect-video">
        {result?.url ? (
          <video
            ref={videoRef}
            className="w-full h-full"
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          >
            <source src={result.url} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No preview generated yet</p>
              <p className="text-sm mt-2">Click "Generate Preview" to start</p>
            </div>
          </div>
        )}

        {/* Generation Progress Overlay */}
        {isGenerating && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
            <div className="text-center text-white">
              <RefreshCw className="w-12 h-12 mx-auto mb-4 animate-spin" />
              <p className="text-lg font-semibold">Generating Preview...</p>
              {progress && (
                <div className="mt-4 w-64">
                  <div className="bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-500 h-full transition-all duration-300"
                      style={{ width: `${progress.progress}%` }}
                    />
                  </div>
                  <p className="text-sm mt-2">
                    {progress.progress}% - {formatTime(progress.currentTime)} / {formatTime(progress.duration)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Elapsed: {(progress.elapsed / 1000).toFixed(1)}s
                  </p>
                </div>
              )}
              <button
                onClick={cancelPreview}
                className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Fullscreen Button */}
        {result?.url && (
          <button
            onClick={toggleFullscreen}
            className="absolute top-4 right-4 p-2 bg-black bg-opacity-50 hover:bg-opacity-75 rounded text-white"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 space-y-4">
        {/* Playback Controls */}
        {result?.url && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePlayPause}
                className="p-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
                disabled={isGenerating}
              >
                {isPlaying ? <Square className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
              <button
                onClick={handleStop}
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-white"
                disabled={isGenerating}
              >
                <Square className="w-5 h-5" />
              </button>
              <input
                type="range"
                min="0"
                max={result.duration || 10}
                step="0.1"
                value={currentTime}
                onChange={handleSeek}
                className="flex-1"
                disabled={isGenerating}
              />
              <span className="text-sm text-gray-400 min-w-[80px] text-right">
                {formatTime(currentTime)} / {formatTime(result.duration || 0)}
              </span>
            </div>

            {/* Preview Info */}
            <div className="flex items-center justify-between text-xs text-gray-400">
              <div className="flex gap-4">
                <span>Resolution: {result.resolution}</span>
                {result.fps && <span>FPS: {result.fps}</span>}
                <span>Quality: {result.quality}</span>
                <span>Speed: {result.speed}</span>
              </div>
              <button
                onClick={handleDownload}
                className="flex items-center gap-1 hover:text-white"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>
        )}

        {/* Generation Controls */}
        <div className="flex gap-2">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded text-white font-medium"
          >
            <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Generating...' : 'Generate Preview'}
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="p-4 bg-gray-800 rounded space-y-3">
            <h3 className="font-semibold text-white mb-3">Preview Settings</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Start At (seconds)</label>
                <input
                  type="number"
                  value={previewOptions.startAt}
                  onChange={(e) => setPreviewOptions({ ...previewOptions, startAt: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-gray-700 rounded text-white"
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">Duration (seconds)</label>
                <input
                  type="number"
                  value={previewOptions.duration}
                  onChange={(e) => setPreviewOptions({ ...previewOptions, duration: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-gray-700 rounded text-white"
                  min="1"
                  max="60"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Quality</label>
                <select
                  value={previewOptions.quality}
                  onChange={(e) => setPreviewOptions({ ...previewOptions, quality: e.target.value as any })}
                  className="w-full px-3 py-2 bg-gray-700 rounded text-white"
                >
                  <option value="draft">Draft (Fast)</option>
                  <option value="medium">Medium</option>
                  <option value="high">High (Slow)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Mode</label>
                <select
                  value={previewOptions.mode}
                  onChange={(e) => setPreviewOptions({ ...previewOptions, mode: e.target.value as any })}
                  className="w-full px-3 py-2 bg-gray-700 rounded text-white"
                >
                  <option value="live">Live (Fast, Simple)</option>
                  <option value="full">Full (Slow, All Effects)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">FPS</label>
                <select
                  value={previewOptions.fps}
                  onChange={(e) => setPreviewOptions({ ...previewOptions, fps: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-gray-700 rounded text-white"
                >
                  <option value="15">15 FPS (Fastest)</option>
                  <option value="24">24 FPS</option>
                  <option value="30">30 FPS</option>
                  <option value="60">60 FPS (Slowest)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Resolution</label>
                <select
                  value={`${previewOptions.width}x${previewOptions.height}`}
                  onChange={(e) => {
                    const [w, h] = e.target.value.split('x').map(Number);
                    setPreviewOptions({ ...previewOptions, width: w, height: h });
                  }}
                  className="w-full px-3 py-2 bg-gray-700 rounded text-white"
                >
                  <option value="480x270">480x270 (Fastest)</option>
                  <option value="640x360">640x360 (Fast)</option>
                  <option value="854x480">854x480 (Medium)</option>
                  <option value="1280x720">1280x720 (HD)</option>
                  <option value="1920x1080">1920x1080 (Full HD)</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-700">
              <p className="text-xs text-gray-400">
                <strong>Tip:</strong> Use "Live" mode with lower resolution and FPS for fastest previews. 
                Use "Full" mode to see all effects and overlays as they will appear in final render.
              </p>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-3 bg-red-900 bg-opacity-50 border border-red-700 rounded text-red-200 text-sm">
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>
    </div>
  );
}
