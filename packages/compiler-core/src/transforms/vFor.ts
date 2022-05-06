/*
 * @Author: Zhouqi
 * @Date: 2022-05-01 20:15:31
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-05-06 20:38:36
 */
import { PatchFlags } from "@simplify-vue/shared";
import {
  createCallExpression,
  createFunctionExpression,
  createVnodeCall,
  NodeTypes,
} from "../ast";
import {
  FRAGMENT,
  OPEN_BLOCK,
  RENDER_LIST,
  CREATE_ELEMENT_BLOCK,
} from "../runtimeHelpers";
import { createStructuralDirectiveTransform } from "../transform";
import { createSimpleExpression } from "./transformElement";
import { processExpression } from "./transformExpression";

const forAliasRE = /([\s\S]*?)\s+(?:in|of)\s+([\s\S]*)/;

export function processFor(node, dir, context, fn) {
  const { addIdentifiers } = context;
  // 获取v-for ast的转化结果
  const parseResult = parseForExpression(dir.exp, context);
  const { source, key, value } = parseResult;
  const forNode = {
    type: NodeTypes.FOR,
    source,
    valueAlias: value,
    keyAlias: key,
    parseResult,
    children: [node],
  };
  // 将当前节点替换
  context.replaceNode(forNode);

  //  添加作用域标识符变量，比如：item in arr中的item变量可能会在模板中的插值表达式中使用，那么插值表达式中的item就应该取v-for中的item而不是ctx
  value && addIdentifiers(value);

  const onExist = fn(forNode);
  return () => {
    onExist && onExist();
  };
}

export const transformFor = createStructuralDirectiveTransform(
  "for",
  (node, dir, context) => {
    const { helper } = context;
    return processFor(node, dir, context, (forNode) => {
      const renderExp = createCallExpression(helper(RENDER_LIST), [
        forNode.source,
      ]);

      // TODO 这里还未做v-for的key绑定
      const fragmentFlag = PatchFlags.UNKEYED_FRAGMENT;

      // v-for生成的Fragment也是一个block，但它可能不收集动态节点（是否是稳定的Fragment，这里还需要理解）
      forNode.codegenNode = createVnodeCall(
        context,
        helper(FRAGMENT),
        undefined,
        renderExp,
        String(fragmentFlag),
        undefined,
        undefined,
        true, // isBlock
        true // TODO
      );

      return () => {
        const { children } = forNode;
        helper(OPEN_BLOCK);
        helper(CREATE_ELEMENT_BLOCK);
        renderExp.arguments.push(
          createFunctionExpression(
            createForLoopParams(forNode.parseResult),
            children[0]
          )
        );
      };
    });
  }
);

/**
 * @author: Zhouqi
 * @description: 解析v-for表达式
 * @param exp
 * @param context
 */
function parseForExpression(exp, context) {
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
    index: undefined,
  };
  forResult.source = processExpression(forResult.source, context);

  // TODO 这里只是处理了key为这种情况，还有（item, index）等其他情况
  if (LHS) {
    forResult.value = createAliasExpression(LHS);
    // forResult.value = processExpression(forResult.value);
  }
  return forResult;
}

function createAliasExpression(content) {
  return createSimpleExpression(content, false);
}

export function createForLoopParams({ value, key }) {
  return createParamsList([value, key]);
}

function createParamsList(args) {
  // TODO 这里暂时只处理只有item的情况（item in arr）
  return [args[0]];
}
