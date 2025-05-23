import { createRouter, createWebHistory } from 'vue-router';
import HomePage from '../views/HomePage.vue';
import TrendingPage from '../views/TrendingPage.vue';
import ProfilePage from '../views/ProfilePage.vue';
import ManageEventsPage from '../views/ManageEventsPage.vue';
import RegisterPage from '../views/RegisterPage.vue';
import AdminDashboardPage from '../views/AdminDashboardPage.vue';
import SignInPage from '../views/SignInPage.vue';
import ChartPage from '../views/ChartPage.vue';
import MediaPage from '../views/MediaPage.vue';
import { useAuthStore } from '../store/auth';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomePage
  },
  {
    path: '/trending',
    name: 'Trending',
    component: TrendingPage
  },
  {
    path: '/profile',
    name: 'Profile',
    component: ProfilePage,
    meta: { requiresAuth: true }
  },
  {
    path: '/manage-events',
    name: 'ManageEvents',
    component: ManageEventsPage,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin',
    name: 'AdminDashboard',
    component: AdminDashboardPage,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/charts',
    name: 'Charts',
    component: ChartPage
  },
  {
    path: '/sign-in',
    name: 'SignIn',
    component: SignInPage
  },
  {
    path: '/register',
    name: 'Register',
    component: RegisterPage
  },
  {
    path: '/media',
    name: 'Media',
    component: MediaPage,
    meta: {
      requiresAuth: false
    }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// navguard for auth
router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore();
  const isAuthenticated = authStore.checkAuth();
  const isAdmin = authStore.isAdmin();
  
  if (to.matched.some(record => record.meta.requiresAdmin) && !isAdmin) {
    next({ name: 'Home' });
  } else if (to.matched.some(record => record.meta.requiresAuth) && !isAuthenticated) {
    next({ name: 'SignIn' });
  } else if (to.name === 'SignIn' && isAuthenticated) {
    next({ name: 'Home' });
  } else if (to.name === 'Register' && isAuthenticated) {
    next({ name: 'Home' });
  } else {
    next();
  }
});

export default router;