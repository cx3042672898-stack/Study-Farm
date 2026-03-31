// ══════════════════════════════════════════════════════════════
//  游戏数据定义  gamedata.js  v9
// ══════════════════════════════════════════════════════════════

// ─── 种子定义 ───
window.SEEDS = {
  wheat:      {id:'wheat',     name:'小麦',   ico:'🌾', desc:'最基础的作物，成长快',          buyCoins:8,  shopUnlock:0,  reward:18, expGain:10, autoGrowH:2,  stages:['🌱','🌿','🌾','🌾'], bugChance:0.08},
  sunflower:  {id:'sunflower', name:'向日葵', ico:'🌻', desc:'阳光可爱，收益较好',            buyCoins:15, shopUnlock:0,  reward:32, expGain:16, autoGrowH:3,  stages:['🌱','🌿','🌷','🌻'], bugChance:0.10},
  strawberry: {id:'strawberry',name:'草莓',   ico:'🍓', desc:'酸甜小果，中等收益',            buyCoins:22, shopUnlock:0,  reward:48, expGain:24, autoGrowH:5,  stages:['🌱','🌿','🌸','🍓'], bugChance:0.12},
  blueberry:  {id:'blueberry', name:'蓝莓',   ico:'🫐', desc:'珍贵果子，成长慢收益高',        buyCoins:35, shopUnlock:30, reward:80, expGain:40, autoGrowH:8,  stages:['🌱','🌿','🌸','🫐'], bugChance:0.15},
  cherry:     {id:'cherry',    name:'樱桃',   ico:'🍒', desc:'顶级水果，需耐心等待',          buyCoins:55, shopUnlock:60, reward:130,expGain:65, autoGrowH:12, stages:['🌱','🌿','🌸','🍒'], bugChance:0.18},
};
window.SEED_IDS = ['wheat','sunflower','strawberry','blueberry','cherry'];

// ─── 宠物品种 ───
window.PET_BREEDS = {
  hamster:  {id:'hamster',  name:'仓鼠'},
  cat:      {id:'cat',      name:'猫咪'},
  rabbit:   {id:'rabbit',   name:'小兔'},
  bird:     {id:'bird',     name:'小鸟'},
  dog:      {id:'dog',      name:'小狗'},
  panda:    {id:'panda',    name:'熊猫'},
  fox:      {id:'fox',      name:'小狐'},
  deer:     {id:'deer',     name:'小鹿'},
  penguin:  {id:'penguin',  name:'企鹅'},
  dragon:   {id:'dragon',   name:'小龙'},
  owl:      {id:'owl',      name:'猫头鹰'},
  bear:     {id:'bear',     name:'小熊'},
  unicorn:  {id:'unicorn',  name:'独角兽'},
  tiger:    {id:'tiger',    name:'小虎'},
};

