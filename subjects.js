// ══════════════════════════════════════════════════════════════
//  科目注册中心  subjects.js  v5  (新版教材目录 · 单元→课 两级)
// ══════════════════════════════════════════════════════════════

window.ACTIVE_MODULE_ID    = localStorage.getItem('jbfarm_module')       || null;
window.ACTIVE_MODULE_LABEL = localStorage.getItem('jbfarm_module_label') || '';

window.SUBJECTS = [
  { id:'teacher',  name:'教师',  icon:'📚', color:'#5a9a5a',
    desc:'教育学·普通心理学·教育心理学·小三门', qbKey: null },
  { id:'history7', name:'七年级历史', icon:'🏺', color:'#c07030',
    desc:'史前·夏商周·秦汉·三国两晋·隋唐·辽宋元·明清', qbKey: null },
  { id:'history8', name:'八年级历史', icon:'📜', color:'#a05020',
    desc:'近代史·新中国成立·改革开放·新时代', qbKey: null },
  { id:'geo7',     name:'七年级地理', icon:'🌏', color:'#2a88d8',
    desc:'地球·地图·陆地海洋·气候·居民文化·亚洲·世界各地', qbKey: null },
  { id:'geo8',     name:'八年级地理', icon:'🌍', color:'#1868b8',
    desc:'从世界看中国·自然环境·资源·经济·四大地理区域', qbKey: null },
  { id:'geoh',     name:'高中地理',  icon:'🗺️', color:'#0848a0',
    desc:'必修一/二、选修一/二/三', qbKey: 'QB_GEO_HIGH' },
  { id:'english',  name:'英语学习',  icon:'🇬🇧', color:'#7030b0',
    desc:'词汇·语法·旅行场景·文化礼仪', qbKey: 'QB_ENGLISH' },
];

