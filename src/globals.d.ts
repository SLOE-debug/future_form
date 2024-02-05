export {};

declare global {
  let css: any;
  interface Window {
    css: any;
  }

  interface Event {
    activity: boolean;
  }
  
  interface Map<K, V> {
    getOrCreateKey(object: K, type?: string): V;
  }
}
