'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

/*
 * @Author: Zhouqi
 * @Date: 2022-04-03 16:57:13
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-08 19:45:09
 */
/**
 * @author: Zhouqi
 * @description: 规范化class的值
 * @param value class的值
 */
function normalizeClass(value) {
    // 处理的情况无非就是三种：字符串，数组，对象
    let result = "";
    if (isString(value)) {
        // 是字符串则直接拼接
        result += value;
    }
    else if (isArray(value)) {
        // 是数组情况就递归调用normalizeClass
        for (let i = 0; i < value.length; i++) {
            result += `${normalizeClass(value[i])} `;
        }
    }
    else if (isObject(value)) {
        for (const key in value) {
            // 值为true的class才需要拼接
            if (value[key]) {
                result += `${key} `;
            }
        }
    }
    return result.trim();
}

/*
 * @Author: Zhouqi
 * @Date: 2022-04-10 14:54:14
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-10 14:54:47
 */
function toDisplayString(text) {
    return String(text);
}

/*
 * @Author: Zhouqi
 * @Date: 2022-03-21 20:00:07
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-16 17:41:42
 */
// 重新定义方法名，使其更具语义化命名
const extend = Object.assign;
const isArray = Array.isArray;
// 判断值是不是对象
const isObject = (val) => val !== null && typeof val === "object";
// 判断值是不是字符串
const isString = (val) => typeof val === "string";
// 判断是不是Symbol
const isSymbol = (val) => typeof val === "symbol";
// 判断是不是Map
const isMap = (val) => toTypeString(val) === "[object Map]";
// 判断值是不是函数
const isFunction = (val) => typeof val === "function";
const toTypeString = (value) => Object.prototype.toString.call(value);
// 判断是不是一个纯对象
const isPlainObject = (val) => toTypeString(val) === "[object Object]";
// 新旧值是否有变化，以及对NaN的判断处理 NaN === NaN为false
const hasChanged = (value, oldValue) => !Object.is(value, oldValue);
// 判断是否是事件属性：onClick …………
const isOn = (key) => /^on[^a-z]/.test(key);
// 烤肉串命名转驼峰 add-name ===> addName
const camelize = (str) => str.replace(/-(\w)/g, (_, c) => (c ? c.toUpperCase() : ""));
// 将addName这种转化为AddName
const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
// 处理事件触发的事件名
const toHandlerKey = (str) => str ? `on${capitalize(str)}` : "";
const EMPTY_OBJ = {};
const EMPTY_ARR = [];
// 循环数组中的所有方法
const invokeArrayFns = (fns) => {
    const length = fns.length;
    for (let i = 0; i < length; i++) {
        fns[i]();
    }
};
// 空函数
const NOOP = () => { };
// 判断某个对象中是否有指定属性
const hasOwn = (target, key) => {
    return Object.prototype.hasOwnProperty.call(target, key);
};
// 获取数据的原始类型字符串
const toRawType = (value) => {
    // {} ===> [object Object] ==> Object
    return toTypeString(value).slice(8, -1);
};

/*
 * @Author: Zhouqi
 * @Date: 2022-04-09 22:40:56
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-10 10:08:36
 */
const TO_DISPLAY_STRING = Symbol("toDisplayString");
const OPEN_BLOCK = Symbol("openBlock");
const CREATE_ELEMENT_BLOCK = Symbol("createElementBlock");
const helperNameMap = {
    [TO_DISPLAY_STRING]: "toDisplayString",
    [OPEN_BLOCK]: "openBlock",
    [CREATE_ELEMENT_BLOCK]: "createElementBlock",
};

/*
 * @Author: Zhouqi
 * @Date: 2022-04-09 21:13:43
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-10 14:51:48
 */
function generate(ast, options = {}) {
    const context = createCodegenContext();
    genFunctionPreamble(ast, context);
    const { push } = context;
    const functionName = "render";
    const args = ["_ctx", "_cache", "$props", "$setup", "$data", "$options"].join(", ");
    push(`function ${functionName}(${args}) { `);
    push(`return `);
    genNode(ast.codegenNode, context);
    push(" }");
    return { code: context.code };
}
/**
 * @author: Zhouqi
 * @description: 创建codegen上下文
 * @param ast
 * @param options
 * @return 上下文对象
 */
function createCodegenContext(ast, options) {
    const context = {
        runtimeGlobalName: "Vue",
        // 最终的代码字符串
        code: ``,
        // 字符串拼接操作
        push(text) {
            context.code += text;
        },
        newLine() {
            context.push("\n      ");
        },
        helper(key) {
            return `_${helperNameMap[key]}`;
        },
    };
    return context;
}
/**
 * @author: Zhouqi
 * @description: 根据ast生成节点
 * @param node astNode
 */
function genNode(node, context) {
    const { type } = node;
    const nodeHandlers = {
        [(type === 3 /* TEXT */)]() {
            genText(node, context);
        },
        [(type === 2 /* INTERPOLATION */)]() {
            genInterpolation(node, context);
        },
        [(type === 1 /* SIMPLE_EXPRESSION */)]() {
            genExpression(node, context);
        },
        [(type === 0 /* ELEMENT */)]() {
            genElement(node, context);
        },
        [(type === 5 /* COMPOUND_EXPRESSION */)]() {
            genCompoundExpression(node, context);
        },
    };
    const handler = nodeHandlers[true];
    if (isFunction(handler)) {
        handler();
    }
}
/**
 * @author: Zhouqi
 * @description: 生成前导函数代码
 * @param ast
 * @param context
 */
function genFunctionPreamble(ast, context) {
    const { push, runtimeGlobalName, newLine } = context;
    const { helpers } = ast;
    const aliasHelper = (s) => `${helperNameMap[s]}: _${helperNameMap[s]}`;
    if (helpers.length) {
        push(`const { ${helpers.map(aliasHelper).join(", ")} } = ${runtimeGlobalName};`);
    }
    newLine();
    push(`return `);
}
/**
 * @author: Zhouqi
 * @description: 生成元素节点的代码字符串
 * @param node
 * @param context
 */
function genElement(node, context) {
    const { push, helper } = context;
    const { tag, children, props } = node;
    push(`${helper(CREATE_ELEMENT_BLOCK)}(`);
    genNodeList(genNullableArgs([tag, props, children]), context);
    push(`)`);
}
function genNullableArgs(args) {
    return args.map((arg) => arg || "null");
}
function genNodeList(nodes, context) {
    const { push } = context;
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (isString(node)) {
            push(node);
        }
        else {
            genNode(node, context);
        }
        if (i < nodes.length - 1) {
            push(", ");
        }
    }
}
/**
 * @author: Zhouqi
 * @description: 生成文本节点的代码字符串
 * @param node
 * @param context
 */
function genText(node, context) {
    const { push } = context;
    push(`'${node.content}'`);
}
/**
 * @author: Zhouqi
 * @description: 生成插值节点的代码字符串
 * @param node
 * @param context
 */
function genInterpolation(node, context) {
    const { push, helper } = context;
    push(`${helper(TO_DISPLAY_STRING)}(`);
    genNode(node.content, context);
    push(`)`);
}
/**
 * @author: Zhouqi
 * @description: 生成插值中的表达式的代码字符串
 * @param node
 * @param context
 */
function genExpression(node, context) {
    context.push(node.content);
}
/**
 * @author: Zhouqi
 * @description: 处理复合节点
 * @param node
 * @param context
 */
function genCompoundExpression(node, context) {
    const { children } = node;
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (isString(child)) {
            // +
            context.push(child);
        }
        else {
            genNode(child, context);
        }
    }
}

/*
 * @Author: Zhouqi
 * @Date: 2022-04-07 21:59:46
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-09 20:47:29
 */
// 默认的解析配置
const defaultParserOptions = {
    delimiters: ["{{", "}}"],
};
/**
 * @author: Zhouqi
 * @description: 模板解析
 * @param template 模板字符串
 * @return ast对象
 */
function baseParse(template) {
    const context = createParserContext(template);
    return createRoot(parseChildren(context, []));
}
/**
 * @author: Zhouqi
 * @description: 创建模板解析上下文对象
 * @param template 模板字符串
 * @return 模板上下文对象
 */
function createParserContext(template) {
    const options = extend({}, defaultParserOptions);
    return {
        options,
        source: template,
    };
}
/**
 * @author: Zhouqi
 * @description:
 * @param nodes 模板节点
 * @return ast
 */
function createRoot(nodes) {
    return {
        type: 4 /* ROOT */,
        children: nodes,
    };
}
/**
 * @author: Zhouqi
 * @description: 解析模板子节点
 * @param context 模板解析上下文对象
 * @param ancestors 存储节点层级关系栈
 * @return 模板子节点
 */
function parseChildren(context, ancestors) {
    const { options } = context;
    const nodes = [];
    while (!isEnd(context, ancestors)) {
        let node;
        const template = context.source;
        if (template.startsWith(options.delimiters[0])) {
            // 说明是插值节点
            node = parseInterpolation(context);
        }
        else if (template[0] === "<") {
            if (/[a-z]/i.test(template[1])) {
                // 解析标签
                node = parseElement(context, ancestors);
            }
        }
        // node不存在的话默认就是文本节点
        if (!node) {
            node = parseText(context);
        }
        nodes.push(node);
    }
    return nodes;
}
/**
 * @author: Zhouqi
 * @description: 解析文本节点
 * @param context 模板解析上下文
 * @return 解析后的节点对象
 */
function parseText(context) {
    // 遇到结束截取的标记：
    // 1、结束标签
    // 2、插值模板结束标记
    const endTokens = ["<", context.options.delimiters[0]];
    // 默认截取长度为模板长度
    let endIndex = context.source.length;
    // 遍历模板中的结束标记，找到位置最靠前的结束标记的索引，这个索引就是需要截取的结束位置
    for (let i = 0; i < endTokens.length; i++) {
        const endToken = endTokens[i];
        const index = context.source.indexOf(endToken);
        if (index !== -1 && endIndex > index) {
            endIndex = index;
        }
    }
    const content = parseTextData(context, endIndex);
    return {
        type: 3 /* TEXT */,
        content,
    };
}
/**
 * @author: Zhouqi
 * @description: 获取文本内容和模板推进
 * @param context 模板解析上下文
 * @return {*}
 */
function parseTextData(context, length) {
    const content = context.source.slice(0, length);
    advanceBy(context, length);
    return content;
}
/**
 * @author: Zhouqi
 * @description: 解析标签
 * @param context 模板解析上下文
 * @param ancestors 存储节点层级关系栈
 * @return 解析后的节点对象
 */
function parseElement(context, ancestors) {
    const element = parseTag(context, 0 /* Start */);
    ancestors.push(element);
    // 递归处理子节点
    element.children = parseChildren(context, ancestors);
    ancestors.pop();
    // 判断模板是否合法，比如只有起始标签，没有结束标签，则直接抛出错误
    if (startsWithEndTagOpen(context.source, element.tag)) {
        parseTag(context, 1 /* End */);
    }
    else {
        throw "缺少结束标签" + element.tag;
    }
    return element;
}
/**
 * @author: Zhouqi
 * @description: 解析标签
 * @param context 模板解析上下文
 * @param type 标签类型：起始标签/结束标签
 * @return 解析后的标签数据
 */
function parseTag(context, type) {
    const match = /^<\/?([a-z]*)/i.exec(context.source);
    const tag = match[1];
    advanceBy(context, match[0].length);
    advanceBy(context, 1);
    // 如果是结束标签，直接结束
    if (type === 1 /* End */)
        return;
    return {
        // 类型是节点类型
        type: 0 /* ELEMENT */,
        tag,
        tagType: 0 /* ELEMENT */,
    };
}
/**
 * @author: Zhouqi
 * @description: 解析插值语法
 * @param context 模板解析上下文
 * @return 解析后的节点对象
 */
function parseInterpolation(context) {
    // template {{ message }}.
    const [openDelimiters, closeDelimiters] = context.options.delimiters;
    const openDelimitersLength = openDelimiters.length;
    const closeDelimitersIndex = context.source.indexOf(closeDelimiters, openDelimitersLength);
    if (closeDelimitersIndex === -1) {
        // 说明没有结束标签
        return;
    }
    // 获取插值内容的长度
    const contentLength = closeDelimitersIndex - openDelimitersLength;
    // 截掉起始插值标签
    advanceBy(context, openDelimitersLength);
    const rawContent = parseTextData(context, contentLength);
    const content = rawContent.trim();
    // 截掉已经解析过的部分
    advanceBy(context, closeDelimiters.length);
    return {
        // 类型是插值节点
        type: 2 /* INTERPOLATION */,
        content: {
            // 内容是简单表达式
            type: 1 /* SIMPLE_EXPRESSION */,
            // 非静态节点，也就是内容会变化
            isStatic: false,
            // 插值内容
            content,
        },
    };
}
/**
 * @author: Zhouqi
 * @description: 辅助模板截取（模板推进）
 * @param context 模板解析上下文
 * @param sliceStart 开始截取的位置
 */
function advanceBy(context, sliceStart) {
    context.source = context.source.slice(sliceStart);
}
/**
 * @author: Zhouqi
 * @description: 模板解析结束的标志
 * @param context 模板解析上下文
 * @param ancestors 根节点标记
 * @param ancestors 存储节点层级关系栈
 * @return 模板是否继续解析的标记
 */
function isEnd(context, ancestors) {
    const template = context.source;
    // 1. 模板字符串开头为结束标签
    if (template.startsWith("</")) {
        // 当遇到结束标签时去配置之前记录的起始标签，如果匹配到了则结束模板的遍历，避免死循环，例如：<div><span></div>
        for (let i = ancestors.length - 1; i >= 0; i--) {
            const tag = ancestors[i].tag;
            if (startsWithEndTagOpen(template, tag)) {
                return true;
            }
        }
    }
    // 2. 模板字符串为空
    return !template;
}
/**
 * @author: Zhouqi
 * @description: 判断模板是否匹配到某一个结束标签
 * @param source 模板字符串
 * @param tag 标签
 * @return 是否匹配到
 */
function startsWithEndTagOpen(source, tag) {
    return (startsWith(source, "</") &&
        source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase());
}
function startsWith(source, target) {
    return source.startsWith(target);
}

/*
 * @Author: Zhouqi
 * @Date: 2022-04-09 20:33:38
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-10 13:53:28
 */
/**
 * @author: Zhouqi
 * @description: 转化ast
 * @param root ast
 * @param options 配置
 * @return
 */
function transform(root, options = {}) {
    const context = createTransformContext(root, options);
    traverseNode(root, context);
    createRootCodegen(root);
    root.helpers = [...context.helpers.keys()];
}
/**
 * @author: Zhouqi
 * @description: 创建codegen所需要的ast
 * @param root ast
 */
function createRootCodegen(root) {
    const child = root.children[0];
    if (child.type === 0 /* ELEMENT */) {
        root.codegenNode = child.codegenNode;
    }
    else {
        root.codegenNode = root.children[0];
    }
}
/**
 * @author: Zhouqi
 * @description: 创换上下文对象
 * @param root ast
 * @param options 配置
 * @return 上下文对象
 */
function createTransformContext(root, { nodeTransforms = [] }) {
    const context = {
        root,
        nodeTransforms,
        helpers: new Map(),
        helper(name) {
            context.helpers.set(name, 1);
        },
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
function traverseNode(node, context) {
    const { type } = node;
    const { nodeTransforms } = context;
    const traverseChildrenType = [0 /* ELEMENT */, 4 /* ROOT */];
    //   if (type === NodeTypes.TEXT) {
    //     node.content = node.content + "123";
    //   }
    const exitFns = [];
    for (let i = 0; i < nodeTransforms.length; i++) {
        const onExit = nodeTransforms[i](node, context);
        if (onExit) {
            exitFns.push(onExit);
        }
    }
    const nodeTypeHandlers = {
        [(type === 2 /* INTERPOLATION */)]() {
            context.helper(TO_DISPLAY_STRING);
        },
        [traverseChildrenType.includes(type)]() {
            traverseChildren(node.children, context);
        },
    };
    const nodeHandler = nodeTypeHandlers[true];
    if (isFunction(nodeHandler)) {
        nodeHandler();
    }
    let i = exitFns.length;
    while (i--) {
        exitFns[i]();
    }
}
/**
 * @author: Zhouqi
 * @description: ast子节点转化
 * @param children ast子节点
 * @param context 上下文对象
 * @return
 */
function traverseChildren(children, context) {
    for (let i = 0; i < children.length; i++) {
        traverseNode(children[i], context);
    }
}

/*
 * @Author: Zhouqi
 * @Date: 2022-04-07 22:07:33
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-10 14:17:18
 */
function createVnodeCall(context, tag, props, children) {
    context.helper(CREATE_ELEMENT_BLOCK);
    return {
        type: 0 /* ELEMENT */,
        tag,
        props,
        children,
    };
}

/*
 * @Author: Zhouqi
 * @Date: 2022-04-10 10:16:09
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-10 14:17:02
 */
function transformElement(node, context) {
    return () => {
        const { type } = node;
        if (type === 0 /* ELEMENT */) {
            const vnodeTag = `"${node.tag}"`;
            const children = node.children;
            let vnodeProps;
            let vnodeChildren = children[0];
            node.codegenNode = createVnodeCall(context, vnodeTag, vnodeProps, vnodeChildren);
        }
    };
}

/*
 * @Author: Zhouqi
 * @Date: 2022-04-09 23:38:10
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-09 23:40:47
 */
function transformExpression(node, context) {
    if (node.type === 2 /* INTERPOLATION */) {
        node.content = processExpression(node.content);
    }
}
function processExpression(node, context) {
    node.content = `_ctx.${node.content}`;
    return node;
}

function isText(node) {
    return node.type === 2 /* INTERPOLATION */ || node.type === 3 /* TEXT */;
}

function transformText(node, context) {
    if (node.type === 4 /* ROOT */ || node.type === 0 /* ELEMENT */) {
        return () => {
            const { children } = node;
            let container;
            // 找到相邻的字符串/插值节点，通过+去拼接，并且重新定义新的复合类型节点
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                if (isText(child)) {
                    for (let j = i + 1; j < children.length; j++) {
                        const nextChild = children[j];
                        if (isText(nextChild)) {
                            // 表明是复合节点，需要重新去修改当前节点数据
                            if (!container) {
                                container = children[i] = {
                                    type: 5 /* COMPOUND_EXPRESSION */,
                                    children: [child],
                                };
                            }
                            // 前后需要进行拼接处理
                            container.children.push(` + `);
                            container.children.push(nextChild);
                            // nextChild节点被重新处理过了，需要删除老的
                            children.splice(j, 1);
                        }
                        else {
                            // 下一个不是文本或者插值节点，跳出循环结束即可
                            container = undefined;
                            break;
                        }
                    }
                }
            }
        };
    }
}

/*
 * @Author: Zhouqi
 * @Date: 2022-04-10 14:20:47
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-10 14:21:55
 */
function baseCompile(template) {
    const ast = baseParse(template);
    transform(ast, {
        nodeTransforms: [transformElement, transformExpression, transformText],
    });
    return generate(ast);
}

// 判断是否是Telepor组件
const isTeleport = (type) => type.__isTeleport;
// 判断是否设置了disabled属性
const isTeleportDisabled = (props) => props && (props.disabled || props.disabled === "");
const Teleport = {
    __isTeleport: true,
    // 将teleport的渲染逻辑抽离到这个方法上，避免渲染器代码过多，并且当不用teleport时也利于treeshaking机制，在生成bundle过程中将其逻辑删除
    process(n1, n2, container, anchor, parentComponent, internals) {
        const { mc: mountChildren, pc: patchChildren, o: { insert, querySelector, createComment }, } = internals;
        const { props, shapeFlag, children } = n2;
        const disabled = isTeleportDisabled(props);
        if (n1 == null) {
            // 挂载
            // 同fragment节点，teleport组件本身不渲染任何元素，只是渲染插槽内的元素，因此需要建立锚点节点，防止更新的时候
            // 找不到锚点节点导致元素插入位置不对
            const startAnchor = (n2.el = createComment("teleport start"));
            const endAnchor = (n2.anchor = createComment("teleport end"));
            // 将锚点插入到原本的容器中
            insert(startAnchor, container, anchor);
            insert(endAnchor, container, anchor);
            // 找到要挂载到的目标节点
            const target = (n2.target = querySelector(props.to));
            // 定义挂载函数
            const mount = (container, anchor) => {
                // Teleport的子组件一定是Children类型的
                if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
                    mountChildren(children, container, anchor, parentComponent);
                }
            };
            if (disabled) {
                // 禁用条件下依旧渲染到原来的位置
                mount(container, endAnchor);
            }
            else if (target) {
                mount(target, null);
            }
        }
        else {
            // 更新
            n2.el = n1.el;
            const mainAnchor = (n2.anchor = n1.anchor);
            const target = (n2.target = n1.target);
            const targetAnchor = (n2.targetAnchor = n1.targetAnchor);
            const hasDisabled = isTeleportDisabled(n1.props);
            // 根据disabled属性获取对应的容器和锚点节点
            const currentContainer = hasDisabled ? container : target;
            const currentAnchor = hasDisabled ? mainAnchor : targetAnchor;
            // 进行节点更新
            patchChildren(n1, n2, currentContainer, currentAnchor, parentComponent);
            if (disabled) {
                // 如果之前是将插槽渲染到指定位置，现在不是的话，需要把插槽节点从指定位置移到原本位置
                if (!hasDisabled) {
                    moveTeleport(n2, container, mainAnchor, internals);
                }
            }
            else {
                const { props: oldProps } = n1;
                const { props: newProps } = n2;
                // 指定位置的源变了，需要进行移动
                if ((newProps && newProps.to) !== (oldProps && oldProps.to)) {
                    // 找到新的源
                    const nextTarget = (n2.target = querySelector(newProps.to));
                    nextTarget && moveTeleport(n2, nextTarget, null, internals);
                }
                else if (hasDisabled) {
                    // 如果之前是将插槽节点渲染到原本位置，现在不是的话，需要把节点从原本位置移动到指定位置
                    moveTeleport(n2, target, targetAnchor, internals);
                }
            }
        }
    },
};
/**
 * @author: Zhouqi
 * @description: 移动节点
 * @param vnode 新的虚拟节点
 * @param container 容器
 * @param parentAnchor 锚点
 * @param internals dom操作集合
 */
