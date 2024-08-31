import React, { useState, useEffect, useMemo } from 'react';
import { getFirestore, collection, query, where, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const db = getFirestore();
const auth = getAuth();

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const PerformanceTracker = () => {
  const [projectsData, setProjectsData] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!auth.currentUser) {
      setError("No authenticated user found");
      setLoading(false);
      return;
    }

    const projectsRef = collection(db, 'projects');
    const q = query(projectsRef, where('createdBy', '==', auth.currentUser.uid));

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const newProjects = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            progress: 0,
            tasks: {
              total: 0,
              completed: 0,
              inProgress: 0,
              todo: 0
            }
          };
        });
        setProjectsData(newProjects);
        setLoading(false);

        newProjects.forEach(project => {
          const tasksRef = collection(db, 'projects', project.id, 'tasks');
          onSnapshot(tasksRef, (tasksSnapshot) => {
            const tasks = tasksSnapshot.docs.map(doc => doc.data());
            const totalTasks = tasks.length;
            const completedTasks = tasks.filter(task => task.status === 'Done').length;
            const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

            setProjectsData(prevData => prevData.map(p => 
              p.id === project.id 
                ? {
                    ...p,
                    progress: progress.toFixed(2),
                    tasks: {
                      total: totalTasks,
                      completed: completedTasks,
                      inProgress: tasks.filter(task => task.status === 'In Progress').length,
                      todo: tasks.filter(task => task.status === 'To Do').length
                    }
                  }
                : p
            ));
          });
        });
      },
      (err) => {
        setError("Error fetching projects: " + err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const overallProgress = useMemo(() => {
    if (projectsData.length === 0) return 0;
    const totalProgress = projectsData.reduce((sum, project) => sum + parseFloat(project.progress), 0);
    return (totalProgress / projectsData.length).toFixed(2);
  }, [projectsData]);

  const pieChartData = useMemo(() => {
    if (!selectedProject) return [];
    return [
      { name: 'Completed', value: selectedProject.tasks.completed },
      { name: 'In Progress', value: selectedProject.tasks.inProgress },
      { name: 'To Do', value: selectedProject.tasks.todo }
    ];
  }, [selectedProject]);

  const LinearProgressBar = ({ progress, projectName }) => {
    return (
      <div className="mb-3">
        <div className="d-flex justify-content-between">
          <span>{projectName}</span>
          <span>{progress}%</span>
        </div>
        <div className="progress" style={{ height: '20px' }}>
          <div
            className="progress-bar"
            role="progressbar"
            style={{ width: `${progress}%` }}
            aria-valuenow={progress}
            aria-valuemin="0"
            aria-valuemax="100"
          ></div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div>Loading projects...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="container mt-4">
      <h2>Project Performance Tracker</h2>
      <div className="row">
        <div className="col-md-8">
          <h4>Overall Progress: {overallProgress}%</h4>
          <div className="mt-4">
            {projectsData.length === 0 ? (
              <p>No projects found. Create a project to see progress.</p>
            ) : (
              projectsData.map(project => (
                <LinearProgressBar
                  key={project.id}
                  progress={project.progress}
                  projectName={project.name}
                />
              ))
            )}
          </div>
          <div className="mt-4">
            <h5>Debug Information:</h5>
            <pre>{JSON.stringify(projectsData, null, 2)}</pre>
          </div>
        </div>
        <div className="col-md-4">
          {selectedProject && (
            <div>
              <h4>{selectedProject.name} Details</h4>
              <p>Progress: {selectedProject.progress}%</p>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PerformanceTracker;