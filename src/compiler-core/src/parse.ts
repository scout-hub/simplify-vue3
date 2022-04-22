/*
 * @Author: Zhouqi
 * @Date: 2022-04-07 21:59:46
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-22 20:25:33
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
 * @param nodes 模板节点
 * @return ast
 */
function createRoot(nodes) {
  return {
    type: NodeTypes.ROOT,
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
  /**
   * 状态机
   */
  while (!isEnd(context, ancestors)) {
    let node;
    const template = context.source;
    if (template.startsWith(options.delimiters[0])) {
      // 插值节点解析
      node = parseInterpolation(context);
    } else if (template[0] === "<") {
      if (template[1] === "!") {
        if (startsWith(template, "<!--")) {
          // 注释节点
          node = parseComment(context);
        }
      } else if (template[1] === "/") {
        // 结束标签，</xx> 有问题，需要抛出异常
        console.warn("没有开始标签");
        // 截掉这个异常的标签后继续解析
        parseTag(context, TagType.End);
        continue;
      } else if (/[a-z]/i.test(template[1])) {
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
  // 例如 <p>div {{ msg }}</p>，此时靠前的结束标记应该是 {{ 而不是 <
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
 * @description: 解析注释节点
 * @param context 模板解析上下文
 */
function parseComment(context) {
  const match = /--(\!)?>/.exec(context.source);
  let content;
  if (match) {
    // <!--123--> ===> 123
    content = context.source.slice(4, match.index);
    // TODO 复杂注释
    advanceBy(context, match.index + 3);
  }
  return {
    type: NodeTypes.COMMENT,
    content,
  };
}

/**
 * @author: Zhouqi
 * @description: 获取文本内容和模板推进
 * @param context 模板解析上下文
 * @return 文本内容
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
  // 如果是自闭合标签则直接返回
  if (element.isSelfClosing) return;

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
  // 正则匹配标签
  const match: any = /^<\/?([a-z][^\t\r\n\f />]*)/i.exec(context.source);
  const tag = match[1];
  // 截掉匹配到的起始内容
  advanceBy(context, match[0].length);
  // 消除无用的空白字符
  advanceSpaces(context);

  const props = parseAttributes(context, type);

  // close tag

  // 是否是自闭合标签 <input />
  let isSelfClosing = false;
  isSelfClosing = startsWith(context.source, "/>");
  // 自闭合标签要截掉2个长度的字符 />，非自闭合截掉一个 >
  advanceBy(context, isSelfClosing ? 2 : 1);

  // 如果是结束标签，直接结束
  if (type === TagType.End) return;

  return {
    // 类型是节点类型
    type: NodeTypes.ELEMENT,
    tag,
    tagType: ElementTypes.ELEMENT,
    isSelfClosing,
    children: [],
    props,
  };
}

/**
 * @author: Zhouqi
 * @description: 解析标签属性
 * @param context 模板解析上下文
 * @param type 标签类型
 * @return 属性
 */
function parseAttributes(context, type) {
  const props: any = [];
  // 存储已经解析过的属性
  const attributeNames = new Set();
  // 当遇到结束标签/自闭合结束标签/模板已经解析完了，则结束解析
  while (
    context.source.length > 0 &&
    !startsWith(context.source, ">") &&
    !startsWith(context.source, "/>")
  ) {
    const attr = parseAttribute(context, attributeNames);
    if (type === TagType.Start) {
      // 起始标签中的属性才需要添加到结果中
      props.push(attr);
    }
    // 截掉空白字符
    advanceSpaces(context);
  }
  return props;
}

/**
 * @author: Zhouqi
 * @description: 解析单个属性
 * @param context 模板解析上下文
 * @param attributeNames 已经解析过的属性集合
 * @return 单个属性解析后的结果
 */
function parseAttribute(context, attributeNames) {
  const match = /^[^\t\r\n\f />][^\t\r\n\f />=]*/.exec(context.source)!;

  // 获取属性名称
  const name = match[0];
  if (attributeNames.has(name)) {
    // 说明出现了重复的属性，需要抛出错误
    console.warn(`the attr ${name} has already defined`);
  }
  attributeNames.add(name);
  // 截掉属性名
  advanceBy(context, name.length);
  // 截掉空白字符
  advanceSpaces(context);
  // 截掉=号
  advanceBy(context, 1);
  // 截掉空白字符
  advanceSpaces(context);

  let value = parseAttributeValue(context);

  // 判断属性是不是v-xxx | @xxx | :xxx | .xxxx | #xxx等vue内部规定的属性定义方式，是的话需要额外进行处理
  if (/^(v-[A-Za-z0-9-]|:|\.|@|#)/.test(name)) {
    const match =
      /(?:^v-([a-z0-9-]+))?(?:(?::|^\.|^@|^#)(\[[^\]]+\]|[^\.]+))?(.+)?$/i.exec(
        name
      )!;

    let dirName;
    if (startsWith(name, ":")) {
      // 属性绑定
      dirName = "bind";
    } else if (startsWith(name, "@")) {
      // 事件绑定
      dirName = "on";
    }

    let arg;
    // match[2]： @click => click :show => show
    if (match[2]) {
      const content = match[2];
      let isStatic = true;

      arg = {
        type: NodeTypes.SIMPLE_EXPRESSION,
        content,
        isStatic,
      };
    }

    return {
      type: NodeTypes.DIRECTIVE,
      name: dirName,
      exp: value && {
        type: NodeTypes.SIMPLE_EXPRESSION,
        content: value.content,
        isStatic: false,
      },
      arg,
    };
  }

  return {
    type: NodeTypes.ATTRIBUTE,
    name,
    value: value && {
      type: NodeTypes.TEXT,
      content: value.content,
    },
  };
}

/**
 * @author: Zhouqi
 * @description: 解析属性值
 * @param context 模板解析上下文
 * @return 属性值
 */
function parseAttributeValue(context) {
  let content;
  const quote = context.source[0];
  const isQuoted = quote === `"` || quote === `'`;
  if (isQuoted) {
    // 截掉起始引号
    advanceBy(context, 1);

    // 如果属性值有引号包裹，则获取引号之间的内容作为属性值
    const endIndex = context.source.indexOf(quote);
    if (endIndex > -1) {
      // 存在结束引号，获取中间内容
      content = parseTextData(context, endIndex);
      // 截掉结束引号
      advanceBy(context, 1);
    } else {
      // 抛出错误
    }
  } else {
    // 处理不是引号包裹的情况
    // 从起始位置到下一个空白字符之前的字符串作为属性值
    const match = /^[^\t\r\n\f >]+/.exec(context.source);
    if (!match) return;
    content = parseTextData(context, match[0].length);
  }
  return {
    content,
    isQuoted,
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
  if (startsWith(template, "</")) {
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

/**
 * @author: Zhouqi
 * @description: 消费空白字符串
 * @param context 模板解析上下文
 * @return {*}
 */
function advanceSpaces(context): void {
  const match = /^[\t\r\n\f ]+/.exec(context.source);
  match && advanceBy(context, match[0].length);
}

function startsWith(source, target) {
  return source.startsWith(target);
}
