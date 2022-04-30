/*
 * @Author: Zhouqi
 * @Date: 2022-04-07 22:07:33
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-30 20:16:18
 */
import { CREATE_ELEMENT_VNODE, WITH_DIRECTIVES } from "./runtimeHelpers";

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
  JS_OBJECT_EXPRESSION,
  JS_ARRAY_EXPRESSION,
  IF_BRANCH,
  IF,
  JS_CONDITIONAL_EXPRESSION,
}

export const enum ElementTypes {
  ELEMENT,
}

// 普通元素
export function createVnodeCall(context, tag, props, children, directives?) {
  context.helper(CREATE_ELEMENT_VNODE);
  if (directives) {
    context.helper(WITH_DIRECTIVES);
  }
  return {
    type: NodeTypes.VNODE_CALL,
    tag,
    props,
    children,
    directives,
  };
}

// 插值
export function createCallExpression(callee, args) {
  return {
    type: NodeTypes.JS_CALL_EXPRESSION,
    callee,
    arguments: args,
  };
}

// 指令 例如:v-show
export function createArrayExpression(elements) {
  return {
    type: NodeTypes.JS_ARRAY_EXPRESSION,
    elements,
  };
}

export function createConditionalExpression(test, consequent, alternate) {
  return {
    type: NodeTypes.JS_CONDITIONAL_EXPRESSION,
    test,
    consequent,
    alternate,
  };
}
