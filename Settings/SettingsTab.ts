import settingsIO from "IO/SettingsIO";
import timerUtil from "Utils/TimerUtil";
import type AutoMoverPlugin from "main";
import { type App, PluginSettingTab, Setting } from "obsidian";
import { exclusionSection } from "./ExclusionSection";
import RuleChainSection from "./RuleChainSection";

export class SettingsTab extends PluginSettingTab {
  plugin: AutoMoverPlugin;

  constructor(app: App, plugin: AutoMoverPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display = () => {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl).setName("Automatic moving").setHeading();
    new Setting(containerEl)
      .setName("Export/Import of settings")
      .setDesc(
        `Import will replace the current settings.
         If you aren't prompted to choose a location, then the file will be exported to/imported from the vault root as AutoMover_settings.json (json files aren't visible in the vault by default).`,
      )
      .addButton((button) => {
        button.setButtonText("Export settings");
        button.onClick(async () => {
          settingsIO.exportSettings(this.plugin.settings);
        });
      })
      .addButton((button) => {
        button.setButtonText("Import settings");
        button.onClick(async () => {
          const importedSettings = await settingsIO.importSettings();
          if (importedSettings) {
            this.plugin.settings = importedSettings;
            await this.plugin.saveData(this.plugin.settings);
            this.plugin.app.workspace.trigger("AutoMover:automatic-moving-update", this.plugin.settings);
            this.display();
          }
        });
      });

    new Setting(containerEl)
      .setName("Move on open")
      .setDesc("Should the file be moved when it is opened?")
      .addToggle((cb) =>
        cb.setValue(this.plugin.settings.moveOnOpen).onChange(async (value) => {
          this.plugin.settings.moveOnOpen = value;
          await this.plugin.saveData(this.plugin.settings);
        }),
      );

    new Setting(containerEl)
      .setName("Manually move")
      .setDesc("Execute the command to go through your notes and move them according to the rules specified below.")
      .addButton((button) => {
        button.setButtonText("Move files");
        button.onClick(async () => {
          this.plugin.goThroughAllFiles();
        });
      });

    const automaticMovingContainer = containerEl.createDiv({});

    new Setting(automaticMovingContainer)
      .setName("Automatic moving")
      .setDesc(
        `Execute a timed event that goes through all the files and moves them according to the rules specified below.
 		 The formatting is hh:mm:ss (if set 00:05:00 it will execute every 5 minutes).
 	     If the timer is set to 0, the automatic moving will do nothing.`,
      )
      .setClass("timer-setting")
      .addToggle((cb) =>
        cb.setValue(this.plugin.settings.automaticMoving).onChange(async (value) => {
          this.plugin.settings.automaticMoving = value;
          await this.plugin.saveData(this.plugin.settings);
          this.app.workspace.trigger("AutoMover:automatic-moving-update", this.plugin.settings);
          this.display();
        }),
      )
      .addText((cb) =>
        cb
          .setDisabled(!this.plugin.settings.automaticMoving)
          .setValue(timerUtil.formatTime(this.plugin.settings.timer))
          .setPlaceholder("hh:mm:ss")
          .onChange(async (value) => {
            this.plugin.settings.timer = timerUtil.parseTimeToMs(value);
            await this.plugin.saveData(this.plugin.settings);
            this.app.workspace.trigger("AutoMover:automatic-moving-update", this.plugin.settings);
          }),
      );

    // TUTORIAL (Simplified for now or removed as Rules have changed?)
    // Keeping it simple since logic changed significantly.
    // Maybe new tutorial needed? For now, I'll stick to the Rules Section.

    // New Rule Chain Section
    const ruleChainSection = new RuleChainSection(this.app, this.plugin, containerEl);
    ruleChainSection.display();

    // Exclusion Rules (Keeping these)
    exclusionSection(containerEl, this.plugin, this.display);
  };
}
