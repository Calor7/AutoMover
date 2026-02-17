import type { RuleStep } from "./RuleStep";

export class RuleChain {
    name: string;
    steps: RuleStep[];
    active: boolean;
    continueOnFailure: boolean;

    constructor(name: string = "New Rule", steps: RuleStep[] = [], active: boolean = true, continueOnFailure: boolean = true) {
        this.name = name;
        this.steps = steps;
        this.active = active;
        this.continueOnFailure = continueOnFailure;
    }

}
