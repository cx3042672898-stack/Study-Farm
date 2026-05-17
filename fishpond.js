// ══════════════════════════════════════════════════════════════
//  fishpond.js  — 知识鱼塘系统 v2.0
//  数据驱动 · 代码绘制鱼 · 气泡对话 · 鱼卵可视化 · 横排卡片
// ══════════════════════════════════════════════════════════════

// ─── 一、全局鱼类数据库 ─────────────────────────────────────────
window.FISH_DB = {
  goldfish:     { id:'goldfish',     name:'小金鱼',     icon:'🐟', rarity:'common',   maxLv:5,  baseSize:28, color:'#FFD700', bodyColor:'#FF8C00', finColor:'#FF6347', speed:1.2, unlockDesc:'连续答对5题',       subject:null,    quotes:['今天也要加油呀！','游来游去真开心~','主人来看我啦！','要认真学习哦~'] },
  blueberry_f:  { id:'blueberry_f',  name:'蓝莓鱼',     icon:'🫧', rarity:'common',   maxLv:5,  baseSize:26, color:'#6495ED', bodyColor:'#4169E1', finColor:'#1E90FF', speed:1.0, unlockDesc:'英语答题全对',       subject:'english',quotes:['Blueberry swimming~','Hello master!','Let\'s learn!','Nice to see you!'] },
  math_shark:   { id:'math_shark',   name:'数学鲨鱼',   icon:'🦈', rarity:'rare',     maxLv:8,  baseSize:42, color:'#708090', bodyColor:'#2F4F4F', finColor:'#556B2F', speed:1.8, unlockDesc:'数学答题连胜',       subject:'math',  quotes:['1+1=2，简单！','几何证明？小意思！','数学是宇宙的语言！'] },
  lantern_f:    { id:'lantern_f',    name:'熬夜灯笼鱼', icon:'🏮', rarity:'rare',     maxLv:6,  baseSize:30, color:'#FF6B35', bodyColor:'#FF4500', finColor:'#FFD700', speed:0.8, unlockDesc:'夜间学习解锁',       subject:null,    quotes:['深夜也在发光~','黑暗中照亮前路','夜猫子报到！'] },
  slack_f:      { id:'slack_f',      name:'摸鱼鱼',     icon:'🐡', rarity:'common',   maxLv:4,  baseSize:24, color:'#98FB98', bodyColor:'#66CDAA', finColor:'#20B2AA', speed:0.5, unlockDesc:'长时间挂机触发',     subject:null,    quotes:['摸鱼使我快乐~','今天也摸到了！','划水中…请勿打扰'] },
  whale_scholar:{ id:'whale_scholar', name:'学霸鲸鱼',   icon:'🐳', rarity:'epic',     maxLv:10, baseSize:55, color:'#4682B4', bodyColor:'#1C3A5F', finColor:'#87CEEB', speed:0.6, unlockDesc:'连续7天坚持学习',   subject:null,    quotes:['知识的海洋任我畅游！','学无止境！','坚持就是胜利！'] },
  rainbow_f:    { id:'rainbow_f',    name:'彩虹鱼',     icon:'🌈', rarity:'epic',     maxLv:8,  baseSize:32, color:'rainbow',  bodyColor:'#FF69B4', finColor:'#9370DB', speed:1.4, unlockDesc:'周末限定活动获取', subject:null,    quotes:['今天的颜色格外好看~','彩虹闪闪发光！','七彩祝福送给你！'] },
  puffer_f:     { id:'puffer_f',     name:'河豚宝宝',   icon:'🐡', rarity:'common',   maxLv:5,  baseSize:22, color:'#FFC0CB', bodyColor:'#FFB6C1', finColor:'#FF69B4', speed:0.9, unlockDesc:'累计答对20题',       subject:null,    quotes:['鼓起来了！','不要戳我！','我生气会变大的！'] },
  clownfish:    { id:'clownfish',    name:'小丑鱼',     icon:'🤡', rarity:'common',   maxLv:5,  baseSize:24, color:'#FF7F50', bodyColor:'#FF6347', finColor:'#FFA500', speed:1.3, unlockDesc:'累计答对50题',       subject:null,    quotes:['找到尼莫了！','我有条纹哦~','珊瑚礁是我家！'] },
  dragon_f:     { id:'dragon_f',     name:'龙鱼',       icon:'🐉', rarity:'legendary',maxLv:12, baseSize:48, color:'#B22222', bodyColor:'#8B0000', finColor:'#FFD700', speed:1.6, unlockDesc:'累计答对200题',     subject:null,    quotes:['吾乃龙鱼之王！','区区题目，不在话下！','传说中的存在！'] },
  geo_turtle:   { id:'geo_turtle',   name:'地理龟',     icon:'🐢', rarity:'rare',     maxLv:7,  baseSize:35, color:'#2E8B57', bodyColor:'#006400', finColor:'#8FBC8F', speed:0.4, unlockDesc:'地理答题连胜',       subject:'geo',   quotes:['世界那么大~','经纬度我最熟！','慢慢游也能到终点'] },
  history_carp: { id:'history_carp', name:'历史锦鲤',   icon:'🎏', rarity:'rare',     maxLv:7,  baseSize:34, color:'#DC143C', bodyColor:'#B22222', finColor:'#FFD700', speed:1.1, unlockDesc:'历史答题连胜',       subject:'history',quotes:['以史为鉴！','鲤鱼跃龙门！','历史的长河~'] },
};
window.FISH_IDS = Object.keys(FISH_DB);
const RARITY_LABEL = { common:'普通', rare:'稀有', epic:'史诗', legendary:'传说' };
const RARITY_COLOR = { common:'#6aaa6a', rare:'#4682B4', epic:'#a07ad0', legendary:'#FFD700' };

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
let _fpSpeech = [];
let _fpTime = 0;
let _fpSelectedFish = null;
let _fpSelectedEgg = null;
let _fpMode = 'pond';
const SAND_COLOR = '#d4a76a';
let _fishingState='idle',_fishingTimer=0,_fishingBobY=0,_fishingTarget=null;
let _fishingRodX=0,_fishingLineEndY=0,_fishingBobAngle=0,_fishingBiteAt=0;

