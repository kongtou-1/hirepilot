/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ActiveTab, CandidateEvaluation, JobDescription, ScreeningStatus, UserProfile } from './types';
import { Storage } from './utils/storage';
import { LoginPage } from './components/LoginPage';
import { Header } from './components/Header';
import { DashboardOverview } from './components/DashboardOverview';
import { ResumeScreeningAgent } from './components/ResumeScreeningAgent';
import { JdGenerationAgent } from './components/JdGenerationAgent';
import { HistoryReportsView } from './components/HistoryReportsView';
import { JdHistoryView } from './components/JdHistoryView';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => Storage.isAuthenticated());
  const [user, setUser] = useState<UserProfile>(() => Storage.getUser());
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  // 业务数据来自后端，初始为空，挂载后异步加载（UI 结构不变）
  const [jds, setJds] = useState<JobDescription[]>([]);
  const [evaluations, setEvaluations] = useState<CandidateEvaluation[]>([]);

  // 从后端加载 JD 与评估数据（认证态仍为本地，保持同步）
  useEffect(() => {
    Storage.getJDs().then(setJds);
    Storage.getEvaluations().then(setEvaluations);
  }, []);
  const [selectedJdIdForScreening, setSelectedJdIdForScreening] = useState<string | undefined>(undefined);
  const [editingJd, setEditingJd] = useState<JobDescription | null>(null);

  // Sync state with storage
  const handleLogin = (newUser: UserProfile) => {
    setUser(newUser);
    Storage.setUser(newUser);
    setIsAuthenticated(true);
    Storage.setAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    Storage.setAuthenticated(false);
  };

  const handleSwitchUser = (newUser: UserProfile) => {
    setUser(newUser);
    Storage.setUser(newUser);
  };

  const handleResetData = async () => {
    await Storage.resetAll();
    setUser(Storage.getUser());
    const [nextJds, nextEvaluations] = await Promise.all([
      Storage.getJDs(),
      Storage.getEvaluations(),
    ]);
    setJds(nextJds);
    setEvaluations(nextEvaluations);
  };

  const handleSaveEvaluation = async (evalItem: CandidateEvaluation) => {
    const updated = await Storage.saveEvaluation(evalItem);
    setEvaluations(updated);
  };

  const handleRefreshEvaluations = async () => {
    const updated = await Storage.getEvaluations();
    setEvaluations(updated);
  };

  // 切换到历史库 / 筛选智能体 tab 时重新拉取评估数据，避免展示旧快照
  useEffect(() => {
    if (activeTab === 'history-reports' || activeTab === 'resume-agent') {
      handleRefreshEvaluations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const handleUpdateStatus = async (id: string, status: ScreeningStatus) => {
    const updated = await Storage.updateEvaluationStatus(id, status);
    setEvaluations(updated);
  };

  const handleDeleteEvaluation = async (id: string) => {
    const updated = await Storage.deleteEvaluation(id);
    setEvaluations(updated);
  };

  const handleSaveJd = async (jd: JobDescription) => {
    const updated = await Storage.saveJD(jd);
    setJds(updated);
  };

  const handleDeleteJd = async (id: string) => {
    const updated = await Storage.deleteJD(id);
    setJds(updated);
  };

  const handleSelectJdForScreening = (jdId: string) => {
    setSelectedJdIdForScreening(jdId);
    setActiveTab('resume-agent');
  };

  const handleEditJd = (jd: JobDescription) => {
    setEditingJd(jd);
    setActiveTab('jd-agent');
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={handleLogout}
      />

      {/* Main Workspace Area (Full Width Expanded) */}
      <main className="flex-1 w-full px-4 sm:px-8 xl:px-12 py-6">
        {activeTab === 'overview' && (
          <DashboardOverview
            user={user}
            evaluations={evaluations}
            jds={jds}
            setActiveTab={setActiveTab}
            onSelectJdForScreening={handleSelectJdForScreening}
          />
        )}

        {activeTab === 'resume-agent' && (
          <ResumeScreeningAgent
            jds={jds}
            evaluations={evaluations}
            onSaveEvaluation={handleSaveEvaluation}
            onRefreshEvaluations={handleRefreshEvaluations}
            onViewHistory={() => setActiveTab('history-reports')}
            initialSelectedJdId={selectedJdIdForScreening}
          />
        )}

        {activeTab === 'jd-agent' && (
          <JdGenerationAgent
            onSaveJd={handleSaveJd}
            onUseJdForScreening={handleSelectJdForScreening}
            onViewJdHistory={() => setActiveTab('overview')}
            initialJd={editingJd}
          />
        )}

        {activeTab === 'history-reports' && (
          <HistoryReportsView
            evaluations={evaluations}
            jds={jds}
            onUpdateStatus={handleUpdateStatus}
            onDeleteEvaluation={handleDeleteEvaluation}
            onSelectForScreening={() => setActiveTab('resume-agent')}
            onSelectJdForScreening={handleSelectJdForScreening}
            onDeleteJd={handleDeleteJd}
            onEditJd={handleEditJd}
            onSaveJd={handleSaveJd}
            onCreateNewJd={() => setActiveTab('jd-agent')}
          />
        )}
      </main>
    </div>
  );
}
