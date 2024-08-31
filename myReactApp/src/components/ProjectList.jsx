import React from 'react';

function ProjectList({ projects, projectName, setProjectName, createProject, selectProject, userRole }) {
  return (
    <div className="card mb-4">
      <div className="card-body">
        <h2 className="card-title">Projects</h2>
        {userRole === 'manager' && (
          <>
            <input
              type="text"
              className="form-control mb-2"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="New Project Name"
            />
            <button className="btn btn-primary w-100" onClick={createProject}>Create Project</button>
          </>
        )}
        <ul className="list-group mt-3">
          {projects.map(project => (
            <li key={project.id} className="list-group-item" onClick={() => selectProject(project.id)}>
              {project.name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default ProjectList;