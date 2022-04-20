/*
 * @Author: Zhouqi
 * @Date: 2022-04-07 22:07:33
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-20 21:50:31
 */
import { CREATE_ELEMENT_BLOCK, CREATE_ELEMENT_VNODE } from "./runtimeHelpers";

export const enum NodeTypes {
  ELEMENT,
  SIMPLE_EXPRESSION,
  INTERPOLATION,
  TEXT,
  ROOT,
  // containers
  COMPOUND_EXPRESSION,
  ATTRIBUTE,
  DIRECTIVE,
  COMMENT,
  VNODE_CALL,
}

export const enum ElementTypes {
  ELEMENT,
}

export function createVnodeCall(context, tag, props, children) {
  // context.helper(CREATE_ELEMENT_BLOCK);
  context.helper(CREATE_ELEMENT_VNODE);

  return {
    type: NodeTypes.VNODE_CALL,
    tag,
    props,
    children,
  };
}
