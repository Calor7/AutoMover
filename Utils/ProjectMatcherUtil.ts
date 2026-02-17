import type { App, TFile } from "obsidian";
import { ProjectRule } from "Models/ProjectRule";

class ProjectMatcherUtil {
  private static instance: ProjectMatcherUtil;

  private constructor() { }

  public static getInstance(): ProjectMatcherUtil {
    if (!ProjectMatcherUtil.instance) {
      ProjectMatcherUtil.instance = new ProjectMatcherUtil();
    }
    return ProjectMatcherUtil.instance;
  }

  /**
   * Returns the first project rule that matches the file
   * If no rule matches, returns null
   * @param projectName
   * @param projectRules
   * @returns { rule: ProjectRule, matches: RegExpMatchArray | null } | null
   */
  public getMatchingProjectRule(file: TFile, app: App, projectRules: ProjectRule[]): { rule: ProjectRule, matches: RegExpMatchArray | null } | null {
    const cache = app.metadataCache.getFileCache(file);
    const frontmatter = cache?.frontmatter;

    if (!frontmatter) return null;

    for (const projectRule of projectRules) {
      // Default to "Project" if no yaml key is specified
      const yamlKey = projectRule.yaml || "Project";

      // Check both capitalized and lowercase for default Project key for backward compatibility
      // But only if the key is "Project"
      let projectValue: string | undefined;

      if (yamlKey === "Project") {
        projectValue = frontmatter["Project"] || frontmatter["project"];
      } else {
        projectValue = frontmatter[yamlKey];
      }

      if (!projectValue) continue;

      if (projectValue === projectRule.projectName) {
        return { rule: projectRule, matches: null };
      }

      try {
        const regex = new RegExp(projectRule.projectName);
        const matches = regex.exec(projectValue);
        if (matches) {
          return { rule: projectRule, matches: matches };
        }
      } catch (e) {
        console.warn(`Invalid regex in project rule: ${projectRule.projectName}`, e);
      }
    }
    return null;
  }

  /**
   * Prepends the project folder to the destination path
   * and checks whether the project folder ends with a slash
   *
   * @param projectRule
   * @param subPath
   * @returns string
   */
  public constructProjectDestinationPath(projectRule: ProjectRule, subPath: string, matches: RegExpMatchArray | null = null): string {
    let projectFolder = projectRule.folder;

    if (matches) {
      // Replace regex groups $1, $2, etc.
      for (let i = 1; i < matches.length; i++) {
        projectFolder = projectFolder.replace(`$${i}`, matches[i] || "");
      }
    }

    if (!projectFolder.endsWith("/")) {
      projectFolder += "/";
    }
    return projectFolder + subPath;
  }
}
const projectMatcherUtil = ProjectMatcherUtil.getInstance();
export default projectMatcherUtil;
