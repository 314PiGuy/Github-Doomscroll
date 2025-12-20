import React, { useState } from 'react';
import { useToken } from '../context/TokenContext';
import { Key, X } from 'lucide-react';

const TokenModal = ({ isOpen, onClose }) => {
  const { token, setToken, clearToken } = useToken();
  const [inputToken, setInputToken] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    setToken(inputToken);
    onClose();
  };

  const handleClear = () => {
    clearToken();
    setInputToken('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#242424] border border-gray-700 p-6 rounded-xl max-w-md w-full shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Key size={20} /> GitHub Token
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded-full">
            <X size={20} />
          </button>
        </div>
        
        <p className="text-sm text-gray-400 mb-4">
          A GitHub Personal Access Token is recommended to avoid rate limits. 
          It is stored locally in your browser.
        </p>

        {token ? (
          <div className="mb-4">
            <div className="bg-green-900/30 text-green-400 p-3 rounded-lg text-sm mb-3 border border-green-900">
              Token is currently saved.
            </div>
            <button 
              onClick={handleClear}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition-colors"
            >
              Clear Token
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <input
              type="password"
              placeholder="ghp_..."
              value={inputToken}
              onChange={(e) => setInputToken(e.target.value)}
              className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-3 text-white focus:border-blue-500 focus:outline-none"
            />
            <button 
              onClick={handleSave}
              disabled={!inputToken}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 rounded-lg transition-colors"
            >
              Save Token
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TokenModal;
