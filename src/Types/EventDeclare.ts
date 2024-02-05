export namespace EventDeclare {
  type DisplayFieldConfig = {
    field: string;
    width?: number;
  };

  export type BarKit = {
    type: "IconButton" | "Input" | "select";
    bindObject?: object;
    bindField?: string;
    width?: number;
    placeholder?: string;
    displayFields?: DisplayFieldConfig[];
    options?: { label: string; value: string; obj: any }[];

    icon?: string;
    title?: string;
    active?: boolean;
    disabled?: boolean;
    readonlyDisabled?: boolean;

    on?: {
      [x: string]: Function;
    };

    attr?: {
      fetchSuggestions?: Function;
      select?: Function;
      [x: string]: any;
    };
  };

  export type CellEventHandlerParams = {
    rowIndex: number;
    rowData: any;
    cellKey: string;
    cellData: any;
  };

  export type RowEventHandlerParams = {
    rowIndex: number;
    rowData: any;
  };
}
