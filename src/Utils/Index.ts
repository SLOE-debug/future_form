import { UtilsDeclare } from "@/Types/UtilsDeclare";
import { BaseWindow } from "./Designer/Form";

type EventHandlers = UtilsDeclare.EventHandlers;

// 窗体基类
window.BaseWindow = BaseWindow;

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

/**
 * 首字母大写
 * @param str 字符串
 * @returns 首字母大写的字符串
 */
export function CapitalizeFirstLetter(str: string) {
  if (!str || !str.length) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
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

/**
 * 克隆对象
 * @param obj 对象
 * @returns 新对象
 */
export function CloneStruct<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => CloneStruct(item)) as unknown as T;
  }

  const clonedObj = {} as T;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      clonedObj[key] = CloneStruct(obj[key]);
    }
  }

  return clonedObj;
}

/**
 * 对象之间深度对比是否相等
 */
export function DeepCompareObject(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;
  if (obj1 == null || obj2 == null) return false;
  if (typeof obj1 !== "object" || typeof obj2 !== "object") return false;

  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    if (obj1.length !== obj2.length) return false;
    for (let i = 0; i < obj1.length; i++) {
      if (!DeepCompareObject(obj1[i], obj2[i])) return false;
    }
    return true;
  }

  const keys1 = Object.keys(obj1).filter((k) => {
    // 过滤 Function
    return typeof obj1[k] !== "function";
  });
  const keys2 = Object.keys(obj2).filter((k) => {
    // 过滤 Function
    return typeof obj2[k] !== "function";
  });
  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (!keys2.includes(key)) return false;

    if (!DeepCompareObject(obj1[key], obj2[key])) return false;
  }

  return true;
}

/**
 * 获取或者创建 localStorage 中的对象
 */
export function GetOrCreateLocalStorageObject<T>(key: string, defaultValue: T): T {
  let value = localStorage.getItem(key);
  if (!value) {
    value = JSON.stringify(defaultValue);
    localStorage.setItem(key, value);
  }
  return JSON.parse(value);
}

/**
 * 数据源参数前缀
 */
export const sourceArgsPrefix = "@";

/**
 * 函数结果缓存
 */
const functionResultCache: Map<string, any> = new Map();

/**
 * 函数结果缓存装饰器
 */
export function CacheFunction<T>(func: T): T {
  let id = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
  return function (...args: any[]) {
    let result = functionResultCache.get(id);
    if (result) return result;
    result = (func as Function).apply(this, args);
    functionResultCache.set(id, result);
    return result;
  } as T;
}

/**
 * 防抖装饰器
 */
export function Debounce(wait: number) {
  return function (target: any, key: string, descriptor: PropertyDescriptor) {
    let timer: any;
    let method = descriptor.value;
    descriptor.value = function (...args: any[]) {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        method.apply(this, args);
      }, wait);
    };
  };
}