window.SUBJECT_MODULES = {

  // ════════════════════════════════════════════════════════
  //  教师
  // ════════════════════════════════════════════════════════
  'teacher': {
    groups: [
      { label:'📚 教育学', modules:[
        { id:'te_edu_b1', label:'教育本质·起源·历史',            qbKey:'QB_TE_EDU_B1' },
        { id:'te_edu_b2', label:'教育基本规律（与社会·个体发展）',qbKey:'QB_TE_EDU_B2' },
        { id:'te_edu_b3', label:'教育目的与课程论',               qbKey:'QB_TE_EDU_B3' },
        { id:'te_edu_b4', label:'教学论（原则·方法·组织形式）',  qbKey:'QB_TE_EDU_B4' },
        { id:'te_edu_b5', label:'德育论·班主任·班级管理',        qbKey:'QB_TE_EDU_B5' },
      ]},
      { label:'📚 普通心理学', modules:[
        { id:'te_gpsy_b1', label:'认知过程（感知觉·记忆·思维·语言）',qbKey:'QB_TE_GPSY_B1' },
        { id:'te_gpsy_b2', label:'情感·意志·个性（人格·能力）',      qbKey:'QB_TE_GPSY_B2' },
      ]},
      { label:'📚 教育心理学', modules:[
        { id:'te_epsy_b1', label:'学习理论（行为·认知·建构·人本）', qbKey:'QB_TE_EPSY_B1' },
        { id:'te_epsy_b2', label:'学习心理（动机·迁移·学习策略）',  qbKey:'QB_TE_EPSY_B2' },
        { id:'te_epsy_b3', label:'教学与评价心理',                   qbKey:'QB_TE_EPSY_B3' },
      ]},
      { label:'📚 小三门', modules:[
        { id:'te_s3_b1', label:'课程论（课程类型·课程观·评价）', qbKey:'QB_TE_S3_B1' },
        { id:'te_s3_b2', label:'教学设计（三维目标·教案撰写）',  qbKey:'QB_TE_S3_B2' },
        { id:'te_s3_b3', label:'德育论（德育原则·方法·途径）',  qbKey:'QB_TE_S3_B3' },
      ]},
      { label:'📄 综合模拟卷', modules:[
        { id:'te_exam1', label:'教编模拟卷 · 第一套', qbKey:'QB_TE_EXAM1', isExam:true },
        { id:'te_exam2', label:'教编模拟卷 · 第二套', qbKey:'QB_TE_EXAM2', isExam:true },
      ]},
    ]
  },

  // ════════════════════════════════════════════════════════
  //  七年级历史（新增科目）
  // ════════════════════════════════════════════════════════
  'history7': {
    groups: [
      // ── 七年级上册 ────────────────────────────────────
      { label:'📖 七上·第一单元 史前时期：原始社会与中华文明的起源', modules:[
        { id:'h7_1u1_l1', label:'第1课 远古时期的人类活动',  qbKey:'QB_H7_1U1_L1' },
        { id:'h7_1u1_l2', label:'第2课 原始农业与史前社会',  qbKey:'QB_H7_1U1_L2' },
        { id:'h7_1u1_l3', label:'第3课 中华文明的起源',      qbKey:'QB_H7_1U1_L3' },
      ]},
      { label:'📖 七上·第二单元 夏商周时期：奴隶制王朝的更替和向封建社会的过渡', modules:[
        { id:'h7_1u2_l4', label:'第4课 夏商西周王朝的更替',     qbKey:'QB_H7_1U2_L4' },
        { id:'h7_1u2_l5', label:'第5课 动荡变化中的春秋时期',   qbKey:'QB_H7_1U2_L5' },
        { id:'h7_1u2_l6', label:'第6课 战国时期的社会变革',     qbKey:'QB_H7_1U2_L6' },
        { id:'h7_1u2_l7', label:'第7课 百家争鸣',               qbKey:'QB_H7_1U2_L7' },
        { id:'h7_1u2_l8', label:'第8课 夏商周时期的科技与文化', qbKey:'QB_H7_1U2_L8' },
      ]},
      { label:'📖 七上·第三单元 秦汉时期：统一多民族封建国家的建立和巩固', modules:[
        { id:'h7_1u3_l9',  label:'第9课 秦统一中国',                qbKey:'QB_H7_1U3_L9'  },
        { id:'h7_1u3_l10', label:'第10课 秦末农民大起义',            qbKey:'QB_H7_1U3_L10' },
        { id:'h7_1u3_l11', label:'第11课 西汉建立和"文景之治"',     qbKey:'QB_H7_1U3_L11' },
        { id:'h7_1u3_l12', label:'第12课 大一统王朝的巩固',          qbKey:'QB_H7_1U3_L12' },
        { id:'h7_1u3_l13', label:'第13课 东汉的兴衰',                qbKey:'QB_H7_1U3_L13' },
        { id:'h7_1u3_l14', label:'第14课 丝绸之路的开通与经营西域',  qbKey:'QB_H7_1U3_L14' },
        { id:'h7_1u3_l15', label:'第15课 秦汉时期的科技与文化',      qbKey:'QB_H7_1U3_L15' },
      ]},
      { label:'📖 七上·第四单元 三国两晋南北朝时期：政权分立与民族交融', modules:[
        { id:'h7_1u4_l16', label:'第16课 三国鼎立',                      qbKey:'QB_H7_1U4_L16' },
        { id:'h7_1u4_l17', label:'第17课 西晋的短暂统一和北方各族的内迁',qbKey:'QB_H7_1U4_L17' },
        { id:'h7_1u4_l18', label:'第18课 东晋南朝政治和江南地区开发',    qbKey:'QB_H7_1U4_L18' },
        { id:'h7_1u4_l19', label:'第19课 北朝政治和北方民族大交融',      qbKey:'QB_H7_1U4_L19' },
        { id:'h7_1u4_l20', label:'第20课 三国两晋南北朝时期的科技与文化',qbKey:'QB_H7_1U4_L20' },
      ]},
      { label:'📝 七上模拟', modules:[
        { id:'h7_7a_mid', label:'📝 七上期中模拟', qbKey:'QB_H7_7A_MID', isExam:true },
        { id:'h7_7a_fin', label:'📝 七上期末模拟', qbKey:'QB_H7_7A_FIN', isExam:true },
      ]},
      // ── 七年级下册 ────────────────────────────────────
      { label:'📖 七下·第一单元 隋唐时期：繁荣与开放的时代', modules:[
        { id:'h7_2u1_l1', label:'第1课 隋朝统一与灭亡',          qbKey:'QB_H7_2U1_L1' },
        { id:'h7_2u1_l2', label:'第2课 唐朝建立与"贞观之治"',  qbKey:'QB_H7_2U1_L2' },
        { id:'h7_2u1_l3', label:'第3课 开元盛世',                qbKey:'QB_H7_2U1_L3' },
        { id:'h7_2u1_l4', label:'第4课 安史之乱与唐朝衰亡',      qbKey:'QB_H7_2U1_L4' },
        { id:'h7_2u1_l5', label:'第5课 隋唐时期的民族交往与交融',qbKey:'QB_H7_2U1_L5' },
        { id:'h7_2u1_l6', label:'第6课 隋唐时期的中外文化交流',  qbKey:'QB_H7_2U1_L6' },
        { id:'h7_2u1_l7', label:'第7课 隋唐时期的科技与文化',    qbKey:'QB_H7_2U1_L7' },
      ]},
      { label:'📖 七下·第二单元 辽宋夏金元时期：民族关系发展和社会变化', modules:[
        { id:'h7_2u2_l8',  label:'第8课 北宋的政治',           qbKey:'QB_H7_2U2_L8'  },
        { id:'h7_2u2_l9',  label:'第9课 辽、西夏与北宋并立',  qbKey:'QB_H7_2U2_L9'  },
        { id:'h7_2u2_l10', label:'第10课 金与南宋对峙',        qbKey:'QB_H7_2U2_L10' },
        { id:'h7_2u2_l11', label:'第11课 元朝的统一',          qbKey:'QB_H7_2U2_L11' },
        { id:'h7_2u2_l12', label:'第12课 宋元时期经济的繁荣',  qbKey:'QB_H7_2U2_L12' },
        { id:'h7_2u2_l13', label:'第13课 宋元时期的对外交流',  qbKey:'QB_H7_2U2_L13' },
        { id:'h7_2u2_l14', label:'第14课 辽宋夏金元时期的科技与文化',qbKey:'QB_H7_2U2_L14' },
      ]},
      { label:'📖 七下·第三单元 明清时期（至鸦片战争前）：统一多民族封建国家的巩固与发展', modules:[
        { id:'h7_2u3_l15', label:'第15课 明朝的统治',              qbKey:'QB_H7_2U3_L15' },
        { id:'h7_2u3_l16', label:'第16课 明朝的对外关系',          qbKey:'QB_H7_2U3_L16' },
        { id:'h7_2u3_l17', label:'第17课 明朝的灭亡和清朝的建立',  qbKey:'QB_H7_2U3_L17' },
        { id:'h7_2u3_l18', label:'第18课 统一多民族封建国家的巩固和发展',qbKey:'QB_H7_2U3_L18' },
        { id:'h7_2u3_l19', label:'第19课 清朝君主专制的强化',      qbKey:'QB_H7_2U3_L19' },
        { id:'h7_2u3_l20', label:'第20课 明清时期社会经济的发展',  qbKey:'QB_H7_2U3_L20' },
        { id:'h7_2u3_l21', label:'第21课 明清时期的科技与文化',    qbKey:'QB_H7_2U3_L21' },
      ]},
      { label:'📝 七下模拟', modules:[
        { id:'h7_7b_mid', label:'📝 七下期中模拟', qbKey:'QB_H7_7B_MID', isExam:true },
        { id:'h7_7b_fin', label:'📝 七下期末模拟', qbKey:'QB_H7_7B_FIN', isExam:true },
      ]},
    ]
  },

  // ════════════════════════════════════════════════════════
  //  八年级历史（按新版教材重构）
  // ════════════════════════════════════════════════════════
  'history8': {
    groups: [
      // ── 八年级上册 ────────────────────────────────────
      { label:'📖 八上·第一单元 中国开始沦为半殖民地半封建社会', modules:[
        { id:'h8_1u1_l1', label:'第1课 鸦片战争',       qbKey:'QB_H8_1U1_L1' },
        { id:'h8_1u1_l2', label:'第2课 第二次鸦片战争', qbKey:'QB_H8_1U1_L2' },
        { id:'h8_1u1_l3', label:'第3课 太平天国运动',   qbKey:'QB_H8_1U1_L3' },
      ]},
      { label:'📖 八上·第二单元 早期现代化的初步探索和民族危机加剧', modules:[
        { id:'h8_1u2_l4', label:'第4课 洋务运动和边疆危机',           qbKey:'QB_H8_1U2_L4' },
        { id:'h8_1u2_l5', label:'第5课 甲午中日战争与列强瓜分中国狂潮',qbKey:'QB_H8_1U2_L5' },
        { id:'h8_1u2_l6', label:'第6课 戊戌变法',                     qbKey:'QB_H8_1U2_L6' },
        { id:'h8_1u2_l7', label:'第7课 义和团运动和八国联军侵华',     qbKey:'QB_H8_1U2_L7' },
      ]},
      { label:'📖 八上·第三单元 资产阶级民主革命与中华民国的建立', modules:[
        { id:'h8_1u3_l8',  label:'第8课 中国同盟会',          qbKey:'QB_H8_1U3_L8'  },
        { id:'h8_1u3_l9',  label:'第9课 辛亥革命',            qbKey:'QB_H8_1U3_L9'  },
        { id:'h8_1u3_l10', label:'第10课 帝制复辟与军阀割据', qbKey:'QB_H8_1U3_L10' },
      ]},
      { label:'📖 八上·第四单元 新民主主义革命的兴起', modules:[
        { id:'h8_1u4_l11', label:'第11课 五四运动',       qbKey:'QB_H8_1U4_L11' },
        { id:'h8_1u4_l12', label:'第12课 中国共产党诞生', qbKey:'QB_H8_1U4_L12' },
      ]},
      { label:'📖 八上·第五单元 从国共合作到农村革命根据地的建立', modules:[
        { id:'h8_1u5_l13', label:'第13课 国共合作与北伐战争',        qbKey:'QB_H8_1U5_L13' },
        { id:'h8_1u5_l14', label:'第14课 毛泽东开辟井冈山道路',      qbKey:'QB_H8_1U5_L14' },
        { id:'h8_1u5_l15', label:'第15课 中国工农红军长征与遵义会议',qbKey:'QB_H8_1U5_L15' },
      ]},
      { label:'📖 八上·第六单元 中华民族的抗日战争', modules:[
        { id:'h8_1u6_l16', label:'第16课 从九一八事变到西安事变',           qbKey:'QB_H8_1U6_L16' },
        { id:'h8_1u6_l17', label:'第17课 七七事变与全民族抗战',             qbKey:'QB_H8_1U6_L17' },
        { id:'h8_1u6_l18', label:'第18课 全民族抗战中的正面战场和敌后战场', qbKey:'QB_H8_1U6_L18' },
        { id:'h8_1u6_l19', label:'第19课 抗日战争的胜利',                   qbKey:'QB_H8_1U6_L19' },
      ]},
      { label:'📖 八上·第七单元 人民解放战争', modules:[
        { id:'h8_1u7_l20', label:'第20课 国民党挑起内战',       qbKey:'QB_H8_1U7_L20' },
        { id:'h8_1u7_l21', label:'第21课 人民解放战争的胜利',   qbKey:'QB_H8_1U7_L21' },
      ]},
      { label:'📝 八上模拟', modules:[
        { id:'h8_8a_mid', label:'📝 八上期中模拟', qbKey:'QB_H8_8A_MID', isExam:true },
        { id:'h8_8a_fin', label:'📝 八上期末模拟', qbKey:'QB_H8_8A_FIN', isExam:true },
      ]},
      // ── 八年级下册 ────────────────────────────────────
      { label:'📖 八下·第一单元 中华人民共和国成立和社会主义制度建立', modules:[
        { id:'h8_2u1_l1', label:'第1课 中华人民共和国成立', qbKey:'QB_H8_2U1_L1' },
        { id:'h8_2u1_l2', label:'第2课 巩固人民民主政权', qbKey:'QB_H8_2U1_L2' },
        { id:'h8_2u1_l3', label:'第3课 社会主义制度建立', qbKey:'QB_H8_2U1_L3' },
        { id:'h8_2u1_l4', label:'第4课 独立自主的和平外交',qbKey:'QB_H8_2U1_L4' },
      ]},
      { label:'📖 八下·第二单元 社会主义建设道路的探索', modules:[
        { id:'h8_2u2_l5', label:'第5课 艰辛探索与曲折发展',            qbKey:'QB_H8_2U2_L5' },
        { id:'h8_2u2_l6', label:'第6课 社会主义建设的巨大成就和先锋模范',qbKey:'QB_H8_2U2_L6' },
        { id:'h8_2u2_l7', label:'第7课 国防现代化起步和外交工作新突破', qbKey:'QB_H8_2U2_L7' },
      ]},
      { label:'📖 八下·第三单元 改革开放与中国特色社会主义的开创', modules:[
        { id:'h8_2u3_l8',  label:'第8课 伟大的历史转折',                      qbKey:'QB_H8_2U3_L8'  },
        { id:'h8_2u3_l9',  label:'第9课 改革开放的起步',                      qbKey:'QB_H8_2U3_L9'  },
        { id:'h8_2u3_l10', label:'第10课 改革开放和社会主义现代化建设的全面展开',qbKey:'QB_H8_2U3_L10' },
        { id:'h8_2u3_l11', label:'第11课 社会主义初级阶段基本路线',            qbKey:'QB_H8_2U3_L11' },
      ]},
      { label:'📖 八下·第四单元 中国特色社会主义迈向21世纪', modules:[
        { id:'h8_2u4_l12', label:'第12课 加快改革开放和社会主义现代化建设步伐',qbKey:'QB_H8_2U4_L12' },
        { id:'h8_2u4_l13', label:'第13课 中国特色社会主义事业取得新成就',     qbKey:'QB_H8_2U4_L13' },
        { id:'h8_2u4_l14', label:'第14课 国防和外交工作新局面',               qbKey:'QB_H8_2U4_L14' },
      ]},
      { label:'📖 八下·第五单元 在新形势下坚持和发展中国特色社会主义', modules:[
        { id:'h8_2u5_l15', label:'第15课 开始全面建设小康社会',        qbKey:'QB_H8_2U5_L15' },
        { id:'h8_2u5_l16', label:'第16课 夺取全面建设小康社会新胜利',  qbKey:'QB_H8_2U5_L16' },
        { id:'h8_2u5_l17', label:'第17课 推进国防军队建设和外交工作',  qbKey:'QB_H8_2U5_L17' },
      ]},
      { label:'📖 八下·第六单元 中国特色社会主义进入新时代', modules:[
        { id:'h8_2u6_l18', label:'第18课 擘画中国梦宏伟蓝图',               qbKey:'QB_H8_2U6_L18' },
        { id:'h8_2u6_l19', label:'第19课 决胜全面建设小康社会',             qbKey:'QB_H8_2U6_L19' },
        { id:'h8_2u6_l20', label:'第20课 维护国家安全和推进祖国统一',       qbKey:'QB_H8_2U6_L20' },
        { id:'h8_2u6_l21', label:'第21课 构建人类命运共同体与中国特色大国外交',qbKey:'QB_H8_2U6_L21' },
      ]},
      { label:'📖 八下·第七单元 全面建设社会主义现代化国家', modules:[
        { id:'h8_2u7_l22', label:'第22课 实现第一个百年奋斗目标',              qbKey:'QB_H8_2U7_L22' },
        { id:'h8_2u7_l23', label:'第23课 开启全面建设社会主义现代化国家新征程',qbKey:'QB_H8_2U7_L23' },
      ]},
      { label:'📝 八下模拟', modules:[
        { id:'h8_8b_mid', label:'📝 八下期中模拟', qbKey:'QB_H8_8B_MID', isExam:true },
        { id:'h8_8b_fin', label:'📝 八下期末模拟', qbKey:'QB_H8_8B_FIN', isExam:true },
      ]},
    ]
  },

  // ════════════════════════════════════════════════════════
  //  七年级地理（新版人教版目录·章→节）
  // ════════════════════════════════════════════════════════
  'geo7': {
    groups: [
      // ── 七年级上册 ────────────────────────────────────
      { label:'📖 七上·第一章 地球', modules:[
        { id:'g7_c1_s1', label:'第一节 地球的宇宙环境', qbKey:'QB_G7_C1_S1' },
        { id:'g7_c1_s2', label:'第二节 地球与地球仪',   qbKey:'QB_G7_C1_S2' },
        { id:'g7_c1_s3', label:'第三节 地球的运动',     qbKey:'QB_G7_C1_S3' },
      ]},
      { label:'📖 七上·第二章 地图', modules:[
        { id:'g7_c2_s1', label:'第一节 地图的阅读',       qbKey:'QB_G7_C2_S1' },
        { id:'g7_c2_s2', label:'第二节 地形图的判读',     qbKey:'QB_G7_C2_S2' },
        { id:'g7_c2_s3', label:'第三节 地图的选择和应用', qbKey:'QB_G7_C2_S3' },
      ]},
      { label:'📖 七上·第三章 陆地和海洋', modules:[
        { id:'g7_c3_s1', label:'第一节 大洲和大洋', qbKey:'QB_G7_C3_S1' },
        { id:'g7_c3_s2', label:'第二节 世界的地形', qbKey:'QB_G7_C3_S2' },
        { id:'g7_c3_s3', label:'第三节 海陆的变迁', qbKey:'QB_G7_C3_S3' },
      ]},
      { label:'📖 七上·第四章 天气与气候', modules:[
        { id:'g7_c4_s1', label:'第一节 多变的天气',       qbKey:'QB_G7_C4_S1' },
        { id:'g7_c4_s2', label:'第二节 气温的变化与分布', qbKey:'QB_G7_C4_S2' },
        { id:'g7_c4_s3', label:'第三节 降水的变化与分布', qbKey:'QB_G7_C4_S3' },
        { id:'g7_c4_s4', label:'第四节 世界的气候',       qbKey:'QB_G7_C4_S4' },
      ]},
      { label:'📖 七上·第五章 居民与文化', modules:[
        { id:'g7_c5_s1', label:'第一节 人口与人种', qbKey:'QB_G7_C5_S1' },
        { id:'g7_c5_s2', label:'第二节 城镇与乡村', qbKey:'QB_G7_C5_S2' },
        { id:'g7_c5_s3', label:'第三节 多样的文化', qbKey:'QB_G7_C5_S3' },
      ]},
      { label:'📖 七上·第六章 发展与合作', modules:[
        { id:'g7_c6', label:'第六章 发展与合作（全章）', qbKey:'QB_G7_C6' },
      ]},
      { label:'📝 七上模拟', modules:[
        { id:'g7_7a_mid', label:'📝 七上期中模拟', qbKey:'QB_G7_7A_MID', isExam:true },
        { id:'g7_7a_fin', label:'📝 七上期末模拟', qbKey:'QB_G7_7A_FIN', isExam:true },
      ]},
      // ── 七年级下册 ────────────────────────────────────
      { label:'📖 七下·第七章 我们生活的大洲——亚洲', modules:[
        { id:'g7_c7_s1', label:'第一节 自然环境', qbKey:'QB_G7_C7_S1' },
        { id:'g7_c7_s2', label:'第二节 人文环境', qbKey:'QB_G7_C7_S2' },
      ]},
      { label:'📖 七下·第八章 我们邻近的地区和国家', modules:[
        { id:'g7_c8_s1', label:'第一节 日本',   qbKey:'QB_G7_C8_S1' },
        { id:'g7_c8_s2', label:'第二节 东南亚', qbKey:'QB_G7_C8_S2' },
        { id:'g7_c8_s3', label:'第三节 印度',   qbKey:'QB_G7_C8_S3' },
        { id:'g7_c8_s4', label:'第四节 俄罗斯', qbKey:'QB_G7_C8_S4' },
      ]},
      { label:'📖 七下·第九章 东半球其他的地区和国家', modules:[
        { id:'g7_c9_s1', label:'第一节 西亚',           qbKey:'QB_G7_C9_S1' },
        { id:'g7_c9_s2', label:'第二节 欧洲西部',       qbKey:'QB_G7_C9_S2' },
        { id:'g7_c9_s3', label:'第三节 撒哈拉以南非洲', qbKey:'QB_G7_C9_S3' },
        { id:'g7_c9_s4', label:'第四节 澳大利亚',       qbKey:'QB_G7_C9_S4' },
      ]},
      { label:'📖 七下·第十章 西半球的国家', modules:[
        { id:'g7_c10_s1', label:'第一节 美国', qbKey:'QB_G7_C10_S1' },
        { id:'g7_c10_s2', label:'第二节 巴西', qbKey:'QB_G7_C10_S2' },
      ]},
      { label:'📖 七下·第十一章 极地地区', modules:[
        { id:'g7_c11', label:'第十一章 极地地区（全章）', qbKey:'QB_G7_C11' },
      ]},
      { label:'📝 七下模拟', modules:[
        { id:'g7_7b_mid', label:'📝 七下期中模拟', qbKey:'QB_G7_7B_MID', isExam:true },
        { id:'g7_7b_fin', label:'📝 七下期末模拟', qbKey:'QB_G7_7B_FIN', isExam:true },
      ]},
    ]
  },

  // ════════════════════════════════════════════════════════
  //  八年级地理（新版人教版目录·章→节）
  // ════════════════════════════════════════════════════════
  'geo8': {
    groups: [
      // ── 八年级上册 ────────────────────────────────────
      { label:'📖 八上·第一章 从世界看中国', modules:[
        { id:'g8_c1_s1', label:'第一节 疆域', qbKey:'QB_G8_C1_S1' },
        { id:'g8_c1_s2', label:'第二节 人口', qbKey:'QB_G8_C1_S2' },
        { id:'g8_c1_s3', label:'第三节 民族', qbKey:'QB_G8_C1_S3' },
      ]},
      { label:'📖 八上·第二章 中国的自然环境', modules:[
        { id:'g8_c2_s1', label:'第一节 地形',       qbKey:'QB_G8_C2_S1' },
        { id:'g8_c2_s2', label:'第二节 气候',       qbKey:'QB_G8_C2_S2' },
        { id:'g8_c2_s3', label:'第三节 河流与湖泊', qbKey:'QB_G8_C2_S3' },
      ]},
      { label:'📖 八上·第三章 中国的自然资源', modules:[
        { id:'g8_c3_s1', label:'第一节 土地资源', qbKey:'QB_G8_C3_S1' },
        { id:'g8_c3_s2', label:'第二节 水资源',   qbKey:'QB_G8_C3_S2' },
        { id:'g8_c3_s3', label:'第三节 矿产资源', qbKey:'QB_G8_C3_S3' },
        { id:'g8_c3_s4', label:'第四节 海洋资源', qbKey:'QB_G8_C3_S4' },
      ]},
      { label:'📖 八上·第四章 中国的经济发展', modules:[
        { id:'g8_c4_s1', label:'第一节 农业',     qbKey:'QB_G8_C4_S1' },
        { id:'g8_c4_s2', label:'第二节 工业',     qbKey:'QB_G8_C4_S2' },
        { id:'g8_c4_s3', label:'第三节 交通运输', qbKey:'QB_G8_C4_S3' },
      ]},
      { label:'📖 八上·第五章 建设美丽中国', modules:[
        { id:'g8_c5_s1', label:'第一节 自然灾害与防灾减灾', qbKey:'QB_G8_C5_S1' },
        { id:'g8_c5_s2', label:'第二节 环境保护与发展',     qbKey:'QB_G8_C5_S2' },
      ]},
      { label:'📝 八上模拟', modules:[
        { id:'g8_8a_mid', label:'📝 八上期中模拟', qbKey:'QB_G8_8A_MID', isExam:true },
        { id:'g8_8a_fin', label:'📝 八上期末模拟', qbKey:'QB_G8_8A_FIN', isExam:true },
      ]},
      // ── 八年级下册 ────────────────────────────────────
      { label:'📖 八下·第六章 中国的地理差异', modules:[
        { id:'g8_c6', label:'第六章 中国的地理差异（全章）', qbKey:'QB_G8_C6' },
      ]},
      { label:'📖 八下·第七章 北方地区', modules:[
        { id:'g8_c7_s1', label:'第一节 自然特征与农业',              qbKey:'QB_G8_C7_S1' },
        { id:'g8_c7_s2', label:'第二节 "白山黑水"——东北三省',      qbKey:'QB_G8_C7_S2' },
        { id:'g8_c7_s3', label:'第三节 世界最大的黄土堆积区——黄土高原',qbKey:'QB_G8_C7_S3' },
        { id:'g8_c7_s4', label:'第四节 祖国的首都——北京',           qbKey:'QB_G8_C7_S4' },
      ]},
      { label:'📖 八下·第八章 南方地区', modules:[
        { id:'g8_c8_s1', label:'第一节 自然特征与农业',                qbKey:'QB_G8_C8_S1' },
        { id:'g8_c8_s2', label:'第二节 "鱼米之乡"——长江三角洲地区', qbKey:'QB_G8_C8_S2' },
        { id:'g8_c8_s3', label:'第三节 特别行政区——香港和澳门',     qbKey:'QB_G8_C8_S3' },
        { id:'g8_c8_s4', label:'第四节 祖国的神圣领土——台湾省',     qbKey:'QB_G8_C8_S4' },
      ]},
      { label:'📖 八下·第九章 西北地区', modules:[
        { id:'g8_c9_s1', label:'第一节 自然特征与农业',          qbKey:'QB_G8_C9_S1' },
        { id:'g8_c9_s2', label:'第二节 干旱的宝地——塔里木盆地', qbKey:'QB_G8_C9_S2' },
      ]},
      { label:'📖 八下·第十章 青藏地区', modules:[
        { id:'g8_c10_s1', label:'第一节 自然特征与农业',             qbKey:'QB_G8_C10_S1' },
        { id:'g8_c10_s2', label:'第二节 "中华水塔"——三江源地区',  qbKey:'QB_G8_C10_S2' },
      ]},
      { label:'📖 八下·第十一章 奋进中的中国', modules:[
        { id:'g8_c11', label:'第十一章 奋进中的中国（全章）', qbKey:'QB_G8_C11' },
      ]},
      { label:'📝 八下模拟', modules:[
        { id:'g8_8b_mid', label:'📝 八下期中模拟', qbKey:'QB_G8_8B_MID', isExam:true },
        { id:'g8_8b_fin', label:'📝 八下期末模拟', qbKey:'QB_G8_8B_FIN', isExam:true },
      ]},
    ]
  },

  // ════════════════════════════════════════════════════════
  //  高中地理（保持原结构）
  // ════════════════════════════════════════════════════════
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

  // ════════════════════════════════════════════════════════
  //  英语学习
  // ════════════════════════════════════════════════════════
  'english': {
    groups: [
      { label:'🛫 实用旅行场景', modules:[
        { id:'en_airport',    label:'机场英语全攻略',  qbKey:'QB_EN_AIRPORT',    isExam:false },
        { id:'en_hotel',      label:'酒店入住英语',    qbKey:'QB_EN_HOTEL',      isExam:false },
        { id:'en_transport',  label:'交通出行英语',    qbKey:'QB_EN_TRANSPORT',  isExam:false },
        { id:'en_shopping',   label:'购物砍价英语',    qbKey:'QB_EN_SHOPPING',   isExam:false },
        { id:'en_restaurant', label:'餐厅点餐英语',    qbKey:'QB_EN_RESTAURANT', isExam:false },
        { id:'en_emergency',  label:'🚨 紧急情况英语', qbKey:'QB_EN_EMERGENCY',  isExam:true  },
      ]},
      { label:'🌏 旅游地理知识', modules:[
        { id:'en_geo_asia',     label:'亚洲热门目的地', qbKey:'QB_EN_GEO_ASIA',     isExam:false },
        { id:'en_geo_europe',   label:'欧洲经典目的地', qbKey:'QB_EN_GEO_EUROPE',   isExam:false },
        { id:'en_geo_americas', label:'美洲及大洋洲',   qbKey:'QB_EN_GEO_AMERICAS', isExam:false },
      ]},
      { label:'📚 词汇与语法', modules:[
        { id:'en_vocab_travel', label:'旅行高频词汇',   qbKey:'QB_EN_VOCAB_TRAVEL', isExam:false },
        { id:'en_vocab_daily',  label:'日常生活词汇',   qbKey:'QB_EN_VOCAB_DAILY',  isExam:false },
        { id:'en_grammar',      label:'旅行实用语法',   qbKey:'QB_EN_GRAMMAR',      isExam:false },
        { id:'en_culture',      label:'🎌 文化礼仪常识',qbKey:'QB_EN_CULTURE',      isExam:true  },
      ]},
    ]
  },
};

