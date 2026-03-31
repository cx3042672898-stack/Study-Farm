// ══════════════════════════════════════════════════════════════
//  game.js  v6.1
// ══════════════════════════════════════════════════════════════

const ACCOUNTS_KEY='jbfarm_accounts_v5';
const CLASS_KEY='jbfarm_class_v5';
const OLD_KEYS=['jiaobian_farm_v4','jiaobian_farm_v3','jiaobian_v5'];

let CURRENT_ACC_ID=null;
window.ACTIVE_SUBJECT_ID=localStorage.getItem('jbfarm_subject')||'teacher';
let S={};
let petWalking=false; // 默认立正

// ─── 缩放 ────────────────────────────────────────
let currentZoom=1;
function zoomPage(d){currentZoom=Math.max(0.6,Math.min(1.5,currentZoom+d));document.body.style.zoom=currentZoom;document.querySelector('#zoom-ctrl .zoom-btn:nth-child(2)').textContent=Math.round(currentZoom*100)+'%';}
function zoomReset(){currentZoom=1;document.body.style.zoom=1;document.querySelector('#zoom-ctrl .zoom-btn:nth-child(2)').textContent='100%';}

// ─── 账号管理 ────────────────────────────────────
function getAllAccounts(){try{return JSON.parse(localStorage.getItem(ACCOUNTS_KEY)||'[]');}catch(e){return [];}}
function saveAllAccounts(l){try{localStorage.setItem(ACCOUNTS_KEY,JSON.stringify(l));}catch(e){}}
function getAccKey(id){return 'jbfarm_save_'+id;}

function loadAccSave(id){
  try{
    const raw=localStorage.getItem(getAccKey(id));
    if(raw){
      const s=Object.assign({},DEFAULT_SAVE,JSON.parse(raw));
      Object.keys(DEFAULT_SAVE).forEach(k=>{if(s[k]===undefined)s[k]=JSON.parse(JSON.stringify(DEFAULT_SAVE[k]));});
      if(!s.seedBag||typeof s.seedBag!=='object')s.seedBag={...DEFAULT_SAVE.seedBag};
      if(!Array.isArray(s.plots)||s.plots.length<8)s.plots=DEFAULT_SAVE.plots.map(p=>({...p}));
      s.plots.forEach(p=>{if(p.lastWater===undefined)p.lastWater=Date.now();if(p.hasBug===undefined)p.hasBug=false;if(p.hasCrack===undefined)p.hasCrack=false;if(p.unlockProgress===undefined)p.unlockProgress=0;});
      if(!Array.isArray(s.unlockedAch))s.unlockedAch=[];
      if(!Array.isArray(s.newAch))s.newAch=[];
      if(!Array.isArray(s.ownedClothes))s.ownedClothes=[];
      if(!Array.isArray(s.ownedPets))s.ownedPets=['p_hamster'];
      if(!Array.isArray(s.unlockedSeeds))s.unlockedSeeds=['wheat','sunflower','strawberry'];
      if(!s.catCorrect)s.catCorrect={...DEFAULT_SAVE.catCorrect};
      if(!s.petSaves)s.petSaves={p_hamster:null};
      if(s.pestStock===undefined)s.pestStock=0;
      if(s.coinGiftBought===undefined)s.coinGiftBought=0;
      if(s.dragCount===undefined)s.dragCount=0;
      if(s.hasAutoPest===undefined)s.hasAutoPest=false;
      return s;
    }
  }catch(e){}
  return JSON.parse(JSON.stringify(DEFAULT_SAVE));
}

function persistAccount(){
  if(!CURRENT_ACC_ID)return;
  S.lastSaveTime=Date.now();
  try{localStorage.setItem(getAccKey(CURRENT_ACC_ID),JSON.stringify(S));}catch(e){}
  updateAccountMeta();syncClassScore();
}
function updateAccountMeta(){
  if(!CURRENT_ACC_ID)return;
  const list=getAllAccounts();const acc=list.find(a=>a.id===CURRENT_ACC_ID);
  if(acc){acc.level=S.level;acc.score=S.score;acc.lastActive=Date.now();saveAllAccounts(list);}
}
function confirmReset(){
  openConfirm('⚠️','确定要重置当前账号的所有进度吗？\n此操作无法撤销！',()=>{
    const fresh=JSON.parse(JSON.stringify(DEFAULT_SAVE));
    fresh.playerName=S.playerName;fresh.classId=S.classId;
    S=fresh;persistAccount();initGame();showToast('✅ 当前账号已重置');
  },true);
}

// ─── 登录界面 ─────────────────────────────────────
function renderLoginScreen(){
  const bar=document.getElementById('ls-subject-bar');
  if(bar){bar.innerHTML='';SUBJECTS.forEach(sub=>{const b=document.createElement('div');b.className='ls-sub-btn'+(sub.id===ACTIVE_SUBJECT_ID?' on':'');if(sub.id===ACTIVE_SUBJECT_ID)b.style.background=sub.color||'#5a9a5a';b.textContent=sub.icon+' '+sub.name;b.onclick=()=>{setSubject(sub.id);renderLoginScreen();};bar.appendChild(b);});}
  const listEl=document.getElementById('account-list');listEl.innerHTML='';
  let accounts=getAllAccounts();
  if(accounts.length===0){for(const k of OLD_KEYS){const old=localStorage.getItem(k);if(old){try{const od=JSON.parse(old);const nid='acc_migrated_'+Date.now();const na={id:nid,name:od.playerName||'老玩家',pin:'',classId:od.classId||'',level:od.level||1,score:od.score||0,lastActive:Date.now()};accounts=[na];saveAllAccounts(accounts);localStorage.setItem(getAccKey(nid),JSON.stringify(Object.assign({},DEFAULT_SAVE,od)));showToast('✅ 旧存档已自动迁移！');break;}catch(e){}}};}
  if(accounts.length===0){listEl.innerHTML='<div style="font-size:.78rem;color:var(--muted);text-align:center;padding:18px 0">还没有账号，点击下方新建！</div>';}
  accounts.forEach(acc=>{const d=document.createElement('div');d.className='acc-card';const ico=acc.level>=5?'🌟':acc.level>=3?'⭐':'🌾';d.innerHTML=`<div class="acc-avatar">${ico}</div><div class="acc-info"><div class="acc-name">${acc.name}</div><div class="acc-meta">Lv.${acc.level||1} · ⭐${acc.score||0}分${acc.classId?' · '+acc.classId:''}</div></div><div class="acc-arrow">${acc.pin?'🔒':'▶'}</div>`;d.onclick=()=>loginAcc(acc);listEl.appendChild(d);});
}
function loginAcc(acc){if(acc.pin){openPinPad(acc.name,entered=>{if(entered===acc.pin){doEnterAcc(acc.id);return true;}showToast('密码错误！');return false;});}else{doEnterAcc(acc.id);}}
function doEnterAcc(id){CURRENT_ACC_ID=id;S=loadAccSave(id);processTimePass();document.getElementById('login-screen').style.display='none';document.getElementById('app').classList.add('active');initGame();}
function goToLogin(){if(CURRENT_ACC_ID)persistAccount();CURRENT_ACC_ID=null;if(petAF){cancelAnimationFrame(petAF);petAF=null;}document.getElementById('app').classList.remove('active');document.getElementById('login-screen').style.display='flex';renderLoginScreen();}

// PIN PAD
let pinInput='',pinCb=null;
function openPinPad(name,cb){pinInput='';pinCb=cb;const ne=document.getElementById('pin-acc-name');if(ne)ne.textContent=name;buildPinDots('pin-dots');buildNumpad('numpad',false);document.getElementById('pin-ov').classList.add('on');}
function buildPinDots(id){const d=document.getElementById(id);if(!d)return;d.innerHTML='';for(let i=0;i<4;i++){const dot=document.createElement('div');dot.className='pin-dot'+(i<pinInput.length?' filled':'');d.appendChild(dot);}}
function buildNumpad(containerId,isSetPin){
  const np=document.getElementById(containerId);if(!np)return;np.innerHTML='';
  [1,2,3,4,5,6,7,8,9,'',0,'⌫'].forEach(k=>{
    const b=document.createElement('div');b.className='npbtn'+(k==='⌫'?' del':'');b.textContent=String(k);
    if(k===''){b.style.visibility='hidden';np.appendChild(b);return;}
    b.onclick=()=>{
      if(isSetPin){
        if(k==='⌫'){setpinInput=setpinInput.slice(0,-1);}else if(setpinInput.length<4){setpinInput+=String(k);}
        buildPinDots('setpin-dots');
        if(setpinInput.length===4)finishSetPin();
      } else {
        if(k==='⌫'){pinInput=pinInput.slice(0,-1);}else if(pinInput.length<4){pinInput+=String(k);}
        buildPinDots('pin-dots');
        if(pinInput.length===4){const ok=pinCb(pinInput);if(ok){document.getElementById('pin-ov').classList.remove('on');pinInput='';}else{setTimeout(()=>{pinInput='';buildPinDots('pin-dots');},400);}}
      }
    };np.appendChild(b);
  });
}

// 设置密码
let setpinInput='',setpinPhase=0;
function openSetPin(){
  setpinInput='';setpinPhase=1;
  document.getElementById('setpin-hint').textContent='请输入新密码（4位数字）';
  buildPinDots('setpin-dots');buildNumpad('setpin-numpad',true);
  document.getElementById('setpin-ov').classList.add('on');
}
let _firstPin='';
function finishSetPin(){
  if(setpinPhase===1){_firstPin=setpinInput;setpinPhase=2;setpinInput='';buildPinDots('setpin-dots');document.getElementById('setpin-hint').textContent='再次输入确认密码';}
  else if(setpinPhase===2){
    if(setpinInput!==_firstPin){showToast('两次输入不一致！重新输入');setpinPhase=1;setpinInput='';buildPinDots('setpin-dots');document.getElementById('setpin-hint').textContent='请输入新密码（4位数字）';return;}
    const list=getAllAccounts();const acc=list.find(a=>a.id===CURRENT_ACC_ID);
    if(acc){acc.pin=setpinInput;saveAllAccounts(list);}
    document.getElementById('setpin-ov').classList.remove('on');setpinInput='';
    showToast('✅ 密码设置成功！');renderAccountSettings();
  }
}
function removePin(){
  openConfirm('🔓','确定要移除账号密码吗？',()=>{
    const list=getAllAccounts();const acc=list.find(a=>a.id===CURRENT_ACC_ID);
    if(acc){acc.pin='';saveAllAccounts(list);}showToast('✅ 密码已移除');renderAccountSettings();
  });
}
function renderAccountSettings(){
  const el=document.getElementById('account-settings');if(!el)return;
  const list=getAllAccounts();const acc=list.find(a=>a.id===CURRENT_ACC_ID);
  const hasPin=acc&&acc.pin;
  el.innerHTML=`<div style="font-size:.74rem;color:var(--muted);margin-bottom:8px;line-height:1.7">
    当前密码状态：<b style="color:${hasPin?'var(--dgreen)':'var(--muted)'}">${hasPin?'✓ 已设置':'未设置'}</b>
  </div>
  <div style="display:flex;gap:7px">
    <button onclick="openSetPin()" style="padding:7px 14px;border-radius:9px;border:1.5px solid var(--green);background:rgba(100,160,100,.08);color:var(--dgreen);font-size:.74rem;cursor:pointer;font-family:'Noto Sans SC',sans-serif">${hasPin?'修改密码':'设置密码'}</button>
    ${hasPin?`<button onclick="removePin()" style="padding:7px 14px;border-radius:9px;border:1.5px solid var(--border);background:transparent;font-size:.74rem;cursor:pointer;font-family:'Noto Sans SC',sans-serif">移除密码</button>`:''}
  </div>`;
}

function startCreateAccount(){['na-name','na-pin','na-class'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});document.getElementById('new-acc-ov').classList.add('on');setTimeout(()=>{const el=document.getElementById('na-name');if(el)el.focus();},200);}
function createAccount(){const name=(document.getElementById('na-name')?.value||'').trim();const pin=(document.getElementById('na-pin')?.value||'').trim();const cls=(document.getElementById('na-class')?.value||'').trim();if(!name){showToast('请输入姓名！');return;}if(pin&&!/^\d{4}$/.test(pin)){showToast('密码须为4位数字！');return;}const accounts=getAllAccounts();if(accounts.some(a=>a.name===name&&a.classId===cls)){showToast('该名字在此班级已存在！');return;}const id='acc_'+Date.now()+'_'+Math.random().toString(36).slice(2,6);accounts.push({id,name,pin:pin||'',classId:cls,level:1,score:0,lastActive:Date.now()});saveAllAccounts(accounts);const fresh=JSON.parse(JSON.stringify(DEFAULT_SAVE));fresh.playerName=name;fresh.classId=cls;localStorage.setItem(getAccKey(id),JSON.stringify(fresh));if(cls)joinClassBoard(cls,name,0);document.getElementById('new-acc-ov').classList.remove('on');showToast(`✅ 账号「${name}」创建成功！`);renderLoginScreen();}
function openImportClass(){['ic-class','ic-names'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});document.getElementById('import-class-ov').classList.add('on');}
function importClassList(){const cls=(document.getElementById('ic-class')?.value||'').trim();const raw=(document.getElementById('ic-names')?.value||'').trim();if(!cls){showToast('请输入班级名称！');return;}if(!raw){showToast('请输入名单！');return;}const lines=raw.split('\n').map(l=>l.trim()).filter(Boolean);const accounts=getAllAccounts();let created=0,skipped=0;lines.forEach(line=>{const parts=line.split(/[,，]/);const name=parts[0].trim();const pin=(parts[1]||'').trim();if(!name)return;if(accounts.some(a=>a.name===name&&a.classId===cls)){skipped++;return;}if(pin&&!/^\d{4}$/.test(pin)){skipped++;return;}const id='acc_'+Date.now()+'_'+Math.random().toString(36).slice(2,6)+created;accounts.push({id,name,pin:pin||'',classId:cls,level:1,score:0,lastActive:Date.now()});const fresh=JSON.parse(JSON.stringify(DEFAULT_SAVE));fresh.playerName=name;fresh.classId=cls;localStorage.setItem(getAccKey(id),JSON.stringify(fresh));joinClassBoard(cls,name,0);created++;});saveAllAccounts(accounts);document.getElementById('import-class-ov').classList.remove('on');showToast(`✅ 创建${created}个账号${skipped?'，'+skipped+'个已跳过':''}`);renderLoginScreen();}

// ─── 科目切换 ─────────────────────────────────────
function setSubject(id){window.ACTIVE_SUBJECT_ID=id;localStorage.setItem('jbfarm_subject',id);S.usedQ=[];renderSubjectBars();}
function renderSubjectBars(){
  const mb=document.getElementById('subject-bar-mobile');
  if(mb){mb.innerHTML='';SUBJECTS.forEach(sub=>{const b=document.createElement('div');b.className='sub-pill'+(sub.id===ACTIVE_SUBJECT_ID?' on':'');if(sub.id===ACTIVE_SUBJECT_ID)b.style.background=sub.color||'#5a9a5a';b.textContent=sub.icon+' '+sub.name;b.onclick=()=>setSubject(sub.id);mb.appendChild(b);});}
  const sb=document.getElementById('sb-subjects');
  if(sb){sb.innerHTML='';SUBJECTS.forEach(sub=>{const d=document.createElement('div');d.className='sb-sub-item'+(sub.id===ACTIVE_SUBJECT_ID?' on':'');d.innerHTML=`<div class="sb-sub-dot" style="${sub.id===ACTIVE_SUBJECT_ID?'background:'+sub.color:''}"></div>${sub.icon} ${sub.name}`;d.onclick=()=>setSubject(sub.id);sb.appendChild(d);});}
  const badge=document.getElementById('sub-badge');if(badge){const sub=getActiveSubject();badge.textContent=sub.icon+' '+sub.name;badge.style.background=sub.color||'#5a9a5a';}
}

// ─── 宠物行走开关 ─────────────────────────────────
function togglePetWalk(){
  petWalking=!petWalking;
  const tog=document.getElementById('walk-toggle'),ico=document.getElementById('walk-ico'),lbl=document.getElementById('walk-lbl');
  if(tog){tog.classList.toggle('on',petWalking);}
  if(ico)ico.textContent=petWalking?'🚶':'🧍';
  if(lbl)lbl.textContent=petWalking?'行走模式':'立正模式';
  if(!petWalking){petX=75;petY=76;}
}

// ─── 时间处理 ─────────────────────────────────────
function processTimePass(){
  const now=Date.now();const last=S.lastSaveTime||now;
  const hoursGone=Math.min((now-last)/3600000,24);
  if(hoursGone<0.05){S.lastSaveTime=now;return;}
  S.plots.forEach((p,i)=>{
    if(!['s0','s1','s2'].includes(p.s))return;
    const sd=SEEDS[p.seed||'wheat'];const autoH=sd.autoGrowH||3;
    const noWH=(now-(p.lastWater||last))/3600000;
    if(noWH>autoH*1.5&&!p.hasCrack)p.hasCrack=true;
    if(!p.hasBug&&Math.random()<sd.bugChance*hoursGone)p.hasBug=true;
    if(p.hasCrack||p.hasBug)return;
    growPlot(i,Math.min(hoursGone*(100/(autoH*4)),35));
  });
  if(S.hasAutoWater){const wc=Math.floor(hoursGone/2);if(wc>0){S.plots.forEach((p,i)=>{if(['s0','s1','s2'].includes(p.s)&&!p.hasCrack&&!p.hasBug){p.lastWater=now;growPlot(i,Math.min(wc*30,90));}});}}
  if(S.hasAutoPest){S.plots.forEach(p=>{p.hasBug=false;});}
  const dh=Math.min(hoursGone,8);
  S.petFood=Math.max(0,S.petFood-dh*4);S.petHappy=Math.max(0,S.petHappy-dh*2);
  S.petClean=Math.max(0,S.petClean-dh*1.5);S.petEnergy=Math.max(0,S.petEnergy-dh);
  S.lastSaveTime=now;
}

