import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Volume2, VolumeX, Play, Check, X, Clock, Target } from 'lucide-react';
import { useSound } from '../contexts/SoundContext';

// Custom Range Slider Component
interface RangeSliderProps {
  min: number;
  max: number;
  value: { min: number; max: number };
  onChange: (value: { min: number; max: number }) => void;
  disabled?: boolean;
  label: string;
  color?: string;
}

function RangeSlider({ min, max, value, onChange, disabled = false, label, color = 'blue' }: RangeSliderProps) {
  const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null);

  const getPercentage = (val: number) => ((val - min) / (max - min)) * 100;
  const getValue = (percentage: number) => Math.round(min + (percentage / 100) * (max - min));

  const handleMouseDown = (type: 'min' | 'max') => (e: React.MouseEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging(type);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const rect = (e.target as HTMLElement).closest('.range-slider')?.getBoundingClientRect();
    if (!rect) return;
    
    const percentage = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const newValue = getValue(percentage);
    
    if (isDragging === 'min') {
      onChange({ min: Math.min(newValue, value.max), max: value.max });
    } else {
      onChange({ min: value.min, max: Math.max(newValue, value.min) });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(null);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, value]);

  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500'
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {value.min === value.max ? `${value.min} digit${value.min > 1 ? 's' : ''}` : `${value.min}-${value.max} digits`}
        </span>
      </div>
      
      <div className="range-slider px-3">
        {/* Main track */}
        <div className="slider-track relative">
          {/* Active range */}
          <div 
            className={`slider-range ${colorClasses[color as keyof typeof colorClasses]}`}
            style={{ 
              left: `${getPercentage(value.min)}%`, 
              width: `${getPercentage(value.max) - getPercentage(value.min)}%` 
            }}
          />
          
          {/* Slider handles */}
          <div 
            className={`slider-handle ${colorClasses[color as keyof typeof colorClasses]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{ 
              left: `calc(${getPercentage(value.min)}% - 12px)`,
              maxWidth: 'calc(100% + 24px)'
            }}
            onMouseDown={handleMouseDown('min')}
          />
          <div 
            className={`slider-handle ${colorClasses[color as keyof typeof colorClasses]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{ 
              left: `calc(${getPercentage(value.max)}% - 12px)`,
              maxWidth: 'calc(100% + 24px)'
            }}
            onMouseDown={handleMouseDown('max')}
          />
        </div>
        
        {/* Digit labels */}
        <div className="flex justify-between mt-3 px-1">
          {Array.from({ length: max - min + 1 }, (_, i) => min + i).map((digitValue) => (
            <div key={digitValue} className="flex flex-col items-center">
              <span className={`text-xs font-medium transition-colors duration-200 ${
                digitValue >= value.min && digitValue <= value.max 
                  ? 'text-gray-800' 
                  : 'text-gray-400'
              }`}>
                {digitValue}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const { isMuted, volume, setMuted, setVolume, testSound } = useSound();
  const [lengthSec, setLengthSec] = useState<30 | 60 | 120>(60);
  const [ops, setOps] = useState<{ [k: string]: boolean }>({
    addition: true,
    subtraction: true,
    multiplication: true,
    division: true,
    percent: true,
  });
  const [digits, setDigits] = useState<Record<string, { first: { min: number; max: number }; second: { min: number; max: number } }>>({
    addition: { first: { min: 2, max: 2 }, second: { min: 2, max: 2 } },
    subtraction: { first: { min: 2, max: 2 }, second: { min: 2, max: 2 } },
    multiplication: { first: { min: 1, max: 1 }, second: { min: 1, max: 1 } },
    division: { first: { min: 1, max: 1 }, second: { min: 1, max: 1 } },
    percent: { first: { min: 2, max: 2 }, second: { min: 2, max: 2 } },
  });
  const [activeSection, setActiveSection] = useState<string>('gameplay');

  useEffect(() => {
    const loadSettings = () => {
      try {
        const saved = localStorage.getItem('ops');
        if (saved) setOps(JSON.parse(saved));
        const savedDigits = localStorage.getItem('digits');
        if (savedDigits) {
          const parsed = JSON.parse(savedDigits);
          // Handle migration from old format to new format
          if (parsed.addition && typeof parsed.addition === 'number') {
            // Old format (single number) - convert to new format
            const newDigits = {
              addition: { first: { min: parsed.addition, max: parsed.addition }, second: { min: parsed.addition, max: parsed.addition } },
              subtraction: { first: { min: parsed.subtraction, max: parsed.subtraction }, second: { min: parsed.subtraction, max: parsed.subtraction } },
              multiplication: { first: { min: parsed.multiplication, max: parsed.multiplication }, second: { min: parsed.multiplication, max: parsed.multiplication } },
              division: { first: { min: parsed.division, max: parsed.division }, second: { min: parsed.division, max: parsed.division } },
              percent: { first: { min: parsed.percent, max: parsed.percent }, second: { min: parsed.percent, max: parsed.percent } },
            };
            setDigits(newDigits);
          } else if (parsed.addition && typeof parsed.addition === 'object' && 'first' in parsed.addition && typeof parsed.addition.first === 'number') {
            // Previous format (first/second numbers) - convert to range format
            const newDigits = {
              addition: { first: { min: parsed.addition.first, max: parsed.addition.first }, second: { min: parsed.addition.second, max: parsed.addition.second } },
              subtraction: { first: { min: parsed.subtraction.first, max: parsed.subtraction.first }, second: { min: parsed.subtraction.second, max: parsed.subtraction.second } },
              multiplication: { first: { min: parsed.multiplication.first, max: parsed.multiplication.first }, second: { min: parsed.multiplication.second, max: parsed.multiplication.second } },
              division: { first: { min: parsed.division.first, max: parsed.division.first }, second: { min: parsed.division.second, max: parsed.division.second } },
              percent: { first: { min: parsed.percent.first, max: parsed.percent.first }, second: { min: parsed.percent.second, max: parsed.percent.second } },
            };
            setDigits(newDigits);
          } else {
            setDigits(parsed);
          }
        }
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
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Clock className="text-purple-600" size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Practice Duration</h3>
                  <p className="text-sm text-gray-500">Choose how long you want to practice</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { duration: 30, label: 'Quick', desc: 'Perfect for warm-up', icon: '⚡' },
                  { duration: 60, label: 'Standard', desc: 'Balanced practice', icon: '🎯' },
                  { duration: 120, label: 'Extended', desc: 'Deep focus session', icon: '🔥' }
                ].map(({ duration, label, desc, icon }) => (
                  <button
                    key={duration}
                    onClick={() => setLengthSec(duration as 30 | 60 | 120)}
                    className={`p-5 rounded-xl border-2 transition-all duration-200 text-left ${
                      lengthSec === duration
                        ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-md'
                        : 'border-gray-200 hover:border-purple-300 hover:bg-purple-25 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{icon}</span>
                      <div className="text-xl font-bold">{duration}s</div>
                    </div>
                    <div className="text-sm font-medium text-gray-900">{label}</div>
                    <div className="text-xs text-gray-500 mt-1">{desc}</div>
                  </button>
                ))}
              </div>
            </div>
      
            {/* Operations */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Math Operations</h3>
                <p className="text-sm text-gray-500 mt-1">Choose operations and set difficulty</p>
              </div>
              
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                <div className="col-span-3">Operation</div>
                <div className="col-span-2 text-center">Enable</div>
                <div className="col-span-3 text-center">First Number</div>
                <div className="col-span-3 text-center">Second Number</div>
                <div className="col-span-1"></div>
              </div>
              
              {/* Table Body */}
              <div className="divide-y divide-gray-200">
                {(['addition','subtraction','multiplication','division','percent'] as const).map(k => (
                  <div key={k} className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                    {/* Operation Column */}
                    <div className="col-span-3 flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg font-bold ${
                        ops[k] ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                      }`}>
                        {operationIcons[k]}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{operationNames[k]}</div>
                        <div className="text-xs text-gray-500">
                          {k === 'percent' ? 'Calculate percentages' : `Practice ${operationNames[k].toLowerCase()}`}
                        </div>
                      </div>
                    </div>
                    
                    {/* Enable Column */}
                    <div className="col-span-2 flex items-center justify-center">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!ops[k]}
                          onChange={e => setOps({ ...ops, [k]: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-600">
                          {ops[k] ? 'On' : 'Off'}
                        </span>
                      </label>
                    </div>
                    
                    {/* First Number Column */}
                    <div className="col-span-3">
                      {ops[k] ? (
                        <div className="space-y-2">
                          <div className="text-xs text-gray-500 text-center">
                            {k === 'percent' ? 'Base Number' : 'First Number'}
                          </div>
                          <RangeSlider
                            min={1}
                            max={4}
                            value={digits[k].first}
                            onChange={(value) => setDigits({ 
                              ...digits, 
                              [k]: { ...digits[k], first: value }
                            })}
                            label=""
                            color="blue"
                          />
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400 text-center py-2">Disabled</div>
                      )}
                    </div>
                    
                    {/* Second Number Column */}
                    <div className="col-span-3">
                      {ops[k] ? (
                        <div className="space-y-2">
                          <div className="text-xs text-gray-500 text-center">
                            {k === 'percent' ? 'Percentage' : 'Second Number'}
                          </div>
                          <RangeSlider
                            min={1}
                            max={4}
                            value={digits[k].second}
                            onChange={(value) => setDigits({ 
                              ...digits, 
                              [k]: { ...digits[k], second: value }
                            })}
                            label=""
                            color="orange"
                          />
                        </div>
                      ) : (
                        <div className="text-sm text-gray-400 text-center py-2">Disabled</div>
                      )}
                    </div>
                    
                    {/* Spacer Column */}
                    <div className="col-span-1"></div>
                  </div>
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
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Audio Settings</h3>
                <p className="text-sm text-gray-500">Customize your audio experience</p>
              </div>
              
              <div className="space-y-8">
                {/* Sound Toggle - Simplified */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">Sound Effects</div>
                    <div className="text-sm text-gray-500">Play sounds for feedback</div>
                  </div>
                  <button
                    onClick={() => setMuted(!isMuted)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      isMuted ? 'bg-gray-200' : 'bg-green-500'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isMuted ? 'translate-x-1' : 'translate-x-6'
                      }`}
                    />
                  </button>
                </div>
        
                {/* Volume Control - Simplified */}
                {!isMuted && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between">
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
                      style={{
                        background: `linear-gradient(to right, #22c55e 0%, #22c55e ${volume * 100}%, #e5e7eb ${volume * 100}%, #e5e7eb 100%)`
                      }}
                    />
                  </motion.div>
                )}

                {/* Test Sound - Simplified */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div>
                    <div className="font-medium text-gray-900">Test Sound</div>
                    <div className="text-sm text-gray-500">Preview audio feedback</div>
                  </div>
                  <button
                    onClick={testSound}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                  >
                    Test
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div 
          className="flex gap-4 mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <button
            onClick={saveSettings}
            className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3"
          >
            <Check size={20} />
            Save & Start Practice
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-8 py-4 bg-white text-gray-700 font-medium rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 flex items-center gap-3"
          >
            <X size={20} />
            Cancel
          </button>
        </motion.div>
      </div>
    </div>
  );
}
