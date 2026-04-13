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
const _petImgCache={}; // 自定义宠物图片缓存

// ─── 弹窗层级管理 ──────────────────────────────────
let _modalZBase=200;
function openOverlay(id){
  const el=document.getElementById(id);
  if(!el)return;
  // 计算当前最高z-index
  let maxZ=200;
  document.querySelectorAll('.overlay.on').forEach(ov=>{
    const z=parseInt(ov.style.zIndex||ov.style.getPropertyValue('z-index'))||200;
    if(z>maxZ)maxZ=z;
  });
  el.style.zIndex=maxZ+10;
  el.classList.add('on');
}
function closeOverlay(id){
  const el=document.getElementById(id);
  if(el){el.classList.remove('on');el.style.zIndex='';}
}

// ─── 缩放 ────────────────────────────────────────
let currentZoom=1;
function zoomPage(d){currentZoom=Math.max(0.6,Math.min(1.5,currentZoom+d));document.body.style.zoom=currentZoom;document.querySelector('#zoom-ctrl .zoom-btn:nth-child(2)').textContent=Math.round(currentZoom*100)+'%';}
function zoomReset(){currentZoom=1;document.body.style.zoom=1;document.querySelector('#zoom-ctrl .zoom-btn:nth-child(2)').textContent='100%';}

// ─── 弹窗管理工具 ─────────────────────────────────────
function closeAllOverlays(){
  document.querySelectorAll('.overlay.on').forEach(ov=>ov.classList.remove('on'));
}

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
      s.plots.forEach(p=>{if(p.lastWater===undefined)p.lastWater=Date.now();if(p.hasBug===undefined)p.hasBug=false;if(p.hasCrack===undefined)p.hasCrack=false;if(p.unlockProgress===undefined)p.unlockProgress=0;if(p.soil===undefined)p.soil='yellow';});
      if(s.warehouse===undefined)s.warehouse={};
      if(s.petReachedLevels===undefined)s.petReachedLevels={};
      if(s.playerAvatar===undefined)s.playerAvatar='';
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
let SELECTED_ROLE=localStorage.getItem('jbfarm_role')||'student';

function selectRole(role){
  SELECTED_ROLE=role;
  localStorage.setItem('jbfarm_role',role);
  // 手机端
  document.getElementById('role-student').classList.toggle('on',role==='student');
  document.getElementById('role-teacher').classList.toggle('on',role==='teacher');
  document.getElementById('student-view').style.display=role==='student'?'':'none';
  document.getElementById('teacher-view').style.display=role==='teacher'?'':'none';
  // 桌面端（元素可能不存在，用安全取）
  const rsdt=document.getElementById('role-student-dt');const rtdt=document.getElementById('role-teacher-dt');
  if(rsdt)rsdt.classList.toggle('on',role==='student');
  if(rtdt)rtdt.classList.toggle('on',role==='teacher');
  const svdt=document.getElementById('student-view-dt');const tvdt=document.getElementById('teacher-view-dt');
  if(svdt)svdt.style.display=role==='student'?'':'none';
  if(tvdt)tvdt.style.display=role==='teacher'?'':'none';
  if(role==='teacher')renderTeacherClassView();
}

function renderLoginScreen(){
  // 恢复上次角色选择 — 手机端
  const roleStudent=document.getElementById('role-student');
  const roleTeacher=document.getElementById('role-teacher');
  const studentView=document.getElementById('student-view');
  const teacherView=document.getElementById('teacher-view');
  if(roleStudent)roleStudent.classList.toggle('on',SELECTED_ROLE==='student');
  if(roleTeacher)roleTeacher.classList.toggle('on',SELECTED_ROLE==='teacher');
  if(studentView)studentView.style.display=SELECTED_ROLE==='student'?'':'none';
  if(teacherView)teacherView.style.display=SELECTED_ROLE==='teacher'?'':'none';
  // 桌面端角色按钮同步
  const rsdt=document.getElementById('role-student-dt');const rtdt=document.getElementById('role-teacher-dt');
  if(rsdt)rsdt.classList.toggle('on',SELECTED_ROLE==='student');
  if(rtdt)rtdt.classList.toggle('on',SELECTED_ROLE==='teacher');
  const svdt=document.getElementById('student-view-dt');const tvdt=document.getElementById('teacher-view-dt');
  if(svdt)svdt.style.display=SELECTED_ROLE==='student'?'':'none';
  if(tvdt)tvdt.style.display=SELECTED_ROLE==='teacher'?'':'none';

  // 科目栏 - 手机端
  const bar=document.getElementById('ls-subject-bar');
  if(bar){bar.innerHTML='';SUBJECTS.forEach(sub=>{const b=document.createElement('div');b.className='ls-sub-btn'+(sub.id===ACTIVE_SUBJECT_ID?' on':'');if(sub.id===ACTIVE_SUBJECT_ID)b.style.background=sub.color||'#5a9a5a';b.textContent=sub.icon+' '+sub.name;b.onclick=()=>{setSubject(sub.id);renderLoginScreen();};bar.appendChild(b);});}
  // 科目栏 - 桌面端
  const barDt=document.getElementById('ls-subject-bar-dt');
  if(barDt){barDt.innerHTML='';SUBJECTS.forEach(sub=>{const b=document.createElement('div');b.className='ls-sub-btn'+(sub.id===ACTIVE_SUBJECT_ID?' on':'');if(sub.id===ACTIVE_SUBJECT_ID)b.style.background=sub.color||'#5a9a5a';b.textContent=sub.icon+' '+sub.name;b.onclick=()=>{setSubject(sub.id);renderLoginScreen();};barDt.appendChild(b);});}

  // 辅助：生成账号卡片HTML
  function _makeAccCards(containerEl,accounts){
    if(!containerEl)return;containerEl.innerHTML='';
    if(accounts.length===0){containerEl.innerHTML='<div style="font-size:.78rem;color:var(--muted);text-align:center;padding:18px 0">还没有账号，点击下方新建！</div>';return;}
    accounts.forEach(acc=>{
      const d=document.createElement('div');d.className='acc-card';
      const imgKey='jbfarm_profileimg_'+acc.id;
      const imgData=localStorage.getItem(imgKey);
      let avatarHtml='';
      if(imgData){avatarHtml=`<img src="${imgData}" style="width:42px;height:42px;border-radius:50%;object-fit:cover;display:block">`;}
      else{const ico=acc.playerAvatar||(acc.level>=5?'🌟':acc.level>=3?'⭐':'🌾');avatarHtml=ico;}
      d.innerHTML=`<div class="acc-avatar">${avatarHtml}</div><div class="acc-info"><div class="acc-name">${acc.name}</div><div class="acc-meta">Lv.${acc.level||1} · ⭐${acc.score||0}分${acc.classId?' · '+acc.classId:''}</div></div><div class="acc-arrow">${acc.pin?'🔒':'▶'}</div>`;
      d.onclick=()=>loginAcc(acc);containerEl.appendChild(d);
    });
  }

  // 学生视图 - 手机 + 桌面
  const listEl=document.getElementById('account-list');
  const listDt=document.getElementById('account-list-dt');
  let accounts=getAllAccounts().filter(a=>!a.isTeacher);
  if(accounts.length===0){for(const k of OLD_KEYS){const old=localStorage.getItem(k);if(old){try{const od=JSON.parse(old);const nid='acc_migrated_'+Date.now();const na={id:nid,name:od.playerName||'老玩家',pin:'',classId:od.classId||'',level:od.level||1,score:od.score||0,lastActive:Date.now()};accounts=[na];saveAllAccounts(accounts);localStorage.setItem(getAccKey(nid),JSON.stringify(Object.assign({},DEFAULT_SAVE,od)));showToast('✅ 旧存档已自动迁移！');break;}catch(e){}}};} 
  _makeAccCards(listEl,accounts);
  _makeAccCards(listDt,accounts);

  // 如果当前是教师视图，也刷新
  if(SELECTED_ROLE==='teacher')renderTeacherClassView();
}

function renderTeacherClassView(){
  const classListEl=document.getElementById('class-list');
  const classListDt=document.getElementById('class-list-dt');
  // 清理：删除班级名为乱码（非正常字符）或已空的孤立条目
  let cd=getClassData();
  const allAccounts=getAllAccounts();
  let dirty=false;
  Object.keys(cd).forEach(className=>{
    // 班级名包含百分号（URL编码残留）→ 删除
    if(/%[0-9A-Fa-f]{2}/.test(className)){delete cd[className];dirty=true;return;}
    // 过滤掉账号不存在的学生成员
    const before=cd[className].length;
    cd[className]=cd[className].filter(m=>{
      if(m.isTeacher)return true; // 教师条目保留
      return allAccounts.some(a=>a.name===m.name);
    });
    if(cd[className].length!==before)dirty=true;
    // 班级成员全空则删除整个班级
    if(cd[className].length===0){delete cd[className];dirty=true;}
  });
  if(dirty)saveClassData(cd);

  const classes=Object.keys(cd);
  const emptyHtml='<div style="font-size:.78rem;color:var(--muted);text-align:center;padding:18px 0">还没有班级，点击下方创建！</div>';
  if(classes.length===0){
    if(classListEl)classListEl.innerHTML=emptyHtml;
    if(classListDt)classListDt.innerHTML=emptyHtml;
    return;
  }
  if(classListEl)classListEl.innerHTML='';
  if(classListDt)classListDt.innerHTML='';
  const admins=getClassAdmins();
  classes.forEach(className=>{
    const members=cd[className]||[];
    const students=members.filter(m=>!m.isTeacher);
    const teachers=members.filter(m=>m.isTeacher);
    const asstAdmin=admins[className];
    let teacherChips=teachers.map(t=>`<span class="student-chip teacher" title="点击以教师身份登录" onclick="event.stopPropagation();loginByName('${encodeURIComponent(t.name)}','${encodeURIComponent(className)}')">👨‍🏫 ${t.name}</span>`).join('');
    let studentChips=students.slice(0,8).map(s=>{
      const isAsst=asstAdmin&&asstAdmin.name===s.name;
      return `<span class="student-chip${isAsst?' asst-admin':''}" onclick="event.stopPropagation();loginByName('${encodeURIComponent(s.name)}','${encodeURIComponent(className)}')">${isAsst?'🎖️ ':''}${s.name}</span>`;
    }).join('');
    const more=students.length>8?`<span class="student-chip">+${students.length-8}人</span>`:'';
    const cardInner=`<div class="class-header"><div class="class-ico">🏫</div><div class="class-info"><div class="class-name">${className}</div><div class="class-meta">👥 ${students.length}名学生${teachers.length>0?' · 👨‍🏫 '+teachers.length+'位教师':''}</div></div></div><div class="class-students">${teacherChips}${studentChips}${more}</div>`;
    // 手机端
    if(classListEl){const c=document.createElement('div');c.className='class-card';c.innerHTML=cardInner;c.onclick=()=>viewClassDetail(className);classListEl.appendChild(c);}
    // 桌面端
    if(classListDt){const c=document.createElement('div');c.className='class-card';c.innerHTML=cardInner;c.onclick=()=>viewClassDetail(className);classListDt.appendChild(c);}
  });
}

function loginByName(encodedName,encodedClass){
  const name=decodeURIComponent(encodedName);
  const className=decodeURIComponent(encodedClass);
  const accounts=getAllAccounts();
  let acc=accounts.find(a=>a.name===name&&a.classId===className)||accounts.find(a=>a.name===name);
  if(acc)loginAcc(acc);else showToast('未找到该账号');
}

function openCreateClass(){
  const el1=document.getElementById('cc-name');if(el1)el1.value='';
  // 填充已有教师账号下拉列表（排除课代表身份）
  const accounts=getAllAccounts();
  const admins=getClassAdmins();
  // 课代表名单（所有班级的课代表）
  const asstAdminNames=new Set(Object.values(admins).map(a=>a&&a.name).filter(Boolean));
  // 只显示 isTeacher=true 且不是课代表的账号
  const existingTeachers=accounts.filter(a=>a.isTeacher&&!asstAdminNames.has(a.name));
  const pickerWrap=document.getElementById('cc-teacher-picker-wrap');
  const inputWrap=document.getElementById('cc-teacher-input-wrap');
  const picker=document.getElementById('cc-teacher-select');
  const el2=document.getElementById('cc-teacher');if(el2)el2.value='';
  if(picker){
    picker.innerHTML='<option value="">— 新建教师账号 —</option>';
    existingTeachers.forEach(t=>{
      const managed=(loadAccSave(t.id).managedClasses||[]).join('、')||'暂无班级';
      picker.innerHTML+=`<option value="${t.name}">${t.name}（管理：${managed}）</option>`;
    });
  }
  if(pickerWrap&&inputWrap){
    if(existingTeachers.length>0){
      pickerWrap.style.display='';
      inputWrap.style.display='none';
    } else {
      pickerWrap.style.display='none';
      inputWrap.style.display='';
    }
  }
  document.getElementById('create-class-ov').classList.add('on');
}
function toggleNewTeacherInput(){
  const pickerWrap=document.getElementById('cc-teacher-picker-wrap');
  const inputWrap=document.getElementById('cc-teacher-input-wrap');
  const picker=document.getElementById('cc-teacher-select');
  if(!inputWrap||!pickerWrap)return;
  const showInput=inputWrap.style.display==='none';
  inputWrap.style.display=showInput?'':'none';
  if(showInput&&picker)picker.value=''; // 切换到新建时清空已选
}

function createClass(){
  const className=((document.getElementById('cc-name')||{}).value||'').trim();
  // 优先读取下拉选中的已有教师，其次读取手动输入
  const picker=document.getElementById('cc-teacher-select');
  const pickedTeacher=((picker||{}).value||'').trim();
  const typedTeacher=((document.getElementById('cc-teacher')||{}).value||'').trim();
  const teacherName=pickedTeacher||typedTeacher;
  if(!className){showToast('请输入班级名称！');return;}
  if(!teacherName){showToast('请输入教师姓名！');return;}
  const cd=getClassData();
  if(cd[className]){showToast('该班级已存在！');return;}
  const accounts=getAllAccounts();
  // 同名教师账号复用
  let tAcc=accounts.find(a=>a.name===teacherName&&a.isTeacher);
  if(!tAcc){
    const tid='acc_'+Date.now()+'_'+Math.random().toString(36).slice(2,6);
    tAcc={id:tid,name:teacherName,pin:'',classId:className,level:1,score:0,lastActive:Date.now(),isTeacher:true};
    accounts.push(tAcc);
    saveAllAccounts(accounts);
    const fresh=JSON.parse(JSON.stringify(DEFAULT_SAVE));
    fresh.playerName=teacherName;fresh.classId=className;fresh.isTeacher=true;
    fresh.managedClasses=[className];fresh.teacherParticipateRank=false;
    localStorage.setItem(getAccKey(tAcc.id),JSON.stringify(fresh));
  } else {
    const save=loadAccSave(tAcc.id);
    if(!save.managedClasses)save.managedClasses=[];
    if(!save.managedClasses.includes(className))save.managedClasses.push(className);
    localStorage.setItem(getAccKey(tAcc.id),JSON.stringify(save));
  }
  cd[className]=[{name:teacherName,score:0,level:1,isTeacher:true}];
  saveClassData(cd);
  document.getElementById('create-class-ov').classList.remove('on');
  showToast('✅ 班级「'+className+'」和教师账号「'+teacherName+'」创建成功！');
  renderTeacherClassView();
}

