/*
 * @Author: Zhouqi
 * @Date: 2022-05-01 20:15:31
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-05-07 16:55:35
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

// copy from vue-core
const forAliasRE = /([\s\S]*?)\s+(?:in|of)\s+([\s\S]*)/;
const stripParensRE = /^\(|\)$/g;
const forIteratorRE = /,([^,\}\]]*)(?:,([^,\}\]]*))?$/;

export function processFor(node, dir, context, fn) {
  const { addIdentifiers } = context;
  // 获取v-for ast的转化结果
  const parseResult = parseForExpression(dir.exp, context);
  const { source, key, value, index } = parseResult;
  const forNode = {
    type: NodeTypes.FOR,
    source,
    valueAlias: value,
    keyAlias: key,
    parseResult,
    objectIndexAlias: index,
    children: [node],
  };
  // 将当前节点替换
  context.replaceNode(forNode);

  //  添加作用域标识符变量，比如：item in arr中的item变量可能会在模板中的插值表达式中使用，那么插值表达式中的item就应该取v-for中的item而不是ctx
  value && addIdentifiers(value);
  key && addIdentifiers(key);

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

  // (value,key,index) in obj / (value,index) in arr
  let valueContent = LHS.replace(stripParensRE, ""); // value,key,index
  const iteratorMatch = valueContent.match(forIteratorRE);

  // 多个参数的情况会进入这里
  if (iteratorMatch) {
    // 对象情况下为value, key，index，数组情况下只有value, index
    valueContent = valueContent.replace(forIteratorRE, "").trim(); // value
    const keyContent = iteratorMatch[1].trim(); // key(index)
    if (keyContent) {
      forResult.key = createAliasExpression(keyContent);
    }
    // TODO存在第三个参数的情况下，v-for对象
    // if (iteratorMatch[2]) {
    //   const indexValue = iteratorMatch[2].trim();
    // }
  }

  if (valueContent) {
    forResult.value = createAliasExpression(valueContent);
  }

  return forResult;
}

function createAliasExpression(content) {
  return createSimpleExpression(content, false);
}

export function createForLoopParams({ value, key }) {
  return createParamsList([value, key]);
}

/**
 * @author: Zhouqi
 * @description: 创建函数参数列表
 * @param args
 * @return 参数列表
 */
function createParamsList(args) {
  // TODO 这里暂时只处理数组情况 (item,index) in arr
  let i = args.length;
  // 找到值存在的部分，剔除undefined的数据
  while (i--) {
    if (args[i]) break;
  }
  return args.slice(0, i + 1);
}
