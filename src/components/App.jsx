import { useEffect, useReducer, useRef, useState } from 'react';
import CampaignScreen from './CampaignScreen.jsx';
import MainMenu from './MainMenu.jsx';
import { campaignAtLevel, campaignReducer, createCampaign, readCampaign, saveCampaign } from '../game/campaign.js';
import { readSettings, saveSettings } from '../game/session.js';
import { configureAudio, startMenuBed, stopMenuBed, unlockAudio } from '../audio/audioManager.js';

export default function App() {
  const [campaign, dispatch] = useReducer(campaignReducer, null, readCampaign);
  const [settings, setSettings] = useState(readSettings);
  const [playing, setPlaying] = useState(false);
  const playingRef = useRef(false);
  playingRef.current = playing;

  useEffect(() => { if (campaign) saveCampaign(campaign); }, [campaign]);
  useEffect(() => { configureAudio({ volume: settings.volume, soundEnabled: settings.soundEnabled !== false }); }, [settings]);
  useEffect(() => {
    const unlock = () => {
      unlockAudio();
      if (!playingRef.current && settings.soundEnabled !== false) startMenuBed();
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, [settings.soundEnabled]);
  useEffect(() => {
    if (playing || settings.soundEnabled === false) stopMenuBed();
    else startMenuBed();
  }, [playing, settings.soundEnabled]);

  function updateSettings(next) {
    setSettings(next);
    saveSettings(next);
  }

  return <div data-lunaria-reduced-motion={settings.reducedMotion}>
    {playing && campaign
      ? <CampaignScreen campaign={campaign} dispatch={dispatch} settings={settings} onSettings={updateSettings} onExit={() => setPlaying(false)} />
      : <MainMenu progress={campaign} settings={settings} onSettings={updateSettings}
          onStart={resume => { if (resume) { const saved = readCampaign() || campaign; if (saved) dispatch({ type: 'restore', state: saved }); } else dispatch({ type: 'restore', state: createCampaign() }); setPlaying(true); }}
          onStartLevel={(level, demo) => { dispatch({ type: 'restore', state: campaignAtLevel(level, demo) }); setPlaying(true); }} />}
  </div>;
}
