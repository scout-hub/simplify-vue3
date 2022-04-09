/*
 * @Author: Zhouqi
 * @Date: 2022-04-07 21:59:46
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-09 16:45:34
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

  return createRoot(parseChildren(context, []));
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
 * @param ancestors 存储节点层级关系栈
 * @return 模板子节点
 */
function parseChildren(context, ancestors) {
  const { options } = context;
  const nodes: any = [];
  while (!isEnd(context, ancestors)) {
    let node;
    const template = context.source;
    if (template.startsWith(options.delimiters[0])) {
      // 说明是插值节点
      node = parseInterpolation(context);
    } else if (template[0] === "<") {
      if (/[a-z]/i.test(template[1])) {
        // 解析标签
        node = parseElement(context, ancestors);
      }
    }

    // node不存在的话默认就是文本节点
    if (!node) {
      node = parseText(context);
    }
    nodes.push(node);
  }

  return nodes;
}

/**
 * @author: Zhouqi
 * @description: 解析文本节点
 * @param context 模板解析上下文
 * @return 解析后的节点对象
 */
function parseText(context) {
  // 遇到结束截取的标记：
  // 1、结束标签
  // 2、插值模板结束标记
  const endTokens = ["<", context.options.delimiters[0]];
  // 默认截取长度为模板长度
  let endIndex = context.source.length;

  // 遍历模板中的结束标记，找到位置最靠前的结束标记的索引，这个索引就是需要截取的结束位置
  for (let i = 0; i < endTokens.length; i++) {
    const endToken = endTokens[i];
    const index = context.source.indexOf(endToken);
    if (index !== -1 && endIndex > index) {
      endIndex = index;
    }
  }

  const content = parseTextData(context, endIndex);

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
 * @param ancestors 存储节点层级关系栈
 * @return 解析后的节点对象
 */
function parseElement(context, ancestors) {
  const element: any = parseTag(context, TagType.Start);
  ancestors.push(element);
  // 递归处理子节点
  element.children = parseChildren(context, ancestors);
  ancestors.pop();

  // 判断模板是否合法，比如只有起始标签，没有结束标签，则直接抛出错误
  if (startsWithEndTagOpen(context.source, element.tag)) {
    parseTag(context, TagType.End);
  } else {
    throw "缺少结束标签" + element.tag;
  }
  return element;
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

/**
 * @author: Zhouqi
 * @description: 模板解析结束的标志
 * @param context 模板解析上下文
 * @param ancestors 根节点标记
 * @param ancestors 存储节点层级关系栈
 * @return 模板是否继续解析的标记
 */
function isEnd(context, ancestors) {
  const template = context.source;
  // 1. 模板字符串开头为结束标签
  if (template.startsWith("</")) {
    // 当遇到结束标签时去配置之前记录的起始标签，如果匹配到了则结束模板的遍历，避免死循环，例如：<div><span></div>
    for (let i = ancestors.length - 1; i >= 0; i--) {
      const tag = ancestors[i].tag;
      if (startsWithEndTagOpen(template, tag)) {
        return true;
      }
    }
  }

  // 2. 模板字符串为空
  return !template;
}

/**
 * @author: Zhouqi
 * @description: 判断模板是否匹配到某一个结束标签
 * @param source 模板字符串
 * @param tag 标签
 * @return 是否匹配到
 */
function startsWithEndTagOpen(source: string, tag: string): boolean {
  return (
    startsWith(source, "</") &&
    source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase()
  );
}

function startsWith(source, target) {
  return source.startsWith(target);
}
