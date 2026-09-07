import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  DataTable,
  ErrorState,
  LoadingBlock,
  PageScaffold,
  Pagination,
  PrimaryButton,
  StatusPill,
  Toolbar,
} from "@/components/ui-kit/PageKit";
import { apiMessage } from "@/services/apiClient";
import { investigationApi } from "@/services/investigationApi";

export const Route = createFileRoute("/admin/investigators")({ component: Page });

function Page() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const users = useQuery({
    queryKey: ["admin-investigators", search, page],
    queryFn: () =>
      investigationApi.adminListUsers({
        role: "investigator",
        q: search || undefined,
        page,
        page_size: 8,
      }),
  });

  return (
    <PageScaffold
      crumbs={[{ label: "Admin", to: "/admin/dashboard" }, { label: "Investigators" }]}
      title="Investigators"
      subtitle="Field investigation staff"
      actions={
        <Link to={"/admin/users/create" as "/"}>
          <PrimaryButton>Create</PrimaryButton>
        </Link>
      }
    >
      <Toolbar
        search={search}
        onSearch={(v) => {
          setSearch(v);
          setPage(1);
        }}
      />
      {users.isLoading && <LoadingBlock />}
      {users.isError && <ErrorState message={apiMessage(users.error)} />}
      {!users.isLoading && !users.isError && (
        <>
          <DataTable
            rows={users.data?.items || []}
            columns={[
              { key: "n", header: "Name", render: (r) => r.full_name },
              { key: "e", header: "Email", render: (r) => r.email },
              { key: "d", header: "Department", render: (r) => r.department || "—" },
              {
                key: "s",
                header: "Status",
                render: (r) => <StatusPill value={r.is_active ? "Active" : "Suspended"} />,
              },
            ]}
          />
          <Pagination
            page={users.data?.page || 1}
            pages={users.data?.pages || 1}
            onPage={setPage}
          />
        </>
      )}
    </PageScaffold>
  );
}
