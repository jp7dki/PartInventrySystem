import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Moon, Sun, Settings, HelpCircle } from 'lucide-react';
import InventoryList from './components/InventoryList';
import AddItem from './components/AddItem';
import HelpModal from './components/HelpModal';

function App() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('list');
  const [theme, setTheme] = useState('light');
  
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [visionApiKey, setVisionApiKey] = useState(localStorage.getItem('VISION_API_KEY') || '');
  const [gasApiUrl, setGasApiUrl] = useState(localStorage.getItem('GAS_API_URL') || '');
  
  const defaultCols = [
    { id: 'Category 1', visible: true },
    { id: 'Category 2', visible: true },
    { id: 'Manufacturer', visible: true },
    { id: 'Part number', visible: true },
    { id: 'Qty', visible: true },
    { id: 'location 1', visible: true },
    { id: 'location 2', visible: true },
    { id: 'Note', visible: true },
    { id: 'Supplier Part Number', visible: true },
    { id: 'ID', visible: false }
  ];

  const [columns, setColumns] = useState(() => {
    const saved = localStorage.getItem('COLUMNS_SETTINGS');
    return saved ? JSON.parse(saved) : defaultCols;
  });
  const [newColumnName, setNewColumnName] = useState('');

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
    localStorage.setItem('COLUMNS_SETTINGS', JSON.stringify(columns));
    setVisionApiKey(trimmedVisionKey);
    setGasApiUrl(trimmedGasUrl);

    if (trimmedGasUrl) {
      try {
        fetch(trimmedGasUrl, {
          method: 'POST',
          body: JSON.stringify({
            action: 'syncHeaders',
            headers: columns.map(c => c.id)
          }),
          headers: { 'Content-Type': 'text/plain;charset=utf-8' }
        });
      } catch (err) {
        console.error('Failed to sync headers', err);
      }
    }

    setShowSettings(false);
    alert('設定を保存しました。');
  };

  return (
    <div className="container">
      {showSettings && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel" style={{ padding: '2rem', width: '500px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
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

            <div style={{ marginBottom: '2rem' }}>
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

            <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: 'rgba(59, 130, 246, 0.05)', borderRadius: '8px', border: '1px dashed var(--primary-color)' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', color: 'var(--primary-color)' }}>新しいデータベース（スプレッドシート）を作成</h4>
              <p style={{ fontSize: '0.8rem', opacity: 0.8, marginBottom: '1rem', lineHeight: '1.4' }}>
                あらかじめ連携プログラム（GAS）が組み込まれたひな形を、ご自身のGoogleドライブにワンクリックで複製できます。
              </p>
              <a 
                href="https://docs.google.com/spreadsheets/d/134xyuHrr2VSNGJx_pIHy8u3OluYRhi6BPKQvNSylaVo/copy" 
                target="_blank" 
                rel="noreferrer"
                className="btn-primary"
                style={{ display: 'inline-block', textDecoration: 'none', fontSize: '0.85rem', padding: '0.5rem 1rem' }}
              >
                テンプレートをコピー作成
              </a>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>
                一覧に表示する列と順番
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '1rem', background: 'var(--input-bg)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                {columns.map((col, index) => (
                  <div key={col.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem', backgroundColor: 'var(--bg-color)', borderRadius: '4px', border: '1px solid var(--glass-border)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', flex: 1, overflow: 'hidden' }}>
                      <input 
                        type="checkbox" 
                        checked={col.visible} 
                        style={{ width: 'auto', margin: 0, flexShrink: 0 }}
                        onChange={(e) => {
                          const newCols = [...columns];
                          newCols[index].visible = e.target.checked;
                          setColumns(newCols);
                        }} 
                      />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{col.id}</span>
                    </label>
                    <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                      <button 
                        className="btn-outline" 
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', opacity: index === 0 ? 0.3 : 1, cursor: index === 0 ? 'not-allowed' : 'pointer' }}
                        disabled={index === 0}
                        onClick={() => {
                          const newCols = [...columns];
                          const temp = newCols[index - 1];
                          newCols[index - 1] = newCols[index];
                          newCols[index] = temp;
                          setColumns(newCols);
                        }}
                      >▲</button>
                      <button 
                        className="btn-outline" 
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', opacity: index === columns.length - 1 ? 0.3 : 1, cursor: index === columns.length - 1 ? 'not-allowed' : 'pointer' }}
                        disabled={index === columns.length - 1}
                        onClick={() => {
                          const newCols = [...columns];
                          const temp = newCols[index + 1];
                          newCols[index + 1] = newCols[index];
                          newCols[index] = temp;
                          setColumns(newCols);
                        }}
                      >▼</button>
                      {col.id !== 'ID' && (
                        <button 
                          type="button"
                          className="btn-outline" 
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', color: 'var(--danger-color)' }}
                          title="削除"
                          onClick={() => {
                            if(window.confirm(`「${col.id}」列を削除しますか？`)) {
                              setColumns(columns.filter(c => c.id !== col.id));
                            }
                          }}
                        >✖</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <input 
                  type="text" 
                  placeholder="新しい列の名前..." 
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  style={{ flex: 1, padding: '0.5rem' }}
                />
                <button 
                  type="button"
                  className="btn-primary" 
                  style={{ padding: '0.5rem 1rem' }}
                  onClick={() => {
                    const trimmed = newColumnName.trim();
                    if (trimmed && !columns.find(c => c.id === trimmed)) {
                      setColumns([...columns, { id: trimmed, visible: true }]);
                      setNewColumnName('');
                    }
                  }}
                  disabled={!newColumnName.trim()}
                >追加</button>
              </div>
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
          <button className="btn btn-outline" onClick={() => setShowHelp(true)} title="使い方">
            <HelpCircle size={18} />
          </button>
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
          ? <InventoryList gasApiUrl={gasApiUrl} columns={columns} /> 
          : <AddItem 
              onAdded={() => setActiveTab('list')} 
              visionApiKey={visionApiKey} 
              gasApiUrl={gasApiUrl}
              onOpenSettings={() => setShowSettings(true)}
              columns={columns}
            />
        }
      </main>

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  );
}

export default App;
