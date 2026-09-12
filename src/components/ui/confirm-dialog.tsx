'use client';
import * as Alert from '@radix-ui/react-alert-dialog';
import { Button } from './button';
export function ConfirmDialog({
  open,
  title,
  description,
  busy,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Alert.Root
      open={open}
      onOpenChange={(v) => {
        if (!v && !busy) onCancel();
      }}
    >
      <Alert.Portal>
        <Alert.Overlay className="fixed inset-0 z-50 bg-slate-950/40" />
        <Alert.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-xl">
          <Alert.Title className="text-lg font-semibold">{title}</Alert.Title>
          <Alert.Description className="my-4 text-sm text-slate-500">
            {description}
          </Alert.Description>
          <div className="flex justify-end gap-2">
            <Alert.Cancel asChild>
              <Button variant="outline" disabled={busy}>
                Cancel
              </Button>
            </Alert.Cancel>
            <Button disabled={busy} onClick={onConfirm}>
              {busy ? 'Saving…' : 'Confirm'}
            </Button>
          </div>
        </Alert.Content>
      </Alert.Portal>
    </Alert.Root>
  );
}
