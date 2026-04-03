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
      // 设备所有权（已购买过则免费重装）
      if(s.ownedAutoWater===undefined)s.ownedAutoWater=s.hasAutoWater||false;
      if(s.ownedAutoPest===undefined)s.ownedAutoPest=s.hasAutoPest||false;
      if(s.dragCount===undefined)s.dragCount=0;
      if(s.hasAutoPest===undefined)s.hasAutoPest=false;
      if(s.autoWaterDur===undefined)s.autoWaterDur=100;
      if(s.autoPestDur===undefined)s.autoPestDur=100;
      if(s.repairKitStock===undefined)s.repairKitStock=0;
      if(s.streakShieldLeft===undefined)s.streakShieldLeft=0;
      if(s.harvestBoostLeft===undefined)s.harvestBoostLeft=0;
      if(!s.firstSwitchDone)s.firstSwitchDone={};
      if(!s.petSkinColors)s.petSkinColors={};
      if(!Array.isArray(s.ownedSkins))s.ownedSkins=[];
      // 兼容旧存档：已设置的皮肤视为已拥有
      if(s.petSkinColors&&s.ownedSkins){Object.values(s.petSkinColors).forEach(sid=>{if(sid&&sid!=='sc_default'&&!s.ownedSkins.includes(sid))s.ownedSkins.push(sid);});}
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
  if(S.hasAutoWater){const wc=Math.floor(hoursGone/2);if(wc>0){S.plots.forEach((p,i)=>{if(['s0','s1','s2'].includes(p.s)&&!p.hasCrack&&!p.hasBug){p.lastWater=now;growPlot(i,Math.min(wc*30,90));}})}}
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
function loadNextQ(){curQ=getQ();qAnswered=false;document.getElementById('qcat').textContent=curQ.c;document.getElementById('qcat').className='qcat ct-'+curQ.c;document.getElementById('qtxt').textContent=curQ.q;document.getElementById('explain').classList.remove('on');document.getElementById('mb-next').classList.remove('on');document.getElementById('qprog').textContent=`已答对 ${QZ.correct}/${QZ.needed}`;document.getElementById('qttl').textContent=QZ.title||'答题挑战';const _shieldTip=(S.streakShieldLeft||0)>0?'  🛡️护盾×'+S.streakShieldLeft:'';document.getElementById('qhint').textContent=`🎯 需答对 ${QZ.needed} 题，已答对 ${QZ.correct} 题${_shieldTip}`;const d=document.getElementById('qopts');d.innerHTML='';curQ.o.forEach((o,i)=>{const b=document.createElement('button');b.className='opt';b.textContent=['A','B','C','D'][i]+'. '+o;b.onclick=()=>pickOpt(i,b);d.appendChild(b);});}
function pickOpt(idx,btn){if(qAnswered)return;qAnswered=true;S.totalAnswered++;QZ.done++;document.querySelectorAll('.opt').forEach(b=>b.disabled=true);const ok=idx===curQ.a;btn.classList.add(ok?'ok':'no');document.querySelectorAll('.opt')[curQ.a].classList.add('ok');document.getElementById('explain').textContent='💡 '+curQ.e;document.getElementById('explain').classList.add('on');if(ok){QZ.correct++;S.totalCorrect++;S.curStreak++;S.maxStreak=Math.max(S.maxStreak,S.curStreak);if(!S.catCorrect)S.catCorrect={...DEFAULT_SAVE.catCorrect};S.catCorrect[curQ.c]=(S.catCorrect[curQ.c]||0)+1;const mult=S.expBoostLeft>0?2:1;gainExp(15*mult);if(S.expBoostLeft>0){S.expBoostLeft--;updateTop();if(!S.expBoostLeft)showToast('📖 经验加成已用完');else showToast(`📖 学霸加成剩余 ${S.expBoostLeft} 题`);}spawnP(['⭐','✨','🌸']);}else{if((S.streakShieldLeft||0)>0){S.streakShieldLeft--;showToast('🛡️连击护盾生效！连击保住了！');}else{S.curStreak=0;}document.getElementById('quiz-ov').classList.add('shake');setTimeout(()=>document.getElementById('quiz-ov').classList.remove('shake'),400);}checkAchs();updateTop();persistAccount();const nb=document.getElementById('mb-next');if(QZ.correct>=QZ.needed){nb.textContent='完成 ✓';nb.classList.add('on');nb.onclick=()=>closeQuiz(true);}else{nb.textContent=`继续（还差 ${QZ.needed-QZ.correct} 题）→`;nb.classList.add('on');nb.onclick=quizNext;}}
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
function doHarvestPlot(idx){openQuiz({title:'🌾 收获',needed:1,onSuccess:()=>{const sid=S.plots[idx].seed||'wheat';const sd=SEEDS[sid];S.plots[idx].s='empty';S.plots[idx].g=0;S.harvests++;const _hb=(S.harvestBoostLeft>0)?2:1;if(_hb>1){S.harvestBoostLeft--;showToast('🌈丰收加倍！还剩'+S.harvestBoostLeft+'次');}const _hr=sd.reward*_hb;S.coins+=_hr;S.totalCoins+=_hr;S.score+=_hr;gainExp(sd.expGain);persistAccount();renderFarm();checkAchs();showResult('🌾','大丰收！',`收获了${sd.ico}${sd.name}！\n金币+${_hr}${_hb>1?' 🌈×2':''}，积分+${_hr}\n累计收获${S.harvests}次`);}});}
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
    else{const sd=SEEDS[p.seed||'wheat'];const si=p.s==='s3'?sd.stages.length-1:p.s==='s2'?2:p.s==='s1'?1:0;const ico=sd.stages[Math.min(si,sd.stages.length-1)];const rt=calcReadyTime(i);const pctStr=Math.round(p.g);d.innerHTML=`${rt?`<div class="plot-timer">⏱${rt}</div>`:''}${S.hasAutoWater?'<div style="position:absolute;top:2px;right:3px;font-size:.55rem">🚿</div>':''}<span class="plot-ico">${ico}</span><div class="plot-lbl">${sd.name} ${p.s==='s3'?'🎉成熟':pctStr+'%'}</div><div class="plot-pg"><div class="plot-pg-f" style="width:${p.g}%"></div></div>`;}
    d.onclick=e=>onPlotClick(i,e);g.appendChild(d);
  });
  const ready=S.plots.filter(p=>p.s==='s3').length,grow=S.plots.filter(p=>['s0','s1','s2'].includes(p.s)).length,bug=S.plots.filter(p=>p.hasBug).length;
  const seeds=SEED_IDS.filter(s=>S.seedBag[s]>0).map(s=>SEEDS[s].ico+S.seedBag[s]).join(' ')||'无';
  document.getElementById('farm-stat').innerHTML=`🌰 种子：${seeds}${S.hasAutoWater?' 🚿自动浇水':''}${S.hasAutoPest?' 🤖自动除虫':''}${S.pestStock>0?' 🧴除虫药×'+S.pestStock:''}<br>🌾 成熟：<b>${ready}</b>块 · 🌿 生长：<b>${grow}</b>块${bug?` · <b style="color:var(--red)">🐛虫${bug}</b>`:''}<br>📦 收获：<b>${S.harvests}</b>次`;
  const val=ready+bug;['bd-farm','sbd-farm'].forEach(id=>{const el=document.getElementById(id);if(!el)return;if(val>0){el.textContent=val;el.classList.add('on');}else{el.textContent='';el.classList.remove('on');}});
  if(farmTimerInterval)clearInterval(farmTimerInterval);
  if(grow>0){farmTimerInterval=setInterval(()=>{if(isPaused)return;let changed=false;S.plots.forEach((p,i)=>{if(['s0','s1','s2'].includes(p.s)&&!p.hasCrack&&!p.hasBug){growPlot(i,1/(60*4));changed=true;}});if(changed)renderFarm();},1000);}
}

// ─── PET CANVAS ──────────────────────────────────
let petAF=null,petT=0;
let petX=75,petY=76,petVx=0.5,petVy=0.3,petDragging=false,petDragOx=0,petDragOy=0;

function startPetAnim(){
  const cvs=document.getElementById('pet-canvas');
  if(cvs&&!cvs._petHandlersSet){
    cvs._petHandlersSet=true;
    const getPos=(e,touch)=>{const r=cvs.getBoundingClientRect();const src=touch?e.touches[0]:e;return{x:(src.clientX-r.left)*(cvs.width/r.width),y:(src.clientY-r.top)*(cvs.height/r.height)};};
    // 鼠标事件
    let _mouseDownOnPet=false,_mouseMoved=false;
    cvs.addEventListener('mousedown',e=>{const pos=getPos(e,false);if(Math.abs(pos.x-petX)<45&&Math.abs(pos.y-petY)<45){petDragging=true;_mouseDownOnPet=true;_mouseMoved=false;petDragOx=pos.x-petX;petDragOy=pos.y-petY;cvs.style.cursor='grabbing';}});
    document.addEventListener('mousemove',e=>{if(!petDragging)return;_mouseMoved=true;const r=cvs.getBoundingClientRect();const scale=cvs.width/r.width;petX=Math.max(20,Math.min(130,(e.clientX-r.left)*scale-petDragOx));petY=Math.max(20,Math.min(130,(e.clientY-r.top)*scale-petDragOy));});
    document.addEventListener('mouseup',e=>{if(petDragging){petDragging=false;cvs.style.cursor='';if(_mouseMoved){S.dragCount=(S.dragCount||0)+1;checkAchs();persistAccount();}else if(_mouseDownOnPet){showPetTalk('tap');spawnP(['💕','✨','⭐']);}}_mouseDownOnPet=false;_mouseMoved=false;});
    // 触摸事件 - 独立于click事件处理，防止preventDefault后click不触发
    let _touchStartX=0,_touchStartY=0,_touchOnPet=false,_touchMoved=false;
    cvs.addEventListener('touchstart',e=>{
      e.preventDefault();
      const pos=getPos(e,true);
      _touchStartX=pos.x;_touchStartY=pos.y;_touchMoved=false;
      if(Math.abs(pos.x-petX)<50&&Math.abs(pos.y-petY)<50){
        _touchOnPet=true;
        petDragging=true;petDragOx=pos.x-petX;petDragOy=pos.y-petY;
      }else{_touchOnPet=false;}
    },{passive:false});
    document.addEventListener('touchmove',e=>{
      if(!petDragging)return;
      e.preventDefault();
      const r=cvs.getBoundingClientRect();const scale=cvs.width/r.width;const t=e.touches[0];
      const nx=(t.clientX-r.left)*scale,ny=(t.clientY-r.top)*scale;
      if(Math.abs(nx-_touchStartX)>8||Math.abs(ny-_touchStartY)>8)_touchMoved=true;
      petX=Math.max(20,Math.min(130,nx-petDragOx));
      petY=Math.max(20,Math.min(130,ny-petDragOy));
    },{passive:false});
    document.addEventListener('touchend',e=>{
      if(!_touchOnPet){_touchOnPet=false;return;}
      if(petDragging){petDragging=false;}
      if(_touchMoved){
        S.dragCount=(S.dragCount||0)+1;checkAchs();persistAccount();
      }else{
        // 轻触 = tap
        showPetTalk('tap');spawnP(['💕','✨','⭐']);
      }
      _touchOnPet=false;_touchMoved=false;
    });
  }
  if(petAF)return;
  const loop=()=>{
    try{
      petT+=0.04;
      if(!petDragging&&petWalking){
        petX+=petVx;petY+=petVy;
        if(petX<20||petX>130)petVx*=-1;if(petY<20||petY>130)petVy*=-1;
        petX=Math.max(20,Math.min(130,petX));petY=Math.max(20,Math.min(130,petY));
        if(Math.random()<0.003){petVx=(Math.random()-0.5)*0.9;petVy=(Math.random()-0.5)*0.6;}
      }
      // 偶尔触发闲置台词（约每90秒一次）
      if(Math.random()<0.00019)showPetTalk('idle');
      drawPet();
    }catch(err){console.warn('pet anim err:',err);}
    petAF=requestAnimationFrame(loop);
  };loop();
}

function getEvoStage(){const stages=(EVO_STAGES[S.petBreed||'hamster']||EVO_STAGES.hamster);return stages[Math.min(S.petLevel-1,stages.length-1)];}


function getPetSkinColor(){if(!S.petSkinColors||!S.activePet)return null;const sid=S.petSkinColors[S.activePet];if(!sid||sid==="sc_default")return null;const sc=(window.PET_SKIN_COLORS||[]).find(s=>s.id===sid);return sc?sc.color:null;}


// 【新增】自动颜色生成器
function adjustColor(hex, amount) {
    if(!hex) return '#000000';
    let usePound = false;
    if (hex[0] === "#") { hex = hex.slice(1); usePound = true; }
    if (hex.length === 3) { hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2]; }
    let num = parseInt(hex, 16);
    let r = (num >> 16) + amount;
    let g = ((num >> 8) & 0x00FF) + amount;
    let b = (num & 0x0000FF) + amount;
    r = Math.min(255, Math.max(0, r));
    g = Math.min(255, Math.max(0, g));
    b = Math.min(255, Math.max(0, b));
    return (usePound ? "#" : "") + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

// 【修复】应用皮肤颜色的逻辑
function getPetSkinColor(){if(!S.petSkinColors||!S.activePet)return null;const sid=S.petSkinColors[S.activePet];if(!sid||sid==="sc_default")return null;const sc=(window.PET_SKIN_COLORS||[]).find(s=>s.id===sid);return sc?sc.color:null;}
function applySkinStage(stage){
    const skin=getPetSkinColor();
    if(!skin) return stage;
    if(skin==="rainbow"){
        const cols=["#ff9090","#ffcc60","#a0e880","#60c8ff","#d080ff"];
        return Object.assign({},stage,{color:cols[Math.floor(Date.now()/1200)%cols.length]});
    }
    return Object.assign({},stage,{color:skin}); // 确保颜色被正确传递
}
function applySkinStage(stage) {
  const skin = getPetSkinColor();
  if (!skin) return stage;
  if (skin === "rainbow") {
    const cols = ["#ff9090", "#ffcc60", "#a0e880", "#60c8ff", "#d080ff"];
    return { ...stage, color: cols[Math.floor(Date.now() / 1200) % cols.length] };
  }
  // 关键修复：返回一个基于皮肤色生成的新stage，不再依赖绘图函数里的硬编码
  return { ...stage, color: skin };
}
function drawPetBreed(ctx,breed,cx,cy,stage){if(breed==="cat")drawCat(ctx,cx,cy,stage);else if(breed==="rabbit")drawRabbit(ctx,cx,cy,stage);else if(breed==="bird")drawBird(ctx,cx,cy,stage);else if(breed==="dog")drawDog(ctx,cx,cy,stage);else if(breed==="panda")drawPanda(ctx,cx,cy,stage);else if(breed==="fox")drawFox(ctx,cx,cy,stage);else if(breed==="deer")drawDeer(ctx,cx,cy,stage);else if(breed==="penguin")drawPenguin(ctx,cx,cy,stage);else if(breed==="dragon")drawDragon(ctx,cx,cy,stage);else if(breed==="owl")drawOwl(ctx,cx,cy,stage);else if(breed==="bear")drawBear(ctx,cx,cy,stage);else if(breed==="unicorn")drawUnicorn(ctx,cx,cy,stage);else if(breed==="tiger")drawTiger(ctx,cx,cy,stage);else drawHamster(ctx,cx,cy,stage);}


// 【新增】颜色调节器：用于根据皮肤色自动生成深浅色，美化宠物细节

function drawPet(){
  const cvs=document.getElementById('pet-canvas');if(!cvs)return;
  const ctx=cvs.getContext('2d');ctx.clearRect(0,0,cvs.width,cvs.height);
  const bob=petWalking?Math.sin(petT*3)*1.5:Math.sin(petT)*2;
  const stage=applySkinStage(getEvoStage());const breed=S.petBreed||'hamster';
  try{drawPetBreed(ctx,breed,petX,petY+bob,stage);}catch(e){console.warn('drawPetBreed err',e);}
  try{drawCloth(ctx,petX,petY+bob);}catch(e){console.warn('drawCloth err',e);}
}

// ── 商店宠物预览图：临时切换状态绘制缩略图 ──
function drawPetPreviewInCanvas(cvs,breed,level){
  if(!cvs)return;
  const ctx=cvs.getContext('2d');
  ctx.clearRect(0,0,cvs.width,cvs.height);
  const stages=(window.EVO_STAGES&&EVO_STAGES[breed])||EVO_STAGES.hamster;
  const stage=stages[0]; // 商店一律显示初始形态
  const cx=Math.round(cvs.width/2),cy=Math.round(cvs.height/2)+4;
  // 临时借用S字段绘制（保存/恢复）
  const _br=S.petBreed,_lv=S.petLevel,_hp=S.petHappy,_en=S.petEnergy;
  S.petBreed=breed;S.petLevel=level||1;S.petHappy=75;S.petEnergy=75;
  try{drawPetBreed(ctx,breed,cx,cy,stage);}catch(e){}
  S.petBreed=_br;S.petLevel=_lv;S.petHappy=_hp;S.petEnergy=_en;
}

// ── 仓鼠（5阶，装饰贴合头部）──

