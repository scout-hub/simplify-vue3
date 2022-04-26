/*
 * @Author: Zhouqi
 * @Date: 2022-04-24 20:33:14
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-26 09:10:27
 */

import { registerRuntimeHelpers } from "@simplify-vue/compiler-core";

export const V_SHOW = Symbol(`vShow`);

registerRuntimeHelpers({
  [V_SHOW]: `vShow`,
});
 