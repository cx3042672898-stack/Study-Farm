// ╔══════════════════════════════════════════════════════╗
// ║  🌾 学习农场 Service Worker                          ║
// ║  GitHub 每次更新后，用户下次打开自动获取新版本        ║
// ╚══════════════════════════════════════════════════════╝

// ⚡ 每次发布新版本，把这个版本号 +1，强制用户更新
const CACHE_VERSION = 'v1';
const CACHE_NAME = 'study-farm-' + CACHE_VERSION;

// 首次安装时缓存的核心文件（离线也能打开）
const CORE_FILES = [
  './index.html',
  './game.js',
  './fishpond.js',
  './gamedata.js',
  './hamster_anim.js',
  './pet_config.js',
  './subjects.js',
  './update_log.js',
  './tcb-config.js',
  './tcb-bridge.js',
];

// ── 安装：缓存核心文件 ────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(CORE_FILES).catch(err => {
        // 部分文件可能不存在，不阻断安装
        console.warn('[SW] 部分文件缓存失败（不影响运行）:', err);
      });
    }).then(() => self.skipWaiting()) // 立即激活，不等旧版本
  );
});

// ── 激活：删除旧缓存 ─────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k.startsWith('study-farm-') && k !== CACHE_NAME)
            .map(k => caches.delete(k))
      )
    ).then(() => {
      self.clients.claim(); // 立即接管所有标签页
      // 通知所有打开的页面有新版本
      self.clients.matchAll({ type: 'window' }).then(clients => {
        clients.forEach(client => client.postMessage({ type: 'SW_UPDATED', version: CACHE_VERSION }));
      });
    })
  );
});

// ── 请求拦截：网络优先，断网用缓存 ──────────────────────
self.addEventListener('fetch', event => {
  // 只处理 GET 请求，跳过 API/云端请求
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // 腾讯云、CDN 等外部请求直接走网络
  if (!url.origin.includes(self.location.hostname) &&
      !url.origin.includes('github.io')) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 网络请求成功，更新缓存
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => {
        // 断网时从缓存读取
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          // 连缓存也没有：返回 index.html（SPA 降级）
          if (event.request.destination === 'document') {
            return caches.match('./index.html');
          }
        });
      })
  );
});
