import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase';

function SmartPlanning({ projectId, tasks }) {
  const [resources, setResources] = useState([]);
  const [budget, setBudget] = useState(0);
  const [recommendation, setRecommendation] = useState('');
  const [teamCount, setTeamCount] = useState(0);

  useEffect(() => {
    if (projectId) {
      // Fetch team members assigned to this project
      const teamMembersQuery = query(collection(db, 'users'), where('assignedProjects', 'array-contains', projectId));
      const unsubscribe = onSnapshot(teamMembersQuery, (snapshot) => {
        const teamMembers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTeamCount(teamMembers.length);
      });
      return () => unsubscribe();
    }
  }, [projectId]);

  useEffect(() => {
    // AI logic for resource allocation and budgeting
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'Done').length;
    const inProgressTasks = tasks.filter(task => task.status === 'In Progress').length;
    const todoTasks = tasks.filter(task => task.status === 'To Do').length;

    const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const estimatedBudget = totalTasks * 1000; // Assuming $1000 per task
    const estimatedResources = Math.ceil(totalTasks / 5); // Assuming 1 resource can handle 5 tasks

    setBudget(estimatedBudget);

    let newRecommendation = `Based on the current project status:\n`;
    newRecommendation += `- Estimated budget: $${estimatedBudget}\n`;
    newRecommendation += `- Current team size: ${teamCount} members\n`;
    newRecommendation += `- Recommended team size: ${estimatedResources} members\n`;
    newRecommendation += `- Project progress: ${progress.toFixed(2)}%\n\n`;

    if (teamCount < estimatedResources) {
      newRecommendation += `Consider adding ${estimatedResources - teamCount} more team members to handle the workload efficiently.\n`;
    } else if (teamCount > estimatedResources) {
      newRecommendation += `The current team size might be larger than necessary. Consider reassigning ${teamCount - estimatedResources} team members to other projects if possible.\n`;
    }

    if (inProgressTasks > teamCount * 2) {
      newRecommendation += `There are too many tasks in progress compared to the team size. Consider reducing work in progress or increasing capacity.\n`;
    }

    if (todoTasks > inProgressTasks * 2) {
      newRecommendation += `There are many tasks in the backlog. Consider re-prioritizing or increasing capacity.\n`;
    }

    if (progress < 25 && teamCount < estimatedResources) {
      newRecommendation += `Project is in early stages with a smaller team. Consider onboarding more team members to accelerate progress.\n`;
    }

    setRecommendation(newRecommendation);
  }, [tasks, teamCount]);

  return (
    <div className="card mb-4">
      <div className="card-body">
        <h2 className="card-title">Smart Resource Planning & Budgeting</h2>
        <p>Estimated Budget: ${budget}</p>
        <p>Current Team Size: {teamCount}</p>
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