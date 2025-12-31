import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

import Landing from './components/landing';
import RoleSelection from './components/RoleSelect';
import SchoolAdminLogin from './components/SchAdmnLogin';
import TeacherLogin from './components/TeacherLogin';
import StudentLogin from './components/StudentLogin';
import DashboardLayout from './SchAdmn/DashBrdLyt';


function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/role?" element={<RoleSelection />} />
          <Route path="/login/admin" element={<SchoolAdminLogin />} />
          <Route path="/teacher/login" element={<TeacherLogin />} />
          <Route path="/students/login" element={<StudentLogin />} />
          <Route path='/admin/dashboard' element={<DashboardLayout/>}/>
          
        </Routes>
      </div>
    </Router>
  );
}

export default App;