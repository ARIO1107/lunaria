import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import CampaignScreen from './CampaignScreen.jsx';
import MainMenu from './MainMenu.jsx';
import SiteIntro from './SiteIntro.jsx';
import { useReducedMotion } from '../hooks/useReducedMotion.js';
import { campaignAtLevel, campaignReducer, createCampaign, readCampaign, saveCampaign } from '../game/campaign.js';
import { readSettings, saveSettings } from '../game/session.js';
import { configureAudio, startMenuBed, stopMenuBed, unlockAudio } from '../audio/audioManager.js';
import { setLanguage } from '../i18n/language.js';
import { applyDocumentLanguage } from '../i18n/translate.js';

function SceneFade({ active }) {
  const previous = useRef(active);
  const [cover, setCover] = useState(false);
  const [lift, setLift] = useState(false);
  const leftFilm = previous.current && !active;
  if (active && cover) { setCover(false); setLift(false); }
  else if (leftFilm && !cover) setCover(true);
  useEffect(() => { previous.current = active; }, [active]);
  useEffect(() => {
    if (!cover) return undefined;
    let next = 0;
    const frame = requestAnimationFrame(() => { next = requestAnimationFrame(() => setLift(true)); });
    const timer = window.setTimeout(() => { setCover(false); setLift(false); }, 920);
    return () => { cancelAnimationFrame(frame); cancelAnimationFrame(next); window.clearTimeout(timer); };
  }, [cover]);
  if (!cover) return null;
  return <div className={lift ? 'scene-veil lift' : 'scene-veil hold'} aria-hidden="true" />;
}

export default function App() {
  const [campaign, dispatch] = useReducer(campaignReducer, null, readCampaign);
  const [settings, setSettings] = useState(readSettings);
  const [playing, setPlaying] = useState(false);
  const [introPending, setIntroPending] = useState(true);
  const reducedMotion = useReducedMotion() || settings.reducedMotion;
  const showIntro = introPending && !reducedMotion;
  const finishIntro = useCallback(() => setIntroPending(false), []);
  const menuVisible = !playing && !showIntro;
  const menuRef = useRef(menuVisible);
  menuRef.current = menuVisible;

  useEffect(() => {
    if (reducedMotion) finishIntro();
  }, [reducedMotion, finishIntro]);

  useEffect(() => { if (campaign) saveCampaign(campaign); }, [campaign]);
  useEffect(() => { configureAudio({ volume: settings.volume, soundEnabled: settings.soundEnabled !== false }); }, [settings]);
  useEffect(() => {
    const unlock = () => {
      unlockAudio();
      if (menuRef.current && settings.soundEnabled !== false) startMenuBed();
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, [settings.soundEnabled]);
  useEffect(() => {
    if (menuVisible && settings.soundEnabled !== false) startMenuBed();
    return stopMenuBed;
  }, [menuVisible, settings.soundEnabled]);

  function updateSettings(next) {
    setLanguage(next.language);
    applyDocumentLanguage();
    setSettings(next);
    saveSettings(next);
  }

  const filming = Boolean(playing && campaign && campaign.currentLevel === 1 && (campaign.phase === 'cinematic' || campaign.phase === 'launchCinematic'));
  return <div data-lunaria-reduced-motion={settings.reducedMotion}>
    <SceneFade active={filming || showIntro} />
    {showIntro ? <SiteIntro onFinish={finishIntro} /> : playing && campaign
      ? <CampaignScreen campaign={campaign} dispatch={dispatch} settings={settings} onSettings={updateSettings} onExit={() => setPlaying(false)} />
      : <MainMenu progress={campaign} settings={settings} onSettings={updateSettings}
          onStart={resume => { if (resume) { const saved = readCampaign() || campaign; if (saved) dispatch({ type: 'restore', state: saved }); } else dispatch({ type: 'restore', state: createCampaign() }); setPlaying(true); }}
          onStartLevel={(level, demo) => { dispatch({ type: 'restore', state: campaignAtLevel(level, demo) }); setPlaying(true); }} />}
  </div>;
}
