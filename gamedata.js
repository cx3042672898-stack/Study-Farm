// ══════════════════════════════════════════════════════════════
//  游戏数据定义  gamedata.js  v9
// ══════════════════════════════════════════════════════════════

window.SEEDS={
  wheat:     {id:'wheat',    name:'小麦',  ico:'🌾',desc:'最基础的作物，成长快',        buyCoins:8, shopUnlock:0, reward:18, expGain:10,autoGrowH:2, stages:['🌱','🌿','🌾','🌾'],bugChance:0.08},
  sunflower: {id:'sunflower',name:'向日葵',ico:'🌻',desc:'阳光可爱，收益较好',          buyCoins:15,shopUnlock:0, reward:32, expGain:16,autoGrowH:3, stages:['🌱','🌿','🌷','🌻'],bugChance:0.10},
  strawberry:{id:'strawberry',name:'草莓', ico:'🍓',desc:'酸甜小果，中等收益',          buyCoins:22,shopUnlock:0, reward:48, expGain:24,autoGrowH:5, stages:['🌱','🌿','🌸','🍓'],bugChance:0.12},
  blueberry: {id:'blueberry',name:'蓝莓', ico:'🫐',desc:'珍贵果子，成长慢收益高',      buyCoins:35,shopUnlock:30,reward:80, expGain:40,autoGrowH:8, stages:['🌱','🌿','🌸','🫐'],bugChance:0.15},
  cherry:    {id:'cherry',   name:'樱桃', ico:'🍒',desc:'顶级水果，需耐心等待',        buyCoins:55,shopUnlock:60,reward:130,expGain:65,autoGrowH:12,stages:['🌱','🌿','🌸','🍒'],bugChance:0.18},
};
window.SEED_IDS=['wheat','sunflower','strawberry','blueberry','cherry'];


// ★ PET_BREEDS, EVO_STAGES, PET_TALK, PET_TALK_BREED, SHOP_PETS 已移至 pet_config.js
// ★ 请在 pet_config.js 中统一修改宠物相关配置

window.EVO_EXP_REQUIRED=[0,60,120,200,300,0];

window.PET_SKIN_COLORS=[
  {id:'sc_default',name:'恢复原色',   color:null,       price:0},
  {id:'sc_pink',   name:'樱花粉',     color:'#ffb0c8',  price:50},
  {id:'sc_sky',    name:'天空蓝',     color:'#90c8f8',  price:50},
  {id:'sc_lavender',name:'薰衣草紫', color:'#d0a0f0',  price:50},
  {id:'sc_mint',   name:'薄荷绿',     color:'#a0e8c0',  price:50},
  {id:'sc_peach',  name:'蜜桃色',     color:'#ffcca0',  price:60},
  {id:'sc_coral',  name:'珊瑚红',     color:'#ff9080',  price:60},
  {id:'sc_cream',  name:'奶油白',     color:'#fff5e0',  price:60},
  {id:'sc_gold',   name:'黄金色',     color:'#ffd060',  price:80},
  {id:'sc_silver', name:'星光银',     color:'#d0d8e8',  price:80},
  {id:'sc_night',  name:'深夜蓝',     color:'#304080',  price:80},
  {id:'sc_forest', name:'森林绿',     color:'#5a9a5a',  price:80},
  {id:'sc_rose',   name:'玫瑰红',     color:'#e05080',  price:80},
  {id:'sc_rainbow',name:'✨彩虹渐变', color:'rainbow',  price:150},
];

