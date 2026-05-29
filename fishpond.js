// ══════════════════════════════════════════════════════════════
//  fishpond.js  — 知识鱼塘系统 v3.0
//  数据驱动 · 代码绘制鱼 · 气泡对话 · 鱼卵可视化 · 横排卡片
//  v3.0 新增：专属技能 · 粒子系统 · 食物投喂 · 诱引拖拽 · 首领光环 · 群游行为
// ══════════════════════════════════════════════════════════════

// ─── 一、全局鱼类数据库 ─────────────────────────────────────────
window.FISH_DB = {
  goldfish:     { id:'goldfish',     name:'小金鱼',     icon:'🐟', rarity:'common',   maxLv:5,  baseSize:28, color:'#FFD700', bodyColor:'#FF8C00', finColor:'#FF6347', speed:1.2, unlockDesc:'连续答对5题',     subject:null,    quotes:['今天也要加油呀！','游来游去真开心~','主人来看我啦！','要认真学习哦~','✨金光闪闪！'] },
  blueberry_f:  { id:'blueberry_f',  name:'蓝莓鱼',     icon:'🫧', rarity:'common',   maxLv:5,  baseSize:26, color:'#6495ED', bodyColor:'#4169E1', finColor:'#1E90FF', speed:1.0, unlockDesc:'英语答题全对',     subject:'english',quotes:['Blueberry swimming~','Hello master!','Let\'s learn!','Nice to see you!','Bubble!🫧'] },
  math_shark:   { id:'math_shark',   name:'数学鲨鱼',   icon:'🦈', rarity:'rare',     maxLv:8,  baseSize:42, color:'#708090', bodyColor:'#2F4F4F', finColor:'#556B2F', speed:1.8, unlockDesc:'数学答题连胜',     subject:'math',  quotes:['1+1=2，简单！','几何证明？小意思！','数学是宇宙的语言！','让开！鲨鱼来了！'] },
  lantern_f:    { id:'lantern_f',    name:'熬夜灯笼鱼', icon:'🏮', rarity:'rare',     maxLv:6,  baseSize:30, color:'#FF6B35', bodyColor:'#FF4500', finColor:'#FFD700', speed:0.8, unlockDesc:'夜间学习解锁',     subject:null,    quotes:['深夜也在发光~','黑暗中照亮前路','夜猫子报到！','我能照亮你！🏮'] },
  slack_f:      { id:'slack_f',      name:'摸鱼鱼',     icon:'🐡', rarity:'common',   maxLv:4,  baseSize:24, color:'#98FB98', bodyColor:'#66CDAA', finColor:'#20B2AA', speed:0.5, unlockDesc:'长时间挂机触发', subject:null,    quotes:['摸鱼使我快乐~','今天也摸到了！','划水中…请勿打扰','zzz...','咸鱼翻身！'] },
  whale_scholar:{ id:'whale_scholar', name:'学霸鲸鱼',  icon:'🐳', rarity:'epic',     maxLv:10, baseSize:55, color:'#4682B4', bodyColor:'#1C3A5F', finColor:'#87CEEB', speed:0.6, unlockDesc:'连续7天坚持学习', subject:null,    quotes:['知识的海洋任我畅游！','学无止境！','坚持就是胜利！','🐳 噗——','来跟我一起学！'] },
  rainbow_f:    { id:'rainbow_f',    name:'彩虹鱼',     icon:'🌈', rarity:'epic',     maxLv:8,  baseSize:32, color:'rainbow',  bodyColor:'#FF69B4', finColor:'#9370DB', speed:1.4, unlockDesc:'周末限定活动获取',subject:null,    quotes:['今天的颜色格外好看~','彩虹闪闪发光！','七彩祝福送给你！','✨彩虹爆发！✨'] },
  puffer_f:     { id:'puffer_f',     name:'河豚宝宝',   icon:'🐡', rarity:'common',   maxLv:5,  baseSize:22, color:'#FFC0CB', bodyColor:'#FFB6C1', finColor:'#FF69B4', speed:0.9, unlockDesc:'累计答对20题',     subject:null,    quotes:['鼓起来了！','不要戳我！','我生气会变大的！','气呼呼！💨'] },
  clownfish:    { id:'clownfish',    name:'小丑鱼',     icon:'🤡', rarity:'common',   maxLv:5,  baseSize:24, color:'#FF7F50', bodyColor:'#FF6347', finColor:'#FFA500', speed:1.3, unlockDesc:'累计答对50题',     subject:null,    quotes:['找到尼莫了！','我有条纹哦~','珊瑚礁是我家！','泡泡圆舞！🫧'] },
  dragon_f:     { id:'dragon_f',     name:'龙鱼',       icon:'🐉', rarity:'legendary',maxLv:12, baseSize:48, color:'#B22222', bodyColor:'#8B0000', finColor:'#FFD700', speed:1.6, unlockDesc:'累计答对200题',   subject:null,    quotes:['吾乃龙鱼之王！','区区题目，不在话下！','传说中的存在！','🔥 烈焰吐息！'] },
  geo_turtle:   { id:'geo_turtle',   name:'地理龟',     icon:'🐢', rarity:'rare',     maxLv:7,  baseSize:35, color:'#2E8B57', bodyColor:'#006400', finColor:'#8FBC8F', speed:0.4, unlockDesc:'地理答题连胜',     subject:'geo',   quotes:['世界那么大~','经纬度我最熟！','慢慢游也能到终点','缩进去了！🐢'] },
  history_carp: { id:'history_carp', name:'历史锦鲤',   icon:'🎏', rarity:'rare',     maxLv:7,  baseSize:34, color:'#DC143C', bodyColor:'#B22222', finColor:'#FFD700', speed:1.1, unlockDesc:'历史答题连胜',     subject:'history',quotes:['以史为鉴！','鲤鱼跃龙门！','历史的长河~','腾空！🎏'] },
};
window.FISH_IDS = Object.keys(FISH_DB);
const RARITY_LABEL = { common:'普通', rare:'稀有', epic:'史诗', legendary:'传说' };
const RARITY_COLOR = { common:'#6aaa6a', rare:'#4682B4', epic:'#a07ad0', legendary:'#FFD700' };

// ─── 鱼形象图统一系统 ─────────────────────────────────────────
// 优先级：玩家自定义(fish._customImg) > assets/fish/{fishId}/default.png > 代码绘制
const _fishAssetImgCache = {};

function _loadFishAssetImg(fishId, onLoad) {
  if (_fishAssetImgCache[fishId] instanceof Image) { onLoad && onLoad(_fishAssetImgCache[fishId]); return; }
  if (_fishAssetImgCache[fishId] === 'missing' || _fishAssetImgCache[fishId] === 'loading') return;
  _fishAssetImgCache[fishId] = 'loading';
  const img = new Image();
  img.onload = () => { _fishAssetImgCache[fishId] = img; onLoad && onLoad(img); };
  img.onerror = () => { _fishAssetImgCache[fishId] = 'missing'; };
  img.src = 'assets/fish/' + fishId + '/default.png';
}

// 预加载所有已拥有鱼的资源图
function _preloadFishAssets() {
  (S.pondFish || []).forEach(f => _loadFishAssetImg(f.fishId));
  (S.fishAlmanac || []).forEach(id => _loadFishAssetImg(id));
}

// 返回鱼当前最佳图片对象（null = 回退代码绘制）
function _getEffectiveFishImg(fish) {
  if (fish._customImg) {
    if (fish.__customImgObj instanceof Image && fish.__customImgObj._src === fish._customImg) return fish.__customImgObj;
    if (!fish.__customImgObj || fish.__customImgObj._src !== fish._customImg) {
      const img = new Image(); img.src = fish._customImg;
      img.onload = () => { fish.__customImgObj = img; img._src = fish._customImg; };
      fish.__customImgObj = null;
    }
    return null; // 加载中，下帧再渲染
  }
  _loadFishAssetImg(fish.fishId);
  return (_fishAssetImgCache[fish.fishId] instanceof Image) ? _fishAssetImgCache[fish.fishId] : null;
}

// 通用：在小预览画布上绘制鱼（信息卡/售出列表/孵化弹窗等）
function _drawFishPreviewCanvas(canvas, fish, mood) {
  if (!canvas) return;
  const def = FISH_DB[fish.fishId] || {};
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  const img = _getEffectiveFishImg(fish);
  if (img) {
    const aspect = img.naturalWidth / (img.naturalHeight || 1);
    const maxSize = Math.min(w, h) - 4;
    let dw = maxSize, dh = maxSize;
    if (aspect > 1) dh = maxSize / aspect; else dw = maxSize * aspect;
    ctx.drawImage(img, (w-dw)/2, (h-dh)/2, dw, dh);
  } else {
    renderFishByCode(ctx, {...fish, _phase:0}, w/2, h/2, def.baseSize * (w / 80), 0, false, mood || 'normal');
    // 若资源还在加载中，等加载完后刷新
    if (fish._customImg || _fishAssetImgCache[fish.fishId] === 'loading') {
      _loadFishAssetImg(fish.fishId, () => _drawFishPreviewCanvas(canvas, fish, mood));
    }
  }
}

// ─── NEW v3.0：专属技能配置 ──────────────────────────────────────
window.FISH_SKILLS = {
  goldfish:     { name:'金光闪闪', cd:5000  },
  blueberry_f:  { name:'蓝莓气泡', cd:5000  },
  math_shark:   { name:'极速冲刺', cd:4000  },
  lantern_f:    { name:'提灯照水', cd:7000  },
  slack_f:      { name:'超级摸鱼', cd:6000  },
  whale_scholar:{ name:'喷水柱',   cd:8000  },
  rainbow_f:    { name:'彩虹爆发', cd:6000  },
  puffer_f:     { name:'膨胀防御', cd:5000  },
  clownfish:    { name:'泡泡圆舞', cd:5000  },
  dragon_f:     { name:'烈焰吐息', cd:10000 },
  geo_turtle:   { name:'缩壳防御', cd:6000  },
  history_carp: { name:'鲤跃龙门', cd:8000  },
};

// ─── 二、玩家鱼塘存档默认值 ─────────────────────────────────────
window.FISHPOND_DEFAULT = {
  pondFish:[], fishEggs:[], fishAlmanac:[], fishCoins:0,
  totalFishCaught:0, fishingRodLevel:1, dailyBossDefeated:false,
  lastBossDate:'', lastFishFeedTime:0, fishPondUnlocked:true,
};

// ─── 三、全局状态 ────────────────────────────────────────────────
let _fpCanvas, _fpCtx, _fpAF, _fpW=400, _fpH=360;
let _fpBubbles = [];
let _fpRipples = [];
let _fpSpeech  = [];
let _fpTime    = 0;
let _fpSelectedFish = null;
let _fpSelectedEgg  = null;
let _fpMode = 'pond';
const SAND_COLOR = '#d4a76a';
let _fishingState='idle',_fishingTimer=0,_fishingBobY=0,_fishingTarget=null;
let _fishingRodX=0,_fishingLineEndY=0,_fishingBobAngle=0,_fishingBiteAt=0;

// ─── NEW v3.0 全局状态 ────────────────────────────────────────────
let _fpParticles   = [];
let _fpFoodItems   = [];
let _fpLurePos     = null;
let _fpDragActive  = false;
let _fpLastTap     = {t:0, x:0, y:0};
let _fpFoodCd      = 0;
let _fpLeaderTimer = 0;
let _fpLeaderLinks = [];

// ─── 四、初始化 ──────────────────────────────────────────────────
function initFishPond(){
  if(!S.pondFish)    S.pondFish=[];
  if(!S.fishEggs)    S.fishEggs=[];
  if(!S.fishAlmanac) S.fishAlmanac=[];
  if(S.fishCoins===undefined) S.fishCoins=0;
  if(!S.totalFishCaught) S.totalFishCaught=0;
  if(!S.fishingRodLevel) S.fishingRodLevel=1;
  if(S.pondFish.length===0&&S.fishAlmanac.length===0){
    _addFishToPlayer('goldfish');
    _addFishToPlayer('puffer_f');
  }
  _assignEggPositions();
  _fpMode='pond'; _fpSelectedFish=null; _fpSelectedEgg=null;
  _preloadFishAssets(); // 预加载已拥有鱼的资源图
  renderFishPondUI();
}

function _assignEggPositions(){
  if(!S.fishEggs) return;
  S.fishEggs.forEach((egg,i)=>{
    if(!egg._x)      egg._x=0.12+(i*0.22)%0.72;
    if(!egg._wobble) egg._wobble=Math.random()*Math.PI*2;
  });
}

function _resizeFishPond(){
  if(!_fpCanvas) return;
  const c=_fpCanvas.parentElement;
  _fpW=_fpCanvas.width =Math.max(300,c.clientWidth ||400);
  _fpH=_fpCanvas.height=Math.max(260,c.clientHeight||360);
}

