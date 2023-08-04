export interface RenderStrategy {
    render: (templateName: string, data: Record<string, unknown>) => string;
}
export declare class EJSStrategy implements RenderStrategy {
    private templateProvider;
    constructor(templateDir: string);
    render(templateName: string, data: Record<string, unknown>): string;
}
export declare class SqrlStrategy implements RenderStrategy {
    private templateProvider;
    constructor(templateDir: string);
    render(templateName: string, data: Record<string, unknown>): string;
}
export declare class Renderer {
    private strategy;
    constructor(strategy: RenderStrategy);
    render(templateName: string, data: Record<string, unknown>): string;
}
//# sourceMappingURL=renderer.d.ts.map