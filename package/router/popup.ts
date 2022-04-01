import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router';

import Popup from '../views/popup/view/popup.vue';
const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'home',
    component: Popup
  },
  {
    path: '/libs/views/popup.html',
    name: 'popup',
    component: Popup
  }
];

export const router = createRouter({
  history: createWebHashHistory(process.env.BASE_URL),
  routes
});
