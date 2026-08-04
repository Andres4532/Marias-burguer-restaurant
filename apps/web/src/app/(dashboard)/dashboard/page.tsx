'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { NavIcon } from '@/components/layout/NavIcon';
import type { NavItem } from '@/components/layout/nav-config';

interface QuickLink {
  href: string;
  title: string;
  description: string;
  icon: NavItem['icon'];
  highlight?: boolean;
}

const cajeraLinks: QuickLink[] = [
  {
    href: '/delivery',
    title: 'Delivery',
    description: 'Control paso a paso de pedidos a domicilio',
    icon: 'delivery',
    highlight: true,
  },
  {
    href: '/pos',
    title: 'Nuevo pedido',
    description: 'Mesa, para recojo o delivery',
    icon: 'pos',
  },
  {
    href: '/entrantes',
    title: 'Recojo entrante',
    description: 'Pedidos para recojo del menú público',
    icon: 'entrantes',
  },
  {
    href: '/pedidos',
    title: 'Pedidos del día',
    description: 'Historial y detalle',
    icon: 'pedidos',
  },
];

const jefaOperacionLinks: QuickLink[] = cajeraLinks;

const jefaAdminLinks: QuickLink[] = [
  {
    href: '/reportes',
    title: 'Reportes',
    description: 'Ventas, gráficos y exportar',
    icon: 'reportes',
    highlight: true,
  },
  {
    href: '/productos',
    title: 'Productos',
    description: 'Menú, precios e imágenes',
    icon: 'productos',
  },
  {
    href: '/orden-menu',
    title: 'Orden del menú',
    description: 'Posición de productos en el catálogo',
    icon: 'ordenMenu',
  },
  {
    href: '/categorias',
    title: 'Categorías',
    description: 'Organizar el catálogo',
    icon: 'categorias',
  },
  {
    href: '/usuarios',
    title: 'Usuarios',
    description: 'Cajeras y accesos',
    icon: 'usuarios',
  },
  {
    href: '/configuracion',
    title: 'Configuración',
    description: 'Logo, menú público y horario',
    icon: 'config',
  },
];

function QuickLinkCard({ link }: { link: QuickLink }) {
  return (
    <Link
      href={link.href}
      className={`group rounded-xl border p-5 transition hover:shadow-md ${
        link.highlight
          ? 'bg-primary border-primary text-white shadow-sm shadow-primary/20 hover:bg-primary-hover'
          : 'bg-card border-border hover:border-primary/30 hover:bg-primary/[0.02]'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${
            link.highlight
              ? 'bg-white/15 text-white'
              : 'bg-primary/10 text-primary group-hover:bg-primary/15'
          }`}
        >
          <NavIcon icon={link.icon} className="size-5" />
        </div>
        <span
          className={`text-xs font-bold ${
            link.highlight ? 'text-white/80' : 'text-text-secondary'
          }`}
        >
          →
        </span>
      </div>
      <h3
        className={`mt-4 font-extrabold ${
          link.highlight ? 'text-white' : 'text-foreground'
        }`}
      >
        {link.title}
      </h3>
      <p
        className={`mt-1 text-sm ${
          link.highlight ? 'text-white/80' : 'text-text-secondary'
        }`}
      >
        {link.description}
      </p>
    </Link>
  );
}

function LinkSection({
  title,
  description,
  links,
}: {
  title: string;
  description?: string;
  links: QuickLink[];
}) {
  return (
    <section>
      <div className="mb-4">
        <h3 className="text-lg font-extrabold text-foreground">{title}</h3>
        {description && (
          <p className="text-sm text-text-secondary mt-1">{description}</p>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {links.map((link) => (
          <QuickLinkCard key={link.href} link={link} />
        ))}
      </div>
    </section>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const isJefa = user?.role === 'JEFA';

  return (
    <div className="space-y-8">
      <PageHeader
        title={isJefa ? 'Panel administrativo' : 'Panel de caja'}
        description="Resumen y accesos rápidos del restaurante"
      />

      <Card padding="lg" className="bg-gradient-to-br from-primary/5 via-card to-card">
        <p className="text-sm font-bold text-primary">Bienvenida</p>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground mt-1 tracking-tight">
          Hola, {user?.name}
        </h2>
        <p className="text-text-secondary mt-2 max-w-2xl">
          {isJefa
            ? 'Gestiona el catálogo, revisa reportes y supervisa los pedidos del día.'
            : 'Crea pedidos desde el POS, atiende entrantes y revisa el estado en Pedidos.'}
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-card border border-border px-3 py-1.5 text-xs font-bold text-text-secondary">
          <span className="size-2 rounded-full bg-primary" />
          {isJefa ? 'Rol: Jefa' : 'Rol: Cajera'}
        </div>
      </Card>

      <LinkSection
        title="Operación"
        description="Lo que usas durante el servicio"
        links={jefaOperacionLinks}
      />

      {isJefa && (
        <LinkSection
          title="Administración"
          description="Catálogo, equipo y configuración"
          links={jefaAdminLinks}
        />
      )}

      <Card padding="sm" className="bg-background border-dashed">
        <p className="text-sm text-text-secondary">
          <span className="font-bold text-foreground">Tip:</span>{' '}
          {isJefa
            ? 'Configura el logo y las imágenes de productos para que el menú público y el POS se vean más profesionales.'
            : 'Usa Delivery para domicilios, Recojo para pedidos para llevar y POS para mesa.'}
        </p>
      </Card>
    </div>
  );
}
