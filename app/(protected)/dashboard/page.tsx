"use client";

import Dashboard from "@/app/components/Dashboard/Dashboard";
import styles from "./dashboard.module.scss";

// Configuration du timeout pour les Server Actions (30 secondes)
export const maxDuration = 30;

export default function DashboardPage() {
  return (
    <div className={styles.dashboardContent}>
      <Dashboard />
    </div>
  );
}
