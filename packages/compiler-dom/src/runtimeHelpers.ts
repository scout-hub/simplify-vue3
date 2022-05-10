/*
 * @Author: Zhouqi
 * @Date: 2022-04-24 20:33:14
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-05-10 20:58:11
 */

import { registerRuntimeHelpers } from "@simplify-vue/compiler-core";

export const V_SHOW = Symbol(`vShow`);
export const V_MODEL_TEXT = Symbol(`vModelText`);

registerRuntimeHelpers({
  [V_SHOW]: `vShow`,
  [V_MODEL_TEXT]: `vModelText`,
});
