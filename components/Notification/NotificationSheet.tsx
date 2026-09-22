'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useNotificationStore } from '@/stores/useNotification';
import { trpc } from '@/lib/trpc/client';
import { Check, X, BellRing, Building2, User, Inbox } from 'lucide-react';

interface NotificationInterface {
  email: string;
  id: string;
  organizationId: string;
  role: string;
  createdAt: string;
  expiresAt: string;
  status: string;
  token: string;
  invitedById: string;
  organization: {
    name: string;
    description: string | null;
    id: string;
    slug: string;
  };
  invitedBy: {
    name: string;
    email: string;
    id: string;
  };
}

export const NotificationSheet = () => {
  const { isOpen, setIsOpen } = useNotificationStore();
  // const utils = trpc.useContext();
  const { data: user } = trpc.auth.me.useQuery();

  const { data: notifications, isLoading } =
    trpc.organization.getMyPendingInvitations.useQuery(undefined, {
      enabled: !!user,
    });

  if (!isOpen) return null;

  const hasNotifications = notifications && notifications.length > 0;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="flex flex-col w-full sm:max-w-md bg-white/50">
        <SheetHeader className="pb-4 border-b border-neutral-200">
          <SheetTitle className="flex items-center gap-2 text-xl">
            <BellRing className="w-5 h-5 text-primary" />
            Notifications
          </SheetTitle>
          <SheetDescription>
            {isLoading
              ? 'Checking for new invitations...'
              : `You have ${notifications?.length || 0} pending invitation${notifications?.length === 1 ? '' : 's'}.`}
          </SheetDescription>
        </SheetHeader>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto space-y-4   custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-40 space-y-3 text-neutral-400">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm">Loading invitations...</p>
            </div>
          ) : !hasNotifications ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400">
                <Inbox className="w-8 h-8" />
              </div>
              <div>
                <p className="text-neutral-900 font-medium">All caught up!</p>
                <p className="text-sm text-neutral-500">
                  You don't have any pending invitations.
                </p>
              </div>
            </div>
          ) : (
            notifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
              />
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

const NotificationCard = ({
  notification,
}: {
  notification: NotificationInterface;
}) => {
  const utils = trpc.useContext();
  const acceptInvite = trpc.organization.acceptPendingInvitation.useMutation({
    onSuccess: () => {
      utils.organization.getMyPendingInvitations.invalidate();
    },
  });

  const rejectInvite = trpc.organization.declinePendingInvitation.useMutation({
    onSuccess: () => {
      utils.organization.getMyPendingInvitations.invalidate();
    },
  });

  return (
    <div className="group relative  flex flex-col gap-4 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-neutral-300">
      {/* Header Info */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <h4 className="text-sm font-semibold text-neutral-900">
              {notification.organization.name}
            </h4>
            <p className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
              <User className="h-3 w-3" />
              Invited by {notification.invitedBy.name}
            </p>
          </div>
        </div>
        <RoleBadge role={notification.role} />
      </div>

      {/* Message Body */}
      <div className="text-sm text-neutral-600">
        You have been invited to join{' '}
        <span className="font-medium text-neutral-900">
          {notification.organization.name}
        </span>{' '}
        as a {notification.role.toLowerCase()}.
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2 justify-end">
        <Button
          variant="outline"
          size="sm"
          className="bg-white cursor-pointer hover:bg-neutral-50 border-neutral-200 text-neutral-700"
          onClick={() => {
            rejectInvite.mutateAsync({ id: notification.id });
          }}
        >
          <X className="w-4 h-4 mr-1.5 opacity-70" />
          Decline
        </Button>
        <Button
          variant="default"
          size="sm"
          className="bg-green-700 cursor-pointer hover:bg-green-600 text-white shadow-sm"
          onClick={() => {
            acceptInvite.mutateAsync({ id: notification.id });
          }}
        >
          <Check className="w-4 h-4 mr-1.5" />
          Accept
        </Button>
      </div>
    </div>
  );
};

const RoleBadge = ({ role }: { role: string }) => {
  return (
    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20 uppercase tracking-wider">
      {role}
    </span>
  );
};
