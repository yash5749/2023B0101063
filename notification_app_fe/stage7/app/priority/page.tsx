import { NotificationsPage } from "../components/notifications-page";

export default function PriorityPage() {
  return (
    <NotificationsPage
      title="Priority notifications"
      subtitle="Limit the feed and filter by notification type for a focused view."
      mode="priority"
    />
  );
}
