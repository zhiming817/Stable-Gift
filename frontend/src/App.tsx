import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Header, Footer } from './components/Layout';
import { Home } from './pages/Home';
import { CreatePage } from './pages/Create';
import { ClaimPage } from './pages/Claim';
import { Dashboard } from './pages/Dashboard';

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-slate-950 text-white selection:bg-cyan-500/30">
        <Header />
        <main className="flex-grow">
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/create" element={<CreatePage />} />
                <Route path="/claim" element={<ClaimPage />} />
                <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
