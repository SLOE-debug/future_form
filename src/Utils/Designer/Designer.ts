import { ControlAlias, GetDefaultConfig } from "./Controls";
import { ControlDeclare } from "@/Types";
import { Guid } from "..";
import store from "@/Vuex/Store";
import * as ts from "typescript";
import { GetDesignerBackgroundFile, GetFileById } from "../VirtualFileSystem/Index";
import type Editor from "@/Core/Editor/Editor";
import type Control from "@/CoreUI/Designer/Control";
import { Stack, StackAction } from "@/Core/Designer/UndoStack/Stack";
import { nextTick } from "vue";
import utilsContent from "@/Utils/Runtime/Utils.ts?raw";

type ControlConfig = ControlDeclare.ControlConfig;
type DataSourceGroupConfig = ControlDeclare.DataSourceGroupConfig;

/**
 * 处理文件内容 - 删除分割线之前的代码，使其能够作为 monaco editor 的代码
 * @param content 文件内容
 * @returns 处理后的内容
 */
function ProcessFileContent(content: string) {
  // 处理内容 - 使用分割线标记需要在monaco中删除的代码
  const separator = "/// 以上为 monaco editor 时需删除的代码";

  if (content.includes(separator)) {
    const parts = content.split(separator);
    if (parts.length > 1) {
      return parts[1].trim();
    }
  }
  return content;
}

// 代码编辑器中的 第三方/扩展库清单
export const ExtensionLibraries: Record<string, string> = {
  "Runtime/Utils": ProcessFileContent(utilsContent),
};

/**
 * 获取设计器代码编辑器实例
 * @returns 编辑器实例
 */
let editor: Editor | null = null;
async function getEditor() {
  if (!editor) {
    editor = await import("@/CoreUI/Editor/EditorPage").then((m) => m.editor);
  }
  return editor;
}

/**
 * 创建控件通过拖拽事件
 * @param e 拖拽事件
 * @returns 控件配置
 */
export function CreateControlByDragEvent(e: DragEvent, vueInstance): ControlConfig {
  let rect = (e.target as HTMLElement).getBoundingClientRect();
  let x = e.clientX - rect.x;
  let y = e.clientY - rect.y;
  let type = e.dataTransfer.getData("type");
  if (!type) return;
  store.dispatch("Designer/ClearSelected");
  let controlComponent = vueInstance?.$.appContext.components[type] as any;
  let config = {
    ...GetDefaultConfig(),
    ...controlComponent.GetDefaultConfig(),
    id: Guid.NewGuid(),
    top: y,
    left: x,
  } as ControlConfig;

  return config;
}

// 处理拖拽添加控件事件
export function DropAddControl(e: DragEvent, vueInstance, paste?: boolean, pasteOffset?: number) {
  let config = CreateControlByDragEvent(e, vueInstance);
  AddControlToDesigner(config, vueInstance, paste, pasteOffset);
  AddControlDeclareToDesignerCode(config);
}

/**
 * 添加控件到设计器
 * @param config 控件配置
 * @param paste 是否为粘贴操作
 * @param pasteOffset 粘贴时的偏移量
 */
