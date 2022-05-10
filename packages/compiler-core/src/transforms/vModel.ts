import { createCompoundExpression, createSimpleExpression } from "../ast";
import { createObjectProperty } from "./transformElement";

/**
 * @author: Zhouqi
 * @description: 转化v-model
 * @param dir
 * @return
 */
export const transformModel = (dir) => {
  const { exp, arg } = dir;
  const expString = exp.content;
  const propName = arg ? arg : createSimpleExpression("modelValue", true);
  const eventName = `onUpdate:modelValue`;
  const eventArg = `$event`;
  let assignmentExp = createCompoundExpression([
    `${eventArg} => ((`,
    exp,
    `) = $event)`,
  ]);
  const props = [
    // modelValue: text
    createObjectProperty(propName, dir.exp!),
    // "onUpdate:modelValue": $event => (text = $event)
    createObjectProperty(eventName, assignmentExp),
  ];
  return { props };
};
