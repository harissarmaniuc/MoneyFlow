"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { SUB_CATEGORIES, RECURRENCE_OPTIONS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import type { SubCategory, Recurrence } from "@prisma/client";

export default function NewSubscriptionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const createSub = trpc.subscriptions.create.useMutation();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<SubCategory>("OTHER");
  const [amount, setAmount] = useState("");
  const [billingCycle, setBillingCycle] = useState<Recurrence>("MONTHLY");
  const [nextBillingAt, setNextBillingAt] = useState(new Date().toISOString().split("T")[0]);
  const [isFreeTrial, setIsFreeTrial] = useState(false);
  const [url, setUrl] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createSub.mutateAsync({ name, category, amount: parseFloat(amount), billingCycle, nextBillingAt: new Date(nextBillingAt), isFreeTrial, url: url || undefined });
      toast({ title: "Subscription added!" });
      router.push("/subscriptions");
    } catch {
      toast({ title: "Error", description: "Failed to add subscription", variant: "destructive" });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon"><Link href="/subscriptions"><ArrowLeft className="h-5 w-5" /></Link></Button>
        <h1 className="text-2xl font-bold">Add Subscription</h1>
      </div>
      <Card>
        <CardHeader><CardTitle>Subscription Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Name</Label><Input placeholder="Netflix, Spotify..." value={name} onChange={(e) => setName(e.target.value)} required /></div>
              <div className="space-y-2"><Label>Category</Label><Select value={category} onValueChange={(v) => setCategory(v as SubCategory)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{SUB_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Amount ($)</Label><Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required /></div>
              <div className="space-y-2"><Label>Billing Cycle</Label><Select value={billingCycle} onValueChange={(v) => setBillingCycle(v as Recurrence)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{RECURRENCE_OPTIONS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="space-y-2"><Label>Next Billing Date</Label><Input type="date" value={nextBillingAt} onChange={(e) => setNextBillingAt(e.target.value)} required /></div>
            <div className="space-y-2"><Label>Website URL (optional)</Label><Input type="url" placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} /></div>
            <div className="flex items-center gap-2"><Switch checked={isFreeTrial} onCheckedChange={setIsFreeTrial} /><Label>Free trial</Label></div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={createSub.isPending}>{createSub.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Add Subscription</Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
