/*
 * @Author: Zhouqi
 * @Date: 2022-03-26 21:17:12
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-17 14:02:37
 */
import {
    h,
    ref,
    createTextVNode,
    Teleport
} from "../../lib/simplify-vue.esm.js";

const Child = {
    name: "Child",
    setup() {},
    props: ['text'],
    render() {
        return h('div', null, [createTextVNode(`I am a teleport component${this.$props.text} `)])
    }
}

export default {
    name: "App",
    setup() {
        const flag = ref(true);
        window.flag = flag;
        const click = () => {
            flag.value = false;
        }

        return {
            flag,
            click
        }
    },
    render() {
        return this.flag ?
            h('div', {},
                [
                    h(Teleport, {
                        to: '#teleport',
                        disabled: false
                    }, [
                        h('div', null, 'div1'),
                        // h(Child, {
                        //     text: '1'
                        // }),
                    ]),
                    h('button', {
                        onclick: this.click
                    }, '更新'),
                    h('div', null, 'mount')
                ]) :
            h('div', {},
                [
                    h(Teleport, {
                        to: '#teleport',
                        // to: '#newTeleport',
                        disabled: false
                    }, [
                        h('h1', null, 'div2'),
                        // h(Child, {
                        //     text: '2'
                        // }),
                    ]),
                    h('button', {
                        onclick: this.click
                    }, '更新'),
                    h('div', null, 'update')
                ]);
    }
};