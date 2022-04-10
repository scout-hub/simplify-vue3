/*
 * @Author: Zhouqi
 * @Date: 2022-04-09 21:13:43
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-10 14:51:48
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
 *
 * 3、element
 * return function render(_ctx, _cache, $props, $setup, $data, $options) {
 *    return (_openBlock(), _createElementBlock("div"))
 * }
 *
 * 4、上面三种结合
 * const { toDisplayString: _toDisplayString, openBlock: _openBlock, createElementBlock: _createElementBlock } = Vue
 *  return function render(_ctx, _cache, $props, $setup, $data, $options) {
 *    return (_openBlock(), _createElementBlock("div", null, "hello, " + _toDisplayString(_ctx.message), 1));
 *  }
 */

import { isFunction, isString } from "../../shared/src";
import { NodeTypes } from "./ast";
import {
  CREATE_ELEMENT_BLOCK,
  helperNameMap,
  TO_DISPLAY_STRING,
} from "./runtimeHelpers";

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

  return { code: context.code };
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
    [(type === NodeTypes.ELEMENT) as any]() {
      genElement(node, context);
    },
    [(type === NodeTypes.COMPOUND_EXPRESSION) as any]() {
      genCompoundExpression(node, context);
    },
  };
  const handler = nodeHandlers[true as any];
  if (isFunction(handler)) {
    handler();
  }
}

/**
 * @author: Zhouqi
 * @description: 生成前导函数代码
 * @param ast
 * @param context
 */
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

/**
 * @author: Zhouqi
 * @description: 生成元素节点的代码字符串
 * @param node
 * @param context
 */
function genElement(node, context) {
  const { push, helper } = context;
  const { tag, children, props } = node;
  push(`${helper(CREATE_ELEMENT_BLOCK)}(`);
  genNodeList(genNullableArgs([tag, props, children]), context);
  push(`)`);
}

function genNullableArgs(args) {
  return args.map((arg) => arg || "null");
}

function genNodeList(nodes, context) {
  const { push } = context;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (isString(node)) {
      push(node);
    } else {
      genNode(node, context);
    }
    if (i < nodes.length - 1) {
      push(", ");
    }
  }
}

/**
 * @author: Zhouqi
 * @description: 生成文本节点的代码字符串
 * @param node
 * @param context
 */
function genText(node, context) {
  const { push } = context;
  push(`'${node.content}'`);
}

/**
 * @author: Zhouqi
 * @description: 生成插值节点的代码字符串
 * @param node
 * @param context
 */
function genInterpolation(node, context) {
  const { push, helper } = context;
  push(`${helper(TO_DISPLAY_STRING)}(`);
  genNode(node.content, context);
  push(`)`);
}

/**
 * @author: Zhouqi
 * @description: 生成插值中的表达式的代码字符串
 * @param node
 * @param context
 */
function genExpression(node, context) {
  context.push(node.content);
}

/**
 * @author: Zhouqi
 * @description: 处理复合节点
 * @param node
 * @param context
 */
function genCompoundExpression(node, context) {
  const { children } = node;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (isString(child)) {
      // +
      context.push(child);
    } else {
      genNode(child, context);
    }
  }
}
