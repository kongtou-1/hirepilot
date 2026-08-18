# AI-HR 后端服务

基于 **FastAPI + SQLite (Python)** 的独立后端，支撑现有前端（`frontend/`，React + TypeScript SPA）。
后端与构建后的前端 **同源单端口托管**：在 `8000` 端口同时提供 `/api` 接口与 `dist/` 静态页面，避免跨域问题。

> AI 能力当前为 **纯 Mock 模式**（`isAiLive: false`），不依赖任何外部 API Key，离线可用。未来如需接入真实大模型，仅在 `app/services/mock_ai.py` 与配置层替换实现即可，接口契约不变。

---

## 技术栈

- **Web 框架**：FastAPI（`uvicorn` 运行）
- **数据库**：SQLite（SQLAlchemy 2.0 同步引擎，单文件 `data/hr.db`）
- **数据校验**：Pydantic v2
- **前端托管**：FastAPI 直接托管 `frontend/dist/` 构建产物（SPA catch-all 回退）
- **包管理**：[uv](https://github.com/astral-sh/uv)

---

## 目录结构

```
backend/
├── app/
│   ├── main.py            # 应用入口：CORS + /api 路由 + 同源托管 SPA
│   ├── core/
│   │   ├── config.py      # 配置（读取 .env：端口 / 数据库路径 / 前端目录）
│   │   ├── database.py    # SQLAlchemy 引擎、会话、建表、种子接入
│   │   └── seed.py        # 首次建库示例数据（2 个 JD + 2 份评估）
│   ├── models/            # ORM 模型（jd.py / evaluation.py）
│   ├── schemas/           # Pydantic 模型 + 前端 camelCase ↔ 后端 snake_case 映射
│   │   └── common.py      # AI 响应信封 { success, isAiLive, data }
│   ├── routers/           # 路由（health / jd / resume / evaluations）
│   └── services/
│       └── mock_ai.py     # 纯 Mock AI（JD 生成 / 微调 / 简历初筛）
├── data/hr.db             # SQLite 数据库（首次启动自动建表 + 灌种子数据）
├── pyproject.toml         # 依赖与项目元数据
├── requirements.txt       # 依赖清单（与 pyproject 一致）
└── .env.example           # 配置样例
```

---

## 快速开始（开发 / 运行）

### 1. 准备 Python 环境（uv 管理）

```bash
cd backend
uv venv                      # 创建 .venv（Python 3.11+）
uv pip install -r requirements.txt
```

> 也可直接使用 `uv run`（会自动创建并安装依赖）：`uv run uvicorn app.main:app --port 8000`

### 2. 构建前端（产生 `frontend/dist/`）

```bash
cd frontend
npm install
npm run build               # 输出到 frontend/dist/
```

### 3. 启动后端（同源托管 SPA + API）

```bash
cd backend
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000
```

启动后访问：

- 前端页面（SPA）：<http://localhost:8000/>
- 健康检查：<http://localhost:8000/api/health>
- JD 列表：<http://localhost:8000/api/jds>
- 评估列表：<http://localhost:8000/api/evaluations>

首次启动会自动建表；当 `job_descriptions` 与 `evaluations` 两表都为空时，灌入 `seed.py` 中的示例数据，还原原前端首屏演示体验。

---

## 开发模式（热更新前端）

前后端分离开发时，可分别启动：

```bash
# 终端 1：后端 API（默认 8000）
cd backend && uv run uvicorn app.main:app --port 8000

# 终端 2：前端 dev server（Vite，默认 5173）
cd frontend && npm run dev
```

`frontend/vite.config.ts` 已配置 `/api` 代理转发到 `http://127.0.0.1:8000`，
因此前端开发时 `fetch('/api/...')` 会直连后端，无需手动处理跨域。

---

## 配置说明（.env）

复制 `.env.example` 为 `.env` 可按需覆盖：

| 变量 | 默认 | 说明 |
| --- | --- | --- |
| `PORT` | `8000` | 后端服务端口 |
| `DATABASE_PATH` | `data/hr.db` | SQLite 文件路径（相对 backend/ 目录） |
| `GEMINI_API_KEY` | 空 | 预留给未来真实大模型接入（当前版本未使用） |

---

## API 契约

所有路由前缀为 `/api`。数据接口返回数组或对象；AI 接口返回统一信封：

```json
{ "success": true, "isAiLive": false, "data": { ... } }
```

### 数据（CRUD）

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/jds` | 列出全部 JD |
| POST | `/api/jds` | 新建 / 更新 JD（按 `id` upsert） |
| PUT | `/api/jds/{id}` | 更新指定 JD |
| DELETE | `/api/jds/{id}` | 删除指定 JD |
| GET | `/api/evaluations` | 列出全部候选人评估 |
| POST | `/api/evaluations` | 新建 / 更新评估（按 `id` upsert） |
| PUT | `/api/evaluations/{id}` | 更新指定评估 |
| DELETE | `/api/evaluations/{id}` | 删除指定评估 |

### AI（Mock）

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/api/resume/screen` | 简历初筛，入参 `{ resumeText, candidateName?, targetRole?, ... }` |
| POST | `/api/jd/generate` | 生成 JD，入参 `{ jobTitle, department?, ... }` |
| POST | `/api/jd/refine` | 微调 JD，入参 `{ currentJd, instruction }` |

所有 AI 接口当前返回 `isAiLive: false`，数据由 `app/services/mock_ai.py` 确定性生成。

---

## 端口占用说明

后端默认监听 `8000`。若该端口被占用（例如上一会话残留的僵尸进程、或本机已有其他服务），
启动会报 `address already in use`。处理方式：

1. 释放端口：结束占用进程后重启；或
2. 临时改用其他端口验证：`uv run uvicorn app.main:app --port 8001`，
   此时前端 dev 代理需相应指向 `8001`（改 `frontend/vite.config.ts` 的 `target`）。

> 本仓库代码中端口默认仍为 `8000`，无需为临时验证改动源码。

---

## 备注

- 数据库为单文件 SQLite，落库路径 `backend/data/hr.db`（已被 `.gitignore` 忽略）。
- 后端启动采用同步 SQLAlchemy 引擎（`check_same_thread=False` + `pool_pre_ping`），
  不使用 `--reload` 多进程模式，以避免 SQLite 写竞争。
- 字段映射：前端使用 camelCase（`salaryRange`、`overallScore`），后端 ORM 使用 snake_case
  （`salary_range`、`overall_score`），转换集中在 `app/schemas/`。
