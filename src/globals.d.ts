import { BaseWindow } from "./Utils/Designer/Form";

export {};

declare global {
  let css: any;
  interface Window {
    css: any;
    BaseWindow: typeof BaseWindow;
  }

  interface Event {
    activity: boolean;
  }

  interface Map<K, V> {
    getOrCreateKey(object: K, type?: string): V;
  }
}
