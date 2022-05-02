/*
 * @Author: Zhouqi
 * @Date: 2022-04-09 23:38:10
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-05-02 20:55:20
 */
import { NodeTypes } from "../ast";
import parse from "@babel/parser";
import { isSimpleIdentifier } from "../utils";

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
   * 分为item . flag然后逐一进行操作，这里分词解析用到@babel/parser
   */
  const content = node.content;
  if (isSimpleIdentifier(content)) {
    node.content = `_ctx.${content}`;
  }
  return node;
}