function moveTeleport(vnode, container, parentAnchor, internals) {
    const { shapeFlag, children } = vnode;
    const { m: move } = internals;
    // 将子节点全部移动过去
    const length = children.length;
    if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
        for (let i = 0; i < length; i++) {
            move(children[i], container, parentAnchor);
        }
    }
}

/*
 * @Author: Zhouqi
 * @Date: 2022-03-26 21:57:02
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-17 11:20:01
 */
// 片段type
const Fragment = Symbol("Fragment");
// 文本节点type
const Text = Symbol("Text");
// 注释节点type
const Comment = Symbol("Comment");
/**
 * @author: Zhouqi
 * @description: 是否是同一类型的vnode
 * @param n1 旧的虚拟节点
 * @param n2 新的虚拟节点
 */
function isSameVNodeType(n1, n2) {
    return n1.type === n2.type && n1.key === n2.key;
}
// 创建虚拟节点函数
function createVnode(type, props = null, children = null) {
    if (props) {
        /**
         * 规范化class的值
         * vue3中有多种class props的处理，针对不同类型需要进行统一
         *
         * 1、<div class="app"></div>  对应的虚拟dom为 {props:{class:'app'}}
         * 2、<div :class="classObj"></div> classObj = {app:true, app1:true} 对应的虚拟dom为 {props:{class:{app:true, app1:true} }}
         * 2、<div :class="classArr"></div> classObj = ['app app1','app2',{app3:true}] 对应的虚拟dom为 {props:{class: ['app app1','app2',{app3:true}] }}
         */
        const { class: kclass } = props;
        if (kclass && !isString(kclass)) {
            props.class = normalizeClass(kclass);
        }
    }
    let shapeFlag = 0;
    // 处理虚拟节点的shapeFlag
    if (isString(type)) {
        shapeFlag = 1 /* ELEMENT */;
    }
    else if (isTeleport(type)) {
        // teleport要在object判断之前，不然会走到object里面
        shapeFlag = 64 /* TELEPORT */;
    }
    else if (isObject(type)) {
        shapeFlag = 4 /* STATEFUL_COMPONENT */;
    }
    else if (isFunction(type)) {
        shapeFlag = 2 /* FUNCTIONAL_COMPONENT */;
    }
    return createBaseVNode(type, props, children, shapeFlag, true);
}
// 创建基础vnode
function createBaseVNode(type, props, children, shapeFlag, needFullChildrenNormalization = false) {
    const vnode = {
        type,
        props,
        children,
        el: null,
        shapeFlag,
        component: null,
        key: props && props.key,
    };
    if (needFullChildrenNormalization) {
        // 规范化子节点处理，子节点的类型有很多，比如数组，对象，函数等等
        normalizeChildren(vnode, children);
    }
    else {
        // 能走到这里说明children一定是string或者array类型的
        vnode.shapeFlag |= isString(children)
            ? 8 /* TEXT_CHILDREN */
            : 16 /* ARRAY_CHILDREN */;
    }
    return vnode;
}
// 创建文本节点的vnode
function createTextVnode(text) {
    return createVnode(Text, null, text);
}
// 创建注释节点的vnode
function createCommentVnode(text) {
    return createVnode(Comment, null, text);
}
// 规范化子节点，子节点的类型有多种，比如string、function、object等等
function normalizeChildren(vnode, children) {
    let type = 0;
    const { shapeFlag } = vnode;
    if (children == null) {
        children = null;
    }
    else if (isArray(children)) {
        type = 16 /* ARRAY_CHILDREN */;
    }
    else if (isObject(children)) {
        if (shapeFlag & 6 /* COMPONENT */) {
            // 子节点是对象表示插槽节点
            type = 32 /* SLOTS_CHILDREN */;
        }
    }
    else if (isFunction(children)) {
        // 如果子节点是一个函数，则表示默认插槽
        type = 32 /* SLOTS_CHILDREN */;
        children = { default: children };
    }
    else {
        children = String(children);
        type = 8 /* TEXT_CHILDREN */;
    }
    vnode.children = children;
    vnode.shapeFlag |= type;
}
/**
 * @author: Zhouqi
 * @description: 解析vnode（这里暂时只处理有状态组件的情况）
 * @param child 虚拟节点
 */
function normalizeVNode(child) {
    if (child == null) {
        // 如果render函数没有返回对应的vnode，则默认创建一个注释节点
        return createVnode(Comment);
    }
    else if (isObject(child)) {
        // 显然已经是一个vnode类型的数据
        // 如果vnode上没有el，说明是初始化渲染，直接返回vnode即可
        // 如果是更新的话，需要克隆一份新的vnode
        return child.el === null ? child : cloneVNode(child);
    }
    return child;
}
/**
 * @author: Zhouqi
 * @description: 克隆vnode
 * @param  vnode 虚拟节点
 * @param  extraProps 额外的属性
 */
function cloneVNode(vnode, extraProps) {
    // vnode克隆处理
    const { props } = vnode;
    const mergedProps = extraProps ? mergeProps(props || {}, extraProps) : props;
    // 简单处理一下
    vnode = extend(vnode, { props: mergedProps });
    return vnode;
}
/**
 * @author: Zhouqi
 * @description: 合并props属性
 * @param  args 需要合并的props对象数组
 */
function mergeProps(...args) {
    let result = {};
    const argLength = args.length;
    for (let i = 0; i < argLength; i++) {
        const arg = args[i];
        for (const key in arg) {
            const value = arg[key];
            if (key === "class") {
                // 标准化class
                result.class = normalizeClass(value);
            }
            else if (isOn(key)) {
                // 处理事件相关属性
                const exist = result[key];
                if (value &&
                    value !== exist &&
                    !(isArray(exist) && exist.includes(value))) {
                    // 如果新的事件存在且和旧的事件不相同，并且旧的事件集合里面没有新的事件，则合并新旧事件
                    result[key] = exist ? [].concat(exist, value) : value;
                }
            }
            else {
                result[key] = value;
            }
        }
    }
    return result;
}

/*
 * @Author: Zhouqi
 * @Date: 2022-03-30 20:59:56
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-14 22:07:47
 */
/**
 * @author: Zhouqi
 * @description: 将slot children转化为虚拟节点
 * @param slots 插槽数据
 * @param name 具名插槽名称
 * @param props 作用域插槽要传入的props数据
 */
function renderSlot(slots, name, props) {
    // 取对应名称的插槽————具名插槽
    const slot = slots[name];
    if (slot) {
        if (isFunction(slot)) {
            return createVnode(Fragment, null, slot(props));
        }
    }
    return createVnode(Fragment, null, []);
}

/*
 * @Author: Zhouqi
 * @Date: 2022-03-30 17:31:04
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-11 17:49:49
 */
function createDep() {
    return new Set();
}

/*
 * @Author: Zhouqi
 * @Date: 2022-03-20 20:52:58
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-14 22:07:14
 */
const ITERATE_KEY = Symbol("iterate");
const MAP_KEY_ITERATE_KEY = Symbol("Map key iterate");
class ReactiveEffect {
    constructor(effectFn, scheduler) {
        this.effectFn = effectFn;
        this.scheduler = scheduler;
        this.deps = [];
        this.active = true;
    }
    run() {
        activeEffect = this;
        activeEffectStack.push(this);
        /**
         * cleanup的作用是清除当前ReactiveEffect所关联的deps，即响应式对象key对应的Set依赖集合
         * effectFn = () => {
            // user.ok为false时，user.name始终应该是123，即使user.age发生改变也不应该触发副作用函数执行
            user.name = user.ok ? user.age : "123";
           };
           当user.ok变成false时会触发副作用函数，此时会清空ok、age上面的依赖，并且重新收集ok的依赖，
           由于三元表达式的结果，age不会收集依赖，因此即使修改user.age也不再会触发副作用函数执行。
         */
        cleanup(this);
        const result = this.effectFn();
        activeEffectStack.pop();
        activeEffect = activeEffectStack[activeEffectStack.length - 1];
        // activeEffect = undefined
        return result;
    }
    stop() {
        // active用于防止重复调用stop
        if (this.active) {
            // 移除依赖
            cleanup(this);
            this.onStop && this.onStop();
            this.active = false;
        }
    }
}
// 找到所有依赖这个 effect 的响应式对象，从这些响应式对象里面把 effect 给删除掉
function cleanup(effect) {
    effect.deps.forEach((deps) => {
        deps.delete(effect);
    });
    effect.deps.length = 0;
}
let activeEffect;
/**
 * 收集当前正在使用的ReactiveEffect，在嵌套effect的情况下，每一个effect执行
 * 时内部的ReactiveEffect是不同的。建立activeEffectStack是为了能够在对应的
 * effect函数执行时收集到正确的activeEffect。
 *
 * effect(() => {
 *     effect(() => {
 *       执行逻辑
 *     });
 *     执行逻辑
 *   });
 *
 * 执行过程：
 * 外层effect执行 ---> activeEffect=当前effect内部创建的ReactiveEffect
 * 并且被收集到activeEffectStack中 ---> 内部effect执行 ---> activeEffect=当前effect
 * 内部创建的ReactiveEffect并且被收集到activeEffectStack中 ---> 内部effect执行完成，
 * activeEffectStack弹出栈顶的ReactiveEffect，此时栈顶的ReactiveEffect对应外层effect，
 * 取出后赋值给当前的activeEffect
 */
const activeEffectStack = [];
let shouldTrack = true;
// 能否能进行依赖收集
function canTrack() {
    return !!(shouldTrack && activeEffect);
}
// 暂停依赖追踪
function pauseTracking() {
    shouldTrack = false;
}
// 恢复依赖追踪
function resetTracking() {
    shouldTrack = true;
}
/**
 * options:{
 *    scheduler: 用户自定义的调度器函数
 *    onStop: 清除响应式时触发回调函数;
 *    lazy: 是否懒执行，即第一次不执行fn
 * }
 */
function effect(effectFn, options = {}) {
    const _effect = new ReactiveEffect(effectFn, options.scheduler);
    options && extend(_effect, options);
    // 如果不是懒执行，则执行一次副作用函数
    if (!options.lazy)
        _effect.run();
    const runner = _effect.run.bind(_effect);
    runner._effect = _effect;
    return runner;
}
/**
 * WeackMap{
 *    target: Map{
 *        key: Set(effectFn)
 *    }
 * }
 * 这里使用WeakMap是因为当target引用对象被销毁时，它所建立的依赖关系其实已经没有存在的必要了
 * 可以被辣鸡回收机制回收
 */
const targetMap = new WeakMap();
// 依赖收集函数
function track(target, key) {
    // if (!activeEffect) return;
    if (!canTrack())
        return;
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }
    let deps = depsMap.get(key);
    if (!deps) {
        deps = new Set();
        depsMap.set(key, deps);
    }
    trackEffects(deps);
}
// 抽离收集依赖公共逻辑
function trackEffects(deps) {
    deps.add(activeEffect);
    activeEffect.deps.push(deps);
}
// 触发依赖函数
function trigger(target, type, key, newValue) {
    const depsMap = targetMap.get(target);
    if (!depsMap)
        return;
    let deps = [];
    if (type === "clear" /* CLEAR */) {
        // 如果是clear操作，触发所有依赖
        deps.push(...depsMap.values());
    }
    else if (key === "length" && isArray(target)) {
        /**
         * 如果操作了数组的length，比如 arr = [1], arr.length = 0;
         * 此时会删除arr[0]这个元素，需要触发key为0相关的依赖；当时假如
         * arr.length = 1，此时arr[0]依旧存在，不受影响，不需要触发依赖。
         * 因此我们得出一个结论，当修改数组的长度属性时，需要触发原数组中下标大于
         * 新length值的依赖。
         */
        depsMap.forEach((dep, key) => {
            // 不要遗漏了key为length的依赖，因为操作了length
            if (key === "length" || key >= newValue) {
                deps.push(dep);
            }
        });
    }
    else {
        // 如果key不是undefined，则获取对应key上的deps依赖集合
        if (key !== void 0) {
            deps.push(depsMap.get(key));
        }
        // 针对不同的type还需要做特殊处理
        switch (type) {
            case "set" /* SET */:
                // Map的forEach既关心键，也关心值，因此修改的时候也要获取ITERATE_KEY相关的依赖
                if (isMap(target)) {
                    deps.push(depsMap.get(ITERATE_KEY));
                }
                break;
            case "add" /* ADD */:
                if (!isArray(target)) {
                    // 对象新增属性操作，影响for in操作，需要获取ITERATE_KEY相关的依赖
                    deps.push(depsMap.get(ITERATE_KEY));
                    if (isMap(target)) {
                        // Map新增属性操作，影响keys操作，需要获取MAP_KEY_ITERATE_KEY相关的依赖
                        deps.push(depsMap.get(MAP_KEY_ITERATE_KEY));
                    }
                }
                else {
                    // 数组新增元素操作，会影响length属性，需要获取length相关的依赖
                    deps.push(depsMap.get("length"));
                }
                break;
            case "delete" /* DELETE */:
                // 删除属性操作，影响for in 操作，需要获取ITERATE_KEY相关的依赖
                deps.push(depsMap.get(ITERATE_KEY));
                if (isMap(target)) {
                    // Map删除属性操作，影响keys操作，需要获取MAP_KEY_ITERATE_KEY相关的依赖
                    deps.push(depsMap.get(MAP_KEY_ITERATE_KEY));
                }
                break;
        }
    }
    // 构建一个新的effect集合，防止无限循环，比如：删除effect的同时又添加effect
    const effects = [];
    for (const dep of deps) {
        if (dep) {
            effects.push(...dep);
        }
    }
    triggerEffects(effects);
}
// 抽离公共的触发依赖逻辑
function triggerEffects(deps) {
    // dep不是数组的话转化成数组，比如ref触发依赖传入的是一个set集合
    const depsToRun = isArray(deps) ? deps : [...deps];
    depsToRun.forEach((dep) => {
        /**
           * 这里的dep !== activeEffect是为了防止obj++这种形成：收集--》更新--》收集的循环现象
           * effect(() => {
            // user.num ++ ====> user.num = user.num + 1;
            user.num++;
           });
           */
        if (dep !== activeEffect) {
            const scheduler = dep.scheduler;
            // 触发依赖的时候，如果存在用户自定义调度器，则执行调度器函数，否则执行依赖函数
            scheduler ? scheduler(dep.effectFn) : dep.run();
        }
    });
}
// 停止副作用函数执行
function stop(runner) {
    runner._effect.stop();
}

/*
 * @Author: Zhouqi
 * @Date: 2022-03-22 17:58:01
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-14 22:07:05
 */
// 内建的symbol属性
const builtInSymbols = new Set(Object.getOwnPropertyNames(Symbol)
    .map((key) => Symbol[key])
    .filter((value) => isSymbol(value)));
