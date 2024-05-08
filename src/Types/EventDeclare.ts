export namespace EventDeclare {
  // type DisplayFieldConfig = {
  //   field: string;
  //   width?: number;
  // };

  // export type BarKit = {
  //   type: "IconButton";
  //   icon: string;
  //   title: string;
  //   active: boolean;
  //   disabled: boolean;
  // };

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
