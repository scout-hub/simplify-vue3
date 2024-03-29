/*
 * @Author: Zhouqi
 * @Date: 2022-04-09 22:40:56
 * @LastEditors: Zhouqi
 * @LastEditTime: 2023-12-14 16:25:17
 */
export const TO_DISPLAY_STRING = Symbol(`toDisplayString`);
export const OPEN_BLOCK = Symbol(`openBlock`);
export const CREATE_BLOCK = Symbol(`createBlock`);
export const CREATE_ELEMENT_BLOCK = Symbol(`createElementBlock`);
export const CREATE_ELEMENT_VNODE = Symbol(`createElementVNode`);
export const CREATE_VNODE = Symbol(`createVNode`);
export const CREATE_TEXT = Symbol(`createTextVNode`);
export const NORMALIZE_CLASS = Symbol(`normalizeClass`);
export const WITH_DIRECTIVES = Symbol(`withDirectives`);
export const CREATE_COMMENT = Symbol(`createCommentVNode`);
export const FRAGMENT = Symbol(`Fragment`);
export const RENDER_LIST = Symbol(`renderList`);
export const RESOLVE_COMPONENT = Symbol(`resolveComponent`);


export const helperNameMap: any = {
  [TO_DISPLAY_STRING]: `toDisplayString`,
  [OPEN_BLOCK]: `openBlock`,
  [CREATE_BLOCK]: `createBlock`,
  [CREATE_ELEMENT_BLOCK]: `createElementBlock`,
  [CREATE_ELEMENT_VNODE]: `createElementVNode`,
  [CREATE_VNODE]: `createVNode`,
  [CREATE_TEXT]: `createTextVNode`,
  [NORMALIZE_CLASS]: `normalizeClass`,
  [WITH_DIRECTIVES]: `withDirectives`,
  [CREATE_COMMENT]: `createCommentVNode`,
  [FRAGMENT]: `Fragment`,
  [RENDER_LIST]: `renderList`,
  [RESOLVE_COMPONENT]: `resolveComponent`,
};

// 注册运行时辅助函数
export function registerRuntimeHelpers(helpers) {
  Object.getOwnPropertySymbols(helpers).forEach((s) => {
    helperNameMap[s] = helpers[s];
  });
}
