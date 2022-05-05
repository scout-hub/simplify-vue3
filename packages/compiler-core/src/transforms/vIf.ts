/*
 * @Author: Zhouqi
 * @Date: 2022-04-26 21:19:36
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-05-05 22:37:38
 */
import {
  createCallExpression,
  createConditionalExpression,
  NodeTypes,
} from "../ast";
import { CREATE_COMMENT } from "../runtimeHelpers";
import {
  createStructuralDirectiveTransform,
  makeBlock,
  traverseNode,
} from "../transform";
import { injectProp } from "../utils";
import {
  createObjectProperty,
  createSimpleExpression,
} from "./transformElement";
import { processExpression } from "./transformExpression";

// v-if指令转换器
export const transformIf = createStructuralDirectiveTransform(
  /^(if|else|else-if)$/,
  (node, dir, context) => {
    return processIf(node, dir, context, (ifNode, branch, isRoot) => {
      const siblings = context.parent!.children;
      let i = siblings.indexOf(ifNode);
      let key = 0;
      /**
       * 为if/else分支生成不同的key，保证动态vif block节点在vif条件值变化时正常更新。
       * 例如：
       * <div v-if="show">
            <span>{{name}}</span>
         </div>
         <div v-else>
            <p>
              <span>{{name}}</span>
            </p>
         </div>
         假如没有为每一个if/else分支生成不同的key，那么收集到的vIf block树都是['div', null, children, dynamicChildren]
         每一个vif block树收集到的动态子节点也都是['span', null, ctx.name]，此时不管show的值如何变化dom都不会正常更新（PS：即使name变了
         也只是改变了文本子节点，缺少的p标签不会被更新，因为p是一个静态节点）。因为收集到的新旧动态节点一摸一样，但实际上v-else的结构跟v-if是不同的，
         但是由于收集动态节点时不考虑vnode的层级，所以会出现这样的问题。因此我们需要为每一个if/else分支生成一个动态递增的key，保证条件值变化时dom能正常更新。
       */
      while (i-- >= 0) {
        /**
         * 同级情况下可能存在多个if/else分支，需要为每一个if/else分支初始化不同的key，保证不重复
         * 例如:
         * <div v-if="show">1</div>
         * <div v-if="show1">2</div>
         * <div v-if="show2">3</div>
         * <div v-else>4</div>
         * 此时v-if=“show2"的if/else分支的初始key应该是2，因为之前有两个if分支，他们占用了值为0和1的key
         */
        const sibling = siblings[i];
        if (sibling && sibling.type === NodeTypes.IF) {
          key += sibling.branches.length;
        }
      }
      return () => {
        if (isRoot) {
          // v-if
          ifNode.codegenNode = createCodegenNodeForBranch(branch, key, context);
        } else {
          // 找到if类型节点
          const parentCondition = getParentCondition(ifNode.codegenNode);
          // 修改v-if表达式为false时要渲染的节点内容，即渲染v-else节点
          parentCondition.alternate = createCodegenNodeForBranch(
            branch,
            key + ifNode.branches.length - 1,
            context
          );
        }
      };
    });
  }
);

function processIf(node, dir, context, fn?) {
  const { name, exp } = dir;
  if (exp) {
    dir.exp = processExpression(exp, context);
  }

  if (name === "if") {
    // 处理 if
    const branch = createIfBranch(node, dir);
    const ifNode = {
      type: NodeTypes.IF,
      branches: [branch],
    };
    context.replaceNode(ifNode);
    if (fn) {
      return fn(ifNode, branch, true);
    }
  } else {
    // TODO v-else
    const siblings = context.parent.children;
    // 从子节点数组中找到v-else节点的位置，该位置之前的节点应该是v-if/v-else-if节点
    let i = siblings.indexOf(node);
    while (i-- >= -1) {
      // 向前查找v-if/v-else-if节点
      const sibling = siblings[i];
      // 如果前一个节点v-if节点
      if (sibling && sibling.type === NodeTypes.IF) {
        // 将当前节点移动的v-if节点的branchs中
        // 移动的步骤：
        // 1、从父节点的children中移除当前节点
        // 2、将当前节点移动到v-if节点的branches中
        context.removeNode();
        const branch = createIfBranch(node, dir);
        sibling.branches.push(branch);

        const onExit = fn && fn(sibling, branch, false);
        // 由于当前branch添加到了v-if的branches中，接下去执行时该branch无法正常走traverseNode
        // 因此这里需要执行一下traverseNode
        traverseNode(branch, context);
        onExit && onExit();
        // 清除当前节点
        context.currentNode = null;
        break;
      }
    }
  }
}

function createIfBranch(node, dir) {
  return {
    type: NodeTypes.IF_BRANCH,
    condition: dir.name === "else" ? undefined : dir.exp,
    children: [node],
  };
}

function createCodegenNodeForBranch(branch, keyIndex, context) {
  if (branch.condition) {
    return createConditionalExpression(
      branch.condition,
      // 表达式是true时需要创建的元素ast
      createChildrenCodegenNode(branch, keyIndex, context),
      // 表达式是false时创建的注释节点ast
      createCallExpression(context.helper(CREATE_COMMENT), ['"v-if"', "true"])
    );
  } else {
    return createChildrenCodegenNode(branch, keyIndex, context);
  }
}

function createChildrenCodegenNode(branch, keyIndex, context) {
  const ret = branch.children[0].codegenNode;
  // 为v-if/else分支节点创建key属性
  const keyProperty = createObjectProperty(
    `key`,
    createSimpleExpression(`${keyIndex}`, false)
  );
  if (ret.type === NodeTypes.VNODE_CALL) {
    makeBlock(ret, context);
  }
  injectProp(ret, keyProperty);
  return ret;
}

// 查找父级节点
function getParentCondition(ifNode) {
  // 当找当前v-else-if/v-else ast节点的父级ast节点（v-if/v-else-if）
  while (true) {
    if (ifNode.type === NodeTypes.JS_CONDITIONAL_EXPRESSION) {
      if (ifNode.alternate.type === NodeTypes.JS_CONDITIONAL_EXPRESSION) {
        ifNode = ifNode.alternate;
      } else {
        return ifNode;
      }
    }
  }
}
