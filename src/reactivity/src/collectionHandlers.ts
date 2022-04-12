/*
 * @Author: Zhouqi
 * @Date: 2022-04-12 11:21:30
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-12 20:39:58
 */
import { hasChanged } from "../../shared/src";
import { ITERATE_KEY, track, trigger } from "./effect";
import { TriggerOpTypes } from "./operations";
import { ReactiveFlags, toRaw, toReactive, toReadonly } from "./reactive";
export type CollectionTypes = IterableCollections | WeakCollections;

type IterableCollections = Map<any, any> | Set<any>;
type WeakCollections = WeakMap<any, any> | WeakSet<any>;
type MapTypes = Map<any, any> | WeakMap<any, any>;
type SetTypes = Set<any> | WeakSet<any>;

const toShallow = <T extends unknown>(value: T): T => value;

// 覆写size获取器的逻辑
function size(target: IterableCollections) {
  const rawTarget = toRaw(target);
  track(rawTarget, ITERATE_KEY);
  return Reflect.get(rawTarget, "size", rawTarget);
}

// 覆写delete方法
function deleteEntry(this: CollectionTypes, key: unknown) {
  const rawTarget = toRaw(this);
  const hasKey = rawTarget.has(key);
  const result = rawTarget.delete(key);
  if (hasKey) {
    // 如果key存在则去触发依赖
    trigger(rawTarget, TriggerOpTypes.DELETE, key);
  }
  return result;
}

// 覆写add方法
function add(this: SetTypes, value: unknown) {
  // 获取原始数据，道理同set方法，不污染原始对象
  value = toRaw(value);
  const rawTarget = toRaw(this);
  const hasKey = rawTarget.has(value);
  // 优化：如果没有对应的value，才去添加value
  if (!hasKey) {
    rawTarget.add(value);
    trigger(rawTarget, TriggerOpTypes.ADD, value);
  }
  return this;
}

// 覆写get方法
function get(
  target: MapTypes,
  key: unknown,
  isReadonly: boolean = false,
  isShallow: boolean = false
) {
  const rawTarget = toRaw(target);
  const has = rawTarget.has(key);
  // 不是只读的需要建立依赖关系
  !isReadonly && track(rawTarget, key);

  const wrapper = isShallow ? toShallow : isReadonly ? toReadonly : toReactive;
  // 如果存在对应的key，则返回结果
  if (has) {
    const result = rawTarget.get(key);
    // 如果结果是对象还需要深层次处理
    return wrapper(result);
  }
}

// 覆写set方法
function set(this, key, value) {
  /**
   * 如果value是响应式数据需要获取其原始数据，防止污染数据
   * 因为这里的set操作操作的是原始对象，假如不对value值做处理，那么用户
   * 可以通过原始数据来进行响应式操作，这是不合理的
   *
   * 例如：
   * const map = new Map([["name", "zs"]]);
   * const r = reactive(map);
   * const r1 = reactive(new Map());
   * r.set("r1", r1);
   * effect(() => {
   *   map.get("r1").size;
   * });
   * map.get("r1").set("age", 1);
   *
   * 上面effect中通过map获取到的r1是响应式数据，因此访问size属性会建立依赖关系
   * 当通过map去获取r1并设置数据的时候就会触发依赖，这就赋予了原始对象map进行响应式操作的能力
   * 为了不污染原始对象，应该获取到value对应的原始对象。
   */
  value = toRaw(value);

  const rawTarget = toRaw(this);
  const hasKey = rawTarget.has(key);
  const oldValue = rawTarget.get(key);
  rawTarget.set(key, value);
  if (!hasKey) {
    // 如果之前key不存在说明是新增操作，触发依赖
    trigger(rawTarget, TriggerOpTypes.ADD, key, value);
  } else if (hasChanged(oldValue, value)) {
    // 值变化了说明是修改操作，触发依赖
    trigger(rawTarget, TriggerOpTypes.SET, key, value);
  }
  return this;
}

/**
 * 创建不同的处理器对象
 *
 * 集合类型和普通的对象去访问和调用方法是不一样的，这些操作在proxy上直接使用是有问题的
 * 例如：我们通过Set去访问size属性，在proxy中直接通过Reflect.get(target,key,receiver)是有问题的
 * 因为访问器属性size中的this是代理对象，而代理对象是缺少原生Set内部方法的。因此我们需要定义一套自己的集合类型的逻辑处理器，
 * 去覆写相关集合上的访问器属性和方法，让它们能够正常处理
 */
function createInstrumentations() {
  const mutableInstrumentations: Record<string, Function> = {
    get(this: MapTypes, key: unknown) {
      return get(this, key);
    },
    get size() {
      return size(this as unknown as IterableCollections);
    },
    delete: deleteEntry,
    add,
    set,
  };
  const readonlyInstrumentations: Record<string, Function> = {};
  const shallowInstrumentations: Record<string, Function> = {};
  const shallowReadonlyInstrumentations: Record<string, Function> = {};

  return [
    mutableInstrumentations,
    readonlyInstrumentations,
    shallowInstrumentations,
    shallowReadonlyInstrumentations,
  ];
}

const [
  mutableInstrumentations,
  readonlyInstrumentations,
  shallowInstrumentations,
  shallowReadonlyInstrumentations,
] = createInstrumentations();

// 创建公共的getter处理器
function createInstrumentationGetter(isReadonly: boolean, isShallow: boolean) {
  // 根据配置使用不同的处理器
  let instrumentations;
  if (isShallow) {
    instrumentations = isReadonly
      ? shallowReadonlyInstrumentations
      : shallowInstrumentations;
  } else {
    instrumentations = isReadonly
      ? readonlyInstrumentations
      : mutableInstrumentations;
  }

  return (
    target: CollectionTypes,
    key: string | symbol,
    receiver: CollectionTypes
  ) => {
    // 如果访问的是__v_reactive，则返回!isReadonly的值
    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadonly;
    }
    // 如果访问的是__v_isReadonly，则返回isReadonly值
    if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly;
    }
    // 如果访问的是__v_raw属性，就返回原始对象
    if (key === ReactiveFlags.RAW) {
      return target;
    }

    return Reflect.get(instrumentations, key, receiver);
  };
}

export const mutableCollectionHandlers: ProxyHandler<CollectionTypes> = {
  get: createInstrumentationGetter(false, false),
};

export const shallowCollectionHandlers: ProxyHandler<CollectionTypes> = {};

export const readonlyCollectionHandlers: ProxyHandler<CollectionTypes> = {};

export const shallowReadonlyCollectionHandlers: ProxyHandler<CollectionTypes> =
  {};
