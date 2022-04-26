/*
 * @Author: Zhouqi
 * @Date: 2022-04-09 21:13:43
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-26 09:37:36
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

import { isArray, isFunction, isString } from "@simplify-vue/shared";
import { NodeTypes } from "./ast";
import {
  CREATE_ELEMENT_BLOCK,
  CREATE_ELEMENT_VNODE,
  helperNameMap,
  OPEN_BLOCK,
  TO_DISPLAY_STRING,
  WITH_DIRECTIVES,
} from "./runtimeHelpers";

export function generate(ast, options = {}) {
  const context = createCodegenContext(ast, options);

  // 生成前导：例如 const { toDisplayString: _toDisplayString, openBlock: _openBlock, createElementBlock: _createElementBlock } = Vue
  genFunctionPreamble(ast, context);

  const { push, newLine } = context;
  const functionName = "render";
  const args = ["_ctx", "_cache", "$props", "$setup", "$data", "$options"].join(
    ", "
  );
  push(`function ${functionName}(${args}) { `);
  newLine();
  push(`return `);
  genNode(ast.codegenNode, context);
  push(`}`);

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
    runtimeGlobalName: `Vue`,
    // 最终的代码字符串
    code: ``,
    // 字符串拼接操作
    push(text) {
      context.code += text;
    },
    newLine() {
      context.push(`\n      `);
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
      // 文本
      genText(node, context);
    },
    [(type === NodeTypes.INTERPOLATION) as any]() {
      // 插值
      genInterpolation(node, context);
    },
    [(type === NodeTypes.SIMPLE_EXPRESSION) as any]() {
      // 值，例如属性名、属性值
      genExpression(node, context);
    },
    [(type === NodeTypes.ELEMENT) as any]() {
      // 元素
      genNode(node.codegenNode, context);
    },
    [(type === NodeTypes.COMPOUND_EXPRESSION) as any]() {
      // 复合类型 text+{{}}
      genCompoundExpression(node, context);
    },
    [(type === NodeTypes.VNODE_CALL) as any]() {
      genVNodeCall(node, context);
    },
    [(type === NodeTypes.TEXT_CALL) as any]() {
      // 节点
      genNode(node.codegenNode, context);
    },
    [(type === NodeTypes.JS_CALL_EXPRESSION) as any]() {
      genCallExpression(node, context);
    },
    [(type === NodeTypes.JS_OBJECT_EXPRESSION) as any]() {
      // 属性
      genObjectExpression(node, context);
    },
    [(type === NodeTypes.JS_ARRAY_EXPRESSION) as any]() {
      // 指令
      genArrayExpression(node, context);
    },
  };
  const handler = nodeHandlers[true as any];
  if (isFunction(handler)) {
    handler();
  }
}

function genArrayExpression(node, context) {
  genNodeListAsArray(node.elements, context);
}

function genObjectExpression(node, context) {
  const { push } = context;
  const { properties } = node;
  push(`{ `);
  for (let i = 0; i < properties.length; i++) {
    const { key, value } = properties[i];
    // 处理key
    genExpressionAsPropertyKey(key, context);
    push(`: `);
    // 处理value
    genNode(value, context);
    // {xx:xxx, saa:saa}
    if (i < properties.length - 1) {
      push(`,`);
    }
  }
  push(`} `);
}

/**
 * @author: Zhouqi
 * @description: 处理属性key
 * @param key
 * @param context
 */
function genExpressionAsPropertyKey(key, context) {
  const { push } = context;
  const text = key.content;
  push(text);
}

/**
 * @author: Zhouqi
 * @description: 处理多子节点中含有文本/插值表达式的情况
 * @param node
 * @param context
 */
function genCallExpression(node, context) {
  const { push, helper } = context;
  const callee = isString(node.callee) ? node.callee : helper(node.callee);
  push(callee + `(`);
  // 处理节点
  genNodeList(node.arguments, context);
  push(`)`);
}

// 处理虚拟节点
function genVNodeCall(node, context) {
  const { push, helper } = context;
  const { isBlock, tag, props, children, directives } = node;
  if (directives) {
    push(helper(WITH_DIRECTIVES) + `(`);
  }
  if (isBlock) {
    push(`(${helper(OPEN_BLOCK)}(${``}), `);
  }
  const callHelper = isBlock ? CREATE_ELEMENT_BLOCK : CREATE_ELEMENT_VNODE;
  push(helper(callHelper) + `(`);
  genNodeList(genNullableArgs([tag, props, children]), context);
  push(`)`);
  if (isBlock) {
    push(`)`);
  }
  if (directives) {
    push(`, `);
    genNode(directives, context);
    push(`)`);
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
 * @description: 把不存在的属性都变成null
 * @param args 属性
 * @return 处理后的属性
 */
function genNullableArgs(args) {
  return args.map((arg) => arg || "null");
}

/**
 * @author: Zhouqi
 * @description: 处理孩子节点
 * @param nodes
 * @param context
 */
function genNodeListAsArray(nodes, context) {
  // 子节点需要加上[]包裹 h('xx',null, [children])
  context.push(`[`);
  genNodeList(nodes, context);
  context.push(`]`);
}

/**
 * @author: Zhouqi
 * @description: 处理列表形式的节点  ['p', props ,children]
 * @param nodes 列表形式的节点
 * @param context
 */
function genNodeList(nodes, context) {
  const { push } = context;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (isString(node)) {
      push(node);
    } else if (isArray(node)) {
      // 处理孩子节点
      genNodeListAsArray(node, context);
    } else {
      genNode(node, context);
    }
    if (i < nodes.length - 1) {
      push(`, `);
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
  context.push(JSON.stringify(node.content));
}

/**
 * @author: Zhouqi
 * @description: 处理插值节点
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
  const { isStatic, content } = node;
  // 静态静态节点转换成字符串
  context.push(isStatic ? JSON.stringify(content) : content);
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
