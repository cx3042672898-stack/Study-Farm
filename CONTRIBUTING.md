# 贡献指南 Contributing Guide

感谢你对学习农场感兴趣！这里说明如何参与贡献。

---

## 🗂 项目结构速览

```
Study-Farm/
├── index.html              # 全部 UI 结构 + CSS 变量
├── game.js                 # 核心逻辑（农场/宠物/班级/积分/布局）
├── gamedata.js             # 常量定义、存储工具函数
├── pet_config.js           # 宠物种类、进化阶段、皮肤配置
├── subjects.js             # 题库路由（决定哪些题库被加载）
├── subject_*.js            # 各科目题库文件
└── firebase-*.js           # 云同步相关（可选）
```

---

## ✏️ 最欢迎的贡献：添加题库

题库文件格式统一，照着任意一个 `subject_xxx_mod.js` 仿写即可。

### 题目格式

```js
// subject_yoursubject_mod.js

window.SUBJECT_YOURSUBJECT = {
  id: 'yoursubject',
  name: '科目名称',          // 显示在题目标题
  icon: '📖',               // 显示用的 emoji
  questions: [
    {
      q: '题目内容？',
      options: ['A. 选项一', 'B. 选项二', 'C. 选项三', 'D. 选项四'],
      answer: 0,             // 正确答案的索引（0=A, 1=B, 2=C, 3=D）
      explanation: '解析说明（可选）'
    },
    // ... 更多题目
  ]
};
```

### 注册题库

在 `subjects.js` 里把你的题库加进去：

```js
// subjects.js
const SUBJECT_MODULES = {
  // ... 已有题库
  yoursubject: { file: 'subject_yoursubject_mod.js', obj: 'SUBJECT_YOURSUBJECT' },
};
```

再在 `index.html` 里引入脚本：

```html
<script src="subject_yoursubject_mod.js"></script>
```

---

## 🐾 添加新宠物

在 `pet_config.js` 里按如下格式新增：

```js
// pet_config.js → PET_TYPES 对象里
yourpet: {
  name: '宠物名',
  icon: '🐇',
  stages: [
    { name: 'Lv.1 幼崽', desc: '刚出生的小家伙' },
    { name: 'Lv.2 成长中', desc: '渐渐长大了' },
    { name: 'Lv.3 成熟', desc: '充满活力' },
    { name: 'Lv.4 精英', desc: '与你心灵相通' },
    { name: 'Lv.5 传说', desc: '万中无一的存在' },
  ]
}
```

宠物图片放在 `assets/pets/` 目录下，文件名格式为 `yourpet_1.png`（数字为阶段序号）。

---

## 🐛 报告 Bug

请在 [Issues](https://github.com/cx3042672898-stack/Study-Farm/issues) 里提交，说明：

1. 复现步骤（第几步出错）
2. 预期结果 vs 实际结果
3. 浏览器版本（Chrome / Edge / Safari）
4. 是手机端还是电脑端

---

## 🔧 本地开发

```bash
git clone https://github.com/cx3042672898-stack/Study-Farm.git
cd Study-Farm
# 直接用浏览器打开 index.html
# 推荐用 VS Code + Live Server 插件热重载
```

无需 Node.js / npm，纯静态页面，直接改文件刷新浏览器即可看到效果。

---

## 📐 代码风格

- JS：无分号可选，变量用 `camelCase`，函数用有意义的动词命名
- HTML/CSS：样式优先写在 `index.html` 的 `<style>` 块，复杂逻辑放 `game.js`
- 提交信息格式：`fix: 修复xxx` / `feat: 新增xxx` / `docs: 更新文档`

---

感谢你的贡献！🌾