export function AddControlToDesigner(config: ControlConfig, vueInstance, paste?: boolean, pasteOffset?: number) {
  config.name = GenerateUniqueControlName(config.type);
  config.id = Guid.NewGuid();
  config.top -= paste ? pasteOffset : config.height / 2;
  config.left -= paste ? pasteOffset : config.width / 2;

  // 处理控件的容器关系
  if (vueInstance.config.container) {
    config.fromContainer = vueInstance.config.name;
    // 对于 Tabs 控件特殊处理，设置 fromTabId
    if (vueInstance.config.type === "Tabs") {
      config.fromTabId = vueInstance.config.name;
    }
  }

  // 确定将控件添加到哪个容器中
  if (paste) {
    // 粘贴操作：尝试找到原容器，如不存在则添加到根表单
    const containerConfig = config.fromContainer && GetControlConfigByName(config.fromContainer);
    if (containerConfig) {
      containerConfig.$children.push(config);
    } else {
      // 清理无效的容器引用
      delete config.fromContainer;
      delete config.fromTabId;
      store.get.Designer.FormConfig.$children.push(config);
    }
  } else {
    // 普通添加：直接添加到当前容器
    vueInstance.config.$children.push(config);
  }

  nextTick(() => {
    store.dispatch("Designer/AddStack", new Stack(GetFormAllControls()[config.name], config, null, StackAction.Create));
    store.dispatch("Designer/SelectControlByConfig", [config]);
  });
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
 * 通过名称查找控件配置
 * @param name 控件名称
 * @returns 找到的控件配置或undefined
 */
export function GetControlConfigByName(name: string): ControlConfig | undefined {
  if (!name || !store.get.Designer.FormConfig) {
    return undefined;
  }

  // 检查根级配置是否匹配
  if (store.get.Designer.FormConfig.name === name) {
    return store.get.Designer.FormConfig;
  }

  // 使用队列进行广度优先搜索所有子控件
  const queue: ControlConfig[] = [...(store.get.Designer.FormConfig.$children || [])];

  while (queue.length > 0) {
    const control = queue.shift();

    if (control.name === name) {
      return control;
    }

    // 将子控件添加到队列中继续搜索
    if (control.$children && control.$children.length > 0) {
      queue.push(...control.$children);
    }
  }

  return undefined;
}

/**
 * 检查是否已存在指定名称的控件配置
 * @param config 要检查的控件配置
 * @returns 是否存在同名控件
 */
export function IsControlNameExists(config: ControlConfig): boolean {
  return !!GetControlConfigByName(config.name);
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
 * 根据控件类型生成唯一的控件名称
 * @param type 控件类型
 * @returns 生成的唯一控件名称
 */
export function GenerateUniqueControlName(type: string): string {
  // 首先从ControlAlias中获取控件前缀
  const prefix = ControlAlias[type];
  if (!prefix) {
    console.warn(`未找到类型 ${type} 的控件别名，使用默认名称`);
    return `control_${Math.floor(Math.random() * 10000)}`;
  }

  // 获取缓存中的前缀对应的名称
  let prevName = cacheControlName[prefix];
  if (!prevName) prevName = `${prefix}_0`;

  // 解析数字部分并生成新的名称
  const match = prevName.match(/\d+/g) as any[];
  const n = parseInt(match[0]);
  const newName = `${prefix}_${n + 1}`;

  // 检查新生成的名称是否已存在
  const tempConfig = { name: newName } as ControlConfig;
  if (IsControlNameExists(tempConfig)) {
    // 递归调用直到找到不存在的名称
    cacheControlName[prefix] = newName; // 先更新缓存，以便下次递归找到更大的数字
    return GenerateUniqueControlName(type);
  }

  // 更新缓存并返回新名称
  cacheControlName[prefix] = newName;
  return newName;
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
  let sqlFile = GetFileById(config.dataSource);
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
async function transformPageClass(transformer: (members: ts.ClassElement[]) => ts.ClassElement[]) {
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

  const editor = await getEditor();
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
export async function AddMethodToDesignerBackground(name: string, params: { name: string; type: string }[]) {
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
  const editor = await getEditor();
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
    setTimeout(async () => {
      const editor = await getEditor();
      let pos = editor.editor.getModel().getPositionAt(methodNode.getStart());

      editor.editor.focus();
      editor.editor.setPosition(pos);
      editor.editor.revealPositionInCenter(pos);
    }, 0);
  }
}

/**
 * 获取当前 fromConfig 的所有Vue Control实例
 */
export function GetFormAllControls(): Record<string, Control> {
  const result: Record<string, Control> = {};
  const formDesigner = store.get.Designer.$FormDesigner;

  if (!formDesigner) return {};

  // 使用栈来跟踪我们需要处理的组件
  const stack: any[] = [formDesigner];

  while (stack.length > 0) {
    const current = stack.pop();

    if (!current) continue;

    if (current.$refs && typeof current.$refs === "object") {
      for (const refKey in current.$refs) {
        const ref = current.$refs[refKey];

        if (!ref) continue;

        if (typeof ref === "object" && ref.$options?.name.indexOf("Control") >= 0 && ref.config?.name) {
          result[ref.config.name] = ref;
        }

        stack.push(ref);
      }
    }
  }

  return result;
}
