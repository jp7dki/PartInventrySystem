import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  ja: {
    translation: {
      "app_title": "電子部品在庫管理",
      "search_placeholder": "部品を検索...",
      "tab_list": "在庫一覧",
      "tab_add": "部品追加",
      "col_name": "部品名",
      "col_category": "カテゴリ",
      "col_quantity": "個数",
      "col_location": "保管場所",
      "col_notes": "仕様・備考",
      "btn_add": "追加する",
      "btn_cancel": "キャンセル",
      "camera_instruction": "カメラでラベルを撮影するか、画像を選択してください",
      "btn_take_photo": "カメラを起動",
      "btn_upload_image": "画像をアップロード",
      "ocr_loading": "テキストを抽出中...",
      "ocr_instruction": "抽出されたテキストをドラッグ＆ドロップするか、タップしてフォーカス中の入力欄に入力してください。",
      "manual_entry": "手動入力",
      "success_add": "部品を追加しました！",
      "error_add": "追加に失敗しました",
      "no_data": "データがありません",
      "loading": "読み込み中...",
      "theme_toggle": "テーマ切替",
      "lang_toggle": "English"
    }
  },
  en: {
    translation: {
      "app_title": "EC Inventory",
      "search_placeholder": "Search components...",
      "tab_list": "Inventory List",
      "tab_add": "Add Item",
      "col_name": "Part Name",
      "col_category": "Category",
      "col_quantity": "Quantity",
      "col_location": "Location",
      "col_notes": "Specs/Notes",
      "btn_add": "Add",
      "btn_cancel": "Cancel",
      "camera_instruction": "Take a photo of the label or upload an image",
      "btn_take_photo": "Open Camera",
      "btn_upload_image": "Upload Image",
      "ocr_loading": "Extracting text...",
      "ocr_instruction": "Drag & drop extracted text, or tap to fill the focused input field.",
      "manual_entry": "Manual Entry",
      "success_add": "Item added successfully!",
      "error_add": "Failed to add item",
      "no_data": "No data available",
      "loading": "Loading...",
      "theme_toggle": "Toggle Theme",
      "lang_toggle": "日本語"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "ja",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
