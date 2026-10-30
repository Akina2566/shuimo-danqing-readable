# 鲸鱼娘 · 水墨丹青（清晰版）· Whale Girl · Ink Wash (Readable)

[English](README.en.md) | 中文

> **这是一个改版（fork），不是原作。**
> 原皮肤 **《鲸鱼娘 · 水墨丹青》** 由 **stushansusu** 创作，经 [DSH Market](https://dsh-market.com) 发布，
> 采用 **CC BY-NC-SA 4.0** 许可。
> 本仓库是 **Akina2566** 在其基础上做的**可读性改进版**，同样以 CC BY-NC-SA 4.0 分享。
>
> 原始美术素材（背景视频、纸纹、角色立绘）版权归原作者，本仓库仅按原许可条款原样附带。
> 原作完整设计文档见 [`docs/ORIGINAL-README.zh.md`](docs/ORIGINAL-README.zh.md)。

---

## 为什么要做这个改版

原皮肤视觉上很完整，但在**中文长文本阅读**场景下有五处硬伤：

1. **字体回退**：字体栈是 `'Noto Serif SC', 'Source Han Serif SC', SimSun, ...`。
   多数 Windows 机器没装思源宋体，实际回退到 **SimSun（宋体）**——宋体在 10.5–12.5px、
   压在半透明墨玻璃上时笔画极细，白字发虚。
2. **小字号过密**：侧栏标题、时间戳、状态行大量使用 10.5px / 11px。
3. **彩色描边过多**：原作把「墨绿」当作「可交互」的语义色，散布在按钮、边框、图标、
   进度条、链接等 **300+ 处**，满屏彩色描边削弱主次。
4. **品牌行被替换**：左上角被替换成「鲸鱼娘·水墨丹青」+ 朱印，遮挡原厂标识。
5. **面板过透**：侧栏仅 54% 不透明度，背后 4K 视频透上来，文字与画面互相干扰。

---

## 我做了哪些改动

> 全部改动都在 **CSS 与资源层**：未改皮肤格式、未引入 JS、未改任何美术素材。

### 1. 字体：宋体 → 微软雅黑

```css
/* skin.css 两处（浅色块 / 暗色块） */
/* 原 */
--dsw-font-family: 'Noto Serif SC', 'Source Han Serif SC', SimSun, 'Microsoft YaHei UI', system-ui, serif;
/* 改 */
--dsw-font-family: 'Microsoft YaHei UI', 'Microsoft YaHei', 'DengXian', 'Segoe UI', system-ui, sans-serif;
```

`patches.css` 的 `--sm-serif` 同步替换。
**`--sm-kai`（楷体）保留**——标题、印章、「新会话」等装饰字仍是水墨笔意，只把正文换成无衬线。

### 2. 小字号整体上调一档（11 处）

| 原 | 改 |
| --- | --- |
| 10.5px | 11.5px |
| 11px | 11.5px |
| 11.5px | 12px |
| 12px | 12.5px |
| 12.5px | 13px |

### 3. 去掉全部彩色描边（改动量最大）

原作把这两支色当作「活口」语义，散落在 300+ 处：

| 原色 | 原用途 | 改为 |
| --- | --- | --- |
| `#6FA87F` 墨绿高光 | 图标、链接、聚焦、状态 | `#98A1A9` |
| `#3D6649` 深墨绿 | 填充、笔迹、渐变 | `#6D747A` |
| `#4D6576` 牌子蓝灰 | 描边、分隔 | `#7B8288` |
| `#597EA0` 长发高光蓝 | 侧栏笔锋、品牌高光 | `#8F959C` |
| `#7D9AAA` 品牌蓝 | 按钮、选中态（仅描边语境） | `#8B959E` |

替换范围与原则：

- `patches.css` / `skin.css` 中绿色系 **171 处**、蓝灰系 **187 处**
- 只替换 **`border` / `border-*` / `outline` / `box-shadow` / 背景装饰** 语境
- 需要保留色相的元素（选中行强调、链接文字）按同一亮度层级降饱和，不整体去色

替换后：全库绿色引用 **0**、彩色描边 **0**。

### 4. 品牌行恢复原厂字标

```css
/* 原 */
body [data-slot='sidebar.brand.name'] > svg { visibility: hidden; }
body span:has(> [data-slot='sidebar.brand.name'])::after { content: '鲸鱼娘·水墨丹青'; /* + 朱印 */ }
/* 改 */
body [data-slot='sidebar.brand.name'] > svg { visibility: visible; }
body span:has(> [data-slot='sidebar.brand.name'])::after { content: none; }
```

左上角回到 **deepseek HARNESS**。

### 5. 暗色模式次要文字提亮（6 个 token）

| token | 原 | 改 |
| --- | --- | --- |
| `--dsw-alias-label-caption` | `#939895` | `#b3b8b4` |
| `--dsw-alias-label-tertiary` | `#939895` | `#b3b8b4` |
| `--dsw-alias-label-dimmed` | `#6a6f71` | `#919692` |
| `--dsw-alias-markdown-placeholder` | `#6a6f71` | `#919692` |
| `--dsw-alias-label-secondary` | `#B8BEB7` | `#cdd2cc` |
| `--dsw-alias-label-primary-dimmed` | `#B8BEB7` | `#cdd2cc` |

### 6. 面板不透明度压实（只动文字承载区）

| 变量 | 原 | 改 | 用在哪 |
| --- | --- | --- | --- |
| `--sm-glass` | `#2227308a`（54%） | `#222730d9`（85%） | 侧栏 |
| `--sm-glass-card` | `#2227309e`（62%） | `#222730e6`（90%） | 输入卡、会话头部、浮层 |
| `--sm-glass-sheet` | `#22273075`（46%） | `#222730c4`（77%） | 次级浮层 |

背景视频、纸纹、笔锋、墨点、朱印（品牌行那方除外）**未改动**，人物仍能透出轮廓。

### 7. 文字柔光减负

会话区与输入卡内的 `text-shadow` 从三层（3/10/24px）收到两层（2/8px），字缘不再有那层「糊」的晕。

### 8. 新增定格帧 `assets/sm-idle-16.webp`

从原背景视频 **第 16 秒**抽帧，并把 `skin.json` 声明的 scrim 渐变烘焙进像素，
作为「空闲时的静止背景」（1920×1080，70 KB）。

配合配套插件可做到：**聊天时播放整段视频、其余时间定格在这一帧**。

---

## 安装

### 方式一：放进用户皮肤目录（推荐）

```bash
# Windows
%USERPROFILE%\.dsh\skins\shuimo-danqing-readable\

# macOS / Linux
~/.dsh/skins/shuimo-danqing-readable/
```

然后在 **设置 → 皮肤中心** 里选「鲸鱼娘 · 水墨丹青（清晰版）」，刷新页面即可生效，无需重启。

### 方式二：克隆后复制

```bash
git clone https://github.com/Akina2566/shuimo-danqing-readable.git
cp -r shuimo-danqing-readable ~/.dsh/skins/
```

### 注意

- 本皮肤**暗色专用**（manifest 标记 `dark-only`），浅色模式未适配。
- 目录里**没有** `dsh-market.provenance.json`：本改版不是市场原件，
  皮肤中心会当作**本地皮肤**处理，不参与市场更新，也不会被商店覆盖。
- 背景视频 21.5 MB，克隆稍慢；如只需文字可读性改动，可删掉 `assets/shuimo-danqing-loop.mp4`
  并把 `skin.json` 里 `backgroundMedia` 改为 `type: "image"` 指向定格帧。

---

## 目录结构

```
.
├── skin.json                        # 皮肤清单（id / 名称 / 素材引用）
├── skin.css                         # L1 token 层（官方 --dsw-* 变量重映射）
├── patches.css                      # L3 自由选择器层（机壳规则 + 本改版全部覆盖）
├── assets/
│   ├── shuimo-danqing-loop.mp4      # 背景视频 21.5MB（原作者素材）
│   ├── sm-idle-16.webp              # 定格帧（本改版新增，已烘焙 scrim）
│   ├── sm-paper-grain.webp          # 纸纹（原作者素材）
│   └── sm-paper-grain-strong.webp   # 纸纹强档（原作者素材）
├── preview/
│   ├── dark.jpg                     # 皮肤中心预览图（暗色）
│   └── light.jpg                    # 皮肤中心预览图（浅色）
├── docs/
│   ├── ORIGINAL-README.zh.md        # 原作完整设计文档（中文）
│   └── ORIGINAL-README.md           # 原作完整设计文档（英文）
├── LICENSE                          # CC BY-NC-SA 4.0
├── README.en.md                     # English
└── README.zh.md                     # 中文（本文件）
```

---

## 许可与归属

| 项 | 说明 |
| --- | --- |
| **原作** | 《鲸鱼娘 · 水墨丹青》 by **stushansusu** |
| **原作发布** | [DSH Market](https://dsh-market.com)（非官方作品，与本仓库无隶属关系） |
| **原作许可** | **CC BY-NC-SA 4.0** |
| **本改版** | 由 **Akina2566** 修改，同样以 **CC BY-NC-SA 4.0** 分享 |

按 CC BY-NC-SA 4.0 的三项要求：

- **署名 BY**：保留原作者署名，并在本 README、`skin.json` 的 `author` 字段中注明
- **非商业 NC**：不得用于商业用途
- **相同方式共享 SA**：本改版同样以 CC BY-NC-SA 4.0 发布

**美术素材**（背景视频、纸纹、角色立绘）版权归原作者，不在本改版改动范围内，
仅按原许可条款随皮肤分发。若原作者认为本仓库有不妥之处，联系后立即下架。

---

## 变更记录

### v1.0.0-readable

- 正文/UI 字体换为微软雅黑，装饰字保留楷体
- 小字号上调一档（11 处）
- 去除全部墨绿与牌子蓝彩色描边（358 处色值），统一中性灰墨
- 品牌行恢复原厂字标，移除朱印
- 暗色模式次要文字提亮（6 个 token）
- 面板不透明度压实（3 个变量）
- 文字柔光从三层收到两层
- 新增定格帧 `assets/sm-idle-16.webp`

---

## 相关

- 皮肤格式与皮肤中心：[zhu1090093659/dsh-web](https://github.com/zhu1090093659/dsh-web)
- 配套插件（背景动效闸门，实现「聊天时播放、空闲定格」）：
  [dsh-plugin-bg-motion](https://github.com/Akina2566/dsh-plugin-bg-motion)
