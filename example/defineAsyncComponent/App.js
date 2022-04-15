/*
 * @Author: Zhouqi
 * @Date: 2022-03-26 21:17:12
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-15 23:04:39
 */
import {
    h,
    defineAsyncComponent
} from "../../lib/simplify-vue.esm.js";
import Error from "./Error.js";
import Loading from "./Loading.js";

const SlotChild = defineAsyncComponent({
    loader: () => import('./Child.js'),
    text: 1
})

const Child = defineAsyncComponent(() => import('./Child.js'));

const timeoutChild = defineAsyncComponent({
    loader: () => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(import('./Child.js'))
            }, 3000);
        })
    },
    timeout: 2000,
    errorComponent: Error
})

const errorChild = defineAsyncComponent({
    loader: () => import('./Child1.js'),
    timeout: 2000,
    errorComponent: Error
})

const LoadingChild = defineAsyncComponent({
    loader: () => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(import('./Child.js'))
            }, 3000);
        })
    },
    delay: 200,
    loadingComponent: Loading
})

export default {
    name: "App",
    setup() {

    },
    render() {
        return h("div", null, [
            h(SlotChild, {
                text: 1
            }, {
                body: () => h('div', null, 'xxxx')
            }),
            h(Child, {
                text: 2
            }),
            h(timeoutChild, {
                text: 3
            }),
            h(errorChild),
            h(LoadingChild)
        ]);
    }
};