/*
 * @Author: Zhouqi
 * @Date: 2022-04-09 21:13:43
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-09 23:41:09
 */
/**
 * 1. text
 * return function render(_ctx, _cache, $props, $setup, $data, $options) {
 *   return "Hello World";
 * }
 *
 * 2、interplation
 * const { toDisplayString: _toDisplayString } = Vue
 *
 * return function render(_ctx, _cache, $props, $setup, $data, $options) {
 *    return _toDisplayString(_ctx.hello)
 * }
 */

import { isFunction } from "../../shared/src";
import { NodeTypes } from "./ast";
import { helperNameMap, TO_DISPLAY_STRING } from "./runtimeHelpers";

export function generate(ast, options = {}) {
  const context = createCodegenContext(ast, options);

  genFunctionPreamble(ast, context);

  const { push } = context;
  const functionName = "render";
  const args = ["_ctx", "_cache", "$props", "$setup", "$data", "$options"].join(
    ", "
  );
  push(`function ${functionName}(${args}) { `);
  push(`return `);
  genNode(ast.codegenNode, context);
  push(" }");

  return context.code;
}

/**
 * @author: Zhouqi
 * @description: 创建codegen上下文
 * @param ast
 * @param options
 * @return 上下文对象
 */
function createCodegenContext(ast: any, options: {}) {
  const context = {
    runtimeGlobalName: "Vue",
    // 最终的代码字符串
    code: ``,
    // 字符串拼接操作
    push(text) {
      context.code += text;
    },
    newLine() {
      context.push("\n      ");
    },
    helper(key) {
      return `_${helperNameMap[key]}`;
    },
  };
  return context;
}

/**
 * @author: Zhouqi
 * @description: 根据ast生成节点
 * @param node astNode
 */
function genNode(node, context) {
  const { type } = node;
  const nodeHandlers = {
    [(type === NodeTypes.TEXT) as any]() {
      genText(node, context);
    },
    [(type === NodeTypes.INTERPOLATION) as any]() {
      genInterpolation(node, context);
    },
    [(type === NodeTypes.SIMPLE_EXPRESSION) as any]() {
      genExpression(node, context);
    },
  };
  const handler = nodeHandlers[true as any];
  if (isFunction(handler)) {
    handler();
  }
}
function genFunctionPreamble(ast, context) {
  const { push, runtimeGlobalName, newLine } = context;
  const { helpers } = ast;
  const aliasHelper = (s: symbol) =>
    `${helperNameMap[s]}: _${helperNameMap[s]}`;

  if (helpers.length) {
    push(
      `const { ${helpers.map(aliasHelper).join(", ")} } = ${runtimeGlobalName};`
    );
  }
  newLine();
  push(`return `);
}
function genText(node, context) {
  const { push } = context;
  push(`'${node.content}';`);
}
function genInterpolation(node, context) {
  const { push, helper } = context;
  push(`${helper(TO_DISPLAY_STRING)}(`);
  genNode(node.content, context);
  push(`);`);
}

function genExpression(node, context) {
  context.push(node.content);
}
