import type { App, TFile, TagCache } from "obsidian";
import type { RuleChain } from "Models/RuleChain";
import type { RuleStep } from "Models/RuleStep";

class ChainMatcherUtil {
    private static instance: ChainMatcherUtil;
    private regexCache: Map<string, RegExp> = new Map();

    private constructor() { }

    public static getInstance(): ChainMatcherUtil {
        if (!ChainMatcherUtil.instance) {
            ChainMatcherUtil.instance = new ChainMatcherUtil();
        }
        return ChainMatcherUtil.instance;
    }

    /**
     * Evaluates a list of RuleChains against a file.
     * Returns the destination path from the first matching chain.
     */
    public getDestinationPath(file: TFile, app: App, ruleChains: RuleChain[]): string | null {
        for (const chain of ruleChains) {
            if (!chain.active) continue;
            const path = this.evaluateChain(file, app, chain);
            if (path) return path;
        }
        return null;
    }

    /**
     * Evaluates a single chain. Returns the constructed path if all required steps match.
     * If a step fails, returns null.
     */
    private evaluateChain(file: TFile, app: App, chain: RuleChain): string | null {
        let currentPath = "";

        // Cache frontmatter/tags once per file check
        const cache = app.metadataCache.getFileCache(file);
        const frontmatter = cache?.frontmatter;
        const tags = cache?.tags;

        for (const step of chain.steps) {
            const stepResult = this.evaluateStep(file, frontmatter, tags, step);

            // If a step fails, the whole chain fails (for now, assuming AND logic)
            if (stepResult === null) {
                return null;
            }

            // Append the result to the path
            // Ensure we handle slashes correctly
            if (stepResult.length > 0) {
                if (currentPath.length > 0 && !currentPath.endsWith("/")) {
                    currentPath += "/";
                }
                currentPath += stepResult;
            }
        }

        return currentPath;
    }

    private evaluateStep(file: TFile, frontmatter: any, tags: TagCache[] | undefined, step: RuleStep): string | null {
        const regex = this.getCompiledRegex(step.pattern);
        let matchValue: string | null = null;
        let matches: RegExpMatchArray | null = null;

        if (step.type === "name") {
            matchValue = file.name;
            matches = matchValue.match(regex);
        } else if (step.type === "tag") {
            if (!tags) return null;
            for (const tag of tags) {
                const m = tag.tag.match(regex);
                if (m) {
                    matches = m;
                    matchValue = tag.tag; // Keep track of which tag matched?
                    break;
                }
            }
        } else if (step.type === "yaml") {
            if (!frontmatter || !step.key) return null;
            // Check capital explanations?
            const val = frontmatter[step.key];
            if (val) {
                matchValue = String(val);
                matches = matchValue.match(regex);
            }
        }

        if (!matches) {
            return null;
        }

        // Construct the folder segment using the matches
        let folderSegment = step.folder;
        for (let i = 1; i < matches.length; i++) {
            folderSegment = folderSegment.replace(`$${i}`, matches[i] || "");
        }

        return folderSegment;
    }

    private getCompiledRegex(pattern: string): RegExp {
        if (!this.regexCache.has(pattern)) {
            try {
                this.regexCache.set(pattern, new RegExp(pattern));
            } catch (e) {
                console.error(`Invalid regex: ${pattern}`, e);
                // Return a regex that matches nothing to prevent crashes
                return new RegExp("a^");
            }
        }
        return this.regexCache.get(pattern)!;
    }
}

const chainMatcherUtil = ChainMatcherUtil.getInstance();
export default chainMatcherUtil;
