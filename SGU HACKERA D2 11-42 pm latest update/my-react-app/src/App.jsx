import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Home from './components/Home';
import Dashboard from './components/Dashboard';
import 'bootstrap/dist/css/bootstrap.min.css';
import PerformanceTracker from './components/PerformanceTracker';
import SmartPlanningPage from './components/SmartPlanningPage'; // Update this line
import './App.css';

function App() {
  return (
    <Router>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container-fluid">
          <Link className="navbar-brand" to="/">Project Manager</Link>
          <div className="navbar-nav">
            <Link className="nav-link" to="/">Home</Link>
            <Link className="nav-link" to="/dashboard">Dashboard</Link>
            <Link className="nav-link" to="/performance">Project Progress</Link>
            <Link className="nav-link" to="/smart-planning">Smart Planning</Link>
            <Link className="nav-link" to="https://pf91w35g-3456.inc1.devtunnels.ms/">Video Conferencing</Link>
          </div>
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/performance" element={<PerformanceTracker />} />
        <Route path="/smart-planning" element={<SmartPlanningPage />} />
      </Routes>
    </Router>
  );
}

export default App;