export namespace CompileDeclare {
  export type CompiledFile = {
    fileId: string;
    fullPath: string;
    content: string;
    extraData: any;
    refs: {
      refPath: string; // 引用文件的路径
      absPath: string; // 引用文件的绝对路径
    }[];
  };
}
