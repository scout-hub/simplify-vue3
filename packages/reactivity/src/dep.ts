/*
 * @Author: Zhouqi
 * @Date: 2022-03-30 17:31:04
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-07-10 22:06:48
 */

import { effect, ReactiveEffect, trackOpBit } from "./effect";

export type Dep = Set<ReactiveEffect> & TrackedMarkers;
type TrackedMarkers = {
  // wasTracked
  w: number;
  // newTracked;
  n: number;
};

export function createDep(): Dep {
  const dep = new Set<ReactiveEffect>() as Dep;
  // 标记dep是否已经被收集过
  dep.w = 0;
  // 标记dep是否是最新收集的（当前effect层收集的）
  dep.n = 0;
  return dep;
}

/**
 * @author: Zhouqi
 * @description: 是否是已经收集过的依赖
 */
export const wasTracked = (dep: Dep): boolean => (dep.w & trackOpBit) > 0;

/**
 * @author: Zhouqi
 * @description: 是否是当前effect层最新收集的依赖
 */
export const newTracked = (dep: Dep): boolean => (dep.n & trackOpBit) > 0;

/**
 * @author: Zhouqi
 * @description: 初始化dep的标记位
 */
export function initDepMarkers({ deps }: ReactiveEffect) {
  if (deps.length) {
    for (let i = 0; i < deps.length; i++) {
      // 表示dep在某一层effect中已经被收集过
      deps[i].w |= trackOpBit;
    }
  }
}

/**
 * @author: Zhouqi
 * @description: 重置dep标记位并处理过期依赖
 */
export function finalizeDepMarkers(effect: ReactiveEffect) {
  const { deps } = effect;
  if (deps.length) {
    // 最新的dep长度
    let l = 0;
    for (let i = 0; i < deps.length; i++) {
      const dep = deps[i];
      // 判断是否是已经收集过的但不是最新收集的依赖，是的话就清除
      if (wasTracked(dep) && !newTracked(dep)) {
        dep.delete(effect);
      } else {
        l++;
      }
      // 清除dep中关于当前effect层的标记位
      dep.w &= ~trackOpBit;
      dep.n &= ~trackOpBit;
    }
    deps.length = l;
  }
}
