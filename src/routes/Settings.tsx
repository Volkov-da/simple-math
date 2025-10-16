import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Palette, Volume2, VolumeX, Play, Check, X } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useSound } from '../contexts/SoundContext';
import { themeConfig } from '../contexts/ThemeContext';

export default function Settings() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { isMuted, volume, setMuted, setVolume, testSound } = useSound();
  const [lengthSec, setLengthSec] = useState<30 | 60 | 120>(60);
  const [ops, setOps] = useState<{ [k: string]: boolean }>({
    addition: true,
    subtraction: true,
    multiplication: true,
    division: true,
    percent: true,
  });
  const [digits, setDigits] = useState<Record<string, number>>({
    addition: 2,
    subtraction: 2,
    multiplication: 1,
    division: 1,
    percent: 2,
  });
  const [activeSection, setActiveSection] = useState<string>('gameplay');

  useEffect(() => {
    const loadSettings = () => {
      try {
        const saved = localStorage.getItem('ops');
        if (saved) setOps(JSON.parse(saved));
        const savedDigits = localStorage.getItem('digits');
        if (savedDigits) setDigits(JSON.parse(savedDigits));
        const savedLength = localStorage.getItem('lengthSec');
        if (savedLength) setLengthSec(Number(savedLength) as 30 | 60 | 120);
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    loadSettings();
  }, []);

  const saveSettings = async () => {
    try {
      localStorage.setItem('lengthSec', String(lengthSec));
      localStorage.setItem('ops', JSON.stringify(ops));
      localStorage.setItem('digits', JSON.stringify(digits));
      localStorage.setItem('lastSettings', JSON.stringify({ lengthSec, ops, digits }));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
    navigate('/');
  };

  const operationNames: Record<string, string> = {
    addition: 'Addition',
    subtraction: 'Subtraction',
    multiplication: 'Multiplication',
    division: 'Division',
    percent: 'Percentages'
  };

  const operationIcons: Record<string, string> = {
    addition: '+',
    subtraction: '−',
    multiplication: '×',
    division: '÷',
    percent: '%'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div 
          className="flex items-center gap-4 mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <button
            onClick={() => navigate('/')}
            className="p-2 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600">Customize your practice experience</p>
          </div>
        </motion.div>

        {/* Navigation Tabs */}
        <motion.div 
          className="flex gap-2 mb-8 bg-white rounded-xl p-2 shadow-sm border border-gray-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {[
            { id: 'gameplay', label: 'Gameplay', icon: '🎮' },
            { id: 'appearance', label: 'Appearance', icon: '🎨' },
            { id: 'audio', label: 'Audio', icon: '🔊' }
          ].map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                activeSection === section.id
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span>{section.icon}</span>
              {section.label}
            </button>
          ))}
        </motion.div>

        {/* Gameplay Settings */}
        {activeSection === 'gameplay' && (
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Session Length */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Length</h3>
              <div className="grid grid-cols-3 gap-3">
                {[30, 60, 120].map((duration) => (
                  <button
                    key={duration}
                    onClick={() => setLengthSec(duration as 30 | 60 | 120)}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                      lengthSec === duration
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <div className="text-2xl font-bold">{duration}s</div>
                    <div className="text-sm text-gray-500">
                      {duration === 30 ? 'Quick' : duration === 60 ? 'Standard' : 'Extended'}
                    </div>
                  </button>
                ))}
              </div>
      </div>
      
            {/* Operations */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Operations</h3>
              <div className="space-y-4">
          {(['addition','subtraction','multiplication','division','percent'] as const).map(k => (
                  <div key={k} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold">
                        {operationIcons[k]}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{operationNames[k]}</div>
                        <div className="text-sm text-gray-500">
                          {k === 'percent' ? 'Base digits' : 'Digits'} per number
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={!!ops[k]}
                          onChange={e => setOps({ ...ops, [k]: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-600">Enable</span>
              </label>
                <select
                  value={digits[k]}
                  onChange={e => setDigits({ ...digits, [k]: Number(e.target.value) })}
                  disabled={!ops[k]}
                        className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {[1,2,3,4].map(d => (
                          <option key={d} value={d}>{d} digit{d > 1 ? 's' : ''}</option>
                  ))}
                </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Appearance Settings */}
        {activeSection === 'appearance' && (
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Theme</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(themeConfig).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => setTheme(key as any)}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                      theme === key
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: config.colors.primary }}
                      />
                      <div className="font-medium text-gray-900">{config.name}</div>
                    </div>
                    <div className="text-sm text-gray-600">{config.description}</div>
                    <div className="flex gap-1 mt-2">
                      <div 
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: config.colors.primary }}
                      />
                      <div 
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: config.colors.success }}
                      />
                      <div 
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: config.colors.warning }}
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Audio Settings */}
        {activeSection === 'audio' && (
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Sound Effects</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">Enable Sounds</div>
                    <div className="text-sm text-gray-500">Play sounds for correct/incorrect answers</div>
                  </div>
                  <button
                    onClick={() => setMuted(!isMuted)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                      isMuted
                        ? 'bg-gray-100 text-gray-600'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    {isMuted ? 'Muted' : 'Enabled'}
                  </button>
      </div>
      
                {!isMuted && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Volume</span>
                      <span className="text-sm text-gray-500">{Math.round(volume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">Test Sound</div>
                    <div className="text-sm text-gray-500">Preview the click sound</div>
                  </div>
                  <button
                    onClick={testSound}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200 transition-all duration-200"
                  >
                    <Play size={16} />
                    Test
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Save Button */}
        <motion.div 
          className="flex gap-4 mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <button
            onClick={saveSettings}
            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Check size={20} />
            Save Settings
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-4 bg-white text-gray-700 font-medium rounded-xl border border-gray-200 hover:bg-gray-50 transition-all duration-200 flex items-center gap-2"
          >
            <X size={20} />
            Cancel
          </button>
        </motion.div>
      </div>
    </div>
  );
}