// ─── 宠物衣服（含等级解锁）───
window.SHOP_CLOTHES=[
  {id:'c_bow',      name:'粉色蝴蝶结', ico:'🎀',desc:'甜美可爱，最适合仓鼠～',       price:30, levelUnlock:0},
  {id:'c_hat',      name:'草编小帽',   ico:'🪖',desc:'清新草帽，夏日农场风十足',     price:40, levelUnlock:0},
  {id:'c_crown',    name:'金色皇冠',   ico:'👑',desc:'闪闪发光，你是最尊贵的宝宝',   price:80, levelUnlock:0},
  {id:'c_scarf',    name:'格子围巾',   ico:'🧣',desc:'暖和的格子围巾，秋冬必备',     price:45, levelUnlock:0},
  {id:'c_sunglasses',name:'爱心墨镜', ico:'🕶️',desc:'酷炫造型，颜值提升100%',      price:55, levelUnlock:0},
  {id:'c_backpack', name:'小书包',     ico:'🎒',desc:'认真学习的装扮，加油！',       price:50, levelUnlock:0},
  {id:'c_ninja',    name:'忍者头巾',   ico:'🥷',desc:'神秘忍者风，快如闪电',         price:65, levelUnlock:3},
  {id:'c_angel',    name:'天使翅膀',   ico:'👼',desc:'洁白翅膀，飞向天空',           price:70, levelUnlock:3},
  {id:'c_witch',    name:'小魔女帽',   ico:'🧙',desc:'神秘魔法，施展魔力',           price:60, levelUnlock:3},
  {id:'c_space',    name:'宇航服头盔', ico:'🚀',desc:'探索宇宙，星际冒险家',         price:85, levelUnlock:5},
  {id:'c_grad',     name:'学士帽',     ico:'🎓',desc:'学业有成，知识无价',           price:75, levelUnlock:5},
  {id:'c_robe',     name:'魔法长袍',   ico:'🔮',desc:'古老魔法，神秘力量',           price:90, levelUnlock:5},
  {id:'c_knight',   name:'骑士盔甲',   ico:'⚔️',desc:'铁甲护身，无畏冒险',          price:100,levelUnlock:7},
  {id:'c_princess', name:'公主长裙',   ico:'👗',desc:'华丽礼裙，最高贵的宝宝',       price:105,levelUnlock:7},
  {id:'c_rainbow',  name:'彩虹披风',   ico:'🌈',desc:'彩虹加身，天下无敌',           price:130,levelUnlock:10},
  {id:'c_galaxy',   name:'星辰战衣',   ico:'🌌',desc:'星辰之力，宇宙最强',           price:140,levelUnlock:10},
];

// ─── 商店宠物 ───

// ★ SHOP_PETS 已移至 pet_config.js

window.SHOP_TOOLS=[
  {id:'t_fert',     name:'超级肥料',    ico:'💊',desc:'立即：所有作物成长+20%',                       price:40, type:'instant_fert'},
  {id:'t_fastgrow', name:'极速成长剂',  ico:'⚡',desc:'立即：所有作物成长+50%',                       price:65, type:'fast_grow'},
  {id:'t_timeskip', name:'时光胶囊',    ico:'⏰',desc:'立即：模拟6小时自然生长',                     price:60, type:'time_skip'},
  {id:'t_harvest2x',name:'丰收加倍令',  ico:'🌈',desc:'接下来5次收获金币×2',                         price:80, type:'harvest_boost'},
  {id:'t_pesticide',name:'除虫药',      ico:'🧴',desc:'存入仓库，选地块时使用',                       price:25, type:'buy_pest',    bulkable:true},
  {id:'t_autopest', name:'全自动除虫机',ico:'🤖',desc:'永久驻场！自动消灭虫害，有损耗需维护',         price:160,type:'auto_pest'},
  {id:'t_autowater',name:'自动喷水器',  ico:'🚿',desc:'每2h自动浇水，有损耗需维护',                   price:120,type:'auto_water'},
  {id:'t_repair',   name:'修复套件',    ico:'🔧',desc:'修复任意自动设备至100%耐久',                   price:50, type:'repair_kit',  bulkable:true},
  {id:'t_petpack',  name:'宠物补给包',  ico:'💝',desc:'立即：所有宠物属性恢复至80+',                  price:45, type:'pet_restore'},
  {id:'t_evoboost', name:'进化催化剂',  ico:'🧬',desc:'立即：宠物学习经验+100',                       price:55, type:'evo_boost'},
  {id:'t_expboost', name:'学霸加成',    ico:'📖',desc:'答题经验×2，持续10道题',                       price:60, type:'exp_boost'},
  {id:'t_shield',   name:'连击护盾',    ico:'🛡️',desc:'下次答错也不断连击，可批量',                  price:40, type:'streak_shield',bulkable:true},
  {id:'t_seedpack', name:'神秘种子包',  ico:'📦',desc:'随机获得3粒已解锁种子',                        price:35, type:'seed_pack'},
  {id:'t_coin50',   name:'金币礼包',    ico:'💰',desc:'立即获得50金币（每账号限20次）',               price:0,  type:'coins_for_stars',starPrice:200,maxBuy:20,bulkable:true},
];

