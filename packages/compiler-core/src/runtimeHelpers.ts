/*
 * @Author: Zhouqi
 * @Date: 2022-04-09 22:40:56
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-24 21:12:47
 */
export const TO_DISPLAY_STRING = Symbol(`toDisplayString`);
export const OPEN_BLOCK = Symbol(`openBlock`);
export const CREATE_ELEMENT_BLOCK = Symbol(`createElementBlock`);
export const CREATE_ELEMENT_VNODE = Symbol(`createElementVNode`);
export const CREATE_TEXT = Symbol(`createTextVNode`);
export const NORMALIZE_CLASS = Symbol(`normalizeClass`);
export const WITH_DIRECTIVES = Symbol(`withDirectives`);

export const helperNameMap: any = {
  [TO_DISPLAY_STRING]: `toDisplayString`,
  [OPEN_BLOCK]: `openBlock`,
  [CREATE_ELEMENT_BLOCK]: `createElementBlock`,
  [CREATE_ELEMENT_VNODE]: `createElementVNode`,
  [CREATE_TEXT]: `createTextVNode`,
  [NORMALIZE_CLASS]: `normalizeClass`,
  [WITH_DIRECTIVES]: `withDirectives`,
};

// 注册运行时辅助函数
export function registerRuntimeHelpers(helpers) {
  Object.getOwnPropertySymbols(helpers).forEach((s) => {
    helperNameMap[s] = helpers[s];
  });
}
