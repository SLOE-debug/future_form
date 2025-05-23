async function loadRuntimeUtilities(): Promise<void> {
  try {
    const { BaseWindow, GetCaseNumberSearchToolbar } = await import("./Runtime");

    window.BaseWindow = BaseWindow;
    (window as any).GetCaseNumberSearchToolbar = GetCaseNumberSearchToolbar;

    return Promise.resolve();
  } catch (error) {
    console.error("Failed to load runtime utilities:", error);
    return Promise.reject(error);
  }
}

/**
 * @description: 加载运行时工具
 */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    loadRuntimeUtilities();
  });
} else {
  loadRuntimeUtilities();
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
export function DeepEquals(obj1: any, obj2: any): boolean {
  // 快速相等检查
  if (obj1 === obj2) return true;

  // null 检查
  if (obj1 == null || obj2 == null) return false;

  // 类型检查
  if (typeof obj1 !== "object" || typeof obj2 !== "object") return false;

  // 数组比较
  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    return obj1.length === obj2.length && obj1.every((item, index) => DeepEquals(item, obj2[index]));
  }

  // 获取非函数属性键
  const keys1 = Object.keys(obj1 as object).filter((k) => typeof (obj1 as any)[k] !== "function");
  const keys2 = Object.keys(obj2 as object).filter((k) => typeof (obj2 as any)[k] !== "function");

  // 键数量比较
  if (keys1.length !== keys2.length) return false;

  // 递归比较所有键值
  return keys1.every((key) => keys2.includes(key) && DeepEquals((obj1 as any)[key], (obj2 as any)[key]));
}

/**
 * 获取或者创建 localStorage 中的对象
 */
export function GetOrCreateFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const value = localStorage.getItem(key);
    if (!value) {
      const serializedValue = JSON.stringify(defaultValue);
      localStorage.setItem(key, serializedValue);
      return defaultValue;
    }
    return JSON.parse(value) as T;
  } catch (error) {
    console.error(`Error accessing localStorage for key "${key}":`, error);
    return defaultValue; // 在出错时返回默认值而不是失败
  }
}

/**
 * 数据源参数前缀
 */
export const dataSourceParamPrefix = "@";

/**
 * 函数结果缓存
 */
const MemoizedResultCache: Map<string, any> = new Map();

/**
 * 缓存方法结果装饰器 - 使用函数名和参数作为缓存键
 * 对相同参数的重复调用将返回缓存的结果而不重新执行函数
 * @example
 * // 使用方式:
 * class Example {
 *   @MemoizeResult()
 *   expensiveCalculation(a: number, b: number): number {
 *     console.log('Computing...');
 *     return a + b;
 *   }
 * }
 */
export function MemoizeResult(target: any, key: string, descriptor: PropertyDescriptor) {
  let cacheKey = null;
  let method = descriptor.value;
  descriptor.value = function (...args: any[]) {
    if (!cacheKey) {
      cacheKey = Guid.NewGuid();
    }

    let result = MemoizedResultCache.get(cacheKey);
    if (result) return result;
    result = method.apply(this, args);
    // 如果 result 是一个 Promise 对象，则在 Promise 完成后缓存结果
    if (result && typeof result.then === "function") {
      return result.then((res: any) => {
        MemoizedResultCache.set(cacheKey, res);
        return res;
      });
    }
    MemoizedResultCache.set(cacheKey, result);
    return result;
  };
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
