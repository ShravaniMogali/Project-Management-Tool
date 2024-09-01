import React, { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import SmartPlanning from './SmartPlanning';

function SmartPlanningPage() {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'projects'), (snapshot) => {
      const newProjects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProjects(newProjects);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      const unsubscribeTasks = onSnapshot(collection(db, 'projects', selectedProjectId, 'tasks'), (snapshot) => {
        const newTasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTasks(newTasks);
      });
      return () => unsubscribeTasks();
    }
  }, [selectedProjectId]);

  return (
    <div className="container mt-4">
      <h1 className="text-center mb-4">Smart Planning</h1>
      <div className="row">
        <div className="col-md-4">
          <h2>Select a Project</h2>
          <ul className="list-group">
            {projects.map(project => (
              <li
                key={project.id}
                className={`list-group-item ${selectedProjectId === project.id ? 'active' : ''}`}
                onClick={() => setSelectedProjectId(project.id)}
              >
                {project.name}
              </li>
            ))}
          </ul>
        </div>
        <div className="col-md-8">
          {selectedProjectId ? (
            <SmartPlanning projectId={selectedProjectId} tasks={tasks} />
          ) : (
            <p>Please select a project to view smart planning insights.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default SmartPlanningPage;