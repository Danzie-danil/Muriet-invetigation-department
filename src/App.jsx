import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import CasesModule from './pages/CasesModule';
import PhotoAlbum from './pages/PhotoAlbum';
import CaseProgression from './pages/CaseProgression';
import CourtAssessment from './pages/CourtAssessment';
import HabitualCriminals from './pages/HabitualCriminals';
import AuditLogView from './pages/AuditLogView';
import EvidencesAndFindings from './pages/EvidencesAndFindings';
import Login from './pages/Login';
import RegisterOfficer from './pages/RegisterOfficer';

import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

import { ToastProvider } from './context/ToastContext';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <LanguageProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Auth Route */}
              <Route path="/login" element={<Login />} />

              {/* Global Protected Routes wrapped in MainLayout */}
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<MainLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="cases" element={<CasesModule />} />
                  <Route path="evidences" element={<EvidencesAndFindings />} />
                  <Route path="photos" element={<PhotoAlbum />} />
                  <Route path="progression" element={<CaseProgression />} />
                  <Route path="court" element={<CourtAssessment />} />
                  <Route path="habituals" element={<HabitualCriminals />} />
                  <Route path="audit" element={<AuditLogView />} />
                  
                  {/* OCS Only Route */}
                  <Route element={<ProtectedRoute allowedRoles={['ocs']} />}>
                    <Route path="register-officer" element={<RegisterOfficer />} />
                  </Route>

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Route>
            </Routes>
          </BrowserRouter>
        </LanguageProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

