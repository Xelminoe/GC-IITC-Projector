// ==UserScript==
// @name         Geocache Map Listener
// @match        https://www.geocaching.com/*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @run-at       document-end
// @description  Upload Geocache Data to a Google Spreadsheet
// @version      1.0
// ==/UserScript==

(function () {
  const allGeocaches = new Map();

  // 插入 UI 面板
  const panel = document.createElement('div');
  panel.innerHTML = `
    <div id="gc-capture-ui-message">🟡 未捕获任何 Geocache 数据</div>
    <button id="gc-upload-btn">⏫ 上传 GC 数据</button>
    <button id="gc-set-api-btn">🔧 设置 API 地址</button>
  `;
  panel.style.position = 'fixed';
  panel.style.bottom = '20px';
  panel.style.right = '20px';
  panel.style.background = '#fff';
  panel.style.border = '1px solid #999';
  panel.style.padding = '10px';
  panel.style.zIndex = 9999;
  panel.style.fontSize = '14px';
  panel.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
  document.body.appendChild(panel);

  // 设置 API 按钮
  document.getElementById('gc-set-api-btn').addEventListener('click', () => {
    const current = GM_getValue('gc_api_url', '');
    const input = prompt('请输入 Google Apps Script API 地址：', current);
    if (input) {
      GM_setValue('gc_api_url', input.trim());
      alert('✅ 已保存 API 地址');
    }
  });

  // 上传按钮点击后触发上传
    document.getElementById('gc-upload-btn').addEventListener('click', () => {
        const apiUrl = GM_getValue('gc_api_url', null);
        if (!apiUrl) {
            alert('❌ 请先设置 API 地址');
            return;
        }

        const dataArray = Array.from(allGeocaches.values());
        if (dataArray.length === 0) {
            alert('⚠️ 没有可上传的 Geocache 数据，请点击Search this area');
            return;
        }

        const statusEl = document.getElementById('gc-capture-ui-message');
        statusEl.textContent =
            `🔄 正在上传 ${allGeocaches.size} 个 Geocaches...`;

        GM_xmlhttpRequest({
            method: 'POST',
            url: apiUrl,
            headers: {
                'Content-Type': 'application/json'
            },
            data: JSON.stringify(dataArray),

            // 关键改动：阻止自动跟随 302
            redirect: "manual",

            onload: function (res) {
                console.log('✅ 上传成功', res.status, res.responseText);
                statusEl.textContent ='✅ 已上传 ${allGeocaches.size}$ 个 Geocaches';
            },
            onerror: function (err) {
                console.error('❌ 上传失败', err);
                statusEl.textContent = '❌ 上传失败，请查看控制台';
            }
        });
    });



  // Hook fetch 拦截地图加载请求
  const originalFetch = unsafeWindow.fetch;

  unsafeWindow.fetch = async function (...args) {
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;

    if (url && url.includes('/_next/data/') && url.includes('/map.json')) {
      const response = await originalFetch.apply(this, args);

      response
        .clone()
        .json()
        .then((json) => {
          const caches = json?.pageProps?.searchResults?.results || [];

          const geocaches = caches.map((r) => ({
            name: r.name,
            code: r.code,
            type: r.geocacheType,
            lat: r.postedCoordinates?.latitude,
            lng: r.postedCoordinates?.longitude,
          }));

          geocaches.forEach((gc) => {
            if (gc.code) allGeocaches.set(gc.code, gc);
          });

          document.getElementById('gc-capture-ui-message').textContent =
            `✅ 已捕获 ${allGeocaches.size} 个 Geocaches`;

          console.table(geocaches);
        })
        .catch((err) => {
          console.warn('❌ JSON 解析失败', err);
        });

      return response;
    }

    return originalFetch.apply(this, args);
  };

  console.log('✅ Geocache 数据监听脚本已启用（手动上传模式）');
})();
