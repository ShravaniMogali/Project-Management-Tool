import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useNavigate } from 'react-router-dom';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

const firebaseConfig = {
    apiKey: "AIzaSyDjiJP1lAfswSpFpdPeabedhmtDFfAukZU",
    authDomain: "project-management-tool-ea31f.firebaseapp.com",
    projectId: "project-management-tool-ea31f",
    storageBucket: "project-management-tool-ea31f.appspot.com",
    messagingSenderId: "934966707074",
    appId: "1:934966707074:web:0487920d07f5810092c59b",
    measurementId: "G-DCJ00QSRPR"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

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
      await createUserWithEmailAndPassword(auth, email, password);
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
                <button className="btn btn-primary w-100 mb-3" onClick={handleLogin}>Login</button>
                <h2 className="card-title mt-4">Register</h2>
                <button className="btn btn-secondary w-100" onClick={handleRegister}>Register</button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <p>Welcome, {user.email}</p>
          <button className="btn btn-danger" onClick={handleLogout}>Logout</button>
        </div>
      )}
    </div>
  );
}

function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [projectName, setProjectName] = useState('');
  const [tasks, setTasks] = useState([]);
  const [task, setTask] = useState('');
  const [deadline, setDeadline] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [user, setUser] = useState(null);
  const [file, setFile] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const unsubscribeProjects = onSnapshot(collection(db, 'projects'), (snapshot) => {
        const newProjects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProjects(newProjects);
      });

      return () => unsubscribeProjects();
    }
  }, [user]);

  useEffect(() => {
    if (selectedProjectId) {
      const unsubscribeTasks = onSnapshot(collection(db, 'projects', selectedProjectId, 'tasks'), (snapshot) => {
        const newTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTasks(newTasks);
      });

      const unsubscribeChat = onSnapshot(collection(db, 'projects', selectedProjectId, 'chat'), (snapshot) => {
        const newMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setChatMessages(newMessages);
      });

      return () => {
        unsubscribeTasks();
        unsubscribeChat();
      };
    }
  }, [selectedProjectId]);

  const createProject = async () => {
    if (projectName.trim()) {
      try {
        await addDoc(collection(db, 'projects'), { name: projectName, createdAt: new Date() });
        setProjectName('');
      } catch (error) {
        console.error('Failed to create project:', error.message);
      }
    }
  };

  const addTask = async () => {
    if (task.trim() && selectedProjectId) {
      try {
        await addDoc(collection(db, 'projects', selectedProjectId, 'tasks'), { task, deadline: new Date(deadline), status: 'In Progress' });
        setTask('');
        setDeadline('');
      } catch (error) {
        console.error('Failed to add task:', error.message);
      }
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await deleteDoc(doc(db, 'projects', selectedProjectId, 'tasks', taskId));
    } catch (error) {
      console.error('Failed to delete task:', error.message);
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      await updateDoc(doc(db, 'projects', selectedProjectId, 'tasks', taskId), { status: newStatus });
    } catch (error) {
      console.error('Failed to update task status:', error.message);
    }
  };

  const selectProject = (projectId) => {
    setSelectedProjectId(projectId);
  };

  const handleFileUpload = async () => {
    if (file && selectedProjectId) {
      const storageRef = ref(storage, `projects/${selectedProjectId}/${file.name}`);
      try {
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        await addDoc(collection(db, 'projects', selectedProjectId, 'files'), {
          name: file.name,
          url: downloadURL,
          uploadedAt: new Date()
        });
        setFile(null);
      } catch (error) {
        console.error('Failed to upload file:', error.message);
      }
    }
  };

  const sendMessage = async () => {
    if (newMessage.trim() && selectedProjectId) {
      try {
        await addDoc(collection(db, 'projects', selectedProjectId, 'chat'), {
          message: newMessage,
          sender: user.email,
          timestamp: new Date()
        });
        setNewMessage('');
      } catch (error) {
        console.error('Failed to send message:', error.message);
      }
    }
  };

  return (
    <div className="container-fluid mt-4">
      <h1 className="text-center mb-4">Dashboard</h1>
      <button className="btn btn-secondary mb-3" onClick={() => navigate('/')}>Go to Home</button>
      <div className="row">
        <div className="col-md-4">
          <div className="card mb-4">
            <div className="card-body">
              <h2 className="card-title">Projects</h2>
              <input
                type="text"
                className="form-control mb-2"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="New Project Name"
              />
              <button className="btn btn-primary w-100" onClick={createProject}>Create Project</button>
              <ul className="list-group mt-3">
                {projects.map(project => (
                  <li key={project.id} className="list-group-item" onClick={() => selectProject(project.id)}>
                    {project.name}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        {selectedProjectId && (
          <div className="col-md-8">
            <div className="card mb-4">
              <div className="card-body">
                <h2 className="card-title">Tasks for Project</h2>
                <input
                  type="text"
                  className="form-control mb-2"
                  value={task}
                  onChange={(e) => setTask(e.target.value)}
                  placeholder="New Task"
                />
                <input
                  type="date"
                  className="form-control mb-2"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
                <button className="btn btn-primary w-100 mb-3" onClick={addTask}>Add Task</button>
                <ul className="list-group">
                  {tasks.map(task => (
                    <li key={task.id} className="list-group-item d-flex justify-content-between align-items-center">
                      <span>{task.task} - {new Date(task.deadline.toDate()).toLocaleDateString()}</span>
                      <div>
                        <select
                          className="form-select me-2"
                          value={task.status}
                          onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                        >
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                        </select>
                        <button className="btn btn-danger btn-sm" onClick={() => deleteTask(task.id)}>Delete</button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="card mb-4">
              <div className="card-body">
                <h2 className="card-title">File Sharing</h2>
                <input
                  type="file"
                  className="form-control mb-2"
                  onChange={(e) => setFile(e.target.files[0])}
                />
                <button className="btn btn-primary w-100" onClick={handleFileUpload}>Upload File</button>
              </div>
            </div>
            <div className="card">
              <div className="card-body">
                <h2 className="card-title">Chat</h2>
                <div className="chat-messages mb-3" style={{height: '200px', overflowY: 'scroll'}}>
                  {chatMessages.map(msg => (
                    <div key={msg.id} className="mb-2">
                      <strong>{msg.sender}:</strong> {msg.message}
                    </div>
                  ))}
                </div>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                  />
                  <button className="btn btn-primary" onClick={sendMessage}>Send</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <nav className="navbar navbar-expand-lg navbar-light bg-light">
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