import { Store } from "vuex";
import { RootState } from "./Vuex/Store";
import VirtualFileSystem from "./Apis/VirtualFileSystem";
import { Api } from "./Plugins/Api/ExtendApi";
import DataSource from "./Apis/DataSource";
import Expression from "./Apis/Expression";

declare module "vue" {
  interface ComponentCustomProperties {
    $Store: Store<RootState>;
    $Controls: string[];
    $Api: Api<typeof VirtualFileSystem & typeof DataSource & typeof Expression>;
    $PaleData: any;
  }
}

export {};