const arrayInstrumentations = createArrayInstrumentations();
// 覆写部分数组实例身上的方法
function createArrayInstrumentations() {
    const instrumentations = {};
    /**
     * 对于数组的一些查找方法，由于查找的时候this指向的是代理对象，可能会有一些问题
     * 例如：
     * const obj = {};
     * const arr: any = reactive([obj]);
     * arr.includes(obj);
     * arr.indexOf(obj);
     * arr.lastIndexOf(obj);
     * 上面三个方法查找时由于this指向代理对象，在代理对象中查原始数据对象是找不到的，因此需要覆写这些方法
     * 在查找的时候先在代理对象上找，如果没找到就去原始对象中找。
     */
    ["includes", "indexOf", "lastIndexOf"].forEach((key) => {
        const originMethod = Array.prototype[key];
        instrumentations[key] = function (...args) {
            // 获取代理对象的原始对象
            const raw = toRaw(this);
            // 先在代理对象中找
            const result = originMethod.apply(this, args);
            // 如果没有在代理对象中找到，就去原始对象中找
            if (result === false || result === -1) {
                return originMethod.apply(raw, args);
            }
            // 找到则返回
            return result;
        };
    });
    /**
     * 下面这些数组方法会隐式访问数组的length属性，导致在某些情况下会出现问题，而这些方法本质上是修改操作，其实
     * 不必和length建立联系
     * 例如：
     * const arr = reactive([1]);
     * effect(() => {
     *   arr.push(1);
     * });
     *
     * effect(() => {
     *   arr.push(2);
     * });
     * 上面会造成 Maximum call stack size exceeded
     * 因为在第一个effect函数中的push会读取length属性，建立和length相关的依赖
     * 第二个effect函数中的push也会建立和length相关的依赖，并且会修改length，触发length相关的依赖
     * 即又触发了第一个effect中的函数，同理第一个执行也会触发第二个effect中的函数，如此循环导致栈溢出
     *
     * 解决方法就是在这方法执行的时候，关闭依赖追踪的开关，执行完成后再开启依赖追踪的开关
     */
    ["push", "pop", "splice", "shift", "unshift"].forEach((key) => {
        const originMethod = Array.prototype[key];
        instrumentations[key] = function (...args) {
            // 暂停依赖的追踪
            pauseTracking();
            const result = originMethod.apply(this, args);
            // 恢复依赖追踪
            resetTracking();
            return result;
        };
    });
    return instrumentations;
}
// 封装proxy get函数
const createGetter = function (isReadOnly = false, isShallow = false) {
    return function (target, key, receiver) {
        // 如果访问的是__v_reactive，则返回!isReadOnly的值
        if (key === "__v_isReactive" /* IS_REACTIVE */) {
            return !isReadOnly;
        }
        // 如果访问的是__v_isReadonly，则返回isReadOnly值
        if (key === "__v_isReadonly" /* IS_READONLY */) {
            return isReadOnly;
        }
        // 如果访问的是__v_raw属性，就返回原始对象
        if (key === "__v_raw" /* RAW */) {
            return target;
        }
        const targetIsArray = isArray(target);
        if (targetIsArray && hasOwn(arrayInstrumentations, key)) {
            return Reflect.get(arrayInstrumentations, key, receiver);
        }
        const result = Reflect.get(target, key, receiver);
        if (isSymbol(key) && builtInSymbols.has(key)) {
            // 如果key是内建的symbol对象，则不需要建立依赖
            return result;
        }
        // 只读属性不不能设置值，所以无需建立依赖关系
        if (!isReadOnly) {
            track(target, key);
        }
        // 浅响应
        if (isShallow) {
            return result;
        }
        // 深响应，如果访问的属性是一个对象则继续处理对象
        if (isObject(result)) {
            return isReadOnly ? readonly(result) : reactive(result);
        }
        return result;
    };
};
// 封装proxy set函数
const createSetter = function () {
    return function (target, key, newValue, receiver) {
        // 先获取旧的值，再去更新值，避免影响触发依赖的判断 oldValue !== newValue
        const oldValue = target[key];
        /**
         * 判断是新增还是修改属性
         *
         * const arr = [1];
         * arr[2] = 2;  // arr.length = 3
         * 当target是数组时，如果通过下标的形式设置数组值，当下标大于数组长度时，表示新增，此时会改变数组的length，这个
         * 时候需要触发key 为 length相关的依赖；反之为修改值，可直接被set拦截
         *
         * 当target是对象时，对于新增属性需要触发ITERATE_KEY相关的依赖，因为这会影响for in循环
         */
        const hasKey = isArray(target)
            ? Number(key) < target.length
            : hasOwn(target, key);
        const result = Reflect.set(target, key, newValue, receiver);
        /**
         * 解决prototype chain造成问题
         * const obj = { name: "zs" };
         * const obj1 = { name1: "ls" };
         * const child: any = reactive(obj);
         * const parent = reactive(obj1);
         * Object.setPrototypeOf(child, parent);
         *
         * 上面这种情况，当child去访问name1属性时首先会去查找自身有没有name1属性，没有顺着原型链
         * 找到parent上的name1属性，在这个过程中，child和parent都收集了关于name1这个key的依赖，这是没问题的。
         * 问题在于当child设置name1的时候，首先会触发自身的set操作，但是自身没有name1属性，于是会通过原型链去触发
         * parent上的set操作，这一个过程触发了child和parent关于name1的依赖，这是多余的。因此需要屏蔽parent那一次
         * set操作触发的依赖。
         *
         * 这里判断的依据就是target是否跟receiver代理对象的原始对象相同
         * 当触发child的set操作时，target是child的原始对象obj，receiver是child
         * 当触发parent的set操作时，target是parent的原始对象obj1，但是receiver依旧是child
         */
        if (target === toRaw(receiver)) {
            if (!hasKey) {
                // 新增属性
                trigger(target, "add" /* ADD */, key, newValue);
            }
            else if (hasChanged(newValue, oldValue)) {
                // 修改属性值，触发依赖
                trigger(target, "set" /* SET */, key);
            }
        }
        return result;
    };
};
// 拦截 in 操作
function has$1(target, key) {
    const result = Reflect.has(target, key);
    track(target, key);
    return result;
}
// 拦截 delete 操作
function deleteProperty(target, key) {
    // 判断对象上是否有相关属性
    const hasKey = hasOwn(target, key);
    const result = Reflect.deleteProperty(target, key);
    if (hasKey && result) {
        // 如果存在属性且删除成功了，则触发依赖
        trigger(target, "delete" /* DELETE */, key);
    }
    return result;
}
/**
 * 拦截for in 操作
 * 影响for in 的操作有添加和删除属性，因为这个导致for in 遍历的次数改变
 * 因此在触发依赖的时候如果是新增或者删除键需要将ITERATE_KEY关联的依赖拿出来执行
 */
function ownKeys(target) {
    // for in 操作对象时没有明显的key可以追踪，因此创建一个ITERATE_KEY作为依赖追踪的key
    // for in 操作数组时，影响条件只有length的变化（不管新增还是删除），length变化会导致for in 次数的变化，因此这里只需要建立length的依赖
    track(target, isArray(target) ? "length" : ITERATE_KEY);
    return Reflect.ownKeys(target);
}
// 初始化的时候创建
const reactiveGetter = createGetter();
const shallowReactiveGetter = createGetter(false, true);
const readonlyGetter = createGetter(true);
const shallowReadonlyGetter = createGetter(true, true);
const reactiveSetter = createSetter();
// 响应处理器
const reactiveHandler = {
    get: reactiveGetter,
    set: reactiveSetter,
    has: has$1,
    deleteProperty,
    ownKeys,
};
// 浅响应处理器
const shallowReactiveHandler = {
    get: shallowReactiveGetter,
    set: reactiveSetter,
};
// 只读处理器
const readonlyHandler = {
    get: readonlyGetter,
    set(target, key, newValue, receiver) {
        console.warn(`${key} is readonly`);
        return true;
    },
    deleteProperty(target, key) {
        console.warn(`${key} is readonly`);
        return true;
    },
};
// 浅只读处理器
const shallowReadonlyHandler = extend({}, readonlyHandler, {
    get: shallowReadonlyGetter,
});

/*
 * @Author: Zhouqi
 * @Date: 2022-04-12 11:21:30
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-13 19:28:07
 */
const toShallow = (value) => value;
// 覆写size获取器的逻辑
function size(target, isReadonly = false) {
    const rawTarget = toRaw(target);
    !isReadonly && track(rawTarget, ITERATE_KEY);
    return Reflect.get(rawTarget, "size", rawTarget);
}
// 覆写delete方法
function deleteEntry(key) {
    const rawTarget = toRaw(this);
    const hasKey = rawTarget.has(key);
    const result = rawTarget.delete(key);
    if (hasKey) {
        // 如果key存在则去触发依赖
        trigger(rawTarget, "delete" /* DELETE */, key);
    }
    return result;
}
// 覆写add方法
function add(value) {
    // 获取原始数据，道理同set方法，不污染原始对象
    value = toRaw(value);
    const rawTarget = toRaw(this);
    const hasKey = rawTarget.has(value);
    // 优化：如果没有对应的value，才去添加value
    if (!hasKey) {
        rawTarget.add(value);
        trigger(rawTarget, "add" /* ADD */, value);
    }
    return this;
}
// 覆写get方法
function get(target, key, isReadonly = false, isShallow = false) {
    const rawTarget = toRaw(target);
    const has = rawTarget.has(key);
    // 不是只读的需要建立依赖关系
    !isReadonly && track(rawTarget, key);
    const wrapper = isShallow ? toShallow : isReadonly ? toReadonly : toReactive;
    // 如果存在对应的key，则返回结果
    if (has) {
        const result = rawTarget.get(key);
        // 如果结果是对象还需要深层次处理
        return wrapper(result);
    }
}
// 覆写set方法
function set(key, value) {
    /**
     * 如果value是响应式数据需要获取其原始数据，防止污染数据
     * 因为这里的set操作操作的是原始对象，假如不对value值做处理，那么用户
     * 可以通过原始数据来进行响应式操作，这是不合理的
     *
     * 例如：
     * const map = new Map([["name", "zs"]]);
     * const r = reactive(map);
     * const r1 = reactive(new Map());
     * r.set("r1", r1);
     * effect(() => {
     *   map.get("r1").size;
     * });
     * map.get("r1").set("age", 1);
     *
     * 上面effect中通过map获取到的r1是响应式数据，因此访问size属性会建立依赖关系
     * 当通过map去获取r1并设置数据的时候就会触发依赖，这就赋予了原始对象map进行响应式操作的能力
     * 为了不污染原始对象，应该获取到value对应的原始对象。
     */
    value = toRaw(value);
    const rawTarget = toRaw(this);
    const hasKey = rawTarget.has(key);
    const oldValue = rawTarget.get(key);
    rawTarget.set(key, value);
    if (!hasKey) {
        // 如果之前key不存在说明是新增操作，触发依赖
        trigger(rawTarget, "add" /* ADD */, key, value);
    }
    else if (hasChanged(oldValue, value)) {
        // 值变化了说明是修改操作，触发依赖
        trigger(rawTarget, "set" /* SET */, key, value);
    }
    return this;
}
// 覆写clear方法
function clear() {
    const rawTarget = toRaw(this);
    // 判断是否存在数据项，存在的话才触发依赖
    const hasItem = rawTarget.size !== 0;
    const result = rawTarget.clear();
    if (hasItem) {
        trigger(rawTarget, "clear" /* CLEAR */);
    }
    return result;
}
// 覆写forEach方法
function createForEach(isReadonly = false, isShallow = false) {
    return function (callback, args) {
        const that = this;
        const rawTarget = toRaw(that);
        // forEach循环跟键值对的数量有关，因此需要和ITERATE_KEY建立关系
        !isReadonly && track(rawTarget, ITERATE_KEY);
        const wrap = isShallow ? toShallow : isReadonly ? toReadonly : toReactive;
        return rawTarget.forEach((v, k) => {
            // 对forEach中的key和value做响应式处理
            callback.call(args, wrap(v), wrap(k), that);
        });
    };
}
// 创建迭代器函数
function createIterableMethod(method, isReadonly, isShallow) {
    return function (...args) {
        const rawTarget = toRaw(this);
        const it = rawTarget[method](...args);
        const wrap = isShallow ? toShallow : isReadonly ? toReadonly : toReactive;
        // entries方法和Symbol.iterator都可以遍历到key和value，keys和values方法只能遍历键/值，因此需要区分
        const isPair = method === "entries" || method === Symbol.iterator;
        // keys方法只关心键，只有在add和delete的时候才需要触发依赖，因此需要单独区分出一个关联key出来
        const isKeyOnly = method === "keys";
        !isReadonly &&
            track(rawTarget, isKeyOnly ? MAP_KEY_ITERATE_KEY : ITERATE_KEY);
        return {
            // 迭代器协议
            next() {
                const { value, done } = it.next();
                return done
                    ? {
                        done,
                        value,
                    }
                    : {
                        done,
                        value: isPair ? [wrap(value[0]), wrap(value[1])] : wrap(value),
                    };
            },
            //
            /**
             * 实现可迭代协议
             * 对象必须要部署Symbol.iterator才能被for of遍历，这样的对象叫可迭代对象
             * 在处理entries，values，keys方法的时候需要部署Symbol.iterator才能被for of遍历
             */
            [Symbol.iterator]() {
                return this;
            },
        };
    };
}
// 覆写has方法
function has(key, isReadonly = false) {
    const rawTarget = toRaw(this);
    const result = rawTarget.has(key);
    !isReadonly && track(rawTarget, key);
    return result;
}
// 统一处理只读情况下对响应式对象进行修改操作的拦截
function createReadonlyMethod(type) {
    return function (key) {
        console.warn(`${key} is readonly`);
        // delete函数返回删除失败的布尔值，其它返回当前的集合对象
        return type === "delete" /* DELETE */ ? false : this;
    };
}
/**
 * 创建不同的处理器对象
 *
 * 集合类型和普通的对象去访问和调用方法是不一样的，这些操作在proxy上直接使用是有问题的
 * 例如：我们通过Set去访问size属性，在proxy中直接通过Reflect.get(target,key,receiver)是有问题的
 * 因为访问器属性size中的this是代理对象，而代理对象是缺少原生Set内部方法的。因此我们需要定义一套自己的集合类型的逻辑处理器，
 * 去覆写相关集合上的访问器属性和方法，让它们能够正常处理
 */
function createInstrumentations() {
    // 深响应处理器
    const mutableInstrumentations = {
        get(key) {
            return get(this, key);
        },
        get size() {
            return size(this);
        },
        delete: deleteEntry,
        add,
        set,
        clear,
        has,
        forEach: createForEach(),
    };
    // 浅响应处理器
    const shallowInstrumentations = {
        get(key) {
            return get(this, key, false, true);
        },
        get size() {
            return size(this);
        },
        has,
        add,
        set,
        delete: deleteEntry,
        clear,
        forEach: createForEach(false, true),
    };
    // 只读处理器
    const readonlyInstrumentations = {
        get(key) {
            return get(this, key, true);
        },
        get size() {
            return size(this, true);
        },
        has(key) {
            return has.call(this, key, true);
        },
        delete: createReadonlyMethod("delete" /* DELETE */),
        add: createReadonlyMethod("add" /* ADD */),
        set: createReadonlyMethod("set" /* SET */),
        clear: createReadonlyMethod("clear" /* CLEAR */),
        forEach: createForEach(true),
    };
    // 浅只读处理器
    const shallowReadonlyInstrumentations = {
        get(key) {
            return get(this, key, true, true);
        },
        get size() {
            return size(this, true);
        },
        has(key) {
            return has.call(this, key, true);
        },
        delete: createReadonlyMethod("delete" /* DELETE */),
        add: createReadonlyMethod("add" /* ADD */),
        set: createReadonlyMethod("set" /* SET */),
        clear: createReadonlyMethod("clear" /* CLEAR */),
        forEach: createForEach(true, true),
    };
    const iteratorMethods = ["keys", "values", "entries", Symbol.iterator];
    // 定义迭代器方法
    iteratorMethods.forEach((method) => {
        mutableInstrumentations[method] = createIterableMethod(method, false, false);
    });
    return [
        mutableInstrumentations,
        readonlyInstrumentations,
        shallowInstrumentations,
        shallowReadonlyInstrumentations,
    ];
}
const [mutableInstrumentations, readonlyInstrumentations, shallowInstrumentations, shallowReadonlyInstrumentations,] = createInstrumentations();
// 创建公共的getter处理器
function createInstrumentationGetter(isReadonly, isShallow) {
    // 根据配置使用不同的处理器
    let instrumentations;
    if (isShallow) {
        instrumentations = isReadonly
            ? shallowReadonlyInstrumentations
            : shallowInstrumentations;
    }
    else {
        instrumentations = isReadonly
            ? readonlyInstrumentations
            : mutableInstrumentations;
    }
    return (target, key, receiver) => {
        // 如果访问的是__v_reactive，则返回!isReadonly的值
        if (key === "__v_isReactive" /* IS_REACTIVE */) {
            return !isReadonly;
        }
        // 如果访问的是__v_isReadonly，则返回isReadonly值
        if (key === "__v_isReadonly" /* IS_READONLY */) {
            return isReadonly;
        }
        // 如果访问的是__v_raw属性，就返回原始对象
        if (key === "__v_raw" /* RAW */) {
            return target;
        }
        return Reflect.get(instrumentations, key, receiver);
    };
}
const mutableCollectionHandlers = {
    get: createInstrumentationGetter(false, false),
};
const shallowCollectionHandlers = {
    get: createInstrumentationGetter(false, true),
};
const readonlyCollectionHandlers = {
    get: createInstrumentationGetter(true, false),
};
const shallowReadonlyCollectionHandlers = {
    get: createInstrumentationGetter(true, true),
};

/*
 * @Author: Zhouqi
 * @Date: 2022-03-20 20:47:45
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-12 20:10:57
 */
function targetTypeMap(type) {
    switch (type) {
        case "Object":
        case "Array":
            return 1 /* COMMON */;
        case "Map":
        case "Set":
        case "WeakMap":
        case "WeakSet":
            return 2 /* COLLECTION */;
        default:
            return 0 /* INVALID */;
    }
}
// 获取当前数据的类型
function getTargetType(value) {
    return targetTypeMap(toRawType(value));
}
// 缓存target->proxy的映射关系
const reactiveMap = new WeakMap();
const shallowReactiveMap = new WeakMap();
const readonlyMap = new WeakMap();
const shallowReadonlyMap = new WeakMap();
// 创建响应式对象
function reactive(raw) {
    // 如果对象是一个只读的proxy，则直接返回
    if (isReadonly(raw)) {
        return raw;
    }
    return createReactiveObject(raw, reactiveHandler, mutableCollectionHandlers, reactiveMap);
}
// 创建浅响应对象
function shallowReactive(raw) {
    return createReactiveObject(raw, shallowReactiveHandler, shallowCollectionHandlers, shallowReactiveMap);
}
// 创建只读对象
function readonly(raw) {
    return createReactiveObject(raw, readonlyHandler, readonlyCollectionHandlers, readonlyMap);
}
// 创建浅只读对象
function shallowReadonly(raw) {
    return createReactiveObject(raw, shallowReadonlyHandler, shallowReadonlyCollectionHandlers, shallowReadonlyMap);
}
// 对象是不是响应式的
function isReactive(variable) {
    return !!variable["__v_isReactive" /* IS_REACTIVE */];
}
// 对象是不是只读的
function isReadonly(variable) {
    return !!variable["__v_isReadonly" /* IS_READONLY */];
}
// 对象是不是readonly或者reactive的
function isProxy(variable) {
    return isReactive(variable) || isReadonly(variable);
}
// 返回代理对象的原始对象
function toRaw(observed) {
    const raw = observed && observed["__v_raw" /* RAW */];
    // toRaw返回的对象依旧是代理对象，则递归去找原始对象
    return raw ? toRaw(raw) : observed;
}
// 对传入的值做处理，如果是对象，则进行reactive处理
const toReactive = (value) => isObject(value) ? reactive(value) : value;
// 对传入的值做处理，如果是对象，则进行readonly处理
const toReadonly = (value) => isObject(value) ? readonly(value) : value;
function createReactiveObject(raw, baseHandler, collectionHandlers, proxyMap) {
    /**
     * 如果映射表里有原始对象对应的代理对象，则直接返回，避免因同一个原始对象而创建出的代理对象不同导致比较失败
     * 例如：
     * const obj = {};
     * const arr: any = reactive([obj]);
     * arr.includes(arr[0])应该是true，但是返回了false
     * 因为arr[0]是obj的响应式对象，arr.includes通过下标找到arr[0]时也是obj的响应式对象
     * 如果不缓存同一个target对应的代理对象，会导致因重复创建而比较失败的情况
     */
    const existingProxy = proxyMap.get(raw);
    if (existingProxy)
        return existingProxy;
    const targetType = getTargetType(raw);
    // 集合类型例如Set、WeakSet、Map、WeakMap需要另外的handler处理
    const proxy = new Proxy(raw, targetType === 2 /* COLLECTION */ ? collectionHandlers : baseHandler);
    proxyMap.set(raw, proxy);
    return proxy;
}

