/*
 * @Author: Zhouqi
 * @Date: 2022-03-26 21:17:12
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-16 14:29:17
 */
import {
    h,
    renderSlot,
    ref
} from "../../dist/simplify-vue.esm.js";

const Child = function (props, {
    slots
}) {
    return h('div', null, [h('p', null, props.count), renderSlot(slots, 'default')]);
}

Child.props = {
    count: Number,
    name: {
        type: String
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
            h("div", null, [h(Child, {
                    count: 1,
                    text: '123'
                },
                () => h('div', null, 'head')
            )]) :
            h("div", null, [h(Child, {
                    count: 1,
                    text: '123'
                },
                () => h('div', null, 'head2')
            )])
    }
};