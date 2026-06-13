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

function parseHash() {
  const hash = window.location.hash.replace('#', '');
  const [path, queryString] = hash.split('?');
  const params = {};
  if (queryString) {
    queryString.split('&').forEach(pair => {
      const [key, value] = pair.split('=');
      if (key) params[key] = decodeURIComponent(value || '');
    });
  }
  const route = ['home', 'converter', 'invoice', 'ledger'].includes(path) ? path : 'home';
  return { route, params };
}

function AppBody() {
  const [routeState, setRouteState] = useState(parseHash());
  const [user, setUser] = useState(getUser());

  useEffect(() => {
    const onHashChange = () => setRouteState(parseHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = (next) => {
    window.location.hash = next;
  };

  const page = useMemo(() => {
    if (!user) {
      return <WelcomeScreen onDone={setUser} />;
    }

    const { route, params } = routeState;

    if (route === 'converter') return <Converter user={user} onNavigate={navigate} editSessionId={params.edit} />;
    if (route === 'invoice') return <Invoice user={user} onNavigate={navigate} editInvoiceId={params.edit} />;
    if (route === 'ledger') return <Ledger user={user} onNavigate={navigate} />;
    return <Home user={user} onNavigate={navigate} onUserChange={setUser} />;
  }, [routeState, user]);

  return (
    <div className="app-shell">
      <Suspense fallback={<main className="stack"><section className="card"><small className="muted">Loading...</small></section></main>}>
        {page}
      </Suspense>
      {user ? <BottomNav route={routeState.route} onChange={navigate} /> : null}
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
