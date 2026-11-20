"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { NewMemberForm } from "@/app/(admin)/admin/members/new/new-member-form";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

export function AddMemberDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <Button type="button" size="sm" onClick={() => setOpen(true)}>
        Add member
      </Button>

      {open ? (
        <Modal title="Add member" onClose={close}>
          <NewMemberForm
            inline
            onCancel={close}
            onCreated={(username) => {
              close();
              router.replace(
                `/admin/members?notice=${encodeURIComponent(
                  `Member added. The portal login username is ${username}.`,
                )}`,
              );
            }}
          />
        </Modal>
      ) : null}
    </>
  );
}