// ─── 四、初始化 ──────────────────────────────────────────────────
function initFishPond(){
  if(!S.pondFish) S.pondFish=[];
  if(!S.fishEggs) S.fishEggs=[];
  if(!S.fishAlmanac) S.fishAlmanac=[];
  if(S.fishCoins===undefined) S.fishCoins=0;
  if(!S.totalFishCaught) S.totalFishCaught=0;
  if(!S.fishingRodLevel) S.fishingRodLevel=1;
  if(S.pondFish.length===0 && S.fishAlmanac.length===0){
    _addFishToPlayer('goldfish');
    _addFishToPlayer('puffer_f');
  }
  _assignEggPositions();
  _fpMode='pond'; _fpSelectedFish=null; _fpSelectedEgg=null;
  renderFishPondUI();
}

function _assignEggPositions(){
  if(!S.fishEggs) return;
  S.fishEggs.forEach((egg,i)=>{
    if(!egg._x) egg._x = 0.12 + (i*0.22) % 0.72;
    if(!egg._wobble) egg._wobble = Math.random()*Math.PI*2;
  });
}

// ─── 五、Canvas 尺寸 ────────────────────────────────────────────
function _resizeFishPond(){
  if(!_fpCanvas) return;
  const c=_fpCanvas.parentElement;
  _fpW=_fpCanvas.width=Math.max(300,c.clientWidth||400);
  _fpH=_fpCanvas.height=Math.max(260,c.clientHeight||360);
}

