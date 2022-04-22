/*
 * @Author: Zhouqi
 * @Date: 2022-04-07 22:07:33
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-21 22:05:32
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
  TEXT_CALL,
  JS_CALL_EXPRESSION,
  JS_PROPERTY,
  JS_OBJECT_EXPRESSION
}

export const enum ElementTypes {
  ELEMENT,
}

// 普通元素的codegenNode
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

// 插值表达式的codegenNode
export function createCallExpression(callee, args) {
  return {
    type: NodeTypes.JS_CALL_EXPRESSION,
    callee,
    arguments: args,
  };
}
