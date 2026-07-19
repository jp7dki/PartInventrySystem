import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Moon, Sun, Settings, HelpCircle } from 'lucide-react';
import InventoryList from './components/InventoryList';
import AddItem from './components/AddItem';
import HelpModal from './components/HelpModal';

function App() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('list');
  const [theme, setTheme] = useState('light');
  const [itemToEdit, setItemToEdit] = useState(null);
  
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [visionApiKey, setVisionApiKey] = useState(localStorage.getItem('VISION_API_KEY') || '');
  const [gasApiUrl, setGasApiUrl] = useState(localStorage.getItem('GAS_API_URL') || '');

  const DEMO_DATA = [
    { 'ID': 'DEMO-001', 'カテゴリ1': 'IC', 'カテゴリ2': 'マイコン', 'メーカー': 'Espressif', '型番': 'ESP32-WROOM-32E', '数量': '15', 'location 1': 'A棚', 'location 2': '1段目', 'Note': 'Wi-Fi/Bluetooth対応', 'サプライヤコード': '113421', 'サプライヤ': '秋月電子', 'データシート': '', 'リンク': '', 'メモ': '', '新規追加日': '2026/07/19 12:00', '最終更新日': '2026/07/19 12:00' },
    { 'ID': 'DEMO-002', 'カテゴリ1': '受動部品', 'カテゴリ2': '抵抗', 'メーカー': 'Yageo', '型番': 'RC0402FR-0710KL', '数量': '100', 'location 1': 'B棚', 'location 2': '2段目', 'Note': '1/4W 1% 10kΩ', 'サプライヤコード': '100035', 'サプライヤ': '秋月電子', 'データシート': '', 'リンク': '', 'メモ': '', '新規追加日': '2026/07/19 12:01', '最終更新日': '2026/07/19 12:01' },
    { 'ID': 'DEMO-003', 'カテゴリ1': '受動部品', 'カテゴリ2': 'コンデンサ', 'メーカー': '村田製作所', '型番': 'GRM155R71C104KA88D', '数量': '50', 'location 1': 'B棚', 'location 2': '3段目', 'Note': '0.1uF 16V', 'サプライヤコード': '104321', 'サプライヤ': '秋月電子', 'データシート': '', 'リンク': '', 'メモ': '', '新規追加日': '2026/07/19 12:02', '最終更新日': '2026/07/19 12:02' },
    { 'ID': 'DEMO-004', 'カテゴリ1': 'センサー', 'カテゴリ2': '温湿度', 'メーカー': 'Sensirion', '型番': 'SHT31-DIS-B', '数量': '3', 'location 1': 'A棚', 'location 2': '2段目', 'Note': 'I2C接続', 'サプライヤコード': '112040', 'サプライヤ': '秋月電子', 'データシート': '', 'リンク': '', 'メモ': '', '新規追加日': '2026/07/19 12:03', '最終更新日': '2026/07/19 12:03' },
    { 'ID': 'DEMO-005', 'カテゴリ1': '機構部品', 'カテゴリ2': 'スイッチ', 'メーカー': 'アルプスアルパイン', '型番': 'SKHHAMA010', '数量': '20', 'location 1': 'C棚', 'location 2': '1段目', 'Note': 'タクトスイッチ', 'サプライヤコード': '', 'サプライヤ': 'マルツ', 'データシート': '', 'リンク': '', 'メモ': '', '新規追加日': '2026/07/19 12:04', '最終更新日': '2026/07/19 12:04' },
  ];
  
  const [demoItems, setDemoItems] = useState(DEMO_DATA);
  const isDemoMode = !gasApiUrl || gasApiUrl.trim() === '';
  
  const defaultCols = [
    { id: 'ID', visible: false },
    { id: '型番', visible: true },
    { id: 'メーカー', visible: true },
    { id: '数量', visible: true },
    { id: 'カテゴリ1', visible: true },
    { id: 'カテゴリ2', visible: true },
    { id: 'location 1', visible: true },
    { id: 'location 2', visible: true },
    { id: 'Note', visible: false },
    { id: 'サプライヤコード', visible: true },
    { id: 'サプライヤ', visible: true },
    { id: 'データシート', visible: true },
    { id: 'リンク', visible: true },
    { id: 'メモ', visible: true },
    { id: '最終更新日', visible: false },
    { id: '新規追加日', visible: false }
  ];

  const [columns, setColumns] = useState(() => {
    const saved = localStorage.getItem('COLUMNS_SETTINGS_V2');
    if (saved) {
      let parsed = JSON.parse(saved);
      defaultCols.forEach(dc => {
        if (!parsed.find(p => p.id === dc.id)) {
          parsed.push(dc);
        }
      });
      return parsed;
    }
    return defaultCols;
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const saveSettings = () => {
    const trimmedVisionKey = visionApiKey.trim();
    const trimmedGasUrl = gasApiUrl.trim();
    localStorage.setItem('VISION_API_KEY', trimmedVisionKey);
    localStorage.setItem('GAS_API_URL', trimmedGasUrl);
    localStorage.setItem('COLUMNS_SETTINGS_V2', JSON.stringify(columns));
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
            
            <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'rgba(59, 130, 246, 0.05)', borderRadius: '8px', border: '1px dashed var(--primary-color)' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', color: 'var(--primary-color)' }}>📖 初期設定マニュアル</h4>
              <p style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: '0.75rem', lineHeight: '1.4' }}>
                スプレッドシートの連携など、詳しい初期設定の手順はこちらをご覧ください。
              </p>
              <a 
                href="https://github.com/jp7dki/PartInventrySystem/wiki" 
                target="_blank" 
                rel="noreferrer"
                className="btn-primary"
                style={{ display: 'inline-block', textDecoration: 'none', fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
              >
                初期設定方法を見る (Wiki)
              </a>
            </div>
            
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
              <details style={{ fontSize: '0.85rem', marginTop: '0.5rem', backgroundColor: 'var(--bg-color)', padding: '0.5rem', borderRadius: '4px' }}>
                <summary style={{ cursor: 'pointer', color: 'var(--primary-color)' }}>※取得手順を開く</summary>
                <ol style={{ paddingLeft: '1.5rem', marginTop: '0.5rem', lineHeight: '1.5', margin: '0.5rem 0 0 0' }}>
                  <li>Google Cloud Platformにて「Cloud Vision API」を有効化します（一定の利用枠までは無料でご利用いただけます）。</li>
                  <li>認証情報画面から「APIキー」を作成し、文字列をコピーします。</li>
                  <li>コピーしたキーを上の入力欄に貼り付けます。</li>
                </ol>
              </details>
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
              <details style={{ fontSize: '0.85rem', marginTop: '0.5rem', backgroundColor: 'var(--bg-color)', padding: '0.5rem', borderRadius: '4px' }}>
                <summary style={{ cursor: 'pointer', color: 'var(--primary-color)' }}>※取得手順を開く</summary>
                <ol style={{ paddingLeft: '1.5rem', marginTop: '0.5rem', lineHeight: '1.5', margin: '0.5rem 0 0 0' }}>
                  <li>この画面下の「テンプレートをコピー作成」ボタンをクリックし、ご自身のドライブに表を作成します。</li>
                  <li>作成した表の上部メニューから<strong>「拡張機能」＞「Apps Script」</strong>を選択します。</li>
                  <li>右上の青いボタン<strong>「デプロイ」＞「新しいデプロイ」</strong>を選択し、そのまま<strong>「デプロイ」</strong>を実行します（承認画面が出たら許可してください）。</li>
                  <li>完了後に表示される<strong>「ウェブアプリのURL」</strong>をコピーし、上の入力欄に貼り付けます。</li>
                </ol>
              </details>
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
                {columns.filter(c => c.id !== 'ID').map((col, idx, arr) => {
                  // 元の配列(columns)におけるインデックスを探す
                  const index = columns.findIndex(c => c.id === col.id);
                  return (
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
                        disabled={idx === 0}
                        onClick={() => {
                          const newCols = [...columns];
                          // find prev visible/filtered index to swap with
                          const prevId = arr[idx - 1].id;
                          const prevOriginalIndex = columns.findIndex(c => c.id === prevId);
                          const temp = newCols[prevOriginalIndex];
                          newCols[prevOriginalIndex] = newCols[index];
                          newCols[index] = temp;
                          setColumns(newCols);
                        }}
                      >▲</button>
                      <button 
                        className="btn-outline" 
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', opacity: index === columns.length - 1 ? 0.3 : 1, cursor: index === columns.length - 1 ? 'not-allowed' : 'pointer' }}
                        disabled={idx === arr.length - 1}
                        onClick={() => {
                          const newCols = [...columns];
                          // find next visible/filtered index to swap with
                          const nextId = arr[idx + 1].id;
                          const nextOriginalIndex = columns.findIndex(c => c.id === nextId);
                          const temp = newCols[nextOriginalIndex];
                          newCols[nextOriginalIndex] = newCols[index];
                          newCols[index] = temp;
                          setColumns(newCols);
                        }}
                      >▼</button>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setShowSettings(false)}>キャンセル</button>
              <button className="btn-primary" onClick={saveSettings}>保存</button>
            </div>
          </div>
        </div>
      )}

      <header className="glass-panel" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img src="./logo.png" alt="logo" style={{ width: '48px', height: '48px', objectFit: 'contain', imageRendering: 'pixelated' }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h1 style={{ marginBottom: '0.1rem' }}>たなばんちゃん</h1>
            <span style={{ fontSize: '0.85rem', opacity: 0.8, fontWeight: 500 }}>電子部品在庫管理システム</span>
          </div>
        </div>
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
        </div>
      </header>

      {isDemoMode && (
        <div style={{ padding: '0.75rem', backgroundColor: 'var(--primary-color)', color: 'white', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <span style={{ fontWeight: 'bold' }}>【デモモード作動中】</span>
            <span style={{ fontSize: '0.9rem', marginLeft: '0.5rem' }}>現在はブラウザ上のサンプルデータで動作しています。リロードすると初期化されます。</span>
          </div>
          <button onClick={() => setShowSettings(true)} style={{ backgroundColor: 'white', color: 'var(--primary-color)', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>設定を開く</button>
        </div>
      )}

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          {t('tab_list')}
        </button>
        <button 
          className={`tab ${activeTab === 'add' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('add');
            setItemToEdit(null);
          }}
        >
          {t('tab_add')} {itemToEdit ? '(編集)' : ''}
        </button>
      </div>

      <main className="glass-panel">
        {activeTab === 'list' && (
          <InventoryList 
            gasApiUrl={gasApiUrl} 
            columns={columns} 
            isDemoMode={isDemoMode}
            demoItems={demoItems}
            setDemoItems={setDemoItems}
            onEditItem={(item) => {
              setItemToEdit(item);
              setActiveTab('add');
            }}
          />
        )}
        {activeTab === 'add' && (
          <AddItem 
            onAdded={() => {
              setActiveTab('list');
              setItemToEdit(null);
            }} 
            visionApiKey={visionApiKey}
            gasApiUrl={gasApiUrl}
            onOpenSettings={() => setShowSettings(true)}
            columns={columns}
            itemToEdit={itemToEdit}
            onCancelEdit={() => setItemToEdit(null)}
            isDemoMode={isDemoMode}
            demoItems={demoItems}
            setDemoItems={setDemoItems}
          />
        )}
      </main>

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  );
}

export default App;
