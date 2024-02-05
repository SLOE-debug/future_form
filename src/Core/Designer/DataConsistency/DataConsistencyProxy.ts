const objectRelationMap: Map<object, Set<object>> = new Map();
const fieldRelationMap: Map<object, Map<object, Map<string | symbol, string | symbol>>> = new Map();

Map.prototype.getOrCreateKey = function <K, V>(this: Map<K, V>, obj: K, type: string) {
  let value = this.get(obj);
  if (!value) {
    switch (type) {
      case "Set":
        value = new Set() as V;
        break;
      case "Map":
        value = new Map() as V;
        break;
      default:
        value = "" as V;
        break;
    }
    this.set(obj, value);
  }
  return value;
};

export interface DataLink {
  UnLink: () => void;
}

export function EstablishLink(
  object: object,
  propName: string | symbol,
  refObject: object,
  refPropName: string | symbol
): DataLink {
  object = object["#concordance"];
  refObject = refObject["#concordance"];
  objectRelationMap.getOrCreateKey(object, "Set").add(refObject);
  objectRelationMap.getOrCreateKey(refObject, "Set").add(object);

  AddObject2FieldRelationMap(refObject, refPropName, object, propName);
  AddObject2FieldRelationMap(object, propName, refObject, refPropName);

  return {
    UnLink: () => {
      ClearRef(objectRelationMap, object, refObject);
      ClearRef(objectRelationMap, refObject, object);
      ClearRef(fieldRelationMap, object, refObject);
      ClearRef(fieldRelationMap, refObject, object);
    },
  };
}

function ClearRef(map: Map<object, Set<object> | Map<object, any>>, object: object, refObject: object) {
  let set = map.get(object);
  set.delete(refObject);
  if (!set.size) map.delete(object);
  return map;
}

const AddObject2FieldRelationMap = function (
  object: object,
  propName: string | symbol,
  refObject: object,
  refPropName: string | symbol
) {
  fieldRelationMap.getOrCreateKey(object, "Map").getOrCreateKey(refObject, "Map").set(propName, refPropName);
};

function SynchroData(object: object) {
  let refObject = objectRelationMap.get(object);
  if (refObject) {
    for (const m of refObject) {
      let fieldMap = fieldRelationMap.get(object).get(m);
      if (fieldMap) {
        for (const { 0: key1, 1: key2 } of fieldMap) {
          if (m[key2] != object[key1]) {
            m[key2] = object[key1];
          }
        }
      }

      let reverseObject = objectRelationMap.get(m);
      for (const reverseItem of reverseObject) {
        let fieldMap = fieldRelationMap.get(m).get(reverseItem);
        if (fieldMap) {
          for (const { 0: key1, 1: key2 } of fieldMap) {
            if (reverseItem[key2] != m[key1]) {
              reverseItem[key2] = m[key1];
            }
          }
        }
      }
    }
  }
}

export function DataConsistencyProxyCreator<T extends object>(
  _object: T,
  setter?: (m: T, propName: string | symbol, nv: any, ov: any) => void
): T {
  if (_object["#concordance"]) return _object;
  return new Proxy(_object, {
    get(object, propName, receiver) {
      if (propName == "#concordance") return receiver;
      if (propName == "__v_isShallow") return receiver;

      let res = Reflect.get(object, propName, receiver);
      return res;
    },
    set(object, propName, v, receiver) {
      let ov = object[propName];
      let res = Reflect.set(object, propName, v, receiver);
      setter && setter(object, propName, v, ov);
      SynchroData(receiver["#concordance"]);
      return res;
    },
  });
}
