/*
 * @Author: Zhouqi
 * @Date: 2022-03-26 21:17:12
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-06 17:15:36
 */
import {
    h,
    ref,
    onBeforeMount,
    onMounted,
    getCurrentInstance,
    onBeforeUpdate,
    onUpdated
} from "../../lib/my-mini-vue.esm.js";

const Child = {
    name: 'Child',
    setup() {},
    render() {
        return h('div', null, `${this.$props.count}xxx`);
    }
}

export default {
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
        const count = ref(1);
        const click = () => {
            for (let i = 0; i < 10; i++) {
                count.value = i;
            }
        }
        return {
            count,
            click
        }
    },
    render() {
        return h("div", {
            onClick: this.click
        }, [h(Child, {
            count: this.count
        })]);
    }
};