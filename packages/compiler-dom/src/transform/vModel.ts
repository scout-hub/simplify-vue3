/*
 * @Author: Zhouqi
 * @Date: 2022-05-10 20:52:05
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-05-10 21:35:03
 */
import { transformModel as baseTransform } from "@simplify-vue/compiler-core";
import { V_MODEL_TEXT } from "../runtimeHelpers";

export const transformModel = (dir, node, context) => {
  const baseResult: any = baseTransform(dir);
  const { tag } = node;
  if (tag === "input") {
    const directiveToUse = V_MODEL_TEXT;
    baseResult.needRuntime = context.helper(directiveToUse);
  }
  return baseResult;
};
