/*
 * @Author: Zhouqi
 * @Date: 2022-04-09 23:38:10
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-23 11:27:05
 */
import { NodeTypes } from "../ast";

export function transformExpression(node) {
  if (node.type === NodeTypes.INTERPOLATION) {
    node.content = processExpression(node.content);
  } else if (node.type === NodeTypes.ELEMENT) {
    // 处理普通元素上的指令
    const { props } = node;
    for (let i = 0; i < props.length; i++) {
      const dir = props[i];
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

function processExpression(node) {
  node.content = `_ctx.${node.content}`;
  return node;
}
