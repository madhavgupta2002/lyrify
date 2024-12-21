'use client';

import { useState } from 'react';
import AudioPlayer from './components/AudioPlayer';
import GenerateButton from './components/GenerateButton';
import CustomApiKeyButton from './components/CustomApiKeyButton';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subtitles, setSubtitles] = useState<string | null>(null);
  const [fileId, setFileId] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKey, setApiKey] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select an audio file.');
      return;
    }

    setLoading(true);
    setError(null);
    setSubtitles(null);

    const formData = new FormData();
    formData.append('audio', file);
    if (apiKey) {
      formData.append('api_key', apiKey);
    }

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setSubtitles(data.subtitles);
        setFileId(data.file_id);
      } else {
        throw new Error(data.error || 'Failed to generate lyrics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (fileId) {
      window.location.href = `/api/download/${fileId}`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
              Lyrify
            </h1>
            <p className="text-gray-300 text-lg">Transform your music into lyrics with AI magic</p>
          </div>

          <div className="backdrop-blur-lg bg-white/10 rounded-2xl shadow-2xl p-8 border border-white/20">
            <div className="mb-8">
              <CustomApiKeyButton
                showApiKey={showApiKey}
                onClick={() => setShowApiKey(!showApiKey)}
              />
              {showApiKey && (
                <div className="mt-4">
                  <input
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your Gemini API key"
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400"
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    If not provided, the default API key will be used
                  </p>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div
                className="border-2 border-dashed border-gray-700 rounded-2xl p-8 text-center transition-all duration-200 hover:border-purple-500 hover:bg-gray-800/30 group"
              >
                <input
                  type="file"
                  id="audioFile"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
                <label htmlFor="audioFile" className="cursor-pointer block">
                  <div className="space-y-4">
                    <div className="relative w-20 h-20 mx-auto">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-full h-full text-gray-400 group-hover:text-purple-400 transition-colors duration-200"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                        />
                      </svg>
                      <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center group-hover:bg-purple-400 transition-colors duration-200">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                          />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <p className="text-lg text-gray-300 group-hover:text-white">
                        Drop your audio file here
                      </p>
                      <p className="text-sm text-gray-400 group-hover:text-gray-300">
                        or click to browse
                      </p>
                    </div>
                  </div>
                </label>
              </div>

              {file && (
                <div className="bg-gray-800/30 rounded-lg p-4 flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-purple-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-300">Selected file</p>
                    <p className="text-white font-medium">{file.name}</p>
                  </div>
                </div>
              )}

              <GenerateButton loading={loading} />
            </form>

            {loading && (
              <div className="mt-8">
                <div className="flex items-center justify-center space-x-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
                  <span className="text-gray-300">Processing your audio...</span>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-8 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
                {error}
              </div>
            )}

            {subtitles && (
              <div className="mt-8">
                <h2 className="text-2xl font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                  Generated Lyrics
                </h2>
                {file && <AudioPlayer audioFile={file} subtitles={subtitles} />}
                <div className="bg-gray-800/50 rounded-lg p-6 font-mono text-sm text-gray-300 overflow-x-auto mt-4">
                  <pre className="whitespace-pre-wrap">{subtitles}</pre>
                </div>
                <button
                  onClick={handleDownload}
                  className="mt-6 w-full bg-gray-800 text-white py-3 px-6 rounded-xl font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  <span>Download SRT File</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
