/*
 * @Author: Zhouqi
 * @Date: 2022-03-26 21:17:12
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-02 17:39:15
 */
import {
    h,
    provide,
    inject,
    createTextVnode
} from "../../lib/my-mini-vue.esm.js";

const Child = {
    name: "Child",
    setup() {
        provide('app', 'app1')
        const foo = inject('app');
        return {
            foo
        }
    },
    render() {
        return h('div', null, [createTextVnode(this.foo), h(GridSon)]);
    }
}

const GridSon = {
    name: "GridSon",
    setup() {
        const app = inject('app');
        const app2 = inject('app2');
        const app3 = inject('app3', 'app3');
        const app4 = inject('app3', function () {
            return this.app;
        }, true);
        return {
            app,
            app2,
            app3,
            app4
        }
    },
    render() {
        return h('div', null, `${this.app}-${this.app2}-${this.app3}-${this.app4}`);
    }
}

export default {
    name: "App",
    setup() {
        provide('app', 'app');
        provide('app2', 'app2');
        return {
            msg: 'test123'
        }
    },
    render() {
        return h("div", null, [h(Child)]);
    }
};