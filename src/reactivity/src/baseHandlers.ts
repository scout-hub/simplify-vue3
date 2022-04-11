/*
 * @Author: Zhouqi
 * @Date: 2022-03-22 17:58:01
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-11 20:15:07
 */
import { ITERATE_KEY, track, trigger } from "./effect";
import { reactive, ReactiveFlags, readonly, Target, toRaw } from "./reactive";
import { isObject, extend, hasChanged, hasOwn } from "../../shared/src/index";
import { TrackOpTypes, TriggerOpTypes } from "./operations";

// 封装proxy get函数
const createGetter = function (isReadOnly = false, isShallow = false) {
  return function (target: Target, key: string, receiver: object) {
    // 如果访问的是__v_reactive，则返回!isReadOnly的值
    if (key === ReactiveFlags.IS_REACTIVE) {
      return !isReadOnly;
    }

    // 如果访问的是__v_isReadonly，则返回isReadOnly值
    if (key === ReactiveFlags.IS_READONLY) {
      return isReadOnly;
    }

    // 如果访问的是__v_raw属性，就返回原始对象
    if (key === ReactiveFlags.RAW) {
      return target;
    }

    // 只读属性不不能设置值，所以无需建立依赖关系
    if (!isReadOnly) {
      track(target, key);
    }

    const result = Reflect.get(target, key, receiver);

    // 浅响应
    if (isShallow) {
      return result;
    }

    // 深响应，如果访问的属性是一个对象则继续处理对象
    if (isObject(result)) {
      return isReadOnly ? readonly(result) : reactive(result);
    }

    return result;
  };
};

// 封装proxy set函数
const createSetter = function () {
  return function (
    target: Target,
    key: string,
    newValue: unknown,
    receiver: object
  ) {
    // 先获取旧的值，再去更新值，避免影响触发依赖的判断 oldValue !== newValue
    const oldValue = target[key];

    /**
     * 判断是新增还是修改属性
     * 对于新增属性需要触发ITERATE_KEY相关的依赖，因为这会影响for in循环
     */
    const hasKey = hasOwn(target, key);

    const result = Reflect.set(target, key, newValue, receiver);

    /**
     * 解决prototype chain造成问题
     * const obj = { name: "zs" };
     * const obj1 = { name1: "ls" };
     * const child: any = reactive(obj);
     * const parent = reactive(obj1);
     * Object.setPrototypeOf(child, parent);
     *
     * 上面这种情况，当child去访问name1属性时首先会去查找自身有没有name1属性，没有顺着原型链
     * 找到parent上的name1属性，在这个过程中，child和parent都收集了关于name1这个key的依赖，这是没问题的。
     * 问题在于当child设置name1的时候，首先会触发自身的set操作，但是自身没有name1属性，于是会通过原型链去触发
     * parent上的set操作，这一个过程触发了child和parent关于name1的依赖，这是多余的。因此需要屏蔽parent那一次
     * set操作触发的依赖。
     *
     * 这里判断的依据就是target是否跟receiver代理对象的原始对象相同
     * 当触发child的set操作时，target是child的原始对象obj，receiver是child
     * 当触发parent的set操作时，target是parent的原始对象obj1，但是receiver依旧是child
     */
    if (target === toRaw(receiver)) {
      if (!hasKey) {
        // 新增属性
        trigger(target, TriggerOpTypes.ADD, key);
      } else if (hasChanged(newValue, oldValue)) {
        // 修改属性值，触发依赖
        trigger(target, TriggerOpTypes.SET, key);
      }
    }
    return result;
  };
};

// 拦截 in 操作
function has(target: object, key: string | symbol): boolean {
  const result = Reflect.has(target, key);
  track(target, key);
  return result;
}

// 拦截 delete 操作
function deleteProperty(target: object, key: string | symbol): boolean {
  // 判断对象上是否有相关属性
  const hasKey = hasOwn(target, key);
  const result = Reflect.deleteProperty(target, key);
  if (hasKey && result) {
    // 如果存在属性且删除成功了，则触发依赖
    trigger(target, TriggerOpTypes.DELETE, key);
  }
  return result;
}

/**
 * 拦截for in 操作
 * 影响for in 的操作有添加和删除属性，因为这个导致for in 遍历的次数改变
 * 因此在触发依赖的时候如果是新增或者删除键需要将ITERATE_KEY关联的依赖拿出来执行
 */
function ownKeys(target) {
  // for in 操作没有明显的key可以追踪，因此创建一个ITERATE_KEY作为依赖追踪的key
  track(target, ITERATE_KEY);
  return Reflect.ownKeys(target);
}

// 初始化的时候创建
const reactiveGetter = createGetter();
const shallowReactiveGetter = createGetter(false, true);
const readonlyGetter = createGetter(true);
const shallowReadonlyGetter = createGetter(true, true);
const reactiveSetter = createSetter();

// 响应处理器
export const reactiveHandler: ProxyHandler<object> = {
  get: reactiveGetter,
  set: reactiveSetter,
  has,
  deleteProperty,
  ownKeys,
};

// 浅响应处理器
export const shallowReactiveHandler: ProxyHandler<object> = {
  get: shallowReactiveGetter,
  set: reactiveSetter,
};

// 只读处理器
export const readonlyHandler: ProxyHandler<object> = {
  get: readonlyGetter,
  set(target: Target, key: string, newValue: unknown, receiver: object) {
    console.warn(`${key} is readonly`);
    return true;
  },
};

// 浅只读处理器
export const shallowReadonlyHandler: ProxyHandler<object> = extend(
  {},
  readonlyHandler,
  {
    get: shallowReadonlyGetter,
  }
);
