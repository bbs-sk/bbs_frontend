export interface NavigationItem {
  id: string;
  title: string;
  type: 'item' | 'collapse' | 'group';
  translate?: string;
  icon?: string;
  hidden?: boolean;
  url?: string;
  classes?: string;
  groupClasses?: string;
  exactMatch?: boolean;
  external?: boolean;
  target?: boolean;
  breadcrumbs?: boolean;
  children?: NavigationItem[];
  link?: string;
  description?: string;
  path?: string;
}

export const NavigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'default',
        title: 'Dashboard',
        type: 'item',
        classes: 'nav-item',
        url: '/dashboard',
        icon: 'dashboard',
        breadcrumbs: false
      }
    ]
  },
  {
    id: 'table',
    title: 'table',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'Proyek',
        title: 'Proyek',
        type: 'item',
        classes: 'nav-item',
        url: '/project',
        icon: 'project',
        breadcrumbs: false
      },
      {
        id: 'Barang',
        title: 'Barang',
        type: 'item',
        classes: 'nav-item',
        url: '/barang',
        icon: 'gold',
        breadcrumbs: false
      },
      {
        id: 'Invoice',
        title: 'Pemesanan',
        type: 'item',
        classes: 'nav-item',
        url: '/invoice',
        icon: 'shopping-cart',
        breadcrumbs: false
      },
      {
        id: 'Transaksi',
        title: 'Transaksi Barang',
        type: 'item',
        classes: 'nav-item',
        url: '/transaksi',
        icon: 'interaction',
        breadcrumbs: false
      },
      {
        id: 'Laporan',
        title: 'Laporan Penjualan',
        type: 'item',
        classes: 'nav-item',
        url: '/laporan',
        icon: 'dollar',
        breadcrumbs: false
      },
      {
        id: 'User',
        title: 'Daftar Pengguna',
        type: 'item',
        classes: 'nav-item',
        url: '/user',
        icon: 'user',
        breadcrumbs: false
      }
    ]
  },
  {
    id: 'authentication',
    title: 'Authentication',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'login',
        title: 'Login',
        type: 'item',
        classes: 'nav-item',
        url: '/login',
        icon: 'login',
        target: true,
        breadcrumbs: false
      },
      {
        id: 'register',
        title: 'Register',
        type: 'item',
        classes: 'nav-item',
        url: '/register',
        icon: 'profile',
        target: true,
        breadcrumbs: false
      }
    ]
  },
  {
    id: 'utilities',
    title: 'UI Components',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'typography',
        title: 'Typography',
        type: 'item',
        classes: 'nav-item',
        url: '/typography',
        icon: 'font-size'
      },
      {
        id: 'color',
        title: 'Colors',
        type: 'item',
        classes: 'nav-item',
        url: '/color',
        icon: 'bg-colors'
      },
      {
        id: 'ant-icons',
        title: 'Ant Icons',
        type: 'item',
        classes: 'nav-item',
        url: 'https://ant.design/components/icon',
        icon: 'ant-design',
        target: true,
        external: true
      }
    ]
  },

  {
    id: 'other',
    title: 'Other',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'sample-page',
        title: 'Sample Page',
        type: 'item',
        url: '/sample-page',
        classes: 'nav-item',
        icon: 'chrome'
      },
      {
        id: 'document',
        title: 'Document',
        type: 'item',
        classes: 'nav-item',
        url: 'https://codedthemes.gitbook.io/mantis-angular/',
        icon: 'question',
        target: true,
        external: true
      }
    ]
  }
];