// ─── 宠物5阶进化形态 ───
window.EVO_STAGES = {
  hamster:[
    {lv:1, name:'小豆丁',   desc:'圆滚滚的初生仓鼠',     color:'#f5c878', earSize:1.0, tailLen:0.3},
    {lv:2, name:'小可爱',   desc:'学会竖起来站立了',      color:'#f0b858', earSize:1.2, tailLen:0.4},
    {lv:3, name:'仓鼠骑士', desc:'戴上了小骑士帽',        color:'#e8a840', earSize:1.3, tailLen:0.5, crownIco:'⛑️'},
    {lv:4, name:'仙鼠大人', desc:'身上散发神奇光芒',      color:'#d4e8f8', earSize:1.5, tailLen:0.6, crownIco:'🌟'},
    {lv:5, name:'鼠神降临', desc:'传说中的神圣形态',      color:'#e0d0ff', earSize:1.8, tailLen:0.8, crownIco:'👑'},
  ],
  cat:[
    {lv:1, name:'小奶猫',   desc:'软乎乎的小猫咪',        color:'#fadadd', earSize:1.0, tailLen:1.0},
    {lv:2, name:'虎斑猫',   desc:'有了漂亮的花纹',        color:'#f0c890', earSize:1.1, tailLen:1.1},
    {lv:3, name:'猫侦探',   desc:'戴着神秘眼镜',          color:'#c8d0f8', earSize:1.2, tailLen:1.2, crownIco:'🔍'},
    {lv:4, name:'猫法师',   desc:'会施展魔法的猫',        color:'#9080e0', earSize:1.4, tailLen:1.3, crownIco:'🔮'},
    {lv:5, name:'猫神殿下', desc:'神圣光辉的猫界王者',    color:'#ffd700', earSize:1.6, tailLen:1.5, crownIco:'👑'},
  ],
  rabbit:[
    {lv:1, name:'小白兔',   desc:'雪白的小耳朵，很乖巧',  color:'#f8f8ff', earSize:1.0, tailLen:0.5},
    {lv:2, name:'彩色兔',   desc:'耳朵变成了彩色',        color:'#e8f4ff', earSize:1.2, tailLen:0.5},
    {lv:3, name:'兔子魔女', desc:'会念咒语的兔子',        color:'#f0c8f8', earSize:1.4, tailLen:0.6, crownIco:'🎩'},
    {lv:4, name:'月兔使者', desc:'来自月亮的使者',        color:'#d0e8ff', earSize:1.6, tailLen:0.7, crownIco:'🌙'},
    {lv:5, name:'兔仙',     desc:'羽化成仙的神兔',        color:'#fff0d0', earSize:1.8, tailLen:0.8, crownIco:'🌸'},
  ],
  bird:[
    {lv:1, name:'小雏鸟',   desc:'刚出壳的小鸟',          color:'#f0e860', earSize:1.0, tailLen:0.5},
    {lv:2, name:'五彩鸟',   desc:'羽毛变得五彩斑斓',      color:'#90e0f8', earSize:1.0, tailLen:0.7, crownIco:'🎵'},
    {lv:3, name:'歌唱家',   desc:'会唱美丽歌声',          color:'#f090c0', earSize:1.0, tailLen:0.9, crownIco:'🎤'},
    {lv:4, name:'凤凰雏',   desc:'凤凰血统觉醒',          color:'#ff8030', earSize:1.0, tailLen:1.2, crownIco:'🔥'},
    {lv:5, name:'神鸟',     desc:'传说中神圣的不死鸟',    color:'#ffd080', earSize:1.0, tailLen:1.5, crownIco:'⚡'},
  ],
  dog:[
    {lv:1, name:'小奶狗',   desc:'圆眼大耳，软乎乎',      color:'#f5deb3', earSize:1.0, tailLen:0.5},
    {lv:2, name:'大耳萌犬', desc:'耳朵超大，最爱撒娇',    color:'#deb887', earSize:1.3, tailLen:0.6},
    {lv:3, name:'警卫犬',   desc:'戴上酷酷的执勤帽',      color:'#cd853f', earSize:1.3, tailLen:0.7, crownIco:'🎖️'},
    {lv:4, name:'忠犬骑士', desc:'忠心耿耿守护主人',      color:'#b8860b', earSize:1.5, tailLen:0.8, crownIco:'🌟'},
    {lv:5, name:'神犬降临', desc:'传说神犬，万兽臣服',    color:'#ffe4b5', earSize:1.7, tailLen:1.0, crownIco:'👑'},
  ],
  panda:[
    {lv:1, name:'小滚滚',   desc:'黑白圆滚滚，呆萌可爱',  color:'#f5f5f5', earSize:1.0, tailLen:0.2},
    {lv:2, name:'竹叶贪吃', desc:'抱着竹叶不撒手',        color:'#f0f0f0', earSize:1.1, tailLen:0.2, crownIco:'🎋'},
    {lv:3, name:'功夫熊猫', desc:'学了一点点武功',        color:'#e8e8e8', earSize:1.2, tailLen:0.3, crownIco:'🥊'},
    {lv:4, name:'国宝大人', desc:'身上散发威严光芒',      color:'#ddeeff', earSize:1.4, tailLen:0.3, crownIco:'🎆'},
    {lv:5, name:'熊猫仙君', desc:'超越凡尘的仙熊形态',    color:'#e8e0ff', earSize:1.6, tailLen:0.4, crownIco:'👑'},
  ],
  fox:[
    {lv:1, name:'小狐狸',   desc:'尖耳小脸，机灵可爱',    color:'#ff8c42', earSize:1.0, tailLen:0.8},
    {lv:2, name:'调皮小狐', desc:'爱捉弄人的小坏蛋',      color:'#e07030', earSize:1.1, tailLen:1.0},
    {lv:3, name:'魅惑狐女', desc:'散发神秘气质的狐狸',    color:'#e8a060', earSize:1.3, tailLen:1.2, crownIco:'🔮'},
    {lv:4, name:'八尾之狐', desc:'传闻有八条尾巴！',      color:'#c86820', earSize:1.4, tailLen:1.4, crownIco:'✨'},
    {lv:5, name:'九尾天狐', desc:'千年修炼，九尾全开！',  color:'#ffd4a0', earSize:1.6, tailLen:1.8, crownIco:'👑'},
  ],
  deer:[
    {lv:1, name:'小梅花鹿', desc:'斑点小鹿，温柔可爱',    color:'#d4956a', earSize:1.0, tailLen:0.3},
    {lv:2, name:'彩虹小鹿', desc:'鹿角开始长出来了',      color:'#c8856a', earSize:1.1, tailLen:0.3},
    {lv:3, name:'鹿角精灵', desc:'鹿角开了花，神奇！',    color:'#b87860', earSize:1.2, tailLen:0.4, crownIco:'🌺'},
    {lv:4, name:'月光神鹿', desc:'月光照耀下闪闪发光',    color:'#c8d8f0', earSize:1.4, tailLen:0.5, crownIco:'🌙'},
    {lv:5, name:'麒麟传人', desc:'麒麟血脉完全觉醒！',    color:'#e8d8a0', earSize:1.6, tailLen:0.7, crownIco:'👑'},
  ],
  penguin:[
    {lv:1, name:'小企鹅',   desc:'摇摇摆摆超可爱',        color:'#3a3a4a', earSize:0.8, tailLen:0.2},
    {lv:2, name:'潮流企鹅', desc:'学会了时髦的走路方式',  color:'#2a2a3a', earSize:0.9, tailLen:0.2, crownIco:'🕶️'},
    {lv:3, name:'企鹅DJ',   desc:'沉迷音乐的律动企鹅',    color:'#1a1a30', earSize:0.9, tailLen:0.3, crownIco:'🎧'},
    {lv:4, name:'冰原使者', desc:'来自南极深处的使者',    color:'#2040a0', earSize:1.0, tailLen:0.3, crownIco:'❄️'},
    {lv:5, name:'极光神企', desc:'极光赋予神圣力量！',    color:'#102080', earSize:1.1, tailLen:0.4, crownIco:'👑'},
  ],
  dragon:[
    {lv:1, name:'小龙崽',   desc:'刚孵化的小龙，软乎',    color:'#60d080', earSize:0.9, tailLen:0.8},
    {lv:2, name:'火焰幼龙', desc:'喷出了第一口小火焰',    color:'#e06040', earSize:1.0, tailLen:1.0, crownIco:'🔥'},
    {lv:3, name:'降龙少年', desc:'翅膀长大了！能飞啦',    color:'#c04030', earSize:1.1, tailLen:1.2, crownIco:'⚔️'},
    {lv:4, name:'龙族王子', desc:'威风凛凛的龙之血脉',    color:'#9030b0', earSize:1.3, tailLen:1.4, crownIco:'🌟'},
    {lv:5, name:'神龙降世', desc:'古老神龙重临人间！',    color:'#d0a020', earSize:1.5, tailLen:1.8, crownIco:'👑'},
  ],
  owl:[
    {lv:1, name:'小猫头鹰', desc:'大眼睛，转头360°',      color:'#c8a870', earSize:1.0, tailLen:0.4},
    {lv:2, name:'学霸鸮',   desc:'戴上了厚厚的眼镜',      color:'#b89860', earSize:1.1, tailLen:0.5, crownIco:'📚'},
    {lv:3, name:'魔法师鸟', desc:'习得了古老魔法知识',    color:'#a08850', earSize:1.2, tailLen:0.6, crownIco:'🔮'},
    {lv:4, name:'时间守望', desc:'能看穿时间的神奇鸮鸟',  color:'#6060b0', earSize:1.4, tailLen:0.7, crownIco:'⏳'},
    {lv:5, name:'智慧之神', desc:'无所不知的传说枭神',    color:'#d0c090', earSize:1.6, tailLen:0.9, crownIco:'👑'},
  ],
  bear:[
    {lv:1, name:'小棕熊',   desc:'圆滚滚肉嘟嘟好可爱',    color:'#c08040', earSize:1.0, tailLen:0.2},
    {lv:2, name:'蜜糖熊',   desc:'最爱吃蜂蜜的小馋熊',    color:'#b07030', earSize:1.1, tailLen:0.2, crownIco:'🍯'},
    {lv:3, name:'探险熊',   desc:'背着小背包走天下',      color:'#a06020', earSize:1.2, tailLen:0.3, crownIco:'🗺️'},
    {lv:4, name:'星空大熊', desc:'星光照耀的神秘力量',    color:'#2040a0', earSize:1.4, tailLen:0.3, crownIco:'🌌'},
    {lv:5, name:'熊之神',   desc:'传说中的熊族至尊！',    color:'#c0a060', earSize:1.6, tailLen:0.4, crownIco:'👑'},
  ],
  unicorn:[
    {lv:1, name:'独角小马', desc:'头上有个小小的角',      color:'#f0d0f0', earSize:1.0, tailLen:0.8},
    {lv:2, name:'彩虹马',   desc:'鬃毛变成了彩虹色',      color:'#e8d0ff', earSize:1.1, tailLen:1.0, crownIco:'🌈'},
    {lv:3, name:'仙灵独角', desc:'角开始发出迷人光芒',    color:'#d8c0ff', earSize:1.2, tailLen:1.2, crownIco:'💫'},
    {lv:4, name:'梦境使者', desc:'穿梭于梦与现实之间',    color:'#c0a8ff', earSize:1.4, tailLen:1.4, crownIco:'✨'},
    {lv:5, name:'虹光神兽', desc:'彩虹赋予的最终形态！',  color:'#ffe8ff', earSize:1.6, tailLen:1.8, crownIco:'👑'},
  ],
  tiger:[
    {lv:1, name:'小虎崽',   desc:'圆耳斑纹，萌气十足',    color:'#f0a030', earSize:1.0, tailLen:0.7},
    {lv:2, name:'斑纹少年', desc:'条纹越来越清晰帅气',    color:'#e09020', earSize:1.1, tailLen:0.8},
    {lv:3, name:'虎将学徒', desc:'开始展现王者风范',      color:'#c07810', earSize:1.2, tailLen:0.9, crownIco:'⚔️'},
    {lv:4, name:'山中之王', desc:'威震四方的虎王',        color:'#b06800', earSize:1.4, tailLen:1.0, crownIco:'🌟'},
    {lv:5, name:'百兽之主', desc:'传说中的上古白虎！',    color:'#f8f0e0', earSize:1.6, tailLen:1.2, crownIco:'👑'},
  ],
};

