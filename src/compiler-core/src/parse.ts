/*
 * @Author: Zhouqi
 * @Date: 2022-04-07 21:59:46
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-09 14:41:36
 */
import { extend } from "../../shared/src";
import { ElementTypes, NodeTypes } from "./ast";

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
  const { options } = context;
  const nodes: any = [];
  let node;

  const template = context.source;
  if (template.startsWith(options.delimiters[0])) {
    // 说明是插值节点
    node = parseInterpolation(context);
  } else if (template[0] === "<") {
    if (/[a-z]/i.test(template[1])) {
      // <div></div>;
      // 解析标签
      node = parseElement(context);
    }
  }

  // node不存在的话默认就是文本节点
  if (!node) {
    node = parseText(context);
  }
  nodes.push(node);
  
  return nodes;
}

/**
 * @author: Zhouqi
 * @description: 解析文本节点
 * @param context 模板解析上下文
 * @return 解析后的节点对象
 */
function parseText(context) {
  const content = parseTextData(context, context.source.length);

  return {
    type: NodeTypes.TEXT,
    content,
  };
}

/**
 * @author: Zhouqi
 * @description: 获取文本内容和模板推进
 * @param context 模板解析上下文
 * @return {*}
 */
function parseTextData(context, length) {
  const content = context.source.slice(0, length);
  advanceBy(context, length);
  return content;
}

/**
 * @author: Zhouqi
 * @description: 解析标签
 * @param context 模板解析上下文
 * @return 解析后的节点对象
 */
function parseElement(context) {
  const tag = parseTag(context, TagType.Start);
  parseTag(context, TagType.End);
  return tag;
}

/**
 * @author: Zhouqi
 * @description: 解析标签
 * @param context 模板解析上下文
 * @param type 标签类型：起始标签/结束标签
 * @return 解析后的标签数据
 */
function parseTag(context, type: TagType) {
  const match: any = /^<\/?([a-z]*)/i.exec(context.source);
  const tag = match[1];
  advanceBy(context, match[0].length);
  advanceBy(context, 1);

  // 如果是结束标签，直接结束
  if (type === TagType.End) return;

  return {
    // 类型是节点类型
    type: NodeTypes.ELEMENT,
    tag,
    tagType: ElementTypes.ELEMENT,
  };
}

/**
 * @author: Zhouqi
 * @description: 解析插值语法
 * @param context 模板解析上下文
 * @return 解析后的节点对象
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
  const rawContent = parseTextData(context, contentLength);
  const content = rawContent.trim();
  // 截掉已经解析过的部分
  advanceBy(context, closeDelimiters.length);

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

/**
 * @author: Zhouqi
 * @description: 辅助模板截取（模板推进）
 * @param context 模板解析上下文
 * @param sliceStart 开始截取的位置
 */
function advanceBy(context, sliceStart) {
  context.source = context.source.slice(sliceStart);
}

const enum TagType {
  Start,
  End,
}
