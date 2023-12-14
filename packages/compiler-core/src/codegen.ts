/*
 * @Author: Zhouqi
 * @Date: 2022-04-09 21:13:43
 * @LastEditors: Zhouqi
 * @LastEditTime: 2023-12-14 16:39:30
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
 *
 * v-if/v-else-if/v-else
 * import { openBlock as _openBlock, createElementBlock as _createElementBlock, createCommentVNode as _createCommentVNode } from "vue"
 * export function render(_ctx, _cache, $props, $setup, $data, $options) {
 *   return (_ctx.show)
 *     ? (_openBlock(), _createElementBlock("div", { key: 0 }, "Hello World"))
 *     : (_ctx.name)
 *       ? (_openBlock(), _createElementBlock("div", { key: 1 }, "123"))
 *       : (_openBlock(), _createElementBlock("div", { key: 2 }, "1234"))
 * }
 */

import { isArray, isString, isSymbol } from "@simplify-vue/shared";
import { NodeTypes } from "./ast";
import {
  CREATE_COMMENT,
  helperNameMap,
  OPEN_BLOCK,
  RESOLVE_COMPONENT,
  TO_DISPLAY_STRING,
  WITH_DIRECTIVES,
} from "./runtimeHelpers";
import {
  getVNodeBlockHelper,
  getVNodeHelper,
  isSimpleIdentifier,
} from "./utils";

export function generate(ast, options = {}) {
  const context = createCodegenContext(ast, options);

  genFunctionPreamble(ast, context);

  const { push, indent } = context;
  const functionName = "render";
  const args = ["_ctx"].join(", ");
  push(`function ${functionName}(${args}) { `);
  indent();

  if (ast.components.length) {
    genAssets(ast.components, "component", context);
  }

  push(`return `);
  genNode(ast.codegenNode, context);
  push(`}`);
  return { code: context.code };
}

function genAssets(assets, type, context) {
  const { helper, push, newline } = context;
  const resolver = helper(RESOLVE_COMPONENT);
  for (let i = 0; i < assets.length; i++) {
    const id = assets[i];
    push(`const _${type}_${id} = ${resolver}(${JSON.stringify(id)})`);
    newline();
  }
}

/**
 * @author: Zhouqi
 * @description: 创建codegen上下文
 * @param ast
 * @param options
 * @return 上下文对象
 */
function createCodegenContext(ast, options) {
  const context = {
    runtimeGlobalName: `Vue`,
    indentLevel: 0,
    // 最终的代码字符串
    code: ``,
    // 字符串拼接操作
    push(text) {
      context.code += text;
    },
    indent() {
      newline(++context.indentLevel);
    },
    newline() {
      newline(context.indentLevel);
    },
    helper(key) {
      return `_${helperNameMap[key]}`;
    },
  };

  /**
   * @author: Zhouqi
   * @description: 换行缩进
   * @param n 锁进长度
   */
  function newline(n: number) {
    context.push("\n" + `  `.repeat(n));
  }

  return context;
}

/**
 * @author: Zhouqi
 * @description: 根据ast生成节点
 * @param node astNode
 */
function genNode(node, context) {
  if (isSymbol(node)) {
    context.push(context.helper(node));
    return;
  }
  const { type } = node;
  switch (type) {
    case NodeTypes.TEXT:
      genText(node, context);
      break;
    case NodeTypes.INTERPOLATION:
      genInterpolation(node, context);
      break;
    case NodeTypes.SIMPLE_EXPRESSION:
      genExpression(node, context);
      break;
    case NodeTypes.ELEMENT:
    case NodeTypes.TEXT_CALL:
    case NodeTypes.IF:
    case NodeTypes.FOR:
      genNode(node.codegenNode, context);
      break;
    case NodeTypes.COMPOUND_EXPRESSION:
      genCompoundExpression(node, context);
      break;
    case NodeTypes.VNODE_CALL:
      genVNodeCall(node, context);
      break;
    case NodeTypes.JS_CALL_EXPRESSION:
      genCallExpression(node, context);
      break;
    case NodeTypes.JS_OBJECT_EXPRESSION:
      genObjectExpression(node, context);
      break;
    case NodeTypes.JS_ARRAY_EXPRESSION:
      genArrayExpression(node, context);
      break;
    case NodeTypes.JS_CONDITIONAL_EXPRESSION:
      genConditionalExpression(node, context);
      break;
    case NodeTypes.JS_FUNCTION_EXPRESSION:
      genFunctionExpression(node, context);
      break;
    case NodeTypes.COMMENT:
      genComment(node, context)
      break
  }
}

/**
 * @author: Zhouqi
 * @description: 处理注释节点
 */
function genComment(node, context) {
  const { push, helper } = context
  push(`${helper(CREATE_COMMENT)}(${JSON.stringify(node.content)})`, node);
}

function genFunctionExpression(node, context) {
  const { push, indent } = context;
  const { params, returns } = node;
  push(`(`, node);
  genNodeList(params, context);
  push(`) => `);
  push(`{`);
  indent();
  if (returns) {
    push(`return `);
    genNode(returns, context);
  }
  indent();
  push(`}`);
}

function genConditionalExpression(node, context) {
  const { test, consequent, alternate } = node;
  const { push, indent } = context;
  // 处理简单表达式，例如 xxx
  if (test.type === NodeTypes.SIMPLE_EXPRESSION) {
    genExpression(test, context);
  } else {
    // 处理复杂表达式，例如 aaa.bbb
    push(`(`);
    genNode(test, context);
    push(`)`);
  }
  push(`? `);
  indent();
  genNode(consequent, context);
  context.indentLevel--;
  push(`: `);
  indent();
  genNode(alternate, context);
}

function genArrayExpression(node, context) {
  genNodeListAsArray(node.elements, context);
}

function genObjectExpression(node, context) {
  const { push, newline } = context;
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
      newline();
    }
  }
  push(`} `);
}

/**
 * @author: Zhouqi
 * @description: 处理属性key
 * @param node
 * @param context
 */
function genExpressionAsPropertyKey(node, context) {
  const { push } = context;
  if (node.isStatic) {
    const text = isSimpleIdentifier(node.content)
      ? node.content
      : JSON.stringify(node.content);
    push(text, node);
  } else {
    push(node.content);
  }
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
  genNodeList(node.arguments, context);
  push(`)`);
}

function genVNodeCall(node, context) {
  const { push, helper } = context;
  // TODO patchFlag不存在暂时标记为-2
  const {
    isBlock,
    tag,
    props,
    children,
    directives,
    patchFlag = "-2",
    dynamicProps,
    disableTracking,
    isComponent,
  } = node;
  if (directives) {
    push(helper(WITH_DIRECTIVES) + `(`);
  }

  if (isBlock) {
    push(`(${helper(OPEN_BLOCK)}(${disableTracking ? `true` : ``}), `);
  }

  const callHelper = isBlock
    ? getVNodeBlockHelper(isComponent)
    : getVNodeHelper(isComponent);

  push(helper(callHelper) + `(`);

  genNodeList(
    genNullableArgs([tag, props, children, patchFlag, dynamicProps]),
    context
  );
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
  const { push, runtimeGlobalName, newline } = context;
  const { helpers } = ast;
  const aliasHelper = (s: symbol) =>
    `${helperNameMap[s]}: _${helperNameMap[s]}`;

  if (helpers.length) {
    push(
      `const { ${helpers.map(aliasHelper).join(", ")} } = ${runtimeGlobalName};`
    );
  }
  newline();
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
