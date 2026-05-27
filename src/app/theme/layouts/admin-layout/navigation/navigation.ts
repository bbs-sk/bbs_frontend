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
  roles?: string[];
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
        roles: ['Admin Kantor'],
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
        roles: ['Admin Kantor', 'Lapangan'],
        breadcrumbs: false
      },
      {
        id: 'Barang',
        title: 'Barang',
        type: 'item',
        classes: 'nav-item',
        url: '/barang',
        icon: 'gold',
        roles: ['Admin Kantor', 'Lapangan', 'Gudang'],
        breadcrumbs: false
      },
      {
        id: 'Invoice',
        title: 'Pemesanan',
        type: 'item',
        classes: 'nav-item',
        url: '/invoice',
        icon: 'shopping-cart',
        roles: ['Admin Kantor', 'Lapangan', 'Gudang'],
        breadcrumbs: false
      },
      {
        id: 'Transaksi',
        title: 'Transaksi Barang',
        type: 'item',
        classes: 'nav-item',
        url: '/transaksi',
        icon: 'interaction',
        roles: ['Admin Kantor', 'Gudang'],
        breadcrumbs: false
      },
      {
        id: 'Laporan',
        title: 'Laporan Penjualan',
        type: 'item',
        classes: 'nav-item',
        url: '/laporan',
        icon: 'dollar',
        roles: ['Admin Kantor'],
        breadcrumbs: false
      },
      {
        id: 'User',
        title: 'Daftar Pengguna',
        type: 'item',
        classes: 'nav-item',
        url: '/user',
        icon: 'user',
        roles: ['Admin Kantor'],
        breadcrumbs: false
      }
    ]
  }
  // {
  //   id: 'authentication',
  //   title: 'Authentication',
  //   type: 'group',
  //   icon: 'icon-navigation',
  //   children: [
  //     {
  //       id: 'login',
  //       title: 'Login',
  //       type: 'item',
  //       classes: 'nav-item',
  //       url: '/login',
  //       icon: 'login',
  //       target: true,
  //       breadcrumbs: false
  //     },
  //     {
  //       id: 'register',
  //       title: 'Register',
  //       type: 'item',
  //       classes: 'nav-item',
  //       url: '/register',
  //       icon: 'profile',
  //       target: true,
  //       breadcrumbs: false
  //     }
  //   ]
  // },
  // {
  //   id: 'utilities',
  //   title: 'UI Components',
  //   type: 'group',
  //   icon: 'icon-navigation',
  //   children: [
  //     {
  //       id: 'typography',
  //       title: 'Typography',
  //       type: 'item',
  //       classes: 'nav-item',
  //       url: '/typography',
  //       icon: 'font-size'
  //     },
  //     {
  //       id: 'color',
  //       title: 'Colors',
  //       type: 'item',
  //       classes: 'nav-item',
  //       url: '/color',
  //       icon: 'bg-colors'
  //     },
  //     {
  //       id: 'ant-icons',
  //       title: 'Ant Icons',
  //       type: 'item',
  //       classes: 'nav-item',
  //       url: 'https://ant.design/components/icon',
  //       icon: 'ant-design',
  //       target: true,
  //       external: true
  //     }
  //   ]
  // },

  // {
  //   id: 'other',
  //   title: 'Other',
  //   type: 'group',
  //   icon: 'icon-navigation',
  //   children: [
  //     {
  //       id: 'sample-page',
  //       title: 'Sample Page',
  //       type: 'item',
  //       url: '/sample-page',
  //       classes: 'nav-item',
  //       icon: 'chrome'
  //     },
  //     {
  //       id: 'document',
  //       title: 'Document',
  //       type: 'item',
  //       classes: 'nav-item',
  //       url: 'https://codedthemes.gitbook.io/mantis-angular/',
  //       icon: 'question',
  //       target: true,
  //       external: true
  //     }
  //   ]
  // }
];
