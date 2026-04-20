// ╔══════════════════════════════════════════════════════╗
// ║   🔥 学习农场 Firebase 配置文件  firebase-config.js  ║
// ╚══════════════════════════════════════════════════════╝
//
// 📌 操作步骤（只需做一次）：
//
//  第一步：创建 Firebase 项目
//    1. 打开 https://console.firebase.google.com
//    2. 点击"添加项目"，随便起个名字（如 study-farm）
//    3. 不需要开启 Google Analytics，直接继续
//
//  第二步：添加 Web 应用
//    1. 项目创建完成后，点击"</> Web"图标添加应用
//    2. 随便填一个应用名称（如 学习农场）
//    3. 不需要勾选 Firebase Hosting
//    4. 点击"注册应用"
//    5. 把下面显示的 firebaseConfig 里的内容复制到这个文件的对应位置
//
//  第三步：启用 Firestore 数据库
//    1. 左侧菜单点击"Firestore Database"
//    2. 点击"创建数据库"
//    3. 选择"以测试模式启动"（学习用途，30天内都可免费读写）
//    4. 区域选择 asia-east1（台湾）或 asia-northeast1（东京），更快
//
//  第四步：启用 Realtime Database（用于实时排行榜）
//    1. 左侧菜单点击"Realtime Database"
//    2. 点击"创建数据库"
//    3. 选择"以测试模式启动"
//    4. 把数据库的 URL（如 https://xxx-default-rtdb.firebaseio.com）填到下面
//
//  第五步：把下面的 YOUR_* 替换成你的实际值，保存文件
//
// ═══════════════════════════════════════════════════════

window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyDs-B3sMFc7FxOWlmR27FQTbxaIn7mZlMU",
  authDomain: "studyfarmgame.firebaseapp.com",
  projectId: "studyfarmgame",
  storageBucket: "studyfarmgame.firebasestorage.app",
  messagingSenderId: "889002649188",
  appId: "1:889002649188:web:472f687a3d11fbd8ebe171",
  measurementId: "G-NQS8RVVQ15",
// 正确（rtdb）
databaseURL: "https://studyfarmgame-default-rtdb.firebaseio.com"
};

// ─── 功能开关 ─────────────────────────────────────────
window.FIREBASE_OPTIONS = {
  enabled:          true,  // 总开关（改为 false 完全关闭云功能）
  cloudSave:        true,  // 账号数据云同步（换设备不丢档）
  classLeaderboard: true,  // 班级实时排行榜（不同手机的同学可以互相看到对方）
  autoSync:         true,  // 登录时自动从云端拉取最新数据
  debug:            false, // 开启后控制台显示详细日志
};
