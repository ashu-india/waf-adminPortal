import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Globe, Shield, Lock, Settings } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Tenant } from "@shared/schema";

const tenantFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  domain: z.string().min(1, "Domain is required").max(255),
  upstreamUrl: z.string().url("Must be a valid URL").max(500),
  sslEnabled: z.boolean().default(false),
  sslCertPath: z.string().optional(),
  sslKeyPath: z.string().optional(),
  isActive: z.boolean().default(true),
  retentionDays: z.number().int().min(1).max(365).default(30),
  anonymizeIpAfterDays: z.number().int().min(1).max(365).default(7),
  scrubCookies: z.boolean().default(true),
  scrubAuthHeaders: z.boolean().default(true),
  enforcementMode: z.enum(["monitor", "block"]).default("monitor"),
  blockThreshold: z.number().min(0).max(100).default(70),
  challengeThreshold: z.number().min(0).max(100).default(50),
  monitorThreshold: z.number().min(0).max(100).default(30),
});

type TenantFormValues = z.infer<typeof tenantFormSchema>;

export default function TenantForm() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const isEditing = !!params.id;

  const { data: tenant, isLoading } = useQuery<Tenant>({
    queryKey: ["/api/tenants", params.id],
    enabled: isEditing,
  });

  const { data: policy } = useQuery<any>({
    queryKey: ["/api/tenants", params.id, "policy"],
    enabled: isEditing,
  });

  const form = useForm<TenantFormValues>({
    resolver: zodResolver(tenantFormSchema),
    defaultValues: {
      name: "",
      domain: "",
      upstreamUrl: "",
      sslEnabled: false,
      sslCertPath: "",
      sslKeyPath: "",
      isActive: true,
      retentionDays: 30,
      anonymizeIpAfterDays: 7,
      scrubCookies: true,
      scrubAuthHeaders: true,
      enforcementMode: "monitor",
      blockThreshold: 70,
      challengeThreshold: 50,
      monitorThreshold: 30,
    },
  });

  useEffect(() => {
    if (tenant && policy) {
      form.reset({
        name: tenant.name,
        domain: tenant.domain,
        upstreamUrl: tenant.upstreamUrl,
        sslEnabled: tenant.sslEnabled || false,
        sslCertPath: tenant.sslCertPath || "",
        sslKeyPath: tenant.sslKeyPath || "",
        isActive: tenant.isActive || true,
        retentionDays: tenant.retentionDays || 30,
        anonymizeIpAfterDays: tenant.anonymizeIpAfterDays || 7,
        scrubCookies: tenant.scrubCookies ?? true,
        scrubAuthHeaders: tenant.scrubAuthHeaders ?? true,
        enforcementMode: policy.enforcementMode || "monitor",
        blockThreshold: policy.blockThreshold || 70,
        challengeThreshold: policy.challengeThreshold || 50,
        monitorThreshold: policy.monitorThreshold || 30,
      });
    }
  }, [tenant, policy, form]);

  const createMutation = useMutation({
    mutationFn: async (data: TenantFormValues) => {
      const response = await apiRequest("POST", "/api/tenants", data);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenants"] });
      toast({
        title: "Site created",
        description: "Your new site has been added to WAF protection.",
      });
      navigate("/tenants");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create site. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: TenantFormValues) => {
      await apiRequest("PATCH", `/api/tenants/${params.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tenants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tenants", params.id] });
      toast({
        title: "Site updated",
        description: "Your changes have been saved.",
      });
      navigate("/tenants");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update site. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TenantFormValues) => {
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  if (isEditing && isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild data-testid="button-back">
          <Link href="/tenants">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">
            {isEditing ? "Edit Site" : "Add New Site"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isEditing
              ? "Update your site configuration and WAF settings"
              : "Configure a new website for WAF protection"}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Basic Information
              </CardTitle>
              <CardDescription>
                Enter the basic details of the website you want to protect.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Site Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="My Website"
                        {...field}
                        data-testid="input-name"
                      />
                    </FormControl>
                    <FormDescription>
                      A friendly name to identify this site.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="domain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Domain</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="example.com"
                        {...field}
                        data-testid="input-domain"
                      />
                    </FormControl>
                    <FormDescription>
                      The domain name of your website (without https://).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="upstreamUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Upstream URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://origin.example.com"
                        {...field}
                        data-testid="input-upstream"
                      />
                    </FormControl>
                    <FormDescription>
                      The origin server URL where requests will be forwarded.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active</FormLabel>
                      <FormDescription>
                        Enable WAF protection for this site.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-active"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* SSL Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lock className="h-5 w-5" />
                SSL Configuration
              </CardTitle>
              <CardDescription>
                Configure SSL/TLS settings for secure connections.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="sslEnabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Enable SSL</FormLabel>
                      <FormDescription>
                        Use HTTPS for connections to the origin.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-ssl"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch("sslEnabled") && (
                <>
                  <FormField
                    control={form.control}
                    name="sslCertPath"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SSL Certificate Path</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="/path/to/cert.pem"
                            {...field}
                            data-testid="input-ssl-cert"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sslKeyPath"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SSL Key Path</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="/path/to/key.pem"
                            {...field}
                            data-testid="input-ssl-key"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </CardContent>
          </Card>

          {/* WAF Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5" />
                WAF Settings
              </CardTitle>
              <CardDescription>
                Configure enforcement mode and blocking thresholds.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="enforcementMode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Enforcement Mode</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-enforcement">
                          <SelectValue placeholder="Select mode" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="monitor">Monitor Only</SelectItem>
                        <SelectItem value="block">Block Threats</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Monitor mode logs threats without blocking. Block mode actively blocks malicious requests.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="monitorThreshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monitor Threshold ({field.value})</FormLabel>
                    <FormControl>
                      <Input
                        type="range"
                        min={0}
                        max={100}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        className="accent-primary"
                        data-testid="input-monitor-threshold"
                      />
                    </FormControl>
                    <FormDescription>
                      Requests with a threat score above this will be monitored.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="challengeThreshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Challenge Threshold ({field.value})</FormLabel>
                    <FormControl>
                      <Input
                        type="range"
                        min={0}
                        max={100}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        className="accent-primary"
                        data-testid="input-challenge-threshold"
                      />
                    </FormControl>
                    <FormDescription>
                      Requests with a threat score above this will trigger a challenge.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="blockThreshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Block Threshold ({field.value})</FormLabel>
                    <FormControl>
                      <Input
                        type="range"
                        min={0}
                        max={100}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        className="accent-primary"
                        data-testid="input-block-threshold"
                      />
                    </FormControl>
                    <FormDescription>
                      Requests with a threat score above this threshold will be blocked.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Privacy & Retention
              </CardTitle>
              <CardDescription>
                Configure data retention and privacy settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="retentionDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Retention (days)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={365}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        data-testid="input-retention"
                      />
                    </FormControl>
                    <FormDescription>
                      How long to keep request logs and analysis data.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="anonymizeIpAfterDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Anonymize IPs after (days)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={365}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        data-testid="input-anonymize"
                      />
                    </FormControl>
                    <FormDescription>
                      Client IP addresses will be anonymized after this period.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scrubCookies"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Scrub Cookies</FormLabel>
                      <FormDescription>
                        Remove cookie values from logged request headers.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-scrub-cookies"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="scrubAuthHeaders"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Scrub Authorization Headers</FormLabel>
                      <FormDescription>
                        Remove authorization tokens from logged request headers.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-scrub-auth"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" asChild data-testid="button-cancel">
              <Link href="/tenants">Cancel</Link>
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              data-testid="button-submit"
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Saving..."
                : isEditing
                ? "Save Changes"
                : "Create Site"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