// ─── 成就定义 ───
window.ACHS=[
  {id:'q_first',   ico:'📝',nm:'初试答题',  desc:'完成第1次答题',              cond:s=>s.totalAnswered>=1,              reward:{coins:20,score:5}},
  {id:'q_c1',      ico:'🌱',nm:'破土而出',  desc:'累计答对1题',                cond:s=>s.totalCorrect>=1,               reward:{coins:20,score:5}},
  {id:'q_c10',     ico:'📚',nm:'勤学苦练',  desc:'累计答对10题',               cond:s=>s.totalCorrect>=10,              reward:{coins:40,score:15}},
  {id:'q_c30',     ico:'🎓',nm:'博学多才',  desc:'累计答对30题',               cond:s=>s.totalCorrect>=30,              reward:{coins:60,score:20}},
  {id:'q_c60',     ico:'🏛️',nm:'教育学通', desc:'累计答对60题',               cond:s=>s.totalCorrect>=60,              reward:{coins:80,score:30}},
  {id:'q_c100',    ico:'🌟',nm:'学习达人',  desc:'累计答对100题',              cond:s=>s.totalCorrect>=100,             reward:{coins:120,score:50}},
  {id:'streak3',   ico:'🔥',nm:'小有连胜',  desc:'连续答对3题',                cond:s=>s.maxStreak>=3,                  reward:{coins:30,score:10}},
  {id:'streak7',   ico:'💥',nm:'连胜达人',  desc:'连续答对7题',                cond:s=>s.maxStreak>=7,                  reward:{coins:60,score:25}},
  {id:'streak15',  ico:'🌪️',nm:'答题风暴', desc:'连续答对15题',               cond:s=>s.maxStreak>=15,                 reward:{coins:100,score:40}},
  {id:'farm_seed', ico:'🌰',nm:'播种者',    desc:'购买第1粒种子',              cond:s=>s.totalSeeds>=1,                 reward:{coins:20,score:5}},
  {id:'farm_plant',ico:'🌱',nm:'农夫初心',  desc:'成功播种1次',                cond:s=>s.totalPlanted>=1,               reward:{coins:20,score:5}},
  {id:'farm_h1',   ico:'🌾',nm:'初次丰收',  desc:'成功收获1次',                cond:s=>s.harvests>=1,                   reward:{coins:30,score:10}},
  {id:'farm_h10',  ico:'🧺',nm:'勤劳农夫',  desc:'累计收获10次',               cond:s=>s.harvests>=10,                  reward:{coins:60,score:20}},
  {id:'farm_h30',  ico:'🏡',nm:'丰收大户',  desc:'累计收获30次',               cond:s=>s.harvests>=30,                  reward:{coins:100,score:40}},
  {id:'expand1',   ico:'🔓',nm:'开荒能手',  desc:'解锁1块新地',                cond:s=>s.plotsUnlocked>=1,              reward:{coins:40,score:15}},
  {id:'expand4',   ico:'🗺️',nm:'大农场主', desc:'解锁全部4块新地',            cond:s=>s.plotsUnlocked>=4,              reward:{coins:100,score:40}},
  {id:'pet_f1',    ico:'🍎',nm:'细心喂养',  desc:'喂食宠物1次',                cond:s=>s.petFeedCount>=1,               reward:{coins:20,score:5}},
  {id:'pet_f20',   ico:'❤️',nm:'用心照料',  desc:'喂食宠物20次',               cond:s=>s.petFeedCount>=20,              reward:{coins:60,score:25}},
  {id:'pet_lv2',   ico:'⭐',nm:'第一次进化',desc:'宠物进化到Lv.2',            cond:s=>s.petLevel>=2,                   reward:{coins:80,score:30}},
  {id:'pet_lv5',   ico:'🌟',nm:'神宠降临',  desc:'宠物进化到Lv.5（满级）',    cond:s=>s.petLevel>=5,                   reward:{coins:200,score:100}},
  {id:'shop_cloth',ico:'👗',nm:'时尚搭配',  desc:'购买第1件宠物衣服',          cond:s=>s.ownedClothes.length>=1,        reward:{coins:40,score:15}},
  {id:'shop_pet',  ico:'🐾',nm:'爱宠收藏家',desc:'拥有2只以上宠物',            cond:s=>s.ownedPets.length>=2,           reward:{coins:60,score:20}},
  {id:'pet_drag',  ico:'🖱️',nm:'爱抚大师', desc:'拖动宠物5次',                cond:s=>(s.dragCount||0)>=5,             reward:{coins:30,score:10}},
  {id:'lv5',       ico:'🌿',nm:'升学达人',  desc:'玩家达到Lv.5',              cond:s=>s.level>=5,                      reward:{coins:50,score:20}},
  {id:'lv10',      ico:'🏆',nm:'学习之路',  desc:'玩家达到Lv.10',             cond:s=>s.level>=10,                     reward:{coins:80,score:30}},
  {id:'coins200',  ico:'💰',nm:'小富农',    desc:'累计获得200金币',            cond:s=>s.totalCoins>=200,               reward:{coins:50,score:15}},
  {id:'seed5',     ico:'🌈',nm:'种植达人',  desc:'解锁全部5种种子',            cond:s=>s.unlockedSeeds.length>=5,       reward:{coins:80,score:30}},
  {id:'class_rank',ico:'🥇',nm:'班级第一',  desc:'班级排名第一',               cond:s=>s._classRank===1,                reward:{coins:100,score:50}},
  {id:'pet14',     ico:'🐾',nm:'动物园园长',desc:'拥有5只以上宠物',            cond:s=>s.ownedPets.length>=5,           reward:{coins:150,score:60}},
  {id:'skin_color',ico:'🎨',nm:'颜值达人',  desc:'为宠物使用自定义皮肤',       cond:s=>Object.keys(s.petSkinColors||{}).length>=1||(s.petSpriteSkins&&Object.keys(s.petSpriteSkins).length>=1), reward:{coins:40,score:15}},
  {id:'q_c200',    ico:'📖',nm:'学海无涯',   desc:'累计答对200题',              cond:s=>s.totalCorrect>=200,             reward:{coins:150,score:60}},
  {id:'q_c500',    ico:'🌍',nm:'知识宝库',   desc:'累计答对500题',              cond:s=>s.totalCorrect>=500,             reward:{coins:300,score:120}},
  {id:'streak20',  ico:'🌊',nm:'连胜飓风',   desc:'连续答对20题',               cond:s=>s.maxStreak>=20,                 reward:{coins:150,score:60}},
  {id:'streak30',  ico:'⚡',nm:'答题闪电',   desc:'连续答对30题',               cond:s=>s.maxStreak>=30,                 reward:{coins:200,score:80}},
  {id:'all_cats',  ico:'🌐',nm:'全科达人',   desc:'在5个不同类别各答对1题',      cond:s=>Object.keys(s.catCorrect||{}).filter(k=>(s.catCorrect[k]||0)>=1).length>=5, reward:{coins:80,score:30}},
  {id:'farm_h60',  ico:'👑',nm:'农场领主',   desc:'累计收获60次',               cond:s=>s.harvests>=60,                  reward:{coins:150,score:60}},
  {id:'farm_h100', ico:'🏰',nm:'丰收传说',   desc:'累计收获100次',              cond:s=>s.harvests>=100,                 reward:{coins:250,score:100}},
  {id:'coins1000', ico:'💎',nm:'金币大亨',   desc:'累计获得1000金币',           cond:s=>s.totalCoins>=1000,              reward:{coins:200,score:80}},
  {id:'coins5000', ico:'🏦',nm:'农场富豪',   desc:'累计获得5000金币',           cond:s=>s.totalCoins>=5000,              reward:{coins:500,score:200}},
  {id:'red_soil',  ico:'🟥',nm:'土地改良师', desc:'将任意地块升级为红土地',     cond:s=>(s.plots||[]).some(p=>p.soil==='red'||p.soil==='black'||p.soil==='diamond'), reward:{coins:60,score:20}},
  {id:'black_soil',ico:'⬛',nm:'黑土专家',   desc:'将任意地块升级为黑土地',     cond:s=>(s.plots||[]).some(p=>p.soil==='black'||p.soil==='diamond'),               reward:{coins:100,score:40}},
  {id:'diamond_soil',ico:'💎',nm:'钻石农夫', desc:'将任意地块升级为钻石地',     cond:s=>(s.plots||[]).some(p=>p.soil==='diamond'),                                  reward:{coins:200,score:80}},
  {id:'all_seeds', ico:'🌈',nm:'种子收藏家', desc:'拥有5种种子各至少1粒',       cond:s=>Object.values(s.seedBag||{}).filter(n=>n>0).length>=5,                     reward:{coins:80,score:30}},
  {id:'pet_f50',   ico:'🍱',nm:'饲养达人',   desc:'喂食宠物50次',               cond:s=>s.petFeedCount>=50,              reward:{coins:100,score:40}},
  {id:'pet_f100',  ico:'🍽️',nm:'营养专家',  desc:'喂食宠物100次',              cond:s=>s.petFeedCount>=100,             reward:{coins:150,score:60}},
  {id:'pet_3pets', ico:'🦁',nm:'小小动物园', desc:'拥有3只以上不同宠物',        cond:s=>s.ownedPets.length>=3,           reward:{coins:100,score:40}},
  {id:'pet_all',   ico:'🌟',nm:'宠物收藏家', desc:'拥有全部14只宠物',           cond:s=>s.ownedPets.length>=14,          reward:{coins:500,score:200}},
  {id:'pet_drag20',ico:'🖐️',nm:'爱抚专家',  desc:'拖动宠物20次',               cond:s=>(s.dragCount||0)>=20,            reward:{coins:50,score:20}},
  {id:'pet_3cloths',ico:'👘',nm:'时尚达人',  desc:'购买3件衣服',                cond:s=>s.ownedClothes.length>=3,        reward:{coins:80,score:30}},
  {id:'pet_allcloths',ico:'🎪',nm:'宠物时装周',desc:'购买10件以上衣服',         cond:s=>s.ownedClothes.length>=10,       reward:{coins:200,score:80}},
  {id:'multi_evolve',ico:'🔄',nm:'进化达人',  desc:'让3只不同宠物各进化到Lv.2',  cond:s=>Object.values(s.petReachedLevels||{}).filter(v=>v>=2).length>=3,          reward:{coins:150,score:60}},
  {id:'lv20',      ico:'🚀',nm:'学习飞速',   desc:'玩家达到Lv.20',              cond:s=>s.level>=20,                     reward:{coins:120,score:50}},
  {id:'lv35',      ico:'💫',nm:'知识之星',   desc:'玩家达到Lv.35',              cond:s=>s.level>=35,                     reward:{coins:180,score:70}},
  {id:'lv50',      ico:'🌙',nm:'学习满月',   desc:'玩家达到Lv.50',              cond:s=>s.level>=50,                     reward:{coins:250,score:100}},
  {id:'lv75',      ico:'☀️',nm:'智慧骑士',   desc:'玩家达到Lv.75',              cond:s=>s.level>=75,                     reward:{coins:350,score:140}},
  {id:'lv100',     ico:'👑',nm:'传说农夫',   desc:'玩家达到Lv.100（最高等级）', cond:s=>s.level>=100,                    reward:{coins:500,score:200}},
  {id:'class_top3',ico:'🥉',nm:'班级前三',   desc:'班级排名前三',               cond:s=>(s._classRank||99)<=3,           reward:{coins:80,score:35}},
  {id:'first_diamond',ico:'✨',nm:'土地初心', desc:'完成第一次土地升级',         cond:s=>(s.plots||[]).some(p=>p.soil&&p.soil!=='yellow'),                           reward:{coins:40,score:15}},
  {id:'custom_pet',ico:'🖼️',nm:'个性艺术家', desc:'上传自定义宠物形象',         cond:s=>!!localStorage.getItem('jbfarm_petimg_'+(s.activePet||'p_hamster')),       reward:{coins:50,score:20}},
];

