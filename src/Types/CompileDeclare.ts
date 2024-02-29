export namespace CompileDeclare {
  export type CompiledFile = {
    id: string;
    path: string;
    content: string;
    refs: { refPath: string; absPath: string }[];
  };
}