// ─── 进化所需学习经验（Lv1→2, Lv2→3 ... Lv4→5） ───
window.EVO_EXP_REQUIRED = [0, 60, 120, 200, 300, 0];

// ─── 各宠物差分对话 ───
window.PET_TALK = {
  feed:       ['好吃好吃！🥰','嗯嗯！最爱主人了！','咕噜咕噜~谢谢～','哇这个好香！','饱饱的感觉真好～'],
  play:       ['耶！快跟我玩！','好好玩好好玩！','今天好开心！🎉','再来再来！！','哈哈哈跑不过我～'],
  bath:       ['凉凉的，舒服～','香喷喷的！','洗完整个都通透了~','好干净好开心！','嗯嗯以后要常洗澡'],
  sleep:      ['呼呼呼……zzzz','好困哦……让我睡一会儿','（抱着小被子睡着了）','梦里见～','zzz…睡得真香'],
  train:      ['我在努力学习！💪','知识就是力量！','主人，我变强了吗？','认真学习！！','脑子好像转起来了～'],
  tap:        ['哎！戳我干嘛！','嘿嘿，挠痒痒吗？','啊！被发现了！','哈哈主人最坏了！','啊啊啊好痒！！','我在这里呢！'],
  rename_ok:  ['哇！好好听的名字！','这个名字我喜欢！✨','嗯嗯，以后就叫这个啦！','名字好听，更爱主人了～'],
  cloth_on:   ['哇！好漂亮！快看我快看我！','穿上了新衣服，开心！✨','这件衣服好适合我！','嗯嗯今天是最美的～'],
  evolve_ready:  ['主人！我感觉自己要变了！✨','好像有什么东西要爆发出来！','我……我要进化了吗！？','全身发热是要进化的预兆吗！'],
  evolve_done:   ['哇！！我变了！太帅了！','这……这就是新的我吗！！','主人快来看！！我进化了！','变强了！！以后保护主人！'],
  degrade_ask:   ['主人……难道你不满意现在的我吗？🥺','呜呜……你是不是不喜欢我了……','不要退化嘛！这个形态很帅的！','主人你不是说要永远在一起吗QAQ'],
  degrade_cancel:['谢谢主人！我就知道你最好了！🥰','耶！！不退化了！主人万岁！','啊主人你最温柔了！','嗯嗯我会继续努力的！'],
  degrade_done:  ['……（默默接受）好吧，我会重新努力的','唉，退回去了……下次一定！'],
  switch_away:   ['你要养其他好宝宝了吗……😢','主人……你还会回来看我吗……','虽然有点难过，但我会等你的……','主人不要忘记我啊！！'],
  switch_back:   ['主人你回来啦！！🥰','哇！我就知道主人最爱我！','想死你了！！','主人主人主人！！！！'],
  first_buy_hamster: ['嗨！我是仓鼠！请多关照～！🐹','好开心找到主人了！','啊啊啊第一次有主人了好激动！！'],
  first_buy_cat:     ['喵～本大人降临了，要好好照顾我哦！🐱','喵喵喵！主人要每天摸我！','……（高冷地瞄了你一眼）……还行吧'],
  first_buy_rabbit:  ['你好主人！我会乖乖的！🐰','主人！我想吃胡萝卜！','嗯嗯～我们要做好朋友哦！'],
  first_buy_bird:    ['啾啾啾！主人你好！🐦','我来了！我就是传说中的彩色小鸟！','啾～～好开心好开心！'],
  first_buy_dog:     ['汪汪！！我好开心主人！🐶','我会一直陪着你的！汪！','汪汪汪！！！快来摸我！！'],
  first_buy_panda:   ['嗷嗷～滚过来了哦～🐼','我想吃竹子，主人有竹子吗？','嗯……滚来滚去真的很累诶'],
  first_buy_fox:     ['嘿嘿～狐狸来啦！🦊','主人你的零食都是我的了！','哈哈哈我最聪明了！'],
  first_buy_deer:    ['咦…主人好温柔呢～🦌','我会乖乖的，请多关照！','轻轻的……我有点怕怕'],
  first_buy_penguin: ['唔唔唔～企鹅来了！🐧','摇摇摆摆走路是因为太可爱了！','冰冰凉凉的感觉真好～'],
  first_buy_dragon:  ['小龙来啦！别怕我不咬人！🐉','有一天我会变成真正的大龙的！','呼～我还不会喷火…呜'],
  first_buy_owl:     ['咕咕～你好！我是猫头鹰！🦉','我知道很多事情哦！你想听吗？','365度都能看到！主人别乱来～'],
  first_buy_bear:    ['熊来咯！！给我蜂蜜！🐻','嗯……主人的味道是蜂蜜味的……','嗷嗷嗷～圆滚滚就是我！'],
  first_buy_unicorn: ['嘿嘿！独角兽出现啦！🦄','我能给你带来好运的！','闻闻……有彩虹的味道！'],
  first_buy_tiger:   ['嗷呜！别怕，我是友善的虎！🐯','我虽然凶，但是很软哒！','嗷！主人快来揉我！'],
  low_food:    ['主人……好饿哦😢','肚子咕噜咕噜叫了……','能给我吃点东西吗？'],
  low_happy:   ['好无聊哦……','主人你在哪里？🥺','陪陪我嘛～'],
  low_energy:  ['好累……好想睡觉……','脚有点软，休息一下吧','体力透支了……'],
};

