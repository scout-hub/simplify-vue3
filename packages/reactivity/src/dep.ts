/*
 * @Author: Zhouqi
 * @Date: 2022-03-30 17:31:04
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-11 17:49:49
 */

import { ReactiveEffect } from "./effect";

export type Dep = Set<ReactiveEffect>;

export function createDep(): Dep {
  return new Set();
}