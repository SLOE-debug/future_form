export namespace CompileDeclare {
  export type CompiledFile = {
    id: string;
    path: string;
    content: string;
    extraData: any;
    refs: { refPath: string; absPath: string }[];
  };
}
