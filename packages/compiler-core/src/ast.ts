/*
 * @Author: Zhouqi
 * @Date: 2022-04-07 22:07:33
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-05-11 22:29:54
 */
import {
  CREATE_ELEMENT_VNODE,
  WITH_DIRECTIVES,
  CREATE_ELEMENT_BLOCK,
  OPEN_BLOCK,
} from "./runtimeHelpers";
import { getVNodeBlockHelper, getVNodeHelper } from "./utils";

export const enum NodeTypes {
  ELEMENT,
  SIMPLE_EXPRESSION,
  INTERPOLATION,
  TEXT,
  ROOT,
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

export const enum ConstantTypes {
  NOT_CONSTANT = 0,
  CAN_SKIP_PATCH,
  CAN_HOIST,
  CAN_STRINGIFY,
}

export const enum ElementTypes {
  ELEMENT,
  COMPONENT,
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
  disableTracking = false,
  isComponent = false
) {
  if (context) {
    if (isBlock) {
      context.helper(OPEN_BLOCK);
      context.helper(getVNodeBlockHelper(isComponent));
    } else {
      context.helper(getVNodeHelper(isComponent));
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
    isComponent,
  };
}

export function createSimpleExpression(
  content,
  isStatic,
  constType = ConstantTypes.NOT_CONSTANT
) {
  // SIMPLE_EXPRESSION 对简单值的标记，比如props中的key和value。这些值如果是静态的会被序列化，
  // 如果是动态的则原封不动的使用
  return {
    type: NodeTypes.SIMPLE_EXPRESSION,
    isStatic,
    content,
    constType: isStatic ? ConstantTypes.CAN_STRINGIFY : constType,
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