// ── 通用辅助：表情绘制 ──
function drawEye(ctx, x, y, h, size) {
  size = size || 3;
  if (h > 0.6) {
    // 开心弯弯眼
    ctx.strokeStyle = '#222'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(x, y, size, Math.PI, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(255,200,200,0.6)'; // 笑眼下方腮红
  } else if (h > 0.3) {
    // 普通圆眼
    ctx.fillStyle = '#1a1a1a'; ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'white'; ctx.beginPath(); ctx.ellipse(x + size * 0.4, y - size * 0.4, size * 0.38, size * 0.38, 0, 0, Math.PI * 2); ctx.fill();
  } else {
    // 难过眯眯眼
    ctx.strokeStyle = '#222'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - size, y + 1); ctx.lineTo(x + size, y - 1); ctx.stroke();
  }
}

// ── 仓鼠（正面·圆润可爱）──
// ── 🐹小仓鼠 (超圆润麻薯体型，巨大嘟嘟脸颊，Lv2+抱着瓜子啃) ──
// ── 仓鼠（正面·圆润可爱）──
// ── 🐹小仓鼠 (1阶为新设计，2阶为原版胖球，3阶+长皇冠抱瓜子) ──
function drawHamster(ctx, cx, cy, stage) {
    const lv = S.petLevel, h = S.petHappy / 100, col = stage.color || '#e8b070';
    const light = adjustColor(col, 60), dark = adjustColor(col, -30);

    // 【1阶】使用你提供的全新第一形态设计
    if (lv === 1) {
        const es = stage.earSize || 1;
        ctx.beginPath(); ctx.ellipse(cx, cy + 22, 27, 6, 0, 0, Math.PI * 2); ctx.fillStyle = 'rgba(0,0,0,.07)'; ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx, cy, 27, 21, 0, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx, cy + 4, 15, 12, 0, 0, Math.PI * 2); ctx.fillStyle = '#fdeec8'; ctx.fill();
        if (h > .45) { [[cx - 15, cy],[cx + 15, cy]].forEach(([ex, ey]) => { ctx.beginPath(); ctx.ellipse(ex, ey, 7, 5, .2, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,140,140,.3)'; ctx.fill(); }); }
        ctx.beginPath(); ctx.ellipse(cx, cy - 17, 19, 15, 0, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill();
        [[cx - 14, cy - 29, -.25],[cx + 14, cy - 29, .25]].forEach(([ex, ey, r]) => { ctx.beginPath(); ctx.ellipse(ex, ey, 8 * es, 10 * es, r, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill(); ctx.beginPath(); ctx.ellipse(ex, ey, 4.5 * es, 6 * es, r, 0, Math.PI * 2); ctx.fillStyle = '#f5a0b0'; ctx.fill(); });
        const ey = cy - 18, ec = '#1e1008';
        [[cx - 7, ey], [cx + 7, ey]].forEach(([ex, e]) => { ctx.beginPath(); ctx.ellipse(ex, e, 3.5, 4, 0, 0, Math.PI * 2); ctx.fillStyle = ec; ctx.fill(); ctx.beginPath(); ctx.ellipse(ex + 1.5, e - 1.5, 1.2, 1.2, 0, 0, Math.PI * 2); ctx.fillStyle = 'white'; ctx.fill(); });
        ctx.beginPath(); ctx.ellipse(cx, cy - 11, 2.5, 2, 0, 0, Math.PI * 2); ctx.fillStyle = '#e07090'; ctx.fill();
        if (h > .65) { ctx.beginPath(); ctx.arc(cx, cy - 7, 5.5, .25, Math.PI - .25); ctx.strokeStyle = '#a05060'; ctx.lineWidth = 1.8; ctx.stroke(); }
        else if (h > .3) { ctx.beginPath(); ctx.moveTo(cx - 4, cy - 7); ctx.lineTo(cx + 4, cy - 7); ctx.strokeStyle = '#a05060'; ctx.lineWidth = 1.5; ctx.stroke(); }
        else { ctx.beginPath(); ctx.arc(cx, cy - 4, 4.5, Math.PI + .3, -.3); ctx.strokeStyle = '#a05060'; ctx.lineWidth = 1.5; ctx.stroke(); }
        ctx.strokeStyle = 'rgba(180,120,80,.3)'; ctx.lineWidth = 1;
        [[cx - 3, cy - 9, cx - 17, cy - 11],[cx - 3, cy - 7, cx - 17, cy - 7],[cx + 3, cy - 9, cx + 17, cy - 11],[cx + 3, cy - 7, cx + 17, cy - 7]].forEach(([x1, y1, x2, y2]) => { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); });
        [[cx - 23, cy + 14, -.5], [cx + 23, cy + 14, .5]].forEach(([px, py, r]) => { ctx.beginPath(); ctx.ellipse(px, py, 7, 5.5, r, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill(); });
        drawTears(ctx, cx, cy - 8, h);
        if (S.petEnergy < 25) { ctx.font = '11px sans-serif'; ctx.fillText('💤', cx + 15, cy - 28); }
    } 
    // 【2阶及以上】使用原版的进化形态逻辑（2阶为原版空手胖球，3阶开始抱瓜子戴皇冠）
    else {
        // Lv 5 仙气光环
        if (lv >= 5) {
            const g = ctx.createRadialGradient(cx, cy, 10, cx, cy, 50);
            g.addColorStop(0, 'rgba(255,240,180,0.6)'); g.addColorStop(1, 'rgba(255,240,180,0)');
            ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, 50, 0, Math.PI*2); ctx.fill();
        }

        // 身体 (超级圆润的麻薯)
        ctx.fillStyle = col; 
        ctx.beginPath(); ctx.ellipse(cx, cy + 12, 22, 20, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = light; // 浅色白肚皮
        ctx.beginPath(); ctx.ellipse(cx, cy + 16, 14, 12, 0, 0, Math.PI*2); ctx.fill();
        
        // 头部 & 巨大的嘟嘟脸颊
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.ellipse(cx, cy - 8, 24, 18, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = light; 
        ctx.beginPath(); ctx.ellipse(cx - 14, cy - 4, 12, 10, -0.2, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx + 14, cy - 4, 12, 10, 0.2, 0, Math.PI*2); ctx.fill();

        // 萌萌小圆耳
        [[cx-16, cy-22, -0.5], [cx+16, cy-22, 0.5]].forEach(([ex, ey, rot]) => {
            ctx.fillStyle = dark; ctx.beginPath(); ctx.ellipse(ex, ey, 7, 7, rot, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#ffdce6'; ctx.beginPath(); ctx.ellipse(ex, ey, 4, 4, rot, 0, Math.PI*2); ctx.fill();
        });

        // 爪子
        ctx.fillStyle = dark;
        ctx.beginPath(); ctx.ellipse(cx - 7, cy + 8, 5, 4, -0.5, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx + 7, cy + 8, 5, 4, 0.5, 0, Math.PI*2); ctx.fill();
        
        // Lv3开始怀里抱着一颗小葵花籽
        if (lv >= 3) {
            ctx.fillStyle = '#333';
            ctx.beginPath(); ctx.moveTo(cx, cy + 2); ctx.lineTo(cx-4, cy+12); ctx.lineTo(cx+4, cy+12); ctx.fill();
            ctx.fillStyle = '#eee';
            ctx.beginPath(); ctx.moveTo(cx, cy + 4); ctx.lineTo(cx-2, cy+12); ctx.lineTo(cx+2, cy+12); ctx.fill();
        }

        // 粉色小脚丫
        ctx.fillStyle = '#ffb0c0';
        ctx.beginPath(); ctx.ellipse(cx - 12, cy + 28, 6, 4, -0.2, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx + 12, cy + 28, 6, 4, 0.2, 0, Math.PI*2); ctx.fill();

        // 闪亮大眼睛与小粉鼻
        const ey = cy - 12;
        ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(cx-8, ey, 3.5, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(cx+8, ey, 3.5, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx-9, ey-1, 1.5, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(cx+7, ey-1, 1.5, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#ff80a0'; ctx.beginPath(); ctx.ellipse(cx, cy-7, 3, 2, 0, 0, Math.PI*2); ctx.fill();
        
        // 兔唇形小嘴
        ctx.strokeStyle = '#222'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(cx-4, cy-4); ctx.quadraticCurveTo(cx, cy-1, cx+4, cy-4); ctx.stroke();

        // 腮红
        if (h > 0.4) {
            ctx.fillStyle = 'rgba(255,155,165,0.25)';
            ctx.beginPath(); ctx.arc(cx-16, cy-5, 4, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(cx+16, cy-5, 4, 0, Math.PI*2); ctx.fill();
        }

        // Lv3开始头顶长出小发芽或皇冠
        if (lv >= 3) { ctx.font = '14px sans-serif'; ctx.fillText(stage.crownIco || '🌱', cx - 7, cy - 32); }
        drawTears(ctx, cx, cy-5, h); if (S.petEnergy < 25) { ctx.font='12px sans-serif'; ctx.fillText('💤', cx+18, cy-25); }
    }
}

// ── 猫咪（3/4侧面·优雅）──
// ── 🐱猫咪 (正面乖巧坐姿，Lv越高尾巴越长、皇冠越华丽) ──
function drawCat(ctx, cx, cy, stage) {
    const lv = S.petLevel, h = S.petHappy / 100, col = stage.color || '#f0b060';
    const light = adjustColor(col, 40), dark = adjustColor(col, -40);
    // Lv5 仙气光环
    if (lv >= 5) {
        const g = ctx.createRadialGradient(cx, cy, 10, cx, cy, 55);
        g.addColorStop(0, 'rgba(255,215,0,0.4)'); g.addColorStop(1, 'rgba(255,215,0,0)');
        ctx.beginPath(); ctx.arc(cx, cy, 55, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
    }
    // 尾巴 (随等级变长、摇摆)
    const tailWag = Math.sin(petT * 2) * 5;
    ctx.strokeStyle = dark; ctx.lineWidth = 5 + lv; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx + 15, cy + 15);
    ctx.quadraticCurveTo(cx + 30 + lv*2, cy + 10 + tailWag, cx + 25 + lv*2, cy - 10 + tailWag); ctx.stroke();
    // 身体 (猫咪揣手手)
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(cx, cy + 12, 18, 14, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = light; ctx.beginPath(); ctx.ellipse(cx, cy + 14, 12, 8, 0, 0, Math.PI * 2); ctx.fill();
    // 头部 (大圆脸)
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(cx, cy - 12, 22, 18, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = light; ctx.beginPath(); ctx.ellipse(cx, cy - 8, 14, 10, 0, 0, Math.PI * 2); ctx.fill();
    // 耳朵
    [[cx - 14, cy - 25, -0.4], [cx + 14, cy - 25, 0.4]].forEach(([ex, ey, rot]) => {
        ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(ex, ey, 6, 10, rot, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffdce6'; ctx.beginPath(); ctx.ellipse(ex, ey+2, 3, 6, rot, 0, Math.PI * 2); ctx.fill();
    });
    // 脸部细节
    const ey = cy - 14;
    ctx.fillStyle = '#333'; ctx.beginPath(); ctx.arc(cx - 9, ey, 3, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(cx + 9, ey, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx - 10, ey - 1, 1.5, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(cx + 8, ey - 1, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff80a0'; ctx.beginPath(); ctx.ellipse(cx, cy - 9, 2.5, 1.5, 0, 0, Math.PI * 2); ctx.fill(); // 鼻子
    ctx.strokeStyle = '#333'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(cx - 4, cy - 6); ctx.quadraticCurveTo(cx - 2, cy - 4, cx, cy - 6); ctx.quadraticCurveTo(cx + 2, cy - 4, cx + 4, cy - 6); ctx.stroke(); // 嘴巴
    // 胡须
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 1;
    [[cx-12,cy-9,cx-22,cy-11], [cx-12,cy-7,cx-22,cy-6], [cx+12,cy-9,cx+22,cy-11], [cx+12,cy-7,cx+22,cy-6]].forEach(([x1,y1,x2,y2])=>{ ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); });
    // 进化装饰
    if(lv >= 3) { ctx.font = (lv>=4?'16px':'12px')+' sans-serif'; ctx.fillText(stage.crownIco||'👑', cx - (lv>=4?8:6), cy - 32); }
    if(h>0.4){ ctx.fillStyle='rgba(255,100,100,0.3)'; ctx.beginPath(); ctx.arc(cx-14,cy-9,4,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(cx+14,cy-9,4,0,Math.PI*2); ctx.fill(); }
    drawTears(ctx, cx, cy-8, h); if (S.petEnergy < 25) { ctx.font = '12px sans-serif'; ctx.fillText('💤', cx + 18, cy - 25); }
}

// ── 🐰小兔 (正面，呆萌大头，Lv越高耳朵越长越垂) ──
function drawRabbit(ctx, cx, cy, stage) {
    const lv = S.petLevel, h = S.petHappy / 100, col = stage.color || '#ffffff';
    const light = adjustColor(col, 20), dark = adjustColor(col, -30);
    // 星月特效 Lv5
    if(lv>=5){ ctx.fillStyle='rgba(255,240,180,0.6)'; for(let i=0;i<4;i++){ ctx.beginPath(); ctx.arc(cx+(Math.random()-0.5)*60, cy+(Math.random()-0.5)*60, 2, 0, Math.PI*2); ctx.fill(); } }
    // 身体 (圆胖)
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(cx, cy + 14, 16, 14, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = light; ctx.beginPath(); ctx.ellipse(cx, cy + 15, 10, 8, 0, 0, Math.PI * 2); ctx.fill();
    // 头部 (超大)
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(cx, cy - 8, 20, 16, 0, 0, Math.PI * 2); ctx.fill();
    // 耳朵 (进化变长、折耳)
    const earL = 15 + lv * 3;
    [[cx - 10, cy - 22, -0.2, -1], [cx + 10, cy - 22, 0.2, 1]].forEach(([ex, ey, rot, dir]) => {
        ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(ex + dir*(lv>=4?5:0), ey - earL/2 + (lv>=4?10:0), 6, earL, rot + (lv>=4?dir*0.5:0), 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffb0c0'; ctx.beginPath(); ctx.ellipse(ex + dir*(lv>=4?5:0), ey - earL/2 + (lv>=4?10:0), 3, earL*0.7, rot + (lv>=4?dir*0.5:0), 0, Math.PI * 2); ctx.fill();
    });
    // 脸部
    const ey = cy - 8;
    ctx.fillStyle = '#800020'; ctx.beginPath(); ctx.ellipse(cx - 9, ey, 3, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.ellipse(cx + 9, ey, 3, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx - 9.5, ey - 1.5, 1.5, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(cx + 8.5, ey - 1.5, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff80a0'; ctx.beginPath(); ctx.arc(cx, cy - 4, 2, 0, Math.PI * 2); ctx.fill(); // 鼻子
    if(lv>=3){ ctx.font = '14px sans-serif'; ctx.fillText(stage.crownIco||'🎀', cx - 7, cy - 22); }
    if(h>0.4){ ctx.fillStyle='rgba(255,100,120,0.4)'; ctx.beginPath(); ctx.ellipse(cx-12,cy-3,5,3,-0.1,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(cx+12,cy-3,5,3,0.1,0,Math.PI*2); ctx.fill(); }
    drawTears(ctx, cx, cy-4, h); if(S.petEnergy<25){ ctx.font='12px sans-serif'; ctx.fillText('💤', cx+18, cy-20); }
}

// ── 🐦小鸟 (侧面圆球，Lv越高翅膀与尾羽越华丽) ──
function drawBird(ctx, cx, cy, stage) {
    const lv = S.petLevel, h = S.petHappy / 100, col = stage.color || '#70c0ff';
    const light = adjustColor(col, 40), dark = adjustColor(col, -40);
    const flap = Math.sin(petT * 4) * 0.2;
    if(lv >= 5) {
        ctx.beginPath(); ctx.ellipse(cx, cy, 35, 35, 0, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.shadowColor = col; ctx.shadowBlur = 15; ctx.fill(); ctx.shadowBlur = 0;
    }
    // 尾羽 (进化展开)
    ctx.fillStyle = dark;
    for(let i=0; i<Math.min(lv, 4); i++) {
        ctx.beginPath(); ctx.ellipse(cx - 15 - i*4, cy + 8 + i*2, 12 + i*2, 4, -0.5 + i*0.2, 0, Math.PI*2); ctx.fill();
    }
    // 身体 (圆滚滚)
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(cx, cy, 18, 16, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = light; ctx.beginPath(); ctx.ellipse(cx + 4, cy + 6, 12, 8, -0.2, 0, Math.PI * 2); ctx.fill(); // 浅色肚皮
    // 翅膀
    ctx.fillStyle = dark; ctx.beginPath(); ctx.ellipse(cx - 2, cy + 2, 10, 6, 0.2 + (petWalking?flap:0), 0, Math.PI * 2); ctx.fill();
    // 嘴巴
    ctx.fillStyle = '#ffb030'; ctx.beginPath(); ctx.moveTo(cx + 16, cy - 4); ctx.lineTo(cx + 24, cy - 2); ctx.lineTo(cx + 16, cy); ctx.fill();
    // 眼睛
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(cx + 8, cy - 6, 2.5, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx + 9, cy - 7, 1, 0, Math.PI*2); ctx.fill();
    // 头顶羽冠
    ctx.fillStyle = dark;
    for(let i=0; i<Math.ceil(lv/2); i++){ ctx.beginPath(); ctx.ellipse(cx + 2 - i*4, cy - 18 - i*2, 2, 6 + i*2, 0.2 - i*0.2, 0, Math.PI*2); ctx.fill(); }
    if(lv>=3){ ctx.font = '12px sans-serif'; ctx.fillText(stage.crownIco||'✨', cx - 12, cy - 20); }
    if(h>0.5){ ctx.fillStyle='rgba(255,100,100,0.5)'; ctx.beginPath(); ctx.arc(cx+3, cy-2, 3, 0, Math.PI*2); ctx.fill(); }
    drawTears(ctx, cx+5, cy-4, h); if(S.petEnergy<25) { ctx.font='12px sans-serif'; ctx.fillText('💤', cx-15, cy-20); }
}

// ── 🐶小狗 (正面偏侧，憨厚，Lv越高脖子挂饰越帅) ──
function drawDog(ctx, cx, cy, stage) {
    const lv = S.petLevel, h = S.petHappy / 100, col = stage.color || '#e0a060';
    const light = adjustColor(col, 40), dark = adjustColor(col, -40);
    // 尾巴 (摇摆)
    const wag = h > 0.5 ? Math.sin(petT * 6) * 10 : 0;
    ctx.strokeStyle = dark; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx + 12, cy + 10); ctx.quadraticCurveTo(cx + 25 + wag, cy + 5, cx + 20 + wag, cy - 10); ctx.stroke();
    // 身体
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(cx, cy + 12, 16, 14, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = light; ctx.beginPath(); ctx.ellipse(cx, cy + 15, 10, 8, 0, 0, Math.PI * 2); ctx.fill();
    // 头部
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(cx, cy - 10, 18, 16, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = light; ctx.beginPath(); ctx.ellipse(cx, cy - 5, 12, 8, 0, 0, Math.PI * 2); ctx.fill(); // 嘴套区
    // 下垂的耳朵
    ctx.fillStyle = dark;
    ctx.beginPath(); ctx.ellipse(cx - 16, cy - 10, 6, 12, -0.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + 16, cy - 10, 6, 12, 0.2, 0, Math.PI * 2); ctx.fill();
    // 五官
    const ey = cy - 12;
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(cx - 8, ey, 2.5, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(cx + 8, ey, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.ellipse(cx, cy - 6, 3.5, 2.5, 0, 0, Math.PI * 2); ctx.fill(); // 大黑鼻
    // 吐舌头
    if (h > 0.6) { ctx.fillStyle = '#ff6080'; ctx.beginPath(); ctx.ellipse(cx + 3, cy - 1, 3, 5, 0.2, 0, Math.PI * 2); ctx.fill(); }
    // 进化：帅气项圈/围巾
    if (lv >= 2) {
        ctx.fillStyle = lv >= 4 ? '#ff4040' : '#4080ff';
        ctx.beginPath(); ctx.ellipse(cx, cy + 2, 12, 4, 0, 0, Math.PI * 2); ctx.fill();
        if (lv >= 3) { ctx.fillStyle = '#ffd700'; ctx.beginPath(); ctx.arc(cx, cy + 4, 3, 0, Math.PI * 2); ctx.fill(); }
        if (lv >= 5) { ctx.font = '16px sans-serif'; ctx.fillText('👑', cx - 8, cy - 28); }
    }
    if(h>0.4){ ctx.fillStyle='rgba(255,100,100,0.3)'; ctx.beginPath(); ctx.arc(cx-12,cy-6,4,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(cx+12,cy-6,4,0,Math.PI*2); ctx.fill(); }
    drawTears(ctx, cx, cy-8, h); if (S.petEnergy < 25) { ctx.font = '12px sans-serif'; ctx.fillText('💤', cx + 15, cy - 25); }
}

// ── 🐼熊猫 (正面坐姿，黑眼圈，Lv越高抱着竹子越茂盛) ──
// ── 🐼熊猫 (重绘：超萌包子脸，星星眼，粉肉垫) ──
function drawPanda(ctx, cx, cy, stage) {
    const lv = S.petLevel, h = S.petHappy / 100, col = stage.color || '#ffffff';
    const light = adjustColor(col, 20), dark = '#2a2a2a'; // 保证黑眼圈足够黑

    // 阴影
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    ctx.beginPath(); ctx.ellipse(cx, cy + 26, 22, 6, 0, 0, Math.PI * 2); ctx.fill();

    // 身体 (短小圆润的梨形)
    ctx.fillStyle = light;
    ctx.beginPath(); ctx.ellipse(cx, cy + 12, 22, 19, 0, 0, Math.PI * 2); ctx.fill();

    // 小短腿
    ctx.fillStyle = dark;
    ctx.beginPath(); ctx.ellipse(cx - 14, cy + 24, 7, 6, -0.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + 14, cy + 24, 7, 6, 0.2, 0, Math.PI * 2); ctx.fill();
    // 粉色小肉垫
    ctx.fillStyle = '#ffb0c0';
    ctx.beginPath(); ctx.ellipse(cx - 14, cy + 25, 3, 2, -0.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + 14, cy + 25, 3, 2, 0.2, 0, Math.PI * 2); ctx.fill();

    // 抱竹子与手臂 (Lv进化)
    if (lv >= 2) {
        // 竹子本体
        ctx.strokeStyle = '#60c060'; ctx.lineWidth = 4; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(cx + 12, cy + 20); ctx.lineTo(cx + 26, cy - 8); ctx.stroke();
        // 茂盛的竹叶
        ctx.fillStyle = '#80d080';
        for(let i=0; i<Math.min(lv, 4); i++){ 
            ctx.beginPath(); ctx.ellipse(cx + 20 + i*2, cy + 5 - i*7, 5, 2.5, -0.6 + i*0.2, 0, Math.PI*2); ctx.fill(); 
        }
        // 压在竹子上的右手
        ctx.fillStyle = dark;
        ctx.beginPath(); ctx.ellipse(cx + 15, cy + 12, 6, 9, -0.5, 0, Math.PI * 2); ctx.fill();
        // 软萌的左手
        ctx.beginPath(); ctx.ellipse(cx - 16, cy + 10, 6, 9, 0.4, 0, Math.PI * 2); ctx.fill();
    } else {
        // 幼年期乖巧垂手
        ctx.fillStyle = dark;
        ctx.beginPath(); ctx.ellipse(cx - 16, cy + 12, 6, 9, 0.4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx + 16, cy + 12, 6, 9, -0.4, 0, Math.PI * 2); ctx.fill();
    }

    // 头部 (超大包子脸)
    ctx.fillStyle = light; 
    ctx.beginPath(); ctx.ellipse(cx, cy - 8, 26, 21, 0, 0, Math.PI * 2); ctx.fill();

    // 黑色圆耳朵
    ctx.fillStyle = dark;
    [[cx - 18, cy - 22, -0.3],[cx + 18, cy - 22, 0.3]].forEach(([ex, ey, rot]) => {
        ctx.beginPath(); ctx.ellipse(ex, ey, 8, 7, rot, 0, Math.PI * 2); ctx.fill();
    });

    // 萌系下垂黑眼圈 (水滴/腰果形)
    const ey = cy - 6;
    ctx.fillStyle = dark;
    ctx.beginPath(); ctx.ellipse(cx - 11, ey, 7, 9, -0.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + 11, ey, 7, 9, 0.4, 0, Math.PI * 2); ctx.fill();

    // 星星眼 (黑眼圈内加白色高光)
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(cx - 10, ey - 2, 2.5, 0, Math.PI * 2); ctx.fill(); 
    ctx.beginPath(); ctx.arc(cx + 10, ey - 2, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx - 8, ey + 1, 1, 0, Math.PI * 2); ctx.fill(); 
    ctx.beginPath(); ctx.arc(cx + 8, ey + 1, 1, 0, Math.PI * 2); ctx.fill();

    // 娇俏小黑鼻
    ctx.fillStyle = dark; 
    ctx.beginPath(); ctx.ellipse(cx, cy - 1, 3.5, 2, 0, 0, Math.PI * 2); ctx.fill();
    
    // 兔唇微笑嘴
    ctx.strokeStyle = dark; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx - 4, cy + 2); ctx.quadraticCurveTo(cx - 2, cy + 4, cx, cy + 2); ctx.quadraticCurveTo(cx + 2, cy + 4, cx + 4, cy + 2); ctx.stroke();

    // 萌萌红晕
    if(h > 0.4) {
        ctx.fillStyle = 'rgba(255, 120, 140, 0.3)';
        ctx.beginPath(); ctx.ellipse(cx - 18, cy + 2, 5, 3, -0.1, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx + 18, cy + 2, 5, 3, 0.1, 0, Math.PI * 2); ctx.fill();
    }

    // 进化特效：光环/皇冠
    if(lv >= 5) { ctx.font='18px sans-serif'; ctx.fillText('👑', cx-9, cy-34); }
    else if(lv >= 4) { ctx.font='16px sans-serif'; ctx.fillText('☯️', cx-8, cy-32); }

    drawTears(ctx, cx, cy - 2, h); 
    if (S.petEnergy < 25) { ctx.font = '12px sans-serif'; ctx.fillText('💤', cx + 24, cy - 20); }
}
// ── 🦊小狐狸 (3/4侧面，Lv越高尾巴越多，最高5尾) ──
function drawFox(ctx, cx, cy, stage) {
    const lv = S.petLevel, h = S.petHappy / 100, col = stage.color || '#e87030';
    const light = adjustColor(col, 60), dark = adjustColor(col, -30);
    // 多尾巴系统 (狐狸的灵魂)
    const tails = Math.min(lv, 5);
    ctx.fillStyle = col; ctx.strokeStyle = light; ctx.lineWidth = 4;
    for(let i=0; i<tails; i++){
        const spread = (i - (tails-1)/2) * 0.4;
        const wag = Math.sin(petT*2 + i) * 5;
        ctx.beginPath(); ctx.ellipse(cx + 20 + i*4, cy + 5 + wag, 18, 6, -0.5 + spread, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    }
    // 身体
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(cx + 5, cy + 10, 16, 12, 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = light; ctx.beginPath(); ctx.ellipse(cx + 8, cy + 12, 10, 6, 0.2, 0, Math.PI * 2); ctx.fill(); // 白肚皮
    // 腿
    ctx.fillStyle = dark;
    ctx.beginPath(); ctx.ellipse(cx - 5, cy + 20, 3, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + 10, cy + 20, 3, 8, 0, 0, Math.PI * 2); ctx.fill();
    // 头部 (尖长)
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(cx - 5, cy - 10, 15, 12, -0.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx - 5, cy - 20); ctx.lineTo(cx - 20, cy - 5); ctx.lineTo(cx - 5, cy); ctx.fill(); // 尖嘴
    ctx.fillStyle = light; ctx.beginPath(); ctx.ellipse(cx - 10, cy - 5, 8, 5, -0.2, 0, Math.PI * 2); ctx.fill(); // 白下巴
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(cx - 20, cy - 6, 2.5, 0, Math.PI * 2); ctx.fill(); // 黑鼻头
    // 耳朵 (尖锐)
    [[cx - 10, cy - 20, -0.4], [cx + 2, cy - 18, 0.2]].forEach(([ex, ey, rot]) => {
        ctx.fillStyle = dark; ctx.beginPath(); ctx.ellipse(ex, ey, 4, 10, rot, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = light; ctx.beginPath(); ctx.ellipse(ex, ey+2, 2, 6, rot, 0, Math.PI * 2); ctx.fill();
    });
    // 眼睛 (狐狸眼)
    ctx.strokeStyle = '#222'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx - 12, cy - 12); ctx.lineTo(cx - 6, cy - 10); ctx.stroke();
    if(lv>=4){ ctx.fillStyle='rgba(255,200,100,0.6)'; ctx.beginPath(); ctx.arc(cx, cy-30, 8, 0, Math.PI*2); ctx.fill(); } // 仙家灵珠
    if(h>0.4){ ctx.fillStyle='rgba(255,100,100,0.4)'; ctx.beginPath(); ctx.arc(cx-8,cy-6,3,0,Math.PI*2); ctx.fill(); }
    drawTears(ctx, cx-10, cy-8, h); if (S.petEnergy < 25) { ctx.font = '12px sans-serif'; ctx.fillText('💤', cx + 10, cy - 25); }
}

// ── 🦌小鹿 (3/4侧面，优雅，Lv越高鹿角越华丽且开花) ──
function drawDeer(ctx, cx, cy, stage) {
    const lv = S.petLevel, h = S.petHappy / 100, col = stage.color || '#d48a55';
    const lightCol = adjustColor(col, 50), darkCol = adjustColor(col, -40);
    if (lv >= 5) {
        const g = ctx.createRadialGradient(cx, cy - 10, 10, cx, cy - 10, 50);
        g.addColorStop(0, 'rgba(255,230,150,0.5)'); g.addColorStop(1, 'rgba(255,230,150,0)');
        ctx.beginPath(); ctx.arc(cx, cy - 10, 50, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
    }
    // 远端的腿 (深色)
    ctx.fillStyle = darkCol; ctx.beginPath(); ctx.ellipse(cx + 2, cy + 18, 3, 8, -0.2, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.ellipse(cx - 7, cy + 18, 3, 8, 0.1, 0, Math.PI * 2); ctx.fill();
    // 身体 (侧面)
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(cx + 8, cy + 8, 16, 12, 0.1, 0, Math.PI * 2); ctx.fill();
    // 浅色肚皮 & 尾巴
    ctx.fillStyle = lightCol; ctx.beginPath(); ctx.ellipse(cx + 6, cy + 14, 12, 5, 0.1, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(cx + 22, cy + 2, 5, 3, 0.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = lightCol; ctx.beginPath(); ctx.ellipse(cx + 23, cy + 3, 3, 2, 0.5, 0, Math.PI * 2); ctx.fill();
    // 脖子
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(cx - 8, cy - 10); ctx.lineTo(cx + 2, cy - 2); ctx.lineTo(cx + 10, cy + 5); ctx.lineTo(cx - 2, cy + 5); ctx.fill();
    // 梅花斑点
    ctx.fillStyle = lightCol; [[cx+4, cy+3], [cx+12, cy+1], [cx+16, cy+7], [cx+8, cy+8]].forEach(([px, py]) => { ctx.beginPath(); ctx.arc(px, py, 2, 0, Math.PI * 2); ctx.fill(); });
    // 近端的腿
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(cx + 10, cy + 20, 3.5, 8, -0.1, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.ellipse(cx - 3, cy + 20, 3.5, 8, 0.2, 0, Math.PI * 2); ctx.fill();
    // 头部 & 鼻子
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(cx - 10, cy - 18, 12, 10, -0.1, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = lightCol; ctx.beginPath(); ctx.ellipse(cx - 13, cy - 15, 8, 6, -0.1, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4a3020'; ctx.beginPath(); ctx.arc(cx - 20, cy - 16, 2, 0, Math.PI * 2); ctx.fill();
    // 耳朵
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(cx + 1, cy - 20, 7, 3, 0.3, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.ellipse(cx - 5, cy - 26, 6, 2.5, -0.5, 0, Math.PI * 2); ctx.fill();
    // 鹿角进化
    ctx.strokeStyle = darkCol; ctx.lineCap = 'round';
    if (lv === 2) { ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx - 6, cy - 24); ctx.lineTo(cx - 6, cy - 30); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx - 1, cy - 23); ctx.lineTo(cx + 1, cy - 28); ctx.stroke(); } 
    else if (lv >= 3) {
        ctx.lineWidth = lv >= 4 ? 4 : 3;
        ctx.beginPath(); ctx.moveTo(cx - 6, cy - 24); ctx.lineTo(cx - 10, cy - 40); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx - 8, cy - 32); ctx.lineTo(cx - 2, cy - 38); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx - 1, cy - 23); ctx.lineTo(cx + 6, cy - 38); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx + 3, cy - 31); ctx.lineTo(cx + 10, cy - 34); ctx.stroke();
        if(lv >= 4) { ctx.beginPath(); ctx.moveTo(cx - 9, cy - 36); ctx.lineTo(cx - 14, cy - 44); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx + 5, cy - 34); ctx.lineTo(cx + 12, cy - 42); ctx.stroke(); }
        const flower = stage.crownIco || '🌸'; ctx.font = (lv >= 4 ? '14px' : '11px') + ' sans-serif'; ctx.fillText(flower, cx - 16, cy - 38); if (lv >= 4) ctx.fillText('✨', cx + 6, cy - 40);
    }
    // 眼睛
    const ey = cy - 20;
    if (h > 0.6) { ctx.strokeStyle = '#222'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx - 10, ey, 3, Math.PI, Math.PI * 2); ctx.stroke(); } 
    else { ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(cx - 10, ey, 2.5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx - 11, ey - 1, 1, 0, Math.PI * 2); ctx.fill(); }
    if (h > 0.4) { ctx.fillStyle = 'rgba(255,140,150,0.5)'; ctx.beginPath(); ctx.ellipse(cx - 6, cy - 16, 3, 2, 0, 0, Math.PI * 2); ctx.fill(); }
    drawTears(ctx, cx - 10, cy - 14, h); if (S.petEnergy < 25) { ctx.fillStyle = '#6090e0'; ctx.font = '12px sans-serif'; ctx.fillText('💤', cx - 25, cy - 35); }
    if (lv >= 4) { for(let i=0; i<3; i++){ const a = petT * 1.5 + i * Math.PI * 0.6; ctx.fillStyle = 'rgba(255,215,0,0.8)'; ctx.font = '8px sans-serif'; ctx.fillText('✦', cx + Math.cos(a)*30, cy + Math.sin(a)*20); } }
}

// ── 🐧小企鹅 (正面站立，圆润，Lv越高围巾越厚/长出小皇冠) ──
function drawPenguin(ctx, cx, cy, stage) {
    const lv = S.petLevel, h = S.petHappy / 100, col = stage.color || '#203050';
    const light = adjustColor(col, 180), dark = adjustColor(col, -20);
    // 冰雪特效 Lv5
    if (lv >= 5) { ctx.fillStyle='rgba(150,220,255,0.5)'; for(let i=0;i<5;i++){ ctx.beginPath(); ctx.arc(cx+(Math.random()-0.5)*50, cy+(Math.random()-0.5)*50, 2, 0, Math.PI*2); ctx.fill(); } }
    // 身体 (外黑内白)
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(cx, cy + 5, 18, 22, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = light; ctx.beginPath(); ctx.ellipse(cx, cy + 8, 12, 16, 0, 0, Math.PI * 2); ctx.fill();
    // 脸部 (心形白脸)
    ctx.beginPath(); ctx.arc(cx - 6, cy - 8, 8, 0, Math.PI * 2); ctx.arc(cx + 6, cy - 8, 8, 0, Math.PI * 2); ctx.fill();
    // 翅膀 (企鹅手，会扑腾)
    const flap = petWalking ? Math.sin(petT*4)*0.2 : 0;
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.ellipse(cx - 16, cy + 5, 4, 12, 0.4 - flap, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + 16, cy + 5, 4, 12, -0.4 + flap, 0, Math.PI * 2); ctx.fill();
    // 橙色脚丫
    ctx.fillStyle = '#f0a020';
    ctx.beginPath(); ctx.ellipse(cx - 8, cy + 26, 6, 3, 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + 8, cy + 26, 6, 3, -0.2, 0, Math.PI * 2); ctx.fill();
    // 五官
    const ey = cy - 8;
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(cx - 5, ey, 2.5, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(cx + 5, ey, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx - 5.5, ey - 1, 1, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(cx + 4.5, ey - 1, 1, 0, Math.PI * 2); ctx.fill();
    // 尖嘴
    ctx.fillStyle = '#f0a020'; ctx.beginPath(); ctx.moveTo(cx - 4, cy - 4); ctx.lineTo(cx + 4, cy - 4); ctx.lineTo(cx, cy + 2); ctx.fill();
    // 进化：冬日围巾 / 皇冠
    if (lv >= 2) {
        ctx.fillStyle = lv >= 4 ? '#e04050' : '#40a0e0';
        ctx.beginPath(); ctx.ellipse(cx, cy + 2, 14, 4, 0, 0, Math.PI * 2); ctx.fill(); // 绕脖子
        ctx.beginPath(); ctx.ellipse(cx - 10, cy + 8, 4, 8, 0.2, 0, Math.PI * 2); ctx.fill(); // 垂边
    }
    if (lv >= 4) { ctx.font = '14px sans-serif'; ctx.fillText('👑', cx - 7, cy - 22); }
    if(h>0.5){ ctx.fillStyle='rgba(255,100,100,0.4)'; ctx.beginPath(); ctx.arc(cx-12,cy-4,3,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(cx+12,cy-4,3,0,Math.PI*2); ctx.fill(); }
    drawTears(ctx, cx, cy-2, h); if (S.petEnergy < 25) { ctx.font = '12px sans-serif'; ctx.fillText('💤', cx + 15, cy - 25); }
}

// ── 🐉小飞龙 (侧面，胖乎乎，Lv越高翅膀越大、吐小火苗) ──
// ── 🐉小飞龙 (1-3阶幼龙，4阶龙童化形，5阶龙神本相) ──
function drawDragon(ctx, cx, cy, stage) {
    const lv = S.petLevel, h = S.petHappy / 100, col = stage.color || '#50c080';
    const light = adjustColor(col, 40), dark = adjustColor(col, -40);

    if (lv < 4) {
        // 【1-3阶】 原始幼龙形态
        // 翅膀 (随等级变大、扑腾)
        const flap = Math.sin(petT * 3) * 0.3;
        ctx.fillStyle = dark;
        const wingSize = 8 + lv * 2;
        ctx.beginPath(); ctx.ellipse(cx - 5, cy - 5, wingSize, wingSize*1.2, 0.5 + flap, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = light; ctx.beginPath(); ctx.ellipse(cx - 5, cy - 5, wingSize*0.6, wingSize*0.8, 0.5 + flap, 0, Math.PI * 2); ctx.fill();
        // 尾巴 (带小刺)
        ctx.strokeStyle = col; ctx.lineWidth = 8; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(cx + 10, cy + 15); ctx.quadraticCurveTo(cx + 30, cy + 18, cx + 25, cy + 5); ctx.stroke();
        if (lv >= 3) { ctx.fillStyle = dark; ctx.beginPath(); ctx.moveTo(cx + 25, cy + 5); ctx.lineTo(cx + 32, cy + 2); ctx.lineTo(cx + 25, cy - 2); ctx.fill(); }
        // 身体 (胖墩)
        ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(cx + 5, cy + 12, 16, 14, -0.2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = light; ctx.beginPath(); ctx.ellipse(cx + 8, cy + 14, 10, 8, -0.2, 0, Math.PI * 2); ctx.fill(); // 肚皮
        // 粗短腿
        ctx.fillStyle = dark; ctx.beginPath(); ctx.ellipse(cx + 2, cy + 24, 4, 6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(cx + 14, cy + 22, 4, 6, -0.2, 0, Math.PI * 2); ctx.fill();
        // 头部 (大方圆脸)
        ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(cx - 8, cy - 8, 16, 14, 0.1, 0, Math.PI * 2); ctx.fill();
        // 龙角
        ctx.fillStyle = '#ffcc60';
        ctx.beginPath(); ctx.ellipse(cx - 4, cy - 22, 3, 6 + lv, 0.2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx - 16, cy - 20, 3, 5 + lv, -0.2, 0, Math.PI * 2); ctx.fill();
        // 眼睛与大鼻孔
        const ey = cy - 10;
        ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(cx - 12, ey, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx - 13, ey - 1, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = dark; ctx.beginPath(); ctx.arc(cx - 18, cy - 2, 1.5, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(cx - 22, cy - 3, 1.5, 0, Math.PI * 2); ctx.fill();
        
        drawTears(ctx, cx - 12, cy - 6, h); 
        if (S.petEnergy < 25) { ctx.font = '12px sans-serif'; ctx.fillText('💤', cx + 15, cy - 25); }
    } 
    else if (lv === 4) {
        // 【4阶】 龙童化形：带龙角龙尾的可爱仙婴
        const skin = '#ffe4d6';
        
        // 龙尾巴 (在身后摇摆)
        ctx.strokeStyle = col; ctx.lineWidth = 6; ctx.lineCap = 'round';
        const tailWag = Math.sin(petT * 3) * 4;
        ctx.beginPath(); ctx.moveTo(cx, cy+12); ctx.quadraticCurveTo(cx+25, cy+15, cx+20+tailWag, cy+5); ctx.stroke();
        
        // 婴儿身躯与红肚兜 (兼容旧版浏览器roundRect)
        ctx.fillStyle = skin; ctx.beginPath(); 
        if(ctx.roundRect) ctx.roundRect(cx-7, cy+2, 14, 16, 4); else ctx.rect(cx-7, cy+2, 14, 16); 
        ctx.fill(); 
        ctx.fillStyle = '#e03030'; ctx.beginPath(); ctx.moveTo(cx-6, cy+4); ctx.lineTo(cx+6, cy+4); ctx.lineTo(cx, cy+15); ctx.fill(); 
        ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 1; ctx.stroke(); 
        
        // 小手和小脚
        ctx.fillStyle = skin;
        ctx.beginPath(); ctx.ellipse(cx-10, cy+8, 3, 5, 0.4, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx+10, cy+8, 3, 5, -0.4, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx-4, cy+20, 4, 3, 0, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx+4, cy+20, 4, 3, 0, 0, Math.PI*2); ctx.fill();
        
        // 大头娃娃
        ctx.beginPath(); ctx.arc(cx, cy-8, 13, 0, Math.PI*2); ctx.fill();
        
        // 丸子头
        ctx.fillStyle = '#1a1a20';
        ctx.beginPath(); ctx.arc(cx-10, cy-18, 5, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx+10, cy-18, 5, 0, Math.PI*2); ctx.fill();
        
        // 头顶龙角
        ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(cx-6, cy-18); ctx.lineTo(cx-10, cy-26); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx+6, cy-18); ctx.lineTo(cx+10, cy-26); ctx.stroke();
        
        // 眼睛与脸颊龙鳞
        ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(cx-5, cy-6, 2.5, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(cx+5, cy-6, 2.5, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx-5.5, cy-7, 1, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(cx+4.5, cy-7, 1, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(cx-9, cy-3, 1.5, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(cx+9, cy-3, 1.5, 0, Math.PI*2); ctx.fill(); 

        // 眼泪和疲劳特效（自动适配脸部坐标）
        drawTears(ctx, cx, cy - 2, h); 
        if (S.petEnergy < 25) { ctx.font = '12px sans-serif'; ctx.fillText('💤', cx + 15, cy - 20); }
    } 
    else if (lv >= 5) {
        // 【5阶】 龙神本相：彻底褪去妖形，化为无尾、长发飘飘的清冷神明
        const skin = '#fff0e8';
        
        // 神圣光环
        ctx.fillStyle = 'rgba(255,215,0,0.15)'; ctx.beginPath(); ctx.arc(cx, cy-10, 42, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = 'rgba(255,215,0,0.4)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy-10, 38, 0, Math.PI*2); ctx.stroke();

        // 仙气飘带
        const fly = Math.sin(petT * 2) * 4;
        ctx.strokeStyle = 'rgba(120, 200, 255, 0.7)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(cx-25, cy-15+fly); ctx.bezierCurveTo(cx-40, cy+25, cx+40, cy+25, cx+25, cy-15-fly); ctx.stroke();

        // 身后长发
        ctx.fillStyle = '#1a202a'; ctx.beginPath(); ctx.ellipse(cx, cy-5, 12, 28, 0, 0, Math.PI*2); ctx.fill();

        // 飘逸仙袍
        ctx.fillStyle = '#f5f5f5'; ctx.beginPath(); ctx.moveTo(cx-8, cy-15); ctx.lineTo(cx+8, cy-15); ctx.lineTo(cx+12, cy+35); ctx.lineTo(cx-12, cy+35); ctx.fill();
        ctx.fillStyle = dark; ctx.beginPath(); ctx.moveTo(cx-8, cy-15); ctx.lineTo(cx-15, cy+35); ctx.lineTo(cx-4, cy+35); ctx.lineTo(cx, cy); ctx.fill();
        ctx.beginPath(); ctx.moveTo(cx+8, cy-15); ctx.lineTo(cx+15, cy+35); ctx.lineTo(cx+4, cy+35); ctx.lineTo(cx, cy); ctx.fill();
        ctx.fillStyle = '#f0c050'; ctx.beginPath(); ctx.fillRect(cx-9, cy+2, 18, 4); ctx.fill();

        // 宽大的古风袖子
        ctx.fillStyle = '#f5f5f5';
        ctx.beginPath(); ctx.moveTo(cx-8, cy-5); ctx.lineTo(cx-25, cy+15); ctx.lineTo(cx-15, cy+22); ctx.fill();
        ctx.beginPath(); ctx.moveTo(cx+8, cy-5); ctx.lineTo(cx+25, cy+15); ctx.lineTo(cx+15, cy+22); ctx.fill();

        // 成年人脸型
        ctx.fillStyle = skin;
        ctx.beginPath(); ctx.moveTo(cx-7, cy-22); ctx.lineTo(cx+7, cy-22); ctx.lineTo(cx, cy-10); ctx.fill(); 
        ctx.beginPath(); ctx.arc(cx, cy-22, 7, Math.PI, Math.PI*2); ctx.fill(); 

        // 凌厉双眼与红色眼影
        ctx.strokeStyle = '#222'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(cx-5, cy-18); ctx.lineTo(cx-1, cy-17); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx+5, cy-18); ctx.lineTo(cx+1, cy-17); ctx.stroke();
        ctx.strokeStyle = '#e04040'; ctx.lineWidth = 1; 
        ctx.beginPath(); ctx.moveTo(cx-5, cy-18); ctx.lineTo(cx-8, cy-20); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx+5, cy-18); ctx.lineTo(cx+8, cy-20); ctx.stroke();
        
        // 额头龙神金印
        ctx.fillStyle = '#f0c050'; ctx.beginPath(); ctx.ellipse(cx, cy-23, 1.5, 2.5, 0, 0, Math.PI*2); ctx.fill();

        // 额前碎发
        ctx.fillStyle = '#1a202a';
        ctx.beginPath(); ctx.moveTo(cx, cy-28); ctx.quadraticCurveTo(cx-8, cy-20, cx-9, cy-13); ctx.lineTo(cx-5, cy-26); ctx.fill();
        ctx.beginPath(); ctx.moveTo(cx, cy-28); ctx.quadraticCurveTo(cx+8, cy-20, cx+9, cy-13); ctx.lineTo(cx+5, cy-26); ctx.fill();

        // 威严的龙角
        ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(cx-4, cy-28); ctx.lineTo(cx-12, cy-38); ctx.lineTo(cx-8, cy-43); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx-8, cy-34); ctx.lineTo(cx-14, cy-32); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx+4, cy-28); ctx.lineTo(cx+12, cy-38); ctx.lineTo(cx+8, cy-43); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx+8, cy-34); ctx.lineTo(cx+14, cy-32); ctx.stroke();

        // 眼泪和疲劳特效（自动适配脸部坐标）
        drawTears(ctx, cx, cy - 14, h); 
        if (S.petEnergy < 25) { ctx.font = '12px sans-serif'; ctx.fillText('💤', cx + 20, cy - 35); }
    }
}

// ── 🦉猫头鹰 (正面栖息，智者，Lv越高带博士帽/单片眼镜) ──
function drawOwl(ctx, cx, cy, stage) {
    const lv = S.petLevel, h = S.petHappy / 100, col = stage.color || '#8a6a45';
    const light = adjustColor(col, 50), dark = adjustColor(col, -40);
    // 身体 (像个不倒翁)
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(cx, cy + 8, 18, 20, 0, 0, Math.PI * 2); ctx.fill();
    // 肚皮纹理
    ctx.fillStyle = light; ctx.beginPath(); ctx.ellipse(cx, cy + 12, 14, 15, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = dark; ctx.lineWidth = 1.5; ctx.beginPath();
    for(let i=0; i<3; i++){ ctx.moveTo(cx - 5 + i*5, cy + 10); ctx.lineTo(cx - 3 + i*5, cy + 12); ctx.lineTo(cx - 5 + i*5, cy + 14); } ctx.stroke();
    // 收拢的翅膀
    ctx.fillStyle = dark;
    ctx.beginPath(); ctx.ellipse(cx - 16, cy + 8, 5, 16, -0.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + 16, cy + 8, 5, 16, 0.2, 0, Math.PI * 2); ctx.fill();
    // 脚丫抓住树枝
    ctx.fillStyle = '#d0a040'; ctx.beginPath(); ctx.ellipse(cx - 6, cy + 28, 4, 3, 0, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.ellipse(cx + 6, cy + 28, 4, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#5a4a3a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(cx - 25, cy + 30); ctx.lineTo(cx + 25, cy + 30); ctx.stroke(); // 树枝
    // 头部
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(cx, cy - 10, 20, 16, 0, 0, Math.PI * 2); ctx.fill();
    // 标志性大眼眶 (面盘)
    ctx.fillStyle = light;
    ctx.beginPath(); ctx.arc(cx - 9, cy - 10, 9, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 9, cy - 10, 9, 0, Math.PI * 2); ctx.fill();
    // 眼睛
    const ey = cy - 10;
    ctx.fillStyle = '#ffcc00'; ctx.beginPath(); ctx.arc(cx - 9, ey, 6, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(cx + 9, ey, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(cx - 9, ey, 3, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(cx + 9, ey, 3, 0, Math.PI * 2); ctx.fill();
    // 尖嘴
    ctx.fillStyle = '#f0a020'; ctx.beginPath(); ctx.moveTo(cx - 3, cy - 4); ctx.lineTo(cx + 3, cy - 4); ctx.lineTo(cx, cy + 2); ctx.fill();
    // 进化装饰：博士帽 / 单片眼镜
    if (lv >= 3) {
        ctx.strokeStyle = 'gold'; ctx.lineWidth = 2; // 单片眼镜
        ctx.beginPath(); ctx.arc(cx + 9, ey, 7, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx + 15, ey + 4); ctx.lineTo(cx + 22, ey + 10); ctx.stroke();
    }
    if (lv >= 5) { ctx.font = '16px sans-serif'; ctx.fillText('🎓', cx - 10, cy - 28); }
    drawTears(ctx, cx, cy - 2, h); if (S.petEnergy < 25) { ctx.font = '12px sans-serif'; ctx.fillText('💤', cx + 18, cy - 25); }
}

// ── 🐻小熊 (正面坐姿，憨态可掬，Lv越高皇冠和蜂蜜罐越明显) ──
function drawBear(ctx, cx, cy, stage) {
    const lv = S.petLevel, h = S.petHappy / 100, col = stage.color || '#a06030';
    const light = adjustColor(col, 40), dark = adjustColor(col, -30);
    // 身体 (超大圆肚子)
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(cx, cy + 12, 22, 20, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = light; ctx.beginPath(); ctx.ellipse(cx, cy + 15, 14, 12, 0, 0, Math.PI * 2); ctx.fill();
    // 腿和脚底板
    ctx.fillStyle = dark;
    [[cx - 14, cy + 22, -0.2], [cx + 14, cy + 22, 0.2]].forEach(([px, py, rot]) => {
        ctx.beginPath(); ctx.ellipse(px, py, 7, 6, rot, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffb0a0'; ctx.beginPath(); ctx.arc(px, py+1, 2.5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = dark; // 肉垫
    });
    // 手臂 (抱着蜂蜜罐)
    ctx.fillStyle = dark;
    if (lv >= 2) {
        ctx.fillStyle = '#ffb030'; ctx.beginPath(); ctx.ellipse(cx, cy + 18, 8, 10, 0, 0, Math.PI * 2); ctx.fill(); // 蜂蜜罐
        ctx.fillStyle = '#e08020'; ctx.beginPath(); ctx.ellipse(cx, cy + 10, 6, 2, 0, 0, Math.PI * 2); ctx.fill(); // 盖子
        ctx.font = '10px sans-serif'; ctx.fillText('🍯', cx - 6, cy + 22);
    }
    ctx.fillStyle = dark;
    ctx.beginPath(); ctx.ellipse(cx - 15, cy + 8, 6, 12, -0.5, 0, Math.PI * 2); ctx.fill(); // 左手
    ctx.beginPath(); ctx.ellipse(cx + 15, cy + 8, 6, 12, 0.5, 0, Math.PI * 2); ctx.fill(); // 右手
    // 头部
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(cx, cy - 12, 18, 16, 0, 0, Math.PI * 2); ctx.fill();
    // 圆耳朵
    [[cx - 14, cy - 22], [cx + 14, cy - 22]].forEach(([ex, ey]) => {
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(ex, ey, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = light; ctx.beginPath(); ctx.arc(ex, ey, 3, 0, Math.PI * 2); ctx.fill();
    });
    // 脸部突出的口鼻区
    ctx.fillStyle = light; ctx.beginPath(); ctx.ellipse(cx, cy - 5, 8, 6, 0, 0, Math.PI * 2); ctx.fill();
    // 眼睛和鼻子
    const ey = cy - 14;
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(cx - 7, ey, 2.5, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(cx + 7, ey, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx, cy - 7, 3, 2, 0, 0, Math.PI * 2); ctx.fill(); // 大黑鼻
    if(lv >= 4) { ctx.font = '16px sans-serif'; ctx.fillText('👑', cx - 8, cy - 32); }
    if(h>0.4){ ctx.fillStyle='rgba(255,100,100,0.3)'; ctx.beginPath(); ctx.arc(cx-12,cy-9,3,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(cx+12,cy-9,3,0,Math.PI*2); ctx.fill(); }
    drawTears(ctx, cx, cy-8, h); if (S.petEnergy < 25) { ctx.font = '12px sans-serif'; ctx.fillText('💤', cx + 18, cy - 25); }
}

// ── 🦄独角兽 (3/4侧面，高贵，Lv越高彩虹鬃毛越绚丽且长出天马翅膀) ──
function drawUnicorn(ctx, cx, cy, stage) {
    const lv = S.petLevel, h = S.petHappy / 100, col = stage.color || '#f0f0f0';
    const light = adjustColor(col, 20), dark = adjustColor(col, -20);
    // 天马翅膀 (Lv5)
    if (lv >= 5) {
        const flap = Math.sin(petT * 2) * 0.2;
        ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.strokeStyle = '#e0e0ff'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(cx - 15, cy, 12, 20, -0.5 + flap, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(cx + 10, cy - 5, 10, 18, 0.5 - flap, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }
    // 远端腿
    ctx.fillStyle = dark; ctx.beginPath(); ctx.ellipse(cx - 5, cy + 22, 3, 10, 0.1, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.ellipse(cx + 12, cy + 22, 3, 10, -0.1, 0, Math.PI * 2); ctx.fill();
    // 身体与脖子
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(cx + 5, cy + 10, 16, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx - 10, cy - 10); ctx.lineTo(cx + 2, cy); ctx.lineTo(cx + 5, cy + 8); ctx.lineTo(cx - 5, cy + 8); ctx.fill();
    // 近端腿
    ctx.fillStyle = light; ctx.beginPath(); ctx.ellipse(cx - 10, cy + 24, 3.5, 10, 0.2, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.ellipse(cx + 6, cy + 24, 3.5, 10, -0.2, 0, Math.PI * 2); ctx.fill();
    // 彩虹尾巴与鬃毛 (进化更长更绚丽)
    const rc = ['#ff8080','#ffcc60','#a0e880','#60c8ff','#c080ff'];
    ctx.lineWidth = 3 + lv; ctx.lineCap = 'round';
    for (let i = 0; i < Math.min(lv + 1, 5); i++) {
        ctx.strokeStyle = rc[i % rc.length];
        // 尾巴
        ctx.beginPath(); ctx.moveTo(cx + 20, cy + 8); ctx.quadraticCurveTo(cx + 35, cy + 10 + i*3, cx + 25 + i*2, cy + 25); ctx.stroke();
        // 鬃毛
        ctx.beginPath(); ctx.moveTo(cx - 5, cy - 20); ctx.quadraticCurveTo(cx + 10, cy - 10 + i*4, cx + 5, cy + i*3); ctx.stroke();
    }
    // 头部
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(cx - 12, cy - 18, 12, 10, -0.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx - 20, cy - 14, 8, 6, -0.4, 0, Math.PI * 2); ctx.fill(); // 嘴部
    // 耳朵
    ctx.beginPath(); ctx.ellipse(cx - 2, cy - 25, 4, 8, 0.2, 0, Math.PI * 2); ctx.fill();
    // 独角 (核心特征，Lv越高角越长且发光)
    const hLen = 12 + lv * 3;
    const hg = ctx.createLinearGradient(cx - 18, cy - 22, cx - 25, cy - 22 - hLen);
    hg.addColorStop(0, '#ffcc60'); hg.addColorStop(1, '#a0e880');
    ctx.fillStyle = hg; ctx.beginPath(); ctx.moveTo(cx - 14, cy - 22); ctx.lineTo(cx - 18, cy - 22); ctx.lineTo(cx - 20 - lv, cy - 22 - hLen); ctx.fill();
    if(lv >= 3) { ctx.shadowColor = '#ffcc60'; ctx.shadowBlur = 10; ctx.fill(); ctx.shadowBlur = 0; } // 发光
    // 眼睛
    const ey = cy - 18;
    if(h > 0.5) { ctx.strokeStyle = '#222'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx - 12, ey, 3, Math.PI, Math.PI * 2); ctx.stroke(); }
    else { ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(cx - 12, ey, 2.5, 0, Math.PI * 2); ctx.fill(); }
    drawTears(ctx, cx-12, cy-12, h); if (S.petEnergy < 25) { ctx.fillStyle = '#6090e0'; ctx.font = '12px sans-serif'; ctx.fillText('💤', cx - 30, cy - 30); }
}

// ── 🐯小老虎 (正面圆胖，王字斑纹，Lv越高越霸气) ──
function drawTiger(ctx, cx, cy, stage) {
    const lv = S.petLevel, h = S.petHappy / 100, col = stage.color || '#f09030';
    const light = adjustColor(col, 50), dark = adjustColor(col, -80); // dark用于斑纹
    // 尾巴
    ctx.strokeStyle = col; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx + 12, cy + 10); ctx.quadraticCurveTo(cx + 25, cy + 5, cx + 22, cy - 10); ctx.stroke();
    // 身体
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(cx, cy + 12, 18, 16, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = light; ctx.beginPath(); ctx.ellipse(cx, cy + 14, 12, 10, 0, 0, Math.PI * 2); ctx.fill(); // 白肚皮
    // 手脚
    ctx.fillStyle = col;
    [[cx - 12, cy + 22], [cx + 12, cy + 22]].forEach(([px, py]) => {
        ctx.beginPath(); ctx.ellipse(px, py, 6, 5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = dark; ctx.lineWidth = 1.5; // 爪子纹理
        ctx.beginPath(); ctx.moveTo(px-2, py+2); ctx.lineTo(px-2, py+5); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px+2, py+2); ctx.lineTo(px+2, py+5); ctx.stroke();
    });
    // 头部 (大圆脸，两颊多毛)
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(cx, cy - 10, 22, 18, 0, 0, Math.PI * 2); ctx.fill();
    if(lv >= 3){ ctx.beginPath(); ctx.moveTo(cx-22, cy-10); ctx.lineTo(cx-30, cy-5); ctx.lineTo(cx-20, cy); ctx.fill(); ctx.beginPath(); ctx.moveTo(cx+22, cy-10); ctx.lineTo(cx+30, cy-5); ctx.lineTo(cx+20, cy); ctx.fill(); } // 脸颊毛发
    ctx.fillStyle = light; ctx.beginPath(); ctx.ellipse(cx, cy - 4, 12, 8, 0, 0, Math.PI * 2); ctx.fill(); // 嘴套
    // 圆耳朵
    [[cx - 15, cy - 24], [cx + 15, cy - 24]].forEach(([ex, ey]) => {
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(ex, ey, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = light; ctx.beginPath(); ctx.arc(ex, ey, 3, 0, Math.PI * 2); ctx.fill();
    });
    // 王字斑纹 (核心特征)
    ctx.strokeStyle = dark; ctx.lineWidth = 2; ctx.lineCap = 'round';
    const wy = cy - 22;
    ctx.beginPath(); ctx.moveTo(cx - 5, wy); ctx.lineTo(cx + 5, wy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - 6, wy + 3); ctx.lineTo(cx + 6, wy + 3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - 4, wy + 6); ctx.lineTo(cx + 4, wy + 6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, wy - 1); ctx.lineTo(cx, wy + 7); ctx.stroke(); // 竖线
    // 脸颊斑纹
    ctx.beginPath(); ctx.moveTo(cx - 20, cy - 12); ctx.lineTo(cx - 14, cy - 10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - 22, cy - 8); ctx.lineTo(cx - 15, cy - 6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 20, cy - 12); ctx.lineTo(cx + 14, cy - 10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 22, cy - 8); ctx.lineTo(cx + 15, cy - 6); ctx.stroke();
    // 眼睛和鼻子
    const ey = cy - 10;
    ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(cx - 8, ey, 2.5, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(cx + 8, ey, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff6060'; ctx.beginPath(); ctx.ellipse(cx, cy - 6, 3, 2.5, 0, 0, Math.PI * 2); ctx.fill(); // 威武红鼻
    // 进化：威武披风 / 仙气
    if (lv >= 4) { ctx.font = '16px sans-serif'; ctx.fillText('🔥', cx - 8, cy - 36); }
    drawTears(ctx, cx, cy - 6, h); if (S.petEnergy < 25) { ctx.font = '12px sans-serif'; ctx.fillText('💤', cx + 18, cy - 25); }
}


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
    const bpx=cx+19,bpy=cy-4;
    ctx.fillStyle='#6090e0';ctx.strokeStyle='#4070c0';ctx.lineWidth=1.2;
    const _rr=(c,x,y,w,h,r)=>{c.beginPath();if(c.roundRect){c.roundRect(x,y,w,h,r);}else{c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.arcTo(x+w,y,x+w,y+r,r);c.lineTo(x+w,y+h-r);c.arcTo(x+w,y+h,x+w-r,y+h,r);c.lineTo(x+r,y+h);c.arcTo(x,y+h,x,y+h-r,r);c.lineTo(x,y+r);c.arcTo(x,y,x+r,y,r);c.closePath();}};
    _rr(ctx,bpx-6,bpy-9,13,15,3);ctx.fill();ctx.stroke();
    ctx.fillStyle='#80b0ff';_rr(ctx,bpx-3.5,bpy-6,7,5.5,2);ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.arc(bpx,bpy+4,1.3,0,Math.PI*2);ctx.fillStyle='#ffd700';ctx.fill();
    ctx.strokeStyle='#4070c0';ctx.lineWidth=1.5;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(bpx-6,bpy-9);ctx.bezierCurveTo(bpx-14,bpy-8,bpx-14,bpy+2,bpx-6,bpy+6);ctx.stroke();
  }
  // ── 以下为新增衣服绘制 ──
  else if(clothId==='c_ninja'){
    // 忍者头巾：深色布条缠绕头部
    const ny=headCy,nx=cx;
    ctx.fillStyle='#1a1a2a';
    // 头带主体
    ctx.beginPath();ctx.ellipse(nx,ny-2,18,6,0,0,Math.PI*2);ctx.fill();
    // 额头部分露出眼睛区域
    ctx.fillStyle='#2a2a3a';
    ctx.beginPath();ctx.rect(nx-14,ny-8,28,6);ctx.fill();
    // 眼缝
    ctx.fillStyle='rgba(255,80,80,0.6)';
    ctx.beginPath();ctx.rect(nx-10,ny-7,8,3);ctx.fill();
    ctx.beginPath();ctx.rect(nx+2,ny-7,8,3);ctx.fill();
    // 头巾垂下的飘带
    ctx.fillStyle='#1a1a2a';
    ctx.beginPath();ctx.moveTo(nx+14,ny-2);ctx.lineTo(nx+20,ny+10);ctx.lineTo(nx+12,ny+12);ctx.lineTo(nx+8,ny);ctx.fill();
  }
  else if(clothId==='c_angel'){
    // 天使翅膀：身体两侧白色羽翼
    ctx.fillStyle='rgba(255,255,255,0.92)';ctx.strokeStyle='rgba(200,220,255,0.8)';ctx.lineWidth=1.5;
    // 左翼
    ctx.beginPath();ctx.ellipse(cx-24,cy-4,10,16,0.3,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.ellipse(cx-20,cy+4,6,10,0.5,0,Math.PI*2);ctx.fill();ctx.stroke();
    // 右翼
    ctx.beginPath();ctx.ellipse(cx+24,cy-4,10,16,-0.3,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.ellipse(cx+20,cy+4,6,10,-0.5,0,Math.PI*2);ctx.fill();ctx.stroke();
    // 光环（头顶）
    ctx.strokeStyle='#ffd700';ctx.lineWidth=3;
    ctx.beginPath();ctx.ellipse(cx,headCy-12,13,4,0,0,Math.PI*2);ctx.stroke();
    // 光环光晕
    ctx.strokeStyle='rgba(255,220,50,0.35)';ctx.lineWidth=6;
    ctx.beginPath();ctx.ellipse(cx,headCy-12,13,4,0,0,Math.PI*2);ctx.stroke();
  }
  else if(clothId==='c_witch'){
    // 小魔女帽：黑色尖帽
    const wx=cx,wy=headCy-10;
    // 帽檐
    ctx.fillStyle='#1a0a2a';ctx.strokeStyle='#6a309a';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.ellipse(wx,wy+4,20,5,0,0,Math.PI*2);ctx.fill();ctx.stroke();
    // 帽身（三角）
    ctx.fillStyle='#1a0a2a';
    ctx.beginPath();ctx.moveTo(wx-14,wy+4);ctx.lineTo(wx+14,wy+4);ctx.lineTo(wx+4,wy-22);ctx.lineTo(wx-2,wy-22);ctx.fill();ctx.stroke();
    // 帽带
    ctx.fillStyle='#b040e0';
    ctx.beginPath();ctx.rect(wx-13,wy-2,26,5);ctx.fill();
    // 星星装饰
    ctx.fillStyle='#ffd700';ctx.font='10px sans-serif';ctx.fillText('⭐',wx-6,wy-2);
    // 帽顶弯曲
    ctx.strokeStyle='#6a309a';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(wx+3,wy-22);ctx.quadraticCurveTo(wx+8,wy-28,wx+6,wy-32);ctx.stroke();
  }
  else if(clothId==='c_space'){
    // 宇航服头盔：圆形玻璃罩
    const sx=cx,sy=headCy;
    // 头盔外壳（灰白色）
    ctx.fillStyle='#d8e0e8';ctx.strokeStyle='#8090a0';ctx.lineWidth=2;
    ctx.beginPath();ctx.arc(sx,sy,20,0,Math.PI*2);ctx.fill();ctx.stroke();
    // 玻璃面板（深色）
    ctx.fillStyle='rgba(40,80,160,0.6)';
    ctx.beginPath();ctx.ellipse(sx,sy,14,12,0,0,Math.PI*2);ctx.fill();
    // 反光
    ctx.fillStyle='rgba(255,255,255,0.4)';
    ctx.beginPath();ctx.ellipse(sx-4,sy-4,5,4,-0.4,0,Math.PI);ctx.fill();
    // 头盔侧面通风口
    ctx.fillStyle='#a0b0c0';
    [[sx-18,sy-4],[sx+18,sy-4]].forEach(([hx,hy])=>{
      ctx.beginPath();ctx.rect(hx-3,hy,5,8);ctx.fill();
    });
    // NASA标志感的彩条
    ctx.fillStyle='#e04040';
    ctx.beginPath();ctx.rect(sx-7,sy-22,14,4);ctx.fill();
    ctx.fillStyle='#4080e0';
    ctx.beginPath();ctx.rect(sx-7,sy-18,14,3);ctx.fill();
  }
  else if(clothId==='c_grad'){
    // 学士帽：扁平方形帽顶
    const gx=cx,gy=headCy-12;
    // 帽带（头箍）
    ctx.fillStyle='#1a2a50';
    ctx.beginPath();ctx.ellipse(gx,gy+6,16,5,0,0,Math.PI*2);ctx.fill();
    // 帽顶（四方形板）
    ctx.fillStyle='#1a2a50';ctx.strokeStyle='#2a3a70';ctx.lineWidth=1;
    ctx.beginPath();ctx.rect(gx-16,gy-8,32,8);ctx.fill();ctx.stroke();
    // 流苏（右侧垂下）
    ctx.strokeStyle='#ffd700';ctx.lineWidth=2;ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(gx+10,gy-4);ctx.lineTo(gx+16,gy+4);ctx.lineTo(gx+14,gy+14);ctx.stroke();
    // 流苏尾端
    ctx.fillStyle='#ffd700';
    ctx.beginPath();ctx.arc(gx+14,gy+15,2.5,0,Math.PI*2);ctx.fill();
    // 帽顶亮光
    ctx.fillStyle='rgba(255,255,255,0.15)';
    ctx.beginPath();ctx.rect(gx-16,gy-8,32,3);ctx.fill();
  }
  else if(clothId==='c_robe'){
    // 魔法长袍：星月图案深紫色袍子
    // 袍子主体（身体下方）
    ctx.fillStyle='#2a1050';ctx.strokeStyle='#6a30c0';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(cx-14,cy+2);ctx.lineTo(cx-18,cy+32);ctx.lineTo(cx+18,cy+32);ctx.lineTo(cx+14,cy+2);ctx.fill();ctx.stroke();
    // 袍子领口（V领）
    ctx.strokeStyle='#9060e0';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(cx-6,cy);ctx.lineTo(cx,cy+10);ctx.lineTo(cx+6,cy);ctx.stroke();
    // 袖子（两侧宽大）
    ctx.fillStyle='#2a1050';ctx.strokeStyle='#6a30c0';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.ellipse(cx-20,cy+8,8,14,0.3,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.ellipse(cx+20,cy+8,8,14,-0.3,0,Math.PI*2);ctx.fill();ctx.stroke();
    // 星月装饰
    ctx.fillStyle='#ffd700';ctx.font='10px sans-serif';
    ctx.fillText('⭐',cx-4,cy+16);ctx.fillText('🌙',cx+4,cy+24);
  }
  else if(clothId==='c_knight'){
    // 骑士盔甲：银色金属甲
    // 胸甲
    ctx.fillStyle='#c0c8d0';ctx.strokeStyle='#809090';ctx.lineWidth=1.5;
    {const _rr2=(c,x,y,w,h,r)=>{c.beginPath();if(c.roundRect){c.roundRect(x,y,w,h,r);}else{c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.arcTo(x+w,y,x+w,y+r,r);c.lineTo(x+w,y+h-r);c.arcTo(x+w,y+h,x+w-r,y+h,r);c.lineTo(x+r,y+h);c.arcTo(x,y+h,x,y+h-r,r);c.lineTo(x,y+r);c.arcTo(x,y,x+r,y,r);c.closePath();}};_rr2(ctx,cx-13,cy-2,26,18,3);ctx.fill();ctx.stroke();}
    // 甲片横纹
    ctx.strokeStyle='#8090a0';ctx.lineWidth=1;
    [cy+4,cy+10].forEach(ly=>{ctx.beginPath();ctx.moveTo(cx-12,ly);ctx.lineTo(cx+12,ly);ctx.stroke();});
    // 肩甲
    [[cx-16,cy-4],[cx+16,cy-4]].forEach(([sx,sy])=>{
      ctx.fillStyle='#b0b8c0';ctx.strokeStyle='#809090';ctx.lineWidth=1.2;
      ctx.beginPath();ctx.ellipse(sx,sy,7,5,0,0,Math.PI*2);ctx.fill();ctx.stroke();
    });
    // 骑士头盔
    ctx.fillStyle='#c0c8d0';ctx.strokeStyle='#809090';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.ellipse(cx,headCy,16,14,0,0,Math.PI*2);ctx.fill();ctx.stroke();
    // 面甲缝隙
    ctx.strokeStyle='#607080';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(cx-8,headCy-4);ctx.lineTo(cx-8,headCy+6);ctx.stroke();
    ctx.beginPath();ctx.moveTo(cx+8,headCy-4);ctx.lineTo(cx+8,headCy+6);ctx.stroke();
    ctx.beginPath();ctx.moveTo(cx-5,headCy+4);ctx.lineTo(cx+5,headCy+4);ctx.stroke();
    // 羽冠
    ctx.fillStyle='#e04040';
    ctx.beginPath();ctx.ellipse(cx,headCy-14,4,8,0,0,Math.PI*2);ctx.fill();
    // 中间黄金徽章
    ctx.fillStyle='#ffd700';ctx.beginPath();ctx.arc(cx,cy+4,4,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#fff';ctx.font='8px sans-serif';ctx.fillText('✦',cx-4,cy+7);
  }
  else if(clothId==='c_princess'){
    // 公主长裙：粉紫色蓬蓬裙
    // 裙摆（下方大蓬蓬）
    ctx.fillStyle='#f0a0d0';ctx.strokeStyle='#d060a0';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.ellipse(cx,cy+22,24,14,0,0,Math.PI*2);ctx.fill();ctx.stroke();
    // 裙身（胸部到腰）
    ctx.fillStyle='#e880c0';ctx.strokeStyle='#c050a0';ctx.lineWidth=1.2;
    ctx.beginPath();ctx.moveTo(cx-10,cy-2);ctx.lineTo(cx-14,cy+18);ctx.lineTo(cx+14,cy+18);ctx.lineTo(cx+10,cy-2);ctx.fill();ctx.stroke();
    // 裙腰带
    ctx.fillStyle='#ffd700';
    ctx.beginPath();ctx.rect(cx-10,cy+8,20,4);ctx.fill();
    // 领口蕾丝
    ctx.strokeStyle='#fff0f8';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(cx-9,cy-2);ctx.quadraticCurveTo(cx,cy+5,cx+9,cy-2);ctx.stroke();
    // 公主发冠
    const px=cx,py=headCy-10;
    ctx.fillStyle='#ffd700';ctx.strokeStyle='#c0a000';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(px-10,py);ctx.lineTo(px-8,py-10);ctx.lineTo(px-3,py-5);ctx.lineTo(px,py-14);ctx.lineTo(px+3,py-5);ctx.lineTo(px+8,py-10);ctx.lineTo(px+10,py);ctx.fill();ctx.stroke();
    // 宝石点缀
    ['#ff6060','#6060ff','#60ff60'].forEach((c,i)=>{
      ctx.fillStyle=c;ctx.beginPath();ctx.arc(px-6+i*6,py-2,2.5,0,Math.PI*2);ctx.fill();
    });
  }
  else if(clothId==='c_rainbow'){
    // 彩虹披风：身后多色披风
    const rc=['#ff8080','#ffcc60','#a0e880','#60c8ff','#c080ff'];
    const capeY=cy-8;
    for(let i=0;i<5;i++){
      ctx.fillStyle=rc[i];ctx.globalAlpha=0.7;
      ctx.beginPath();
      ctx.moveTo(cx-4+i*2,capeY);
      ctx.lineTo(cx-14+i*3,capeY+35);
      ctx.lineTo(cx-4+i*4,capeY+38);
      ctx.lineTo(cx+4+i*2,capeY);
      ctx.fill();
    }
    ctx.globalAlpha=1;
    // 披风领扣
    ctx.fillStyle='#ffd700';ctx.strokeStyle='#c0a000';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.arc(cx,capeY+2,5,0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.fillStyle='#fff';ctx.font='8px sans-serif';ctx.fillText('✦',cx-4,capeY+5);
  }
  else if(clothId==='c_galaxy'){
    // 星辰战衣：深蓝星空图案全身
    // 战衣主体
    ctx.fillStyle='#0a0a2a';ctx.strokeStyle='#3060c0';ctx.lineWidth=1.5;
    {const _rr3=(c,x,y,w,h,r)=>{c.beginPath();if(c.roundRect){c.roundRect(x,y,w,h,r);}else{c.moveTo(x+r,y);c.lineTo(x+w-r,y);c.arcTo(x+w,y,x+w,y+r,r);c.lineTo(x+w,y+h-r);c.arcTo(x+w,y+h,x+w-r,y+h,r);c.lineTo(x+r,y+h);c.arcTo(x,y+h,x,y+h-r,r);c.lineTo(x,y+r);c.arcTo(x,y,x+r,y,r);c.closePath();}};_rr3(ctx,cx-14,cy-4,28,22,3);ctx.fill();ctx.stroke();}
    // 肩甲
    [[cx-17,cy-5],[cx+17,cy-5]].forEach(([sx,sy])=>{
      ctx.fillStyle='#1a2060';ctx.strokeStyle='#4060c0';ctx.lineWidth=1;
      ctx.beginPath();ctx.ellipse(sx,sy,7,5,-0.1,0,Math.PI*2);ctx.fill();ctx.stroke();
    });
    // 星星装饰（随机散布在战衣上）
    ctx.fillStyle='rgba(255,255,255,0.8)';
    [[cx-6,cy+4],[cx+7,cy+2],[cx-2,cy+12],[cx+5,cy+14],[cx-8,cy+10]].forEach(([sx,sy])=>{
      ctx.beginPath();ctx.arc(sx,sy,1.2,0,Math.PI*2);ctx.fill();
    });
    // 星云光晕
    const sg=ctx.createRadialGradient(cx,cy+8,2,cx,cy+8,14);
    sg.addColorStop(0,'rgba(80,120,255,0.3)');sg.addColorStop(1,'rgba(80,120,255,0)');
    ctx.fillStyle=sg;ctx.beginPath();ctx.ellipse(cx,cy+8,14,12,0,0,Math.PI*2);ctx.fill();
    // 能量纹路
    ctx.strokeStyle='#4080ff';ctx.lineWidth=1;ctx.setLineDash([2,3]);
    ctx.beginPath();ctx.moveTo(cx-12,cy+2);ctx.lineTo(cx+12,cy+2);ctx.stroke();
    ctx.beginPath();ctx.moveTo(cx-12,cy+10);ctx.lineTo(cx+12,cy+10);ctx.stroke();
    ctx.setLineDash([]);
    // 宇宙徽章
    ctx.fillStyle='#4080ff';ctx.beginPath();ctx.arc(cx,cy+6,4,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#fff';ctx.font='7px sans-serif';ctx.fillText('✦',cx-3,cy+9);
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
function showPetTalk(key){const br=S.petBreed||'hamster';const bl=(window.PET_TALK_BREED&&PET_TALK_BREED[br]&&PET_TALK_BREED[br][key])||[];const lines=bl.length?bl:(PET_TALK[key]||[]);if(!lines.length)return;let txt=lines[Math.floor(Math.random()*lines.length)];txt=txt.replace('{name}',S.petName||'我');const el=document.getElementById('pet-talk');if(!el)return;el.textContent=txt;el.classList.add('show');clearTimeout(talkTimer);talkTimer=setTimeout(()=>el.classList.remove('show'),3500);}

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
    if(!S.petReachedLevels)S.petReachedLevels={};
    const _petId=S.activePet;
    const _prevMax=(S.petReachedLevels[_petId]||0);
    const _targetLv=S.petLevel+1;
    const _alreadyReached=_prevMax>=_targetLv;
    const _needed=_alreadyReached?1:5;
    const _title=_alreadyReached?`⬆️ 重回旧形态（仅需答对1题）`:`⬆️ 进化（需答对5题）`;
    if(_alreadyReached)showToast('✨ 曾到达过此形态，仅需答对1题！');
    showPetTalk('evolve_ready');
    openQuiz({title:_title,needed:_needed,onSuccess:()=>{
      S.petLevel++;S.petLearnExp=0;
      if(!S.petReachedLevels)S.petReachedLevels={};
      S.petReachedLevels[_petId]=Math.max(S.petReachedLevels[_petId]||0,S.petLevel);
      gainExp(60);saveCurPet();persistAccount();updatePetUI();checkAchs();
      showPetTalk('evolve_done');const st=getEvoStage();
      showResult('🌟','成功进化！',`${S.petName} 进化为【${st.name}】\n${st.desc}\n✨继续好好照顾ta！`);
    },onFail:()=>{}});return;
  }
  if(type==='degrade'){
    if(S.petLevel<=1){showToast('已是初始形态，无法退化');return;}
    showPetTalk('degrade_ask');
    setTimeout(()=>{
      const _stages=EVO_STAGES[S.petBreed||'hamster']||EVO_STAGES.hamster;
      const _opts=[];
      for(let lv=1;lv<S.petLevel;lv++) _opts.push({label:`Lv.${lv}「${_stages[lv-1].name}」`,value:lv});
      openStageSelect('⬇️ 选择退化目标',`${S.petName} 将退化到所选形态（经验清零）`,_opts,(targetLv)=>{
        openConfirm('⬇️',`确定退化到【Lv.${targetLv} ${_stages[targetLv-1].name}】？\n（学习经验清零，之后可重新进化）`,
          ()=>execDegrade(targetLv),false,()=>showPetTalk('degrade_cancel'));
      },()=>showPetTalk('degrade_cancel'));
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

function openStageSelect(title,desc,opts,onSelect,onCancel){
  const ov=document.createElement('div');
  ov.id='stage-sel-ov';
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:3000;display:flex;align-items:center;justify-content:center';
  let html=`<div style="background:#fff;border-radius:18px;padding:22px 20px;max-width:290px;width:90%;box-shadow:0 8px 32px rgba(0,0,0,0.18)">
    <div style="font-size:1rem;font-weight:700;margin-bottom:6px;text-align:center">${title}</div>
    <div style="font-size:.75rem;color:#888;margin-bottom:14px;text-align:center">${desc}</div>`;
  opts.forEach(opt=>{
    html+=`<button onclick="window._stageSel(${opt.value})" style="display:block;width:100%;padding:11px 14px;margin:7px 0;border-radius:11px;border:1.5px solid #d0e8d0;background:rgba(90,154,90,0.07);font-family:'Noto Sans SC',sans-serif;font-size:.88rem;cursor:pointer;color:#2a4a2a;transition:.15s" onmouseover="this.style.background='rgba(90,154,90,0.18)'" onmouseout="this.style.background='rgba(90,154,90,0.07)'">${opt.label}</button>`;
  });
  html+=`<button onclick="window._stageSel(-1)" style="display:block;width:100%;padding:9px;margin-top:10px;border-radius:10px;border:1.5px solid #e0e0e0;background:transparent;font-family:'Noto Sans SC',sans-serif;font-size:.8rem;cursor:pointer;color:#aaa">取消</button></div>`;
  ov.innerHTML=html;document.body.appendChild(ov);
  window._stageSel=(lv)=>{
    ov.remove();window._stageSel=null;
    if(lv===-1){if(onCancel)onCancel();}else{onSelect(lv);}
  };
}
function execDegrade(targetLv){
  openQuiz({title:'⬇️ 退化确认（答对1题）',needed:1,
    onSuccess:()=>{
      if(!S.petReachedLevels)S.petReachedLevels={};
      const petId=S.activePet;
      S.petReachedLevels[petId]=Math.max(S.petReachedLevels[petId]||0,S.petLevel);
      S.petLevel=targetLv;S.petLearnExp=0;
      saveCurPet();persistAccount();updatePetUI();
      showPetTalk('degrade_done');
      showToast(`${S.petName} 退化到了 ${getEvoStage().name} 形态`);
    }
  });
}


// ─── SHOP ─────────────────────────────────────────
let curShopTab='seeds';
function shopTab(tab){
  curShopTab=tab;
  // 确保皮肤tab存在
  ensureSkinTab();
  document.querySelectorAll('.stab').forEach((t,i)=>t.classList.toggle('on',['seeds','clothes','pets','tools','skins'][i]===tab));
  renderShop();
}
function ensureSkinTab(){
  const tabs=document.querySelectorAll('.stab');
  if(tabs.length>=5)return; // 已有5个
  const lastTab=tabs[tabs.length-1];
  if(!lastTab)return;
  const skinTab=document.createElement('button');
  skinTab.className='stab';skinTab.textContent='🎨皮肤';
  skinTab.onclick=()=>shopTab('skins');
  lastTab.parentNode.insertBefore(skinTab,lastTab.nextSibling);
}
function renderShop(){
  const g=document.getElementById('shop-grid');g.innerHTML='';
  if(curShopTab==='seeds'){SEED_IDS.forEach(sid=>{const sd=SEEDS[sid];const unlocked=S.unlockedSeeds.includes(sid);const d=document.createElement('div');d.className='shop-item'+(unlocked?' owned':'');d.innerHTML=`<div class="si-ico">${sd.ico}</div><div class="si-nm">${sd.name}</div><div class="si-desc">${sd.desc}<br>🪙${sd.reward}收益·${sd.autoGrowH*4}h成熟</div><div class="si-price">${unlocked?'每粒🪙'+sd.buyCoins:sd.shopUnlock>0?'解锁🪙'+sd.shopUnlock:'免费'}</div><div class="si-tag ${unlocked?'green':'gold'}">${unlocked?'库存：'+S.seedBag[sid]+'粒':sd.shopUnlock>0?'点击解锁':'✓已解锁'}</div>`;if(!unlocked&&sd.shopUnlock>0){d.onclick=()=>{openConfirm(sd.ico,`花费🪙${sd.shopUnlock}解锁${sd.name}？`,()=>{if(S.coins<sd.shopUnlock){showToast('金币不足！');return;}S.coins-=sd.shopUnlock;S.unlockedSeeds.push(sid);persistAccount();renderShop();showToast(`✅${sd.name}已解锁！`);checkAchs();});};}else if(unlocked){d.onclick=()=>openSeedPicker('buy',true,null);}g.appendChild(d);});}
  else if(curShopTab==='clothes'){SHOP_CLOTHES.forEach(item=>{
    const owned=S.ownedClothes.includes(item.id),equipped=S.equippedCloth===item.id;
    const lvReq=item.levelUnlock||0,locked=!owned&&S.level<lvReq;
    const d=document.createElement('div');
    d.className='shop-item'+(equipped?' equipped':owned?' owned':locked?' soldout':'');
    d.innerHTML='<div class="si-ico" style="'+(locked?'filter:grayscale(.6)':'')+'">'+item.ico+'</div>'
      +'<div class="si-nm">'+item.name+'</div>'
      +'<div class="si-desc">'+item.desc+'</div>'
      +'<div class="si-price">'+(owned?(equipped?'✓穿戴中':'已拥有'):locked?'🔒Lv.'+lvReq+'解锁':'🪙'+item.price)+'</div>'
      +(equipped?'<div class="si-tag green">✓正在穿戴</div>':'')
      +(locked?'<div class="si-tag gold">等级不足</div>':'');
    d.onclick=()=>{
      if(locked){showToast('需要Lv.'+lvReq+'才能购买！');return;}
      if(!owned){openClothPreview(item);}
      else{
        S.equippedCloth=equipped?null:item.id;
        saveCurPet();persistAccount();renderShop();updatePetUI();
        drawPet();setTimeout(drawPet,50);setTimeout(drawPet,300);
        showPetTalk(equipped?'tap':'cloth_on');
        showToast(equipped?`已脱下${item.name}`:`已穿上${item.name}！`);
      }
    };
    g.appendChild(d);
  });}
  else if(curShopTab==='pets'){SHOP_PETS.forEach(item=>{
  const owned=S.ownedPets.includes(item.id),active=S.activePet===item.id;
  const lvReq=item.levelUnlock||0,locked=!owned&&S.level<lvReq;
  const d=document.createElement('div');
  d.className='shop-item'+(active?' equipped':owned?' owned':locked?' soldout':'');
  const pid='petprev_'+item.id;
  d.innerHTML='<canvas id="'+pid+'" width="60" height="60" style="display:block;margin:0 auto 4px;border-radius:50%;background:linear-gradient(135deg,#d4f0d4,#b0d8b0);'+(locked?'filter:grayscale(.7)':'')+'"></canvas>'
    +'<div class="si-nm">'+item.name+'</div><div class="si-desc">'+item.desc+'</div>'
    +'<div class="si-price">'+(owned?(active?'✓当前宠物':'已拥有'):locked?'等级不足':'🪙'+item.price+(item.price===0?'（免费）':''))+'</div>'
    +(locked?'<div class="si-tag gold">🔒Lv.'+lvReq+'解锁</div>':'');
  setTimeout(()=>{const cvs=document.getElementById(pid);if(cvs)drawPetPreviewInCanvas(cvs,item.breed,1);},30);
  d.onclick=()=>{
    if(locked){showToast('需要Lv.'+lvReq+'才能解锁！');return;}
    if(!owned){
      // 首次购买：弹窗显示该动物的首次台词
      const gl=(window.PET_TALK_BREED&&PET_TALK_BREED[item.breed]&&PET_TALK_BREED[item.breed].first_greet)||[];
      const gt=gl.length?gl[Math.floor(Math.random()*gl.length)]:'请多关照！';
      openConfirm(item.ico,(item.price===0?'领养':'购买')+item.name+'？'+(item.price>0?'\n费用：🪙'+item.price:'')+'\n\n「'+gt+'」',()=>{
        if(item.price>0&&S.coins<item.price){showToast('金币不足！');return;}
        if(item.price>0)S.coins-=item.price;
        S.ownedPets.push(item.id);persistAccount();renderShop();updateTop();checkAchs();
        setTimeout(()=>showPetTalk('first_buy_'+item.breed),200);
        showResult(item.ico,'获得了新宠物！',item.name+'\n\n「'+gt+'」\n\n去宠物页面切换ta吧！');
      });
    }else if(!active){
      saveCurPet();
      // 把挽留话语直接嵌入弹窗文本（而不是写入宠物页面气泡）
      const sw_lines=(window.PET_TALK&&PET_TALK.switch_away)||['你要养其他好宝宝了吗……😢'];
      const sw_txt=sw_lines[Math.floor(Math.random()*sw_lines.length)];
      openConfirm(item.ico,'切换到'+item.name+'？\n当前宠物进度已保存，切换回来时恢复。\n\n『'+S.petName+'：'+sw_txt+'』',()=>{
        S.activePet=item.id;loadPetSave(item.id);persistAccount();renderShop();updatePetUI();updateTop();
        petX=75;petY=76; // 重置位置
        drawPet(); // 立即强制刷新画布
        // 首次切换：触发专属见面台词
        if(!S.firstSwitchDone)S.firstSwitchDone={};
        if(!S.firstSwitchDone[item.id]){
          S.firstSwitchDone[item.id]=true;persistAccount();
          const ml=(window.PET_TALK_BREED&&PET_TALK_BREED[item.breed]&&PET_TALK_BREED[item.breed].first_meet)||PET_TALK.first_meet||[];
          const mt=ml[Math.floor(Math.random()*ml.length)]||'很高兴见到你！';
          setTimeout(()=>{const el=document.getElementById('pet-talk');if(el){el.textContent=mt;el.classList.add('show');clearTimeout(talkTimer);talkTimer=setTimeout(()=>el.classList.remove('show'),5000);}},600);
        }else{setTimeout(()=>showPetTalk('switch_back'),600);}
      });
    }
  };
  g.appendChild(d);
});}
  else if(curShopTab==='tools'){renderToolsShop(g);}
  else if(curShopTab==='skins'){renderSkinsShop(g);}
}

function openBulkBuy(item){
  const maxQ=item.price>0?Math.min(20,Math.floor(S.coins/item.price)):20;
  const rem=item.type==='coins_for_stars'?Math.min(5,(item.maxBuy||5)-(S.coinGiftBought||0)):maxQ;
  if(rem<=0){showToast(item.type==='coins_for_stars'?'已达购买上限！':'金币不足！');return;}
  window._bItem=item;window._bQty=1;window._bMax=rem;
  const ov=document.createElement('div');ov.className='overlay on';ov.id='bulk-ov';
  ov.innerHTML='<div class="modal" style="max-width:300px">'
    +'<div class="mttl">🛒 批量购买 '+item.ico+item.name+'</div>'
    +'<div style="font-size:.78rem;color:var(--muted);margin-bottom:12px">'+(item.price>0?'每个🪙'+item.price+'，余🪙'+S.coins:'每个⭐'+item.starPrice+'，余⭐'+S.score)+'</div>'
    +'<div style="display:flex;align-items:center;gap:12px;justify-content:center;margin-bottom:14px">'
    +'<button onclick="bulkAdj(-1)" style="width:36px;height:36px;border-radius:50%;border:1.5px solid var(--border);background:var(--panel);font-size:1.2rem;cursor:pointer">－</button>'
    +'<span id="bqty" style="font-size:1.4rem;font-weight:700;min-width:40px;text-align:center">1</span>'
    +'<button onclick="bulkAdj(1)" style="width:36px;height:36px;border-radius:50%;border:1.5px solid var(--border);background:var(--panel);font-size:1.2rem;cursor:pointer">＋</button></div>'
    +'<div id="btotal" style="font-size:.82rem;color:var(--gold);text-align:center;margin-bottom:14px"></div>'
    +'<div style="display:flex;gap:8px">'
    +'<button onclick="closeBulkOv()" style="flex:1;padding:10px;border-radius:10px;border:1.5px solid var(--border);background:var(--panel);font-size:.82rem;cursor:pointer;font-family:inherit">取消</button>'
    +'<button onclick="doBulkConfirm()" style="flex:1;padding:10px;border-radius:10px;border:none;background:var(--green);color:#fff;font-size:.82rem;cursor:pointer;font-family:inherit">确认</button>'
    +'</div></div>';
  document.body.appendChild(ov);updateBulkUI();
}
function closeBulkOv(){const o=document.getElementById('bulk-ov');if(o)o.remove();}
function bulkAdj(d){window._bQty=Math.max(1,Math.min(window._bMax,window._bQty+d));updateBulkUI();}
function updateBulkUI(){
  const q=window._bQty,it=window._bItem;
  const el=document.getElementById('bqty');if(el)el.textContent=q;
  const t=document.getElementById('btotal');if(t)t.textContent=it.type==='coins_for_stars'?'合计：⭐'+(it.starPrice*q)+' → 💰'+(50*q)+'金币':'合计：🪙'+(it.price*q);
}
function doBulkConfirm(){closeBulkOv();doToolBuy(window._bItem,window._bQty);}
function doToolBuy(item,qty){
  qty=qty||1;const cost=item.price*qty;
  if(item.type==='instant_fert'){if(S.coins<cost){showToast('金币不足！');return;}const cnt=S.plots.filter(p=>['s0','s1','s2'].includes(p.s)).length;if(!cnt){showToast('没有生长中的作物！');return;}S.coins-=cost;S.plots.forEach((p,i)=>{if(['s0','s1','s2'].includes(p.s))growPlot(i,20*qty);});persistAccount();renderFarm();updateTop();showToast('💊超级肥料！所有作物+'+(20*qty)+'%');}
  else if(item.type==='fast_grow'){if(S.coins<item.price){showToast('金币不足！');return;}S.coins-=item.price;S.plots.forEach((p,i)=>{if(['s0','s1','s2'].includes(p.s))growPlot(i,50);});persistAccount();renderFarm();updateTop();showToast('⚡极速成长剂！所有作物+50%');}
  else if(item.type==='time_skip'){if(S.coins<item.price){showToast('金币不足！');return;}S.coins-=item.price;S.plots.forEach((p,i)=>{if(['s0','s1','s2'].includes(p.s)&&!p.hasCrack&&!p.hasBug){const sd=SEEDS[p.seed||'wheat'];growPlot(i,Math.min(6*(100/(sd.autoGrowH*4)),60));}});persistAccount();renderFarm();updateTop();showToast('⏰时光胶囊！模拟了6小时生长');}
  else if(item.type==='harvest_boost'){if(S.coins<cost){showToast('金币不足！');return;}S.coins-=cost;S.harvestBoostLeft=(S.harvestBoostLeft||0)+5*qty;persistAccount();updateTop();showToast('🌈丰收加倍！接下来'+S.harvestBoostLeft+'次收获金币×2');}
  else if(item.type==='buy_pest'){if(S.coins<cost){showToast('金币不足！');return;}S.coins-=cost;S.pestStock=(S.pestStock||0)+qty;persistAccount();updateTop();renderShop();showToast('🧴除虫药×'+qty+'，库存：'+S.pestStock+'瓶');}
  else if(item.type==='repair_kit'){if(S.coins<cost){showToast('金币不足！');return;}S.coins-=cost;S.repairKitStock=(S.repairKitStock||0)+qty;persistAccount();updateTop();renderShop();showToast('🔧修复套件×'+qty+'，库存：'+S.repairKitStock+'个');}
  else if(item.type==='pet_restore'){if(S.coins<item.price){showToast('金币不足！');return;}S.coins-=item.price;S.petFood=Math.max(S.petFood,80);S.petHappy=Math.max(S.petHappy,80);S.petClean=Math.max(S.petClean,80);S.petEnergy=Math.max(S.petEnergy,80);saveCurPet();persistAccount();updatePetUI();updateTop();showToast('💝宠物补给包！所有属性恢复至80+');}
  else if(item.type==='evo_boost'){if(S.coins<item.price){showToast('金币不足！');return;}S.coins-=item.price;S.petLearnExp=(S.petLearnExp||0)+100;saveCurPet();persistAccount();updatePetUI();updateTop();showToast('🧬进化催化剂！学习经验+100');}
  else if(item.type==='exp_boost'){if(S.coins<cost){showToast('金币不足！');return;}S.coins-=cost;S.expBoostLeft+=10*qty;persistAccount();updateTop();showToast('📖学霸加成！答题经验×2，持续'+S.expBoostLeft+'题');}
  else if(item.type==='streak_shield'){if(S.coins<cost){showToast('金币不足！');return;}S.coins-=cost;S.streakShieldLeft=(S.streakShieldLeft||0)+qty;persistAccount();updateTop();renderShop();showToast('🛡️连击护盾×'+qty+'，库存：'+S.streakShieldLeft+'个');}
  else if(item.type==='seed_pack'){if(S.coins<cost){showToast('金币不足！');return;}S.coins-=cost;const got=[];for(let i=0;i<3*qty;i++){const pool=S.unlockedSeeds,sid=pool[Math.floor(Math.random()*pool.length)];S.seedBag[sid]=(S.seedBag[sid]||0)+1;got.push(SEEDS[sid].ico);}persistAccount();renderFarm();updateTop();// 统计各种子数量
    const gotMap={};got.forEach(ico=>{gotMap[ico]=(gotMap[ico]||0)+1;});
    const gotStr=Object.entries(gotMap).map(([ico,n])=>ico+(n>1?'×'+n:'')).join(' ');
    showToast('📦神秘种子包开出：'+gotStr);
    showResult('📦','种子包开箱！',got.join('')+'\n共'+got.length+'粒，已入库');}
  else if(item.type==='coins_for_stars'){const times=Math.min(qty,(item.maxBuy||5)-(S.coinGiftBought||0));if(times<=0){showToast('已达购买上限！');return;}if(S.score<item.starPrice*times){showToast('积分不足！需要⭐'+(item.starPrice*times));return;}S.score-=item.starPrice*times;S.coins+=50*times;S.totalCoins+=50*times;S.coinGiftBought=(S.coinGiftBought||0)+times;persistAccount();updateTop();showToast('💰兑换了'+(50*times)+'金币！');}
  else if(item.type==='auto_water'){
    if(S.ownedAutoWater){
      // 已购买过，免费重装（耐久度保留原值）
      S.hasAutoWater=true;persistAccount();renderFarm();updateTop();renderShop();showToast('🚿自动喷水器已重新安装！（免费）');
    }else{
      if(S.coins<item.price){showToast('金币不足！');return;}
      S.coins-=item.price;S.hasAutoWater=true;S.autoWaterDur=100;S.ownedAutoWater=true;
      persistAccount();renderFarm();updateTop();renderShop();showToast('🚿自动喷水器已安装！');
    }
  }
  else if(item.type==='auto_pest'){
    if(S.ownedAutoPest){
      // 已购买过，免费重装
      S.hasAutoPest=true;S.plots.forEach(p=>p.hasBug=false);persistAccount();renderFarm();updateTop();renderShop();showToast('🤖自动除虫机已重新安装！（免费）');
    }else{
      if(S.coins<item.price){showToast('金币不足！');return;}
      S.coins-=item.price;S.hasAutoPest=true;S.autoPestDur=100;S.ownedAutoPest=true;S.plots.forEach(p=>p.hasBug=false);
      persistAccount();renderFarm();updateTop();renderShop();showToast('🤖自动除虫机已安装！');
    }
  }
}
function doRepair(type){
  if((S.repairKitStock||0)>0){openConfirm('🔧','使用修复套件修复至100%？\n库存：'+S.repairKitStock+'个',()=>{S.repairKitStock--;if(type==='auto_water')S.autoWaterDur=100;if(type==='auto_pest')S.autoPestDur=100;persistAccount();renderShop();showToast('🔧修复完成！');});}
  else{openConfirm('🔧','花费🪙50修复至100%？',()=>{if(S.coins<50){showToast('金币不足！');return;}S.coins-=50;if(type==='auto_water')S.autoWaterDur=100;if(type==='auto_pest')S.autoPestDur=100;persistAccount();updateTop();renderShop();showToast('🔧修复完成！');});}
}
function doUninstall(type){openConfirm('⚙️','卸下设备？耐久度保留，可免费重装。',()=>{if(type==='auto_water')S.hasAutoWater=false;if(type==='auto_pest')S.hasAutoPest=false;persistAccount();renderFarm();renderShop();showToast('设备已卸下');});}
function renderToolsShop(g){
  SHOP_TOOLS.forEach(item=>{
    const d=document.createElement('div');
    const isDevice=item.type==='auto_water'||item.type==='auto_pest';
    const installed=(item.type==='auto_water'&&S.hasAutoWater)||(item.type==='auto_pest'&&S.hasAutoPest);
    const ownedNotInstalled=isDevice&&((item.type==='auto_water'&&S.ownedAutoWater&&!S.hasAutoWater)||(item.type==='auto_pest'&&S.ownedAutoPest&&!S.hasAutoPest));
    const dur=item.type==='auto_water'?(S.autoWaterDur??100):(item.type==='auto_pest'?(S.autoPestDur??100):null);
    const durStr=installed&&dur!==null?' <span style="font-size:.65rem;color:'+(dur>50?'var(--green)':dur>20?'#e8a000':'var(--red)')+'">'+'耐久'+Math.round(dur)+'%</span>':'';
    // 金币礼包：检查是否达到购买上限
    const cgLimit=item.type==='coins_for_stars'&&(S.coinGiftBought||0)>=(item.maxBuy||5);
    const priceStr=item.type==='coins_for_stars'?'⭐'+item.starPrice+'积分':'🪙'+item.price;
    d.className='shop-item'+(cgLimit?' soldout':'');
    d.innerHTML='<div class="si-ico">'+item.ico+'</div><div class="si-nm">'+item.name+durStr+'</div><div class="si-desc">'+item.desc+'</div>'
      +'<div class="si-price">'+(installed?'<span style="color:var(--green)">✓已安装</span>':ownedNotInstalled?'<span style="color:var(--green)">免费重装</span>':cgLimit?'<span style="color:var(--muted)">已达上限</span>':item.bulkable?'<span style="color:var(--gold)">'+priceStr+'/个</span>':priceStr)+'</div>';
    if(isDevice&&installed){
      const bw=document.createElement('div');bw.style.cssText='display:flex;gap:5px;margin-top:6px';
      const rb=document.createElement('button');rb.style.cssText='flex:1;padding:5px;border-radius:8px;border:1.5px solid var(--green);background:transparent;color:var(--green);font-size:.72rem;cursor:pointer;font-family:inherit';rb.textContent='🔧修复';rb.onclick=e=>{e.stopPropagation();doRepair(item.type);};
      const ub=document.createElement('button');ub.style.cssText='flex:1;padding:5px;border-radius:8px;border:1.5px solid var(--muted);background:transparent;color:var(--muted);font-size:.72rem;cursor:pointer;font-family:inherit';ub.textContent='卸下';ub.onclick=e=>{e.stopPropagation();doUninstall(item.type);};
      bw.appendChild(rb);bw.appendChild(ub);d.appendChild(bw);
    }else if(!installed&&!cgLimit){
      // 金币礼包达上限时禁止点击
      d.onclick=()=>{
        if(ownedNotInstalled){
          // 设备已拥有，免费重装确认
          openConfirm(item.ico,'免费重装'+item.name+'？\n耐久度将保持原值（'+Math.round(dur??100)+'%）',()=>doToolBuy(item,1));
        }else{
          item.bulkable?openBulkBuy(item):openConfirm(item.ico,'购买'+item.name+'？\n'+item.desc+'\n费用：'+priceStr,()=>doToolBuy(item,1));
        }
      };
    }
    g.appendChild(d);
  });
}
function renderSkinsShop(g){
  const activeSkin=(S.petSkinColors&&S.petSkinColors[S.activePet])||'sc_default';
  (window.PET_SKIN_COLORS||[]).forEach(item=>{
    const active=activeSkin===item.id;
    const owned=item.price===0||item.id==='sc_default'||(S.ownedSkins&&S.ownedSkins.includes(item.id));
    const d=document.createElement('div');
    d.className='shop-item'+(active?' equipped':owned?' owned':'');
    const sw=item.color&&item.color!=='rainbow'?'<div style="width:36px;height:36px;border-radius:50%;background:'+item.color+';border:2px solid #ccc;margin:0 auto 4px"></div>':'<div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#ff8080,#ffcc44,#88dd88,#44aaff,#cc88ff);border:2px solid #ccc;margin:0 auto 4px"></div>';
    const priceLabel=active?'✓当前':owned?'已拥有':item.price===0?'免费':'🪙'+item.price;
    d.innerHTML=sw+'<div class="si-nm">'+item.name+'</div><div class="si-price">'+priceLabel+'</div>';
    d.onclick=()=>{
      if(active)return;
      if(!owned&&item.price>0&&S.coins<item.price){showToast('金币不足！');return;}
      openSkinPreview(item);
    };
    g.appendChild(d);
  });
}

// ── 皮肤预览弹窗 ──
function openSkinPreview(item){
  const ov=document.getElementById('skin-prev-ov');
  const ttl=document.getElementById('skin-prev-title');
  const desc=document.getElementById('skin-prev-desc');
  const price=document.getElementById('skin-prev-price');
  if(ttl)ttl.textContent='🎨 '+item.name+' 皮肤预览';
  if(desc)desc.textContent=item.price===0?'免费皮肤':'需要 🪙'+item.price+' 金币';
  if(price)price.textContent='';
  // 画预览：用该皮肤色绘制宠物
  const cvs=document.getElementById('skin-prev-canvas');
  if(cvs){
    const ctx=cvs.getContext('2d');ctx.clearRect(0,0,120,120);
    const stages=(window.EVO_STAGES&&EVO_STAGES[S.petBreed||'hamster'])||EVO_STAGES.hamster;
    const baseStage=stages[Math.min(S.petLevel-1,stages.length-1)];
    let previewStage=Object.assign({},baseStage);
    if(item.color==='rainbow'){const rc=['#ff9090','#ffcc60','#a0e880','#60c8ff','#d080ff'];previewStage.color=rc[Math.floor(Date.now()/1200)%rc.length];}
    else if(item.color){previewStage.color=item.color;}
    // 临时覆盖绘制
    const _br=S.petBreed,_lv=S.petLevel,_hp=S.petHappy,_en=S.petEnergy;
    S.petBreed=S.petBreed||'hamster';S.petHappy=75;S.petEnergy=75;
    try{drawPetBreed(ctx,S.petBreed,60,62,previewStage);}catch(e){console.warn('skin preview draw err',e);}
    S.petBreed=_br;S.petLevel=_lv;S.petHappy=_hp;S.petEnergy=_en;
  }
  // 设置按钮回调
  const confirmBtn=document.getElementById('skin-prev-confirm-btn');
  const cancelBtn=document.getElementById('skin-prev-cancel-btn');
  if(confirmBtn){
    const alreadyOwned=item.price===0||item.id==='sc_default'||(S.ownedSkins&&S.ownedSkins.includes(item.id));
    confirmBtn.textContent=alreadyOwned?'换上！':'购买并换上';
    confirmBtn.onclick=()=>{
      if(!alreadyOwned&&item.price>0&&S.coins<item.price){showToast('金币不足！');return;}
      if(!alreadyOwned&&item.price>0){
        S.coins-=item.price;
        if(!S.ownedSkins)S.ownedSkins=[];
        if(!S.ownedSkins.includes(item.id))S.ownedSkins.push(item.id);
        updateTop();
      }
      if(!S.petSkinColors)S.petSkinColors={};
      S.petSkinColors[S.activePet]=item.id;
      saveCurPet();persistAccount();
      ov.classList.remove('on');
      renderShop();updatePetUI();checkAchs();drawPet();
      const skinOnLines=['哇！这个颜色好好看！✨','嗯嗯主人眼光真好！🎨','我喜欢这个颜色！好漂亮！','哇我变漂亮了！主人你最棒！','这个颜色真的超适合我！'];
      const skinDefaultLines=['嗯……回到原来的颜色了','恢复原色！这样也很好看嘛！','其实我本来的颜色也挺好的！'];
      const lines=item.id==='sc_default'?skinDefaultLines:skinOnLines;
      const txt=lines[Math.floor(Math.random()*lines.length)];
      setTimeout(()=>{const el=document.getElementById('pet-talk');if(el){el.textContent=txt;el.classList.add('show');clearTimeout(talkTimer);talkTimer=setTimeout(()=>el.classList.remove('show'),4000);}},300);
      showToast('🎨已换为【'+item.name+'】皮肤！');
    };
  }
  if(cancelBtn){
    cancelBtn.onclick=()=>{
      ov.classList.remove('on');
      // 宠物失落的反应
      const cancelLines=['那就算了……下次再换吧','哦，那就先这样吧','好吧，其实我现在这样也很好看的！','嗯嗯，保持现在这样也可以！'];
      const txt=cancelLines[Math.floor(Math.random()*cancelLines.length)];
      setTimeout(()=>{const el=document.getElementById('pet-talk');if(el){el.textContent=txt;el.classList.add('show');clearTimeout(talkTimer);talkTimer=setTimeout(()=>el.classList.remove('show'),3000);}},100);
    };
  }
  ov.classList.add('on');
}

function openClothPreview(item){
  document.getElementById('cloth-ov-title').textContent='👗 '+item.name+' 穿戴预览';
  document.getElementById('cloth-preview-name').textContent=item.desc;
  document.getElementById('cloth-price-hint').textContent='价格：🪙'+item.price;
  // 绘制预览（健壮版：临时覆盖S字段+try-catch）
  const cvs=document.getElementById('cloth-preview-canvas');
  if(cvs){
    const ctx=cvs.getContext('2d');
    ctx.clearRect(0,0,cvs.width,cvs.height);
    const _br=S.petBreed,_lv=S.petLevel,_hp=S.petHappy,_en=S.petEnergy,_ec=S.equippedCloth;
    S.petHappy=75;S.petEnergy=75;
    try{
      const stage=applySkinStage(getEvoStage());
      drawPetBreed(ctx,S.petBreed||'hamster',60,62,stage);
    }catch(e){console.warn('cloth preview breed err',e);}
    try{
      drawCloth(ctx,60,62,item.id);
    }catch(e){console.warn('cloth preview cloth err',e);}
    S.petBreed=_br;S.petLevel=_lv;S.petHappy=_hp;S.petEnergy=_en;S.equippedCloth=_ec;
  }
  const btn=document.getElementById('cloth-buy-btn');
  if(btn){
    btn.textContent='购买并穿上';
    btn.onclick=()=>{
      if(S.coins<item.price){showToast('金币不足！需要🪙'+item.price);return;}
      S.coins-=item.price;
      S.ownedClothes.push(item.id);
      S.equippedCloth=item.id;
      saveCurPet();persistAccount();renderShop();updatePetUI();updateTop();
      document.getElementById('cloth-ov').classList.remove('on');
      drawPet();setTimeout(drawPet,50);setTimeout(drawPet,300);
      showPetTalk('cloth_on');
      showResult(item.ico,'购买成功！',item.name+'已购买并穿上！');
      checkAchs();
    };
  }
  document.getElementById('cloth-ov').classList.add('on');
}

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
  const _afterRender=()=>setTimeout(attachRankListeners,0);
  sec.innerHTML=`<div style="font-size:.72rem;color:var(--muted);margin-bottom:8px">🏫 <b style="color:var(--dgreen)">${S.classId}</b> · 我的排名：<b style="color:var(--gold)">#${myRank||'-'}</b><span style="font-size:.6rem;margin-left:6px">（按等级→积分排名）</span></div>
    <div style="display:flex;gap:6px;margin-bottom:8px">
      <input id="class-search" class="ci" style="flex:1;padding:6px 10px;font-size:.78rem" placeholder="搜索姓名..." oninput="searchClassMember(this.value)" style="user-select:text">
      <button onclick="randomPickMember()" style="padding:6px 12px;border-radius:9px;border:1.5px solid var(--border);background:var(--panel);font-size:.72rem;cursor:pointer;white-space:nowrap;font-family:'Noto Sans SC',sans-serif">🎲 随机抽人</button>
    </div>
    <div class="rank-list" id="rank-list">${renderRankList(members)}</div>
    <div style="margin-top:9px"><button onclick="leaveClass()" style="padding:7px 16px;border-radius:9px;border:1.5px solid var(--red);background:transparent;color:var(--red);font-size:.72rem;cursor:pointer;font-family:'Noto Sans SC',sans-serif">退出班级</button></div>`;
  _afterRender();
}

let _rankExp=false;
function renderRankList(members){
  const show=_rankExp||members.length<=5;
  const list=show?members.slice(0,15):members.slice(0,5);
  let html=list.map((m,i)=>{
    // 用data-rname属性存名字，避免特殊字符破坏onclick
    const isSelf=m.name===S.playerName;
    return '<div class="rank-item '+(isSelf?'rank-self':'')+' " id="rank-'+i+'" data-rname="'+encodeURIComponent(m.name)+'" style="cursor:'+(isSelf?'default':'pointer')+'">'
      +'<div class="rank-num '+(i===0?'top1':i===1?'top2':i===2?'top3':'')+'">'+(i+1)+'</div>'
      +'<div class="rank-name">'+m.name+(isSelf?' 👈':'')+'</div>'
      +'<div class="rank-score">Lv.'+(m.level||1)+' · ⭐'+m.score+'</div>'
      +'</div>';
  }).join('');
  if(members.length>5){html+='<div onclick="_rankExp=!_rankExp;updateClassSection()" style="text-align:center;padding:8px;font-size:.75rem;color:var(--muted);cursor:pointer;border-top:1px solid var(--border);margin-top:4px">'+(show?'▲ 收起':'▼ 展开全部('+members.length+'人)')+'</div>';}
  return html;
}
// 委托点击事件（在updateClassSection里挂载）
function attachRankListeners(){
  const rl=document.getElementById('rank-list');
  if(!rl||rl._hasListener)return;
  rl._hasListener=true;
  rl.addEventListener('click',e=>{
    const item=e.target.closest('[data-rname]');
    if(!item)return;
    const name=decodeURIComponent(item.dataset.rname);
    onRankItemClick(name);
  });
}

// 点击排行榜条目 → 弹出切换账号确认
function onRankItemClick(name){
  if(name===S.playerName)return;
  const accounts=getAllAccounts();
  // 优先匹配同班级，找不到则全局按名字搜索
  let acc=accounts.find(a=>a.name===name&&a.classId===S.classId);
  if(!acc)acc=accounts.find(a=>a.name===name);
  if(!acc){showToast('⚠️「'+name+'」未在本设备创建账号，请先创建');return;}
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
function switchTab(name){['farm','pet','shop','ach','profile'].forEach(n=>{document.getElementById('page-'+n)?.classList.toggle('active',n===name);const tb=document.getElementById('tb-'+n);if(tb)tb.classList.toggle('on',n===name);});const sbn=document.querySelector('.sb-nav');if(sbn){sbn.querySelectorAll('.sb-item').forEach((el,i)=>el.classList.toggle('on',['farm','pet','shop','ach','profile'][i]===name));}if(name==='ach'){S.newAch=[];persistAccount();['bd-ach','sbd-ach'].forEach(id=>{const el=document.getElementById(id);if(el){el.textContent='';el.classList.remove('on');}});}if(name==='shop')renderShop();if(name==='profile')updateProfile();if(name==='pet'){updatePetUI();if(!petAF)startPetAnim();drawPet();setTimeout(drawPet,50);setTimeout(drawPet,200);}}

// ─── EXPORT / IMPORT ──────────────────────────────
function exportSave(){const data={version:6,playerName:S.playerName,save:S,exportTime:new Date().toISOString()};const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`学习农场_${S.playerName||'存档'}_${new Date().toLocaleDateString('zh-CN')}.json`;a.click();URL.revokeObjectURL(url);showToast('✅ 存档已导出！');}
function importSave(input){const file=input.files[0];if(!file)return;const reader=new FileReader();reader.onload=e=>{try{const data=JSON.parse(e.target.result);if(!data.save){showToast('存档格式错误！');return;}openConfirm('📥',`导入存档：${data.playerName||'未知'}？\n这将覆盖当前账号的数据！`,()=>{S=Object.assign({},DEFAULT_SAVE,data.save);persistAccount();initGame();showToast('✅ 存档导入成功！');});}catch(err){showToast('存档解析失败！');}input.value='';};reader.readAsText(file);}

// ─── 暂停系统 ──────────────────────────────────
let isPaused=false;
let _pausedDecayTimer=null;
function togglePause(){
  isPaused=!isPaused;
  // 同步手机顶栏按钮
  const btn=document.getElementById('pause-btn');
  if(btn){btn.textContent=isPaused?'▶ 继续':'⏸ 暂停';btn.classList.toggle('paused',isPaused);}
  // 同步桌面侧边栏按钮
  const sbBtn=document.getElementById('sb-pause-btn');
  const sbIco=document.getElementById('sb-pause-ico');
  const sbLbl=document.getElementById('sb-pause-lbl');
  if(sbBtn)sbBtn.classList.toggle('paused',isPaused);
  if(sbIco)sbIco.textContent=isPaused?'▶':'⏸';
  if(sbLbl)sbLbl.textContent=isPaused?'继续游戏':'暂停游戏';
  if(isPaused){
    // 显示暂停弹窗
    document.getElementById('pause-ov').classList.add('on');
    S._pauseStart=Date.now();
    persistAccount();
  }else{
    // 关闭暂停弹窗
    document.getElementById('pause-ov').classList.remove('on');
    if(S._pauseStart){S.lastSaveTime+=(Date.now()-S._pauseStart);S._pauseStart=null;persistAccount();}
    showToast('▶ 已继续');
  }
}

// ─── NATURAL DECAY ────────────────────────────────
function naturalDecay(){
  if(isPaused)return;  // 暂停时跳过
  S.petFood=Math.max(0,S.petFood-3);S.petHappy=Math.max(0,S.petHappy-2);S.petClean=Math.max(0,S.petClean-1);S.petEnergy=Math.max(0,S.petEnergy-1);
  if(S.petFood<20)showPetTalk('low_food');else if(S.petHappy<20)showPetTalk('low_happy');else if(S.petEnergy<15)showPetTalk('low_energy');
  if(S.hasAutoWater){S.plots.forEach((p,i)=>{if(['s0','s1','s2'].includes(p.s)&&!p.hasCrack&&!p.hasBug){p.lastWater=Date.now();growPlot(i,0.5);}});}
  updatePetUI();persistAccount();
}

// ─── INIT ─────────────────────────────────────────
function initGame(){petX=75;petY=76;petWalking=false;
  // 暂停按钮已在HTML中静态存在，直接重置状态
  isPaused=false;
  const pb=document.getElementById('pause-btn');
  if(pb){pb.textContent='⏸ 暂停';pb.classList.remove('paused');}
  const sbp=document.getElementById('sb-pause-btn');if(sbp)sbp.classList.remove('paused');
  const sbpi=document.getElementById('sb-pause-ico');if(sbpi)sbpi.textContent='⏸';
  const sbpl=document.getElementById('sb-pause-lbl');if(sbpl)sbpl.textContent='暂停游戏';
  document.getElementById('pause-ov')?.classList.remove('on');
  renderFarm();updatePetUI();updateTop();renderAchs();checkAchs();renderSubjectBars();startPetAnim();updateProfile();switchTab('farm');
  // 更新行走开关UI
  const tog=document.getElementById('walk-toggle'),ico=document.getElementById('walk-ico'),lbl=document.getElementById('walk-lbl');
  if(tog)tog.classList.remove('on');if(ico)ico.textContent='🧍';if(lbl)lbl.textContent='立正模式';
}

(function init(){renderLoginScreen();setInterval(naturalDecay,60000);document.addEventListener('visibilitychange',()=>{if(!document.hidden&&CURRENT_ACC_ID){if(!petAF)startPetAnim();else setTimeout(drawPet,100);}});})();
