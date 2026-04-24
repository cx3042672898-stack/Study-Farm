/*!
 * hamster_anim.js v3 — 仓鼠帧动画模块
 * 阶段2使用精灵图+皮肤系统；阶段1/3/4/5保留代码绘制
 * 特效（ZZZ/气泡/星星等）所有阶段通用叠加
 */
(function () {
  'use strict';

  /* ─────────────────────────────────────────
     精灵阶段定义：哪些品种的哪些阶段使用精灵图
     格式: { breed: [lv, lv, ...] }
  ───────────────────────────────────────── */
  var SPRITE_STAGES = { hamster: [2, 3] };

  /* ─────────────────────────────────────────
     皮肤数据
     图片路径规范：assets/{breed}/stage{lv}/{skinId}/{action}.jpg
     动作文件名：idle / eating / bathing / happy / sleeping / studying
     （所有图片均为 .jpg，studying 也用 .jpg）
     若某动作图片不存在，自动回退到 idle.jpg
  ───────────────────────────────────────── */
  var SPRITE_SKINS = {
    hamster: {
      2: [
        { id: 'orange', name: '橙棕色',   price: 0,  desc: '温暖橙棕，默认配色' },
        { id: 'white',  name: '雪白色',   price: 30, desc: '纯洁雪白，清新可爱' },
        { id: 'grey',   name: '银灰色',   price: 30, desc: '高雅银灰，低调百搭' },
        { id: 'purple', name: '薰衣草紫', price: 30, desc: '梦幻淡紫，甜美浪漫' },
        { id: 'black',  name: '墨黑色',   price: 30, desc: '神秘深黑，独特帅气' }
      ],
      3: [
        { id: 'orange', name: '骑士橙',   price: 0,  desc: '默认骑士配色' },
        { id: 'silver', name: '银甲色',   price: 50, desc: '闪亮银色铠甲' },
        { id: 'gold',   name: '黄金骑士', price: 80, desc: '传说黄金骑士' }
      ]
    }
  };

  /* ─────────────────────────────────────────
     文件名回退映射
     动作 → 按优先级尝试的文件名列表（不含扩展名）
     支持 idle.jpg / hamster_eating.jpg / hamster_study.png 等多种命名
  ───────────────────────────────────────── */
  var _FALLBACK_NAMES = {
    idle:     ['idle',     'hamster_idle'],
    eating:   ['eating',   'hamster_eating'],
    bathing:  ['bathing',  'hamster_bathing'],
    happy:    ['happy',    'hamster_happy'],
    sleeping: ['sleeping', 'hamster_sleeping'],
    studying: ['studying', 'study', 'hamster_studying', 'hamster_study']
  };
  var _FALLBACK_EXTS = ['.jpg', '.png'];

  /* ─────────────────────────────────────────
     图片缓存（按完整路径缓存）
  ───────────────────────────────────────── */
  var _cache = {};       // path → HTMLImageElement
  var _failed = {};      // path → true (加载失败，不重试)
  var _idleLoaded = {};  // 'breed/lv/skin' → true

  /**
   * 同步获取缓存图片（不触发异步加载）
   * 按照与 _getImg 相同的路径优先级查找，找到即返回，找不到返回 null
   */
  function getCachedImg(breed, lv, skin, action) {
    var base = 'assets/' + breed + '/stage' + lv;
    var names = _FALLBACK_NAMES[action] || [action];
    var paths = [];
    names.forEach(function(nm) {
      _FALLBACK_EXTS.forEach(function(ext) { paths.push(base+'/'+skin+'/'+nm+ext); });
    });
    names.forEach(function(nm) {
      _FALLBACK_EXTS.forEach(function(ext) { paths.push(base+'/'+nm+ext); });
    });
    paths.push(base+'/'+skin+'/idle.jpg');
    for (var i = 0; i < paths.length; i++) {
      if (_cache[paths[i]]) return _cache[paths[i]];
    }
    return null;
  }

  function _load(path, onDone) {
    if (_cache[path]) { if (onDone) onDone(_cache[path]); return; }
    if (_failed[path]) { if (onDone) onDone(null); return; }
    var img = new Image();
    img.onload = function () {
      _cache[path] = img;
      if (onDone) onDone(img);
      // 图片首次加载完成后，通知主画布重绘
      if (window.drawPet) { try { drawPet(); } catch(e) {} }
    };
    img.onerror = function () { _failed[path] = true; if (onDone) onDone(null); };
    img.src = path;
  }

  function _getImg(breed, lv, skin, action, cb) {
    var base = 'assets/' + breed + '/stage' + lv;
    var names = _FALLBACK_NAMES[action] || [action];
    // 构建按优先级排列的候选路径：
    //   1. 皮肤子目录（idle.jpg / hamster_eating.jpg / hamster_study.png …）
    //   2. 根目录回退（hamster_eating.jpg 等原始配色文件）
    //   3. 皮肤子目录 idle.jpg 终极保底
    var paths = [];
    names.forEach(function (nm) {
      _FALLBACK_EXTS.forEach(function (ext) {
        paths.push(base + '/' + skin + '/' + nm + ext);
      });
    });
    names.forEach(function (nm) {
      _FALLBACK_EXTS.forEach(function (ext) {
        paths.push(base + '/' + nm + ext);
      });
    });
    paths.push(base + '/' + skin + '/idle.jpg');

    function tryNext(i) {
      if (i >= paths.length) { cb(null); return; }
      var p = paths[i];
      if (_cache[p])  { cb(_cache[p]); return; }
      if (_failed[p]) { tryNext(i + 1); return; }
      _load(p, function (img) { if (img) cb(img); else tryNext(i + 1); });
    }
    tryNext(0);
  }

  /* ─────────────────────────────────────────
     预加载当前皮肤的所有动作图
  ───────────────────────────────────────── */
  var _ACTIONS = ['idle', 'eating', 'bathing', 'happy', 'sleeping', 'studying'];

  function preloadSkin(breed, lv, skin) {
    var base = 'assets/' + breed + '/stage' + lv;
    _ACTIONS.forEach(function (act) {
      var names = _FALLBACK_NAMES[act] || [act];
      names.forEach(function (nm) {
        _FALLBACK_EXTS.forEach(function (ext) {
          _load(base + '/' + skin + '/' + nm + ext, null); // 皮肤子目录
          _load(base + '/' + nm + ext, null);              // 根目录
        });
      });
    });
  }

  function preload() {
    // 预加载所有品种所有阶段所有皮肤的 idle
    Object.keys(SPRITE_SKINS).forEach(function (breed) {
      Object.keys(SPRITE_SKINS[breed]).forEach(function (lv) {
        SPRITE_SKINS[breed][lv].forEach(function (skin) {
          preloadSkin(breed, parseInt(lv), skin.id);
        });
      });
    });
  }

  function isSpritedStage(breed, lv) {
    return !!(SPRITE_STAGES[breed] && SPRITE_STAGES[breed].indexOf(lv) >= 0);
  }

  /* ─────────────────────────────────────────
     当前激活皮肤 key
  ───────────────────────────────────────── */
  function getActiveSkin(breed, lv) {
    if (!window.S || !S.activePet) return 'orange';
    var skins = S.petSpriteSkins;
    if (!skins) return 'orange';
    var key = skins[S.activePet + '_' + breed + '_' + lv];
    return key || 'orange';
  }

  /* ─────────────────────────────────────────
     动画状态机
  ───────────────────────────────────────── */
  var _state = 'idle', _stateEnd = 0;
  var ACTION_MAP = { feed: 'eating', play: 'happy', bath: 'bathing', sleep: 'sleeping', train: 'studying' };

  function setAction(type) {
    _state = ACTION_MAP[type] || 'idle';
    _stateEnd = Date.now() + 7000;
  }

  function _resolveState() {
    if (_stateEnd && Date.now() > _stateEnd) { _state = 'idle'; _stateEnd = 0; }
    return _state;
  }

  function _pickAction(state, energy) {
    if (state === 'sleeping' || energy < 18) return 'sleeping';
    if (state === 'eating')   return 'eating';
    if (state === 'bathing')  return 'bathing';
    if (state === 'happy')    return 'happy';
    if (state === 'studying') return 'studying';
    return 'idle';
  }

  /* ─────────────────────────────────────────
     变瘦比例（food < 15 时生效）
  ───────────────────────────────────────── */
  function _thinScale(food) {
    if (food >= 15) return { x: 1.0, y: 1.0 };
    var r = food / 15;
    return { x: 0.72 + r * 0.28, y: 0.90 + r * 0.10 };
  }

  /* ─────────────────────────────────────────
     核心绘图：白底 + multiply 去白边（颜色不变深）
  ───────────────────────────────────────── */
  function _drawImg(ctx, cx, cy, img, sx, sy, size) {
    if (!img || !img.complete) return false;
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, 54, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.translate(cx, cy); ctx.scale(sx, sy);
    ctx.drawImage(img, -size / 2, -size / 2, size, size);
    ctx.restore();
    return true;
  }

  /* ─────────────────────────────────────────
     粒子系统（洗澡气泡）
  ───────────────────────────────────────── */
  var _ptcl = [];
  function _spawnBubble(cx, cy) {
    _ptcl.push({ x: cx + (Math.random() - .5) * 45, y: cy + 18, vx: (Math.random() - .5) * .7, vy: -(0.5 + Math.random() * .9), r: 2 + Math.random() * 3.5, age: 0, max: 55 + (Math.random() * 45 | 0) });
  }
  function _tickBubbles(ctx, state, cx, cy) {
    if (state === 'bathing' && Math.random() < .05) _spawnBubble(cx, cy);
    for (var i = _ptcl.length - 1; i >= 0; i--) {
      var p = _ptcl[i]; p.age++; p.x += p.vx; p.y += p.vy;
      if (p.age >= p.max) { _ptcl.splice(i, 1); continue; }
      var a = (1 - p.age / p.max) * .6;
      ctx.save(); ctx.globalAlpha = a;
      ctx.strokeStyle = '#88cce8'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.5)';
      ctx.beginPath(); ctx.arc(p.x - p.r * .28, p.y - p.r * .28, p.r * .24, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }

  /* ─────────────────────────────────────────
     特效绘制
  ───────────────────────────────────────── */
  function _fxZZZ(ctx, cx, cy, t) {
    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (var i = 0; i < 3; i++) {
      var prog = ((t * .55 + i * .45) % 1.35) / 1.35; if (prog > 1) continue;
      var a = Math.min(Math.min(1, prog / .25), Math.max(0, 1 - (prog - .7) / .3)) * .9;
      ctx.globalAlpha = Math.max(0, a);
      ctx.font = 'bold ' + (9 + i * 4) + 'px sans-serif'; ctx.fillStyle = '#6888bb';
      ctx.fillText('z', cx + 18 + i * 7 + prog * 4, cy - 36 - prog * 32);
    }
    ctx.globalAlpha = 1; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.restore();
  }
  function _fxBubbles(ctx, cx, cy, t) {
    var cfg = [{ ox: -22, spd: .65, sz: 4, ph: 0 }, { ox: 8, spd: .95, sz: 6, ph: .33 }, { ox: -6, spd: .8, sz: 5, ph: .66 }, { ox: 24, spd: .55, sz: 3, ph: .99 }, { ox: -14, spd: 1.15, sz: 4.5, ph: 1.32 }, { ox: 4, spd: .85, sz: 5.5, ph: 1.65 }];
    ctx.save();
    cfg.forEach(function (b) {
      var prog = ((t * b.spd + b.ph) % 1.6) / 1.6, bx = cx + b.ox + Math.sin(t * 1.8 + b.ph) * 3.5, by = cy + 22 - prog * 65;
      var a = prog < .75 ? .7 : (1 - (prog - .75) / .25) * .7;
      ctx.globalAlpha = Math.max(0, a); ctx.strokeStyle = '#7dc8e8'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(bx, by, b.sz, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.5)';
      ctx.beginPath(); ctx.arc(bx - b.sz * .28, by - b.sz * .28, b.sz * .24, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1; ctx.restore();
  }
  function _fxFood(ctx, cx, cy, t) {
    var items = ['🌰', '✨', '💛'];
    ctx.save(); ctx.textAlign = 'center';
    items.forEach(function (ico, i) {
      var prog = ((t * .75 + i * .38) % 1.3) / 1.3;
      var a = prog < .65 ? 1 : Math.max(0, 1 - (prog - .65) / .35);
      ctx.globalAlpha = a; ctx.font = '13px serif';
      ctx.fillText(ico, cx - 14 + i * 14 + Math.sin(t * 2.5 + i) * 4, cy - 22 - prog * 38);
    });
    ctx.globalAlpha = 1; ctx.textAlign = 'left'; ctx.restore();
  }
  function _fxStars(ctx, cx, cy, t) {
    var items = ['⭐', '✨', '💕', '🌟'];
    ctx.save(); ctx.textAlign = 'center';
    items.forEach(function (ico, i) {
      var ang = t * 1.4 + i * (Math.PI * 2 / items.length), r = 40 + Math.sin(t * 1.8 + i) * 7;
      ctx.globalAlpha = Math.min(1, .45 + Math.abs(Math.sin(t * 2.5 + i * .6)) * .5);
      ctx.font = '12px serif';
      ctx.fillText(ico, cx + Math.cos(ang) * r, cy + Math.sin(ang) * r * .42);
    });
    ctx.globalAlpha = 1; ctx.textAlign = 'left'; ctx.restore();
  }
  function _fxStudy(ctx, cx, cy, t) {
    var items = ['📖', '💡', '⭐'];
    ctx.save(); ctx.textAlign = 'center';
    items.forEach(function (ico, i) {
      var prog = ((t * .6 + i * .5) % 1.4) / 1.4;
      var a = prog < .6 ? 1 : Math.max(0, 1 - (prog - .6) / .4);
      ctx.globalAlpha = a; ctx.font = '13px serif';
      ctx.fillText(ico, cx - 18 + i * 18 + Math.sin(t * 2 + i) * 3, cy - 25 - prog * 35);
    });
    ctx.globalAlpha = 1; ctx.textAlign = 'left'; ctx.restore();
  }
  function _fxHungry(ctx, cx, cy, t) {
    ctx.save(); ctx.globalAlpha = Math.max(0, .5 + Math.sin(t * 4) * .3);
    ctx.font = '14px serif'; ctx.textAlign = 'center';
    ctx.fillText('🍽️', cx, cy - 50);
    ctx.globalAlpha = 1; ctx.textAlign = 'left'; ctx.restore();
  }

  /* ─────────────────────────────────────────
     统一特效入口（供所有阶段叠加）
  ───────────────────────────────────────── */
  function _applyFX(ctx, cx, cy, t, state, food, energy) {
    var isSleep = state === 'sleeping' || energy < 18;
    if (isSleep)              _fxZZZ(ctx, cx, cy, t);
    if (state === 'bathing')  { _fxBubbles(ctx, cx, cy, t); _tickBubbles(ctx, state, cx, cy); }
    if (state === 'eating')   _fxFood(ctx, cx, cy, t);
    if (state === 'happy')    _fxStars(ctx, cx, cy, t);
    if (state === 'studying') _fxStudy(ctx, cx, cy, t);
    if (food < 15 && state === 'idle') _fxHungry(ctx, cx, cy, t);
  }

  /* ─────────────────────────────────────────
     公开绘制接口
  ───────────────────────────────────────── */

  /**
   * drawBase: 仅绘制精灵图（无特效），供 drawHamster / 预览 调用
   * 只在 isSpritedStage 时有效，返回 false 则由调用者回退到代码绘制
   */
  function drawBase(ctx, cx, cy, t) {
    if (!window.S) return false;
    var breed = S.petBreed || 'hamster';
    var lv = S.petLevel || 1;
    if (!isSpritedStage(breed, lv)) return false;
    var state  = _resolveState();
    var energy = S.petEnergy != null ? S.petEnergy : 50;
    var food   = S.petFood   != null ? S.petFood   : 50;
    var skin   = getActiveSkin(breed, lv);
    var action = _pickAction(state, energy);
    var sc     = _thinScale(food);
    var drew   = false;
    _getImg(breed, lv, skin, action, function (img) {
      drew = _drawImg(ctx, cx, cy, img, sc.x, sc.y, 102);
    });
    return drew;
  }

  /**
   * drawFull: 精灵图 + 特效，供主宠物画布调用
   * 同样只在 isSpritedStage 时绘制图片；特效通过 drawOverlay 单独处理
   */
  function drawFull(ctx, cx, cy, t, stage) {
    if (!window.S) return false;
    var breed = S.petBreed || 'hamster';
    var lv = S.petLevel || 1;
    if (!isSpritedStage(breed, lv)) return false;
    var state  = _resolveState();
    var energy = S.petEnergy != null ? S.petEnergy : 50;
    var food   = S.petFood   != null ? S.petFood   : 50;
    var skin   = getActiveSkin(breed, lv);
    var action = _pickAction(state, energy);
    var sc     = _thinScale(food);
    var drew   = false;
    _getImg(breed, lv, skin, action, function (img) {
      drew = _drawImg(ctx, cx, cy, img, sc.x, sc.y, 102);
    });
    if (!drew) return false;
    _applyFX(ctx, cx, cy, t, state, food, energy);
    return true;
  }

  /**
   * drawOverlay: 只叠加特效，图片由调用者自己画
   * 供代码绘制阶段（lv 1/3/4/5）叠加 ZZZ、气泡等
   */
  function drawOverlay(ctx, cx, cy, t) {
    if (!window.S) return;
    var state  = _resolveState();
    var energy = S.petEnergy != null ? S.petEnergy : 50;
    var food   = S.petFood   != null ? S.petFood   : 50;
    _applyFX(ctx, cx, cy, t, state, food, energy);
  }

  /* ─────────────────────────────────────────
     公开 API
  ───────────────────────────────────────── */
  window.HamsterAnim = {
    preload:         preload,
    preloadSkin:     preloadSkin,
    isSpritedStage:  isSpritedStage,
    getActiveSkin:   getActiveSkin,
    getCachedImg:    getCachedImg,
    setAction:       setAction,
    getState:        _resolveState,
    drawBase:        drawBase,
    drawFull:        drawFull,
    drawOverlay:     drawOverlay,
    SPRITE_SKINS:    SPRITE_SKINS
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', preload);
  } else {
    preload();
  }
})();