// ─── 六、代码绘制鱼 ─────────────────────────────────────────────
function renderFishByCode(ctx,fish,x,y,size,angle,flipX,mood){
  const def=FISH_DB[fish.fishId]; if(!def) return;
  ctx.save(); ctx.translate(x,y); ctx.rotate(angle);
  if(flipX) ctx.scale(-1,1);
  const sc=size/30; ctx.scale(sc,sc);
  let bodyColor=def.bodyColor, finColor=def.finColor;
  if(mood==='sad'){bodyColor=_desaturate(bodyColor,.5);finColor=_desaturate(finColor,.5);}
  const t=_fpTime*0.003;
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
  if(mood==='happy'){ctx.strokeStyle='#333';ctx.lineWidth=.8;ctx.beginPath();ctx.arc(15,1,2.5,0,Math.PI);ctx.stroke();}
  else if(mood==='sad'){ctx.strokeStyle='#666';ctx.lineWidth=.8;ctx.beginPath();ctx.arc(15,3,2,Math.PI,0);ctx.stroke();}
  else{ctx.fillStyle='#333';ctx.beginPath();ctx.arc(15,1,1.2,0,Math.PI*2);ctx.fill();}
  // 彩虹鱼
  if(def.color==='rainbow'){
    ctx.globalCompositeOperation='overlay';
    const g=ctx.createLinearGradient(-18,0,18,0);const h=(t*50)%360;
    g.addColorStop(0,`hsl(${h},80%,60%)`);g.addColorStop(.5,`hsl(${(h+120)%360},80%,60%)`);g.addColorStop(1,`hsl(${(h+240)%360},80%,60%)`);
    ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(0,0,18,11,0,0,Math.PI*2);ctx.fill();
    ctx.globalCompositeOperation='source-over';
  }
  // 稀有光环
  if(def.rarity==='epic'||def.rarity==='legendary'){
    ctx.globalAlpha=.15+Math.sin(t*2)*.1;ctx.strokeStyle=RARITY_COLOR[def.rarity];ctx.lineWidth=2;
    ctx.beginPath();ctx.ellipse(0,0,22,15,0,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;
  }
  // Lv
  if(fish.lv>1){ctx.font='bold 7px sans-serif';ctx.fillStyle='#fff';ctx.strokeStyle='rgba(0,0,0,.5)';ctx.lineWidth=1.5;ctx.strokeText('Lv'+fish.lv,-14,-14);ctx.fillText('Lv'+fish.lv,-14,-14);}
  ctx.restore();
}

function renderFish(ctx,fish,x,y,size,angle,flipX){
  renderFishByCode(ctx,fish,x,y,size,angle,flipX,_getFishMood(fish));
}

// ─── 七、饥饿标识 ───────────────────────────────────────────────
function _drawHungryIndicator(ctx,fish,x,y){
  if(fish.hunger>=30) return;
  const t=_fpTime*0.004, bounce=Math.sin(t*2)*2;
  ctx.save();ctx.font='12px sans-serif';ctx.textAlign='center';
  ctx.globalAlpha=.6+Math.sin(t*3)*.3;
  ctx.fillText(fish.hunger<15?'😵':'🍽️', x, y-25+bounce);
  ctx.globalAlpha=1;ctx.restore();
}

// ─── 八、鱼AI ───────────────────────────────────────────────────
function _updateFishBehavior(fish,dt){
  if(!fish._phase) fish._phase=Math.random()*Math.PI*2;
  if(!fish._state) fish._state='swim';
  if(!fish._stateTimer) fish._stateTimer=0;
  const def=FISH_DB[fish.fishId]||{}, spd=(def.speed||1)*(0.5+fish.lv*0.05);
  fish._stateTimer-=dt;
  if(fish._stateTimer<=0){
    const r=Math.random();
    if(r<.6){fish._state='swim';fish._stateTimer=3000+Math.random()*5000;const a=Math.random()*Math.PI*2;fish.vx=Math.cos(a)*spd;fish.vy=Math.sin(a)*spd*.5;}
    else if(r<.8){fish._state='idle';fish._stateTimer=1500+Math.random()*2000;fish.vx*=.2;fish.vy*=.1;}
    else if(r<.92){fish._state='dash';fish._stateTimer=600+Math.random()*800;const a=Math.random()*Math.PI*2;fish.vx=Math.cos(a)*spd*2.5;fish.vy=Math.sin(a)*spd*1.2;}
    else{fish._state='follow';fish._stateTimer=2000;}
  }
  if(fish._state==='follow'&&_fpRipples.length>0){
    const tg=_fpRipples[_fpRipples.length-1],dx=tg.x-fish.x,dy=tg.y-fish.y,d=Math.sqrt(dx*dx+dy*dy);
    if(d>5){fish.vx+=(dx/d)*spd*.05;fish.vy+=(dy/d)*spd*.05;}
  }
  fish.vx*=.98;fish.vy*=.98;fish.vy+=Math.sin(_fpTime*.002+fish._phase)*.015;
  fish.x+=fish.vx*dt*.06;fish.y+=fish.vy*dt*.06;
  const m=30,sandY=_fpH-45;
  if(fish.x<m){fish.x=m;fish.vx=Math.abs(fish.vx)*.8;}
  if(fish.x>_fpW-m){fish.x=_fpW-m;fish.vx=-Math.abs(fish.vx)*.8;}
  if(fish.y<40){fish.y=40;fish.vy=Math.abs(fish.vy)*.6;}
  if(fish.y>sandY){fish.y=sandY;fish.vy=-Math.abs(fish.vy)*.6;}
}

// ─── 九、鱼卵绘制 ───────────────────────────────────────────────
function _drawEggs(ctx){
  if(!S.fishEggs||S.fishEggs.length===0) return;
  const sandBaseY=_fpH-15;
  S.fishEggs.forEach((egg,i)=>{
    const def=FISH_DB[egg.fishId]||{}, progress=Math.min(1,egg.progress/100);
    const ex=egg._x?egg._x*_fpW:(0.2+i*0.2)*_fpW;
    const ey=sandBaseY-12+Math.sin((egg._wobble||0)+_fpTime*.001)*1.5;
    const isSel=(_fpSelectedEgg===i), t=_fpTime*0.003;
    ctx.save();ctx.translate(ex,ey);
    // 阴影
    ctx.fillStyle='rgba(0,0,0,.08)';ctx.beginPath();ctx.ellipse(0,6,10,3,0,0,Math.PI*2);ctx.fill();
    const eH=16, eW=11, rc=RARITY_COLOR[def.rarity||'common'];
    // 蛋体 — 进度外观
    if(progress<.3) ctx.fillStyle='#FAFAF5';
    else if(progress<.6){const g=ctx.createLinearGradient(0,-eH,0,eH);g.addColorStop(0,'#FAFAF5');g.addColorStop(1,rc+'44');ctx.fillStyle=g;}
    else if(progress<.9){const g=ctx.createLinearGradient(0,-eH,0,eH);g.addColorStop(0,rc+'88');g.addColorStop(1,rc+'cc');ctx.fillStyle=g;}
    else{ctx.fillStyle=rc;ctx.shadowColor=rc;ctx.shadowBlur=8+Math.sin(t*4)*4;}
    // 蛋形
    ctx.beginPath();ctx.moveTo(0,-eH);ctx.bezierCurveTo(eW,-eH*.6,eW,eH*.4,0,eH);ctx.bezierCurveTo(-eW,eH*.4,-eW,-eH*.6,0,-eH);ctx.closePath();ctx.fill();
    ctx.shadowBlur=0;
    // 高光
    ctx.fillStyle='rgba(255,255,255,.35)';ctx.beginPath();ctx.ellipse(-3,-5,4,6,-.3,0,Math.PI*2);ctx.fill();
    // 裂纹(60%+)
    if(progress>=.6){
      ctx.strokeStyle='rgba(80,60,40,.3)';ctx.lineWidth=.8;
      ctx.beginPath();ctx.moveTo(-2,-4);ctx.lineTo(1,0);ctx.lineTo(-1,3);ctx.lineTo(2,7);ctx.stroke();
      if(progress>=.8){ctx.beginPath();ctx.moveTo(3,-6);ctx.lineTo(5,-2);ctx.lineTo(3,2);ctx.stroke();}
    }
    // 即将孵化摇动
    if(progress>=.9){const sh=Math.sin(t*8)*2;ctx.translate(sh,0);}
    // 进度条
    ctx.fillStyle='rgba(0,0,0,.15)';ctx.fillRect(-8,eH+4,16,3);
    ctx.fillStyle=rc;ctx.fillRect(-8,eH+4,16*progress,3);
    // 选中光圈
    if(isSel){ctx.strokeStyle='#FFD700';ctx.lineWidth=1.5;ctx.setLineDash([3,2]);ctx.beginPath();ctx.ellipse(0,0,eW+4,eH+4,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}
    ctx.restore();
  });
}

// ─── 十、气泡对话 ────────────────────────────────────────────────
function _spawnSpeech(fish){
  const def=FISH_DB[fish.fishId];if(!def) return;
  _fpSpeech=_fpSpeech.filter(s=>s.uid!==fish.uid);
  _fpSpeech.push({uid:fish.uid,text:def.quotes[Math.floor(Math.random()*def.quotes.length)],x:fish.x,y:fish.y-30,alpha:1,timer:3000});
}
function _updateSpeech(dt){
  _fpSpeech.forEach(s=>{s.timer-=dt;s.alpha=Math.max(0,s.timer/3000);
    const f=(S.pondFish||[]).find(ff=>ff.uid===s.uid);if(f){s.x=f.x;s.y=f.y-35;}});
  _fpSpeech=_fpSpeech.filter(s=>s.timer>0);
}
function _drawSpeech(ctx){
  ctx.font='11px "Noto Sans SC",sans-serif';
  _fpSpeech.forEach(s=>{
    ctx.save();ctx.globalAlpha=s.alpha;
    const tw=ctx.measureText(s.text).width;const pw=Math.min(tw+16,160);
    const px=Math.max(pw/2+5,Math.min(s.x,_fpW-pw/2-5));const py=Math.max(22,s.y);
    ctx.fillStyle='rgba(255,255,255,.92)';_roundRect(ctx,px-pw/2,py-14,pw,22,10);ctx.fill();
    ctx.strokeStyle='rgba(100,180,220,.3)';ctx.lineWidth=1;_roundRect(ctx,px-pw/2,py-14,pw,22,10);ctx.stroke();
    ctx.fillStyle='rgba(255,255,255,.92)';ctx.beginPath();ctx.moveTo(px-4,py+8);ctx.lineTo(px,py+14);ctx.lineTo(px+4,py+8);ctx.fill();
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#2a6b4a';ctx.fillText(s.text,px,py-3,pw-10);
    ctx.restore();
  });
}
function _roundRect(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.arcTo(x+w,y,x+w,y+r,r);ctx.lineTo(x+w,y+h-r);ctx.arcTo(x+w,y+h,x+w-r,y+h,r);ctx.lineTo(x+r,y+h);ctx.arcTo(x,y+h,x,y+h-r,r);ctx.lineTo(x,y+r);ctx.arcTo(x,y,x+r,y,r);ctx.closePath();}

// ─── 十一、主渲染循环 ───────────────────────────────────────────
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

function _updatePond(dt){
  if(S.pondFish) S.pondFish.forEach(f=>_updateFishBehavior(f,dt));
  _updateSpeech(dt);
  if(Math.random()<.02) _fpBubbles.push({x:Math.random()*_fpW,y:_fpH-20,r:1+Math.random()*3,speed:.3+Math.random()*.5,alpha:.6});
  _fpBubbles.forEach(b=>{b.y-=b.speed;b.x+=Math.sin(_fpTime*.003+b.x)*.2;b.alpha-=.001;});
  _fpBubbles=_fpBubbles.filter(b=>b.y>0&&b.alpha>0);
  _fpRipples.forEach(r=>{r.radius+=1;r.alpha-=.015;});
  _fpRipples=_fpRipples.filter(r=>r.alpha>0);
  _checkEggHatch();
}

function _drawPond(){
  const ctx=_fpCtx;if(!ctx) return;
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
  // 水泡
  ctx.fillStyle='rgba(255,255,255,.3)';
  _fpBubbles.forEach(b=>{ctx.globalAlpha=b.alpha;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fill();});ctx.globalAlpha=1;
  // 涟漪
  _fpRipples.forEach(r=>{ctx.strokeStyle=`rgba(255,255,255,${r.alpha})`;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(r.x,r.y,r.radius,0,Math.PI*2);ctx.stroke();});
  // 鱼
  if(S.pondFish){[...S.pondFish].sort((a,b)=>a.y-b.y).forEach(f=>{
    const def=FISH_DB[f.fishId];if(!def) return;const size=def.baseSize*(1+f.lv*.1);
    renderFish(ctx,f,f.x,f.y,size,Math.atan2(f.vy,Math.abs(f.vx))*.3,f.vx<0);
    _drawHungryIndicator(ctx,f,f.x,f.y);
    if(_fpSelectedFish===f.uid){ctx.strokeStyle='rgba(255,215,0,.6)';ctx.lineWidth=2;ctx.setLineDash([4,3]);ctx.beginPath();ctx.arc(f.x,f.y,size*.7,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}
  });}
  // 气泡对话
  _drawSpeech(ctx);
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

// ─── 十二、点击交互 ─────────────────────────────────────────────
function _onPondClick(e){const r=_fpCanvas.getBoundingClientRect();_handlePondInteraction((e.clientX-r.left)*(_fpW/r.width),(e.clientY-r.top)*(_fpH/r.height));}
function _onPondTouch(e){if(e.touches.length!==1) return;const r=_fpCanvas.getBoundingClientRect();_handlePondInteraction((e.touches[0].clientX-r.left)*(_fpW/r.width),(e.touches[0].clientY-r.top)*(_fpH/r.height));}

function _handlePondInteraction(mx,my){
  _fpRipples.push({x:mx,y:my,radius:5,alpha:.8});
  let clickedFish=null;
  if(S.pondFish) for(let i=S.pondFish.length-1;i>=0;i--){
    const f=S.pondFish[i],def=FISH_DB[f.fishId];if(!def) continue;
    if((mx-f.x)**2+(my-f.y)**2<(def.baseSize*(1+f.lv*.1))**2*.5){clickedFish=f;break;}
  }
  let clickedEgg=-1;
  if(!clickedFish&&S.fishEggs){const sandBaseY=_fpH-15;S.fishEggs.forEach((egg,i)=>{
    const ex=egg._x?egg._x*_fpW:(0.2+i*0.2)*_fpW;if(Math.abs(mx-ex)<15&&Math.abs(my-(sandBaseY-12))<20) clickedEgg=i;});}
  if(clickedFish){_fpSelectedFish=clickedFish.uid;_fpSelectedEgg=null;_spawnSpeech(clickedFish);_showFishInfoCard(clickedFish);}
  else if(clickedEgg>=0){_fpSelectedEgg=clickedEgg;_fpSelectedFish=null;_showEggInfoCard(clickedEgg);}
  else{_fpSelectedFish=null;_fpSelectedEgg=null;_hideInfoCard();}
}

// ─── 十三、信息卡片（鱼）──────────────────────────────────────
function _showFishInfoCard(fish){
  const def=FISH_DB[fish.fishId];if(!def) return;
  const mood=_getFishMood(fish);
  const moodTxt=mood==='happy'?'😊开心':mood==='sad'?'😢不开心':'😐普通';
  const hw=fish.hunger<30;
  const panel=document.getElementById('fp-info-card');if(!panel) return;
  panel.innerHTML=`<div class="fi-card">
    <div class="fi-preview"><canvas id="fi-prev-cvs" width="76" height="76"></canvas></div>
    <div class="fi-body">
      <div class="fi-top"><span class="fi-name">${fish.nickname||def.name}</span><span class="fi-tag" style="background:${RARITY_COLOR[def.rarity]}22;color:${RARITY_COLOR[def.rarity]}">${RARITY_LABEL[def.rarity]}</span></div>
      <div class="fi-sub">Lv.${fish.lv}/${def.maxLv} · 成长 ${Math.round(fish.growth)}%</div>
      <div class="fi-stats"><span class="fi-st">${moodTxt}</span><span class="fi-st ${hw?'warn':''}">${hw?'🔴':'🟢'}${_getHungerLabel(fish.hunger)}</span><span class="fi-st">⚡${def.speed.toFixed(1)}</span></div>
      <div class="fi-bar"><div class="fi-bar-fill" style="width:${fish.growth}%;background:${RARITY_COLOR[def.rarity]}"></div></div>
    </div>
    <div class="fi-btns">
      <button class="fi-btn accent" onclick="_feedFish('${fish.uid}')">🍞喂</button>
      <button class="fi-btn" onclick="_openRenameModal('${fish.uid}')">✏️名</button>
      <button class="fi-btn danger" onclick="_releaseFish('${fish.uid}')">🔓放</button>
    </div></div>`;
  panel.style.display='block';
  setTimeout(()=>{const cvs=document.getElementById('fi-prev-cvs');if(!cvs) return;
    const c2=cvs.getContext('2d');c2.clearRect(0,0,76,76);
    renderFishByCode(c2,{...fish,_phase:0},38,38,def.baseSize*1.1,0,false,mood);},30);
}

// ─── 十四、信息卡片（蛋）──────────────────────────────────────
function _showEggInfoCard(idx){
  const egg=S.fishEggs[idx];if(!egg) return;
  const def=FISH_DB[egg.fishId]||{};const progress=Math.min(100,Math.round(egg.progress));
  const stage=progress<30?'🥚 刚产下':progress<60?'🐣 开始发育':progress<90?'💫 快要孵化':'✨ 即将破壳！';
  const rc=RARITY_COLOR[def.rarity||'common'];
  const panel=document.getElementById('fp-info-card');if(!panel) return;
  panel.innerHTML=`<div class="fi-card">
    <div class="fi-preview" style="background:linear-gradient(135deg,${rc}15,${rc}08)"><canvas id="fi-egg-cvs" width="76" height="76"></canvas></div>
    <div class="fi-body">
      <div class="fi-top"><span class="fi-name">${def.name||'???'}的蛋</span><span class="fi-tag" style="background:${rc}22;color:${rc}">${RARITY_LABEL[def.rarity||'common']}</span></div>
      <div class="fi-sub">${stage} · 孵化进度 ${progress}%</div>
      <div class="fi-stats"><span class="fi-st">🕐 答题可加速</span><span class="fi-st">⏳ 自动孵化中</span></div>
      <div class="fi-bar"><div class="fi-bar-fill" style="width:${progress}%;background:${rc}"></div></div>
    </div>
    <div class="fi-btns"><button class="fi-btn accent" onclick="_accelerateEgg(${idx})">⚡加速</button></div>
  </div>`;
  panel.style.display='block';
  setTimeout(()=>{const cvs=document.getElementById('fi-egg-cvs');if(!cvs) return;
    const c2=cvs.getContext('2d');c2.clearRect(0,0,76,76);_drawEggPreview(c2,38,38,egg,def);},30);
}

function _drawEggPreview(ctx,cx,cy,egg,def){
  const progress=Math.min(1,egg.progress/100),rc=RARITY_COLOR[def.rarity||'common'];
  const eH=22,eW=15;ctx.save();ctx.translate(cx,cy);
  ctx.fillStyle='rgba(0,0,0,.08)';ctx.beginPath();ctx.ellipse(0,eH+4,12,4,0,0,Math.PI*2);ctx.fill();
  if(progress<.3) ctx.fillStyle='#FAFAF5';
  else if(progress<.6){const g=ctx.createLinearGradient(0,-eH,0,eH);g.addColorStop(0,'#FAFAF5');g.addColorStop(1,rc+'55');ctx.fillStyle=g;}
  else{ctx.fillStyle=rc+'cc';if(progress>=.9){ctx.shadowColor=rc;ctx.shadowBlur=10;}}
  ctx.beginPath();ctx.moveTo(0,-eH);ctx.bezierCurveTo(eW,-eH*.6,eW,eH*.4,0,eH);ctx.bezierCurveTo(-eW,eH*.4,-eW,-eH*.6,0,-eH);ctx.closePath();ctx.fill();ctx.shadowBlur=0;
  ctx.fillStyle='rgba(255,255,255,.3)';ctx.beginPath();ctx.ellipse(-3,-6,5,8,-.3,0,Math.PI*2);ctx.fill();
  if(progress>=.6){ctx.strokeStyle='rgba(80,60,40,.35)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-3,-5);ctx.lineTo(1,2);ctx.lineTo(-2,8);ctx.stroke();}
  ctx.restore();
}

function _hideInfoCard(){const p=document.getElementById('fp-info-card');if(p) p.style.display='none';}

// ─── 十五、自定义改名弹窗 ───────────────────────────────────────
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
  const inp=document.getElementById('fp-rename-input'),val=(inp?inp.value:'').trim().slice(0,8);
  fish.nickname=val;persistAccount();_closeRenameModal();_showFishInfoCard(fish);
  showToast(val?`✏️ 昵称改为「${val}」`:'✏️ 已恢复原名');
}
function _closeRenameModal(){const m=document.getElementById('fp-rename-mask');if(m) m.remove();}

// ─── 十六、鱼类管理 ─────────────────────────────────────────────
function _addFishToPlayer(fishId){
  const def=FISH_DB[fishId];if(!def) return;
  const uid='fish_'+Date.now()+'_'+Math.random().toString(36).slice(2,6);
  const fish={uid,fishId,lv:1,growth:0,mood:'normal',hunger:80,
    x:50+Math.random()*(Math.max(200,_fpW)-100),y:60+Math.random()*(Math.max(180,_fpH-80)),
    vx:(Math.random()-.5)*2,vy:(Math.random()-.5),nickname:'',obtainedAt:Date.now(),
    _phase:Math.random()*Math.PI*2,_state:'swim',_stateTimer:3000};
  S.pondFish.push(fish);const isNew=!S.fishAlmanac.includes(fishId);
  if(isNew) S.fishAlmanac.push(fishId);S.totalFishCaught=(S.totalFishCaught||0)+1;
  if(isNew){S.score=(S.score||0)+({common:5,rare:15,epic:30,legendary:60}[def.rarity]||5);}
  persistAccount();if(typeof checkAchs==='function') checkAchs();if(typeof updateTop==='function') updateTop();return fish;
}
function _addFishEgg(fishId){if(!S.fishEggs) S.fishEggs=[];S.fishEggs.push({fishId,progress:0,startTime:Date.now(),_x:.12+Math.random()*.7,_wobble:Math.random()*Math.PI*2});persistAccount();}
function _checkEggHatch(){
  if(!S.fishEggs||S.fishEggs.length===0) return;const now=Date.now();const toH=[];
  S.fishEggs=S.fishEggs.filter(egg=>{egg.progress+=(now-(egg._lastCheck||egg.startTime))/60000;egg._lastCheck=now;
    if(egg.progress>=100){toH.push(egg.fishId);return false;}return true;});
  toH.forEach(fid=>{_addFishToPlayer(fid);const d=FISH_DB[fid];if(d&&typeof showToast==='function') showToast(`🐣 ${d.name}孵化成功！`);if(typeof spawnP==='function') spawnP(['🐣','✨','🐟']);});
  if(toH.length>0){_assignEggPositions();renderFishPondUI();}
}
function _feedFish(uid){
  const fish=S.pondFish.find(f=>f.uid===uid);if(!fish||typeof openQuiz!=='function') return;
  openQuiz({title:'🍞 喂鱼 — 答题喂食',needed:1,onSuccess:()=>{
    fish.hunger=Math.min(100,fish.hunger+30);fish.growth=Math.min(100,fish.growth+5);fish.mood='happy';
    S.coins=(S.coins||0)+3;S.totalCoins=(S.totalCoins||0)+3;S.score=(S.score||0)+2;
    if(typeof gainExp==='function') gainExp(8);_checkFishLevelUp(fish);persistAccount();
    if(typeof updateTop==='function') updateTop();_showFishInfoCard(fish);
    showToast(`🍞 ${FISH_DB[fish.fishId].name}吃饱了！金币+3`);}});
}
function _releaseFish(uid){
  const fish=S.pondFish.find(f=>f.uid===uid);if(!fish) return;const def=FISH_DB[fish.fishId];
  if(typeof openConfirm==='function') openConfirm('🔓',`确定放生${fish.nickname||def.name}？\n获得 ${fish.lv*5}鱼币 + ${fish.lv*3}金币`,()=>{
    S.pondFish=S.pondFish.filter(f=>f.uid!==uid);S.fishCoins=(S.fishCoins||0)+fish.lv*5;S.coins=(S.coins||0)+fish.lv*3;S.totalCoins=(S.totalCoins||0)+fish.lv*3;S.score=(S.score||0)+fish.lv*2;
    persistAccount();if(typeof updateTop==='function') updateTop();_hideInfoCard();renderFishPondUI();
    showToast(`🔓 ${def.name}游走了，+${fish.lv*5}鱼币 +${fish.lv*3}金币`);});
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

// ─── 十七、钓鱼小游戏 ───────────────────────────────────────────
function startFishing(){_fpMode='fishing';_fishingState='idle';_fishingTimer=0;_fishingTarget=null;_fishingRodX=(_fpW||400)*.5;_fishingBobY=0;_fishingLineEndY=0;_fishingBiteAt=0;renderFishingUI();}
function stopFishing(){_fpMode='pond';if(_fpCanvas) _fpCanvas.removeEventListener('click',_onFishingClick);renderFishPondUI();}
function _onFishingClick(e){const r=_fpCanvas.getBoundingClientRect();const mx=(e.clientX-r.left)*(_fpW/r.width);
  if(_fishingState==='idle'){_fishingState='cast';_fishingTimer=0;_fishingRodX=mx;_fishingBobY=60;_fishingLineEndY=60;}
  else if(_fishingState==='bite'){_fishingState='reel';_triggerFishingQuiz();}}
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
  else if(_fishingState==='reel') ctx.fillText('答题中...',_fpW/2,30);ctx.shadowBlur=0;ctx.textAlign='left';}
function _rollFishDrop(){const lv=S.fishingRodLevel||1;const w={common:60-lv*3,rare:25+lv,epic:12+lv,legendary:3+lv*.5};const tot=w.common+w.rare+w.epic+w.legendary;let r=Math.random()*tot,t;
  if(r<w.common)t='common';else if(r<w.common+w.rare)t='rare';else if(r<w.common+w.rare+w.epic)t='epic';else t='legendary';
  const pool=FISH_IDS.filter(id=>FISH_DB[id].rarity===t);return pool[Math.floor(Math.random()*pool.length)]||'goldfish';}
function _triggerFishingQuiz(){if(typeof openQuiz!=='function') return;const need=_fishingTarget&&FISH_DB[_fishingTarget]&&(FISH_DB[_fishingTarget].rarity==='epic'||FISH_DB[_fishingTarget].rarity==='legendary')?2:1;
  openQuiz({title:'🎣 钓鱼挑战！',needed:need,onSuccess:()=>{const fid=_fishingTarget||'goldfish';const def=FISH_DB[fid];_addFishToPlayer(fid);_fishingState='idle';_fishingTarget=null;
    const cr={common:5,rare:12,epic:25,legendary:50}[def.rarity]||5,sr={common:3,rare:8,epic:15,legendary:30}[def.rarity]||3;
    S.coins=(S.coins||0)+cr;S.totalCoins=(S.totalCoins||0)+cr;S.score=(S.score||0)+sr;if(typeof gainExp==='function') gainExp(cr);persistAccount();if(typeof updateTop==='function') updateTop();renderFishPondUI();
    if(typeof showResult==='function') showResult(def.icon,'🎉 钓到了！',`${def.name} [${RARITY_LABEL[def.rarity]}]\n金币+${cr} · 积分+${sr}`);if(typeof spawnP==='function') spawnP(['🐟','🎣','✨','🌊']);},
    onFail:()=>{_fishingState='idle';_fishingTarget=null;showToast('😢 答错了，鱼跑了！');}});}

// ─── 十八、图鉴 ─────────────────────────────────────────────────
function openFishAlmanac(){_fpMode='almanac';const p=document.getElementById('fishpond-main');if(!p) return;
  let h='<div class="fa-wrap"><div class="fa-header"><span class="fa-title">📖 鱼类图鉴</span><span class="fa-progress">'+(S.fishAlmanac||[]).length+'/'+FISH_IDS.length+'</span><button class="fa-back" onclick="closeFishAlmanac()">← 返回</button></div><div class="fa-grid">';
  FISH_IDS.forEach(fid=>{const def=FISH_DB[fid];const dis=(S.fishAlmanac||[]).includes(fid);const own=(S.pondFish||[]).filter(f=>f.fishId===fid);const ml=own.length?Math.max(...own.map(f=>f.lv)):0;
    h+='<div class="fa-card '+(dis?'':'fa-locked')+'" style="border-color:'+(dis?RARITY_COLOR[def.rarity]:'#666')+'">';
    if(dis) h+='<div class="fa-icon">'+def.icon+'</div><div class="fa-name">'+def.name+'</div><div class="fa-rarity" style="color:'+RARITY_COLOR[def.rarity]+'">'+RARITY_LABEL[def.rarity]+'</div><div class="fa-owned">×'+own.length+(ml>0?' Lv.'+ml:'')+'</div>';
    else h+='<div class="fa-icon">❓</div><div class="fa-name">未发现</div><div class="fa-rarity">'+def.unlockDesc+'</div>';
    h+='</div>';});h+='</div></div>';p.innerHTML=h;}
function closeFishAlmanac(){_fpMode='pond';renderFishPondUI();}

// ─── 十九、页面UI ───────────────────────────────────────────────
function renderFishPondUI(){
  const main=document.getElementById('fishpond-main');if(!main) return;
  const fc=(S.pondFish||[]).length,ec=(S.fishEggs||[]).length,ac=(S.fishAlmanac||[]).length;
  main.innerHTML=`<div class="fp-container">
    <div class="fp-canvas-wrap"><canvas id="fishpond-canvas"></canvas></div>
    <div id="fp-info-card" style="display:none"></div>
    <div class="fp-stats-bar"><span class="fp-stat">🐟 ${fc}条</span><span class="fp-stat">🥚 ${ec}孵化中</span><span class="fp-stat">📖 ${ac}/${FISH_IDS.length}</span><span class="fp-stat">🪙 ${S.fishCoins||0}鱼币</span></div>
    <div class="fp-actions">
      <div class="fp-act" onclick="startFishing()"><span class="fp-act-ico">🎣</span><div class="fp-act-nm">去钓鱼</div><div class="fp-act-desc">答题钓鱼</div></div>
      <div class="fp-act" onclick="openFishAlmanac()"><span class="fp-act-ico">📖</span><div class="fp-act-nm">图鉴</div><div class="fp-act-desc">${ac}/${FISH_IDS.length}</div></div>
      <div class="fp-act" onclick="_feedAllFish()"><span class="fp-act-ico">🍞</span><div class="fp-act-nm">喂食</div><div class="fp-act-desc">答题喂全部</div></div>
      <div class="fp-act" onclick="_collectEgg()"><span class="fp-act-ico">🥚</span><div class="fp-act-nm">获取鱼卵</div><div class="fp-act-desc">答题产卵</div></div>
    </div></div>`;
  _fpCanvas=document.getElementById('fishpond-canvas');
  if(_fpCanvas){_fpCtx=_fpCanvas.getContext('2d');_resizeFishPond();
    _fpCanvas.addEventListener('click',_onPondClick);_fpCanvas.addEventListener('touchstart',_onPondTouch,{passive:false});
    window.removeEventListener('resize',_resizeFishPond);window.addEventListener('resize',_resizeFishPond);
    if(S.pondFish) S.pondFish.forEach(f=>{
      if(!f.x||f.x<30||f.x>_fpW-30) f.x=50+Math.random()*(Math.max(200,_fpW)-100);
      if(!f.y||f.y<40||f.y>_fpH-60) f.y=60+Math.random()*(Math.max(150,_fpH)-120);
      if(!f._phase) f._phase=Math.random()*Math.PI*2;if(!f._state) f._state='swim';if(!f._stateTimer) f._stateTimer=3000;
      if(f.vx===undefined) f.vx=(Math.random()-.5)*2;if(f.vy===undefined) f.vy=(Math.random()-.5);});
    if(!_fpAF) _startFishPondLoop();setTimeout(()=>_resizeFishPond(),50);setTimeout(()=>_resizeFishPond(),300);}
}
function renderFishingUI(){const main=document.getElementById('fishpond-main');if(!main) return;
  main.innerHTML=`<div class="fp-container"><div class="fp-canvas-wrap"><canvas id="fishpond-canvas"></canvas></div>
    <div class="fp-actions"><div class="fp-act" onclick="stopFishing()" style="background:rgba(255,80,80,.1);border-color:rgba(255,80,80,.3)"><span class="fp-act-ico">🔙</span><div class="fp-act-nm">返回鱼塘</div></div></div></div>`;
  _fpCanvas=document.getElementById('fishpond-canvas');
  if(_fpCanvas){_fpCtx=_fpCanvas.getContext('2d');_resizeFishPond();_fpCanvas.addEventListener('click',_onFishingClick);
    _fpCanvas.addEventListener('touchstart',e=>{if(e.touches.length===1)_onFishingClick({clientX:e.touches[0].clientX,clientY:e.touches[0].clientY});},{passive:true});
    if(!_fpAF) _startFishPondLoop();setTimeout(()=>_resizeFishPond(),50);setTimeout(()=>_resizeFishPond(),300);}
}

// ─── 二十、学习行为绑定 ─────────────────────────────────────────
function _collectEgg(){if(typeof openQuiz!=='function') return;
  openQuiz({title:'🥚 答题获取鱼卵',needed:3,onSuccess:()=>{const pool=FISH_IDS.filter(id=>FISH_DB[id].rarity!=='legendary');const fid=pool[Math.floor(Math.random()*pool.length)];
    _addFishEgg(fid);_assignEggPositions();const def=FISH_DB[fid];S.coins=(S.coins||0)+10;S.totalCoins=(S.totalCoins||0)+10;S.score=(S.score||0)+5;
    if(typeof gainExp==='function') gainExp(15);persistAccount();if(typeof updateTop==='function') updateTop();
    showToast(`🥚 获得${def.name}的鱼卵！金币+10`);if(typeof spawnP==='function') spawnP(['🥚','✨','🐟']);renderFishPondUI();}});}
function _feedAllFish(){if(!S.pondFish||S.pondFish.length===0){showToast('鱼塘里还没有鱼哦~');return;}if(typeof openQuiz!=='function') return;const cnt=S.pondFish.length;
  openQuiz({title:'🍞 喂食全部鱼',needed:1,onSuccess:()=>{S.pondFish.forEach(f=>{f.hunger=Math.min(100,f.hunger+20);f.growth=Math.min(100,f.growth+3);f.mood='happy';_checkFishLevelUp(f);});
    const cr=cnt*2;S.coins=(S.coins||0)+cr;S.totalCoins=(S.totalCoins||0)+cr;S.score=(S.score||0)+cnt;if(typeof gainExp==='function') gainExp(5+cnt*2);persistAccount();if(typeof updateTop==='function') updateTop();renderFishPondUI();showToast(`🍞 全部吃饱！金币+${cr}`);}});}

window.onQuizCorrectForFish=function(){if(!S.pondFish||S.pondFish.length===0) return;
  const f=S.pondFish[Math.floor(Math.random()*S.pondFish.length)];f.growth=Math.min(100,f.growth+2);f.hunger=Math.max(0,f.hunger-1);_checkFishLevelUp(f);
  if(S.fishEggs) S.fishEggs.forEach(e=>{e.progress=Math.min(100,e.progress+3);});};
window.onQuizStreakForFish=function(streak){if(streak>=5&&(!S.fishAlmanac||!S.fishAlmanac.includes('goldfish'))&&!S.pondFish.some(f=>f.fishId==='goldfish')){_addFishToPlayer('goldfish');showToast('🎉 连续答对5题！解锁小金鱼！');}
  if(streak>=10){_addFishEgg(_rollFishDrop());_assignEggPositions();showToast('🔥 连击10！获得神秘鱼卵！');}};

// ─── 二十一、工具函数 ───────────────────────────────────────────
function _getFishMood(f){if(!f) return 'normal';if(f.mood==='happy') return 'happy';if(f.hunger<30) return 'sad';const now=Date.now(),last=S.lastSaveTime||now;if(now-last>24*3600000) return 'sad';return 'normal';}
function _getHungerLabel(h){return h>70?'饱足':h>40?'一般':'饥饿';}
function _desaturate(hex,a){const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16),gr=(r+g+b)/3;return `rgb(${Math.round(r+(gr-r)*a)},${Math.round(g+(gr-g)*a)},${Math.round(b+(gr-b)*a)})`;}
function _lighten(hex,a){let r,g,b;if(hex.startsWith('#')){r=parseInt(hex.slice(1,3),16);g=parseInt(hex.slice(3,5),16);b=parseInt(hex.slice(5,7),16);}else if(hex.startsWith('rgb')){[r,g,b]=hex.match(/\d+/g).map(Number);}else return hex;return `rgb(${Math.min(255,Math.round(r+(255-r)*a))},${Math.min(255,Math.round(g+(255-g)*a))},${Math.min(255,Math.round(b+(255-b)*a))})`;}

// ─── 二十二、鱼塘成就 ──────────────────────────────────────────
window.FISH_ACHS=[
  {id:'fish_first',ico:'🐟',nm:'第一条鱼',desc:'获得第一条鱼',cond:s=>(s.totalFishCaught||0)>=1,reward:{coins:20,score:10}},
  {id:'fish_5',ico:'🎣',nm:'小渔夫',desc:'累计获得5条鱼',cond:s=>(s.totalFishCaught||0)>=5,reward:{coins:40,score:20}},
  {id:'fish_15',ico:'🐳',nm:'捕鱼达人',desc:'累计获得15条鱼',cond:s=>(s.totalFishCaught||0)>=15,reward:{coins:80,score:40}},
  {id:'fish_almanac5',ico:'📖',nm:'图鉴初学者',desc:'发现5种鱼',cond:s=>(s.fishAlmanac||[]).length>=5,reward:{coins:60,score:30}},
  {id:'fish_almanac_all',ico:'🏆',nm:'图鉴大师',desc:'发现全部鱼种',cond:s=>(s.fishAlmanac||[]).length>=FISH_IDS.length,reward:{coins:300,score:150}},
];
if(window.ACHS&&Array.isArray(ACHS)) FISH_ACHS.forEach(fa=>{if(!ACHS.some(a=>a.id===fa.id))ACHS.push(fa);});

console.log('🐟 知识鱼塘系统加载完成 v2.0');
