/*!
 * hamster_anim.js — 仓鼠帧动画模块 v2
 * 修复：颜色偏深 / 预览不更新 / 胖瘦闪烁 / 移除眨眼 / 新增学习状态
 */
(function () {
  'use strict';

  var IMG_SRCS = {
    idle:     'assets/hamster/hamster_idle.jpg',
    happy:    'assets/hamster/hamster_happy.jpg',
    bathing:  'assets/hamster/hamster_bathing.jpg',
    eating:   'assets/hamster/hamster_eating.jpg',
    calm:     'assets/hamster/hamster_calm.jpg',
    sleeping: 'assets/hamster/hamster_sleeping.jpg',
    studying: 'assets/hamster/hamster_study.png'
  };

  var _imgs = {};
  var _anyLoaded = false;

  function preload() {
    Object.keys(IMG_SRCS).forEach(function (key) {
      var img = new Image();
      img.onload = function () { _imgs[key] = img; _anyLoaded = true; };
      img.onerror = function () { console.warn('[HamsterAnim] 加载失败:', IMG_SRCS[key]); };
      img.src = IMG_SRCS[key];
    });
  }

  function isReady() { return _anyLoaded && !!_imgs.idle; }

  /* ── 状态机 ── */
  var _state = 'idle', _stateEnd = 0;
  var ACTION_MAP = { feed:'eating', play:'happy', bath:'bathing', sleep:'sleeping', train:'studying' };

  function setAction(type) {
    _state = ACTION_MAP[type] || 'idle';
    _stateEnd = Date.now() + 7000;
  }

  function _resolveState() {
    if (_stateEnd && Date.now() > _stateEnd) { _state = 'idle'; _stateEnd = 0; }
    return _state;
  }

  /* ── 选图 ── */
  function _pickImage(state, energy) {
    if (state === 'sleeping' || energy < 18) return 'sleeping';
    if (state === 'eating')   return 'eating';
    if (state === 'bathing')  return 'bathing';
    if (state === 'happy')    return 'happy';
    if (state === 'studying') return 'studying';
    return 'idle';
  }

  /* ── 变瘦比例（仅food<15时生效，不闪烁）── */
  function _thinScale(food) {
    if (food >= 15) return { x: 1.0, y: 1.0 };
    var r = food / 15;
    return { x: 0.72 + r * 0.28, y: 0.90 + r * 0.10 };
  }

  /* ── 核心绘图：白底+multiply去白边，颜色不变深 ── */
  function _drawImg(ctx, cx, cy, imgKey, sx, sy, size) {
    var img = _imgs[imgKey] || _imgs['idle'];
    if (!img || !img.complete) return false;
    /* 纯白背景圆：white × anyColor = anyColor，multiply后颜色不变深 */
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, 54, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.restore();
    /* 图片：multiply模式使白色区域消失 */
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.translate(cx, cy); ctx.scale(sx, sy);
    ctx.drawImage(img, -size/2, -size/2, size, size);
    ctx.restore();
    return true;
  }

  /* ── 粒子 ── */
  var _particles = [];
  function _spawnBubble(cx, cy) {
    _particles.push({ x: cx+(Math.random()-.5)*45, y: cy+18, vx:(Math.random()-.5)*.7, vy:-(0.5+Math.random()*.9), r:2+Math.random()*3.5, age:0, maxAge:55+Math.floor(Math.random()*45) });
  }
  function _tickParticles(ctx, state, cx, cy) {
    if (state==='bathing' && Math.random()<0.05) _spawnBubble(cx, cy);
    for (var i=_particles.length-1; i>=0; i--) {
      var p=_particles[i]; p.age++; p.x+=p.vx; p.y+=p.vy;
      if (p.age>=p.maxAge) { _particles.splice(i,1); continue; }
      var a=(1-p.age/p.maxAge)*0.6;
      ctx.save(); ctx.globalAlpha=a;
      ctx.strokeStyle='#88cce8'; ctx.lineWidth=1.2;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2); ctx.stroke();
      ctx.fillStyle='rgba(255,255,255,.5)';
      ctx.beginPath(); ctx.arc(p.x-p.r*.28,p.y-p.r*.28,p.r*.24,0,Math.PI*2); ctx.fill();
      ctx.restore();
    }
  }

  /* ── 特效 ── */
  function _drawZZZ(ctx, cx, cy, t) {
    ctx.save(); ctx.textAlign='center'; ctx.textBaseline='middle';
    for (var i=0; i<3; i++) {
      var prog=((t*.55+i*.45)%1.35)/1.35; if(prog>1) continue;
      var a=Math.min(Math.min(1,prog/.25), Math.max(0,1-(prog-.7)/.3))*.9;
      ctx.globalAlpha=Math.max(0,a);
      ctx.font='bold '+(9+i*4)+'px sans-serif'; ctx.fillStyle='#6888bb';
      ctx.fillText('z', cx+18+i*7+prog*4, cy-36-prog*32);
    }
    ctx.globalAlpha=1; ctx.textAlign='left'; ctx.textBaseline='alphabetic'; ctx.restore();
  }

  function _drawBubbles(ctx, cx, cy, t) {
    var cfg=[{ox:-22,spd:.65,sz:4,ph:0},{ox:8,spd:.95,sz:6,ph:.33},{ox:-6,spd:.8,sz:5,ph:.66},{ox:24,spd:.55,sz:3,ph:.99},{ox:-14,spd:1.15,sz:4.5,ph:1.32},{ox:4,spd:.85,sz:5.5,ph:1.65}];
    ctx.save();
    cfg.forEach(function(b){
      var prog=((t*b.spd+b.ph)%1.6)/1.6, bx=cx+b.ox+Math.sin(t*1.8+b.ph)*3.5, by=cy+22-prog*65;
      var a=prog<.75?.7:(1-(prog-.75)/.25)*.7;
      ctx.globalAlpha=Math.max(0,a); ctx.strokeStyle='#7dc8e8'; ctx.lineWidth=1.4;
      ctx.beginPath(); ctx.arc(bx,by,b.sz,0,Math.PI*2); ctx.stroke();
      ctx.fillStyle='rgba(255,255,255,.5)';
      ctx.beginPath(); ctx.arc(bx-b.sz*.28,by-b.sz*.28,b.sz*.24,0,Math.PI*2); ctx.fill();
    });
    ctx.globalAlpha=1; ctx.restore();
  }

  function _drawFoodSparkles(ctx, cx, cy, t) {
    var items=['🌰','✨','💛'];
    ctx.save(); ctx.textAlign='center';
    items.forEach(function(ico,i){
      var prog=((t*.75+i*.38)%1.3)/1.3, a=prog<.65?1:Math.max(0,1-(prog-.65)/.35);
      ctx.globalAlpha=a; ctx.font='13px serif';
      ctx.fillText(ico, cx-14+i*14+Math.sin(t*2.5+i)*4, cy-22-prog*38);
    });
    ctx.globalAlpha=1; ctx.textAlign='left'; ctx.restore();
  }

  function _drawHappyStars(ctx, cx, cy, t) {
    var items=['⭐','✨','💕','🌟'];
    ctx.save(); ctx.textAlign='center';
    items.forEach(function(ico,i){
      var ang=t*1.4+i*(Math.PI*2/items.length), r=40+Math.sin(t*1.8+i)*7;
      var a=Math.min(1, .45+Math.abs(Math.sin(t*2.5+i*.6))*.5);
      ctx.globalAlpha=a; ctx.font='12px serif';
      ctx.fillText(ico, cx+Math.cos(ang)*r, cy+Math.sin(ang)*r*.42);
    });
    ctx.globalAlpha=1; ctx.textAlign='left'; ctx.restore();
  }

  function _drawStudyEffect(ctx, cx, cy, t) {
    var items=['📖','💡','⭐'];
    ctx.save(); ctx.textAlign='center';
    items.forEach(function(ico,i){
      var prog=((t*.6+i*.5)%1.4)/1.4, a=prog<.6?1:Math.max(0,1-(prog-.6)/.4);
      ctx.globalAlpha=a; ctx.font='13px serif';
      ctx.fillText(ico, cx-18+i*18+Math.sin(t*2+i)*3, cy-25-prog*35);
    });
    ctx.globalAlpha=1; ctx.textAlign='left'; ctx.restore();
  }

  function _drawHungry(ctx, cx, cy, t) {
    ctx.save(); ctx.globalAlpha=Math.max(0,.5+Math.sin(t*4)*.3);
    ctx.font='14px serif'; ctx.textAlign='center';
    ctx.fillText('🍽️', cx, cy-50);
    ctx.globalAlpha=1; ctx.textAlign='left'; ctx.restore();
  }

  function _getState() {
    return { state: _resolveState(), energy: (window.S&&window.S.petEnergy!=null?window.S.petEnergy:50), food: (window.S&&window.S.petFood!=null?window.S.petFood:50) };
  }

  /* ── drawBase：只绘图，无特效（预览/商店/工坊用）── */
  function drawBase(ctx, cx, cy, t) {
    if (!isReady()) return false;
    var s=_getState(), sc=_thinScale(s.food);
    return _drawImg(ctx, cx, cy, _pickImage(s.state, s.energy), sc.x, sc.y, 102);
  }

  /* ── drawFull：图+特效（主画布用）── */
  function drawFull(ctx, cx, cy, t, stage) {
    if (!isReady()) return false;
    var s=_getState(), sc=_thinScale(s.food), imgKey=_pickImage(s.state, s.energy);
    if (!_drawImg(ctx, cx, cy, imgKey, sc.x, sc.y, 102)) return false;
    var isSleep=(s.state==='sleeping'||s.energy<18);
    if (isSleep)              _drawZZZ(ctx, cx, cy, t);
    if (s.state==='bathing')  { _drawBubbles(ctx,cx,cy,t); _tickParticles(ctx,s.state,cx,cy); }
    if (s.state==='eating')   _drawFoodSparkles(ctx, cx, cy, t);
    if (s.state==='happy')    _drawHappyStars(ctx, cx, cy, t);
    if (s.state==='studying') _drawStudyEffect(ctx, cx, cy, t);
    if (s.food<15 && s.state==='idle') _drawHungry(ctx, cx, cy, t);
    return true;
  }

  /* ── drawOverlay：自定义图片模式下叠加特效 ── */
  function drawOverlay(ctx, cx, cy, t) {
    var s=_getState(), isSleep=(s.state==='sleeping'||s.energy<18);
    if (isSleep)              _drawZZZ(ctx, cx, cy, t);
    if (s.state==='bathing')  { _drawBubbles(ctx,cx,cy,t); _tickParticles(ctx,s.state,cx,cy); }
    if (s.state==='eating')   _drawFoodSparkles(ctx, cx, cy, t);
    if (s.state==='happy')    _drawHappyStars(ctx, cx, cy, t);
    if (s.state==='studying') _drawStudyEffect(ctx, cx, cy, t);
    if (s.food<15 && s.state==='idle') _drawHungry(ctx, cx, cy, t);
  }

  window.HamsterAnim = { preload, isReady, setAction, drawBase, drawFull, drawOverlay, getState: _resolveState };

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', preload); } else { preload(); }
})();
