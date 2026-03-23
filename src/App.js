// App.js (updated)
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

import Landing from './components/landing';
import RoleSelection from './components/RoleSelect';
import SchoolAdminLogin from './components/SchAdmnLogin';
import TeacherLogin from './components/TeacherLogin';
import StudentLogin from './components/StudentLogin';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsAndConditions from './components/TermsAndConditions';

import DashBrdLyt from './SchAdmn/DashBrdLyt';
import Dashboard from './SchAdmn/Dashboard';
import Teachers from './SchAdmn/Teachers';
import Classes from './SchAdmn/Classes';
import Students from './SchAdmn/Students';
import AandBincidents from './SchAdmn/AandBincidents';
import Sincidents from './SchAdmn/Sincidents';

// Teacher imports - NEW 5-FILE STRUCTURE
import TeacherApp from './Teacher/TeacherApp';

// Student imports
import StudentMain from './Student/Main';
import StudentIncidentsList from './Student/IncidentsList';
import StudentIncidentDetails from './Student/IncidentDetails';
import StudentLayout from './Student/StudentLayout';
import { StudentProvider } from './Student/StudentContext';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
        <Route path="/role" element={<RoleSelection />} />
        <Route path="/login/admin" element={<SchoolAdminLogin />} />
        <Route path="/teacher/login" element={<TeacherLogin />} />
        <Route path="/students/login" element={<StudentLogin />} />

        {/* Teacher routes - UPDATED to use the new 5-file structure */}
        <Route path="/teacher/*" element={<TeacherApp />} />

        {/* School Admin routes - UNCHANGED */}
        <Route path="/admin" element={<DashBrdLyt />}>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />  
          <Route path="teachers" element={<Teachers />} />
          <Route path="classes" element={<Classes />} />
          <Route path="students" element={<Students />} />
          <Route path="ab-incidents" element={<AandBincidents />} />
          <Route path="s-incidents" element={<Sincidents />} />
        </Route>

        {/* Student routes - UPDATED with StudentProvider */}
        <Route path="/student" element={
          <StudentProvider>
            <StudentLayout />
          </StudentProvider>
        }>
          <Route index element={<StudentMain />} />
          <Route path="dashboard" element={<StudentMain />} />
          <Route path="incidents/personal" element={<StudentIncidentsList type="personal" />} />
          <Route path="incidents/class" element={<StudentIncidentsList type="class" />} />
          <Route path="incidents/all" element={<StudentIncidentsList type="all" />} />
        </Route>
        
        <Route path="/student/incident/:incidentId" element={
          <StudentProvider>
            <StudentIncidentDetails />
          </StudentProvider>
        } />
      </Routes>
    </Router>
  );
}

export default App;