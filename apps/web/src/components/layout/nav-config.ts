export interface NavItem {
  href: string;
  label: string;
  icon:
    | 'home'
    | 'pos'
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

export const jefaNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Inicio', icon: 'home' },
  { href: '/pos', label: 'POS', icon: 'pos' },
  { href: '/delivery', label: 'Delivery', icon: 'delivery' },
  { href: '/entrantes', label: 'Recojo', icon: 'entrantes' },
  { href: '/pedidos', label: 'Pedidos', icon: 'pedidos' },
  { href: '/reportes', label: 'Reportes', icon: 'reportes' },
  { href: '/usuarios', label: 'Usuarios', icon: 'usuarios' },
  { href: '/configuracion', label: 'Configuración', icon: 'config' },
  { href: '/categorias', label: 'Categorías', icon: 'categorias' },
  { href: '/productos', label: 'Productos', icon: 'productos' },
  { href: '/salsas', label: 'Salsas', icon: 'salsas' },
  { href: '/orden-menu', label: 'Orden del menú', icon: 'ordenMenu' },
  { href: '/inventario', label: 'Inventario', icon: 'inventario' },
];

export const cajeraNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Inicio', icon: 'home' },
  { href: '/delivery', label: 'Delivery', icon: 'delivery' },
  { href: '/pos', label: 'POS', icon: 'pos' },
  { href: '/pedidos', label: 'Pedidos', icon: 'pedidos' },
];

export const jefaMobileNavItems: NavItem[] = [
  { href: '/dashboard', label: 'Inicio', icon: 'home' },
  { href: '/delivery', label: 'Delivery', icon: 'delivery' },
  { href: '/pos', label: 'POS', icon: 'pos' },
  { href: '/entrantes', label: 'Recojo', icon: 'entrantes' },
  { href: '/pedidos', label: 'Pedidos', icon: 'pedidos' },
];

export function isNavActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (href === '/pedidos' && pathname.startsWith('/pedidos')) return true;
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
