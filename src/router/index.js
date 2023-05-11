import { createRouter, createWebHashHistory } from "vue-router";
// import HomeView from "../views/HomeView.vue";
import FirstPageVue from "@/views/FirstPage.vue";

const routes = [
  {
    path: "/",
    name: "home",
    component: FirstPageVue,
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
