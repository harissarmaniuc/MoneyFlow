"use client";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Shield, Globe } from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Card>
        <CardHeader><CardTitle>Profile</CardTitle><CardDescription>Your account information</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user?.image ?? ""} />
              <AvatarFallback className="text-lg">{user?.name?.charAt(0) ?? <User />}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-lg">{user?.name ?? "User"}</p>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-muted-foreground" /><span className="text-sm">{user?.email}</span></div>
            <div className="flex items-center gap-3"><Shield className="h-4 w-4 text-muted-foreground" /><Badge variant="secondary">Account Active</Badge></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Application</CardTitle><CardDescription>App preferences</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between"><div className="flex items-center gap-3"><Globe className="h-4 w-4 text-muted-foreground" /><span className="text-sm">Currency</span></div><Badge>USD</Badge></div>
          <Separator />
          <div className="flex items-center justify-between"><div className="flex items-center gap-3"><Globe className="h-4 w-4 text-muted-foreground" /><span className="text-sm">Version</span></div><Badge variant="secondary">1.0.0</Badge></div>
        </CardContent>
      </Card>
    </div>
  );
}
