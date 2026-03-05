"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate, calculateMonthlyAmount } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, XCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function SubscriptionsPage() {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const { data: subscriptions = [], isLoading } = trpc.subscriptions.getAll.useQuery();
  const cancelSub = trpc.subscriptions.cancel.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.subscriptions.getAll.invalidate(),
        utils.subscriptions.getActive.invalidate(),
      ]);
    },
  });

  const active = subscriptions.filter((s) => s.active);
  const totalMonthly = active.reduce((sum, s) => sum + calculateMonthlyAmount(s.amount, s.billingCycle), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Subscriptions</h1>
          <p className="text-muted-foreground">{active.length} active · {formatCurrency(totalMonthly)}/mo</p>
        </div>
        <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
          <Link href="/subscriptions/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Subscription
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : subscriptions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No subscriptions tracked yet.</p>
            <Button asChild className="mt-4 bg-emerald-600 hover:bg-emerald-700">
              <Link href="/subscriptions/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Subscription
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {subscriptions.map((sub) => (
            <Card key={sub.id} className={!sub.active ? "opacity-60" : ""}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{sub.name}</p>
                      <Badge variant="secondary">{sub.category}</Badge>
                      {!sub.active && <Badge variant="outline">Cancelled</Badge>}
                      {sub.isFreeTrial && <Badge className="bg-amber-100 text-amber-800 border-0">Free Trial</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Next billing: {formatDate(sub.nextBillingAt)} · {sub.billingCycle}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(sub.amount)}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(calculateMonthlyAmount(sub.amount, sub.billingCycle))}/mo
                      </p>
                    </div>
                    {sub.active && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-700"
                        onClick={async () => {
                          await cancelSub.mutateAsync({ id: sub.id });
                          toast({ title: `${sub.name} cancelled` });
                        }}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
