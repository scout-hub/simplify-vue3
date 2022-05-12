/*
 * @Author: Zhouqi
 * @Date: 2022-04-10 11:33:43
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-05-12 21:34:46
 */
import { NodeTypes } from "./ast";
import {
  CREATE_BLOCK,
  CREATE_ELEMENT_BLOCK,
  CREATE_ELEMENT_VNODE,
  CREATE_VNODE,
} from "./runtimeHelpers";
import { createObjectExpression } from "./transforms/transformElement";

export function isText(node) {
  return node.type === NodeTypes.INTERPOLATION || node.type === NodeTypes.TEXT;
}

// 判断是否是静态值
export const isStaticExp = (p) =>
  p.type === NodeTypes.SIMPLE_EXPRESSION && p.isStatic;

const nonIdentifierRE = /^\d|[^\$\w]/;
// 是否是简单标识符
export const isSimpleIdentifier = (name: string): boolean =>
  !nonIdentifierRE.test(name);

// 在当前ast node上注入prop
export function injectProp(node, prop) {
  // 这里简单处理一下v-if的key属性注入
  const propsWithInjection = createObjectExpression([prop]);
  node.props = propsWithInjection;
}

export function getVNodeBlockHelper(isComponent: boolean) {
  return isComponent ? CREATE_BLOCK : CREATE_ELEMENT_BLOCK;
}

export function getVNodeHelper(isComponent: boolean) {
  return isComponent ? CREATE_VNODE : CREATE_ELEMENT_VNODE;
}
