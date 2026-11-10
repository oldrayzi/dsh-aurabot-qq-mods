# 人格成长（persona-growth）

给 Aurabot / 大肥鱼用的自省插件。

每天中午 12 点，她会自己待一会儿：回看最近 24 小时的聊天，想一想自己，然后**只挪一小步**——加一条小习惯、换一句说话的方式、把最近在意的事写下来。每次变化都会留下前后快照和理由，可以查，也可以退回去。

## 它不会做什么

- **不改你写的人格卡**。`personas/*.md` 一个字节都不动。
- 成长档案是通过 `persona` 钩子接在人格卡**后面**的一段文字。关掉「把成长档案接进人设」，她下一句话就恢复成原来的样子，档案和历史都还在。
- 不会存聊天原文。只存她自己的思考、变化前后的档案、以及「回看了几小时、几条消息、几个聊天」这样的计数。
- 思考时会把最近聊天的一段（最多约 6500 字，单条最多 180 字）发给**你当前给 Aurabot 配置的模型**，和平时聊天走同一个服务；不会发到别的地址。

## 装在哪

模块目录（Windows 默认位置，其他系统把 `%USERPROFILE%` 换成 `~`）：

```
%USERPROFILE%\.dsh\plugins-data\aurabot\modules\persona-growth\
├── index.mjs      # 模块本体
├── panel.js       # 面板
├── module.json    # 元信息
├── README.md
├── PORTING.md     # 底层原理与移植说明
└── LICENSE
```

存盘位置：

```
%USERPROFILE%\.dsh\plugins-data\aurabot\modules-data\persona-growth\
├── state.json     # 当前档案、上次运行、失败次数
└── history.json   # 每次思考的完整记录（新的在前）
```

保存文件后 Aurabot 会自动重载，日志里会出现：

```
[persona-growth] 人格成长就绪：每天 12:00 想一次，已记录 N 次
```

> 第一次装上时，如果当天已经过了 12 点，启动后 20 秒左右会先补一次「建档」，不会等到第二天。之后每天只会在 12 点后跑一次；当天失败最多重试 3 次。

## 安装 / 卸载

拿到别人给的 zip 时：

