/*
 * @Author: Zhouqi
 * @Date: 2022-04-09 23:38:10
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-05-02 22:10:49
 */
import { createCompoundExpression, NodeTypes } from "../ast";
import { parse } from "@babel/parser";
import { isSimpleIdentifier } from "../utils";
import { walkIdentifiers } from "../babelUtils";
import { createSimpleExpression } from "./transformElement";

export function transformExpression(node) {
  if (node.type === NodeTypes.INTERPOLATION) {
    node.content = processExpression(node.content);
  } else if (node.type === NodeTypes.ELEMENT) {
    // 处理普通元素上的指令
    const { props } = node;
    for (let i = 0; i < props.length; i++) {
      const dir = props[i];
      // 对于v-for包裹的插值不需要加ctx
      if (dir.type === NodeTypes.DIRECTIVE) {
        const { exp } = dir;

        // 处理动态属性值
        if (exp && exp.type === NodeTypes.SIMPLE_EXPRESSION) {
          dir.exp = processExpression(exp);
        }
      }
    }
  }
}

export function processExpression(node) {
  /**
   * 对于普通的插值content，例如：{{item}}，只需要返回ctx.item即可
   * 对于{{item.flag}}这种多重取值或者复杂表达式会进行分词，即将item.flag
   * 分为item . flag然后逐一进行操作，这里通过@babel/parser去进行代码字符串的解析
   * 然后通过es-walker进行ast的遍历处理
   */
  const content = node.content;
  if (isSimpleIdentifier(content)) {
    node.content = `_ctx.${content}`;
  }
  const ast = parse(`(${content})`);
  const ids: any = [];
  walkIdentifiers(ast, (node, isReferenced) => {
    if (isReferenced) {
      node.name = `_ctx.${node.name}`;
    }
    ids.push(node);
  });
  const children: any = [];
  ids.forEach((id, i) => {
    const { start, name } = id;
    const last = ids[i - 1];
    // 截取单词之前的符号，截取方式是：在遍历到下一个单词时，对前一个单词尾部的下一位开始到当前单词的第一位
    const leadingText = content.slice(last ? last.end - 1 : 0, start - 1);
    if (leadingText) {
      children.push(leadingText);
    }
    children.push(createSimpleExpression(name, false));
  });
  if (children.length) {
    return createCompoundExpression(children);
  }
  return node;
}
