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
    } else if (action === 'update') {
      const payloadKeys = Object.keys(item);
      const newHeaders = payloadKeys.filter(key => !headers.includes(key));
      
      if (newHeaders.length > 0) {
        headers = headers.concat(newHeaders);
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      }

      const data = sheet.getDataRange().getValues();
      const idIndex = headers.indexOf('ID');
      let targetRowIndex = -1;
      
      for (let i = 1; i < data.length; i++) {
        if (data[i][idIndex] === item.ID) {
          targetRowIndex = i + 1; // 1-indexed for sheet
          break;
        }
      }

      if (targetRowIndex !== -1) {
        const newRow = headers.map(header => item[header] !== undefined ? item[header] : '');
        sheet.getRange(targetRowIndex, 1, 1, headers.length).setValues([newRow]);
        return createJsonResponse({ status: 'success', message: 'Item updated successfully' });
      } else {
        return createJsonResponse({ status: 'error', message: 'Item not found' });
      }
    } else if (action === 'delete') {
      const data = sheet.getDataRange().getValues();
      const idIndex = headers.indexOf('ID');
      let targetRowIndex = -1;
      
      for (let i = 1; i < data.length; i++) {
        if (data[i][idIndex] === item.ID) {
          targetRowIndex = i + 1; // 1-indexed for sheet
          break;
        }
      }

      if (targetRowIndex !== -1) {
        sheet.deleteRow(targetRowIndex);
        return createJsonResponse({ status: 'success', message: 'Item deleted successfully' });
      } else {
        return createJsonResponse({ status: 'error', message: 'Item not found' });
      }
    } else if (action === 'syncHeaders') {
      const payloadHeaders = payload.headers || [];
      const newHeaders = payloadHeaders.filter(key => !headers.includes(key));
      
      if (newHeaders.length > 0) {
        headers = headers.concat(newHeaders);
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      }
      return createJsonResponse({ status: 'success', message: 'Headers synced successfully' });
    } else if (action === 'scrapeAkizuki') {
      const code = payload.code || '';
      let parsedCode = code.trim().toUpperCase();
      // 旧形式 (例: I-11634, P-00035) を新形式 (111634, 100035) に変換
      if (/^[A-Z]-\d{5}$/.test(parsedCode)) {
        parsedCode = '1' + parsedCode.substring(2);
      }
      
      const url = `https://akizukidenshi.com/catalog/g/g${parsedCode}/`;
      const options = {
        'method': 'get',
        'headers': {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        'muteHttpExceptions': true
      };
      
      const response = UrlFetchApp.fetch(url, options);
      if (response.getResponseCode() === 200) {
        const html = response.getContentText("UTF-8");
        
        let partName = '';
        let category = '';
        let manufacturer = '';

        // 型番を抽出
        const modelMatch = html.match(/<dt>型番<\/dt>\s*<dd[^>]*>(.*?)<\/dd>/i);
        if (modelMatch) {
          partName = modelMatch[1].trim();
        }
        
        // メーカーを抽出
        const makerMatch = html.match(/<dt>メーカー<\/dt>\s*<dd><a[^>]*>(.*?)<\/a><\/dd>/i);
        if (makerMatch) {
          manufacturer = makerMatch[1].trim();
        }

        // カテゴリ（および型番が取れなかった時の予備の名前）をタイトルから抽出
        const titleMatch = html.match(/<title>(.*?)<\/title>/);
        if (titleMatch) {
          let title = titleMatch[1];
          if (title.includes('秋月電子通商')) {
            let parts = title.split(':');
            if (!partName) {
              partName = parts[0].trim();
            }
            if (parts.length > 1) {
              category = parts[1].split('秋月電子通商')[0].trim();
            }
          }
        }

        if (partName) {
          return createJsonResponse({ 
            status: 'success', 
            data: { 
              name: partName, 
              category: category,
              manufacturer: manufacturer,
              code: parsedCode
            } 
          });
        }
      }
      return createJsonResponse({ status: 'error', message: '商品情報の取得に失敗しました。' });
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