// ─── QUIZ ENGINE ──────────────────────────────────
let QZ=null,curQ=null,qAnswered=false;
function getQ(){const pool=getActiveQuestions();if(!pool||!pool.length)return QB&&QB[0]||{c:'基础',q:'加载中...',o:['A','B','C','D'],a:0,e:''};let av=pool.map((_,i)=>i).filter(i=>!S.usedQ.includes(i));if(av.length<5){S.usedQ=[];av=pool.map((_,i)=>i);}const idx=av[Math.floor(Math.random()*av.length)];S.usedQ.push(idx);if(S.usedQ.length>pool.length-3)S.usedQ=S.usedQ.slice(-15);return pool[idx];}
function openQuiz(cfg){QZ={...cfg,done:0,correct:0};qAnswered=false;const sub=getActiveSubject();const badge=document.getElementById('sub-badge');if(badge){badge.textContent=sub.icon+' '+sub.name;badge.style.background=sub.color||'#5a9a5a';}document.getElementById('quiz-ov').classList.add('on');loadNextQ();}
function loadNextQ(){curQ=getQ();qAnswered=false;document.getElementById('qcat').textContent=curQ.c;document.getElementById('qcat').className='qcat ct-'+curQ.c;document.getElementById('qtxt').textContent=curQ.q;document.getElementById('explain').classList.remove('on');document.getElementById('mb-next').classList.remove('on');document.getElementById('qprog').textContent=`已答对 ${QZ.correct}/${QZ.needed}`;document.getElementById('qttl').textContent=QZ.title||'答题挑战';document.getElementById('qhint').textContent=`🎯 需答对 ${QZ.needed} 题，已答对 ${QZ.correct} 题`;const d=document.getElementById('qopts');d.innerHTML='';curQ.o.forEach((o,i)=>{const b=document.createElement('button');b.className='opt';b.textContent=['A','B','C','D'][i]+'. '+o;b.onclick=()=>pickOpt(i,b);d.appendChild(b);});}
function pickOpt(idx,btn){if(qAnswered)return;qAnswered=true;S.totalAnswered++;QZ.done++;document.querySelectorAll('.opt').forEach(b=>b.disabled=true);const ok=idx===curQ.a;btn.classList.add(ok?'ok':'no');document.querySelectorAll('.opt')[curQ.a].classList.add('ok');document.getElementById('explain').textContent='💡 '+curQ.e;document.getElementById('explain').classList.add('on');if(ok){QZ.correct++;S.totalCorrect++;S.curStreak++;S.maxStreak=Math.max(S.maxStreak,S.curStreak);if(!S.catCorrect)S.catCorrect={...DEFAULT_SAVE.catCorrect};S.catCorrect[curQ.c]=(S.catCorrect[curQ.c]||0)+1;const mult=S.expBoostLeft>0?2:1;gainExp(15*mult);if(S.expBoostLeft>0){S.expBoostLeft--;updateTop();if(!S.expBoostLeft)showToast('📖 经验加成已用完');else showToast(`📖 学霸加成剩余 ${S.expBoostLeft} 题`);}spawnP(['⭐','✨','🌸']);}else{S.curStreak=0;document.getElementById('quiz-ov').classList.add('shake');setTimeout(()=>document.getElementById('quiz-ov').classList.remove('shake'),400);}checkAchs();updateTop();persistAccount();const nb=document.getElementById('mb-next');if(QZ.correct>=QZ.needed){nb.textContent='完成 ✓';nb.classList.add('on');nb.onclick=()=>closeQuiz(true);}else{nb.textContent=`继续（还差 ${QZ.needed-QZ.correct} 题）→`;nb.classList.add('on');nb.onclick=quizNext;}}
function quizNext(){if(QZ.correct>=QZ.needed){closeQuiz(true);return;}loadNextQ();}
function closeQuiz(ok=false){document.getElementById('quiz-ov').classList.remove('on');const ctx=QZ;QZ=null;if(ok&&ctx?.onSuccess)ctx.onSuccess();else if(!ok&&ctx?.onFail)ctx.onFail();}

// ─── EXP / LEVEL（最高100级） ──────────────────────
function gainExp(n){
  S.exp+=n;S.score+=Math.floor(n*.5);
  const MAX_LEVEL=100;
  while(S.level<MAX_LEVEL&&S.exp>=expForLv(S.level)){S.exp-=expForLv(S.level);S.level++;showToast(`🎉 升级！达到 Lv.${S.level}`);spawnP(['🎊','⭐','🌟']);checkAchs();}
  updateAccountMeta();updateTop();
}

// ─── 宠物多存档 ──────────────────────────────────
function saveCurPet(){if(!S.petSaves)S.petSaves={};S.petSaves[S.activePet]={petBreed:S.petBreed,petName:S.petName,petLevel:S.petLevel,petFood:S.petFood,petHappy:S.petHappy,petClean:S.petClean,petEnergy:S.petEnergy,petLearnExp:S.petLearnExp||0,petFeedCount:S.petFeedCount,equippedCloth:S.equippedCloth};}
function loadPetSave(petId){const breed=SHOP_PETS.find(p=>p.id===petId)?.breed||'hamster';if(S.petSaves&&S.petSaves[petId]){const ps=S.petSaves[petId];S.petBreed=ps.petBreed||breed;S.petName=ps.petName||PET_NAMES[0];S.petLevel=ps.petLevel||1;S.petFood=ps.petFood??65;S.petHappy=ps.petHappy??55;S.petClean=ps.petClean??72;S.petEnergy=ps.petEnergy??80;S.petLearnExp=ps.petLearnExp||0;S.petFeedCount=ps.petFeedCount||0;S.equippedCloth=ps.equippedCloth||null;}else{S.petBreed=breed;S.petName=PET_NAMES[Math.floor(Math.random()*PET_NAMES.length)];S.petLevel=1;S.petFood=65;S.petHappy=55;S.petClean=72;S.petEnergy=80;S.petLearnExp=0;S.petFeedCount=0;S.equippedCloth=null;}}

// ─── FARM ─────────────────────────────────────────
function totalSeeds(){return Object.values(S.seedBag).reduce((a,b)=>a+b,0);}
function growPlot(i,amt){const p=S.plots[i];p.g=Math.min(100,p.g+amt);if(p.g>=100)p.s='s3';else if(p.g>=60)p.s='s2';else if(p.g>=25)p.s='s1';else p.s='s0';}
function calcReadyTime(i){
  const p=S.plots[i];if(!['s0','s1','s2'].includes(p.s)||p.hasCrack||p.hasBug)return '';
  const sd=SEEDS[p.seed||'wheat'];const totalSec=(100-p.g)/100*sd.autoGrowH*4*3600;
  if(totalSec<5)return '';if(totalSec<60)return Math.round(totalSec)+'秒';
  if(totalSec<3600)return Math.round(totalSec/60)+'分钟';
  const h=Math.floor(totalSec/3600),m=Math.round((totalSec%3600)/60);return m>0?`${h}h${m}m`:`${h}h`;
}
function onPlotClick(idx,event){
  const p=S.plots[idx];if(p.s==='locked'){onLockedClick(idx);return;}
  const popup=document.getElementById('plot-popup');
  const pages=document.getElementById('pages')||document.body;
  const pr=pages.getBoundingClientRect(),er=event.currentTarget.getBoundingClientRect();
  let top=er.bottom-pr.top+4,left=er.left-pr.left;if(left+200>pr.width)left=Math.max(0,pr.width-205);
  popup.style.top=top+'px';popup.style.left=left+'px';
  const sd=SEEDS[p.seed||'wheat'];const growing=['s0','s1','s2'].includes(p.s);
  let title=`第${idx+1}块地`;
  if(p.s==='empty')title+=' · 空地';else if(p.s==='s3')title+=` · ${sd.name} 🎉成熟！`;
  else title+=` · ${sd.name} ${Math.round(p.g)}%${p.hasBug?' 🐛':''}${p.hasCrack?' 💔':''}`;
  document.getElementById('pp-title').textContent=title;
  const acts=[];
  if(p.s==='empty')acts.push({l:'🌱 播种（答1题）',fn:()=>doPlantPlot(idx)});
  if(growing){const rt=calcReadyTime(idx);acts.push({l:`💧 浇水（答1题）${rt?' ⏱'+rt:''}`,fn:()=>doWaterPlot(idx)});acts.push({l:'✨ 施肥（答2题）',fn:()=>doFertPlot(idx)});}
  if(p.s==='s3')acts.push({l:'🌾 收获（答1题）',fn:()=>doHarvestPlot(idx)});
  if(p.hasBug){if(S.pestStock>0)acts.push({l:`🧴 使用除虫药（库存${S.pestStock}）`,fn:()=>usePest(idx)});else acts.push({l:'🧴 除虫（答1题）',fn:()=>doPestPlot(idx)});}
  const ad=document.getElementById('pp-actions');ad.innerHTML='';
  if(!acts.length)ad.innerHTML='<div style="font-size:.7rem;color:var(--muted);text-align:center">暂无操作</div>';
  acts.forEach(a=>{const b=document.createElement('div');b.className='pp-act';b.textContent=a.l;b.onclick=()=>{closePlotPopup();a.fn();};ad.appendChild(b);});
  popup.classList.add('on');
  setTimeout(()=>{const close=e=>{if(!popup.contains(e.target)){closePlotPopup();document.removeEventListener('click',close);}};document.addEventListener('click',close);},50);
}
function closePlotPopup(){document.getElementById('plot-popup').classList.remove('on');}
function usePest(idx){S.pestStock--;S.plots[idx].hasBug=false;persistAccount();renderFarm();showToast('🧴 除虫药使用成功！');}
function doPlantPlot(idx){if(!totalSeeds()){showToast('种子袋空了！');return;}openSeedPicker('plant',null,sid=>{openQuiz({title:'🌱 播种',needed:1,onSuccess:()=>{const p=S.plots[idx];p.s='s0';p.g=0;p.seed=sid;p.lastWater=Date.now();p.hasBug=false;p.hasCrack=false;S.seedBag[sid]--;S.totalPlanted++;gainExp(10);persistAccount();renderFarm();checkAchs();const sd=SEEDS[sid];showResult('🌱','播种成功！',`第${idx+1}块地种了${sd.ico}${sd.name}\n约${sd.autoGrowH*4}小时后成熟`);}});});}
function doWaterPlot(idx){openQuiz({title:'💧 浇水',needed:1,onSuccess:()=>{const p=S.plots[idx];p.hasCrack=false;p.lastWater=Date.now();growPlot(idx,30);S.coins+=3;S.totalCoins+=3;gainExp(12);persistAccount();renderFarm();const rt=calcReadyTime(idx);showResult('💧','浇水完成！',`第${idx+1}块地 +30% → ${Math.round(p.g)}%\n金币+3${p.s==='s3'?'\n🌾 已成熟！':rt?'\n预计还需'+rt:''}`);}});}
function doFertPlot(idx){openQuiz({title:'✨ 施肥（需答对2题）',needed:2,onSuccess:()=>{const p=S.plots[idx];p.hasCrack=false;p.lastWater=Date.now();growPlot(idx,60);S.coins+=8;S.totalCoins+=8;gainExp(25);persistAccount();renderFarm();showResult('✨','施肥成功！',`第${idx+1}块地 +60% → ${Math.round(p.g)}%\n金币+8${p.s==='s3'?'\n🌾 已成熟！':''}`);}});}
function doHarvestPlot(idx){openQuiz({title:'🌾 收获',needed:1,onSuccess:()=>{const sid=S.plots[idx].seed||'wheat';const sd=SEEDS[sid];S.plots[idx].s='empty';S.plots[idx].g=0;S.harvests++;S.coins+=sd.reward;S.totalCoins+=sd.reward;S.score+=sd.reward;gainExp(sd.expGain);persistAccount();renderFarm();checkAchs();showResult('🌾','大丰收！',`收获了${sd.ico}${sd.name}！\n金币+${sd.reward}，积分+${sd.reward}\n累计收获${S.harvests}次`);}});}
function doPestPlot(idx){openQuiz({title:'🧴 除虫',needed:1,onSuccess:()=>{S.plots[idx].hasBug=false;gainExp(8);persistAccount();renderFarm();showResult('🧴','除虫成功！','虫害已消灭！');}});}
function onLockedClick(idx){openConfirm('🔓',`开荒第${idx+1}块地（需答对3题）`,()=>{openQuiz({title:'🔓 开荒（需答对3题）',needed:3,onSuccess:()=>{S.plots[idx].s='empty';S.plotsUnlocked++;gainExp(40);S.coins+=15;S.totalCoins+=15;persistAccount();renderFarm();checkAchs();showResult('🔓','开荒成功！',`第${idx+1}块地已解锁！\n金币+15，经验+40`);}});});}

function farmBulk(type){
  const growing=['s0','s1','s2'];
  if(type==='auto_plant'){const empties=S.plots.map((p,i)=>({p,i})).filter(({p})=>p.s==='empty');if(!empties.length){showToast('没有空地！');return;}if(!totalSeeds()){showToast('种子袋空了！');return;}openSeedPicker('plant',null,sid=>{const n=Math.min(empties.length,S.seedBag[sid]||0);if(!n){showToast(SEEDS[sid].name+'种子不足！');return;}openQuiz({title:`🌱 一键播种（答对${n}题）`,needed:n,onSuccess:()=>{let cnt=0;empties.slice(0,n).forEach(({i})=>{if(S.seedBag[sid]>0){const p=S.plots[i];p.s='s0';p.g=0;p.seed=sid;p.lastWater=Date.now();p.hasBug=false;p.hasCrack=false;S.seedBag[sid]--;S.totalPlanted++;cnt++;}});gainExp(10*cnt);persistAccount();renderFarm();checkAchs();showResult('🌱','一键播种完成！',`播种了${cnt}块地 ${SEEDS[sid].ico}${SEEDS[sid].name}`);}});});return;}
  if(type==='buy_seeds'){openSeedPicker('buy',true,null);return;}
  if(type==='water_all'){const cnt=S.plots.filter(p=>growing.includes(p.s)).length;if(!cnt){showToast('没有正在生长的作物！');return;}openQuiz({title:`🌊 一键浇水（答对${cnt}题）`,needed:cnt,onSuccess:()=>{let coins=0;S.plots.forEach((p,i)=>{if(growing.includes(p.s)){p.hasCrack=false;p.lastWater=Date.now();growPlot(i,30);coins+=3;}});S.coins+=coins;S.totalCoins+=coins;gainExp(12*cnt);persistAccount();renderFarm();showResult('🌊','全部浇水！',`灌溉了${cnt}块地\n金币+${coins}`);}});return;}
  if(type==='harvest_all'){const cnt=S.plots.filter(p=>p.s==='s3').length;if(!cnt){showToast('没有成熟的作物！');return;}openQuiz({title:`🧺 一键收获（答对${cnt}题）`,needed:cnt,onSuccess:()=>{let total=0,expT=0,icons='';S.plots.forEach((p,i)=>{if(p.s==='s3'){const sd=SEEDS[p.seed||'wheat'];S.plots[i].s='empty';S.plots[i].g=0;S.harvests++;total+=sd.reward;expT+=sd.expGain;S.score+=sd.reward;icons+=sd.ico;}});S.coins+=total;S.totalCoins+=total;gainExp(expT);persistAccount();renderFarm();checkAchs();showResult('🧺','一键大丰收！',`收获：${icons}\n金币+${total}，积分+${total}`);}});return;}
  if(type==='fert_all'){const cnt=S.plots.filter(p=>growing.includes(p.s)).length;if(!cnt){showToast('没有正在生长的作物！');return;}openQuiz({title:`🪣 一键施肥（答对${cnt*2}题）`,needed:cnt*2,onSuccess:()=>{let coins=0;S.plots.forEach((p,i)=>{if(growing.includes(p.s)){p.hasCrack=false;p.lastWater=Date.now();growPlot(i,60);coins+=8;}});S.coins+=coins;S.totalCoins+=coins;gainExp(25*cnt);persistAccount();renderFarm();showResult('🪣','全部施肥！',`施肥了${cnt}块地\n金币+${coins}`);}});return;}
  if(type==='pest_all'){const bugCount=S.plots.filter(p=>p.hasBug).length;if(!bugCount){showToast('目前没有虫害！');return;}if(S.pestStock>=bugCount){S.pestStock-=bugCount;S.plots.forEach(p=>p.hasBug=false);persistAccount();renderFarm();showToast(`🧴 使用${bugCount}瓶除虫药，全部清除！`);return;}openQuiz({title:`🧴 一键除虫（答对${bugCount}题）`,needed:bugCount,onSuccess:()=>{S.plots.forEach(p=>p.hasBug=false);gainExp(8*bugCount);persistAccount();renderFarm();showResult('🧴','除虫完成！',`清除了${bugCount}块地的虫害！`);}});return;}
}

// ─── SEED PICKER ──────────────────────────────────
let seedPickMode='buy',seedPickCb=null,selectedSeedId='wheat',buyQty=1;
function openSeedPicker(mode,showQty,cb){seedPickMode=mode;seedPickCb=cb;selectedSeedId=S.unlockedSeeds[0]||'wheat';buyQty=1;document.getElementById('seed-ov-title').textContent=mode==='buy'?'🌰 购买种子':'🌱 选择种子';const list=document.getElementById('seed-list');list.innerHTML='';const available=mode==='plant'?SEED_IDS.filter(s=>S.seedBag[s]>0):S.unlockedSeeds;if(!available.length){showToast(mode==='plant'?'种子袋空了！':'暂无可用种子');return;}available.forEach(sid=>{const sd=SEEDS[sid];const d=document.createElement('div');d.className='seed-item'+(sid===selectedSeedId?' sel':'');d.innerHTML=`<span class="seed-ico">${sd.ico}</span><div class="seed-info"><div class="seed-nm">${sd.name}${mode==='plant'?' ×'+S.seedBag[sid]:''}</div><div class="seed-desc">${sd.desc} · 🪙${sd.reward} · ${sd.autoGrowH*4}h成熟</div></div><div class="seed-price">${mode==='buy'?'🪙'+sd.buyCoins:''}</div>`;d.onclick=()=>{selectedSeedId=sid;document.querySelectorAll('.seed-item').forEach(x=>x.classList.remove('sel'));d.classList.add('sel');updateQtyCost();};list.appendChild(d);});const qs=document.getElementById('qty-section');qs.style.display=(mode==='buy'||showQty)?'block':'none';document.getElementById('qty-val').textContent=1;updateQtyCost();document.getElementById('seed-ov').classList.add('on');}
function updateQtyCost(){const sd=SEEDS[selectedSeedId];if(document.getElementById('qty-cost'))document.getElementById('qty-cost').textContent=`费用：🪙${sd.buyCoins*buyQty} + 答对${buyQty}题`;}
function changeQty(d){const sd=SEEDS[selectedSeedId];const max=Math.min(10,Math.max(1,Math.floor(S.coins/(sd.buyCoins||1))));buyQty=Math.max(1,Math.min(buyQty+d,max));document.getElementById('qty-val').textContent=buyQty;updateQtyCost();}
function closeSeedOv(){document.getElementById('seed-ov').classList.remove('on');}
function confirmSeedAction(){if(seedPickMode==='plant'){if(!S.seedBag[selectedSeedId]){showToast('该种子已用完！');return;}closeSeedOv();if(seedPickCb)seedPickCb(selectedSeedId);}else{const sd=SEEDS[selectedSeedId];const cost=sd.buyCoins*buyQty;if(S.coins<cost){showToast(`金币不足！需要🪙${cost}`);return;}closeSeedOv();openQuiz({title:`🌰 购买${sd.name}×${buyQty}（答对${buyQty}题）`,needed:buyQty,onSuccess:()=>{S.coins-=cost;S.seedBag[selectedSeedId]=(S.seedBag[selectedSeedId]||0)+buyQty;S.totalSeeds+=buyQty;gainExp(8*buyQty);persistAccount();renderFarm();checkAchs();showResult(sd.ico,'购种成功！',`获得${sd.name}×${buyQty}\n消耗🪙${cost}\n库存：${S.seedBag[selectedSeedId]}粒`);}});}}

