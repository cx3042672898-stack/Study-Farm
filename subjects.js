// ══════════════════════════════════════════════════════════════
//  科目注册中心  subjects.js
//
//  ★ 如何添加新科目：
//    1. 新建文件 subject_xxx.js，定义 window.QB_XXX = [ ...题目 ]
//    2. 在 index.html 的 <script> 区域引入该文件
//    3. 在下方 SUBJECTS 数组末尾注册科目信息
//
//  ★ qbKey 说明：
//    null  = 使用 questions.js 中的 window.QB（教编题库）
//    字符串 = 对应的全局变量名，如 'QB_GEO8' 对应 window.QB_GEO8
// ══════════════════════════════════════════════════════════════

window.SUBJECTS = [

  { id:'teacher',  name:'教师编制',  icon:'📚', color:'#5a9a5a',
    desc:'教育学、教育心理学、课程与教学论、德育',
    qbKey: null },

  { id:'geo7',     name:'七年级地理', icon:'🌏', color:'#2a88d8',
    desc:'亚洲、日本、东南亚、印度、俄罗斯、中东、欧洲、非洲',
    qbKey: 'QB_GEO7' },

  { id:'geo8',     name:'八年级地理', icon:'🌍', color:'#1868b8',
    desc:'中国疆域、人口、地形、气候、河流、资源、经济',
    qbKey: 'QB_GEO8' },

  { id:'history8', name:'八年级历史', icon:'📜', color:'#a05020',
    desc:'新中国成立、社会主义建设、改革开放、祖国统一',
    qbKey: 'QB_HISTORY8' },

  { id:'english',  name:'英语学习',  icon:'🇬🇧', color:'#7030b0',
    desc:'词汇、语法、阅读理解、出国备考',
    qbKey: 'QB_ENGLISH' },

  // ══ 新科目在此追加 ══
  // { id:'math7', name:'七年级数学', icon:'📐', color:'#d04000',
  //   desc:'整式、方程、几何', qbKey:'QB_MATH7' },

];

window.getActiveQuestions = function() {
  const sub = SUBJECTS.find(s => s.id === (window.ACTIVE_SUBJECT_ID||'teacher'));
  if (!sub || sub.qbKey === null) return window.QB || [];
  return window[sub.qbKey] || window.QB || [];
};

window.getActiveSubject = function() {
  return SUBJECTS.find(s => s.id === (window.ACTIVE_SUBJECT_ID||'teacher')) || SUBJECTS[0];
};
