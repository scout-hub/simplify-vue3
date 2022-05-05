/*
 * @Author: Zhouqi
 * @Date: 2022-04-07 22:07:33
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-05-05 16:04:49
 */
import {
  CREATE_ELEMENT_VNODE,
  WITH_DIRECTIVES,
  CREATE_ELEMENT_BLOCK,
  OPEN_BLOCK,
} from "./runtimeHelpers";

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
  FOR,
  JS_FUNCTION_EXPRESSION,
}

export const enum ElementTypes {
  ELEMENT,
}

export function createVnodeCall(
  context,
  tag,
  props?,
  children?,
  patchFlag?,
  dynamicProps?,
  directives?,
  isBlock = false,
  disableTracking = false
) {
  if (context) {
    if (isBlock) {
      context.helper(OPEN_BLOCK);
      // TODO component create_block
      context.helper(CREATE_ELEMENT_BLOCK);
    } else {
      context.helper(CREATE_ELEMENT_VNODE);
    }
    if (directives) {
      context.helper(WITH_DIRECTIVES);
    }
  }

  // 创建VNODE_CALL是为了block
  return {
    type: NodeTypes.VNODE_CALL,
    tag,
    props,
    children,
    patchFlag,
    dynamicProps,
    directives,
    isBlock,
    disableTracking,
  };
}

// 插值
export function createCallExpression(callee, args) {
  // JS_CALL_EXPRESSION 表示节点需要作为参数被特定的callee函数调用
  return {
    type: NodeTypes.JS_CALL_EXPRESSION,
    callee,
    arguments: args,
  };
}

export function createArrayExpression(elements) {
  // JS_ARRAY_EXPRESSION 表示数据需要处理成数组的形式，例如:v-show指令 ['V-SHOW', expression]
  return {
    type: NodeTypes.JS_ARRAY_EXPRESSION,
    elements,
  };
}

// 结构行表达式 v-if/v-else-if/v-else
export function createConditionalExpression(test, consequent, alternate) {
  return {
    type: NodeTypes.JS_CONDITIONAL_EXPRESSION,
    test,
    consequent,
    alternate,
  };
}

// v-for
export function createFunctionExpression(params, returns = undefined) {
  return {
    type: NodeTypes.JS_FUNCTION_EXPRESSION,
    params,
    returns,
  };
}

// 复合类型表达式!aaa.xxx xxx{{text}} 等等
export function createCompoundExpression(children) {
  return {
    type: NodeTypes.COMPOUND_EXPRESSION,
    children,
  };
}