// ─── 默认存档 ───
window.DEFAULT_SAVE={
  ver:6, playerName:'', classId:'', isTeacher:false,
  managedClasses:[], // 教师管理的班级列表
  level:1, exp:0, score:0, coins:50, totalCoins:50,
  totalAnswered:0, totalCorrect:0, maxStreak:0, curStreak:0,
  catCorrect:{基础:0,人物:0,属性:0,形态:0,心理:0,教师:0,课程:0,德育:0},
  usedQ:[], unlockedAch:[], newAch:[],
  plots:[
    {s:'empty',g:0,seed:'wheat',lastWater:0,hasBug:false,hasCrack:false,soil:'yellow'},
    {s:'empty',g:0,seed:'wheat',lastWater:0,hasBug:false,hasCrack:false,soil:'yellow'},
    {s:'empty',g:0,seed:'wheat',lastWater:0,hasBug:false,hasCrack:false,soil:'yellow'},
    {s:'empty',g:0,seed:'wheat',lastWater:0,hasBug:false,hasCrack:false,soil:'yellow'},
    {s:'locked',g:0,seed:'wheat',lastWater:0,hasBug:false,hasCrack:false,unlockProgress:0,soil:'yellow'},
    {s:'locked',g:0,seed:'wheat',lastWater:0,hasBug:false,hasCrack:false,unlockProgress:0,soil:'yellow'},
    {s:'locked',g:0,seed:'wheat',lastWater:0,hasBug:false,hasCrack:false,unlockProgress:0,soil:'yellow'},
    {s:'locked',g:0,seed:'wheat',lastWater:0,hasBug:false,hasCrack:false,unlockProgress:0,soil:'yellow'},
  ],
  seedBag:{wheat:2,sunflower:0,strawberry:0,blueberry:0,cherry:0},
  totalSeeds:0, totalPlanted:0, harvests:0, plotsUnlocked:0,
  unlockedSeeds:['wheat','sunflower','strawberry'],
  // 农场设施（含耐久度）
  hasAutoWater:false, autoWaterDur:100,
  hasAutoPest:false,  autoPestDur:100,
  pestStock:0, repairKitStock:0, coinGiftBought:0,
  streakShieldLeft:0, harvestBoostLeft:0,
  // 宠物
  petBreed:'hamster', petName:'小饼干', petLevel:1,
  petFood:65, petHappy:55, petClean:72, petEnergy:80,
  petLearnExp:0, petFeedCount:0, petPlayCount:0, dragCount:0,
  petSaves:{p_hamster:null},
  firstSwitchDone:{},   // {petShopId: true} 已首次切换
  petSkinColors:{},     // {petShopId: colorId}
  petSpriteSkins:{},    // {petShopId_breed_lv: skinId} 精灵阶段皮肤
  ownedSpriteSkins:[],  // 已购买的精灵皮肤 key 列表
  petDisplaySize:150,   // 宠物显示大小 px
  pendingAchReward:[],  // 已解锁但未领取奖励的成就 id 列表
  claimedAchReward:[],  // 已领取奖励的成就 id 列表
  ownedSkins:[],        // 已购买的皮肤id列表
  ownedClothes:[], equippedCloth:null,
  ownedPets:['p_hamster'], activePet:'p_hamster',
  warehouse:{}, petReachedLevels:{},
  playerAvatar:'',
  expBoostLeft:0, lastSaveTime:0, _classRank:99,
};

