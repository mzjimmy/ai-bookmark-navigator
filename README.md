# AI书签导航器 (AI Bookmark Navigator)

AI书签导航器是一款基于现代Web技术开发的本地书签管理应用，集成AI分析功能，帮助用户更高效地管理和分析他们的网络收藏。

## 功能特点

- **本地存储**: 所有书签数据存储在浏览器本地，保护用户隐私
- **智能分析**: 借助AI技术分析书签集合，提供分类建议和内容洞察
- **书签导入/导出**: 支持从主流浏览器导入书签，也可导出为多种格式
- **高级搜索**: 基于标题、URL、描述和标签的快速搜索功能
- **分类管理**: 自动和手动分类，帮助组织大量书签
- **响应式设计**: 完美适配桌面和移动设备的用户体验
- **AI集成**: 整合OpenRouter API，调用DeepSeek V3模型进行书签智能分析

## 技术栈

- **前端框架**: React + TypeScript
- **UI组件**: shadcn-ui + TailwindCSS
- **构建工具**: Vite
- **状态管理**: React hooks + Context API
- **数据存储**: IndexedDB (从LocalStorage迁移而来)
- **AI服务**: OpenRouter API (DeepSeek V3 0324模型)

## 快速开始

### 环境变量配置

项目使用环境变量管理API密钥等敏感信息。使用前请先配置：

1. 复制`.env.example`文件并重命名为`.env`
2. 在`.env`文件中填入您的OpenRouter API密钥和其他配置

```bash
# AI服务配置
VITE_OPENROUTER_API_KEY=your_openrouter_api_key_here
VITE_OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
VITE_OPENROUTER_MODEL=deepseek/deepseek-v3-0324
```

### 安装依赖

```bash
npm install
# 或
yarn install
```

### 本地开发

```bash
npm run dev
# 或
yarn dev
```

### 构建生产版本

```bash
npm run build
# 或
yarn build
```

## 项目结构

```
src/
├── components/      # UI组件
├── hooks/           # 自定义React钩子
├── lib/             # 工具库
├── pages/           # 页面组件
├── services/        # 外部服务API客户端
├── types/           # TypeScript类型定义
├── utils/           # 工具函数
└── App.tsx          # 应用入口
```

## 主要功能模块

### 书签管理

- 添加、编辑、删除书签
- 根据类别和标签组织书签
- 从浏览器导入HTML格式书签
- 导出为JSON或HTML格式
- 书签置顶功能

### AI分析

- 基于OpenRouter API的真实AI分析
- 使用DeepSeek V3 0324大语言模型
- 提供主题和兴趣洞察
- 为未分类书签推荐分类
- 分析常访问域名和使用模式
- 可视化书签分类分布

## OpenRouter API集成

本项目集成了OpenRouter API用于书签分析，主要实现：

- 创建`OpenRouterClient`类处理API请求
- 设计指数退避的错误重试机制
- 请求统一错误处理
- 详细日志记录
- 自定义提示工程优化书签分析效果

API密钥通过环境变量安全管理，不会被提交到代码仓库。如需配置自己的API密钥，请修改`.env`文件：

```
VITE_OPENROUTER_API_KEY=your_api_key_here
```

## 路线图

项目计划功能：

- [x] 迁移到IndexedDB以支持更大规模的书签存储
- [x] 集成真实AI API进行更深入的内容分析 
- [ ] 添加标签云可视化功能
- [ ] 实现书签变更历史记录
- [ ] 添加自动获取网站favicon和页面预览功能
- [ ] 支持多设备同步

## 贡献指南

欢迎贡献代码或提出建议！请查看[TASKS.md](./TASKS.md)了解当前开发任务和计划。

## 许可证

MIT
