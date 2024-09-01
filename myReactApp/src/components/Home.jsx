import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';

function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const [role, setRole] = useState('developer');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error.message);
    }
  };

  const handleRegister = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: email,
        role: role
      });
      navigate('/dashboard');
    } catch (error) {
      console.error('Registration failed:', error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error.message);
    }
  };

  return (
    <div className="container mt-5">
      <h1 className="text-center mb-4">Project Management Tool</h1>
      {!user ? (
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card">
              <div className="card-body">
                <h2 className="card-title">Login</h2>
                <input type="email" className="form-control mb-2" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <input type="password" className="form-control mb-2" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <select className="form-control mb-2" value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="developer">Developer</option>
                  <option value="teamLead">Team Lead</option>
                  <option value="manager">Manager</option>
                </select>
                <button className="btn btn-primary w-100 mb-3" onClick={handleLogin}>Login</button>
                <h2 className="card-title mt-4">Register</h2>
                <button className="btn btn-secondary w-100" onClick={handleRegister}>Register</button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <h2>Welcome, {user.email}</h2>
          <br/>
          <button className="btn btn-danger" onClick={handleLogout}>Logout</button>
        </div>
      )}
    </div>
  );
}

export default Home;