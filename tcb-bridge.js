// ╔══════════════════════════════════════════════════════╗
// ║  ☁️ 学习农场 腾讯云 CloudBase 数据桥接  tcb-bridge.js ║
// ║  替代 firebase-bridge.js，无需梯子，逻辑完全兼容      ║
// ╚══════════════════════════════════════════════════════╝
(function () {
  'use strict';

  if (!window.TCB_CONFIG || !window.TCB_OPTIONS || !window.TCB_OPTIONS.enabled) return;
  const _envId = window.TCB_CONFIG.envId;
  if (!_envId || _envId === 'YOUR_ENV_ID') return;

  // ── Storage Keys（与原 firebase-bridge 完全相同，本地数据无缝兼容）──
  const ACCOUNTS_KEY    = 'jbfarm_accounts_v5';
  const CLASS_KEY       = 'jbfarm_class_v5';
  const CLASS_ADMIN_KEY = 'jbfarm_class_admins';
  const SAVE_PREFIX     = 'jbfarm_save_';
  const DEVICE_ID_KEY   = 'jbfarm_fb_device';  // 保持同名，避免设备ID丢失
  const LAST_SYNC_KEY   = 'jbfarm_fb_last_sync';
  const SYNC_CHOICE_KEY = 'jbfarm_sync_choice';

  // TCB 数据库集合名（与 Firebase 保持一致）
  const COLL_ACCOUNTS    = 'accounts';
  const COLL_SHARED      = 'shared';
  const COLL_LEADERBOARD = 'leaderboard';

  // TCB JS SDK（jsDelivr 镜像，国内可直连）
  const TCB_SDK_URL = 'https://cdn.jsdelivr.net/npm/@cloudbase/js-sdk@2/dist/cloudbase.full.min.js';

  let _db            = null;
  let _ready         = false;
  let _isSyncing     = false;
  let _classUnsubFn  = null;
  let _userWantsSync = null;
  const _origSetItem = localStorage.setItem.bind(localStorage);

  const log = (...a) => window.TCB_OPTIONS.debug && console.log('[☁️TCB]', ...a);

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
    // TCB 文档ID不允许 . # $ [ ] / 和空格，同 Firebase 规则一致
    return (str || '').replace(/[.#$\[\]/:\s]/g, '_').slice(0, 64);
  }

  function debounce(fn, ms) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
  }

  function isLocalMode(accId) {
    return (localStorage.getItem('jbfarm_syncmode_' + accId) || 'cloud') === 'local';
  }

  function currentAccIsLocal() {
    const S = window.S;
    if (!S) return false;
    const accounts = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '[]');
    const acc = accounts.find(a => a.name === S.playerName);
    if (!acc) return false;
    return isLocalMode(acc.id);
  }

  // ── TCB 安全读取单文档（不存在时返回 null，不抛异常）──
  async function safeGetDoc(collName, docId) {
    try {
      const res = await _db.collection(collName).doc(docId).get();
      const d = res.data;
      if (!d) return null;
      if (Array.isArray(d)) return d.length ? d[0] : null;
      return d;
    } catch (e) {
      log('safeGetDoc:', collName, docId, e.message);
      return null;
    }
  }

  // ══════════════════════════════════════════════════════
  // 加载页同步提示（与 firebase-bridge 样式完全一致）
  // ══════════════════════════════════════════════════════
  function showLoadingStatus(msg, isErr = false) {
    let el = document.getElementById('fb-sync-badge');
    if (!el) {
      el = document.createElement('div');
      el.id = 'fb-sync-badge';
      el.style.cssText = [
        'position:fixed', 'bottom:70px', 'right:12px',
        'font-size:.58rem', 'padding:3px 10px', 'border-radius:99px',
        'z-index:9999', 'transition:opacity .4s', 'pointer-events:none',
        'opacity:0', 'color:#fff', 'backdrop-filter:blur(6px)',
        'box-shadow:0 2px 8px rgba(0,0,0,.2)',
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
  // 是否同步弹窗（文案改为「无需梯子」）
  // ══════════════════════════════════════════════════════
  function showSyncChoiceDialog(onChoice) {
    const saved = localStorage.getItem(SYNC_CHOICE_KEY);
    if (saved === 'yes') { onChoice(true);  return; }
    if (saved === 'no')  { onChoice(false); return; }

    const ov = document.createElement('div');
    ov.style.cssText = [
      'position:fixed', 'inset:0', 'z-index:99999',
      'display:flex', 'align-items:center', 'justify-content:center',
      'background:rgba(0,0,0,.45)', 'backdrop-filter:blur(4px)',
    ].join(';');

    ov.innerHTML = `
      <div style="background:var(--panel,#fff);border-radius:18px;padding:24px 20px;max-width:300px;width:88%;text-align:center;box-shadow:0 8px 32px rgba(0,0,0,.18)">
        <div style="font-size:2rem;margin-bottom:8px">☁️</div>
        <div style="font-weight:700;font-size:1rem;margin-bottom:8px;color:var(--dgreen,#2d6a2d)">是否开启云同步？</div>
        <div style="font-size:.74rem;color:var(--muted,#888);line-height:1.7;margin-bottom:18px">
          开启后可跨设备保存进度，<br>
          使用腾讯云服务，<strong style="color:var(--dgreen,#2d6a2d)">无需梯子</strong>。<br>
          <span style="color:#e07000">不开启则只与同设备同学比较排名。</span>
        </div>
        <div style="display:flex;gap:10px">
          <button id="_sync-no-btn"  style="flex:1;padding:10px;border-radius:10px;border:1.5px solid var(--border,#ddd);background:transparent;font-size:.82rem;cursor:pointer;font-family:'Noto Sans SC',sans-serif">不同步</button>
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
  // 加载脚本
  // ══════════════════════════════════════════════════════
  function loadScript(src) {
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = res;
      s.onerror = rej;
      document.head.appendChild(s);
    });
  }

  // ══════════════════════════════════════════════════════
  // Firebase 兼容层
  // game.js 里有两处直接使用 window.firebase.firestore()：
  //   - quizSubmitReport() → 写入 quiz_feedback 集合
  //   - submitSuggestion() → 写入 suggestions 集合
  // 这里用 TCB DB 提供相同接口，game.js 不需要改任何代码
  // ══════════════════════════════════════════════════════
  function exposeFirebaseShim() {
    window.firebase = {
      apps: ['tcb-shim'], // 非空数组，通过 game.js 的 .length 检查
      firestore: () => ({
        collection: (name) => ({
          add: (payload) => _db.collection(name).add(payload).catch(() => {}),
        }),
      }),
    };
    log('Firebase 兼容层已就绪');
  }

  // ══════════════════════════════════════════════════════
  // TCB 初始化
  // ══════════════════════════════════════════════════════
  async function initTCB() {
    // ⚠️ file:// 协议下无法使用云同步（浏览器安全限制）
    // 请通过本地HTTP服务器或部署到托管服务后使用
    if (location.protocol === 'file:') {
      console.warn('[☁️TCB] ⚠️ 检测到 file:// 协议！云同步需要 HTTP/HTTPS 才能工作。');
      console.warn('[☁️TCB] 解决方案：使用 VS Code Live Server 插件，或将文件上传到腾讯云静态网站托管。');
      showLoadingStatus('⚠️ file://协议不支持云同步，请用HTTP服务器打开', true);
      return;
    }
    showSyncChoiceDialog(async (wantsSync) => {
      _userWantsSync = wantsSync;

      if (!wantsSync) {
        log('用户选择不同步，跳过TCB初始化');
        hookLocalStorage(); // 仍然挂钩，以便用户后续打开同步时能响应
        return;
      }

      try {
        log('正在加载 TCB SDK…');
        showLoadingStatus('☁️ 正在连接云端…');

        await loadScript(TCB_SDK_URL);
        log('SDK 加载完成');

        const app  = cloudbase.init({ env: _envId });
        const auth = app.auth({ persistence: 'local' });

        // 匿名登录（持久化：localStorage.setItem 缓存 token，刷新页面不重复登录）
        let loginState = await auth.getLoginState();
        if (!loginState) {
          await auth.anonymousAuthProvider().signIn();
          loginState = await auth.getLoginState();
        }
        if (!loginState) throw new Error('匿名登录失败，请检查控制台是否已开启匿名登录');

        log('TCB 登录成功, uid:', loginState.user?.uid);
        _db    = app.database();
        _ready = true;

        exposeFirebaseShim();

        const pulled = await pullCloud();
        if (pulled) showLoadingStatus('☁️ 云同步完成 ✅');

        hookLocalStorage();
        setTimeout(tryStartClassListener, 2000);

      } catch (err) {
        console.error('[☁️TCB] ❌ 初始化失败:', err);
        showLoadingStatus('☁️ 云端连接失败：' + (err.message || ''), true);
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
        log('距上次同步不足5分钟，跳过');
        return true;
      }

      showLoadingStatus('☁️ 正在检查云存档…');

      // 超时 15 秒，比 Firebase 宽松，因为腾讯云国内延迟更低
      const timeout = new Promise((_, rej) =>
        setTimeout(() => rej(new Error('timeout')), 15000)
      );
      const result = await Promise.race([
        _db.collection(COLL_ACCOUNTS).limit(500).get(),
        timeout,
      ]);

      const docs = result.data || [];
      if (!docs.length) {
        log('云端无存档，推送本地数据');
        await pushCloud(true);
        _origSetItem(LAST_SYNC_KEY, Date.now().toString());
        return true;
      }

      const cloudAccounts = [];
      const cloudSaves    = {};
      docs.forEach(d => {
        if (d && d.account) {
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
          setTimeout(() => pushCloud(true), 1500);
        }
      }

      _origSetItem(LAST_SYNC_KEY, Date.now().toString());
      await pullClassData();
      return true;

    } catch (err) {
      const isTimeout = err.message === 'timeout';
      showLoadingStatus(isTimeout ? '☁️ 连接超时，请检查网络' : '☁️ 同步失败：' + err.message, true);
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
        // 云端有，本地没有 → 直接加入
        localAccounts.push(ca);
        changed = true;
        const save = cloudSaves[ca.id];
        if (save) _origSetItem(SAVE_PREFIX + ca.id, JSON.stringify(save));
      } else {
        const local    = localAccounts[idx];
        const cloudSave    = cloudSaves[ca.id] || {};
        const localSaveRaw = localStorage.getItem(SAVE_PREFIX + ca.id);
        const localSave    = localSaveRaw ? JSON.parse(localSaveRaw) : {};

        // 合并策略：积分 > 等级 > 时间戳，高进度优先
        const cloudScore = cloudSave.score || ca.score || 0;
        const localScore = localSave.score || local.score || 0;
        const cloudLevel = cloudSave.level || ca.level || 1;
        const localLevel = localSave.level || local.level || 1;
        const cloudTs    = ca.lastActive || cloudSave.lastSaved || 0;
        const localTs    = local.lastActive || localSave.lastSaved || 0;

        const cloudAhead = cloudScore > localScore
          || (cloudScore === localScore && cloudLevel > localLevel)
          || (cloudScore === localScore && cloudLevel === localLevel && cloudTs > localTs);

        if (cloudAhead) {
          log(`[merge] ${ca.id} 用云端（云:${cloudScore} > 本地:${localScore}）`);
          localAccounts[idx] = { ...local, ...ca };
          changed = true;
          if (cloudSaves[ca.id]) _origSetItem(SAVE_PREFIX + ca.id, JSON.stringify(cloudSave));
        } else {
          // 只补充 pin（本地没有时）
          if (!local.pin && ca.pin) {
            localAccounts[idx] = { ...local, pin: ca.pin };
            changed = true;
          }
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
      if (!accounts.length) return;

      const syncAccounts = accounts.filter(acc => !isLocalMode(acc.id));
      if (!syncAccounts.length) return;

      // TCB 没有原生批量写入，用 Promise.all 并行发送
      await Promise.all(syncAccounts.map(acc => {
        const raw = localStorage.getItem(SAVE_PREFIX + acc.id);
        let save = {};
        if (raw) { try { save = JSON.parse(raw); } catch (e) {} }
        return _db.collection(COLL_ACCOUNTS).doc(safeKey(String(acc.id))).set({
          account: acc,
          save,
          deviceId:  getDeviceId(),
          updatedAt: Date.now(),
          version:   'v5',
        });
      }));

      _origSetItem(LAST_SYNC_KEY, Date.now().toString());
      log(`✅ ${syncAccounts.length} 个账号已推送`);
    } catch (err) {
      log('推送失败:', err.message);
    }
  }

  const debouncedPush = debounce(() => pushCloud(true), 3000);

  // ══════════════════════════════════════════════════════
  // 班级数据同步
  // ══════════════════════════════════════════════════════
  async function pushClassData() {
    if (!_db || !_ready || !_userWantsSync) return;
    try {
      const classData   = JSON.parse(localStorage.getItem(CLASS_KEY)       || '{}');
      const classAdmins = JSON.parse(localStorage.getItem(CLASS_ADMIN_KEY) || '{}');
      await _db.collection(COLL_SHARED).doc('classrooms').set({
        classData,
        classAdmins,
        updatedAt: Date.now(),
      });
      log('✅ 班级数据已推送');
    } catch (err) {
      log('推送班级数据失败:', err.message);
    }
  }

  async function pullClassData() {
    if (!_db || !_userWantsSync) return;
    try {
      const data = await safeGetDoc(COLL_SHARED, 'classrooms');
      if (!data) { await pushClassData(); return; }

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
            if (!localNames.has(cm.name)) {
              localClassData[cls].push(cm);
              classChanged = true;
            }
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
          localAdmins[cls] = cloudClassAdmins[cls];
          adminsChanged = true;
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

  const debouncedPushClass = debounce(() => pushClassData(), 5000);

  // ══════════════════════════════════════════════════════
  // 排行榜实时同步
  // Firebase RTDB → TCB DB watch()（等价实时监听）
  // ══════════════════════════════════════════════════════
  async function syncCurrentScore() {
    if (!_db || !_userWantsSync || currentAccIsLocal()) return;
    const S = window.S;
    if (!S || !S.classId || !S.playerName) return;

    const safeClass  = safeKey(S.classId);
    const safePlayer = safeKey(S.playerName);
    // TCB 文档ID = classId_playerName（替代 RTDB 的路径层级）
    const docId = safeClass + '_' + safePlayer;

    const payload = {
      classId:  S.classId,
      safeClass,
      name:     S.playerName,
      score:    S.score  || 0,
      level:    S.level  || 1,
      avatar:   S.avatar || '🌾',
      ts:       Date.now(),
    };
    try {
      await _db.collection(COLL_LEADERBOARD).doc(docId).set(payload);
      log('积分已同步:', S.playerName, S.score);
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
    if (!classId || !_userWantsSync || !_db) return;
    if (_classUnsubFn) { _classUnsubFn(); _classUnsubFn = null; }

    const safeClass = safeKey(classId);
    try {
      // TCB watch() = Firebase RTDB .on('value') 或 Firestore onSnapshot()
      const watcher = _db.collection(COLL_LEADERBOARD)
        .where({ safeClass })
        .watch({
          onChange(snapshot) {
            const docs = snapshot.docs || [];
            const d = {};
            docs.forEach(doc => {
              // TCB snapshot doc 的数据字段直接在 doc 上，或通过 .data()
              const data = (typeof doc.data === 'function') ? doc.data() : doc;
              if (data && data.name) d[data.name] = data;
            });
            if (Object.keys(d).length) mergeCloudLeaderboard(classId, d);
          },
          onError(e) {
            log('排行榜实时监听错误:', e);
          },
        });
      _classUnsubFn = () => watcher.close();
      log('排行榜实时监听已启动:', classId);
    } catch (e) {
      // 降级方案：每 30 秒轮询一次（网络环境不支持长连接时）
      log('实时监听不可用，降级为30秒轮询:', e.message);
      const timer = setInterval(async () => {
        if (!_userWantsSync) { clearInterval(timer); return; }
        try {
          const res = await _db.collection(COLL_LEADERBOARD).where({ safeClass }).get();
          const docs = res.data || [];
          const d = {};
          docs.forEach(doc => { if (doc && doc.name) d[doc.name] = doc; });
          if (Object.keys(d).length) mergeCloudLeaderboard(classId, d);
        } catch (err) {
          log('轮询排行榜失败:', err.message);
        }
      }, 30000);
      _classUnsubFn = () => clearInterval(timer);
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
            cd[classId][idx] = {
              ...existing,
              score:    cm.score,
              level:    cm.level,
              _cloudTs: cloudTs,
            };
            changed = true;
          }
        } else {
          cd[classId].push({
            name:       cm.name,
            score:      cm.score  || 0,
            level:      cm.level  || 1,
            isTeacher:  false,
            _cloudTs:   cloudTs,
            _fromCloud: true,
          });
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
  // localStorage 拦截（自动触发云同步）
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
        if (deletedIds.length > 0) deletedIds.forEach(id => deleteCloudAccount(id));
      } else {
        _origSetItem(key, value);
      }

      if (!_userWantsSync || _isSyncing || !_ready) return;

      if (key === ACCOUNTS_KEY || key.startsWith(SAVE_PREFIX)) {
        if (key.startsWith(SAVE_PREFIX)) {
          const accId = key.slice(SAVE_PREFIX.length);
          if (isLocalMode(accId)) return;
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
  // 云端删除账号
  // ══════════════════════════════════════════════════════
  async function deleteCloudAccount(accountId) {
    if (!_db || !_ready || !_userWantsSync) return;
    try {
      await _db.collection(COLL_ACCOUNTS).doc(safeKey(String(accountId))).remove();
      log(`✅ 云端账号已删除：${accountId}`);
    } catch (err) {
      log('删除云端账号失败:', err.message);
    }
  }

  // ══════════════════════════════════════════════════════
  // 对外接口（与 firebase-bridge 完全相同，game.js / index.html 无需任何修改）
  // ══════════════════════════════════════════════════════
  window.FBBridge = {
    syncNow: async () => {
      if (!_userWantsSync) {
        if (typeof window.showToast === 'function') window.showToast('云同步未开启');
        return;
      }
      localStorage.removeItem(LAST_SYNC_KEY);
      showLoadingStatus('☁️ 正在同步…');
      const ok = await pullCloud();
      showLoadingStatus(ok ? '☁️ 同步完成 ✅' : '☁️ 同步失败', !ok);
    },
    setSyncEnabled: (enabled) => {
      _userWantsSync = enabled;
      _origSetItem(SYNC_CHOICE_KEY, enabled ? 'yes' : 'no');
      if (enabled && _ready) {
        localStorage.removeItem(LAST_SYNC_KEY);
        pullCloud();
      }
    },
    isSyncEnabled:  () => _userWantsSync,
    isReady:        () => _ready,
    getDeviceId,
    refreshLeaderboard: () => {
      const S = window.S;
      if (S && S.classId) startClassListener(S.classId);
    },
  };

  // ── 启动 ──
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTCB);
  } else {
    initTCB();
  }

})();
