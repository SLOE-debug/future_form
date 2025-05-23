export {};

declare global {
  let css: any;
  let electronAPI: any;
  interface Window {
    css: any;
    importAsync: Function;
    electronAPI: any;
  }

  interface Event {
    activity: boolean;
  }

  interface Map<K, V> {
    getOrCreateKey(object: K, type?: string): V;
  }
}
