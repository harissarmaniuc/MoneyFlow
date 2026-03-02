"use client";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Cake, Trash2, Gift } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";

export default function BirthdaysPage() {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const { data: contacts = [], isLoading } = trpc.contacts.getAll.useQuery();
  const { data: upcoming = [] } = trpc.contacts.getUpcoming.useQuery({ days: 30 });
  const createContact = trpc.contacts.create.useMutation({ onSuccess: () => utils.contacts.getAll.invalidate() });
  const deleteContact = trpc.contacts.delete.useMutation({ onSuccess: () => utils.contacts.getAll.invalidate() });
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [birthday, setBirthday] = useState("");
  const [relationship, setRelationship] = useState("");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createContact.mutateAsync({ name, birthday: new Date(birthday), relationship: relationship || undefined });
      toast({ title: "Contact added!" });
      setName(""); setBirthday(""); setRelationship(""); setShowForm(false);
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Birthdays</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link href="/birthdays/gifts"><Gift className="mr-2 h-4 w-4" />Gift Tracker</Link></Button>
          <Button onClick={() => setShowForm(!showForm)} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="mr-2 h-4 w-4" />Add Contact</Button>
        </div>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Add Contact</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
                <div className="space-y-2"><Label>Birthday</Label><Input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} required /></div>
                <div className="space-y-2"><Label>Relationship</Label><Input placeholder="Friend, Family..." value={relationship} onChange={(e) => setRelationship(e.target.value)} /></div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={createContact.isPending}>Add</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {upcoming.length > 0 && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardHeader><CardTitle className="text-emerald-800 flex items-center gap-2"><Cake className="h-5 w-5" />Upcoming (30 days)</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {upcoming.map((c) => {
                const bday = new Date(c.birthday);
                const thisYear = new Date(new Date().getFullYear(), bday.getMonth(), bday.getDate());
                const diff = Math.ceil((thisYear.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={c.id} className="flex items-center justify-between">
                    <div><p className="font-medium">{c.name}</p><p className="text-sm text-emerald-700">{thisYear.toLocaleDateString("en-US", { month: "long", day: "numeric" })}</p></div>
                    <Badge className="bg-emerald-600">{diff === 0 ? "Today! 🎉" : `${diff} days`}</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : (
        <div className="grid gap-3">
          {contacts.map((contact) => {
            const bday = new Date(contact.birthday);
            return (
              <Card key={contact.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold">{contact.name.charAt(0)}</div>
                      <div>
                        <p className="font-medium">{contact.name}</p>
                        <p className="text-sm text-muted-foreground">{bday.toLocaleDateString("en-US", { month: "long", day: "numeric" })}{contact.relationship ? ` · ${contact.relationship}` : ""}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => deleteContact.mutate({ id: contact.id })}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
