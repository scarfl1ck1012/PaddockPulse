import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppLayout from './components/Layout/AppLayout';
import Dashboard from './pages/Dashboard/Dashboard';
import Standings from './pages/Standings/Standings';
import RaceSchedule from './pages/Schedule/RaceSchedule';
import RaceDetail from './pages/Schedule/RaceDetail';
import LiveTiming from './pages/Live/LiveTiming';
import DriverDetail from './pages/Driver/DriverDetail';
import Compare from './pages/Compare/Compare';
import TrackMapPage from './pages/TrackMap/TrackMapPage';
import TeamRadio from './pages/Radio/TeamRadio';
import Strategy from './pages/Strategy/Strategy';
import Weather from './pages/Weather/Weather';
import Results from './pages/Results/Results';
import Replay from './pages/Replay/Replay';
import Learn from './pages/Learn/Learn';

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
            <Route path="/" element={<Dashboard />} />
            <Route path="/standings" element={<Standings />} />
            <Route path="/schedule" element={<RaceSchedule />} />
            <Route path="/schedule/:season/:round" element={<RaceDetail />} />
            <Route path="/live" element={<LiveTiming />} />
            <Route path="/driver/:driverNumber" element={<DriverDetail />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/learn" element={<Learn />} />
            <Route path="/track-map" element={<TrackMapPage />} />
            <Route path="/radio" element={<TeamRadio />} />
            <Route path="/strategy" element={<Strategy />} />
            <Route path="/weather" element={<Weather />} />
            <Route path="/results" element={<Results />} />
            <Route path="/recap" element={<Replay />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