/*
 * @Author: Zhouqi
 * @Date: 2022-03-23 21:32:36
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-14 22:07:19
 */
class RefImpl {
    constructor(value, __v_isShallow = false) {
        this.__v_isShallow = __v_isShallow;
        this.__v_isRef = true;
        // 如果不是shallow的情况且value是obj时需要响应式处理
        this._value = __v_isShallow ? value : toReactive(value);
        // 如果不是shallow的情况且value如果是响应式的，则需要拿到原始对象
        this._rawValue = __v_isShallow ? value : toRaw(value);
        this.deps = new Set();
    }
    get value() {
        trackRefValue(this);
        return this._value;
    }
    set value(newValue) {
        // 如果不是shallow的情况且value如果是响应式的，则需要拿到原始对象
        newValue = this.__v_isShallow ? newValue : toRaw(newValue);
        // 比较的时候拿原始值去比较
        if (hasChanged(newValue, this._rawValue)) {
            this._rawValue = newValue;
            // 如果不是shallow的情况且新的值时普通对象的话需要去响应式处理
            this._value = this.__v_isShallow ? newValue : toReactive(newValue);
            triggerRefValue(this);
        }
    }
}
class ObjectRefImpl {
    constructor(_target, _key) {
        this._target = _target;
        this._key = _key;
        this.__v_isRef = true;
    }
    get value() {
        const val = this._target[this._key];
        return val;
    }
    set value(newValue) {
        this._target[this._key] = newValue;
    }
}
function ref(value) {
    return createRef(value, false);
}
// 代理ref对象，使之不需要要通过.value去访问值（例如在template里面使用ref时不需要.value）
function proxyRefs(objectWithRefs) {
    // 如果是reactive对象则不需要处理，直接返回对象
    return isReactive(objectWithRefs)
        ? objectWithRefs
        : new Proxy(objectWithRefs, {
            get(target, key, receiver) {
                return unRef(Reflect.get(target, key, receiver));
            },
            set(target, key, newValue, receiver) {
                // 旧的值是ref，但是新的值不是ref时，直接修改.value的值。否则直接设置新值
                const oldValue = target[key];
                if (isRef(oldValue) && !isRef(newValue)) {
                    oldValue.value = newValue;
                    return true;
                }
                return Reflect.set(target, key, newValue, receiver);
            },
        });
}
// 浅ref，只对value做响应式处理
function shallowRef(value) {
    return createRef(value, true);
}
// 判断一个值是不是ref
function isRef(ref) {
    return !!(ref && ref.__v_isRef === true);
}
// 如果参数是一个ref，则返回内部值，否则返回参数本身
function unRef(ref) {
    return isRef(ref) ? ref.value : ref;
}
// 收集ref的依赖函数
function trackRefValue(ref) {
    if (canTrack()) {
        trackEffects(ref.deps || (ref.deps = createDep()));
    }
}
// 触发ref依赖函数
function triggerRefValue(ref) {
    if (ref.deps) {
        triggerEffects(ref.deps);
    }
}
// 可以用来为源响应式对象上的某个 property 新创建一个 ref。然后，ref 可以被传递，它会保持对其源 property 的响应式连接
function toRef(object, key) {
    return isRef(object) ? object : new ObjectRefImpl(object, key);
}
// 将响应式对象转换为普通对象，其中结果对象的每个 property 都是指向原始对象相应 property 的 ref
function toRefs(object) {
    if (isRef(object))
        return object;
    const result = isArray(object) ? new Array(object.length) : {};
    for (const key in object) {
        result[key] = toRef(object, key);
    }
    return result;
}
// 创建ref的工厂函数
function createRef(value, shallow) {
    return new RefImpl(value, shallow);
}

/*
 * @Author: Zhouqi
 * @Date: 2022-03-30 09:49:57
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-14 22:07:32
 */
/**
 * @author: Zhouqi
 * @description: 事件触发函数
 * @param instance 组件实例
 * @param event 事件名
 */
function emit(instance, event, ...rawArg) {
    const { props } = instance;
    /**
     * 针对两种事件名做处理
     * add-name 烤肉串命名
     * addName 驼峰命名
     * 如果是烤肉串命名，先转换为驼峰命名，再转化为AddName这种名称类型
     */
    const handler = props[toHandlerKey(event)] || props[toHandlerKey(camelize(event))];
    if (handler) {
        handler(...rawArg);
    }
}

/*
 * @Author: Zhouqi
 * @Date: 2022-03-28 22:34:06
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-16 13:55:28
 */
/**
 * @author: Zhouqi
 * @description: 初始化props
 * @param instance 组件实例
 * @param rawProps 初始状态下的props
 * @param isStateful 是否是有状态组件
 */
function initProps(instance, rawProps, isStateful) {
    // instance.props = rawProps || {};
    const attrs = {};
    // 创建一个props对象，区分组件实例上的props和虚拟dom上的props
    // 组件实例上的props只能访问到组件propsOptions定义的属性，区分出了attrs
    // vnode上的props是渲染用的props，没有区分attrs
    const props = {};
    setFullProps(instance, rawProps, props, attrs);
    for (const key in instance.propsOptions[0]) {
        // 没有传入的props值默认置为undefined
        if (!(key in props)) {
            props[key] = undefined;
        }
    }
    // 校验数据是否合法
    validateProps(rawProps || {}, props, instance);
    // 有状态组件
    if (isStateful) {
        instance.props = shallowReactive(props);
    }
    else {
        // 函数式组件
        if (instance.type.props) {
            // 如果函数式组件定义了接收的propsOpitons，则props就是接收的只是propsOpiton上定义的属性
            instance.props = props;
        }
        else {
            // 否则props就是attrs
            instance.props = attrs;
        }
    }
    instance.attrs = attrs;
}
/**
 * @author: Zhouqi
 * @description: 检验props合法性
 * @param rawProps 原始数据
 * @param props 经过setFullProps处理过的props
 * @param instance 组件实例
 */
function validateProps(rawProps, props, instance) {
    const [options] = instance.propsOptions;
    for (const key in options) {
        const opt = options[key];
        if (!opt)
            continue;
        validateProp(key, props[key], opt, !hasOwn(rawProps, key));
    }
}
/**
 * @author: Zhouqi
 * @description: 校验单个prop的值
 * @param key 属性名
 * @param value 属性值
 * @param propOption 校验选项
 * @param isAbsent 传入的prop中是否缺少指定的prop key
 */
function validateProp(key, value, propOption, isAbsent) {
    const { type, required, validator } = propOption;
    // 如果是必填的但是没有传值，就警告
    if (required && isAbsent) {
        console.warn(`${key} is Required`);
        return;
    }
    // value是null或者undefined且不需要必填时，直接跳过
    if (value == null && !required) {
        return;
    }
    if (type) {
        const types = isArray(type) ? type : [type];
        let isValid = false;
        for (let i = 0; i < types.length && !isValid; i++) {
            const { valid } = assertType(value, types[i]);
            isValid = valid;
        }
        if (!isValid) {
            console.warn("校验不通过");
            return;
        }
    }
    // 自定义校验器
    if (validator && !validator(value)) {
        console.warn("校验不通过");
    }
}
// 基础类型
const simpleType = [
    "String",
    "Number",
    "Boolean",
    "Function",
    "Symbol",
    "BigInt",
];
/**
 * @author: Zhouqi
 * @description: 校验值是指定的类型
 * @param value 值
 * @param type 类型
 */
function assertType(value, type) {
    let valid;
    const expectedType = getType(type);
    if (simpleType.includes(expectedType)) {
        // 校验基础类型
        const valueType = typeof value;
        valid = valueType === expectedType.toLowerCase();
        // 如果校验不通过但是值是obj，则需要去查找原型链
        if (!valid && valueType === "object") {
            valid = value instanceof type;
        }
    }
    // 校验引用（特殊）类型
    else if (expectedType === "Object") {
        valid = isObject(value);
    }
    else if (expectedType === "Array") {
        valid = isArray(value);
    }
    else if (expectedType === "null") {
        valid = value === null;
    }
    else {
        valid = value instanceof type;
    }
    return {
        valid,
    };
}
/**
 * @author: Zhouqi
 * @description: 处理props和attrs
 * @param instance 组件实例
 * @param rawProps props对象
 * @param props 处理后最终的props
 * @param attrs 处理后最终的attrs
 */
function setFullProps(instance, rawProps, props, attrs) {
    const [normalized, needCastKeys] = instance.propsOptions;
    let rawCastValues = {};
    if (rawProps) {
        for (const key in rawProps) {
            // 对于保留关键字不需要处理，例如key、ref，这里不像vue3一样用isReservedProp函数做处理
            if (key === "ref" || key === "key") {
                continue;
            }
            const value = rawProps[key];
            let camelKey;
            // 统一转为驼峰命名
            if (normalized && hasOwn(normalized, (camelKey = camelize(key)))) {
                const shouldCast = needCastKeys && needCastKeys.includes(camelKey);
                shouldCast
                    ? (rawCastValues[camelKey] = value)
                    : (props[camelKey] = value);
            }
            else {
                // 处理attrs
                if (!(key in attrs) || attrs[camelKey] !== value) {
                    attrs[camelKey] = value;
                }
            }
        }
    }
    // 特殊处理
    if (needCastKeys) {
        const castValues = rawCastValues || EMPTY_OBJ;
        const len = needCastKeys.length;
        for (let i = 0; i < len; i++) {
            const key = needCastKeys[i];
            props[key] = resolvePropValue(normalized, props, key, castValues[key], instance, !hasOwn(castValues, key));
        }
    }
}
/**
 * @author: Zhouqi
 * @description: 解析props值，做一定的特殊处理
 * @param options props规则
 * @param props 处理后最终的props
 * @param key 属性名
 * @param value 属性值
 * @param instance 组件实例
 * @param isAbsent 在传入的props上是否有propsOptions校验规则上的key
 */
function resolvePropValue(options, props, key, value, instance, isAbsent) {
    const opt = options[key];
    if (opt) {
        const hasDefaultKey = hasOwn(opt, "default");
        if (hasDefaultKey && value === undefined) {
            const defaultValue = opt.default;
            value = defaultValue;
        }
        // 对于boolean类型数据的处理
        if (opt[0 /* shouldCast */]) {
            //  如果校验类型里面有属性但是传入的props里面没有对应的属性且没有默认值的情况下value默认置为false
            if (isAbsent && !hasDefaultKey) {
                value = false;
            }
            else if (opt[1 /* shouldCastTrue */] && value === "") {
                // 针对html特定boolean属性值的兼容处理
                value = true;
            }
        }
    }
    return value;
}
/**
 * @author: Zhouqi
 * @description: 校验props选项的名称是否有效
 * @param {string} key 属性名
 */
function validatePropName(key) {
    // $开头的可能会和组件内部保留的属性名重复
    if (key[0] !== "$") {
        return true;
    }
    return false;
}
/**
 * @author: Zhouqi
 * @description: 解析组件上的propsOptions
 * @param comp 组件数据对象
 */
function normalizePropsOptions(comp) {
    /**
     * ropsOptions类型
     * 1、数组 =====> props:['name','value']
     * 2、对象 =====> props:{name:{type:'xxx'……}} || props:{name:Person} || props:{name:[String,……]}
     */
    const { props: rawPropsOptions } = comp;
    const normalized = {};
    const needCastKeys = [];
    if (isArray(rawPropsOptions)) {
        const propsLength = rawPropsOptions.length;
        for (let i = 0; i < propsLength; i++) {
            const normalizedKey = camelize(rawPropsOptions[i]);
            if (validatePropName(normalizedKey)) {
                // 如果属性名符合规范，则默认初始化为空对象
                normalized[normalizedKey] = EMPTY_OBJ;
            }
        }
    }
    else if (isObject(rawPropsOptions)) {
        for (const key in rawPropsOptions) {
            const normalizedKey = camelize(key);
            if (validatePropName(normalizedKey)) {
                const options = rawPropsOptions[key];
                // 如果属性名对应的值是一个数组或者函数，那么这个值就是name对应的type
                const prop = (normalized[normalizedKey] =
                    isArray(options) || isFunction(options)
                        ? { type: options }
                        : options);
                const booleanIndex = getTypeIndex(Boolean, prop.type);
                const stringIndex = getTypeIndex(String, prop.type);
                // 对于Boolean类型的props值需要处理的标记
                prop[0 /* shouldCast */] = booleanIndex > -1;
                // 是否需要将Boolean类型的值处理为true的标记，比如’‘处理为true，这个跟html上的绑定属性有着一定的关联
                // 例如 <button disabled></button>本意为禁用，但是经过模板解析后成了props:{disabled:''}
                // ''这个值通过el.disabled（disabled的这个属性值在dom元素上的类型为Boolean）设置会转化为false，也就是不禁用。
                // 这显然和用户的真实意图相反，因此这里对于空字符串的属性值需要特殊处理，即把空字符串转换为true
                prop[1 /* shouldCastTrue */] =
                    stringIndex < 0 || booleanIndex < stringIndex;
                // 校验类型为boolean的或者有default默认值配置的props key值需要特殊处理
                if (booleanIndex > -1 || hasOwn(prop, "default")) {
                    // 这里把需要特殊处理的key先添加到needCastKeys数组中供后面initProps使用
                    needCastKeys.push(normalizedKey);
                }
            }
        }
    }
    return [normalized, needCastKeys];
}
/**
 * @author: Zhouqi
 * @description: 更新组件props
 * @param instance 组件实例
 * @param rawProps 新的props
 * @param rawPrevProps 旧的props
 */
function updateProps(instance, rawProps, rawPrevProps) {
    const { props, attrs } = instance;
    // 简单一点，全量更新
    setFullProps(instance, rawProps, props, attrs);
    // 删除不存在的props
    for (const key in rawPrevProps) {
        if (!(key in rawProps)) {
            delete props[key];
        }
    }
}
/**
 * @author: Zhouqi
 * @description: 查找给定构造函数在传入的构造函数中的位置
 * @param  type
 * @param  expectedTypes
 */
function getTypeIndex(type, expectedTypes) {
    if (isArray(expectedTypes)) {
        return expectedTypes.findIndex((t) => isSameType(t, type));
    }
    else if (isFunction(expectedTypes)) {
        return isSameType(type, expectedTypes) ? 0 : -1;
    }
    return -1;
}
/**
 * @author: Zhouqi
 * @description: 检测两个构造函数是否相同
 * @param t1 类型
 * @param t2 类型
 */
function isSameType(t1, t2) {
    return getType(t1) == getType(t2);
}
/**
 * @author: Zhouqi
 * @description: 获取构造函数名称，function Xxx (){}中的Xxx
 * @param ctor 类型
 */
function getType(ctor) {
    const match = ctor && ctor.toString().match(/^\s*function (\w+)/);
    return match ? match[1] : ctor === null ? "null" : "";
}

/*
 * @Author: Zhouqi
 * @Date: 2022-03-27 21:17:03
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-07 11:59:07
 */
// 建立map映射对应vnode上的属性，利于扩展
const publicPropertiesMap = {
    $el: (i) => i.vnode.el,
    $slots: (i) => shallowReadonly(i.slots),
    $props: (i) => shallowReadonly(i.props),
    $attrs: (i) => shallowReadonly(i.attrs),
};
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        const { setupState, props } = instance;
        if (hasOwn(props, key)) {
            return props[key];
        }
        else if (setupState && hasOwn(setupState, key)) {
            return setupState[key];
        }
        // 属性映射表上有对应的属性则返回对应的属性值
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    },
};

/*
 * @Author: Zhouqi
 * @Date: 2022-03-30 21:16:45
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-16 14:19:37
 */
/**
 * 插槽的vnode结构
 */
/**
 * @author: Zhouqi
 * @description: 初始化插槽
 * @param instance 组件实例
 * @param children 插槽节点
 */
function initSlots(instance, children) {
    // 判断是不是插槽节点
    if (32 /* SLOTS_CHILDREN */ & instance.vnode.shapeFlag) {
        normalizeObjectSlots(children, (instance.slots = {}));
    }
}
/**
 * @author: Zhouqi
 * @description: 将children中的插槽节点赋值到组件实例的slots对象上
 * @param children 插槽节点
 * @param slots 插槽数据存储目标
 */
function normalizeObjectSlots(children, slots) {
    // slots是一个对象，用于实现具名插槽
    for (const key in children) {
        const slot = children[key];
        // 将插件转换为函数实现作用于插槽
        slots[key] = (props) => normalizeSlotValue(slot(props));
    }
}
/**
 * @author: Zhouqi
 * @description: 对插槽值对处理，转换成数组类型的子节点
 * @param slot 插槽数据
 */
function normalizeSlotValue(slot) {
    return isArray(slot) ? slot : [slot];
}
/**
 * @author: Zhouqi
 * @description: 更新插槽节点
 * @param instance 组件实例
 * @param children 子节点
 */
function updateSlots(instance, children) {
    const { slots } = instance;
    // 判断是不是插槽节点
    if (32 /* SLOTS_CHILDREN */ & instance.vnode.shapeFlag) {
        normalizeObjectSlots(children, slots);
    }
    // 删除不存在slot key
    {
        for (const key in slots) {
            if (!(key in children)) {
                delete slots[key];
            }
        }
    }
}

/*
 * @Author: Zhouqi
 * @Date: 2022-03-26 22:15:52
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-16 17:42:09
 */
/**
 * @author: Zhouqi
 * @description: 创建组件实例
 * @param vnode 虚拟节点
 * @param parent 父组件实例
 */
function createComponentInstance(vnode, parent) {
    const type = vnode.type;
    const componentInstance = {
        vnode,
        type,
        parent,
        isMounted: false,
        subTree: null,
        emit: null,
        next: null,
        proxy: null,
        provides: parent ? parent.provides : Object.create(null),
        propsOptions: normalizePropsOptions(type),
        props: EMPTY_OBJ,
        attrs: EMPTY_OBJ,
        slots: EMPTY_OBJ,
        ctx: EMPTY_OBJ,
        setupState: EMPTY_OBJ,
        inheritAttrs: type.inheritAttrs,
        // lifecycle hooks
        bm: null,
        m: null,
        bu: null,
        u: null,
        bum: null,
        um: null,
    };
    // 在_属性中存储组件实例对象
    componentInstance.ctx = { _: componentInstance };
    componentInstance.emit = emit.bind(null, componentInstance);
    return componentInstance;
}
/**
 * @author: Zhouqi
 * @description: 是否是有状态组件
 * @param  instance 组件实例
 */
function isStatefulComponent(instance) {
    return instance.vnode.shapeFlag & 4 /* STATEFUL_COMPONENT */;
}
/**
 * @author: Zhouqi
 * @description: 初始化组件
 * @param instance 组件实例
 */
function setupComponent(instance) {
    const { props, children } = instance.vnode;
    const isStateful = isStatefulComponent(instance);
    // 初始化props
    initProps(instance, props, isStateful);
    // 初始化slots
    initSlots(instance, children);
    const setupResult = isStateful ? setupStatefulComponent(instance) : undefined;
    return setupResult;
}
let currentInstance = null;
/**
 * @author: Zhouqi
 * @description: 获取当前的组件实例
 */
function getCurrentInstance() {
    return currentInstance;
}
/**
 * @author: Zhouqi
 * @description: 有状态组件
 * @param instance
 */