function viewClassDetail(className){
  const cd=getClassData();
  const allMembers=cd[className]||[];
  const students=sortMembers(allMembers.filter(m=>!m.isTeacher));
  const teachers=allMembers.filter(m=>m.isTeacher);
  const admins=getClassAdmins();const asstAdmin=admins[className];
  let html='<div style="max-height:55vh;overflow-y:auto">';
  if(teachers.length>0){
    html+='<div style="margin-bottom:10px"><div style="font-size:.68rem;color:var(--muted);margin-bottom:5px">👨‍🏫 班级教师</div>';
    teachers.forEach(t=>{html+=`<div style="padding:5px 10px;background:rgba(232,160,32,.08);border-radius:8px;margin-bottom:3px;font-size:.74rem;font-weight:600;cursor:pointer" onclick="loginByName('${encodeURIComponent(t.name)}','${encodeURIComponent(className)}')">👨‍🏫 ${t.name} <span style="font-size:.6rem;color:#a06000;float:right">点击登录 ▶</span></div>`;});
    html+='</div>';
  }
  if(asstAdmin){html+=`<div style="font-size:.68rem;color:#2060a0;margin-bottom:8px">🎖️ 课代表（辅助管理员）：<b>${asstAdmin.name}</b></div>`;}
  html+='<div style="font-size:.68rem;color:var(--muted);margin-bottom:5px">📋 学生名单 ('+students.length+'人)</div>';
  students.forEach((s,i)=>{
    const isMonitor=asstAdmin&&asstAdmin.name===s.name;
    const monitorBadge=isMonitor?'<span style="font-size:.58rem;background:rgba(74,144,217,.13);color:#2060a0;border-radius:4px;padding:0 4px;margin-left:4px;font-weight:700">★课代表</span>':'';
    html+=`<div class="rank-item" style="cursor:pointer" onclick="loginByName('${encodeURIComponent(s.name)}','${encodeURIComponent(className)}')">`
      +`<div class="rank-num ${i===0?'top1':i===1?'top2':i===2?'top3':''}">${i+1}</div>`
      +`<div class="rank-name">${s.name}${monitorBadge}</div>`
      +`<div class="rank-score">Lv.${s.level||1} ⭐ ${s.score||0}</div></div>`;
  });
// 教师可批量导入/管理
const isMgr=S.isTeacher&&(S.managedClasses||[]).includes(className);
if(isMgr){
  const safeClassName = encodeURIComponent(className).replace(/'/g, "\'");
  html+=`
  <div style="margin-top:10px;border-top:1px solid var(--border);padding-top:10px">
    <button onclick="openBatchImport('${safeClassName}')" style="width:100%;padding:9px;border-radius:10px;border:1.5px solid var(--green);background:rgba(100,160,100,.06);color:var(--dgreen);font-size:.78rem;cursor:pointer;font-family:'Noto Sans SC',sans-serif;margin-bottom:8px">📋 批量导入学生名单</button>
    <div style="display:flex;gap:6px;flex-wrap:wrap">
      <button onclick="exportClassList('${safeClassName}')" style="flex:1;min-width:80px;padding:7px 6px;border-radius:8px;border:1.5px solid var(--border);background:#fff;color:var(--ink);font-size:.68rem;cursor:pointer;font-family:'Noto Sans SC',sans-serif">📤 导出名单</button>
      <button onclick="batchResetStudentPin('${safeClassName}')" style="flex:1;min-width:80px;padding:7px 6px;border-radius:8px;border:1.5px solid var(--border);background:#fff;color:var(--ink);font-size:.68rem;cursor:pointer;font-family:'Noto Sans SC',sans-serif">🔓 重置密码</button>
      <button onclick="teacherDeleteClassFromDetail('${safeClassName}')" style="flex:1;min-width:80px;padding:7px 6px;border-radius:8px;border:1.5px solid var(--red);background:rgba(224,85,85,.05);color:var(--red);font-size:.68rem;cursor:pointer;font-family:'Noto Sans SC',sans-serif">💥 注销班级</button>
    </div>
  </div>`;
}
html+='</div>';
openConfirm('🏫',className,()=>{},false,html);
}

function teacherDeleteClassFromDetail(encodedClass){
  document.querySelectorAll('.overlay').forEach(ov=>ov.classList.remove('on'));
  teacherDeleteClass(encodedClass);
}
function openBatchImport(encodedClass){
  document.querySelectorAll('.overlay').forEach(ov=>ov.classList.remove('on'));
  const className=decodeURIComponent(encodedClass);
  const ov=document.getElementById('batch-import-ov');if(!ov)return;
  const nm=document.getElementById('bi-class-name');if(nm)nm.textContent=className;
  const ky=document.getElementById('bi-class-key');if(ky)ky.value=className;
  const ta=document.getElementById('batch-import-names');if(ta)ta.value='';
  ov.classList.add('on');
}

function doBatchImport(){
  const className=(document.getElementById('bi-class-key')||{}).value||'';
  const raw=(document.getElementById('batch-import-names')||{}).value||'';
  if(!className||!raw.trim()){showToast('请填写完整信息！');return;}
  const lines=raw.split('\n').map(l=>l.trim()).filter(Boolean);
  const accounts=getAllAccounts();const cd=getClassData();
  if(!cd[className])cd[className]=[];
  let created=0,skipped=0;
  lines.forEach(line=>{
    const parts=line.split(/[,，]/);const name=parts[0].trim();const pin=(parts[1]||'').trim();
    if(!name)return;
    if(accounts.some(a=>a.name===name&&a.classId===className)){skipped++;return;}
    if(pin&&!/^\d{4}$/.test(pin)){skipped++;return;}
    const id='acc_'+Date.now()+'_'+Math.random().toString(36).slice(2,6)+created;
    accounts.push({id,name,pin:pin||'',classId:className,level:1,score:0,lastActive:Date.now(),isTeacher:false});
    const fresh=JSON.parse(JSON.stringify(DEFAULT_SAVE));fresh.playerName=name;fresh.classId=className;
    localStorage.setItem(getAccKey(id),JSON.stringify(fresh));
    if(!cd[className].some(m=>m.name===name))cd[className].push({name,score:0,level:1,isTeacher:false});
    created++;
  });
  saveAllAccounts(accounts);saveClassData(cd);
  document.getElementById('batch-import-ov').classList.remove('on');
  renderTeacherClassView();renderLoginScreen();
  showToast('✅ 导入'+created+'名学生'+(skipped?'，'+skipped+'个已跳过':''));
}

/* ======原始renderLoginScreen已被下面替代，保留占位避免引用报错====== */
function _orig_renderLoginScreen_unused(){
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
function openPinPad(name,cb){pinInput='';pinCb=cb;// 关闭其他弹窗避免叠加
document.querySelectorAll('.overlay.on').forEach(ov=>{if(ov.id!=='pin-ov')ov.classList.remove('on');});const ne=document.getElementById('pin-acc-name');if(ne)ne.textContent=name;buildPinDots('pin-dots');buildNumpad('numpad',false);document.getElementById('pin-ov').classList.add('on');}
function buildPinDots(id){
  const d=document.getElementById(id);if(!d)return;d.innerHTML='';
  const val=id==='setpin-dots'?setpinInput:pinInput;
  for(let i=0;i<4;i++){const dot=document.createElement('div');dot.className='pin-dot'+(i<val.length?' filled':'');d.appendChild(dot);}
}
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
  el.innerHTML=`
  <div style="display:flex;flex-direction:column;gap:8px">
    <!-- 第1行：修改昵称 + 修改头像 -->
    <div style="display:flex;gap:7px">
      <button onclick="openNameModal('player')" style="flex:1;padding:9px 10px;border-radius:10px;border:1.5px solid var(--green);background:rgba(100,160,100,.08);color:var(--dgreen);font-size:.75rem;cursor:pointer;font-family:'Noto Sans SC',sans-serif;display:flex;align-items:center;justify-content:center;gap:5px">✏️ 修改昵称</button>
      <button onclick="openAvatarPickerModal()" style="flex:1;padding:9px 10px;border-radius:10px;border:1.5px solid #4a90d9;background:rgba(74,144,217,.08);color:#2060a0;font-size:.75rem;cursor:pointer;font-family:'Noto Sans SC',sans-serif;display:flex;align-items:center;justify-content:center;gap:5px">🖼️ 修改头像</button>
    </div>
    <!-- 第2行：注销账号 + 切换账号 -->
    <div style="display:flex;gap:7px">
      <button onclick="deleteCurrentAccount()" style="flex:1;padding:9px 10px;border-radius:10px;border:1.5px solid var(--red);background:rgba(224,85,85,.06);color:var(--red);font-size:.75rem;cursor:pointer;font-family:'Noto Sans SC',sans-serif;display:flex;align-items:center;justify-content:center;gap:5px">🗑️ 注销账号</button>
      <button onclick="goToLogin()" style="flex:1;padding:9px 10px;border-radius:10px;border:1.5px solid var(--border);background:transparent;color:var(--ink);font-size:.75rem;cursor:pointer;font-family:'Noto Sans SC',sans-serif;display:flex;align-items:center;justify-content:center;gap:5px">🔄 切换账号</button>
    </div>
    <!-- 第3行：密码管理 -->
    <div style="display:flex;gap:7px">
      ${!hasPin
        ? `<button onclick="openSetPin()" style="flex:1;padding:9px 10px;border-radius:10px;border:1.5px solid var(--border);background:transparent;color:var(--muted);font-size:.75rem;cursor:pointer;font-family:'Noto Sans SC',sans-serif;display:flex;align-items:center;justify-content:center;gap:5px">🔐 设置密码</button>`
        : `<button onclick="openSetPin()" style="flex:1;padding:9px 10px;border-radius:10px;border:1.5px solid var(--border);background:transparent;font-size:.75rem;cursor:pointer;font-family:'Noto Sans SC',sans-serif;display:flex;align-items:center;justify-content:center;gap:5px">🔑 修改密码</button>
           <button onclick="removePin()" style="flex:1;padding:9px 10px;border-radius:10px;border:1.5px solid var(--red);background:transparent;color:var(--red);font-size:.75rem;cursor:pointer;font-family:'Noto Sans SC',sans-serif;display:flex;align-items:center;justify-content:center;gap:5px">🔓 移除密码</button>`
      }
    </div>
  </div>`;
}

// 头像选择弹窗：合并上传图片和emoji两种方式
function openAvatarPickerModal(){
  openOverlay('avatar-pick-mode-ov');
}

// 注销当前账号
function deleteCurrentAccount(){
  if(!CURRENT_ACC_ID)return;
  const list=getAllAccounts();
  const acc=list.find(a=>a.id===CURRENT_ACC_ID);
  if(!acc)return;
  const doDelete=()=>{
    openConfirm('⚠️',`确定注销账号「${acc.name}」？\n\n所有游戏数据将彻底清除，无法恢复！`,()=>{
      // 从班级排名中移除
      if(acc.classId){
        const cd=getClassData();
        if(cd[acc.classId]){
          cd[acc.classId]=cd[acc.classId].filter(m=>m.name!==acc.name);
          saveClassData(cd);
        }
      }
      // 删除存档
      localStorage.removeItem(getAccKey(CURRENT_ACC_ID));
      // 从账号列表删除
      const newList=list.filter(a=>a.id!==CURRENT_ACC_ID);
      saveAllAccounts(newList);
      CURRENT_ACC_ID=null;
      if(petAF){cancelAnimationFrame(petAF);petAF=null;}
      document.getElementById('app').classList.remove('active');
      document.getElementById('login-screen').style.display='flex';
      renderLoginScreen();
      showToast('账号已注销');
    },true);
  };
  if(acc.pin){
    openPinPad(acc.name,entered=>{
      if(entered===acc.pin){document.getElementById('pin-ov').classList.remove('on');doDelete();return true;}
      showToast('密码错误！');return false;
    });
  } else {
    doDelete();
  }
}

// 上传头像图片
function openProfileAvatarUpload(){
  const inp=document.createElement('input');
  inp.type='file';inp.accept='image/*';
  inp.onchange=function(e){
    const file=e.target.files[0];if(!file)return;
    if(file.size>512*1024){showToast('头像不能超过500KB');return;}
    const reader=new FileReader();
    reader.onload=function(ev){
      const data=ev.target.result;
      const key='jbfarm_profileimg_'+(CURRENT_ACC_ID||'');
      localStorage.setItem(key,data);
      S.playerAvatar='__img__';
      persistAccount();
      // 更新所有头像显示位置
      _applyProfileImgToUI(data);
      showToast('✅ 头像已更新！');
    };
    reader.readAsDataURL(file);
  };
  inp.click();
}

function _applyProfileImgToUI(src){
  // 把头像显示为图片元素（不再用emoji文字）
  const makeImgEl=(size)=>{
    const img=document.createElement('img');
    img.src=src;img.style.cssText=`width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;display:block`;
    return img;
  };
  const targets=[
    {id:'prof-av',size:72},
    {id:'avatar',size:30},
    {id:'sb-av',size:30}
  ];
  targets.forEach(({id,size})=>{
    const el=document.getElementById(id);
    if(!el)return;
    el.innerHTML='';
    el.appendChild(makeImgEl(size));
  });
}

function _loadProfileImgIfAny(){
  if(!CURRENT_ACC_ID)return;
  const key='jbfarm_profileimg_'+CURRENT_ACC_ID;
  const data=localStorage.getItem(key);
  if(data)_applyProfileImgToUI(data);
}

// ══════════════════════════════════════════════════════════════
// ★ 教师独立管理班级面板（无需加入班级）
// ══════════════════════════════════════════════════════════════
function openTeacherClassManage(encodedClass){
  const className=decodeURIComponent(encodedClass);
  if(!S.isTeacher||(S.managedClasses||[]).indexOf(className)===-1){showToast('无权管理该班级');return;}
  const ttl=document.getElementById('tcm-title');
  if(ttl)ttl.textContent='🏫 '+className+' · 管理';
  _renderTCMBody(className);
  document.getElementById('teacher-class-manage-ov').classList.add('on');
}

function _renderTCMBody(className){
  const body=document.getElementById('tcm-body');if(!body)return;
  const cd=getClassData();
  const admins=getClassAdmins();
  const asstAdmin=admins[className];
  const clsData=cd[className]||[];
  const students=sortMembers(clsData.filter(function(m){return !m.isTeacher;}));
  const safe=encodeURIComponent(className);
  let html='';

// 课代表信息
html += '<div style="background:rgba(74,144,217,.07);border-radius:10px;padding:9px 12px;margin-bottom:10px;font-size:.74rem">';
if (asstAdmin) {
    html += '<span style="color:#2060a0;font-weight:600">🎖️ 课代表：' + asstAdmin.name + '</span>'
        + '<button onclick="_tcmChangeMonitor(\'' + safe + '\')" style="float:right;padding:2px 8px;border-radius:6px;border:1px solid #4a90d9;background:transparent;color:#2060a0;font-size:.62rem;cursor:pointer;font-family:\'Noto Sans SC\',sans-serif">更换</button>';
} else {
    html += '<span style="color:var(--muted)">暂无课代表</span>'
        + '<button onclick="_tcmChangeMonitor(\'' + safe + '\')" style="float:right;padding:2px 8px;border-radius:6px;border:none;background:#4a90d9;color:#fff;font-size:.62rem;cursor:pointer;font-family:\'Noto Sans SC\',sans-serif">任命</button>';
}
html += '</div>';

// 快捷操作按钮
html += '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">'
    + '<button onclick="openAddScorePanel(\'' + className + '\')" style="flex:1;min-width:100px;padding:8px;border-radius:9px;border:none;background:var(--green);color:#fff;font-size:.74rem;cursor:pointer;font-family:\'Noto Sans SC\',sans-serif">⭐ 积分管理</button>'
    + '<button onclick="_tcmBatchAdd(\'' + safe + '\')" style="flex:1;min-width:100px;padding:8px;border-radius:9px;border:1.5px solid var(--green);background:rgba(100,160,100,.07);color:var(--dgreen);font-size:.74rem;cursor:pointer;font-family:\'Noto Sans SC\',sans-serif">📋 批量导入</button>'
    + '<button onclick="_tcmImportUnbound(\'' + safe + '\')" style="flex:1;min-width:100px;padding:8px;border-radius:9px;border:1.5px solid #4a90d9;background:rgba(74,144,217,.07);color:#2060a0;font-size:.74rem;cursor:pointer;font-family:\'Noto Sans SC\',sans-serif">🔗 导入无班学生</button>'
    + '</div>';

// 学生名单
html+='<div style="font-size:.68rem;color:var(--muted);margin-bottom:5px">📋 学生名单（'+students.length+'人）</div>';
html+='<div style="max-height:35vh;overflow-y:auto;margin-bottom:10px">';
if(!students.length){
  html+='<div style="text-align:center;padding:12px;color:var(--muted);font-size:.74rem">暂无学生</div>';
} else {
  students.forEach(function(s,i){
    const isMonitor=asstAdmin&&asstAdmin.name===s.name;
    html+='<div style="display:flex;align-items:center;padding:7px 10px;border-bottom:1px solid var(--border);font-size:.74rem">'
      +'<div style="width:22px;color:var(--muted);font-size:.65rem">'+(i+1)+'</div>'
      +'<div style="flex:1;font-weight:'+(isMonitor?'700':'400')+'">'+s.name+(isMonitor?' <span style="font-size:.58rem;color:#2060a0">★课代表</span>':'')+'</div>'
      +'<div style="color:var(--muted);font-size:.68rem;margin-right:6px">⭐'+(s.score||0)+'</div>'
      +'<button onclick="_tcmRemoveStudent(\''+encodeURIComponent(s.name)+'\',\''+safe+'\')" style="padding:2px 6px;border-radius:5px;border:1px solid var(--red);background:transparent;color:var(--red);font-size:.58rem;cursor:pointer;font-family:\'Noto Sans SC\',sans-serif">移除</button>'
      +'</div>';
  });
}
html+='</div>';

// 危险区
html+='<div style="border-top:1px solid var(--border);padding-top:10px">'
  +'<button onclick="teacherDeleteClassFromDetail(\''+safe+'\')" style="width:100%;padding:8px;border-radius:9px;border:1.5px solid var(--red);background:transparent;color:var(--red);font-size:.74rem;cursor:pointer;font-family:\'Noto Sans SC\',sans-serif">💥 注销该班级</button>'
  +'</div>';

body.innerHTML=html;
}

function _tcmChangeMonitor(encodedClass){
  const className=decodeURIComponent(encodedClass);
  const cd=getClassData();
  const members=(cd[className]||[]).filter(function(m){return !m.isTeacher;});
  let html='<div style="font-size:.7rem;color:var(--muted);margin-bottom:8px">选择课代表：</div><div style="max-height:45vh;overflow-y:auto">';
  members.forEach(function(s){
    html+='<div style="padding:9px 12px;border-radius:8px;border:1px solid var(--border);margin-bottom:4px;cursor:pointer;background:var(--panel);font-size:.76rem" onclick="_tcmSetMonitor(\''+encodeURIComponent(s.name)+'\',\''+encodedClass+'\')">'+s.name+' · ⭐'+(s.score||0)+'</div>';
  });
  html+='</div>';
  document.getElementById('tcm-body').innerHTML=html;
}

function _tcmSetMonitor(encodedName,encodedClass){
  const name=decodeURIComponent(encodedName);
  const className=decodeURIComponent(encodedClass);
  openConfirm('🎖️','将「'+name+'」设为【'+className+'】的课代表？',function(){
    const admins=getClassAdmins();
    admins[className]={name:name,pin:''};
    saveClassAdmins(admins);
    _renderTCMBody(className);
    showToast('✅ 已设置课代表：'+name);
  });
}

function _tcmBatchAdd(encodedClass){
  document.getElementById('teacher-class-manage-ov').classList.remove('on');
  setTimeout(function(){openBatchImport(encodedClass);},100);
}

function _tcmImportUnbound(encodedClass){
  const className=decodeURIComponent(encodedClass);
  const accounts=getAllAccounts();
  // 没有班级归属的学生账号
  const unbound=accounts.filter(function(a){return !a.isTeacher&&(!a.classId||a.classId==='');});
  if(!unbound.length){
    openConfirm('✅','当前所有学生账号都已归属班级，\n没有待分配的无班学生。',null);
    return;
  }
  let html='<div style="font-size:.7rem;color:var(--muted);margin-bottom:8px">选择要加入【'+className+'】的学生（可多选）：</div>';
  html+='<div id="unbound-list" style="max-height:45vh;overflow-y:auto">';
  unbound.forEach(function(a){
    html+='<div data-accid="'+a.id+'" data-name="'+encodeURIComponent(a.name)+'" onclick="toggleUnboundSel(this)" style="padding:9px 12px;border-radius:8px;border:2px solid var(--border);margin-bottom:4px;cursor:pointer;background:var(--panel);font-size:.76rem;display:flex;align-items:center;gap:8px">'
      +'<div class="ub-chk" style="width:16px;height:16px;border-radius:4px;border:2px solid var(--border);background:transparent;flex-shrink:0"></div>'
      +'<span>'+a.name+'</span></div>';
  });
  // 修复了两处引号转义错误
  html+='</div>'
    +'<div style="display:flex;gap:8px;margin-top:10px">'
    +'<button onclick="toggleAllUnbound()" id="toggle-all-unbound" style="flex:1;padding:9px;border-radius:10px;border:1.5px solid var(--border);background:var(--panel);font-size:.74rem;cursor:pointer;font-family:\'Noto Sans SC\',sans-serif">全选</button>'
    +'<button onclick="_tcmDoImportUnbound(\''+encodeURIComponent(className)+'\')" style="flex:2;padding:9px;border-radius:10px;border:none;background:var(--green);color:#fff;font-size:.78rem;cursor:pointer;font-family:\'Noto Sans SC\',sans-serif">✅ 加入班级</button>'
    +'</div>';
  document.getElementById('tcm-body').innerHTML=html;
}
function toggleUnboundSel(el){
  const chk=el.querySelector('.ub-chk');
  const sel=el.dataset.sel==='1';
  if(sel){el.dataset.sel='0';el.style.borderColor='var(--border)';el.style.background='var(--panel)';if(chk){chk.style.background='transparent';chk.style.borderColor='var(--border)';chk.textContent='';}}
  else{el.dataset.sel='1';el.style.borderColor='var(--green)';el.style.background='rgba(100,160,100,.1)';if(chk){chk.style.background='var(--green)';chk.style.borderColor='var(--green)';chk.textContent='✓';chk.style.color='#fff';chk.style.fontSize='.6rem';chk.style.textAlign='center';chk.style.lineHeight='12px';}}
}

function toggleAllUnbound(){
  const items=document.querySelectorAll('#unbound-list [data-accid]');
  const allSel=[...items].every(el=>el.dataset.sel==='1');
  items.forEach(el=>{
    const chk=el.querySelector('.ub-chk');
    if(allSel){
      el.dataset.sel='0';el.style.borderColor='var(--border)';el.style.background='var(--panel)';
      if(chk){chk.style.background='transparent';chk.style.borderColor='var(--border)';chk.textContent='';}
    } else {
      el.dataset.sel='1';el.style.borderColor='var(--green)';el.style.background='rgba(100,160,100,.1)';
      if(chk){chk.style.background='var(--green)';chk.style.borderColor='var(--green)';chk.textContent='✓';chk.style.color='#fff';chk.style.fontSize='.6rem';chk.style.textAlign='center';chk.style.lineHeight='12px';}
    }
  });
  const btn=document.getElementById('toggle-all-unbound');
  if(btn)btn.textContent=allSel?'全选':'取消全选';
}

function _tcmDoImportUnbound(encodedClass){
  const className=decodeURIComponent(encodedClass);
  const selected=document.querySelectorAll('#unbound-list [data-sel="1"]');
  if(!selected.length){showToast('请先选择学生！');return;}
  const accounts=getAllAccounts();
  const cd=getClassData();
  if(!cd[className])cd[className]=[];
  let count=0;
  selected.forEach(function(el){
    const accId=el.dataset.accid;
    const name=decodeURIComponent(el.dataset.name);
    const acc=accounts.find(function(a){return a.id===accId;});
    if(acc){
      acc.classId=className;
      const save=loadAccSave(acc.id);
      save.classId=className;
      localStorage.setItem(getAccKey(acc.id),JSON.stringify(save));
      if(!cd[className].some(function(m){return m.name===name;})){
        cd[className].push({name:name,score:acc.score||0,level:acc.level||1,isTeacher:false});
      }
      count++;
    }
  });
  saveAllAccounts(accounts);saveClassData(cd);
  _renderTCMBody(className);
  showToast('✅ 已将 '+count+' 位学生加入班级【'+className+'】');
}

function _tcmRemoveStudent(encodedName, encodedClass) {
  const name = decodeURIComponent(encodedName);
  const className = decodeURIComponent(encodedClass);
  
  openConfirm('⚠️', `将「${name}」从【${className}】移除？
学生账号本身不会删除，仅移除班级归属。`, function() {
    const cd = getClassData();
    // 1. 从班级排名中移除
    if (cd[className]) {
      cd[className] = cd[className].filter(m => m.name !== name);
      saveClassData(cd);
    }
    
    // 2. 清空学生账号的班级归属
    const accounts = getAllAccounts();
    const acc = accounts.find(a => a.name === name && a.classId === className);
    if (acc) {
      acc.classId = '';
      const sv = localStorage.getItem(getAccKey(acc.id));
      if (sv) {
        try {
          const s = JSON.parse(sv);
          s.classId = '';
          localStorage.setItem(getAccKey(acc.id), JSON.stringify(s));
        } catch (e) {
          console.warn('更新学生存档失败:', e);
        }
      }
      saveAllAccounts(accounts);
    }
    
    // 重新渲染班级管理视图（传解码后的班级名）
    _renderTCMBody(className);
    // 同步刷新教师登录页班级卡片
    renderTeacherClassView();
    showToast(`✅ 已移除「${name}」`);
  });
}


// 教师注销班级（含密码验证）
function teacherDeleteClass(encodedClass){
  const className=decodeURIComponent(encodedClass);
  if(!S.isTeacher||(S.managedClasses||[]).indexOf(className)===-1){showToast('无权操作');return;}
  const list=getAllAccounts();
  const acc=list.find(a=>a.id===CURRENT_ACC_ID);

  const doDeleteClass=(alsoDeleteAccounts)=>{
    // 先弹确认
    const extraMsg=alsoDeleteAccounts?'\n⚠️ 同时注销所有学生账号（不可恢复！）':'';
    openConfirm('💥',`确定注销班级「${className}」？${extraMsg}\n班级数据将彻底清除。`,()=>{
      const cd=getClassData();
      const members=cd[className]||[];
      const accounts=getAllAccounts();
      const studentMembers=members.filter(m=>!m.isTeacher);
      studentMembers.forEach(m=>{
        const a=accounts.find(x=>x.name===m.name&&x.classId===className);
        if(a){
          if(alsoDeleteAccounts){
            // 彻底删除账号及存档
            localStorage.removeItem(getAccKey(a.id));
          } else {
            a.classId='';
            const sv=localStorage.getItem(getAccKey(a.id));
            if(sv){try{const s=JSON.parse(sv);s.classId='';localStorage.setItem(getAccKey(a.id),JSON.stringify(s));}catch(e){}}
          }
        }
      });
      const newAccList=alsoDeleteAccounts
        ?accounts.filter(a=>!(studentMembers.some(m=>m.name===a.name&&a.classId===className)))
        :accounts;
      saveAllAccounts(newAccList);
      delete cd[className];
      saveClassData(cd);
      const admins=getClassAdmins();delete admins[className];saveClassAdmins(admins);
      if(S.managedClasses){S.managedClasses=S.managedClasses.filter(c=>c!==className);persistAccount();}
      renderAccountSettings();
      renderTeacherClassView();
      showToast('✅ 班级「'+className+'」已注销'+(alsoDeleteAccounts?'，学生账号已同步删除':''));
    },true);
  };

  // 先弹选择弹窗（是否同时删账号）
  const _runAfterPin=()=>{
    // 自制选择弹窗
    const ovHTML=`<div style="position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:300;display:flex;align-items:center;justify-content:center;padding:16px" id="_del-class-choice-ov">
      <div style="background:var(--panel);border-radius:18px;padding:20px 18px;max-width:360px;width:100%;box-shadow:0 12px 40px rgba(0,0,0,.18)">
        <div style="font-size:1.2rem;text-align:center;margin-bottom:6px">💥</div>
        <div style="font-family:'Ma Shan Zheng',cursive;font-size:1rem;color:var(--dgreen);text-align:center;margin-bottom:10px">注销「${className}」</div>
        <div style="font-size:.76rem;color:var(--muted);line-height:1.8;margin-bottom:14px;text-align:center">请选择注销方式：</div>
        <div style="display:flex;flex-direction:column;gap:8px">
          <button onclick="document.getElementById('_del-class-choice-ov').remove();window._doDeleteClassChoice('${encodeURIComponent(className)}',false)" style="padding:11px;border-radius:11px;border:1.5px solid var(--red);background:rgba(224,85,85,.06);color:var(--red);font-size:.8rem;cursor:pointer;font-family:'Noto Sans SC',sans-serif">
            🏫 仅注销班级<br><span style="font-size:.65rem;font-weight:400">学生账号保留，仅清除班级数据</span>
          </button>
          <button onclick="document.getElementById('_del-class-choice-ov').remove();window._doDeleteClassChoice('${encodeURIComponent(className)}',true)" style="padding:11px;border-radius:11px;border:2px solid var(--red);background:rgba(224,85,85,.12);color:var(--red);font-size:.8rem;cursor:pointer;font-family:'Noto Sans SC',sans-serif;font-weight:600">
            💥 注销班级 + 删除所有学生账号<br><span style="font-size:.65rem;font-weight:400">所有学生账号及数据将彻底清除，不可恢复</span>
          </button>
          <button onclick="document.getElementById('_del-class-choice-ov').remove()" style="padding:9px;border-radius:10px;border:1.5px solid var(--border);background:transparent;font-size:.78rem;cursor:pointer;font-family:'Noto Sans SC',sans-serif;color:var(--muted)">取消</button>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend',ovHTML);
    window._doDeleteClassChoice=(enc,delAccs)=>doDeleteClass(delAccs);
  };

  if(acc&&acc.pin){
    openPinPad(acc.name,entered=>{
      if(entered===acc.pin){document.getElementById('pin-ov').classList.remove('on');_runAfterPin();return true;}
      showToast('密码错误！');return false;
    });
  } else {
    _runAfterPin();
  }
}

function startCreateAccount(){['na-name','na-pin','na-class'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});document.getElementById('new-acc-ov').classList.add('on');setTimeout(()=>{const el=document.getElementById('na-name');if(el)el.focus();},200);}
function createAccount(){const name=((document.getElementById('na-name')||{}).value||'').trim();const pin=((document.getElementById('na-pin')||{}).value||'').trim();const cls=((document.getElementById('na-class')||{}).value||'').trim();if(!name){showToast('请输入姓名！');return;}if(pin&&!/^\d{4}$/.test(pin)){showToast('密码须为4位数字！');return;}const accounts=getAllAccounts();if(accounts.some(a=>a.name===name&&a.classId===cls)){showToast('该名字在此班级已存在！');return;}const id='acc_'+Date.now()+'_'+Math.random().toString(36).slice(2,6);accounts.push({id,name,pin:pin||'',classId:cls,level:1,score:0,lastActive:Date.now()});saveAllAccounts(accounts);const fresh=JSON.parse(JSON.stringify(DEFAULT_SAVE));fresh.playerName=name;fresh.classId=cls;localStorage.setItem(getAccKey(id),JSON.stringify(fresh));if(cls)joinClassBoard(cls,name,0);document.getElementById('new-acc-ov').classList.remove('on');showToast(`✅ 账号「${name}」创建成功！`);renderLoginScreen();}
function openImportClass(){['ic-class','ic-names'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});document.getElementById('import-class-ov').classList.add('on');}
function importClassList(){const cls=((document.getElementById('ic-class')||{}).value||'').trim();const raw=((document.getElementById('ic-names')||{}).value||'').trim();if(!cls){showToast('请输入班级名称！');return;}if(!raw){showToast('请输入名单！');return;}const lines=raw.split('\n').map(l=>l.trim()).filter(Boolean);const accounts=getAllAccounts();let created=0,skipped=0;lines.forEach(line=>{const parts=line.split(/[,，]/);const name=parts[0].trim();const pin=(parts[1]||'').trim();if(!name)return;if(accounts.some(a=>a.name===name&&a.classId===cls)){skipped++;return;}if(pin&&!/^\d{4}$/.test(pin)){skipped++;return;}const id='acc_'+Date.now()+'_'+Math.random().toString(36).slice(2,6)+created;accounts.push({id,name,pin:pin||'',classId:cls,level:1,score:0,lastActive:Date.now()});const fresh=JSON.parse(JSON.stringify(DEFAULT_SAVE));fresh.playerName=name;fresh.classId=cls;localStorage.setItem(getAccKey(id),JSON.stringify(fresh));joinClassBoard(cls,name,0);created++;});saveAllAccounts(accounts);document.getElementById('import-class-ov').classList.remove('on');showToast(`✅ 创建${created}个账号${skipped?'，'+skipped+'个已跳过':''}`);renderLoginScreen();}

// ─── 科目切换 ─────────────────────────────────────
function setSubject(id){
  window.ACTIVE_SUBJECT_ID=id;
  localStorage.setItem('jbfarm_subject',id);
  window.ACTIVE_MODULE_ID=null;
  window.ACTIVE_MODULE_LABEL='';
  localStorage.removeItem('jbfarm_module');
  localStorage.removeItem('jbfarm_module_label');
  S.usedQ=[];
  renderSubjectBars();
}

function renderSubjectBars(){
  const _hasMod=id=>window.SUBJECT_MODULES&&SUBJECT_MODULES[id]&&SUBJECT_MODULES[id].groups&&SUBJECT_MODULES[id].groups.length>0;
  const mb=document.getElementById('subject-bar-mobile');
  if(mb){
    mb.innerHTML='';
    SUBJECTS.forEach(sub=>{
      const b=document.createElement('div');
      const isActive=sub.id===ACTIVE_SUBJECT_ID;
      b.className='sub-pill'+(isActive?' on':'');
      if(isActive)b.style.background=sub.color||'#5a9a5a';
      b.textContent=sub.icon+' '+sub.name+(_hasMod(sub.id)?'▾':'');
      b.onclick=()=>{if(!isActive)setSubject(sub.id);if(_hasMod(sub.id))setTimeout(openModulePicker,30);};
      mb.appendChild(b);
    });
    if(window.ACTIVE_MODULE_LABEL&&window.ACTIVE_MODULE_ID){
      const ml=document.createElement('div');
      ml.className='sub-pill on';
      ml.style.cssText='max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:.6rem;padding:2px 8px;background:#7a5020;flex-shrink:0';
      ml.textContent='📂 '+ACTIVE_MODULE_LABEL;
      ml.title=ACTIVE_MODULE_LABEL;
      ml.onclick=openModulePicker;
      mb.appendChild(ml);
    }
  }
  const sb=document.getElementById('sb-subjects');
  if(sb){
    sb.innerHTML='';
    SUBJECTS.forEach(sub=>{
      const d=document.createElement('div');
      const isActive=sub.id===ACTIVE_SUBJECT_ID;
      d.className='sb-sub-item'+(isActive?' on':'');
      d.innerHTML=`<div class="sb-sub-dot" style="${isActive?'background:'+sub.color:''}"></div>${sub.icon} ${sub.name}${_hasMod(sub.id)?'▾':''}`;
      d.onclick=()=>{if(!isActive)setSubject(sub.id);if(_hasMod(sub.id))openModulePicker();};
      sb.appendChild(d);
    });
    if(window.ACTIVE_MODULE_LABEL){
      const ml=document.createElement('div');
      ml.style.cssText='padding:2px 14px 5px;font-size:.58rem;color:rgba(255,255,255,.38);cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis';
      ml.textContent='📂 '+ACTIVE_MODULE_LABEL;
      ml.onclick=openModulePicker;
      sb.appendChild(ml);
    }
  }
  const badge=document.getElementById('sub-badge');
  if(badge){const sub=getActiveSubject();badge.textContent=window.ACTIVE_MODULE_LABEL?sub.icon+' '+ACTIVE_MODULE_LABEL:sub.icon+' '+sub.name;badge.style.background=sub.color||'#5a9a5a';}
}

function openModulePicker(){
  if(!window.SUBJECT_MODULES)return;
  const modCfg=SUBJECT_MODULES[ACTIVE_SUBJECT_ID];
  if(!modCfg||!modCfg.groups){showToast('该科目暂无子模块');return;}
  const sub=SUBJECTS.find(s=>s.id===ACTIVE_SUBJECT_ID)||SUBJECTS[0];
  const ov=document.getElementById('mod-pick-ov');
  if(!ov)return;
  const ttlEl=document.getElementById('mod-pick-ttl');
  if(ttlEl)ttlEl.textContent=sub.icon+' '+sub.name+' · 选择题目范围';
  const body=document.getElementById('mod-pick-body');
  if(!body)return;
  const curMid=window.ACTIVE_MODULE_ID||'';
  let html=`<div onclick="_mpAll()" style="padding:9px 12px;border-radius:10px;border:1.5px solid ${!curMid?'var(--green)':'var(--border)'};background:${!curMid?'rgba(100,160,100,.08)':'#fff'};cursor:pointer;display:flex;align-items:center;gap:8px;margin-bottom:10px">
    <span>📚</span><span style="flex:1;font-size:.8rem;font-weight:${!curMid?700:400};color:${!curMid?'var(--dgreen)':'var(--ink)'}">全部题目（混合所有模块）</span>${!curMid?'<span style="color:var(--green);font-size:.68rem">✓ 当前</span>':''}
  </div>`;
  modCfg.groups.forEach(g=>{
    html+=`<div style="font-size:.6rem;color:var(--muted);letter-spacing:1px;padding:5px 2px 4px;border-top:1px solid var(--border);margin-top:4px">${g.label}</div>`;
    g.modules.forEach(mod=>{
      const isOn=curMid===mod.id;
      const hasQ=!!(window[mod.qbKey]&&window[mod.qbKey].length>0);
      const cnt=hasQ?window[mod.qbKey].length:0;
      html+=`<div onclick="_mpSel('${mod.id}','${encodeURIComponent(mod.label)}',${hasQ})" style="padding:8px 12px;border-radius:9px;border:1.5px solid ${isOn?'var(--green)':hasQ?'var(--border)':'#e8e8e8'};background:${isOn?'rgba(100,160,100,.08)':hasQ?'#fff':'#f8f8f8'};cursor:pointer;display:flex;align-items:center;gap:7px;margin-bottom:5px">
        <span style="font-size:.85rem">${mod.isExam?'📄':'📖'}</span>
        <span style="flex:1;font-size:.75rem;font-weight:${isOn?700:400};color:${isOn?'var(--dgreen)':hasQ?'var(--ink)':'#bbb'}">${mod.label}</span>
        <span style="font-size:.58rem;color:${hasQ?'var(--muted)':'#ccc'}">${hasQ?cnt+'题':'📭 待更新'}</span>
        ${isOn?'<span style="color:var(--green);font-size:.65rem">✓</span>':''}
      </div>`;
    });
  });
  body.innerHTML=html;
  window._mpAll=function(){
    window.ACTIVE_MODULE_ID=null;window.ACTIVE_MODULE_LABEL='';
    localStorage.removeItem('jbfarm_module');localStorage.removeItem('jbfarm_module_label');
    S.usedQ=[];
    document.getElementById('mod-pick-ov').classList.remove('on');
    renderSubjectBars();showToast('📚 已切换：全部题目');
  };
  window._mpSel=function(id,labelEnc,hasQ){
    const label=decodeURIComponent(labelEnc);
    if(!hasQ){
      openConfirm('⚠️',`「${label}」

该模块暂时没有题目 📭
等待更新中...

是否仍然选择？（答题时会提示）`,()=>{
        _mpDoSel(id,label);
        document.getElementById('mod-pick-ov').classList.remove('on');
      });
      return;
    }
    _mpDoSel(id,label);
    document.getElementById('mod-pick-ov').classList.remove('on');
  };
  window._mpDoSel=function(id,label){
    window.ACTIVE_MODULE_ID=id;window.ACTIVE_MODULE_LABEL=label;
    localStorage.setItem('jbfarm_module',id);localStorage.setItem('jbfarm_module_label',label);
    S.usedQ=[];renderSubjectBars();showToast('📂 已切换：'+label);
  };
  ov.classList.add('on');
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
let QZ=null, curQ=null, qAnswered=false, curSelOpts=[]; 

function getQ(){const pool=getActiveQuestions();if(!pool||!pool.length)return QB&&QB[0]||{c:'基础',q:'加载中...',o:['A','B','C','D'],a:0,e:''};let av=pool.map((_,i)=>i).filter(i=>!S.usedQ.includes(i));if(av.length<5){S.usedQ=[];av=pool.map((_,i)=>i);}const idx=av[Math.floor(Math.random()*av.length)];S.usedQ.push(idx);if(S.usedQ.length>pool.length-3)S.usedQ=S.usedQ.slice(-15);return pool[idx];}

let _quizLayoutH=localStorage.getItem('jbfarm_quiz_h')!=='0'; // 默认横版，设为'0'才是竖版
function toggleQuizLayout(){
  _quizLayoutH=!_quizLayoutH;
  localStorage.setItem('jbfarm_quiz_h',_quizLayoutH?'1':'0');
  const ov=document.getElementById('quiz-ov');
  if(ov)ov.setAttribute('data-layout',_quizLayoutH?'h':'v');
  const btn=document.getElementById('quiz-layout-btn');
  if(btn)btn.textContent=_quizLayoutH?'⇅ 竖版':'⇅ 横版';
  if(btn)btn.title=_quizLayoutH?'切换为竖版':'切换为横版';
  showToast(_quizLayoutH?'📐 已切换为横版答题':'📐 已切换为竖版答题');
}

function openQuiz(cfg){
  const _pool=getActiveQuestions();
  if(!_pool||!_pool.length){
    const _ml=window.ACTIVE_MODULE_LABEL||'';
    showResult('⚠️','该题库暂无题目',_ml?`「${_ml}」\n\n此模块题目待更新中 📭\n\n请点击上方科目标签切换其他模块！`:'当前题库为空\n请切换科目或选择其他模块');
    return;
  }
  QZ={...cfg,done:0,correct:0};qAnswered=false;const sub=getActiveSubject();const badge=document.getElementById('sub-badge');if(badge){badge.textContent=(window.ACTIVE_MODULE_LABEL?sub.icon+' '+ACTIVE_MODULE_LABEL:sub.icon+' '+sub.name);badge.style.background=sub.color||'#5a9a5a';}
  // 应用布局状态
  const _qov=document.getElementById('quiz-ov');
  if(_qov)_qov.setAttribute('data-layout',_quizLayoutH?'h':'v');
  const _lbtn=document.getElementById('quiz-layout-btn');
  if(_lbtn){_lbtn.textContent=_quizLayoutH?'⇅ 竖版':'⇅ 横版';_lbtn.title=_quizLayoutH?'切换为竖版':'切换为横版';}
  _qov.classList.add('on');loadNextQ();
}

function loadNextQ(){
  curQ=getQ(); qAnswered=false; curSelOpts=[]; 
  document.getElementById('qcat').textContent=curQ.c; 
  document.getElementById('qcat').className='qcat ct-'+curQ.c; 
  document.getElementById('qtxt').textContent=curQ.q; 
  document.getElementById('explain').classList.remove('on'); 
  document.getElementById('mb-next').classList.remove('on'); 
  document.getElementById('qprog').textContent=`已答对 ${QZ.correct}/${QZ.needed}`; 
  document.getElementById('qttl').textContent=QZ.title||'答题挑战'; 
  const _shieldTip=(S.streakShieldLeft||0)>0?'  🛡️护盾×'+S.streakShieldLeft:''; 
  
  // 多选还是单选的提示判定
  const isMulti = Array.isArray(curQ.a);
  document.getElementById('qhint').textContent=`🎯 需答对 ${QZ.needed} 题，已答对 ${QZ.correct} 题${_shieldTip}${isMulti?' 【这是一个多选题，请选完提交】':''}`; 
  
  const d=document.getElementById('qopts'); d.innerHTML=''; 
  curQ.o.forEach((o,i)=>{
    const b=document.createElement('button'); b.className='opt'; 
    b.textContent=['A','B','C','D','E','F'][i]+'. '+o; 
    b.onclick=()=>pickOpt(i,b); d.appendChild(b);
  });
  
  // 若是多选，给一个醒目底部按钮准备验证答案
  if (isMulti) {
    const sBtn = document.createElement('button');
    sBtn.id='submit-multi-btn';
    sBtn.textContent='✔️ 提交答案';
    sBtn.className='mbtn mb-ok on';
    sBtn.style.cssText='width:100%;margin-top:10px;background:var(--gold);';
    sBtn.onclick=()=>submitAns();
    d.appendChild(sBtn);
  }
}

function pickOpt(idx,btn){
  if(qAnswered) return;
  const isMulti = Array.isArray(curQ.a);
  
  if (!isMulti) {
    curSelOpts = [idx]; 
    submitAns(); 
  } else {
    // 处理多选的高亮和缓存
    if (curSelOpts.includes(idx)) {
      curSelOpts = curSelOpts.filter(v=>v!==idx);
      btn.style.boxShadow = ''; btn.style.borderColor='var(--border)';
    } else {
      curSelOpts.push(idx);
      btn.style.boxShadow = 'inset 0 0 0 2px var(--gold)';
      btn.style.borderColor='var(--gold)'; 
    }
  }
}

function submitAns() {
  if (qAnswered) return;
  const isMulti = Array.isArray(curQ.a);
  if (isMulti && curSelOpts.length === 0) { showToast("❗ 请至少选择一项答案！"); return; }
  
  qAnswered=true; S.totalAnswered++; QZ.done++; 
  const optBtns = document.querySelectorAll('#qopts .opt');
  optBtns.forEach(b => b.disabled=true);
  const smbBtn = document.getElementById('submit-multi-btn');
  if (smbBtn) smbBtn.style.display='none';
  
  // 对比正确错误情况
  let isRight = false;
  if (!isMulti) {
     isRight = (curSelOpts[0] === curQ.a);
  } else {
     const rightAns = [...curQ.a].sort(); 
     const selAns = [...curSelOpts].sort();
     isRight = (JSON.stringify(rightAns) === JSON.stringify(selAns));
  }
  
  // 回显判断颜色效果（去除缓存选色）
  optBtns.forEach((b,i) => {
    b.style.boxShadow = '';
    const shouldBeRight = isMulti ? curQ.a.includes(i) : curQ.a === i;
    if (shouldBeRight) b.classList.add('ok'); // 所有的正解显示绿标
    if (curSelOpts.includes(i) && !shouldBeRight) b.classList.add('no'); // 答错了的地方用红标
  });

  document.getElementById('explain').textContent='💡 '+curQ.e;
  document.getElementById('explain').classList.add('on');
  
  if (isRight) {
     QZ.correct++; S.totalCorrect++; S.curStreak++; 
     S.maxStreak=Math.max(S.maxStreak,S.curStreak); 
     if(!S.catCorrect)S.catCorrect={...DEFAULT_SAVE.catCorrect}; 
     S.catCorrect[curQ.c]=(S.catCorrect[curQ.c]||0)+1; 
     const mult=S.expBoostLeft>0?2:1; gainExp(15*mult); 
     if(S.expBoostLeft>0){S.expBoostLeft--;updateTop();if(!S.expBoostLeft)showToast('📖 加成耗尽');else showToast(`学霸加成剩余 ${S.expBoostLeft} 题`);}
     spawnP(['⭐','✨','🌸']);
  } else {
     if((S.streakShieldLeft||0)>0){S.streakShieldLeft--;showToast('🛡️连击护盾保住了！');}else{S.curStreak=0;}
     document.getElementById('quiz-ov').classList.add('shake'); setTimeout(()=>document.getElementById('quiz-ov').classList.remove('shake'),400);
  }
  checkAchs(); updateTop(); persistAccount(); 
  
  const nb=document.getElementById('mb-next'); 
  if(QZ.correct>=QZ.needed){nb.textContent='完成 ✓'; nb.classList.add('on'); nb.onclick=()=>closeQuiz(true);} 
  else {nb.textContent=`继续（还差 ${QZ.needed-QZ.correct} 题）→`; nb.classList.add('on'); nb.onclick=quizNext;}
}

function quizNext(){if(QZ.correct>=QZ.needed){closeQuiz(true);return;}loadNextQ();}
function closeQuiz(ok=false){document.getElementById('quiz-ov').classList.remove('on');const ctx=QZ;QZ=null;if(ok&&(ctx||{}).onSuccess)ctx.onSuccess();else if(!ok&&(ctx||{}).onFail)ctx.onFail();}
// ─── QUIZ ENGINE END ─────────────────────────────


// ─── EXP / LEVEL（最高100级） ──────────────────────
function gainExp(n){
  S.exp+=n;S.score+=Math.floor(n*.5);
  const MAX_LEVEL=100;
  while(S.level<MAX_LEVEL&&S.exp>=expForLv(S.level)){S.exp-=expForLv(S.level);S.level++;showToast(`🎉 升级！达到 Lv.${S.level}`);spawnP(['🎊','⭐','🌟']);checkAchs();}
  updateAccountMeta();updateTop();
}

// ─── 宠物多存档 ──────────────────────────────────
function saveCurPet(){if(!S.petSaves)S.petSaves={};S.petSaves[S.activePet]={petBreed:S.petBreed,petName:S.petName,petLevel:S.petLevel,petFood:S.petFood,petHappy:S.petHappy,petClean:S.petClean,petEnergy:S.petEnergy,petLearnExp:S.petLearnExp||0,petFeedCount:S.petFeedCount,equippedCloth:S.equippedCloth};}
function loadPetSave(petId){const breed=(SHOP_PETS.find(function(p){return p.id===petId;})||{breed:'hamster'}).breed;if(S.petSaves&&S.petSaves[petId]){const ps=S.petSaves[petId];S.petBreed=ps.petBreed||breed;S.petName=ps.petName||PET_NAMES[0];S.petLevel=ps.petLevel||1;S.petFood=ps.petFood!=null?ps.petFood:65;S.petHappy=ps.petHappy!=null?ps.petHappy:55;S.petClean=ps.petClean!=null?ps.petClean:72;S.petEnergy=ps.petEnergy!=null?ps.petEnergy:80;S.petLearnExp=ps.petLearnExp||0;S.petFeedCount=ps.petFeedCount||0;S.equippedCloth=ps.equippedCloth||null;}else{S.petBreed=breed;S.petName=PET_NAMES[Math.floor(Math.random()*PET_NAMES.length)];S.petLevel=1;S.petFood=65;S.petHappy=55;S.petClean=72;S.petEnergy=80;S.petLearnExp=0;S.petFeedCount=0;S.equippedCloth=null;}}

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
let _plotCloseHandler=null;
function onPlotClick(idx,event){
  const p=S.plots[idx];if(p.s==='locked'){onLockedClick(idx);return;}
  const popup=document.getElementById('plot-popup');
  // 先移除上次可能残留的监听器
  if(_plotCloseHandler){document.removeEventListener('click',_plotCloseHandler);_plotCloseHandler=null;}
  const pages=document.getElementById('pages')||document.body;
  const pr=pages.getBoundingClientRect(),er=event.currentTarget.getBoundingClientRect();
  let top=er.bottom-pr.top+4,left=er.left-pr.left;if(left+200>pr.width)left=Math.max(0,pr.width-205);
  popup.style.top=top+'px';popup.style.left=left+'px';
  const sd=SEEDS[p.seed||'wheat'];const growing=['s0','s1','s2'].includes(p.s);
  let title=`第${idx+1}块地`;
  if(p.s==='empty')title+=' · 空地';else if(p.s==='s3')title+=` · ${sd.name} 🎉成熟！`;
  else{const _ptname=(window.PLANT_TALK&&(PLANT_TALK[p.seed||'wheat']||{}).name)||sd.name;title+=` · ${_ptname} ${Math.round(p.g)}%${p.hasBug?' 🐛':''}${p.hasCrack?' 💔裂了':''}`;}
  document.getElementById('pp-title').textContent=title;
  const acts=[];
  if(p.s==='empty')acts.push({l:'🌱 播种（答1题）',fn:()=>doPlantPlot(idx)});
  if(growing){const rt=calcReadyTime(idx);acts.push({l:`💧 浇水（答1题）${rt?' ⏱'+rt:''}`,fn:()=>doWaterPlot(idx)});acts.push({l:'✨ 施肥（答2题）',fn:()=>doFertPlot(idx)});}
  if(p.s==='s3')acts.push({l:'🌾 收获（答1题）',fn:()=>doHarvestPlot(idx)});
  if(p.hasBug){if(S.pestStock>0)acts.push({l:`🧴 使用除虫药（库存${S.pestStock}）`,fn:()=>usePest(idx)});else acts.push({l:'🧴 除虫（答1题）',fn:()=>doPestPlot(idx)});}
  if(p.s!=='locked'){
    const _cs=p.soil||'yellow';
    const _nextMap={yellow:'red',red:'black'};
    const _nextSoil=_nextMap[_cs];
    const SNAMES={yellow:'🟡黄土地',red:'🟥红土地',black:'⬛黑土地'};
    if(_nextSoil)acts.push({l:`🌱 升级土壤：${SNAMES[_cs]}→${SNAMES[_nextSoil]}`,fn:()=>upgradeSoil(idx)});
  }
  const ad=document.getElementById('pp-actions');ad.innerHTML='';
  if(!acts.length)ad.innerHTML='<div style="font-size:.7rem;color:var(--muted);text-align:center">暂无操作</div>';
  acts.forEach(a=>{const b=document.createElement('div');b.className='pp-act';b.textContent=a.l;b.onclick=()=>{closePlotPopup();a.fn();};ad.appendChild(b);});
  if(['s0','s1','s2'].includes(p.s)){
    let _ptalk='';
    if(p.hasCrack)_ptalk=_plantTalk(p.seed||'wheat','drought');
    else if(p.hasBug)_ptalk=_plantTalk(p.seed||'wheat','bug');
    if(_ptalk){
      const _dn=document.createElement('div');
      _dn.style.cssText='font-size:.68rem;text-align:center;padding:5px 8px;border-radius:7px;margin-top:5px;font-style:italic;line-height:1.5;color:'+(p.hasBug?'var(--red)':'#e87030')+';background:'+(p.hasBug?'rgba(224,85,85,.07)':'rgba(232,160,80,.08)');
      _dn.textContent='「'+_ptalk+'」';
      ad.appendChild(_dn);
    }
  }
  popup.classList.add('on');
  // 注册关闭监听，确保可移除
  setTimeout(()=>{
    _plotCloseHandler=function(e){if(!popup.contains(e.target)){closePlotPopup();}};
    document.addEventListener('click',_plotCloseHandler);
  },50);
}
function closePlotPopup(){
  document.getElementById('plot-popup').classList.remove('on');
  if(_plotCloseHandler){document.removeEventListener('click',_plotCloseHandler);_plotCloseHandler=null;}
}
function usePest(idx){S.pestStock--;S.plots[idx].hasBug=false;persistAccount();renderFarm();showToast('🧴 除虫药使用成功！');}
function doPlantPlot(idx){if(!totalSeeds()){openConfirm('🌰','种子袋空空！\n需要先去商店购买种子。\n是否前往商店？',()=>switchTab('shop'));return;}openSeedPicker('plant',null,sid=>{openQuiz({title:'🌱 播种',needed:1,onSuccess:()=>{const p=S.plots[idx];p.s='s0';p.g=0;p.seed=sid;p.lastWater=Date.now();p.hasBug=false;p.hasCrack=false;S.seedBag[sid]--;S.totalPlanted++;gainExp(10);persistAccount();renderFarm();checkAchs();const sd=SEEDS[sid];showResult('🌱','播种成功！',`第${idx+1}块地种了${sd.ico}${sd.name}\n约${sd.autoGrowH*4}小时后成熟`);}});});}
function _plantTalk(sid,type){const pt=(window.PLANT_TALK&&PLANT_TALK[sid])||null;if(!pt)return '';const lines=pt[type]||[];return lines.length?lines[Math.floor(Math.random()*lines.length)]:'';}
function doWaterPlot(idx){openQuiz({title:'💧 浇水',needed:1,onSuccess:()=>{const p=S.plots[idx];const _sid=p.seed||'wheat';const _talk=_plantTalk(_sid,'water');p.hasCrack=false;p.lastWater=Date.now();growPlot(idx,30);S.coins+=3;S.totalCoins+=3;gainExp(12);persistAccount();renderFarm();const rt=calcReadyTime(idx);const _pname=(window.PLANT_TALK&&(PLANT_TALK[_sid]||{}).name)||(SEEDS[_sid]||{}).name||'作物';showResult('💧','浇水完成！',`${_talk?'「'+_talk+'」\n\n':''}第${idx+1}块地 +30% → ${Math.round(p.g)}%\n金币+3${p.s==='s3'?'\n🌾 已成熟！':rt?'\n预计还需'+rt:''}`);}});}
function doFertPlot(idx){openQuiz({title:'✨ 施肥（需答对2题）',needed:2,onSuccess:()=>{const p=S.plots[idx];const _sid=p.seed||'wheat';const _talk=_plantTalk(_sid,'fert');p.hasCrack=false;p.lastWater=Date.now();growPlot(idx,60);S.coins+=8;S.totalCoins+=8;gainExp(25);persistAccount();renderFarm();showResult('✨','施肥成功！',`${_talk?'「'+_talk+'」\n\n':''}第${idx+1}块地 +60% → ${Math.round(p.g)}%\n金币+8${p.s==='s3'?'\n🌾 已成熟！':''}`);}});}
function doHarvestPlot(idx){openQuiz({title:'🌾 收获',needed:1,onSuccess:()=>{
  const sid=S.plots[idx].seed||'wheat';const sd=SEEDS[sid];
  const _soil=S.plots[idx].soil||'yellow';
  const _sm=_soil==='black'?1.6:_soil==='red'?1.3:1.0;
  S.plots[idx].s='empty';S.plots[idx].g=0;S.harvests++;
  const _hb=(S.harvestBoostLeft>0)?2:1;
  if(_hb>1){S.harvestBoostLeft--;showToast('🌈丰收加倍！还剩'+S.harvestBoostLeft+'次');}
  const _coinVal=Math.round(sd.reward*_sm*_hb);
  const _expVal=Math.round(sd.expGain*_sm);
  if(!S.warehouse)S.warehouse={};
  if(!S.warehouse[sid])S.warehouse[sid]={count:0,value:0};
  S.warehouse[sid].count++;S.warehouse[sid].value+=_coinVal;
  S.score+=Math.round(_coinVal*0.5);
  gainExp(_expVal);persistAccount();renderFarm();checkAchs();
  const _soilTip=_soil!=='yellow'?`\n${_soil==='diamond'?'💎钻石地':_soil==='black'?'⬛黑土地':'🟥红土地'}加成×${_sm}`:'';
  const _htalk=_plantTalk(sid,'harvest');showResult('🌾','大丰收！',`${_htalk?'「'+_htalk+'」\n\n':''}${sd.ico}${sd.name}已存入仓库🏪${_soilTip}\n经验+${_expVal}${_hb>1?' 🌈×2':''}\n去仓库售卖可得🪙${_coinVal}`);
}});}

function doPestPlot(idx){openQuiz({title:'🧴 除虫',needed:1,onSuccess:()=>{const _sid2=S.plots[idx].seed||'wheat';S.plots[idx].hasBug=false;gainExp(8);persistAccount();renderFarm();const _ptk2=_plantTalk(_sid2,'bug');showResult('🧴','除虫成功！',(_ptk2?'「'+_ptk2+'」 — 呼，终于安全了！\n\n':'')+'虫害已消灭！');}});}

// ─── SOIL UPGRADE SYSTEM ──────────────────────────
const SOIL_LEVELS=['yellow','red','black','diamond'];
const SOIL_NAMES_MAP={yellow:'🟡黄土地',red:'🟥红土地',black:'⬛黑土地',diamond:'💎钻石地'};
const SOIL_UPGRADE_COST={yellow:80,red:250,black:600};
const SOIL_MULT_MAP={yellow:1.0,red:1.35,black:1.8,diamond:2.5};
const SOIL_LV_REQ={red:10,black:30,diamond:60};

function canUpgradeSoil(idx){
  const p=S.plots[idx];
  if(!p||p.s==='locked')return{ok:false,msg:'地块未开荒，无法升级'};
  const cur=p.soil||'yellow';
  const ni=SOIL_LEVELS.indexOf(cur)+1;
  if(ni>=SOIL_LEVELS.length)return{ok:false,msg:'已是最高品质⬛黑土地！'};
  const next=SOIL_LEVELS[ni];
  const lvReq=SOIL_LV_REQ[next]||0;
  if(S.level<lvReq)return{ok:false,msg:`需要达到Lv.${lvReq}\n（当前Lv.${S.level}，还差${lvReq-S.level}级）`};
  if(next==='red'){
    const allUnlocked=S.plots.every(pl=>pl.s!=='locked');
    if(!allUnlocked)return{ok:false,msg:'需要先开荒全部地块\n才能升级🟥红土地'};
  }
  if(next==='black'){
    const allRed=S.plots.every(pl=>pl.soil==='red'||pl.soil==='black'||pl.soil==='diamond');
    if(!allRed)return{ok:false,msg:'需要先将所有地块升级为🟥红土地\n才能升级⬛黑土地'};
  }
  if(next==='diamond'){
    const allBlack=S.plots.every(pl=>pl.soil==='black'||pl.soil==='diamond');
    if(!allBlack)return{ok:false,msg:'需要先将所有地块升级为⬛黑土地\n才能升级💎钻石地'};
  }
  const cost=SOIL_UPGRADE_COST[cur];
  if(S.coins<cost)return{ok:false,msg:`金币不足！需🪙${cost}\n（当前🪙${S.coins}）`};
  return{ok:true,next,cost};
}

function upgradeSoil(idx){
  const {ok,msg,next,cost}=canUpgradeSoil(idx);
  if(!ok){showResult('⚠️','土壤无法升级',msg);return;}
  const cur=S.plots[idx].soil||'yellow';
  const mult=SOIL_MULT_MAP[next];
  openConfirm(SOIL_NAMES_MAP[next],
    `将第${idx+1}块地升级为${SOIL_NAMES_MAP[next]}？\n\n消耗🪙${cost}\n升级后收益倍率：×${mult}\n（经验和金币均提升${Math.round((mult-1)*100)}%）`,
    ()=>{
      S.coins-=cost;S.plots[idx].soil=next;
      persistAccount();renderFarm();updateTop();
      showToast(`✅ 第${idx+1}块地已升级为${SOIL_NAMES_MAP[next]}！`);
    }
  );
}

// ─── WAREHOUSE SYSTEM ─────────────────────────────
function renderWarehouse(){
  const body=document.getElementById('warehouse-body');
  const card=document.getElementById('warehouse-card');
  if(!body)return;
  if(card)card.style.display=''; // 永远显示
  if(!S.warehouse)S.warehouse={};
  const hasItems=SEED_IDS.some(sid=>S.warehouse[sid]&&S.warehouse[sid].count>0);
  if(!hasItems){
    body.innerHTML='<div style="text-align:center;padding:14px 0;color:var(--muted);font-size:.74rem">🏪 仓库空空如也<br><span style="font-size:.62rem">收获作物后会存放在这里</span></div>';
    return;
  }
  let totalVal=0;
  let html='<div style="display:flex;flex-direction:column;gap:5px;margin-bottom:8px">';
  SEED_IDS.forEach(sid=>{
    const wh=S.warehouse[sid];
    if(!wh||!wh.count)return;
    const sd=SEEDS[sid];
    totalVal+=wh.value;
    html+=`<div style="display:flex;align-items:center;gap:8px;padding:7px 10px;background:#fff;border-radius:10px;border:1.5px solid var(--border)">
      <span style="font-size:1.2rem">${sd.ico}</span>
      <div style="flex:1;min-width:0"><div style="font-size:.76rem;font-weight:600">${sd.name} ×${wh.count}</div>
      <div style="font-size:.6rem;color:var(--muted)">售卖可得🪙${wh.value}</div></div>
      <button onclick="sellCrop('${sid}')" style="padding:4px 12px;border-radius:99px;border:none;background:var(--green);color:#fff;font-size:.68rem;cursor:pointer;font-family:'Noto Sans SC',sans-serif;flex-shrink:0">售卖</button>
    </div>`;
  });
  html+='</div>';
  if(totalVal>0)html+=`<button onclick="sellAllCrops()" style="width:100%;padding:9px;border-radius:10px;border:none;background:linear-gradient(135deg,var(--green),var(--dgreen));color:#fff;font-size:.8rem;font-weight:600;cursor:pointer;font-family:'Noto Sans SC',sans-serif;box-shadow:0 3px 8px rgba(61,122,61,.22)">💰 全部售卖（共🪙${totalVal}）</button>`;
  body.innerHTML=html;
}
function sellCrop(sid){
  if(!S.warehouse||!S.warehouse[sid]||!S.warehouse[sid].count){showToast('仓库中没有这种作物！');return;}
  const sd=SEEDS[sid];const cnt=S.warehouse[sid].count;const val=S.warehouse[sid].value;
  S.coins+=val;S.totalCoins+=val;
  S.warehouse[sid]={count:0,value:0};
  persistAccount();renderFarm();updateTop();checkAchs();
  spawnP(['🪙','💰','✨']);
  showToast(`💰 售出${sd.ico}${sd.name}×${cnt}，获得🪙${val}！`);
}
function sellAllCrops(){
  if(!S.warehouse){showToast('仓库已空！');return;}
  let total=0,icons='';
  SEED_IDS.forEach(sid=>{
    const wh=S.warehouse[sid];
    if(!wh||!wh.count)return;
    total+=wh.value;icons+=SEEDS[sid].ico+'×'+wh.count+' ';
    S.warehouse[sid]={count:0,value:0};
  });
  if(!total){showToast('仓库已空！');return;}
  S.coins+=total;S.totalCoins+=total;
  persistAccount();renderFarm();updateTop();checkAchs();
  spawnP(['🪙','💰','✨','🌟']);
  showResult('💰','全部售卖完成！',`${icons}\n共获得🪙${total}！`);
}

function onLockedClick(idx){openConfirm('🔓',`开荒第${idx+1}块地（需答对3题）`,()=>{openQuiz({title:'🔓 开荒（需答对3题）',needed:3,onSuccess:()=>{S.plots[idx].s='empty';S.plotsUnlocked++;gainExp(40);S.coins+=15;S.totalCoins+=15;persistAccount();renderFarm();checkAchs();showResult('🔓','开荒成功！',`第${idx+1}块地已解锁！\n金币+15，经验+40`);}});});}

function farmBulk(type){
  const growing=['s0','s1','s2'];
  if(type==='auto_plant'){const empties=S.plots.map((p,i)=>({p,i})).filter(({p})=>p.s==='empty');if(!empties.length){showToast('没有空地！');return;}if(!totalSeeds()){showToast('种子袋空了！');return;}openSeedPicker('plant',null,sid=>{const n=Math.min(empties.length,S.seedBag[sid]||0);if(!n){showToast(SEEDS[sid].name+'种子不足！');return;}openQuiz({title:`🌱 一键播种（答对${n}题）`,needed:n,onSuccess:()=>{let cnt=0;empties.slice(0,n).forEach(({i})=>{if(S.seedBag[sid]>0){const p=S.plots[i];p.s='s0';p.g=0;p.seed=sid;p.lastWater=Date.now();p.hasBug=false;p.hasCrack=false;S.seedBag[sid]--;S.totalPlanted++;cnt++;}});gainExp(10*cnt);persistAccount();renderFarm();checkAchs();const _bpt=(window.PLANT_BULK_TALK&&PLANT_BULK_TALK.plant_all)||[];const _bpmsg=cnt>1&&_bpt.length?'「'+_bpt[Math.floor(Math.random()*_bpt.length)]+'」\n\n':'';showResult('🌱','一键播种完成！',_bpmsg+`播种了${cnt}块地 ${SEEDS[sid].ico}${SEEDS[sid].name}`);}});});return;}
  if(type==='buy_seeds'){openSeedPicker('buy',true,null);return;}
  if(type==='water_all'){const cnt=S.plots.filter(p=>growing.includes(p.s)).length;if(!cnt){showToast('没有正在生长的作物！');return;}openQuiz({title:`🌊 一键浇水（答对${cnt}题）`,needed:cnt,onSuccess:()=>{let coins=0;S.plots.forEach((p,i)=>{if(growing.includes(p.s)){p.hasCrack=false;p.lastWater=Date.now();growPlot(i,30);coins+=3;}});S.coins+=coins;S.totalCoins+=coins;gainExp(12*cnt);persistAccount();renderFarm();const _bwt=(window.PLANT_BULK_TALK&&PLANT_BULK_TALK.water_all)||[];const _bwmsg=_bwt.length?'「'+_bwt[Math.floor(Math.random()*_bwt.length)]+'」\n\n':'';showResult('🌊','全部浇水！',_bwmsg+`灌溉了${cnt}块地\n金币+${coins}`);}});return;}
  if(type==='harvest_all'){const cnt=S.plots.filter(p=>p.s==='s3').length;if(!cnt){showToast('没有成熟的作物！');return;}openQuiz({title:`🧺 一键收获（答对${cnt}题）`,needed:cnt,onSuccess:()=>{let totalVal=0,expT=0,icons='';if(!S.warehouse)S.warehouse={};S.plots.forEach((p,i)=>{if(p.s==='s3'){const sid=p.seed||'wheat';const sd=SEEDS[sid];const _sm=p.soil==='diamond'?2.5:p.soil==='black'?1.8:p.soil==='red'?1.35:1.0;S.plots[i].s='empty';S.plots[i].g=0;S.harvests++;const _hb=(S.harvestBoostLeft>0)?2:1;const _cv=Math.round(sd.reward*_sm*_hb);const _ev=Math.round(sd.expGain*_sm);if(!S.warehouse[sid])S.warehouse[sid]={count:0,value:0};S.warehouse[sid].count++;S.warehouse[sid].value+=_cv;totalVal+=_cv;expT+=_ev;icons+=sd.ico;S.score+=Math.round(_cv*0.5);}});if(S.harvestBoostLeft>0)S.harvestBoostLeft=Math.max(0,S.harvestBoostLeft-cnt);gainExp(expT);persistAccount();renderFarm();checkAchs();const _bht=(window.PLANT_BULK_TALK&&PLANT_BULK_TALK.harvest_all)||[];const _bhmsg=_bht.length?'「'+_bht[Math.floor(Math.random()*_bht.length)]+'」\n\n':'';showResult('🧺','一键大丰收！',_bhmsg+`收获：${icons}\n全部存入仓库🏪\n经验+${expT}\n共可售卖🪙${totalVal}`);}});return;}
  if(type==='fert_all'){const cnt=S.plots.filter(p=>growing.includes(p.s)).length;if(!cnt){showToast('没有正在生长的作物！');return;}openQuiz({title:`🪣 一键施肥（答对${cnt*2}题）`,needed:cnt*2,onSuccess:()=>{let coins=0;S.plots.forEach((p,i)=>{if(growing.includes(p.s)){p.hasCrack=false;p.lastWater=Date.now();growPlot(i,60);coins+=8;}});S.coins+=coins;S.totalCoins+=coins;gainExp(25*cnt);persistAccount();renderFarm();const _bft=(window.PLANT_BULK_TALK&&PLANT_BULK_TALK.fert_all)||[];const _bfmsg=_bft.length?'「'+_bft[Math.floor(Math.random()*_bft.length)]+'」\n\n':'';showResult('🪣','全部施肥！',_bfmsg+`施肥了${cnt}块地\n金币+${coins}`);}});return;}
  if(type==='pest_all'){const bugCount=S.plots.filter(p=>p.hasBug).length;if(!bugCount){showToast('目前没有虫害！');return;}if(S.pestStock>=bugCount){S.pestStock-=bugCount;S.plots.forEach(p=>p.hasBug=false);persistAccount();renderFarm();showToast(`🧴 使用${bugCount}瓶除虫药，全部清除！`);return;}openQuiz({title:`🧴 一键除虫（答对${bugCount}题）`,needed:bugCount,onSuccess:()=>{S.plots.forEach(p=>p.hasBug=false);gainExp(8*bugCount);persistAccount();renderFarm();showResult('🧴','除虫完成！',`清除了${bugCount}块地的虫害！`);}});return;}
}

// ─── SEED PICKER ──────────────────────────────────
let seedPickMode='buy',seedPickCb=null,selectedSeedId='wheat',buyQty=1;
function openSeedPicker(mode,showQty,cb){seedPickMode=mode;seedPickCb=cb;buyQty=1;document.getElementById('seed-ov-title').textContent=mode==='buy'?'🌰 购买种子':'🌱 选择种子';const list=document.getElementById('seed-list');list.innerHTML='';const available=mode==='plant'?SEED_IDS.filter(s=>S.seedBag[s]>0):S.unlockedSeeds;if(!available.length){showToast(mode==='plant'?'种子袋空了！去商店买种子吧':'暂无可用种子');return;}// 自动选中第一个有库存的种子，避免玩家未选种子就确认
selectedSeedId=available[0];available.forEach(sid=>{const sd=SEEDS[sid];const d=document.createElement('div');d.className='seed-item'+(sid===selectedSeedId?' sel':'');d.innerHTML=`<span class="seed-ico">${sd.ico}</span><div class="seed-info"><div class="seed-nm">${sd.name}${mode==='plant'?' ×'+S.seedBag[sid]:''}</div><div class="seed-desc">${sd.desc} · 🪙${sd.reward} · ${sd.autoGrowH*4}h成熟</div></div><div class="seed-price">${mode==='buy'?'🪙'+sd.buyCoins:''}</div>`;d.onclick=()=>{selectedSeedId=sid;document.querySelectorAll('.seed-item').forEach(x=>x.classList.remove('sel'));d.classList.add('sel');updateQtyCost();};list.appendChild(d);});const qs=document.getElementById('qty-section');qs.style.display=(mode==='buy'||showQty)?'block':'none';document.getElementById('qty-val').textContent=1;updateQtyCost();document.getElementById('seed-ov').classList.add('on');}
function updateQtyCost(){const sd=SEEDS[selectedSeedId];if(document.getElementById('qty-cost'))document.getElementById('qty-cost').textContent=`费用：🪙${sd.buyCoins*buyQty} + 答对${buyQty}题`;}
function changeQty(d){const sd=SEEDS[selectedSeedId];const max=Math.min(10,Math.max(1,Math.floor(S.coins/(sd.buyCoins||1))));buyQty=Math.max(1,Math.min(buyQty+d,max));document.getElementById('qty-val').textContent=buyQty;updateQtyCost();}
function closeSeedOv(){document.getElementById('seed-ov').classList.remove('on');}
function confirmSeedAction(){if(seedPickMode==='plant'){const hasStock=SEED_IDS.some(s=>S.seedBag[s]>0);if(!hasStock){closeSeedOv();openConfirm('🌰','种子袋空空如也！\n需要先去商店购买种子。\n是否前往商店？',()=>switchTab('shop'));return;}if(!S.seedBag[selectedSeedId]){showToast('请先点击选择一种有库存的种子！');return;}closeSeedOv();if(seedPickCb)seedPickCb(selectedSeedId);}else{const sd=SEEDS[selectedSeedId];const cost=sd.buyCoins*buyQty;if(S.coins<cost){showToast(`金币不足！需要🪙${cost}`);return;}closeSeedOv();openQuiz({title:`🌰 购买${sd.name}×${buyQty}（答对${buyQty}题）`,needed:buyQty,onSuccess:()=>{S.coins-=cost;S.seedBag[selectedSeedId]=(S.seedBag[selectedSeedId]||0)+buyQty;S.totalSeeds+=buyQty;gainExp(8*buyQty);persistAccount();renderFarm();checkAchs();showResult(sd.ico,'购种成功！',`获得${sd.name}×${buyQty}\n消耗🪙${cost}\n库存：${S.seedBag[selectedSeedId]}粒`);}});}}

// ─── RENDER FARM ──────────────────────────────────
let farmTimerInterval=null;
function renderFarm(){
  const g=document.getElementById('farm-grid');g.innerHTML='';
  S.plots.forEach((p,i)=>{
    const d=document.createElement('div');
    d.className='plot '+p.s+(p.hasCrack?' cracked':'')+(p.hasBug?' bugged':'');
    if(p.s==='locked'){d.innerHTML='<span class="plot-ico">🔒</span><div class="plot-lbl" style="font-size:.4rem">未开荒</div>';}
    else if(p.s==='empty'){
      const _sl=p.soil||'yellow';
      if(_sl==='red')d.style.background='linear-gradient(145deg,#b04828,#883018)';
      else if(_sl==='black')d.style.background='linear-gradient(145deg,#5a3a20,#3a2010)';
      else if(_sl==='diamond')d.style.background='linear-gradient(145deg,#40c8e8,#2080b0)';
      const _sico=_sl==='diamond'?'💎':_sl==='black'?'⬛':_sl==='red'?'🟥':'🟫';
      const _snm=_sl==='diamond'?'钻石空':_sl==='yellow'?'空地':_sl==='red'?'红土空':'黑土空';
      d.innerHTML=`<span class="plot-ico">${_sico}</span><div class="plot-lbl">${_snm}</div>`;
    }
    else{
      const sd=SEEDS[p.seed||'wheat'];
      const si=p.s==='s3'?sd.stages.length-1:p.s==='s2'?2:p.s==='s1'?1:0;
      const ico=sd.stages[Math.min(si,sd.stages.length-1)];
      const rt=calcReadyTime(i);const pctStr=Math.round(p.g);
      const _sl2=p.soil||'yellow';
      const _sdot=_sl2!=='yellow'?`<div style="position:absolute;bottom:2px;left:2px;width:5px;height:5px;border-radius:50%;background:${_sl2==='black'?'#5a3a20':'#b04828'};border:1px solid rgba(255,255,255,.5)"></div>`:'';
      // 缺水状态：可爱的干渴标识
      const _crackBadge=p.hasCrack?`<div style="position:absolute;top:3px;left:3px;font-size:.72rem;animation:wobble 1.2s infinite;filter:drop-shadow(0 1px 2px rgba(0,0,0,.3))" title="缺水啦！快来浇水">💧</div><div style="position:absolute;inset:0;border-radius:9px;background:rgba(200,120,40,.12);border:2px dashed rgba(200,120,40,.4)"></div>`:'';
      // 虫害标识
      const _bugBadge=p.hasBug?`<div style="position:absolute;top:3px;left:3px;font-size:.72rem;animation:bounce 0.8s infinite alternate" title="有虫！">🐛</div>`:'';
      const _topRight=`<div style="position:absolute;top:2px;right:2px;font-size:.48rem;line-height:1.4">${S.hasAutoWater?'🚿':''}${S.hasAutoPest?'🤖':''}</div>`;
      d.innerHTML=`${rt&&!p.hasCrack?`<div class="plot-timer">⏱${rt}</div>`:''} ${_topRight}${_crackBadge}${_bugBadge}${_sdot}<span class="plot-ico" style="${p.hasCrack?'filter:saturate(.5) brightness(.9)':''}${p.hasBug?'filter:saturate(.7)':''}">${ico}</span><div class="plot-lbl">${sd.name} ${p.s==='s3'?'🎉成熟':p.hasCrack?'😰渴了':pctStr+'%'}</div><div class="plot-pg"><div class="plot-pg-f" style="width:${p.g}%;${p.hasCrack?'background:linear-gradient(90deg,#d4a060,#b08040)':''}"></div></div>`;
    }
    d.onclick=e=>onPlotClick(i,e);g.appendChild(d);
  });
  const ready=S.plots.filter(p=>p.s==='s3').length,grow=S.plots.filter(p=>['s0','s1','s2'].includes(p.s)).length,bug=S.plots.filter(p=>p.hasBug).length;
  const seeds=SEED_IDS.filter(s=>S.seedBag[s]>0).map(s=>SEEDS[s].ico+S.seedBag[s]).join(' ')||'无';
  const _soilCounts={yellow:0,red:0,black:0};S.plots.filter(p=>p.s!=='locked').forEach(p=>{const s=p.soil||'yellow';_soilCounts[s]=(_soilCounts[s]||0)+1;});
  const _soilStr=(_soilCounts.red>0?` 🟥×${_soilCounts.red}`:'')+(_soilCounts.black>0?` ⬛×${_soilCounts.black}`:'');
  document.getElementById('farm-stat').innerHTML=`🌰 种子：${seeds}${S.hasAutoWater?' 🚿自动浇水':''}${S.hasAutoPest?' 🤖自动除虫':''}${S.pestStock>0?' 🧴除虫药×'+S.pestStock:''}<br>🌾 成熟：<b>${ready}</b>块 · 🌿 生长：<b>${grow}</b>块${bug?` · <b style="color:var(--red)">🐛虫${bug}</b>`:''}<br>📦 收获：<b>${S.harvests}</b>次${_soilStr?' · 土地：'+_soilStr:''}`;
  const val=ready+bug;['bd-farm','sbd-farm'].forEach(id=>{const el=document.getElementById(id);if(!el)return;if(val>0){el.textContent=val;el.classList.add('on');}else{el.textContent='';el.classList.remove('on');}});
  if(farmTimerInterval)clearInterval(farmTimerInterval);
  if(grow>0){farmTimerInterval=setInterval(()=>{if(isPaused)return;let changed=false;S.plots.forEach((p,i)=>{if(['s0','s1','s2'].includes(p.s)&&!p.hasCrack&&!p.hasBug){growPlot(i,1/(60*4));changed=true;}});if(changed)renderFarm();},1000);}
  renderWarehouse();
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
  // 如果动画循环已在运行，只触发一次强制重绘（解决宠物切换后不显示的问题）
  if(petAF){
    setTimeout(drawPet,16);
    return;
  }
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

// 【修复】应用皮肤颜色的逻辑（删除了重复定义的版本）
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

// ── 自定义宠物图片系统 ──
function getCustomPetImgKey(){return 'jbfarm_petimg_'+(S.activePet||'p_hamster');}
function getCustomClothImgKey(){return 'jbfarm_clothimg_'+(S.equippedCloth||'none');}

// 根据衣服图片范围决定是否应用
function _getClothImgDataWithScope(clothKey){
  const data=localStorage.getItem(clothKey);
  if(!data)return null;
  // 检查scope
  const scopeKey=clothKey+'_scope';
  const scope=localStorage.getItem(scopeKey)||'all';
  if(scope==='all')return data;
  if(scope==='pet'){
    // 仅当前宠物
    const petScopeKey=clothKey+'_scope_pet';
    const scopedPet=localStorage.getItem(petScopeKey);
    if(scopedPet&&scopedPet!==S.activePet)return null;
    return data;
  }
  if(scope==='stage'){
    // 仅当前宠物当前阶段
    const petScopeKey=clothKey+'_scope_pet';
    const stageScopeKey=clothKey+'_scope_stage';
    const scopedPet=localStorage.getItem(petScopeKey);
    const scopedStage=localStorage.getItem(stageScopeKey);
    const curStage=getEvoStage();
    if(scopedPet&&scopedPet!==S.activePet)return null;
    if(scopedStage&&scopedStage!==curStage.name)return null;
    return data;
  }
  return data;
}

function loadCustomPetImg(key, cb){
  if(_petImgCache[key]){cb(_petImgCache[key]);return;}
  const data=localStorage.getItem(key);
  if(!data){cb(null);return;}
  const img=new Image();
  img.onload=()=>{_petImgCache[key]=img;cb(img);};
  img.onerror=()=>cb(null);
  img.src=data;
}

function drawPet(){
  const cvs=document.getElementById('pet-canvas');if(!cvs)return;
  const ctx=cvs.getContext('2d');ctx.clearRect(0,0,cvs.width,cvs.height);
  const bob=petWalking?Math.sin(petT*3)*1.5:Math.sin(petT)*2;
  const stage=applySkinStage(getEvoStage());const breed=S.petBreed||'hamster';
  const petImgKey=getCustomPetImgKey();
  const petImgData=localStorage.getItem(petImgKey);
  const canvasW=cvs.width;

  function _drawImgWithParam(img,key,cx,cy){
    try{
      const raw=localStorage.getItem(key+'_param');
      const p=raw?JSON.parse(raw):{scale:0.8,offX:0,offY:0,rotation:0};
      const size=Math.round(canvasW*(p.scale!=null?p.scale:0.8));
      const dx=cx+(p.offX||0);
      const dy=cy+(p.offY||0);
      const rot=(p.rotation||0)*Math.PI/180;
      if(rot!==0){
        ctx.save();
        ctx.translate(dx,dy);
        ctx.rotate(rot);
        ctx.drawImage(img,-size/2,-size/2,size,size);
        ctx.restore();
      } else {
        ctx.drawImage(img,dx-size/2,dy-size/2,size,size);
      }
    }catch(e){}
  }

  if(petImgData){
    loadCustomPetImg(petImgKey,function(img){
      if(!img){
        // 图片加载失败，回退到像素画
        try{drawPetBreed(ctx,breed,petX,petY+bob,stage);}catch(e){}
        return;
      }
      ctx.clearRect(0,0,cvs.width,cvs.height);
      _drawImgWithParam(img,petImgKey,petX,petY+bob);
      const clothKey=getCustomClothImgKey();
      const clothData=S.equippedCloth?_getClothImgDataWithScope(clothKey):null;
      if(clothData){
        loadCustomPetImg(clothKey,function(cimg){if(cimg)_drawImgWithParam(cimg,clothKey,petX,petY+bob);});
      } else {
        try{_drawClothWithSysParam(ctx,petX,petY+bob);}catch(e){}
      }
    });
  } else {
    try{drawPetBreed(ctx,breed,petX,petY+bob,stage);}catch(e){
      // 绘制失败时显示占位符
      ctx.fillStyle='rgba(100,160,100,.15)';ctx.beginPath();ctx.arc(petX,petY,30,0,Math.PI*2);ctx.fill();
      ctx.font='24px serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('🐾',petX,petY);
    }
    const clothKey=getCustomClothImgKey();
    const clothImgData=S.equippedCloth?_getClothImgDataWithScope(clothKey):null;
    if(clothImgData){
      loadCustomPetImg(clothKey,function(cimg){if(cimg)_drawImgWithParam(cimg,clothKey,petX,petY+bob);});
    } else {
      try{_drawClothWithSysParam(ctx,petX,petY+bob);}catch(e){console.warn('drawCloth err',e);}
    }
  }
}

// 应用 jbfarm_clothsys_* 参数绘制系统衣服（保证预览和实际一致）
function _drawClothWithSysParam(ctx,cx,cy){
  const cid=S.equippedCloth;if(!cid)return;
  const key='jbfarm_clothsys_'+cid;
  const raw=localStorage.getItem(key);
  const p=raw?JSON.parse(raw):{scale:100,offsetX:0,offsetY:0,rotation:0};
  const sc=(p.scale||100)/100;
  const ox=p.offsetX||0,oy=p.offsetY||0;
  const rot=(p.rotation||0)*Math.PI/180;
  ctx.save();
  ctx.translate(cx+ox,cy+oy);
  if(rot!==0)ctx.rotate(rot);
  ctx.scale(sc,sc);
  ctx.translate(-(cx),-(cy));
  drawCloth(ctx,cx,cy,cid);
  ctx.restore();
}

let _petImgUploadMode='pet'; // 'pet' | 'cloth'
let _petImgPreviewData=null;
let _petImgPreviewObj=null;
let _petImgFileSize=0; // bytes

function openPetImageUpload(){
  _petImgUploadMode='pet';
  const inp=document.createElement('input');
  inp.type='file';inp.accept='image/*';
  inp.onchange=function(e){
    const file=e.target.files[0];if(!file)return;
    if(file.size>2*1024*1024){showToast('图片不能超过2MB，请压缩后再上传');return;}
    _petImgFileSize=file.size;
    const reader=new FileReader();
    reader.onload=function(ev){
      _petImgPreviewData=ev.target.result;
      openPetImgPreviewModal('宠物本体图片预览');
    };
    reader.readAsDataURL(file);
  };
  inp.click();
}

function openClothImageUpload(){
  if(!S.equippedCloth){
    openConfirm('👕','请先为宠物穿戴一件衣服，再上传衣服图片哦！\n\n去「宠物」→「衣柜」选一件衣服装备上就可以啦。',()=>{});
    return;
  }
  _petImgUploadMode='cloth';
  const inp=document.createElement('input');
  inp.type='file';inp.accept='image/*';
  inp.onchange=function(e){
    const file=e.target.files[0];if(!file)return;
    if(file.size>2*1024*1024){showToast('图片不能超过2MB');return;}
    _petImgFileSize=file.size;
    const reader=new FileReader();
    reader.onload=function(ev){
      _petImgPreviewData=ev.target.result;
      openPetImgPreviewModal('衣服图片预览');
    };
    reader.readAsDataURL(file);
  };
  inp.click();
}

function openPetImgPreviewModal(title){
  // 重置滑块
  const sc=document.getElementById('pet-img-scale');
  const ox=document.getElementById('pet-img-ox');
  const oy=document.getElementById('pet-img-oy');
  const rot=document.getElementById('pet-img-rot');
  const rotVal=document.getElementById('pet-img-rot-val');
  if(sc)sc.value=80;
  if(ox)ox.value=0;
  if(oy)oy.value=0;
  if(rot){rot.value=0;}
  if(rotVal)rotVal.textContent='0°';
  document.getElementById('pet-preview-label').textContent=title+' · 调整大小、位置、旋转';
  // 显示文件大小
  const sizeEl=document.getElementById('pet-img-filesize');
  if(sizeEl){
    const kb=(_petImgFileSize/1024).toFixed(1);
    const color=_petImgFileSize>1.5*1024*1024?'var(--red)':_petImgFileSize>1*1024*1024?'var(--gold)':'var(--dgreen)';
    sizeEl.innerHTML=`📦 文件大小：<b style="color:${color}">${kb} KB</b> / 2 MB上限`;
  }
  // 衣服模式：显示范围选项
  const scopeWrap=document.getElementById('cloth-scope-wrap');
  if(scopeWrap)scopeWrap.style.display=_petImgUploadMode==='cloth'?'':'none';
  // 重置范围为全部
  const radioAll=document.querySelector('input[name="cloth-scope"][value="all"]');
  if(radioAll)radioAll.checked=true;
  // 模特预览默认隐藏（用户可自行展开）
  const modelWrap=document.getElementById('pet-preview-model-wrap');
  if(modelWrap)modelWrap.style.display='none';
  // 加载图片对象
  const img=new Image();
  img.onload=function(){
    _petImgPreviewObj=img;
    rePetPreview();
  };
  img.src=_petImgPreviewData;
  document.getElementById('pet-img-preview-ov').classList.add('on');
  // Enable drag on preview canvas
  setTimeout(()=>_initPetPreviewDrag(),100);
}

function _initPetPreviewDrag(){
  const cvs=document.getElementById('pet-preview-cvs');if(!cvs)return;
  // 每次打开弹窗都重新绑定，先清除旧的（通过克隆节点移除所有监听）
  if(cvs._dragInited){
    // 移除旧的 document 级别监听，使用标记函数
    if(cvs._cleanupDrag)cvs._cleanupDrag();
  }
  cvs._dragInited=true;

  let dragging=false,startX=0,startY=0,baseOx=0,baseOy=0;
  let pinchDist0=0,pinchScale0=80;

  const getOxOy=()=>({ox:parseInt(document.getElementById('pet-img-ox').value||0),oy:parseInt(document.getElementById('pet-img-oy').value||0)});
 const setOxOy=(ox,oy)=>{
    const oxEl=document.getElementById('pet-img-ox'),oyEl=document.getElementById('pet-img-oy');
    if(oxEl){oxEl.value=Math.max(-80,Math.min(80,Math.round(ox)));}
    if(oyEl){oyEl.value=Math.max(-80,Math.min(80,Math.round(oy)));}
    rePetPreview();
  };
  
  const getScale=()=>parseInt((document.getElementById('pet-img-scale')||{}).value||80);
  const setScale=(v)=>{const el=document.getElementById('pet-img-scale');if(el){el.value=Math.max(10,Math.min(200,Math.round(v)));rePetPreview();}};

  const onDown=e=>{
    if(e.touches&&e.touches.length===2){dragging=false;return;}
    dragging=true;
    const t=e.touches?e.touches[0]:e;
    startX=t.clientX;startY=t.clientY;
    const {ox,oy}=getOxOy();baseOx=ox;baseOy=oy;
    e.preventDefault();
  };
  const onMove=e=>{
    // 双指捏合：缩放
    if(e.touches&&e.touches.length===2){
      e.preventDefault();
      const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);
      if(!pinchDist0){pinchDist0=d;pinchScale0=getScale();}
      else{setScale(pinchScale0*(d/pinchDist0));}
      return;
    }
    if(!dragging)return;
    const t=e.touches?e.touches[0]:e;
    const dx=t.clientX-startX,dy=t.clientY-startY;
    const r=cvs.getBoundingClientRect();
    const scaleX=cvs.width/r.width,scaleY=cvs.height/r.height;
    setOxOy(baseOx+dx*scaleX,baseOy+dy*scaleY);
    e.preventDefault();
  };
  const onUp=()=>{dragging=false;pinchDist0=0;};

  cvs.addEventListener('mousedown',onDown);
  cvs.addEventListener('touchstart',onDown,{passive:false});
  document.addEventListener('mousemove',onMove);
  document.addEventListener('touchmove',onMove,{passive:false});
  document.addEventListener('mouseup',onUp);
  document.addEventListener('touchend',onUp);

  // 保存清理函数，供下次打开时移除
  cvs._cleanupDrag=()=>{
    document.removeEventListener('mousemove',onMove);
    document.removeEventListener('touchmove',onMove);
    document.removeEventListener('mouseup',onUp);
    document.removeEventListener('touchend',onUp);
  };
}

function rePetPreview(){
  const cvs=document.getElementById('pet-preview-cvs');
  if(!cvs||!_petImgPreviewObj)return;
  const ctx=cvs.getContext('2d');
  ctx.clearRect(0,0,cvs.width,cvs.height);
  // 画背景格子（方便对齐透明图）
  ctx.fillStyle='#f5f0e8';ctx.fillRect(0,0,cvs.width,cvs.height);
  for(let xx=0;xx<cvs.width;xx+=20)for(let yy=0;yy<cvs.height;yy+=20)if((Math.floor(xx/20)+Math.floor(yy/20))%2===0){ctx.fillStyle='rgba(0,0,0,.04)';ctx.fillRect(xx,yy,20,20);}
  const scale=parseInt(document.getElementById('pet-img-scale').value||80)/100;
  const offX=parseInt(document.getElementById('pet-img-ox').value||0);
  const offY=parseInt(document.getElementById('pet-img-oy').value||0);
  const rot=parseInt(document.getElementById('pet-img-rot').value||0)*Math.PI/180;
  const size=Math.round(cvs.width*scale);
  const cx=cvs.width/2+offX;
  const cy=cvs.height/2+offY;
  ctx.save();
  ctx.translate(cx,cy);
  ctx.rotate(rot);
  ctx.drawImage(_petImgPreviewObj,-size/2,-size/2,size,size);
  ctx.restore();
  // 画中心参考圆
  ctx.strokeStyle='rgba(100,170,100,.3)';ctx.lineWidth=1;ctx.setLineDash([4,4]);
  ctx.beginPath();ctx.arc(cvs.width/2,cvs.height/2,cvs.width*0.35,0,Math.PI*2);ctx.stroke();
  ctx.setLineDash([]);

  // 更新模特预览画布（在宠物本体上叠加预览图片效果）
  const modelCvs=document.getElementById('pet-model-preview-cvs');
  if(modelCvs){
    const mctx=modelCvs.getContext('2d');
    const mcx=modelCvs.width/2, mcy=modelCvs.height/2;
    mctx.clearRect(0,0,modelCvs.width,modelCvs.height);
    const msize=Math.round(modelCvs.width*scale);
    const mdx=mcx+offX,mdy=mcy+offY;
    // 优先使用用户上传的自定义宠物图片作为模特底图
    const petKey=getCustomPetImgKey();
    const petData=localStorage.getItem(petKey);
    function _drawClothOverlay(){
      mctx.save();mctx.translate(mdx,mdy);mctx.rotate(rot);
      mctx.drawImage(_petImgPreviewObj,-msize/2,-msize/2,msize,msize);
      mctx.restore();
    }
    if(petData){
      const pi=new Image();
      pi.onload=function(){
        mctx.clearRect(0,0,modelCvs.width,modelCvs.height);
        const ps=Math.round(modelCvs.width*0.85);
        mctx.drawImage(pi,mcx-ps/2,mcy-ps/2,ps,ps);
        _drawClothOverlay();
      };
      pi.onerror=function(){
        // 图片加载失败则回退到程序生成
        const stage=getEvoStage?applySkinStage(getEvoStage()):null;
        if(stage){try{drawPetBreed(mctx,S.petBreed||'hamster',mcx,mcy,stage);}catch(e){}}
        _drawClothOverlay();
      };
      pi.src=petData;
    }else{
      // 没有自定义图，使用程序生成的宠物形象
      const stage=getEvoStage?applySkinStage(getEvoStage()):null;
      if(stage){try{drawPetBreed(mctx,S.petBreed||'hamster',mcx,mcy,stage);}catch(e){}}
      _drawClothOverlay();
    }
  }
}

function confirmPetImgUpload(){
  if(!_petImgPreviewData)return;
  const scale=parseInt(document.getElementById('pet-img-scale').value||80)/100;
  const offX=parseInt(document.getElementById('pet-img-ox').value||0);
  const offY=parseInt(document.getElementById('pet-img-oy').value||0);
  const rotation=parseInt(document.getElementById('pet-img-rot').value||0);
  const key=_petImgUploadMode==='cloth'?getCustomClothImgKey():getCustomPetImgKey();
  const paramKey=key+'_param';
  localStorage.setItem(key,_petImgPreviewData);
  localStorage.setItem(paramKey,JSON.stringify({scale,offX,offY,rotation}));
  // 保存衣服范围
  if(_petImgUploadMode==='cloth'){
    const scopeEl=document.querySelector('input[name="cloth-scope"]:checked');
    const scope=scopeEl?scopeEl.value:'all';
    localStorage.setItem(key+'_scope',scope);
    if(scope==='pet'||scope==='stage'){
      localStorage.setItem(key+'_scope_pet',S.activePet||'p_hamster');
      if(scope==='stage'){
        const stg=getEvoStage();
        localStorage.setItem(key+'_scope_stage',stg?stg.name:'');
      }
    }
  }
  delete _petImgCache[key];
  document.getElementById('pet-img-preview-ov').classList.remove('on');
  drawPet();
  showToast('✅ 图片已保存！');
}

// 清除自定义图片 → 弹出选项
function clearPetCustomImg(){
  document.getElementById('clear-pet-img-ov').classList.add('on');
}
function doClearPetImg(mode){
  document.getElementById('clear-pet-img-ov').classList.remove('on');
  if(mode==='pet'||mode==='all'){
    const key=getCustomPetImgKey();
    localStorage.removeItem(key);localStorage.removeItem(key+'_param');
    delete _petImgCache[key];
  }
  if(mode==='cloth'||mode==='all'){
    const key=getCustomClothImgKey();
    localStorage.removeItem(key);localStorage.removeItem(key+'_param');
    localStorage.removeItem(key+'_scope');localStorage.removeItem(key+'_scope_pet');localStorage.removeItem(key+'_scope_stage');
    delete _petImgCache[key];
  }
  drawPet();
  showToast('已恢复默认外观');
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
    ctx.strokeStyle = '#222'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(x, y, size, Math.PI, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(255,200,200,0.6)';
  } else if (h > 0.3) {
    ctx.fillStyle = '#1a1a1a'; ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'white'; ctx.beginPath(); ctx.ellipse(x + size * 0.4, y - size * 0.4, size * 0.38, size * 0.38, 0, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.strokeStyle = '#222'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - size, y + 1); ctx.lineTo(x + size, y - 1); ctx.stroke();
  }
}

// ── 缺失的辅助函数：皮肤颜色获取 & 泪滴 ──
function getPetSkinColor(){
  if(!S||!S.petSkinColors||!S.activePet)return null;
  const sid=S.petSkinColors[S.activePet];
  if(!sid||sid==='sc_default')return null;
  if(sid==='rainbow')return 'rainbow';
  const found=(window.PET_SKIN_COLORS||[]).find(c=>c.id===sid);
  return found?found.color:null;
}

function drawTears(ctx,cx,cy,h){
  if(h>0.25)return;
  ctx.fillStyle='rgba(100,160,220,0.6)';
  const drop=(x,y)=>{ctx.beginPath();ctx.ellipse(x,y,2,3,0,0,Math.PI*2);ctx.fill();};
  drop(cx-7,cy+6);drop(cx+7,cy+6);
}

function drawHamster(ctx, cx, cy, stage) {
    const lv = S.petLevel, h = S.petHappy / 100, col = stage.color || '#e8b070';
    const light = adjustColor(col, 60), dark = adjustColor(col, -30);

    if (lv === 1) {
        // 【1阶】保留原版的超萌第一形态
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

    } else if (lv === 2 || lv === 3) {
        // 【2阶、3阶】保留原版身形；其中3阶变为原来的第4形态（抱瓜子，有头饰）。
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

        if (lv === 3) {
            // 第3形态（原版本第4形态特征）：怀里抱瓜子
            ctx.fillStyle = '#333';
            ctx.beginPath(); ctx.moveTo(cx, cy + 2); ctx.lineTo(cx-4, cy+12); ctx.lineTo(cx+4, cy+12); ctx.fill();
            ctx.fillStyle = '#eee';
            ctx.beginPath(); ctx.moveTo(cx, cy + 4); ctx.lineTo(cx-2, cy+12); ctx.lineTo(cx+2, cy+12); ctx.fill();
            
            // 第3形态带皇冠/发芽
            ctx.font = '14px sans-serif'; ctx.fillText(stage.crownIco || '🌟', cx - 7, cy - 32); 
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

        drawTears(ctx, cx, cy-5, h); if (S.petEnergy < 25) { ctx.font='12px sans-serif'; ctx.fillText('💤', cx+18, cy-25); }

    } else if (lv === 4) {
        // 【4阶】版本B：正太装（V字刘海、倾斜耳朵、缩小瓜子、无尾巴）
        const skin = '#ffe4d6'; 
        // 1. 后发
        ctx.fillStyle = '#b07b46'; ctx.beginPath(); ctx.arc(cx, cy-8, 14, 0, Math.PI*2); ctx.fill();
        // 2. 身体与腿脚
        ctx.fillStyle = skin; ctx.beginPath(); ctx.ellipse(cx-6, cy+22, 3, 4, 0, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(cx+6, cy+22, 3, 4, 0, 0, Math.PI*2); ctx.fill(); // 小脚丫
        // 白衬衫与蓝背带裤
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect?ctx.roundRect(cx-9, cy+2, 18, 12, 3):ctx.rect(cx-9, cy+2, 18, 12); ctx.fill();
        ctx.fillStyle = '#4a86e8'; // 牛仔蓝
        ctx.beginPath(); ctx.roundRect?ctx.roundRect(cx-9, cy+10, 18, 9, 2):ctx.rect(cx-9, cy+10, 18, 9); ctx.fill(); // 裤子
        ctx.beginPath(); ctx.rect(cx-7, cy+2, 3, 8); ctx.fill(); ctx.beginPath(); ctx.rect(cx+4, cy+2, 3, 8); ctx.fill(); // 背带
        ctx.fillStyle = '#ffd700'; ctx.beginPath(); ctx.arc(cx-5.5, cy+10, 1.5, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(cx+5.5, cy+10, 1.5, 0, Math.PI*2); ctx.fill(); // 纽扣
        // 3. 抱着的缩小版瓜子
        ctx.fillStyle = '#333'; 
        ctx.beginPath(); 
        ctx.ellipse(cx, cy+12, 4, 8, Math.PI/6, 0, Math.PI*2); // 缩小瓜子尺寸
        ctx.fill();
        ctx.fillStyle = '#eee'; 
        ctx.beginPath(); 
        ctx.ellipse(cx, cy+12, 1.8, 6, Math.PI/6, 0, Math.PI*2); 
        ctx.fill();
        // 4. 小手 (压在瓜子上)
        ctx.fillStyle = skin; ctx.beginPath(); ctx.ellipse(cx-7, cy+11, 4, 3, 0.5, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(cx+7, cy+11, 4, 3, -0.5, 0, Math.PI*2); ctx.fill();
        // 5. 脸
        ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(cx, cy-6, 11, 0, Math.PI*2); ctx.fill();
        // 7. V字刘海 (上移与后发衔接，消除空白)
        ctx.fillStyle = '#b07b46';
        ctx.beginPath(); 
        ctx.moveTo(cx-13, cy-18); // 左顶点：上移超过脸的顶部，覆盖肉色空白
        ctx.lineTo(cx-7, cy-8);  // 左过渡点
        ctx.lineTo(cx, cy-4);    // 中间V字尖
        ctx.lineTo(cx+7, cy-8);  // 右过渡点
        ctx.lineTo(cx+13, cy-18); // 右顶点：上移超过脸的顶部，覆盖肉色空白
        ctx.fill();
        // 8. 大眼正太五官
        const ey = cy - 3;
        ctx.fillStyle='#222'; ctx.beginPath(); ctx.arc(cx-5, ey, 3, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(cx+5, ey, 3, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(cx-5.5, ey-1, 1.2, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(cx+4.5, ey-1, 1.2, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle='rgba(255,100,100,0.4)'; ctx.beginPath(); ctx.ellipse(cx-8, ey+3, 2.5,1.5,0,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(cx+8, ey+3, 2.5,1.5,0,0,Math.PI*2); ctx.fill();

        drawTears(ctx, cx, ey, h); if (S.petEnergy < 25) { ctx.font = '12px sans-serif'; ctx.fillText('💤', cx+15, cy-22); }

    } else {
        // 【5阶】版本B：帅气古风男神 (宽肩，自己设计的华贵衣裳，后发在身后)
        const skin = '#fffaf2'; 
        ctx.fillStyle = 'rgba(255,240,160,0.15)'; ctx.beginPath(); ctx.arc(cx, cy, 45, 0, Math.PI*2); ctx.fill();
        
        // 1. 后发（缩小半径，减少蓬松感，保留长发效果）
        ctx.fillStyle = '#e8d287'; 
        // 整体收窄收短，不那么蓬
        ctx.beginPath(); ctx.ellipse(cx, cy+5, 14, 26, 0, 0, Math.PI*2); ctx.fill();

        // 3. 华贵男神衣袍 (宽阔的肩膀，修长挺拔，白金相间)
        ctx.fillStyle = '#fdfdfd'; // 白色里衣
        ctx.beginPath(); ctx.moveTo(cx, cy-10); ctx.lineTo(cx-24, cy+32); ctx.lineTo(cx+24, cy+32); ctx.fill();
        ctx.fillStyle = '#3a4a5a'; // 墨蓝色外袍，彰显男性稳重
        ctx.beginPath(); ctx.moveTo(cx-12, cy+5); ctx.lineTo(cx-24, cy+32); ctx.lineTo(cx-6, cy+32); ctx.lineTo(cx, cy+15); ctx.fill();
        ctx.beginPath(); ctx.moveTo(cx+12, cy+5); ctx.lineTo(cx+24, cy+32); ctx.lineTo(cx+6, cy+32); ctx.lineTo(cx, cy+15); ctx.fill();
        ctx.fillStyle = '#d4a050'; // 金色宽腰封
        ctx.beginPath(); ctx.rect(cx-10, cy+12, 20, 6); ctx.fill();
        // 金色交领
        ctx.strokeStyle = '#d4a050'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(cx-6, cy-5); ctx.lineTo(cx, cy+8); ctx.lineTo(cx+6, cy-5); ctx.stroke();

        // 4. 男性轮廓脸型 (瘦长一点的V脸)
        ctx.fillStyle = skin;
        ctx.beginPath(); ctx.moveTo(cx-7, cy-15); ctx.lineTo(cx+7, cy-15); ctx.lineTo(cx, cy); ctx.fill(); 
        ctx.beginPath(); ctx.arc(cx, cy-15, 7, Math.PI, 0); ctx.fill(); 

        // 6. 斜刘海（不对称设计，替代原来的对称刘海）
        ctx.fillStyle = '#e8d287';
        ctx.beginPath();
        // 斜向刘海：左边更长，向右侧倾斜，自然覆盖额头
        ctx.moveTo(cx-13, cy-21);  // 左上起点
        ctx.lineTo(cx-14, cy-7);   // 左下，靠近脸左侧
        ctx.lineTo(cx-2, cy-13);   // 中间偏左
        ctx.lineTo(cx+6, cy-15);   // 中间偏右，斜向上收
        ctx.lineTo(cx+11, cy-19);  // 右上短起点
        ctx.lineTo(cx+7, cy-17);   // 调整右上弧度，让形状更自然
        ctx.closePath();
        ctx.fill();

        // 7. 闭目俊朗神颜 (剑眉星目感)
        ctx.strokeStyle='#4a3a2a'; ctx.lineWidth=1.2; 
        ctx.beginPath(); ctx.moveTo(cx-6, cy-11); ctx.quadraticCurveTo(cx-4, cy-9, cx-1, cy-11); ctx.stroke(); // 闭眼
        ctx.beginPath(); ctx.moveTo(cx+6, cy-11); ctx.quadraticCurveTo(cx+4, cy-9, cx+1, cy-11); ctx.stroke();
        ctx.strokeStyle='#b8860b'; ctx.lineWidth=1; // 金色眼影点缀
        ctx.beginPath(); ctx.moveTo(cx-6, cy-11); ctx.lineTo(cx-8, cy-13); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx+6, cy-11); ctx.lineTo(cx+8, cy-13); ctx.stroke();

        ctx.fillStyle='#ffda78'; ctx.font='12px sans-serif'; ctx.fillText('✨', cx-22+Math.sin(petT)*2, cy); ctx.fillText('🌟', cx+16, cy+15-Math.sin(petT)*2);

        drawTears(ctx, cx, cy-8, h); if (S.petEnergy < 25) { ctx.font = '12px sans-serif'; ctx.fillText('💤', cx + 18, cy - 25); }
    }
}

// ── 🐉 小火龙 (1阶保留，2阶侧面西方龙，3阶帅气S型中国龙，4/5阶绝对退回初版) ──
function drawDragon(ctx, cx, cy, stage) {
    const lv = S.petLevel, h = S.petHappy / 100, col = stage.color || '#50c080';
    const light = adjustColor(col, 40), dark = adjustColor(col, -40);

    if (lv === 1) {
        // 【1阶】保留极萌圆球龙
        const flap = Math.sin(petT * 4) * 0.35; 
        ctx.fillStyle = dark; ctx.beginPath(); ctx.ellipse(cx-13, cy, 8, 11, 0.6+flap, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.ellipse(cx+13, cy, 8, 11, -0.6-flap, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(cx, cy+5, 18, 16, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#ffdf8d'; ctx.beginPath(); ctx.ellipse(cx, cy+8, 12, 10, 0, 0, Math.PI*2); ctx.fill(); 
        ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(cx, cy-7, 18, 15, 0, 0, Math.PI * 2); ctx.fill(); 
        ctx.fillStyle = dark; ctx.beginPath(); ctx.arc(cx-5,cy-19,2.5,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(cx+5,cy-19,2.5,0,Math.PI*2); ctx.fill(); 
        const ey = cy - 9;
        if(h>0.4){
             ctx.fillStyle='#101416'; ctx.beginPath(); ctx.arc(cx-8, ey, 4.5, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(cx+8, ey, 4.5, 0, Math.PI*2); ctx.fill();
             ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(cx-9.5, ey-1, 1.8, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(cx+6.5, ey-1, 1.8, 0, Math.PI*2); ctx.fill();
        }else{
             ctx.strokeStyle='#101416'; ctx.lineWidth=2.5; ctx.beginPath(); ctx.moveTo(cx-10,ey); ctx.lineTo(cx-6,ey+2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx+10,ey); ctx.lineTo(cx+6,ey+2); ctx.stroke();
        }
        drawTears(ctx, cx, ey+2, h); if (S.petEnergy < 25) { ctx.font = '12px sans-serif'; ctx.fillText('💤', cx + 18, cy - 22); }

    } else if (lv === 2) {
        // 【2阶：侧边西方龙，蹲坐，霸气喷火】
        const flap = Math.sin(petT * 4) * 0.2;
        ctx.fillStyle = dark; ctx.beginPath(); ctx.ellipse(cx-4, cy-5, 8, 14, 0.5+flap, 0, Math.PI*2); ctx.fill(); // 远翼
        ctx.strokeStyle = col; ctx.lineWidth = 6; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(cx-6, cy+14); ctx.quadraticCurveTo(cx-20, cy+20, cx-22, cy+4); ctx.stroke(); // 尾
        ctx.fillStyle = dark; ctx.beginPath(); ctx.moveTo(cx-22, cy+4); ctx.lineTo(cx-26, cy-2); ctx.lineTo(cx-16, cy+2); ctx.fill(); // 尾刺
        ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(cx, cy+10, 14, 16, -0.2, 0, Math.PI*2); ctx.fill(); // 身
        ctx.fillStyle = '#ffdf8d'; ctx.beginPath(); ctx.ellipse(cx+8, cy+12, 6, 12, -0.2, 0, Math.PI*2); ctx.fill(); // 浅肚
        ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(cx-4, cy+20, 8, 6, 0, 0, Math.PI*2); ctx.fill(); // 腿
        ctx.fillStyle = dark; ctx.beginPath(); ctx.ellipse(cx+2, cy-2, 10, 16, 0.3+flap, 0, Math.PI*2); ctx.fill(); // 近翼
        ctx.fillStyle = light; ctx.beginPath(); ctx.ellipse(cx+2, cy-2, 6, 12, 0.3+flap, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(cx+8, cy-8, 12, 10, 0.2, 0, Math.PI*2); ctx.fill(); // 头
        ctx.beginPath(); ctx.moveTo(cx+8, cy-14); ctx.lineTo(cx+22, cy-8); ctx.lineTo(cx+12, cy-2); ctx.fill(); // 嘴
        ctx.strokeStyle = '#ffcf40'; ctx.lineWidth = 3; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(cx+4, cy-14); ctx.lineTo(cx-2, cy-22); ctx.stroke(); // 角
        ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(cx+10, cy-10, 2.5, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx+11, cy-11, 1, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#ff7540'; ctx.beginPath(); ctx.moveTo(cx+22, cy-6); ctx.lineTo(cx+35, cy-10); ctx.lineTo(cx+32, cy-4); ctx.lineTo(cx+40, cy); ctx.lineTo(cx+30, cy+2); ctx.fill(); // 火
        drawTears(ctx, cx+5, cy-6, h); if (S.petEnergy < 25) { ctx.font = '12px sans-serif'; ctx.fillText('💤', cx - 15, cy - 22); }

    } else if (lv === 3) {
        // 【3阶：帅气中国龙，S型身躯，带祥云龙珠特效】
        const floatY = Math.sin(petT * 2) * 4;
        ctx.strokeStyle = col; ctx.lineWidth = 10; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(cx, cy-10+floatY); ctx.bezierCurveTo(cx-25, cy+floatY, cx-25, cy+25+floatY, cx, cy+20+floatY); ctx.bezierCurveTo(cx+25, cy+15+floatY, cx+25, cy+35+floatY, cx-10, cy+30+floatY); ctx.stroke();
        ctx.strokeStyle = dark; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(cx-12, cy+floatY); ctx.lineTo(cx-16, cy-5+floatY); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx-14, cy+12+floatY); ctx.lineTo(cx-20, cy+12+floatY); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx+12, cy+20+floatY); ctx.lineTo(cx+18, cy+16+floatY); ctx.stroke();
        ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(cx-10, cy+10+floatY, 3, 6, 0.5, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(cx+10, cy+25+floatY, 3, 6, -0.5, 0, Math.PI*2); ctx.fill(); // 爪
        ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(cx, cy-12+floatY, 14, 12, 0, 0, Math.PI*2); ctx.fill(); // 龙头
        ctx.fillStyle = '#ffdf8d'; ctx.beginPath(); ctx.ellipse(cx, cy-6+floatY, 10, 6, 0, 0, Math.PI*2); ctx.fill(); // 嘴
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(cx-8, cy-6+floatY); ctx.quadraticCurveTo(cx-20, cy-4+floatY, cx-25, cy+5+floatY); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx+8, cy-6+floatY); ctx.quadraticCurveTo(cx+20, cy-4+floatY, cx+25, cy+5+floatY); ctx.stroke(); // 龙须
        ctx.strokeStyle = '#ffcf40'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(cx-4, cy-20+floatY); ctx.lineTo(cx-8, cy-32+floatY); ctx.moveTo(cx-6, cy-26+floatY); ctx.lineTo(cx-12, cy-28+floatY); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx+4, cy-20+floatY); ctx.lineTo(cx+8, cy-32+floatY); ctx.moveTo(cx+6, cy-26+floatY); ctx.lineTo(cx+12, cy-28+floatY); ctx.stroke();
        ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(cx-6, cy-14+floatY, 2, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(cx+6, cy-14+floatY, 2, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#ff4040'; ctx.beginPath(); ctx.arc(cx, cy-35+floatY, 4, 0, Math.PI*2); ctx.fill(); // 龙珠
        drawTears(ctx, cx, cy-10+floatY, h); if (S.petEnergy < 25) { ctx.font = '12px sans-serif'; ctx.fillText('💤', cx + 15, cy - 25); }

    } else if (lv === 4) {
        // 【4阶 完全退回你最满意的初版：红肚兜小孩】
        const skin = '#ffe4d6';
        const tailWag = Math.sin(petT * 3) * 4;
        ctx.strokeStyle = col; ctx.lineWidth = 6; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(cx, cy+12); ctx.quadraticCurveTo(cx+25, cy+15, cx+20+tailWag, cy+5); ctx.stroke();
        ctx.fillStyle = skin; ctx.beginPath(); 
        if(ctx.roundRect) ctx.roundRect(cx-7, cy+2, 14, 16, 4); else ctx.rect(cx-7, cy+2, 14, 16); 
        ctx.fill(); 
        ctx.fillStyle = '#e03030'; ctx.beginPath(); ctx.moveTo(cx-6, cy+4); ctx.lineTo(cx+6, cy+4); ctx.lineTo(cx, cy+15); ctx.fill(); 
        ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 1; ctx.stroke(); 
        ctx.fillStyle = skin;
        ctx.beginPath(); ctx.ellipse(cx-10, cy+8, 3, 5, 0.4, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx+10, cy+8, 3, 5, -0.4, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx-4, cy+20, 4, 3, 0, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx+4, cy+20, 4, 3, 0, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx, cy-8, 13, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#1a1a20';
        ctx.beginPath(); ctx.arc(cx-10, cy-18, 5, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx+10, cy-18, 5, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(cx-6, cy-18); ctx.lineTo(cx-10, cy-26); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx+6, cy-18); ctx.lineTo(cx+10, cy-26); ctx.stroke();
        ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(cx-5, cy-6, 2.5, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(cx+5, cy-6, 2.5, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx-5.5, cy-7, 1, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(cx+4.5, cy-7, 1, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(cx-9, cy-3, 1.5, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(cx+9, cy-3, 1.5, 0, Math.PI*2); ctx.fill(); 
        drawTears(ctx, cx, cy - 2, h); if (S.petEnergy < 25) { ctx.font = '12px sans-serif'; ctx.fillText('💤', cx + 15, cy - 20); }

    } else {
        // 【5阶 完全退回你最满意的初版：白发长须龙神】
        const skin = '#fff0e8';
        ctx.fillStyle = 'rgba(255,215,0,0.15)'; ctx.beginPath(); ctx.arc(cx, cy-10, 42, 0, Math.PI*2); ctx.fill();
        ctx.strokeStyle = 'rgba(255,215,0,0.4)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy-10, 38, 0, Math.PI*2); ctx.stroke();
        const fly = Math.sin(petT * 2) * 4;
        ctx.strokeStyle = 'rgba(120, 200, 255, 0.7)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(cx-25, cy-15+fly); ctx.bezierCurveTo(cx-40, cy+25, cx+40, cy+25, cx+25, cy-15-fly); ctx.stroke();
        ctx.fillStyle = '#1a202a'; ctx.beginPath(); ctx.ellipse(cx, cy-5, 12, 28, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#f5f5f5'; ctx.beginPath(); ctx.moveTo(cx-8, cy-15); ctx.lineTo(cx+8, cy-15); ctx.lineTo(cx+12, cy+35); ctx.lineTo(cx-12, cy+35); ctx.fill();
        ctx.fillStyle = dark; ctx.beginPath(); ctx.moveTo(cx-8, cy-15); ctx.lineTo(cx-15, cy+35); ctx.lineTo(cx-4, cy+35); ctx.lineTo(cx, cy); ctx.fill();
        ctx.beginPath(); ctx.moveTo(cx+8, cy-15); ctx.lineTo(cx+15, cy+35); ctx.lineTo(cx+4, cy+35); ctx.lineTo(cx, cy); ctx.fill();
        ctx.fillStyle = '#f0c050'; ctx.beginPath(); ctx.fillRect(cx-9, cy+2, 18, 4); ctx.fill();
        ctx.fillStyle = '#f5f5f5';
        ctx.beginPath(); ctx.moveTo(cx-8, cy-5); ctx.lineTo(cx-25, cy+15); ctx.lineTo(cx-15, cy+22); ctx.fill();
        ctx.beginPath(); ctx.moveTo(cx+8, cy-5); ctx.lineTo(cx+25, cy+15); ctx.lineTo(cx+15, cy+22); ctx.fill();
        ctx.fillStyle = skin;
        ctx.beginPath(); ctx.moveTo(cx-7, cy-22); ctx.lineTo(cx+7, cy-22); ctx.lineTo(cx, cy-10); ctx.fill(); 
        ctx.beginPath(); ctx.arc(cx, cy-22, 7, Math.PI, Math.PI*2); ctx.fill(); 
        ctx.strokeStyle = '#222'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(cx-5, cy-18); ctx.lineTo(cx-1, cy-17); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx+5, cy-18); ctx.lineTo(cx+1, cy-17); ctx.stroke();
        ctx.strokeStyle = '#e04040'; ctx.lineWidth = 1; 
        ctx.beginPath(); ctx.moveTo(cx-5, cy-18); ctx.lineTo(cx-8, cy-20); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx+5, cy-18); ctx.lineTo(cx+8, cy-20); ctx.stroke();
        ctx.fillStyle = '#f0c050'; ctx.beginPath(); ctx.ellipse(cx, cy-23, 1.5, 2.5, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#1a202a';
        ctx.beginPath(); ctx.moveTo(cx, cy-28); ctx.quadraticCurveTo(cx-8, cy-20, cx-9, cy-13); ctx.lineTo(cx-5, cy-26); ctx.fill();
        ctx.beginPath(); ctx.moveTo(cx, cy-28); ctx.quadraticCurveTo(cx+8, cy-20, cx+9, cy-13); ctx.lineTo(cx+5, cy-26); ctx.fill();
        ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(cx-4, cy-28); ctx.lineTo(cx-12, cy-38); ctx.lineTo(cx-8, cy-43); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx-8, cy-34); ctx.lineTo(cx-14, cy-32); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx+4, cy-28); ctx.lineTo(cx+12, cy-38); ctx.lineTo(cx+8, cy-43); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx+8, cy-34); ctx.lineTo(cx+14, cy-32); ctx.stroke();
        drawTears(ctx, cx, cy - 14, h); 
        if (S.petEnergy < 25) { ctx.font = '12px sans-serif'; ctx.fillText('💤', cx + 20, cy - 35); }
    }
}


// ── 🦊 小狐狸 (1-3阶极萌，4阶无尾小女孩，5阶无尾妖艳红衣仙女) ──
function drawFox(ctx, cx, cy, stage) {
    const lv = S.petLevel, h = S.petHappy / 100, col = stage.color || '#e87030';
    const light = adjustColor(col, 60), dark = adjustColor(col, -30);

    if (lv < 4) {
        // 【1-3阶】保留满意版！
        const tails = Math.min(lv, 3);
        ctx.fillStyle = col; ctx.strokeStyle = light; ctx.lineWidth = 2.5;
        for(let i=0; i<tails; i++){
            const spread = (i - (tails-1)/2) * 0.45; const wag = Math.sin(petT*2.5 + i*1.2) * 5;
            ctx.beginPath(); ctx.ellipse(cx+16+i*5, cy+wag+5, 14, 11, -0.6+spread, 0, Math.PI*2); ctx.fill(); ctx.stroke();
        }
        ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(cx, cy+10, 15, 14, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = light; ctx.beginPath(); ctx.ellipse(cx, cy+14, 10, 8, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = dark; ctx.beginPath(); ctx.ellipse(cx-8, cy+21, 3.5, 3, 0, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(cx+8, cy+21, 3.5, 3, 0, 0, Math.PI*2); ctx.fill();
        [[cx-14, cy-17, -0.5], [cx+14, cy-17, 0.5]].forEach(([ex, ey, rot]) => {
            ctx.fillStyle = dark; ctx.beginPath(); ctx.ellipse(ex, ey, 9, 13, rot, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ffdedb'; ctx.beginPath(); ctx.ellipse(ex, ey+3, 5, 8, rot, 0, Math.PI * 2); ctx.fill();
        });
        ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(cx, cy-6, 20, 15, 0, 0, Math.PI*2); ctx.fill(); 
        ctx.fillStyle = light; ctx.beginPath(); ctx.ellipse(cx, cy-2, 11, 7, 0, 0, Math.PI*2); ctx.fill(); 
        ctx.fillStyle = '#1c1513'; ctx.beginPath(); ctx.ellipse(cx, cy-4, 2.5, 1.5, 0,0,Math.PI*2); ctx.fill(); 
        const ey = cy - 8;
        if(h > 0.4) { 
            ctx.strokeStyle='#231215'; ctx.lineWidth=2.2; ctx.lineCap='round';
            ctx.beginPath(); ctx.moveTo(cx-14, ey); ctx.quadraticCurveTo(cx-10, ey-3, cx-6, ey+1); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx+14, ey); ctx.quadraticCurveTo(cx+10, ey-3, cx+6, ey+1); ctx.stroke();
            ctx.fillStyle = 'rgba(255,140,140,0.5)'; ctx.beginPath(); ctx.arc(cx-14, ey+4, 3, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(cx+14, ey+4, 3, 0, Math.PI*2); ctx.fill();
        }else{
            ctx.fillStyle='#222'; ctx.beginPath(); ctx.ellipse(cx-10, ey, 3, 2, 0,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(cx+10, ey, 3, 2, 0,0,Math.PI*2); ctx.fill();
        }
        drawTears(ctx, cx, ey+2, h); if (S.petEnergy < 25) { ctx.font = '12px sans-serif'; ctx.fillText('💤', cx + 22, cy - 25); }

    } else if (lv === 4) {
        // 【4阶：狐耳可爱小女孩，二次元Q版，有一只狐狸尾巴】
        const skin = '#ffe4d6';
        const tailOsc = Math.sin(petT*2)*3;

        // 可爱小裙子（红白相间）
        ctx.fillStyle = '#d32f2f'; ctx.beginPath(); ctx.moveTo(cx-12, cy+22); ctx.lineTo(cx+12, cy+22); ctx.lineTo(cx+8, cy+4); ctx.lineTo(cx-8, cy+4); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx, cy+5, 6, 0, Math.PI*2); ctx.fill(); // 白领子
        
        // 女孩的圆头
        ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(cx, cy-8, 12, 0, Math.PI*2); ctx.fill();
        
        // 头发（银白色或浅橘色齐刘海，选浅橘色呼应狐狸）
        ctx.fillStyle = '#ffbca5';
        ctx.beginPath(); ctx.arc(cx, cy-10, 13, Math.PI, 0); ctx.fill(); // 头顶
        ctx.beginPath(); ctx.moveTo(cx-13, cy-10); ctx.lineTo(cx-15, cy+5); ctx.lineTo(cx-8, cy-5); ctx.fill(); // 左鬓角
        ctx.beginPath(); ctx.moveTo(cx+13, cy-10); ctx.lineTo(cx+15, cy+5); ctx.lineTo(cx+8, cy-5); ctx.fill(); // 右鬓角
        ctx.beginPath(); ctx.moveTo(cx-8, cy-5); ctx.lineTo(cx, cy-8); ctx.lineTo(cx+8, cy-5); ctx.lineTo(cx, cy-12); ctx.fill(); // 齐刘海

        // 狐狸耳朵在头顶
        [[cx-9, cy-18, -0.2], [cx+9, cy-18, 0.2]].forEach(([ex, ey, rot]) => {
            ctx.fillStyle = dark; ctx.beginPath(); ctx.ellipse(ex, ey, 5, 9, rot, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = '#ffdedb'; ctx.beginPath(); ctx.ellipse(ex, ey+2, 3, 6, rot, 0, Math.PI*2); ctx.fill();
        });

        // 动漫大眼
        const ey = cy - 4;
        ctx.fillStyle='#a04040'; ctx.beginPath(); ctx.arc(cx-5, ey, 3, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(cx+5, ey, 3, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(cx-5.5, ey-1, 1, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(cx+4.5, ey-1, 1, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle='rgba(255,100,100,0.5)'; ctx.beginPath(); ctx.arc(cx-8, ey+3, 2, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(cx+8, ey+3, 2, 0, Math.PI*2); ctx.fill(); // 腮红

        drawTears(ctx, cx, ey, h); if (S.petEnergy < 25) { ctx.font = '12px sans-serif'; ctx.fillText('💤', cx + 18, cy - 25); }
    } else {
        // 【5阶：无尾巴！唯美闭目妖艳仙女，优雅红衣，银紫长发】
        const skin = '#fffaf5';
        // 1. 后发 (绝对在最底！)
        ctx.fillStyle = '#e8e8f8'; ctx.beginPath(); ctx.ellipse(cx, cy+5, 18, 35, 0, 0, Math.PI*2); ctx.fill();

        // 2. 优雅仙女裙 (红白相间，露出修长身形)
        ctx.fillStyle = '#f0f0f0'; ctx.beginPath(); ctx.moveTo(cx, cy-10); ctx.lineTo(cx-18, cy+32); ctx.lineTo(cx+18, cy+32); ctx.fill();
        ctx.fillStyle = '#d32f2f'; // 红衣外袍
        ctx.beginPath(); ctx.moveTo(cx-8, cy+2); ctx.lineTo(cx-22, cy+32); ctx.lineTo(cx-12, cy+32); ctx.lineTo(cx, cy+12); ctx.fill();
        ctx.beginPath(); ctx.moveTo(cx+8, cy+2); ctx.lineTo(cx+22, cy+32); ctx.lineTo(cx+12, cy+32); ctx.lineTo(cx, cy+12); ctx.fill();
        ctx.fillStyle = '#ffcccc'; ctx.beginPath(); ctx.rect(cx-6, cy+12, 12, 4); ctx.fill(); // 腰封

        // 3. 鹅蛋脸
        ctx.fillStyle = skin; ctx.beginPath(); ctx.ellipse(cx, cy-14, 7, 9, 0, 0, Math.PI*2); ctx.fill();

        // 4. 半藏的狐耳
        ctx.fillStyle = dark; ctx.beginPath(); ctx.arc(cx-6, cy-22, 3.5, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#ffc9ce'; ctx.beginPath(); ctx.arc(cx-6, cy-22, 1.5, Math.PI, 0); ctx.fill();
        ctx.fillStyle = dark; ctx.beginPath(); ctx.arc(cx+6, cy-22, 3.5, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#ffc9ce'; ctx.beginPath(); ctx.arc(cx+6, cy-22, 1.5, Math.PI, 0); ctx.fill();

        // 5. 飘逸前发刘海
        ctx.fillStyle = '#e8e8f8';
        ctx.beginPath(); ctx.arc(cx, cy-16, 7.5, Math.PI, 0); ctx.fill(); // 额顶
        ctx.beginPath(); ctx.moveTo(cx, cy-18); ctx.quadraticCurveTo(cx-8, cy-10, cx-10, cy); ctx.lineTo(cx-5, cy-14); ctx.fill(); // 左长鬓
        ctx.beginPath(); ctx.moveTo(cx, cy-18); ctx.quadraticCurveTo(cx+8, cy-10, cx+10, cy); ctx.lineTo(cx+5, cy-14); ctx.fill(); // 右长鬓

        // 6. 妖艳闭目眼妆 (上挑红眼尾)
        ctx.strokeStyle='#3e1a20'; ctx.lineWidth=1; 
        ctx.beginPath(); ctx.arc(cx-4, cy-13, 2.5, 0, Math.PI, false); ctx.stroke(); 
        ctx.beginPath(); ctx.arc(cx+4, cy-13, 2.5, 0, Math.PI, false); ctx.stroke();
        ctx.strokeStyle='#d83348'; ctx.lineWidth=1.5; // 红眼尾
        ctx.beginPath(); ctx.moveTo(cx-6.5,cy-13); ctx.lineTo(cx-9,cy-15); ctx.stroke(); 
        ctx.beginPath(); ctx.moveTo(cx+6.5,cy-13); ctx.lineTo(cx+9,cy-15); ctx.stroke();
        
        // 眉心花钿与红唇点
        ctx.fillStyle='#db3856'; ctx.beginPath(); ctx.ellipse(cx, cy-18, 1, 1.5, 0,0,Math.PI*2); ctx.fill(); // 额头花钿

        drawTears(ctx, cx, cy - 8, h); if (S.petEnergy < 25) { ctx.font = '12px sans-serif'; ctx.fillText('💤', cx + 20, cy - 25); }
    }
}


// ── 🐻 小熊 (1-3阶原版极萌，4阶抱蜂蜜正太有手脚，5阶层级完美修正是帅气绿袍森系男神) ──
function drawBear(ctx, cx, cy, stage) {
    const lv = S.petLevel, h = S.petHappy / 100, col = stage.color || '#a06030';
    const light = adjustColor(col, 40), dark = adjustColor(col, -30);

    if (lv < 4) {
        // 【1-3阶】原版完美保留！
        ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(cx, cy+14, 21, 18, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = light; ctx.beginPath(); ctx.ellipse(cx, cy+17, 13, 11, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = dark;
        [[cx-14,cy+25,-0.2],[cx+14,cy+25,0.2]].forEach(([px,py,rt])=>{ ctx.beginPath(); ctx.ellipse(px,py, 7, 5, rt, 0, Math.PI*2); ctx.fill(); ctx.fillStyle='#ffb2c3'; ctx.beginPath(); ctx.ellipse(px,py, 2.5,2, rt,0,Math.PI*2); ctx.fill(); ctx.fillStyle=dark;});

        if (lv >= 2) {
           ctx.fillStyle='#ffab34'; ctx.beginPath(); ctx.ellipse(cx, cy+18, 9,11, 0,0,Math.PI*2); ctx.fill(); 
           ctx.fillStyle='#e07820'; ctx.beginPath(); ctx.ellipse(cx, cy+8, 7,2,0,0,Math.PI*2); ctx.fill(); ctx.font='11px sans-serif'; ctx.fillText('🍯', cx-7, cy+22);
        }
        
        ctx.fillStyle = dark; ctx.beginPath(); ctx.ellipse(cx-14, cy+10, 5,10,-0.6,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.ellipse(cx+14, cy+10, 5,10,0.6,0,Math.PI*2); ctx.fill();
        ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(cx, cy-6, 19, 16, 0, 0, Math.PI*2); ctx.fill(); 
        [[cx-15, cy-18],[cx+15,cy-18]].forEach(([ex,ey])=>{ ctx.fillStyle=col; ctx.beginPath(); ctx.arc(ex,ey,6,0,Math.PI*2); ctx.fill(); ctx.fillStyle=light; ctx.beginPath(); ctx.arc(ex,ey,3,0,Math.PI*2); ctx.fill(); }); 
        ctx.fillStyle = light; ctx.beginPath(); ctx.ellipse(cx, cy-1, 8,6, 0,0,Math.PI*2); ctx.fill(); 
        
        const ey = cy - 8;
        if(h>0.4){
           ctx.fillStyle='#121010'; ctx.beginPath(); ctx.arc(cx-8, ey, 2.5, 0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(cx+8, ey, 2.5, 0,Math.PI*2); ctx.fill();
        }else{
           ctx.strokeStyle='#121010'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(cx-10,ey); ctx.lineTo(cx-6,ey-2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx+10,ey); ctx.lineTo(cx+6,ey-2); ctx.stroke();
        }
        ctx.fillStyle='#1c1c1c'; ctx.beginPath(); ctx.ellipse(cx, cy-2, 3, 2, 0,0,Math.PI*2); ctx.fill();

        drawTears(ctx, cx, ey+2, h); if (S.petEnergy < 25) { ctx.font = '12px sans-serif'; ctx.fillText('💤', cx + 18, cy - 25); }

    } else if (lv === 4) {
               // 【4阶：抱蜂蜜的可爱小男孩，二次元画风】
        const skin = '#ffe4d6';
        
        // 衣服（黄色小T恤）
        ctx.fillStyle = '#ffcf40'; ctx.beginPath(); ctx.moveTo(cx-10,cy+4); ctx.lineTo(cx-12,cy+22); ctx.lineTo(cx+12,cy+22); ctx.lineTo(cx+10,cy+4); ctx.fill();
        
        // 抱着的蜂蜜罐
        ctx.fillStyle='#ffab34'; ctx.beginPath(); ctx.ellipse(cx, cy+16, 7, 8, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle='#e07820'; ctx.beginPath(); ctx.ellipse(cx, cy+9, 5, 2, 0, 0, Math.PI*2); ctx.fill();
        ctx.font='10px sans-serif'; ctx.fillText('🍯', cx-6, cy+19);

        // 圆圆的男孩脸
        ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(cx, cy-8, 12, 0, Math.PI*2); ctx.fill();
        
        // 头发（深棕色蓬松短发）
        ctx.fillStyle = '#5c3a21';
        ctx.beginPath(); ctx.arc(cx, cy-10, 13, Math.PI, 0); ctx.fill(); // 头顶
        ctx.beginPath(); ctx.moveTo(cx-12, cy-10); ctx.lineTo(cx-14, cy); ctx.lineTo(cx-6, cy-6); ctx.fill(); 
        ctx.beginPath(); ctx.moveTo(cx+12, cy-10); ctx.lineTo(cx+14, cy); ctx.lineTo(cx+6, cy-6); ctx.fill(); 
        ctx.beginPath(); ctx.moveTo(cx-6, cy-6); ctx.lineTo(cx, cy-8); ctx.lineTo(cx+6, cy-6); ctx.lineTo(cx, cy-12); ctx.fill(); // 乱刘海

        // 熊耳朵在头上
        [[cx-11, cy-18], [cx+11, cy-18]].forEach(([ex,ey])=>{ ctx.fillStyle=col; ctx.beginPath(); ctx.arc(ex,ey, 5, 0,Math.PI*2); ctx.fill(); ctx.fillStyle=light; ctx.beginPath(); ctx.arc(ex,ey, 2.5, 0,Math.PI*2); ctx.fill(); }); 

        // 动漫大眼
        const ey = cy - 4;
        ctx.fillStyle='#3a2212'; ctx.beginPath(); ctx.arc(cx-5, ey, 3, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(cx+5, ey, 3, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(cx-5.5, ey-1, 1, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(cx+4.5, ey-1, 1, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle='rgba(255,140,100,0.5)'; ctx.beginPath(); ctx.arc(cx-8, ey+3, 2, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(cx+8, ey+3, 2, 0, Math.PI*2); ctx.fill();

        drawTears(ctx, cx, ey, h); if (S.petEnergy < 25) { ctx.font = '12px sans-serif'; ctx.fillText('💤', cx + 18, cy - 25); }

    } else {
               // 【5阶：稳重优雅的男性森林神明，闭目，绿色调，帅气干净】
        const skin = '#fff4e6';
        
        // 森林特效叶子
        for(let i=0; i<3; i++) { ctx.fillStyle='rgba(150,220,100,0.6)'; ctx.font='14px sans-serif'; ctx.fillText('🍃', cx-30+i*30+Math.sin(petT*2+i)*3, cy-8+i*8); }
        
        // 宽阔稳重的神明长袍（深绿色与棕色交织，下摆较宽显得稳重）
        ctx.fillStyle = '#2e4d3a'; // 深绿主袍
        ctx.beginPath(); ctx.moveTo(cx, cy-5); ctx.lineTo(cx-22, cy+32); ctx.lineTo(cx+22, cy+32); ctx.fill();
        ctx.fillStyle = '#d4b886'; // 金棕色内衬/领口
        ctx.beginPath(); ctx.moveTo(cx-10, cy+5); ctx.lineTo(cx-18, cy+32); ctx.lineTo(cx-12, cy+32); ctx.lineTo(cx, cy+10); ctx.fill();
        ctx.beginPath(); ctx.moveTo(cx+10, cy+5); ctx.lineTo(cx+18, cy+32); ctx.lineTo(cx+12, cy+32); ctx.lineTo(cx, cy+10); ctx.fill();

        // 长发束在脑后（深棕色）
        ctx.fillStyle = '#3d2b1f'; 
        ctx.beginPath(); ctx.ellipse(cx, cy-2, 10, 20, 0, 0, Math.PI*2); ctx.fill();

        // 男性俊朗轮廓（比女性稍宽一点点的完美脸型，依然用简洁几何图形）
        ctx.fillStyle = skin;
        ctx.beginPath(); ctx.ellipse(cx, cy-15, 7.5, 9.5, 0, 0, Math.PI*2); ctx.fill();

        // 额前沉稳的刘海
        ctx.fillStyle = '#3d2b1f';
        ctx.beginPath(); ctx.arc(cx, cy-18, 8, Math.PI, 0); ctx.fill();
        ctx.beginPath(); ctx.moveTo(cx-8, cy-18); ctx.lineTo(cx-8, cy-6); ctx.lineTo(cx-3, cy-16); ctx.fill();
        ctx.beginPath(); ctx.moveTo(cx+8, cy-18); ctx.lineTo(cx+8, cy-6); ctx.lineTo(cx+3, cy-16); ctx.fill();

        // 头顶隐约的熊耳（不破坏帅气感）
        [[cx-9, cy-21],[cx+9, cy-21]].forEach(([ex,ey])=>{ ctx.fillStyle=col; ctx.beginPath(); ctx.arc(ex,ey,4.5,0,Math.PI*2); ctx.fill(); ctx.fillStyle=dark; ctx.beginPath(); ctx.arc(ex,ey,2,0,Math.PI*2); ctx.fill();});

        // 稳重闭目（平缓的直线略微带一点点弧度）
        ctx.strokeStyle='#2c1e15'; ctx.lineWidth=1.2; 
        ctx.beginPath(); ctx.moveTo(cx-6, cy-13); ctx.quadraticCurveTo(cx-4, cy-12.5, cx-2, cy-13); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx+6, cy-13); ctx.quadraticCurveTo(cx+4, cy-12.5, cx+2, cy-13); ctx.stroke();

        // 额头森林印记
        ctx.fillStyle='#8fd16a'; ctx.beginPath(); ctx.ellipse(cx, cy-19, 1.5, 2.5, 0,0,Math.PI*2); ctx.fill(); 
        
        drawTears(ctx, cx, cy - 8, h); if (S.petEnergy < 25) { ctx.font = '12px sans-serif'; ctx.fillText('💤', cx + 20, cy - 25); }
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
  if(_hasAdj)ctx.restore();
  else ctx.restore();
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
function showPetTalk(key){
  // tap时根据宠物状态决定说什么
  if(key==='tap'){
    const avg=Math.round((S.petFood+S.petHappy+S.petClean+S.petEnergy)/4);
    if(S.petFood<=5||S.petEnergy<=5){key='tap_critical';}
    else if(S.petFood<15||S.petEnergy<15){key='tap_weak';}
    else if(S.petHappy<15){key='tap_sad';}
    else if(avg>=80){key='tap_happy';}
    else if(avg>=55){key='tap';} // normal tap
    else{key='tap_tired';}
  }
  const br=S.petBreed||'hamster';
  const bl=(window.PET_TALK_BREED&&PET_TALK_BREED[br]&&PET_TALK_BREED[br][key])||[];
  const lines=bl.length?bl:(PET_TALK[key]||PET_TALK['tap']||[]);
  if(!lines.length)return;
  let txt=lines[Math.floor(Math.random()*lines.length)];
  txt=txt.replace('{name}',S.petName||'我');
  const el=document.getElementById('pet-talk');if(!el)return;
  el.textContent=txt;el.classList.add('show');
  clearTimeout(talkTimer);talkTimer=setTimeout(()=>el.classList.remove('show'),3500);
}

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
  const tabIds=['seeds','clothes','pets','tools','skins','custom'];
  document.querySelectorAll('.stab').forEach((t,i)=>t.classList.toggle('on',tabIds[i]===tab));
  renderShop();
}
function ensureSkinTab(){
  // Tabs now hardcoded in HTML, nothing to inject
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
  else if(curShopTab==='custom'){
    // 定制工坊：渲染入口卡片
    const card=document.createElement('div');
    card.style.cssText='grid-column:1/-1;background:linear-gradient(135deg,rgba(100,160,100,.12),rgba(80,130,200,.08));border-radius:14px;border:2px solid var(--dgreen);padding:18px;text-align:center;cursor:pointer';
    card.innerHTML='<div style="font-size:2rem;margin-bottom:8px">🎪</div>'
      +'<div style="font-size:.88rem;font-weight:700;color:var(--dgreen);margin-bottom:6px">宠物定制工坊</div>'
      +'<div style="font-size:.74rem;color:var(--muted);line-height:1.6">自由定制你的宠物！<br>名字 · 品种 · 等级 · 属性 · 皮肤 · 衣服 · 形象图<br><br><b style="color:var(--dgreen)">点击进入工坊 →</b></div>';
    card.onclick=()=>openCustomWorkshop();
    g.appendChild(card);
  }
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
    const dur=item.type==='auto_water'?(S.autoWaterDur!=null?S.autoWaterDur:100):(item.type==='auto_pest'?(S.autoPestDur!=null?S.autoPestDur:100):null);
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
          openConfirm(item.ico,'免费重装'+item.name+'？\n耐久度将保持原值（'+Math.round(dur!=null?dur:100)+'%）',()=>doToolBuy(item,1));
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


// ─── 定制工坊 ────────────────────────────────────
let _cwBreedSel=null, _cwSkinSel=null, _cwClothSel=null, _cwLevelSel=1;

function openCustomWorkshop(){
  // 同步当前状态
  _cwBreedSel=S.petBreed||'hamster';
  _cwSkinSel=(S.petSkinColors&&S.petSkinColors[S.activePet])||'sc_default';
  _cwClothSel=S.equippedCloth||null;
  _cwLevelSel=S.petLevel||1;

  // 名字
  const ni=document.getElementById('cw-name-input');
  if(ni)ni.value=S.petName||'';

  // 等级滑块
  const lr=document.getElementById('cw-level-range');
  if(lr){lr.value=_cwLevelSel;}
  cwLvPreview(_cwLevelSel);

  // 品种格子
  _cwRenderBreedGrid();
  // 皮肤格子
  _cwRenderSkinGrid();
  // 衣服格子
  _cwRenderClothGrid();
  // 金币
  _cwUpdateCoin();
  // 画预览
  _cwDraw();

  document.getElementById('custom-workshop-ov').classList.add('on');
}

function _cwUpdateCoin(){
  const el=document.getElementById('cw-coin-display');
  if(el)el.textContent=Math.floor(S.coins||0);
}

function cwLvPreview(v){
  _cwLevelSel=parseInt(v);
  const el=document.getElementById('cw-lv-display');
  if(el){
    const stages=(EVO_STAGES[_cwBreedSel]||EVO_STAGES.hamster);
    const st=stages[Math.min(_cwLevelSel-1,stages.length-1)];
    el.textContent='Lv.'+_cwLevelSel+' '+st.name;
  }
  _cwDraw();
}

function cwRandomName(){
  const ni=document.getElementById('cw-name-input');
  if(ni)ni.value=PET_NAMES[Math.floor(Math.random()*PET_NAMES.length)];
}

function _cwRenderBreedGrid(){
  const g=document.getElementById('cw-breed-grid');if(!g)return;g.innerHTML='';
  const breeds=['hamster','cat','rabbit','bird','dog','panda','fox','bear','deer','penguin','owl','dragon','tiger','unicorn'];
  const icons={hamster:'🐹',cat:'🐱',rabbit:'🐰',bird:'🐦',dog:'🐶',panda:'🐼',fox:'🦊',bear:'🐻',deer:'🦌',penguin:'🐧',owl:'🦉',dragon:'🐲',tiger:'🐯',unicorn:'🦄'};
  const names={hamster:'仓鼠',cat:'猫咪',rabbit:'兔子',bird:'小鸟',dog:'小狗',panda:'熊猫',fox:'狐狸',bear:'小熊',deer:'小鹿',penguin:'企鹅',owl:'猫头鹰',dragon:'火龙',tiger:'小虎',unicorn:'独角兽'};
  // 只显示已拥有品种（玩家买过的宠物）
  const ownedBreeds=new Set((S.ownedPets||[]).map(pid=>{const p=SHOP_PETS.find(x=>x.id===pid);return p?p.breed:null;}).filter(Boolean));
  breeds.forEach(br=>{
    if(!ownedBreeds.has(br))return;
    const d=document.createElement('div');
    d.className='cw-breed-item'+(br===_cwBreedSel?' sel':'');
    d.innerHTML='<div style="font-size:1.2rem">'+icons[br]+'</div><div style="font-size:.6rem;margin-top:2px">'+names[br]+'</div>';
    d.onclick=()=>{_cwBreedSel=br;cwLvPreview(_cwLevelSel);_cwRenderBreedGrid();_cwDraw();};
    g.appendChild(d);
  });
}

function _cwRenderSkinGrid(){
  const g=document.getElementById('cw-skin-grid');if(!g)return;g.innerHTML='';
  (window.PET_SKIN_COLORS||[]).forEach(item=>{
    const owned=item.price===0||item.id==='sc_default'||(S.ownedSkins&&S.ownedSkins.includes(item.id));
    const d=document.createElement('div');
    d.className='cw-skin-item'+(item.id===_cwSkinSel?' sel':'');
    const sw=item.color&&item.color!=='rainbow'
      ?'<div style="width:24px;height:24px;border-radius:50%;background:'+item.color+';margin:0 auto 2px;border:1.5px solid #ccc"></div>'
      :'<div style="width:24px;height:24px;border-radius:50%;background:linear-gradient(135deg,#ff8080,#ffcc44,#88dd88,#44aaff,#cc88ff);margin:0 auto 2px;border:1.5px solid #ccc"></div>';
    d.innerHTML=sw+'<div style="font-size:.58rem">'+item.name+(owned?'':' 🔒')+'</div>';
    d.onclick=()=>{
      if(!owned){showToast('需先在皮肤商店购买「'+item.name+'」');return;}
      _cwSkinSel=item.id;_cwRenderSkinGrid();_cwDraw();
    };
    g.appendChild(d);
  });
}

function _cwRenderClothGrid(){
  const g=document.getElementById('cw-cloth-grid');if(!g)return;g.innerHTML='';
  // 无衣服选项
  const none=document.createElement('div');
  none.className='cw-cloth-item'+((!_cwClothSel)?' sel':'');
  none.innerHTML='<div style="font-size:1.1rem">🚫</div><div style="font-size:.58rem">不穿</div>';
  none.onclick=()=>{_cwClothSel=null;_cwRenderClothGrid();_cwDraw();};
  g.appendChild(none);
  // 已拥有的衣服
  (SHOP_CLOTHES||[]).filter(c=>S.ownedClothes&&S.ownedClothes.includes(c.id)).forEach(c=>{
    const d=document.createElement('div');
    d.className='cw-cloth-item'+(c.id===_cwClothSel?' sel':'');
    d.innerHTML='<div style="font-size:1.1rem">'+c.ico+'</div><div style="font-size:.58rem">'+c.name+'</div>';
    d.onclick=()=>{_cwClothSel=c.id;_cwRenderClothGrid();_cwDraw();};
    g.appendChild(d);
  });
}

function _cwDraw(){
  const cvs=document.getElementById('cw-preview-canvas');if(!cvs)return;
  const ctx=cvs.getContext('2d');
  ctx.clearRect(0,0,cvs.width,cvs.height);
  const stages=(EVO_STAGES[_cwBreedSel]||EVO_STAGES.hamster);
  const baseStage=stages[Math.min(_cwLevelSel-1,stages.length-1)];
  // 应用皮肤颜色
  let previewStage=Object.assign({},baseStage);
  const skinInfo=(window.PET_SKIN_COLORS||[]).find(s=>s.id===_cwSkinSel);
  if(skinInfo&&skinInfo.color&&skinInfo.color!=='rainbow')previewStage.color=skinInfo.color;
  else if(skinInfo&&skinInfo.color==='rainbow'){const rc=['#ff9090','#ffcc60','#a0e880','#60c8ff','#d080ff'];previewStage.color=rc[Math.floor(Date.now()/1200)%rc.length];}
  // 临时覆盖全局状态绘制
  const _br=S.petBreed,_lv=S.petLevel,_hp=S.petHappy,_en=S.petEnergy,_ec=S.equippedCloth;
  S.petBreed=_cwBreedSel;S.petLevel=_cwLevelSel;S.petHappy=80;S.petEnergy=80;S.equippedCloth=_cwClothSel;
  try{drawPetBreed(ctx,_cwBreedSel,55,58,previewStage);}catch(e){}
  if(_cwClothSel){try{drawCloth(ctx,55,58,_cwClothSel);}catch(e){}}
  S.petBreed=_br;S.petLevel=_lv;S.petHappy=_hp;S.petEnergy=_en;S.equippedCloth=_ec;
}

function cwApply(type){
  let cost=0,msg='',apply=null;
  if(type==='name'){
    const v=((document.getElementById('cw-name-input')||{}).value||'').trim();
    if(!v){showToast('名字不能为空！');return;}
    if(v===S.petName){showToast('名字没有变化');return;}
    cost=30;msg=`花费🪙30 将宠物名字改为「${v}」？`;
    apply=()=>{S.petName=v;saveCurPet();persistAccount();updatePetUI();showPetTalk('rename_ok');showToast('✅ 名字已改为「'+v+'」！');};
  }
  else if(type==='breed'){
    if(_cwBreedSel===(S.petBreed||'hamster')){showToast('品种没有变化');return;}
    cost=80;msg=`花费🪙80 更换宠物品种？\n品种更换后等级和经验保留。`;
    apply=()=>{S.petBreed=_cwBreedSel;saveCurPet();persistAccount();updatePetUI();drawPet();showToast('✅ 品种已更换！');};
  }
  else if(type==='level'){
    if(_cwLevelSel===S.petLevel){showToast('等级没有变化');return;}
    const diff=Math.abs(_cwLevelSel-S.petLevel);
    cost=60*diff;msg=`花费🪙${cost} 将宠物等级调整为Lv.${_cwLevelSel}（差${diff}级）？`;
    apply=()=>{
      S.petLevel=_cwLevelSel;
      // 同步经验到新等级起点
      const req=EVO_EXP_REQUIRED[Math.min(S.petLevel-1,EVO_EXP_REQUIRED.length-1)]||0;
      S.petLearnExp=Math.min(S.petLearnExp||0,req);
      saveCurPet();persistAccount();updatePetUI();drawPet();checkAchs();
      showToast('✅ 等级已调整为Lv.'+S.petLevel+'！');
    };
  }
  else if(type==='stats'){
    cost=50;msg='花费🪙50 将宠物所有属性恢复至100？';
    apply=()=>{S.petFood=100;S.petHappy=100;S.petClean=100;S.petEnergy=100;saveCurPet();persistAccount();updatePetUI();drawPet();showPetTalk('feed');showToast('✅ 属性已全满！');};
  }
  else if(type==='skin'){
    if(_cwSkinSel===((S.petSkinColors&&S.petSkinColors[S.activePet])||'sc_default')){showToast('皮肤没有变化');return;}
    cost=40;msg='花费🪙40 换上选中的皮肤？';
    apply=()=>{
      if(!S.petSkinColors)S.petSkinColors={};
      S.petSkinColors[S.activePet]=_cwSkinSel;
      saveCurPet();persistAccount();renderShop();updatePetUI();drawPet();checkAchs();
      showToast('✅ 皮肤已更换！');
    };
  }
  else if(type==='cloth'){
    if(_cwClothSel===S.equippedCloth){showToast('衣服没有变化');return;}
    cost=20;msg='花费🪙20 更换穿戴衣服？';
    apply=()=>{S.equippedCloth=_cwClothSel;saveCurPet();persistAccount();updatePetUI();drawPet();showPetTalk('cloth_on');showToast('✅ 衣服已更换！');};
  }
  if(!apply)return;
  if(S.coins<cost){showToast('金币不足！需要🪙'+cost+'，当前🪙'+Math.floor(S.coins));return;}
  openConfirm('🎪',msg,()=>{
    S.coins-=cost;updateTop();persistAccount();
    apply();
    _cwUpdateCoin();
    _cwDraw();
  });
}

function cwClearPetImg(){
  openConfirm('🗑️','清除当前宠物的自定义形象图？',()=>{
    const key=getCustomPetImgKey();
    localStorage.removeItem(key);
    localStorage.removeItem(key+'_param');
    delete _petImgCache[key];
    drawPet();
    showToast('✅ 自定义图已清除');
  });
}

// ─── CLASS SYSTEM ─────────────────────────────────
function getClassData(){try{return JSON.parse(localStorage.getItem(CLASS_KEY)||'{}');}catch(e){return {};}}
function saveClassData(d){try{localStorage.setItem(CLASS_KEY,JSON.stringify(d));}catch(e){}}
function joinClassBoard(cls,name,score){const cd=getClassData();if(!cd[cls])cd[cls]=[];const idx=cd[cls].findIndex(m=>m.name===name);if(idx>=0){const old=cd[cls][idx];cd[cls][idx]={name,score,level:S.level||1,isTeacher:old.isTeacher||false};}else cd[cls].push({name,score:score||0,level:1,isTeacher:S.isTeacher||false});saveClassData(cd);}
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
    <div style="margin-top:9px;display:flex;gap:7px;flex-wrap:wrap">
      <button onclick="openExtraScoreRanking()" style="padding:7px 16px;border-radius:9px;border:1.5px solid var(--purple);background:rgba(160,122,208,.08);color:var(--purple);font-size:.72rem;cursor:pointer;font-family:'Noto Sans SC',sans-serif">📊 额外积分排行</button>
      <button onclick="leaveClass()" style="padding:7px 16px;border-radius:9px;border:1.5px solid var(--red);background:transparent;color:var(--red);font-size:.72rem;cursor:pointer;font-family:'Noto Sans SC',sans-serif">退出班级</button>
      <button onclick="openClassManage()" style="padding:7px 16px;border-radius:9px;border:1.5px solid var(--border);background:transparent;font-size:.72rem;cursor:pointer;font-family:'Noto Sans SC',sans-serif">⚙️ 班级管理</button>
    </div>`;
  _afterRender();
}

let _rankExp=false;
function renderRankList(members){
  const show=_rankExp||members.length<=5;
  const list=show?members:members.slice(0,5);
  const admins=getClassAdmins();
  const asstAdmin=S.classId?admins[S.classId]:null;
  let html=list.map((m,i)=>{
    const isSelf=m.name===S.playerName;
    const isMonitor=asstAdmin&&asstAdmin.name===m.name;
    const isTeacherMember=m.isTeacher;
    let badge='';
    if(isTeacherMember)badge='<span style="font-size:.56rem;background:rgba(232,160,32,.18);color:#a06000;border-radius:4px;padding:0 4px;margin-left:3px;font-weight:600;vertical-align:middle">👨‍🏫教师</span>';
    else if(isMonitor)badge='<span style="font-size:.58rem;background:rgba(74,144,217,.13);color:#2060a0;border-radius:4px;padding:0 4px;margin-left:3px;font-weight:700;vertical-align:middle">★课代表</span>';
    return '<div class="rank-item '+(isSelf?'rank-self':'')+'" id="rank-'+i+'" data-rname="'+encodeURIComponent(m.name)+'" style="cursor:'+(isSelf?'default':'pointer')+'">'
      +'<div class="rank-num '+(i===0?'top1':i===1?'top2':i===2?'top3':'')+'">'+(i+1)+'</div>'
      +'<div class="rank-name">'+m.name+badge+(isSelf?' 👈':'')+'</div>'
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

function joinClass(){const cls=((document.getElementById('ci-class')||{}).value||'').trim();if(!cls){showToast('请输入班级名称！');return;}S.classId=cls;joinClassBoard(cls,S.playerName,S.score);persistAccount();updateClassSection();showToast(`✅ 已加入班级 ${cls}！`);}
function leaveClass(){openConfirm('🏫','确定退出班级？\n退出后将从排名中移除。',()=>{
  const cls=S.classId;
  const cd=getClassData();
  if(cd[cls]){cd[cls]=cd[cls].filter(m=>m.name!==S.playerName);saveClassData(cd);}
  S.classId='';persistAccount();updateClassSection();showToast('已退出班级');
});}

// ─── 额外积分排行 ─────────────────────────────────────
// 积分记录存储格式：jbfarm_scorelog_<classId> → [{name,pts,reason,time,op}]
function getScoreLog(classId){
  try{return JSON.parse(localStorage.getItem('jbfarm_scorelog_'+(classId||S.classId))||'[]');}
  catch(e){return [];}
}
function saveScoreLog(classId,log){
  try{localStorage.setItem('jbfarm_scorelog_'+(classId||S.classId),JSON.stringify(log));}
  catch(e){}
}

function openExtraScoreRanking(){
  if(!S.classId){showToast('请先加入班级');return;}
  const log=getScoreLog(S.classId);
  const ov=document.getElementById('extra-score-ov');
  if(!ov)return;

  // 统计各原因下每人加分总和
  const reasonMap={};
  log.forEach(entry=>{
    if(!entry.reason)return;
    if(!reasonMap[entry.reason])reasonMap[entry.reason]={};
    if(!reasonMap[entry.reason][entry.name])reasonMap[entry.reason][entry.name]=0;
    reasonMap[entry.reason][entry.name]+=(entry.pts||0);
  });

  const reasons=Object.keys(reasonMap);
  const tabsEl=document.getElementById('extra-score-tabs');
  const bodyEl=document.getElementById('extra-score-body');
  if(!tabsEl||!bodyEl)return;

  // 如果没有记录，显示提示（老数据没有log，展示总积分分类）
  if(!reasons.length){
    tabsEl.innerHTML='';
    bodyEl.innerHTML='<div style="font-size:.74rem;color:var(--muted);padding:12px;text-align:center">暂无积分记录。<br><span style="font-size:.66rem">新添加的积分将自动记录在此处。</span></div>';
    ov.classList.add('on');
    return;
  }

  let activeReason=reasons[0];
  function render(){
    tabsEl.innerHTML=reasons.map(r=>`<div onclick="_switchExtraTab('${encodeURIComponent(r)}')" style="padding:4px 11px;border-radius:99px;border:1.5px solid ${r===activeReason?'var(--purple)':'var(--border)'};background:${r===activeReason?'var(--purple)':'var(--panel)'};color:${r===activeReason?'#fff':'var(--ink)'};font-size:.68rem;cursor:pointer;white-space:nowrap;font-family:'Noto Sans SC',sans-serif;flex-shrink:0">${r}</div>`).join('');
    const data=reasonMap[activeReason]||{};
    const sorted=Object.entries(data).sort((a,b)=>b[1]-a[1]);
    if(!sorted.length){bodyEl.innerHTML='<div style="font-size:.74rem;color:var(--muted);padding:12px;text-align:center">该类别暂无记录</div>';return;}
    bodyEl.innerHTML='<div style="display:flex;flex-direction:column;gap:5px">'
      +sorted.map(([name,pts],i)=>{
        const rankStyle=i===0?'background:#ffd700;color:#806000':i===1?'background:#c0c0c0;color:#505050':i===2?'background:#cd7f32;color:#503010':'background:rgba(160,122,208,.12);color:var(--purple)';
        return `<div style="display:flex;align-items:center;gap:9px;padding:8px 10px;background:var(--panel);border-radius:9px;border:1px solid var(--border)">`
          +`<div style="width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.65rem;font-weight:700;${rankStyle};flex-shrink:0">${i+1}</div>`
          +`<div style="flex:1;font-size:.78rem;font-weight:500">${name}</div>`
          +`<div style="font-size:.75rem;color:var(--purple);font-weight:700">+${pts}</div>`
          +'</div>';
      }).join('')
      +'</div>';
  }
  window._switchExtraTab=function(enc){activeReason=decodeURIComponent(enc);render();};
  render();
  ov.classList.add('on');
}
// ─── 班级总览浏览器（桌面默认展开，手机默认收起）─────────────────
let _viewingClass='';
let classBrowserExpanded = window.innerWidth >= 900; // 桌面默认展开

function renderClassBrowser(){
  const el=document.getElementById('class-browser');if(!el)return;
  const cd=getClassData();const classes=Object.keys(cd);
  
  const arrow=classBrowserExpanded?'▼':'▶';
  let html = `
  <div onclick="toggleClassBrowser()" style="display:flex;align-items:center;gap:8px;padding:7px 9px;border-radius:9px;cursor:pointer;background:rgba(100,160,100,.06);border:1px solid var(--border);margin-bottom:${classBrowserExpanded?'10px':'0'};user-select:none">
    <span style="font-size:.7rem;color:var(--dgreen);transition:transform .2s">${arrow}</span>
    <span style="font-size:.76rem;font-weight:600;color:var(--dgreen)">🏫 班级总览</span>
    <span style="font-size:.62rem;color:var(--muted);margin-left:auto">${classes.length}个班级 · ${classBrowserExpanded?'点击收起':'点击展开'}</span>
  </div>`;

  if(classBrowserExpanded){
    if(!classes.length){
      html += '<div style="font-size:.74rem;color:var(--muted);padding:8px">暂无班级数据。</div>';
      el.innerHTML=html;return;
    }
    if(!_viewingClass||!cd[_viewingClass])_viewingClass=S.classId||classes[0];
    const tabsHtml=classes.map(cls=>`<div onclick="switchViewClass('${encodeURIComponent(cls)}')" style="padding:4px 11px;border-radius:99px;border:1.5px solid ${cls===_viewingClass?'var(--green)':'var(--border)'};background:${cls===_viewingClass?'var(--green)':'var(--panel)'};color:${cls===_viewingClass?'#fff':'var(--ink)'};font-size:.68rem;cursor:pointer;white-space:nowrap;font-family:'Noto Sans SC',sans-serif;flex-shrink:0">${cls}</div>`).join('');
    const members=sortMembers(cd[_viewingClass]||[]);
    const membersHtml=members.map((m,i)=>{
      const isSelf=m.name===S.playerName&&_viewingClass===S.classId;
      const rankStyle=i===0?'#ffd700;color:#806000':i===1?'#c0c0c0;color:#505050':i===2?'#cd7f32;color:#503010':'rgba(100,160,100,.1);color:var(--dgreen)';
      return `<div style="display:flex;align-items:center;gap:8px;padding:7px 9px;border-radius:9px;border:1px solid ${isSelf?'var(--green)':'var(--border)'};background:${isSelf?'rgba(100,160,100,.06)':'var(--panel)'}">`
        +`<div style="width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.6rem;font-weight:700;background:${rankStyle}">${i+1}</div>`
        +`<div style="flex:1;font-size:.78rem;font-weight:500">${m.name}${isSelf?' 👈':''}</div>`
        +`<div style="font-size:.65rem;color:var(--muted)">Lv.${m.level||1} · ⭐${m.score||0}</div></div>`;
    }).join('');
    html+=`<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">${tabsHtml}</div>`
      +`<div style="font-size:.7rem;color:var(--muted);margin-bottom:7px">👥 ${_viewingClass} · 共${members.length}名学生</div>`
      +`<div style="display:flex;flex-direction:column;gap:5px;max-height:260px;overflow-y:auto">${membersHtml||'<div style="font-size:.74rem;color:var(--muted)">班级暂无成员</div>'}</div>`
      +(members.length?`<div style="margin-top:8px"><button onclick="randomPickFromBrowser()" style="padding:6px 14px;border-radius:9px;border:1.5px solid var(--border);background:var(--panel);font-size:.72rem;cursor:pointer;font-family:'Noto Sans SC',sans-serif">🎲 随机抽人</button></div>`:'');
  }
  el.innerHTML=html;
}

// 切换展开/收起状态
function toggleClassBrowser(){
  classBrowserExpanded = !classBrowserExpanded;
  renderClassBrowser();
}

// 原有函数保持不变
function switchViewClass(clsEncoded){
  _viewingClass=decodeURIComponent(clsEncoded);
  renderClassBrowser();
}

function randomPickFromBrowser(){
  const cd=getClassData();const members=cd[_viewingClass]||[];
  if(!members.length){showToast('班级暂无成员！');return;}
  const picked=members[Math.floor(Math.random()*members.length)];
  openConfirm('🎲',`【${_viewingClass}】随机抽到：\n\n🌟 ${picked.name} 🌟\n\nLv.${picked.level||1} · ⭐${picked.score||0}分`,()=>{});
}

// ══════════════════════════════════════════════════════════════
// ★ 头像系统
// ══════════════════════════════════════════════════════════════
function openAvatarPicker(){
  const ov=document.getElementById('avatar-pick-ov');
  if(!ov)return;
  const grid=document.getElementById('avatar-grid-presets');
  if(grid){
    grid.innerHTML='';
    (window.AVATAR_PRESETS||[]).forEach(ap=>{
      const d=document.createElement('div');
      d.className='av-item'+(S.playerAvatar===ap.ico?' on':'');
      d.textContent=ap.ico;
      d.title=ap.label;
      d.onclick=()=>{
        document.querySelectorAll('.av-item').forEach(x=>x.classList.remove('on'));
        d.classList.add('on');
        const ci=document.getElementById('av-custom-input');
        if(ci)ci.value=ap.ico;
      };
      grid.appendChild(d);
    });
  }
  const ci=document.getElementById('av-custom-input');
  if(ci)ci.value=S.playerAvatar||'';
  ov.classList.add('on');
}
function saveAvatar(){
  const ci=document.getElementById('av-custom-input');
  const val=((ci||{}).value||'').trim();
  S.playerAvatar=val;
  persistAccount();updateTop();
  document.getElementById('avatar-pick-ov').classList.remove('on');
  showToast('✅ 头像已保存！');
}

// ══════════════════════════════════════════════════════════════
// ★ 班级负责人 & 解散班级
// ══════════════════════════════════════════════════════════════
const CLASS_ADMIN_KEY='jbfarm_class_admins';
function getClassAdmins(){try{return JSON.parse(localStorage.getItem(CLASS_ADMIN_KEY)||'{}');}catch(e){return {};}}
function saveClassAdmins(d){try{localStorage.setItem(CLASS_ADMIN_KEY,JSON.stringify(d));}catch(e){}}

function openClassManage(){
  if(!S.classId){showToast('你还没有加入班级');return;}
  closeAllOverlays();
  const ov=document.getElementById('class-manage-ov');if(!ov)return;
  const ttl=document.getElementById('class-manage-ttl');
  if(ttl)ttl.textContent='🏫 '+S.classId+' · 班级管理';
  const body=document.getElementById('class-manage-body');if(!body)return;
  const admins=getClassAdmins();const asstAdmin=admins[S.classId];
  const cd=getClassData();const clsMembers=cd[S.classId]||[];
  const selfMember=clsMembers.find(m=>m.name===S.playerName);
  const isTeacher=S.isTeacher&&(S.managedClasses||[]).includes(S.classId);
  const isAsstAdmin=asstAdmin&&asstAdmin.name===S.playerName;
  const teachers=clsMembers.filter(m=>m.isTeacher);
  let html='';
  // 教师信息
  if(teachers.length>0)html+=`<div style="font-size:.74rem;color:#a06000;font-weight:600;margin-bottom:8px">👨‍🏫 班级教师：${teachers.map(t=>t.name).join('、')}</div>`;
  // 辅助管理员信息
  if(asstAdmin)html+=`<div style="font-size:.72rem;color:#2060a0;margin-bottom:8px">🎖️ 辅助管理员：<b>${asstAdmin.name}</b></div>`;
  // 教师专属：任命辅助管理员
  if(isTeacher&&!asstAdmin){
    html+=`<button onclick="openSetAsstAdmin()" style="width:100%;padding:9px;border-radius:10px;border:1.5px solid #4a90d9;background:rgba(74,144,217,.06);color:#2060a0;font-size:.78rem;cursor:pointer;font-family:'Noto Sans SC',sans-serif;margin-bottom:8px">🎖️ 任命辅助管理员（课代表）</button>`;
  } else if(isTeacher&&asstAdmin){
    html+=`<button onclick="openSetAsstAdmin()" style="width:100%;padding:9px;border-radius:10px;border:1.5px solid #4a90d9;background:rgba(74,144,217,.06);color:#2060a0;font-size:.78rem;cursor:pointer;font-family:'Noto Sans SC',sans-serif;margin-bottom:8px">🎖️ 更换辅助管理员</button>`;
  }
  // 加积分（教师或辅助管理员）
  if(isTeacher||isAsstAdmin){
    html+=`<button onclick="openAddScorePanel()" style="width:100%;padding:9px;border-radius:10px;border:none;background:var(--green);color:#fff;font-size:.78rem;cursor:pointer;font-family:'Noto Sans SC',sans-serif;margin-bottom:8px">⭐ 给学生加积分</button>`;
  }
  // 解散班级（教师或辅助管理员）
  if(isTeacher||isAsstAdmin){
    html+=`<button onclick="dissolveClass()" style="width:100%;padding:9px;border-radius:10px;border:1.5px solid var(--red);background:transparent;color:var(--red);font-size:.78rem;cursor:pointer;font-family:'Noto Sans SC',sans-serif">💥 解散班级</button><div style="font-size:.6rem;color:var(--muted);margin-top:4px;text-align:center">${isTeacher?'解散后所有班级数据将清除':'辅助管理员也可解散班级'}</div>`;
  } else if(!asstAdmin&&!isTeacher){
    // 普通学生：显示设置负责人入口
    html+=`<div style="font-size:.74rem;color:var(--muted);margin-bottom:10px;line-height:1.8">该班级暂无负责人。<br>如果你是老师/班主任，可以设置自己为班级负责人。</div><button onclick="setClassAdmin()" style="width:100%;padding:9px;border-radius:10px;border:none;background:var(--green);color:#fff;font-size:.78rem;cursor:pointer;font-family:'Noto Sans SC',sans-serif;margin-bottom:8px">👑 设置我为班级负责人</button>`;
  } else {
    html+=`<div style="font-size:.72rem;color:var(--muted);line-height:1.7">如需解散班级，请联系班级负责人。</div>`;
  }
  body.innerHTML=html;
  ov.classList.add('on');
}

function openSetAsstAdmin(){
  const cd=getClassData();
  const members=(cd[S.classId]||[]).filter(m=>!m.isTeacher);
  let html='<div style="font-size:.7rem;color:var(--muted);margin-bottom:8px">选择一名学生作为辅助管理员（课代表）：</div><div style="max-height:50vh;overflow-y:auto">';
  members.forEach(s=>{
    html+=`<div style="padding:8px;border-radius:8px;border:1px solid var(--border);margin-bottom:4px;cursor:pointer;background:var(--panel)" onclick="setAsstAdmin('${encodeURIComponent(s.name)}')">${s.name} - Lv.${s.level||1} · ⭐${s.score||0}</div>`;
  });
  html+='</div>';
  document.getElementById('class-manage-body').innerHTML=html;
}

function setAsstAdmin(encodedName){
  const name=decodeURIComponent(encodedName);
  openConfirm('🎖️','将「'+name+'」设为辅助管理员（课代表）？\n可给同学加积分、解散班级，不能任命其他管理员。',()=>{
    const admins=getClassAdmins();
    admins[S.classId]={name,pin:''};
    saveClassAdmins(admins);
    document.getElementById('class-manage-ov').classList.remove('on');
    updateClassSection();
    showToast('✅ 已将「'+name+'」设为辅助管理员！');
  });
}

// ── 积分管理系统 ──────────────────────────────────
let _scoreMode='add'; // 'add' | 'sub'
let _scoreClassId=null; // 当前操作的班级（支持教师跨班操作）
let _scoreSelected=new Set(); // 已选中学生名字集合
let _scoreSearchQuery=''; // 搜索关键字

function onScoreSearch(v){_scoreSearchQuery=v||'';_renderScoreList();}

function setScoreMode(mode){
  _scoreMode=mode;
  const addBtn=document.getElementById('score-mode-add');
  const subBtn=document.getElementById('score-mode-sub');
  const confirmBtn=document.getElementById('score-confirm-btn');
  if(addBtn){addBtn.style.background=mode==='add'?'var(--green)':'var(--panel)';addBtn.style.color=mode==='add'?'#fff':'var(--muted)';}
  if(subBtn){subBtn.style.background=mode==='sub'?'var(--red)':'var(--panel)';subBtn.style.color=mode==='sub'?'#fff':'var(--muted)';}
  if(confirmBtn){confirmBtn.style.background=mode==='add'?'var(--green)':'var(--red)';confirmBtn.textContent=mode==='add'?'✅ 确认给已选学生加分':'📉 确认给已选学生减分';}
}

function setScoreVal(v){
  const el=document.getElementById('add-score-val');
  if(el){el.value=v;}
  // 高亮选中的预设按钮
  document.querySelectorAll('.score-preset-btn').forEach(b=>{
    b.classList.toggle('active',b.textContent==='+'+v||b.textContent===''+v);
  });
}

function openAddScorePanel(classId){
  _scoreClassId=classId||S.classId;
  if(!_scoreClassId){showToast('未指定班级');return;}
  _scoreSelected=new Set();
  _scoreSearchQuery='';
  const si=document.getElementById('score-search-input');if(si)si.value='';
  setScoreMode('add');
  const vi=document.getElementById('add-score-val');if(vi)vi.value='';
  const rs=document.getElementById('add-score-reason');if(rs)rs.value='背书';
  const cw=document.getElementById('score-custom-reason-wrap');if(cw)cw.style.display='none';
  // 监听原因选择切换
  if(rs){rs.onchange=function(){
    const cw=document.getElementById('score-custom-reason-wrap');
    if(cw)cw.style.display=rs.value==='自定义'?'':'none';
  };}
  _renderScoreList();
  // 关闭其他弹窗
  ['class-manage-ov','teacher-class-manage-ov'].forEach(id=>{
    const el=document.getElementById(id);if(el)el.classList.remove('on');
  });
  document.getElementById('add-score-ov').classList.add('on');
}

function _renderScoreList(){
  const list=document.getElementById('add-score-list');
  if(!list)return;
  const cd=getClassData();
  const members=sortMembers((cd[_scoreClassId]||[]).filter(function(m){return !m.isTeacher;}));
  const q=(_scoreSearchQuery||'').trim();
  const visibleMembers=q?members.filter(function(m){return m.name.includes(q);}):members;
  list.innerHTML='';
  if(!visibleMembers.length){
    list.innerHTML='<div style="text-align:center;color:var(--muted);font-size:.74rem;padding:10px">'+(q?'未找到「'+q+'」，请换个关键字':'班级暂无学生')+'</div>';
    _updateSelectAllBtn(members);return;
  }
  visibleMembers.forEach(function(s){
    const sel=_scoreSelected.has(s.name);
    const d=document.createElement('div');
    d.dataset.name=s.name;
    d.style.cssText='padding:9px 12px;border-radius:9px;border:2px solid '+(sel?'var(--green)':'var(--border)')+';background:'+(sel?'rgba(100,160,100,.1)':'var(--panel)')+';cursor:pointer;display:flex;align-items:center;justify-content:space-between;transition:all .15s';
    d.innerHTML='<div style="display:flex;align-items:center;gap:8px">'
      +'<div style="width:18px;height:18px;border-radius:5px;border:2px solid '+(sel?'var(--green)':'var(--border)')+';background:'+(sel?'var(--green)':'transparent')+';display:flex;align-items:center;justify-content:center;font-size:.7rem;color:#fff">'+(sel?'✓':'')+'</div>'
      +'<span style="font-size:.78rem;font-weight:'+(sel?'600':'400')+'">'+s.name+'</span></div>'
      +'<span style="font-size:.7rem;color:var(--muted)">⭐'+(s.score||0)+'</span>';
    d.onclick=function(){
      if(_scoreSelected.has(s.name))_scoreSelected.delete(s.name);
      else _scoreSelected.add(s.name);
      _renderScoreList();
      _updateSelectAllBtn();
    };
    list.appendChild(d);
  });
  _updateSelectAllBtn();
}

function _updateSelectAllBtn(membersOverride){
  const cd=getClassData();
  const members=membersOverride||(cd[_scoreClassId]||[]).filter(function(m){return !m.isTeacher;});
  const total=members.length;
  const btn=document.getElementById('score-select-all-btn');
  const hint=document.getElementById('score-select-hint');
  if(btn){btn.textContent=_scoreSelected.size===total&&total>0?'取消全选':'全选';}
  if(hint){hint.textContent='已选 '+_scoreSelected.size+' / '+total+' 人'+((_scoreSearchQuery||'').trim()?' (搜索中)':'');}
}

function toggleSelectAllScore(){
  const cd=getClassData();
  const members=(cd[_scoreClassId]||[]).filter(function(m){return !m.isTeacher;});
  if(_scoreSelected.size===members.length){_scoreSelected=new Set();}
  else{_scoreSelected=new Set(members.map(function(m){return m.name;}));}
  _renderScoreList();
}

function applyScoreBatch(){
  // 1. 基础空值检查
  if(!_scoreSelected.size){
    showToast('请先选择学生！');
    return;
  }
  if(!_scoreClassId){
    showToast('未指定班级！');
    return;
  }

  // 2. 严格的分值验证
  const ptsInput = document.getElementById('add-score-val').value || '';
  const pts = parseInt(ptsInput, 10);
  if(isNaN(pts) || pts < 1 || pts > 9999){
    showToast('请填写1~9999之间的有效分值！');
    return;
  }

  // 3. 获取并验证原因
  const reasonEl = document.getElementById('add-score-reason');
  const customEl = document.getElementById('score-custom-reason');
  let reason = reasonEl ? reasonEl.value : '日常表现';
  if(reason === '自定义' && customEl){
    reason = customEl.value.trim() || '日常表现';
  }

  // 4. 权限验证（教师或班级管理员才能操作）
  const admins = getClassAdmins();
  const isTeacher = S.isTeacher && (S.managedClasses || []).includes(_scoreClassId);
  const isAsstAdmin = admins[_scoreClassId] && admins[_scoreClassId].name === S.playerName;
  if(!isTeacher && !isAsstAdmin){
    showToast('你没有权限给学生加减分！');
    return;
  }

  const isAdd = _scoreMode === 'add';
  const delta = isAdd ? pts : -pts;
  const names = Array.from(_scoreSelected);
  const ico = isAdd ? '⭐' : '📉';
  const actionStr = isAdd ? `加 ${pts} 积分` : `减 ${pts} 积分`;

  openConfirm(ico, `给选中的 ${names.length} 位学生${actionStr}？\n原因：${reason}`, function(){
    const cd = getClassData();
    const accounts = getAllAccounts();
    let successCount = 0;

    // 5. 确保班级存在于数据中
    if(!cd[_scoreClassId]){
      cd[_scoreClassId] = [];
    }

    names.forEach(function(name){
      // 更新班级排名数据
      const mem = cd[_scoreClassId].find(function(m){ return m.name === name; });
      if(mem){
        mem.score = (mem.score || 0) + delta;
        successCount++;
      }

      // 更新学生账号和存档数据（完整同步）
      const acc = accounts.find(function(a){ return a.name === name && a.classId === _scoreClassId; });
      if(acc){
        acc.score = (acc.score || 0) + delta;
        // 同步更新学生本地存档
        try{
          const save = loadAccSave(acc.id);
          save.score = (save.score || 0) + delta;
          localStorage.setItem(getAccKey(acc.id), JSON.stringify(save));
        }catch(e){
          console.warn(`更新学生 ${name} 存档失败:`, e);
        }
      }
    });

    // 保存所有修改
    saveClassData(cd);
    saveAllAccounts(accounts);

    // 记录积分日志（用于额外积分排行）
    if(successCount>0){
      const log=getScoreLog(_scoreClassId);
      const ts=Date.now();
      names.forEach(function(name){
        log.push({name,pts:delta,reason,time:ts,op:isAdd?'add':'sub'});
      });
      // 只保留最近2000条
      if(log.length>2000)log.splice(0,log.length-2000);
      saveScoreLog(_scoreClassId,log);
    }

    // 关闭弹窗并刷新界面
    document.getElementById('add-score-ov').classList.remove('on');
    updateClassSection();
    
    // 显示操作结果
    if(successCount === names.length){
      showToast(`${ico} 已成功给 ${successCount} 位同学${actionStr}！`);
    }else{
      showToast(`${ico} 已处理 ${successCount}/${names.length} 位同学，部分学生未找到`);
    }
  });
}
function setClassAdmin(){
  const list=getAllAccounts();
  const acc=list.find(a=>a.id===CURRENT_ACC_ID);
  const hasPin=acc&&acc.pin;
if(!hasPin){
  openConfirm('👑',`设置自己为班级负责人？
建议先设置账号密码，负责人密码用于解散班级时验证身份。`,()=>{
    _doSetAdmin('');
  });
  return;
}

  openPinPad(S.playerName,entered=>{
    if(entered===acc.pin){
      _doSetAdmin(entered);
      document.getElementById('pin-ov').classList.remove('on');
      return true;
    }
    showToast('密码错误！');return false;
  });
}
function _doSetAdmin(pin){
  const admins=getClassAdmins();
  admins[S.classId]={name:S.playerName,pin:pin};
  saveClassAdmins(admins);
  document.getElementById('class-manage-ov').classList.remove('on');
  showToast(`✅ 已设置 ${S.playerName} 为班级负责人！`);
}
function dissolveClass(){
  const admins=getClassAdmins();
  const curAdmin=admins[S.classId];
  if(!curAdmin||curAdmin.name!==S.playerName){showToast('只有班级负责人才能解散班级');return;}
  const list=getAllAccounts();
  const acc=list.find(a=>a.id===CURRENT_ACC_ID);
  const doDissolve=()=>{
    openConfirm('💥',`确定解散【${S.classId}】？

此操作不可撤销！
班级排名数据将永久清除。`,()=>{
      const cd=getClassData();
      delete cd[S.classId];
      saveClassData(cd);
      delete admins[S.classId];
      saveClassAdmins(admins);
      // 所有该班级成员的classId清空
      const accounts=getAllAccounts();
      accounts.forEach(a=>{if(a.classId===S.classId){a.classId='';const save=localStorage.getItem(getAccKey(a.id));if(save){try{const s=JSON.parse(save);s.classId='';localStorage.setItem(getAccKey(a.id),JSON.stringify(s));}catch(e){}}}});
      saveAllAccounts(accounts);
      S.classId='';persistAccount();
      document.getElementById('class-manage-ov').classList.remove('on');
      updateProfile();
      showToast('班级已解散');
    },true);
  };
  if(curAdmin.pin){
    openPinPad(S.playerName,entered=>{
      if(entered===curAdmin.pin){document.getElementById('pin-ov').classList.remove('on');doDissolve();return true;}
      showToast('密码错误！');return false;
    });
  } else {
    doDissolve();
  }
}

// ══════════════════════════════════════════════════════════════
// ★ 全设备导入导出
// ══════════════════════════════════════════════════════════════
function exportAllSaves(){
  const accounts=getAllAccounts();
  const allSaves={};
  accounts.forEach(acc=>{
    const raw=localStorage.getItem(getAccKey(acc.id));
    if(raw)try{allSaves[acc.id]=JSON.parse(raw);}catch(e){}
  });
  const data={
    version:6,exportType:'all',
    exportTime:new Date().toISOString(),
    accounts:accounts,
    saves:allSaves,
    classData:getClassData(),
    classAdmins:getClassAdmins(),
  };
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download=`学习农场_全部存档_${new Date().toLocaleDateString('zh-CN')}.json`;
  a.click();URL.revokeObjectURL(url);
  showToast(`✅ 已导出全部${accounts.length}个账号存档！`);
}
function importAllSaves(input){
  const file=input.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=e=>{
    try{
      const data=JSON.parse(e.target.result);
      if(data.exportType!=='all'||!data.accounts||!data.saves){showToast('不是全量存档文件！');return;}
      openConfirm('📥',`导入全量存档？

包含 ${data.accounts.length} 个账号

注意：同名账号（同班级）会被跳过，不会覆盖已有数据。`,()=>{
        const existAccounts=getAllAccounts();
        let added=0,skipped=0;
        data.accounts.forEach(acc=>{
          const dup=existAccounts.find(a=>a.name===acc.name&&a.classId===acc.classId);
          if(dup){skipped++;return;}
          const newAcc={...acc,id:'acc_import_'+Date.now()+'_'+Math.random().toString(36).slice(2,6)};
          existAccounts.push(newAcc);
          const saveData=data.saves[acc.id];
          if(saveData)localStorage.setItem(getAccKey(newAcc.id),JSON.stringify(saveData));
          added++;
        });
        saveAllAccounts(existAccounts);
        // 合并班级数据
        if(data.classData){
          const curCd=getClassData();
          Object.entries(data.classData).forEach(([cls,members])=>{
            if(!curCd[cls])curCd[cls]=[];
            members.forEach(m=>{
              if(!curCd[cls].find(x=>x.name===m.name))curCd[cls].push(m);
            });
          });
          saveClassData(curCd);
        }
        if(data.classAdmins){
          const curAdmins=getClassAdmins();
          Object.entries(data.classAdmins).forEach(([cls,admin])=>{
            if(!curAdmins[cls])curAdmins[cls]=admin;
          });
          saveClassAdmins(curAdmins);
        }
        renderLoginScreen();
        showToast(`✅ 导入完成！新增${added}个账号${skipped?'，跳过'+skipped+'个重复账号':''}。`);
      });
    }catch(err){showToast('存档解析失败！请确认文件格式');}
    input.value='';
  };
  reader.readAsText(file);
}

// ─── ACHIEVEMENTS ─────────────────────────────────
function checkAchs(){let got=false;ACHS.forEach(a=>{if(!S.unlockedAch.includes(a.id)&&a.cond(S)){S.unlockedAch.push(a.id);if(!S.newAch.includes(a.id))S.newAch.push(a.id);triggerAchPop(a);gainExp(20);S.coins+=10;S.totalCoins+=10;got=true;}});if(got){updateTop();persistAccount();}const n=S.newAch.length;['bd-ach','sbd-ach'].forEach(id=>{const el=document.getElementById(id);if(!el)return;if(n>0){el.textContent=n;el.classList.add('on');}else{el.textContent='';el.classList.remove('on');}});renderAchs();}
function triggerAchPop(a){document.getElementById('ap-ico').textContent=a.ico;document.getElementById('ap-nm').textContent=a.nm;const p=document.getElementById('achpop');p.classList.add('on');setTimeout(()=>p.classList.remove('on'),3000);}

// ─── TOP BAR ──────────────────────────────────────
function updateTop(){const set=(id,v)=>{const el=document.getElementById(id);if(el)el.textContent=v;};const setW=(id,w)=>{const el=document.getElementById(id);if(el)el.style.width=w;};const mx=expForLv(S.level);const expPct=Math.min(100,S.exp/mx*100)+'%';set('dc',S.coins);set('ds',S.score);set('dlv','Lv.'+S.level);set('dexph',S.exp+'/'+mx);setW('dexp',expPct);const nm=S.playerName||(S.expBoostLeft>0?`📖×${S.expBoostLeft}`:'');set('pname',nm||'点击查看我的');const _avo=S.playerAvatar||'';const ico=_avo||( S.petLevel>=5?'🌟':S.petLevel>=3?'⭐':'🌾');const av=document.getElementById('avatar');if(av)av.textContent=ico;set('sb-pname',S.playerName||'-');set('sb-pmeta',`Lv.${S.level} · ⭐${S.score}`);set('sb-lv',`Lv.${S.level} · ${S.exp}/${mx} EXP`);setW('sb-expfill',expPct);set('sb-coins',S.coins);set('sb-score',S.score);const sbav=document.getElementById('sb-av');if(sbav)sbav.textContent=ico;const pav=document.getElementById('prof-av');if(pav)pav.textContent=ico;}

// ─── PROFILE ──────────────────────────────────────
function updateProfile(){
  const pn=document.getElementById('prof-name');
  if(pn){
    if(S.isTeacher){
      pn.innerHTML=`${S.playerName||'未命名'} <span style="font-size:.58rem;background:rgba(232,160,32,.18);color:#a06000;border-radius:5px;padding:1px 6px;vertical-align:middle;font-weight:700">👨‍🏫 教师</span>`;
    } else {
      pn.textContent=S.playerName||'未命名';
    }
  }
  const _avo2=S.playerAvatar||(S.petLevel>=5?'🌟':S.petLevel>=3?'⭐':'🌾');
  const pa=document.getElementById('prof-av');if(pa&&!pa.querySelector('img'))pa.textContent=_avo2;
  const acc2=S.totalAnswered>0?Math.round(S.totalCorrect/S.totalAnswered*100):0;
  const ps=document.getElementById('prof-stats');
  if(ps)ps.innerHTML=`<div class="ps"><div class="psv">Lv.${S.level}</div><div class="psl">等级</div></div><div class="ps"><div class="psv">${S.totalCorrect}</div><div class="psl">答对</div></div><div class="ps"><div class="psv">${S.harvests}</div><div class="psl">收获</div></div><div class="ps"><div class="psv">${S.coins}</div><div class="psl">金币</div></div><div class="ps"><div class="psv">${S.unlockedAch.length}</div><div class="psl">成就</div></div><div class="ps"><div class="psv">${acc2}%</div><div class="psl">正确率</div></div>`;

  // 学习统计：总答题、种类、累积经验、累积金币、宠物数量
  const ss=document.getElementById('study-stats');
  if(ss){
    const ownedPetCount=(S.ownedPets||['p_hamster']).length;
    const subjectsSeen=Object.keys(S.catCorrect||{}).filter(k=>(S.catCorrect[k]||0)>0).length;
    const totalExp=S.totalExp||((S.level-1)*100+(S.exp||0));
    ss.innerHTML=`
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      <div style="background:rgba(100,160,100,.07);border-radius:10px;padding:8px 10px;border:1px solid var(--border)">
        <div style="font-size:1.1rem;font-weight:700;color:var(--dgreen)">${S.totalAnswered}</div>
        <div style="font-size:.62rem;color:var(--muted)">📝 总答题数</div>
      </div>
      <div style="background:rgba(100,160,100,.07);border-radius:10px;padding:8px 10px;border:1px solid var(--border)">
        <div style="font-size:1.1rem;font-weight:700;color:var(--dgreen)">${S.totalCorrect}<span style="font-size:.7rem;color:var(--muted);font-weight:400"> · ${acc2}%</span></div>
        <div style="font-size:.62rem;color:var(--muted)">✅ 答对数 · 正确率</div>
      </div>
      <div style="background:rgba(232,160,32,.07);border-radius:10px;padding:8px 10px;border:1px solid rgba(232,160,32,.2)">
        <div style="font-size:1.1rem;font-weight:700;color:var(--gold)">${totalExp}</div>
        <div style="font-size:.62rem;color:var(--muted)">✨ 累计经验值</div>
      </div>
      <div style="background:rgba(232,160,32,.07);border-radius:10px;padding:8px 10px;border:1px solid rgba(232,160,32,.2)">
        <div style="font-size:1.1rem;font-weight:700;color:var(--gold)">${S.totalCoins||S.coins}</div>
        <div style="font-size:.62rem;color:var(--muted)">🪙 累计金币</div>
      </div>
      <div style="background:rgba(160,122,208,.07);border-radius:10px;padding:8px 10px;border:1px solid rgba(160,122,208,.2)">
        <div style="font-size:1.1rem;font-weight:700;color:var(--purple)">${ownedPetCount}</div>
        <div style="font-size:.62rem;color:var(--muted)">🐾 拥有宠物</div>
      </div>
      <div style="background:rgba(100,160,100,.07);border-radius:10px;padding:8px 10px;border:1px solid var(--border)">
        <div style="font-size:1.1rem;font-weight:700;color:var(--dgreen)">${subjectsSeen||'—'}</div>
        <div style="font-size:.62rem;color:var(--muted)">📚 答题科目数</div>
      </div>
    </div>
    <div style="margin-top:8px;font-size:.62rem;color:var(--muted);text-align:center">🔥 最高连击：${S.maxStreak} · 🌾 收获次数：${S.harvests}</div>`;
  }

  // 教师管理班级卡片 → 渲染到左栏
  const teacherCard=document.getElementById('pcard-teacher-mgr');
  if(S.isTeacher){
    let tc=teacherCard;
    if(!tc){
      tc=document.createElement('div');tc.className='card';tc.id='pcard-teacher-mgr';
      const leftCol=document.getElementById('profile-col-left');
      if(leftCol)leftCol.appendChild(tc);
    }
    const mc=S.managedClasses&&S.managedClasses.length?S.managedClasses:[];
    const clsRows=mc.map(c=>'<div style="display:flex;align-items:center;padding:7px 0;border-bottom:1px solid rgba(232,160,32,.1)">'
      +'<span style="font-size:.74rem;flex:1">🏫 <b>'+c+'</b></span>'
      +'<button onclick="openTeacherClassManage(\''+encodeURIComponent(c)+'\')" style="padding:3px 10px;border-radius:7px;border:1px solid rgba(232,160,32,.4);background:rgba(232,160,32,.1);color:#a06000;font-size:.62rem;cursor:pointer;font-family:\'Noto Sans SC\',sans-serif">⚙️ 管理</button>'
      +'</div>').join('');
    tc.innerHTML='<div class="cttl">👨‍🏫 我管理的班级</div><div style="padding:4px 0">'
      +(mc.length?clsRows:'<div style="font-size:.7rem;color:var(--muted)">暂无管理的班级</div>')+'</div>';
  } else if(teacherCard){
    teacherCard.remove();
  }
  switchProfileTab(_profileTab);
}

// ─── PROFILE TAB ──────────────────────────────────
let _profileTab='personal';
function switchProfileTab(tab){
  _profileTab=tab;
  ['personal','class'].forEach(t=>{
    const panel=document.getElementById('ppanel-'+t);
    const btn=document.getElementById('ptab-'+t);
    if(panel)panel.style.display=t===tab?'':'none';
    if(btn){
      btn.style.background=t===tab?'var(--green)':'var(--panel)';
      btn.style.color=t===tab?'#fff':'var(--muted)';
      btn.style.borderColor=t===tab?'var(--green)':'var(--border)';
      btn.style.fontWeight=t===tab?'600':'400';
    }
  });
  if(tab==='class'){updateClassSection();renderClassBrowser();}
  if(tab==='personal'){renderAccountSettings();}
}

// ─── ACH TAB ──────────────────────────────────────
const ACH_CATEGORIES={
  study:['q_first','q_c1','q_c10','q_c30','q_c60','q_c100','q_c200','q_c500','streak3','streak7','streak15','streak20','streak30','all_cats','lv5','lv10','lv20','lv35','lv50','lv75','lv100'],
  farm: ['farm_seed','farm_plant','farm_h1','farm_h10','farm_h30','farm_h60','farm_h100','expand1','expand4','coins200','coins1000','coins5000','seed5','all_seeds','red_soil','black_soil','diamond_soil','first_diamond'],
  pet:  ['pet_f1','pet_f20','pet_f50','pet_f100','pet_lv2','pet_lv5','shop_cloth','shop_pet','pet_drag','pet_drag20','pet14','skin_color','pet_3pets','pet_all','pet_3cloths','pet_allcloths','multi_evolve','custom_pet','pet_3cloths'],
  social:['class_rank','class_top3']
};
let _achTab='all';
function switchAchTab(tab){
  _achTab=tab;
  const tabs=['all','study','farm','pet','social','archive'];
  tabs.forEach(t=>{
    const el=document.getElementById('atab-'+t);
    if(!el)return;
    const isOn=t===tab;
    el.style.background=isOn?'var(--green)':'var(--panel)';
    el.style.color=isOn?'#fff':'var(--ink)';
    el.style.borderColor=isOn?'var(--green)':'var(--border)';
    el.style.fontWeight=isOn?'600':'400';
  });
  const gridWrap=document.getElementById('ach-grid-wrap');
  const archiveWrap=document.getElementById('pet-archive-wrap');
  const title=document.getElementById('ach-tab-title');
  if(tab==='archive'){
    if(gridWrap)gridWrap.style.display='none';
    if(archiveWrap)archiveWrap.style.display='';
    if(title)title.textContent='📜 宠物进化档案';
    renderPetArchive();
  } else {
    if(gridWrap)gridWrap.style.display='';
    if(archiveWrap)archiveWrap.style.display='none';
    const labels={all:'🏆 全部成就',study:'📚 学习成就',farm:'🌾 农场成就',pet:'🐾 宠物成就',social:'🏆 其他成就'};
    if(title)title.textContent=labels[tab]||'🏆 成就大厅';
    renderAchsFiltered(tab);
  }
}

function renderAchsFiltered(tab){
  const g=document.getElementById('ach-grid');if(!g)return;
  g.innerHTML='';
  let list=ACHS;
  if(tab!=='all'){
    const ids=ACH_CATEGORIES[tab]||[];
    if(tab==='social'){
      // social = ones not in any other category
      const allCatIds=Object.values(ACH_CATEGORIES).flat();
      list=ACHS.filter(a=>allCatIds.includes(a.id)||ids.includes(a.id));
      list=ACHS.filter(a=>!['study','farm','pet'].some(c=>ACH_CATEGORIES[c].includes(a.id)));
    } else {
      list=ACHS.filter(a=>ids.includes(a.id));
    }
  }
  list.forEach(a=>{
    const got=S.unlockedAch.includes(a.id);
    const d=document.createElement('div');
    d.className='ach '+(got?'got':'no');
    d.innerHTML=`<div class="aico2">${a.ico}</div><div class="anm2">${a.nm}</div><div class="adesc">${a.desc}</div>${got?'<div class="atag">✓ 已解锁</div>':''}`;
    g.appendChild(d);
  });
  const gotCount=list.filter(a=>S.unlockedAch.includes(a.id)).length;
  const ac=document.getElementById('ach-count');
  if(ac)ac.textContent=`${gotCount}/${list.length}`;
}

function renderAchs(){
  renderAchsFiltered(_achTab==='archive'?'all':_achTab);
  const allGot=S.unlockedAch.length;
  const ac=document.getElementById('ach-count');
  if(_achTab==='all'&&ac)ac.textContent=`${allGot}/${ACHS.length}`;
  const n=S.newAch.length;
  ['bd-ach','sbd-ach'].forEach(id=>{const el=document.getElementById(id);if(!el)return;if(n>0){el.textContent=n;el.classList.add('on');}else{el.textContent='';el.classList.remove('on');}});
  if(_achTab==='archive')renderPetArchive();
}

function renderPetArchive(){
  const g=document.getElementById('pet-archive-grid');if(!g)return;
  if(!S.petReachedLevels)S.petReachedLevels={};
  g.innerHTML='';
  const ownedIds=S.ownedPets||['p_hamster'];
  ownedIds.forEach(petId=>{
    const info=SHOP_PETS.find(p=>p.id===petId);if(!info)return;
    const breed=info.breed||'hamster';
    const stages=(EVO_STAGES[breed]||EVO_STAGES.hamster);
    const maxStage=stages.length;
    const reached=Math.max(S.petReachedLevels[petId]||1,S.activePet===petId?S.petLevel:1);
    const pct=Math.round((reached/maxStage)*100);
    const stageName=(stages[Math.min(reached-1,stages.length-1)]||{}).name||'未知';
    const isActive=S.activePet===petId;
    const d=document.createElement('div');
    d.style.cssText='background:var(--panel);border-radius:14px;border:2px solid '+(isActive?'var(--green)':'var(--border)')+';padding:10px;text-align:center;transition:all .2s;cursor:pointer';
    // 使用 canvas 绘制小宠物头像
    const cvs=document.createElement('canvas');
    cvs.width=64;cvs.height=64;
    cvs.style.cssText='display:block;margin:0 auto 5px;border-radius:50%;background:linear-gradient(135deg,rgba(100,180,100,.18),rgba(200,230,200,.25))';
    d.appendChild(cvs);
    // 异步绘制（避免阻塞）
    setTimeout(()=>{try{drawPetPreviewInCanvas(cvs,breed,reached);}catch(e){const c=cvs.getContext('2d');if(c){c.font='28px serif';c.textAlign='center';c.textBaseline='middle';c.fillText(info.ico,32,32);}}},0);
    const lbl=document.createElement('div');
    lbl.innerHTML=`<div style="font-size:.74rem;font-weight:700;margin-bottom:1px;color:var(--ink)">${info.name}</div>`
      +`<div style="font-size:.58rem;color:var(--dgreen);margin-bottom:4px">${isActive?'🟢 当前宠物':'　'}</div>`
      +`<div style="font-size:.62rem;color:var(--gold);font-weight:600;margin-bottom:5px">${stageName}</div>`
      +`<div style="background:rgba(100,160,100,.1);border-radius:99px;height:5px;overflow:hidden;margin-bottom:3px">`
      +`<div style="height:100%;background:linear-gradient(90deg,var(--green),var(--gold));border-radius:99px;width:${pct}%;transition:width .5s"></div></div>`
      +`<div style="font-size:.58rem;color:var(--muted)">Lv.${reached}/${maxStage} · ${pct}%</div>`;
    d.appendChild(lbl);
    if(isActive)d.style.boxShadow='0 0 0 3px rgba(100,170,100,.2)';
    g.appendChild(d);
  });
}
let nameTarget='player';
function openNameModal(t){nameTarget=t;const mttl=document.getElementById('name-mttl');if(mttl)mttl.textContent=t==='pet'?'给宠物起名字':'设置名字';const ni=document.getElementById('name-input');if(ni)ni.value=t==='pet'?(S.petName||''):(S.playerName||'');document.getElementById('name-ov').classList.add('on');setTimeout(()=>{const ni=document.getElementById('name-input');if(ni)ni.focus();},200);}
function randomName(){const ni=document.getElementById('name-input');if(!ni)return;ni.value=nameTarget==='pet'?PET_NAMES[Math.floor(Math.random()*PET_NAMES.length)]:PLAYER_NAMES[Math.floor(Math.random()*PLAYER_NAMES.length)];}
function saveName(){const v=((document.getElementById('name-input')||{}).value||'').trim();if(!v){showToast('名字不能为空！');return;}if(nameTarget==='pet'){S.petName=v;saveCurPet();persistAccount();updatePetUI();showPetTalk('rename_ok');}else{S.playerName=v;persistAccount();updateTop();const list=getAllAccounts();const acc=list.find(a=>a.id===CURRENT_ACC_ID);if(acc){acc.name=v;saveAllAccounts(list);}updateProfile();}document.getElementById('name-ov').classList.remove('on');showToast('✅ 名字已保存！');}

// ─── CONFIRM（支持取消回调）────────────────────────
let confirmCb=null,confirmCancelCb=null;
function openConfirm(ico,msg,cb,danger=false,cancelCb=null){confirmCb=cb;confirmCancelCb=cancelCb;document.getElementById('confirm-ico').textContent=ico;document.getElementById('confirm-msg').textContent=msg;const yb=document.getElementById('confirm-yes-btn');yb.className='mbtn '+(danger?'mb-danger on':'mb-ok on');openOverlay('confirm-ov');}
function confirmYes(){closeOverlay('confirm-ov');const c=confirmCb;confirmCb=null;confirmCancelCb=null;if(c)c();}
function confirmNo(){closeOverlay('confirm-ov');const c=confirmCancelCb;confirmCb=null;confirmCancelCb=null;if(c)c();}

// ─── RESULT / TOAST ───────────────────────────────
function showResult(ico,ttl,body){document.getElementById('res-ico').textContent=ico;document.getElementById('res-ttl').textContent=ttl;document.getElementById('res-body').innerHTML=typeof body==='string'?body.replace(/\n/g,'<br>'):body;document.getElementById('res-ov').classList.add('on');}
function closeResult(){document.getElementById('res-ov').classList.remove('on');}
let toastTimer=null;
function showToast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('on');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('on'),2400);}
function spawnP(emojis){for(let i=0;i<5;i++){setTimeout(()=>{const p=document.createElement('div');p.className='ptcl';p.textContent=emojis[Math.floor(Math.random()*emojis.length)];p.style.left=(25+Math.random()*50)+'vw';p.style.top=(25+Math.random()*45)+'vh';document.body.appendChild(p);setTimeout(()=>p.remove(),1300);},i*90);}}

// ─── TAB ──────────────────────────────────────────
function switchTab(name){
  ['farm','pet','shop','ach','profile'].forEach(n=>{
    (document.getElementById('page-'+n)||{classList:{toggle:function(){}}}).classList.toggle('active',n===name);
    const tb=document.getElementById('tb-'+n);if(tb)tb.classList.toggle('on',n===name);
  });
  const sbn=document.querySelector('.sb-nav');
  if(sbn){sbn.querySelectorAll('.sb-item').forEach((el,i)=>el.classList.toggle('on',['farm','pet','shop','ach','profile'][i]===name));}
  if(name==='ach'){
    S.newAch=[];persistAccount();
    ['bd-ach','sbd-ach'].forEach(id=>{const el=document.getElementById(id);if(el){el.textContent='';el.classList.remove('on');}});
    switchAchTab(_achTab||'all');
  }
  if(name==='shop')renderShop();
  if(name==='profile')updateProfile();
  if(name==='pet'){updatePetUI();if(!petAF)startPetAnim();drawPet();setTimeout(drawPet,50);setTimeout(drawPet,200);}
}

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
  // 多层次状态触发，更细腻的宠物反应
  const _rd=Math.random();
  if(S.petFood<=0){if(_rd<0.7)showPetTalk('starving');}
  else if(S.petFood<10){if(_rd<0.6)showPetTalk('critical_food');}
  else if(S.petFood<20){if(_rd<0.4)showPetTalk('low_food');}
  else if(S.petEnergy<=0){if(_rd<0.6)showPetTalk('exhausted');}
  else if(S.petEnergy<10){if(_rd<0.5)showPetTalk('critical_energy');}
  else if(S.petEnergy<15){if(_rd<0.35)showPetTalk('low_energy');}
  else if(S.petClean<10){if(_rd<0.45)showPetTalk('very_dirty');}
  else if(S.petHappy<=0){if(_rd<0.6)showPetTalk('deeply_sad');}
  else if(S.petHappy<15){if(_rd<0.4)showPetTalk('critical_happy');}
  else if(S.petHappy<25){if(_rd<0.25)showPetTalk('low_happy');}
  else if(_rd<0.08){
    // 随机触发阶段性台词
    const stageKey='stage_'+Math.min(S.petLevel,5);
    showPetTalk(stageKey);
  }
  if(S.hasAutoWater){S.plots.forEach((p,i)=>{if(['s0','s1','s2'].includes(p.s)&&!p.hasCrack&&!p.hasBug){p.lastWater=Date.now();growPlot(i,0.5);}});}
  updatePetUI();persistAccount();
}


// ══════════════════════════════════════════════════════════════
// ★ 主题切换系统 + 季节特效 + 自定义配色
// ══════════════════════════════════════════════════════════════
const THEME_DEFS={
  default:{name:'原木米白',ico:'🌾',desc:'温暖自然，清新田园风格',
    preview:['#fdf6ee','#6aaa6a','#e8a020','#9b6a3c'],body:''},
  night:{name:'星夜深蓝',ico:'🌙',desc:'深邃星空，宁静夜晚色调',
    preview:['#141820','#5a9cf0','#d4a030','#7080a0'],body:'night'},
	summer:{name:'夏海飘雪',ico:'❄️',desc:'清凉梦幻，碧海飘雪奇境',
    preview:['#f0f8ff','#0090c0','#e08000','#408090'],body:'summer'},
  autumn:{name:'秋收金橙',ico:'🍂',desc:'枫叶稻谷，丰收的暖橙秋色',
    preview:['#fdf5e8','#c06820','#d08000','#8b5020'],body:'autumn'},
  sakura:{name:'樱花粉',ico:'🌸',desc:'柔美粉嫩，浪漫樱花绽放',
    preview:['#fff5f8','#c85080','#e09020','#c08090'],body:'sakura'},
  custom:{name:'自定义',ico:'🎨',desc:'自由配色，打造专属风格',
    preview:['#fdf6ee','#6aaa6a','#e8a020','#9b6a3c'],body:'custom'},
};
let _previewTheme=null;
let _currentTheme=localStorage.getItem('jbfarm_theme')||'default';

// ── 季节特效画布 ──────────────────────────────────────────
let _seasonAF=null;
const _seasonParticles=[];
function _initSeasonCanvas(){
  const cvs=document.getElementById('season-canvas');if(!cvs)return;
  cvs.width=window.innerWidth;cvs.height=window.innerHeight;
  window.addEventListener('resize',()=>{cvs.width=window.innerWidth;cvs.height=window.innerHeight;});
}
function _clearSeasonEffect(){
  if(_seasonAF){cancelAnimationFrame(_seasonAF);_seasonAF=null;}
  _seasonParticles.length=0;
  const cvs=document.getElementById('season-canvas');
  if(cvs){const ctx=cvs.getContext('2d');if(ctx)ctx.clearRect(0,0,cvs.width,cvs.height);cvs.style.opacity='0';}
}
function _startSeasonEffect(themeId){
  _clearSeasonEffect();
  if(localStorage.getItem('jbfarm_no_fx')==='1'){
    const cvs=document.getElementById('season-canvas');if(cvs)cvs.style.opacity='0';return;
  }
  const cvs=document.getElementById('season-canvas');if(!cvs)return;
  const ctx=cvs.getContext('2d');if(!ctx)return;
  const W=()=>cvs.width,H=()=>cvs.height;

if(themeId==='summer'){
    cvs.style.opacity='1';
    // 生成65片雪花（替换原来的气泡）
    for(let i=0;i<65;i++){
        _seasonParticles.push({
            x:Math.random()*window.innerWidth,
            y:Math.random()*window.innerHeight,
            r:0.7+Math.random()*2.5,
            sp:0.25+Math.random()*0.8,
            wx:Math.sin(Math.random()*6.28)*0.45,
            a:0.25+Math.random()*0.5,
            rot:Math.random()*6.28,
            rotS:(Math.random()-.5)*0.025
        });
    }
    let waveT=0;
    const animate=()=>{
        ctx.clearRect(0,0,W(),H());
        waveT+=0.018;
        
        // 保留夏天的双层海面波浪（完全不变）
        ctx.globalAlpha=0.16;
        ctx.fillStyle='#60c0e0';
        ctx.beginPath();
        ctx.moveTo(0,H());
        for(let x=0;x<=W();x+=8){
            ctx.lineTo(x,H()-26+Math.sin(x*.013+waveT)*13+Math.cos(x*.026+waveT*.8)*5);
        }
        ctx.lineTo(W(),H());
        ctx.closePath();
        ctx.fill();
        
        ctx.globalAlpha=0.09;
        ctx.fillStyle='#a0e0f8';
        ctx.beginPath();
        ctx.moveTo(0,H());
        for(let x=0;x<=W();x+=8){
            ctx.lineTo(x,H()-14+Math.sin(x*.02+waveT*1.3)*8);
        }
        ctx.lineTo(W(),H());
        ctx.closePath();
        ctx.fill();
        
        ctx.globalAlpha=1;
        
        // 绘制雪花（替换原来的气泡绘制）
        _seasonParticles.forEach(p=>{
            p.y+=p.sp;
            p.x+=p.wx+Math.sin(p.y*.016)*0.3;
            p.rot+=p.rotS;
            
            // 雪花边界循环
            if(p.y>H()+8)p.y=-8;
            if(p.x>W()+8)p.x=-8;
            if(p.x<-8)p.x=W()+8;
            
            ctx.save();
            ctx.translate(p.x,p.y);
            ctx.rotate(p.rot);
            ctx.globalAlpha=p.a;
            
            // 微调雪花颜色，适配蓝色海面背景
            ctx.strokeStyle='#e6f7ff';
            ctx.lineWidth=0.8;
            
            // 绘制六角雪花
            for(let i=0;i<6;i++){
                ctx.save();
                ctx.rotate(i*Math.PI/3);
                ctx.beginPath();
                ctx.moveTo(0,0);
                ctx.lineTo(0,p.r*2.2);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(0,p.r*0.9);
                ctx.lineTo(p.r*0.6,p.r*1.4);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(0,p.r*0.9);
                ctx.lineTo(-p.r*0.6,p.r*1.4);
                ctx.stroke();
                ctx.restore();
            }
            
            ctx.fillStyle='#ffffff';
            ctx.beginPath();
            ctx.arc(0,0,p.r*0.4,0,Math.PI*2);
            ctx.fill();
            
            ctx.globalAlpha=1;
            ctx.restore();
        });
        
        _seasonAF=requestAnimationFrame(animate);
    };
    animate();

    

  } else if(themeId==='autumn'){
    cvs.style.opacity='1';
    for(let i=0;i<22;i++){_seasonParticles.push({x:Math.random()*window.innerWidth,y:Math.random()*window.innerHeight,sp:0.22+Math.random()*0.38,wx:(Math.random()-.5)*0.5,sz:12+Math.random()*16,a:0.35+Math.random()*0.45,rot:Math.random()*Math.PI*2,rotS:(Math.random()-.5)*0.01,hue:Math.floor(Math.random()*3)});}
    function drawMapleLeaf(ctx,sz,hue){
      const cols=['rgba(200,55,18,','rgba(220,85,15,','rgba(180,35,8,'];const col=cols[hue%3];
      const s=sz*0.42;
      ctx.beginPath();
      ctx.moveTo(0,-s*1.1);ctx.bezierCurveTo(s*0.3,-s*0.8,s*0.8,-s*0.3,s*0.6,s*0.1);
      ctx.bezierCurveTo(s*0.9,s*0.1,s*1.0,-s*0.05,s*0.85,s*0.3);ctx.bezierCurveTo(s*0.55,s*0.55,s*0.25,s*0.8,0,s*0.95);
      ctx.bezierCurveTo(-s*0.25,s*0.8,-s*0.55,s*0.55,-s*0.85,s*0.3);ctx.bezierCurveTo(-s*1.0,-s*0.05,-s*0.9,s*0.1,-s*0.6,s*0.1);
      ctx.bezierCurveTo(-s*0.8,-s*0.3,-s*0.3,-s*0.8,0,-s*1.1);ctx.closePath();
      ctx.fillStyle=col+'0.8)';ctx.fill();
      ctx.strokeStyle=col+'0.3)';ctx.lineWidth=0.6;
      ctx.beginPath();ctx.moveTo(0,-s*1.1);ctx.lineTo(0,s*0.95);ctx.stroke();
      ctx.beginPath();ctx.moveTo(0,-s*0.3);ctx.lineTo(s*0.6,s*0.1);ctx.moveTo(0,-s*0.3);ctx.lineTo(-s*0.6,s*0.1);ctx.stroke();
    }
    const animate=()=>{
      ctx.clearRect(0,0,W(),H());
      _seasonParticles.forEach(p=>{
        p.y+=p.sp;p.x+=p.wx+Math.sin(p.y*.018)*0.45;p.rot+=p.rotS;
        if(p.y>H()+20)p.y=-20;if(p.x>W()+15)p.x=-15;if(p.x<-15)p.x=W()+15;
        ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.globalAlpha=p.a;
        drawMapleLeaf(ctx,p.sz,p.hue);
        ctx.globalAlpha=1;ctx.restore();
      });
      _seasonAF=requestAnimationFrame(animate);
    };animate();
} else if(themeId==='autumn'){
    cvs.style.opacity='1';
    // 增加落叶数量+优化大小/速度范围，更自然
    for(let i=0;i<20;i++){
        _seasonParticles.push({
            x:Math.random()*window.innerWidth,
            y:Math.random()*window.innerHeight,
            sp:0.18+Math.random()*0.42,
            wx:(Math.random()-.5)*0.6,
            sz:8+Math.random()*18,
            a:0.3+Math.random()*0.5,
            rot:Math.random()*Math.PI*2,
            rotS:(Math.random()-.5)*0.015,
            hue:Math.floor(Math.random()*5) // 增加到5种渐变颜色
        });
    }

    // 重绘：自然掌状五裂枫叶
    function drawMapleLeaf(ctx,sz,hue){
        const s=sz*0.4;
        // 全新秋天调色板：从浅黄到深橙红，更温暖有层次
        const leafColors=[
            ['#fff3cd','#ffc107'], // 浅金黄
            ['#ffe0b2','#ff9800'], // 橙黄
            ['#ffcc80','#f57c00'], // 深橙
            ['#ffab91','#e64a19'], // 橙红
            ['#ef9a9a','#c62828']  // 深红
        ];
        const [light,dark]=leafColors[hue];

        ctx.save();
        // 轻微阴影增加立体感
        ctx.shadowColor='rgba(0,0,0,0.1)';
        ctx.shadowBlur=2;
        ctx.shadowOffsetY=1;

        // 渐变填充，告别单一色块
        const gradient=ctx.createRadialGradient(0,0,0,0,0,s*1.2);
        gradient.addColorStop(0,light);
        gradient.addColorStop(1,dark);
        ctx.fillStyle=gradient;

        // 流畅的五裂枫叶轮廓
        ctx.beginPath();
        ctx.moveTo(0,-s*1.2);
        ctx.bezierCurveTo(s*0.2,-s*1.0,s*0.5,-s*0.7,s*0.7,-s*0.4);
        ctx.bezierCurveTo(s*0.9,-s*0.6,s*1.1,-s*0.3,s*0.9,-s*0.1);
        ctx.bezierCurveTo(s*1.05,s*0.1,s*0.85,s*0.35,s*0.6,s*0.4);
        ctx.bezierCurveTo(s*0.75,s*0.65,s*0.5,s*0.85,s*0.25,s*0.9);
        ctx.bezierCurveTo(0,s*1.0,-s*0.25,s*0.9,-s*0.5,s*0.85);
        ctx.bezierCurveTo(-s*0.75,s*0.65,-s*0.6,s*0.4,-s*0.85,s*0.35);
        ctx.bezierCurveTo(-s*1.05,s*0.1,-s*0.9,-s*0.1,-s*0.9,-s*0.1);
        ctx.bezierCurveTo(-s*1.1,-s*0.3,-s*0.9,-s*0.6,-s*0.7,-s*0.4);
        ctx.bezierCurveTo(-s*0.5,-s*0.7,-s*0.2,-s*1.0,0,-s*1.2);
        ctx.closePath();
        ctx.fill();

        // 细淡叶脉，不抢主体
        ctx.strokeStyle='rgba(139,69,19,0.25)';
        ctx.lineWidth=0.5;
        ctx.beginPath();
        ctx.moveTo(0,-s*1.1);
        ctx.lineTo(0,s*0.85);
        ctx.moveTo(0,-s*0.6);
        ctx.lineTo(s*0.65,-s*0.3);
        ctx.lineTo(s*0.75,s*0.2);
        ctx.moveTo(0,-s*0.6);
        ctx.lineTo(-s*0.65,-s*0.3);
        ctx.lineTo(-s*0.75,s*0.2);
        ctx.stroke();

        ctx.restore();
    }

    const animate=()=>{
        ctx.clearRect(0,0,W(),H());
        _seasonParticles.forEach(p=>{
            p.y+=p.sp;
            p.x+=p.wx+Math.sin(p.y*.018+p.rot)*0.5; // 优化摆动，和旋转联动更自然
            p.rot+=p.rotS;

            if(p.y>H()+25)p.y=-25;
            if(p.x>W()+20)p.x=-20;
            if(p.x<-20)p.x=W()+20;

            ctx.save();
            ctx.translate(p.x,p.y);
            ctx.rotate(p.rot);
            ctx.globalAlpha=p.a;
            drawMapleLeaf(ctx,p.sz,p.hue);
            ctx.globalAlpha=1;
            ctx.restore();
        });
        _seasonAF=requestAnimationFrame(animate);
    };
    animate();

  } else if(themeId==='night'){
    cvs.style.opacity='1';
    for(let i=0;i<90;i++){_seasonParticles.push({x:Math.random()*window.innerWidth,y:Math.random()*window.innerHeight*0.75,r:0.4+Math.random()*1.8,twinkle:Math.random()*6.28,ts:0.015+Math.random()*0.04,base:0.2+Math.random()*0.7});}
    let shootT=0,sX=-100,sY=-100,sDx=0,sDy=0,sA=0;
    const moonX=()=>W()*0.78,moonY=50;
    const animate=()=>{
      ctx.clearRect(0,0,W(),H());
      const mg=ctx.createRadialGradient(moonX(),moonY,8,moonX(),moonY,70);mg.addColorStop(0,'rgba(220,230,255,0.12)');mg.addColorStop(1,'rgba(220,230,255,0)');ctx.fillStyle=mg;ctx.beginPath();ctx.arc(moonX(),moonY,70,0,Math.PI*2);ctx.fill();
      ctx.globalAlpha=0.55;ctx.fillStyle='#d8e8ff';ctx.beginPath();ctx.arc(moonX(),moonY,14,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
      shootT++;if(shootT>180&&Math.random()<0.012){shootT=0;sX=Math.random()*W()*0.5;sY=Math.random()*H()*0.35;sA=1;const ang=Math.PI/4+Math.random()*.4;sDx=Math.cos(ang)*7;sDy=Math.sin(ang)*4;}
      if(sA>0){ctx.save();ctx.globalAlpha=sA*0.85;ctx.strokeStyle='#c0d0ff';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(sX,sY);ctx.lineTo(sX-sDx*14,sY-sDy*14);ctx.stroke();ctx.restore();sX+=sDx;sY+=sDy;sA-=0.035;}
      _seasonParticles.forEach(p=>{p.twinkle+=p.ts;const a=p.base*(0.4+0.6*Math.sin(p.twinkle));ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=`rgba(210,225,255,${a})`;ctx.fill();});
      _seasonAF=requestAnimationFrame(animate);
    };animate();

  } else if(themeId==='sakura'){
    cvs.style.opacity='1';
    for(let i=0;i<22;i++){_seasonParticles.push({x:Math.random()*window.innerWidth,y:Math.random()*window.innerHeight,sp:0.18+Math.random()*0.35,wx:(Math.random()-.5)*0.45,sz:6+Math.random()*9,a:0.28+Math.random()*0.38,rot:Math.random()*6.28,rotS:(Math.random()-.5)*0.015});}
    const drawSakuraTree=(bx,bh,sc)=>{ctx.save();ctx.globalAlpha=0.06;ctx.strokeStyle='#7a4a60';ctx.lineWidth=sc*3;ctx.beginPath();ctx.moveTo(bx,bh);ctx.lineTo(bx,bh-sc*50);ctx.stroke();ctx.lineWidth=sc*1.5;[[bx,bh-sc*30,-0.6,sc*35],[bx,bh-sc*45,0.5,sc*28],[bx,bh-sc*50,-0.2,sc*22]].forEach(([x,y,ang,len])=>{ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(ang-Math.PI/2)*len,y+Math.sin(ang-Math.PI/2)*len);ctx.stroke();});ctx.fillStyle='rgba(255,160,190,0.1)';[[bx-sc*20,bh-sc*62,sc*28],[bx+sc*18,bh-sc*70,sc*22],[bx,bh-sc*75,sc*20]].forEach(([cx,cy,r])=>{ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();});ctx.restore();};
    const animate=()=>{
      ctx.clearRect(0,0,W(),H());drawSakuraTree(50,H(),1.1);if(W()>700)drawSakuraTree(W()-45,H(),0.88);
      _seasonParticles.forEach(p=>{p.y+=p.sp;p.x+=p.wx+Math.sin(p.y*.028)*0.35;p.rot+=p.rotS;if(p.y>H()+12)p.y=-10;if(p.x>W()+10)p.x=-10;if(p.x<-10)p.x=W()+10;ctx.save();ctx.globalAlpha=p.a;ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.beginPath();ctx.ellipse(0,0,p.sz*0.4,p.sz*0.28,0,0,Math.PI*2);ctx.fillStyle='rgba(255,170,200,0.85)';ctx.fill();ctx.globalAlpha=1;ctx.restore();});
      _seasonAF=requestAnimationFrame(animate);
    };animate();

  } else {
    const cvs=document.getElementById('season-canvas');if(cvs)cvs.style.opacity='0';
  }
}


function applyTheme(themeId,save){
  const t=THEME_DEFS[themeId];if(!t)return;
  document.body.setAttribute('data-theme',t.body||'');
  if(save){localStorage.setItem('jbfarm_theme',themeId);_currentTheme=themeId;}
  // 启动季节特效
  _initSeasonCanvas();
  _startSeasonEffect(themeId);
}

function openThemeModal(){
  const g=document.getElementById('theme-grid');if(!g)return;
  g.innerHTML='';
  Object.entries(THEME_DEFS).forEach(([id,t])=>{
    const d=document.createElement('div');
    d.className='theme-card'+(_currentTheme===id?' active':'');
    if(id==='custom'){
      d.innerHTML=`<div class="theme-preview" style="background:linear-gradient(90deg,#fdf6ee,#6aaa6a,#e8a020,#9b6a3c)"></div><div class="theme-card-name">${t.ico} ${t.name}</div><div style="font-size:.58rem;color:var(--muted);margin-top:2px">${t.desc}</div>`;
      d.onclick=()=>{
        document.querySelectorAll('.theme-card').forEach(x=>x.classList.remove('active'));
        d.classList.add('active');_previewTheme='custom';
        document.getElementById('theme-ov').classList.remove('on');
        openCustomThemeModal();
      };
    } else {
      d.innerHTML=`<div class="theme-preview">${t.preview.map(c=>`<div class="theme-preview-bar" style="background:${c}"></div>`).join('')}</div><div class="theme-card-name">${t.ico} ${t.name}</div><div style="font-size:.58rem;color:var(--muted);margin-top:2px">${t.desc}</div>`;
      d.onclick=()=>{
        document.querySelectorAll('.theme-card').forEach(x=>x.classList.remove('active'));
        d.classList.add('active');_previewTheme=id;
        applyTheme(id,false);
      };
    }
    g.appendChild(d);
  });
  _previewTheme=_currentTheme;
  // 更新特效按钮状态
  const fxBtn=document.getElementById('fx-toggle-btn');
  if(fxBtn){
    const noFx=localStorage.getItem('jbfarm_no_fx')==='1';
    fxBtn.textContent=noFx?'✨ 开启特效':'✨ 关闭特效';
    fxBtn.style.opacity=noFx?'0.55':'1';
  }
  document.getElementById('theme-ov').classList.add('on');
}

function confirmTheme(){
  if(_previewTheme){applyTheme(_previewTheme,true);}
  document.getElementById('theme-ov').classList.remove('on');
  showToast('🎨 主题已应用：'+THEME_DEFS[_currentTheme].name);
}
function cancelTheme(){
  applyTheme(_currentTheme,false);
  document.getElementById('theme-ov').classList.remove('on');
}
// 特效开关（在主题弹窗底部）
function toggleSeasonFX(){
  const off=localStorage.getItem('jbfarm_no_fx')==='1';
  localStorage.setItem('jbfarm_no_fx',off?'0':'1');
  const btn=document.getElementById('fx-toggle-btn');
  if(btn){btn.textContent=off?'✨ 关闭特效':'✨ 开启特效';btn.style.opacity=off?'1':'0.55';}
  applyTheme(_currentTheme,false);
  showToast(off?'✨ 已开启主题特效':'🚫 已关闭主题特效');
}

// ── 自定义主题 ────────────────────────────────────────────
const CUSTOM_COLOR_FIELDS=[
  {key:'bg',    label:'背景色',     desc:'页面底色'},
  {key:'panel', label:'卡片色',     desc:'卡片/弹窗底色'},
  {key:'green', label:'主题色',     desc:'按钮/高亮色'},
  {key:'gold',  label:'金色点缀',   desc:'经验条/金币'},
  {key:'ink',   label:'文字色',     desc:'正文颜色'},
  {key:'muted', label:'次要文字',   desc:'说明/提示颜色'},
];
let _customColors={};
// 自定义主题附加特效
const CUSTOM_FX_OPTIONS=[
  {id:'none',  label:'无特效',     desc:'仅配色，无动效'},
  {id:'snow',  label:'❄️ 飘雪',   desc:'轻柔小雪花'},
  {id:'petal', label:'🌸 花瓣',   desc:'粉色花瓣飘落'},
  {id:'firefly',label:'✨ 萤火虫', desc:'夜晚萤光点点'},
  {id:'leaf',  label:'🍂 落叶',   desc:'秋叶缓缓飘落'},
  {id:'stars', label:'⭐ 星空',   desc:'闪烁星星点点'},
];
let _customFX='none';

function _loadCustomColors(){
  try{const s=localStorage.getItem('jbfarm_custom_colors');if(s){const d=JSON.parse(s);_customFX=d._fx||'none';return d;}  }catch(e){}
  return {bg:'#fdf6ee',panel:'#fffcf7',green:'#6aaa6a',gold:'#e8a020',ink:'#1e1814',muted:'#9a8a72'};
}
function _saveCustomColors(c){try{localStorage.setItem('jbfarm_custom_colors',JSON.stringify({...c,_fx:_customFX}));}catch(e){}}
function _applyCustomCSSVars(c){
  const r=document.documentElement.style;
  if(c.bg)r.setProperty('--custom-bg',c.bg);
  if(c.panel)r.setProperty('--custom-panel',c.panel);
  if(c.green){r.setProperty('--custom-green',c.green);r.setProperty('--custom-dgreen',_darken(c.green,0.15));}
  if(c.gold)r.setProperty('--custom-gold',c.gold);
  if(c.ink)r.setProperty('--custom-ink',c.ink);
  if(c.muted)r.setProperty('--custom-muted',c.muted);
}
function _darken(hex,amt){
  try{const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  return '#'+[r,g,b].map(v=>Math.max(0,Math.round(v*(1-amt))).toString(16).padStart(2,'0')).join('');}catch(e){return hex;}
}

// 自定义主题的特效复用现有引擎
function _applyCustomFX(fxId){
  const fxMap={snow:'winter',petal:'spring',leaf:'autumn',stars:'night',firefly:'_firefly'};
  const themeKey=fxMap[fxId];
  if(!themeKey||fxId==='none'){_clearSeasonEffect();const cvs=document.getElementById('season-canvas');if(cvs)cvs.style.opacity='0';return;}
  if(fxId==='firefly'){_startFireflyFX();return;}
  _startSeasonEffect(themeKey);
}

function _startFireflyFX(){
  _clearSeasonEffect();
  const cvs=document.getElementById('season-canvas');if(!cvs)return;
  const ctx=cvs.getContext('2d');if(!ctx)return;
  cvs.style.opacity='1';
  const W=()=>cvs.width,H=()=>cvs.height;
  for(let i=0;i<40;i++){_seasonParticles.push({x:Math.random()*window.innerWidth,y:Math.random()*window.innerHeight,r:1.5+Math.random()*2,pulse:Math.random()*6.28,ps:0.04+Math.random()*0.06,vx:(Math.random()-.5)*0.6,vy:(Math.random()-.5)*0.5});}
  const animate=()=>{
    ctx.clearRect(0,0,W(),H());
    _seasonParticles.forEach(p=>{
      p.x+=p.vx;p.y+=p.vy;p.pulse+=p.ps;
      if(p.x<0)p.x=W();if(p.x>W())p.x=0;if(p.y<0)p.y=H();if(p.y>H())p.y=0;
      const a=(0.4+0.6*Math.sin(p.pulse))*0.7;
      const grd=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.r*4);
      grd.addColorStop(0,`rgba(200,255,150,${a})`);grd.addColorStop(1,'rgba(200,255,150,0)');
      ctx.fillStyle=grd;ctx.beginPath();ctx.arc(p.x,p.y,p.r*4,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=`rgba(240,255,200,${a*1.2})`;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();
    });
    _seasonAF=requestAnimationFrame(animate);
  };animate();
}

function openCustomThemeModal(){
  _customColors=_loadCustomColors();
  // 渲染颜色行
  const rows=document.getElementById('custom-color-rows');if(!rows)return;
  rows.innerHTML='';
  CUSTOM_COLOR_FIELDS.forEach(f=>{
    const val=_customColors[f.key]||'#888888';
    const row=document.createElement('div');
    row.style.cssText='display:flex;align-items:center;gap:8px;margin-bottom:9px';
    row.innerHTML=`<input type="color" value="${val}" id="cclr-${f.key}" oninput="onCustomColorChange('${f.key}',this.value)" style="width:36px;height:28px;border:none;border-radius:6px;cursor:pointer;padding:0;background:none">`
      +`<div style="flex:1"><div style="font-size:.72rem;font-weight:600">${f.label}</div><div style="font-size:.58rem;color:var(--muted)">${f.desc}</div></div>`
      +`<span id="cclr-val-${f.key}" style="font-size:.6rem;color:var(--muted);font-family:monospace">${val}</span>`;
    rows.appendChild(row);
  });
  // 渲染特效选择器（替代原预设）
  const presetList=document.getElementById('custom-preset-list');
  if(presetList){
    presetList.innerHTML='';
    CUSTOM_FX_OPTIONS.forEach(fx=>{
      const b=document.createElement('div');
      b.style.cssText=`padding:5px 10px;border-radius:8px;border:1.5px solid ${_customFX===fx.id?'var(--green)':'var(--border)'};background:${_customFX===fx.id?'rgba(100,160,100,.12)':'var(--panel)'};font-size:.62rem;cursor:pointer;color:${_customFX===fx.id?'var(--dgreen)':'var(--ink)'};transition:all .15s`;
      b.title=fx.desc;
      b.textContent=fx.label;
      b.onclick=()=>{
        _customFX=fx.id;
        presetList.querySelectorAll('div').forEach(x=>{x.style.borderColor='var(--border)';x.style.background='var(--panel)';x.style.color='var(--ink)';});
        b.style.borderColor='var(--green)';b.style.background='rgba(100,160,100,.12)';b.style.color='var(--dgreen)';
        _applyCustomFX(fx.id);
      };
      presetList.appendChild(b);
    });
  }
  _updateCustomPreview();
  document.getElementById('custom-theme-ov').classList.add('on');
}
function onCustomColorChange(key,val){
  _customColors[key]=val;
  const sp=document.getElementById('cclr-val-'+key);if(sp)sp.textContent=val;
  _updateCustomPreview();
}
function _updateCustomPreview(){
  const c=_customColors;
  const set=(id,style,val)=>{const el=document.getElementById(id);if(el)el.style[style]=val;};
  set('cpv-topbar','background',c.panel||'#fff');set('cpv-topbar','borderBottom','1px solid '+(c.muted||'#aaa')+'44');
  set('cpv-avatar-bg','background',(c.green||'#6aaa6a')+'33');
  const cpvName=document.getElementById('cpv-name');if(cpvName)cpvName.style.color=c.ink||'#333';
  set('cpv-chip','background',(c.green||'#6aaa6a')+'15');set('cpv-chip','color',c.muted||'#888');
  const cardEl=document.getElementById('cpv-card');if(cardEl){cardEl.style.background=c.panel||'#fff';cardEl.style.borderColor=(c.muted||'#aaa')+'44';}
  const ct=document.getElementById('cpv-card-title');if(ct)ct.style.color=c.ink||'#333';
  set('cpv-bar-bg','background',(c.muted||'#aaa')+'22');
  set('cpv-bar-fill','background',`linear-gradient(90deg,${c.green||'#6a6'},${c.gold||'#e8a'})`);
  const cm=document.getElementById('cpv-muted');if(cm)cm.style.color=c.muted||'#888';
  const btnMain=document.getElementById('cpv-btn-main');if(btnMain){btnMain.style.background=c.green||'#6aaa6a';btnMain.style.color='#fff';}
  const btnSub=document.getElementById('cpv-btn-sub');if(btnSub){btnSub.style.borderColor=(c.muted||'#aaa')+'88';btnSub.style.color=c.muted||'#888';btnSub.style.background='transparent';}
  const logoArea=document.getElementById('cpv-logo-area');if(logoArea){logoArea.style.background=c.bg||'#fdf6ee';logoArea.style.borderColor=(c.muted||'#aaa')+'33';}
  const lt=document.getElementById('cpv-logo-text');if(lt)lt.style.color=c.ink||'#333';
  const box=document.getElementById('custom-preview-box');if(box)box.style.background=c.bg||'#fdf6ee';
}
function saveCustomTheme(){
  _saveCustomColors(_customColors);
  _applyCustomCSSVars(_customColors);
  applyTheme('custom',true);
  if(_customFX!=='none')_applyCustomFX(_customFX);
  document.getElementById('custom-theme-ov').classList.remove('on');
  showToast('🎨 自定义主题已保存！');
}
function closeCustomTheme(){
  document.getElementById('custom-theme-ov').classList.remove('on');
  applyTheme(_currentTheme,false);
}

// ══════════════════════════════════════════════════════════════
// ★ 系统衣服大小/位置调整
// ══════════════════════════════════════════════════════════════
function openSystemClothAdjust(){
  if(!S.equippedCloth&&!S.ownedClothes.length){showToast('请先购买并装备一件衣服');return;}
  // 如果没装备衣服但有衣服，询问选哪件
  const cid=S.equippedCloth||S.ownedClothes[0];
  if(!cid){showToast('请先购买衣服');return;}
  const key='jbfarm_clothsys_'+cid;
  const raw=localStorage.getItem(key);
  const p=raw?JSON.parse(raw):{offsetX:0,offsetY:0,scale:100,rotation:0};
  const sc=document.getElementById('cloth-adj-scale');
  const ox=document.getElementById('cloth-adj-ox');
  const oy=document.getElementById('cloth-adj-oy');
  const rot=document.getElementById('cloth-adj-rot');
  if(sc){sc.value=p.scale||100;const sv=document.getElementById('cloth-adj-scale-val');if(sv)sv.textContent=(p.scale||100)+'%';}
  if(ox)ox.value=p.offsetX||0;
  if(oy)oy.value=p.offsetY||0;
  if(rot){rot.value=p.rotation||0;const rv=document.getElementById('cloth-adj-rot-val');if(rv)rv.textContent=(p.rotation||0)+'°';}
  // 显示当前调整的衣服名称
  const cl=window.SHOP_CLOTHES&&SHOP_CLOTHES.find(c=>c.id===cid);
  const adjTtl=document.getElementById('cloth-adj-ov')&&document.querySelector('#cloth-adj-ov .mttl');
  if(adjTtl)adjTtl.textContent='👗 调整衣服：'+(cl?cl.name:cid);
  // Reset drag state before reinit
  const _adjCvs=document.getElementById('cloth-adj-canvas');
  if(_adjCvs)_adjCvs._dragInited=false;
  reClothAdjPreview();
  openOverlay('cloth-adj-ov');
  setTimeout(()=>_initClothAdjDrag(),100);
}

function _initClothAdjDrag(){
  const cvs=document.getElementById('cloth-adj-canvas');if(!cvs||cvs._dragInited)return;
  cvs._dragInited=true;
  let dragging=false,startX=0,startY=0,baseOx=0,baseOy=0;
  const onDown=e=>{
    dragging=true;
    const t=e.touches?e.touches[0]:e;
    startX=t.clientX;startY=t.clientY;
    baseOx=parseInt((document.getElementById('cloth-adj-ox')||{}).value||0);
    baseOy=parseInt((document.getElementById('cloth-adj-oy')||{}).value||0);
    e.preventDefault();
  };
  const onMove=e=>{
    if(!dragging)return;
    const t=e.touches?e.touches[0]:e;
    const dx=t.clientX-startX,dy=t.clientY-startY;
    const r=cvs.getBoundingClientRect();
    const scale=cvs.width/r.width;
    const nox=Math.max(-40,Math.min(40,baseOx+dx*scale));
    const noy=Math.max(-40,Math.min(40,baseOy+dy*scale));
    const oxEl=document.getElementById('cloth-adj-ox'),oyEl=document.getElementById('cloth-adj-oy');
    if(oxEl)oxEl.value=Math.round(nox);
    if(oyEl)oyEl.value=Math.round(noy);
    reClothAdjPreview();
    e.preventDefault();
  };
  const onUp=()=>{dragging=false;};
  cvs.addEventListener('mousedown',onDown);
  cvs.addEventListener('touchstart',onDown,{passive:false});
  document.addEventListener('mousemove',onMove);
  document.addEventListener('touchmove',onMove,{passive:false});
  document.addEventListener('mouseup',onUp);
  document.addEventListener('touchend',onUp);
}

function reClothAdjPreview(){
  const cvs=document.getElementById('cloth-adj-canvas');if(!cvs)return;
  const ctx=cvs.getContext('2d');
  const cx=cvs.width/2,cy=cvs.height/2;
  ctx.clearRect(0,0,cvs.width,cvs.height);
  const cid=S.equippedCloth||S.ownedClothes[0];
  if(!cid)return;

  const sc=parseInt((document.getElementById('cloth-adj-scale')||{}).value||100)/100;
  const ox=parseInt((document.getElementById('cloth-adj-ox')||{}).value||0);
  const oy=parseInt((document.getElementById('cloth-adj-oy')||{}).value||0);
  const scaleVal=document.getElementById('cloth-adj-scale-val');
  if(scaleVal)scaleVal.textContent=Math.round(sc*100)+'%';

  // 获取自定义宠物图片
  const petImgKey=getCustomPetImgKey();
  const petImgData=localStorage.getItem(petImgKey);
  const stage=getEvoStage?applySkinStage(getEvoStage()):null;
  const breed=S.petBreed||'hamster';

  function _drawClothLayer(){
    // 自定义衣服图片
    const clothKey=getCustomClothImgKey();
    const clothData=S.equippedCloth?_getClothImgDataWithScope(clothKey):null;
    if(clothData){
      loadCustomPetImg(clothKey,function(cimg){
        if(!cimg)return;
        // 应用当前滑块参数绘制衣服
        const canvasW=cvs.width;
        const raw=localStorage.getItem(clothKey+'_param');
        const p=raw?JSON.parse(raw):{scale:0.8,offX:0,offY:0,rotation:0};
        const baseSize=Math.round(canvasW*(p.scale!=null?p.scale:0.8));
        const adjustedSize=Math.round(baseSize*sc);
        const dx=cx+(p.offX||0)+ox;
        const dy=cy+(p.offY||0)+oy;
        ctx.save();
        ctx.drawImage(cimg,dx-adjustedSize/2,dy-adjustedSize/2,adjustedSize,adjustedSize);
        ctx.restore();
      });
    } else {
      // 系统衣服：用当前滑块参数临时覆盖存档绘制
      const tmpKey='jbfarm_clothsys_'+cid;
      const savedParam=localStorage.getItem(tmpKey);
      const rot2=parseFloat((document.getElementById('cloth-adj-rot')||{}).value||0)*Math.PI/180;
      localStorage.removeItem(tmpKey);
      try{
        ctx.save();
        ctx.translate(cx+ox,cy+oy);
        if(rot2!==0)ctx.rotate(rot2);
        ctx.scale(sc,sc);ctx.translate(-cx,-cy);
        drawCloth(ctx,cx,cy,cid);
        ctx.restore();
      }catch(e){}
      if(savedParam)localStorage.setItem(tmpKey,savedParam);
    }
  }

  if(petImgData){
    loadCustomPetImg(petImgKey,function(img){
      if(!img){
        if(stage){try{drawPetBreed(ctx,breed,cx,cy,stage);}catch(e){}}
        _drawClothLayer();return;
      }
      ctx.clearRect(0,0,cvs.width,cvs.height);
      // 按保存的宠物图片参数绘制
      try{
        const raw=localStorage.getItem(petImgKey+'_param');
        const p=raw?JSON.parse(raw):{scale:0.8,offX:0,offY:0,rotation:0};
        const size=Math.round(cvs.width*(p.scale!=null?p.scale:0.8));
        const dx=cx+(p.offX||0),dy=cy+(p.offY||0);
        const rot=(p.rotation||0)*Math.PI/180;
        if(rot!==0){ctx.save();ctx.translate(dx,dy);ctx.rotate(rot);ctx.drawImage(img,-size/2,-size/2,size,size);ctx.restore();}
        else{ctx.drawImage(img,dx-size/2,dy-size/2,size,size);}
      }catch(e){}
      _drawClothLayer();
    });
  } else {
    if(stage){try{drawPetBreed(ctx,breed,cx,cy,stage);}catch(e){}}
    _drawClothLayer();
  }
}

function confirmClothAdj(){
  const cid=S.equippedCloth||S.ownedClothes[0];
  if(!cid)return;
  const key='jbfarm_clothsys_'+cid;
  const sc=parseInt((document.getElementById('cloth-adj-scale')||{}).value||100);
  const ox=parseInt((document.getElementById('cloth-adj-ox')||{}).value||0);
  const oy=parseInt((document.getElementById('cloth-adj-oy')||{}).value||0);
  const rot=parseFloat((document.getElementById('cloth-adj-rot')||{}).value||0);
  localStorage.setItem(key,JSON.stringify({scale:sc,offsetX:ox,offsetY:oy,rotation:rot}));
  closeOverlay('cloth-adj-ov');
  drawPet();
  showToast('✅ 衣服位置已保存！');
}

function togglePetModelPreview(){
  const mw=document.getElementById('pet-preview-model-wrap');if(!mw)return;
  const showing=mw.style.display!=='none';
  mw.style.display=showing?'none':'';
  if(!showing)rePetPreview();
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
  (document.getElementById('pause-ov')||{}).classList.remove('on');
  renderFarm();updatePetUI();updateTop();renderAchs();checkAchs();renderSubjectBars();startPetAnim();updateProfile();switchTab('farm');
  _loadProfileImgIfAny();
  const _savedTheme=localStorage.getItem('jbfarm_theme')||'default';
  // 若是自定义主题，先恢复CSS变量再应用主题
  if(_savedTheme==='custom'){_applyCustomCSSVars(_loadCustomColors());}
  _initSeasonCanvas();
  applyTheme(_savedTheme,false);
  // 更新行走开关UI
  const tog=document.getElementById('walk-toggle'),ico=document.getElementById('walk-ico'),lbl=document.getElementById('walk-lbl');
  if(tog)tog.classList.remove('on');if(ico)ico.textContent='🧍';if(lbl)lbl.textContent='立正模式';
}

(function init(){
  renderLoginScreen();
  // 登录页也应用主题特效
  const _t=localStorage.getItem('jbfarm_theme')||'default';
  if(_t==='custom'){try{_applyCustomCSSVars(_loadCustomColors());}catch(e){}}
  document.body.setAttribute('data-theme',(THEME_DEFS[_t]||{}).body||'');
  _initSeasonCanvas();_startSeasonEffect(_t);
  setInterval(naturalDecay,60000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&CURRENT_ACC_ID){if(!petAF)startPetAnim();else setTimeout(drawPet,100);}});
})();


