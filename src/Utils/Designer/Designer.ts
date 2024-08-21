import Control from "@/CoreUI/Designer/Control";
import { ControlAlias } from "./Controls";
import { ControlDeclare } from "@/Types/ControlDeclare";
import { Guid } from "../Index";
import store from "@/Vuex/Store";
import * as ts from "typescript";
import { editor } from "@/CoreUI/Editor/EditorPage";
import { GetDesignerBackgroundFile, GetFileById } from "../VirtualFileSystem/Index";

type ControlConfig = ControlDeclare.ControlConfig;
type DataSourceGroupConfig = ControlDeclare.DataSourceGroupConfig;

/**
 * 创建控件通过拖拽事件
 * @param e 拖拽事件
 * @returns 控件配置
 */
export function CreateControlByDragEvent(e: DragEvent): ControlConfig {
  let rect = (e.target as HTMLElement).getBoundingClientRect();
  let x = e.clientX - rect.x;
  let y = e.clientY - rect.y;

  let type = e.dataTransfer.getData("type");

  if (!type) return;
  this.$Store.dispatch("Designer/ClearSelected");

  let config = CreateControlByType.call(this, type);
  config.top = y;
  config.left = x;
  return config;
}

/**
 * 创建控件通过类型
 * @param type 类型
 * @returns 控件配置
 */
export function CreateControlByType(type: string) {
  let control = this.$.appContext.components[type] as any;
  let config = {
    id: Guid.NewGuid(),
    ...Control.GetDefaultConfig(),
    ...control.GetDefaultConfig(),
  };
  return config;
}

/**
 * 通过键值查找控件
 * @param config 控件配置
 * @param key 键
 * @param value 值
 * @param id 控件id
 * @param prevTop 父级控件的top
 * @param prevLeft 父级控件的left
 * @returns 控件配置
 */
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

/**
 * 通过类型查找控件
 * @param config 控件配置
 * @param type 类型
 * @returns 控件配置
 */
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

/**
 * 控件别名
 */
let cacheControlName = {};

/**
 * 自增量命名
 * @param prefix 前缀
 * @param config 控件配置
 */
function IncreaseName(prefix: string, config: ControlConfig) {
  let prevName = cacheControlName[prefix];

  if (!prevName) prevName = `${prefix}_0`;
  let match = prevName.match(/\d+/g) as any[];
  let n = parseInt(match[0]);
  prevName = `${prefix}_${n + 1}`;
  config.name = prevName;
  cacheControlName[prefix] = config.name;
}

/**
 * 创建控件名称
 * @param config 控件配置
 */
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

/**
 * 填充控件名称缓存
 * @param config 控件配置
 */
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

/**
 * 获取字段
 * @param sql sql
 * @returns 字段
 */
