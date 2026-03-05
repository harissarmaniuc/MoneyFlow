"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Plus, Gift } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function GiftsPage() {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const { data: contacts = [] } = trpc.contacts.getAll.useQuery();
  const createGift = trpc.gifts.create.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.contacts.getAll.invalidate(),
        utils.contacts.getUpcoming.invalidate({ days: 30 }),
      ]);
    },
  });
  const markPurchased = trpc.gifts.markPurchased.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.contacts.getAll.invalidate(),
        utils.contacts.getUpcoming.invalidate({ days: 30 }),
      ]);
    },
  });

  const [contactId, setContactId] = useState("");
  const [giftName, setGiftName] = useState("");
  const [budget, setBudget] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactId) return;
    try {
      await createGift.mutateAsync({
        contactId,
        name: giftName,
        budget: budget ? parseFloat(budget) : undefined,
        year: parseInt(year),
        purchased: false,
      });
      toast({ title: "Gift added" });
      setGiftName("");
      setBudget("");
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/birthdays">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Gift Tracker</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Gift Idea</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contact</Label>
                <Select value={contactId} onValueChange={setContactId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select person" />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Gift Name</Label>
                <Input value={giftName} onChange={(e) => setGiftName(e.target.value)} placeholder="Book, gadget..." required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Budget ($)</Label>
                <Input type="number" step="0.01" value={budget} onChange={(e) => setBudget(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Year</Label>
                <Input type="number" value={year} onChange={(e) => setYear(e.target.value)} />
              </div>
            </div>
            <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={createGift.isPending || !contactId}>
              <Plus className="mr-2 h-4 w-4" />
              Add Gift
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {contacts.filter((c) => c.gifts.length > 0).map((contact) => (
          <Card key={contact.id}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Gift className="h-4 w-4" />
                {contact.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {contact.gifts.map((gift) => (
                  <div key={gift.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                    <Checkbox checked={gift.purchased} onCheckedChange={() => !gift.purchased && markPurchased.mutate({ id: gift.id })} />
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${gift.purchased ? "line-through text-muted-foreground" : ""}`}>
                        {gift.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {gift.year}
                        {gift.budget ? ` · Budget: ${formatCurrency(gift.budget)}` : ""}
                      </p>
                    </div>
                    <Badge variant={gift.purchased ? "secondary" : "outline"}>
                      {gift.purchased ? "Purchased" : "Planned"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
