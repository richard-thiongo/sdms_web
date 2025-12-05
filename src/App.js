import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

import Landing from './components/landing';
import RoleSelection from './components/RoleSelect';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/role?" element={<RoleSelection />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;