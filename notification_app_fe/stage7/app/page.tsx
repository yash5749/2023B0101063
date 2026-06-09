import { NotificationsPage } from "./components/notifications-page";

export default function HomePage() {
  return (
    <NotificationsPage
      title="All notifications"
      subtitle="Browse every notification and quickly see which items are new."
      mode="all"
    />
  );
}
