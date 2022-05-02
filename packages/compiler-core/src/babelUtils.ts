/*
 * @Author: Zhouqi
 * @Date: 2022-05-02 21:10:03
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-05-02 21:54:10
 */
import { walk } from "estree-walker";

// 处理复杂标识符
export function walkIdentifiers(ast, onIdentifier) {
  // 用walk去遍历符合estree的ast
  walk(ast, {
    enter(node, parent) {
      // 如果是标识符则进行处理
      if (node.type === "Identifier") {
        const isRefed = isReferencedIdentifier(node, parent);
        onIdentifier(node, isRefed);
      }
    },
  });
}

export function isReferencedIdentifier(id, parent) {
  if (isReferenced(id, parent)) {
    return true;
  }
  return false;
}

/**
 * Copied from https://github.com/babel/babel/blob/main/packages/babel-types/src/validators/isReferenced.ts
 * To avoid runtime dependency on @babel/types (which includes process references)
 * This file should not change very often in babel but we may need to keep it
 * up-to-date from time to time.
 *
 * https://github.com/babel/babel/blob/main/LICENSE
 *
 */
function isReferenced(node, parent, grandparent?): boolean {
  switch (parent.type) {
    // yes: PARENT[NODE]
    // yes: NODE.child
    // no: parent.NODE
    case "MemberExpression":
    case "OptionalMemberExpression":
      if (parent.property === node) {
        return !!parent.computed;
      }
      return parent.object === node;

    case "JSXMemberExpression":
      return parent.object === node;
    // no: let NODE = init;
    // yes: let id = NODE;
    case "VariableDeclarator":
      return parent.init === node;

    // yes: () => NODE
    // no: (NODE) => {}
    case "ArrowFunctionExpression":
      return parent.body === node;

    // no: class { #NODE; }
    // no: class { get #NODE() {} }
    // no: class { #NODE() {} }
    // no: class { fn() { return this.#NODE; } }
    case "PrivateName":
      return false;

    // no: class { NODE() {} }
    // yes: class { [NODE]() {} }
    // no: class { foo(NODE) {} }
    case "ClassMethod":
    case "ClassPrivateMethod":
    case "ObjectMethod":
      if (parent.key === node) {
        return !!parent.computed;
      }
      return false;

    // yes: { [NODE]: "" }
    // no: { NODE: "" }
    // depends: { NODE }
    // depends: { key: NODE }
    case "ObjectProperty":
      if (parent.key === node) {
        return !!parent.computed;
      }
      // parent.value === node
      return !grandparent || grandparent.type !== "ObjectPattern";
    // no: class { NODE = value; }
    // yes: class { [NODE] = value; }
    // yes: class { key = NODE; }
    case "ClassProperty":
      if (parent.key === node) {
        return !!parent.computed;
      }
      return true;
    case "ClassPrivateProperty":
      return parent.key !== node;

    // no: class NODE {}
    // yes: class Foo extends NODE {}
    case "ClassDeclaration":
    case "ClassExpression":
      return parent.superClass === node;

    // yes: left = NODE;
    // no: NODE = right;
    case "AssignmentExpression":
      return parent.right === node;

    // no: [NODE = foo] = [];
    // yes: [foo = NODE] = [];
    case "AssignmentPattern":
      return parent.right === node;

    // no: NODE: for (;;) {}
    case "LabeledStatement":
      return false;

    // no: try {} catch (NODE) {}
    case "CatchClause":
      return false;

    // no: function foo(...NODE) {}
    case "RestElement":
      return false;

    case "BreakStatement":
    case "ContinueStatement":
      return false;

    // no: function NODE() {}
    // no: function foo(NODE) {}
    case "FunctionDeclaration":
    case "FunctionExpression":
      return false;

    // no: export NODE from "foo";
    // no: export * as NODE from "foo";
    case "ExportNamespaceSpecifier":
    case "ExportDefaultSpecifier":
      return false;

    // no: export { foo as NODE };
    // yes: export { NODE as foo };
    // no: export { NODE as foo } from "foo";
    case "ExportSpecifier":
      if (grandparent?.source) {
        return false;
      }
      return parent.local === node;

    // no: import NODE from "foo";
    // no: import * as NODE from "foo";
    // no: import { NODE as foo } from "foo";
    // no: import { foo as NODE } from "foo";
    // no: import NODE from "bar";
    case "ImportDefaultSpecifier":
    case "ImportNamespaceSpecifier":
    case "ImportSpecifier":
      return false;

    // no: import "foo" assert { NODE: "json" }
    case "ImportAttribute":
      return false;

    // no: <div NODE="foo" />
    case "JSXAttribute":
      return false;

    // no: [NODE] = [];
    // no: ({ NODE }) = [];
    case "ObjectPattern":
    case "ArrayPattern":
      return false;

    // no: new.NODE
    // no: NODE.target
    case "MetaProperty":
      return false;

    // yes: type X = { someProperty: NODE }
    // no: type X = { NODE: OtherType }
    case "ObjectTypeProperty":
      return parent.key !== node;

    // yes: enum X { Foo = NODE }
    // no: enum X { NODE }
    case "TSEnumMember":
      return parent.id !== node;

    // yes: { [NODE]: value }
    // no: { NODE: value }
    case "TSPropertySignature":
      if (parent.key === node) {
        return !!parent.computed;
      }

      return true;
  }

  return true;
}
