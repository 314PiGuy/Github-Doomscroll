import React from 'react';
import { X, Moon, Sun, Eye, EyeOff, Palette } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useToken } from '../context/TokenContext';

const SettingsModal = ({ isOpen, onClose }) => {
  const { settings, updateSetting } = useSettings();
  const { token, setToken } = useToken();

  if (!isOpen) return null;

  const colors = [
    { name: 'blue', class: 'bg-blue-500' },
    { name: 'purple', class: 'bg-purple-500' },
    { name: 'green', class: 'bg-green-500' },
    { name: 'orange', class: 'bg-orange-500' },
    { name: 'pink', class: 'bg-pink-500' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#1a1a1a] text-white rounded-xl w-full max-w-md border border-gray-800 shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-gray-800">
          <h2 className="text-xl font-bold">Settings</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-800 rounded-full">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 space-y-8">
          {/* GitHub Token */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-400">GitHub Token (Optional)</label>
            <input
              type="password"
              value={token || ''}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_..."
              className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <p className="text-xs text-gray-500">
              Add a token to increase API rate limits and access private repos.
            </p>
          </div>

          {/* Theme */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-400">Appearance</label>
            <div className="flex gap-2 bg-black/30 p-1 rounded-lg border border-gray-800">
              <button
                onClick={() => updateSetting('theme', 'dark')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md transition-all ${
                  settings.theme === 'dark' ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Moon size={18} /> Dark
              </button>
              <button
                onClick={() => updateSetting('theme', 'light')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md transition-all ${
                  settings.theme === 'light' ? 'bg-gray-200 text-black shadow' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Sun size={18} /> Light
              </button>
            </div>
          </div>

          {/* Accent Color */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-400 flex items-center gap-2">
              <Palette size={16} /> Accent Color
            </label>
            <div className="flex gap-3">
              {colors.map((color) => (
                <button
                  key={color.name}
                  onClick={() => updateSetting('accentColor', color.name)}
                  className={`w-8 h-8 rounded-full ${color.class} transition-transform hover:scale-110 ${
                    settings.accentColor === color.name ? 'ring-2 ring-white ring-offset-2 ring-offset-[#1a1a1a]' : ''
                  }`}
                />
              ))}
            </div>
          </div>

          {/* File Explorer Options */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-400">File Explorer</label>
            <button
              onClick={() => updateSetting('hideConfig', !settings.hideConfig)}
              className="w-full flex items-center justify-between p-3 bg-black/30 rounded-lg border border-gray-800 hover:bg-black/50 transition-colors"
            >
              <span className="flex items-center gap-2">
                {settings.hideConfig ? <EyeOff size={18} className="text-gray-400" /> : <Eye size={18} className="text-blue-400" />}
                <span>Hide config & build files</span>
              </span>
              <div className={`w-10 h-5 rounded-full relative transition-colors ${settings.hideConfig ? 'bg-blue-600' : 'bg-gray-700'}`}>
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${settings.hideConfig ? 'left-6' : 'left-1'}`} />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
