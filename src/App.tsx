import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { Navigation } from './components/Navigation';
import { HomeView } from './components/Home/HomeView';
import { FieldsView } from './components/Fields/FieldsView.tsx';
import { NewFieldsForm } from './components/Fields/NewFieldsForm.tsx';
import { ModifyFieldsForm } from './components/Fields/ModifyFieldsForm.tsx';
import { ReservationsView } from './components/Reservations/ReservationsView';
import CalendarView from './components/Calendar/CalendarView';
import { AuthProvider } from './context/AppContext';
import { FieldsProvider } from './context/FieldsContext.tsx';
import { Login } from './components/Login/Login.tsx';
import { Signup } from './components/Login/Signup';
import { PrivateRoute } from './components/Login/PrivateRoute';
import {AssignSchedule} from "./components/Fields/AssignSchedule.tsx";

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
          <Route path="/fields" element={<PrivateRoute><FieldsView /></PrivateRoute>} />
          <Route path="/fields/new" element={<PrivateRoute><NewFieldsForm /></PrivateRoute>} />
          <Route path="/fields/:id/edit" element={<PrivateRoute><ModifyFieldsForm /></PrivateRoute>} />
          <Route path="/fields/:id/schedule" element={<PrivateRoute><AssignSchedule /></PrivateRoute>} />
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
        <FieldsProvider>
          <AppContent />
        </FieldsProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
