import { Notice, TFile, TFolder } from "obsidian";
import type { App } from "obsidian";

class MovingUtil {
  private static instance: MovingUtil;
  private app: App;

  private constructor() { }

  public static getInstance(): MovingUtil {
    if (!MovingUtil.instance) {
      MovingUtil.instance = new MovingUtil();
    }
    return MovingUtil.instance;
  }

  public init(app: App): void {
    this.app = app;
  }

  /**
   * Checks if the path is a file
   *
   * @param path - Path to be checked
   * @returns boolean
   */
  public isFile(path: string): boolean {
    const file = this.app.vault.getAbstractFileByPath(path);
    return file instanceof TFile;
  }

  /**
   * Checks if the path is a folder
   *
   * @param path - Path to be checked
   * @returns boolean
   */
  public isFolder(path: string): boolean {
    return this.app.vault.getAbstractFileByPath(path) instanceof TFolder;
  }

  /**
   * Moves the file to the destination path
   *
   * @param file - File to be moved
   * @param newPath - Destination path
   * @returns void
   */
  public moveFile(file: TFile, newPath: string): void {
    // Ensure we don't end with a slash for folder checking, but we use it for file moving?
    // Actually, Obsidian's rename takes the full new path including filename.

    // If the newPath comes in as "Folder/Subfolder/", we need to strip the slash to check if the folder exists.
    const folderPath = newPath.endsWith("/") ? newPath.slice(0, -1) : newPath;

    if (this.isFolder(folderPath)) {
      // Folder exists
      const destinationFile = newPath.endsWith("/") ? `${newPath}${file.name}` : `${newPath}/${file.name}`;
      this.app.vault.rename(file, destinationFile);
    } else {
      new Notice(
        `Creating folder: ${folderPath}`,
        2000,
      );
      // console.log(`Creating folder: ${folderPath}`);

      this.createMissingFolders(folderPath).then((success) => {
        if (success) {
          const destinationFile = newPath.endsWith("/") ? `${newPath}${file.name}` : `${newPath}/${file.name}`;
          this.app.vault.rename(file, destinationFile);
        } else {
          console.error("Failed to create folders for move.");
        }
      });
    }
  }

  /**
   * Moves the folder to the destination path
   *
   * @param folder - Folder to be moved
   * @param newPath - Destination path
   * @returns void
   */
  public moveFolder(folder: TFolder, newPath: string): void {
    if (this.isFolder(newPath)) {
      this.app.vault.rename(folder, `${newPath}/${folder.name}`);
    } else {
      new Notice(`Invalid destination path\n${newPath} is not a folder!`, 5000);
      console.error(`Invalid destination path\n${newPath} is not a folder!`);
    }
  }

  /**
   * Creates folder in destination path if it does not exist already
   *
   * @param path - Path of the folder to be created
   * @returns Created folder or null if folder already exists
   */
  public createFolder(path: string): TFolder | null {
    if (!this.isFolder(path)) {
      this.app.vault.createFolder(path).then((folder) => {
        return folder;
      });
    } else {
      new Notice("Folder already exists", 5000);
      console.error("Folder already exists");
    }
    return null;
  }

  /**
   * Splits the path into an array of strings
   *
   * @param path - Path to be split
   * @returns string[]
   */
  private splitPath(path: string): string[] {
    return path.split("/");
  }

  /**
   * Create missing folders in the path
   *
   * @param path - Path to be checked
   * @returns void
   */
  private async createMissingFolders(path: string): Promise<boolean> {
    // Determine if we need to remove a trailing slash
    const cleanPath = path.endsWith("/") ? path.slice(0, -1) : path;
    const splitPath = cleanPath.split("/");

    let currentPath = "";
    for (const folder of splitPath) {
      if (currentPath !== "") {
        currentPath += "/";
      }
      currentPath += folder;

      const abstractFile = this.app.vault.getAbstractFileByPath(currentPath);

      if (!abstractFile) {
        await this.app.vault.createFolder(currentPath);
      } else if (!(abstractFile instanceof TFolder)) {
        // It exists but it's a file, not a folder!
        console.error(`Error: ${currentPath} exists but is not a folder.`);
        return false;
      }
    }

    return true;
  }
}

const movingUtil = MovingUtil.getInstance();
export default movingUtil;
