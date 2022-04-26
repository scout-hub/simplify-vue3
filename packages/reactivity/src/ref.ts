/*
 * @Author: Zhouqi
 * @Date: 2022-03-23 21:32:36
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-26 10:36:47
 */

import { hasChanged, isArray } from "@simplify-vue/shared";
import { createDep } from "./dep";
import { canTrack, trackEffects, triggerEffects } from "./effect";
import { isReactive, toRaw, toReactive } from "./reactive";

class RefImpl {
  private _value;
  public deps;
  private _rawValue;
  public readonly __v_isRef = true;

  constructor(value, readonly __v_isShallow = false) {
    // 如果不是shallow的情况且value是obj时需要响应式处理
    this._value = __v_isShallow ? value : toReactive(value);
    // 如果不是shallow的情况且value如果是响应式的，则需要拿到原始对象
    this._rawValue = __v_isShallow ? value : toRaw(value);
    this.deps = new Set();
  }

  get value() {
    trackRefValue(this);
    return this._value;
  }

  set value(newValue) {
    // 如果不是shallow的情况且value如果是响应式的，则需要拿到原始对象
    newValue = this.__v_isShallow ? newValue : toRaw(newValue);
    // 比较的时候拿原始值去比较
    if (hasChanged(newValue, this._rawValue)) {
      this._rawValue = newValue;
      // 如果不是shallow的情况且新的值时普通对象的话需要去响应式处理
      this._value = this.__v_isShallow ? newValue : toReactive(newValue);
      triggerRefValue(this);
    }
  }
}

class ObjectRefImpl {
  public readonly __v_isRef = true;
  constructor(private readonly _target, private readonly _key) {}
  get value() {
    const val = this._target[this._key];
    return val;
  }
  set value(newValue) {
    this._target[this._key] = newValue;
  }
}

export function ref(value) {
  return createRef(value, false);
}

// 代理ref对象，使之不需要要通过.value去访问值（例如在template里面使用ref时不需要.value）
export function proxyRefs(objectWithRefs) {
  // 如果是reactive对象则不需要处理，直接返回对象
  return isReactive(objectWithRefs)
    ? objectWithRefs
    : new Proxy(objectWithRefs, {
        get(target, key, receiver) {
          return unRef(Reflect.get(target, key, receiver));
        },
        set(target, key, newValue, receiver) {
          // 旧的值是ref，但是新的值不是ref时，直接修改.value的值。否则直接设置新值
          const oldValue = target[key];
          if (isRef(oldValue) && !isRef(newValue)) {
            oldValue.value = newValue;
            return true;
          }
          return Reflect.set(target, key, newValue, receiver);
        },
      });
}

// 浅ref，只对value做响应式处理
export function shallowRef(value) {
  return createRef(value, true);
}

// 判断一个值是不是ref
export function isRef(ref) {
  return !!(ref && ref.__v_isRef === true);
}

// 如果参数是一个ref，则返回内部值，否则返回参数本身
export function unRef(ref) {
  return isRef(ref) ? ref.value : ref;
}

// 收集ref的依赖函数
export function trackRefValue(ref) {
  if (canTrack()) {
    trackEffects(ref.deps || (ref.deps = createDep()));
  }
}

// 触发ref依赖函数
export function triggerRefValue(ref) {
  if (ref.deps) {
    triggerEffects(ref.deps);
  }
}

// 可以用来为源响应式对象上的某个 property 新创建一个 ref。然后，ref 可以被传递，它会保持对其源 property 的响应式连接
export function toRef(object, key) {
  return isRef(object) ? object : new ObjectRefImpl(object, key);
}

// 将响应式对象转换为普通对象，其中结果对象的每个 property 都是指向原始对象相应 property 的 ref
export function toRefs(object) {
  if (isRef(object)) return object;
  const result = isArray(object) ? new Array(object.length) : {};
  for (const key in object) {
    result[key] = toRef(object, key);
  }
  return result;
}

// 创建ref的工厂函数
function createRef(value, shallow) {
  return new RefImpl(value, shallow);
}