function setupStatefulComponent(instance) {
    const { type: component, props, emit, attrs, slots } = instance;
    const { setup } = component;
    // 这里只是代理了instance上的ctx对象
    // 在处理函数中由于需要instance组件实例，因此需要在ctx中增加一个变量_去存储组件实例，供处理函数内部访问
    // 通过这个代理，我们就能用this.xxx去访问数据了
    instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers);
    // 调用组件上的setup方法获取到数据
    if (setup) {
        setCurrentInstance(instance);
        // props是浅只读的，在开发模式下是shallowReadonly类型，生产环境下不会进行shallowReadonly处理，这里默认进行shallowReadonly处理
        const setupResult = setup(shallowReadonly(props), { emit, attrs, slots }) || {};
        unsetCurrentInstance();
        handleSetupResult(instance, setupResult);
    }
}
/**
 * @author: Zhouqi
 * @description: 处理setup返回值
 * @param instance 组件实例
 * @param setupResult setup返回值
 */
function handleSetupResult(instance, setupResult) {
    if (isObject(setupResult)) {
        // 如果结果是对象，说明返回的是数据
        instance.setupState = proxyRefs(setupResult);
    }
    else if (isFunction(setupResult)) {
        // 如果是函数，则表示渲染函数
        instance.render = setupResult;
    }
    finishComponentSetup(instance);
}
/**
 * @author: Zhouqi
 * @description: 完成组件初始化
 * @param instance 组件实例
 */
function finishComponentSetup(instance) {
    const { type: component } = instance;
    if (!instance.render) {
        if (!component.render) {
            const { template } = component;
            if (template) {
                component.render = compile(template);
            }
        }
        instance.render = component.render || NOOP;
    }
}
/**
 * @author: Zhouqi
 * @description: 修改当前组件实例
 * @param instance 当前组件实例
 */
const setCurrentInstance = (instance) => {
    currentInstance = instance;
};
/**
 * @author: Zhouqi
 * @description: 重置当前组件实例
 */
const unsetCurrentInstance = () => {
    currentInstance = null;
};
let compile;
/**
 * @author: Zhouqi
 * @description: 注册一个运行时编译函数，传入compile函数来编译template
 * @param {any} _compile
 * @return {*}
 */
function registerRuntimeCompiler(_compile) {
    compile = _compile;
}

/*
 * @Author: Zhouqi
 * @Date: 2022-04-02 14:43:10
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-14 22:07:23
 */
/**
 * @author: Zhouqi
 * @description: 依赖提供
 * @param key 键
 * @param value 值
 */
function provide(key, value) {
    if (!currentInstance) {
        return;
    }
    const instance = currentInstance;
    let provides = instance.provides;
    const parentProvides = instance.parent && instance.parent.provides;
    /**
     * 默认情况下，当前组件实例的provides继承父组件的provides
     * 如果当前组件需要定义provides，则需要实现原型链的方式，避免当前组件实例在创建provides的时候
     * 影响到父组件的provides。
     * 当通过inject注入的时候，也是按照原型链的方式去查找
     */
    if (provides === parentProvides) {
        // 如果当前组件实例的provides等于父组件的provides，则表示初始化的状态，此时设置当前组件provides的原型为父组件的provides
        provides = instance.provides = Object.create(parentProvides);
    }
    provides[key] = value;
}
/**
 * @author: Zhouqi
 * @description: 依赖注入
 * @param key 键
 * @param defaultValue 默认值
 * @param treatDefaultAsFactory 如果默认值是一个函数，是否执行函数得到返回结果
 */
function inject(key, defaultValue, treatDefaultAsFactory = false) {
    var _a;
    const instance = currentInstance;
    if (instance) {
        const provides = (_a = instance.parent) === null || _a === void 0 ? void 0 : _a.provides;
        // 如果要注入的key存在于父组件的provides中则返回值
        if (key in provides) {
            return provides[key];
        }
        // 如果要注册的key不存在于父组件的provides中，则有默认值时返回默认值
        if (defaultValue) {
            return treatDefaultAsFactory && isFunction(defaultValue)
                ? defaultValue.call(instance.proxy)
                : defaultValue;
        }
    }
}

/*
 * @Author: Zhouqi
 * @Date: 2022-04-03 14:53:41
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-06 17:53:11
 */
function createAppApi(render) {
    return function createApp(rootComponent) {
        const app = {
            _container: null,
            use() { },
            mixin() { },
            component() { },
            directive() { },
            mount(rootContainer) {
                // 创建虚拟节点
                const vnode = createVnode(rootComponent);
                // 渲染真实节点
                render(vnode, rootContainer);
                app._container = rootContainer;
            },
            unmount() {
                render(null, app._container);
            },
            provide() { },
        };
        return app;
    };
}

/*
 * @Author: Zhouqi
 * @Date: 2022-04-05 20:00:07
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-16 21:32:18
 */
/**
 * @author: Zhouqi
 * @description: 生成组件的vnode
 * @param instance 组件实例
 */
function renderComponentRoot(instance) {
    const { attrs, props, render, proxy, vnode, inheritAttrs, type: Component, emit, slots, } = instance;
    let fallthroughAttrs;
    let result;
    if (vnode.shapeFlag & 4 /* STATEFUL_COMPONENT */) {
        // 处理有状态组件
        result = normalizeVNode(render.call(proxy, proxy));
        fallthroughAttrs = attrs;
    }
    else {
        // 函数式组件就是一个render函数
        const render = Component;
        // 如果函数式组件定义了1一个以上的参数，则第二个参数为context对象，否则为null
        result = normalizeVNode(render(props, render.length > 1 ? { attrs, slots, emit } : null));
        fallthroughAttrs = attrs;
    }
    // attrs存在且可以继承attrs属性的情况下
    if (fallthroughAttrs && inheritAttrs !== false) {
        const attrsKeys = Object.keys(fallthroughAttrs);
        const { shapeFlag } = result;
        if (attrsKeys.length &&
            shapeFlag & (1 /* ELEMENT */ | 6 /* COMPONENT */)) {
            result = cloneVNode(result, fallthroughAttrs);
        }
    }
    return result;
}
/**
 * @author: Zhouqi
 * @description: 是否需要更新组件
 * @param n1 旧的虚拟节点
 * @param n2 新的虚拟节点
 */
function shouldUpdateComponent(n1, n2) {
    const { props: prevProps, children: prevChildren } = n1;
    const { props: nextProps, children: nextChildren } = n2;
    if (prevChildren || nextChildren) {
        if (!nextChildren || !nextChildren.$stable) {
            return true;
        }
    }
    if (prevProps === nextProps) {
        return false;
    }
    if (!prevProps) {
        return !!nextProps;
    }
    if (!nextProps) {
        return true;
    }
    return hasPropsChanged(prevProps, nextProps);
}
/**
 * @author: Zhouqi
 * @description: 比较新旧props是否变化
 * @param prevProps
 * @param nextProps
 */
function hasPropsChanged(prevProps, nextProps) {
    if (Object.keys(prevProps).length !== Object.keys(prevProps).length) {
        return false;
    }
    for (const key in nextProps) {
        if (nextProps[key] !== prevProps[key]) {
            return true;
        }
    }
    return false;
}

/*
 * @Author: Zhouqi
 * @Date: 2022-04-05 21:16:28
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-15 12:23:31
 */
// 微任务队列
const queue = [];
// 创建微任务
const resolvedPromise = Promise.resolve();
// 是否正在调度任务
let isFlushing = false;
// 正在等待的PostFlush队列
const pendingPostFlushCbs = [];
// 正在执行的PostFlush队列
let activePostFlushCbs = null;
/**
 * @author: Zhouqi
 * @description: 调度任务队列
 * @param job 任务
 */
function queueJob(job) {
    if (!queue.includes(job)) {
        queue.push(job);
    }
    queueFlush();
}
/**
 * @author: Zhouqi
 * @description:
 * @param  cb postFlush类型的回调任务
 * @param  activeQueue 正在执行的postFlush队列
 * @param  pendingQueue 等待执行的postFlush队列
 */
function queueCb(cb, activeQueue, pendingQueue) {
    // cb是array说明是组件的生命周期回调函数
    if (isArray(cb)) {
        pendingQueue.push(...cb);
    }
    else {
        // 单独的任务 比如watch的scheduler调度器
        pendingQueue.push(cb);
    }
    queueFlush();
}
/**
 * @author: Zhouqi
 * @description: 往pendingPostFlushCbs中添加postFlush类型的任务
 * @param cb 回调任务
 */
function queuePostFlushCb(cb) {
    queueCb(cb, activePostFlushCbs, pendingPostFlushCbs);
}
/**
 * @author: Zhouqi
 * @description: 执行postFlush任务
 */
function flushPostFlushCbs() {
    if (!pendingPostFlushCbs.length)
        return;
    const deduped = [...new Set(pendingPostFlushCbs)];
    // 清空队列，避免flushPostFlushCbs多次调用执行多次相同任务
    pendingPostFlushCbs.length = 0;
    if (activePostFlushCbs) {
        activePostFlushCbs.push(...deduped);
        return;
    }
    activePostFlushCbs = deduped;
    for (let i = 0; i < activePostFlushCbs.length; i++) {
        const postFlushJob = activePostFlushCbs[i];
        postFlushJob();
    }
    activePostFlushCbs = null;
}
/**
 * @author: Zhouqi
 * @description: 执行微任务
 */
function queueFlush() {
    // 避免多次调用
    if (!isFlushing) {
        resolvedPromise.then(flushJobs);
    }
}
/**
 * @author: Zhouqi
 * @description: 执行微任务队列中的任务
 */
function flushJobs() {
    isFlushing = true;
    try {
        for (let i = 0; i < queue.length; i++) {
            const job = queue[i];
            job();
        }
    }
    catch (error) {
        console.log(error);
    }
    finally {
        isFlushing = false;
        // 任务执行完成，重置微任务队列
        queue.length = 0;
        // 执行需要在更新之后触发的任务
        flushPostFlushCbs();
    }
}

/*
 * @Author: Zhouqi
 * @Date: 2022-04-06 10:04:06
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-08 19:38:42
 */
/**
 * @author: Zhouqi
 * @description: 注入钩子函数
 * @param  lifecycleHook 生命周期钩子名称
 * @param  hook 要触发的生命周期函数
 */
function injectHooks(lifecycleHook, hook, target = currentInstance) {
    if (target) {
        const hooks = target[lifecycleHook] || (target[lifecycleHook] = []);
        // 包装一层
        const wrappedHook = () => {
            /**
             * 在执行生命周期函数时可能需要访问当前组件实例getCurrentInstance
             * 但是执行生命周期回调函数的时机是在setup之后，会访问不到当前组件实例
             * 因此我们需要在这里重新设置currentInstance
             */
            setCurrentInstance(target);
            hook();
            // 重置currentInstance
            unsetCurrentInstance();
        };
        hooks.push(wrappedHook);
    }
}
/**
 * @author: Zhouqi
 * @description: 注册生命周期钩子函数
 * @param LifecycleHook 生命周期钩子名称
 */
const createHook = (lifecycleHook) => (hook) => injectHooks(lifecycleHook, hook);
// 只能在setup中使用，因为内部需要使用当前组件实例
// 组件挂载之前触发
const onBeforeMount = createHook("bm" /* BEFORE_MOUNT */);
// 组件挂载后触发
const onMounted = createHook("m" /* MOUNTED */);
// 组件更新前触发
const onBeforeUpdate = createHook("bu" /* BEFORE_UPDATE */);
// 更新后触发
const onUpdated = createHook("u" /* UPDATED */);
// 组件卸载之前触发
const onBeforeUnmount = createHook("bum" /* BEFORE_UNMOUNT */);
// 组件卸载完成后触发
const onUnmounted = createHook("um" /* UNMOUNTED */);

/*
 * @Author: Zhouqi
 * @Date: 2022-04-16 17:21:02
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-17 14:41:01
 */
// 判断是否是KeepAlive组件
const isKeepAlive = (vnode) => vnode.type.__isKeepAlive;
// TODO lifecycle of deactive and active
/**
 * KeepAlive组件原理：
 * KeepAlive可以缓存其内部渲染过的组件。当一个新的组件被渲染的时候，KeepAlive会将其渲染时的vnode和key建立一个映射关系，存储在一个缓存对象中（cache<Map>）
 * 被渲染的组件会被标记上COMPONENT_SHOULD_KEEP_ALIVE，当该组件因为切换（比如：v-if）而进入unmount阶段时不会被直接卸载，而是将其DOM片段移入到一个隐藏容器中（storageContainer）
 * 当该组件再次需要展示的时候，KeepAlive内部会拿到该组件的key，通过key去缓存对象中查找缓存的渲染时vnode，将缓存的部分数据更新到新的vnode上并将组件标记为COMPONENT_KEPT_ALIVE，
 * 这个标记表示组件是从缓存中拿的，这样在patch的时候就不会重新挂载，而是调用activate将其DOM从隐藏容器中移动到真实页面上并更新props（props可能会变化）。
 *
 * 缓存管理：
 * KeepAlive有一个max配置，可以限制缓存组件的数量，当超过缓存的最大数量限制时，通过LRU的方式删除最近最少访问的组件缓存。
 *
 * include和exclude的原理就是将组件名跟匹配字符串进行匹配，匹配到的组件才能被缓存/不缓存
 */
const KeepAlive = {
    name: "KeepAlive",
    __isKeepAlive: true,
    props: {
        include: [String, RegExp, Array],
        exclude: [String, RegExp, Array],
        max: [String, Number],
    },
    setup(props, { slots }) {
        // 获取KeepAlive组件实例
        const instance = getCurrentInstance();
        // 获取上下文对象ctx
        const sharedContext = instance.ctx;
        // 当前渲染的组件vnode
        let current = null;
        // 从渲染器中获取DOM操作
        const { renderer: { p: patch, m: move, um: _unmount, o: { createElement }, }, } = sharedContext;
        // 隐藏容器
        const storageContainer = createElement("div");
        // 缓存组件（渲染时）的vnode的容器
        // 键是vnode的type或者用户绑定的key
        // 值是vnode
        const cache = new Map();
        // 管理缓存组件的key
        const keys = new Set();
        // 在上下文对象中绑定activate方法，在patch的时候调用进行DOM搬运
        sharedContext.activate = (vnode, container, anchor) => {
            const instance = vnode.component;
            // 从隐藏容器走移走缓存的DOM，插入到页面中
            move(vnode, container, anchor);
            // 可能props更新了，这里需要patch一下
            patch(instance.vnode, vnode, container, anchor, instance);
        };
        // 在上下文对象中绑定deactivate方法，在unmount的时候调用进行DOM搬运
        sharedContext.deactivate = (vnode) => {
            // 获取unmount阶段vnode的组件实例，将对应的DOM移入到storageContainer中隐藏。
            move(vnode, storageContainer, null);
        };
        // 缓存组件卸载操作
        function unmount(vnode) {
            // 需要重置vnode类型以便在后面unmount的时候可以正常卸载
            resetShapeFlag(vnode);
            _unmount(vnode, instance);
        }
        // 超出缓存最大数量，根据lru规则淘汰最近最少访问的组件
        function pruneCacheEntry(key) {
            // 获取最近最少访问的组件
            const cached = cache.get(key);
            if (!current || cached.type !== current.type) {
                // 如果当前组件vnode不存在或者需要淘汰的组件不是当前组件，则直接卸载需要淘汰的组件
                unmount(cached);
            }
            else if (current) {
                // 重置当前组件的vnode的类型，因为可能当前组件就是将要被淘汰的组件，比如max是1的情况下，这个时候不能
                // 立即删除，所以需要重置它的类型以便在后面unmount的时候可以正常卸载
                resetShapeFlag(current);
            }
            // 删除对应缓存的vnode和key
            cache.delete(key);
            keys.delete(key);
        }
        // 组件vnode缓存时的key，由于缓存的时候需要缓存渲染器渲染时的vnode（keep-alive组件渲染后的subTree）
        // 因此不能直接缓存slots获取到的vnode，这里通过定义一个pendingCacheKey来记录当前组件的key，并和渲染时
        // 组件的vnode关联起来。
        let pendingCacheKey = null;
        const cacheSubTree = () => {
            if (pendingCacheKey != null) {
                // 缓存组件的vnode
                cache.set(pendingCacheKey, instance.subTree);
            }
        };
        onMounted(cacheSubTree);
        onUpdated(cacheSubTree);
        // TODO onBeforeUnmount 清空并卸载缓存的所有组件
        return () => {
            pendingCacheKey = null;
            // 没有要渲染的插槽组件则直接返回
            if (!slots.default) {
                return null;
            }
            // 获取默认插槽数据
            const children = slots.default();
            // 要渲染的组件vnode
            const vnode = children[0];
            if (children.length > 1) {
                console.warn("KeepAlive组件内部只允许有一个子组件");
                current = null;
                return children;
            }
            else if (!(vnode.shapeFlag & 4 /* STATEFUL_COMPONENT */)) {
                current = null;
                // 如果vnode不是一个有状态组件的话，则直接返回vnode
                return vnode;
            }
            const { include, exclude, max } = props;
            // 获取组件配置
            const comp = vnode.type;
            const vnodeKey = vnode.key;
            const name = vnode.type.name;
            // 如果要缓存的组件不在用户定义之内，则不缓存，直接返回vnode
            if ((include && (!name || !matches(include, name))) ||
                (exclude && name && matches(exclude, name))) {
                current = vnode;
                return vnode;
            }
            // 获取key
            const key = vnodeKey == null ? comp : vnodeKey;
            // 拿到缓存的vnode
            const cacheVnode = cache.get(key);
            if (cacheVnode) {
                // 如果存在缓存的组件，则取出缓存的组件，将el和组件实例赋值到当前组件的vnode上
                vnode.el = cacheVnode.el;
                vnode.component = cacheVnode.component;
                // 更新组件标志，防止重新mount一次组件
                vnode.shapeFlag |= 512 /* COMPONENT_KEPT_ALIVE */;
                // 更新最新访问的组件
                keys.delete(key);
                keys.add(key);
            }
            else {
                pendingCacheKey = key;
                // 没有缓存过当前组件，则加入到缓存中，这里不缓存vnode
                keys.add(key);
                // 如果超出缓存的最大数量，需要移除最近最少访问的组件缓存
                if (max && keys.size > parseInt(max)) {
                    // 通过迭代器的next方法获取第一个key，这个key就是最近最少访问的组件key
                    const key = keys.values().next().value;
                    pruneCacheEntry(key);
                }
            }
            // 标记组件的是一个需要被keep-alive的，避免直接unmount的时候被卸载
            vnode.shapeFlag |= 256 /* COMPONENT_SHOULD_KEEP_ALIVE */;
            current = vnode;
            return vnode;
        };
    },
};
/**
 * @author: Zhouqi
 * @description: 重置vnode的类型
 * @param  vnode 组件的虚拟节点
 */
function resetShapeFlag(vnode) {
    let shapeFlag = vnode.shapeFlag;
    if (shapeFlag & 256 /* COMPONENT_SHOULD_KEEP_ALIVE */) {
        shapeFlag -= 256 /* COMPONENT_SHOULD_KEEP_ALIVE */;
    }
    if (shapeFlag & 512 /* COMPONENT_KEPT_ALIVE */) {
        shapeFlag -= 512 /* COMPONENT_KEPT_ALIVE */;
    }
    vnode.shapeFlag = shapeFlag;
}
/**
 * @author: Zhouqi
 * @description: 组件名是否匹配
 * include="['a', 'b']"
 * include="/a|b/"
 * include="a,b"
 * @param pattern 匹配表达式
 * @param name 组件名
 * @return 是否匹配
 */
