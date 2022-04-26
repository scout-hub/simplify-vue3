/*
 * @Author: Zhouqi
 * @Date: 2022-04-10 11:33:43
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-23 11:00:43
 */
import { NodeTypes } from "./ast";

export function isText(node) {
  return node.type === NodeTypes.INTERPOLATION || node.type === NodeTypes.TEXT;
}

// 判断是否是静态值
export const isStaticExp = (p) =>
  p.type === NodeTypes.SIMPLE_EXPRESSION && p.isStatic;
