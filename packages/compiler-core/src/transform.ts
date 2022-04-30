/*
 * @Author: Zhouqi
 * @Date: 2022-04-09 20:33:38
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-30 13:47:59
 */
import { isFunction, isArray } from "@simplify-vue/shared";
import { NodeTypes } from "./ast";
import {
  OPEN_BLOCK,
  TO_DISPLAY_STRING,
  CREATE_ELEMENT_BLOCK,
  helperNameMap,
} from "./runtimeHelpers";

/**
 * @author: Zhouqi
 * @description: 转化ast
 * @param root ast
 * @param options 配置
 * @return
 */
export function transform(root, options = {}) {
  const context = createTransformContext(root, options);
  traverseNode(root, context);
  createRootCodegen(root, context);
  root.helpers = [...context.helpers.keys()];
}

/**
 * @author: Zhouqi
 * @description: 创建codegen所需要的ast
 * @param root ast
 */
function createRootCodegen(root, context) {
  const { children } = root;

  // root下只有一个子节点，即单根标签的情况
  if (children.length === 1) {
    const child = root.children[0];
    if (child.type === NodeTypes.ELEMENT && child.codegenNode) {
      const codegenNode = child.codegenNode;
      if (codegenNode.type === NodeTypes.VNODE_CALL) {
        makeBlock(codegenNode, context);
      }
      root.codegenNode = codegenNode;
    } else {
      root.codegenNode = child;
    }
  }
}

function makeBlock(node, context) {
  const { helper } = context;
  node.isBlock = true;
  helper(OPEN_BLOCK);
  helper(CREATE_ELEMENT_BLOCK);
}

/**
 * @author: Zhouqi
 * @description: 创换上下文对象
 * @param root ast
 * @param options 配置
 * @return 上下文对象
 */
function createTransformContext(
  root,
  { nodeTransforms = [], directiveTransforms = {} }
) {
  const context = {
    directiveTransforms,
    // 当前正在转换的节点
    currentNode: root,
    // 父节点
    parent: null,
    // 当前节点在父节点children中索引
    childIndex: 0,
    root,
    nodeTransforms,
    helpers: new Map(),
    helper(name) {
      context.helpers.set(name, 1);
      return name;
    },
    helperString(name) {
      return `_${helperNameMap[context.helper(name)]}`;
    },
    replaceNode(node) {
      // 替换当前节点的同时修改父节点上对应的子节点
      (context.parent! as any).children[context.childIndex] =
        context.currentNode = node;
    },
    removeNode(node) {
      const children = (context.parent as any).children;
      const nodeIndex = node
        ? children.indexOf(node)
        : context.currentNode
        ? context.childIndex
        : -1;
      // 上下文中清空当前节点
      context.currentNode = null;
      // 此时在遍历traverseChildren的时候，由于当前node会从children中删除，会影响到遍历
      // 因此需要调用onNodeRemoved方法，将正在遍历的index--
      context.onNodeRemoved();
      children.splice(nodeIndex, 1);
    },
    onNodeRemoved: () => {},
  };

  return context;
}
/**
 * @author: Zhouqi
 * @description: 转化ast节点
 * @param node ast
 * @param context 上下文对象
 * @return
 */
export function traverseNode(node, context) {
  // 设置当前正在转换的节点
  context.currentNode = node;
  const { nodeTransforms } = context;

  //   if (type === NodeTypes.TEXT) {
  //     node.content = node.content + "123";
  //   }
  // 插件模式和洋葱模型
  const exitFns: any = [];
  for (let i = 0; i < nodeTransforms.length; i++) {
    const onExit = nodeTransforms[i](node, context);

    if (onExit) {
      // v-if
      if (isArray(onExit)) {
        exitFns.push(...onExit);
      } else {
        exitFns.push(onExit);
      }
    }

    if (!context.currentNode) {
      // 说明节点被删除了，此时直接返回即可，不进行接下去的处理
      return;
    } else {
      // 当前节点可能会被替换，所以要重新赋值一次，例如v-if处理元素时，当前ast节点会被替换成指定特殊的ast结构
      node = context.currentNode;
    }
  }

  const { type } = node;

  switch (type) {
    case NodeTypes.INTERPOLATION:
      context.helper(TO_DISPLAY_STRING);
      break;
    case NodeTypes.IF:
      for (let i = 0; i < node.branches.length; i++) {
        traverseNode(node.branches[i], context);
      }
      break;
    case NodeTypes.ELEMENT:
    case NodeTypes.ROOT:
    case NodeTypes.IF_BRANCH:
      traverseChildren(node, context);
      break;
  }

  context.currentNode = node;
  let i = exitFns.length;
  while (i--) {
    exitFns[i]();
  }
}

/**
 * @author: Zhouqi
 * @description: ast子节点转化
 * @param parent 父节点
 * @param context 上下文对象
 * @return
 */
function traverseChildren(parent, context) {
  // 遍历子节点，递归处理
  let i = 0;
  // 存在遍历当前节点，节点会被移除的情况，这里绑定一个nodeRemoved方法，
  // 当节点被删除时可以通过context触发这个函数，从而让遍历正常进行
  const nodeRemoved = () => {
    i--;
  };
  for (i; i < parent.children.length; i++) {
    const child = parent.children[i];
    context.parent = parent;
    context.childIndex = i;
    context.onNodeRemoved = nodeRemoved;
    traverseNode(child, context);
  }
}

// 结构化指令转换器（v-if/v-else-if/v-else）
export function createStructuralDirectiveTransform(name, fn) {
  return (node, context) => {
    if (node.type === NodeTypes.ELEMENT) {
      const props = node.props;
      const existFn: any = [];
      for (let i = 0; i < props.length; i++) {
        const prop = props[i];
        // 如果属性名匹配到了对应的结构化指令
        if (prop.type === NodeTypes.DIRECTIVE && name.test(prop.name)) {
          /**
           * 从当前element元素的props中删除匹配到的结构化指令数据，避免无限递归
           * 
           * 原因：
           * 因为这里接下去会走processIf流程，这个流程会创建if_branch，if_branch中
           * 的children存储着当前节点，当transverseNode处理if_branch的时候会transverseChildren，
           * 此时又会遍历到当前这个节点，由于当前这个节点的props依旧存在。所以还是会继续走这里的流程，
           * 从而形成无限递归的死循环现象。
           */
          props.splice(i, 1);
          i--;
          const onExist = fn(node, prop, context);
          onExist && existFn.push(onExist);
        }
      }
      return existFn;
    }
  };
}