// ─── 宠物衣服 ───
window.SHOP_CLOTHES = [
  {id:'c_bow',        name:'粉色蝴蝶结', ico:'🎀', desc:'甜美可爱，最适合仓鼠～',     price:30},
  {id:'c_hat',        name:'草编小帽',   ico:'🪖', desc:'清新草帽，夏日农场风十足',   price:40},
  {id:'c_crown',      name:'金色皇冠',   ico:'👑', desc:'闪闪发光，你是最尊贵的宝宝', price:80},
  {id:'c_scarf',      name:'格子围巾',   ico:'🧣', desc:'暖和的格子围巾，秋冬必备',   price:45},
  {id:'c_sunglasses', name:'爱心墨镜',   ico:'🕶️',desc:'酷炫造型，颜值提升100%',    price:55},
  {id:'c_backpack',   name:'小书包',     ico:'🎒', desc:'认真学习的装扮，加油！',     price:50},
];

// ─── 商店宠物（levelUnlock=需要玩家等级）───
window.SHOP_PETS = [
  {id:'p_hamster', name:'米色仓鼠',   ico:'🐹', desc:'毛茸茸的第一只小伙伴',           price:0,   breed:'hamster',  levelUnlock:0},
  {id:'p_cat',     name:'粉色猫咪',   ico:'🐱', desc:'软乎乎的小猫，爱撒娇',           price:60,  breed:'cat',      levelUnlock:0},
  {id:'p_rabbit',  name:'雪白小兔',   ico:'🐰', desc:'长耳朵乖巧兔，超级可爱',         price:80,  breed:'rabbit',   levelUnlock:0},
  {id:'p_bird',    name:'彩色小鸟',   ico:'🐦', desc:'羽毛鲜艳，活泼爱唱歌',           price:100, breed:'bird',     levelUnlock:0},
  {id:'p_dog',     name:'可爱小狗',   ico:'🐶', desc:'忠诚活泼，汪汪超开心',           price:70,  breed:'dog',      levelUnlock:2},
  {id:'p_panda',   name:'国宝熊猫',   ico:'🐼', desc:'黑白萌神，爱吃竹叶',             price:90,  breed:'panda',    levelUnlock:3},
  {id:'p_fox',     name:'调皮小狐',   ico:'🦊', desc:'机灵可爱，暗藏神秘能量',         price:85,  breed:'fox',      levelUnlock:3},
  {id:'p_bear',    name:'蜜糖小熊',   ico:'🐻', desc:'圆滚滚的憨萌大熊',               price:80,  breed:'bear',     levelUnlock:3},
  {id:'p_deer',    name:'梅花小鹿',   ico:'🦌', desc:'温柔优雅，鹿角开花',             price:110, breed:'deer',     levelUnlock:5},
  {id:'p_penguin', name:'摇摆企鹅',   ico:'🐧', desc:'一摇一摆超可爱，来自极地',       price:100, breed:'penguin',  levelUnlock:5},
  {id:'p_owl',     name:'大眼猫头鹰', ico:'🦉', desc:'无所不知，360°旋转大眼',        price:105, breed:'owl',      levelUnlock:5},
  {id:'p_dragon',  name:'小火龙',     ico:'🐲', desc:'萌系小龙，未来能喷火',           price:130, breed:'dragon',   levelUnlock:7},
  {id:'p_tiger',   name:'虎纹小虎',   ico:'🐯', desc:'可爱老虎崽，友善不咬人',         price:120, breed:'tiger',    levelUnlock:7},
  {id:'p_unicorn', name:'彩虹独角兽', ico:'🦄', desc:'梦幻神兽，只为特别的主人出现',   price:150, breed:'unicorn',  levelUnlock:10},
];