// ─── 五、代码绘制鱼 ─────────────────────────────────────────────
function renderFishByCode(ctx,fish,x,y,size,angle,flipX,mood){
  const def=FISH_DB[fish.fishId]; if(!def) return;
  ctx.save(); ctx.translate(x,y); ctx.rotate(angle);
  if(flipX) ctx.scale(-1,1);
  const sc=size/30; ctx.scale(sc,sc);
  let bodyColor=def.bodyColor, finColor=def.finColor;
  if(mood==='sad'){bodyColor=_desaturate(bodyColor,.5);finColor=_desaturate(finColor,.5);}
  const t=_fpTime*0.003;
  const isPuffing=fish._puffing&&Date.now()<fish._puffing;
  if(isPuffing) ctx.scale(1.3+Math.sin(_fpTime*.022)*.06,1.3+Math.sin(_fpTime*.022)*.06);
  // 尾巴
  const tailS=Math.sin(t*3+(fish._phase||0))*12;
  ctx.fillStyle=finColor;
  ctx.beginPath();ctx.moveTo(-18,0);ctx.lineTo(-30,-10+tailS);ctx.lineTo(-30,10+tailS);ctx.closePath();ctx.fill();
  // 身体
  ctx.fillStyle=bodyColor;
  ctx.beginPath();ctx.ellipse(0,0,18,11,0,0,Math.PI*2);ctx.fill();
  // 肚皮
  ctx.fillStyle=_lighten(bodyColor,.4);
  ctx.beginPath();ctx.ellipse(2,3,12,6,0,0,Math.PI*2);ctx.fill();
  // 背鳍
  ctx.fillStyle=finColor;
  ctx.beginPath();ctx.moveTo(-5,-11);ctx.quadraticCurveTo(3,-20+Math.sin(t*2)*2,10,-11);ctx.closePath();ctx.fill();
  // 胸鳍
  const finSw=Math.sin(t*4+(fish._phase||0))*8;
  ctx.fillStyle=finColor;ctx.globalAlpha=.7;
  ctx.beginPath();ctx.moveTo(2,6);ctx.quadraticCurveTo(8,14+finSw,-2,12+finSw);ctx.closePath();ctx.fill();
  ctx.globalAlpha=1;
  // 眼睛
  ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(10,-3,4,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=mood==='sad'?'#666':'#111';ctx.beginPath();ctx.arc(11,-3,2,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(12,-4,.8,0,Math.PI*2);ctx.fill();
  // 嘴
  ctx.strokeStyle=mood==='sad'?'#666':'#333';ctx.lineWidth=.8;
  ctx.beginPath();
  if(mood==='happy')  ctx.arc(15,1,2.5,0,Math.PI);
  else if(mood==='sad') ctx.arc(15,3,2,Math.PI,0);
  else{ctx.arc(15,1,1,0,Math.PI);} ctx.stroke();
  // 彩虹叠加
  if(def.color==='rainbow'){
    ctx.globalCompositeOperation='overlay';
    const g=ctx.createLinearGradient(-18,0,18,0),h=(t*50)%360;
    g.addColorStop(0,`hsl(${h},80%,60%)`);g.addColorStop(.5,`hsl(${(h+120)%360},80%,60%)`);g.addColorStop(1,`hsl(${(h+240)%360},80%,60%)`);
    ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(0,0,18,11,0,0,Math.PI*2);ctx.fill();
    ctx.globalCompositeOperation='source-over';
  }
  // 稀有光环
  if(def.rarity==='epic'||def.rarity==='legendary'){
    ctx.globalAlpha=.15+Math.sin(t*2)*.1;ctx.strokeStyle=RARITY_COLOR[def.rarity];ctx.lineWidth=2;
    ctx.beginPath();ctx.ellipse(0,0,22,15,0,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;
  }
  // 缩壳防御遮罩
  if(fish._hiding&&Date.now()<fish._hiding){
    ctx.globalAlpha=.5;ctx.fillStyle='#006400';
    ctx.beginPath();ctx.ellipse(0,0,22,16,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
  }
  // 等级
  if(fish.lv>1){ctx.font='bold 7px sans-serif';ctx.fillStyle='#fff';ctx.strokeStyle='rgba(0,0,0,.5)';ctx.lineWidth=1.5;ctx.strokeText('Lv'+fish.lv,-14,-14);ctx.fillText('Lv'+fish.lv,-14,-14);}
  ctx.restore();
}

function renderFish(ctx,fish,x,y,size,angle,flipX){
  renderFishByCode(ctx,fish,x,y,size,angle,flipX,_getFishMood(fish));
}

// ─── 六、饥饿标识 ───────────────────────────────────────────────
function _drawHungryIndicator(ctx,fish,x,y){
  if(fish.hunger>=30) return;
  const bounce=Math.sin(_fpTime*.004*2)*2;
  ctx.save();ctx.font='12px sans-serif';ctx.textAlign='center';
  ctx.globalAlpha=.6+Math.sin(_fpTime*.004*3)*.3;
  ctx.fillText(fish.hunger<15?'😵':'🍽️',x,y-25+bounce);
  ctx.globalAlpha=1;ctx.restore();
}

// ─── 七、鱼AI（v3.0：诱引+追食+群游+鲨鱼威慑）────────────────
function _updateFishBehavior(fish,dt){
  if(!fish._phase)      fish._phase=Math.random()*Math.PI*2;
  if(!fish._state)      fish._state='swim';
  if(!fish._stateTimer) fish._stateTimer=0;
  const def=FISH_DB[fish.fishId]||{}, spd=(def.speed||1)*(0.5+fish.lv*0.05);

  // 特殊技能状态减速
  if((fish._hiding&&Date.now()<fish._hiding)||(fish._puffing&&Date.now()<fish._puffing)){
    fish.vx*=.85; fish.vy*=.85;
  } else { if(fish._hiding) fish._hiding=0; if(fish._puffing) fish._puffing=0; }

  fish._stateTimer-=dt;

  // ① 诱引点（拖拽）
  if(_fpLurePos&&Date.now()-_fpLurePos.t<2000){
    const dx=_fpLurePos.x-fish.x,dy=_fpLurePos.y-fish.y,d=Math.sqrt(dx*dx+dy*dy);
    if(d<220){fish.vx+=(dx/d)*spd*.1;fish.vy+=(dy/d)*spd*.1;if(fish._state!=='chase_food'){fish._state='follow';fish._stateTimer=300;}}
  }

  // ② 追食
  if(fish._state==='chase_food'){
    const avail=_fpFoodItems.filter(f=>!f.eaten);
    if(avail.length){
      let best=null,bd=Infinity;
      avail.forEach(food=>{const d=Math.hypot(food.x-fish.x,food.y-fish.y);if(d<bd){bd=d;best=food;}});
      if(best&&bd<280){const dx=best.x-fish.x,dy=best.y-fish.y,d=bd;fish.vx+=(dx/d)*spd*.22;fish.vy+=(dy/d)*spd*.22;}
    } else {fish._state='swim';fish._stateTimer=2000;}
  }

  // ③ 状态机
  if(fish._stateTimer<=0&&fish._state!=='chase_food'&&fish._state!=='follow'){
    const r=Math.random();
    if(r<.6){fish._state='swim';fish._stateTimer=3000+Math.random()*5000;const a=Math.random()*Math.PI*2;fish.vx=Math.cos(a)*spd;fish.vy=Math.sin(a)*spd*.5;}
    else if(r<.8){fish._state='idle';fish._stateTimer=1500+Math.random()*2000;fish.vx*=.2;fish.vy*=.1;}
    else if(r<.92){fish._state='dash';fish._stateTimer=600+Math.random()*800;const a=Math.random()*Math.PI*2;fish.vx=Math.cos(a)*spd*2.5;fish.vy=Math.sin(a)*spd*1.2;}
    else{fish._state='follow';fish._stateTimer=2000;}
  }

  // ④ 跟随涟漪
  if(fish._state==='follow'&&_fpRipples.length){
    const tg=_fpRipples[_fpRipples.length-1],dx=tg.x-fish.x,dy=tg.y-fish.y,d=Math.sqrt(dx*dx+dy*dy);
    if(d>5){fish.vx+=(dx/d)*spd*.05;fish.vy+=(dy/d)*spd*.05;}
  }

  // ⑤ 群游速度对齐
  if(fish._state==='swim'&&Math.random()<.015&&S.pondFish){
    let svx=0,svy=0,cnt=0;
    S.pondFish.forEach(o=>{if(o.uid!==fish.uid&&Math.hypot(o.x-fish.x,o.y-fish.y)<90){svx+=o.vx;svy+=o.vy;cnt++;}});
    if(cnt){fish.vx=fish.vx*.78+(svx/cnt)*.22;fish.vy=fish.vy*.78+(svy/cnt)*.22;}
  }

  // 分散模式：喂食追食后缓慢漂回目标位（soft homing）
  if(_fpScattered && fish._scatterTargetX!=null && fish._state!=='chase_food'){
    const _sdx=fish._scatterTargetX-fish.x, _sdy=fish._scatterTargetY-fish.y;
    const _sd=Math.sqrt(_sdx*_sdx+_sdy*_sdy);
    if(_sd>35){
      // 距目标超过35px时施加弱引力，越远越强，不压过正常游动
      const _sf=Math.min(0.06, _sd*0.0008);
      fish.vx+=(_sdx/_sd)*_sf; fish.vy+=(_sdy/_sd)*_sf;
      if(fish._state==='idle') fish._state='swim'; // 解除呆滞，允许漂移
    } else {
      // 已到位，轻微抖动休息
      fish._state='idle'; fish._stateTimer=9999;
    }
  }
  fish.vx*=.98;fish.vy*=.98;fish.vy+=Math.sin(_fpTime*.002+fish._phase)*.015;
  fish.x+=fish.vx*dt*.06;fish.y+=fish.vy*dt*.06;
  const m=30,sY=_fpH-45;
  if(fish.x<m){fish.x=m;fish.vx=Math.abs(fish.vx)*.8;}
  if(fish.x>_fpW-m){fish.x=_fpW-m;fish.vx=-Math.abs(fish.vx)*.8;}
  if(fish.y<40){fish.y=40;fish.vy=Math.abs(fish.vy)*.6;}
  if(fish.y>sY){fish.y=sY;fish.vy=-Math.abs(fish.vy)*.6;}
}

// ─── 八、鱼卵绘制 ───────────────────────────────────────────────
function _drawEggs(ctx){
  if(!S.fishEggs||!S.fishEggs.length) return;
  const sandY=_fpH-15;
  S.fishEggs.forEach((egg,i)=>{
    const def=FISH_DB[egg.fishId]||{},prog=Math.min(1,egg.progress/100);
    const ex=egg._x?egg._x*_fpW:(0.2+i*0.2)*_fpW;
    const ey=sandY-12+Math.sin((egg._wobble||0)+_fpTime*.001)*1.5;
    const rc=RARITY_COLOR[def.rarity||'common'],isSel=(_fpSelectedEgg===i),t=_fpTime*.003;
    ctx.save();ctx.translate(ex,ey);
    ctx.fillStyle='rgba(0,0,0,.08)';ctx.beginPath();ctx.ellipse(0,6,10,3,0,0,Math.PI*2);ctx.fill();
    const eH=16,eW=11;
    if(prog<.3) ctx.fillStyle='#FAFAF5';
    else if(prog<.6){const g=ctx.createLinearGradient(0,-eH,0,eH);g.addColorStop(0,'#FAFAF5');g.addColorStop(1,rc+'44');ctx.fillStyle=g;}
    else if(prog<.9){const g=ctx.createLinearGradient(0,-eH,0,eH);g.addColorStop(0,rc+'88');g.addColorStop(1,rc+'cc');ctx.fillStyle=g;}
    else{ctx.fillStyle=rc;ctx.shadowColor=rc;ctx.shadowBlur=8+Math.sin(t*4)*4;}
    ctx.beginPath();ctx.moveTo(0,-eH);ctx.bezierCurveTo(eW,-eH*.6,eW,eH*.4,0,eH);ctx.bezierCurveTo(-eW,eH*.4,-eW,-eH*.6,0,-eH);ctx.closePath();ctx.fill();
    ctx.shadowBlur=0;
    ctx.fillStyle='rgba(255,255,255,.35)';ctx.beginPath();ctx.ellipse(-3,-5,4,6,-.3,0,Math.PI*2);ctx.fill();
    if(prog>=.6){ctx.strokeStyle='rgba(80,60,40,.3)';ctx.lineWidth=.8;ctx.beginPath();ctx.moveTo(-2,-4);ctx.lineTo(1,0);ctx.lineTo(-1,3);ctx.lineTo(2,7);ctx.stroke();if(prog>=.8){ctx.beginPath();ctx.moveTo(3,-6);ctx.lineTo(5,-2);ctx.lineTo(3,2);ctx.stroke();}}
    ctx.fillStyle='rgba(0,0,0,.15)';ctx.fillRect(-8,eH+4,16,3);ctx.fillStyle=rc;ctx.fillRect(-8,eH+4,16*prog,3);
    if(isSel){ctx.strokeStyle='#FFD700';ctx.lineWidth=1.5;ctx.setLineDash([3,2]);ctx.beginPath();ctx.ellipse(0,0,eW+4,eH+4,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}
    ctx.restore();
  });
}

// ─── 九、气泡对话 ────────────────────────────────────────────────
function _spawnSpeech(fish){
  const def=FISH_DB[fish.fishId];if(!def) return;
  _fpSpeech=_fpSpeech.filter(s=>s.uid!==fish.uid);
  _fpSpeech.push({uid:fish.uid,text:def.quotes[Math.floor(Math.random()*def.quotes.length)],x:fish.x,y:fish.y-30,alpha:1,timer:3000});
}
function _updateSpeech(dt){
  _fpSpeech.forEach(s=>{s.timer-=dt;s.alpha=Math.max(0,s.timer/3000);const f=(S.pondFish||[]).find(ff=>ff.uid===s.uid);if(f){s.x=f.x;s.y=f.y-35;}});
  _fpSpeech=_fpSpeech.filter(s=>s.timer>0);
}
function _drawSpeech(ctx){
  ctx.font='11px "Noto Sans SC",sans-serif';
  _fpSpeech.forEach(s=>{
    ctx.save();ctx.globalAlpha=s.alpha;
    const tw=ctx.measureText(s.text).width,pw=Math.min(tw+16,160);
    const px=Math.max(pw/2+5,Math.min(s.x,_fpW-pw/2-5)),py=Math.max(22,s.y);
    ctx.fillStyle='rgba(255,255,255,.92)';_roundRect(ctx,px-pw/2,py-14,pw,22,10);ctx.fill();
    ctx.strokeStyle='rgba(100,180,220,.3)';ctx.lineWidth=1;_roundRect(ctx,px-pw/2,py-14,pw,22,10);ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,.92)';ctx.beginPath();ctx.moveTo(px-4,py+8);ctx.lineTo(px,py+14);ctx.lineTo(px+4,py+8);ctx.fill();
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#2a6b4a';ctx.fillText(s.text,px,py-3,pw-10);
    ctx.restore();
  });
}
function _roundRect(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.arcTo(x+w,y,x+w,y+r,r);ctx.lineTo(x+w,y+h-r);ctx.arcTo(x+w,y+h,x+w-r,y+h,r);ctx.lineTo(x+r,y+h);ctx.arcTo(x,y+h,x,y+h-r,r);ctx.lineTo(x,y+r);ctx.arcTo(x,y,x+r,y,r);ctx.closePath();}

// ─── 十、主渲染循环 ─────────────────────────────────────────────
function _startFishPondLoop(){
  if(_fpAF) cancelAnimationFrame(_fpAF);
  let last=performance.now();
  function loop(now){const dt=Math.min(now-last,50);last=now;_fpTime=now;
    if(_fpMode==='pond'){_updatePond(dt);_drawPond();}
    else if(_fpMode==='fishing'){_updateFishing(dt);_drawFishing();}
    _fpAF=requestAnimationFrame(loop);}
  _fpAF=requestAnimationFrame(loop);
}
function stopFishPondLoop(){if(_fpAF){cancelAnimationFrame(_fpAF);_fpAF=null;}}

// ─── 十一、主更新（v3.0）────────────────────────────────────────
function _updatePond(dt){
  if(S.pondFish) S.pondFish.forEach(f=>_updateFishBehavior(f,dt));
  _updateSpeech(dt);
  if(Math.random()<.02) _fpBubbles.push({x:Math.random()*_fpW,y:_fpH-20,r:1+Math.random()*3,speed:.3+Math.random()*.5,alpha:.6});
  _fpBubbles.forEach(b=>{b.y-=b.speed;b.x+=Math.sin(_fpTime*.003+b.x)*.2;b.alpha-=.001;});
  _fpBubbles=_fpBubbles.filter(b=>b.y>0&&b.alpha>0);
  _fpRipples.forEach(r=>{r.radius+=1;r.alpha-=.015;});
  _fpRipples=_fpRipples.filter(r=>r.alpha>0);
  _checkEggHatch();
  // v3.0 新增
  _updateParticles(dt);
  _updateFood(dt);
  _updatePassiveEffects(dt);
  _updateLeaderAura(dt);
}

// ─── 十二、主绘制（v3.0）────────────────────────────────────────
function _drawPond(){
  const ctx=_fpCtx;if(!ctx) return;
  // 水体渐变
  const grad=ctx.createLinearGradient(0,0,0,_fpH);
  grad.addColorStop(0,'#7EC8E3');grad.addColorStop(.15,'#4AA3DF');grad.addColorStop(.5,'#2B7CB5');grad.addColorStop(.85,'#1A5276');grad.addColorStop(1,'#0E3D54');
  ctx.fillStyle=grad;ctx.fillRect(0,0,_fpW,_fpH);
  // 沙底
  ctx.fillStyle=SAND_COLOR;ctx.beginPath();ctx.moveTo(0,_fpH);
  for(let x=0;x<=_fpW;x+=20) ctx.lineTo(x,_fpH-15+Math.sin(x*.03+_fpTime*.001)*5);
  ctx.lineTo(_fpW,_fpH);ctx.closePath();ctx.fill();
  // 水草
  _drawSeaweed(ctx,_fpW*.1,_fpH-15,60);_drawSeaweed(ctx,_fpW*.35,_fpH-12,50);
  _drawSeaweed(ctx,_fpW*.65,_fpH-18,70);_drawSeaweed(ctx,_fpW*.85,_fpH-10,45);
  // 鱼卵
  _drawEggs(ctx);
  // 首领连线
  _drawLeaderConnections(ctx);
  // 食物粒子
  _drawFood(ctx);
  // 水泡
  ctx.fillStyle='rgba(255,255,255,.3)';
  _fpBubbles.forEach(b=>{ctx.globalAlpha=b.alpha;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fill();});ctx.globalAlpha=1;
  // 涟漪
  _fpRipples.forEach(r=>{ctx.strokeStyle=`rgba(255,255,255,${r.alpha})`;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(r.x,r.y,r.radius,0,Math.PI*2);ctx.stroke();});
  // 粒子（鱼下层）
  _drawParticles(ctx,'below');
  // 鱼
  if(S.pondFish){[...S.pondFish].sort((a,b)=>a.y-b.y).forEach(f=>{
    const def=FISH_DB[f.fishId];if(!def) return;const size=def.baseSize*(1+f.lv*.1);
    renderFish(ctx,f,f.x,f.y,size,Math.atan2(f.vy,Math.abs(f.vx))*.3,f.vx<0);
    _drawHungryIndicator(ctx,f,f.x,f.y);
    _drawLeaderCrown(ctx,f);
    _drawSkillCooldown(ctx,f);
    if(_fpSelectedFish===f.uid){ctx.strokeStyle='rgba(255,215,0,.6)';ctx.lineWidth=2;ctx.setLineDash([4,3]);ctx.beginPath();ctx.arc(f.x,f.y,size*.7,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}
  });}
  // 粒子（鱼上层）
  _drawParticles(ctx,'above');
  // 气泡对话
  _drawSpeech(ctx);
  // 诱引点
  _drawLure(ctx);
  // 水面光效
  ctx.fillStyle='rgba(255,255,255,.03)';
  for(let i=0;i<5;i++){const wx=(_fpW*.2*i+_fpTime*.02)%(_fpW+100)-50;ctx.beginPath();ctx.ellipse(wx,10,40+Math.sin(_fpTime*.001+i)*10,4,0,0,Math.PI*2);ctx.fill();}
  ctx.strokeStyle='rgba(255,255,255,.08)';ctx.lineWidth=1;
  for(let i=0;i<3;i++){ctx.beginPath();for(let x=0;x<=_fpW;x+=5){const y=5+i*8+Math.sin(x*.02+_fpTime*.002+i)*3;x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);}ctx.stroke();}
}

function _drawSeaweed(ctx,x,baseY,height){
  ctx.fillStyle='#2D8B4E';ctx.globalAlpha=.6;
  for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(x+i*8-8,baseY);
    for(let j=1;j<=8;j++){const t=j/8;ctx.lineTo(x+i*8-8+Math.sin(_fpTime*.002+i+t*3)*(8*t),baseY-height*t);}
    ctx.lineTo(x+i*8-4,baseY);ctx.closePath();ctx.fill();}
  ctx.globalAlpha=1;
}

// ─── 十三、交互（v3.0：双击触发技能 + 单击投食）──────────────
function _onPondClick(e){const r=_fpCanvas.getBoundingClientRect();_handlePondInteraction((e.clientX-r.left)*(_fpW/r.width),(e.clientY-r.top)*(_fpH/r.height));}
function _onPondTouch(e){if(e.touches.length!==1) return;e.preventDefault();const r=_fpCanvas.getBoundingClientRect();_handlePondInteraction((e.touches[0].clientX-r.left)*(_fpW/r.width),(e.touches[0].clientY-r.top)*(_fpH/r.height));}

function _handlePondInteraction(mx,my){
  const now=Date.now();
  _fpRipples.push({x:mx,y:my,radius:5,alpha:.8});
  // 双击判定
  const isDbl=(now-_fpLastTap.t<380)&&Math.hypot(mx-_fpLastTap.x,my-_fpLastTap.y)<45;
  _fpLastTap={t:now,x:mx,y:my};

  // 命中检测
  let clickedFish=null;
  if(S.pondFish) for(let i=S.pondFish.length-1;i>=0;i--){
    const f=S.pondFish[i],def=FISH_DB[f.fishId];if(!def) continue;
    if(Math.hypot(mx-f.x,my-f.y)<def.baseSize*(1+f.lv*.1)*.85){clickedFish=f;break;}
  }

  if(isDbl&&clickedFish){_triggerFishSkill(clickedFish);_fpSelectedFish=clickedFish.uid;return;}

  if(clickedFish){
    _fpSelectedFish=clickedFish.uid;_fpSelectedEgg=null;
    _spawnSpeech(clickedFish);_showFishInfoCard(clickedFish);
    _spawnP('heart',clickedFish.x,clickedFish.y-15,3,{speed:1,gravity:-.03,decay:.008});
    clickedFish.hunger=Math.min(100,(clickedFish.hunger||0)+2);
    return;
  }

  // 蛋检测
  let clickedEgg=-1;
  if(S.fishEggs){const sandY=_fpH-15;S.fishEggs.forEach((egg,i)=>{
    const ex=egg._x?egg._x*_fpW:(0.2+i*0.2)*_fpW;
    if(Math.abs(mx-ex)<15&&Math.abs(my-(sandY-12))<20) clickedEgg=i;});}
  if(clickedEgg>=0){_fpSelectedEgg=clickedEgg;_fpSelectedFish=null;_showEggInfoCard(clickedEgg);return;}

  // 水面点击 → 投食
  if(my<_fpH-40) _spawnFood(mx,my);
  _fpSelectedFish=null;_fpSelectedEgg=null;_hideInfoCard();
}

// ─── 十四、拖拽诱引事件 ─────────────────────────────────────────
function _onPondMouseDown(){_fpDragActive=true;}
function _onPondMouseUp(){_fpDragActive=false;}
function _onPondMouseMove(e){
  if(!_fpDragActive||!_fpCanvas) return;
  const r=_fpCanvas.getBoundingClientRect();
  _fpLurePos={x:(e.clientX-r.left)*(_fpW/r.width),y:(e.clientY-r.top)*(_fpH/r.height),t:Date.now()};
  if(Math.random()<.25) _fpRipples.push({x:_fpLurePos.x,y:_fpLurePos.y,radius:2,alpha:.35});
}
function _onPondTouchMove(e){
  if(e.touches.length!==1||!_fpCanvas) return;e.preventDefault();
  const r=_fpCanvas.getBoundingClientRect();
  _fpLurePos={x:(e.touches[0].clientX-r.left)*(_fpW/r.width),y:(e.touches[0].clientY-r.top)*(_fpH/r.height),t:Date.now()};
}

// ─── 十五、信息卡片 ──────────────────────────────────────────────
function _showFishInfoCard(fish){
  const def=FISH_DB[fish.fishId];if(!def) return;
  const mood=_getFishMood(fish),hw=fish.hunger<30;
  const sk=FISH_SKILLS[fish.fishId];
  const skCd=fish._skillCd&&Date.now()<fish._skillCd?Math.ceil((fish._skillCd-Date.now())/1000):0;
  const panel=document.getElementById('fp-info-card');if(!panel) return;
  panel.innerHTML=`<div class="fi-card">
    <div class="fi-preview"><canvas id="fi-prev-cvs" width="76" height="76"></canvas></div>
    <div class="fi-body">
      <div class="fi-top"><span class="fi-name">${fish.nickname||def.name}</span><span class="fi-tag" style="background:${RARITY_COLOR[def.rarity]}22;color:${RARITY_COLOR[def.rarity]}">${RARITY_LABEL[def.rarity]}</span></div>
      <div class="fi-sub">Lv.${fish.lv}/${def.maxLv} · 成长 ${Math.round(fish.growth)}%</div>
      <div class="fi-stats"><span class="fi-st">${mood==='happy'?'😊开心':mood==='sad'?'😢不开心':'😐普通'}</span><span class="fi-st ${hw?'warn':''}">${hw?'🔴':'🟢'}${_getHungerLabel(fish.hunger)}</span><span class="fi-st">⚡${def.speed.toFixed(1)}</span></div>
      <div class="fi-bar"><div class="fi-bar-fill" style="width:${fish.growth}%;background:${RARITY_COLOR[def.rarity]}"></div></div>
      ${sk?`<div class="fi-skill-hint">双击触发：${sk.name}&nbsp;${skCd?'⏳'+skCd+'s':'✅就绪'}</div>`:''}
    </div>
    <div class="fi-btns">
      <button class="fi-btn accent" onclick="_feedFish('${fish.uid}')">🍞喂</button>
      <button class="fi-btn" onclick="_openFishCustomModal('${fish.uid}')">✏️改</button>
      <button class="fi-btn danger" onclick="_sellFish('${fish.uid}')">🪙售</button>
    </div></div>`;
  panel.style.display='block';
setTimeout(()=>{
    const cvs=document.getElementById('fi-prev-cvs');
    if(!cvs) return;
    const dpr=window.devicePixelRatio||1;
    cvs.width=76*dpr; cvs.height=76*dpr;
    cvs.style.width='76px'; cvs.style.height='76px';
    const ctx=cvs.getContext('2d');
    ctx.scale(dpr,dpr);
    // 直接用逻辑坐标(76x76)绘制，不用 _drawFishPreviewCanvas（它会读 canvas.width 导致偏移）
    ctx.clearRect(0,0,76,76);
    const img=_getEffectiveFishImg(fish);
    if(img){
      const aspect=img.naturalWidth/(img.naturalHeight||1);
      const maxSize=70; let dw=maxSize,dh=maxSize;
      if(aspect>1) dh=maxSize/aspect; else dw=maxSize*aspect;
      ctx.drawImage(img,(76-dw)/2,(76-dh)/2,dw,dh);
    } else {
      const _def=FISH_DB[fish.fishId]||{};
      renderFishByCode(ctx,{...fish,_phase:0},38,38,_def.baseSize*1.1,0,false,mood);
    }
  },30);
}

function _showEggInfoCard(idx){
  const egg=S.fishEggs[idx];if(!egg) return;
  const def=FISH_DB[egg.fishId]||{},prog=Math.min(100,Math.round(egg.progress)),rc=RARITY_COLOR[def.rarity||'common'];
  const stage=prog<30?'🥚 刚产下':prog<60?'🐣 开始发育':prog<90?'💫 快要孵化':'✨ 即将破壳！';
  const panel=document.getElementById('fp-info-card');if(!panel) return;
  panel.innerHTML=`<div class="fi-card">
    <div class="fi-preview"><canvas id="fi-egg-cvs" width="76" height="76"></canvas></div>
    <div class="fi-body">
      <div class="fi-top"><span class="fi-name">${def.name||'???'}的蛋</span><span class="fi-tag" style="background:${rc}22;color:${rc}">${RARITY_LABEL[def.rarity||'common']}</span></div>
      <div class="fi-sub">${stage} · 孵化进度 ${prog}%</div>
      <div class="fi-stats"><span class="fi-st">🕐 答题可加速</span><span class="fi-st">⏳ 自动孵化中</span></div>
      <div class="fi-bar"><div class="fi-bar-fill" style="width:${prog}%;background:${rc}"></div></div>
    </div>
    <div class="fi-btns"><button class="fi-btn accent" onclick="_accelerateEgg(${idx})">⚡加速</button></div>
  </div>`;
  panel.style.display='block';
  setTimeout(()=>{const cvs=document.getElementById('fi-egg-cvs');if(!cvs) return;
    const c2=cvs.getContext('2d');c2.clearRect(0,0,76,76);_drawEggPreview(c2,38,38,egg,def);},30);
}

function _drawEggPreview(ctx,cx,cy,egg,def){
  const prog=Math.min(1,egg.progress/100),rc=RARITY_COLOR[def.rarity||'common'],eH=22,eW=15;
  ctx.save();ctx.translate(cx,cy);
  ctx.fillStyle='rgba(0,0,0,.08)';ctx.beginPath();ctx.ellipse(0,eH+4,12,4,0,0,Math.PI*2);ctx.fill();
  if(prog<.3) ctx.fillStyle='#FAFAF5';
  else if(prog<.6){const g=ctx.createLinearGradient(0,-eH,0,eH);g.addColorStop(0,'#FAFAF5');g.addColorStop(1,rc+'55');ctx.fillStyle=g;}
  else{ctx.fillStyle=rc+'cc';if(prog>=.9){ctx.shadowColor=rc;ctx.shadowBlur=10;}}
  ctx.beginPath();ctx.moveTo(0,-eH);ctx.bezierCurveTo(eW,-eH*.6,eW,eH*.4,0,eH);ctx.bezierCurveTo(-eW,eH*.4,-eW,-eH*.6,0,-eH);ctx.closePath();ctx.fill();ctx.shadowBlur=0;
  ctx.fillStyle='rgba(255,255,255,.3)';ctx.beginPath();ctx.ellipse(-3,-6,5,8,-.3,0,Math.PI*2);ctx.fill();
  if(prog>=.6){ctx.strokeStyle='rgba(80,60,40,.35)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-3,-5);ctx.lineTo(1,2);ctx.lineTo(-2,8);ctx.stroke();}
  ctx.restore();
}

function _hideInfoCard(){const p=document.getElementById('fp-info-card');if(p) p.style.display='none';}

// ─── 十六、改名弹窗 ─────────────────────────────────────────────
function _openRenameModal(uid){
  const fish=S.pondFish.find(f=>f.uid===uid);if(!fish) return;
  const def=FISH_DB[fish.fishId]||{};
  let m=document.getElementById('fp-rename-mask');if(m) m.remove();
  m=document.createElement('div');m.id='fp-rename-mask';m.className='fp-modal-mask';
  m.innerHTML=`<div class="fp-modal">
    <div class="fp-modal-title">✏️ 给${def.name}起个昵称</div>
    <div class="fp-modal-desc">最多8个字，留空恢复原名</div>
    <input class="fp-modal-input" id="fp-rename-input" maxlength="8" value="${fish.nickname||''}" placeholder="${def.name}">
    <div class="fp-modal-row">
      <button class="fp-modal-btn primary" onclick="_doRename('${uid}')">确定</button>
      <button class="fp-modal-btn" onclick="_closeRenameModal()">取消</button>
    </div></div>`;
  document.body.appendChild(m);
  m.addEventListener('click',e=>{if(e.target===m)_closeRenameModal();});
  setTimeout(()=>{const inp=document.getElementById('fp-rename-input');if(inp){inp.focus();inp.select();}},100);
}
function _doRename(uid){
  const fish=S.pondFish.find(f=>f.uid===uid);if(!fish) return;
  const val=(document.getElementById('fp-rename-input')?.value||'').trim().slice(0,8);
  fish.nickname=val;persistAccount();_closeRenameModal();_showFishInfoCard(fish);
  showToast(val?`✏️ 昵称改为「${val}」`:'✏️ 已恢复原名');
}
function _closeRenameModal(){const m=document.getElementById('fp-rename-mask');if(m) m.remove();}

// ─── 十七、鱼类管理 ─────────────────────────────────────────────
function _addFishToPlayer(fishId){
  const def=FISH_DB[fishId];if(!def) return;
  const uid='fish_'+Date.now()+'_'+Math.random().toString(36).slice(2,6);
  const fish={uid,fishId,lv:1,growth:0,mood:'normal',hunger:80,
    x:50+Math.random()*(Math.max(200,_fpW)-100),y:60+Math.random()*(Math.max(180,_fpH-80)),
    vx:(Math.random()-.5)*2,vy:(Math.random()-.5),nickname:'',obtainedAt:Date.now(),
    _phase:Math.random()*Math.PI*2,_state:'swim',_stateTimer:3000};
  S.pondFish.push(fish);
  const isNew=!S.fishAlmanac.includes(fishId);
  if(isNew) S.fishAlmanac.push(fishId);
  S.totalFishCaught=(S.totalFishCaught||0)+1;
  if(isNew){S.score=(S.score||0)+({common:5,rare:15,epic:30,legendary:60}[def.rarity]||5);}
  persistAccount();if(typeof checkAchs==='function') checkAchs();if(typeof updateTop==='function') updateTop();return fish;
}
function _addFishEgg(fishId){if(!S.fishEggs) S.fishEggs=[];S.fishEggs.push({fishId,progress:0,startTime:Date.now(),_x:.12+Math.random()*.7,_wobble:Math.random()*Math.PI*2});persistAccount();}
function _checkEggHatch(){
  if(!S.fishEggs||!S.fishEggs.length) return;const now=Date.now();const toH=[];
  S.fishEggs=S.fishEggs.filter(egg=>{egg.progress+=(now-(egg._lastCheck||egg.startTime))/60000;egg._lastCheck=now;if(egg.progress>=100){toH.push(egg.fishId);return false;}return true;});
  toH.forEach(fid=>{_addFishToPlayer(fid);const d=FISH_DB[fid];if(d&&typeof showToast==='function') showToast(`🐣 ${d.name}孵化成功！`);if(typeof spawnP==='function') spawnP(['🐣','✨','🐟']);});
  if(toH.length){_assignEggPositions();renderFishPondUI();}
}
function _feedFish(uid){
  const fish=S.pondFish.find(f=>f.uid===uid);if(!fish||typeof openQuiz!=='function') return;
  openQuiz({title:'🍞 喂鱼 — 答题喂食',needed:1,onSuccess:()=>{
    fish.hunger=Math.min(100,fish.hunger+30);fish.growth=Math.min(100,fish.growth+5);fish.mood='happy';
    S.coins=(S.coins||0)+3;S.totalCoins=(S.totalCoins||0)+3;S.score=(S.score||0)+2;
    if(typeof gainExp==='function') gainExp(8);_checkFishLevelUp(fish);persistAccount();
    if(typeof updateTop==='function') updateTop();_showFishInfoCard(fish);showToast(`🍞 ${FISH_DB[fish.fishId].name}吃饱了！金币+3`);}});
}
function _releaseFish(uid){
  const fish=S.pondFish.find(f=>f.uid===uid);if(!fish) return;const def=FISH_DB[fish.fishId];
  if(typeof openConfirm==='function') openConfirm('🔓',`确定放生${fish.nickname||def.name}？\n获得 ${fish.lv*5}鱼币 + ${fish.lv*3}金币`,()=>{
    S.pondFish=S.pondFish.filter(f=>f.uid!==uid);S.fishCoins=(S.fishCoins||0)+fish.lv*5;S.coins=(S.coins||0)+fish.lv*3;S.totalCoins=(S.totalCoins||0)+fish.lv*3;S.score=(S.score||0)+fish.lv*2;
    persistAccount();if(typeof updateTop==='function') updateTop();_hideInfoCard();renderFishPondUI();showToast(`🔓 ${def.name}游走了，+${fish.lv*5}鱼币 +${fish.lv*3}金币`);});
}
function _checkFishLevelUp(fish){
  const def=FISH_DB[fish.fishId];if(!def) return;
  if(fish.growth>=100&&fish.lv<def.maxLv){fish.lv++;fish.growth=0;const cr=fish.lv*5,sr=fish.lv*3;
    S.coins=(S.coins||0)+cr;S.totalCoins=(S.totalCoins||0)+cr;S.score=(S.score||0)+sr;
    if(typeof gainExp==='function') gainExp(fish.lv*10);persistAccount();if(typeof updateTop==='function') updateTop();
    if(typeof showToast==='function') showToast(`🎉 ${fish.nickname||def.name}升到Lv.${fish.lv}！金币+${cr}`);
    if(typeof spawnP==='function') spawnP(['⭐','🐟','✨']);}
}
function _accelerateEgg(idx){
  const egg=S.fishEggs[idx];if(!egg||typeof openQuiz!=='function') return;
  openQuiz({title:'⚡ 答题加速孵化',needed:1,onSuccess:()=>{
    egg.progress=Math.min(100,egg.progress+20);S.coins=(S.coins||0)+3;S.totalCoins=(S.totalCoins||0)+3;S.score=(S.score||0)+2;
    if(typeof gainExp==='function') gainExp(8);persistAccount();if(typeof updateTop==='function') updateTop();
    if(egg.progress>=100) showToast('🐣 孵化完成！');
    else{_showEggInfoCard(idx);showToast(`⚡ 孵化+20%！当前${Math.round(egg.progress)}%`);}}}); 
}

// ─── 十八、钓鱼小游戏 ──────────────────────────────────────────
let _fishingClickGuard = false; // 防止收杆点击穿透到题目
function startFishing(){_fpMode='fishing';_fishingState='idle';_fishingTimer=0;_fishingTarget=null;_fishingRodX=(_fpW||400)*.5;_fishingBobY=0;_fishingLineEndY=0;_fishingBiteAt=0;_fishingClickGuard=false;renderFishingUI();}
function stopFishing(){_fpMode='pond';if(_fpCanvas){_fpCanvas.removeEventListener('click',_onFishingClick);_fpCanvas.removeEventListener('touchstart',_fpFishTouchHandler);}renderFishPondUI();}
let _fpFishTouchHandler=null;
function _onFishingClick(e){
  if(_fishingClickGuard) return; // 点击屏蔽期内忽略
  const r=_fpCanvas.getBoundingClientRect();const mx=(e.clientX-r.left)*(_fpW/r.width);
  if(_fishingState==='idle'){_fishingState='cast';_fishingTimer=0;_fishingRodX=mx;_fishingBobY=60;_fishingLineEndY=60;}
  else if(_fishingState==='bite'){
    _fishingState='reel';
    _fishingClickGuard=true; // 开启屏蔽
    setTimeout(()=>{_fishingClickGuard=false;},400); // 400ms后解除
    _triggerFishingQuiz();
  }
}
function _updateFishing(dt){_fishingTimer+=dt;
  if(_fishingState==='cast'){_fishingLineEndY=Math.min(_fpH*.6,_fishingLineEndY+dt*.3);_fishingBobY=_fishingLineEndY;if(_fishingLineEndY>=_fpH*.6){_fishingState='wait';_fishingTimer=0;_fishingBiteAt=0;}}
  else if(_fishingState==='wait'){_fishingBobAngle=Math.sin(_fpTime*.004)*3;_fishingBobY=_fpH*.6+Math.sin(_fpTime*.003)*3;if(!_fishingBiteAt)_fishingBiteAt=_fishingTimer+3000+Math.random()*5000;if(_fishingTimer>_fishingBiteAt){_fishingState='bite';_fishingTimer=0;_fishingBiteAt=0;_fishingTarget=_rollFishDrop();}}
  else if(_fishingState==='bite'){_fishingBobAngle=Math.sin(_fpTime*.02)*15;_fishingBobY=_fpH*.6+Math.sin(_fpTime*.015)*8-5;if(_fishingTimer>5000){_fishingState='idle';_fishingTarget=null;showToast('🐟 鱼跑了！');}}}
function _drawFishing(){const ctx=_fpCtx;if(!ctx) return;
  const g=ctx.createLinearGradient(0,0,0,_fpH);g.addColorStop(0,'#87CEEB');g.addColorStop(.3,'#7EC8E3');g.addColorStop(.5,'#4AA3DF');g.addColorStop(1,'#1A5276');ctx.fillStyle=g;ctx.fillRect(0,0,_fpW,_fpH);
  ctx.strokeStyle='rgba(255,255,255,.3)';ctx.lineWidth=2;ctx.beginPath();for(let x=0;x<=_fpW;x+=5){const y=_fpH*.35+Math.sin(x*.02+_fpTime*.002)*5;x===0?ctx.moveTo(x,y):ctx.lineTo(x,y);}ctx.stroke();
  if(_fishingState!=='idle'){ctx.strokeStyle='#8B4513';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(_fishingRodX,20);ctx.lineTo(_fishingRodX,50);ctx.stroke();
    ctx.strokeStyle='rgba(255,255,255,.5)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(_fishingRodX,50);ctx.lineTo(_fishingRodX+Math.sin(_fishingBobAngle*Math.PI/180)*10,_fishingBobY);ctx.stroke();
    const bx=_fishingRodX+Math.sin(_fishingBobAngle*Math.PI/180)*10;ctx.fillStyle='#FF4500';ctx.beginPath();ctx.ellipse(bx,_fishingBobY,4,8,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(bx,_fishingBobY-5,3,3,0,0,Math.PI*2);ctx.fill();}
  ctx.font='bold 16px "Noto Sans SC",sans-serif';ctx.textAlign='center';ctx.fillStyle='#fff';ctx.shadowColor='rgba(0,0,0,.5)';ctx.shadowBlur=4;
  if(_fishingState==='idle') ctx.fillText('👆 点击水面抛竿',_fpW/2,_fpH/2);
  else if(_fishingState==='wait') ctx.fillText('等待鱼儿上钩...',_fpW/2,30);
  else if(_fishingState==='bite'){ctx.fillStyle='#FFD700';ctx.font='bold 20px "Noto Sans SC",sans-serif';ctx.fillText('🐟 有鱼上钩！快点击收杆！',_fpW/2,30);}
  else if(_fishingState==='reel') ctx.fillText('答题中...',_fpW/2,30);
  ctx.shadowBlur=0;ctx.textAlign='left';}
function _rollFishDrop(){const lv=S.fishingRodLevel||1,w={common:60-lv*3,rare:25+lv,epic:12+lv,legendary:3+lv*.5};const tot=w.common+w.rare+w.epic+w.legendary;let r=Math.random()*tot;
  let t;if(r<w.common)t='common';else if(r<w.common+w.rare)t='rare';else if(r<w.common+w.rare+w.epic)t='epic';else t='legendary';
  const pool=FISH_IDS.filter(id=>FISH_DB[id].rarity===t);return pool[Math.floor(Math.random()*pool.length)]||'goldfish';}
function _triggerFishingQuiz(){if(typeof openQuiz!=='function') return;const need=_fishingTarget&&FISH_DB[_fishingTarget]&&(FISH_DB[_fishingTarget].rarity==='epic'||FISH_DB[_fishingTarget].rarity==='legendary')?2:1;
  openQuiz({title:'🎣 钓鱼挑战！',needed:need,onSuccess:()=>{const fid=_fishingTarget||'goldfish';const def=FISH_DB[fid];_addFishToPlayer(fid);_fishingState='idle';_fishingTarget=null;
    const cr={common:5,rare:12,epic:25,legendary:50}[def.rarity]||5,sr={common:3,rare:8,epic:15,legendary:30}[def.rarity]||3;
    S.coins=(S.coins||0)+cr;S.totalCoins=(S.totalCoins||0)+cr;S.score=(S.score||0)+sr;if(typeof gainExp==='function') gainExp(cr);persistAccount();if(typeof updateTop==='function') updateTop();
    if(typeof spawnP==='function') spawnP(['🐟','🎣','✨','🌊']);
    // 钓到后停在钓鱼页，显示结果+按钮
    _showFishCatchResult(def,cr);},
    onFail:()=>{_fishingState='idle';_fishingTarget=null;showToast('😢 答错了，鱼跑了！');}});}

// ─── 十九、图鉴 ──────────────────────────────────────────────────
function openFishAlmanac(){_fpMode='almanac';const p=document.getElementById('fishpond-main');if(!p) return;
  let h='<div class="fa-wrap"><div class="fa-header"><span class="fa-title">📖 鱼类图鉴</span><span class="fa-progress">'+(S.fishAlmanac||[]).length+'/'+FISH_IDS.length+'</span><button class="fa-back" onclick="closeFishAlmanac()">← 返回</button></div><div class="fa-grid">';
  FISH_IDS.forEach(fid=>{const def=FISH_DB[fid];const dis=(S.fishAlmanac||[]).includes(fid);const own=(S.pondFish||[]).filter(f=>f.fishId===fid);const ml=own.length?Math.max(...own.map(f=>f.lv)):0;
    const sk=FISH_SKILLS[fid];
    h+='<div class="fa-card '+(dis?'':'fa-locked')+'" style="border-color:'+(dis?RARITY_COLOR[def.rarity]:'#666')+'">';
    if(dis) h+='<div class="fa-icon">'+def.icon+'</div><div class="fa-name">'+def.name+'</div><div class="fa-rarity" style="color:'+RARITY_COLOR[def.rarity]+'">'+RARITY_LABEL[def.rarity]+'</div><div class="fa-owned">×'+own.length+(ml>0?' Lv.'+ml:'')+'</div>'+(sk?`<div style="font-size:9px;color:#aaa;margin-top:2px">💥${sk.name}</div>`:'');
    else h+='<div class="fa-icon">❓</div><div class="fa-name">未发现</div><div class="fa-rarity">'+def.unlockDesc+'</div>';
    h+='</div>';});h+='</div></div>';p.innerHTML=h;}
function closeFishAlmanac(){_fpMode='pond';renderFishPondUI();}

// ─── 二十、页面UI ─────────────────────────────────────────────────
function renderFishPondUI(){
  const main=document.getElementById('fishpond-main');if(!main) return;
  const fc=(S.pondFish||[]).length,ec=(S.fishEggs||[]).length,ac=(S.fishAlmanac||[]).length;
  main.innerHTML=`<div class="fp-container">
    <div class="fp-canvas-wrap"><canvas id="fishpond-canvas"></canvas></div>
    <div style="text-align:center;font-size:10px;color:rgba(255,255,255,.45);padding:2px 0 0">单击水面投食 · 按住拖动逗鱼 · 双击触发专属技能</div>
    <div id="fp-info-card" style="display:none"></div>
    <div class="fp-stats-bar"><span class="fp-stat fp-stat-btn" onclick="_openEggModal()" style="cursor:pointer">🥚 ${ec?ec+'枚孵化中':'暂无鱼卵'}</span><span class="fp-stat fp-stat-btn" id="fp-scatter-btn" onclick="_toggleScatter()">🌊 分散</span><span class="fp-stat fp-stat-btn" onclick="_openFishCoinModal()">🪙 ${S.fishCoins||0}鱼币</span></div>
    <div class="fp-actions">
      <div class="fp-act" onclick="startFishing()"><span class="fp-act-ico">🎣</span><div class="fp-act-nm">去钓鱼</div><div class="fp-act-desc">答题钓鱼</div></div>
      <div class="fp-act" onclick="openFishAlmanac()"><span class="fp-act-ico">📖</span><div class="fp-act-nm">图鉴</div><div class="fp-act-desc">${ac}/${FISH_IDS.length}</div></div>
      <div class="fp-act" onclick="_feedAllFish()"><span class="fp-act-ico">🍞</span><div class="fp-act-nm">喂食</div><div class="fp-act-desc">答题喂全部</div></div>
      <div class="fp-act" onclick="_collectEgg()"><span class="fp-act-ico">🥚</span><div class="fp-act-nm">获取鱼卵</div><div class="fp-act-desc">答题产卵</div></div>
    </div></div>`;
  // 更新标题栏鱼数量
  const _fpTitleCount=document.getElementById('fp-title-count');
  if(_fpTitleCount) _fpTitleCount.textContent=fc?'🐟 '+fc+'条':'🐟 暂无';
  _fpCanvas=document.getElementById('fishpond-canvas');
  if(_fpCanvas){
    _fpCtx=_fpCanvas.getContext('2d');_resizeFishPond();
    _fpCanvas.addEventListener('click',_onPondClick);
    _fpCanvas.addEventListener('touchstart',_onPondTouch,{passive:false});
    // v3.0 拖拽事件
    _fpCanvas.addEventListener('mousedown',_onPondMouseDown);
    _fpCanvas.addEventListener('mouseup',_onPondMouseUp);
    _fpCanvas.addEventListener('mousemove',_onPondMouseMove);
    _fpCanvas.addEventListener('touchmove',_onPondTouchMove,{passive:false});
    _fpCanvas.addEventListener('touchend',()=>_fpDragActive=false);
    window.removeEventListener('resize',_resizeFishPond);window.addEventListener('resize',_resizeFishPond);
    if(S.pondFish) S.pondFish.forEach(f=>{
      if(!f.x||f.x<30||f.x>_fpW-30) f.x=50+Math.random()*(Math.max(200,_fpW)-100);
      if(!f.y||f.y<40||f.y>_fpH-60) f.y=60+Math.random()*(Math.max(150,_fpH)-120);
      if(!f._phase)      f._phase=Math.random()*Math.PI*2;
      if(!f._state)      f._state='swim';
      if(!f._stateTimer) f._stateTimer=3000;
      if(f.vx===undefined) f.vx=(Math.random()-.5)*2;
      if(f.vy===undefined) f.vy=(Math.random()-.5);});
    if(!_fpAF) _startFishPondLoop();setTimeout(()=>_resizeFishPond(),50);setTimeout(()=>_resizeFishPond(),300);}
}

function renderFishingUI(){
  const main=document.getElementById('fishpond-main');if(!main) return;
  main.innerHTML=`<div class="fp-container"><div class="fp-canvas-wrap"><canvas id="fishpond-canvas"></canvas></div>
    <div id="fp-catch-result" style="display:none"></div>
    <div class="fp-actions"><div class="fp-act" onclick="stopFishing()" style="background:rgba(255,80,80,.1);border-color:rgba(255,80,80,.3)"><span class="fp-act-ico">🔙</span><div class="fp-act-nm">返回鱼塘</div></div></div></div>`;
  _fpCanvas=document.getElementById('fishpond-canvas');
  if(_fpCanvas){_fpCtx=_fpCanvas.getContext('2d');_resizeFishPond();
    _fpCanvas.addEventListener('click',_onFishingClick);
    _fpFishTouchHandler=function(e){if(e.touches.length===1){e.preventDefault();_onFishingClick({clientX:e.touches[0].clientX,clientY:e.touches[0].clientY});}};
    _fpCanvas.addEventListener('touchstart',_fpFishTouchHandler,{passive:false});
    if(!_fpAF) _startFishPondLoop();setTimeout(()=>_resizeFishPond(),50);setTimeout(()=>_resizeFishPond(),300);}
}

// ─── 二十一、学习行为绑定 ─────────────────────────────────────────
function _collectEgg(){if(typeof openQuiz!=='function') return;
  openQuiz({title:'🥚 答题获取鱼卵',needed:3,onSuccess:()=>{const pool=FISH_IDS.filter(id=>FISH_DB[id].rarity!=='legendary');const fid=pool[Math.floor(Math.random()*pool.length)];
    _addFishEgg(fid);_assignEggPositions();const def=FISH_DB[fid];S.coins=(S.coins||0)+10;S.totalCoins=(S.totalCoins||0)+10;S.score=(S.score||0)+5;
    if(typeof gainExp==='function') gainExp(15);persistAccount();if(typeof updateTop==='function') updateTop();
    showToast(`🥚 获得${def.name}的鱼卵！金币+10`);if(typeof spawnP==='function') spawnP(['🥚','✨','🐟']);renderFishPondUI();}});}
function _feedAllFish(){if(!S.pondFish||!S.pondFish.length){showToast('鱼塘里还没有鱼哦~');return;}if(typeof openQuiz!=='function') return;const cnt=S.pondFish.length;
  openQuiz({title:'🍞 喂食全部鱼',needed:1,onSuccess:()=>{S.pondFish.forEach(f=>{f.hunger=Math.min(100,f.hunger+20);f.growth=Math.min(100,f.growth+3);f.mood='happy';_checkFishLevelUp(f);});
    const cr=cnt*2;S.coins=(S.coins||0)+cr;S.totalCoins=(S.totalCoins||0)+cr;S.score=(S.score||0)+cnt;if(typeof gainExp==='function') gainExp(5+cnt*2);persistAccount();if(typeof updateTop==='function') updateTop();renderFishPondUI();showToast(`🍞 全部吃饱！金币+${cr}`);}});}

window.onQuizCorrectForFish=function(){if(!S.pondFish||!S.pondFish.length) return;
  const f=S.pondFish[Math.floor(Math.random()*S.pondFish.length)];f.growth=Math.min(100,f.growth+2);f.hunger=Math.max(0,f.hunger-1);_checkFishLevelUp(f);
  if(S.fishEggs) S.fishEggs.forEach(e=>{e.progress=Math.min(100,e.progress+3);});};
window.onQuizStreakForFish=function(streak){
  if(streak>=5&&(!S.fishAlmanac||!S.fishAlmanac.includes('goldfish'))&&!(S.pondFish||[]).some(f=>f.fishId==='goldfish')){_addFishToPlayer('goldfish');showToast('🎉 连续答对5题！解锁小金鱼！');}
  if(streak>=10){_addFishEgg(_rollFishDrop());_assignEggPositions();showToast('🔥 连击10！获得神秘鱼卵！');}};

// ══════════════════════════════════════════════════════════════
//  v3.0 特效区：粒子 · 技能 · 被动 · 投食 · 诱引 · 首领光环
// ══════════════════════════════════════════════════════════════

// ─── A. 粒子系统 ─────────────────────────────────────────────────
function _spawnP(type,x,y,count,opts){
  opts=opts||{};
  for(let i=0;i<count;i++){
    const a=opts.angle!==undefined?(opts.angle+(Math.random()-.5)*(opts.spread||Math.PI*2)):Math.random()*Math.PI*2;
    const s=(opts.speed||2)*(0.5+Math.random());
    _fpParticles.push({type,x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,
      life:opts.life||1,decay:opts.decay||(0.01+Math.random()*.012),
      size:(opts.size||4)*(0.6+Math.random()*.8),color:opts.color||'#fff',
      gravity:opts.gravity||0,layer:opts.layer||'above',data:opts.data||{}});
  }
}

function _updateParticles(dt){
  const f=dt*.06;
  _fpParticles.forEach(p=>{p.x+=p.vx*f;p.y+=p.vy*f;p.vy+=(p.gravity||0)*f;p.vx*=.97;p.vy*=.97;p.life-=p.decay*(dt*.1);});
  _fpParticles=_fpParticles.filter(p=>p.life>0);
}

function _drawParticles(ctx,layer){
  _fpParticles.filter(p=>(p.layer||'above')===layer).forEach(p=>{
    ctx.save();ctx.globalAlpha=Math.max(0,p.life);
    switch(p.type){
      case 'bubble':
        ctx.strokeStyle=p.color;ctx.lineWidth=1;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.stroke();
        ctx.fillStyle=p.color+'33';ctx.fill();break;
      case 'sparkle':
        ctx.fillStyle=p.color;ctx.translate(p.x,p.y);ctx.rotate(_fpTime*.01+p.x*.1);
        for(let i=0;i<4;i++){ctx.rotate(Math.PI/2);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(p.size*.3,p.size*.3);ctx.lineTo(0,p.size);ctx.lineTo(-p.size*.3,p.size*.3);ctx.closePath();ctx.fill();}break;
      case 'fire':
        const fg=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.size);
        fg.addColorStop(0,'#FFFF00');fg.addColorStop(.4,'#FF6600');fg.addColorStop(1,'transparent');
        ctx.fillStyle=fg;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();break;
      case 'water':
        ctx.fillStyle=p.color||'#87CEEB';ctx.beginPath();ctx.arc(p.x,p.y,p.size*.7,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle='rgba(255,255,255,.4)';ctx.lineWidth=.5;ctx.stroke();break;
      case 'heart':
        ctx.font=`${p.size*2}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('❤️',p.x,p.y);break;
      case 'zzz':
        ctx.font=`bold ${p.size*2}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.fillStyle=p.color||'#aab';ctx.fillText(p.data.char||'z',p.x,p.y);break;
      case 'rainbow':
        const hue=((_fpTime*.1)+p.x+p.y)%360;ctx.fillStyle=`hsl(${hue},90%,60%)`;
        ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();break;
      case 'leaf':
        ctx.fillStyle=p.color||'#2E8B57';ctx.translate(p.x,p.y);ctx.rotate(_fpTime*.005+p.x*.05);
        ctx.beginPath();ctx.ellipse(0,0,p.size,p.size*.5,0,0,Math.PI*2);ctx.fill();break;
      case 'gold':
        ctx.fillStyle='#FFD700';ctx.shadowColor='#FFD700';ctx.shadowBlur=p.size*2;
        ctx.beginPath();ctx.arc(p.x,p.y,p.size*.8,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;break;
      case 'speedline':
        ctx.strokeStyle=p.color||'rgba(100,100,120,.6)';ctx.lineWidth=p.size*.5;
        ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-p.vx*4,p.y-p.vy*4);ctx.stroke();break;
      case 'puff':
        const pfg=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.size);
        pfg.addColorStop(0,'rgba(255,255,255,.5)');pfg.addColorStop(1,'rgba(255,255,255,0)');
        ctx.fillStyle=pfg;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();break;
      default:
        ctx.fillStyle=p.color||'#fff';ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
  });
}

// ─── B. 专属技能触发 ──────────────────────────────────────────────
function _triggerFishSkill(fish){
  const now=Date.now(),sk=FISH_SKILLS[fish.fishId];if(!sk) return;
  if(fish._skillCd&&now<fish._skillCd){showToast(`⏳ ${sk.name}冷却中(${Math.ceil((fish._skillCd-now)/1000)}s)`);return;}
  fish._skillCd=now+sk.cd;fish.mood='happy';_spawnSpeech(fish);
  const x=fish.x,y=fish.y;
  switch(fish.fishId){
    case 'whale_scholar':
      _spawnP('water',x,y-10,32,{angle:-Math.PI/2,spread:.7,speed:4.5,gravity:.18,color:'#87CEEB',size:5.5,decay:.007});
      _fpRipples.push({x,y,radius:5,alpha:.9});_fpRipples.push({x,y:y-20,radius:3,alpha:.6});
      showToast('🐳 学霸鲸鱼喷水啦！');break;

    case 'dragon_f':
      const ddir=fish.vx>=0?0:Math.PI;
      _spawnP('fire',x,y,28,{angle:ddir,spread:.9,speed:5,gravity:-.04,size:8,decay:.014});
      _spawnP('sparkle',x,y,12,{angle:ddir,spread:.5,speed:3,color:'#FF4500',size:3,decay:.018});
      showToast('🔥 龙鱼烈焰吐息！');break;

    case 'rainbow_f':
      _spawnP('rainbow',x,y,45,{speed:4.5,size:6,decay:.009});
      _spawnP('sparkle',x,y,20,{speed:3,color:'#fff',size:4,decay:.013});
      showToast('🌈 彩虹鱼七彩爆发！');break;

    case 'puffer_f':
      fish._puffing=now+2200;
      _spawnP('puff',x,y,18,{speed:3,size:12,decay:.007});
      _spawnP('bubble',x,y,10,{speed:2,color:'#FFB6C1',size:4,decay:.01,gravity:-.03});
      showToast('💨 河豚鼓起来了！');break;

    case 'math_shark':
      fish.vx=(fish.vx>=0?1:-1)*7;fish.vy*=.2;
      _spawnP('speedline',x,y,22,{angle:fish.vx>0?Math.PI:0,spread:.35,speed:3.5,color:'rgba(100,120,140,.7)',size:3,decay:.022});
      showToast('⚡ 数学鲨鱼极速冲刺！');break;

    case 'lantern_f':
      _spawnP('puff',x,y,22,{speed:2,size:18,decay:.005,color:'#FF6B35'});
      _spawnP('sparkle',x,y,18,{speed:2.5,color:'#FFD700',size:4,decay:.01});
      (S.pondFish||[]).forEach(f=>{if(f.uid!==fish.uid&&Math.hypot(f.x-x,f.y-y)<160){f.mood='happy';f.hunger=Math.min(100,f.hunger+6);}});
      showToast('🏮 灯笼鱼温暖照耀！周边鱼心情变好！');break;

    case 'clownfish':
      for(let i=0;i<24;i++){const a=(i/24)*Math.PI*2;
        _fpParticles.push({type:'bubble',x:x+Math.cos(a)*i*.5,y:y+Math.sin(a)*i*.5,vx:Math.cos(a)*2,vy:Math.sin(a)*2-1,life:1,decay:.008,size:3.5+i*.15,color:'#FF7F50',gravity:-.025,layer:'above',data:{}});}
      showToast('🤡 小丑鱼泡泡圆舞！');break;

    case 'history_carp':
      fish.vy=-9;fish.vx=(fish.vx>=0?1:-1)*3.5;
      _spawnP('gold',x,y,28,{speed:3,size:4.5,decay:.009});
      _spawnP('sparkle',x,y,16,{speed:2.5,color:'#FFD700',size:5,decay:.011});
      showToast('🎏 历史锦鲤跃龙门！');break;

    case 'geo_turtle':
      fish._hiding=now+2800;fish.vx=0;fish.vy=0;
      _spawnP('leaf',x,y,22,{speed:2,size:5.5,color:'#2E8B57',decay:.007,gravity:.02});
      showToast('🐢 地理龟缩进壳里了！');break;

    case 'goldfish':
      _spawnP('gold',x,y,28,{speed:3.5,size:4.5,decay:.01});
      _spawnP('sparkle',x,y,16,{speed:2.5,color:'#FFD700',size:5,decay:.012});
      (S.pondFish||[]).forEach(f=>{if(f.uid!==fish.uid&&Math.hypot(f.x-x,f.y-y)<130){f.growth=Math.min(100,f.growth+3);_checkFishLevelUp(f);}});
      showToast('✨ 小金鱼金光闪闪！邻居成长+3！');break;

    case 'blueberry_f':
      _spawnP('bubble',x,y,28,{speed:2.8,size:5.5,color:'#6495ED',decay:.008,gravity:-.04});
      showToast('🫧 蓝莓鱼气泡大爆发！');break;

    case 'slack_f':
      for(let i=0;i<6;i++){_fpParticles.push({type:'zzz',x:x+(Math.random()-.5)*35,y:y-i*14,vx:(Math.random()-.5)*.4,vy:-.7-Math.random()*.4,life:1,decay:.006,size:6+i*2,color:'#9aabb5',gravity:0,layer:'above',data:{char:i%2===0?'z':'Z'}});}
      fish.vx*=.05;fish.vy*=.05;
      showToast('💤 摸鱼鱼进入超级摸鱼状态！');break;
  }
}

// ─── C. 被动特效 ──────────────────────────────────────────────────
function _updatePassiveEffects(dt){
  if(!S.pondFish) return;
  S.pondFish.forEach(fish=>{
    if(!fish._passiveTimer) fish._passiveTimer=Math.random()*4000;
    fish._passiveTimer-=dt;if(fish._passiveTimer>0) return;
    const x=fish.x,y=fish.y;
    switch(fish.fishId){
      case 'goldfish':     fish._passiveTimer=4000+Math.random()*2000;_fpParticles.push({type:'sparkle',x,y,vx:(Math.random()-.5)*1.2,vy:-.9,life:.8,decay:.013,size:2.5,color:'#FFD700',gravity:0,layer:'above',data:{}});break;
      case 'blueberry_f':  fish._passiveTimer=3000+Math.random()*1500;_fpParticles.push({type:'bubble',x,y:y-5,vx:(Math.random()-.5)*.8,vy:-.7,life:.9,decay:.011,size:3,color:'#87CEEB',gravity:-.015,layer:'above',data:{}});break;
      case 'slack_f':      fish._passiveTimer=7000+Math.random()*3000;_fpParticles.push({type:'zzz',x:x+(Math.random()-.5)*12,y:y-8,vx:(Math.random()-.5)*.25,vy:-.4,life:.9,decay:.008,size:4.5,color:'#aab',gravity:0,layer:'above',data:{char:'z'}});break;
      case 'whale_scholar':fish._passiveTimer=9000+Math.random()*4000;_fpParticles.push({type:'water',x,y:y-22,vx:(Math.random()-.5)*1.5,vy:-1.8,life:.9,decay:.016,size:3.5,color:'#87CEEB',gravity:.1,layer:'above',data:{}});break;
      case 'rainbow_f':    fish._passiveTimer=1200+Math.random()*800; _fpParticles.push({type:'rainbow',x,y,vx:(Math.random()-.5)*.4,vy:-.4,life:.7,decay:.016,size:2.5,color:'',gravity:0,layer:'below',data:{}});break;
      case 'dragon_f':     fish._passiveTimer=3500+Math.random()*2000;_fpParticles.push({type:'fire',x:x+(fish.vx>=0?16:-16),y,vx:(fish.vx>=0?1.5:-1.5)+(Math.random()-.5),vy:-1.2,life:.7,decay:.021,size:4.5,color:'',gravity:-.025,layer:'above',data:{}});break;
      case 'lantern_f':    fish._passiveTimer=2500+Math.random()*1500;_fpParticles.push({type:'sparkle',x,y,vx:(Math.random()-.5)*.8,vy:-.6,life:.65,decay:.013,size:2.5,color:'#FFD700',gravity:0,layer:'above',data:{}});break;
      case 'clownfish':    fish._passiveTimer=4000+Math.random()*2000;_fpParticles.push({type:'bubble',x,y,vx:(Math.random()-.5)*1.2,vy:-.9,life:.9,decay:.011,size:3.5,color:'#FF7F50',gravity:-.02,layer:'above',data:{}});break;
      case 'history_carp': fish._passiveTimer=4500+Math.random()*2500;_fpParticles.push({type:'gold',x,y,vx:(Math.random()-.5)*.8,vy:-.4,life:.65,decay:.013,size:2.5,color:'#FFD700',gravity:0,layer:'above',data:{}});break;
      case 'geo_turtle':   fish._passiveTimer=5500+Math.random()*3000;_fpParticles.push({type:'leaf',x,y,vx:(Math.random()-.5)*1.2,vy:-.6,life:.75,decay:.011,size:3.5,color:'#2E8B57',gravity:.02,layer:'above',data:{}});break;
      case 'math_shark':
        if(fish._state==='dash'){fish._passiveTimer=150;_fpParticles.push({type:'speedline',x,y,vx:fish.vx*.4,vy:fish.vy*.4,life:.55,decay:.03,size:2.5,color:'rgba(80,100,110,.5)',gravity:0,layer:'below',data:{}});}
        else fish._passiveTimer=4000+Math.random()*2500;break;
      default: fish._passiveTimer=6000+Math.random()*4000;break;
    }
  });
}

// ─── D. 投食系统 ─────────────────────────────────────────────────
function _spawnFood(mx,my){
  if(_fpFoodCd&&Date.now()<_fpFoodCd) return;
  _fpFoodCd=Date.now()+3000;
  for(let i=0;i<3+Math.floor(Math.random()*3);i++){
    _fpFoodItems.push({x:mx+(Math.random()-.5)*45,y:my,vy:.45+Math.random()*.3,eaten:false,alpha:1,r:3.5+Math.random()*2});
  }
  _fpRipples.push({x:mx,y:my,radius:8,alpha:.5});
  (S.pondFish||[]).forEach(f=>{if(Math.hypot(f.x-mx,f.y-my)<260){f._state='chase_food';f._stateTimer=6000;}});
}
function _updateFood(dt){
  const f=dt*.06;
  _fpFoodItems.forEach(food=>{
    if(food.eaten){food.alpha=Math.max(0,food.alpha-.06);return;}
    food.y+=food.vy*f*9;food.x+=Math.sin(_fpTime*.004+food.x)*.2;
    if(food.y>_fpH-52){food.y=_fpH-52;food.vy=0;}
    (S.pondFish||[]).forEach(fish=>{
      if(food.eaten) return;
      if(Math.hypot(fish.x-food.x,fish.y-food.y)<22){
        food.eaten=true;fish.hunger=Math.min(100,(fish.hunger||0)+8);fish.mood='happy';fish.growth=Math.min(100,fish.growth+1.5);_checkFishLevelUp(fish);
        _spawnP('sparkle',food.x,food.y,6,{speed:1.8,color:'#FFD700',size:3,decay:.022});}
    });
  });
  _fpFoodItems=_fpFoodItems.filter(f=>f.alpha>0&&f.y<_fpH);
}
function _drawFood(ctx){
  _fpFoodItems.forEach(food=>{
    if(food.alpha<=0) return;ctx.save();ctx.globalAlpha=food.alpha;
    ctx.fillStyle='#7B4A2D';ctx.beginPath();ctx.arc(food.x,food.y,food.r,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#C87941';ctx.beginPath();ctx.arc(food.x-food.r*.3,food.y-food.r*.3,food.r*.45,0,Math.PI*2);ctx.fill();
    ctx.restore();
  });
}

// ─── E. 诱引点绘制 ────────────────────────────────────────────────
function _drawLure(ctx){
  if(!_fpLurePos) return;
  const age=Date.now()-_fpLurePos.t;if(age>2000){_fpLurePos=null;return;}
  const alpha=(1-age/2000)*.8;ctx.save();
  ctx.globalAlpha=alpha*.5;ctx.strokeStyle='#FFD700';ctx.lineWidth=1.5;ctx.setLineDash([4,4]);
  ctx.beginPath();ctx.arc(_fpLurePos.x,_fpLurePos.y,10+Math.sin(_fpTime*.015)*4,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
  ctx.globalAlpha=alpha;ctx.fillStyle='#FFD700';ctx.shadowColor='#FFD700';ctx.shadowBlur=8;
  ctx.beginPath();ctx.arc(_fpLurePos.x,_fpLurePos.y,3.5,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
  ctx.restore();
}

// ─── F. 首领光环（影响成长数值）──────────────────────────────────
function _updateLeaderAura(dt){
  _fpLeaderTimer+=dt;if(_fpLeaderTimer<1000) return;_fpLeaderTimer=0;_fpLeaderLinks=[];
  if(!S.pondFish||S.pondFish.length<2) return;
  const leaders=S.pondFish.filter(f=>{const d=FISH_DB[f.fishId]||{};return f.lv>=5||d.rarity==='epic'||d.rarity==='legendary';});
  leaders.forEach(leader=>{
    S.pondFish.forEach(follower=>{
      if(follower.uid===leader.uid) return;
      const d=Math.hypot(follower.x-leader.x,follower.y-leader.y);
      if(d<155){
        if(follower.lv<leader.lv){follower.growth=Math.min(100,follower.growth+.14);_checkFishLevelUp(follower);}
        _fpLeaderLinks.push({lx:leader.x,ly:leader.y,fx:follower.x,fy:follower.y,alpha:1-d/155,rc:RARITY_COLOR[(FISH_DB[leader.fishId]||{}).rarity]||'#FFD700'});
        if(Math.random()<.25) _fpParticles.push({type:'sparkle',x:follower.x+(Math.random()-.5)*18,y:follower.y-12,vx:(Math.random()-.5)*.4,vy:-.7,life:.75,decay:.016,size:2.5,color:RARITY_COLOR[(FISH_DB[leader.fishId]||{}).rarity]||'#FFD700',gravity:0,layer:'above',data:{}});
      }
    });
  });
  // 鲨鱼威慑
  S.pondFish.filter(f=>f.fishId==='math_shark'&&f.lv>=3).forEach(shark=>{
    S.pondFish.forEach(prey=>{
      if(prey.uid===shark.uid||prey.fishId==='math_shark') return;
      const d=Math.hypot(prey.x-shark.x,prey.y-shark.y);
      if(d<95&&Math.random()<.45){const a=Math.atan2(prey.y-shark.y,prey.x-shark.x);prey.vx+=Math.cos(a)*2.2;prey.vy+=Math.sin(a)*.9;prey._state='swim';prey._stateTimer=1800;}
    });
  });
}
function _drawLeaderConnections(ctx){
  if(!_fpLeaderLinks.length) return;ctx.save();
  _fpLeaderLinks.forEach(link=>{
    ctx.globalAlpha=link.alpha*.28*(0.55+0.45*Math.sin(_fpTime*.005));
    ctx.strokeStyle=link.rc;ctx.lineWidth=1;ctx.setLineDash([3,7]);
    ctx.beginPath();ctx.moveTo(link.lx,link.ly);ctx.lineTo(link.fx,link.fy);ctx.stroke();ctx.setLineDash([]);
  });ctx.restore();
}

// ─── G. 首领皇冠 ─────────────────────────────────────────────────
function _drawLeaderCrown(ctx,fish){
  const def=FISH_DB[fish.fishId]||{};if(fish.lv<5&&def.rarity!=='epic'&&def.rarity!=='legendary') return;
  const sz=(def.baseSize||30)*(1+fish.lv*.1);
  ctx.save();ctx.font='9px sans-serif';ctx.textAlign='center';ctx.textBaseline='bottom';ctx.globalAlpha=.9;
  ctx.fillText('👑',fish.x,fish.y-sz*.52);ctx.restore();
}

// ─── H. 技能冷却弧线 ─────────────────────────────────────────────
function _drawSkillCooldown(ctx,fish){
  const sk=FISH_SKILLS[fish.fishId];if(!sk||!fish._skillCd||Date.now()>=fish._skillCd) return;
  const def=FISH_DB[fish.fishId]||{},sz=(def.baseSize||30)*(1+fish.lv*.1),remain=(fish._skillCd-Date.now())/sk.cd;
  ctx.save();ctx.globalAlpha=.55;ctx.strokeStyle='rgba(255,255,255,.6)';ctx.lineWidth=2;
  ctx.beginPath();ctx.arc(fish.x,fish.y,sz*.65,-Math.PI/2,-Math.PI/2+Math.PI*2*(1-remain));ctx.stroke();ctx.restore();
}

// ─── 工具函数 ────────────────────────────────────────────────────
function _getFishMood(f){if(!f) return 'normal';if(f.mood==='happy') return 'happy';if(f.hunger<30) return 'sad';return 'normal';}
function _getHungerLabel(h){return h>70?'饱足':h>40?'一般':'饥饿';}
function _desaturate(hex,a){const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16),gr=(r+g+b)/3;return `rgb(${Math.round(r+(gr-r)*a)},${Math.round(g+(gr-g)*a)},${Math.round(b+(gr-b)*a)})`;}
function _lighten(hex,a){let r,g,b;if(hex.startsWith('#')){r=parseInt(hex.slice(1,3),16);g=parseInt(hex.slice(3,5),16);b=parseInt(hex.slice(5,7),16);}else if(hex.startsWith('rgb')){[r,g,b]=hex.match(/\d+/g).map(Number);}else return hex;return `rgb(${Math.min(255,Math.round(r+(255-r)*a))},${Math.min(255,Math.round(g+(255-g)*a))},${Math.min(255,Math.round(b+(255-b)*a))})`;}

// ─── 成就定义 ────────────────────────────────────────────────────
window.FISH_ACHS=[
  {id:'fish_first',ico:'🐟',nm:'第一条鱼',desc:'获得第一条鱼',cond:s=>(s.totalFishCaught||0)>=1,reward:{coins:20,score:10}},
  {id:'fish_5',ico:'🎣',nm:'小渔夫',desc:'累计获得5条鱼',cond:s=>(s.totalFishCaught||0)>=5,reward:{coins:40,score:20}},
  {id:'fish_15',ico:'🐳',nm:'捕鱼达人',desc:'累计获得15条鱼',cond:s=>(s.totalFishCaught||0)>=15,reward:{coins:80,score:40}},
  {id:'fish_almanac5',ico:'📖',nm:'图鉴初学者',desc:'发现5种鱼',cond:s=>(s.fishAlmanac||[]).length>=5,reward:{coins:60,score:30}},
  {id:'fish_almanac_all',ico:'🏆',nm:'图鉴大师',desc:'发现全部鱼种',cond:s=>(s.fishAlmanac||[]).length>=FISH_IDS.length,reward:{coins:300,score:150}},
];
if(window.ACHS&&Array.isArray(ACHS)) FISH_ACHS.forEach(fa=>{if(!ACHS.some(a=>a.id===fa.id))ACHS.push(fa);});

console.log('🐟 知识鱼塘 v3.0 加载完成 — 专属技能·粒子特效·首领光环·群游行为·食物投喂');

// ══════════════════════════════════════════════════════════════
//  v3.1 新增：分散模式 · 鱼币弹窗 · 售卖 · 钓到结果页 · 自定义鱼形象
// ══════════════════════════════════════════════════════════════

// ─── 孵化中弹窗 ──────────────────────────────────────────────
function _openEggModal(){
  let m=document.getElementById('fp-egg-modal');if(m) m.remove();
  m=document.createElement('div');m.id='fp-egg-modal';m.className='fp-modal-mask';
  const eggs=S.fishEggs||[];
  const HATCH_TIME=3*60*1000; // 孵化总时间（毫秒）
  function _eggCardHTML(egg,i){
    const def=FISH_DB[egg.fishId]||{};
    const prog=Math.min(100,egg.progress||0);
    const rarityColor=RARITY_COLOR[def.rarity]||'#6aaa6a';
    const timeLeftSec=Math.max(0,Math.round((100-prog)/100*HATCH_TIME/1000));
    const mins=Math.floor(timeLeftSec/60),secs=timeLeftSec%60;
    return `<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:14px;background:linear-gradient(135deg,${rarityColor}18,${rarityColor}08);border:1.5px solid ${rarityColor}44;margin-bottom:8px">
      <canvas id="eggcvs_${i}" width="40" height="40" style="border-radius:8px;flex-shrink:0;background:linear-gradient(135deg,${rarityColor}18,${rarityColor}08)"></canvas>
      <div style="flex:1">
        <div style="font-size:.78rem;font-weight:700;color:#1a3a2a">${def.name} <span style="font-size:.6rem;padding:1px 7px;border-radius:99px;background:${rarityColor}22;color:${rarityColor}">${RARITY_LABEL[def.rarity]||'普通'}</span></div>
        <div style="margin:4px 0;height:6px;border-radius:99px;background:#eee;overflow:hidden"><div style="width:${prog}%;height:100%;border-radius:99px;background:linear-gradient(90deg,${rarityColor},${rarityColor}cc);transition:width .4s"></div></div>
        <div style="font-size:.65rem;color:#888">${prog<100?'进度 '+Math.round(prog)+'%  ·  约还需 '+mins+'分'+secs+'秒':'🎉 即将孵化！'}</div>
      </div>
    </div>`;
  }
  const eggsHTML=eggs.length?eggs.map((e,i)=>_eggCardHTML(e,i)).join('')
    :'<div style="text-align:center;padding:28px 0;color:#aaa;font-size:.8rem">🥚 目前没有鱼卵<br><span style="font-size:.7rem">去答题获取鱼卵吧！</span></div>';
  m.innerHTML=`<div class="fp-modal" style="width:310px;max-height:80vh;overflow-y:auto">
    <div class="fp-modal-title">🥚 孵化中心</div>
    <div style="font-size:.7rem;color:#888;margin-bottom:10px;text-align:center">答题可以加速孵化进度 · 答对也能提升品质</div>
    <div id="fp-egg-list">${eggsHTML}</div>
    <div style="display:flex;gap:8px;margin-top:10px">
      <button onclick="_eggAccelerate()" style="flex:2;padding:10px;border-radius:12px;border:none;background:linear-gradient(135deg,#2d8a4e,#1a6a3a);color:#fff;font-size:.8rem;font-weight:700;font-family:inherit;cursor:pointer">⚡ 答题加速</button>
      <button onclick="_eggQualityBoost()" style="flex:2;padding:10px;border-radius:12px;border:none;background:linear-gradient(135deg,#7B2FBE,#5a1a9a);color:#fff;font-size:.8rem;font-weight:700;font-family:inherit;cursor:pointer">✨ 答题提品质</button>
      <button onclick="_closeEggModal()" style="flex:1;padding:10px;border-radius:12px;border:1.5px solid #ddd;background:#f5f5f5;font-size:.8rem;font-family:inherit;cursor:pointer">关闭</button>
    </div></div>`;
  document.body.appendChild(m);
  m.addEventListener('click',e=>{if(e.target===m)_closeEggModal();});
  // 渲染每枚蛋对应鱼种的预览图
  setTimeout(()=>{
    eggs.forEach((egg,i)=>{
      const cvs=document.getElementById('eggcvs_'+i);
      if(!cvs) return;
      // 用一个虚拟fish对象来绘制该fishId的图像
      const fakefish={fishId:egg.fishId, _customImg:'', lv:1, _phase:0};
      _drawFishPreviewCanvas(cvs, fakefish, 'normal');
    });
  }, 60);
}
function _closeEggModal(){const m=document.getElementById('fp-egg-modal');if(m)m.remove();}
function _eggAccelerate(){
  if(!S.fishEggs||!S.fishEggs.length){showToast('暂无鱼卵~');return;}
  if(typeof openQuiz!=='function') return;
  openQuiz({title:'⚡ 答题加速孵化',needed:2,onSuccess:()=>{
    (S.fishEggs||[]).forEach(e=>{e.progress=Math.min(100,e.progress+15);});
    persistAccount();_closeEggModal();_openEggModal();
    showToast('⚡ 答对了！鱼卵加速+15%！');
  }});
}
function _eggQualityBoost(){
  if(!S.fishEggs||!S.fishEggs.length){showToast('暂无鱼卵~');return;}
  if(typeof openQuiz!=='function') return;
  openQuiz({title:'✨ 答题提升品质',needed:3,onSuccess:()=>{
    // 随机提升一枚鱼卵的品质（升级稀有度）
    const egg=S.fishEggs[Math.floor(Math.random()*S.fishEggs.length)];
    const def=FISH_DB[egg.fishId]||{};
    const order=['common','rare','epic','legendary'];
    const cur=order.indexOf(def.rarity||'common');
    if(cur<order.length-1){
      // 找一个更高稀有度的鱼
      const pool=FISH_IDS.filter(id=>FISH_DB[id].rarity===order[cur+1]);
      if(pool.length){
        const oldName=def.name;egg.fishId=pool[Math.floor(Math.random()*pool.length)];
        persistAccount();_closeEggModal();_openEggModal();
        showToast('✨ 鱼卵品质提升！'+oldName+' → '+FISH_DB[egg.fishId].name+'！');
        return;
      }
    }
    // 已是最高品质，改为进度+20
    egg.progress=Math.min(100,egg.progress+20);
    persistAccount();_closeEggModal();_openEggModal();
    showToast('✨ 已是最高品质！进度+20%！');
  }});
}

// ─── 分散模式 ─────────────────────────────────────────────────
let _fpScattered = false;
function _toggleScatter(){
  _fpScattered = !_fpScattered;
  const btn = document.getElementById('fp-scatter-btn');
  if(btn) btn.textContent = _fpScattered ? '🌊 聚集' : '🌊 分散';
  if(!S.pondFish||!S.pondFish.length) return;
  if(_fpScattered){
    // 把每条鱼分配到不重叠的格子位置，并记录目标点
    const cols = Math.ceil(Math.sqrt(S.pondFish.length));
    const cellW = (_fpW - 60) / cols;
    const cellH = (_fpH - 100) / Math.ceil(S.pondFish.length / cols);
    S.pondFish.forEach((f,i)=>{
      const col = i % cols, row = Math.floor(i / cols);
      f._scatterTargetX = 40 + col * cellW + cellW * 0.5;
      f._scatterTargetY = 55 + row * cellH + cellH * 0.5;
      f.x = f._scatterTargetX;
      f.y = f._scatterTargetY;
      f.vx = (Math.random()-.5) * 0.3;
      f.vy = (Math.random()-.5) * 0.3;
      f._state = 'idle'; f._stateTimer = 99999;
    });
    showToast('🌊 鱼儿分散了，点击再聚集！');
  } else {
    // 恢复自然游动，清除目标点
    S.pondFish.forEach(f=>{ f._state='swim'; f._stateTimer=2000; f.vx=(Math.random()-.5)*2; f.vy=(Math.random()-.5); f._scatterTargetX=null; f._scatterTargetY=null; });
    showToast('🐟 鱼儿归巢，自由游动！');
  }
}

// ─── 钓到鱼后结果界面（停在钓鱼页）────────────────────────────
function _showFishCatchResult(def,coins){
  const panel = document.getElementById('fp-catch-result');
  if(!panel) return;
  const rc = RARITY_COLOR[def.rarity]||'#6aaa6a';
  panel.style.display = 'block';
  panel.innerHTML = `<div style="position:fixed;inset:0;z-index:800;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center" onclick="this.remove()">
    <div style="background:#fff;border-radius:20px;padding:24px 28px;text-align:center;max-width:280px;width:85%;box-shadow:0 8px 32px rgba(0,0,0,.25)">
      <div style="font-size:2.8rem;margin-bottom:8px">${def.icon}</div>
      <div style="font-size:1.1rem;font-weight:800;color:#1a4a2a;margin-bottom:4px">🎉 钓到了！</div>
      <div style="font-size:.9rem;font-weight:700;color:${rc};margin-bottom:4px">${def.name} <span style="font-size:.7rem;padding:1px 8px;border-radius:99px;background:${rc}22">${RARITY_LABEL[def.rarity]}</span></div>
      <div style="font-size:.72rem;color:#888;margin-bottom:16px">${def.unlockDesc} · 速度⚡${def.speed.toFixed(1)}</div>
      <div style="font-size:.75rem;color:#5a9a5a;margin-bottom:16px">🪙 金币+${coins}，已加入鱼塘！</div>
      <div style="display:flex;gap:10px">
        <button onclick="stopFishing()" style="flex:1;padding:10px;border-radius:12px;border:1.5px solid #ddd;background:#f5f5f5;font-size:.8rem;font-family:inherit;cursor:pointer">🔙 返回鱼塘</button>
        <button onclick="document.querySelector('#fp-catch-result div').remove();_fishingState='idle'" style="flex:1;padding:10px;border-radius:12px;border:none;background:#2d8a4e;color:#fff;font-size:.8rem;font-weight:700;font-family:inherit;cursor:pointer">🎣 继续钓鱼</button>
      </div>
    </div></div>`;
}

// ─── 鱼币弹窗 + 批量售卖 ──────────────────────────────────────
let _fpSellSelected = new Set();
function _openFishCoinModal(){
  if(document.getElementById('fp-coin-modal')) return;
  const coins = S.fishCoins||0;
  const modal = document.createElement('div');
  modal.id = 'fp-coin-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:900;background:rgba(0,0,0,.5);display:flex;align-items:flex-end;justify-content:center';
  _fpSellSelected.clear();
  const fishList = (S.pondFish||[]).map((f,i)=>{
    const def = FISH_DB[f.fishId]||{};
    const sellPrice = (f.lv||1)*({common:3,rare:8,epic:20,legendary:50}[def.rarity]||3);
    return `<div class="fp-sell-item" id="fsi_${f.uid}" onclick="_fpToggleSell('${f.uid}','${sellPrice}',this)" style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:12px;border:1.5px solid #eee;margin-bottom:8px;cursor:pointer;transition:all .15s">
      <canvas id="fsi_cvs_${f.uid}" width="40" height="40" style="border-radius:8px;flex-shrink:0;background:linear-gradient(135deg,rgba(100,200,150,.1),rgba(50,150,100,.05))"></canvas>
      <div style="flex:1">
        <div style="font-size:.8rem;font-weight:700">${f.nickname||def.name} <span style="font-size:.6rem;color:${RARITY_COLOR[def.rarity]||'#999'};padding:0 5px;border-radius:99px;background:${RARITY_COLOR[def.rarity]||'#999'}22">${RARITY_LABEL[def.rarity]||'普通'}</span></div>
        <div style="font-size:.65rem;color:#888">Lv.${f.lv} · 成长${Math.round(f.growth)}%</div>
      </div>
      <div style="font-size:.75rem;font-weight:700;color:#d4a017">🪙${sellPrice}</div>
    </div>`;
  }).join('');
  modal.innerHTML = `<div style="background:#fff;border-radius:20px 20px 0 0;padding:20px;width:100%;max-height:80vh;overflow-y:auto;font-family:'Noto Sans SC',sans-serif">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
      <div style="font-size:1rem;font-weight:800">🪙 鱼币管理</div>
      <div style="font-size:.85rem;color:#d4a017;font-weight:700">当前：${coins}鱼币</div>
    </div>
    <div style="font-size:.7rem;color:#888;margin-bottom:12px">点击选择要售出的鱼，可多选</div>
    <div id="fp-sell-list">${fishList||'<div style="text-align:center;color:#aaa;padding:20px">鱼塘里还没有鱼~</div>'}</div>
    <div style="position:sticky;bottom:0;background:#fff;padding-top:12px;border-top:1px solid #f0f0f0;margin-top:8px">
      <div style="display:flex;gap:8px;margin-bottom:8px">
        <button onclick="_fpSelectAllSell()" style="flex:1;padding:8px;border-radius:10px;border:1.5px solid #ddd;background:#f5f5f5;font-size:.75rem;font-family:inherit;cursor:pointer">全选</button>
        <button onclick="_fpClearSell()" style="flex:1;padding:8px;border-radius:10px;border:1.5px solid #ddd;background:#f5f5f5;font-size:.75rem;font-family:inherit;cursor:pointer">取消选择</button>
      </div>
      <div style="display:flex;gap:8px">
        <button onclick="_closeFishCoinModal()" style="flex:1;padding:10px;border-radius:12px;border:1.5px solid #ddd;background:#f5f5f5;font-size:.8rem;font-family:inherit;cursor:pointer">关闭</button>
        <button onclick="_fpConfirmSell()" id="fp-sell-btn" style="flex:2;padding:10px;border-radius:12px;border:none;background:#2d8a4e;color:#fff;font-size:.8rem;font-weight:700;font-family:inherit;cursor:pointer">售出选中（0🪙）</button>
      </div>
    </div></div>`;
  document.body.appendChild(modal);
  modal.addEventListener('click',e=>{ if(e.target===modal) _closeFishCoinModal(); });
  // 渲染售卖列表里每条鱼的预览图
  setTimeout(()=>{
    (S.pondFish||[]).forEach(f=>{
      const cvs=document.getElementById('fsi_cvs_'+f.uid);
      if(cvs) _drawFishPreviewCanvas(cvs, f, 'normal');
    });
  }, 50);
}

function _fpToggleSell(uid, price, el){
  if(_fpSellSelected.has(uid)){_fpSellSelected.delete(uid);el.style.background='';el.style.borderColor='#eee';}
  else{_fpSellSelected.add(uid);el.style.background='#e8f5e9';el.style.borderColor='#2d8a4e';}
  _fpUpdateSellBtn();
}
function _fpSelectAllSell(){
  (S.pondFish||[]).forEach(f=>{
    _fpSellSelected.add(f.uid);
    const el=document.getElementById('fsi_'+f.uid);
    if(el){el.style.background='#e8f5e9';el.style.borderColor='#2d8a4e';}
  });_fpUpdateSellBtn();
}
function _fpClearSell(){
  _fpSellSelected.clear();
  document.querySelectorAll('.fp-sell-item').forEach(el=>{el.style.background='';el.style.borderColor='#eee';});
  _fpUpdateSellBtn();
}
function _fpUpdateSellBtn(){
  let total=0;
  _fpSellSelected.forEach(uid=>{const f=(S.pondFish||[]).find(f=>f.uid===uid);if(f){const def=FISH_DB[f.fishId]||{};total+=(f.lv||1)*({common:3,rare:8,epic:20,legendary:50}[def.rarity]||3);}});
  const btn=document.getElementById('fp-sell-btn');if(btn) btn.textContent=`售出选中（${total}🪙）`;
}
function _fpConfirmSell(){
  if(!_fpSellSelected.size){showToast('请先选择要售出的鱼！');return;}
  let total=0;const names=[];
  _fpSellSelected.forEach(uid=>{
    const f=(S.pondFish||[]).find(f=>f.uid===uid);if(!f) return;
    const def=FISH_DB[f.fishId]||{};const price=(f.lv||1)*({common:3,rare:8,epic:20,legendary:50}[def.rarity]||3);
    total+=price;names.push(f.nickname||def.name);
  });
  if(typeof openConfirm==='function') openConfirm('🪙',`售出 ${_fpSellSelected.size} 条鱼？\n获得 ${total} 鱼币`,()=>{
    S.pondFish=(S.pondFish||[]).filter(f=>!_fpSellSelected.has(f.uid));
    S.fishCoins=(S.fishCoins||0)+total;persistAccount();
    _closeFishCoinModal();renderFishPondUI();showToast(`🪙 售出 ${_fpSellSelected.size} 条鱼，+${total}鱼币！`);
  });
}
function _closeFishCoinModal(){const m=document.getElementById('fp-coin-modal');if(m)m.remove();}

// ─── 鱼自定义（名字+图片）──────────────────────────────────────
function _openFishCustomModal(uid){
  const fish=(S.pondFish||[]).find(f=>f.uid===uid);if(!fish) return;
  const def=FISH_DB[fish.fishId]||{};
  let m=document.getElementById('fp-fish-custom-mask');if(m) m.remove();
  m=document.createElement('div');m.id='fp-fish-custom-mask';m.className='fp-modal-mask';
  const imgSrc=fish._customImg||'';
  m.innerHTML=`<div class="fp-modal" style="width:290px">
    <div class="fp-modal-title">✏️ 自定义 ${def.name}</div>
    <div style="text-align:center;margin-bottom:12px">
      <div id="fp-custom-img-wrap" onclick="document.getElementById('fp-fish-img-inp').click()" style="width:72px;height:72px;border-radius:50%;border:2px dashed #ccc;margin:0 auto 6px;cursor:pointer;overflow:hidden;display:flex;align-items:center;justify-content:center;background:#f5f5f5">
        ${imgSrc?`<img src="${imgSrc}" style="width:100%;height:100%;object-fit:cover">`:`<canvas id="fp-custom-prev-cvs" width="72" height="72" style="display:block"></canvas>`}
      </div>
      <div style="font-size:.62rem;color:#aaa">点击头像更换图片</div>
      <input id="fp-fish-img-inp" type="file" accept="image/*" style="display:none" onchange="_fpHandleImgUpload('${uid}',this)">
    </div>
    <div style="font-size:.72rem;color:#666;margin-bottom:5px">宠物昵称</div>
    <input class="fp-modal-input" id="fp-fish-name-inp" maxlength="10" value="${fish.nickname||''}" placeholder="${def.name}">
    <div class="fp-modal-row" style="flex-wrap:wrap;gap:6px">
      <button class="fp-modal-btn primary" onclick="_saveFishCustom('${uid}')" style="flex:2">保存</button>
      <button class="fp-modal-btn" onclick="_resetFishCustom('${uid}')" style="flex:1;background:rgba(255,100,100,.08);border-color:rgba(255,100,100,.3);color:#c0392b">恢复默认</button>
      <button class="fp-modal-btn" onclick="_closeFishCustomModal()" style="flex:1">取消</button>
    </div></div>`;
  document.body.appendChild(m);
  m.addEventListener('click',e=>{if(e.target===m)_closeFishCustomModal();});
  setTimeout(()=>{
    document.getElementById('fp-fish-name-inp')?.focus();
    // 无自定义图时，显示资源图或代码绘制
    if(!fish._customImg){
      const cvs=document.getElementById('fp-custom-prev-cvs');
      if(cvs) _drawFishPreviewCanvas(cvs, fish, 'normal');
    }
  },100);
}
function _fpHandleImgUpload(uid,input){
  const file=input.files&&input.files[0];if(!file) return;
  const reader=new FileReader();
  reader.onload=e=>{
    const wrap=document.getElementById('fp-custom-img-wrap');
    if(wrap) wrap.innerHTML=`<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover">`;
    // 临时挂在 input 上，保存时读取
    input._dataUrl=e.target.result;
  };
  reader.readAsDataURL(file);
}
function _saveFishCustom(uid){
  const fish=(S.pondFish||[]).find(f=>f.uid===uid);if(!fish) return;
  const nameInp=document.getElementById('fp-fish-name-inp');
  const imgInp=document.getElementById('fp-fish-img-inp');
  if(nameInp) fish.nickname=(nameInp.value||'').trim().slice(0,10);
  if(imgInp&&imgInp._dataUrl) fish._customImg=imgInp._dataUrl;
  persistAccount();_closeFishCustomModal();_showFishInfoCard(fish);
  showToast('✅ 已保存自定义信息！');
}
function _resetFishCustom(uid){
  const fish=(S.pondFish||[]).find(f=>f.uid===uid);if(!fish) return;
  fish.nickname='';fish._customImg='';fish.__customImgObj=null;
  persistAccount();_closeFishCustomModal();
  _showFishInfoCard(fish); // ← 加这一行，立即刷新信息卡头像
  showToast('✅ 已恢复默认形象和昵称！');
}
function _closeFishCustomModal(){const m=document.getElementById('fp-fish-custom-mask');if(m)m.remove();}

// ─── 售出单条鱼（替换原放生）────────────────────────────────────
function _sellFish(uid){
  const fish=(S.pondFish||[]).find(f=>f.uid===uid);if(!fish) return;
  const def=FISH_DB[fish.fishId]||{};
  const price=(fish.lv||1)*({common:3,rare:8,epic:20,legendary:50}[def.rarity]||3);
  if(typeof openConfirm==='function') openConfirm('🪙',`售出 ${fish.nickname||def.name}？\n获得 ${price} 鱼币 + ${fish.lv*2} 金币`,()=>{
    S.pondFish=(S.pondFish||[]).filter(f=>f.uid!==uid);
    S.fishCoins=(S.fishCoins||0)+price;
    S.coins=(S.coins||0)+fish.lv*2;S.totalCoins=(S.totalCoins||0)+fish.lv*2;
    persistAccount();if(typeof updateTop==='function') updateTop();
    _hideInfoCard();renderFishPondUI();showToast(`🪙 ${def.name}已售出，+${price}鱼币 +${fish.lv*2}金币`);
  });
}

// ─── renderFish 覆写：有图用图（无尾无截切），无图代码绘制 ──────
const _origRenderFish = renderFish;
renderFish = function(ctx, fish, x, y, size, angle, flipX){
  const img = _getEffectiveFishImg(fish);
  if(!img){
    // 无图（代码绘制）
    _origRenderFish(ctx, fish, x, y, size, angle, flipX);
    return;
  }
  // 有图：PNG 高清渲染，保留透明通道，尺寸放大
  const drawSize = size * 2.2;
  ctx.save();
  ctx.translate(x, y);
  if(flipX) ctx.scale(-1, 1);
  ctx.rotate(angle || 0);
  const aspect = img.naturalWidth / (img.naturalHeight || 1);
  let dw = drawSize, dh = drawSize;
  if(aspect > 1) dh = drawSize / aspect; else dw = drawSize * aspect;
  ctx.globalAlpha = 1;
  ctx.drawImage(img, -dw/2, -dh/2, dw, dh);
  if(fish.lv>1){ctx.font='bold 7px sans-serif';ctx.fillStyle='#fff';ctx.strokeStyle='rgba(0,0,0,.5)';ctx.lineWidth=1.5;ctx.strokeText('Lv'+fish.lv,-dw/2+2,-dh/2+2);ctx.fillText('Lv'+fish.lv,-dw/2+2,-dh/2+2);}
  ctx.restore();
};
