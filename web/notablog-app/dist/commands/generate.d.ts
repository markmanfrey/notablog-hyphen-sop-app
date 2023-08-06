declare type GenerateOptions = {
    /** Concurrency for Notion page downloading and rendering. */
    concurrency?: number;
    /** Whether to print more messages for debugging. */
    verbose?: boolean;
    /** Do not check cache and fetch all pages from Notion. */
    ignoreCache?: boolean;
};
/** Generate a noteablog-app static site. */
export declare function generate(workDir: string, opts?: GenerateOptions): Promise<number>;
export {};
//# sourceMappingURL=generate.d.ts.map