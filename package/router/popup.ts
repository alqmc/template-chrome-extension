import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router';
const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/popup/view/popup.vue')
  },
  {
    path: '/libs/views/popup.html',
    name: 'popup',
    component: () => import('../views/popup/view/popup.vue')
  }
];

const router = createRouter({
  history: createWebHashHistory(process.env.BASE_URL),
  routes
});

export default router;
