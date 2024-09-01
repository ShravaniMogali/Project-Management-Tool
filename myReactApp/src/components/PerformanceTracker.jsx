import React, { useState, useEffect, useMemo } from 'react';
import { getFirestore, collection, query, where, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

const db = getFirestore();
const auth = getAuth();

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const PerformanceTracker = () => {
  const [projectsData, setProjectsData] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalBudget, setTotalBudget] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);

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
            budget: data.budget || 0,
            spent: 0,
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

        let overallBudget = 0;
        let overallSpent = 0;

        newProjects.forEach(project => {
          const tasksRef = collection(db, 'projects', project.id, 'tasks');
          onSnapshot(tasksRef, (tasksSnapshot) => {
            const tasks = tasksSnapshot.docs.map(doc => doc.data());
            const totalTasks = tasks.length;
            const completedTasks = tasks.filter(task => task.status === 'Done').length;
            const inProgressTasks = tasks.filter(task => task.status === 'In Progress').length;
            const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

            // Calculate spent amount based on task progress
            const taskBudget = project.budget / totalTasks;
            const spent = (completedTasks * taskBudget) + (inProgressTasks * taskBudget * 0.5);

            overallBudget += project.budget;
            overallSpent += spent;

            setProjectsData(prevData => prevData.map(p => 
              p.id === project.id 
                ? {
                    ...p,
                    progress: progress.toFixed(2),
                    spent: spent.toFixed(2),
                    tasks: {
                      total: totalTasks,
                      completed: completedTasks,
                      inProgress: inProgressTasks,
                      todo: tasks.filter(task => task.status === 'To Do').length
                    }
                  }
                : p
            ));
          });
        });

        setTotalBudget(overallBudget);
        setTotalSpent(overallSpent);
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

  const taskChartData = useMemo(() => {
    return projectsData.map(project => ({
      name: project.name,
      completed: project.tasks.completed,
      inProgress: project.tasks.inProgress,
      todo: project.tasks.todo
    }));
  }, [projectsData]);

  const BudgetProgressBar = ({ budget, spent, projectName, progress }) => {
    const spentPercentage = (spent / budget) * 100;
    return (
      <div className="mb-3">
        <div className="d-flex justify-content-between">
          <span>{projectName}</span>
          <span>Progress: {progress}% | Budget: ${budget} | Spent: ${spent}</span>
        </div>
        <div className="progress" style={{ height: '20px' }}>
          <div
            className="progress-bar bg-success"
            role="progressbar"
            style={{ width: `${progress}%` }}
            aria-valuenow={progress}
            aria-valuemin="0"
            aria-valuemax="100"
          ></div>
          <div
            className="progress-bar bg-warning"
            role="progressbar"
            style={{ width: `${spentPercentage - progress}%` }}
            aria-valuenow={spentPercentage - progress}
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
        <div className="col-md-12">
          <h4>Overall Progress: {overallProgress}% | Total Budget: ${totalBudget} | Total Spent: ${totalSpent.toFixed(2)}</h4>
          <div className="mt-4">
            {projectsData.length === 0 ? (
              <p>No projects found. Create a project to see progress.</p>
            ) : (
              projectsData.map(project => (
                <BudgetProgressBar
                  key={project.id}
                  progress={project.progress}
                  projectName={project.name}
                  budget={project.budget}
                  spent={project.spent}
                />
              ))
            )}
          </div>
        </div>
      </div>
      <div className="row mt-4">
        <div className="col-md-12">
          <h4>Task Distribution by Project</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={taskChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="completed" stackId="a" fill="#82ca9d" name="Completed" />
              <Bar dataKey="inProgress" stackId="a" fill="#8884d8" name="In Progress" />
              <Bar dataKey="todo" stackId="a" fill="#ffc658" name="To Do" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default PerformanceTracker;