function matches(pattern, name) {
    // 三种类型：正则、数组、字符串逗号拼接
    if (isArray(pattern)) {
        // 数组
        return pattern.some((p) => matches(p, name));
    }
    else if (isString(pattern)) {
        // 字符串
        return pattern.split(",").includes(name);
    }
    else if (pattern.test) {
        // 正则
        return pattern.test(name);
    }
    return false;
}

/*
 * @Author: Zhouqi
 * @Date: 2022-03-26 21:59:49
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-17 19:20:36
 */
const queuePostRenderEffect = queuePostFlushCb;
/**
 * @author: Zhouqi
 * @description: 自定义渲染器
 * @param options 传入的平台渲染方法集合
 */
function createRenderer(options) {
    return baseCreateRenderer(options);
}
/**
 * @author: Zhouqi
 * @description: 创建基础渲染器函数
 * @param options 传入的平台渲染方法集合
 */
function baseCreateRenderer(options) {
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert, remove: hostRemove, setElementText: hostSetElementText, setText: hostSetText, createText: hostCreateText, createComment: hostCreateComment, nextSibling: hostNextSibling, } = options;
    /**
     * @author: Zhouqi
     * @description: 更新函数
     * @param n1 老的虚拟节点
     * @param n2 新的虚拟节点
     * @param container 容器
     * @param anchor 锚点元素
     * @param parentComponent 父组件实例
     */
    const patch = (n1, n2, container, anchor = null, parentComponent) => {
        if (n1 === n2)
            return;
        // 1. 更新的时候可能vnode对应的key是一样的，但是type不一样，这种情况也是需要删除旧的节点
        // 2. 更新组件的时候
        // #fix example slots demo
        if (n1 && !isSameVNodeType(n1, n2)) {
            // 更新锚点元素，因为旧的节点被删除，新的需要创建，创建的位置应该是当前被删除节点的下一个节点之前
            // 因此需要找到当前节点的下一个节点作为锚点节点
            anchor = getNextHostNode(n1);
            unmount(n1, parentComponent);
            n1 = null;
        }
        const { shapeFlag, type } = n2;
        switch (type) {
            // 特殊虚拟节点类型处理
            case Fragment:
                // 处理type为Fragment的节点（插槽）
                processFragment(n1, n2, container, anchor, parentComponent);
                break;
            case Comment:
                // 处理注释节点
                processCommentNode(n1, n2, container, anchor);
                break;
            case Text:
                // 处理文本节点
                processText(n1, n2, container, anchor);
                break;
            default:
                // if is element
                if (shapeFlag & 1 /* ELEMENT */) {
                    processElement(n1, n2, container, anchor, parentComponent);
                }
                else if (shapeFlag & 6 /* COMPONENT */) {
                    // 有状态、函数式组件
                    processComponent(n1, n2, container, anchor, parentComponent);
                }
                else if (shapeFlag & 64 /* TELEPORT */) {
                    type.process(n1, n2, container, anchor, parentComponent, internals);
                }
        }
    };
    /**
     * @author: Zhouqi
     * @description: 处理注释节点
     * @param n1 老的虚拟节点
     * @param n2 新的虚拟节点
     * @param container 容器
     * @param anchor 锚点元素
     */
    const processCommentNode = (n1, n2, container, anchor) => {
        if (n1 === null) {
            const el = (n2.el = hostCreateComment(n2.children));
            hostInsert(el, container, anchor);
        }
        else {
            // 不支持动态更新注释节点
            n1.el = n2.el;
        }
    };
    /**
     * @author: Zhouqi
     * @description: 处理Fragment节点
     * @param n1 老的虚拟节点
     * @param n2 新的虚拟节点
     * @param container 容器
     * @param anchor 锚点元素
     * @param parentComponent 父组件实例
     */
    const processFragment = (n1, n2, container, anchor, parentComponent) => {
        // #fix: example slots demo when update slot, the new node insertion exception
        // 由于插槽节点在渲染的时候不会创建根标签包裹去插槽节点，导致在更新的时候可能无法正确找到锚点元素
        // 这时候需要我们手动去创建一个空的文本节点去包裹所有的插槽节点。
        const fragmentStartAnchor = (n2.el = n1
            ? n1.el
            : hostCreateComment("fragment start"));
        const fragmentEndAnchor = (n2.anchor = n1
            ? n1.anchor
            : hostCreateComment("fragment end"));
        if (n1 === null) {
            // #fix: example slots demo when update slot, the new node insertion exception
            hostInsert(fragmentStartAnchor, container, anchor);
            hostInsert(fragmentEndAnchor, container, anchor);
            // 创建节点
            const { children } = n2;
            mountChildren(children, container, fragmentEndAnchor, parentComponent);
        }
        else {
            // 更新节点
            patchChildren(n1, n2, container, fragmentEndAnchor, parentComponent);
        }
    };
    /**
     * @author: Zhouqi
     * @description: 处理节点为Text类型的虚拟节点
     * @param  n1 老的虚拟节点
     * @param  n2 新的虚拟节点
     * @param  container 容器
     * @param  anchor 锚点元素
     */
    const processText = (n1, n2, container, anchor) => {
        if (n1 === null) {
            // 老的虚拟节点不存，则表示创建节点
            const { children } = n2;
            const el = (n2.el = hostCreateText(children));
            hostInsert(el, container, anchor);
        }
        else {
            // 更新文本节点
            const el = (n2.el = n1.el);
            if (n1.children !== n2.children) {
                hostSetText(el, n2.children);
            }
        }
    };
    /**
     * @author: Zhouqi
     * @description: 处理组件
     * @param n1 旧的虚拟节点
     * @param n2 新的虚拟节点
     * @param container 容器
     * @param anchor 锚点元素
     * @param  parentComponent 父组件实例
     */
    const processComponent = (n1, n2, container, anchor, parentComponent) => {
        // n1为null表示初始化组件
        if (n1 == null) {
            // 如果组件是keep-alive缓存过的组件，则不需要重新挂载，只需要从隐藏容器中取出缓存过的DOM即可
            if (n2.shapeFlag & 512 /* COMPONENT_KEPT_ALIVE */) {
                parentComponent.ctx.activate(n2, container, anchor);
            }
            else {
                mountComponent(n2, container, anchor, parentComponent);
            }
        }
        else {
            // 更新组件
            updateComponent(n1, n2);
        }
    };
    /**
     * @author: Zhouqi
     * @description: 更新组件
     * @param  n1 老的虚拟节点
     * @return  n2 新的虚拟节点
     */
    const updateComponent = (n1, n2) => {
        const instance = (n2.component = n1.component);
        if (shouldUpdateComponent(n1, n2)) {
            instance.next = n2;
            instance.update();
        }
        else {
            n2.el = n1.el;
            instance.vnode = n2;
        }
    };
    /**
     * @author: Zhouqi
     * @description: 创建元素
     * @param  initialVNode 初始虚拟节点
     * @param  container 容器
     * @param  anchor 锚点元素
     * @param  parentComponent 父组件实例
     */
    const mountComponent = (initialVNode, container, anchor, parentComponent) => {
        // 获取组件实例
        const instance = (initialVNode.component = createComponentInstance(initialVNode, parentComponent));
        // keepalive组件需要为其上下文对象中添加渲染器，渲染器提供一些DOM操作
        if (isKeepAlive(initialVNode)) {
            instance.ctx.renderer = internals;
        }
        // 初始化组件
        setupComponent(instance);
        setupRenderEffect(instance, initialVNode, container, anchor);
    };
    /**
     * @author: Zhouqi
     * @description: 执行渲染和更新
     * @param  instance 组件实例
     * @param  initialVNode 初始虚拟节点
     * @param  container 容器
     * @param  anchor 锚点元素
     */
    const setupRenderEffect = (instance, initialVNode, container, anchor) => {
        const componentUpdateFn = () => {
            // 通过isMounted判断组件是否创建过，如果没创建过则表示初始化渲染，否则为更新
            if (!instance.isMounted) {
                const { bm, m } = instance;
                // beforeMount hook
                if (bm) {
                    invokeArrayFns(bm);
                }
                const subTree = (instance.subTree =
                    renderComponentRoot(instance));
                patch(null, subTree, container, anchor, instance);
                // 到这一步说明元素都已经渲染完成了，也就能够获取到根节点，这里的subTree就是根组件
                initialVNode.el = subTree.el;
                // mount hook
                if (m) {
                    // invokeArrayFns(m);
                    // 加入到pendingPostFlush队列，保证在组件mounted完成后触发
                    queuePostRenderEffect(m);
                }
                // 表示组件Dom已经创建完成
                instance.isMounted = true;
            }
            else {
                // console.log("组件更新了", instance);
                let { next, vnode, bu, u } = instance;
                if (next) {
                    // 更新组件的渲染数据
                    next.el = vnode.el;
                    updateComponentPreRender(instance, next);
                }
                if (bu) {
                    invokeArrayFns(bu);
                }
                // 更新
                const nextTree = renderComponentRoot(instance);
                const prevTree = instance.subTree;
                instance.subTree = nextTree;
                patch(prevTree, nextTree, container, anchor, instance);
                // updated hook
                if (u) {
                    // invokeArrayFns(u);
                    // 保证组件更新完成后触发updated hook
                    queuePostRenderEffect(u);
                }
            }
        };
        const effect = new ReactiveEffect(componentUpdateFn, () => {
            // 自定义调度器，当多个同步任务触发更新时，将任务放入微任务队列中，避免多次更新
            queueJob(instance.update);
        });
        const update = (instance.update = effect.run.bind(effect));
        // 收集依赖，在依赖的响应式数据变化后可以执行更新
        update();
    };
    /**
     * @author: Zhouqi
     * @description: 更新组件上面预渲染的数据
     * @param instance 组件实例
     * @param nextVnode 新的虚拟节点
     */
    const updateComponentPreRender = (instance, nextVnode) => {
        nextVnode.component = instance;
        const prevProps = instance.vnode.props;
        instance.vnode = nextVnode;
        instance.next = null;
        // 更新props
        updateProps(instance, nextVnode.props, prevProps);
        // 更新slots
        updateSlots(instance, nextVnode.children);
    };
    /**
     * @author: Zhouqi
     * @description: 处理普通元素
     * @param n1 老的虚拟节点
     * @param n2 新的虚拟节点
     * @param container 父容器
     * @param anchor 锚点元素
     * @param parentComponent 父组件实例
     */
    const processElement = (n1, n2, container, anchor, parentComponent) => {
        // 旧的虚拟节点不存在，说明是初始化渲染
        if (n1 === null) {
            mountElement(n2, container, anchor, parentComponent);
        }
        else {
            // 更新
            patchElement(n1, n2, parentComponent);
        }
    };
    /**
     * @author: Zhouqi
     * @description: 更新元素
     * @param n1 旧的虚拟节点
     * @param n2 新的虚拟节点
     * @param parentComponent 父组件实例
     */
    const patchElement = (n1, n2, parentComponent) => {
        // 新的虚拟节点上没有el，需要继承老的虚拟节点上的el
        const el = (n2.el = n1.el);
        patchChildren(n1, n2, el, null, parentComponent);
        const oldProps = n1.props || EMPTY_OBJ;
        const newProps = n2.props || EMPTY_OBJ;
        /**
         * props更新的三种情况
         * 1、旧的和新都存在key且新旧值存在但是不一样 —————— 更新属性值
         * 2、新的key上的值不存在 ———— 删除属性
         * 3、旧的key在新的上面不存在 ———— 删除属性
         */
        patchProps(el, n2, oldProps, newProps);
    };
    /**
     * @author: Zhouqi
     * @description: 更新孩子节点
     * @param n1 旧的虚拟节点
     * @param n2 新的虚拟节点
     * @param container 容器
     * @param anchor 锚点元素
     * @param parentComponent 父组件实例
     */
    const patchChildren = (n1, n2, container, anchor, parentComponent) => {
        const c1 = n1.children;
        const c2 = n2.children;
        const prevShapeFlag = n1 ? n1.shapeFlag : 0;
        const { shapeFlag } = n2;
        // 更新的几种情况
        if (shapeFlag & 8 /* TEXT_CHILDREN */) {
            // 1. 新的虚拟节点的子节点是一个文本节点，旧的虚拟节点的子节点是一个数组，则删除旧的节点元素，然后创建新的文本节点
            if (prevShapeFlag & 16 /* ARRAY_CHILDREN */) {
                unmountChildren(c1, parentComponent);
            }
            // 2. 旧的虚拟节点也是一个文本节点，但是文本内容不同，此时只需要更新文本内容
            if (c1 !== c2) {
                hostSetElementText(container, c2);
            }
        }
        else {
            // 走进这里说明新的孩子节点不存在或者是数组类型
            if (prevShapeFlag & 16 /* ARRAY_CHILDREN */) {
                if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
                    // 3. 新旧孩子节点都是数组的情况下需要进行 dom diff，这种情况也是最复杂的
                    patchKeyedChildren(c1, c2, container, anchor, parentComponent);
                }
                else {
                    // 4. 新的节点不存在，则删除旧的子节点
                    unmountChildren(c1, parentComponent);
                }
            }
            else {
                // 旧的孩子节点为文本节点。这种情况不管怎样，旧的文本节点都必须清空
                if (prevShapeFlag & 8 /* TEXT_CHILDREN */) {
                    // 5. 旧的是一个文本节点，新的子节点不存在，将文本清空
                    hostSetElementText(container, "");
                }
                if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
                    // 6. 旧的是文本节点，新的是数组节点，则清空文本并创建新的子节点
                    mountChildren(c2, container, anchor, parentComponent);
                }
            }
        }
    };
    /**
     * @author: Zhouqi
     * @description: 快速diff算法
     * @param c1 旧的子节点
     * @param c2 新的子节点
     * @param parentAnchor 锚点元素
     * @param container 容器
     * @param parentComponent 父组件实例
     */
    const patchKeyedChildren = (c1, c2, container, parentAnchor, parentComponent) => {
        // 快速diff算法的几种情况
        /**
         * 1. 相同前置节点
         * (a b) c
         * (a b) d e
         */
        const l2 = c2.length;
        let i = 0;
        let oldEnd = c1.length - 1;
        let newEnd = l2 - 1;
        while (i <= oldEnd && i <= newEnd) {
            const n1 = c1[i];
            const n2 = c2[i];
            if (isSameVNodeType(n1, n2)) {
                patch(n1, n2, container, parentAnchor, parentComponent);
            }
            else {
                break;
            }
            i++;
        }
        /**
         * 3. 相同后置节点
         * a (b c)
         * d e (b c)
         */
        while (i <= newEnd && i <= oldEnd) {
            const n1 = c1[oldEnd];
            const n2 = c2[newEnd];
            if (isSameVNodeType(n1, n2)) {
                patch(n1, n2, container, parentAnchor, parentComponent);
            }
            else {
                break;
            }
            oldEnd--;
            newEnd--;
        }
        // 判断有新增节点的两个依据
        // 1、i > oldEnd：这个条件成立说明旧的子节点已经全部遍历完毕
        // 2、i <= newEnd：这个条件成立说明新的子节点还有没有遍历的，这些节点就是新增的节点
        if (i > oldEnd && i <= newEnd) {
            /**
             * 取出i到newEnd之间的元素，这些元素为需要新增的元素
             * 接下去就需要找到这些元素添加的位置，即找到一个锚点元素提供节点操作的帮助
             * 1. (a b) (e) ====> (a b) c (e) ：c是需要新增的节点，c要插入到e节点的前面，所以e是锚点元素，e节点的索引为 newEnd+1
             * 2. (a b) ====> (a b) c ：c是需要新增的节点，c排在新的子节点数组中的最后一位，所以只需要添加到尾部即可，判断条件是newEnd+1 >= c2.length
             */
            // 锚点索引
            const anchorIndex = newEnd + 1;
            // 锚点元素
            const anchor = anchorIndex < l2 ? c2[anchorIndex].el : parentAnchor;
            while (i <= newEnd) {
                patch(null, c2[i], container, anchor, parentComponent);
                i++;
            }
        }
        // 判断需要删除节点的两个依据
        // 1、i > newEnd：这个条件成立说明新的子节点已经全部遍历完毕
        // 2、i <= oldEnd：这个条件成立说明旧的子节点还有没有遍历的，这些节点就是需要删除的节点
        else if (i > newEnd && i <= oldEnd) {
            /**
             * 取出i到oldEnd之间的元素，这些元素为需要删除的元素
             * (a) b c (d) ====> (a) (d) ：b、c是需要删除的节点
             */
            while (i <= oldEnd) {
                unmount(c1[i], parentAnchor);
                i++;
            }
        }
        // 上面都是理想情况下的处理
        // 当排除相容前置和后置节点后，中间部分的情况比较复杂时需要额外的处理
        else {
            /**
             * (a) b c d f (e) =====> (a) c d b g (e)  比如这种情况，头尾只有一个元素相同，中间有相同节点但位置不一样，并且有需要删除的节点也有需要新增的节点
             * 无论情况有多复杂，最终需要知道两个点
             * 1、找到需要移动的节点以及如何移动
             * 2、找到需要被添加或者删除的节点
             */
            // 1. 构建一个新的数组 newIndexToOldIndexMap，这个数组初始化长度为新的子节点数组中未遍历到的节点数量，初始值为-1。
            // 这个数组的作用是存储新数组节点中未遍历到的节点在老数组节点中对应的索引位置，以便计算出它的最长递增子序列来帮助dom操作
            // 新子节点数组中未遍历到的节点数量为 遍历到尾部索引的newEnd 减去 遍历到头部的索引 i 之后 加1，即length = newEnd - i + 1
            // 需要更新的节点数量
            const toBePatched = newEnd - i + 1;
            const newIndexToOldIndexMap = new Array(toBePatched).fill(-1);
            // 2. 构建一个索引表，构建新数组节点中对应key的索引位置，用以辅助填充 newIndexToOldIndexMap 数组
            const newStart = i;
            const oldStart = i;
            const keyToNewIndexMap = new Map();
            for (let i = newStart; i <= newEnd; i++) {
                keyToNewIndexMap.set(c2[i].key, i);
            }
            // 3. 填充newIndexToOldIndexMap，并找到需要移动和删除的节点
            // 元素是否需要移动的判断：
            // 当前遍历到的旧的子节点在新子节点数组中的索引位置是否大于已经遍历过的索引位置最大的节点（是否是递增关系），如果呈递增关系，则不需要移动，反之需要移动节点
            // 例如： 1 2 4 3 ====> 1 3 2 4
            // 1、首先初始化最大索引值pos=0，第一次遍历旧子节点数组，找到2这个节点在新子节点数组中的索引位置为2，2 > 0（递增），所以2不用移动，pos=2
            // 2、第二次遍历旧子节点数组，找到4这个节点在新子节点数组中的索引位置为3，3 > 2（递增），所以4不用移动，pos=3
            // 3、第三次遍历旧子节点数组，找到3这个节点在新子节点数组中的索引位置为1，1 < 3（递减），所以3需要移动，pos不变
            // 判断DOM是否需要移动
            let moved = false;
            // 存储旧子节点在新子节点数组中的最大索引值
            let maxNewIndexSoFar = 0;
            // 记录已经更新过的子节点
            let patched = 0;
            for (let i = oldStart; i <= oldEnd; i++) {
                const oldVnode = c1[i];
                // 当已经更新过的子节点数量大于需要遍历的新子节点数组时，表示旧节点数量大于新节点数量，需要删除
                if (patched >= toBePatched) {
                    unmount(oldVnode, parentComponent);
                    continue;
                }
                let keyIndex;
                // key === undefined || null
                if (oldVnode.key != null) {
                    /**
                     * 注意：
                     * 这里其实只是去查找了对应key相同的节点，但是新旧节点的type可能是不一样的，因此还是需要经历删除再创建的过程，并不是直接更新节点
                     * 这一步删除再创建是在patch里面进行的（源码）
                     */
                    keyIndex = keyToNewIndexMap.get(oldVnode.key);
                    // 为什么不在这里处理？
                    // if (c2[keyIndex].type !== oldVnode.type) {
                    //   keyIndex = undefined;
                    //   console.log(keyIndex);
                    // }
                }
                else {
                    // 如果用户没有传入key，则需要再加一层循环去寻找节点（传入key的重要性，避免O(n²)的时间复杂度）
                    for (let j = newStart; j <= newEnd; j++) {
                        if (isSameVNodeType(oldVnode, c2[j])) {
                            keyIndex = j;
                            break;
                        }
                    }
                }
                if (keyIndex !== undefined) {
                    newIndexToOldIndexMap[keyIndex - newStart] = i;
                    if (keyIndex >= maxNewIndexSoFar) {
                        // 递增关系，不需要移动，重新赋值maxNewIndexSoFar
                        maxNewIndexSoFar = keyIndex;
                    }
                    else {
                        // 表示DOM需要移动
                        moved = true;
                    }
                    // 找到了节点，更新
                    patch(oldVnode, c2[keyIndex], container, parentAnchor, parentComponent);
                    // 递增，表示新子节点数组中又更新了一个节点
                    patched++;
                }
                else {
                    // 没找到节点，删除
                    unmount(oldVnode, parentComponent);
                }
            }
            // 需要进行DOM移动和DOM创建的情况
            // 计算最长递增子序列，得到的结果是最长递增子序列的索引信息
            // 1 (2 3 4 6) 5 ====> 1 (3 4 2 7) 5 索引数组为 [2,3,1,-1]  最长递增子序列为 [2, 3] 子序列索引为 [0, 1]
            // 意思是新子节点数组中下标为0和1的节点不需要移动，其它的可能要移动，因为索引数组和新子节点数组（去除前后置节点）位置是一一对应的
            const increasingNewIndexSequence = moved
                ? getSequence(newIndexToOldIndexMap)
                : EMPTY_ARR;
            // 创建两个变量用来遍历increasingNewIndexSequence和新子节点数组（去除前后置节点）
            let seq = increasingNewIndexSequence.length - 1;
            const j = toBePatched - 1;
            for (let i = j; i >= 0; i--) {
                // 1. 找到需要新增的节点
                const pos = i + newStart;
                const newVnode = c2[pos];
                // 2. 找到锚点节点的索引
                const anchor = pos + 1 < l2 ? c2[pos + 1].el : parentAnchor;
                // 3. 挂载
                if (newIndexToOldIndexMap[i] === -1) {
                    // 索引为-1说明没有在老的里面找到对应的节点，说明是新节点，需要挂载
                    patch(null, newVnode, container, anchor, parentComponent);
                }
                else if (moved) {
                    if (newIndexToOldIndexMap[i] !== increasingNewIndexSequence[seq]) {
                        // 需要移动节点
                        move(newVnode, container, anchor);
                    }
                    else {
                        // 找到了对应不需要移动的节点，只需要更新seq
                        seq--;
                    }
                }
            }
        }
    };
    /**
     * @author: Zhouqi
     * @description: 移动节点
     * @param vnode 需要移动的vnode
     * @param container 容器
     * @param anchor 锚点节点
     */
    const move = (vnode, container, anchor) => {
        const { type } = vnode;
        // TODO Fragment类型的移动
        if (type === Fragment) {
            //
            return;
        }
        hostInsert(vnode.el, container, anchor);
    };
    /**
     * @author: Zhouqi
     * @description: 删除数组类型的子节点
     * @param children 孩子节点vnode
     * @param parentComponent 父组件实例
     */
    const unmountChildren = (children, parentComponent) => {
        const childrenLength = children.length;
        for (let i = 0; i < childrenLength; i++) {
            unmount(children[i], parentComponent);
        }
    };
    /**
     * @author: Zhouqi
     * @description: 更新props属性
     * @param el 容器
     * @param vnode 新的虚拟节点
     * @param oldProps 旧的props
     * @param newProps 新的props
     */
    const patchProps = (el, vnode, oldProps, newProps) => {
        if (oldProps === newProps)
            return;
        for (const key in newProps) {
            const nextValue = newProps[key];
            const prevValue = oldProps[key];
            if (nextValue !== prevValue) {
                hostPatchProp(el, key, prevValue, nextValue);
            }
        }
        if (oldProps === EMPTY_OBJ)
            return;
        for (const key in oldProps) {
            // 旧的key在新的中找不到则表示删除
            if (!(key in newProps)) {
                hostPatchProp(el, key, oldProps[key], null);
            }
        }
    };
    /**
     * @author: Zhouqi
     * @description: 生成普通元素
     * @param  vnode 虚拟dom
     * @param  container 父容器
     * @param  anchor 锚点元素
     * @param  parentComponent 父组件实例
     */
    const mountElement = (vnode, container, anchor, parentComponent) => {
        const { type, props, children, shapeFlag, transition } = vnode;
        const el = (vnode.el = hostCreateElement(type));
        // 处理children
        if (shapeFlag & 8 /* TEXT_CHILDREN */) {
            // 孩子是一个字符串表示文本类型
            hostSetElementText(el, children);
        }
        else if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
            // 处理数组类型的孩子节点
            // #fix bug example defineAsyncComponent 新建子节点的时候不需要锚点元素
            // mountChildren(children, el, anchor, parentComponent);
            mountChildren(children, el, null, parentComponent);
        }
        if (props) {
            // 处理props
            for (const key in props) {
                hostPatchProp(el, key, null, props[key]);
            }
        }
        if (transition) {
            transition.beforeEnter(el);
        }
        hostInsert(el, container, anchor);
        if (transition) {
            queuePostRenderEffect(() => {
                transition.enter(el);
            });
        }
    };
    /**
     * @author: Zhouqi
     * @description: 递归处理子节点
     * @param children 子节点
     * @param container 父容器
     * @param anchor 锚点元素
     * @param parentComponent 父组件实例
     */
    const mountChildren = (children, container, anchor, parentComponent) => {
        children.forEach((vnode) => {
            patch(null, vnode, container, anchor, parentComponent);
        });
    };
    /**
     * @author: Zhouqi
     * @description: 渲染函数
     * @param vnode 虚拟节点
     * @param container 容器
     */
    const render = (vnode, container) => {
        // 新的虚拟节点为null，说明是卸载操作
        if (vnode === null && container._vnode) {
            unmount(container._vnode, null);
        }
        else {
            patch(container._vnode || null, vnode, container, null, null);
        }
        // 执行lifecycle hook
        flushPostFlushCbs();
        // 缓存当前vnode，下一次更新的时候，该值就是旧的vnode
        container._vnode = vnode;
    };
    /**
     * @author: Zhouqi
     * @description: 组件卸载
     * @param vnode 老的虚拟节点
     * @param parentComponent 父组件实例
     */
    const unmount = (vnode, parentComponent) => {
        const { shapeFlag, component, children } = vnode;
        // 如果是需要缓存的组件，需要调用deactivate放入隐藏容器中缓存
        if (shapeFlag & 256 /* COMPONENT_SHOULD_KEEP_ALIVE */) {
            parentComponent.ctx.deactivate(vnode);
            return;
        }
        if (shapeFlag & 6 /* COMPONENT */) {
            // 销毁组件
            unmountComponent(component);
        }
        else if (shapeFlag & 16 /* ARRAY_CHILDREN */) {
            unmountChildren(children, parentComponent);
        }
        else {
            // 销毁元素
            remove(vnode);
        }
    };
    /**
     * @author: Zhouqi
     * @description: 删除元素节点
     * @param vnode 虚拟节点
     */
    const remove = (vnode) => {
        const { el, transition } = vnode;
        if (transition) {
            const { leave } = transition;
            leave(el, hostRemove);
        }
        else {
            hostRemove(el);
        }
    };
    /**
     * @author: Zhouqi
     * @description: 卸载组件
     * @param instance 组件实例
     */
    const unmountComponent = (instance) => {
        const { um, bum, subTree } = instance;
        // beforeUnmount hook
        if (bum) {
            invokeArrayFns(bum);
        }
        // 递归卸载子节点
        unmount(subTree, instance);
        // unmounted hook
        if (um) {
            queuePostRenderEffect(um);
        }
    };
    /**
     * @author: Zhouqi
     * @description: 找到当前真实节点的下一个节点
     * @param vnode 虚拟节点
     * @return 当前真实节点的下一个节点
     */
    const getNextHostNode = (vnode) => {
        return hostNextSibling(vnode.anchor || vnode.el);
    };
    const internals = {
        p: patch,
        um: unmount,
        m: move,
        o: options,
        mc: mountChildren,
        pc: patchChildren,
    };
    return {
        render,
        createApp: createAppApi(render),
    };
}
/**
 * @author: Zhouqi
 * @description: 最长递增子序列（vue3中的源码）
 * @param 需要计算的数组
 * @return 最长递增序列的递增索引
 */
