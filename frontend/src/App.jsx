// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './login.jsx'; 
import Dashboard from './Dashboard.jsx';

function App() {
  return (
    <Router>
      <Routes>
        {/* The Gateway */}
        <Route path="/" element={<Login />} />
        
        {/* The Premium Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;