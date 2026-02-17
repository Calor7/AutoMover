export interface RuleStep {
    type: "yaml" | "tag" | "name";
    /**
     * The yaml key to use for matching if type is yaml
     */
    key?: string;
    /**
     * The pattern to match against
     */
    pattern: string;
    /**
     * The folder to append to the path
     */
    folder: string;
    /**
     * If true, the step will be skipped if it doesn't match, instead of failing the chain
     */
    optional?: boolean;
}

