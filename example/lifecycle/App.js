/*
 * @Author: Zhouqi
 * @Date: 2022-03-26 21:17:12
 * @LastEditors: Zhouqi
 * @LastEditTime: 2022-04-06 12:31:25
 */
import {
    h,
    onBeforeMount,
    onMounted,
    getCurrentInstance
} from "../../lib/my-mini-vue.esm.js";

export default {
    name: "App",
    setup() {
        onBeforeMount(() => {
            console.log('beforeMount');
        });
        onMounted(() => {
            const instance = getCurrentInstance();
            console.log(instance);
        });
    },
    render() {
        return h("div");
    }
};