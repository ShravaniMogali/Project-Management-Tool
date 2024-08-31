import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, storage } from '../firebase';
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import ProjectList from './ProjectList';
import TaskList from './TaskList';
import FileUpload from './FileUpload';
import Chat from './Chat';

function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [projectName, setProjectName] = useState('');
  const [tasks, setTasks] = useState([]);
  const [task, setTask] = useState('');
  const [deadline, setDeadline] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [file, setFile] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [assignee, setAssignee] = useState('');
  const [teamMembers, setTeamMembers] = useState([]);
  const [newTeamMember, setNewTeamMember] = useState('');
  const [budget, setBudget] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        setUserRole(userDoc.data().role);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const unsubscribeProjects = onSnapshot(collection(db, 'projects'), (snapshot) => {
        const newProjects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProjects(newProjects);
      });

      const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
        const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTeamMembers(users);
      });

      return () => {
        unsubscribeProjects();
        unsubscribeUsers();
      };
    }
  }, [user]);

  useEffect(() => {
    if (selectedProjectId) {
      const unsubscribeTasks = onSnapshot(collection(db, 'projects', selectedProjectId, 'tasks'), (snapshot) => {
        const newTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTasks(newTasks);
      });

      const unsubscribeChat = onSnapshot(collection(db, 'projects', selectedProjectId, 'chat'), (snapshot) => {
        const newMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
          .sort((a, b) => a.timestamp.toDate() - b.timestamp.toDate());
        setChatMessages(newMessages);
      });

      const unsubscribeBudget = onSnapshot(doc(db, 'projects', selectedProjectId), (snapshot) => {
        setBudget(snapshot.data().budget || 0);
      });

      return () => {
        unsubscribeTasks();
        unsubscribeChat();
        unsubscribeBudget();
      };
    }
  }, [selectedProjectId]);

  const createProject = async () => {
    if (projectName.trim() && userRole === 'manager') {
      try {
        await addDoc(collection(db, 'projects'), { 
          name: projectName, 
          createdAt: new Date(),
          createdBy: user.uid,
          budget: 0,
          team: []
        });
        setProjectName('');
      } catch (error) {
        console.error('Failed to create project:', error.message);
      }
    }
  };

  const addTask = async () => {
    if (task.trim() && selectedProjectId && (userRole === 'manager' || userRole === 'teamLead')) {
      try {
        await addDoc(collection(db, 'projects', selectedProjectId, 'tasks'), { 
          task, 
          deadline: new Date(deadline), 
          status: 'To Do',
          assignee: assignee,
          createdBy: user.uid
        });
        setTask('');
        setDeadline('');
        setAssignee('');
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

  const addTeamMember = async () => {
    if (newTeamMember && selectedProjectId) {
      try {
        const projectRef = doc(db, 'projects', selectedProjectId);
        const projectDoc = await getDoc(projectRef);
        const currentTeam = projectDoc.data().team || [];
        await updateDoc(projectRef, {
          team: [...currentTeam, newTeamMember]
        });
        setNewTeamMember('');
      } catch (error) {
        console.error('Failed to add team member:', error.message);
      }
    }
  };

  const updateBudget = async () => {
    if (selectedProjectId) {
      try {
        await updateDoc(doc(db, 'projects', selectedProjectId), { budget });
      } catch (error) {
        console.error('Failed to update budget:', error.message);
      }
    }
  };

  const exportProjectData = () => {
    if (selectedProjectId) {
      const projectData = {
        id: selectedProjectId,
        tasks: tasks,
        chat: chatMessages,
        budget: budget
      };
      const dataStr = JSON.stringify(projectData);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const exportFileDefaultName = 'project_data.json';
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    }
  };

  return (
    <div className="container-fluid mt-4">
      <h1 className="text-center mb-4">Dashboard</h1>
      <button className="btn btn-secondary mb-3" onClick={() => navigate('/')}>Go to Home</button>
      <div className="row">
        <div className="col-md-4">
          <ProjectList
            projects={projects}
            projectName={projectName}
            setProjectName={setProjectName}
            createProject={createProject}
            selectProject={selectProject}
            userRole={userRole}
          />
          {selectedProjectId && (
            <div className="card mt-3">
              <div className="card-body">
                <h3>Team Members</h3>
                <ul className="list-group">
                  {projects.find(p => p.id === selectedProjectId)?.team?.map((member, index) => (
                    <li key={index} className="list-group-item">{member}</li>
                  ))}
                </ul>
                <div className="input-group mt-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="New team member email"
                    value={newTeamMember}
                    onChange={(e) => setNewTeamMember(e.target.value)}
                  />
                  <button className="btn btn-outline-secondary" type="button" onClick={addTeamMember}>Add</button>
                </div>
              </div>
            </div>
          )}
        </div>
        {selectedProjectId && (
          <div className="col-md-8">
            <div className="card mb-3">
              <div className="card-body">
                <h3>Project Budget</h3>
                <div className="input-group">
                  <input
                    type="number"
                    className="form-control"
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                  />
                  <button className="btn btn-outline-secondary" type="button" onClick={updateBudget}>Update Budget</button>
                </div>
              </div>
            </div>
            <TaskList
              tasks={tasks}
              task={task}
              setTask={setTask}
              deadline={deadline}
              setDeadline={setDeadline}
              assignee={assignee}
              setAssignee={setAssignee}
              addTask={addTask}
              updateTaskStatus={updateTaskStatus}
              deleteTask={deleteTask}
              teamMembers={teamMembers}
              userRole={userRole}
            />
            <FileUpload
              file={file}
              setFile={setFile}
              handleFileUpload={handleFileUpload}
            />
            <Chat
              chatMessages={chatMessages}
              newMessage={newMessage}
              setNewMessage={setNewMessage}
              sendMessage={sendMessage}
            />
            <button className="btn btn-primary mt-3" onClick={exportProjectData}>Export Project Data</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;