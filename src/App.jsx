import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import BottomNav from './components/BottomNav';
import { ModalProvider } from './components/Modal';
import { ToastProvider } from './components/Toast';
import { getUser } from './utils/storage';

const Converter = lazy(() => import('./pages/Converter'));
const Home = lazy(() => import('./pages/Home'));
const Invoice = lazy(() => import('./pages/Invoice'));
const Ledger = lazy(() => import('./pages/Ledger'));
const WelcomeScreen = lazy(() => import('./pages/WelcomeScreen'));

function routeFromHash() {
  const raw = window.location.hash.replace('#', '');
  return ['home', 'converter', 'invoice', 'ledger'].includes(raw) ? raw : 'home';
}

function AppBody() {
  const [route, setRoute] = useState(routeFromHash());
  const [user, setUser] = useState(getUser());

  useEffect(() => {
    const onHashChange = () => setRoute(routeFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = (next) => {
    window.location.hash = next;
    setRoute(next);
  };

  const page = useMemo(() => {
    if (!user) {
      return <WelcomeScreen onDone={setUser} />;
    }

    if (route === 'converter') return <Converter user={user} onNavigate={navigate} />;
    if (route === 'invoice') return <Invoice user={user} onNavigate={navigate} />;
    if (route === 'ledger') return <Ledger user={user} onNavigate={navigate} />;
    return <Home user={user} onNavigate={navigate} onUserChange={setUser} />;
  }, [route, user]);

  return (
    <div className="app-shell">
      <Suspense fallback={<main className="stack"><section className="card"><small className="muted">Loading...</small></section></main>}>
        {page}
      </Suspense>
      {user ? <BottomNav route={route} onChange={navigate} /> : null}
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <ModalProvider>
        <AppBody />
      </ModalProvider>
    </ToastProvider>
  );
}
