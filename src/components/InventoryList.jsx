import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Loader2, Filter, X, ChevronDown, ChevronUp, Edit2 } from 'lucide-react';

const InventoryList = ({ gasApiUrl, columns = [], onEditItem }) => {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  
  // Advanced search state
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({});
  
  // Inline editing state
  const [editingQty, setEditingQty] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [autocompleteOptions, setAutocompleteOptions] = useState({});

  useEffect(() => {
    if (items.length > 0 && columns.length > 0) {
      const options = {};
      columns.forEach(c => {
        const lowerId = c.id.toLowerCase();
        if (c.id !== 'ID' && !['qty', '数量', '個数', 'note', '備考', '仕様', 'リンク', 'url', 'データシート', 'datasheet', 'メモ', 'memo', '新規追加日', '最終更新日'].includes(lowerId) && !lowerId.includes('date') && !lowerId.includes('日')) {
          options[c.id] = [...new Set(items.map(i => i[c.id]).filter(Boolean))];
        }
      });
      setAutocompleteOptions(options);
    }
  }, [items, columns]);

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

  const updateQuantity = async (item, qtyKey, newQty) => {
    if (!gasApiUrl) return;
    
    const evaluateMathExpression = (expr) => {
      if (typeof expr !== 'string') return expr;
      let normalized = expr.replace(/＋/g, '+').replace(/－/g, '-').replace(/ー/g, '-').trim();
      try {
        if (/^[-+\d\s.]+$/.test(normalized)) {
          const sum = new Function(`return ${normalized}`)();
          if (!isNaN(sum)) return sum.toString();
        }
      } catch(e) {}
      return expr;
    };
    
    const evaluatedQty = evaluateMathExpression(newQty);
    
    if (String(item[qtyKey]) === String(evaluatedQty)) {
      setEditingQty(null);
      return;
    }
    
    setUpdatingId(item.ID);
    const updatedItem = { ...item, [qtyKey]: evaluatedQty };
    
    try {
      const response = await fetch(gasApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'update', item: updatedItem })
      });
      const data = await response.json();
      
      if (data.status === 'success') {
        setItems(prev => prev.map(i => i.ID === item.ID ? updatedItem : i));
      } else {
        alert('エラー: ' + data.message);
      }
    } catch (err) {
      alert('通信エラーが発生しました。設定URLを確認してください。');
    } finally {
      setUpdatingId(null);
      setEditingQty(null);
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
        
        if (key === 'Qty' || key === '数量' || key === '個数') {
          const fStr = filterVal.trim();
          const numVal = parseFloat(itemVal);
          if (isNaN(numVal)) return false; 
          
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
            if (numVal !== parseFloat(fStr)) return false;
          }
        } else if (key.includes('日') || key.toLowerCase().includes('date')) {
          const fStr = filterVal.trim().replace(/～/g, '~');
          const itemDate = new Date(itemVal);
          
          if (isNaN(itemDate.getTime())) {
            if (!String(itemVal).toLowerCase().includes(filterVal.toLowerCase().trim())) return false;
          } else {
            if (fStr.includes('~')) {
              const [minStr, maxStr] = fStr.split('~');
              const minD = new Date(minStr.trim());
              const maxD = new Date(maxStr.trim());
              if (!isNaN(minD) && itemDate < minD) return false;
              if (!isNaN(maxD)) {
                if (maxStr.trim().length <= 10) maxD.setHours(23, 59, 59, 999);
                if (itemDate > maxD) return false;
              }
            } else if (fStr.startsWith('>=')) {
              const d = new Date(fStr.slice(2).trim());
              if (!isNaN(d) && itemDate < d) return false;
            } else if (fStr.startsWith('<=')) {
              const d = new Date(fStr.slice(2).trim());
              if (!isNaN(d)) {
                if (fStr.slice(2).trim().length <= 10) d.setHours(23, 59, 59, 999);
                if (itemDate > d) return false;
              }
            } else if (fStr.startsWith('>')) {
              const d = new Date(fStr.slice(1).trim());
              if (!isNaN(d)) {
                if (fStr.slice(1).trim().length <= 10) d.setHours(23, 59, 59, 999);
                if (itemDate <= d) return false;
              }
            } else if (fStr.startsWith('<')) {
              const d = new Date(fStr.slice(1).trim());
              if (!isNaN(d) && itemDate >= d) return false;
            } else {
              if (!String(itemVal).toLowerCase().includes(fStr.toLowerCase())) return false;
            }
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
              {columns.filter(c => c.id !== 'ID').map(c => c.id).map(col => (
                <div key={col}>
                  <label style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.25rem', opacity: 0.8 }}>
                    {col}
                    {(col === 'Qty' || col === '数量' || col === '個数') && <span style={{ fontSize: '0.7rem', opacity: 0.6, marginLeft: '0.25rem' }}>(例: &gt;=10, 1-5)</span>}
                    {(col.includes('日') || col.toLowerCase().includes('date')) && <span style={{ fontSize: '0.7rem', opacity: 0.6, marginLeft: '0.25rem' }}>(例: &gt;2026/01/01, 2026/01~2026/12)</span>}
                  </label>
                  <input
                    type="text"
                    list={autocompleteOptions[col] && autocompleteOptions[col].length > 0 ? `${col}-advanced-list` : undefined}
                    value={advancedFilters[col] || ''}
                    onChange={(e) => setAdvancedFilters(prev => ({ ...prev, [col]: e.target.value }))}
                    placeholder={`${col}で絞り込み...`}
                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.9rem' }}
                  />
                  {autocompleteOptions[col] && autocompleteOptions[col].length > 0 && (
                    <datalist id={`${col}-advanced-list`}>
                      {autocompleteOptions[col].map((opt, i) => (
                        <option key={i} value={opt} />
                      ))}
                    </datalist>
                  )}
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
                <th style={{ padding: '1rem', color: 'var(--primary-color)', whiteSpace: 'nowrap' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {sortedItems.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background-color 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  {finalVisibleColumns.map((key) => (
                    <td key={key} style={{ padding: '1rem', whiteSpace: key.includes('Note') ? 'normal' : 'nowrap' }}>
                      {['qty', '数量', '個数'].includes(key.toLowerCase()) ? (
                        editingQty?.rowId === item.ID && editingQty?.key === key ? (
                          <input 
                            type="text"
                            value={editingQty.value}
                            autoFocus
                            onChange={e => setEditingQty({ ...editingQty, value: e.target.value })}
                            onBlur={() => updateQuantity(item, key, editingQty.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') updateQuantity(item, key, editingQty.value);
                              if (e.key === 'Escape') setEditingQty(null);
                            }}
                            style={{ width: '80px', padding: '0.25rem', border: '1px solid var(--primary-color)', borderRadius: '4px', backgroundColor: 'var(--bg-color)', color: 'var(--text-color)' }}
                            disabled={updatingId === item.ID}
                          />
                        ) : (
                          <div 
                            style={{ 
                              cursor: 'pointer', 
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '0.25rem 0.75rem', 
                              backgroundColor: 'rgba(59, 130, 246, 0.1)', 
                              border: '1px solid rgba(59, 130, 246, 0.3)',
                              borderRadius: '4px',
                              minWidth: '3rem',
                              opacity: updatingId === item.ID ? 0.5 : 1,
                              transition: 'all 0.2s'
                            }}
                            onClick={() => setEditingQty({ rowId: item.ID, key, value: item[key] || '' })}
                            title="クリックして数量を変更"
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)'}
                          >
                            {updatingId === item.ID ? <Loader2 size={16} className="lucide-spin" /> : (item[key] || '0')}
                          </div>
                        )
                      ) : ['リンク', 'データシート', 'url', 'link', 'datasheet'].includes(key.toLowerCase()) ? (
                        item[key] ? (
                          <a 
                            href={item[key]} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ 
                              color: 'var(--primary-color)', 
                              textDecoration: 'underline',
                              display: 'inline-block',
                              maxWidth: '150px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              verticalAlign: 'middle'
                            }}
                            title={item[key]}
                          >
                            {item[key]}
                          </a>
                        ) : ''
                      ) : key.toLowerCase().includes('category') ? (
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
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <button
                      className="btn-outline"
                      style={{ padding: '0.4rem', border: 'none', color: 'var(--primary-color)', borderRadius: '4px' }}
                      onClick={() => onEditItem && onEditItem(item)}
                      title="詳細編集"
                    >
                      <Edit2 size={16} />
                    </button>
                  </td>
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