1. 解压到一个名为 `persona-growth` 的文件夹，确认 `module.json`、`index.mjs`、`panel.js` 就在这一层；
2. 把这个文件夹放到 `%USERPROFILE%\.dsh\plugins-data\aurabot\modules\` 下，最终路径是 `...\modules\persona-growth\module.json`，不要出现 `...\modules\persona-growth\persona-growth\module.json`；
3. Aurabot 会在几秒内自动加载，不用重启；日志出现「人格成长就绪」就是好了。

卸载：删掉 `modules/persona-growth/` 就不再运行。想连档案一起清掉，再删 `modules-data/persona-growth/`；只删模块的话，以后重装会接着用原来的档案。

## 打包 / 分享

这个文件夹本身就是一个完整的 Aurabot 模块，打包不需要编译：

- 直接分享：把 `module.json`、`index.mjs`、`panel.js`、`README.md`、`PORTING.md`、`LICENSE` 压成一个 zip，**不要**带 `.aurabot-cache/`，也不要把 `modules-data/` 里的个人档案打进去。
- 上架模块市场：Fork [dsh-aurabot-qq-mods](https://github.com/aureth-labs/dsh-aurabot-qq-mods)，把整个文件夹放到 `modules/persona-growth/`，按仓库里的模块规范和贡献指南，在根目录跑 `npm run catalog`、`npm run check`、`npm run pack`，然后提 PR。
- 这个模块声明了 `filesystem`、`plugin-config` 和 `plugin-internals`：它要读写自己的 `state.json`/`history.json`，读取主人 QQ 用于可选通知，并读取 Aurabot 的聊天流水和当前人格卡。市场审核会看这些声明是否和实际行为一致。

底层怎么实现的、怎么搬到别的 bot，见 [PORTING.md](PORTING.md)。

## 怎么用

QQ 里（仅主人可用）：

| 发什么 | 得到什么 |
| --- | --- |
| `/成长` | 当前档案 + 最近一次思考 |
| `/成长 历史 5` | 最近 5 次记录（数字可改，最多 20） |
| `/成长 2026-01-05` | 那一天的所有记录 |
| `/成长 猫` | 按关键词搜想法和变化 |
| `/成长 现在` | 不等 12 点，马上想一次 |
| `/成长 今天` | 只看最新一条 |

别名：`/人格成长`、`/自省`、`/growth`。

在 QQ 里也可以直接问她「你最近变了什么」，她会在主人私聊里用 `recall_persona_growth` 工具查自己的记录（群聊和外人不会暴露这个工具）。

面板里可以：

- 看当前档案和「接在人格卡后面的那段话」；
- 看每次思考的想法、变化、回看范围；
- 点「现在想一次」；
- 点「回到这一天」，把档案退回某次记录之后的样子（回滚本身也会记一条历史，人格卡仍然不动）。

## 设置

| 键 | 默认 | 说明 |
| --- | --- | --- |
| `enabled` | 开 | 关掉后不再自动想；`/成长 现在` 仍可手动触发，历史仍可查 |
| `hour` / `minute` | 12 / 0 | 按这台电脑的本地时间 |
| `maxChanges` | 2 | 每天最多落几处变化（1~3）。第一次建档不受这个限制 |
| `lookbackHours` | 24 | 回看最近几小时的聊天（3~72） |
| `includeGroups` | 开 | 关掉后只看私聊 |
| `inject` | 开 | 是否把成长档案接进人设；关掉只是冻结，不删档案 |
| `notify` | 关 | 想完后在主人私聊里发一段这次的记录 |
| `maxHistory` | 730 | 最多保留多少条历史，满了丢最旧的 |

## 「轻微」是怎么保证的

模型只负责想和提改动，真正落库前会再过一遍：

- 每天默认最多 2 处；第一次建档最多 15 处；
- 性格保持 3~8 条，喜欢 / 习惯各最多 8 条；单条不超过 40 字；
- `speech` 不超过 120 字，`focus` 不超过 80 字；
- 改 / 删必须能对上原来的那一条（忽略标点和空格），对不上就跳过；
- 重复的、空的、超长的、字段不认识的，都跳过；
- 模型多给的改动会记在 `skipped` 里，面板上能看到「多给了几处，被丢掉了」。

所以它每天只会轻轻挪一下，不会一夜之间变成另一个人。

## 数据结构

`state.json`：

```json
{
  "version": 1,
  "profile": {
    "traits": ["..."],
    "likes": ["..."],
    "habits": ["..."],
    "speech": "...",
    "focus": "..."
  },
  "lastRunDay": "2026-01-01",
  "lastRunAt": 1767225600000,
  "profileDay": "2026-01-01",
  "totalRuns": 1,
  "attemptsDay": "2026-01-01",
  "attempts": 0,
  "lastError": ""
}
```

`history.json` 是数组，每条：

```json
{
  "id": "2026-01-01-1767225600000",
  "at": 1767225600000,
  "day": "2026-01-01",
  "trigger": "schedule | manual | rollback",
  "thought": "第一人称的想法",
  "summary": "一句话小结",
  "mood": "当时的心情",
  "changes": [{ "field": "likes", "op": "add", "before": "", "after": "路边的猫", "reason": "..." }],
  "skipped": [{ "reason": "..." }],
  "profileBefore": { "...": "完整快照" },
  "profileAfter": { "...": "完整快照" },
  "context": { "hours": 24, "lines": 120, "chats": 3 }
}
```

`profileBefore` / `profileAfter` 只落在磁盘上，面板接口不会把它们整个吐出来，只给 `canRollback`。

## 已知取舍

- 定时检查是每分钟一次，不是精确的 12:00:00；通常 12:00~12:01 之间跑。
- 回看的是 Aurabot 的聊天流水；如果某天聊天很少，她可能只想不改变（`changes: []`）。
- 同一天已经成功跑过就不会再自动跑；想再要一次用 `/成长 现在`。
- 模型偶尔会多给几条改动，超出上限的会被丢掉，不影响这次的其他变化。
- 面板里「回到这一天」会覆盖当前档案，但会先记一条 `rollback` 历史；如果后悔，可以再回滚到回滚前的那条。

## 版本

- `0.1.0`：每日思考、成长档案、persona 注入、QQ 查询、面板查询 / 手动触发 / 回滚。
