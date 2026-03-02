"use client";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Car, Wrench, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { MAINTENANCE_TYPES } from "@/lib/constants";
import type { MaintenanceType } from "@prisma/client";

export default function VehiclesPage() {
  const { toast } = useToast();
  const utils = trpc.useUtils();
  const { data: vehicles = [], isLoading } = trpc.vehicles.getAll.useQuery();
  const createVehicle = trpc.vehicles.create.useMutation({ onSuccess: () => utils.vehicles.getAll.invalidate() });
  const deleteVehicle = trpc.vehicles.delete.useMutation({ onSuccess: () => utils.vehicles.getAll.invalidate() });
  const addMaintenance = trpc.vehicles.addMaintenance.useMutation({ onSuccess: () => utils.vehicles.getAll.invalidate() });
  const [showVehicleForm, setShowVehicleForm] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [make, setMake] = useState(""); const [model, setModel] = useState(""); const [year, setYear] = useState(""); const [mileage, setMileage] = useState("0");
  const [mType, setMType] = useState<MaintenanceType>("OIL_CHANGE"); const [mCost, setMCost] = useState(""); const [mPerformedAt, setMPerformedAt] = useState(new Date().toISOString().split("T")[0]); const [mDesc, setMDesc] = useState("");

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    await createVehicle.mutateAsync({ make, model, year: parseInt(year), mileage: parseInt(mileage) || 0 });
    toast({ title: "Vehicle added!" }); setMake(""); setModel(""); setYear(""); setMileage("0"); setShowVehicleForm(false);
  };

  const handleAddMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) return;
    await addMaintenance.mutateAsync({ vehicleId: selectedVehicle, type: mType, cost: mCost ? parseFloat(mCost) : undefined, performedAt: new Date(mPerformedAt), description: mDesc || undefined, completed: true });
    toast({ title: "Maintenance recorded!" }); setSelectedVehicle(null); setMCost(""); setMDesc("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Vehicles</h1>
        <Button onClick={() => setShowVehicleForm(!showVehicleForm)} className="bg-emerald-600 hover:bg-emerald-700"><Plus className="mr-2 h-4 w-4" />Add Vehicle</Button>
      </div>

      {showVehicleForm && (
        <Card>
          <CardHeader><CardTitle>Add Vehicle</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleAddVehicle} className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2"><Label>Make</Label><Input value={make} onChange={(e) => setMake(e.target.value)} required /></div>
                <div className="space-y-2"><Label>Model</Label><Input value={model} onChange={(e) => setModel(e.target.value)} required /></div>
                <div className="space-y-2"><Label>Year</Label><Input type="number" value={year} onChange={(e) => setYear(e.target.value)} required /></div>
                <div className="space-y-2"><Label>Mileage</Label><Input type="number" value={mileage} onChange={(e) => setMileage(e.target.value)} /></div>
              </div>
              <div className="flex gap-2"><Button type="submit" className="bg-emerald-600 hover:bg-emerald-700" disabled={createVehicle.isPending}>Add</Button><Button type="button" variant="outline" onClick={() => setShowVehicleForm(false)}>Cancel</Button></div>
            </form>
          </CardContent>
        </Card>
      )}

      {vehicles.map((vehicle) => (
        <Card key={vehicle.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2"><Car className="h-5 w-5" />{vehicle.year} {vehicle.make} {vehicle.model}</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setSelectedVehicle(selectedVehicle === vehicle.id ? null : vehicle.id)}><Wrench className="mr-1 h-4 w-4" />Add Service</Button>
                <Button size="sm" variant="ghost" className="text-red-500" onClick={() => deleteVehicle.mutate({ id: vehicle.id })}><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{vehicle.mileage.toLocaleString()} miles</p>
          </CardHeader>
          <CardContent>
            {selectedVehicle === vehicle.id && (
              <form onSubmit={handleAddMaintenance} className="space-y-3 mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1"><Label>Type</Label><Select value={mType} onValueChange={(v) => setMType(v as MaintenanceType)}><SelectTrigger className="h-9"><SelectValue /></SelectTrigger><SelectContent>{MAINTENANCE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-1"><Label>Cost ($)</Label><Input type="number" step="0.01" value={mCost} onChange={(e) => setMCost(e.target.value)} className="h-9" /></div>
                  <div className="space-y-1"><Label>Date</Label><Input type="date" value={mPerformedAt} onChange={(e) => setMPerformedAt(e.target.value)} className="h-9" /></div>
                </div>
                <Input placeholder="Description (optional)" value={mDesc} onChange={(e) => setMDesc(e.target.value)} />
                <div className="flex gap-2"><Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700">Save</Button><Button type="button" size="sm" variant="outline" onClick={() => setSelectedVehicle(null)}>Cancel</Button></div>
              </form>
            )}
            {vehicle.records.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Maintenance History</p>
                {vehicle.records.slice(0, 5).map((record) => (
                  <div key={record.id} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                    <div>
                      <Badge variant="secondary" className="mr-2 text-xs">{record.type.replace("_", " ")}</Badge>
                      {record.description && <span className="text-muted-foreground">{record.description}</span>}
                    </div>
                    <div className="text-right">
                      {record.cost && <span className="font-medium">{formatCurrency(record.cost)}</span>}
                      {record.performedAt && <span className="text-muted-foreground ml-2 text-xs">{formatDate(record.performedAt)}</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground">No maintenance records yet</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
