import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppLayout from './components/Layout/AppLayout';

// Pages
import Dashboard from './pages/Dashboard/Dashboard';
import LiveTiming from './pages/Live/LiveTiming';
import Learn from './pages/Learn/Learn';
import Standings from './pages/Standings/Standings';
import RaceSchedule from './pages/Schedule/RaceSchedule';
import Results from './pages/Results/Results';
import Compare from './pages/Compare/Compare';
import Recap from './pages/Recap/Recap';

// Optional Sub-pages (kept for compatibility with existing components)
import RaceDetail from './pages/Schedule/RaceDetail';
import DriverDetail from './pages/Driver/DriverDetail';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 2,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            {/* 1. Home */}
            <Route path="/" element={<Dashboard />} />
            
            {/* 2. Live Timing */}
            <Route path="/live" element={<LiveTiming />} />
            
            {/* 3. Education */}
            <Route path="/learn" element={<Learn />} />
            
            {/* 4. Standings */}
            <Route path="/standings" element={<Standings />} />
            <Route path="/driver/:driverNumber" element={<DriverDetail />} />
            
            {/* 5. Schedule */}
            <Route path="/schedule" element={<RaceSchedule />} />
            <Route path="/schedule/:season/:round" element={<RaceDetail />} />
            
            {/* 6. Results */}
            <Route path="/results" element={<Results />} />
            
            {/* 7. Compare */}
            <Route path="/compare" element={<Compare />} />
            
            {/* 8. Recap / Replay */}
            <Route path="/recap" element={<Recap />} />
            
            {/* 9 & 10. Strict Redirects as required by prompt */}
            <Route path="/strategy" element={<Navigate to="/live" replace />} />
            <Route path="/track-map" element={<Navigate to="/live" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
