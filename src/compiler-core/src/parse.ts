/*
 * @Author: Zhouqi
 * @Date: 2022-04-07 21:59:46
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-08 19:38:53
 */
import { NodeTypes } from "./ast";

/**
 * @author: Zhouqi
 * @description: 模板解析
 * @param {string} template 模板字符串
 * @return {*}
 */
export function baseParse(template: string) {
  const context = createParserContext(template);
  parseChildren(context);
  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content: `message`,
    },
  };
}

/**
 * @author: Zhouqi
 * @description: 创建模板解析上下文对象
 * @param {string} template 模板字符串
 * @return {*}
 */
function createParserContext(template: string) {
  return {
    source: template,
  };
}

/**
 * @author: Zhouqi
 * @description: 解析模板子节点
 * @param {object} context 模板解析上下文对象
 * @return {Array} 模板子节点
 */
function parseChildren(context: { source: string }): any[] {
  const nodes = [];
  return nodes;
}