function getSequence(arr) {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
        const arrI = arr[i];
        if (arrI !== 0) {
            j = result[result.length - 1];
            if (arr[j] < arrI) {
                p[i] = j;
                result.push(i);
                continue;
            }
            u = 0;
            v = result.length - 1;
            while (u < v) {
                c = (u + v) >> 1;
                if (arr[result[c]] < arrI) {
                    u = c + 1;
                }
                else {
                    v = c;
                }
            }
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1];
                }
                result[u] = i;
            }
        }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }
    return result;
}

/*
 * @Author: Zhouqi
 * @Date: 2022-03-27 14:37:57
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-03-27 14:38:59
 */
function h(type, props, children) {
    return createVnode(type, props, children);
}

/*
 * @Author: Zhouqi
 * @Date: 2022-04-10 19:35:50
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-11 09:53:04
 */
/**
 * @author: Zhouqi
 * @description: watch函数
 * @param source 监听的内容
 * @param cb 监听内容变化时触发的回调函数
 * @param options 配置
 * @return unwatch 取消观测的函数
 */
function watch(source, cb, options) {
    return doWatch(source, cb, options);
}
/**
 * @author: Zhouqi
 * @description: 立即执行传入的一个函数，同时响应式追踪其依赖，并在其依赖变更时重新运行该函数。
 * @param effectFn
 * @param options
 * @return unwatch 取消观测的函数
 */
function watchEffect(effectFn, options) {
    // watchEffect 第二个参数为null
    return doWatch(effectFn, null, options);
}
/**
 * @author: Zhouqi
 * @description: watchEffect 的别名，带有 flush: 'post' 选项
 * @param effectFn
 * @param options
 * @return unwatch 取消观测的函数
 */
function watchPostEffect(effectFn, options) {
    return doWatch(effectFn, null, extend(options || {}, { flush: "post" }));
}
function doWatch(source, cb, { flush, deep, immediate } = EMPTY_OBJ) {
    // 定义getter函数
    let getter;
    // 旧的值
    let oldValue;
    // 新的值
    let newValue;
    // 根据source的类型生成不同的getter
    if (isRef(source)) {
        getter = () => source.value;
    }
    else if (isReactive(source)) {
        getter = () => source;
        // 传入的如果是reactive的对象，默认把deep置为true进行深度监听
        deep = true;
    }
    else if (isArray(source)) {
        getter = () => source.map((s) => {
            if (isRef(s)) {
                return s.value;
            }
            else if (isReactive(source)) {
                return traverse(s);
            }
            else if (isFunction(s)) {
                return s();
            }
        });
    }
    else if (isFunction(source)) {
        // 如果传入的是方法，直接赋值给getter
        getter = source;
    }
    /**
     * cleanup：副作用过期的回调
     * 假设watch的回调是请求接口，当第一次数据变化时请求一次接口，紧接着第二次数据变化时又请求了一次接口
     * 当第一个接口比第二个接口慢时，先获取到了第二个接口的数据，然后获取到第一个接口的数据，这是不正确的
     * 实际上执行第二次回调的时候，第一次的回调应该是过期状态，为了提示用户副作用过期了，需要提供一个cleanup
     * 函数，这个函数存储的是用户传入的副作用过期的回调，每次执行回调执行，假如有cleanup，则执行一次，告诉用户
     * 上一次的已经过期了
     */
    let cleanup;
    const onCleanup = (fn) => {
        cleanup = fn;
    };
    // 包装回调任务
    const job = () => {
        if (cb) {
            // newValue在值变化后触发的scheduler里面获取
            newValue = effect.run();
            // 辅助用户提示副作用过期
            if (cleanup) {
                cleanup();
            }
            cb(newValue, oldValue, onCleanup);
            // 重新赋值给旧的
            oldValue = newValue;
        }
        else {
            // 没有cb说明是watchEffect，直接执行副作用函数
            effect.run();
        }
    };
    if (cb && deep) {
        const baseGetter = getter;
        // 深度读取依赖的函数
        getter = () => traverse(baseGetter());
    }
    // watch的原理就是监听值的变化，通过自定义调度器来执行回调。当监听到的依赖的值变化时会触发effect上的schedular函数，从而触发回调函数
    let scheduler;
    if (flush === "sync") {
        // 立即执行，没有加入到回调缓冲队列中
        scheduler = job;
    }
    else if (flush === "post") {
        // 放进微任务队列中执行（组件更新后）
        scheduler = () => queuePostRenderEffect(job);
    }
    else {
        // pre
        scheduler = () => {
            // 组件更新前调用
            // TODO 加入回调缓冲队列中
            job();
        };
    }
    const effect = new ReactiveEffect(getter, scheduler);
    if (cb) {
        if (immediate) {
            // 立即执行一次回调
            job();
        }
        else {
            // 默认执行一次，获取旧的值
            oldValue = effect.run();
        }
    }
    // 没有传入回调函数说明是watchEffect
    else if (flush === "post") {
        // 如果flush是post，则放入微任务队列中执行
        queuePostRenderEffect(effect.run.bind(effect));
    }
    else {
        effect.run();
    }
    return () => {
        // 移除依赖
        effect.stop();
    };
}
// 深度读取属性
function traverse(value, seen = new Set()) {
    // 如果值被读取过或者值是一个普通类型则直接返回值
    if (!isObject(value) || value === null || seen.has(value))
        return value;
    // 通过Set来防止添加重复的值
    seen.add(value);
    if (isRef(value)) {
        traverse(value.value, seen);
    }
    else if (isPlainObject(value)) {
        // 是对象则遍历每一个属性，递归调用traverse
        for (const key in value) {
            traverse(value[key], seen);
        }
    }
    return value;
}

/*
 * @Author: Zhouqi
 * @Date: 2022-04-14 22:25:46
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-14 22:36:31
 */
// 返回options，对ts支持度更好
function defineComponent(options) {
    return isFunction(options) ? { setup: options } : options;
}

/*
 * @Author: Zhouqi
 * @Date: 2022-04-14 22:19:23
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-16 11:30:04
 */
// 创建异步组件
function defineAsyncComponent(source) {
    // 如果source是一个函数的话，说明传入的就是一个异步加载组件的函数
    if (isFunction(source)) {
        source = { loader: source };
    }
    const { 
    // 异步加载组件的函数
    loader, loadingComponent, 
    // 组件加载失败时显示的错误组件
    errorComponent, delay = 200, 
    // 超时时间
    timeout, suspensible, onError: userOnError, } = source;
    // 解析到的组件
    let resolvedComp;
    // 错误重试次数
    let retries = 0;
    // 重试函数，返回异步加载组件的函数
    const retry = () => {
        retries++;
        return load();
    };
    const load = () => {
        return loader()
            .then((c) => {
            resolvedComp = c.default;
            return c.default;
        })
            .catch((err) => {
            err = new Error("组件加载失败");
            // 如果用户定义了错误处理函数，则将控制权交给用户
            if (userOnError) {
                return new Promise((resolve, reject) => {
                    const userRetry = () => resolve(retry());
                    const userFail = () => reject(err);
                    userOnError(err, userRetry, userFail, retries + 1);
                });
            }
            else {
                throw err;
            }
        });
    };
    return defineComponent({
        name: "AsyncComponentWrapper",
        setup() {
            const loaded = ref(false);
            const errorLoaded = ref(false);
            // 注意：0是立即加载，不传默认是200
            const delayed = ref(!!delay);
            let timeoutTimer;
            let delayTimer;
            // defineAsyncComponent是一层包装组件，当写模板的时候可能会写一些插槽节点，这些节点需要传递给
            // 真正异步加载的组件使用，而不是给这个包装组件使用，因此我们需要获取当前包装组件的实例，将其身上的
            // slots传递给异步加载的组件
            const instance = currentInstance;
            if (delay) {
                delayTimer = setTimeout(() => {
                    /**
                     * 指定时间后加载loading组件
                     * 需要指定延迟时间是因为异步组件可能加载很快，如果不加延迟立马使用loading组件，可能会马上又把
                     * loading组件销毁，这样就会有一个闪烁的过程。因此可以设定一个延迟时间尽可能避免这种情况出现。
                     */
                    if (!loaded.value) {
                        delayed.value = false;
                    }
                }, delay);
            }
            // 如果设置了超时时间，则开启一个定时器，定时回调任务触发时表示组件加载超时了
            if (timeout != null) {
                timeoutTimer = setTimeout(() => {
                    // 组件没有加载成功且没有加载失败的情况下，如果加载超时了，则赋值超时错误信息
                    if (!loaded.value && !errorLoaded.value) {
                        const error = new Error("组件加载超时了");
                        errorLoaded.value = error;
                    }
                }, timeout);
            }
            // 组件销毁前清除定时器
            onBeforeUnmount(() => {
                clearTimeout(timeoutTimer);
                clearTimeout(delayTimer);
                delayTimer = null;
                timeoutTimer = null;
            });
            load()
                .then(() => {
                // 组件加载成功，修改标记
                loaded.value = true;
            })
                .catch((err) => {
                // 如果用户定义了错误处理函数并且调了用fail才会进到这里
                errorLoaded.value = err;
            });
            return () => {
                // 根据组件加载成功标记来渲染
                if (loaded.value && resolvedComp) {
                    return createInnerComp(resolvedComp, instance);
                }
                else if (errorLoaded.value && errorComponent) {
                    // 将错误信息传递给error组件，便于用户进行更精细的操作
                    return createVnode(errorComponent, {
                        error: errorLoaded.value,
                    });
                }
                else if (!delayed.value && loadingComponent) {
                    return createVnode(loadingComponent);
                }
                return createTextVnode("");
            };
        },
    });
}
/**
 * @author: Zhouqi
 * @description: 生成异步组件的vnode
 * @param  comp 组件配置
 * @return vnode
 */
function createInnerComp(comp, instance) {
    // slots可以理解，不知为何要传props，包装组件没有通过props去接受，上次传递下来的都会放在包装组件的attrs上，
    // 这个attrs还是能够传递到异步加载的组件上，并且能和props进行合并
    const { vnode: { children, props }, } = instance;
    return createVnode(comp, props, children);
}

/*
 * @Author: Zhouqi
 * @Date: 2022-04-17 14:41:48
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-17 19:22:02
 */
