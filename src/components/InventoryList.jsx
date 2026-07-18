import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Loader2, Filter, X, ChevronDown, ChevronUp } from 'lucide-react';

const InventoryList = ({ gasApiUrl, columns = [] }) => {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  
  // Advanced search state
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({});

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  useEffect(() => {
    fetchData();
  }, [gasApiUrl]);

  const fetchData = async () => {
    setLoading(true);
    if (!gasApiUrl) {
      // Mock data for demonstration if URL is not set
      setTimeout(() => {
        setItems([
          { 'ID': '001', 'カテゴリ1': 'IC', 'カテゴリ2': 'マイコン', 'メーカー': 'Espressif', '型番': 'ESP32-WROOM-32E', '数量': '5', 'location 1': 'Box A', 'location 2': 'Drawer 1', 'Note': 'Wi-Fi/BT', 'サプライヤコード': '', 'サプライヤ': '秋月電子', 'データシート': '', 'リンク': '', 'メモ': '' },
          { 'ID': '002', 'カテゴリ1': '受動部品', 'カテゴリ2': '抵抗', 'メーカー': 'Yageo', '型番': 'RC0402FR-0710KL', '数量': '100', 'location 1': 'Box B', 'location 2': 'Drawer 2', 'Note': '1/4W 1%', 'サプライヤコード': '100035', 'サプライヤ': '秋月電子', 'データシート': '', 'リンク': '', 'メモ': '' }
        ]);
        setLoading(false);
      }, 1000);
      return;
    }

    try {
      const response = await fetch(gasApiUrl);
      const data = await response.json();
      if (data.status === 'success') {
        setItems(data.data);
      } else {
        setError(data.message || 'Error fetching data');
      }
    } catch (err) {
      const errMsg = err.toString();
      if (errMsg.includes('Load failed') || errMsg.includes('Failed to fetch')) {
        setError('通信エラー (CORS / Load failed)。URLが間違っているか、GASの「アクセスできるユーザー」が「全員」になっていない可能性があります。');
      } else {
        setError(errMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Cross-column incremental search with multi-keyword AND support + Advanced filters
  const filteredItems = items.filter(item => {
    // 1. Check global search term
    if (searchTerm.trim()) {
      const terms = searchTerm.toLowerCase().trim().split(/\s+/);
      const matchesGlobal = terms.every(term => 
        Object.values(item).some(val => 
          String(val).toLowerCase().includes(term)
        )
      );
      if (!matchesGlobal) return false;
    }
    
    // 2. Check advanced filters
    if (showAdvancedSearch) {
      for (const [key, filterVal] of Object.entries(advancedFilters)) {
        if (!filterVal || filterVal.trim() === '') continue;
        
        const itemVal = item[key] || '';
        
        if (key === 'Qty' || key === '数量') {
          // Parse range for Qty. Format expected: "min-max" or ">min" or "<max" or exact "val"
          // For simplicity, let's provide a text input that handles simple ranges or exact matches.
          // Or even simpler: just simple text match for now unless we build specific min/max UI.
          // Wait, user asked for "在庫数などを絞って". Let's support simple syntax like ">=10" or "10-20" or just use separate min/max state.
          // To make it easy and robust, let's parse simple operators: ">10", "<=5", "10-20", or just plain number match.
          const fStr = filterVal.trim();
          const numVal = parseFloat(itemVal);
          if (isNaN(numVal)) return false; // If item has no valid qty, it fails number filter
          
          if (fStr.includes('-')) {
            const [min, max] = fStr.split('-').map(s => parseFloat(s.trim()));
            if (!isNaN(min) && numVal < min) return false;
            if (!isNaN(max) && numVal > max) return false;
          } else if (fStr.startsWith('>=')) {
            if (numVal < parseFloat(fStr.slice(2))) return false;
          } else if (fStr.startsWith('<=')) {
            if (numVal > parseFloat(fStr.slice(2))) return false;
          } else if (fStr.startsWith('>')) {
            if (numVal <= parseFloat(fStr.slice(1))) return false;
          } else if (fStr.startsWith('<')) {
            if (numVal >= parseFloat(fStr.slice(1))) return false;
          } else {
            // exact match
            if (numVal !== parseFloat(fStr)) return false;
          }
        } else {
          // Generic text include
          if (!String(itemVal).toLowerCase().includes(filterVal.toLowerCase().trim())) {
            return false;
          }
        }
      }
    }
    
    return true;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    const aVal = a[sortConfig.key] || '';
    const bVal = b[sortConfig.key] || '';

    // Handle numeric sorting for Qty
    if (sortConfig.key === 'Qty' || sortConfig.key === '数量') {
      const aNum = parseFloat(aVal) || 0;
      const bNum = parseFloat(bVal) || 0;
      if (aNum < bNum) return sortConfig.direction === 'ascending' ? -1 : 1;
      if (aNum > bNum) return sortConfig.direction === 'ascending' ? 1 : -1;
      return 0;
    }
    
    // Default string sorting
    if (aVal < bVal) return sortConfig.direction === 'ascending' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'ascending' ? 1 : -1;
    return 0;
  });

  // Calculate the final order of columns to display
  let finalVisibleColumns = [];
  if (items.length > 0) {
    const itemKeys = Object.keys(items[0]);
    // Start with the user's custom ordered, visible columns (explicitly filter out ID just in case)
    const customVisibleKeys = columns.filter(c => c.visible && c.id !== 'ID').map(c => c.id);
    
    // Ensure they actually exist in the data (or at least filter them if you want, but even if they don't exist, we can render empty cells)
    // Actually, if we just use customVisibleKeys, empty columns will just render empty which is fine.
    // Let's filter to only those that exist in the data, just to avoid completely blank columns if the backend doesn't return them, 
    // OR we can just use customVisibleKeys directly so the fixed schema is ALWAYS respected.
    // Given the user wants fixed columns, let's just use customVisibleKeys directly.
    finalVisibleColumns = customVisibleKeys;
  }

  return (
    <div className="inventory-list-container">
      <div className="search-bar mb-4">
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search style={{ position: 'absolute', top: '12px', left: '12px', opacity: 0.5 }} size={20} />
            <input 
              type="text" 
              placeholder={t('search_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '40px' }}
            />
          </div>
          <button 
            className={`btn-outline ${showAdvancedSearch ? 'active' : ''}`}
            onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.5rem', 
              padding: '0 1rem', borderRadius: '8px',
              backgroundColor: showAdvancedSearch ? 'var(--primary-color)' : 'transparent',
              color: showAdvancedSearch ? 'white' : 'var(--text-color)',
              borderColor: showAdvancedSearch ? 'var(--primary-color)' : 'var(--glass-border)',
              transition: 'all 0.2s'
            }}
            title="詳細検索"
          >
            <Filter size={18} />
            <span style={{ display: window.innerWidth > 600 ? 'inline' : 'none' }}>詳細検索</span>
          </button>
        </div>
        
        {/* Advanced Search Panel */}
        {showAdvancedSearch && (
          <div style={{ 
            marginTop: '1rem', padding: '1.5rem', 
            backgroundColor: 'var(--bg-color)', 
            borderRadius: '8px', border: '1px solid var(--glass-border)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1rem', margin: 0, color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Filter size={16} /> 詳細検索フィルター
              </h3>
              <button 
                className="btn-outline" 
                style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem', border: 'none' }}
                onClick={() => {
                  setAdvancedFilters({});
                  setShowAdvancedSearch(false);
                }}
              >
                クリアして閉じる <X size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
              {finalVisibleColumns.map(col => (
                <div key={col}>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem', opacity: 0.8 }}>
                    {col}
                    {(col === 'Qty' || col === '数量') && <span style={{ fontSize: '0.7rem', opacity: 0.6, marginLeft: '0.25rem' }}>(例: &gt;=10, 1-5)</span>}
                  </label>
                  <input
                    type="text"
                    value={advancedFilters[col] || ''}
                    onChange={(e) => setAdvancedFilters(prev => ({ ...prev, [col]: e.target.value }))}
                    placeholder={`${col}で絞り込み...`}
                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.9rem' }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center mt-4 gap-2">
          <Loader2 className="lucide-spin" size={24} style={{ animation: 'spin 1s linear infinite' }} /> {t('loading')}
        </div>
      ) : error ? (
        <div style={{ color: 'var(--danger-color)' }}>{error}</div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center mt-4" style={{ opacity: 0.7 }}>
          {t('no_data')}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--glass-border)' }}>
                {finalVisibleColumns.map((key) => (
                  <th 
                    key={key} 
                    style={{ padding: '1rem', color: 'var(--primary-color)', whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}
                    onClick={() => handleSort(key)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      {key}
                      <span style={{ fontSize: '0.8rem', opacity: sortConfig.key === key ? 1 : 0.3 }}>
                        {sortConfig.key === key ? (sortConfig.direction === 'ascending' ? '▲' : '▼') : '↕'}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedItems.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background-color 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  {finalVisibleColumns.map((key) => (
                    <td key={key} style={{ padding: '1rem', whiteSpace: key.includes('Note') ? 'normal' : 'nowrap' }}>
                      {key.toLowerCase().includes('category') ? (
                        <span style={{ 
                          backgroundColor: 'rgba(59, 130, 246, 0.1)', 
                          padding: '0.25rem 0.75rem', 
                          borderRadius: '9999px',
                          fontSize: '0.85rem'
                        }}>
                          {item[key] || ''}
                        </span>
                      ) : (
                        item[key] || ''
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default InventoryList;
