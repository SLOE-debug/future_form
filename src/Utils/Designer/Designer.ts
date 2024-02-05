import Control from "@/CoreUI/Designer/Control";
import { ControlAlias } from "./Controls";
import { ControlDeclare } from "@/Types/ControlDeclare";
import { Guid } from "../Index";
import store from "@/Vuex/Store";

type ControlConfig = ControlDeclare.ControlConfig;

export function CreateControlByDragEvent(e: DragEvent): ControlConfig {
  let rect = (e.target as HTMLElement).getBoundingClientRect();
  let x = e.clientX - rect.x;
  let y = e.clientY - rect.y;

  let type = e.dataTransfer.getData("type");

  if (!type) return;
  this.$Store.dispatch("ClearSelected");

  let config = CreateControlByType.call(this, type);
  config.top = y;
  config.left = x;
  return config;
}

export function CreateControlByType(type: string) {
  let control = this.$.appContext.components[type] as any;
  let config = {
    id: Guid.NewGuid(),
    ...Control.GetDefaultConfig(),
    ...control.GetDefaultConfig(),
  };
  return config;
}

export function FindControlsByKeyValue(
  config: ControlConfig,
  key: string,
  value: any,
  id: string = "",
  prevTop: number = 0,
  prevLeft: number = 0
): ControlConfig {
  if (config.$children && config.$children.length > 0) {
    for (let c of config.$children) {
      if (c[key] == value) {
        if (!id) return c;
        if (c.id != id) return c;
        return undefined;
      } else {
        let config = FindControlsByKeyValue(c, key, value, id, prevTop + c.top, prevLeft + c.left);
        if (config) return config;
      }
    }
  }
}

export function FindControlsByType(config: ControlConfig, type = undefined): ControlConfig[] {
  let results = [];

  if (config.$children && config.$children.length > 0) {
    for (const child of config.$children) {
      if (child.type === type || type == undefined) {
        results.push(child);
      }

      results = results.concat(FindControlsByType(child, type));
    }
  }

  return results;
}

let cacheControlName = {};

function IncreaseName(prefix: string, config: ControlConfig) {
  let prevName = cacheControlName[prefix];

  if (!prevName) prevName = `${prefix}_0`;
  let match = prevName.match(/\d+/g) as any[];
  let n = parseInt(match[0]);
  prevName = `${prefix}_${n + 1}`;
  config.name = prevName;
  cacheControlName[prefix] = config.name;
}

export function CreateControlName(config: ControlConfig) {
  config.id = Guid.NewGuid();
  if (FindControlsByKeyValue(store.get.Designer.FormConfig, "name", config.name)) {
    let name = config.name;
    delete config.name;
    let prefix = name.replace(/_\d+/g, "");
    if (!/_\d+/.test(name) && !Object.prototype.hasOwnProperty.call(ControlAlias, prefix)) {
      IncreaseName(prefix, config);
    }
  }
  if (!config.name) IncreaseName(ControlAlias[config.type], config);

  config.$children?.forEach((c) => {
    CreateControlName(c);
    c.fromContainer = config.name;
  });
}

export function FillControlNameCache(config: ControlConfig) {
  if (config.type == "Form") cacheControlName = {};
  config.$children.forEach((c) => {
    let match = c.name.match(/\d+/g) as any[];
    if (match) {
      let prevName = cacheControlName[ControlAlias[c.type]];
      let n = parseInt(match[0]);
      if (!prevName) cacheControlName[ControlAlias[c.type]] = `${ControlAlias[c.type]}_${n}`;
      else {
        match = prevName.match(/\d+/g) as any[];
        let prevNum = parseInt(match[0]);
        if (n > prevNum) cacheControlName[ControlAlias[c.type]] = `${ControlAlias[c.type]}_${n}`;
      }
    }
    if (c.$children?.length) FillControlNameCache(c);
  });
}

export function CloneStruct<T>(obj: T): T {
  if (Array.isArray(obj)) {
    let arr = [];
    for (const m of obj) {
      arr.push(CloneStruct(m));
    }
    return arr as T;
  } else if (typeof obj == "object") {
    let m = {} as T;
    for (const k in obj) {
      if (obj[k] == null) {
        m[k] = null;
      } else if (typeof obj[k] == "object") {
        m[k] = CloneStruct(obj[k]);
      } else {
        m[k] = obj[k];
      }
    }
    return m;
  } else {
    return obj;
  }
}

export function GetFields(sql: string) {
  const selectRegex = /SELECT(?:\sTOP\s\(\d+\))?\s([\s\S]*?)\sFROM/i;
  const match = sql.match(selectRegex);

  if (match) {
    const fieldList = match[1];
    const fields = [];

    const fieldRegex = /(\[?\w+(?:\.\w+)?\]?)(?:\s+as\s+(\w+))?/gi;
    let fieldMatch;

    while ((fieldMatch = fieldRegex.exec(fieldList)) !== null) {
      const field = fieldMatch[2] || fieldMatch[1];
      if (field == "AS") continue;
      fields.push({ field });
    }

    return fields;
  } else {
    return null;
  }
}

export function GetParams(sql: string) {
  return sql.match(/:\w+/gi)?.map((m) => {
    return {
      name: m.substring(1),
      type: "",
    };
  });
}

export function GetTables(sql: string) {
  let fromRegex = /FROM\s+([\[\]\w\d\.\s,]+)(?=(?:\s+JOIN|WHERE|GROUP BY|ORDER BY|$))/i;

  let match = sql.match(fromRegex);
  if (match && match[1]) {
    let tableNames = match[1].split(",").map((tableName) => tableName.trim());

    let joinRegex = /\bJOIN\s+([\[\]\w\d\.]+)/gi;
    let joinMatches = sql.match(joinRegex);
    if (joinMatches) {
      joinMatches.forEach((joinMatch) => {
        let tableName = joinMatch.split(/\s+/)[1];
        tableNames.push(tableName);
      });
    }

    return tableNames;
  } else {
    return null;
  }
}