// ─── RENDER FARM ──────────────────────────────────
let farmTimerInterval=null;
function renderFarm(){
  const g=document.getElementById('farm-grid');g.innerHTML='';
  S.plots.forEach((p,i)=>{
    const d=document.createElement('div');
    d.className='plot '+p.s+(p.hasCrack?' cracked':'')+(p.hasBug?' bugged':'');
    if(p.s==='locked'){d.innerHTML='<span class="plot-ico">🔒</span><div class="plot-lbl" style="font-size:.4rem">未开荒</div>';}
    else if(p.s==='empty'){d.innerHTML='<span class="plot-ico">🟫</span><div class="plot-lbl">空地</div>';}
    else{const sd=SEEDS[p.seed||'wheat'];const si=p.s==='s3'?sd.stages.length-1:p.s==='s2'?2:p.s==='s1'?1:0;const ico=sd.stages[Math.min(si,sd.stages.length-1)];const rt=calcReadyTime(i);const pctStr=Math.round(p.g);d.innerHTML=`${rt?`<div class="plot-timer">⏱${rt}</div>`:''}${(()=>{const ci=(S.hasAutoWater?'🚿':'')+(S.hasAutoPest?'🤖':'');return ci?`<div style="position:absolute;top:2px;right:3px;font-size:.5rem;line-height:1.2">${ci}</div>`:'';})()}<span class="plot-ico">${ico}</span><div class="plot-lbl">${sd.name} ${p.s==='s3'?'🎉成熟':pctStr+'%'}</div><div class="plot-pg"><div class="plot-pg-f" style="width:${p.g}%"></div></div>`;}
    d.onclick=e=>onPlotClick(i,e);g.appendChild(d);
  });
  const ready=S.plots.filter(p=>p.s==='s3').length,grow=S.plots.filter(p=>['s0','s1','s2'].includes(p.s)).length,bug=S.plots.filter(p=>p.hasBug).length;
  const seeds=SEED_IDS.filter(s=>S.seedBag[s]>0).map(s=>SEEDS[s].ico+S.seedBag[s]).join(' ')||'无';
  document.getElementById('farm-stat').innerHTML=`🌰 种子：${seeds}${S.hasAutoWater?' 🚿自动浇水':''}${S.hasAutoPest?' 🤖自动除虫':''}${S.pestStock>0?' 🧴除虫药×'+S.pestStock:''}<br>🌾 成熟：<b>${ready}</b>块 · 🌿 生长：<b>${grow}</b>块${bug?` · <b style="color:var(--red)">🐛虫${bug}</b>`:''}<br>📦 收获：<b>${S.harvests}</b>次`;
  const val=ready+bug;['bd-farm','sbd-farm'].forEach(id=>{const el=document.getElementById(id);if(!el)return;if(val>0){el.textContent=val;el.classList.add('on');}else{el.textContent='';el.classList.remove('on');}});
  if(farmTimerInterval)clearInterval(farmTimerInterval);
  if(grow>0){farmTimerInterval=setInterval(()=>{let changed=false;if(S.hasAutoPest){S.plots.forEach(p=>{if(p.hasBug){p.hasBug=false;changed=true;}});}S.plots.forEach((p,i)=>{if(['s0','s1','s2'].includes(p.s)&&!p.hasCrack&&!p.hasBug){growPlot(i,1/(60*4));changed=true;}});if(changed)renderFarm();},1000);}
}

// ─── PET CANVAS ──────────────────────────────────
let petAF=null,petT=0;
let petX=75,petY=76,petVx=0.5,petVy=0.3,petDragging=false,petDragOx=0,petDragOy=0;

function startPetAnim(){
  if(petAF)return;
  const cvs=document.getElementById('pet-canvas');
  if(cvs){
    const getPos=(e,touch)=>{const r=cvs.getBoundingClientRect();const src=touch?e.touches[0]:e;return{x:src.clientX-r.left,y:src.clientY-r.top};};
    cvs.onmousedown=e=>{const pos=getPos(e,false);if(Math.abs(pos.x-petX)<35&&Math.abs(pos.y-petY)<35){petDragging=true;petDragOx=pos.x-petX;petDragOy=pos.y-petY;cvs.style.cursor='grabbing';}};
    cvs.ontouchstart=e=>{const pos=getPos(e,true);if(Math.abs(pos.x-petX)<40&&Math.abs(pos.y-petY)<40){petDragging=true;petDragOx=pos.x-petX;petDragOy=pos.y-petY;e.preventDefault();}};
    document.onmousemove=e=>{if(!petDragging)return;const r=cvs.getBoundingClientRect();petX=Math.max(20,Math.min(130,e.clientX-r.left-petDragOx));petY=Math.max(20,Math.min(130,e.clientY-r.top-petDragOy));};
    document.ontouchmove=e=>{if(!petDragging)return;const r=cvs.getBoundingClientRect();const t=e.touches[0];petX=Math.max(20,Math.min(130,t.clientX-r.left-petDragOx));petY=Math.max(20,Math.min(130,t.clientY-r.top-petDragOy));e.preventDefault();};
    document.onmouseup=()=>{if(petDragging){petDragging=false;cvs.style.cursor='';S.dragCount=(S.dragCount||0)+1;checkAchs();persistAccount();}};
    document.ontouchend=()=>{if(petDragging){petDragging=false;S.dragCount=(S.dragCount||0)+1;checkAchs();persistAccount();}};
    cvs.onclick=e=>{const r=cvs.getBoundingClientRect();const x=e.clientX-r.left,y=e.clientY-r.top;if(Math.abs(x-petX)<35&&Math.abs(y-petY)<35){showPetTalk('tap');spawnP(['💕','✨','⭐']);}};
  }
  const loop=()=>{
    petT+=0.04;
    if(!petDragging&&petWalking){
      petX+=petVx;petY+=petVy;
      if(petX<20||petX>130)petVx*=-1;if(petY<20||petY>130)petVy*=-1;
      petX=Math.max(20,Math.min(130,petX));petY=Math.max(20,Math.min(130,petY));
      if(Math.random()<0.003){petVx=(Math.random()-0.5)*0.9;petVy=(Math.random()-0.5)*0.6;}
    }
    drawPet();petAF=requestAnimationFrame(loop);
  };loop();
}

function getEvoStage(){const stages=(EVO_STAGES[S.petBreed||'hamster']||EVO_STAGES.hamster);return stages[Math.min(S.petLevel-1,stages.length-1)];}

function drawPet(){
  const cvs=document.getElementById('pet-canvas');if(!cvs)return;
  const ctx=cvs.getContext('2d');ctx.clearRect(0,0,150,150);
  const bob=petWalking?Math.sin(petT*3)*1.5:Math.sin(petT)*2;
  const stage=getEvoStage();const breed=S.petBreed||'hamster';
  drawPetBreed(ctx,breed,petX,petY+bob,stage);
  drawCloth(ctx,petX,petY+bob);
}

function drawPetBreed(ctx,breed,cx,cy,stage){
  if(breed==='cat')drawCat(ctx,cx,cy,stage);
  else if(breed==='rabbit')drawRabbit(ctx,cx,cy,stage);
  else if(breed==='bird')drawBird(ctx,cx,cy,stage);
  else if(breed==='dog')drawDog(ctx,cx,cy,stage);
  else if(breed==='panda')drawPanda(ctx,cx,cy,stage);
  else if(breed==='fox')drawFox(ctx,cx,cy,stage);
  else if(breed==='deer')drawDeer(ctx,cx,cy,stage);
  else if(breed==='penguin')drawPenguin(ctx,cx,cy,stage);
  else if(breed==='dragon')drawDragon(ctx,cx,cy,stage);
  else if(breed==='owl')drawOwl(ctx,cx,cy,stage);
  else if(breed==='bear')drawBear(ctx,cx,cy,stage);
  else if(breed==='unicorn')drawUnicorn(ctx,cx,cy,stage);
  else if(breed==='tiger')drawTiger(ctx,cx,cy,stage);
  else drawHamster(ctx,cx,cy,stage);
}

