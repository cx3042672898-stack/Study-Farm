// ╔══════════════════════════════════════════════════════╗
// ║   🔥 学习农场 Firebase 数据桥接  firebase-bridge.js  ║
// ║   功能：云存档同步 + 班级实时排行榜                    ║
// ╚══════════════════════════════════════════════════════╝
//
// ⚠️ 注意：这个文件需要放在 game.js 的 <script> 标签之后
// 不需要修改 game.js，本文件会自动接管数据同步
//
(function () {
  'use strict';

  // ── 检查配置是否填写 ──────────────────────────────────
  if (!window.FIREBASE_CONFIG || !window.FIREBASE_OPTIONS || !window.FIREBASE_OPTIONS.enabled) {
    console.log('[🔥Bridge] Firebase 未配置或已关闭，跳过初始化');
    return;
  }
  if (window.FIREBASE_CONFIG.apiKey === 'YOUR_API_KEY') {
    console.warn('[🔥Bridge] ⚠️ 请先填写 firebase-config.js 里的配置！');
    return;
  }

  // ── 游戏存储键（与 game.js 一致） ──────────────────────
  const ACCOUNTS_KEY  = 'jbfarm_accounts_v5';
  const CLASS_KEY     = 'jbfarm_class_v5';
  const SAVE_PREFIX   = 'jbfarm_save_';

  // ── 本桥专用的存储键 ────────────────────────────────────
  const DEVICE_ID_KEY = 'jbfarm_fb_device';
  const LAST_SYNC_KEY = 'jbfarm_fb_last_sync';

  // ── Firebase SDK 版本（固定，避免版本跳动引起问题） ────
  const FB_VER  = '10.7.1';
  const FB_BASE = `https://www.gstatic.com/firebasejs/${FB_VER}`;

  // ── 内部状态 ────────────────────────────────────────────
  let _db            = null;  // Firestore 实例
  let _rtdb          = null;  // Realtime Database 实例
  let _ready         = false; // Firebase 是否已就绪
  let _isSyncing     = false; // 防止循环触发 localStorage.setItem
  let _classUnsubFn  = null;  // 班级监听器的取消函数
  const _origSetItem = localStorage.setItem.bind(localStorage); // 保留原始方法

  const log = (...a) => window.FIREBASE_OPTIONS.debug && console.log('[🔥Bridge]', ...a);

  // ══════════════════════════════════════════════════════
  // 工具函数
  // ══════════════════════════════════════════════════════

  /** 获取稳定的设备 ID（每台设备唯一，重装 App 会重置） */
  function getDeviceId() {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = 'dev_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
      _origSetItem.call(localStorage, DEVICE_ID_KEY, id);
    }
    return id;
  }

  /**
   * 将字符串变成 Firebase 合法的 key
   * Firebase 路径不允许 . # $ [ ] / 等字符
   */
  function safeKey(str) {
    return (str || '').replace(/[.#$\[\]/]/g, '_').slice(0, 64);
  }

  /** 防抖：ms 毫秒内重复调用只执行最后一次 */
  function debounce(fn, ms) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  }

  // ══════════════════════════════════════════════════════
  // 状态指示器（右下角小气泡）
  // ══════════════════════════════════════════════════════
  function showStatus(msg, isErr = false) {
    let el = document.getElementById('fb-sync-badge');
    if (!el) {
      el = document.createElement('div');
      el.id = 'fb-sync-badge';
      el.style.cssText = [
        'position:fixed', 'bottom:70px', 'right:12px',
        'font-size:.58rem', 'padding:3px 10px', 'border-radius:99px',
        'z-index:9999', 'transition:opacity .4s', 'pointer-events:none',
        'opacity:0', 'color:#fff', 'backdrop-filter:blur(6px)',
        'box-shadow:0 2px 8px rgba(0,0,0,.2)'
      ].join(';');
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.background = isErr ? 'rgba(200,60,60,.85)' : 'rgba(30,24,20,.80)';
    el.style.opacity = '1';
    clearTimeout(el._t);
    el._t = setTimeout(() => { el.style.opacity = '0'; }, 2800);
  }

  // ══════════════════════════════════════════════════════
  // Firebase 初始化
  // ══════════════════════════════════════════════════════

  /** 动态插入 script 标签 */
  function loadScript(src) {
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = src; s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }

  async function initFirebase() {
    try {
      log('正在加载 Firebase SDK…');
      await loadScript(`${FB_BASE}/firebase-app-compat.js`);
      await loadScript(`${FB_BASE}/firebase-firestore-compat.js`);

      const cfg = window.FIREBASE_CONFIG;
      const opts = window.FIREBASE_OPTIONS;

      // 如果配置了 Realtime Database URL 且启用排行榜，额外加载 rtdb SDK
      if (opts.classLeaderboard && cfg.databaseURL) {
        await loadScript(`${FB_BASE}/firebase-database-compat.js`);
      }

      // 防止重复初始化
      if (!firebase.apps.length) firebase.initializeApp(cfg);

      _db = firebase.firestore();
      // 离线持久化（下次打开更快）
      _db.enablePersistence({ synchronizeTabs: true }).catch(() => {});

      if (opts.classLeaderboard && cfg.databaseURL) {
        _rtdb = firebase.database();
      }

      _ready = true;
      log('✅ Firebase 初始化成功');

      await onReady();

    } catch (err) {
      console.error('[🔥Bridge] ❌ 初始化失败:', err);
      showStatus('☁️ 云同步不可用', true);
    }
  }

  // ══════════════════════════════════════════════════════
  // 就绪后的启动流程
  // ══════════════════════════════════════════════════════
  async function onReady() {
    // 1. 从云端拉取数据（如果比本地新）
    if (window.FIREBASE_OPTIONS.autoSync) {
      await pullCloud();
    }

    // 2. 拦截 localStorage 写入，实现自动同步
    hookLocalStorage();

    // 3. 如果玩家已登录班级，启动实时排行榜监听
    setTimeout(tryStartClassListener, 2000);

    showStatus('☁️ 云同步已连接 ✅');
  }

  // ══════════════════════════════════════════════════════
  // 云端读取（登录时执行）
  // ══════════════════════════════════════════════════════
  async function pullCloud() {
    if (!_db) return;
    try {
      // 如果5分钟内刚同步过，跳过
      const lastSync = parseInt(localStorage.getItem(LAST_SYNC_KEY) || '0');
      if (Date.now() - lastSync < 5 * 60 * 1000) {
        log('距上次同步不足5分钟，跳过拉取');
        return;
      }

      showStatus('☁️ 正在检查云存档…');
      const deviceId = getDeviceId();
      const snap = await _db.collection('devices').doc(deviceId).get();

      if (!snap.exists) {
        log('云端无存档，推送本地数据');
        await pushCloud();
        return;
      }

      const cloud = snap.data();
      const cloudTs = cloud.updatedAt || 0;
      const localAccounts = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '[]');

      if (cloudTs > lastSync && (cloud.accounts || []).length > 0) {
        if (localAccounts.length === 0) {
          // 本地空白，直接用云端数据（换新设备首次登录）
          applyCloudData(cloud);
          showStatus('☁️ 已从云端恢复全部存档 ✅');
          log('云端数据已恢复到本地');
        } else {
          // 本地有数据，合并云端多出来的账号
          mergeAccounts(cloud.accounts || [], cloud.saves || {});
          showStatus('☁️ 云存档已同步 ✅');
          log('云端账号已合并');
        }
      } else {
        log('本地数据与云端一致，无需拉取');
      }

      _origSetItem.call(localStorage, LAST_SYNC_KEY, Date.now().toString());

    } catch (err) {
      log('拉取云存档失败（可能是无网络）:', err.message);
    }
  }

  /** 将云端数据全量写入本地（仅在本地为空时调用） */
  function applyCloudData(cloud) {
    _isSyncing = true;
    try {
      if (cloud.accounts) _origSetItem.call(localStorage, ACCOUNTS_KEY, JSON.stringify(cloud.accounts));
      if (cloud.saves) {
        Object.entries(cloud.saves).forEach(([id, val]) => {
          _origSetItem.call(localStorage, SAVE_PREFIX + id, JSON.stringify(val));
        });
      }
      if (cloud.classData) _origSetItem.call(localStorage, CLASS_KEY, JSON.stringify(cloud.classData));
    } finally {
      _isSyncing = false;
    }
    // 刷新登录页
    if (typeof window.renderLoginScreen === 'function') window.renderLoginScreen();
  }

  /** 合并云端账号（把云端有、本地没有的账号加进来） */
  function mergeAccounts(cloudAccounts, cloudSaves) {
    const localAccounts = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '[]');
    let changed = false;
    cloudAccounts.forEach(ca => {
      if (!localAccounts.find(la => la.id === ca.id)) {
        localAccounts.push(ca);
        changed = true;
        // 也带过来这个账号的存档
        const save = cloudSaves[ca.id];
        if (save) _origSetItem.call(localStorage, SAVE_PREFIX + ca.id, JSON.stringify(save));
      }
    });
    if (changed) {
      _isSyncing = true;
      _origSetItem.call(localStorage, ACCOUNTS_KEY, JSON.stringify(localAccounts));
      _isSyncing = false;
      if (typeof window.renderLoginScreen === 'function') window.renderLoginScreen();
    }
  }

  // ══════════════════════════════════════════════════════
  // 云端写入（游戏数据变化时调用）
  // ══════════════════════════════════════════════════════
  async function pushCloud() {
    if (!_db || !_ready) return;
    try {
      const accounts = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '[]');
      if (accounts.length === 0) return; // 没有账号就不推

      // 收集所有账号的存档
      const saves = {};
      accounts.forEach(acc => {
        const raw = localStorage.getItem(SAVE_PREFIX + acc.id);
        if (raw) { try { saves[acc.id] = JSON.parse(raw); } catch (e) {} }
      });

      const classData = JSON.parse(localStorage.getItem(CLASS_KEY) || '{}');
      const deviceId  = getDeviceId();

      await _db.collection('devices').doc(deviceId).set({
        accounts,
        saves,
        classData,
        updatedAt: Date.now(),
        version: 'v5',
      });

      _origSetItem.call(localStorage, LAST_SYNC_KEY, Date.now().toString());
      log('✅ 数据已推送到云端');

    } catch (err) {
      log('推送云存档失败:', err.message);
      showStatus('☁️ 同步失败，稍后重试', true);
    }
  }

  // 防抖推送：1.5秒内多次变化只推送一次
  const debouncedPush = debounce(async () => {
    await pushCloud();
    showStatus('☁️ 已同步 ✅');
  }, 1500);

  // ══════════════════════════════════════════════════════
  // 拦截 localStorage.setItem（核心！自动触发同步）
  // ══════════════════════════════════════════════════════
  function hookLocalStorage() {
    localStorage.setItem = function (key, value) {
      // 先正常写入本地
      _origSetItem.call(localStorage, key, value);

      // 如果是内部同步操作，或 Firebase 未就绪，不触发云同步
      if (_isSyncing || !_ready || !window.FIREBASE_OPTIONS.cloudSave) return;

      // 只同步游戏相关的 key
      if (key === ACCOUNTS_KEY || key === CLASS_KEY || key.startsWith(SAVE_PREFIX)) {
        debouncedPush();
      }

      // 如果是存档变化，顺带刷新实时积分
      if (key.startsWith(SAVE_PREFIX)) {
        debouncedSyncScore();
      }
    };
    log('✅ localStorage 拦截已启动');
  }

  // ══════════════════════════════════════════════════════
  // 班级实时排行榜
  // ══════════════════════════════════════════════════════

  /** 把当前玩家的最新积分推到 Firebase（给其他同学看） */
  async function syncCurrentScore() {
    const S = window.S;
    if (!S || !S.classId || !S.playerName) return;

    const classId = safeKey(S.classId);
    const player  = safeKey(S.playerName);
    const payload = {
      name:   S.playerName,
      score:  S.score  || 0,
      level:  S.level  || 1,
      avatar: S.avatar || '🌾',
      ts:     Date.now(),
    };

    try {
      if (_rtdb) {
        // Realtime Database：毫秒级实时同步，推荐
        await _rtdb.ref(`leaderboard/${classId}/${player}`).set(payload);
      } else if (_db) {
        // 回退到 Firestore
        await _db.collection('leaderboard').doc(classId)
          .collection('members').doc(player).set(payload);
      }
      log(`积分已同步：${S.playerName} → ${S.score}分`);
    } catch (err) {
      log('积分同步失败:', err.message);
    }
  }

  const debouncedSyncScore = debounce(syncCurrentScore, 3000);

  /** 尝试启动班级实时监听（等玩家登录后才能知道班级名） */
  function tryStartClassListener() {
    const S = window.S;
    if (S && S.classId) {
      startClassListener(S.classId);
      // 同时上传自己的分数
      syncCurrentScore();
    }

    // 钩住 doEnterAcc，玩家切换账号时重启监听
    const origEnter = window.doEnterAcc;
    if (typeof origEnter === 'function') {
      window.doEnterAcc = function (id) {
        origEnter.call(this, id);
        setTimeout(() => {
          const S2 = window.S;
          if (S2 && S2.classId) {
            startClassListener(S2.classId);
            syncCurrentScore();
          }
        }, 800);
      };
      log('✅ doEnterAcc 钩子已安装');
    }
  }

  /** 监听某个班级的所有成员分数（实时更新） */
  function startClassListener(classId) {
    if (!classId) return;

    // 停掉之前的监听
    if (_classUnsubFn) { _classUnsubFn(); _classUnsubFn = null; }

    const safeClass = safeKey(classId);
    log(`开始监听班级排行榜：${classId}`);

    if (_rtdb) {
      // ── Realtime Database 实时监听 ──
      const ref = _rtdb.ref(`leaderboard/${safeClass}`);
      const handler = snap => {
        const data = snap.val();
        if (data) mergeCloudLeaderboard(classId, data);
      };
      ref.on('value', handler);
      _classUnsubFn = () => ref.off('value', handler);

    } else if (_db) {
      // ── Firestore 实时监听 ──
      const unsubscribe = _db
        .collection('leaderboard').doc(safeClass)
        .collection('members')
        .onSnapshot(snap => {
          const data = {};
          snap.forEach(doc => { data[doc.id] = doc.data(); });
          mergeCloudLeaderboard(classId, data);
        });
      _classUnsubFn = unsubscribe;
    }
  }

  /**
   * 将云端排行榜数据合并到本地班级数据
   * 核心逻辑：把其他同学（其他设备）的分数也显示在排行榜上
   */
  function mergeCloudLeaderboard(classId, cloudData) {
    try {
      const cd = JSON.parse(localStorage.getItem(CLASS_KEY) || '{}');
      if (!cd[classId]) cd[classId] = [];

      let changed = false;

      Object.values(cloudData).forEach(cm => {
        if (!cm || !cm.name) return;
        const idx = cd[classId].findIndex(m => m.name === cm.name);
        const cloudTs = cm.ts || 0;

        if (idx >= 0) {
          const existing = cd[classId][idx];
          // 只在云端数据更新时覆盖（避免覆盖本地更新）
          if (cloudTs > (existing._cloudTs || 0)) {
            cd[classId][idx] = {
              ...existing,
              score: cm.score,
              level: cm.level,
              _cloudTs: cloudTs,
            };
            changed = true;
          }
        } else {
          // 新同学！（其他设备登录的玩家）
          cd[classId].push({
            name:      cm.name,
            score:     cm.score || 0,
            level:     cm.level || 1,
            isTeacher: false,
            _cloudTs:  cloudTs,
            _fromCloud: true, // 标记：来自云端的成员
          });
          changed = true;
          log(`新同学加入排行榜：${cm.name}`);
        }
      });

      if (changed) {
        // 用原始方法写入，避免触发 hookLocalStorage 造成循环
        _isSyncing = true;
        _origSetItem.call(localStorage, CLASS_KEY, JSON.stringify(cd));
        _isSyncing = false;

        // 刷新排行榜 UI
        if (typeof window.renderClassSection === 'function') {
          window.renderClassSection();
          log('排行榜已刷新');
        }
      }
    } catch (err) {
      log('合并排行榜数据失败:', err);
    }
  }

  // ══════════════════════════════════════════════════════
  // 对外暴露接口（可在控制台或其他地方调用）
  // ══════════════════════════════════════════════════════
  window.FBBridge = {
    /** 手动触发一次同步 */
    syncNow: () => {
      pushCloud().then(() => showStatus('☁️ 手动同步完成 ✅'));
    },
    /** 从云端拉取数据（谨慎：可能覆盖本地） */
    pullNow: () => pullCloud(),
    /** 获取本机设备ID */
    getDeviceId,
    /** Firebase 是否已连接 */
    isReady: () => _ready,
    /** 刷新当前班级排行榜 */
    refreshLeaderboard: () => {
      const S = window.S;
      if (S && S.classId) startClassListener(S.classId);
    },
  };

  // ══════════════════════════════════════════════════════
  // 启动！
  // ══════════════════════════════════════════════════════
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFirebase);
  } else {
    // DOM 已就绪（脚本在底部加载）
    initFirebase();
  }

  log('firebase-bridge.js 已加载');

})();
