import { Store } from "vuex";
import { RootState } from "./Vuex/Store";

declare module "@vue/runtime-core" {
  interface ComponentCustomProperties {
    $Store: Store<RootState>;
  }
}

export {};
