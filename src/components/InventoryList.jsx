import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Loader2 } from 'lucide-react';

const InventoryList = ({ gasApiUrl, columns = [] }) => {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });

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

  // Cross-column incremental search with multi-keyword AND support
  const filteredItems = items.filter(item => {
    if (!searchTerm.trim()) return true;
    
    // Split search term by spaces to get individual keywords
    const terms = searchTerm.toLowerCase().trim().split(/\s+/);
    
    // For every keyword, it must be found in at least one of the item's values (AND logic)
    return terms.every(term => 
      Object.values(item).some(val => 
        String(val).toLowerCase().includes(term)
      )
    );
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
        <div style={{ position: 'relative' }}>
          <Search style={{ position: 'absolute', top: '12px', left: '12px', opacity: 0.5 }} size={20} />
          <input 
            type="text" 
            placeholder={t('search_placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '40px' }}
          />
        </div>
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
