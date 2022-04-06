/*
 * @Author: Zhouqi
 * @Date: 2022-03-26 21:17:12
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-06 18:01:26
 */
import {
    h,
    ref,
    onBeforeMount,
    onMounted,
    getCurrentInstance,
    onBeforeUpdate,
    onUpdated,
    onBeforeUnmount,
    onUnmounted,
    createApp
} from "../../lib/my-mini-vue.esm.js";

const Child = {
    name: 'Child',
    setup() {
        onBeforeUnmount(() => {
            console.log('beforeUnmount children');
        });

        onUnmounted(() => {
            console.log('unmounted children');
        });
    },
    render() {
        return h('div', null, 123);
    }
}

const App = {
    name: "App",
    setup() {
        onBeforeMount(() => {
            console.log('beforeMount');
        });
        onMounted(() => {
            const instance = getCurrentInstance();
            console.log(instance.isMounted);
            console.log('mounted');
        });
        onBeforeUpdate(() => {
            console.log('beforeupdate');
        });
        onUpdated(() => {
            console.log('updated');
            const instance = getCurrentInstance();
            console.log(instance.vnode.el.children[0].innerText);
        });

        onBeforeUnmount(() => {
            console.log('beforeUnmount parent');
        });

        onUnmounted(() => {
            console.log('unmounted parent');
        });

        const click = () => {
            app.unmount();
        }
        return {
            click
        }
    },
    render() {
        return h("div", {
            onClick: this.click
        }, [h(Child), h('span', null, 1231)]);
    }
};

const app = createApp(App)
app.mount('#app');