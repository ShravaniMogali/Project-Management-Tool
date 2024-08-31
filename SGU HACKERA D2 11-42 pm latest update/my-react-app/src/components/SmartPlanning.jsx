import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, doc } from 'firebase/firestore';
import { db } from '../firebase';

function SmartPlanning({ projectId, tasks }) {
  const [resources, setResources] = useState([]);
  const [budget, setBudget] = useState(0);
  const [recommendation, setRecommendation] = useState('');

  useEffect(() => {
    if (projectId) {
      const resourcesQuery = query(collection(db, 'resources'), where('projectId', '==', projectId));
      const unsubscribeResources = onSnapshot(resourcesQuery, (snapshot) => {
        const newResources = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setResources(newResources);
      });

      const unsubscribeBudget = onSnapshot(doc(db, 'projects', projectId), (snapshot) => {
        setBudget(snapshot.data().budget || 0);
      });

      return () => {
        unsubscribeResources();
        unsubscribeBudget();
      };
    }
  }, [projectId]);

  useEffect(() => {
    // AI logic for resource allocation and budgeting
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'Done').length;
    const inProgressTasks = tasks.filter(task => task.status === 'In Progress').length;
    const todoTasks = tasks.filter(task => task.status === 'To Do').length;

    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const estimatedResources = Math.ceil(totalTasks / 5); // Assuming 1 resource can handle 5 tasks

    let newRecommendation = `Based on the current project status:\n`;
    newRecommendation += `- Current budget: $${budget}\n`;
    newRecommendation += `- Recommended team size: ${estimatedResources} members\n`;
    newRecommendation += `- Project progress: ${progress.toFixed(2)}%\n\n`;

    if (inProgressTasks > resources.length * 2) {
      newRecommendation += `Consider adding more team members to handle the workload.\n`;
    }

    if (todoTasks > inProgressTasks * 2) {
      newRecommendation += `There are many tasks in the backlog. Consider re-prioritizing or increasing capacity.\n`;
    }

    if (progress < 25 && resources.length < estimatedResources) {
      newRecommendation += `Project is in early stages. Consider onboarding more team members to accelerate progress.\n`;
    }

    if (budget === 0) {
      newRecommendation += `No budget set for this project. Consider setting a budget for better resource planning.\n`;
    } else if (budget < totalTasks * 500) {
      newRecommendation += `The current budget might be insufficient for the number of tasks. Consider increasing the budget or reducing the scope.\n`;
    }

    setRecommendation(newRecommendation);
  }, [tasks, resources, budget]);

  return (
    <div className="card mb-4">
      <div className="card-body">
        <h2 className="card-title">Smart Resource Planning & Budgeting</h2>
        <p>Current Budget: ${budget}</p>
        <p>Current Team Size: {resources.length}</p>
        <h3>AI Recommendation:</h3>
        <pre className="bg-light p-3 rounded">{recommendation}</pre>
        <h3>Task Breakdown:</h3>
        <ul>
          <li>Total Tasks: {tasks.length}</li>
          <li>Completed Tasks: {tasks.filter(task => task.status === 'Done').length}</li>
          <li>In Progress Tasks: {tasks.filter(task => task.status === 'In Progress').length}</li>
          <li>To Do Tasks: {tasks.filter(task => task.status === 'To Do').length}</li>
        </ul>
      </div>
    </div>
  );
}

export default SmartPlanning;