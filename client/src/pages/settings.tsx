import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Settings as SettingsIcon,
  Bell,
  Shield,
  Database,
  Globe,
  Webhook,
  Save,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { canManagePolicies } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";

export default function Settings() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("general");
  const canManage = canManagePolicies(user);

  const [settings, setSettings] = useState({
    defaultEnforcementMode: "monitor",
    defaultBlockThreshold: 70,
    defaultRetentionDays: 30,
    anonymizeIpAfterDays: 7,
    alertThreshold: "high",
    enforceHttps: true,
    blockBadIps: true,
    rateLimiting: true,
    enableWebhooks: false,
    webhookUrl: "",
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PUT", "/api/settings", settings);
    },
    onSuccess: () => {
      toast({
        title: "Settings saved",
        description: "Your settings have been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">
            Settings
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Configure global WAF settings and preferences
          </p>
        </div>
        {canManage && (
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            data-testid="button-save-settings"
          >
            <Save className="h-4 w-4 mr-2" />
            {saveMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general" data-testid="tab-general">
            <SettingsIcon className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="security" data-testid="tab-security">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications" data-testid="tab-notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="integrations" data-testid="tab-integrations">
            <Webhook className="h-4 w-4 mr-2" />
            Integrations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Default Settings</CardTitle>
              <CardDescription>
                These settings will apply to new tenants by default.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Default Enforcement Mode</Label>
                <Select
                  value={settings.defaultEnforcementMode}
                  onValueChange={(v) =>
                    setSettings({ ...settings, defaultEnforcementMode: v })
                  }
                  disabled={!canManage}
                >
                  <SelectTrigger data-testid="select-enforcement">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monitor">Monitor Only</SelectItem>
                    <SelectItem value="block">Block Threats</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  New sites will start with this enforcement mode.
                </p>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Default Block Threshold</Label>
                  <span className="text-sm text-muted-foreground">
                    {settings.defaultBlockThreshold}
                  </span>
                </div>
                <Slider
                  value={[settings.defaultBlockThreshold]}
                  onValueChange={([v]) =>
                    setSettings({ ...settings, defaultBlockThreshold: v })
                  }
                  min={0}
                  max={100}
                  disabled={!canManage}
                  data-testid="slider-threshold"
                />
                <p className="text-xs text-muted-foreground">
                  Requests with scores above this will be blocked.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data & Privacy
              </CardTitle>
              <CardDescription>
                Configure data retention and privacy settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Default Retention (days)</Label>
                  <Input
                    type="number"
                    value={settings.defaultRetentionDays}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        defaultRetentionDays: parseInt(e.target.value),
                      })
                    }
                    min={1}
                    max={365}
                    disabled={!canManage}
                    data-testid="input-retention"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Anonymize IPs After (days)</Label>
                  <Input
                    type="number"
                    value={settings.anonymizeIpAfterDays}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        anonymizeIpAfterDays: parseInt(e.target.value),
                      })
                    }
                    min={1}
                    max={365}
                    disabled={!canManage}
                    data-testid="input-anonymize"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Security Policies</CardTitle>
              <CardDescription>
                Global security settings and recommendations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">Enforce HTTPS</p>
                    <p className="text-sm text-muted-foreground">
                      Require all connections to use HTTPS.
                    </p>
                  </div>
                  <Switch 
                    checked={settings.enforceHttps}
                    onCheckedChange={(v) =>
                      setSettings({ ...settings, enforceHttps: v })
                    }
                    disabled={!canManage}
                    data-testid="switch-https"
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">Block Known Bad IPs</p>
                    <p className="text-sm text-muted-foreground">
                      Automatically block IPs from threat intelligence feeds.
                    </p>
                  </div>
                  <Switch 
                    checked={settings.blockBadIps}
                    onCheckedChange={(v) =>
                      setSettings({ ...settings, blockBadIps: v })
                    }
                    disabled={!canManage}
                    data-testid="switch-block-ips"
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">Rate Limiting</p>
                    <p className="text-sm text-muted-foreground">
                      Enable global rate limiting for all tenants.
                    </p>
                  </div>
                  <Switch 
                    checked={settings.rateLimiting}
                    onCheckedChange={(v) =>
                      setSettings({ ...settings, rateLimiting: v })
                    }
                    disabled={!canManage}
                    data-testid="switch-rate-limit"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Alert Settings</CardTitle>
              <CardDescription>
                Configure alert severity thresholds.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Alert Threshold</Label>
                <Select
                  value={settings.alertThreshold}
                  onValueChange={(v) =>
                    setSettings({ ...settings, alertThreshold: v })
                  }
                  disabled={!canManage}
                >
                  <SelectTrigger data-testid="select-alert-threshold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical Only</SelectItem>
                    <SelectItem value="high">High & Critical</SelectItem>
                    <SelectItem value="medium">Medium & Above</SelectItem>
                    <SelectItem value="low">All Alerts</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Only alerts at or above this severity will be triggered and logged.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Webhooks</CardTitle>
              <CardDescription>
                Send real-time events to external services.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <p className="font-medium">Enable Webhooks</p>
                  <p className="text-sm text-muted-foreground">
                    Forward security events to external endpoints.
                  </p>
                </div>
                <Switch
                  checked={settings.enableWebhooks}
                  onCheckedChange={(v) =>
                    setSettings({ ...settings, enableWebhooks: v })
                  }
                  disabled={!canManage}
                  data-testid="switch-webhooks"
                />
              </div>

              {settings.enableWebhooks && (
                <div className="space-y-2">
                  <Label>Webhook URL</Label>
                  <Input
                    value={settings.webhookUrl}
                    onChange={(e) =>
                      setSettings({ ...settings, webhookUrl: e.target.value })
                    }
                    placeholder="https://your-service.com/webhook"
                    disabled={!canManage}
                    data-testid="input-webhook-url"
                  />
                  <p className="text-xs text-muted-foreground">
                    Events will be sent as POST requests with JSON payload.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">API Access</CardTitle>
              <CardDescription>
                Manage API keys for programmatic access.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Globe className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  API access configuration coming soon.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
