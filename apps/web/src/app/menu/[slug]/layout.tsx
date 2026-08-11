import { MenuGeolocationPrompt } from '@/components/menu/MenuGeolocationPrompt';

export default function MenuSlugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <MenuGeolocationPrompt />
      {children}
    </>
  );
}