// ─── 商店道具 ───
window.SHOP_TOOLS = [
  {id:'t_fert',      name:'超级肥料',     ico:'💊', desc:'立即使用：所有作物成长+20%',                          price:40,  type:'instant_fert'},
  {id:'t_pesticide', name:'除虫药',       ico:'🧴', desc:'存入仓库，在农场页面选地块时使用',                   price:25,  type:'buy_pest'},
  {id:'t_autopest',  name:'全自动除虫机', ico:'🤖', desc:'永久驻场！自动消灭所有虫害，农场常驻显示🤖',         price:160, type:'auto_pest'},
  {id:'t_expboost',  name:'学霸加成',     ico:'📖', desc:'答题经验×2，持续10道题，顶部显示剩余',              price:60,  type:'exp_boost'},
  {id:'t_coin50',    name:'金币礼包',     ico:'💰', desc:'立即获得50金币（每账号限购5次）',                   price:0,   type:'coins_for_stars', starPrice:200, maxBuy:5},
  {id:'t_autowater', name:'自动喷水器',   ico:'🚿', desc:'每2小时自动给全部作物浇水，农场常驻显示🚿',          price:120, type:'auto_water'},
];

// ─── 成就定义 ───
window.ACHS = [
  {id:'q_first',    ico:'📝', nm:'初试答题',   desc:'完成第1次答题',               cond:s=>s.totalAnswered>=1},
  {id:'q_c1',       ico:'🌱', nm:'破土而出',   desc:'在学习类操作中累计答对1题',   cond:s=>s.totalCorrect>=1},
  {id:'q_c10',      ico:'📚', nm:'勤学苦练',   desc:'累计答对10题',                cond:s=>s.totalCorrect>=10},
  {id:'q_c30',      ico:'🎓', nm:'博学多才',   desc:'累计答对30题',                cond:s=>s.totalCorrect>=30},
  {id:'q_c60',      ico:'🏛️',nm:'教育学通',   desc:'累计答对60题',                cond:s=>s.totalCorrect>=60},
  {id:'q_c100',     ico:'🌟', nm:'学习达人',   desc:'累计答对100题',               cond:s=>s.totalCorrect>=100},
  {id:'streak3',    ico:'🔥', nm:'小有连胜',   desc:'连续答对3题',                 cond:s=>s.maxStreak>=3},
  {id:'streak7',    ico:'💥', nm:'连胜达人',   desc:'连续答对7题',                 cond:s=>s.maxStreak>=7},
  {id:'streak15',   ico:'🌪️',nm:'答题风暴',   desc:'连续答对15题',                cond:s=>s.maxStreak>=15},
  {id:'farm_seed',  ico:'🌰', nm:'播种者',     desc:'购买第1粒种子',               cond:s=>s.totalSeeds>=1},
  {id:'farm_plant', ico:'🌱', nm:'农夫初心',   desc:'成功播种1次',                 cond:s=>s.totalPlanted>=1},
  {id:'farm_h1',    ico:'🌾', nm:'初次丰收',   desc:'成功收获1次',                 cond:s=>s.harvests>=1},
  {id:'farm_h10',   ico:'🧺', nm:'勤劳农夫',   desc:'累计收获10次',                cond:s=>s.harvests>=10},
  {id:'farm_h30',   ico:'🏡', nm:'丰收大户',   desc:'累计收获30次',                cond:s=>s.harvests>=30},
  {id:'expand1',    ico:'🔓', nm:'开荒能手',   desc:'解锁1块新地',                 cond:s=>s.plotsUnlocked>=1},
  {id:'expand4',    ico:'🗺️',nm:'大农场主',   desc:'解锁全部4块新地',             cond:s=>s.plotsUnlocked>=4},
  {id:'pet_f1',     ico:'🍎', nm:'细心喂养',   desc:'喂食宠物1次',                 cond:s=>s.petFeedCount>=1},
  {id:'pet_f20',    ico:'❤️', nm:'用心照料',   desc:'喂食宠物20次',                cond:s=>s.petFeedCount>=20},
  {id:'pet_lv2',    ico:'⭐', nm:'第一次进化', desc:'宠物进化到Lv.2',             cond:s=>s.petLevel>=2},
  {id:'pet_lv5',    ico:'🌟', nm:'神宠降临',   desc:'宠物进化到Lv.5（满级）',     cond:s=>s.petLevel>=5},
  {id:'shop_cloth', ico:'👗', nm:'时尚搭配',   desc:'购买第1件宠物衣服',           cond:s=>s.ownedClothes.length>=1},
  {id:'shop_pet',   ico:'🐾', nm:'爱宠收藏家', desc:'拥有2只以上宠物',             cond:s=>s.ownedPets.length>=2},
  {id:'pet_drag',   ico:'🖱️',nm:'爱抚大师',   desc:'拖动宠物5次',                 cond:s=>(s.dragCount||0)>=5},
  {id:'lv5',        ico:'🌿', nm:'升学达人',   desc:'玩家达到Lv.5',               cond:s=>s.level>=5},
  {id:'lv10',       ico:'🏆', nm:'学习之路',   desc:'玩家达到Lv.10',              cond:s=>s.level>=10},
  {id:'coins200',   ico:'💰', nm:'小富农',     desc:'累计获得200金币',             cond:s=>s.totalCoins>=200},
  {id:'seed5',      ico:'🌈', nm:'种植达人',   desc:'解锁全部5种种子',             cond:s=>s.unlockedSeeds.length>=5},
  {id:'class_rank', ico:'🥇', nm:'班级第一',   desc:'班级排名第一',                cond:s=>s._classRank===1},
  {id:'pet14',      ico:'🐾', nm:'动物园园长', desc:'拥有5只以上宠物',             cond:s=>s.ownedPets.length>=5},
];

