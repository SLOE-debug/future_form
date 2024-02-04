export const Guid = {
  NewGuid: function () {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  },
};

// 防抖装饰器
export function Debounce(wait: number) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    let timeout: NodeJS.Timeout;
    const original = descriptor.value;
    descriptor.value = function (...args: any[]) {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        original.apply(this, args);
      }, wait);
    };
  };
}
