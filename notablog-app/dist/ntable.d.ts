interface Property {
    id: string;
    type: string;
    records: Map<Record, Cell>;
}
interface Record {
    id: string;
    propertyCellMap: Map<Property, Cell>;
}
interface Cell {
    property: Property;
    record: Record;
}
interface Table {
    id: string;
    properties: Property[];
    records: Record[];
}
export declare enum NPropertyType {
    Text = "text",
    Checkbox = "checkbox",
    Select = "select",
    MultiSelect = "multi_select",
    Date = "date"
}
export declare type NSelectOption = {
    id: string;
    color: Notion.Collection.ColumnPropertyOptionColor;
    value: string;
};
export declare class NProperty implements Property {
    id: string;
    type: string;
    records: Map<NRecord, NCell>;
    name: string;
    constructor(id: string, rawProperty: Notion.Collection.ColumnProperty);
}
export declare class NTextProperty extends NProperty {
    type: NPropertyType.Text;
    constructor(id: string, rawProperty: Notion.Collection.ColumnProperty);
}
export declare class NCheckboxProperty extends NProperty {
    type: NPropertyType.Checkbox;
    constructor(id: string, rawProperty: Notion.Collection.ColumnProperty);
}
export declare class NSelectProperty extends NProperty {
    type: NPropertyType.Select;
    options: NSelectOption[];
    constructor(id: string, rawProperty: Notion.Collection.ColumnProperty);
}
export declare class NMultiSelectProperty extends NProperty {
    type: NPropertyType.MultiSelect;
    options: NSelectOption[];
    constructor(id: string, rawProperty: Notion.Collection.ColumnProperty);
}
export declare class NDateTimeProperty extends NProperty {
    type: NPropertyType.Date;
    constructor(id: string, rawProperty: Notion.Collection.ColumnProperty);
}
declare type NPropertyUnion = NTextProperty | NCheckboxProperty | NSelectProperty | NMultiSelectProperty | NDateTimeProperty;
declare type NCellOf<T extends NProperty> = T extends NTextProperty ? NTextCell : T extends NCheckboxProperty ? NCheckboxCell : T extends NSelectProperty ? NSelectCell : T extends NMultiSelectProperty ? NMultiSelectCell : T extends NDateTimeProperty ? NDateTimeCell : NCell;
interface NPropertyCellMap extends Map<NProperty, NCell> {
    /** Call `get` with X type of `NProperty` returns X type of `NCell`. */
    get: <T extends NProperty>(property: T) => NCellOf<T> | undefined;
}
interface NRecord extends Record {
    id: string;
    propertyCellMap: NPropertyCellMap;
    uri: NAST.URI;
    title: NAST.SemanticString[];
    icon?: NAST.Emoji | NAST.PublicUrl;
    cover?: NAST.PublicUrl;
    coverPosition: number;
    fullWidth: boolean;
    createdTime: NAST.TimestampNumber;
    lastEditedTime: NAST.TimestampNumber;
}
declare class NRecord implements NRecord {
    constructor(rawPage: NAST.Page);
}
declare class NCell implements Cell {
    property: NProperty;
    record: NRecord;
    constructor(property: NProperty, record: NRecord);
}
export declare class NTextCell extends NCell {
    value: NAST.SemanticString[];
    constructor(property: NTextProperty, record: NRecord, rawValue: NAST.SemanticString[]);
}
export declare class NCheckboxCell extends NCell {
    value: boolean;
    constructor(property: NCheckboxProperty, record: NRecord, rawValue: NAST.SemanticString[]);
}
export declare class NSelectCell extends NCell {
    value: NSelectOption | undefined;
    constructor(property: NSelectProperty, record: NRecord, rawValue: NAST.SemanticString[]);
}
export declare class NMultiSelectCell extends NCell {
    value: NSelectOption[];
    constructor(property: NMultiSelectProperty, record: NRecord, rawValue: NAST.SemanticString[]);
}
export declare class NDateTimeCell extends NCell {
    value: NAST.DateTime | undefined;
    constructor(property: NDateTimeProperty, record: NRecord, rawValue: NAST.SemanticString[]);
}
export declare class NTable implements Table {
    id: string;
    properties: NPropertyUnion[];
    records: NRecord[];
    constructor(rawTable: NAST.Collection);
    /** Print the table structure so you can see what it looks like. */
    peek(): void;
}
export {};
//# sourceMappingURL=ntable.d.ts.map