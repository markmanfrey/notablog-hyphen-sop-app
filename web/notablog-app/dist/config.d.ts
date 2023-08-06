import { noteablogappStarterConfig } from './types';

export declare class Config {
    private configPath;
    private configObj;
    constructor(configPath: string);
    get<T extends keyof noteablogappStarterConfig>(key: T): noteablogappStarterConfig[T];
    set<T extends keyof noteablogappStarterConfig>(key: T, data: noteablogappStarterConfig[T]): void;
    /** Sync changes to file. */
    sync(): Promise<void>;
}
//# sourceMappingURL=config.d.ts.map