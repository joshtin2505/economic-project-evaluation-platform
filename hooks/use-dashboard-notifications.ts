import {
  buildNotifications,
  ProjectRecord,
} from "@/lib/services/project-analytics";
import { fetchProjects } from "@/lib/services/projects";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function useDashboardNotifications() {
  const pathname = usePathname();
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const projects = (await fetchProjects()) as ProjectRecord[];
        setNotificationCount(buildNotifications(projects).length);
      } catch {
        setNotificationCount(0);
      }
    };

    void loadNotifications();
  }, [pathname]);
  return { notificationCount };
}
