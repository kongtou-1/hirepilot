# HirePilot · AI 智能招聘助手

基于大模型的智能招聘评估系统：AI 生成 / 优化职位描述（JD），对上传的简历进行自动初筛评估，并统一管理候选人评估结果。

## 功能

- **AI 生成 JD**：输入岗位名称与部门，自动生成完整职位描述
- **JD 微调**：基于现有 JD 按指令改写（调整语气、补充要求等）
- **简历初筛**：上传简历（PDF），AI 解析并给出匹配度评分、优劣势与录用建议
- **评估管理**：候选人评估记录的新增 / 更新 / 删除
- **智能降级**：未配置大模型 Key 时自动降级为 Mock 模式（`isAiLive: false`），离线可用

## 技术栈

| 层 | 技术 |
| --- | --- |
| 前端 | React 19 + TypeScript + Vite + TailwindCSS 4 |
| 后端 | FastAPI + SQLAlchemy 2.0 + SQLite |
| AI | OpenAI 兼容端点（模型可配置，如 `gpt-5.5`），失败自动重试 |

## 快速开始

```bash
# 1) 构建前端
cd frontend && npm install && npm run build

# 2) 启动后端（自动托管 frontend/dist 并提供 /api）
cd ../backend
python -m venv .venv && .venv/Scripts/pip install -r requirements.txt   # 或使用 uv
.venv/Scripts/python -m uvicorn app.main:app --port 8029
```

打开 <http://localhost:8029/> 即可使用（前端开发模式运行 `npm run dev` 时，Vite 已代理 `/api` 到后端）。

## 配置

复制 `backend/.env.example` 为 `backend/.env` 后按需修改：

- `LLM_API_KEY` / `LLM_BASE_URL` / `LLM_MODEL`：真实大模型接入（留空则使用 Mock）
- `PORT`：后端端口（默认 `8029`）
- `DATABASE_PATH`：SQLite 文件路径（默认 `data/hr.db`）

> `.env` 已加入 `.gitignore`，请勿提交真实密钥。

## 目录结构

```
├── frontend/          # React SPA
├── backend/           # FastAPI 服务（app/ 源码、data/ 数据库）
└── uploads/           # 上传的原始简历（不纳入版本控制）
```

详细后端说明（目录结构、API 契约）见 [`backend/README.md`](backend/README.md)。
