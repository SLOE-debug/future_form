/**
 * 对比两个对象的差异
 * @param nv 新值
 * @param ov 旧值
 * @returns 差异数组
 */
export function diffObjects<T extends Record<string, any>>(nv: T, ov: T): string[] {
  if (!nv || !ov) {
    return ["One of the objects is null or undefined"];
  }

  const differences: string[] = [];

  // 获取两个对象的所有键
  const allKeys = new Set([...Object.keys(nv), ...Object.keys(ov)]);

  allKeys.forEach((key) => {
    // 检查键是否在两个对象中都存在，并且值是否不同
    if (Object.prototype.hasOwnProperty.call(nv, key) && Object.prototype.hasOwnProperty.call(ov, key)) {
      if (JSON.stringify(nv[key]) !== JSON.stringify(ov[key])) {
        differences.push(`${key} 属性有变更：${JSON.stringify(nv[key])}, ${JSON.stringify(ov[key])}`);
      }
    }
    // 检查键是否只在新对象中存在
    else if (Object.prototype.hasOwnProperty.call(nv, key)) {
      differences.push(`新增 ${key} 属性：${JSON.stringify(nv[key])}`);
    }
    // 检查键是否只在旧对象中存在
    else if (Object.prototype.hasOwnProperty.call(ov, key)) {
      differences.push(`删除 ${key} 属性：${JSON.stringify(ov[key])}`);
    }
  });

  return differences;
}

/**
 * 打印对象的差异
 * @param nv 新值
 * @param ov 旧值
 */
export function logDiff<T extends Record<string, any>>(nv: T, ov: T): void {
  const diffs = diffObjects(nv, ov);

  if (diffs.length === 0) {
    console.log("对象没有差异");
    return;
  }

  console.log("对象差异:");
  diffs.forEach((diff) => {
    console.log(`- ${diff}`);
  });
}