// ── 题目获取逻辑（支持全科混合）─────────────────────────────
window.getActiveQuestions = function() {
  const subId = window.ACTIVE_SUBJECT_ID || 'teacher';
  if (window.ACTIVE_MODULE_ID) {
    const modCfg = SUBJECT_MODULES[subId];
    if (modCfg) {
      for (const g of modCfg.groups) {
        const mod = g.modules.find(m => m.id === window.ACTIVE_MODULE_ID);
        if (mod && window[mod.qbKey] && window[mod.qbKey].length > 0)
          return window[mod.qbKey];
      }
    }
    window.ACTIVE_MODULE_ID = null;
    window.ACTIVE_MODULE_LABEL = '';
    localStorage.removeItem('jbfarm_module');
    localStorage.removeItem('jbfarm_module_label');
  }
  const modCfg = SUBJECT_MODULES[subId];
  if (modCfg && modCfg.groups) {
    const allQ = [];
    modCfg.groups.forEach(grp => {
      grp.modules.forEach(mod => {
        if (window[mod.qbKey] && window[mod.qbKey].length > 0)
          allQ.push(...window[mod.qbKey]);
      });
    });
    if (allQ.length > 0) return allQ;
  }
  const sub = SUBJECTS.find(s => s.id === subId);
  if (!sub || sub.qbKey === null) return window.QB || [];
  return window[sub.qbKey] || window.QB || [];
};

window.getActiveSubject = function() {
  return SUBJECTS.find(s => s.id === (window.ACTIVE_SUBJECT_ID || 'teacher')) || SUBJECTS[0];
};
