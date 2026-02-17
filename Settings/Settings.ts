import type { ExclusionRule } from "Models/ExclusionRule";
import type { RuleChain } from "Models/RuleChain";
import type AutoMoverPlugin from "main";

export interface AutoMoverSettings {
  moveOnOpen: boolean;
  exclusionRules: ExclusionRule[];
  ruleChains: RuleChain[];
  automaticMoving: boolean;
  timer: number | null; // in miliseconds
  collapseSections: {
    tutorial: boolean;
    exclusionRules: boolean;
  };
}

export const DEFAULT_SETTINGS: AutoMoverSettings = {
  moveOnOpen: true,
  exclusionRules: [],
  ruleChains: [],
  automaticMoving: false,
  timer: null,
  collapseSections: {
    tutorial: false,
    exclusionRules: false,
  },
};

function loadSettings(AutoMoverPlugin: AutoMoverPlugin): Partial<AutoMoverSettings> {
  return Object.assign({}, DEFAULT_SETTINGS, AutoMoverPlugin.loadData());
}
