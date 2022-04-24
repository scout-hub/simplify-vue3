/*
 * @Author: Zhouqi
 * @Date: 2022-04-24 20:33:14
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-24 20:35:00
 */

import { registerRuntimeHelpers } from "../../compiler-core/src/";

export const V_SHOW = Symbol(`vShow`);

registerRuntimeHelpers({
  [V_SHOW]: `vShow`,
});
