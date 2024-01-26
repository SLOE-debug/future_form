import { Store } from "vuex";

declare module "vuex" {
  interface Store<S> {
    get: S;
  }
}
