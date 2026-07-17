import React from 'react';
import { HelpCircle, X, Camera, Search, Settings, FileSpreadsheet } from 'lucide-react';

const HelpModal = ({ onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose} style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 1000,
      display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem'
    }}>
      <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto',
        position: 'relative', padding: '2rem'
      }}>
        <button 
          onClick={onClose}
          className="btn-outline"
          style={{ position: 'absolute', top: '1rem', right: '1rem', padding: '0.5rem', borderRadius: '50%' }}
        >
          <X size={20} />
        </button>

        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--primary-color)' }}>
          <HelpCircle size={24} />
          使い方ガイド
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', lineHeight: '1.6' }}>
          
          <section>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
              <Camera size={20} />
              1. 部品を登録しよう！（部品追加）
            </h3>
            <p style={{ fontSize: '0.95rem', margin: 0 }}>
              電子工作の部品を買ってきたら、まずは登録しましょう。<br/>
              <strong>「部品追加」</strong>のタブを開いて、カメラのマーク（画像を選択）を押すと、スマホのカメラで部品の袋のラベルを読み取ることができます。<br/>
              読み取った文字を指でタップすると、自動で入力欄に入るので、キーボードで打たなくても簡単に登録できます！<br/>
              もちろん、キーボードを使って自分で入力してもOKです。
            </p>
          </section>

          <section>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
              <Search size={20} />
              2. 登録した部品を探そう！（在庫一覧）
            </h3>
            <p style={{ fontSize: '0.95rem', margin: 0 }}>
              <strong>「在庫一覧」</strong>のタブでは、今まで登録した部品の一覧が見られます。<br/>
              検索ボックスに文字を入れると、一瞬で部品を探し出せます。<br/>
              たとえば、「LDO 3.3V」のように<strong>言葉と言葉の間にスペース（空白）を入れる</strong>と、「LDO」と「3.3V」の両方が含まれる部品だけを絞り込むことができます。<br/>
              一覧の一番上にある名前（Qty など）をクリックすると、少ない順や多い順に並び替えることもできます。
            </p>
          </section>

          <section>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
              <Settings size={20} />
              3. 画面を使いやすくカスタマイズ！
            </h3>
            <p style={{ fontSize: '0.95rem', margin: 0 }}>
              右上の<strong>歯車マーク（設定）</strong>を押すと、画面の見た目を自分好みに変えられます。<br/>
              いらない項目は「✖」ボタンで消したり、チェックを外して隠したりできます。<br/>
              逆に「棚の番号」など新しい項目を作りたいときは、一番下の入力欄に名前を入れて「追加」を押すだけでOKです。▲▼ボタンで順番も変えられます。
            </p>
          </section>

          <section>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
              <FileSpreadsheet size={20} />
              4. データはどこに保存されるの？
            </h3>
            <p style={{ fontSize: '0.95rem', margin: 0 }}>
              登録したデータは、自動的にインターネット上の<strong>「Googleスプレッドシート（Excelのような表計算ソフト）」</strong>に保存されています。<br/>
              スマホが壊れてもデータはGoogleに残っているので安心です！
            </p>
          </section>

        </div>

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <button className="btn-primary" onClick={onClose} style={{ padding: '0.75rem 2rem' }}>
            わかった！
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
