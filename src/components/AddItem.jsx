import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, Upload, Loader2, CheckCircle2, Key, Download } from 'lucide-react';

const AddItem = ({ onAdded, visionApiKey, gasApiUrl, onOpenSettings, columns = [] }) => {
  const { t } = useTranslation();
  
  const [formData, setFormData] = useState({
    'Category 1': '',
    'Category 2': '',
    'Manufacturer': '',
    'Part number': '',
    'Qty': '',
    'location 1': '',
    'location 2': '',
    'Note': '',
    'Supplier Part Number': ''
  });
  
  const [autocompleteOptions, setAutocompleteOptions] = useState({
    'Category 1': [],
    'Category 2': [],
    'Manufacturer': [],
    'location 1': [],
    'location 2': []
  });

  useEffect(() => {
    if (gasApiUrl && gasApiUrl.trim() !== '') {
      fetch(gasApiUrl)
        .then(res => res.json())
        .then(data => {
          if (data.status === 'success' && data.data) {
            const options = {
              'Category 1': [...new Set(data.data.map(i => i['Category 1']).filter(Boolean))],
              'Category 2': [...new Set(data.data.map(i => i['Category 2']).filter(Boolean))],
              'Manufacturer': [...new Set(data.data.map(i => i['Manufacturer']).filter(Boolean))],
              'location 1': [...new Set(data.data.map(i => i['location 1']).filter(Boolean))],
              'location 2': [...new Set(data.data.map(i => i['location 2']).filter(Boolean))]
            };
            setAutocompleteOptions(options);
          }
        })
        .catch(err => console.error('Failed to fetch autocomplete options:', err));
    }
  }, [gasApiUrl]);
  
  const [imageSrc, setImageSrc] = useState(null);
  const [ocrTextBlocks, setOcrTextBlocks] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [imgDim, setImgDim] = useState({ w: 0, h: 0, nw: 0, nh: 0 });
  
  const [akizukiCode, setAkizukiCode] = useState('');
  const [isFetchingAkizuki, setIsFetchingAkizuki] = useState(false);

  const fetchAkizuki = async (codeToFetch, isAuto = false) => {
    const targetCode = typeof codeToFetch === 'string' ? codeToFetch : akizukiCode;
    if (!targetCode || !targetCode.trim()) return;
    if (!gasApiUrl || gasApiUrl.trim() === '') {
      if (!isAuto) alert('エラー: 設定画面からGoogle Apps Script Web API URLを設定してください。');
      return;
    }
    
    setIsFetchingAkizuki(true);
    setAkizukiCode(targetCode);
    try {
      const response = await fetch(gasApiUrl, {
        method: 'POST',
        body: JSON.stringify({ action: 'scrapeAkizuki', code: targetCode }),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });
      const data = await response.json();
      
      if (data.status === 'success' && data.data) {
        // Map to fields based on column names
        const partNameId = columns.find(c => ['part number', '部品名', '商品名', '型番'].includes(c.id.toLowerCase()))?.id || 'Part number';
        const categoryId = columns.find(c => ['category 1', 'category', 'カテゴリ', '分類'].includes(c.id.toLowerCase()))?.id || 'Category 1';
        const supplierId = columns.find(c => ['supplier part number', '通販コード', '購入元コード', 'サプライヤコード'].includes(c.id.toLowerCase()))?.id || 'サプライヤコード';
        const supplierNameId = columns.find(c => ['supplier', 'サプライヤ', '購入先', '仕入先'].includes(c.id.toLowerCase()))?.id || 'サプライヤ';
        const manufacturerId = columns.find(c => ['manufacturer', 'メーカー', '製造元'].includes(c.id.toLowerCase()))?.id || 'メーカー';
        const linkId = columns.find(c => ['link', 'リンク', 'url'].includes(c.id.toLowerCase()))?.id || 'リンク';
        const datasheetId = columns.find(c => ['datasheet', 'データシート'].includes(c.id.toLowerCase()))?.id || 'データシート';
        const noteId = columns.find(c => ['note', '主な仕様', '仕様', '備考'].includes(c.id.toLowerCase()))?.id || 'Note';
        
        setFormData(prev => ({
          ...prev,
          [partNameId]: data.data.name || prev[partNameId] || '',
          [categoryId]: data.data.category || prev[categoryId] || '',
          [supplierId]: data.data.code || prev[supplierId] || '',
          [supplierNameId]: '秋月電子',
          [manufacturerId]: data.data.manufacturer || prev[manufacturerId] || '',
          [linkId]: data.data.link || prev[linkId] || '',
          [datasheetId]: data.data.datasheet || prev[datasheetId] || '',
          [noteId]: data.data.note || prev[noteId] || '',
        }));
        setAkizukiCode('');
      } else {
        if (!isAuto) alert(data.message || '商品情報の取得に失敗しました。通販コードを確認してください。');
      }
    } catch (err) {
      console.error(err);
      if (!isAuto) alert('通信エラーが発生しました。設定URLが正しいか確認してください。');
    } finally {
      setIsFetchingAkizuki(false);
    }
  };
  
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const imageRef = useRef(null);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!visionApiKey || visionApiKey.trim() === '') {
      alert('Google Cloud Vision APIキーが設定されていません。画面上部の設定ボタンから設定してください。');
      onOpenSettings();
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const img = new Image();
      img.onload = () => {
        const MAX_WIDTH = 1500;
        let width = img.width;
        let height = img.height;
        
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        const resizedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setImageSrc(resizedDataUrl);
        processOCR(resizedDataUrl);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const updateImageDimensions = () => {
    if (imageRef.current) {
      setImgDim({
        w: imageRef.current.width,
        h: imageRef.current.height,
        nw: imageRef.current.naturalWidth,
        nh: imageRef.current.naturalHeight
      });
    }
  };

  useEffect(() => {
    window.addEventListener('resize', updateImageDimensions);
    return () => window.removeEventListener('resize', updateImageDimensions);
  }, [imageSrc]);

  const processOCR = async (imgData) => {
    setIsProcessing(true);
    setOcrTextBlocks([]);
    try {
      // Remove data URL prefix
      const base64Image = imgData.replace(/^data:image\/(png|jpeg);base64,/, '');

      const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${visionApiKey.trim()}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              image: { content: base64Image },
              features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
              imageContext: { languageHints: ['ja', 'en'] }
            }
          ]
        })
      });

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error.message);
      }

      const extractedBlocks = [];
      const textAnnotations = result.responses?.[0]?.textAnnotations;

      let foundAkizukiCode = null;

      if (textAnnotations && textAnnotations.length > 0) {

        if (textAnnotations.length > 1) {
          // Skip the first element as it contains the full text
          for (let i = 1; i < textAnnotations.length; i++) {
            const annotation = textAnnotations[i];
            const vertices = annotation.boundingPoly.vertices;
            if (vertices && vertices.length === 4) {
              // Calculate bounding box bounding rect
              const xs = vertices.map(v => v.x || 0);
              const ys = vertices.map(v => v.y || 0);
              const x0 = Math.min(...xs);
              const y0 = Math.min(...ys);
              const x1 = Math.max(...xs);
              const y1 = Math.max(...ys);

              extractedBlocks.push({
                text: annotation.description,
                bbox: { x0, y0, x1, y1 }
              });
            }
          }
        }
      }

      // 抽出したブロックの中から通販コード（6桁の数字またはP-00035等）を探す
      // 誤認識（バーコード下の小さい数字等）を防ぐため、一番文字が大きい（高さが最大の）ものを採用する
      let maxBlockHeight = 0;
      for (const block of extractedBlocks) {
        const match = block.text.match(/\b([A-Za-z]-\d{5}|\d{6})\b/);
        if (match && match[1]) {
          const code = match[1];
          const height = block.bbox.y1 - block.bbox.y0;
          if (height > maxBlockHeight) {
            maxBlockHeight = height;
            foundAkizukiCode = code;
          }
        }
      }

      setOcrTextBlocks(extractedBlocks);
      
      if (extractedBlocks.length === 0) {
        alert('テキストが検出されませんでした。別の画像をお試しください。');
      } else if (foundAkizukiCode) {
        fetchAkizuki(foundAkizukiCode, true);
      }
    } catch (err) {
      console.error('OCR Error:', err);
      const errorMsg = err.message || '';
      alert('OCR処理中にエラーが発生しました: ' + (errorMsg || 'APIキーや画像を確認してください。'));
      
      // If it's an API key error, reopen the settings modal automatically
      if (errorMsg.includes('API key not valid') || errorMsg.includes('API_KEY_INVALID')) {
        onOpenSettings();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBlockClick = (text) => {
    if (focusedField === 'akizukiCode') {
      setAkizukiCode(prev => prev ? prev + ' ' + text : text);
    } else if (focusedField) {
      handleInputChange(focusedField, formData[focusedField] ? formData[focusedField] + ' ' + text : text);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus('submitting');
    
    const dateStr = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    const generatedId = `ID-${dateStr}-${randomStr}`;

    const payloadItem = { 'ID': generatedId };
    if (columns && columns.length > 0) {
      columns.forEach(c => {
        if (c.id !== 'ID') {
          payloadItem[c.id] = formData[c.id] || '';
        }
      });
    } else {
      // Fallback to existing formData if columns aren't loaded somehow
      Object.assign(payloadItem, formData);
    }
    
    // In case there are extra fields typed that weren't in columns
    Object.assign(payloadItem, formData);

    if (!gasApiUrl || gasApiUrl.trim() === '') {
      setTimeout(() => {
        setSubmitStatus('success');
        setTimeout(() => {
          onAdded();
        }, 1000);
      }, 800);
      return;
    }

    try {
      const payload = {
        action: 'add',
        item: payloadItem
      };
      
      const response = await fetch(gasApiUrl, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }
      });
      const data = await response.json();
      
      if (data.status === 'success') {
        setSubmitStatus('success');
        setTimeout(() => {
          onAdded();
        }, 1500);
      } else {
        setSubmitStatus('error');
      }
    } catch (err) {
      setSubmitStatus('error');
    }
  };

  const getBlockStyle = (bbox) => {
    if (imgDim.nw === 0) return { display: 'none' };
    
    const ratioX = imgDim.w / imgDim.nw;
    const ratioY = imgDim.h / imgDim.nh;
    
    return {
      position: 'absolute',
      left: `${bbox.x0 * ratioX}px`,
      top: `${bbox.y0 * ratioY}px`,
      width: `${(bbox.x1 - bbox.x0) * ratioX}px`,
      height: `${(bbox.y1 - bbox.y0) * ratioY}px`,
      border: '2px solid var(--primary-color)',
      backgroundColor: 'rgba(59, 130, 246, 0.2)',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'transparent',
    };
  };

  const defaultFields = ['Category 1', 'Category 2', 'Manufacturer', 'Part number', 'Qty', 'location 1', 'location 2', 'Note', 'Supplier Part Number'];
  const orderedFields = columns && columns.length > 0 
    ? columns.filter(c => c.id !== 'ID').map(c => c.id)
    : defaultFields;

  return (
    <div className="add-item-container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
      
      {/* Left side: Form */}
      <div>
        
        {/* Akizuki Auto-fetch box */}
        <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: 'var(--bg-color)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
          <h3 style={{ fontSize: '0.95rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Download size={16} /> 秋月電子から自動入力
          </h3>
          <p style={{ fontSize: '0.8rem', opacity: 0.8, marginBottom: '0.75rem', margin: 0 }}>通販コード（例：110035, P-00035）を入力して取得すると、部品名やカテゴリが自動で入力されます。</p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input 
              type="text" 
              placeholder="通販コード" 
              value={akizukiCode}
              onChange={e => setAkizukiCode(e.target.value)}
              onFocus={() => setFocusedField('akizukiCode')}
              style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--glass-border)' }}
            />
            <button 
              type="button" 
              className="btn btn-outline" 
              onClick={fetchAkizuki}
              disabled={isFetchingAkizuki || !akizukiCode.trim()}
              style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', whiteSpace: 'nowrap' }}
            >
              {isFetchingAkizuki ? <Loader2 size={16} className="spin" /> : <Download size={16} />}
              取得
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 className="mb-0">{t('manual_entry')}</h2>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {Object.entries(autocompleteOptions).map(([field, options]) => (
            <datalist id={`${field}-list`} key={field}>
              {options.map(opt => <option key={opt} value={opt} />)}
            </datalist>
          ))}

          {orderedFields.map((field) => (
            <div key={field}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>
                {field}
              </label>
              <input
                type={field === 'Qty' ? 'number' : 'text'}
                list={autocompleteOptions[field] ? `${field}-list` : undefined}
                value={formData[field] || ''}
                onChange={(e) => handleInputChange(field, e.target.value)}
                onFocus={() => setFocusedField(field)}
                style={{ 
                  borderColor: focusedField === field ? 'var(--primary-color)' : 'var(--glass-border)'
                }}
              />
            </div>
          ))}

          <button 
            type="submit" 
            className="btn mt-4" 
            disabled={submitStatus === 'submitting' || submitStatus === 'success'}
            style={{ width: '100%', padding: '0.75rem' }}
          >
            {submitStatus === 'submitting' ? <Loader2 className="lucide-spin" size={18} /> : 
             submitStatus === 'success' ? <CheckCircle2 size={18} /> : 
             t('btn_add')}
          </button>
          
          {submitStatus === 'success' && (
            <div style={{ color: 'var(--success-color)', textAlign: 'center', marginTop: '0.5rem' }}>
              {t('success_add')}
            </div>
          )}
          {submitStatus === 'error' && (
            <div style={{ color: 'var(--danger-color)', textAlign: 'center', marginTop: '0.5rem' }}>
              {t('error_add')}
            </div>
          )}
        </form>
      </div>

      {/* Right side: OCR & Camera */}
      <div style={{ borderLeft: '1px solid var(--glass-border)', paddingLeft: '2rem' }}>
        <h2 className="mb-4">OCR Scan</h2>
        <p style={{ opacity: 0.7, marginBottom: '1.5rem', fontSize: '0.9rem' }}>{t('camera_instruction')}</p>
        
        <div className="flex gap-2 mb-4">
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            ref={cameraInputRef} 
            onChange={handleImageSelect} 
            style={{ display: 'none' }} 
          />
          <button type="button" className="btn btn-outline" onClick={() => cameraInputRef.current.click()}>
            <Camera size={18} /> {t('btn_take_photo')}
          </button>
          
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            onChange={handleImageSelect} 
            style={{ display: 'none' }} 
          />
          <button type="button" className="btn btn-outline" onClick={() => fileInputRef.current.click()}>
            <Upload size={18} /> {t('btn_upload_image')}
          </button>
        </div>

        {isProcessing && (
          <div className="flex items-center gap-2 mb-4" style={{ color: 'var(--primary-color)' }}>
            <Loader2 className="lucide-spin" size={18} /> {t('ocr_loading')}
          </div>
        )}

        {imageSrc && (
          <div className="ocr-container" style={{ position: 'relative', width: '100%', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
            <img 
              src={imageSrc} 
              alt="Uploaded" 
              ref={imageRef} 
              style={{ width: '100%', display: 'block' }} 
              onLoad={updateImageDimensions}
            />
            {ocrTextBlocks.map((block, i) => (
              <div 
                key={i} 
                className="ocr-block"
                style={getBlockStyle(block.bbox)}
                onClick={() => handleBlockClick(block.text)}
              >
                <span className="ocr-tooltip">{block.text}</span>
              </div>
            ))}
          </div>
        )}
        
        {ocrTextBlocks.length > 0 && (
          <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'var(--glass-bg)', borderRadius: '8px', fontSize: '0.9rem' }}>
            <p>{t('ocr_instruction')}</p>
          </div>
        )}

      </div>
      
      <style>{`
        .ocr-block:hover {
          background-color: rgba(59, 130, 246, 0.5) !important;
        }
        .ocr-block .ocr-tooltip {
          display: none;
          position: absolute;
          top: -30px;
          background: var(--text-color);
          color: var(--bg-color);
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 14px;
          white-space: nowrap;
          z-index: 10;
          box-shadow: var(--card-shadow);
        }
        .ocr-block:hover .ocr-tooltip {
          display: block;
        }
        
        @media (max-width: 768px) {
          .add-item-container {
            grid-template-columns: 1fr !important;
          }
          .add-item-container > div:nth-child(2) {
            border-left: none !important;
            padding-left: 0 !important;
            padding-top: 2rem;
            border-top: 1px solid var(--glass-border);
          }
        }
      `}</style>
    </div>
  );
};

export default AddItem;
