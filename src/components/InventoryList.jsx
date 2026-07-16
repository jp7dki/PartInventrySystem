import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Loader2 } from 'lucide-react';

const InventoryList = ({ gasApiUrl }) => {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, [gasApiUrl]);

  const fetchData = async () => {
    setLoading(true);
    if (!gasApiUrl) {
      // Mock data for demonstration if URL is not set
      setTimeout(() => {
        setItems([
          { 'ID': '001', 'Category 1': 'IC', 'Category 2': 'Microcontroller', 'Manufacturer': 'Espressif', 'Part number': 'ESP32-WROOM-32E', 'Qty': '5', 'location 1': 'Box A', 'location 2': 'Drawer 1', 'Note': 'Wi-Fi/BT', 'Akiduki': '' },
          { 'ID': '002', 'Category 1': 'Passive', 'Category 2': 'Resistor', 'Manufacturer': 'Yageo', 'Part number': 'RC0402FR-0710KL', 'Qty': '100', 'location 1': 'Box B', 'location 2': 'Drawer 2', 'Note': '1/4W 1%', 'Akiduki': 'M-12345' }
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

  // Cross-column incremental search
  const filteredItems = items.filter(item => {
    if (!searchTerm) return true;
    const lowerSearchTerm = searchTerm.toLowerCase();
    return Object.values(item).some(val => 
      String(val).toLowerCase().includes(lowerSearchTerm)
    );
  });

  return (
    <div className="inventory-list">
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
                {Object.keys(items[0] || {}).map((key) => (
                  <th key={key} style={{ padding: '1rem', color: 'var(--primary-color)', whiteSpace: 'nowrap' }}>{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background-color 0.2s' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  {Object.keys(items[0] || {}).map((key) => (
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
