/*
 * @Author: Zhouqi
 * @Date: 2022-04-07 22:07:33
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-10 14:17:18
 */
import { CREATE_ELEMENT_BLOCK } from "./runtimeHelpers";

export const enum NodeTypes {
  ELEMENT,
  SIMPLE_EXPRESSION,
  INTERPOLATION,
  TEXT,
  ROOT,
  // containers
  COMPOUND_EXPRESSION, // 复合类型 text + interpolation
}

export const enum ElementTypes {
  ELEMENT,
}

export function createVnodeCall(context, tag, props, children) {
  context.helper(CREATE_ELEMENT_BLOCK);

  return {
    type: NodeTypes.ELEMENT,
    tag,
    props,
    children,
  };
}