export function GetFields(sql: string) {
  const selectRegex = /SELECT(?:\sTOP\s\(\d+\))?\s([\s\S]*?)\sFROM/i;
  const match = sql.match(selectRegex);

  if (match) {
    const fieldList = match[1];
    const fields = [];

    // AS 的字段名
    const asFieldRegex = /\bAS\s+(\w+)\b/gi;
    let asFieldMatch;
    while ((asFieldMatch = asFieldRegex.exec(fieldList)) !== null) {
      const field = asFieldMatch[1];
      if (field == "AS") continue;
      fields.push({ field });
    }

    // 非 AS 的字段名
    const fieldRegex = /(\[?\w+(?:\.\w+)+\]?)(?:\s+as\s+(\w+))?/gi;
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

/**
 * 获取参数
 * @param sql sql
 * @returns 参数
 */
export function GetParams(sql: string) {
  return sql.match(/:\w+/gi)?.map((m) => {
    return {
      name: m.substring(1),
      type: "",
    };
  });
}

/**
 * 获取表
 * @param sql sql
 * @returns 表
 */
export function GetTables(sql: string) {
  let fromRegex = /FROM\s+([\[\]\w\d\.\s,]*?)(?=(?:\s+JOIN|WHERE|GROUP BY|ORDER BY|$))/i;

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

/**
 * 数据源控件附加的类型声明
 */
function DataSourceControlTypeDeclare(config: DataSourceGroupConfig) {
  // 附加的声明
  let declare = ` & {
        /**
         * 获取数据源
         * 
         * @param params 参数
         * 
         * 参数内部除 interpolations 外，请按照对应类型进行传递
         * 
         * 例：GetSource({ name: '张三' })
         * 
         * interpolations 为插值参数，用于替换sql中的插值表达式
         * 
         * 例：GetSource({ name: '张三', interpolations: { grade: '一年级' } })
         */
        GetSource(params: { `;

  // 通过 config.sourceName 获取引用的sql文件
  let sqlFile = GetFileById(config.sourceName);
  let params = sqlFile?.extraData?.params as { name: string; type: string }[];

  if (!!params) {
    for (let i = 0; i < params.length; i++) {
      declare += `${params[i].name}: ${params[i].type};`;
    }
  }
  declare += "interpolations?: { [key: string]: string };";
  declare += " }): any;\r\n\t}";
  return declare;
}

/**
 * 处理控件声明的通用函数
 */
function transformPageClass(transformer: (members: ts.ClassElement[]) => ts.ClassElement[]) {
  let pageCode = store.get.VirtualFileSystem.CurrentFile.content;
  let sourceFile = ts.createSourceFile("page.ts", pageCode, ts.ScriptTarget.ESNext, true);

  function visitor(context: ts.TransformationContext) {
    return function (rootNode: ts.Node): ts.Node {
      function visit(node: ts.Node): ts.Node {
        if (ts.isClassDeclaration(node) && node.name?.text === "Page") {
          const newMembers = transformer(node.members as unknown as ts.ClassElement[]);
          return ts.factory.updateClassDeclaration(
            node,
            node.modifiers,
            node.name,
            node.typeParameters,
            node.heritageClauses,
            newMembers
          );
        }
        return ts.visitEachChild(node, visit, context);
      }
      return ts.visitNode(rootNode, visit);
    };
  }

  const result = ts.transform(sourceFile, [visitor]);
  const printer = ts.createPrinter();

  const transformedSourceFile = result.transformed[0];
  const printedResult = printer.printFile(transformedSourceFile as ts.SourceFile);
  store.get.VirtualFileSystem.CurrentFile.content = printedResult;

  editor.RefreshModel(store.get.VirtualFileSystem.CurrentFile);
}

/**
 * 向设计器代码添加控件声明
 */
export function AddControlDeclareToDesignerCode(config: ControlConfig) {
  transformPageClass((members) => {
    let identifier = `${config.type}Config`;
    if (config.type === "DataSourceGroup") {
      identifier += DataSourceControlTypeDeclare(config as DataSourceGroupConfig);
    }

    // 判断当前是否已经存在相同名称的属性
    if (members.some((m) => m.name?.getText() === config.name)) {
      return;
    }

    const typeRefNode = ts.factory.createTypeReferenceNode(ts.factory.createIdentifier(identifier), undefined);
    const newMember = ts.factory.createPropertyDeclaration(undefined, config.name, undefined, typeRefNode, undefined);
    return [...members, newMember];
  });
}

/**
 * 向设计器代码更新控件声明
 */
export function UpdateControlDeclareToDesignerCode(oldName: string, config: ControlConfig) {
  transformPageClass((members) => {
    let identifier = `${config.type}Config`;
    if (config.type === "DataSourceGroup") {
      identifier += DataSourceControlTypeDeclare(config as DataSourceGroupConfig);
    }
    const typeRefNode = ts.factory.createTypeReferenceNode(ts.factory.createIdentifier(identifier), undefined);
    const newMember = ts.factory.createPropertyDeclaration(undefined, config.name, undefined, typeRefNode, undefined);
    return [...members.filter((m) => m.name?.getText() != oldName), newMember];
  });
}

/**
 * 向设计器代码删除控件声明
 */
export function RemoveControlDeclareToDesignerCode(name: string) {
  transformPageClass((members) => members.filter((m) => m.name?.getText() != name));
}

/**
 * 当前类是否继承自Page
 * @param node 节点
 * @returns 是否继承自Page
 */
function IsClassInheritFromPage(node: ts.Node): boolean {
  if (!ts.isClassDeclaration(node) || !node.heritageClauses) {
    return false;
  }

  return node.heritageClauses.some((clause) => {
    // 检查是否为继承（extends）
    if (clause.token === ts.SyntaxKind.ExtendsKeyword) {
      return clause.types.some((type) => {
        // 这里假设类型为标识符，对于更复杂的情况可能需要额外的处理
        if (ts.isIdentifier(type.expression)) {
          return type.expression.text === "Page";
        }
        return false;
      });
    }
    return false;
  });
}

/**
 * 向设计器代码添加方法
 * @param name 方法名
 * @param params 参数
 */
export function AddMethodToDesignerBackground(name: string, params: { name: string; type: string }[]) {
  let backgroundCode = GetDesignerBackgroundFile().content;
  let sourceFile = ts.createSourceFile("background.ts", backgroundCode, ts.ScriptTarget.ESNext, true);
  const visitor =
    (context: ts.TransformationContext) =>
    (rootNode: ts.Node): ts.Node => {
      function visit(node: ts.Node): ts.Node {
        if (ts.isClassDeclaration(node) && IsClassInheritFromPage(node)) {
          const paramDecls = params.map((p) => {
            const typeRefNode = ts.factory.createTypeReferenceNode(ts.factory.createIdentifier(p.type), undefined);
            return ts.factory.createParameterDeclaration(
              undefined,
              undefined,
              p.name,
              undefined,
              typeRefNode,
              undefined
            );
          });

          const method = ts.factory.createMethodDeclaration(
            undefined,
            undefined,
            name,
            undefined,
            undefined,
            paramDecls,
            undefined,
            ts.factory.createBlock([], true)
          );

          return ts.factory.updateClassDeclaration(
            node,
            node.modifiers,
            node.name,
            node.typeParameters,
            node.heritageClauses,
            [...node.members, method]
          );
        }
        return ts.visitEachChild(node, visit, context);
      }
      return ts.visitNode(rootNode, visit);
    };

  const result = ts.transform(sourceFile, [visitor]);
  const printer = ts.createPrinter();
  const newCode = printer.printFile(result.transformed[0] as ts.SourceFile);
  GetDesignerBackgroundFile().content = newCode;
  editor.RefreshModel(GetDesignerBackgroundFile());
  LocateMethod(name);
}

/**
 * 定位到设计器代码中的方法
 */
export async function LocateMethod(name: string) {
  let backgroundFile = GetDesignerBackgroundFile();
  let backgroundCode = backgroundFile.content;
  let sourceFile = ts.createSourceFile("background.ts", backgroundCode, ts.ScriptTarget.ESNext, true);
  let methodNode: ts.MethodDeclaration;
  // 递归遍历所有节点，找到方法节点
  function visit(node: ts.Node) {
    if (ts.isMethodDeclaration(node) && node.name.getText() === name) {
      methodNode = node;
    }
    ts.forEachChild(node, visit);
  }
  ts.forEachChild(sourceFile, visit);

  if (methodNode) {
    await store.dispatch("VirtualFileSystem/SelectFile", backgroundFile);
    setTimeout(() => {
      let pos = editor.editor.getModel().getPositionAt(methodNode.getStart());

      editor.editor.focus();
      editor.editor.setPosition(pos);
      editor.editor.revealPositionInCenter(pos);
    }, 0);
  }
}
