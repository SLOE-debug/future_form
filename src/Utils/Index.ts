import { UtilsDeclare } from "@/Types/UtilsDeclare";

type EventHandlers = UtilsDeclare.EventHandlers;

export function RegisterEvent(this: any, eventHandlers: EventHandlers, unmount: boolean = false) {
  for (const type in eventHandlers) {
    this[unmount ? "removeEventListener" : "addEventListener"](type, eventHandlers[type]);
  }
}

export function BindEventContext(eventHandlers: EventHandlers, context: any) {
  for (const type in eventHandlers) {
    eventHandlers[type] = eventHandlers[type].bind(context);
  }
}

export function CapitalizeFirstLetter(str: string) {
  if (!str || !str.length) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function GetLocalStorage(key: string) {
  let json = localStorage.getItem(key);
  return json ? JSON.parse(json) : null;
}

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