// ── 仓鼠（5阶，装饰贴合头部）──
function drawHamster(ctx,cx,cy,stage){
  const lv=S.petLevel,h=S.petHappy/100,col=stage.color,es=stage.earSize||1;
  if(lv>=5){const g=ctx.createRadialGradient(cx,cy,10,cx,cy,52);g.addColorStop(0,'rgba(210,180,255,.35)');g.addColorStop(1,'rgba(210,180,255,0)');ctx.beginPath();ctx.arc(cx,cy,52,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();for(let i=0;i<6;i++){const a=petT+i*Math.PI/3;ctx.beginPath();ctx.arc(cx+Math.cos(a)*38,cy+Math.sin(a)*27,2.5,0,Math.PI*2);ctx.fillStyle='#d4b0ff';ctx.fill();}}
  else if(lv>=4){for(let i=0;i<4;i++){const a=petT*1.5+i*Math.PI/2;ctx.font='9px sans-serif';ctx.fillText('✦',cx+Math.cos(a)*36-4,cy+Math.sin(a)*26+4);}}
  // 阴影
  ctx.beginPath();ctx.ellipse(cx,cy+22,Math.min(lv>=4?30:27,27),6,0,0,Math.PI*2);ctx.fillStyle='rgba(0,0,0,.07)';ctx.fill();
  // 身体
  ctx.beginPath();ctx.ellipse(cx,cy,lv>=4?28:25,20,0,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();
  // 肚皮
  ctx.beginPath();ctx.ellipse(cx,cy+4,13,11,0,0,Math.PI*2);ctx.fillStyle='#fdeec8';ctx.fill();
  // 腮红
  if(h>.45){[[cx-14,cy],[cx+14,cy]].forEach(([ex,ey])=>{ctx.beginPath();ctx.ellipse(ex,ey,7,5,.2,0,Math.PI*2);ctx.fillStyle='rgba(255,140,140,.3)';ctx.fill();});}
  // 头
  ctx.beginPath();ctx.ellipse(cx,cy-16,18,14,0,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();
  // 耳朵
  [[cx-13,cy-28,-.25],[cx+13,cy-28,.25]].forEach(([ex,ey,r])=>{
    ctx.beginPath();ctx.ellipse(ex,ey,7.5*es,9.5*es,r,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();
    ctx.beginPath();ctx.ellipse(ex,ey,4.2*es,6*es,r,0,Math.PI*2);ctx.fillStyle='#f5a0b0';ctx.fill();
  });
  // 头顶装饰（贴合头部，放在耳朵之间）
  const headTop=cy-30; // 头顶y坐标
  if(lv===3){// 骑士帽（直接画在头顶，不用emoji）
    ctx.fillStyle='#8b4513';ctx.beginPath();ctx.ellipse(cx,headTop+4,16,4,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#a0522d';ctx.beginPath();ctx.rect(cx-8,headTop-8,16,12);ctx.fill();
    ctx.fillStyle='#cd853f';ctx.beginPath();ctx.ellipse(cx,headTop-8,6,3,0,0,Math.PI*2);ctx.fill();
  }
  if(lv>=4){// 光环（贴合头部上方6px）
    ctx.beginPath();ctx.ellipse(cx,headTop-2,13,3.5,0,0,Math.PI*2);
    ctx.strokeStyle=lv>=5?'rgba(200,160,255,.9)':'rgba(180,210,255,.9)';ctx.lineWidth=2.5;ctx.stroke();
    if(lv>=5){// 发光
      ctx.shadowColor=lv>=5?'#c8a0ff':'#b0d8ff';ctx.shadowBlur=8;
      ctx.beginPath();ctx.ellipse(cx,headTop-2,13,3.5,0,0,Math.PI*2);ctx.stroke();ctx.shadowBlur=0;}
  }
  // 眼睛
  const ey=cy-18,ec=lv>=5?'#8040d0':lv>=4?'#40a0e8':lv>=3?'#40b878':'#1e1008';
  [[cx-6.5,ey],[cx+6.5,ey]].forEach(([ex,e])=>{ctx.beginPath();ctx.ellipse(ex,e,3,3.5,0,0,Math.PI*2);ctx.fillStyle=ec;ctx.fill();ctx.beginPath();ctx.ellipse(ex+1.2,e-1.2,1,1,0,0,Math.PI*2);ctx.fillStyle='white';ctx.fill();});
  if(h>.75&&lv>=2){ctx.fillStyle=lv>=4?'#ffd700':'#ff80a0';ctx.font='8px sans-serif';ctx.fillText(lv>=4?'★':'♡',cx-9,ey+2);ctx.fillText(lv>=4?'★':'♡',cx+4,ey+2);}
  // 鼻子+嘴
  ctx.beginPath();ctx.ellipse(cx,cy-11,2.2,1.8,0,0,Math.PI*2);ctx.fillStyle='#e07090';ctx.fill();
  if(h>.65){ctx.beginPath();ctx.arc(cx,cy-7,5,.25,Math.PI-.25);ctx.strokeStyle='#a05060';ctx.lineWidth=1.8;ctx.stroke();}
  else if(h>.3){ctx.beginPath();ctx.moveTo(cx-3.5,cy-7);ctx.lineTo(cx+3.5,cy-7);ctx.strokeStyle='#a05060';ctx.lineWidth=1.5;ctx.stroke();}
  else{ctx.beginPath();ctx.arc(cx,cy-4,4,Math.PI+.3,-.3);ctx.strokeStyle='#a05060';ctx.lineWidth=1.5;ctx.stroke();}
  // 胡须
  ctx.strokeStyle='rgba(180,120,80,.3)';ctx.lineWidth=1;
  [[cx-2,cy-9,cx-15,cy-11],[cx-2,cy-7,cx-15,cy-7],[cx+2,cy-9,cx+15,cy-11],[cx+2,cy-7,cx+15,cy-7]].forEach(([x1,y1,x2,y2])=>{ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();});
  // 爪子
  [[cx-21,cy+13,-.5],[cx+21,cy+13,.5]].forEach(([px,py,r])=>{ctx.beginPath();ctx.ellipse(px,py,lv>=3?8:6.5,5,r,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();});
  // lv5翅膀
  if(lv>=5){ctx.strokeStyle='rgba(180,140,255,.5)';ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(cx-26,cy-5);ctx.quadraticCurveTo(cx-52,cy-28,cx-16,cy-46);ctx.stroke();ctx.beginPath();ctx.moveTo(cx+26,cy-5);ctx.quadraticCurveTo(cx+52,cy-28,cx+16,cy-46);ctx.stroke();}
  // lv2+尾巴
  if(lv>=2){const tl=(stage.tailLen||0.4)*26;ctx.beginPath();ctx.moveTo(cx+24,cy+7);ctx.quadraticCurveTo(cx+44,cy-8+tl*.3,cx+26+tl*.5,cy-28-tl*.3);ctx.strokeStyle=col;ctx.lineWidth=lv>=4?7:4.5;ctx.lineCap='round';ctx.stroke();}
  drawTears(ctx,cx,cy,h);
  if(S.petEnergy<25){ctx.font='11px sans-serif';ctx.fillText('💤',cx+11,cy-30);}
}

// ── 猫咪（5阶，装饰贴合头部）──
function drawCat(ctx,cx,cy,stage){
  const lv=S.petLevel,h=S.petHappy/100,col=stage.color;
  if(lv>=5){const g=ctx.createRadialGradient(cx,cy,8,cx,cy,48);g.addColorStop(0,'rgba(255,215,0,.25)');g.addColorStop(1,'rgba(255,215,0,0)');ctx.beginPath();ctx.arc(cx,cy,48,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();}
  ctx.beginPath();ctx.ellipse(cx,cy+21,26,6,0,0,Math.PI*2);ctx.fillStyle='rgba(0,0,0,.06)';ctx.fill();
  ctx.beginPath();ctx.ellipse(cx,cy,26,21,0,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();
  ctx.beginPath();ctx.ellipse(cx,cy+5,14,11,0,0,Math.PI*2);ctx.fillStyle='#fff8fb';ctx.fill();
  if(h>.5){[[cx-14,cy],[cx+14,cy]].forEach(([ex,ey])=>{ctx.beginPath();ctx.ellipse(ex,ey,7,5,.2,0,Math.PI*2);ctx.fillStyle='rgba(255,160,180,.35)';ctx.fill();});}
  ctx.beginPath();ctx.ellipse(cx,cy-16,18,15,0,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();
  // 三角耳朵
  [[cx-12,cy-29,0],[cx+12,cy-29,1]].forEach(([ex,ey,side])=>{const d2=side?1:-1;ctx.beginPath();ctx.moveTo(ex,ey-12);ctx.lineTo(ex-7*d2,ey+5);ctx.lineTo(ex+7*d2,ey+5);ctx.closePath();ctx.fillStyle=col;ctx.fill();ctx.beginPath();ctx.moveTo(ex,ey-7);ctx.lineTo(ex-3.5*d2,ey+2);ctx.lineTo(ex+3.5*d2,ey+2);ctx.closePath();ctx.fillStyle='#f5a0b8';ctx.fill();});
  // 头顶装饰（lv3+，贴合头部）
  const headTop=cy-30;
  if(lv===3){// 侦探帽
    ctx.fillStyle='#222';ctx.beginPath();ctx.ellipse(cx,headTop+3,15,4,0,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.rect(cx-8,headTop-9,16,12);ctx.fill();
    ctx.fillStyle='#555';ctx.beginPath();ctx.rect(cx-3,headTop-9,6,3);ctx.fill();}
  if(lv>=4){// 法杖/魔法符号（贴在头顶右侧）
    ctx.font='14px sans-serif';ctx.fillText(stage.crownIco||'✨',cx-4,headTop+2);}
  if(lv>=5){// 金光环
    ctx.beginPath();ctx.ellipse(cx,headTop-1,12,3.5,0,0,Math.PI*2);ctx.strokeStyle='rgba(255,215,0,.9)';ctx.lineWidth=2.5;ctx.shadowColor='#ffd700';ctx.shadowBlur=6;ctx.stroke();ctx.shadowBlur=0;}
  const ey=cy-18,ec=lv>=5?'#ffd700':lv>=3?'#80c0e0':'#78d068';
  [[cx-6.5,ey],[cx+6.5,ey]].forEach(([ex,e])=>{ctx.beginPath();ctx.ellipse(ex,e,3.8,4.2,0,0,Math.PI*2);ctx.fillStyle=ec;ctx.fill();ctx.beginPath();ctx.ellipse(ex,e,1.1,3.2,0,0,Math.PI*2);ctx.fillStyle='#111';ctx.fill();ctx.beginPath();ctx.ellipse(ex+1.6,e-1.4,1,1,0,0,Math.PI*2);ctx.fillStyle='white';ctx.fill();});
  ctx.beginPath();ctx.ellipse(cx,cy-11,2.8,2,0,0,Math.PI*2);ctx.fillStyle='#e07090';ctx.fill();
  if(h>.6){ctx.beginPath();ctx.moveTo(cx-3.5,cy-7);ctx.bezierCurveTo(cx-1,cy-5,cx+1,cy-5,cx+3.5,cy-7);ctx.strokeStyle='#b05070';ctx.lineWidth=1.8;ctx.stroke();}
  else{ctx.beginPath();ctx.arc(cx,cy-5,3.2,Math.PI+.4,-.4);ctx.strokeStyle='#b05070';ctx.lineWidth=1.5;ctx.stroke();}
  ctx.strokeStyle='rgba(200,150,160,.4)';ctx.lineWidth=1;
  [[cx-2,cy-9,cx-18,cy-12],[cx-2,cy-7,cx-18,cy-7],[cx+2,cy-9,cx+18,cy-12],[cx+2,cy-7,cx+18,cy-7]].forEach(([x1,y1,x2,y2])=>{ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();});
  // 尾巴
  ctx.beginPath();ctx.moveTo(cx+25,cy+7);ctx.quadraticCurveTo(cx+48,cy-10,cx+32,cy-34+(lv-1)*3);ctx.strokeStyle=col;ctx.lineWidth=lv>=3?8:6;ctx.lineCap='round';ctx.stroke();
  [[cx-22,cy+15,-.4],[cx+22,cy+15,.4]].forEach(([px,py,r])=>{ctx.beginPath();ctx.ellipse(px,py,7.5,5.5,r,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();});
  if(lv>=5){for(let i=0;i<6;i++){const a=petT+i*Math.PI/3;ctx.font='9px sans-serif';ctx.fillText('✦',cx+Math.cos(a)*40-4,cy+Math.sin(a)*30);}}
  drawTears(ctx,cx,cy,h);
  if(S.petEnergy<25){ctx.font='11px sans-serif';ctx.fillText('💤',cx+11,cy-31);}
}

// ── 小兔（5阶，长耳贴合）──
function drawRabbit(ctx,cx,cy,stage){
  const lv=S.petLevel,h=S.petHappy/100,col=stage.color,earH=14+lv*3;
  if(lv>=5){const g=ctx.createRadialGradient(cx,cy-18,5,cx,cy-18,30);g.addColorStop(0,'rgba(255,230,180,.4)');g.addColorStop(1,'rgba(255,230,180,0)');ctx.beginPath();ctx.arc(cx,cy-18,30,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();}
  ctx.beginPath();ctx.ellipse(cx,cy+21,26,6,0,0,Math.PI*2);ctx.fillStyle='rgba(0,0,0,.06)';ctx.fill();
  ctx.beginPath();ctx.ellipse(cx,cy,26,21,0,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();
  ctx.beginPath();ctx.ellipse(cx,cy+5,13,10,0,0,Math.PI*2);ctx.fillStyle='#fff5f8';ctx.fill();
  ctx.beginPath();ctx.ellipse(cx,cy-15,18,15,0,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();
  // 长耳朵（从头顶伸出）
  [[cx-8,cy-26],[cx+8,cy-26]].forEach(([ex,ey])=>{
    ctx.beginPath();ctx.ellipse(ex,ey-earH/2,6.5+lv*.4,earH,0,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();
    ctx.beginPath();ctx.ellipse(ex,ey-earH/2,3.8+lv*.2,earH*.7,0,0,Math.PI*2);ctx.fillStyle='#ffb0c0';ctx.fill();
  });
  // 头顶装饰（在两耳之间正中）
  const headTop=cy-26-earH;
  if(lv>=2&&stage.crownIco){// 帽子/装饰贴在两耳之间
    ctx.font='13px sans-serif';ctx.fillText(stage.crownIco,cx-6,headTop+earH+12);}
  if(h>.5){[[cx-15,cy-2],[cx+15,cy-2]].forEach(([ex,ey])=>{ctx.beginPath();ctx.ellipse(ex,ey,6,4,.2,0,Math.PI*2);ctx.fillStyle='rgba(255,170,190,.4)';ctx.fill();});}
  const ey=cy-18,ec=lv>=4?'#8080ff':lv>=2?'#e060a0':'#e06080';
  [[cx-6,ey],[cx+6,ey]].forEach(([ex,e])=>{ctx.beginPath();ctx.ellipse(ex,e,3.8,4.2,0,0,Math.PI*2);ctx.fillStyle=ec;ctx.fill();ctx.beginPath();ctx.ellipse(ex,e,2.3,2.8,0,0,Math.PI*2);ctx.fillStyle='#1a0820';ctx.fill();ctx.beginPath();ctx.ellipse(ex+1.3,e-1.3,1,1,0,0,Math.PI*2);ctx.fillStyle='white';ctx.fill();});
  ctx.beginPath();ctx.ellipse(cx,cy-11,2.8,2.2,0,0,Math.PI*2);ctx.fillStyle='#e06080';ctx.fill();
  if(h>.6){ctx.beginPath();ctx.arc(cx,cy-7,4.8,.2,Math.PI-.2);ctx.strokeStyle='#a04060';ctx.lineWidth=1.8;ctx.stroke();}
  else{ctx.beginPath();ctx.arc(cx,cy-4,3.8,Math.PI+.3,-.3);ctx.strokeStyle='#a04060';ctx.lineWidth=1.5;ctx.stroke();}
  [[cx-21,cy+13,-.4],[cx+21,cy+13,.4]].forEach(([px,py,r])=>{ctx.beginPath();ctx.ellipse(px,py,7.5,5.5,r,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();});
  if(lv>=5){ctx.beginPath();ctx.ellipse(cx,cy-28,12,3.5,0,0,Math.PI*2);ctx.strokeStyle='rgba(255,230,180,.9)';ctx.lineWidth=2.5;ctx.shadowColor='#ffe8a0';ctx.shadowBlur=6;ctx.stroke();ctx.shadowBlur=0;}
  drawTears(ctx,cx,cy,h);
  if(S.petEnergy<25){ctx.font='11px sans-serif';ctx.fillText('💤',cx+8,cy-34-earH*.6);}
}

// ── 小鸟（5阶）──
function drawBird(ctx,cx,cy,stage){
  const lv=S.petLevel,h=S.petHappy/100,col=stage.color,ws=16+lv*4;
  ctx.beginPath();ctx.ellipse(cx,cy+17,21,5,0,0,Math.PI*2);ctx.fillStyle='rgba(0,0,0,.06)';ctx.fill();
  ctx.beginPath();ctx.ellipse(cx,cy+2,21,17,0,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();
  ctx.beginPath();ctx.ellipse(cx,cy+7,12,10,0,0,Math.PI*2);ctx.fillStyle='#fffde8';ctx.fill();
  // 翅膀（lv越高越大）
  ctx.beginPath();ctx.ellipse(cx-ws,cy,ws*.65,6+lv*.5,-.5,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();
  ctx.beginPath();ctx.ellipse(cx+ws,cy,ws*.65,6+lv*.5,.5,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.ellipse(cx,cy-15,15,13,0,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();
  // 羽冠（从头顶向上，lv越高越多）
  for(let i=0;i<lv;i++){const ax=cx+(i-(lv-1)/2)*5.5;ctx.beginPath();ctx.ellipse(ax,cy-24-i*2,2.5+i*.4,4+lv,0,0,Math.PI*2);ctx.fillStyle=i%2===0?col:'#ffd080';ctx.fill();}
  // 头顶图标（贴在羽冠旁）
  if(lv>=3&&stage.crownIco){ctx.font='11px sans-serif';ctx.fillText(stage.crownIco,cx-5,cy-24-lv*2-2);}
  if(lv>=5){// 凤凰火焰光环
    ctx.beginPath();ctx.ellipse(cx,cy-26-lv*2,10,3,0,0,Math.PI*2);ctx.strokeStyle='rgba(255,150,30,.8)';ctx.lineWidth=2.5;ctx.shadowColor='#ff9020';ctx.shadowBlur=8;ctx.stroke();ctx.shadowBlur=0;}
  const ey=cy-17,ec=lv>=4?'#6080ff':'#202020';
  [[cx-5.5,ey],[cx+5.5,ey]].forEach(([ex,e])=>{ctx.beginPath();ctx.ellipse(ex,e,3.8,4,0,0,Math.PI*2);ctx.fillStyle=ec;ctx.fill();ctx.beginPath();ctx.ellipse(ex+1.4,e-1.4,1.1,1.1,0,0,Math.PI*2);ctx.fillStyle='white';ctx.fill();});
  ctx.beginPath();ctx.moveTo(cx,cy-11);ctx.lineTo(cx-4.5,cy-8.5);ctx.lineTo(cx+4.5,cy-8.5);ctx.closePath();ctx.fillStyle='#f0a020';ctx.fill();
  [[cx-7,cy+17],[cx+7,cy+17]].forEach(([fx,fy])=>{ctx.strokeStyle='#d08020';ctx.lineWidth=2;ctx.lineCap='round';[[-6,5],[0,7],[6,5]].forEach(([dx,dy])=>{ctx.beginPath();ctx.moveTo(fx,fy);ctx.lineTo(fx+dx,fy+dy);ctx.stroke();});});
  if(lv>=3&&h>.6){ctx.fillStyle='#e0a020';ctx.font='10px sans-serif';ctx.fillText('♪',cx-15,ey-4);ctx.fillText('♫',cx+7,ey-7);}
  if(lv>=5){for(let i=0;i<8;i++){const a=petT*.8+i*Math.PI/4;ctx.fillStyle='rgba(255,200,80,.8)';ctx.font='8px sans-serif';ctx.fillText('✦',cx+Math.cos(a)*37-3,cy+Math.sin(a)*27);}}
  drawTears(ctx,cx,cy,h);
  if(S.petEnergy<25){ctx.font='11px sans-serif';ctx.fillText('💤',cx+8,cy-30);}
}

// ── 宠物预览（商店用，固定位置） ──
function drawPetPreviewInCanvas(cvs,breed,lv){
  if(!cvs)return;const ctx=cvs.getContext('2d');ctx.clearRect(0,0,120,120);
  const stgs=(EVO_STAGES[breed]||EVO_STAGES.hamster);const stage=stgs[Math.min(lv-1,stgs.length-1)];
  const saved={petBreed:S.petBreed,petLevel:S.petLevel,petHappy:S.petHappy,petEnergy:S.petEnergy,equippedCloth:S.equippedCloth};
  S.petBreed=breed;S.petLevel=lv;S.petHappy=80;S.petEnergy=80;S.equippedCloth=null;
  drawPetBreed(ctx,breed,60,62,stage);
  S.petBreed=saved.petBreed;S.petLevel=saved.petLevel;S.petHappy=saved.petHappy;S.petEnergy=saved.petEnergy;S.equippedCloth=saved.equippedCloth;
}

// ── 通用辅助：哭泣泪滴 ──
function drawTears(ctx,cx,cy,h){
  if(h>=0.3)return;
  const alpha=Math.max(0,(0.3-h)/0.3);
  ctx.fillStyle=`rgba(100,180,255,${alpha*0.85})`;
  // 左泪
  ctx.beginPath();ctx.ellipse(cx-7,cy-12,2,3.5,0,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.moveTo(cx-9,cy-10);ctx.lineTo(cx-7,cy-4);ctx.lineTo(cx-5,cy-10);ctx.closePath();ctx.fill();
  // 右泪
  ctx.beginPath();ctx.ellipse(cx+7,cy-12,2,3.5,0,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.moveTo(cx+5,cy-10);ctx.lineTo(cx+7,cy-4);ctx.lineTo(cx+9,cy-10);ctx.closePath();ctx.fill();
}

// ── 小狗 ──
function drawDog(ctx,cx,cy,stage){
  const lv=S.petLevel,h=S.petHappy/100,col=stage.color,es=stage.earSize||1;
  if(lv>=5){const g=ctx.createRadialGradient(cx,cy,8,cx,cy,50);g.addColorStop(0,'rgba(255,220,150,.3)');g.addColorStop(1,'rgba(255,220,150,0)');ctx.beginPath();ctx.arc(cx,cy,50,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();}
  ctx.beginPath();ctx.ellipse(cx,cy+22,26,6,0,0,Math.PI*2);ctx.fillStyle='rgba(0,0,0,.07)';ctx.fill();
  ctx.beginPath();ctx.ellipse(cx,cy,27,21,0,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();
  ctx.beginPath();ctx.ellipse(cx,cy+4,14,11,0,0,Math.PI*2);ctx.fillStyle='#fffae0';ctx.fill();
  if(h>.5){[[cx-14,cy],[cx+14,cy]].forEach(([ex,ey])=>{ctx.beginPath();ctx.ellipse(ex,ey,7,5,.2,0,Math.PI*2);ctx.fillStyle='rgba(255,140,140,.3)';ctx.fill();});}
  ctx.beginPath();ctx.ellipse(cx,cy-16,18,14,0,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();
  // 垂耳
  [[cx-14,cy-22,-0.3],[cx+14,cy-22,0.3]].forEach(([ex,ey,r])=>{ctx.beginPath();ctx.ellipse(ex,ey+8*es,8*es,14*es,r,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();ctx.beginPath();ctx.ellipse(ex,ey+8*es,5*es,9*es,r,0,Math.PI*2);ctx.fillStyle='#d4a070';ctx.fill();});
  const headTop=cy-30;
  if(lv===3){ctx.font='13px sans-serif';ctx.fillText('🎖️',cx-7,headTop+2);}
  if(lv>=4){ctx.font='13px sans-serif';ctx.fillText(stage.crownIco||'🌟',cx-6,headTop+2);}
  if(lv>=5){ctx.beginPath();ctx.ellipse(cx,headTop-1,13,3.5,0,0,Math.PI*2);ctx.strokeStyle='rgba(255,215,0,.9)';ctx.lineWidth=2.5;ctx.shadowColor='#ffd700';ctx.shadowBlur=6;ctx.stroke();ctx.shadowBlur=0;}
  const ey=cy-18,ec=lv>=5?'#d4a000':lv>=3?'#a06030':'#4a2c10';
  [[cx-6.5,ey],[cx+6.5,ey]].forEach(([ex,e])=>{ctx.beginPath();ctx.ellipse(ex,e,3.5,4,0,0,Math.PI*2);ctx.fillStyle=ec;ctx.fill();ctx.beginPath();ctx.ellipse(ex+1.2,e-1.2,1,1,0,0,Math.PI*2);ctx.fillStyle='white';ctx.fill();});
  if(h>.7){ctx.fillStyle='#ff80a0';ctx.font='9px sans-serif';ctx.fillText('♡',cx-9,ey+2);ctx.fillText('♡',cx+4,ey+2);}
  ctx.beginPath();ctx.ellipse(cx,cy-10,4,3,0,0,Math.PI*2);ctx.fillStyle='#c03060';ctx.fill();
  if(h>.6){ctx.beginPath();ctx.arc(cx,cy-5,6,.1,Math.PI-.1);ctx.strokeStyle='#901040';ctx.lineWidth=2;ctx.stroke();ctx.fillStyle='#ff8080';ctx.beginPath();ctx.ellipse(cx,cy-5+3,4,2.5,0,0,Math.PI);ctx.fill();}
  else if(h>.3){ctx.beginPath();ctx.moveTo(cx-4,cy-6);ctx.lineTo(cx+4,cy-6);ctx.strokeStyle='#901040';ctx.lineWidth=1.8;ctx.stroke();}
  else{ctx.beginPath();ctx.arc(cx,cy-3,4,Math.PI+.3,-.3);ctx.strokeStyle='#901040';ctx.lineWidth=1.8;ctx.stroke();}
  drawTears(ctx,cx,cy,h);
  ctx.beginPath();ctx.moveTo(cx+22,cy+8);ctx.quadraticCurveTo(cx+46,cy-5+Math.sin(petT*4)*8,cx+30,cy-30);ctx.strokeStyle=col;ctx.lineWidth=7;ctx.lineCap='round';ctx.stroke();
  [[cx-22,cy+14,-.4],[cx+22,cy+14,.4]].forEach(([px,py,r])=>{ctx.beginPath();ctx.ellipse(px,py,8,6,r,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();});
  if(S.petEnergy<25){ctx.font='11px sans-serif';ctx.fillText('💤',cx+11,cy-31);}
}

// ── 熊猫 ──
function drawPanda(ctx,cx,cy,stage){
  const lv=S.petLevel,h=S.petHappy/100,col='#f5f5f5';
  ctx.beginPath();ctx.ellipse(cx,cy+22,27,6,0,0,Math.PI*2);ctx.fillStyle='rgba(0,0,0,.07)';ctx.fill();
  ctx.beginPath();ctx.ellipse(cx,cy,27,22,0,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();
  ctx.beginPath();ctx.ellipse(cx,cy+4,13,11,0,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();
  ctx.beginPath();ctx.ellipse(cx,cy-16,18,15,0,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();
  [[cx-13,cy-28],[cx+13,cy-28]].forEach(([ex,ey])=>{ctx.beginPath();ctx.arc(ex,ey,8,0,Math.PI*2);ctx.fillStyle='#222';ctx.fill();});
  if(h>.5){[[cx-14,cy-2],[cx+14,cy-2]].forEach(([ex,ey])=>{ctx.beginPath();ctx.ellipse(ex,ey,7,5,.2,0,Math.PI*2);ctx.fillStyle='rgba(255,120,120,.25)';ctx.fill();});}
  const headTop=cy-31;
  if(lv>=2&&stage.crownIco){ctx.font='13px sans-serif';ctx.fillText(stage.crownIco,cx-6,headTop+2);}
  if(lv>=5){ctx.beginPath();ctx.ellipse(cx,headTop-1,13,3.5,0,0,Math.PI*2);ctx.strokeStyle='rgba(180,140,255,.9)';ctx.lineWidth=2.5;ctx.shadowColor='#b890ff';ctx.shadowBlur=6;ctx.stroke();ctx.shadowBlur=0;}
  // 眼圈
  [[cx-7,cy-18],[cx+7,cy-18]].forEach(([ex,ey])=>{ctx.beginPath();ctx.ellipse(ex,ey,5.5,6,0,0,Math.PI*2);ctx.fillStyle='#222';ctx.fill();ctx.beginPath();ctx.ellipse(ex,ey,3.5,4,0,0,Math.PI*2);ctx.fillStyle='#fffbe8';ctx.fill();ctx.beginPath();ctx.ellipse(ex+1,ey-1,1,1,0,0,Math.PI*2);ctx.fillStyle='white';ctx.fill();});
  ctx.beginPath();ctx.ellipse(cx,cy-11,3,2.5,0,0,Math.PI*2);ctx.fillStyle='#333';ctx.fill();
  if(h>.6){ctx.beginPath();ctx.arc(cx,cy-7,5,.2,Math.PI-.2);ctx.strokeStyle='#444';ctx.lineWidth=2;ctx.stroke();}
  else if(h>.3){ctx.beginPath();ctx.moveTo(cx-4,cy-7);ctx.lineTo(cx+4,cy-7);ctx.strokeStyle='#444';ctx.lineWidth=1.8;ctx.stroke();}
  else{ctx.beginPath();ctx.arc(cx,cy-4,4,Math.PI+.3,-.3);ctx.strokeStyle='#444';ctx.lineWidth=1.8;ctx.stroke();}
  drawTears(ctx,cx,cy,h);
  [[cx-22,cy+14,-.4,'#222'],[cx+22,cy+14,.4,'#222']].forEach(([px,py,r,c])=>{ctx.beginPath();ctx.ellipse(px,py,8,6,r,0,Math.PI*2);ctx.fillStyle=c;ctx.fill();});
  if(lv>=2){ctx.font='13px sans-serif';ctx.fillText('🎋',cx+12,cy+6);}
  if(S.petEnergy<25){ctx.font='11px sans-serif';ctx.fillText('💤',cx+11,cy-31);}
}

// ── 小狐 ──
function drawFox(ctx,cx,cy,stage){
  const lv=S.petLevel,h=S.petHappy/100,col=stage.color;
  if(lv>=5){const g=ctx.createRadialGradient(cx,cy,8,cx,cy,52);g.addColorStop(0,'rgba(255,160,80,.25)');g.addColorStop(1,'rgba(255,160,80,0)');ctx.beginPath();ctx.arc(cx,cy,52,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();}
  ctx.beginPath();ctx.ellipse(cx,cy+22,26,6,0,0,Math.PI*2);ctx.fillStyle='rgba(0,0,0,.07)';ctx.fill();
  ctx.beginPath();ctx.ellipse(cx,cy,26,20,0,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();
  ctx.beginPath();ctx.ellipse(cx,cy+4,12,10,0,0,Math.PI*2);ctx.fillStyle='#ffe8d0';ctx.fill();
  ctx.beginPath();ctx.ellipse(cx,cy-16,17,14,0,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();
  // 尖耳朵
  [[cx-11,cy-28,-.5,1],[cx+11,cy-28,.5,-1]].forEach(([ex,ey,r,d])=>{ctx.beginPath();ctx.moveTo(ex,ey-14);ctx.lineTo(ex-8*d,ey+4);ctx.lineTo(ex+8*d,ey+4);ctx.closePath();ctx.fillStyle=col;ctx.fill();ctx.beginPath();ctx.moveTo(ex,ey-8);ctx.lineTo(ex-4*d,ey+2);ctx.lineTo(ex+4*d,ey+2);ctx.closePath();ctx.fillStyle='#fff0e0';ctx.fill();});
  const headTop=cy-30;
  if(lv>=3&&stage.crownIco){ctx.font='13px sans-serif';ctx.fillText(stage.crownIco,cx-6,headTop+2);}
  if(lv>=5){ctx.beginPath();ctx.ellipse(cx,headTop-1,12,3.5,0,0,Math.PI*2);ctx.strokeStyle='rgba(255,180,80,.9)';ctx.lineWidth=2.5;ctx.shadowColor='#ffb050';ctx.shadowBlur=6;ctx.stroke();ctx.shadowBlur=0;}
  const ey=cy-18,ec=lv>=4?'#e06020':lv>=2?'#b04010':'#502010';
  [[cx-6.5,ey],[cx+6.5,ey]].forEach(([ex,e])=>{ctx.beginPath();ctx.ellipse(ex,e,3.8,4.5,0,0,Math.PI*2);ctx.fillStyle=ec;ctx.fill();ctx.beginPath();ctx.ellipse(ex,e,2.2,3.4,0,0,Math.PI*2);ctx.fillStyle='#111';ctx.fill();ctx.beginPath();ctx.ellipse(ex+1.3,e-1.3,1,1,0,0,Math.PI*2);ctx.fillStyle='white';ctx.fill();});
  ctx.beginPath();ctx.ellipse(cx,cy-11,2.5,2,0,0,Math.PI*2);ctx.fillStyle='#d04060';ctx.fill();
  if(h>.65){ctx.beginPath();ctx.arc(cx,cy-7,5,.2,Math.PI-.2);ctx.strokeStyle='#a02040';ctx.lineWidth=1.8;ctx.stroke();}
  else if(h>.3){ctx.beginPath();ctx.moveTo(cx-4,cy-7);ctx.lineTo(cx+4,cy-7);ctx.strokeStyle='#a02040';ctx.lineWidth=1.5;ctx.stroke();}
  else{ctx.beginPath();ctx.arc(cx,cy-4,4,Math.PI+.3,-.3);ctx.strokeStyle='#a02040';ctx.lineWidth=1.5;ctx.stroke();}
  drawTears(ctx,cx,cy,h);
  // 多条蓬松尾巴
  const tails=Math.min(lv,5);
  for(let t=0;t<tails;t++){const off=(t-(tails-1)/2)*9;ctx.beginPath();ctx.moveTo(cx+22,cy+10);ctx.quadraticCurveTo(cx+50+off,cy-5+off*.5,cx+32+off,cy-34);ctx.strokeStyle=t%2===0?col:'#ffe8c0';ctx.lineWidth=9-t;ctx.lineCap='round';ctx.stroke();}
  [[cx-22,cy+14,-.4],[cx+22,cy+14,.4]].forEach(([px,py,r])=>{ctx.beginPath();ctx.ellipse(px,py,7.5,5.5,r,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();});
  if(S.petEnergy<25){ctx.font='11px sans-serif';ctx.fillText('💤',cx+11,cy-31);}
}

// ── 小鹿 ──
function drawDeer(ctx,cx,cy,stage){
  const lv=S.petLevel,h=S.petHappy/100,col=stage.color;
  ctx.beginPath();ctx.ellipse(cx,cy+22,24,5.5,0,0,Math.PI*2);ctx.fillStyle='rgba(0,0,0,.06)';ctx.fill();
  ctx.beginPath();ctx.ellipse(cx,cy,25,20,0,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();
  // 斑点
  if(lv<=2){[[cx-8,cy-5,3],[cx+10,cy+2,2.5],[cx-12,cy+8,2]].forEach(([sx,sy,sr])=>{ctx.beginPath();ctx.arc(sx,sy,sr,0,Math.PI*2);ctx.fillStyle='rgba(255,255,220,.5)';ctx.fill();});}
  ctx.beginPath();ctx.ellipse(cx,cy+4,12,10,0,0,Math.PI*2);ctx.fillStyle='#ffeedd';ctx.fill();
  ctx.beginPath();ctx.ellipse(cx,cy-16,17,14,0,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();
  // 小圆耳朵
  [[cx-13,cy-27],[cx+13,cy-27]].forEach(([ex,ey])=>{ctx.beginPath();ctx.arc(ex,ey,7,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();ctx.beginPath();ctx.arc(ex,ey,4,0,Math.PI*2);ctx.fillStyle='#ffb0a0';ctx.fill();});
  // 鹿角
  if(lv>=2){[[cx-10,cy-30,-1],[cx+10,cy-30,1]].forEach(([ax,ay,d])=>{ctx.strokeStyle='#8b5a2b';ctx.lineWidth=3;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(ax,ay-14);ctx.stroke();ctx.beginPath();ctx.moveTo(ax,ay-10);ctx.lineTo(ax+6*d,ay-18);ctx.stroke();if(lv>=3){ctx.beginPath();ctx.moveTo(ax,ay-6);ctx.lineTo(ax+4*d,ay-12);ctx.stroke();}if(lv>=4){ctx.beginPath();ctx.moveTo(ax,ay-13);ctx.lineTo(ax+5*d,ay-20);ctx.stroke();}if(lv>=3){const flowerX=ax+(lv>=4?9:7)*d,flowerY=ay-(lv>=4?22:18);ctx.font='11px sans-serif';ctx.fillText(stage.crownIco||'🌸',flowerX-6,flowerY+4);}});}
  if(lv>=5){ctx.beginPath();ctx.ellipse(cx,cy-31,13,3.5,0,0,Math.PI*2);ctx.strokeStyle='rgba(200,220,255,.9)';ctx.lineWidth=2.5;ctx.shadowColor='#c0d8ff';ctx.shadowBlur=6;ctx.stroke();ctx.shadowBlur=0;}
  const ey=cy-18,ec=lv>=4?'#6090e0':lv>=2?'#6060a0':'#3a2860';
  [[cx-6,ey],[cx+6,ey]].forEach(([ex,e])=>{ctx.beginPath();ctx.ellipse(ex,e,4.5,5,0,0,Math.PI*2);ctx.fillStyle=ec;ctx.fill();ctx.beginPath();ctx.ellipse(ex,e,3,3.5,0,0,Math.PI*2);ctx.fillStyle='#111';ctx.fill();ctx.beginPath();ctx.ellipse(ex+1.4,e-1.4,1,1,0,0,Math.PI*2);ctx.fillStyle='white';ctx.fill();});
  ctx.beginPath();ctx.ellipse(cx,cy-11,3.5,2.5,0,0,Math.PI*2);ctx.fillStyle='#e08090';ctx.fill();
  if(h>.65){ctx.beginPath();ctx.arc(cx,cy-6,5,.2,Math.PI-.2);ctx.strokeStyle='#a04060';ctx.lineWidth=1.8;ctx.stroke();}
  else if(h>.3){ctx.beginPath();ctx.moveTo(cx-4,cy-7);ctx.lineTo(cx+4,cy-7);ctx.strokeStyle='#a04060';ctx.lineWidth=1.5;ctx.stroke();}
  else{ctx.beginPath();ctx.arc(cx,cy-4,4,Math.PI+.3,-.3);ctx.strokeStyle='#a04060';ctx.lineWidth=1.5;ctx.stroke();}
  drawTears(ctx,cx,cy,h);
  [[cx-20,cy+14,-.3],[cx+20,cy+14,.3]].forEach(([px,py,r])=>{ctx.beginPath();ctx.ellipse(px,py,7,5.5,r,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();});
  if(S.petEnergy<25){ctx.font='11px sans-serif';ctx.fillText('💤',cx+8,cy-34);}
}

// ── 企鹅 ──
function drawPenguin(ctx,cx,cy,stage){
  const lv=S.petLevel,h=S.petHappy/100,col=stage.color;
  if(lv>=5){const g=ctx.createRadialGradient(cx,cy,5,cx,cy,48);g.addColorStop(0,'rgba(100,160,255,.3)');g.addColorStop(1,'rgba(100,160,255,0)');ctx.beginPath();ctx.arc(cx,cy,48,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();}
  ctx.beginPath();ctx.ellipse(cx,cy+22,22,5.5,0,0,Math.PI*2);ctx.fillStyle='rgba(0,0,0,.07)';ctx.fill();
  ctx.beginPath();ctx.ellipse(cx,cy+2,22,25,0,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();
  // 白肚子
  ctx.beginPath();ctx.ellipse(cx,cy+6,14,18,0,0,Math.PI*2);ctx.fillStyle='#f5f8ff';ctx.fill();
  ctx.beginPath();ctx.ellipse(cx,cy-18,15,13,0,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();
  // 小圆耳
  [[cx-10,cy-28],[cx+10,cy-28]].forEach(([ex,ey])=>{ctx.beginPath();ctx.arc(ex,ey,5.5,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();});
  // 道具
  const headTop=cy-31;
  if(lv>=2&&stage.crownIco){ctx.font='14px sans-serif';ctx.fillText(stage.crownIco,cx-7,headTop+2);}
  if(lv>=5){ctx.beginPath();ctx.ellipse(cx,headTop-1,11,3,0,0,Math.PI*2);ctx.strokeStyle='rgba(100,180,255,.9)';ctx.lineWidth=2.5;ctx.shadowColor='#60b0ff';ctx.shadowBlur=6;ctx.stroke();ctx.shadowBlur=0;}
  const ey=cy-19,ec=lv>=4?'#2060d0':'#111';
  [[cx-5,ey],[cx+5,ey]].forEach(([ex,e])=>{ctx.beginPath();ctx.arc(ex,e,4.5,0,Math.PI*2);ctx.fillStyle=ec;ctx.fill();ctx.beginPath();ctx.ellipse(ex+1.5,e-1.5,1.2,1.2,0,0,Math.PI*2);ctx.fillStyle='white';ctx.fill();});
  // 嘴巴
  ctx.beginPath();ctx.moveTo(cx-4,cy-10);ctx.lineTo(cx,cy-7);ctx.lineTo(cx+4,cy-10);ctx.fillStyle='#f0a020';ctx.fill();
  if(h>.65){ctx.beginPath();ctx.arc(cx,cy-4,5,.3,Math.PI-.3);ctx.strokeStyle='#c07010';ctx.lineWidth=2;ctx.stroke();}
  else if(h>.3){ctx.beginPath();ctx.moveTo(cx-3.5,cy-4);ctx.lineTo(cx+3.5,cy-4);ctx.strokeStyle='#c07010';ctx.lineWidth=1.5;ctx.stroke();}
  else{ctx.beginPath();ctx.arc(cx,cy-2,4,Math.PI+.3,-.3);ctx.strokeStyle='#c07010';ctx.lineWidth=1.5;ctx.stroke();}
  drawTears(ctx,cx,cy,h);
  // 小翅膀
  ctx.beginPath();ctx.ellipse(cx-22,cy+2,8,18,-.3,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();
  ctx.beginPath();ctx.ellipse(cx+22,cy+2,8,18,.3,0,Math.PI*2);ctx.fill();
  // 脚
  [[cx-9,cy+26],[cx+9,cy+26]].forEach(([fx,fy])=>{ctx.beginPath();ctx.ellipse(fx,fy,5,3.5,0,0,Math.PI*2);ctx.fillStyle='#f0a020';ctx.fill();});
  if(S.petEnergy<25){ctx.font='11px sans-serif';ctx.fillText('💤',cx+10,cy-32);}
}

// ── 小龙 ──
function drawDragon(ctx,cx,cy,stage){
  const lv=S.petLevel,h=S.petHappy/100,col=stage.color;
  if(lv>=5){const g=ctx.createRadialGradient(cx,cy,10,cx,cy,56);g.addColorStop(0,'rgba(255,200,50,.25)');g.addColorStop(1,'rgba(255,200,50,0)');ctx.beginPath();ctx.arc(cx,cy,56,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();for(let i=0;i<8;i++){const a=petT+i*Math.PI/4;ctx.font='8px sans-serif';ctx.fillText('✦',cx+Math.cos(a)*42-3,cy+Math.sin(a)*32);}}
  ctx.beginPath();ctx.ellipse(cx,cy+22,25,6,0,0,Math.PI*2);ctx.fillStyle='rgba(0,0,0,.07)';ctx.fill();
  ctx.beginPath();ctx.ellipse(cx,cy,25,20,0,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();
  // 鳞片纹理
  ctx.strokeStyle='rgba(0,0,0,.1)';ctx.lineWidth=1;
  for(let r=0;r<3;r++){ctx.beginPath();ctx.arc(cx,cy+5,10+r*6,0,Math.PI);ctx.stroke();}
  ctx.beginPath();ctx.ellipse(cx,cy-16,17,14,0,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();
  // 龙角
  [[cx-10,cy-28,-1],[cx+10,cy-28,1]].forEach(([hx,hy,d])=>{ctx.beginPath();ctx.moveTo(hx,hy);ctx.lineTo(hx+4*d,hy-14);ctx.lineTo(hx+6*d,hy-8);ctx.closePath();ctx.fillStyle=lv>=4?'#ffd700':'#d04020';ctx.fill();});
  // 翅膀（lv3+）
  if(lv>=3){ctx.fillStyle='rgba(200,80,30,.5)';ctx.beginPath();ctx.moveTo(cx-26,cy-5);ctx.quadraticCurveTo(cx-55,cy-35,cx-20,cy-55);ctx.quadraticCurveTo(cx-15,cy-40,cx-26,cy-5);ctx.fill();ctx.beginPath();ctx.moveTo(cx+26,cy-5);ctx.quadraticCurveTo(cx+55,cy-35,cx+20,cy-55);ctx.quadraticCurveTo(cx+15,cy-40,cx+26,cy-5);ctx.fill();}
  const headTop=cy-30;
  if(lv>=3&&stage.crownIco){ctx.font='13px sans-serif';ctx.fillText(stage.crownIco,cx-6,headTop+2);}
  if(lv>=5){ctx.beginPath();ctx.ellipse(cx,headTop-1,13,3.5,0,0,Math.PI*2);ctx.strokeStyle='rgba(255,200,50,.9)';ctx.lineWidth=2.5;ctx.shadowColor='#ffc830';ctx.shadowBlur=6;ctx.stroke();ctx.shadowBlur=0;}
  const ey=cy-18,ec=lv>=4?'#ffd700':lv>=2?'#ff4020':'#ff2000';
  [[cx-6.5,ey],[cx+6.5,ey]].forEach(([ex,e])=>{ctx.beginPath();ctx.ellipse(ex,e,4,4.5,0,0,Math.PI*2);ctx.fillStyle=ec;ctx.fill();ctx.beginPath();ctx.ellipse(ex,e,2,3.5,0,0,Math.PI*2);ctx.fillStyle='#222';ctx.fill();ctx.beginPath();ctx.ellipse(ex+1.3,e-1.3,1,1,0,0,Math.PI*2);ctx.fillStyle='white';ctx.fill();});
  // 龙嘴
  ctx.beginPath();ctx.ellipse(cx,cy-10,5,3.5,0,0,Math.PI*2);ctx.fillStyle='#c03010';ctx.fill();
  if(h>.6){// 喷小火
    ctx.beginPath();ctx.arc(cx,cy-5,5,.3,Math.PI-.3);ctx.strokeStyle='#802010';ctx.lineWidth=2;ctx.stroke();
    if(lv>=2){ctx.font='10px sans-serif';ctx.fillText('🔥',cx-4,cy-2);}
  }else if(h>.3){ctx.beginPath();ctx.moveTo(cx-4,cy-7);ctx.lineTo(cx+4,cy-7);ctx.strokeStyle='#802010';ctx.lineWidth=1.8;ctx.stroke();}
  else{ctx.beginPath();ctx.arc(cx,cy-4,4,Math.PI+.3,-.3);ctx.strokeStyle='#802010';ctx.lineWidth=1.8;ctx.stroke();}
  drawTears(ctx,cx,cy,h);
  // 龙尾
  ctx.beginPath();ctx.moveTo(cx+24,cy+8);ctx.quadraticCurveTo(cx+52,cy-5,cx+38,cy-30);ctx.strokeStyle=col;ctx.lineWidth=8;ctx.lineCap='round';ctx.stroke();
  ctx.beginPath();ctx.moveTo(cx+38,cy-30);ctx.lineTo(cx+44,cy-22);ctx.lineTo(cx+34,cy-20);ctx.closePath();ctx.fillStyle=lv>=4?'#ffd700':'#d04020';ctx.fill();
  [[cx-22,cy+14,-.4],[cx+22,cy+14,.4]].forEach(([px,py,r])=>{ctx.beginPath();ctx.ellipse(px,py,8,6,r,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();});
  if(S.petEnergy<25){ctx.font='11px sans-serif';ctx.fillText('💤',cx+12,cy-32);}
}

// ── 猫头鹰 ──
function drawOwl(ctx,cx,cy,stage){
  const lv=S.petLevel,h=S.petHappy/100,col=stage.color;
  ctx.beginPath();ctx.ellipse(cx,cy+22,24,6,0,0,Math.PI*2);ctx.fillStyle='rgba(0,0,0,.07)';ctx.fill();
  ctx.beginPath();ctx.ellipse(cx,cy+3,23,22,0,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();
  ctx.beginPath();ctx.ellipse(cx,cy+7,14,15,0,0,Math.PI*2);ctx.fillStyle='#fffae8';ctx.fill();
  ctx.beginPath();ctx.ellipse(cx,cy-17,17,15,0,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();
  // 耳羽（三角）
  [[cx-11,cy-30,-1],[cx+11,cy-30,1]].forEach(([ex,ey,d])=>{ctx.beginPath();ctx.moveTo(ex,ey-12);ctx.lineTo(ex-6*d,ey+4);ctx.lineTo(ex+6*d,ey+4);ctx.closePath();ctx.fillStyle=col;ctx.fill();ctx.beginPath();ctx.moveTo(ex,ey-7);ctx.lineTo(ex-3*d,ey+1);ctx.lineTo(ex+3*d,ey+1);ctx.closePath();ctx.fillStyle='#e8d090';ctx.fill();});
  const headTop=cy-31;
  if(lv>=2&&stage.crownIco){ctx.font='13px sans-serif';ctx.fillText(stage.crownIco,cx-6,headTop+2);}
  if(lv>=5){ctx.beginPath();ctx.ellipse(cx,headTop-1,12,3,0,0,Math.PI*2);ctx.strokeStyle='rgba(200,180,100,.9)';ctx.lineWidth=2.5;ctx.shadowColor='#c8b060';ctx.shadowBlur=6;ctx.stroke();ctx.shadowBlur=0;}
  // 大眼睛
  const ey=cy-17,ec=lv>=4?'#4040d0':lv>=2?'#305080':'#102040';
  [[cx-8,ey],[cx+8,ey]].forEach(([ex,e])=>{ctx.beginPath();ctx.arc(ex,e,7,0,Math.PI*2);ctx.fillStyle='#fffae8';ctx.fill();ctx.beginPath();ctx.arc(ex,e,5,0,Math.PI*2);ctx.fillStyle=ec;ctx.fill();ctx.beginPath();ctx.arc(ex,e,3,0,Math.PI*2);ctx.fillStyle='#111';ctx.fill();ctx.beginPath();ctx.ellipse(ex+2,e-2,1.5,1.5,0,0,Math.PI*2);ctx.fillStyle='white';ctx.fill();});
  // 嘴
  ctx.beginPath();ctx.moveTo(cx-3,cy-10);ctx.lineTo(cx,cy-6);ctx.lineTo(cx+3,cy-10);ctx.closePath();ctx.fillStyle='#d08020';ctx.fill();
  if(h>.65){ctx.beginPath();ctx.arc(cx,cy-4,5,.3,Math.PI-.3);ctx.strokeStyle='#a05010';ctx.lineWidth=2;ctx.stroke();}
  else if(h>.3){ctx.beginPath();ctx.moveTo(cx-4,cy-4);ctx.lineTo(cx+4,cy-4);ctx.strokeStyle='#a05010';ctx.lineWidth=1.5;ctx.stroke();}
  else{ctx.beginPath();ctx.arc(cx,cy-2,4,Math.PI+.3,-.3);ctx.strokeStyle='#a05010';ctx.lineWidth=1.5;ctx.stroke();}
  drawTears(ctx,cx,cy,h);
  // 翅膀
  ctx.beginPath();ctx.ellipse(cx-20,cy+5,10,17,-.3,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();
  ctx.beginPath();ctx.ellipse(cx+20,cy+5,10,17,.3,0,Math.PI*2);ctx.fill();
  // 爪子
  [[cx-8,cy+26],[cx+8,cy+26]].forEach(([fx,fy])=>{ctx.strokeStyle='#a06020';ctx.lineWidth=2.5;ctx.lineCap='round';[[-4,7],[0,8],[4,7]].forEach(([dx,dy])=>{ctx.beginPath();ctx.moveTo(fx,fy);ctx.lineTo(fx+dx,fy+dy);ctx.stroke();});});
  if(lv>=3&&h>.6){ctx.font='10px sans-serif';ctx.fillText('📖',cx-6,ey-10);}
  if(S.petEnergy<25){ctx.font='11px sans-serif';ctx.fillText('💤',cx+10,cy-32);}
}

// ── 小熊 ──
function drawBear(ctx,cx,cy,stage){
  const lv=S.petLevel,h=S.petHappy/100,col=stage.color;
  if(lv>=5){const g=ctx.createRadialGradient(cx,cy,8,cx,cy,52);g.addColorStop(0,'rgba(180,150,80,.25)');g.addColorStop(1,'rgba(180,150,80,0)');ctx.beginPath();ctx.arc(cx,cy,52,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();}
  ctx.beginPath();ctx.ellipse(cx,cy+22,28,6,0,0,Math.PI*2);ctx.fillStyle='rgba(0,0,0,.07)';ctx.fill();
  ctx.beginPath();ctx.ellipse(cx,cy,28,23,0,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();
  ctx.beginPath();ctx.ellipse(cx,cy+5,15,12,0,0,Math.PI*2);ctx.fillStyle='#ffe8c0';ctx.fill();
  if(h>.5){[[cx-15,cy-1],[cx+15,cy-1]].forEach(([ex,ey])=>{ctx.beginPath();ctx.ellipse(ex,ey,8,5,.2,0,Math.PI*2);ctx.fillStyle='rgba(255,140,140,.3)';ctx.fill();});}
  ctx.beginPath();ctx.ellipse(cx,cy-17,19,15,0,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();
  [[cx-14,cy-28],[cx+14,cy-28]].forEach(([ex,ey])=>{ctx.beginPath();ctx.arc(ex,ey,9,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();ctx.beginPath();ctx.arc(ex,ey,5.5,0,Math.PI*2);ctx.fillStyle='#ffe8c0';ctx.fill();});
  const headTop=cy-31;
  if(lv>=2&&stage.crownIco){ctx.font='13px sans-serif';ctx.fillText(stage.crownIco,cx-6,headTop+2);}
  if(lv>=5){ctx.beginPath();ctx.ellipse(cx,headTop-1,14,3.5,0,0,Math.PI*2);ctx.strokeStyle='rgba(255,200,80,.9)';ctx.lineWidth=2.5;ctx.shadowColor='#ffc850';ctx.shadowBlur=6;ctx.stroke();ctx.shadowBlur=0;}
  const ey=cy-18,ec=lv>=4?'#2040a0':lv>=2?'#402010':'#201000';
  [[cx-7,ey],[cx+7,ey]].forEach(([ex,e])=>{ctx.beginPath();ctx.arc(ex,e,4.5,0,Math.PI*2);ctx.fillStyle=ec;ctx.fill();ctx.beginPath();ctx.ellipse(ex+1.5,e-1.5,1.2,1.2,0,0,Math.PI*2);ctx.fillStyle='white';ctx.fill();});
  ctx.beginPath();ctx.ellipse(cx,cy-10,4,3,0,0,Math.PI*2);ctx.fillStyle='#2a1010';ctx.fill();
  if(h>.65){ctx.beginPath();ctx.arc(cx,cy-5,6,.25,Math.PI-.25);ctx.strokeStyle='#401010';ctx.lineWidth=2;ctx.stroke();}
  else if(h>.3){ctx.beginPath();ctx.moveTo(cx-5,cy-6);ctx.lineTo(cx+5,cy-6);ctx.strokeStyle='#401010';ctx.lineWidth=1.8;ctx.stroke();}
  else{ctx.beginPath();ctx.arc(cx,cy-3,5,Math.PI+.3,-.3);ctx.strokeStyle='#401010';ctx.lineWidth=1.8;ctx.stroke();}
  drawTears(ctx,cx,cy,h);
  [[cx-24,cy+15,-.4],[cx+24,cy+15,.4]].forEach(([px,py,r])=>{ctx.beginPath();ctx.ellipse(px,py,9,7,r,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();});
  if(S.petEnergy<25){ctx.font='11px sans-serif';ctx.fillText('💤',cx+13,cy-32);}
}

// ── 独角兽 ──
function drawUnicorn(ctx,cx,cy,stage){
  const lv=S.petLevel,h=S.petHappy/100,col=stage.color;
  const rainbowCols=['#ff8080','#ffb060','#ffe060','#80e080','#60b0ff','#c080ff'];
  if(lv>=4){const g=ctx.createRadialGradient(cx,cy,8,cx,cy,58);g.addColorStop(0,'rgba(220,180,255,.35)');g.addColorStop(1,'rgba(220,180,255,0)');ctx.beginPath();ctx.arc(cx,cy,58,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();for(let i=0;i<6;i++){const a=petT+i*Math.PI/3;ctx.beginPath();ctx.arc(cx+Math.cos(a)*44,cy+Math.sin(a)*32,2.5,0,Math.PI*2);ctx.fillStyle=rainbowCols[i];ctx.fill();}}
  ctx.beginPath();ctx.ellipse(cx,cy+22,28,6,0,0,Math.PI*2);ctx.fillStyle='rgba(0,0,0,.05)';ctx.fill();
  ctx.beginPath();ctx.ellipse(cx,cy,28,22,0,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();
  ctx.beginPath();ctx.ellipse(cx,cy+4,15,12,0,0,Math.PI*2);ctx.fillStyle='#fff8ff';ctx.fill();
  ctx.beginPath();ctx.ellipse(cx,cy-16,19,15,0,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();
  [[cx-13,cy-29,-0.2],[cx+13,cy-29,0.2]].forEach(([ex,ey,r])=>{ctx.beginPath();ctx.ellipse(ex,ey,7,9,r,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();ctx.beginPath();ctx.ellipse(ex,ey,4,5.5,r,0,Math.PI*2);ctx.fillStyle='#f0c0f0';ctx.fill();});
  // 彩虹鬃毛
  const maneX=cx+18;
  for(let i=0;i<6;i++){ctx.beginPath();ctx.ellipse(maneX,cy-22+i*6,5,4,-.5,0,Math.PI*2);ctx.fillStyle=rainbowCols[i];ctx.fill();}
  // 独角
  const hornX=cx,hornY=cy-32;
  const hgrad=ctx.createLinearGradient(hornX,hornY-18,hornX,hornY);
  hgrad.addColorStop(0,'#ffd700');hgrad.addColorStop(1,'#ffaaee');
  ctx.beginPath();ctx.moveTo(hornX,hornY-18);ctx.lineTo(hornX-5,hornY);ctx.lineTo(hornX+5,hornY);ctx.closePath();ctx.fillStyle=hgrad;ctx.fill();
  if(lv>=3){ctx.strokeStyle='rgba(255,255,255,.7)';ctx.lineWidth=1.5;for(let i=1;i<4;i++){ctx.beginPath();ctx.moveTo(hornX-5+i*3,hornY-18+i*5);ctx.lineTo(hornX-5+i*3+2,hornY-18+i*5+4);ctx.stroke();}}
  if(lv>=5){ctx.beginPath();ctx.ellipse(cx,hornY+3,13,3.5,0,0,Math.PI*2);ctx.strokeStyle='rgba(255,200,255,.9)';ctx.lineWidth=2.5;ctx.shadowColor='#ffb0ff';ctx.shadowBlur=8;ctx.stroke();ctx.shadowBlur=0;}
  const ey=cy-18,ec=lv>=4?'#a040d0':lv>=2?'#8040c0':'#602090';
  [[cx-7,ey],[cx+7,ey]].forEach(([ex,e])=>{ctx.beginPath();ctx.ellipse(ex,e,5,5.5,0,0,Math.PI*2);ctx.fillStyle=ec;ctx.fill();ctx.beginPath();ctx.ellipse(ex,e,3,4,0,0,Math.PI*2);ctx.fillStyle='#111';ctx.fill();ctx.beginPath();ctx.ellipse(ex+1.5,e-1.5,1.2,1.2,0,0,Math.PI*2);ctx.fillStyle='white';ctx.fill();});
  if(h>.7){ctx.fillStyle='#d060e0';ctx.font='9px sans-serif';ctx.fillText('★',cx-9,ey+2);ctx.fillText('★',cx+4,ey+2);}
  ctx.beginPath();ctx.ellipse(cx,cy-11,3,2.5,0,0,Math.PI*2);ctx.fillStyle='#e090c0';ctx.fill();
  if(h>.65){ctx.beginPath();ctx.arc(cx,cy-7,5,.2,Math.PI-.2);ctx.strokeStyle='#b060a0';ctx.lineWidth=1.8;ctx.stroke();}
  else if(h>.3){ctx.beginPath();ctx.moveTo(cx-4,cy-7);ctx.lineTo(cx+4,cy-7);ctx.strokeStyle='#b060a0';ctx.lineWidth=1.5;ctx.stroke();}
  else{ctx.beginPath();ctx.arc(cx,cy-4,4,Math.PI+.3,-.3);ctx.strokeStyle='#b060a0';ctx.lineWidth=1.5;ctx.stroke();}
  drawTears(ctx,cx,cy,h);
  // 彩虹尾巴
  for(let i=0;i<6;i++){const off=i*2.5-7.5;ctx.beginPath();ctx.moveTo(cx+25,cy+10);ctx.quadraticCurveTo(cx+50,cy-5+off,cx+32+off,cy-34);ctx.strokeStyle=rainbowCols[i];ctx.lineWidth=4;ctx.lineCap='round';ctx.stroke();}
  [[cx-23,cy+15,-.4],[cx+23,cy+15,.4]].forEach(([px,py,r])=>{ctx.beginPath();ctx.ellipse(px,py,8,6,r,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();});
  if(S.petEnergy<25){ctx.font='11px sans-serif';ctx.fillText('💤',cx+12,cy-34);}
}

// ── 小虎 ──
function drawTiger(ctx,cx,cy,stage){
  const lv=S.petLevel,h=S.petHappy/100,col=stage.color;
  if(lv>=5){// 白虎光环
    const g=ctx.createRadialGradient(cx,cy,8,cx,cy,54);g.addColorStop(0,'rgba(240,230,200,.3)');g.addColorStop(1,'rgba(240,230,200,0)');ctx.beginPath();ctx.arc(cx,cy,54,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();}
  ctx.beginPath();ctx.ellipse(cx,cy+22,27,6,0,0,Math.PI*2);ctx.fillStyle='rgba(0,0,0,.07)';ctx.fill();
  ctx.beginPath();ctx.ellipse(cx,cy,27,22,0,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();
  // 老虎条纹
  ctx.strokeStyle='rgba(0,0,0,.25)';ctx.lineWidth=3;ctx.lineCap='round';
  [[-8,5,[-16,0]],[8,5,[16,0]],[0,-5,[0,-15]]].forEach(([sx,sy,end])=>{ctx.beginPath();ctx.moveTo(cx+sx,cy+sy);ctx.lineTo(cx+end[0],cy+end[1]);ctx.stroke();});
  ctx.beginPath();ctx.ellipse(cx,cy+5,14,11,0,0,Math.PI*2);ctx.fillStyle='#ffe8c0';ctx.fill();
  if(h>.5){[[cx-15,cy],[cx+15,cy]].forEach(([ex,ey])=>{ctx.beginPath();ctx.ellipse(ex,ey,7.5,5,.2,0,Math.PI*2);ctx.fillStyle='rgba(255,140,140,.3)';ctx.fill();});}
  ctx.beginPath();ctx.ellipse(cx,cy-16,19,15,0,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();
  // 虎纹头部
  ctx.strokeStyle='rgba(0,0,0,.2)';ctx.lineWidth=2;
  [[cx-8,cy-24,cx-14,cy-30],[cx+8,cy-24,cx+14,cy-30],[cx,cy-22,cx,cy-30]].forEach(([x1,y1,x2,y2])=>{ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();});
  [[cx-13,cy-29,-1],[cx+13,cy-29,1]].forEach(([ex,ey,d])=>{ctx.beginPath();ctx.moveTo(ex,ey-12);ctx.lineTo(ex-7*d,ey+5);ctx.lineTo(ex+7*d,ey+5);ctx.closePath();ctx.fillStyle=col;ctx.fill();ctx.beginPath();ctx.moveTo(ex,ey-7);ctx.lineTo(ex-3.5*d,ey+2);ctx.lineTo(ex+3.5*d,ey+2);ctx.closePath();ctx.fillStyle='#ffb070';ctx.fill();});
  const headTop=cy-31;
  if(lv>=3&&stage.crownIco){ctx.font='13px sans-serif';ctx.fillText(stage.crownIco,cx-6,headTop+2);}
  if(lv>=5){ctx.beginPath();ctx.ellipse(cx,headTop-1,14,3.5,0,0,Math.PI*2);ctx.strokeStyle='rgba(255,230,180,.9)';ctx.lineWidth=2.5;ctx.shadowColor='#ffe8b0';ctx.shadowBlur=6;ctx.stroke();ctx.shadowBlur=0;}
  const ey=cy-18,ec=lv>=5?'#204080':lv>=3?'#406020':'#204010';
  [[cx-7,ey],[cx+7,ey]].forEach(([ex,e])=>{ctx.beginPath();ctx.ellipse(ex,e,4.5,5,0,0,Math.PI*2);ctx.fillStyle=ec;ctx.fill();ctx.beginPath();ctx.ellipse(ex,e,2.5,3.8,0,0,Math.PI*2);ctx.fillStyle='#111';ctx.fill();ctx.beginPath();ctx.ellipse(ex+1.5,e-1.5,1.2,1.2,0,0,Math.PI*2);ctx.fillStyle='white';ctx.fill();});
  // 虎嘴+胡须
  ctx.beginPath();ctx.ellipse(cx,cy-10,4.5,3.5,0,0,Math.PI*2);ctx.fillStyle='#e06030';ctx.fill();
  ctx.strokeStyle='rgba(200,150,80,.5)';ctx.lineWidth=1.2;
  [[cx-2,cy-9,cx-18,cy-12],[cx-2,cy-7,cx-18,cy-7],[cx+2,cy-9,cx+18,cy-12],[cx+2,cy-7,cx+18,cy-7]].forEach(([x1,y1,x2,y2])=>{ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();});
  if(h>.65){ctx.beginPath();ctx.arc(cx,cy-5,6,.2,Math.PI-.2);ctx.strokeStyle='#a03010';ctx.lineWidth=2;ctx.stroke();}
  else if(h>.3){ctx.beginPath();ctx.moveTo(cx-5,cy-6);ctx.lineTo(cx+5,cy-6);ctx.strokeStyle='#a03010';ctx.lineWidth=1.8;ctx.stroke();}
  else{ctx.beginPath();ctx.arc(cx,cy-3,5,Math.PI+.3,-.3);ctx.strokeStyle='#a03010';ctx.lineWidth=1.8;ctx.stroke();}
  drawTears(ctx,cx,cy,h);
  // 虎尾
  ctx.beginPath();ctx.moveTo(cx+26,cy+8);ctx.quadraticCurveTo(cx+50,cy-6,cx+34,cy-32);ctx.strokeStyle=col;ctx.lineWidth=8;ctx.lineCap='round';ctx.stroke();
  // 尾尖黑纹
  for(let i=0;i<3;i++){ctx.strokeStyle='rgba(0,0,0,.3)';ctx.lineWidth=3;ctx.beginPath();const oy=-25-i*4;ctx.moveTo(cx+30+i,cy+oy);ctx.lineTo(cx+38+i,cy+oy);ctx.stroke();}
  [[cx-23,cy+15,-.4],[cx+23,cy+15,.4]].forEach(([px,py,r])=>{ctx.beginPath();ctx.ellipse(px,py,8.5,6.5,r,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();});
  if(S.petEnergy<25){ctx.font='11px sans-serif';ctx.fillText('💤',cx+13,cy-32);}
}


// ── 衣服（贴合身体，不飘空）──
function drawCloth(ctx,cx,cy,previewId){
  const clothId=previewId||S.equippedCloth;if(!clothId)return;ctx.save();
  // 根据宠物头部位置定位（头部大约在 cy-16 到 cy-32 范围）
  const headCy=cy-17; // 头部中心Y
  if(clothId==='c_bow'){
    // 蝴蝶结贴在头顶左侧耳朵位置
    const bx=cx+12,by=headCy-12;
    ctx.fillStyle='#ff9ab8';ctx.strokeStyle='#e06080';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(bx,by);ctx.quadraticCurveTo(bx+9,by-8,bx+14,by-4);ctx.quadraticCurveTo(bx+9,by+1,bx,by);ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.moveTo(bx,by);ctx.quadraticCurveTo(bx-9,by-8,bx-14,by-4);ctx.quadraticCurveTo(bx-9,by+1,bx,by);ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.arc(bx,by,3,0,Math.PI*2);ctx.fillStyle='#f06090';ctx.fill();
  } else if(clothId==='c_hat'){
    // 草帽贴在头顶（不飘空）
    const hx=cx,hy=headCy-14;
    ctx.fillStyle='#e8c870';ctx.strokeStyle='#c0a030';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.ellipse(hx,hy+5,18,4,0,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.fillStyle='#f0d880';ctx.beginPath();ctx.moveTo(hx-10,hy+4);ctx.lineTo(hx-7,hy-8);ctx.lineTo(hx+7,hy-8);ctx.lineTo(hx+10,hy+4);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.ellipse(hx,hy,9,2.5,0,0,Math.PI*2);ctx.strokeStyle='#d44040';ctx.lineWidth=2;ctx.stroke();
  } else if(clothId==='c_crown'){
    // 皇冠贴在头顶（不超出太多）
    const crx=cx,cry=headCy-14;
    ctx.fillStyle='#ffd700';ctx.strokeStyle='#c8a000';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(crx-12,cry+3);ctx.lineTo(crx-12,cry-4);ctx.lineTo(crx-6,cry+0);ctx.lineTo(crx,cry-7);ctx.lineTo(crx+6,cry+0);ctx.lineTo(crx+12,cry-4);ctx.lineTo(crx+12,cry+3);ctx.closePath();ctx.fill();ctx.stroke();
    ['#ff4040','#4040ff','#ff4040'].forEach((c,i)=>{ctx.beginPath();ctx.arc(crx-6+i*6,cry+0,1.8,0,Math.PI*2);ctx.fillStyle=c;ctx.fill();});
  } else if(clothId==='c_scarf'){
    // 围巾绕脖子（头部和身体之间）
    const sy=cy-3;
    ctx.fillStyle='rgba(220,80,80,.75)';ctx.beginPath();ctx.ellipse(cx,sy,20,6,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.45)';ctx.lineWidth=1.5;
    for(let i=-2;i<=2;i++){ctx.beginPath();ctx.moveTo(cx+i*8-2,sy-5);ctx.lineTo(cx+i*8-2,sy+5);ctx.stroke();}
    // 围巾下垂部分
    ctx.fillStyle='rgba(220,80,80,.7)';ctx.beginPath();ctx.moveTo(cx-20,sy-2);ctx.lineTo(cx-8,sy+9);ctx.lineTo(cx-5,sy+13);ctx.fill();
  } else if(clothId==='c_sunglasses'){
    // 墨镜在眼睛位置
    const gy=headCy+1;
    ctx.strokeStyle='#b03060';ctx.lineWidth=1.5;
    [[cx-7,gy],[cx+7,gy]].forEach(([lx,ly])=>{ctx.beginPath();ctx.moveTo(lx,ly);ctx.bezierCurveTo(lx-4,ly-5,lx-8,ly-5,lx-8,ly);ctx.bezierCurveTo(lx-8,ly+4,lx,ly+3.5,lx,ly);ctx.fillStyle='rgba(220,80,120,.5)';ctx.fill();ctx.stroke();});
    ctx.beginPath();ctx.moveTo(cx-3,gy);ctx.lineTo(cx+3,gy);ctx.strokeStyle='#b03060';ctx.stroke();
    [cx-16,cx+16].forEach(bx=>{ctx.beginPath();ctx.moveTo(bx,gy-1);ctx.lineTo(bx+(bx<cx?1.5:-1.5),gy+1);ctx.strokeStyle='#808080';ctx.stroke();});
  } else if(clothId==='c_backpack'){
    // 书包贴在身体右侧背部
    const bpx=cx+19,bpy=cy-4;
    ctx.fillStyle='#6090e0';ctx.strokeStyle='#4070c0';ctx.lineWidth=1.2;
    ctx.beginPath();ctx.roundRect(bpx-6,bpy-9,13,15,3);ctx.fill();ctx.stroke();
    ctx.fillStyle='#80b0ff';ctx.beginPath();ctx.roundRect(bpx-3.5,bpy-6,7,5.5,2);ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.arc(bpx,bpy+4,1.3,0,Math.PI*2);ctx.fillStyle='#ffd700';ctx.fill();
    // 背带
    ctx.strokeStyle='#4070c0';ctx.lineWidth=1.5;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(bpx-6,bpy-9);ctx.bezierCurveTo(bpx-14,bpy-8,bpx-14,bpy+2,bpx-6,bpy+6);ctx.stroke();
  }
  ctx.restore();
}

// ─── PET UI ──────────────────────────────────────
function updatePetUI(){
  // 数值显示整数
  ['food','happy','clean','energy'].forEach(k=>{const v=Math.round(S['pet'+k.charAt(0).toUpperCase()+k.slice(1)]);const bar=document.getElementById('sf-'+k),val=document.getElementById('sv-'+k);if(bar)bar.style.width=v+'%';if(val)val.textContent=v;});
  const evoReq=EVO_EXP_REQUIRED[Math.min(S.petLevel,EVO_EXP_REQUIRED.length-1)]||0;
  const learnPct=evoReq>0?Math.min(100,Math.round((S.petLearnExp||0)/evoReq*100)):100;
  const lb=document.getElementById('sf-learn'),lv=document.getElementById('sv-learn');if(lb)lb.style.width=learnPct+'%';if(lv)lv.textContent=(S.petLearnExp||0);
  const avg=Math.round((S.petFood+S.petHappy+S.petClean+S.petEnergy)/4);
  const stage=getEvoStage(),breed=SHOP_PETS.find(p=>p.id===S.activePet)||SHOP_PETS[0];
  const cloth=SHOP_CLOTHES.find(c=>c.id===S.equippedCloth);
  const lbdg=document.getElementById('pet-lv-badge');if(lbdg)lbdg.textContent=`Lv.${S.petLevel} ${stage.name}`;
  const pn=document.getElementById('pet-name');if(pn)pn.textContent=S.petName||'小饼干';
  const ps=document.getElementById('pet-stage-name');if(ps)ps.textContent=`${breed.name} · ${stage.desc}`;
  // 进化按钮变灰（经验不足时）
  const evoAct=document.getElementById('evolve-act');
  if(evoAct){const evoNext=EVO_EXP_REQUIRED[Math.min(S.petLevel,EVO_EXP_REQUIRED.length-1)]||0;const canEvo=S.petLevel<5&&(S.petLearnExp||0)>=evoNext;evoAct.style.opacity=canEvo?'1':'0.45';evoAct.style.background=canEvo?'':'rgba(100,160,100,.04)';}
  let mood='😊 心情不错';if(avg>=82)mood='🥰 超级幸福！';else if(avg>=65)mood='😊 心情不错';else if(avg>=45)mood='😐 还好啦';else if(avg>=25)mood='😟 有点难受…';else mood='😢 快来照顾我！';
  const pm=document.getElementById('pet-mood');if(pm)pm.textContent=mood;
  const evoNext=EVO_EXP_REQUIRED[Math.min(S.petLevel,EVO_EXP_REQUIRED.length-1)]||0;
  const piEl=document.getElementById('pet-info');if(piEl)piEl.innerHTML=`🐾 品种：${breed.name}<br>✨ 形态：${stage.name}（${stage.desc}）<br>📖 学习经验：${S.petLearnExp||0}/${S.petLevel<5?evoNext:'已满级'}<br>👗 穿戴：${cloth?cloth.name:'无'}<br>🍎 喂食次数：${S.petFeedCount}<br>📊 综合幸福：${avg}%<br>💡 拖动宠物·点击戳一戳`;
  const bd=document.getElementById('bd-pet'),sbd=document.getElementById('sbd-pet');[bd,sbd].forEach(el=>{if(!el)return;if(avg<35){el.textContent='!';el.classList.add('on');}else{el.textContent='';el.classList.remove('on');}});
}

// ─── PET ACTIONS ─────────────────────────────────
let talkTimer=null;
function showPetTalk(key){const lines=PET_TALK[key]||[];if(!lines.length)return;let txt=lines[Math.floor(Math.random()*lines.length)];txt=txt.replace('{name}',S.petName||'我');const el=document.getElementById('pet-talk');if(!el)return;el.textContent=txt;el.classList.add('show');clearTimeout(talkTimer);talkTimer=setTimeout(()=>el.classList.remove('show'),3500);}

const PET_CFGS={
  feed: {t:'🍎 喂食',n:1,fd:+28,hp:+5,cl:-2,en:0,key:'feed'},
  play: {t:'🎾 玩耍',n:1,fd:-8,hp:+30,cl:-10,en:-15,key:'play'},
  bath: {t:'🛁 洗澡（需答对2题）',n:2,fd:0,hp:+12,cl:+45,en:-5,key:'bath'},
  train:{t:'📖 学习（需答对2题）',n:2,fd:-5,hp:+15,cl:0,en:-20,key:'train'},
  sleep:{t:'💤 休息',n:1,fd:-2,hp:+10,cl:+5,en:+40,key:'sleep'},
};

function showEvoTip(msg,sub){
  const pet=SHOP_PETS.find(p=>p.id===S.activePet)||SHOP_PETS[0];
  const stageIco=['🐹','🐱','🐰','🐦'][['hamster','cat','rabbit','bird'].indexOf(pet.breed||'hamster')]||'🐹';
  document.getElementById('evo-tip-ico').textContent=stageIco;
  document.getElementById('evo-tip-msg').textContent=msg;
  document.getElementById('evo-tip-sub').textContent=sub||'';
  document.getElementById('evo-tip-ov').classList.add('on');
}

function petAct(type){
  if(type==='evolve'){
    if(S.petLevel>=5){showEvoTip('已经是最高进化形态了！🌟','继续照顾宠物，保持满级状态！');return;}
    const req=EVO_EXP_REQUIRED[Math.min(S.petLevel,EVO_EXP_REQUIRED.length-1)]||0;
    if((S.petLearnExp||0)<req){
      showPetTalk('train');
      showEvoTip(`经验不足，无法进化！`,`当前学习经验：${S.petLearnExp||0} / 需要：${req}\n还差 ${req-(S.petLearnExp||0)} 点，快去学习吧！`);
      return;
    }
    showPetTalk('evolve_ready');
    openQuiz({title:'⬆️ 进化（需答对5题）',needed:5,onSuccess:()=>{S.petLevel++;S.petLearnExp=0;gainExp(60);saveCurPet();persistAccount();updatePetUI();checkAchs();showPetTalk('evolve_done');const st=getEvoStage();showResult('🌟','成功进化！',`${S.petName} 进化为【${st.name}】\n${st.desc}\n✨继续好好照顾ta！`);},onFail:()=>{}});return;
  }
  if(type==='degrade'){
    if(S.petLevel<=1){showToast('已是初始形态，无法退化');return;}
    showPetTalk('degrade_ask');
    setTimeout(()=>{
      openConfirm('⬇️',`${S.petName}：难道你不满意现在的我吗？🥺\n\n确定要让宠物退化到上一个形态吗？\n（退化后需重新积累学习经验）`,
        ()=>{openQuiz({title:'⬇️ 退化确认（答对1题）',needed:1,onSuccess:()=>{S.petLevel--;S.petLearnExp=0;saveCurPet();persistAccount();updatePetUI();showPetTalk('degrade_done');showToast(`${S.petName} 退化到了 ${getEvoStage().name} 形态`);}});},
        false,
        ()=>showPetTalk('degrade_cancel')
      );
    },800);return;
  }
  const cfg=PET_CFGS[type];if(!cfg)return;
  if((type==='play'||type==='train')&&S.petEnergy<15){showToast('体力不足！请先让宠物休息');showPetTalk('low_energy');return;}
  openQuiz({title:cfg.t,needed:cfg.n,
    onSuccess:()=>{
      S.petFood=Math.max(0,Math.min(100,S.petFood+(cfg.fd||0)));S.petHappy=Math.max(0,Math.min(100,S.petHappy+(cfg.hp||0)));S.petClean=Math.max(0,Math.min(100,S.petClean+(cfg.cl||0)));S.petEnergy=Math.max(0,Math.min(100,S.petEnergy+(cfg.en||0)));
      if(type==='feed'){S.petFeedCount++;S.coins+=2;S.totalCoins+=2;}
      if(type==='train'){S.petLearnExp=(S.petLearnExp||0)+30;gainExp(25);S.coins+=5;S.totalCoins+=5;}
      else{gainExp(cfg.n*12);}
      showPetTalk(cfg.key);saveCurPet();persistAccount();updatePetUI();checkAchs();
      const msgs={feed:`饱腹+28→${Math.round(S.petFood)}\n心情+5→${Math.round(S.petHappy)}`,play:`心情+30→${Math.round(S.petHappy)}\n体力-15→${Math.round(S.petEnergy)}`,bath:`清洁+45→${Math.round(S.petClean)}\n心情+12→${Math.round(S.petHappy)}`,train:`心情+15→${Math.round(S.petHappy)}\n学习经验+30→${S.petLearnExp||0}\n金币+5`,sleep:`体力+40→${Math.round(S.petEnergy)}\n心情+10→${Math.round(S.petHappy)}`};
      const icos={feed:'🍎',play:'🎾',bath:'🛁',train:'📖',sleep:'💤'};
      showResult(icos[type]||'✨',cfg.t+'完成！',msgs[type]||'');
    },
    onFail:()=>{S.petHappy=Math.max(0,S.petHappy-8);S.petEnergy=Math.max(0,S.petEnergy-5);saveCurPet();persistAccount();updatePetUI();showResult('😢','答题失败…',`${S.petName}有点失望\n心情-8→${Math.round(S.petHappy)}\n体力-5→${Math.round(S.petEnergy)}`);}
  });
}

// ─── SHOP ─────────────────────────────────────────
let curShopTab='seeds';
function shopTab(tab){curShopTab=tab;document.querySelectorAll('.stab').forEach((t,i)=>t.classList.toggle('on',['seeds','clothes','pets','tools'][i]===tab));renderShop();}
function renderShop(){
  const g=document.getElementById('shop-grid');g.innerHTML='';
  if(curShopTab==='seeds'){SEED_IDS.forEach(sid=>{const sd=SEEDS[sid];const unlocked=S.unlockedSeeds.includes(sid);const d=document.createElement('div');d.className='shop-item'+(unlocked?' owned':'');d.innerHTML=`<div class="si-ico">${sd.ico}</div><div class="si-nm">${sd.name}</div><div class="si-desc">${sd.desc}<br>🪙${sd.reward}收益·${sd.autoGrowH*4}h成熟</div><div class="si-price">${unlocked?'每粒🪙'+sd.buyCoins:sd.shopUnlock>0?'解锁🪙'+sd.shopUnlock:'免费'}</div><div class="si-tag ${unlocked?'green':'gold'}">${unlocked?'库存：'+S.seedBag[sid]+'粒':sd.shopUnlock>0?'点击解锁':'✓已解锁'}</div>`;if(!unlocked&&sd.shopUnlock>0){d.onclick=()=>{openConfirm(sd.ico,`花费🪙${sd.shopUnlock}解锁${sd.name}？`,()=>{if(S.coins<sd.shopUnlock){showToast('金币不足！');return;}S.coins-=sd.shopUnlock;S.unlockedSeeds.push(sid);persistAccount();renderShop();showToast(`✅${sd.name}已解锁！`);checkAchs();});};}else if(unlocked){d.onclick=()=>openSeedPicker('buy',true,null);}g.appendChild(d);});}
  else if(curShopTab==='clothes'){SHOP_CLOTHES.forEach(item=>{const owned=S.ownedClothes.includes(item.id),equipped=S.equippedCloth===item.id;const d=document.createElement('div');d.className='shop-item'+(equipped?' equipped':owned?' owned':'');d.innerHTML=`<div class="si-ico">${item.ico}</div><div class="si-nm">${item.name}</div><div class="si-desc">${item.desc}</div><div class="si-price">${owned?(equipped?'✓穿戴中':'已拥有'):'🪙'+item.price}</div>${equipped?'<div class="si-tag green">✓正在穿戴</div>':''}`;d.onclick=()=>{if(!owned){openClothPreview(item);}else{S.equippedCloth=equipped?null:item.id;saveCurPet();persistAccount();renderShop();updatePetUI();showPetTalk(equipped?'tap':'cloth_on');showToast(equipped?`已脱下${item.name}`:`已穿上${item.name}！`);}};g.appendChild(d);});}
  else if(curShopTab==='pets'){SHOP_PETS.forEach(item=>{const owned=S.ownedPets.includes(item.id),active=S.activePet===item.id;const lvReq=item.levelUnlock||0;const locked=!owned&&S.level<lvReq;const d=document.createElement('div');d.className='shop-item'+(active?' equipped':owned?' owned':locked?' soldout':'');const previewId='petprev_'+item.id;const lockBadge=locked?`<div class="si-tag gold">🔒 Lv.${lvReq}解锁</div>`:'';d.innerHTML=`<canvas id="${previewId}" width="60" height="60" style="display:block;margin:0 auto 4px;border-radius:50%;background:linear-gradient(135deg,#d4f0d4,#b0d8b0);${locked?'filter:grayscale(0.7)':''}" ></canvas><div class="si-nm">${item.name}</div><div class="si-desc">${item.desc}</div><div class="si-price">${owned?(active?'✓当前宠物':'已拥有'):locked?'等级不足':'🪙'+item.price+(item.price===0?'（免费）':'')}</div>${lockBadge}`;setTimeout(()=>{const cvs=document.getElementById(previewId);if(cvs)drawPetPreviewInCanvas(cvs,item.breed,1);},30);d.onclick=()=>{if(locked){showToast(`需要达到Lv.${lvReq}才能解锁！`);return;}if(!owned){openConfirm(item.ico,`${item.price===0?'领养':'购买'}${item.name}？${item.price>0?'\n费用：🪙'+item.price:''}`,()=>{if(item.price>0&&S.coins<item.price){showToast('金币不足！');return;}if(item.price>0)S.coins-=item.price;S.ownedPets.push(item.id);persistAccount();renderShop();updateTop();checkAchs();setTimeout(()=>showPetTalk('first_buy_'+item.breed),200);showResult(item.ico,'获得了新宠物！',`${item.name}\n去宠物页面切换ta吧！`);});}else if(!active){saveCurPet();showPetTalk('switch_away');openConfirm(item.ico,`切换到${item.name}？\n当前宠物进度已保存，切换回来时恢复。`,()=>{S.activePet=item.id;loadPetSave(item.id);persistAccount();renderShop();updatePetUI();updateTop();setTimeout(()=>showPetTalk('switch_back'),600);});}};g.appendChild(d);});}
  else if(curShopTab==='tools'){SHOP_TOOLS.forEach(item=>{const d=document.createElement('div');
    // 自动喷水器：买后售罄
    const isSoldOut=(item.type==='auto_water'&&S.hasAutoWater)||(item.type==='auto_pest'&&S.hasAutoPest);
    const priceStr=item.type==='coins_for_stars'?`⭐${item.starPrice}积分`:`🪙${item.price}`;
    d.className='shop-item'+(isSoldOut?' soldout':'');
    d.innerHTML=`<div class="si-ico">${item.ico}</div><div class="si-nm">${item.name}</div><div class="si-desc">${item.desc}</div><div class="si-price">${isSoldOut?'✓ 已安装/售罄':priceStr}</div>`;
    if(!isSoldOut)d.onclick=()=>openConfirm(item.ico,`购买${item.name}？\n${item.desc}\n费用：${priceStr}`,()=>{
      if(item.type==='instant_fert'){if(S.coins<item.price){showToast('金币不足！');return;}const cnt=S.plots.filter(p=>['s0','s1','s2'].includes(p.s)).length;if(!cnt){showToast('没有生长中的作物！');return;}S.coins-=item.price;S.plots.forEach((p,i)=>{if(['s0','s1','s2'].includes(p.s))growPlot(i,20);});persistAccount();renderFarm();updateTop();showToast('💊超级肥料！所有作物+20%');}
      else if(item.type==='buy_pest'){if(S.coins<item.price){showToast('金币不足！');return;}S.coins-=item.price;S.pestStock=(S.pestStock||0)+1;persistAccount();updateTop();renderShop();showToast(`🧴购入除虫药×1，库存：${S.pestStock}瓶`);}
      else if(item.type==='exp_boost'){if(S.coins<item.price){showToast('金币不足！');return;}S.coins-=item.price;S.expBoostLeft+=10;persistAccount();updateTop();showToast('📖学霸加成激活！答题经验×2，持续10题');}
      else if(item.type==='coins_for_stars'){if(S.score<item.starPrice){showToast(`积分不足！需要⭐${item.starPrice}`);return;}S.score-=item.starPrice;S.coins+=50;S.totalCoins+=50;persistAccount();updateTop();showToast('💰兑换了50金币！可多次兑换');}
      else if(item.type==='auto_water'){if(S.coins<item.price){showToast('金币不足！');return;}S.coins-=item.price;S.hasAutoWater=true;persistAccount();renderFarm();updateTop();renderShop();showToast('🚿自动喷水器已安装！地块上显示🚿');}
      else if(item.type==='auto_pest'){if(S.coins<item.price){showToast('金币不足！');return;}S.coins-=item.price;S.hasAutoPest=true;S.plots.forEach(p=>p.hasBug=false);persistAccount();renderFarm();updateTop();renderShop();showToast('🤖全自动除虫机已安装！永久消灭虫害！');}
    });
    g.appendChild(d);});}
}

function openClothPreview(item){document.getElementById('cloth-ov-title').textContent=`👗 ${item.name} 穿戴预览`;document.getElementById('cloth-preview-name').textContent=item.desc;document.getElementById('cloth-price-hint').textContent=`价格：🪙${item.price}`;const cvs=document.getElementById('cloth-preview-canvas');const ctx=cvs.getContext('2d');ctx.clearRect(0,0,120,120);const stage=getEvoStage();const breed=S.petBreed||'hamster';drawPetBreed(ctx,breed,60,62,stage);drawCloth(ctx,60,62,item.id);const btn=document.getElementById('cloth-buy-btn');btn.onclick=()=>{if(S.coins<item.price){showToast(`金币不足！需要🪙${item.price}`);return;}S.coins-=item.price;S.ownedClothes.push(item.id);S.equippedCloth=item.id;saveCurPet();persistAccount();renderShop();updatePetUI();updateTop();document.getElementById('cloth-ov').classList.remove('on');showPetTalk('cloth_on');showResult(item.ico,'购买成功！',`${item.name}已购买并穿上！`);checkAchs();};document.getElementById('cloth-ov').classList.add('on');}

// ─── CLASS SYSTEM ─────────────────────────────────
function getClassData(){try{return JSON.parse(localStorage.getItem(CLASS_KEY)||'{}');}catch(e){return {};}}
function saveClassData(d){try{localStorage.setItem(CLASS_KEY,JSON.stringify(d));}catch(e){}}
function joinClassBoard(cls,name,score){const cd=getClassData();if(!cd[cls])cd[cls]=[];const idx=cd[cls].findIndex(m=>m.name===name);if(idx>=0)cd[cls][idx]={name,score,level:S.level||1};else cd[cls].push({name,score:score||0,level:1});saveClassData(cd);}
function syncClassScore(){if(!S.classId||!S.playerName)return;joinClassBoard(S.classId,S.playerName,S.score);}

// 排行榜：等级优先，同等级按积分
function sortMembers(members){return [...members].sort((a,b)=>{if(b.level!==a.level)return (b.level||1)-(a.level||1);return b.score-a.score;});}

let _lastPickedName='';
function updateClassSection(){
  const sec=document.getElementById('class-section');if(!sec)return;
  if(!S.classId){sec.innerHTML=`<div style="font-size:.74rem;color:var(--muted);margin-bottom:9px">加入班级后可参与排行榜！</div><div style="margin-bottom:8px"><label class="ci-label">班级名称</label><input class="ci" id="ci-class" placeholder="如：高三2班" style="user-select:text"></div><button onclick="joinClass()" style="width:100%;padding:10px;border-radius:10px;border:none;background:var(--green);color:#fff;font-size:.82rem;cursor:pointer;font-family:'Noto Sans SC',sans-serif">加入/创建班级</button>`;return;}
  const cd=getClassData();const members=sortMembers(cd[S.classId]||[]);const myRank=members.findIndex(m=>m.name===S.playerName)+1;S._classRank=myRank||99;
  sec.innerHTML=`<div style="font-size:.72rem;color:var(--muted);margin-bottom:8px">🏫 <b style="color:var(--dgreen)">${S.classId}</b> · 我的排名：<b style="color:var(--gold)">#${myRank||'-'}</b><span style="font-size:.6rem;margin-left:6px">（按等级→积分排名）</span></div>
    <div style="display:flex;gap:6px;margin-bottom:8px">
      <input id="class-search" class="ci" style="flex:1;padding:6px 10px;font-size:.78rem" placeholder="搜索姓名..." oninput="searchClassMember(this.value)" style="user-select:text">
      <button onclick="randomPickMember()" style="padding:6px 12px;border-radius:9px;border:1.5px solid var(--border);background:var(--panel);font-size:.72rem;cursor:pointer;white-space:nowrap;font-family:'Noto Sans SC',sans-serif">🎲 随机抽人</button>
    </div>
    <div class="rank-list" id="rank-list">${renderRankList(members)}</div>
    <div style="margin-top:9px"><button onclick="leaveClass()" style="padding:7px 16px;border-radius:9px;border:1.5px solid var(--red);background:transparent;color:var(--red);font-size:.72rem;cursor:pointer;font-family:'Noto Sans SC',sans-serif">退出班级</button></div>`;
}

function renderRankList(members){
  return members.slice(0,15).map((m,i)=>`
    <div class="rank-item ${m.name===S.playerName?'rank-self':''}" id="rank-${i}" onclick="onRankItemClick('${m.name}')">
      <div class="rank-num ${i===0?'top1':i===1?'top2':i===2?'top3':''}">${i+1}</div>
      <div class="rank-name">${m.name}${m.name===S.playerName?' 👈':''}</div>
      <div class="rank-score">Lv.${m.level||1} · ⭐${m.score}</div>
    </div>`).join('');
}

// 点击排行榜条目 → 弹出切换账号确认
function onRankItemClick(name){
  if(name===S.playerName)return;
  const accounts=getAllAccounts();const acc=accounts.find(a=>a.name===name&&a.classId===S.classId);
  if(!acc){showToast('⚠️ 「'+name+'」不在本设备，请先在本设备创建该账号');return;}
  openConfirm('👤',`切换到账号「${name}」吗？\n当前账号进度将保存。`,()=>{
    if(acc.pin){openPinPad(acc.name,entered=>{if(entered===acc.pin){persistAccount();doEnterAcc(acc.id);return true;}showToast('密码错误！');return false;});}
    else{persistAccount();doEnterAcc(acc.id);}
  });
}

function searchClassMember(val){
  const cd=getClassData();if(!S.classId)return;
  const members=sortMembers(cd[S.classId]||[]);
  const filtered=val?members.filter(m=>m.name.includes(val)):members;
  const rl=document.getElementById('rank-list');if(rl)rl.innerHTML=renderRankList(filtered);
}

function randomPickMember(){
  const cd=getClassData();if(!S.classId)return;
  const members=cd[S.classId]||[];if(!members.length){showToast('班级还没有成员！');return;}
  const picked=members[Math.floor(Math.random()*members.length)];
  _lastPickedName=picked.name;
  // 在名单中高亮并滚动到该人
  const sorted=sortMembers(members);const idx=sorted.findIndex(m=>m.name===picked.name);
  if(idx>=0){const rl=document.getElementById('rank-list');if(rl)rl.innerHTML=renderRankList(sorted);setTimeout(()=>{const el=document.getElementById(`rank-${idx}`);if(el){el.classList.add('highlighted');el.scrollIntoView({behavior:'smooth',block:'center'});}},100);}
  // 弹出结果，提供切换账号选项
  const accounts=getAllAccounts();const accExist=accounts.some(a=>a.name===picked.name&&a.classId===S.classId);
  const extraBtn=accExist&&picked.name!==S.playerName?`<button onclick="onRankItemClick('${picked.name}');closeResult()" style="margin-top:8px;width:100%;padding:8px;border-radius:10px;border:none;background:var(--green);color:#fff;font-size:.8rem;cursor:pointer;font-family:'Noto Sans SC',sans-serif">切换到该账号</button>`:'';
  document.getElementById('res-ico').textContent='🎲';
  document.getElementById('res-ttl').textContent='随机抽取结果！';
  document.getElementById('res-body').innerHTML=`<div style="font-size:1.1rem;font-weight:700;margin:6px 0">🌟 ${picked.name} 🌟</div><div style="font-size:.8rem;color:var(--muted)">Lv.${picked.level||1} · ⭐${picked.score||0}分</div>${extraBtn}`;
  document.getElementById('res-ov').classList.add('on');
}

function joinClass(){const cls=(document.getElementById('ci-class')?.value||'').trim();if(!cls){showToast('请输入班级名称！');return;}S.classId=cls;joinClassBoard(cls,S.playerName,S.score);persistAccount();updateClassSection();showToast(`✅ 已加入班级 ${cls}！`);}
function leaveClass(){openConfirm('🏫','确定退出班级？退出后排名数据仍保留。',()=>{S.classId='';persistAccount();updateClassSection();showToast('已退出班级');});}

// ─── ACHIEVEMENTS ─────────────────────────────────
function checkAchs(){let got=false;ACHS.forEach(a=>{if(!S.unlockedAch.includes(a.id)&&a.cond(S)){S.unlockedAch.push(a.id);if(!S.newAch.includes(a.id))S.newAch.push(a.id);triggerAchPop(a);gainExp(20);S.coins+=10;S.totalCoins+=10;got=true;}});if(got){updateTop();persistAccount();}const n=S.newAch.length;['bd-ach','sbd-ach'].forEach(id=>{const el=document.getElementById(id);if(!el)return;if(n>0){el.textContent=n;el.classList.add('on');}else{el.textContent='';el.classList.remove('on');}});renderAchs();}
function triggerAchPop(a){document.getElementById('ap-ico').textContent=a.ico;document.getElementById('ap-nm').textContent=a.nm;const p=document.getElementById('achpop');p.classList.add('on');setTimeout(()=>p.classList.remove('on'),3000);}
function renderAchs(){const g=document.getElementById('ach-grid');if(!g)return;g.innerHTML='';ACHS.forEach(a=>{const got=S.unlockedAch.includes(a.id);const d=document.createElement('div');d.className='ach '+(got?'got':'no');d.innerHTML=`<div class="aico2">${a.ico}</div><div class="anm2">${a.nm}</div><div class="adesc">${a.desc}</div>${got?'<div class="atag">✓ 已解锁</div>':''}`;g.appendChild(d);});const ac=document.getElementById('ach-count');if(ac)ac.textContent=`${S.unlockedAch.length}/${ACHS.length}`;}

// ─── TOP BAR ──────────────────────────────────────
function updateTop(){const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v;};const setW=(id,w)=>{const el=document.getElementById(id);if(el)el.style.width=w;};const mx=expForLv(S.level);const expPct=Math.min(100,S.exp/mx*100)+'%';set('dc',S.coins);set('ds',S.score);set('dlv','Lv.'+S.level);set('dexph',S.exp+'/'+mx);setW('dexp',expPct);const nm=S.playerName||(S.expBoostLeft>0?`📖×${S.expBoostLeft}`:'');set('pname',nm||'点击查看我的');const ico=S.petLevel>=5?'🌟':S.petLevel>=3?'⭐':'🌾';const av=document.getElementById('avatar');if(av)av.textContent=ico;set('sb-pname',S.playerName||'-');set('sb-pmeta',`Lv.${S.level} · ⭐${S.score}`);set('sb-lv',`Lv.${S.level} · ${S.exp}/${mx} EXP`);setW('sb-expfill',expPct);set('sb-coins',S.coins);set('sb-score',S.score);const sbav=document.getElementById('sb-av');if(sbav)sbav.textContent=ico;}

// ─── PROFILE ──────────────────────────────────────
function updateProfile(){const pn=document.getElementById('prof-name');if(pn)pn.textContent=S.playerName||'未命名';const pa=document.getElementById('prof-av');if(pa)pa.textContent=S.petLevel>=5?'🌟':S.petLevel>=3?'⭐':'🌾';const acc2=S.totalAnswered>0?Math.round(S.totalCorrect/S.totalAnswered*100):0;const ps=document.getElementById('prof-stats');if(ps)ps.innerHTML=`<div class="ps"><div class="psv">Lv.${S.level}</div><div class="psl">等级</div></div><div class="ps"><div class="psv">${S.totalCorrect}</div><div class="psl">答对</div></div><div class="ps"><div class="psv">${S.harvests}</div><div class="psl">收获</div></div><div class="ps"><div class="psv">${S.coins}</div><div class="psl">金币</div></div><div class="ps"><div class="psv">${S.unlockedAch.length}</div><div class="psl">成就</div></div><div class="ps"><div class="psv">${acc2}%</div><div class="psl">正确率</div></div>`;const ss=document.getElementById('study-stats');if(ss)ss.innerHTML=`📝 总答题：${S.totalAnswered}<br>✅ 答对：${S.totalCorrect}（${acc2}%）<br>🔥 最高连击：${S.maxStreak}<br>🐾 宠物喂食：${S.petFeedCount}次<br>💰 累计金币：${S.totalCoins}<br>🌾 累计收获：${S.harvests}次`;updateClassSection();renderAccountSettings();}

// ─── NAME MODAL ───────────────────────────────────
let nameTarget='player';
function openNameModal(t){nameTarget=t;const mttl=document.getElementById('name-mttl');if(mttl)mttl.textContent=t==='pet'?'给宠物起名字':'设置名字';const ni=document.getElementById('name-input');if(ni)ni.value=t==='pet'?(S.petName||''):(S.playerName||'');document.getElementById('name-ov').classList.add('on');setTimeout(()=>{const ni=document.getElementById('name-input');if(ni)ni.focus();},200);}
function randomName(){const ni=document.getElementById('name-input');if(!ni)return;ni.value=nameTarget==='pet'?PET_NAMES[Math.floor(Math.random()*PET_NAMES.length)]:PLAYER_NAMES[Math.floor(Math.random()*PLAYER_NAMES.length)];}
function saveName(){const v=(document.getElementById('name-input')?.value||'').trim();if(!v){showToast('名字不能为空！');return;}if(nameTarget==='pet'){S.petName=v;saveCurPet();persistAccount();updatePetUI();showPetTalk('rename_ok');}else{S.playerName=v;persistAccount();updateTop();const list=getAllAccounts();const acc=list.find(a=>a.id===CURRENT_ACC_ID);if(acc){acc.name=v;saveAllAccounts(list);}}document.getElementById('name-ov').classList.remove('on');showToast('✅ 名字已保存！');}

// ─── CONFIRM（支持取消回调）────────────────────────
let confirmCb=null,confirmCancelCb=null;
function openConfirm(ico,msg,cb,danger=false,cancelCb=null){confirmCb=cb;confirmCancelCb=cancelCb;document.getElementById('confirm-ico').textContent=ico;document.getElementById('confirm-msg').textContent=msg;const yb=document.getElementById('confirm-yes-btn');yb.className='mbtn '+(danger?'mb-danger on':'mb-ok on');document.getElementById('confirm-ov').classList.add('on');}
function confirmYes(){document.getElementById('confirm-ov').classList.remove('on');const c=confirmCb;confirmCb=null;confirmCancelCb=null;if(c)c();}
function confirmNo(){document.getElementById('confirm-ov').classList.remove('on');const c=confirmCancelCb;confirmCb=null;confirmCancelCb=null;if(c)c();}

// ─── RESULT / TOAST ───────────────────────────────
function showResult(ico,ttl,body){document.getElementById('res-ico').textContent=ico;document.getElementById('res-ttl').textContent=ttl;document.getElementById('res-body').innerHTML=typeof body==='string'?body.replace(/\n/g,'<br>'):body;document.getElementById('res-ov').classList.add('on');}
function closeResult(){document.getElementById('res-ov').classList.remove('on');}
let toastTimer=null;
function showToast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('on');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('on'),2400);}
function spawnP(emojis){for(let i=0;i<5;i++){setTimeout(()=>{const p=document.createElement('div');p.className='ptcl';p.textContent=emojis[Math.floor(Math.random()*emojis.length)];p.style.left=(25+Math.random()*50)+'vw';p.style.top=(25+Math.random()*45)+'vh';document.body.appendChild(p);setTimeout(()=>p.remove(),1300);},i*90);}}

// ─── TAB ──────────────────────────────────────────
function switchTab(name){['farm','pet','shop','ach','profile'].forEach(n=>{document.getElementById('page-'+n)?.classList.toggle('active',n===name);const tb=document.getElementById('tb-'+n);if(tb)tb.classList.toggle('on',n===name);});const sbn=document.getElementById('sb-nav');if(sbn){sbn.querySelectorAll('.sb-item').forEach((el,i)=>el.classList.toggle('on',['farm','pet','shop','ach','profile'][i]===name));}if(name==='ach'){S.newAch=[];persistAccount();['bd-ach','sbd-ach'].forEach(id=>{const el=document.getElementById(id);if(el){el.textContent='';el.classList.remove('on');}});}if(name==='shop')renderShop();if(name==='profile')updateProfile();}

// ─── EXPORT / IMPORT ──────────────────────────────
function exportSave(){const data={version:6,playerName:S.playerName,save:S,exportTime:new Date().toISOString()};const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`学习农场_${S.playerName||'存档'}_${new Date().toLocaleDateString('zh-CN')}.json`;a.click();URL.revokeObjectURL(url);showToast('✅ 存档已导出！');}
function importSave(input){const file=input.files[0];if(!file)return;const reader=new FileReader();reader.onload=e=>{try{const data=JSON.parse(e.target.result);if(!data.save){showToast('存档格式错误！');return;}openConfirm('📥',`导入存档：${data.playerName||'未知'}？\n这将覆盖当前账号的数据！`,()=>{S=Object.assign({},DEFAULT_SAVE,data.save);persistAccount();initGame();showToast('✅ 存档导入成功！');});}catch(err){showToast('存档解析失败！');}input.value='';};reader.readAsText(file);}

// ─── NATURAL DECAY ────────────────────────────────
function naturalDecay(){
  S.petFood=Math.max(0,S.petFood-3);S.petHappy=Math.max(0,S.petHappy-2);S.petClean=Math.max(0,S.petClean-1);S.petEnergy=Math.max(0,S.petEnergy-1);
  if(S.petFood<20)showPetTalk('low_food');else if(S.petHappy<20)showPetTalk('low_happy');else if(S.petEnergy<15)showPetTalk('low_energy');
  if(S.hasAutoWater){S.plots.forEach((p,i)=>{if(['s0','s1','s2'].includes(p.s)&&!p.hasCrack&&!p.hasBug){p.lastWater=Date.now();growPlot(i,0.5);}});}
  updatePetUI();persistAccount();
}

// ─── INIT ─────────────────────────────────────────
function initGame(){petX=75;petY=76;petWalking=false;renderFarm();updatePetUI();updateTop();renderAchs();checkAchs();renderSubjectBars();startPetAnim();updateProfile();switchTab('farm');
  // 更新行走开关UI
  const tog=document.getElementById('walk-toggle'),ico=document.getElementById('walk-ico'),lbl=document.getElementById('walk-lbl');
  if(tog)tog.classList.remove('on');if(ico)ico.textContent='🧍';if(lbl)lbl.textContent='立正模式';
}

(function init(){renderLoginScreen();setInterval(naturalDecay,60000);})();
