import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Home from './components/Home';
import Dashboard from './components/Dashboard';
import 'bootstrap/dist/css/bootstrap.min.css';
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
          </div>
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;