// ─── 默认存档 ───
window.DEFAULT_SAVE = {
  ver: 6,
  playerName: '', classId: '',
  level: 1, exp: 0, score: 0, coins: 50, totalCoins: 50,
  totalAnswered: 0, totalCorrect: 0, maxStreak: 0, curStreak: 0,
  catCorrect: {基础:0,人物:0,属性:0,形态:0,心理:0,教师:0,课程:0,德育:0},
  usedQ: [],
  unlockedAch: [], newAch: [],
  plots: [
    {s:'empty',g:0,seed:'wheat',lastWater:0,hasBug:false,hasCrack:false},
    {s:'empty',g:0,seed:'wheat',lastWater:0,hasBug:false,hasCrack:false},
    {s:'empty',g:0,seed:'wheat',lastWater:0,hasBug:false,hasCrack:false},
    {s:'empty',g:0,seed:'wheat',lastWater:0,hasBug:false,hasCrack:false},
    {s:'locked',g:0,seed:'wheat',lastWater:0,hasBug:false,hasCrack:false,unlockProgress:0},
    {s:'locked',g:0,seed:'wheat',lastWater:0,hasBug:false,hasCrack:false,unlockProgress:0},
    {s:'locked',g:0,seed:'wheat',lastWater:0,hasBug:false,hasCrack:false,unlockProgress:0},
    {s:'locked',g:0,seed:'wheat',lastWater:0,hasBug:false,hasCrack:false,unlockProgress:0},
  ],
  seedBag: {wheat:2,sunflower:0,strawberry:0,blueberry:0,cherry:0},
  totalSeeds: 0, totalPlanted: 0, harvests: 0, plotsUnlocked: 0,
  unlockedSeeds: ['wheat','sunflower','strawberry'],
  hasAutoWater: false,
  hasAutoPest: false,
  pestStock: 0,
  coinGiftBought: 0,

  petBreed: 'hamster', petName: '小饼干', petLevel: 1,
  petFood: 65, petHappy: 55, petClean: 72, petEnergy: 80,
  petLearnExp: 0,
  petFeedCount: 0, petPlayCount: 0,
  dragCount: 0,

  petSaves: {
    p_hamster: null,
  },

  ownedClothes: [], equippedCloth: null,
  ownedPets: ['p_hamster'], activePet: 'p_hamster',
  expBoostLeft: 0,
  lastSaveTime: 0,
  _classRank: 99,
};

// ─── 随机名字库 ───
window.PET_NAMES = ['豆豆','团子','糯米','麻薯','奶茶','布丁','果冻','芝士','薯片','饼干',
  '泡芙','可可','抹茶','芒果','桃子','草莓','蓝莓','樱桃','柠檬','西瓜',
  '花花','朵朵','乐乐','萌萌','圆圆','毛毛','胖胖','懒懒','球球','泡泡'];
window.PLAYER_NAMES = ['学霸农场主','答题小能手','勤劳的学生','未来优秀教师','知识探索者'];

window.EXP_TABLE = [0,100,220,360,520,700,900,1120,1360,1620,1900];
window.expForLv = lv => EXP_TABLE[Math.min(lv, EXP_TABLE.length-1)] || lv*200;
