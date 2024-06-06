/**
 * 普通数据源的全局缓存
 */
const dataSourceCache: Map<string, Promise<any>> = new Map();

/**
 * svg 组件的全局缓存
 */
const svgCache: Map<string, Promise<any>> = new Map();

/**
 * 全局缓存
 */
export const globalCache = {
  dataSourceCache,
  svgCache,
};
