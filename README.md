## GC-IITC-Projector

### 📍 

一个用于采集与投影 Geocaching 点位的双脚本系统，支持 Geocaching 网站与 Ingress IITC 地图间联动。

> ⚠️ 本项目仅用于个人游玩体验，禁止用于分享premium-only caches信息.

---

### 🌐 为什么用IITC?

在 GPS 地图存在偏移的地区（例如中国），官方 Geocaching 应用对免费用户仅开放默认的 Google 地图图层，而该图层**通常未进行偏移校正**。

相比之下，**IITC** 可以显示：

* 已校正的 Google 地图
* 高德（Gaode/Amap）或 OSM 图层
* 自定义叠加层（Overlays）

这使得使用本地已校正地图变得更加灵活和方便。

### 📦 脚本介绍

1. [`Geocache-Map-Listener.user.js`](https://raw.githubusercontent.com/Xelminoe/GC-IITC-Projector/main/Geocache-Map-Listener.user.js)

- 运行环境：Geocaching.com 地图页面  
- 功能：监听地图上加载的 geocache 点位，并提供上传至 Google Spreadsheet 的界面  
- 特点：
  - ✅ 自动监听 fetch 请求，提取 geocache 数据（包括名称、坐标、类型等）
  - ✅ 可视化 UI，显示是否捕获到数据
  - ✅ 支持用户自定义 API 上传地址（Google Apps Script）
  - ✅ 支持点击按钮手动上传数据

---

2. [`Geocache-Projector.user.js`](https://raw.githubusercontent.com/Xelminoe/GC-IITC-Projector/main/Geocache-Projector.user.js)

- 运行环境：Intel Ingress IITC 地图  
- 功能：从 Google Spreadsheet 动态加载并在地图上投影 geocache 点位  
- 特点：
  - ✅ 通过 Leaflet 图层绘制 geocache 点位
  - ✅ 按类型分类、颜色标记
  - ✅ 支持用户自定义数据源 URL（Google Apps Script 地址）
  - ✅ 使用 IITC Layer Chooser 控制投影显示

---

### ☁️ Google Spreadsheet 部署指南

一、创建 Sheet 表格

1. 打开 [Google Sheets](https://sheets.new)
2. 创建一个新表格
3. 表头建议包含以下字段：

name | code | type | lat | lng | timestamp

二、部署 Google Apps Script

1. 点击：**扩展程序 > Apps Script**
2. 替换默认代码为以下内容：

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
3. 点击「部署 > 管理部署」

4. 设置为「Web 应用程序」类型：
  * 版本描述：v1
  * 执行应用的人：我自己
  * 访问权限：任何人

5. 点击「部署」，复制 应用网址，将其用于两个脚本的 API 设置项
