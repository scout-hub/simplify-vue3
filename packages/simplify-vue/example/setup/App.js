/*
 * @Author: Zhouqi
 * @Date: 2022-03-26 21:17:12
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-07 21:24:21
 */
import {
    h
} from "../../dist/simplify-vue.esm.js";

const Child = {
    name: "Child",
    props: {
        name: String
    },
    setup(props, setupContext) {
        console.log({
            props,
            setupContext
        });
    },
    render() {
        return h('div', null, this.$slots.name());
    }
}

export default {
    name: "App",
    setup() {
        return {
            msg: 'test123'
        }
    },
    render() {
        return h("div", null, [h(Child, {
            count: 1,
            name: '123'
        }, {
            name: () => h('div', null, 'slots')
        })]);
    }
};