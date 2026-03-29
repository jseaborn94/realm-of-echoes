import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '@/context/SettingsContext.jsx';

const KEYBINDS = [
  { key: 'Click',  action: 'Move / Attack' },
  { key: 'Q',      action: 'Skill 1' },
  { key: 'W',      action: 'Skill 2' },
  { key: 'E',      action: 'Skill 3' },
  { key: 'R',      action: 'Ultimate (Lv 6+)' },
  { key: '1',      action: 'HP Potion' },
  { key: '2',      action: 'MP Potion' },
  { key: 'F',      action: 'Interact / Gather' },
  { key: 'I',      action: 'Inventory' },
  { key: 'K',      action: 'Skills' },
  { key: 'M',      action: 'World Map' },
  { key: 'ESC',    action: 'Pause Menu' },
];

const TABS = ['Audio', 'Gameplay', 'Controls'];

function SectionHeader({ children }) {
  return (
    <div className="font-cinzel text-xs tracking-widest uppercase mb-3"
      style={{ color: '#6a5a3a', borderBottom: '1px solid rgba(255,232,138,0.1)', paddingBottom: '6px' }}>
      {children}
    </div>
  );
}

function VolumeSlider({ label, value, onChange }) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1.5">
        <span className="font-cinzel text-xs" style={{ color: '#ffe88a' }}>{label}</span>
        <span className="font-cinzel text-xs" style={{ color: '#6a5a3a' }}>{value}%</span>
      </div>
      <input
        type="range" min={0} max={100} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, #ffe88a ${value}%, rgba(255,255,255,0.12) ${value}%)`,
          outline: 'none',
        }}
      />
    </div>
  );
}

function Toggle({ label, description, value, onChange }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-4">
      <div>
        <div className="font-cinzel text-xs" style={{ color: '#ffe88a' }}>{label}</div>
        {description && (
          <div className="text-xs mt-0.5" style={{ color: '#4a3a2a', fontFamily: 'Crimson Text, serif' }}>{description}</div>
        )}
      </div>
      <button
        onClick={() => onChange(!value)}
        className="relative shrink-0 w-10 h-5 rounded-full transition-all duration-200"
        style={{
          background: value ? 'linear-gradient(135deg, #ffe88a, #c8a030)' : 'rgba(255,255,255,0.1)',
          border: `1px solid ${value ? '#ffe88a' : 'rgba(255,255,255,0.15)'}`,
        }}
      >
        <div className="absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200"
          style={{
            background: value ? '#1a1000' : '#4a4a4a',
            left: value ? 'calc(100% - 18px)' : '2px',
          }}
        />
      </button>
    </div>
  );
}

export default function SettingsPanel({ onBack }) {
  const { settings, updateSetting } = useSettings();
  const [activeTab, setActiveTab] = useState('Audio');

  return (
    <AnimatePresence>
      <motion.div
        key="settings"
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 40 }}
        transition={{ duration: 0.2 }}
        className="w-full"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <button onClick={onBack}
            className="font-cinzel text-xs px-2 py-1 rounded transition-all hover:opacity-80"
            style={{ color: '#6a5a3a', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)' }}>
            ← Back
          </button>
          <h2 className="font-cinzel font-bold text-base" style={{ color: '#ffe88a' }}>Settings</h2>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 p-1 rounded-lg" style={{ background: 'rgba(0,0,0,0.3)' }}>
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="flex-1 font-cinzel text-xs py-1.5 rounded-md transition-all duration-200"
              style={{
                background: activeTab === tab ? 'rgba(255,232,138,0.12)' : 'transparent',
                color: activeTab === tab ? '#ffe88a' : '#4a3a2a',
                border: activeTab === tab ? '1px solid rgba(255,232,138,0.25)' : '1px solid transparent',
              }}>
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ minHeight: '220px' }}>
          {activeTab === 'Audio' && (
            <div>
              <SectionHeader>Volume</SectionHeader>
              <VolumeSlider label="Master Volume" value={settings.masterVolume}
                onChange={v => updateSetting('masterVolume', v)} />
              <VolumeSlider label="SFX Volume" value={settings.sfxVolume}
                onChange={v => updateSetting('sfxVolume', v)} />
              <VolumeSlider label="Music Volume" value={settings.musicVolume}
                onChange={v => updateSetting('musicVolume', v)} />
              <p className="text-xs mt-1" style={{ color: '#3a2a1a', fontFamily: 'Crimson Text, serif', fontStyle: 'italic' }}>
                Music system coming soon
              </p>
            </div>
          )}

          {activeTab === 'Gameplay' && (
            <div>
              <SectionHeader>Visual Effects</SectionHeader>
              <Toggle
                label="Camera Shake"
                description="Shake on heavy hits and explosions"
                value={settings.cameraShake}
                onChange={v => updateSetting('cameraShake', v)}
              />
              <Toggle
                label="Screen Effects"
                description="Vignette, zone tints, and flash effects"
                value={settings.screenEffects}
                onChange={v => updateSetting('screenEffects', v)}
              />
            </div>
          )}

          {activeTab === 'Controls' && (
            <div>
              <SectionHeader>Keybinds</SectionHeader>
              <div className="space-y-1.5">
                {KEYBINDS.map(({ key, action }) => (
                  <div key={key} className="flex items-center justify-between py-1.5 px-2 rounded"
                    style={{ background: 'rgba(0,0,0,0.25)' }}>
                    <span className="text-xs" style={{ color: '#6a5a3a', fontFamily: 'Crimson Text, serif' }}>{action}</span>
                    <kbd className="font-cinzel text-xs px-2 py-0.5 rounded"
                      style={{ background: 'rgba(255,232,138,0.1)', color: '#ffe88a', border: '1px solid rgba(255,232,138,0.2)' }}>
                      {key}
                    </kbd>
                  </div>
                ))}
              </div>
              <p className="text-xs mt-3" style={{ color: '#3a2a1a', fontFamily: 'Crimson Text, serif', fontStyle: 'italic' }}>
                Custom keybinding coming soon
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}