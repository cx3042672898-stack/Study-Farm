// ══════════════════════════════════════════════════════════════
//  科目注册中心  subjects.js  v2  (支持模块化子题库)
//
//  ★ 如何添加新科目：
//    1. 在 SUBJECTS 数组追加科目信息
//    2. 在 SUBJECT_MODULES 追加对应模块结构
//    3. 新建模块题库文件，定义各 qbKey 变量
//    4. 在 index.html 的 <script> 区域引入该文件
//
//  ★ 模块系统说明：
//    - 每个科目可注册若干"分组"，每组包含若干"模块"
//    - 每个模块有独立 qbKey（对应 window[qbKey] 数组）
//    - ACTIVE_MODULE_ID = null 时使用科目主题库（全部题）
// ══════════════════════════════════════════════════════════════

// ── 持久化模块状态 ─────────────────────────────────────────────
window.ACTIVE_MODULE_ID    = localStorage.getItem('jbfarm_module')       || null;
window.ACTIVE_MODULE_LABEL = localStorage.getItem('jbfarm_module_label') || '';

// ── 科目列表 ──────────────────────────────────────────────────
window.SUBJECTS = [

  { id:'teacher',  name:'教师编制',  icon:'📚', color:'#5a9a5a',
    desc:'教育学、教育心理学、普通心理学、小三门',
    qbKey: null },

  { id:'geo7',     name:'七年级地理', icon:'🌏', color:'#2a88d8',
    desc:'地球地图、陆地海洋、天气气候、居民聚落',
    qbKey: 'QB_GEO7' },

  { id:'geo8',     name:'八年级地理', icon:'🌍', color:'#1868b8',
    desc:'中国疆域、人口、地形、气候、河流、资源、经济',
    qbKey: 'QB_GEO8' },

  { id:'geoh',     name:'高中地理',  icon:'🗺️', color:'#0848a0',
    desc:'必修一/二、选修一/二/三',
    qbKey: 'QB_GEO_HIGH' },

  { id:'history8', name:'八年级历史', icon:'📜', color:'#a05020',
    desc:'近代史、新中国成立、改革开放、祖国统一',
    qbKey: 'QB_HISTORY8' },

  { id:'english',  name:'英语学习',  icon:'🇬🇧', color:'#7030b0',
    desc:'词汇、语法、阅读理解、出国备考',
    qbKey: 'QB_ENGLISH' },

  // ══ 新科目在此追加 ══
];

