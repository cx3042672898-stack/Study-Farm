// ╔══════════════════════════════════════════════════════╗
// ║   🔥 学习农场 Firebase 数据桥接  firebase-bridge.js  ║
// ║   v2 — 修复频繁提示 / 独立模式 / 无网误报 / 按需同步  ║
// ╚══════════════════════════════════════════════════════╝
(function () {
  'use strict';

  if (!window.FIREBASE_CONFIG || !window.FIREBASE_OPTIONS || !window.FIREBASE_OPTIONS.enabled) return;
  if (window.FIREBASE_CONFIG.apiKey === 'YOUR_API_KEY') return;

  // ── 存储键 ──────────────────────────────────────────────
  const ACCOUNTS_KEY    = 'jbfarm_accounts_v5';
  const CLASS_KEY       = 'jbfarm_class_v5';
  const CLASS_ADMIN_KEY = 'jbfarm_class_admins';
  const SAVE_PREFIX     = 'jbfarm_save_';
  const DEVICE_ID_KEY   = 'jbfarm_fb_device';
  const LAST_SYNC_KEY   = 'jbfarm_fb_last_sync';
  // 用户同步选择持久化：'yes' | 'no' | null(未决定)
  const SYNC_CHOICE_KEY = 'jbfarm_sync_choice';

  const FB_VER  = '10.7.1';
  const FB_BASE = `https://www.gstatic.com/firebasejs/${FB_VER}`;

  let _db           = null;
  let _rtdb         = null;
  let _ready        = false;
  let _isSyncing    = false;
  let _classUnsubFn = null;
  // 用户是否选择同步（true=同步 false=不同步 null=还没选）
  let _userWantsSync = null;
  // 是否仍在加载页（用于控制提示只在加载页显示）
  let _onLoadingScreen = true;
  const _origSetItem = localStorage.setItem.bind(localStorage);

  const log = (...a) => window.FIREBASE_OPTIONS.debug && console.log('[🔥Bridge]', ...a);

  // ══════════════════════════════════════════════════════
  // 工具函数
  // ══════════════════════════════════════════════════════
  function getDeviceId() {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = 'dev_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
      _origSetItem(DEVICE_ID_KEY, id);
    }
    return id;
  }

  function safeKey(str) {
    return (str || '').replace(/[.#$\[\]/]/g, '_').slice(0, 64);
  }

  function debounce(fn, ms) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  }

  // 读取该账号是否选择了独立模式
  function isLocalMode(accId) {
    const mode = localStorage.getItem('jbfarm_syncmode_' + accId) || 'cloud';
    return mode === 'local';
  }

  // 当前登录账号是否独立模式
  function currentAccIsLocal() {
    const S = window.S;
    if (!S) return false;
    // 找当前账号id
    const accounts = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '[]');
    const acc = accounts.find(a => a.name === S.playerName);
    if (!acc) return false;
    return isLocalMode(acc.id);
  }

  // ══════════════════════════════════════════════════════
  // 加载页同步提示（只在加载页显示）
  // ══════════════════════════════════════════════════════
  function showLoadingStatus(msg, isErr = false) {
    // 只在加载页显示
    let el = document.getElementById('fb-sync-badge');
    if (!el) {
      el = document.createElement('div');
      el.id = 'fb-sync-badge';
      el.style.cssText = [
        'position:fixed','bottom:70px','right:12px',
        'font-size:.58rem','padding:3px 10px','border-radius:99px',
        'z-index:9999','transition:opacity .4s','pointer-events:none',
        'opacity:0','color:#fff','backdrop-filter:blur(6px)',
        'box-shadow:0 2px 8px rgba(0,0,0,.2)'
      ].join(';');
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.background = isErr ? 'rgba(200,60,60,.85)' : 'rgba(30,24,20,.80)';
    el.style.opacity = '1';
    clearTimeout(el._t);
    el._t = setTimeout(() => { el.style.opacity = '0'; }, isErr ? 4000 : 2500);
  }

  // ══════════════════════════════════════════════════════
  // 加载页「是否同步」弹窗
  // ══════════════════════════════════════════════════════
  function showSyncChoiceDialog(onChoice) {
    // 如果已经有持久化选择，直接用
    const saved = localStorage.getItem(SYNC_CHOICE_KEY);
    if (saved === 'yes') { onChoice(true); return; }
    if (saved === 'no')  { onChoice(false); return; }

    const ov = document.createElement('div');
    ov.style.cssText = [
      'position:fixed','inset:0','z-index:99999',
      'display:flex','align-items:center','justify-content:center',
      'background:rgba(0,0,0,.45)','backdrop-filter:blur(4px)'
    ].join(';');

    ov.innerHTML = `
      <div style="background:var(--panel,#fff);border-radius:18px;padding:24px 20px;max-width:300px;width:88%;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,.18)">
        <div style="font-size:2rem;margin-bottom:8px">☁️</div>
        <div style="font-weight:700;font-size:1rem;margin-bottom:8px;color:var(--dgreen,#2d6a2d)">是否开启云同步？</div>
        <div style="font-size:.74rem;color:var(--muted,#888);line-height:1.7;margin-bottom:18px">
          开启后可跨设备保存进度，<br>需要访问境外服务器（需要梯子）。<br>
          <span style="color:#e07000">不开启则只与同设备同学比较排名。</span>
        </div>
        <div style="display:flex;gap:10px">
          <button id="_sync-no-btn" style="flex:1;padding:10px;border-radius:10px;border:1.5px solid var(--border,#ddd);background:transparent;font-size:.82rem;cursor:pointer;font-family:'Noto Sans SC',sans-serif">不同步</button>
          <button id="_sync-yes-btn" style="flex:1;padding:10px;border-radius:10px;border:none;background:var(--green,#5a9a5a);color:#fff;font-size:.82rem;cursor:pointer;font-weight:600;font-family:'Noto Sans SC',sans-serif">开启同步</button>
        </div>
        <div style="font-size:.6rem;color:var(--muted,#aaa);margin-top:10px">可在「我的」页面随时更改</div>
      </div>`;

    document.body.appendChild(ov);

    ov.querySelector('#_sync-yes-btn').onclick = () => {
      _origSetItem(SYNC_CHOICE_KEY, 'yes');
      ov.remove();
      onChoice(true);
    };
    ov.querySelector('#_sync-no-btn').onclick = () => {
      _origSetItem(SYNC_CHOICE_KEY, 'no');
      ov.remove();
      onChoice(false);
    };
  }

  // ══════════════════════════════════════════════════════
  // Firebase 初始化
  // ══════════════════════════════════════════════════════
  function loadScript(src) {
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = src; s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }

  async function initFirebase() {
    // 先弹出同步选择，用户决定后再初始化Firebase（避免无谓的网络请求）
    showSyncChoiceDialog(async (wantsSync) => {
      _userWantsSync = wantsSync;
      if (!wantsSync) {
        log('用户选择不同步，跳过Firebase初始化');
        // 仍然挂钩localStorage以便后续用户改变主意时可以响应
        hookLocalStorage();
        return;
      }

      try {
        log('正在加载 Firebase SDK…');
        showLoadingStatus('☁️ 正在连接云端…');

        await loadScript(`${FB_BASE}/firebase-app-compat.js`);
        await loadScript(`${FB_BASE}/firebase-firestore-compat.js`);

        const cfg  = window.FIREBASE_CONFIG;
        const opts = window.FIREBASE_OPTIONS;

        if (opts.classLeaderboard && cfg.databaseURL) {
          await loadScript(`${FB_BASE}/firebase-database-compat.js`);
        }

        if (!firebase.apps.length) firebase.initializeApp(cfg);

        _db = firebase.firestore();
        _db.enablePersistence({ synchronizeTabs: true }).catch(() => {});

        if (opts.classLeaderboard && cfg.databaseURL) {
          _rtdb = firebase.database();
        }

        _ready = true;
        log('✅ Firebase 初始化成功');

        // 拉取云端数据（只在加载页做一次，且只在用户选择同步时）
        const pulled = await pullCloud();
        if (pulled) {
          showLoadingStatus('☁️ 云同步完成 ✅');
        }

        hookLocalStorage();
        setTimeout(tryStartClassListener, 2000);

      } catch (err) {
        console.error('[🔥Bridge] ❌ 初始化失败:', err);
        // 真实失败才显示错误，不误报成功
        showLoadingStatus('☁️ 无法连接云端（需要梯子）', true);
      }
    });
  }

  // ══════════════════════════════════════════════════════
  // 云端读取（只在加载页调用一次）
  // ══════════════════════════════════════════════════════
  async function pullCloud() {
    if (!_db || !_userWantsSync) return false;
    try {
      const lastSync = parseInt(localStorage.getItem(LAST_SYNC_KEY) || '0');
      if (Date.now() - lastSync < 5 * 60 * 1000) {
        log('距上次同步不足5分钟，跳过拉取');
        return true;
      }

      showLoadingStatus('☁️ 正在检查云存档…');

      // 设置超时（10秒），避免无梯子时无限等待
      const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 10000));
      const snap = await Promise.race([_db.collection('accounts').get(), timeout]);

      if (snap.empty) {
        log('云端无存档，推送本地数据');
        await pushCloud(true);
        _origSetItem(LAST_SYNC_KEY, Date.now().toString());
        return true;
      }

      const cloudAccounts = [];
      const cloudSaves    = {};
      snap.forEach(doc => {
        const d = doc.data();
        if (d.account) {
          cloudAccounts.push(d.account);
          if (d.save) cloudSaves[d.account.id] = d.save;
        }
      });

      const localAccounts = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '[]');
      if (cloudAccounts.length > 0) {
        if (localAccounts.length === 0) {
          applyCloudData({ accounts: cloudAccounts, saves: cloudSaves });
        } else {
          mergeAccounts(cloudAccounts, cloudSaves);
        }
      }

      _origSetItem(LAST_SYNC_KEY, Date.now().toString());
      await pullClassData();
      return true;

    } catch (err) {
      // 超时或网络错误：明确告知，不显示成功
      const isTimeout = err.message === 'timeout';
      showLoadingStatus(isTimeout ? '☁️ 连接超时（需要梯子）' : '☁️ 同步失败：' + err.message, true);
      log('拉取失败:', err.message);
      return false;
    }
  }

  function applyCloudData(cloud) {
    _isSyncing = true;
    try {
      if (cloud.accounts) _origSetItem(ACCOUNTS_KEY, JSON.stringify(cloud.accounts));
      if (cloud.saves) {
        Object.entries(cloud.saves).forEach(([id, val]) => {
          _origSetItem(SAVE_PREFIX + id, JSON.stringify(val));
        });
      }
      if (cloud.classData) _origSetItem(CLASS_KEY, JSON.stringify(cloud.classData));
    } finally {
      _isSyncing = false;
    }
    if (typeof window.renderLoginScreen === 'function') window.renderLoginScreen();
  }

  function mergeAccounts(cloudAccounts, cloudSaves) {
    const localAccounts = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '[]');
    let changed = false;
    cloudAccounts.forEach(ca => {
      const idx = localAccounts.findIndex(la => la.id === ca.id);
      if (idx < 0) {
        localAccounts.push(ca);
        changed = true;
        const save = cloudSaves[ca.id];
        if (save) _origSetItem(SAVE_PREFIX + ca.id, JSON.stringify(save));
      } else {
        const local = localAccounts[idx];
        const cloudTs = ca.lastActive || 0;
        const localTs = local.lastActive || 0;
        if (cloudTs > localTs) {
          localAccounts[idx] = { ...local, ...ca };
          changed = true;
          const save = cloudSaves[ca.id];
          if (save) _origSetItem(SAVE_PREFIX + ca.id, JSON.stringify(save));
        } else if (!local.pin && ca.pin) {
          localAccounts[idx] = { ...local, pin: ca.pin };
          changed = true;
        }
      }
    });
    if (changed) {
      _isSyncing = true;
      _origSetItem(ACCOUNTS_KEY, JSON.stringify(localAccounts));
      _isSyncing = false;
      if (typeof window.renderLoginScreen === 'function') window.renderLoginScreen();
    }
  }

  // ══════════════════════════════════════════════════════
  // 云端写入（静默，不弹提示）
  // ══════════════════════════════════════════════════════
  async function pushCloud(silent = false) {
    if (!_db || !_ready || !_userWantsSync) return;
    try {
      const accounts = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '[]');
      if (accounts.length === 0) return;

      // 只同步非独立模式的账号
      const syncAccounts = accounts.filter(acc => !isLocalMode(acc.id));
      if (syncAccounts.length === 0) return;

      const batch = _db.batch();
      syncAccounts.forEach(acc => {
        const raw = localStorage.getItem(SAVE_PREFIX + acc.id);
        let save = {};
        if (raw) { try { save = JSON.parse(raw); } catch (e) {} }
        const docRef = _db.collection('accounts').doc(safeKey(String(acc.id)));
        batch.set(docRef, {
          account: acc, save, deviceId: getDeviceId(),
          updatedAt: Date.now(), version: 'v5',
        }, { merge: true });
      });

      await batch.commit();
      _origSetItem(LAST_SYNC_KEY, Date.now().toString());
      log(`✅ ${syncAccounts.length} 个账号已推送`);
      // 正式游戏中不弹提示，只在静默模式下记录日志
    } catch (err) {
      log('推送失败:', err.message);
      // 正式游戏中不打扰用户，只记录日志
    }
  }

  // 防抖推送：静默，不弹任何提示
  const debouncedPush = debounce(() => pushCloud(true), 3000);

  // ══════════════════════════════════════════════════════
  // 班级数据同步
  // ══════════════════════════════════════════════════════
  async function pushClassData() {
    if (!_db || !_ready || !_userWantsSync) return;
    try {
      const classData   = JSON.parse(localStorage.getItem(CLASS_KEY)       || '{}');
      const classAdmins = JSON.parse(localStorage.getItem(CLASS_ADMIN_KEY) || '{}');
      await _db.collection('shared').doc('classrooms').set({
        classData, classAdmins, updatedAt: Date.now(),
      }, { merge: true });
      log('✅ 班级数据已推送');
    } catch (err) {
      log('推送班级数据失败:', err.message);
    }
  }

  async function pullClassData() {
    if (!_db || !_userWantsSync) return;
    try {
      const snap = await _db.collection('shared').doc('classrooms').get();
      if (!snap.exists) { await pushClassData(); return; }
      const data = snap.data();
      const cloudClassData   = data.classData   || {};
      const cloudClassAdmins = data.classAdmins || {};

      const localClassData = JSON.parse(localStorage.getItem(CLASS_KEY) || '{}');
      let classChanged = false;
      Object.keys(cloudClassData).forEach(cls => {
        if (!localClassData[cls]) {
          localClassData[cls] = cloudClassData[cls];
          classChanged = true;
        } else {
          const localNames = new Set(localClassData[cls].map(m => m.name));
          cloudClassData[cls].forEach(cm => {
            if (!localNames.has(cm.name)) { localClassData[cls].push(cm); classChanged = true; }
          });
          const cloudNames = new Set(cloudClassData[cls].map(m => m.name));
          const before = localClassData[cls].length;
          localClassData[cls] = localClassData[cls].filter(m => cloudNames.has(m.name));
          if (localClassData[cls].length !== before) classChanged = true;
        }
      });
      Object.keys(localClassData).forEach(cls => {
        if (!(cls in cloudClassData)) { delete localClassData[cls]; classChanged = true; }
      });
      if (classChanged) {
        _isSyncing = true;
        _origSetItem(CLASS_KEY, JSON.stringify(localClassData));
        _isSyncing = false;
      }

      const localAdmins = JSON.parse(localStorage.getItem(CLASS_ADMIN_KEY) || '{}');
      let adminsChanged = false;
      Object.keys(cloudClassAdmins).forEach(cls => {
        if (JSON.stringify(localAdmins[cls]) !== JSON.stringify(cloudClassAdmins[cls])) {
          localAdmins[cls] = cloudClassAdmins[cls]; adminsChanged = true;
        }
      });
      Object.keys(localAdmins).forEach(cls => {
        if (!(cls in cloudClassAdmins)) { delete localAdmins[cls]; adminsChanged = true; }
      });
      if (adminsChanged) {
        _isSyncing = true;
        _origSetItem(CLASS_ADMIN_KEY, JSON.stringify(localAdmins));
        _isSyncing = false;
      }

      if (classChanged || adminsChanged) {
        if (typeof window.renderTeacherClassView === 'function') window.renderTeacherClassView();
        if (typeof window.renderLoginScreen      === 'function') window.renderLoginScreen();
      }
    } catch (err) {
      log('拉取班级数据失败:', err.message);
    }
  }

  // 班级数据防抖推送：延长到 5 秒，避免频繁触发
  const debouncedPushClass = debounce(() => pushClassData(), 5000);

  // ══════════════════════════════════════════════════════
  // 云端删除账号
  // ══════════════════════════════════════════════════════
  async function deleteCloudAccount(accountId) {
    if (!_db || !_ready || !_userWantsSync) return;
    try {
      await _db.collection('accounts').doc(safeKey(String(accountId))).delete();
      log(`✅ 云端账号已删除：${accountId}`);
    } catch (err) {
      log('删除云端账号失败:', err.message);
    }
  }

  // ══════════════════════════════════════════════════════
  // 拦截 localStorage.setItem
  // ══════════════════════════════════════════════════════
  function hookLocalStorage() {
    localStorage.setItem = function (key, value) {
      // 检测账号被删除 → 同步删云端
      if (key === ACCOUNTS_KEY && !_isSyncing && _ready && _userWantsSync) {
        const oldList = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '[]');
        _origSetItem(key, value);
        const newList = JSON.parse(value || '[]');
        const deletedIds = oldList
          .filter(a => !newList.find(n => n.id === a.id))
          .map(a => a.id);
        if (deletedIds.length > 0) {
          deletedIds.forEach(id => deleteCloudAccount(id));
        }
      } else {
        _origSetItem(key, value);
      }

      // 用户没有选择同步：静默跳过
      if (!_userWantsSync || _isSyncing || !_ready) return;

      if (key === ACCOUNTS_KEY || key.startsWith(SAVE_PREFIX)) {
        if (key.startsWith(SAVE_PREFIX)) {
          const accId = key.slice(SAVE_PREFIX.length);
          if (isLocalMode(accId)) return; // 独立模式账号，跳过
        }
        debouncedPush();
      }
      if (key === CLASS_KEY || key === CLASS_ADMIN_KEY) {
        debouncedPushClass();
      }
      if (key.startsWith(SAVE_PREFIX) && !currentAccIsLocal()) {
        debouncedSyncScore();
      }
    };
    log('✅ localStorage 拦截已启动');
  }

  // ══════════════════════════════════════════════════════
  // 排行榜实时监听
  // ══════════════════════════════════════════════════════
  async function syncCurrentScore() {
    if (!_userWantsSync || currentAccIsLocal()) return;
    const S = window.S;
    if (!S || !S.classId || !S.playerName) return;
    const classId = safeKey(S.classId);
    const player  = safeKey(S.playerName);
    const payload = {
      name: S.playerName, score: S.score||0,
      level: S.level||1, avatar: S.avatar||'🌾', ts: Date.now(),
    };
    try {
      if (_rtdb) {
        await _rtdb.ref(`leaderboard/${classId}/${player}`).set(payload);
      } else if (_db) {
        await _db.collection('leaderboard').doc(classId)
          .collection('members').doc(player).set(payload);
      }
    } catch (err) {
      log('积分同步失败:', err.message);
    }
  }

  const debouncedSyncScore = debounce(syncCurrentScore, 5000);

  function tryStartClassListener() {
    const S = window.S;
    if (S && S.classId && _userWantsSync) {
      startClassListener(S.classId);
      syncCurrentScore();
    }
    const origEnter = window.doEnterAcc;
    if (typeof origEnter === 'function') {
      window.doEnterAcc = function (id) {
        origEnter.call(this, id);
        setTimeout(() => {
          const S2 = window.S;
          if (S2 && S2.classId && _userWantsSync && !currentAccIsLocal()) {
            startClassListener(S2.classId);
            syncCurrentScore();
          }
        }, 800);
      };
    }
  }

  function startClassListener(classId) {
    if (!classId || !_userWantsSync) return;
    if (_classUnsubFn) { _classUnsubFn(); _classUnsubFn = null; }
    const safeClass = safeKey(classId);
    if (_rtdb) {
      const ref = _rtdb.ref(`leaderboard/${safeClass}`);
      const handler = snap => { const d = snap.val(); if (d) mergeCloudLeaderboard(classId, d); };
      ref.on('value', handler);
      _classUnsubFn = () => ref.off('value', handler);
    } else if (_db) {
      const unsub = _db.collection('leaderboard').doc(safeClass)
        .collection('members')
        .onSnapshot(snap => {
          const d = {};
          snap.forEach(doc => { d[doc.id] = doc.data(); });
          mergeCloudLeaderboard(classId, d);
        });
      _classUnsubFn = unsub;
    }
  }

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
          if (cloudTs > (existing._cloudTs || 0)) {
            cd[classId][idx] = { ...existing, score: cm.score, level: cm.level, _cloudTs: cloudTs };
            changed = true;
          }
        } else {
          cd[classId].push({ name: cm.name, score: cm.score||0, level: cm.level||1,
            isTeacher: false, _cloudTs: cloudTs, _fromCloud: true });
          changed = true;
        }
      });
      if (changed) {
        _isSyncing = true;
        _origSetItem(CLASS_KEY, JSON.stringify(cd));
        _isSyncing = false;
        if (typeof window.renderClassSection === 'function') window.renderClassSection();
      }
    } catch (err) {
      log('合并排行榜失败:', err);
    }
  }

  // ══════════════════════════════════════════════════════
  // 对外接口
  // ══════════════════════════════════════════════════════
  window.FBBridge = {
    // 手动强制同步（可在「我的」页面提供按钮）
    syncNow: async () => {
      if (!_userWantsSync) {
        if (typeof window.showToast === 'function') window.showToast('云同步未开启');
        return;
      }
      localStorage.removeItem(LAST_SYNC_KEY);
      showLoadingStatus('☁️ 正在同步…');
      const ok = await pullCloud();
      showLoadingStatus(ok ? '☁️ 同步完成 ✅' : '☁️ 同步失败（需要梯子）', !ok);
    },
    // 用户在设置里修改同步开关
    setSyncEnabled: (enabled) => {
      _userWantsSync = enabled;
      _origSetItem(SYNC_CHOICE_KEY, enabled ? 'yes' : 'no');
      if (enabled && _ready) {
        localStorage.removeItem(LAST_SYNC_KEY);
        pullCloud();
      }
    },
    isSyncEnabled: () => _userWantsSync,
    isReady: () => _ready,
    getDeviceId,
    refreshLeaderboard: () => {
      const S = window.S;
      if (S && S.classId) startClassListener(S.classId);
    },
  };

  // ── 启动 ──
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFirebase);
  } else {
    initFirebase();
  }

})();
