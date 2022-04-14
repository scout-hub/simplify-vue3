/*
 * @Author: Zhouqi
 * @Date: 2022-03-26 21:17:12
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-13 22:22:39
 */
import {
    h,
    renderSlot,
    ref
} from "../../lib/simplify-vue.esm.js";

const Child = {
    name: "Child",
    setup() {

    },
    render() {
        const head = 'head';
        return h('div', null, [renderSlot(this.$slots, 'head', {
            head
        }), renderSlot(this.$slots, 'body')]);
    }
}

export default {
    name: "App",
    setup() {
        const flag = ref(true);
        window.flag = flag;
        return {
            flag
        }
    },
    render() {
        return this.flag ?
            h("div", {}, [h(Child, {}, {
                head: ({
                    head
                }) => [h('div', null, head)],
                body: () => h('div', null, 'body'),
            })]) :
            h("div", {}, [h(Child, {}, {
                head: ({
                    head
                }) => [h('p', null, head)],
                body: () => h('div', null, 'body'),
            })]);
    }
};