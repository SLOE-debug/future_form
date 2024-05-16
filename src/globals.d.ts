import { BaseWindow } from "./Utils/Designer/Form";

export {};

declare global {
  let css: any;
  interface Window {
    css: any;
    BaseWindow: typeof BaseWindow;
    importAsync: Function;
  }

  interface Event {
    activity: boolean;
  }

  interface Map<K, V> {
    getOrCreateKey(object: K, type?: string): V;
  }
}
