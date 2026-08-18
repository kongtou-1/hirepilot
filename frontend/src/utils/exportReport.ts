import { CandidateEvaluation } from '../types';

export function formatEvaluationAsText(candidate: CandidateEvaluation): string {
  const d = candidate.dimensionScores;
  return `【智聘AI · 候选人智能评估报告】
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 候选人：${candidate.candidateName}
🎯 目标岗位：${candidate.appliedRole}
📊 综合AI打分：${candidate.overallScore}分 (${candidate.recommendation})
🏫 学历背景：${candidate.education}
💼 最近经历：${candidate.currentCompany} · ${candidate.currentRole} (经验${candidate.experienceYears}年)
📅 评估时间：${candidate.screeningDate}

【多维度量化评估】
• 专业硬技能契合度：${d.hardSkills}分
• 业务项目匹配度：${d.experienceMatch}分
• 稳定性与成长潜力：${d.stabilityGrowth}分
• 职级与薪资匹配度：${d.compensationFit}分
• 沟通协作与领导力：${d.softSkills}分

【核心速览简评】
${candidate.summary}

【核心亮点与竞争力】
${candidate.keyHighlights.map((h, i) => `${i + 1}. ${h}`).join('\n')}

【潜在疑点与风险关注】
${candidate.potentialRisks.map((r, i) => `⚠ ${r}`).join('\n')}

【面试重点考察建议】
${candidate.recommendedQuestions
  .map(
    (q, i) =>
      `Q${i + 1} [${q.category}]:\n问题：${q.question}\n考察逻辑：${q.reason}`,
  )
  .join('\n\n')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
生成平台：智聘AI Enterprise HR Platform
`;
}

