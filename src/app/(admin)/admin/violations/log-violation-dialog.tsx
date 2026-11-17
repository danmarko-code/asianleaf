"use client";

import { useCallback, useState } from "react";
import { ViolationForm } from "@/app/(admin)/admin/violations/violation-form";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

type Household = {
  id: string;
  unitAddress: string;
  members: { id: string; firstName: string; lastName: string }[];
};

export function LogViolationDialog({ households }: { households: Household[] }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <Button type="button" size="sm" onClick={() => setOpen(true)}>
        Log violation
      </Button>

      {open ? (
        <Modal title="Log violation" onClose={close}>
          <ViolationForm households={households} />
        </Modal>
      ) : null}
    </>
  );
}