function toggleTeacherRank(){S.teacherParticipateRank=!S.teacherParticipateRank;if(S.classId){const cd=getClassData();if(cd[S.classId]){const m=cd[S.classId].find(x=>x.name===S.playerName);if(m)m.hideFromRank=!S.teacherParticipateRank;saveClassData(cd);}}persistAccount();updateClassSection();showToast(S.teacherParticipateRank?'✅ 已开启参与排名':'已关闭参与排名');}

// ========== 班级管理增强功能 ==========
// 导出班级学生名单
function exportClassList(encodedClassName){
  const className = decodeURIComponent(encodedClassName);
  const cd = getClassData();
  const members = cd[className] || [];
  const students = members.filter(m=>!m.isTeacher);
  
  if(students.length===0){
    showToast('班级暂无学生，无法导出');
    return;
  }

  // 生成CSV内容
  let csvContent = '姓名,班级,等级,积分,密码\n';
  const accounts = getAllAccounts();
  students.forEach(s=>{
    const acc = accounts.find(a=>a.name===s.name && a.classId===className);
    const pin = (acc||{}).pin || '未设置';
    csvContent += `${s.name},${className},${s.level||1},${s.score||0},${pin}\n`;
  });

  // 下载文件
  const blob = new Blob(['\ufeff' + csvContent], {type:'text/csv;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${className}_学生名单_${new Date().toLocaleDateString('zh-CN')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast(`✅ 已导出${students.length}名学生名单`);
}

// 批量重置班级学生密码（清空密码）
function batchResetStudentPin(encodedClassName){
  const className = decodeURIComponent(encodedClassName);
  openConfirm('🔓',`确定重置【${className}】所有学生的密码？\n重置后学生账号将无密码，可直接登录`,()=>{
    const accounts = getAllAccounts();
    let resetCount = 0;
    accounts.forEach(acc=>{
      if(acc.classId===className && !acc.isTeacher && acc.pin){
        acc.pin = '';
        resetCount++;
      }
    });
    saveAllAccounts(accounts);
    showToast(`✅ 已重置${resetCount}名学生的密码`);
  },true);
}

// 清空班级学生数据
function clearClassStudents(encodedClassName){
  const className = decodeURIComponent(encodedClassName);
  openConfirm('💥',`确定清空【${className}】的所有学生数据？\n此操作仅移除班级排名，不会删除学生本地账号！`,()=>{
    const cd = getClassData();
    if(cd[className]){
      // 保留教师，清空学生
      const teachers = cd[className].filter(m=>m.isTeacher);
      cd[className] = teachers;
      saveClassData(cd);
    }
    renderTeacherClassView();
    showToast('✅ 班级学生数据已清空');
  },true);
}

// ══════════════════════════════════════════════════════════════
// ★ 拖拽布局调整系统（桌面端）
// ══════════════════════════════════════════════════════════════
const LAYOUT_KEY='jbfarm_layout_v2';
let _layoutEditMode=false;

function getLayoutConfig(){
  try{return JSON.parse(localStorage.getItem(LAYOUT_KEY)||'{}');}
  catch(e){return {};}
}
function saveLayoutConfig(cfg){
  try{localStorage.setItem(LAYOUT_KEY,JSON.stringify(cfg));}catch(e){}
}

// ── 卡片拖拽交换列 ────────────────────────────────────────
let _dragCard=null,_dragOver=null;
function _initCardDrag(){
  // 两个面板都支持拖拽换栏：个人面板 + 班级面板
  ['profile-personal-grid','profile-class-grid'].forEach(gridId=>{
    const grid=document.getElementById(gridId);if(!grid)return;
    grid.querySelectorAll('.card[id]').forEach(card=>{
      if(card.dataset.draggable==='true')return;
      card.dataset.draggable='true';
      card.setAttribute('draggable','true');
      card.addEventListener('dragstart',e=>{
        if(!_layoutEditMode){e.preventDefault();return;}
        _dragCard=card;card.style.opacity='.5';e.dataTransfer.effectAllowed='move';
      });
      card.addEventListener('dragend',()=>{card.style.opacity='';_dragCard=null;_dragOver=null;_clearDropHints();});
      card.addEventListener('dragover',e=>{
        if(!_layoutEditMode||!_dragCard||_dragCard===card)return;
        e.preventDefault();e.dataTransfer.dropEffect='move';
        if(_dragOver!==card){_dragOver=card;_clearDropHints();card.style.outline='2px dashed var(--green)';}
      });
      card.addEventListener('dragleave',()=>{card.style.outline='';_dragOver=null;});
      card.addEventListener('drop',e=>{
        e.preventDefault();if(!_dragCard||_dragCard===card)return;
        const pA=_dragCard.parentElement,pB=card.parentElement;
        const nA=_dragCard.nextSibling,nB=card.nextSibling;
        if(nB===_dragCard){pA.insertBefore(card,_dragCard);}
        else if(nA===card){pB.insertBefore(_dragCard,card);}
        else{pA.insertBefore(card,nA);pB.insertBefore(_dragCard,nB);}
        card.style.outline='';_dragCard.style.opacity='';
        _saveCardOrder();showToast('✅ 卡片已移动');
      });
    });
  });
}
function _clearDropHints(){
  document.querySelectorAll('.card[id]').forEach(c=>c.style.outline='');
}
function _saveCardOrder(){
  const cfg=getLayoutConfig();
  cfg.profileCardOrder={};
  ['profile-personal-grid','profile-class-grid'].forEach(gridId=>{
    const grid=document.getElementById(gridId);if(!grid)return;
    const cols=grid.querySelectorAll('[id$="-col-left"],[id$="-col-right"],[id^="profile-"][id$="left"],[id^="profile-"][id$="right"]');
    const leftId=gridId==='profile-personal-grid'?'profile-col-left':'profile-class-col-left';
    const rightId=gridId==='profile-personal-grid'?'profile-col-right':'profile-class-col-right';
    const leftCol=document.getElementById(leftId);const rightCol=document.getElementById(rightId);
    if(!leftCol||!rightCol)return;
    cfg.profileCardOrder[gridId]={
      left:[...leftCol.querySelectorAll('.card[id]')].map(c=>c.id),
      right:[...rightCol.querySelectorAll('.card[id]')].map(c=>c.id)
    };
  });
  saveLayoutConfig(cfg);
}
function _restoreCardOrder(){
  const cfg=getLayoutConfig();const order=cfg.profileCardOrder;if(!order)return;
  ['profile-personal-grid','profile-class-grid'].forEach(gridId=>{
    const gridOrder=order[gridId];if(!gridOrder)return;
    const grid=document.getElementById(gridId);if(!grid)return;
    const leftId=gridId==='profile-personal-grid'?'profile-col-left':'profile-class-col-left';
    const rightId=gridId==='profile-personal-grid'?'profile-col-right':'profile-class-col-right';
    const leftCol=document.getElementById(leftId);const rightCol=document.getElementById(rightId);
    if(!leftCol||!rightCol)return;
    const allCards={};grid.querySelectorAll('.card[id]').forEach(c=>allCards[c.id]=c);
    (gridOrder.left||[]).forEach(id=>{if(allCards[id])leftCol.appendChild(allCards[id]);});
    (gridOrder.right||[]).forEach(id=>{if(allCards[id])rightCol.appendChild(allCards[id]);});
  });
}

// 初始化所有页面的 resize handles
function _initResizeHandles(){
  _makeHorizHandle('page-farm','.farm-main-grid','farm');
  _makeHorizHandle('page-pet','.dpet','pet');
  _initCardHeightHandles();
  _initCardDrag();
}

function _initCardHeightHandles(){
  const cfg=getLayoutConfig();
  document.querySelectorAll('.page .card').forEach((card,i)=>{
    if(card.querySelector('.card-vhandle'))return;
    const cid='card_h_'+i+'_'+(card.id||card.parentElement.id||i);
    if(cfg[cid])card.style.minHeight=cfg[cid];
    const handle=document.createElement('div');
    handle.className='card-vhandle';
    // 底部拖动条：明显的带纹路分隔线
    handle.style.cssText='height:12px;cursor:row-resize;border-radius:0 0 8px 8px;margin:-6px -11px -11px;display:none;position:relative;background:transparent;overflow:hidden';
    handle.innerHTML='<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center"><div style="width:36px;height:4px;border-radius:99px;background:rgba(100,160,100,.35);transition:background .2s"></div></div>';
    handle.title='拖动调整卡片高度';
    card.appendChild(handle);
    let startY=0,startH=0;
    const innerBar=handle.querySelector('div div');
    const onDown=e=>{
      if(!_layoutEditMode)return;e.preventDefault();
      startY=e.clientY||(e.touches&&e.touches[0].clientY)||0;
      startH=card.offsetHeight;
      if(innerBar)innerBar.style.background='rgba(100,160,100,.75)';
      document.addEventListener('mousemove',onMove);
      document.addEventListener('touchmove',onMoveT,{passive:false});
      document.addEventListener('mouseup',onUp);
      document.addEventListener('touchend',onUp);
    };
    const onMove=e=>{
      const dy=(e.clientY||(e.touches&&e.touches[0].clientY)||startY)-startY;
      card.style.minHeight=Math.max(60,startH+dy)+'px';
    };
    const onMoveT=e=>{e.preventDefault();onMove(e);};
    const onUp=()=>{
      if(innerBar)innerBar.style.background='rgba(100,160,100,.35)';
      document.removeEventListener('mousemove',onMove);
      document.removeEventListener('touchmove',onMoveT);
      document.removeEventListener('mouseup',onUp);
      document.removeEventListener('touchend',onUp);
      const cfg2=getLayoutConfig();cfg2[cid]=card.style.minHeight;saveLayoutConfig(cfg2);
    };
    handle.addEventListener('mousedown',onDown);
    handle.addEventListener('touchstart',onDown,{passive:false});
  });
}

function _makeHorizHandle(pageId, gridSel, key){
  const page=document.getElementById(pageId);if(!page)return;
  const grid=page.querySelector(gridSel);if(!grid)return;
  if(grid.querySelector('.resize-handle'))return;
  grid.style.position='relative';
  const handle=document.createElement('div');
  handle.className='resize-handle resize-handle-h';
  handle.title='← 拖动调整左右比例 →';
  // 让分隔线更明显：带箭头提示
  handle.innerHTML='<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:2px;pointer-events:none"><div style="font-size:10px;opacity:.6;line-height:1">◀</div><div style="width:2px;height:30px;border-radius:99px;background:currentColor;opacity:.4"></div><div style="font-size:10px;opacity:.6;line-height:1">▶</div></div>';
  _positionHandle(handle,grid);
  grid.appendChild(handle);

  let startX=0;
  const onDown=(e)=>{
    if(!_layoutEditMode)return;e.preventDefault();
    startX=e.clientX||(e.touches&&e.touches[0].clientX)||0;
    handle.classList.add('dragging');
    document.addEventListener('mousemove',onMove);
    document.addEventListener('touchmove',onMoveT,{passive:false});
    document.addEventListener('mouseup',onUp);
    document.addEventListener('touchend',onUp);
  };
  const onMove=(e)=>{
    const dx=(e.clientX||(e.touches&&e.touches[0].clientX)||startX)-startX;
    const totalW=grid.offsetWidth;
    const baseW=totalW/2;
    const newLeftPx=Math.max(120,Math.min(totalW-120,baseW+dx));
    const fr1=newLeftPx/totalW;
    grid.style.gridTemplateColumns=`${fr1.toFixed(3)}fr ${(1-fr1).toFixed(3)}fr`;
    _positionHandle(handle,grid);
  };
  const onMoveT=(e)=>{e.preventDefault();onMove(e);};
  const onUp=()=>{
    handle.classList.remove('dragging');
    document.removeEventListener('mousemove',onMove);
    document.removeEventListener('touchmove',onMoveT);
    document.removeEventListener('mouseup',onUp);
    document.removeEventListener('touchend',onUp);
    const cfg=getLayoutConfig();cfg[key]=grid.style.gridTemplateColumns;saveLayoutConfig(cfg);
    showToast('✅ 布局已保存');
  };
  handle.addEventListener('mousedown',onDown);
  handle.addEventListener('touchstart',onDown,{passive:false});
}

function _positionHandle(handle,grid){
  const cols=getComputedStyle(grid).gridTemplateColumns.split(' ');
  if(cols.length>=2){handle.style.left=parseFloat(cols[0])+'px';}
  else{handle.style.left='50%';}
}

function applyLayoutConfig(){
  const cfg=getLayoutConfig();
  const apply=(pageId,sel,val)=>{if(!val)return;const p=document.getElementById(pageId);if(!p)return;const g=p.querySelector(sel);if(g)g.style.gridTemplateColumns=val;};
  apply('page-farm','.farm-main-grid',cfg.farm);
  apply('page-pet','.dpet',cfg.pet);
  setTimeout(_restoreCardOrder,50);
}

function toggleLayoutEditMode(){
  _layoutEditMode=!_layoutEditMode;
  const btn=document.getElementById('layout-edit-btn');
  const pages=document.getElementById('pages');
  if(btn){
    btn.textContent=_layoutEditMode?'✅ 完成调整':'⚙️ 调整布局';
    btn.classList.toggle('active',_layoutEditMode);
    btn.title=_layoutEditMode?'点击完成，拖动分隔线或卡片底边调整':'点击进入布局调整模式';
  }
  if(pages)pages.classList.toggle('layout-edit-mode',_layoutEditMode);
  if(_layoutEditMode){
    _initResizeHandles();
    document.querySelectorAll('.card-vhandle').forEach(h=>{h.style.display='block';});
    document.querySelectorAll('.resize-handle').forEach(h=>{h.style.color='var(--green)';});
    // 显示操作提示
    showToast('💡 拖动底部小横条调高度 · 拖卡片换栏位 · 拖中线调宽度');
  } else {
    document.querySelectorAll('.card-vhandle').forEach(h=>h.style.display='none');
  }
}

function resetLayout(){
  localStorage.removeItem(LAYOUT_KEY);
  ['page-farm','page-pet'].forEach(pid=>{
    const p=document.getElementById(pid);if(!p)return;
    ['dtwo','dpet','farm-main-grid'].forEach(cls=>{const g=p.querySelector('.'+cls);if(g)g.style.gridTemplateColumns='';});
  });
  showToast('已恢复默认布局');
}

function openLayoutEdit(){toggleLayoutEditMode();}
function saveLayoutEdit(){}

(function(){setTimeout(()=>{applyLayoutConfig();_initResizeHandles();},300);})();
