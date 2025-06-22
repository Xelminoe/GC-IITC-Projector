## GitHub-JSON-Projector-IITC-Indexed

### 📍 What is this?

This is an IITC plugin for projecting geocaching points from GitHub-hosted `.json` files onto the IITC map. It supports visualization with color-coded markers based on geocache type.

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

### 📦 How to Extract Your Cache List

You can export the first batch of caches that loaded when you open the official gc map (not ideal but functional) by opening the browser console and running the following code:

```javascript
(() => {
  const data = window.__NEXT_DATA__?.props?.pageProps?.searchResults?.results || [];

  const geocaches = data.map(r => ({
    name: r.name,
    code: r.code,
    type: r.geocacheType,
    lat: r.postedCoordinates?.latitude,
    lng: r.postedCoordinates?.longitude
  }));

  const blob = new Blob([JSON.stringify(geocaches, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'geocaches.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
})();
```

This will download a `geocaches.json` file containing:

* Cache name
* GC code
* Type ID
* Coordinates

You can then add this file to your GitHub repo for visualization in IITC.
