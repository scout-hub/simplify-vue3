/*
 * @Author: Zhouqi
 * @Date: 2022-03-26 21:17:12
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-01 21:02:54
 */
import {
    h,
    renderSlot,
    createTextVnode
} from "../../lib/my-mini-vue.esm.js";

const Child = {
    name: "Child",
    setup(props) {},
    render() {
        const head = 'head';
        const child = h('div', null, 1231);
        return h('div', null, [renderSlot(this.$slots, 'head', {
            head
        }), child, renderSlot(this.$slots, 'body')]);
    }
}

export default {
    name: "App",
    setup() {},
    render() {
        return h("div", {}, [h(Child, {}, {
            head: ({
                head
            }) => [h('div', null, head), createTextVnode('text')],
            body: () => h('div', null, 'body'),
        })]);
    }
};