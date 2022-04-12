/*
 * @Author: Zhouqi
 * @Date: 2022-04-12 11:21:30
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-12 11:59:17
 */
import { ReactiveFlags, toRaw } from "./reactive";
export type CollectionTypes = IterableCollections | WeakCollections;

type IterableCollections = Map<any, any> | Set<any>;
type WeakCollections = WeakMap<any, any> | WeakSet<any>;

// 覆写size获取器的逻辑
function size(target: IterableCollections) {
  const rawTarget = toRaw(target);
  return Reflect.get(rawTarget, "size", rawTarget);
}

// 创建不同的处理器对象
/**
 * 集合类型和普通的对象去访问和调用方法是不一样的，这些操作在proxy上直接使用是有问题的
 * 例如：我们通过Set去访问size属性，在proxy中直接通过Reflect.get(target,key,receiver)是有问题的
 * 因为访问器属性size中的this是代理对象，而代理对象是缺少原生Set内部方法的。因此我们需要定义一套自己的集合类型的逻辑处理器，
 * 去覆写相关集合上的访问器属性和方法，让它们能够正常处理
 */
function createInstrumentations() {
  const mutableInstrumentations: Record<string, Function> = {
    get size() {
      return size(this as unknown as IterableCollections);
    },
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
