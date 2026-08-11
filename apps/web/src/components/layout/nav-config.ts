export interface NavItem {
  href: string;
  label: string;
  icon:
    | 'home'
    | 'pos'
  | 'mesas'
  | 'entrantes'
  | 'delivery'
  | 'pedidos'
    | 'reportes'
    | 'usuarios'
    | 'config'
    | 'categorias'
    | 'productos'
    | 'salsas'
    | 'inventario'
    | 'ordenMenu';
}

export const jefaOperacionNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Inicio', icon: 'home' },
  { href: '/pos', label: 'POS', icon: 'pos' },
  { href: '/mesas', label: 'Mesas', icon: 'mesas' },
  { href: '/delivery', label: 'Delivery', icon: 'delivery' },
  { href: '/entrantes', label: 'Recojo', icon: 'entrantes' },
  { href: '/pedidos', label: 'Pedidos', icon: 'pedidos' },
];

export const jefaAdminNavItems: NavItem[] = [
  { href: '/reportes', label: 'Reportes', icon: 'reportes' },
  { href: '/usuarios', label: 'Usuarios', icon: 'usuarios' },
  { href: '/configuracion', label: 'Configuración', icon: 'config' },
];

export const jefaCatalogoNavItems: NavItem[] = [
  { href: '/categorias', label: 'Categorías', icon: 'categorias' },
  { href: '/productos', label: 'Productos', icon: 'productos' },
  { href: '/salsas', label: 'Salsas', icon: 'salsas' },
  { href: '/orden-menu', label: 'Orden del menú', icon: 'ordenMenu' },
  { href: '/inventario', label: 'Inventario', icon: 'inventario' },
];

export const jefaNavItems: NavItem[] = [
  ...jefaOperacionNavItems,
  ...jefaAdminNavItems,
  ...jefaCatalogoNavItems,
];

export const cajeraNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Inicio', icon: 'home' },
  { href: '/mesas', label: 'Mesas', icon: 'mesas' },
  { href: '/delivery', label: 'Delivery', icon: 'delivery' },
  { href: '/pos', label: 'POS', icon: 'pos' },
  { href: '/pedidos', label: 'Pedidos', icon: 'pedidos' },
];

export const jefaMobileNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Inicio', icon: 'home' },
  { href: '/mesas', label: 'Mesas', icon: 'mesas' },
  { href: '/delivery', label: 'Delivery', icon: 'delivery' },
  { href: '/pos', label: 'POS', icon: 'pos' },
  { href: '/entrantes', label: 'Recojo', icon: 'entrantes' },
  { href: '/pedidos', label: 'Pedidos', icon: 'pedidos' },
];

export function isNavActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (href === '/pedidos' && pathname.startsWith('/pedidos')) return true;
  if (href === '/mesas' && pathname.startsWith('/mesas')) return true;
  if (href === '/entrantes' && pathname.startsWith('/entrantes')) return true;
  if (href === '/delivery' && pathname.startsWith('/delivery')) return true;
  if (href === '/pos' && pathname.startsWith('/pos')) return true;
  if (href === '/usuarios' && pathname.startsWith('/usuarios')) return true;
  if (href === '/configuracion' && pathname.startsWith('/configuracion')) return true;
  if (href === '/inventario' && pathname.startsWith('/inventario')) return true;
  if (href === '/orden-menu' && pathname.startsWith('/orden-menu')) return true;
  if (href === '/salsas' && pathname.startsWith('/salsas')) return true;
  if (href === '/cobro' && pathname.startsWith('/cobro')) return false;
  return false;
}