export function exportEvaluationsToCSV(candidates: CandidateEvaluation[]) {
  const headers = [
    '候选人姓名',
    '应聘岗位',
    'AI综合得分',
    '初筛建议',
    '匹配等级',
    '工作年限',
    '学历背景',
    '最近公司',
    '最近职位',
    '专业技能分',
    '项目经验分',
    '稳定性分',
    '薪酬契合分',
    '沟通协作分',
    '评估日期',
    '当前状态',
    '核心优势摘要',
  ];

  const rows = candidates.map((c) => [
    `"${c.candidateName.replace(/"/g, '""')}"`,
    `"${c.appliedRole.replace(/"/g, '""')}"`,
    c.overallScore,
    `"${c.recommendation}"`,
    `"${c.matchLevel}"`,
    c.experienceYears,
    `"${c.education.replace(/"/g, '""')}"`,
    `"${c.currentCompany.replace(/"/g, '""')}"`,
    `"${c.currentRole.replace(/"/g, '""')}"`,
    c.dimensionScores.hardSkills,
    c.dimensionScores.experienceMatch,
    c.dimensionScores.stabilityGrowth,
    c.dimensionScores.compensationFit,
    c.dimensionScores.softSkills,
    `"${c.screeningDate}"`,
    `"${c.status}"`,
    `"${c.summary.replace(/"/g, '""')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `智聘AI_候选人简历筛选报告_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function printCandidateReport(candidate: CandidateEvaluation) {
  const d = candidate.dimensionScores;
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('请允许弹出窗口以打印或导出PDF报告');
    return;
  }

  const htmlContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>智聘AI评估报告 - ${candidate.candidateName}</title>
  <style>
    @media print {
      @page { margin: 15mm; size: A4; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
      color: #1e293b;
      line-height: 1.6;
      background: #fff;
      padding: 24px;
      max-width: 860px;
      margin: 0 auto;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .brand {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      background: #f1f5f9;
      color: #334155;
    }
    .badge-recommend {
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
    }
    .candidate-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .score-circle {
      text-align: center;
      background: #ffffff;
      border: 2px solid #3b82f6;
      border-radius: 16px;
      padding: 14px 20px;
      min-width: 110px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.04);
    }
    .score-num {
      font-size: 34px;
      font-weight: 800;
      color: #1d4ed8;
      line-height: 1;
    }
    .score-label {
      font-size: 11px;
      color: #64748b;
      margin-top: 4px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .section-title {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
      border-left: 4px solid #3b82f6;
      padding-left: 10px;
      margin: 24px 0 12px 0;
      display: flex;
      align-items: center;
    }
    .dimension-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 10px;
      margin-bottom: 20px;
    }
    .dim-box {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px;
      text-align: center;
    }
    .dim-score {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
    }
    .dim-name {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
    }
    .highlight-list, .risk-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .highlight-item {
      padding: 8px 12px;
      background: #f0fdf4;
      border-left: 3px solid #22c55e;
      border-radius: 4px;
      margin-bottom: 8px;
      font-size: 13px;
      color: #166534;
    }
    .risk-item {
      padding: 8px 12px;
      background: #fffbeb;
      border-left: 3px solid #f59e0b;
      border-radius: 4px;
      margin-bottom: 8px;
      font-size: 13px;
      color: #92400e;
    }
    .question-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 12px;
    }
    .q-title {
      font-weight: 600;
      font-size: 13px;
      color: #1e293b;
      margin-bottom: 4px;
    }
    .q-reason {
      font-size: 12px;
      color: #64748b;
      background: #f8fafc;
      padding: 6px 10px;
      border-radius: 4px;
      margin-top: 6px;
    }
    .footer {
      margin-top: 36px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #94a3b8;
    }
    .no-print {
      margin-bottom: 20px;
      text-align: right;
    }
    .btn-print {
      background: #2563eb;
      color: #fff;
      border: none;
      padding: 8px 18px;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div class="no-print">
    <button class="btn-print" onclick="window.print()">🖨️ 立即打印 / 保存为 PDF</button>
  </div>

  <div class="header">
    <div>
      <div class="brand">智聘AI · 人才招聘与初筛评估档案</div>
      <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Talent Screening & Evaluation Report</div>
    </div>
    <div style="text-align: right;">
      <span class="badge badge-recommend">${candidate.recommendation}</span>
      <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">评估时间: ${candidate.screeningDate}</div>
    </div>
  </div>

  <div class="candidate-card">
    <div>
      <div style="font-size: 22px; font-weight: 700; color: #0f172a;">${candidate.candidateName}</div>
      <div style="font-size: 14px; color: #475569; margin-top: 4px;">应聘岗位：<strong style="color: #0f172a;">${candidate.appliedRole}</strong></div>
      <div style="font-size: 12px; color: #64748b; margin-top: 6px;">
        🎓 ${candidate.education} &nbsp;|&nbsp; 🏢 ${candidate.currentCompany} · ${candidate.currentRole} &nbsp;|&nbsp; ⏱ 经验 ${candidate.experienceYears} 年
      </div>
    </div>
    <div class="score-circle">
      <div class="score-num">${candidate.overallScore}</div>
      <div class="score-label">AI 综合匹配度</div>
    </div>
  </div>

  <div class="section-title">五维画像智能量化评估</div>
  <div class="dimension-grid">
    <div class="dim-box">
      <div class="dim-score">${d.hardSkills}</div>
      <div class="dim-name">专业硬技能</div>
    </div>
    <div class="dim-box">
      <div class="dim-score">${d.experienceMatch}</div>
      <div class="dim-name">业务项目匹配</div>
    </div>
    <div class="dim-box">
      <div class="dim-score">${d.stabilityGrowth}</div>
      <div class="dim-name">稳定性与潜力</div>
    </div>
    <div class="dim-box">
      <div class="dim-score">${d.compensationFit}</div>
      <div class="dim-name">职级薪酬契合</div>
    </div>
    <div class="dim-box">
      <div class="dim-score">${d.softSkills}</div>
      <div class="dim-name">沟通与领导力</div>
    </div>
  </div>

  <div class="section-title">高管速览简评</div>
  <div style="font-size: 13px; color: #334155; background: #f8fafc; padding: 14px; border-radius: 8px; border: 1px solid #e2e8f0;">
    ${candidate.summary}
  </div>

  <div class="section-title">核心优势与亮点</div>
  <div class="highlight-list">
    ${candidate.keyHighlights.map((h) => `<div class="highlight-item">✓ ${h}</div>`).join('')}
  </div>

  <div class="section-title">潜在风险与关注点</div>
  <div class="risk-list">
    ${candidate.potentialRisks.map((r) => `<div class="risk-item">⚠ ${r}</div>`).join('')}
  </div>

  <div class="section-title">面试官针对性提问建议</div>
  <div>
    ${candidate.recommendedQuestions
      .map(
        (q, i) => `
      <div class="question-card">
        <div class="q-title"><strong>Q${i + 1} [${q.category}]:</strong> ${q.question}</div>
        <div class="q-reason"><strong>考察目的：</strong>${q.reason}</div>
      </div>
    `,
      )
      .join('')}
  </div>

  <div class="footer">
    <div>报告生成系统：智聘AI 智能招聘决策平台</div>
    <div>报告编号：#${candidate.id.toUpperCase()}</div>
  </div>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
