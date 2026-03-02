"use client";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Bell } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { REMINDER_CATEGORIES } from "@/lib/constants";
import type { ReminderCategory } from "@prisma/client";

export default function RemindersPage() {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const { data: reminders = [], isLoading } = trpc.reminders.getAll.useQuery();
  const createReminder = trpc.reminders.create.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.reminders.getAll.invalidate(),
        utils.reminders.getUpcoming.invalidate({ days: 7 }),
      ]);
    },
  });
  const completeReminder = trpc.reminders.complete.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.reminders.getAll.invalidate(),
        utils.reminders.getUpcoming.invalidate({ days: 7 }),
      ]);
    },
  });
  const deleteReminder = trpc.reminders.delete.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.reminders.getAll.invalidate(),
        utils.reminders.getUpcoming.invalidate({ days: 7 }),
      ]);
    },
  });
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ReminderCategory>("CUSTOM");
  const [dueAt, setDueAt] = useState(new Date().toISOString().split("T")[0]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createReminder.mutateAsync({ title, description: description || undefined, category, dueAt: new Date(dueAt) });
      toast({ title: "Reminder added!" });
      setTitle(""); setDescription(""); setShowForm(false);
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const pending = reminders.filter((r) => !r.completed);
  const completed = reminders.filter((r) => r.completed);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Reminders</h1>
        <Button onClick={() => setShowForm(!showForm)} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="mr-2 h-4 w-4" />Add Reminder</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>New Reminder</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} required /></div>
                <div className="space-y-2"><Label>Category</Label><Select value={category} onValueChange={(v) => setCategory(v as ReminderCategory)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{REMINDER_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent></Select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Description</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} /></div>
                <div className="space-y-2"><Label>Due Date</Label><Input type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} required /></div>
              </div>
              <div className="flex gap-2"><Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={createReminder.isPending}>Add</Button><Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button></div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        <h2 className="font-semibold text-lg flex items-center gap-2"><Bell className="h-5 w-5" />Pending ({pending.length})</h2>
        {pending.length === 0 && <p className="text-muted-foreground text-sm">No pending reminders</p>}
        {pending.map((reminder) => {
          const isOverdue = new Date(reminder.dueAt) < new Date();
          return (
            <Card key={reminder.id} className={isOverdue ? "border-red-200" : ""}>
              <CardContent className="py-3">
                <div className="flex items-center gap-3">
                  <Checkbox checked={false} onCheckedChange={() => completeReminder.mutate({ id: reminder.id })} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2"><p className="font-medium">{reminder.title}</p><Badge variant="secondary" className="text-xs">{reminder.category}</Badge>{isOverdue && <Badge variant="destructive" className="text-xs">Overdue</Badge>}</div>
                    {reminder.description && <p className="text-sm text-muted-foreground">{reminder.description}</p>}
                    <p className="text-xs text-muted-foreground">{formatDate(reminder.dueAt)}</p>
                  </div>
                  <Button size="sm" variant="ghost" className="text-red-500" onClick={() => deleteReminder.mutate({ id: reminder.id })}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {completed.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-muted-foreground">Completed ({completed.length})</h2>
          {completed.slice(0, 5).map((reminder) => (
            <Card key={reminder.id} className="opacity-60">
              <CardContent className="py-3">
                <div className="flex items-center gap-3">
                  <Checkbox checked={true} disabled />
                  <div className="flex-1"><p className="text-sm line-through text-muted-foreground">{reminder.title}</p></div>
                  <Button size="sm" variant="ghost" className="text-red-500" onClick={() => deleteReminder.mutate({ id: reminder.id })}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
