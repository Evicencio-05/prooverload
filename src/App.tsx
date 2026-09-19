import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Nav } from './components/Nav';
import { AuthPage } from './pages/AuthPage';
import { BodyPage } from './pages/BodyPage';
import { GoalsPage } from './pages/GoalsPage';
import { HistoryPage } from './pages/HistoryPage';
import { LogPage } from './pages/LogPage';
import { SessionPage } from './pages/SessionPage';
import { YouPage } from './pages/YouPage';
import { AppStateProvider, useApp } from './state/AppState';

function Shell() {
  const { user, ready, configError } = useApp();
  if (!ready) {
    return (
      <main className="screen">
        <p className="muted">Loading ProOverload…</p>
      </main>
    );
  }
  if (!user) return <AuthPage />;
  return (
    <>
      <Routes>
        <Route path="/" element={<LogPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/history/:id" element={<SessionPage />} />
        <Route path="/body" element={<BodyPage />} />
        <Route path="/goals" element={<GoalsPage />} />
        <Route path="/you" element={<YouPage />} />
        <Route path="/library" element={<Navigate to="/you" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Nav />
      {configError ? <p className="sync-pill err">{configError}</p> : null}
    </>
  );
}

export default function App() {
  return (
    <AppStateProvider>
      <HashRouter>
        <div className="app-shell">
          <Shell />
        </div>
      </HashRouter>
    </AppStateProvider>
  );
}