window.PET_NAMES=['豆豆','团子','糯米','麻薯','奶茶','布丁','果冻','芝士','薯片','饼干','泡芙','可可','抹茶','芒果','桃子','草莓','蓝莓','樱桃','柠檬','西瓜','花花','朵朵','乐乐','萌萌','圆圆','毛毛','胖胖','懒懒','球球','泡泡'];
window.PLAYER_NAMES=['学霸农场主','答题小能手','勤劳的学生','未来优秀教师','知识探索者'];
window.EXP_TABLE=[0,100,220,360,520,700,900,1120,1360,1620,1900];
window.expForLv=lv=>EXP_TABLE[Math.min(lv,EXP_TABLE.length-1)]||lv*200;

// ─── 头像预设 ───
window.AVATAR_PRESETS=[
  {id:'ap_1',ico:'🌾',label:'小麦'},  {id:'ap_2',ico:'🌱',label:'新芽'},
  {id:'ap_3',ico:'🌻',ico:'🌻',label:'向日葵'},{id:'ap_4',ico:'🍓',label:'草莓'},
  {id:'ap_5',ico:'🐹',label:'仓鼠'},  {id:'ap_6',ico:'🐱',label:'猫咪'},
  {id:'ap_7',ico:'🐶',label:'小狗'},  {id:'ap_8',ico:'🦊',label:'小狐'},
  {id:'ap_9',ico:'🐼',label:'熊猫'},  {id:'ap_10',ico:'🦄',label:'独角兽'},
  {id:'ap_11',ico:'🌟',label:'明星'}, {id:'ap_12',ico:'📚',label:'学霸'},
  {id:'ap_13',ico:'🎓',label:'毕业'},  {id:'ap_14',ico:'🏆',label:'冠军'},
  {id:'ap_15',ico:'🌈',label:'彩虹'}, {id:'ap_16',ico:'🍀',label:'幸运'},
  {id:'ap_17',ico:'🎯',label:'精准'}, {id:'ap_18',ico:'💡',label:'创意'},
  {id:'ap_19',ico:'🔥',label:'热情'}, {id:'ap_20',ico:'❄️',label:'冷静'},
  {id:'ap_21',ico:'⚡',label:'闪电'}, {id:'ap_22',ico:'🌙',label:'月亮'},
  {id:'ap_23',ico:'☀️',label:'太阳'}, {id:'ap_24',ico:'🎵',label:'音乐'},
];

