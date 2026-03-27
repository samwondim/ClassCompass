"use client"

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Manager } from "@/app/models/models";

export const ManagerActions = ({ manager, t }: { manager: Manager; t: (key: string) => string }) => {
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "am";
  const editHref = `/${locale}/admin/managers/${manager.user_id}/edit`;

  const deleteUser = async () => {
    const ok = confirm(t('Pages.Managers.DeleteConfirm'));
    if (!ok) return;

    const res = await fetch(`/api/user/${manager.user_id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      window.location.reload();
    } else {
      alert(t('Delete.Failed'));
    }
  };

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={editHref}>{t('Common.Edit')}</Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button variant="ghost" className="h-8 px-2 text-destructive" onClick={deleteUser}>
        {t('Common.Delete')}
      </Button>
    </div>
  );
};
