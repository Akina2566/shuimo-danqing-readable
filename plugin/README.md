# dsh-plugin-bg-motion

DSH Web GUI 的背景动效闸门：**聊天进行中播放整段视频，其余时间定格在第 16 帧静帧。**

## 行为

| 状态 | 表现 |
|---|---|
| 空闲（无回合进行） | 显示 `assets/sm-idle-16.webp` 定格图（自带 skin 的 scrim 烘入像素） |
| 回合进行中（思考/输出/工具调用） | 从 0 秒播放整段 25.33 秒视频，循环，套与定格图相同的 scrim |
| 回合结束后 | 约 1~3 秒内切回定格图并暂停 |

## 判定“回合进行中”的信号（分层，避免误触发）

1. 壳的标记：`[data-streaming]`、`[data-running]`
2. 输入框主按钮切到“停止”态（`aria-label` 含停止/stop，或图标出现 `<rect>` 方块）
3. 对话区内的 DOM 变化频率（**仅对话区**，排除输入框、侧栏、菜单）

排除项很关键：
- 全页统计会把“点按钮/开菜单”误判为输出 → 只统计对话区
- 输入框是 contenteditable，打字会产生大量变化 → 完全排除

## 关键实现细节（踩过的坑）

- **客户端半区必须用 `window.__ModuleLoader__.load({id, factory})` 包装**，写成 ESM（`export`）会让 web boot 直接崩：`Unexpected token 'export'`。
- **不要读 `ctx.container`**：未在 `inject` 声明时会抛 `cannot get property "container" without inject`，插件静默不生效。用全局 `document`。
- **不能靠 `video.currentTime = 16` 定格**：视频被 pause 后可能不再加载数据，`readyState` 卡 0，seek 永远不落地 → 画面停在白纸（片头/片尾都是纸）。改用“定格图 + 视频副本”的舞台方案。
- **视频压暗不能用 `filter: brightness()`**：视频开头宣纸 p95≈205，定格帧 p95≈72，等比缩放压不住亮部。必须在视频上叠**与 skin.json 相同的渐变 scrim**。
- **舞台层级**：`img`(下) → `video` → `scrim`(上)，靠 opacity 切换；scrim 只在视频显示时可见，避免定格图被双压。

## 安装

profile `~/.dsh/profiles/desktop/package.json` 里：
- `dependencies` 加 `"dsh-plugin-bg-motion": "link:D:\\deepseek-harness\\default-workspace\\dsh-plugin-bg-motion"`
- `dsh.profile.bundles` 加 `"dsh-plugin-bg-motion"`

`node_modules/dsh-plugin-bg-motion` 是 junction 指向本目录。改完需**重启 DSH**。

## 调试

控制台只看 `[bg-motion]` 开头的 debug：
```
[bg-motion] idle via settle
[bg-motion] running via marker
[bg-motion] idle via quiet
```
若出现 `playback gate not installed:` 说明 apply 抛错，插件未生效。

## 测试

```sh
node tools/classic-test.mjs lib/client.js   # 经典脚本可加载（复现过崩溃的场景）
node tools/stage-test.mjs   lib/client.js   # 舞台创建 + 图/视频显隐切换
node tools/turn-test.mjs    lib/client.js   # 回合开始 / 中途静默 6s / 结束回停
node tools/typing-test.mjs  lib/client.js   # 打字不触发
node tools/clicks-test.mjs  lib/client.js   # 点外部按钮不触发
```

全量回归（应全部 PASS）：

```sh
for t in classic-test stage-test turn-test typing-test clicks-test; do
  printf "%-14s " "$t"; node "tools/$t.mjs" lib/client.js >/dev/null 2>&1 && echo PASS || echo FAIL
done
```

`tools/_legacy/` 是旧实现时期的测试，断言已失效，仅作追溯保留。
