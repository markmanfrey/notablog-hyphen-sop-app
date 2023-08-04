import { createAgent } from 'notionapi-agent-token';
import { Config } from './config';
import { SiteContext } from './types';
/** Extract interested data for blog generation from a Notion table. */
export declare function parseTable(collectionPageURL: string, notionAgent: ReturnType<typeof createAgent>, config: Config): Promise<SiteContext>;
//# sourceMappingURL=parseTable.d.ts.map