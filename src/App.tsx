import { AppLayout } from './components/layout/AppLayout';
import { ChatInterface } from './components/chat/ChatInterface';
import { ConfigDashboard } from './components/dashboard/ConfigDashboard';
import { IdeView } from './components/dashboard/IdeView';
import { MediaView } from './components/dashboard/MediaView';
import { useStore } from './store';

export default function App() {
  const { activeView } = useStore();

  return (
    <AppLayout>
      {activeView === 'chat' && <ChatInterface />}
      {activeView === 'dashboard' && <ConfigDashboard />}
      {activeView === 'ide' && <IdeView />}
      {activeView === 'media' && <MediaView />}
    </AppLayout>
  );
}
