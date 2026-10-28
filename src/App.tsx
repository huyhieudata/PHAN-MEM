import { Navigate, Route, Routes } from 'react-router-dom';
import { FeedbackProvider } from './components/feedback';
import Login from './pages/Login';
import Workspaces from './pages/Workspaces';
import Launcher from './pages/Launcher';
import ModuleLayout from './components/ModuleLayout';
import ModulePage from './pages/ModulePage';
export default function App() {
  return (
    <FeedbackProvider>
    <Routes>
      <Route path="/" element={<Navigate to="/auth/login" replace />} />
      <Route path="/auth/login" element={<Login />} />
      <Route path="/workspaces" element={<Workspaces />} />
      <Route path="/select-apps" element={<Launcher />} />
      <Route path="/m/:moduleId" element={<ModuleLayout />}>
        <Route index element={<ModulePage />} />
        <Route path=":pageId" element={<ModulePage />} />
        <Route path=":pageId/:recordId" element={<ModulePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/select-apps" replace />} />
    </Routes>
    </FeedbackProvider>
  );
}
