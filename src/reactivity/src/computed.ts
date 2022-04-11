/*
 * @Author: Zhouqi
 * @Date: 2022-03-26 14:52:42
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-11 17:50:17
 */

import { ReactiveEffect } from "./effect";
import { trackRefValue, triggerRefValue } from "./ref";

export type ComputedGetter<T> = (...args: any[]) => T;

class ComputedRefImpl<T> {
  private _dirty = true; // true表示需要重新计算新的值
  private _lazyEffect;
  private _oldValue!: T; // 缓存的值

  constructor(getter: ComputedGetter<T>) {
    this._lazyEffect = new ReactiveEffect(getter, () => {
      // 借助scheduler是否执行去判断依赖的响应式对象是否发生变化
      if (!this._dirty) {
        this._dirty = true;
        // 触发value属性相关的effect函数
        triggerRefValue(this);
      }
    });
  }

  // value属性后才去执行getter函数获取值
  get value() {
    /**
     * 当通过.value访问值时，如果计算属性计算时依赖的响应式对象数据没有发生变化
     * 则返回旧的值，否则重新计算新的值。
     * 这里就需要借助effect去帮助我们实现 当依赖的响应式对象发生变化时 重新计算的逻辑
     */
    trackRefValue(this);
    if (this._dirty) {
      this._dirty = false;
      this._oldValue = this._lazyEffect.run();
    }
    /**
     * 在effect中使用计算属性时会发生嵌套effect的情况
     * 由于计算属性内部有单独的lazy effect，因此内部的响应式数据只会收集该effect
     * 不会收集外层的effect，导致computed内部的响应式数据变化时，外层effect函数不会触发
     * 解决方式：
     * 在访问计算属性时，触发依赖收集，将外层effect和计算属性的value值进行关联
     */
    return this._oldValue;
  }
}

// 计算属性
// 接受一个getter
export function computed<T>(getter: ComputedGetter<T>) {
  return new ComputedRefImpl(getter);
}
