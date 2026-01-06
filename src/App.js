import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

import Landing from './components/landing';
import RoleSelection from './components/RoleSelect';
import SchoolAdminLogin from './components/SchAdmnLogin';
import TeacherLogin from './components/TeacherLogin';
import StudentLogin from './components/StudentLogin';

import DashBrdLyt from './SchAdmn/DashBrdLyt';
import Dashboard from './SchAdmn/Dashboard';
import Teachers from './SchAdmn/Teachers';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/role" element={<RoleSelection />} />
        <Route path="/login/admin" element={<SchoolAdminLogin />} />
        <Route path="/teacher/login" element={<TeacherLogin />} />
        <Route path="/students/login" element={<StudentLogin />} />

        {/*SCH ADMIN LAYOUT */}
        <Route path="/admin" element={<DashBrdLyt />}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path='teachers' element={<Teachers/>} />
          {/* more admin pages go here */}
          {/* users, analytics, orders, etc */}
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
