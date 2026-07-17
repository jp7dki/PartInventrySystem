import React from 'react';
import { HelpCircle, X, Camera, Search, Settings, FileSpreadsheet, Key } from 'lucide-react';

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
              1. 部品の登録方法
            </h3>
            <p style={{ fontSize: '0.95rem', margin: 0 }}>
              <strong>「部品追加」</strong>のタブを開き、画像選択アイコン（カメラマーク）をクリックすると、デバイスのカメラや画像ファイルから部品のラベルを読み取ることができます。<br/>
              読み取られたテキストを指やマウスでタップすると、入力フォームに自動で反映されるため、手入力を省くことができます。<br/>
              もちろん、キーボードを使ってご自身で入力することも可能です。
            </p>
          </section>

          <section>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
              <Search size={20} />
              2. 在庫の検索と一覧
            </h3>
            <p style={{ fontSize: '0.95rem', margin: 0 }}>
              <strong>「在庫一覧」</strong>のタブでは、登録した部品の一覧を確認できます。<br/>
              検索ボックスにキーワードを入力することで、素早く部品を探し出せます。<br/>
              「LDO 3.3V」のように<strong>複数のキーワードの間にスペースを入れる</strong>ことで、両方の条件を満たす部品を絞り込むこと（AND検索）が可能です。<br/>
              また、一覧上部の項目名（Qty など）をクリックすると、昇順・降順での並び替えができます。
            </p>
          </section>

          <section>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
              <Settings size={20} />
              3. 表示項目のカスタマイズ
            </h3>
            <p style={{ fontSize: '0.95rem', margin: 0 }}>
              右上の<strong>歯車マーク（設定）</strong>から、画面の表示をカスタマイズできます。<br/>
              不要な項目は「✖」ボタンで削除したり、チェックを外して非表示にすることができます。<br/>
              新しい項目（列）を追加したい場合は、一番下の入力欄に名前を入れて「追加」を押してください。▲▼ボタンで表示順を変更することも可能です。
            </p>
          </section>

          <section>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
              <FileSpreadsheet size={20} />
              4. データの保存先について
            </h3>
            <p style={{ fontSize: '0.95rem', margin: 0 }}>
              登録したデータは、連携した<strong>「Googleスプレッドシート」</strong>に自動的に保存・同期されます。<br/>
              万が一デバイスが故障しても、データはクラウド上に安全に保管されています。
            </p>
          </section>

          <section style={{ backgroundColor: 'var(--input-bg)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', marginBottom: '1rem' }}>
              <Key size={20} />
              5. 初期設定（APIとスプレッドシートの連携）
            </h3>
            <p style={{ fontSize: '0.95rem', margin: 0, marginBottom: '1rem' }}>
              本アプリを利用するためには、データの保存先となる「Googleスプレッドシート」と、画像読み取り機能を利用するための「Google Cloud Vision API」の設定が必要です。
            </p>
            
            <h4 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--primary-color)' }}>① データの保存先（スプレッドシート）の設定</h4>
            <ol style={{ fontSize: '0.9rem', paddingLeft: '1.5rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              <li>右上の「歯車マーク」から設定画面を開き、<strong>「テンプレートをコピー作成」</strong>ボタンをクリックして、ご自身のGoogleドライブにスプレッドシートを作成します。</li>
              <li>作成した表の上部メニューから<strong>「拡張機能」＞「Apps Script」</strong>を選択します。</li>
              <li>右上の青いボタン<strong>「デプロイ」＞「新しいデプロイ」</strong>を選択し、そのまま<strong>「デプロイ」</strong>を実行します（アクセス承認を求められた場合は許可してください）。</li>
              <li>完了後に表示される<strong>「ウェブアプリのURL」</strong>をコピーします。</li>
              <li>このアプリの設定画面に戻り、「Google Apps Script Web API URL」の欄にコピーしたURLを貼り付けます。</li>
            </ol>

            <h4 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--primary-color)' }}>② 画像読み取り機能（OCR）の設定</h4>
            <ol style={{ fontSize: '0.9rem', paddingLeft: '1.5rem', margin: 0, lineHeight: '1.5' }}>
              <li>画像から文字を読み取るため、Google Cloud Platformにて「Cloud Vision API」を有効化します（一定の利用枠までは無料でご利用いただけます）。</li>
              <li>認証情報画面から「APIキー」を作成し、文字列をコピーします。</li>
              <li>このアプリの設定画面の「Google Cloud Vision API Key」の欄にコピーしたキーを貼り付けます。</li>
            </ol>
          </section>

        </div>

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <button className="btn-primary" onClick={onClose} style={{ padding: '0.75rem 2rem' }}>
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
