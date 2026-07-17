const SHEET_NAME = 'シート1'; // 使用するシート名に合わせて変更してください。

// GETリクエスト: スプレッドシートのデータを全件取得する
function doGet(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = sheet.getDataRange().getValues();
    
    if (data.length === 0) {
      return createJsonResponse({ status: 'success', data: [] });
    }

    // 1行目をヘッダーとする
    const headers = data[0];
    const rows = data.slice(1);
    
    const result = rows.map(row => {
      let obj = {};
      headers.forEach((header, i) => {
        obj[header] = row[i];
      });
      return obj;
    });

    return createJsonResponse({ status: 'success', data: result });
  } catch (error) {
    return createJsonResponse({ status: 'error', message: error.toString() });
  }
}

// POSTリクエスト: スプレッドシートにデータを追加・更新する
function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action; // 'add' など
    const item = payload.item;

    let headers = sheet.getDataRange().getValues()[0];
    
    // ヘッダーがない（空のシート）場合、デフォルトヘッダーを作成
    if (!headers || headers.length === 0) {
      headers = ['部品名', 'カテゴリ', '個数', '保管場所', '仕様・備考'];
      sheet.appendRow(headers);
    }

    if (action === 'add') {
      // payload(item)のキーの中に、現在のヘッダーに存在しないものがあるか確認
      const payloadKeys = Object.keys(item);
      const newHeaders = payloadKeys.filter(key => !headers.includes(key));
      
      if (newHeaders.length > 0) {
        headers = headers.concat(newHeaders);
        // 1行目を新しいヘッダーで上書きする
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      }

      const newRow = headers.map(header => item[header] || '');
      sheet.appendRow(newRow);
      return createJsonResponse({ status: 'success', message: 'Item added successfully' });
    } else if (action === 'syncHeaders') {
      const payloadHeaders = payload.headers || [];
      const newHeaders = payloadHeaders.filter(key => !headers.includes(key));
      
      if (newHeaders.length > 0) {
        headers = headers.concat(newHeaders);
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      }
      return createJsonResponse({ status: 'success', message: 'Headers synced successfully' });
    } else {
      return createJsonResponse({ status: 'error', message: 'Unknown action' });
    }

  } catch (error) {
    return createJsonResponse({ status: 'error', message: error.toString() });
  }
}

// ヘルパー関数: JSONレスポンスを作成する
function createJsonResponse(responseObject) {
  return ContentService.createTextOutput(JSON.stringify(responseObject))
    .setMimeType(ContentService.MimeType.JSON);
}

// CORSのプリフライトリクエスト用
function doOptions(e) {
  return createJsonResponse({ status: 'ok' });
}
