import { Store } from "vuex";
import { RootState } from "./Vuex/Store";
import VirtualFileSystem from "./Apis/VirtualFileSystem";

type Response = {
  code: number;
  data: any;
};

type Api<T> = {
  [K in keyof T]: (data?: any, extraData?: any) => Promise<Response>;
};

declare module "@vue/runtime-core" {
  interface ComponentCustomProperties {
    $Store: Store<RootState>;
    $Controls: string[];
    $Api: Api<typeof VirtualFileSystem & any>;
    $PaleData: any;
  }
}

export {};
