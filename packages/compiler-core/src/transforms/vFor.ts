/*
 * @Author: Zhouqi
 * @Date: 2022-05-01 20:15:31
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-05-01 20:42:42
 */
import { NodeTypes } from "../ast";
import { createStructuralDirectiveTransform } from "../transform";
import { createSimpleExpression } from "./transformElement";

const forAliasRE = /([\s\S]*?)\s+(?:in|of)\s+([\s\S]*)/;

export function processFor(node, dir, context, fn) {
  // 获取v-for ast的转化结果
  const parseResult = parseForExpression(dir.exp);
  const { source, key, value } = parseResult;
  const forNode = {
    type: NodeTypes.FOR,
    source,
    valueAlias: value,
    keyAlias: key,
    parseResult,
    children: node.children,
  };
  // 将当前节点替换
  context.replaceNode(forNode);
  const onExist = fn(forNode);
  return () => {
    onExist && onExist();
  };
}

export const transformFor = createStructuralDirectiveTransform(
  "for",
  (node, dir, context) => {
    return processFor(node, dir, context, (forNode) => {
      console.log(forNode);
    });
  }
);
/**
 * @author: Zhouqi
 * @description: 解析v-for表达式
 * @param exp
 * @param context
 */
function parseForExpression(exp) {
  const content = exp.content;
  const forMatch = content.match(forAliasRE);
  if (!forMatch) return;
  // item in arr =====>  ['item in arr', 'item', 'arr', ………………]
  // LHS ===> item; RHS ===> arr
  const [, LHS, RHS] = forMatch;
  const forResult: any = {
    source: createAliasExpression(RHS),
    key: undefined,
    value: undefined,
  };
  // TODO 这里只是处理了key为这种情况，还有（item, index）等其他情况
  if (LHS) {
    forResult.value = createAliasExpression(LHS);
  }
  return forResult;
}

function createAliasExpression(content) {
  return createSimpleExpression(content, false);
}
