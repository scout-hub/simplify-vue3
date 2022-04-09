/*
 * @Author: Zhouqi
 * @Date: 2022-04-07 21:59:46
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-09 13:38:42
 */
import { extend } from "../../shared/src";
import { NodeTypes } from "./ast";

// 默认的解析配置
export const defaultParserOptions = {
  delimiters: ["{{", "}}"],
};

/**
 * @author: Zhouqi
 * @description: 模板解析
 * @param template 模板字符串
 * @return ast对象
 */
export function baseParse(template: string) {
  const context = createParserContext(template);

  return createRoot(parseChildren(context));
}

/**
 * @author: Zhouqi
 * @description: 创建模板解析上下文对象
 * @param template 模板字符串
 * @return 模板上下文对象
 */
function createParserContext(template: string) {
  const options = extend({}, defaultParserOptions);
  return {
    options,
    source: template,
  };
}

/**
 * @author: Zhouqi
 * @description:
 * @param {*} nodes
 * @return {*}
 */
function createRoot(nodes) {
  return {
    children: nodes,
  };
}

/**
 * @author: Zhouqi
 * @description: 解析模板子节点
 * @param context 模板解析上下文对象
 * @return 模板子节点
 */
function parseChildren(context) {
  const { options, source: template } = context;
  const nodes: any = [];
  let node;
  if (template.startsWith(options.delimiters[0])) {
    // 说明是插值节点
    node = parseInterpolation(context);
  }
  nodes.push(node);
  return nodes;
}

/**
 * @author: Zhouqi
 * @description: 解析插值语法
 * @param context 插值模板
 * @return 解析后的节点
 */
function parseInterpolation(context) {
  // template {{ message }}.
  const [openDelimiters, closeDelimiters] = context.options.delimiters;
  const openDelimitersLength = openDelimiters.length;

  const closeDelimitersIndex = context.source.indexOf(
    closeDelimiters,
    openDelimitersLength
  );

  if (closeDelimitersIndex === -1) {
    // 说明没有结束标签
    return;
  }

  // 获取插值内容的长度
  const contentLength = closeDelimitersIndex - openDelimitersLength;
  // 截掉起始插值标签
  advanceBy(context, openDelimitersLength);
  const rawContent = context.source.slice(0, contentLength);
  const content = rawContent.trim();
  // 截掉已经解析过的部分
  advanceBy(context, contentLength + closeDelimiters.length);

  return {
    // 类型是插值节点
    type: NodeTypes.INTERPOLATION,
    content: {
      // 内容是简单表达式
      type: NodeTypes.SIMPLE_EXPRESSION,
      // 非静态节点，也就是内容会变化
      isStatic: false,
      // 插值内容
      content,
    },
  };
}

function advanceBy(context, openDelimitersLength) {
  context.source = context.source.slice(openDelimitersLength);
}
