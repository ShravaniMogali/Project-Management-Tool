import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, storage } from '../firebase';
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, getDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import ProjectList from './ProjectList';
import TaskList from './TaskList';
import FileUpload from './FileUpload';
import Chat from './Chat';
import SmartPlanning from './SmartPlanning';

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
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');

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
        setAllUsers(users);
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
        const newMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setChatMessages(newMessages);
      });

      const unsubscribeTeamMembers = onSnapshot(
        collection(db, 'users'),
        (snapshot) => {
          const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          const projectTeamMembers = users.filter(user => user.assignedProjects && user.assignedProjects.includes(selectedProjectId));
          setTeamMembers(projectTeamMembers);
        }
      );

      return () => {
        unsubscribeTasks();
        unsubscribeChat();
        unsubscribeTeamMembers();
      };
    }
  }, [selectedProjectId]);

  const createProject = async () => {
    if (projectName.trim() && userRole === 'manager') {
      try {
        await addDoc(collection(db, 'projects'), { 
          name: projectName, 
          createdAt: new Date(),
          createdBy: user.uid
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

  const assignUserToProject = async () => {
    if (selectedUser && selectedProjectId && (userRole === 'manager' || userRole === 'teamLead')) {
      try {
        const userRef = doc(db, 'users', selectedUser);
        await updateDoc(userRef, {
          assignedProjects: arrayUnion(selectedProjectId)
        });
        alert('User assigned to project successfully!');
        setSelectedUser('');
      } catch (error) {
        console.error('Failed to assign user to project:', error.message);
        alert('Failed to assign user to project.');
      }
    }
  };

  const unassignUserFromProject = async (userId) => {
    if (userId && selectedProjectId && (userRole === 'manager' || userRole === 'teamLead')) {
      try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
          assignedProjects: arrayRemove(selectedProjectId)
        });
        alert('User unassigned from project successfully!');
      } catch (error) {
        console.error('Failed to unassign user from project:', error.message);
        alert('Failed to unassign user from project.');
      }
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
          {(userRole === 'manager' || userRole === 'teamLead') && selectedProjectId && (
            <div className="card mb-4">
              <div className="card-body">
                <h3>Assign User to Project</h3>
                <select
                  className="form-select mb-2"
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                >
                  <option value="">Select a user...</option>
                  {allUsers.map(user => (
                    <option key={user.id} value={user.id}>{user.email}</option>
                  ))}
                </select>
                <button className="btn btn-primary" onClick={assignUserToProject}>Assign to Project</button>
              </div>
            </div>
          )}
        </div>
        {selectedProjectId && (
          <div className="col-md-8">
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
            <SmartPlanning projectId={selectedProjectId} tasks={tasks} teamMembers={teamMembers} />
            {(userRole === 'manager' || userRole === 'teamLead') && (
              <div className="card mb-4">
                <div className="card-body">
                  <h3>Project Team Members</h3>
                  <ul className="list-group">
                    {teamMembers.map(member => (
                      <li key={member.id} className="list-group-item d-flex justify-content-between align-items-center">
                        {member.email}
                        <button className="btn btn-danger btn-sm" onClick={() => unassignUserFromProject(member.id)}>Remove</button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;