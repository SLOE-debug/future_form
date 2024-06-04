export namespace EventDeclare {
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