const BaseTransition = {
    name: "BaseTransition",
    props: {
        // enter
        onBeforeEnter: Function,
        onEnter: Function,
        onLeave: Function,
    },
    setup(props, { slots }) {
        return () => {
            const vnode = slots.default()[0];
            const enterHooks = resolveTransitionHooks(props);
            setTransitionHooks(vnode, enterHooks);
            return vnode;
        };
    },
};
/**
 * @author: Zhouqi
 * @description: 解析props
 * @param props
 * @return 钩子函数
 */
function resolveTransitionHooks(props) {
    const { onBeforeEnter, onEnter, onLeave } = props;
    const callhook = (hook, el) => {
        hook(el);
    };
    const hooks = {
        beforeEnter: (el) => {
            let hook = onBeforeEnter;
            callhook(hook, el);
        },
        enter(el) {
            let hook = onEnter;
            callhook(hook, el);
        },
        leave(el, remove) {
            if (onLeave) {
                // 动画结束后再执行DOM移除操作
                onLeave(el, remove);
            }
        },
    };
    return hooks;
}
/**
 * @author: Zhouqi
 * @description: 在vnode上设置transition hook，供组件在其不同生命周期内调用
 * @param vnode 虚拟节点
 * @param hooks 钩子函数
 */
function setTransitionHooks(vnode, hooks) {
    vnode.transition = hooks;
}

/*
 * @Author: Zhouqi
 * @Date: 2022-04-03 15:36:54
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-17 10:58:35
 */
// 平台渲染操作
const nodeOps = {
    /**
     * @author: Zhouqi
     * @description: 创建节点
     * @param type 节点类型
     */
    createElement(type) {
        return document.createElement(type);
    },
    /**
     * @author: Zhouqi
     * @description: 添加节点
     * @param child 子节点
     * @param parent 父节点
     * @param anchor 锚点节点
     */
    insert: (child, parent, anchor) => {
        parent.insertBefore(child, anchor || null);
    },
    /**
     * @author: Zhouqi
     * @description: 删除节点
     * @param child 子节点
     */
    remove(child) {
        const parent = child.parentNode;
        parent && parent.removeChild(child);
    },
    /**
     * @author: Zhouqi
     * @description: 设置元素的文本内容
     * @param el 元素
     * @param text 文本内容
     */
    setElementText(el, text) {
        el.textContent = text;
    },
    /**
     *
     * @author: Zhouqi
     * @description: 创建文本节点
     * @param text 文本内容
     * @return 文本节点
     */
    createText(text) {
        return document.createTextNode(text);
    },
    /**
     * @author: Zhouqi
     * @description: 设置文本节点的文本内容
     * @param node 文本节点
     * @param text 文本内容
     */
    setText(node, text) {
        node.nodeValue = text;
    },
    /**
     * @author: Zhouqi
     * @description: 创建注释节点
     * @param text 注释内容
     * @return 注释节点
     */
    createComment: (text) => document.createComment(text),
    /**
     * @author: Zhouqi
     * @description: 获取当前节点的下一个节点
     * @param node 当前节点
     * @return 当前节点的下一个节点
     */
    nextSibling: (node) => node.nextSibling,
    /**
     * @author: Zhouqi
     * @description: 查找节点
     * @param selector 选择器
     * @return 节点
     */
    querySelector: (selector) => document.querySelector(selector),
};

/*
 * @Author: Zhouqi
 * @Date: 2022-04-04 13:53:46
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-04 13:54:54
 */
function patchAttr(el, key, value) {
    // 新的值不存在，则表示删除属性
    if (value === null || value === undefined) {
        el.removeAttribute(key);
    }
    else {
        el.setAttribute(key, value);
    }
}

/*
 * @Author: Zhouqi
 * @Date: 2022-03-28 20:16:47
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-14 22:08:00
 */
// 事件绑定
function addEventListener(el, event, handler) {
    el.addEventListener(event, handler);
}
// 事件销毁
function removeEventListener(el, event, handler) {
    el.removeEventListener(event, handler);
}
// 获取当前时间，默认使用低精度时间
let _getNow = Date.now;
/**
 * 由于不同浏览器事件的timeStamp使用的epoch time（新纪元时间）不同，因此这里需要兼容当前时间的获取
 * 当游览器事件使用的timeStamp是低精度时间（新纪元时间为 0:0:0 UTC 1st January 1970.）时，getNow函数需要使用Date.now（低精度）
 * 当浏览器事件使用的timeStamp是高精度时间时（新纪元时间为系统启动的时间），getNow函数需要使用performace.now（高精度）
 *
 * https://www.w3.org/TR/2000/REC-DOM-Level-2-Events-20001113/events.html#Events-Event-timeStamp
 * https://www.w3.org/TR/hr-time/#sec-domhighrestimestamp
 * http://jimliu.net/2014/03/16/hrt-in-js/
 */
if (typeof window !== "undefined" &&
    window.performance &&
    window.performance.now) {
    const eventTimeStamp = document.createEvent("event").timeStamp;
    // 假如当前时间大于事件的timeStamp，则认为事件使用的是高精度时间，此时getNow函数也应该返回高精度时间
    if (_getNow() > eventTimeStamp) {
        _getNow = () => window.performance.now();
    }
}
// 为了优化频繁调用performance.now的性能，我们在一个事件循环内注册的所有事件统一使用一个timeStamp
let cachedNow = 0;
// 创建微任务，当一个tick执行完时重置cachedNow
const p = Promise.resolve();
const rest = () => {
    cachedNow = 0;
};
const getNow = () => cachedNow || (p.then(rest), (cachedNow = _getNow()));
// props上的事件注册函数
function patchEvent(el, key, preValue, nextValue) {
    /**
     * 这里创建一个伪造的事件代理函数invoker，将原始事件赋值到invoker的value属性上
     * 将invoker作为最终绑定的事件，在执行invoker函数时内部会执行原始的绑定事件，即执行invoker.value()
     *
     * 新建伪造的事件代理函数有几个作用：
     * 1、方便事件更新
     * 2、控制原始事件的执行（涉及到事件冒泡机制）
     * 3、…………?
     *
     * 由于原生事件类型有很多，为了不互相覆盖，这里需要建立一个map对象invokers，key指代事件类型，值是伪造的事件代理函数
     */
    const invokers = el._vei || (el._vei = {});
    const eventName = key.slice(2).toLowerCase();
    const hasInvoker = invokers[eventName];
    if (nextValue) {
        // 如果存在新的值且旧的事件代理函数存在，则表示更新事件，否则表示添加新的事件绑定
        if (hasInvoker) {
            /**
             * 1、方便事件更新
             * 在更新事件时，不需要销毁原来的事件，再绑定新的事件，而只要更新invoker.value属性即可
             */
            hasInvoker.value = nextValue;
        }
        else {
            const invoker = (invokers[eventName] = createInvoker(nextValue));
            addEventListener(el, eventName, invoker);
            invoker.attached = getNow();
        }
    }
    else if (hasInvoker) {
        // 新的值不存在且事件代理函数存在，则表示销毁事件绑定
        removeEventListener(el, eventName, hasInvoker);
        invokers[eventName] = undefined;
    }
}
// 创建事件代理函数
function createInvoker(events) {
    const invoker = (e) => {
        const timestamp = e.timeStamp;
        /**
         * 2、控制原始事件的执行（涉及到事件冒泡机制）
         * 假设父vnode上有onClick事件，事件值取决于一个响应式数据的值，比如：onClick: isTrue ? () => console.log(1) : null，
         * 子vnode上有一个绑定事件onClick: () => { isTrue = true }，当点击子vnode时会触发click事件，由于事件冒泡机制，click
         * 会向上冒泡到父节点，由于isTrue初始为false，因此父节点上不应该有绑定的click事件，但是却打印了1。
         * 这是由于vue的更新机制和事件冒泡时机导致的，实际上当isTrue被修改为true时触发了事件更新，更新后父节点上绑定了事件，之后事件才
         * 冒泡到父节点上，执行了父节点绑定的click事件。而解决方式就是在执行子元素事件的时候记录事件执行的时间，在这个时间点之后绑定的事件都
         * 不要去执行，这时候就需要有控制原始事件执行的功能。
         */
        // 事件冒泡时，e会往上传递其中s.timestamp就是事件最开始执行的事件
        if (timestamp < invoker.attached)
            return;
        // 如果events是一个数组，则循环执行
        isArray(invoker.value)
            ? invoker.value.forEach((fn) => fn(e))
            : invoker.value(e);
    };
    invoker.value = events;
    return invoker;
}

/*
 * @Author: Zhouqi
 * @Date: 2022-04-04 14:03:59
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-08 19:44:56
 */
/**
 * @author: Zhouqi
 * @description: 更新dom属性
 * @param el dom元素
 * @param key 属性
 * @param value 值
 */
function patchDOMProp(el, key, value) {
    if (value === "" || value === null) {
        const type = typeof el[key];
        // 对于dom属性上的值为boolean的情况下，如果设置的值是空的则需要转化为true
        if (type === "boolean") {
            el[key] = true;
            return;
        }
        el.removeAttribute(key);
        return;
    }
    el[key] = value;
}

/*
 * @Author: Zhouqi
 * @Date: 2022-03-27 15:44:22
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-14 22:07:57
 */
/**
 * @author: Zhouqi
 * @description: 处理props属性
 * 处理props时需要理解HTML Attribute 和 DOM property的关系
 *
 * 例如:
 * 我们可以通过input.value属性去获取input的文本值，这个value就是input元素上的属性，也就是DOM property
 * <input value="123" /> 这个value属性可以设置在input标签上，值可以通过getAttribute去获取，这个value就是HTML Attribute
 * HTML Attribute可能跟DOM property有对应的映射关系（id->id），也可能没有（aria-）或者有多个映射关系（value->value/defaultValue），同样名称也不一定对应（class->className）
 *
 * <input value="123" /> 上的value属性对应着元素input上的value属性，但是input标签上的value值并不总是和input元素上的值相等
 * 当我们初始化<input value="123" />时，通过input.value获取到的和input标签上的value值是一样的
 * 但是当我们修改input里面的内容时，通过input.value去访问value值和通过getAttribute方法获取inpu标签上的value值是不一样的
 * input标签上的value值依然还是初始时设置的值，因为我们可以认为HTML Attribute的值是DOM property上的初始值。
 *
 * 在处理元素属性上需要遵循一个结论：如果对应的属性可以在DOM property上找到，就去设置对应的DOM property，如果没找到就通过setAttribute去设置，当然还有其它特殊情况会慢慢补充
 * @param el 元素
 * @param key 属性名
 */
function patchProp(el, key, preValue, nextValue) {
    if (shouldSetAsProp(el, key)) {
        patchDOMProp(el, key, nextValue);
    }
    else if (key === "class") {
        // class通过className去设置性能最好
        el.className = nextValue;
    }
    else if (isOn(key)) {
        // 注册事件
        patchEvent(el, key, preValue, nextValue);
    }
    else {
        // 更新html属性
        patchAttr(el, key, nextValue);
    }
}
// 是否可以直接设置DOM property
function shouldSetAsProp(el, key, value) {
    // form属性是只读的，只能通过setAttribute设置属性
    if (key === "form") {
        return false;
    }
    return key in el;
}

/*
 * @Author: Zhouqi
 * @Date: 2022-04-17 15:01:49
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-17 19:24:16
 */
const Transition = (props, { slots }) => h(BaseTransition, resolveTransitionProps(props), slots);
Transition.props = {
    enterFromClass: String,
    enterActiveClass: String,
    enterToClass: String,
    leaveFromClass: String,
    leaveActiveClass: String,
    leaveToClass: String,
};
/**
 * @author: Zhouqi
 * @description: 解析transition上的睡醒
 * @param rawProps
 * @return 处理后的props
 */
function resolveTransitionProps(rawProps) {
    const { type, enterFromClass, enterToClass, enterActiveClass, leaveFromClass, leaveActiveClass, leaveToClass, } = rawProps;
    // 进入动画结束后移除相关类
    const finishEnter = (el) => {
        removeTransitionClass(el, enterToClass);
        removeTransitionClass(el, enterActiveClass);
    };
    // 离开动画结束后移除相关类
    const finishLeave = (el, done) => {
        removeTransitionClass(el, leaveToClass);
        removeTransitionClass(el, leaveActiveClass);
        done && done(el);
    };
    function makeEnterHook() {
        return (el) => {
            const resolve = () => finishEnter(el);
            nextFrame(() => {
                removeTransitionClass(el, enterFromClass);
                addTransitionClass(el, enterToClass);
                whenTransitionEnds(el, resolve);
            });
        };
    }
    return {
        // dom创建到挂载dom阶段触发的函数
        onBeforeEnter(el) {
            addTransitionClass(el, enterFromClass);
            addTransitionClass(el, enterActiveClass);
        },
        // dom挂载后触发的函数
        onEnter: makeEnterHook(),
        onLeave(el, done) {
            const resolve = () => finishLeave(el, done);
            addTransitionClass(el, leaveFromClass);
            addTransitionClass(el, leaveActiveClass);
            nextFrame(() => {
                removeTransitionClass(el, leaveFromClass);
                addTransitionClass(el, leaveToClass);
                whenTransitionEnds(el, resolve);
            });
        },
    };
}
/**
 * @author: Zhouqi
 * @description: 添加动画类
 * @param el 添加类的元素
 * @param cls 类名
 */
function addTransitionClass(el, cls) {
    const regExp = /\s+/;
    // 通过空白符切分多个类名，循环添加到dom上
    cls.split(regExp).forEach((c) => c && el.classList.add(c));
}
/**
 * @author: Zhouqi
 * @description: 移除动画类
 * @param el 移除类的元素
 * @param cls 类名
 */
function removeTransitionClass(el, cls) {
    const regExp = /\s+/;
    // 通过空白符切分多个类名，循环添加到dom上
    cls.split(regExp).forEach((c) => c && el.classList.remove(c));
}
/**
 * @author: Zhouqi
 * @description: 在下一帧执行回调，因为浏览器只会在当前帧绘制DOM，
 * 结束状态的类名和起始状态的类名需要在两帧绘制，否则起始状态的类名不会被绘制出来
 * @param cb 下一帧触发的操作
 */
function nextFrame(cb) {
    requestAnimationFrame(() => {
        requestAnimationFrame(cb);
    });
}
/**
 * @author: Zhouqi
 * @description: 动画加载完成后移除类
 * @param el 要移除动画的元素
 * @param resolve 动画结束时的回调
 */
function whenTransitionEnds(el, resolve) {
    const onEnd = () => {
        el.removeEventListener("transitionend", onEnd);
        resolve();
    };
    el.addEventListener("transitionend", onEnd);
}

/*
 * @Author: Zhouqi
 * @Date: 2022-03-26 21:20:44
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-17 15:21:56
 */
const rendererOptions = extend({ patchProp }, nodeOps);
function ensureRenderer() {
    return createRenderer(rendererOptions);
}
const createApp = (...args) => {
    const app = ensureRenderer().createApp(...args);
    // 劫持app实例上原有的mount函数
    const { mount } = app;
    app.mount = (containerOrSelector) => {
        const container = normalizeContainer(containerOrSelector);
        if (!container)
            return;
        mount(container);
    };
    return app;
};
/**
 * @author: Zhouqi
 * @description: 识别容器，如果是dom则直接返回；如果是字符串，则通过字符串获取dom
 * @param container 挂载元素
 */
function normalizeContainer(container) {
    if (typeof container === "string") {
        return document.querySelector(container);
    }
    return container;
}

var runtimeDom = /*#__PURE__*/Object.freeze({
    __proto__: null,
    createApp: createApp,
    Transition: Transition,
    renderSlot: renderSlot,
    createTextVnode: createTextVnode,
    createCommentVnode: createCommentVnode,
    createElementBlock: createVnode,
    getCurrentInstance: getCurrentInstance,
    registerRuntimeCompiler: registerRuntimeCompiler,
    provide: provide,
    inject: inject,
    createRenderer: createRenderer,
    toDisplayString: toDisplayString,
    h: h,
    watch: watch,
    watchEffect: watchEffect,
    watchPostEffect: watchPostEffect,
    onBeforeMount: onBeforeMount,
    onMounted: onMounted,
    onBeforeUpdate: onBeforeUpdate,
    onUpdated: onUpdated,
    onBeforeUnmount: onBeforeUnmount,
    onUnmounted: onUnmounted,
    defineComponent: defineComponent,
    defineAsyncComponent: defineAsyncComponent,
    KeepAlive: KeepAlive,
    Teleport: Teleport,
    BaseTransition: BaseTransition
});

/*
 * @Author: Zhouqi
 * @Date: 2022-03-27 14:28:06
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-14 22:06:50
 */
function compileToFunction(template) {
    const { code } = baseCompile(template);
    const render = new Function("Vue", code)(runtimeDom);
    return render;
}
registerRuntimeCompiler(compileToFunction);

exports.BaseTransition = BaseTransition;
exports.ITERATE_KEY = ITERATE_KEY;
exports.KeepAlive = KeepAlive;
exports.MAP_KEY_ITERATE_KEY = MAP_KEY_ITERATE_KEY;
exports.ReactiveEffect = ReactiveEffect;
exports.Teleport = Teleport;
exports.Transition = Transition;
exports.canTrack = canTrack;
exports.createApp = createApp;
exports.createCommentVnode = createCommentVnode;
exports.createElementBlock = createVnode;
exports.createRenderer = createRenderer;
exports.createTextVnode = createTextVnode;
exports.defineAsyncComponent = defineAsyncComponent;
exports.defineComponent = defineComponent;
exports.effect = effect;
exports.getCurrentInstance = getCurrentInstance;
exports.h = h;
exports.inject = inject;
exports.isProxy = isProxy;
exports.isReactive = isReactive;
exports.isReadonly = isReadonly;
exports.isRef = isRef;
exports.onBeforeMount = onBeforeMount;
exports.onBeforeUnmount = onBeforeUnmount;
exports.onBeforeUpdate = onBeforeUpdate;
exports.onMounted = onMounted;
exports.onUnmounted = onUnmounted;
exports.onUpdated = onUpdated;
exports.pauseTracking = pauseTracking;
exports.provide = provide;
exports.proxyRefs = proxyRefs;
exports.reactive = reactive;
exports.reactiveMap = reactiveMap;
exports.readonly = readonly;
exports.readonlyMap = readonlyMap;
exports.ref = ref;
exports.registerRuntimeCompiler = registerRuntimeCompiler;
exports.renderSlot = renderSlot;
exports.resetTracking = resetTracking;
exports.shallowReactive = shallowReactive;
exports.shallowReactiveMap = shallowReactiveMap;
exports.shallowReadonly = shallowReadonly;
exports.shallowReadonlyMap = shallowReadonlyMap;
exports.shallowRef = shallowRef;
exports.stop = stop;
exports.toDisplayString = toDisplayString;
exports.toRaw = toRaw;
exports.toReactive = toReactive;
exports.toReadonly = toReadonly;
exports.toRef = toRef;
exports.toRefs = toRefs;
exports.track = track;
exports.trackEffects = trackEffects;
exports.trackRefValue = trackRefValue;
exports.trigger = trigger;
exports.triggerEffects = triggerEffects;
exports.triggerRefValue = triggerRefValue;
exports.unRef = unRef;
exports.watch = watch;
exports.watchEffect = watchEffect;
exports.watchPostEffect = watchPostEffect;
