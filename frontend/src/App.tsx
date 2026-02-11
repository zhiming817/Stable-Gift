import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header, Footer } from './components/Layout';
import { Home } from './pages/Home';
import { CreatePage } from './pages/Create';
import { ClaimPage } from './pages/Claim';
import { ExplorePage } from './pages/Explore';
import { SyncPage } from './pages/Sync';
import { Dashboard } from './pages/Dashboard';
import { MintTestPage } from './pages/MintTest';

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-slate-950 text-white selection:bg-cyan-500/30">
        <Header />
        <main className="flex-grow">
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/create" element={<CreatePage />} />
                <Route path="/explore" element={<ExplorePage />} />
                <Route path="/sync" element={<SyncPage />} />
                <Route path="/claim" element={<ClaimPage />} />
                <Route path="/claim/:id" element={<ClaimPage />} />
                <Route path="/claim-callback" element={<ClaimPage />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/mint" element={<MintTestPage />} />
            </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
