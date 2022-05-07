/*
 * @Author: Zhouqi
 * @Date: 2022-05-01 20:15:31
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-05-07 21:56:15
 */
import { PatchFlags } from "@simplify-vue/shared";
import {
  ConstantTypes,
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
  CREATE_ELEMENT_VNODE,
} from "../runtimeHelpers";
import { createStructuralDirectiveTransform } from "../transform";
import { createSimpleExpression } from "../ast";
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

      /**
       * v-for产生的Fragment也是一个block，但它可能不收集动态节点，具体看Fragment是否具有稳定性。
       *
       * v-for产生的Fragment片段也是一个block的原因：
       *
       * <div>
       *  <div v-for="item in arr">{{item}}</div>
       *  <p>{{ p }}</p>
       * </div>
       *
       * 更新前：
       * arr: [1, 2]
       * block = {
       *  tag:'div',
       *  dynamicChildren:[
       *    {tag:'div',children: 1},
       *    {tag:'div',children: 2},
       *    {tag:'p',children: _ctx.p}
       *  ]
       * }
       *
       * 更新后：
       * arr: [1]
       * block = {
       *  tag:'div',
       *  dynamicChildren:[
       *    {tag:'div',children: 1},
       *    {tag:'p',children: _ctx.p}
       *  ]
       * }
       *
       * 假如这个Fragment不是一个block，则动态节点收集情况如上，在更新前后动态子节点数量发生了变化，此时无法进行一对一靶向更新。
       * 那是否可以考虑对dynamicChildren进行传统diff更新？显然也是不行的，因为diff的一个前提是两个同级节点的比较，虽然例子中
       * 的节点都是平级的，但是dynamicChildren收集的可能还包含子孙节点，子孙节点和子节点肯定不是同级的。因此我们需要将Fragment
       * 也设置成block
       *
       * 更新前：
       * block = {
       *  tag:'div',
       *  dynamicChildren:[
       *    {tag: Fragment, children, dynamicChildren:[xxx, xxx]}
       *    {tag:'p',children: _ctx.p}
       *  ]
       * }
       *
       * 更新后：
       * block = {
       *  tag:'div',
       *  dynamicChildren:[
       *    {tag: Fragment, children, dynamicChildren:[xxx]}
       *    {tag:'p',children: _ctx.p}
       *  ]
       * }
       *
       * 将Fragment也设置成block后，这个颗block tree看上去就比较稳定，不管v-for如何变化，block的整体结构还是不变的，注意是结构。
       *
       * 我们将Fragment标记成block后，v-for产生的动态子节点的收集就交给了Fragment，这就又回到了上面这种情况。Fragment 这个block
       * 收集的动态子节点结构可能也是不稳定的。这里就又涉及到Fragment的稳定性：
       *
       * 稳定的Fragment:
       * 更新前后，block的dynamicChildren数组中收集的动态节点数量或者顺序不一致。
       * 例如 v-for="item in [1,2,3]" 遍历的是常量
       *
       * 不稳定的Fragment:
       * 更新前后，block的dynamicChildren数组中收集的动态节点数量或者顺序不一致。
       * 例如 v-for="item in arr"，而arr可能会动态增加或者减少或者改变顺序
       *
       * 对于稳定的Fragment，可以通过dynamicChildren进行靶向更新，
       * 对于不稳定的Fragment只能通过传统的dom diff，对Fragment的children（不是dynamicChildren）进行更新。
       * 显然对一个子block树进行传统diff比对整棵block树（第一个例子）做diff要来的更好。
       *
       * 当然Fragment的children子节点也可以是block，这样对于Fragment的子节点进行更新时依旧可以用靶向更新
       * block = {
       *  tag:'Fragment',
       *  dynamicChildren:[
       *    {tag: xxx', dynamicChildren:[xxx]}
       *    {tag: xxx', dynamicChildren:[xxx]}
       *  ]
       * }
       *
       */

      const isStableFragment =
        forNode.source.type === NodeTypes.SIMPLE_EXPRESSION &&
        forNode.source.constType > ConstantTypes.NOT_CONSTANT;

      // TODO 这里还未做v-for的key绑定，不稳定的情况下暂时标记为UNKEYED_FRAGMENT
      const fragmentFlag = isStableFragment
        ? PatchFlags.STABLE_FRAGMENT
        : PatchFlags.UNKEYED_FRAGMENT;

      forNode.codegenNode = createVnodeCall(
        context,
        helper(FRAGMENT),
        undefined,
        renderExp,
        String(fragmentFlag),
        undefined,
        undefined,
        true, // isBlock
        !isStableFragment // 稳定的fragment可以进行动态子节点的收集，不稳定不需要收集
      );

      return () => {
        const { children } = forNode;
        const childBlock = children[0].codegenNode;
        // 稳定的fragment可以收集动态节点，不需要它的children子节点是一个block去收集动态节点
        // 不稳定fragment不收集动态节点，此时需要它的children子节点是一个block去收集动态节点
        childBlock.isBlock = !isStableFragment;
        if (childBlock.isBlock) {
          helper(OPEN_BLOCK);
          helper(CREATE_ELEMENT_BLOCK);
        } else {
          helper(CREATE_ELEMENT_VNODE);
        }
        renderExp.arguments.push(
          createFunctionExpression(
            createForLoopParams(forNode.parseResult),
            childBlock
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
