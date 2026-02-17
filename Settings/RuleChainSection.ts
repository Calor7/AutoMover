import type { App, Setting } from "obsidian";
import type AutoMoverPlugin from "main";
import type { RuleChain } from "Models/RuleChain";
import type { RuleStep } from "Models/RuleStep";
import { Setting as ObsidianSetting } from "obsidian";

export default class RuleChainSection {
    app: App;
    plugin: AutoMoverPlugin;
    containerEl: HTMLElement;

    constructor(app: App, plugin: AutoMoverPlugin, containerEl: HTMLElement) {
        this.app = app;
        this.plugin = plugin;
        this.containerEl = containerEl;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl("h2", { text: "Cascading Rules" });

        const description = containerEl.createEl("p", {
            text: "Rules are evaluated in order. The first rule that matches will move the file. Each rule consists of a series of steps that build the destination path."
        });
        description.style.marginBottom = "10px";

        new ObsidianSetting(containerEl)
            .setName("Add New Rule Chain")
            .setDesc("Create a new cascading rule.")
            .addButton((button) => {
                button
                    .setButtonText("Add Rule")
                    .setCta()
                    .onClick(async () => {
                        this.plugin.settings.ruleChains.push({
                            name: "New Rule",
                            steps: [],
                            active: true
                        });
                        await this.plugin.saveData(this.plugin.settings);
                        this.display();
                    });
            });

        this.plugin.settings.ruleChains.forEach((chain, index) => {
            this.displayRuleChain(chain, index);
        });
    }

    displayRuleChain(chain: RuleChain, index: number): void {
        const ruleDiv = this.containerEl.createDiv();
        ruleDiv.addClass("auto-mover-rule-chain");
        ruleDiv.style.border = "1px solid var(--background-modifier-border)";
        ruleDiv.style.padding = "10px";
        ruleDiv.style.marginBottom = "10px";
        ruleDiv.style.borderRadius = "5px";

        // Header: Name, Active Toggle, Delete, Up/Down
        const headerDiv = ruleDiv.createDiv();
        headerDiv.style.display = "flex";
        headerDiv.style.alignItems = "center";
        headerDiv.style.justifyContent = "space-between";
        headerDiv.style.marginBottom = "10px";

        const nameInput = headerDiv.createEl("input", { type: "text", value: chain.name });
        nameInput.style.fontWeight = "bold";
        nameInput.onchange = async () => {
            chain.name = nameInput.value;
            await this.plugin.saveData(this.plugin.settings);
        };

        const controlsDiv = headerDiv.createDiv();
        controlsDiv.style.display = "flex";
        controlsDiv.style.gap = "5px";

        // Active Toggle
        const activeToggle = controlsDiv.createEl("input", { type: "checkbox" });
        activeToggle.checked = chain.active;
        activeToggle.onclick = async () => {
            chain.active = activeToggle.checked;
            await this.plugin.saveData(this.plugin.settings);
        };

        // Up Button
        const upBtn = controlsDiv.createEl("button", { text: "↑" });
        upBtn.disabled = index === 0;
        upBtn.onclick = async () => {
            this.moveRule(index, -1);
        };

        // Down Button
        const downBtn = controlsDiv.createEl("button", { text: "↓" });
        downBtn.disabled = index === this.plugin.settings.ruleChains.length - 1;
        downBtn.onclick = async () => {
            this.moveRule(index, 1);
        };

        // Delete Button
        const delBtn = controlsDiv.createEl("button", { text: "X" });
        delBtn.style.color = "var(--text-error)";
        delBtn.onclick = async () => {
            this.plugin.settings.ruleChains.splice(index, 1);
            await this.plugin.saveData(this.plugin.settings);
            this.display();
        };

        // Steps Container
        const stepsContainer = ruleDiv.createDiv();
        stepsContainer.style.marginLeft = "20px";
        stepsContainer.style.borderLeft = "2px solid var(--interactive-accent)";
        stepsContainer.style.paddingLeft = "10px";

        chain.steps.forEach((step, stepIndex) => {
            this.displayStep(stepsContainer, step, chain, stepIndex);
        });

        // Add Step Button
        const addStepBtn = stepsContainer.createEl("button", { text: "+ Add Step" });
        addStepBtn.style.marginTop = "5px";
        addStepBtn.onclick = async () => {
            chain.steps.push({
                type: "tag", // default
                pattern: "",
                folder: ""
            });
            await this.plugin.saveData(this.plugin.settings);
            this.display();
        };
    }

    displayStep(container: HTMLElement, step: RuleStep, chain: RuleChain, stepIndex: number): void {
        const stepDiv = container.createDiv();
        stepDiv.style.display = "flex";
        stepDiv.style.gap = "5px";
        stepDiv.style.marginBottom = "5px";
        stepDiv.style.alignItems = "center";

        // Step Type Dropdown
        const typeSelect = stepDiv.createEl("select");
        ["yaml", "tag", "name"].forEach(t => {
            const option = typeSelect.createEl("option", { text: t, value: t });
            option.selected = step.type === t;
        });
        typeSelect.onchange = async () => {
            step.type = typeSelect.value as "yaml" | "tag" | "name";
            // Reset key if not yaml
            if (step.type !== "yaml") delete step.key;
            await this.plugin.saveData(this.plugin.settings);
            this.display(); // re-render to show/hide key input
        };

        // YAML Key Input (only if type is yaml)
        if (step.type === "yaml") {
            const keyInput = stepDiv.createEl("input", { type: "text", value: step.key || "" });
            keyInput.placeholder = "Key (e.g. Project)";
            keyInput.style.width = "100px";
            keyInput.onchange = async () => {
                step.key = keyInput.value;
                await this.plugin.saveData(this.plugin.settings);
            };
        }

        // Pattern Input
        const patternInput = stepDiv.createEl("input", { type: "text", value: step.pattern });
        patternInput.placeholder = "Regex Pattern";
        patternInput.onchange = async () => {
            step.pattern = patternInput.value;
            await this.plugin.saveData(this.plugin.settings);
        };

        // Arrow visual
        stepDiv.createSpan({ text: "→" });

        // Folder Input
        const folderInput = stepDiv.createEl("input", { type: "text", value: step.folder });
        folderInput.placeholder = "Folder (use $1 for capture)";
        folderInput.onchange = async () => {
            step.folder = folderInput.value;
            await this.plugin.saveData(this.plugin.settings);
        };

        // Delete Step
        const delStepBtn = stepDiv.createEl("button", { text: "x" });
        delStepBtn.onclick = async () => {
            chain.steps.splice(stepIndex, 1);
            await this.plugin.saveData(this.plugin.settings);
            this.display();
        };
    }

    async moveRule(index: number, direction: number) {
        const array = this.plugin.settings.ruleChains;
        const item = array[index];
        array.splice(index, 1);
        array.splice(index + direction, 0, item);
        await this.plugin.saveData(this.plugin.settings);
        this.display();
    }
}
