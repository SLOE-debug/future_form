import { Store } from "vuex";
import { RootState } from "./Vuex/Store";
import VirtualFileSystem from "./Apis/VirtualFileSystem";
import { Api } from "./Plugins/Api/ExtendApi";
import DataSource from "./Apis/DataSource";

declare module "@vue/runtime-core" {
  interface ComponentCustomProperties {
    $Store: Store<RootState>;
    $Controls: string[];
    $Api: Api<typeof VirtualFileSystem & typeof DataSource>;
    $PaleData: any;
  }
}

export {};
