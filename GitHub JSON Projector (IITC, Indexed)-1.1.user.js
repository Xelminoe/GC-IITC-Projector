// ==UserScript==
// @name         GitHub JSON Projector (IITC, Indexed)
// @version      1.1
// @description  Dynamically loads geocaching JSONs via GitHub index.json, projects by type.
// @category     Map Tools
// @match        https://intel.ingress.com/*
// @grant        none
// ==/UserScript==

(function () {
  function wrapper() {
    if (typeof window.plugin !== 'function') window.plugin = () => {};

    const plugin = {};
    plugin.id = 'cacheProjector';

    // ✅ Set your GitHub repo base path here
    const githubBase = 'https://raw.githubusercontent.com/Xelminoe/GitHub-JSON-Projector-IITC-Indexed/main/data/';
    const indexFile = 'index.json'; // should return array of relative paths

    const typeColors = {
        2:    'green', // Traditional
        3:    'orange', // Multi
        4:    'gold', // Virtual
        5:    'gold', // Letterbox Hybrid
        6:    'violet', // Event Cache
        8:    'blue', // Mystery
        9:    'violet', // Project A.P.E.
        11:   'violet', // Webcam Cache
        12:   'violet', // Locationless
        13:   'gold', // CITO Event
        137:  'gold', // Earth
        453:  'violet', // Mega
        1304: 'red', // GPS Adventures
        1858: 'red', // Wherigo
        3653: 'violet', // Community Celebration
        3773: 'violet', // HQ
        3774: 'violet', // HQ Celebration
        4738: 'violet', // HQ Block Party
        7005: 'violet' // Giga
    };
    const typeTexts ={
        2: 'Tradition',
        3: 'Multi',
        4: 'Virtual',
        5: 'Letterbox Hybrid',
        6: 'Event Cache',
        8: 'Mystery',
        9: 'Project A.P.E. Cache',
        11: 'Webcam Cache',
        12: 'Locationless Cache',
        13: 'Cache In Trash Out® Event Cache',
        137: 'Earth',
        453: 'Mega-Event Cache',
        1304: 'GPS Adventures Maze Exhibit',
        1858: 'Wherigo',
        3653: 'Community Celebration Event',
        3773: 'Geocaching HQ Cache',
        3774: 'Geocaching HQ Celebration',
        4738: 'Geocaching HQ Block Party',
        7005: 'Giga-Event Cache'
    };

    plugin.data = [];
    plugin.layer = null;

    plugin.fetchAllFromIndex = async function () {
      plugin.data = [];

      const indexUrl = githubBase + indexFile;
      let fileList;
      try {
        const res = await fetch(indexUrl);
        fileList = await res.json();
      } catch (e) {
        console.error(`[${plugin.id}] Failed to load index.json`, e);
        return;
      }

      for (const path of fileList) {
        const fullUrl = githubBase + path;
        try {
          const res = await fetch(fullUrl);
          const json = await res.json();
          plugin.data.push(...json);
        } catch (e) {
          console.error(`[${plugin.id}] Failed to load`, fullUrl, e);
        }
      }

      console.log(`[${plugin.id}] Loaded`, plugin.data.length, 'items from', fileList.length, 'files');
    };

    plugin.projectItems = async function () {
      if (!plugin.layer) {
        plugin.layer = new L.LayerGroup();
        window.addLayerGroup('Projected Items', plugin.layer, true);
      }
      plugin.layer.clearLayers();

      await plugin.fetchAllFromIndex();
      const bounds = map.getBounds();

      for (const item of plugin.data) {
        if (!item.lat || !item.lng) continue;
        const latlng = L.latLng(item.lat, item.lng);
        if (!bounds.contains(latlng)) continue;

        const color = typeColors[item.type];
        const typeText = typeTexts[item.type]

        const marker = L.marker(latlng, {
            icon: L.icon({
                iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [0, -35],
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
                shadowSize: [41, 41],
                shadowAnchor: [12, 41]
            })
        }).bindPopup(`<strong>${item.name}</strong><br>Code: ${item.code}<br>Type: ${typeText}`);


        plugin.layer.addLayer(marker);
      }

      console.log(`[${plugin.id}] Projected ${plugin.layer.getLayers().length} items`);
    };

    plugin.removeItems = function () {
      if (plugin.layer) {
        plugin.layer.clearLayers();
        console.log(`[${plugin.id}] Removed all projected items`);
      }
    };

    plugin.setup = function () {
      const toolbox = document.getElementById('toolbox');
      if (!toolbox) return;

      const projBtn = document.createElement('a');
      projBtn.textContent = 'Project Geocaches';
      projBtn.title = 'Project items from GitHub JSON index';
      projBtn.onclick = plugin.projectItems;
      toolbox.appendChild(projBtn);

      const clearBtn = document.createElement('a');
      clearBtn.textContent = 'Remove Geocaches';
      clearBtn.title = 'Clear projected markers';
      clearBtn.onclick = plugin.removeItems;
      toolbox.appendChild(clearBtn);
    };

    window.plugin.cacheProjector = plugin;

    if (!window.bootPlugins) window.bootPlugins = [];
    window.bootPlugins.push(plugin.setup);
    if (window.iitcLoaded) plugin.setup();
  }

  const script = document.createElement('script');
  script.appendChild(document.createTextNode('(' + wrapper + ')();'));
  (document.body || document.head || document.documentElement).appendChild(script);
})();
