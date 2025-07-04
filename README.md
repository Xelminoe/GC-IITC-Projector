## GC-IITC-Projector

### 📍 What is this?

This is a pragram for scrapring and projecting geocaching points through Google Spreadsheet onto the IITC map. It supports visualization with color-coded markers based on geocache type.

> ⚠️ This tool is intended for personal gameplay convenience. It does **not** access or expose premium-only caches.

---

### 🌐 Why use IITC?

In regions where GPS maps are offset (e.g. in China), the official Geocaching app only allows free users to use Google's default map layer, which may not be corrected for GPS offset.

By contrast, **IITC** can display:

* Google maps with correction
* Gaode (Amap) or OSM layers
* Custom overlays

This makes it much easier to work with corrected and locally useful maps.

---

```javascript
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  let data;
  try {
    data = JSON.parse(e.postData.contents || '[]');
  } catch (err) {
    return ContentService.createTextOutput("Invalid JSON").setMimeType(ContentService.MimeType.TEXT);
  }

  if (!Array.isArray(data)) {
    return ContentService.createTextOutput("Invalid data").setMimeType(ContentService.MimeType.TEXT);
  }

  // ✅ 获取现有 code（第2列）并标准化（去空格、转大写）
  const lastRow = sheet.getLastRow();
  const codesInSheet = lastRow >= 2
    ? sheet.getRange(2, 2, lastRow - 1).getValues().flat()
    : [];

  const existingCodes = new Set(
    codesInSheet.map(code => String(code).trim().toUpperCase())
  );

  const newRows = [];

  for (const item of data) {
    const rawCode = item.code;
    if (!rawCode) continue;

    const code = String(rawCode).trim().toUpperCase();
    if (existingCodes.has(code)) continue;

    existingCodes.add(code); // 避免批内重复
    newRows.push([
      item.name || '',
      code,
      item.type || '',
      item.lat || '',
      item.lng || '',
      new Date().toISOString()
    ]);
  }

  if (newRows.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, newRows.length, 6).setValues(newRows);
  }

  return ContentService.createTextOutput("OK").setMimeType(ContentService.MimeType.TEXT);
}



function doGet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const values = sheet.getDataRange().getValues();
  const headers = values.shift(); // 取第一行作为字段名

  const result = values.map(row => {
    const entry = {};
    headers.forEach((key, i) => entry[key] = row[i]);
    return entry;
  });

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}
```
