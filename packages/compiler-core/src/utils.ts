/*
 * @Author: Zhouqi
 * @Date: 2022-04-10 11:33:43
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-05-05 21:15:20
 */
import { NodeTypes } from "./ast";
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
