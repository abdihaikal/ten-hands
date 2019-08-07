import low, { AdapterSync } from "lowdb";
import FileSync from "lowdb/adapters/FileSync";
import { v4 as uuidv4 } from "uuid";
import { CONFIG_FILES } from "../../shared/config";

class Database {
  private static _instance: Database;
  private db = null;
  // Create Singleton by private constructor
  private constructor() {
    const adapter: AdapterSync = new FileSync(CONFIG_FILES.dbFile);
    this.db = low(adapter);
    this.db
      .defaults({
        projects: []
      })
      .write();
  }

  // Return singleton instance
  public static getInstance() {
    return this._instance || (this._instance = new this());
  }

  public getProjects(): IProject[] {
    const projects = this.db.get("projects").value();
    return projects;
  }

  public addProject(project: IProject) {
    // Create IDs for commands submitted
    const commands = project.commands.map(command => {
      return {
        _id: uuidv4(),
        ...command
      };
    });
    const projectWithUpdatedCommands = {
      ...project,
      commands
    };
    const newProject = {
      _id: uuidv4(),
      ...projectWithUpdatedCommands
    };
    this.db
      .get("projects")
      .push(newProject)
      .write();
    return newProject;
  }

  public deleteProject(projectId: string) {
    const result = this.db
      .get("projects")
      .remove({ _id: projectId })
      .write();
    return result;
  }

  public getProject(id: string): IProject {
    const project = this.db
      .get("projects")
      .find({ _id: id })
      .value();
    return project;
  }

  public addCommandToProject(projectId: string, command: IProjectCommand) {
    this.db
      .get("projects")
      .find({ _id: projectId })
      .get("commands")
      .push({ ...command })
      .write();
    const project = this.getProject(projectId);
    return project;
  }

  public removeCommandFromProject(projectId: string, commandId: string) {
    this.db
      .get("projects")
      .find({ _id: projectId })
      .get("commands")
      .remove({ _id: commandId })
      .write();
    const project = this.getProject(projectId);
    return project;
  }

  public getProjectCommand(projectId: string, commandId: string) {
    const command = this.db
      .get("projects")
      .find({ _id: projectId })
      .get("commands")
      .find({ _id: commandId })
      .value();
    return command;
  }

  public reorderProjectCommands(
    projectId: string,
    commands: IProjectCommand[]
  ) {
    this.db
      .get("projects")
      .find({ _id: projectId })
      .set("commands", commands)
      .write();
    const project = this.getProject(projectId);
    return project;
  }
}

export default Database.getInstance();
