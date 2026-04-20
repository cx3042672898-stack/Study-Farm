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
  const ACCOUNTS_KEY    = 'jbfarm_accounts_v5';
  const CLASS_KEY       = 'jbfarm_class_v5';
  const CLASS_ADMIN_KEY = 'jbfarm_class_admins';   // 教师-班级绑定表
  const SAVE_PREFIX     = 'jbfarm_save_';

  // ── 本桥专用的存储键 ────────────────────────────────────
  const DEVICE_ID_KEY = 'jbfarm_fb_device';
  const LAST_SYNC_KEY = 'jbfarm_fb_last_sync';

  // ── Firebase SDK 版本（固定，避免版本跳动引起问题） ────
  const FB_VER  = '10.7.1';
  const FB_BASE = `https://www.gstatic.com/firebasejs/${FB_VER}`;

  // ── 内部状态 ────────────────────────────────────────────
  let _db            = null;
  let _rtdb          = null;
  let _ready         = false;
  let _isSyncing     = false;
  let _classUnsubFn  = null;
  const _origSetItem = localStorage.setItem.bind(localStorage);

  const log = (...a) => window.FIREBASE_OPTIONS.debug && console.log('[🔥Bridge]', ...a);

  // ══════════════════════════════════════════════════════
  // 工具函数
  // ══════════════════════════════════════════════════════

  function getDeviceId() {
    let id = localStorage.getItem(DEVICE_ID_KEY);
    if (!id) {
      id = 'dev_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
      _origSetItem.call(localStorage, DEVICE_ID_KEY, id);
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
    if (window.FIREBASE_OPTIONS.autoSync) {
      await pullCloud();
    }
    hookLocalStorage();
    setTimeout(tryStartClassListener, 2000);
    showStatus('☁️ 云同步已连接 ✅');
  }

  // ══════════════════════════════════════════════════════
  // 云端读取
  // ══════════════════════════════════════════════════════
  //
  // 🔑 修复：不再按 deviceId 读，改为读 accounts 集合（所有设备共享）
  //
  async function pullCloud() {
    if (!_db) return;
    try {
      const lastSync = parseInt(localStorage.getItem(LAST_SYNC_KEY) || '0');
      if (Date.now() - lastSync < 5 * 60 * 1000) {
        log('距上次同步不足5分钟，跳过拉取');
        return;
      }

      showStatus('☁️ 正在检查云存档…');

      // 拉取所有账号文档（跨设备共享的集合）
      const snap = await _db.collection('accounts').get();

      if (snap.empty) {
        log('云端无存档，推送本地数据');
        await pushCloud();
        _origSetItem.call(localStorage, LAST_SYNC_KEY, Date.now().toString());
        return;
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
          showStatus('☁️ 已从云端恢复全部存档 ✅');
          log('云端数据已恢复到本地');
        } else {
          mergeAccounts(cloudAccounts, cloudSaves);
          showStatus('☁️ 云存档已同步 ✅');
          log('云端账号已合并');
        }
      } else {
        log('云端无有效账号数据');
      }

      _origSetItem.call(localStorage, LAST_SYNC_KEY, Date.now().toString());

      // 也拉取班级数据（教师视图需要）
      await pullClassData();

    } catch (err) {
      log('拉取云存档失败（可能是无网络）:', err.message);
    }
  }

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
    if (typeof window.renderLoginScreen === 'function') window.renderLoginScreen();
  }

  function mergeAccounts(cloudAccounts, cloudSaves) {
    const localAccounts = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '[]');
    let changed = false;
    cloudAccounts.forEach(ca => {
      const idx = localAccounts.findIndex(la => la.id === ca.id);
      if (idx < 0) {
        // 本地没有这个账号 → 新增
        localAccounts.push(ca);
        changed = true;
        const save = cloudSaves[ca.id];
        if (save) _origSetItem.call(localStorage, SAVE_PREFIX + ca.id, JSON.stringify(save));
      } else {
        // 本地已有这个账号 → 用云端更新 pin 等字段（cloud 更新时间更新则覆盖）
        const local = localAccounts[idx];
        const cloudTs = ca.lastActive || 0;
        const localTs = local.lastActive || 0;
        if (cloudTs > localTs) {
          // 云端版本更新：合并（保留本地 lastActive，更新 pin / name / score 等）
          localAccounts[idx] = { ...local, ...ca };
          changed = true;
          const save = cloudSaves[ca.id];
          if (save) _origSetItem.call(localStorage, SAVE_PREFIX + ca.id, JSON.stringify(save));
        } else if (!local.pin && ca.pin) {
          // 本地没密码但云端有：直接补上（避免密码丢失）
          localAccounts[idx] = { ...local, pin: ca.pin };
          changed = true;
        }
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
  // 云端写入
  // ══════════════════════════════════════════════════════
  //
  // 🔑 修复：每个账号单独存到 accounts/{accountId}，不再按 deviceId 存
  //
  async function pushCloud() {
    if (!_db || !_ready) return;
    try {
      const accounts = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '[]');
      if (accounts.length === 0) return;

      const batch = _db.batch();

      accounts.forEach(acc => {
        const raw = localStorage.getItem(SAVE_PREFIX + acc.id);
        let save = {};
        if (raw) { try { save = JSON.parse(raw); } catch (e) {} }

        const docRef = _db.collection('accounts').doc(safeKey(String(acc.id)));
        batch.set(docRef, {
          account:   acc,
          save:      save,
          deviceId:  getDeviceId(),
          updatedAt: Date.now(),
          version:   'v5',
        }, { merge: true });
      });

      await batch.commit();

      _origSetItem.call(localStorage, LAST_SYNC_KEY, Date.now().toString());
      log(`✅ ${accounts.length} 个账号已推送到云端`);

    } catch (err) {
      log('推送云存档失败:', err.message);
      showStatus('☁️ 同步失败，稍后重试', true);
    }
  }

  const debouncedPush = debounce(async () => {
    await pushCloud();
    showStatus('☁️ 已同步 ✅');
  }, 1500);

  // ══════════════════════════════════════════════════════
  // 班级数据 & 教师绑定同步（shared/classrooms 文档）
  // ══════════════════════════════════════════════════════

  /** 将本地班级花名册 + 教师绑定推送到 Firestore 共享文档 */
  async function pushClassData() {
    if (!_db || !_ready) return;
    try {
      const classData   = JSON.parse(localStorage.getItem(CLASS_KEY)       || '{}');
      const classAdmins = JSON.parse(localStorage.getItem(CLASS_ADMIN_KEY) || '{}');
      await _db.collection('shared').doc('classrooms').set({
        classData,
        classAdmins,
        updatedAt: Date.now(),
      }, { merge: true });
      log('✅ 班级数据已推送');
    } catch (err) {
      log('推送班级数据失败:', err.message);
    }
  }

  /** 从 Firestore 拉取班级花名册 + 教师绑定，合并到本地 */
  async function pullClassData() {
    if (!_db) return;
    try {
      const snap = await _db.collection('shared').doc('classrooms').get();
      if (!snap.exists) {
        // 云端没有 → 把本地的推上去
        await pushClassData();
        return;
      }
      const data = snap.data();
      const cloudClassData   = data.classData   || {};
      const cloudClassAdmins = data.classAdmins || {};

      // 合并班级花名册（云端有、本地没有的班级 → 加进来）
      const localClassData = JSON.parse(localStorage.getItem(CLASS_KEY) || '{}');
      let classChanged = false;
      Object.keys(cloudClassData).forEach(cls => {
        if (!localClassData[cls]) {
          localClassData[cls] = cloudClassData[cls];
          classChanged = true;
        } else {
          // 班级存在 → 把云端有而本地没有的成员补进来
          const localNames = new Set(localClassData[cls].map(m => m.name));
          cloudClassData[cls].forEach(cm => {
            if (!localNames.has(cm.name)) {
              localClassData[cls].push(cm);
              classChanged = true;
            }
          });
          // 同步移除：本地有但云端已删除的班级成员
          const cloudNames = new Set(cloudClassData[cls].map(m => m.name));
          const before = localClassData[cls].length;
          localClassData[cls] = localClassData[cls].filter(m => cloudNames.has(m.name));
          if (localClassData[cls].length !== before) classChanged = true;
        }
      });
      // 云端已删除的班级 → 本地也删
      Object.keys(localClassData).forEach(cls => {
        if (!(cls in cloudClassData)) {
          delete localClassData[cls];
          classChanged = true;
        }
      });

      if (classChanged) {
        _isSyncing = true;
        _origSetItem.call(localStorage, CLASS_KEY, JSON.stringify(localClassData));
        _isSyncing = false;
        log('班级花名册已同步');
      }

      // 合并教师绑定（云端为准）
      const localAdmins = JSON.parse(localStorage.getItem(CLASS_ADMIN_KEY) || '{}');
      let adminsChanged = false;
      Object.keys(cloudClassAdmins).forEach(cls => {
        if (JSON.stringify(localAdmins[cls]) !== JSON.stringify(cloudClassAdmins[cls])) {
          localAdmins[cls] = cloudClassAdmins[cls];
          adminsChanged = true;
        }
      });
      // 云端删除的教师绑定 → 本地也删
      Object.keys(localAdmins).forEach(cls => {
        if (!(cls in cloudClassAdmins)) { delete localAdmins[cls]; adminsChanged = true; }
      });
      if (adminsChanged) {
        _isSyncing = true;
        _origSetItem.call(localStorage, CLASS_ADMIN_KEY, JSON.stringify(localAdmins));
        _isSyncing = false;
        log('教师绑定已同步');
      }

      if (classChanged || adminsChanged) {
        if (typeof window.renderTeacherClassView === 'function') window.renderTeacherClassView();
        if (typeof window.renderLoginScreen      === 'function') window.renderLoginScreen();
      }

    } catch (err) {
      log('拉取班级数据失败:', err.message);
    }
  }

  const debouncedPushClass = debounce(async () => {
    await pushClassData();
  }, 1500);

  // ══════════════════════════════════════════════════════
  // 云端删除单个账号（注销时同步删除 Firestore 文档）
  // ══════════════════════════════════════════════════════
  async function deleteCloudAccount(accountId) {
    if (!_db || !_ready) return;
    try {
      await _db.collection('accounts').doc(safeKey(String(accountId))).delete();
      log(`✅ 云端账号已删除：${accountId}`);
      showStatus('☁️ 账号已云端注销 ✅');
    } catch (err) {
      log('删除云端账号失败:', err.message);
    }
  }

  // ══════════════════════════════════════════════════════
  // 拦截 localStorage.setItem
  // ══════════════════════════════════════════════════════
  function hookLocalStorage() {
    localStorage.setItem = function (key, value) {
      // 删除检测：写入前先比对账号列表，找出被删掉的账号，同步删云端
      if (key === ACCOUNTS_KEY && !_isSyncing && _ready) {
        const oldList = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '[]');
        _origSetItem.call(localStorage, key, value);
        const newList = JSON.parse(value || '[]');
        const deletedIds = oldList
          .filter(a => !newList.find(n => n.id === a.id))
          .map(a => a.id);
        if (deletedIds.length > 0) {
          log(`检测到 ${deletedIds.length} 个账号被删除，同步到云端…`);
          deletedIds.forEach(id => deleteCloudAccount(id));
        }
      } else {
        _origSetItem.call(localStorage, key, value);
      }

      if (_isSyncing || !_ready || !window.FIREBASE_OPTIONS.cloudSave) return;
      if (key === ACCOUNTS_KEY || key.startsWith(SAVE_PREFIX)) {
        debouncedPush();
      }
      // 班级花名册或教师绑定变化 → 推到 shared/classrooms
      if (key === CLASS_KEY || key === CLASS_ADMIN_KEY) {
        debouncedPushClass();
      }
      if (key.startsWith(SAVE_PREFIX)) {
        debouncedSyncScore();
      }
    };
    log('✅ localStorage 拦截已启动');
  }

  // ══════════════════════════════════════════════════════
  // 班级实时排行榜
  // ══════════════════════════════════════════════════════

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
        await _rtdb.ref(`leaderboard/${classId}/${player}`).set(payload);
      } else if (_db) {
        await _db.collection('leaderboard').doc(classId)
          .collection('members').doc(player).set(payload);
      }
      log(`积分已同步：${S.playerName} → ${S.score}分`);
    } catch (err) {
      log('积分同步失败:', err.message);
    }
  }

  const debouncedSyncScore = debounce(syncCurrentScore, 3000);

  function tryStartClassListener() {
    const S = window.S;
    if (S && S.classId) {
      startClassListener(S.classId);
      syncCurrentScore();
    }
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

  function startClassListener(classId) {
    if (!classId) return;
    if (_classUnsubFn) { _classUnsubFn(); _classUnsubFn = null; }

    const safeClass = safeKey(classId);
    log(`开始监听班级排行榜：${classId}`);

    if (_rtdb) {
      const ref = _rtdb.ref(`leaderboard/${safeClass}`);
      const handler = snap => {
        const data = snap.val();
        if (data) mergeCloudLeaderboard(classId, data);
      };
      ref.on('value', handler);
      _classUnsubFn = () => ref.off('value', handler);
    } else if (_db) {
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
          cd[classId].push({
            name:       cm.name,
            score:      cm.score || 0,
            level:      cm.level || 1,
            isTeacher:  false,
            _cloudTs:   cloudTs,
            _fromCloud: true,
          });
          changed = true;
          log(`新同学加入排行榜：${cm.name}`);
        }
      });

      if (changed) {
        _isSyncing = true;
        _origSetItem.call(localStorage, CLASS_KEY, JSON.stringify(cd));
        _isSyncing = false;
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
  // 对外暴露接口
  // ══════════════════════════════════════════════════════
  window.FBBridge = {
    syncNow: () => {
      pushCloud().then(() => showStatus('☁️ 手动同步完成 ✅'));
    },
    pullNow: () => {
      // 清除时间戳，强制重新拉取
      localStorage.removeItem(LAST_SYNC_KEY);
      return pullCloud();
    },
    getDeviceId,
    isReady: () => _ready,
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
    initFirebase();
  }

  log('firebase-bridge.js 已加载');

})();
