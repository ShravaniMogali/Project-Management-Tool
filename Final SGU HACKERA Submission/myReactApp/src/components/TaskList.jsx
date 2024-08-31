import React from 'react';

function TaskList({ tasks, task, setTask, deadline, setDeadline, assignee, setAssignee, addTask, updateTaskStatus, deleteTask, teamMembers, userRole }) {
  const renderTaskList = (status) => (
    <ul className="list-group">
      {tasks.filter(task => task.status === status).map(task => (
        <li key={task.id} className="list-group-item">
          <span>{task.task} - {new Date(task.deadline.toDate()).toLocaleDateString()}</span>
          <br />
          <small>Assigned to: {teamMembers.find(m => m.id === task.assignee)?.email}</small>
          <select
            className="form-select mt-2"
            value={task.status}
            onChange={(e) => updateTaskStatus(task.id, e.target.value)}
          >
            <option value="To Do">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="Done">Done</option>
          </select>
          <button className="btn btn-danger btn-sm mt-2" onClick={() => deleteTask(task.id)}>Delete</button>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="card mb-4">
      <div className="card-body">
        <h2 className="card-title">Tasks for Project</h2>
        {(userRole === 'manager' || userRole === 'teamLead') && (
          <>
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
            <select
              className="form-control mb-2"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
            >
              <option value="">Assign to...</option>
              {teamMembers.map(member => (
                <option key={member.id} value={member.id}>{member.email}</option>
              ))}
            </select>
            <button className="btn btn-primary w-100 mb-3" onClick={addTask}>Add Task</button>
          </>
        )}
        <div className="row">
          <div className="col-md-4">
            <h3>To Do</h3>
            {renderTaskList('To Do')}
          </div>
          <div className="col-md-4">
            <h3>In Progress</h3>
            {renderTaskList('In Progress')}
          </div>
          <div className="col-md-4">
            <h3>Done</h3>
            {renderTaskList('Done')}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TaskList;