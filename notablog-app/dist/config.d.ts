import { noteablog-appStarterConfig } from './types';
export declare class Config {
    private configPath;
    private configObj;
    constructor(configPath: string);
    get<T extends keyof noteablog-appStarterConfig>(key: T): noteablog-appStarterConfig[T];
    set<T extends keyof noteablog-appStarterConfig>(key: T, data: noteablog-appStarterConfig[T]): void;
    /** Sync changes to file. */
    sync(): Promise<void>;
}
//# sourceMappingURL=config.d.ts.map