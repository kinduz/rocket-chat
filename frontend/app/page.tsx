import { ROUTES } from '@app/shared/navigation';
import { redirect } from 'next/navigation';

// Корневой маршрут — middleware редиректит авторизованных на home,
// неавторизованных на signin. Этот компонент — fallback.
export default function RootPage() {
  redirect(ROUTES.signin);
}
