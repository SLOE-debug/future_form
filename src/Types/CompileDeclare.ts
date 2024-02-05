export namespace CompileDeclare {
  export type CompiledFile = {
    name: string;
    content: string;
    refs: { refPath: string; absPath: string }[];
  };
}