// ── 模块结构定义 ──────────────────────────────────────────────
window.SUBJECT_MODULES = {

  // ── 八年级历史 ───────────────────────────────────────────────
  'history8': {
    groups: [
      { label:'📖 上册', modules:[
        { id:'h8_v1_u1',  label:'第一单元 · 中国开始沦为半殖民地半封建社会', qbKey:'QB_H8_V1U1' },
        { id:'h8_v1_u2',  label:'第二单元 · 近代化的早期探索与民族危机加剧', qbKey:'QB_H8_V1U2' },
        { id:'h8_v1_u3',  label:'第三单元 · 资产阶级民主革命与中华民国建立', qbKey:'QB_H8_V1U3' },
        { id:'h8_v1_u4',  label:'第四单元 · 新民主主义革命的开始',            qbKey:'QB_H8_V1U4' },
        { id:'h8_v1_mid', label:'📝 上册期中模拟', qbKey:'QB_H8_V1MID', isExam:true },
        { id:'h8_v1_fin', label:'📝 上册期末模拟', qbKey:'QB_H8_V1FIN', isExam:true },
      ]},
      { label:'📖 下册', modules:[
        { id:'h8_v2_u1',  label:'第一单元 · 中华人民共和国的成立与社会主义制度的建立', qbKey:'QB_H8_V2U1' },
        { id:'h8_v2_u2',  label:'第二单元 ·社会主义建设道路的探索 ',   qbKey:'QB_H8_V2U2' },
        { id:'h8_v2_u3',  label:'第三单元 · 改革开放与中国特色社会主义的开创',        qbKey:'QB_H8_V2U3' },
        { id:'h8_v2_u4',  label:'第四单元 · 中国特色社会主义近向21世纪',          qbKey:'QB_H8_V2U4' },
        { id:'h8_v2_u5',  label:'第五单元 · 在新形势下坚持和发展中国特色社会主义',          qbKey:'QB_H8_V2U5' },
        { id:'h8_v2_u6',  label:'第六单元 · 中国特色社会主义进入新时代',          qbKey:'QB_H8_V2U6' },
        { id:'h8_v2_u7',  label:'第七单元 · 全面建设社会主义现代化国家',          qbKey:'QB_H8_V2U7' },
        { id:'h8_v2_mid', label:'📝 下册期中模拟', qbKey:'QB_H8_V2MID', isExam:true },
        { id:'h8_v2_fin', label:'📝 下册期末模拟', qbKey:'QB_H8_V2FIN', isExam:true },
      ]},
      { label:'📄 专项试卷', modules:[
        { id:'h8_exam1', label:'历史模拟卷 · 第一套', qbKey:'QB_H8_EXAM1', isExam:true },
        { id:'h8_exam2', label:'历史模拟卷 · 第二套', qbKey:'QB_H8_EXAM2', isExam:true },
      ]},
    ]
  },
  // ── 七年级地理 ───────────────────────────────────────────────
  'geo7': {
    groups: [
      { label:'📖 七上', modules:[
        { id:'g7_v1_u1',  label:'第一章 · 地球',   qbKey:'QB_G7_V1U1' },
        { id:'g7_v1_u2',  label:'第二章 · 地图',   qbKey:'QB_G7_V1U2' },
        { id:'g7_v1_u3',  label:'第三章 · 陆地与海洋',   qbKey:'QB_G7_V1U3' },
        { id:'g7_v1_u4',  label:'第四章 · 天气与气候',   qbKey:'QB_G7_V1U4' },
        { id:'g7_v1_u5',  label:'第五章 · 居民与聚落',   qbKey:'QB_G7_V1U5' },
        { id:'g7_v1_u6',  label:'第六章 · 发展与合作',   qbKey:'QB_G7_V1U6' },
        { id:'g7_v1_mid', label:'📝 七上期中模拟', qbKey:'QB_G7_V1MID', isExam:true },
        { id:'g7_v1_fin', label:'📝 七上期末模拟', qbKey:'QB_G7_V1FIN', isExam:true },
      ]},
      { label:'📖 七下', modules:[
        { id:'g7_v2_u7',  label:'第七章 · 认识大洲（亚洲）', qbKey:'QB_G7_V2U7' },
        { id:'g7_v2_u8',  label:'第八章 · 邻近的地区与国家', qbKey:'QB_G7_V2U8' },
        { id:'g7_v2_u9',  label:'第九章 · 东半球的国家', qbKey:'QB_G7_V2U9' },
        { id:'g7_v2_u10',  label:'第十章 · 西半球与极地', qbKey:'QB_G7_V2U10' },
        { id:'g7_v2_mid', label:'📝 七下期中模拟', qbKey:'QB_G7_V2MID', isExam:true },
        { id:'g7_v2_fin', label:'📝 七下期末模拟', qbKey:'QB_G7_V2FIN', isExam:true },
      ]},
      { label:'📄 专项试卷', modules:[
        { id:'g7_exam1', label:'七年级地理模拟卷 · 第一套', qbKey:'QB_G7_EXAM1', isExam:true },
      ]},
    ]
  },



  // ── 八年级地理 ───────────────────────────────────────────────
  'geo8': {
    groups: [
      { label:'📖 八上', modules:[
        { id:'g8_v1_u1',  label:'第一章 · 中国的疆域与人口', qbKey:'QB_G8_V1U1' },
        { id:'g8_v1_u2',  label:'第二章 · 中国的自然环境',   qbKey:'QB_G8_V1U2' },
        { id:'g8_v1_u3',  label:'第三章 · 中国的自然资源',   qbKey:'QB_G8_V1U3' },
        { id:'g8_v1_u4',  label:'第四章 · 中国的经济发展',   qbKey:'QB_G8_V1U4' },
        { id:'g8_v1_u5',  label:'第五章 · 建设美丽中国', qbKey:'QB_G8_V2U5' },
        { id:'g8_v1_mid', label:'📝 八上期中模拟', qbKey:'QB_G8_V1MID', isExam:true },
        { id:'g8_v1_fin', label:'📝 八上期末模拟', qbKey:'QB_G8_V1FIN', isExam:true },

      ]},
      { label:'📖 八下', modules:[
        { id:'g8_v2_u6',  label:'第六章 · 中国的地理差异', qbKey:'QB_G8_V2U6' },
        { id:'g8_v2_u7',  label:'第七章 · 北方地区', qbKey:'QB_G8_V2U7' },
        { id:'g8_v2_u8',  label:'第八章 · 南方地区', qbKey:'QB_G8_V2U8' },
        { id:'g8_v2_u9',  label:'第九章 · 西北地区', qbKey:'QB_G8_V2U9' },
        { id:'g8_v2_u10',  label:'第十章 · 青藏地区', qbKey:'QB_G8_V2U10' },
        { id:'g8_v2_u11',  label:'第十一章 ·中国在世界上 ', qbKey:'QB_G8_V2U11' },
        { id:'g8_v2_mid', label:'📝 八下期中模拟', qbKey:'QB_G8_V2MID', isExam:true },
        { id:'g8_v2_fin', label:'📝 八下期末模拟', qbKey:'QB_G8_V2FIN', isExam:true },
      ]},
      { label:'📄 专项试卷', modules:[
        { id:'g8_exam1', label:'八年级地理模拟卷 · 第一套', qbKey:'QB_G8_EXAM1', isExam:true },
      ]},
    ]
  },

  // ── 高中地理 ─────────────────────────────────────────────────
  'geoh': {
    groups: [
      { label:'📘 必修', modules:[
        { id:'gh_b1', label:'必修一 · 自然地理基础', qbKey:'QB_GH_B1' },
        { id:'gh_b2', label:'必修二 · 人文地理基础', qbKey:'QB_GH_B2' },
      ]},
      { label:'📗 选修', modules:[
        { id:'gh_s1', label:'选修一 · 海洋地理',       qbKey:'QB_GH_S1' },
        { id:'gh_s2', label:'选修二 · 自然灾害与防治', qbKey:'QB_GH_S2' },
        { id:'gh_s3', label:'选修三 · 旅游地理',       qbKey:'QB_GH_S3' },
      ]},
      { label:'📄 专项试卷', modules:[
        { id:'gh_exam1', label:'高中地理模拟卷 · 第一套', qbKey:'QB_GH_EXAM1', isExam:true },
      ]},
    ]
  },

  // ── 教师编制 ─────────────────────────────────────────────────
  'teacher': {
    groups: [
      { label:'📚 核心科目', modules:[
        { id:'te_edu',  label:'教育学',                    qbKey:'QB_TE_EDU'  },
        { id:'te_gpsy', label:'普通心理学',                qbKey:'QB_TE_GPSY' },
        { id:'te_epsy', label:'教育心理学',                qbKey:'QB_TE_EPSY' },
        { id:'te_s3',   label:'小三门（课程·教学·德育）', qbKey:'QB_TE_S3'   },
      ]},
      { label:'📄 综合模拟卷', modules:[
        { id:'te_exam1', label:'教编模拟卷 · 第一套', qbKey:'QB_TE_EXAM1', isExam:true },
        { id:'te_exam2', label:'教编模拟卷 · 第二套', qbKey:'QB_TE_EXAM2', isExam:true },
      ]},
    ]
  },

  // ══ 新科目模块在此追加 ══
};

// ── 题目获取逻辑 ─────────────────────────────────────────────
window.getActiveQuestions = function() {
  // 优先：已选子模块
  if (window.ACTIVE_MODULE_ID) {
    const sub = SUBJECTS.find(s => s.id === (window.ACTIVE_SUBJECT_ID || 'teacher'));
    const mods = sub && SUBJECT_MODULES[sub.id];
    if (mods) {
      for (const g of mods.groups) {
        const mod = g.modules.find(m => m.id === window.ACTIVE_MODULE_ID);
        if (mod && window[mod.qbKey] && window[mod.qbKey].length > 0)
          return window[mod.qbKey];
      }
    }
  }
  // 回退：科目完整题库
  const sub = SUBJECTS.find(s => s.id === (window.ACTIVE_SUBJECT_ID || 'teacher'));
  if (!sub || sub.qbKey === null) return window.QB || [];
  return window[sub.qbKey] || window.QB || [];
};

window.getActiveSubject = function() {
  return SUBJECTS.find(s => s.id === (window.ACTIVE_SUBJECT_ID || 'teacher')) || SUBJECTS[0];
};
