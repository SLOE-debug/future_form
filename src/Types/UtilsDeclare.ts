import { ControlDeclare } from "./ControlDeclare";

type ParamItem = ControlDeclare.ParamItem;

export namespace UtilsDeclare {
  export type Coord = {
    x: number;
    y: number;
  };

  export type EventHandlers = {
    [x: string]: Function;
  };

  export type Source = {
    name: string;
    sql: string;
    table: string;
    fields: string[];
    primaryFields: string[];
    params: ParamItem[];
  };
}
