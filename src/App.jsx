import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Moon, Sun, Settings } from 'lucide-react';
import InventoryList from './components/InventoryList';
import AddItem from './components/AddItem';

function App() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('list');
  const [theme, setTheme] = useState('light');
  
  const [showSettings, setShowSettings] = useState(false);
  const [visionApiKey, setVisionApiKey] = useState(localStorage.getItem('VISION_API_KEY') || '');
  const [gasApiUrl, setGasApiUrl] = useState(localStorage.getItem('GAS_API_URL') || '');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ja' ? 'en' : 'ja';
    i18n.changeLanguage(newLang);
  };

  const saveSettings = () => {
    const trimmedVisionKey = visionApiKey.trim();
    const trimmedGasUrl = gasApiUrl.trim();
    localStorage.setItem('VISION_API_KEY', trimmedVisionKey);
    localStorage.setItem('GAS_API_URL', trimmedGasUrl);
    setVisionApiKey(trimmedVisionKey);
    setGasApiUrl(trimmedGasUrl);
    setShowSettings(false);
    alert('設定を保存しました。');
  };

  return (
    <div className="container">
      {showSettings && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-card" style={{ padding: '2rem', width: '500px', maxWidth: '90%' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}><Settings size={20} /> Settings</h3>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>
                Google Cloud Vision API キー
              </label>
              <input 
                type="password" 
                placeholder="AIzaSy..." 
                value={visionApiKey} 
                onChange={(e) => setVisionApiKey(e.target.value)}
                style={{ width: '100%', padding: '0.5rem' }}
              />
              <p style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.5rem' }}>画像のテキストを高精度に読み取るために使用します。</p>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>
                Google Apps Script Web App URL
              </label>
              <input 
                type="text" 
                placeholder="https://script.google.com/macros/s/.../exec" 
                value={gasApiUrl} 
                onChange={(e) => setGasApiUrl(e.target.value)}
                style={{ width: '100%', padding: '0.5rem' }}
              />
              <p style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: '0.5rem' }}>スプレッドシートとデータをやり取りするためのURLです。</p>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setShowSettings(false)}>キャンセル</button>
              <button className="btn-primary" onClick={saveSettings}>保存</button>
            </div>
          </div>
        </div>
      )}

      <header className="glass-panel">
        <h1>{t('app_title')}</h1>
        <div className="header-controls">
          <button className="btn btn-outline" onClick={() => setShowSettings(true)} title="設定">
            <Settings size={18} />
          </button>
          <button className="btn btn-outline" onClick={toggleTheme} title={t('theme_toggle')}>
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button className="btn btn-outline" onClick={toggleLanguage} title={t('lang_toggle')}>
            <Globe size={18} />
            {t('lang_toggle')}
          </button>
        </div>
      </header>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          {t('tab_list')}
        </button>
        <button 
          className={`tab ${activeTab === 'add' ? 'active' : ''}`}
          onClick={() => setActiveTab('add')}
        >
          {t('tab_add')}
        </button>
      </div>

      <main className="glass-panel">
        {activeTab === 'list' 
          ? <InventoryList gasApiUrl={gasApiUrl} /> 
          : <AddItem 
              onAdded={() => setActiveTab('list')} 
              visionApiKey={visionApiKey} 
              gasApiUrl={gasApiUrl}
              onOpenSettings={() => setShowSettings(true)}
            />
        }
      </main>
    </div>
  );
}

export default App;
