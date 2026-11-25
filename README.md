# r1999-plugin

Yunzai 插件·重返未来：1999 图鉴（开发中）。

## 命令

| 命令 | 说明 |
|---|---|
| #角色 <名称/ID> | 角色信息：稀有度/属性/养成材料 |
| #心相 <名称> | 心相查询 |
| #物品 <名称> | 物品查询 |
| #图鉴状态 | 数据统计 |

> 前缀：#1999 / #r1999

## 数据

- 上游: [kornblume](https://github.com/windbow27/kornblume) `public/data`（英文养成数据）
- 构建: `node scripts/build_data.mjs` → resources/data

## 现状

- [x] 数据拉取 + 中文属性映射 + 索引 + 模糊搜索
- [ ] 角色技能/中文名数据源（调研中）
- [ ] 卡片渲染、多结果分页
