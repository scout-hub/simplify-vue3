/*
 * @Author: Zhouqi
 * @Date: 2022-03-20 20:47:45
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-12 11:25:42
 */
import { toRawType } from "../../shared/src";
import {
  reactiveHandler,
  readonlyHandler,
  shallowReadonlyHandler,
  shallowReactiveHandler,
} from "./baseHandlers";

import {
  mutableCollectionHandlers,
  readonlyCollectionHandlers,
  shallowCollectionHandlers,
  shallowReadonlyCollectionHandlers,
} from "./collectionHandlers";

export const enum ReactiveFlags {
  IS_REACTIVE = "__v_isReactive",
  IS_READONLY = "__v_isReadonly",
  IS_SHALLOW = "__v_isShallow",
  RAW = "__v_raw",
}

export interface Target {
  [ReactiveFlags.IS_REACTIVE]?: boolean;
  [ReactiveFlags.IS_READONLY]?: boolean;
  [ReactiveFlags.IS_SHALLOW]?: boolean;
  [ReactiveFlags.RAW]?: any;
}

const enum TargetType {
  INVALID,
  COMMON,
  COLLECTION,
}

function targetTypeMap(type: string) {
  switch (type) {
    case "Object":
    case "Array":
      return TargetType.COMMON;
    case "Map":
    case "Set":
    case "WeakMap":
    case "WeakSet":
      return TargetType.COLLECTION;
    default:
      return TargetType.INVALID;
  }
}

// 获取当前数据的类型
function getTargetType(value: Target) {
  return targetTypeMap(toRawType(value));
}

// 缓存target->proxy的映射关系
export const reactiveMap = new WeakMap<Target, any>();
export const shallowReactiveMap = new WeakMap<Target, any>();
export const readonlyMap = new WeakMap<Target, any>();
export const shallowReadonlyMap = new WeakMap<Target, any>();

// 创建响应式对象
export function reactive(raw: object) {
  // 如果对象是一个只读的proxy，则直接返回
  if (isReadonly(raw)) {
    return raw;
  }
  return createReactiveObject(
    raw,
    reactiveHandler,
    mutableCollectionHandlers,
    reactiveMap
  );
}

// 创建浅响应对象
export function shallowReactive(raw: object) {
  return createReactiveObject(
    raw,
    shallowReactiveHandler,
    shallowCollectionHandlers,
    shallowReactiveMap
  );
}

// 创建只读对象
export function readonly(raw: object) {
  return createReactiveObject(
    raw,
    readonlyHandler,
    readonlyCollectionHandlers,
    readonlyMap
  );
}

// 创建浅只读对象
export function shallowReadonly(raw: object) {
  return createReactiveObject(
    raw,
    shallowReadonlyHandler,
    shallowReadonlyCollectionHandlers,
    shallowReadonlyMap
  );
}

// 对象是不是响应式的
export function isReactive(variable: unknown): boolean {
  return !!(variable as Target)[ReactiveFlags.IS_REACTIVE];
}

// 对象是不是只读的
export function isReadonly(variable: unknown): boolean {
  return !!(variable as Target)[ReactiveFlags.IS_READONLY];
}

// 对象是不是readonly或者reactive的
export function isProxy(variable: unknown): boolean {
  return isReactive(variable) || isReadonly(variable);
}

// 返回代理对象的原始对象
export function toRaw<T>(observed: T): T {
  const raw = observed && observed[ReactiveFlags.RAW];
  // toRaw返回的对象依旧是代理对象，则递归去找原始对象
  return raw ? toRaw(raw) : observed;
}

function createReactiveObject(
  raw: Target,
  baseHandler: ProxyHandler<object>,
  collectionHandlers: ProxyHandler<any>,
  proxyMap: WeakMap<Target, any>
) {
  /**
   * 如果映射表里有原始对象对应的代理对象，则直接返回，避免因同一个原始对象而创建出的代理对象不同导致比较失败
   * 例如：
   * const obj = {};
   * const arr: any = reactive([obj]);
   * arr.includes(arr[0])应该是true，但是返回了false
   * 因为arr[0]是obj的响应式对象，arr.includes通过下标找到arr[0]时也是obj的响应式对象
   * 如果不缓存同一个target对应的代理对象，会导致因重复创建而比较失败的情况
   */
  const existingProxy = proxyMap.get(raw);
  if (existingProxy) return existingProxy;

  const targetType = getTargetType(raw);

  // 集合类型例如Set、WeakSet、Map、WeakMap需要另外的handler处理
  const proxy = new Proxy(
    raw,
    targetType === TargetType.COLLECTION ? collectionHandlers : baseHandler
  );
  proxyMap.set(raw, proxy);
  return proxy;
}
