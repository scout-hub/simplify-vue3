/*
 * @Author: Zhouqi
 * @Date: 2022-03-26 21:17:12
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-16 11:42:05
 */
import {
    h,
    defineAsyncComponent
} from "../../dist/simplify-vue.esm.js";
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
let times = 0
const ErrorChild = defineAsyncComponent({
    loader: () => {
        return new Promise((resolve) => {
            times++;
            if (times === 4) {
                resolve(import('./Child.js'));
            } else {
                resolve(import('./Child1.js'));
            }
        })
    },
    timeout: 2000,
    errorComponent: Error,
    onError(error, retry, fail, attempts) {
        if (attempts <= 3) {
            retry()
        } else {
            fail();
        }
    }
})

const LoadingChild = defineAsyncComponent({
    loader: () => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(import('./Child.js'))
            }, 3000);
        })
    },
    delay: 1000,
    loadingComponent: Loading
})


export default {
    name: "App",
    setup() {},
    render() {
        return h("div", null, [
            // h(SlotChild, {
            //     text: 'slotChild',
            // }, {
            //     body: () => h('div', null, 'xxxx')
            // }),
            // h(Child, {
            //     text: 'Child',
            //     name: 'xxx'
            // }),
            // h(timeoutChild, {
            //     text: 'timeoutChild'
            // }),
            h(ErrorChild, {
                text: 6
            }),
            // h(LoadingChild, {
            //     text: 'LoadingChild'
            // })
        ]);
    }
};