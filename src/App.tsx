import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { HomeView } from './components/Home/HomeView';
import { CourtsView } from './components/Courts/CourtsView';
import { NewCourtForm } from './components/Courts/NewCourtForm';
import { ModifyCourtForm } from './components/Courts/ModifyCourtForm';
import { ReservationsView } from './components/Reservations/ReservationsView';
import CalendarView from './components/Calendar/CalendarView';
import { AuthProvider } from './context/AppContext';
import { CourtsProvider } from './context/CourtsContext';
import { Login } from './components/Login/Login.tsx';
import { Signup } from './components/Login/Signup';
import { PrivateRoute } from './components/Login/PrivateRoute';

function AppContent() {
  const location = useLocation();
  const shouldShowNavigation = location.pathname !== '/login' && location.pathname !== '/signup';

  return (
    <div className="min-h-screen bg-slate-50">
      {shouldShowNavigation && <Navigation />}
      <main className="bg-slate-50 min-h-[calc(100vh-64px)] transition-all duration-300">
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/home" element={<PrivateRoute><HomeView /></PrivateRoute>} />
          <Route path="/courts" element={<PrivateRoute><CourtsView /></PrivateRoute>} />
          <Route path="/courts/new" element={<PrivateRoute><NewCourtForm /></PrivateRoute>} />
          <Route path="/courts/:id/edit" element={<PrivateRoute><ModifyCourtForm /></PrivateRoute>} />
          <Route path="/reservations" element={<PrivateRoute><ReservationsView /></PrivateRoute>} />
          <Route path="/calendar" element={<PrivateRoute><CalendarView /></PrivateRoute>} />
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <CourtsProvider> {/* CourtsProvider debe envolver AppContent */}
          <AppContent />
        </CourtsProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
