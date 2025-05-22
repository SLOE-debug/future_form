import DataSourceGroupControl from "@/Controls/DataSourceGroupControl";
import { reactive, watch } from "vue";
import { GetOrCreateFromStorage } from "../BasicUtils";
import { ControlDeclare } from "@/Types";

type GlobalVariate = ControlDeclare.GlobalVariate;

/**
 * 全局变量
 */
export const globalVariate: GlobalVariate = reactive({ ref_no: "" });

// 如果有 historySelectRefNo 的历史案号，则赋值给全局变量
let historySelectRefNos = GetOrCreateFromStorage("historySelectRefNo", []);
if (historySelectRefNos.length) {
  globalVariate.ref_no = historySelectRefNos[0].ref_no;
}

/**
 * 数据双向绑定
 * @param obj1 对象1
 * @param prop1 属性1
 * @param obj2 对象2
 * @param prop2 属性2
 */
export function TwoWayBinding(obj1, prop1, obj2, prop2) {
  const stopWatch1 = watch(
    () => obj1[prop1],
    (value) => {
      obj2[prop2] = value;
    }
  );
  const stopWatch2 = watch(
    () => obj2[prop2],
    (value, oldValue) => {
      PropertyChange.call(this, obj2, prop2, value, oldValue);
      obj1[prop1] = value;
    }
  );

  return () => {
    stopWatch1();
    stopWatch2();
  };
}

/**
 * 属性值修改时，触发事件
 */
export function PropertyChange(m, p, nv, ov) {
  const ctor = this.$options.__vfdConstructor;
  if (ctor === DataSourceGroupControl) (this as DataSourceGroupControl).UpdateDiffData(m, p, nv, ov);
}