// ─── 植物性格台词 ───
window.PLANT_TALK={
  wheat:{
    name:'小麦', icon:'🌾',
    water:['哗，终于等来了！我会认真生长的！','水！！！太感动了主人！','喝到啦喝到啦，好幸福~','已经快渴死了，主人你终于来了！'],
    fert:['哇，这……是单给我一个的吗？','营养满满！我要努力长！','这么用心，不好好长都对不起主人！'],
    harvest:['该走了，主人多保重！','嗯，我尽力了，下次见～','好，丰收，很好，再见了！'],
    drought:['渴……好渴……','主人……需要水……','嗓子都冒烟了……'],
    bug:['啊！有虫！快来救我！','不好了！被盯上了！','救命！有不速之客！'],
    grow:['嗯……慢慢长……','认真生长中……','生长计划进行中……'],
  },
  sunflower:{
    name:'向日葵', icon:'🌻',
    water:['☀️浇水啦！！今天也是最棒的一天！','哗哗哗！好开心！要更加阳光了！','爱爱爱！！主人最好了！！'],
    fert:['嗷嗷嗷！！这是给我的！！！太感动啦！！','☀️能量满格！！转转转！！','姊妹们都有吗？就我有的话……有点不好意思……嘿嘿但是我喜欢！'],
    harvest:['哇——我要去看新世界了！主人再见！☀️','嗯！去下一个地方继续发光！','带着主人的爱出发啦！☀️'],
    drought:['太阳太晒了……主人能给点水吗……','☀️变成烤向日葵了……','脸都皴啦……'],
    bug:['哎哎哎！！！有虫！！！好可怕！！','谁啊谁啊！！我可是阳光女孩！！','救命救命救命！！'],
    grow:['☀️向着阳光生长！','嗯嗯嗯！努力转！','今天也很努力！☀️'],
  },
  strawberry:{
    name:'草莓', icon:'🍓',
    water:['终于……人家都快干透了嘛……','（小声）等好久了……谢谢～','哎呀终于想起人家了……好啦好啦，心情好一点了。'],
    fert:['哇……这份养料……是专门给人家的吗……','（脸红）……谢谢……人家收到了～','这肥料，是单给我一个人打，还是姊妹们都有？就我有啊……那人家有点受宠若惊……'],
    harvest:['哦……要走了啊……主人还会想起人家吗……','好嘛……走就走……（假装不在乎）','嗯……下次……还要主人好好照顾我……'],
    drought:['好渴哦……（可怜巴巴）','主人……人家要干瘪了……','呜呜呜……需要水……'],
    bug:['哎！！谁！！不许碰我！！','喂喂喂！！！这里是我的地方！！','走开走开走开！！！'],
    grow:['慢慢长……等主人来看我～','认真长大，以后要更甜哦～','嗯嗯……努力中……'],
  },
  blueberry:{
    name:'蓝莓', icon:'🫐',
    water:['……承情了。','……不差这点水。（说着还是喝了）','……嗯。'],
    fert:['……额外照顾？这不是偏心是什么。','……谢。','这肥料，姊妹们都有吗。没有的话……我可以不要的。（撒谎）'],
    harvest:['……走了。','……各奔前程吧。','……保重。'],
    drought:['……有点渴了。','……需要补水。','……干。'],
    bug:['……有虫。请处理。','……（冷漠）讨厌。','……这很烦。'],
    grow:['……在长。','……生长中。','……不用看我。'],
  },
  cherry:{
    name:'樱桃', icon:'🍒',
    water:['本大人终于等到了，你说迟不迟！','哗！本大人最近太渴了，这才叫及时雨！','这份水，本大人勉强满意。继续努力！'],
    fert:['这份肥料……本大人接受了！感受到了你的诚意！','姊妹们都有吗？就本大人有？……哎本大人也不是那么在意啦（飘了）','哇这是什么！专程给本大人的？！太好了！（转了个圈）'],
    harvest:['本大人要离开了，你日后要认真照顾下一批！','嗯！本大人离开时，排场要大一点！','本大人的去处，不是一般的地方。主人，本大人走了！'],
    drought:['本大人已经到了极限！水！立刻！','如此对待本大人……本大人要抗议了！','……本大人也是有脾气的！快浇水！'],
    bug:['什么东西！！本大人岂是你能觊觎的！！','无礼的虫子！！驱除！立刻！！','本大人被侵犯了！速速解决！'],
    grow:['本大人正在积蓄力量……','静待本大人成熟之日……','本大人的成长，需要耐心等待。'],
  },
};

// 批量操作专属台词（多块地一起操作时触发）
window.PLANT_BULK_TALK={
  water_all:['雨露均沾，好！','哦？全员都有？公平，公平！','今天大家都喝到了，好事！','哗哗哗，感谢大水！'],
  fert_all:['这肥料，是单给我一个人打，还是姊妹们都有啊……哦都有！那没事了。','集体都有！公平！我喜欢！','大家都被特别照顾到了！团结的味道！','居然全员施肥？！主人今天格外上心！'],
  harvest_all:['集体毕业典礼！出发！','大家一起走，不孤单！','姊妹们，我们都完成任务了！下次见！','一起丰收啦！同生共死一家人！'],
  plant_all:['大家今天都种上了！好热闹！','集体开始任务！加油！','同期种下，看谁先长大！'],
};
