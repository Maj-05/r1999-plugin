# 重返未来：1999 离线图鉴

支持云崽（TRSS / Miao-Yunzai）和 AstrBot。安装包自带 139 个角色、37 张心相和 91 件物品的快照。129 个角色有中文名和技能，心相和物品主要使用英文名。用「图鉴状态」查看快照构建时间。

## 安装

**云崽**：在云崽根目录运行 `git clone https://github.com/Maj-05/r1999-plugin.git plugins/r1999-plugin`，重启后发送 `#1999帮助`。已有 Git 安装可在插件目录运行 `git pull --ff-only`。无需安装 npm 包。

**AstrBot**：在 AstrBot 所在的机器或容器中安装 Node.js 20+，确认 `node --version` 可用。在插件管理中使用仓库地址 `https://github.com/Maj-05/r1999-plugin` 安装，或上传独立 ZIP，加载后发送 `/r1999 帮助`。无需启动云崽或配置 API 密钥。

## 命令

| 用途 | 云崽 | AstrBot |
|---|---|---|
| 查看角色各阶技能与仪式 | `#角色 槲寄生` | `/r1999 角色 Druvis III` |
| 按稀有度和灵感筛选 | `#1999角色 六星 木` | `/r1999 角色 六星 木` |
| 查心相增幅和印象 | `#心相 Yearning Desire` | `/r1999 心相 Yearning Desire` |
| 查物品来源与用途 | `#物品 Rhine Gold` | `/r1999 物品 Rhine Gold` |
| 跳页 | `#角色 六星 第2页` | `/r1999 角色 六星 第2页` |
| 按 ID 展开详情 | `#角色 10001` | `/r1999 角色 10001` |
| 数据统计 | `#1999图鉴状态` | `/r1999 图鉴状态` |

云崽在同一会话内支持 `#下一页`、`#上一页`，也可在五分钟内回复列表显示的序号。AstrBot 使用显式页码和 ID。

## 数据来源

英文资料来自 [kornblume](https://github.com/windbow27/kornblume)，中文技能和效果来自 [re1999-data](https://github.com/St-Pavlov-Foundation/re1999-data)。从现有本地数据重建可运行 `node scripts/build_data.mjs`，运行回归测试使用 `npm test`。
