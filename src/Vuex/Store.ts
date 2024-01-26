import { App } from "vue";
import { createStore, Store } from "vuex";
import FileSytemModule, { FileSytemState } from "./Modules/VirtualFileSystem";

export type RootState = FileSytemState;
const store: Store<RootState> = createStore({
  modules: {
    FileSytemModule: FileSytemModule,
  },
});

export default store;

export const vuex = {
  install(app: App<Element>) {
    Object.defineProperty(store, "get", {
      get() {
        return store.getters;
      },
    });

    app.config.globalProperties.$Store = store;

    if (sessionStorage.Token) store.dispatch("SetToken", sessionStorage.Token);
    if (sessionStorage.System) store.dispatch("SetSystem", sessionStorage.System);
  },
};
