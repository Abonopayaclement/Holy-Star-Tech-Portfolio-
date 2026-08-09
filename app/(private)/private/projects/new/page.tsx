"use client";

import { AdminLayout } from "@/components/private/AdminLayout";
import { ProjectForm } from "@/components/private/ProjectForm";

export default function PrivateNewProjectPage() {
  return (
    <AdminLayout title="Create Project">
      <ProjectForm />
    </AdminLayout>
  );
}
