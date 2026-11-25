# r1999-plugin

Yunzai (TRSS/Miao) 插件·重返未来：1999 图鉴。

离线查询角色/心相/物品，支持中英文名、稀有度/属性筛选、技能效果数值、多结果分页。

## 安装

```bash
# 进入你的 Yunzai 目录（TRSS-Yunzai 或 Miao-Yunzai）
cd plugins
git clone https://github.com/Maj-05/r1999-plugin.git r1999-plugin
cd r1999-plugin && pnpm i
```

> 插件已内置构建好的数据，克隆即可用，无需手动构建。

## 命令

| 命令 | 说明 |
|---|---|
| #角色 槲寄生 / Druvis | 角色详情：稀有度/属性/技能+效果/仪式 |
| #角色 六星 / 五星 | 按稀有度列角色 |
| #角色 木 / 星 / 兽 | 按属性列角色 |
| #角色 | 稀有度/属性分布汇总 |
| #心相 <名称/六星> | 心相查询（含印象）/ 按稀有度列心相 |
| #物品 <名称> | 物品查询 |
| #图鉴状态 | 数据统计 |
| #下一页 / #上一页 / 回复序号 | 多结果分页浏览/选择 |

> 前缀：#1999 / #r1999。角色支持中英文名 + ID 查询。

## 数据

- 英文养成: [kornblume](https://github.com/windbow27/kornblume) public/data
- 中文名+技能+效果: [St-Pavlov-Foundation/re1999-data](https://github.com/St-Pavlov-Foundation/re1999-data)
- 构建: node scripts/build_data.mjs → resources/data（自动合并中英数据）

## 现状

- [x] 中文名+技能+仪式、稀有度/属性筛选、心相印象、角色详情卡
- [x] 技能效果数值解析、多结果分页
- [ ] 卡片渲染（HTML 立绘卡）