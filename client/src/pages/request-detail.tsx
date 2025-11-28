import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import {
  ArrowLeft,
  Clock,
  Globe,
  Code,
  FileJson,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Copy,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StatusBadge, SeverityBadge } from "@/components/ui/status-badge";
import { ScoreIndicator, ScoreBar, ScoreBreakdown } from "@/components/ui/score-indicator";
import { MethodBadge } from "@/components/ui/method-badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { canOperateActions } from "@/lib/authUtils";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { RequestWithAnalysis, Tenant, Override } from "@shared/schema";

export default function RequestDetail() {
  const params = useParams<{ id: string }>();
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);
  const [overrideAction, setOverrideAction] = useState<"allow" | "deny">("allow");
  const [overrideReason, setOverrideReason] = useState("");
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false);
  const [ruleName, setRuleName] = useState("");
  const [ruleCategory, setRuleCategory] = useState("custom");
  const [ruleDescription, setRuleDescription] = useState("");

  const canOperate = canOperateActions(user);

  const { data: request, isLoading } = useQuery<RequestWithAnalysis>({
    queryKey: ["/api/requests", params.id],
  });

  const { data: tenant } = useQuery<Tenant>({
    queryKey: ["/api/tenants", request?.tenantId],
    enabled: !!request?.tenantId,
  });

  const overrideMutation = useMutation({
    mutationFn: async (data: { action: string; reason: string }) => {
      await apiRequest("POST", `/api/requests/${params.id}/override`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests", params.id] });
      toast({
        title: "Override applied",
        description: `Request has been marked as ${overrideAction}.`,
      });
      setOverrideDialogOpen(false);
      setOverrideReason("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to apply override. Please try again.",
        variant: "destructive",
      });
    },
  });

  const whitelistMutation = useMutation({
    mutationFn: async (reason?: string) => {
      await apiRequest("POST", `/api/requests/${params.id}/whitelist-ip`, { reason });
    },
    onSuccess: () => {
      toast({
        title: "IP Whitelisted",
        description: `IP ${request?.clientIp} has been added to whitelist.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to whitelist IP. Please try again.",
        variant: "destructive",
      });
    },
  });

  const blacklistMutation = useMutation({
    mutationFn: async (reason?: string) => {
      await apiRequest("POST", `/api/requests/${params.id}/blacklist-ip`, { reason });
    },
    onSuccess: () => {
      toast({
        title: "IP Blacklisted",
        description: `IP ${request?.clientIp} has been added to blacklist.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to blacklist IP. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createRuleMutation = useMutation({
    mutationFn: async (data: { name: string; category: string; description: string }) => {
      await apiRequest("POST", `/api/requests/${params.id}/create-rule`, data);
    },
    onSuccess: () => {
      toast({
        title: "Rule Created",
        description: "New WAF rule has been created successfully.",
      });
      setRuleDialogOpen(false);
      setRuleName("");
      setRuleCategory("custom");
      setRuleDescription("");
      queryClient.invalidateQueries({ queryKey: ["/api/waf/rules"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create rule. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleOverride = () => {
    overrideMutation.mutate({ action: overrideAction, reason: overrideReason });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Content copied to clipboard.",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Shield className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Request not found</h2>
        <p className="text-muted-foreground mb-6">
          The request you're looking for doesn't exist or has been deleted.
        </p>
        <Button asChild>
          <Link href="/traffic">Back to Traffic</Link>
        </Button>
      </div>
    );
  }

  const analysisBreakdown = [
    { name: "IP Reputation", score: request.analysis?.ipReputationScore || 0 },
    { name: "Rate Anomaly", score: request.analysis?.rateAnomalyScore || 0 },
    { name: "Header Anomaly", score: request.analysis?.headerAnomalyScore || 0 },
    { name: "Path Anomaly", score: request.analysis?.pathAnomalyScore || 0 },
    { name: "Body Anomaly", score: request.analysis?.bodyAnomalyScore || 0 },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild data-testid="button-back">
            <Link href="/traffic">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <MethodBadge method={request.method} />
              <h1
                className="text-lg font-mono font-medium truncate max-w-md"
                data-testid="text-request-path"
              >
                {request.path}
              </h1>
            </div>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {request.timestamp
                  ? new Date(request.timestamp).toLocaleString()
                  : "Unknown"}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Globe className="h-3 w-3" />
                {tenant?.name || "Unknown Site"}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={request.actionTaken || "allow"} />
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted">
            <span className="text-sm text-muted-foreground">Score:</span>
            <ScoreIndicator score={request.analysis?.totalScore || 0} size="lg" />
          </div>
          {canOperate && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setOverrideAction("allow");
                  setOverrideDialogOpen(true);
                }}
                data-testid="button-allow"
              >
                <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                Allow
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setOverrideAction("deny");
                  setOverrideDialogOpen(true);
                }}
                data-testid="button-deny"
              >
                <XCircle className="h-4 w-4 mr-2 text-red-500" />
                Block
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
              <TabsTrigger value="request" data-testid="tab-request">Request</TabsTrigger>
              <TabsTrigger value="response" data-testid="tab-response">Response</TabsTrigger>
              <TabsTrigger value="analysis" data-testid="tab-analysis">Analysis</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Request Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm text-muted-foreground">Client IP</dt>
                      <dd className="font-mono text-sm mt-1">
                        {request.clientIpAnonymized
                          ? "***.***.***"
                          : request.clientIp}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Response Code</dt>
                      <dd className="mt-1">
                        <Badge
                          variant="outline"
                          className={
                            request.responseCode && request.responseCode >= 400
                              ? "status-blocked"
                              : "status-allowed"
                          }
                        >
                          {request.responseCode || "N/A"}
                        </Badge>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">User Agent</dt>
                      <dd className="text-sm mt-1 truncate" title={request.userAgent || undefined}>
                        {request.userAgent || "N/A"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground">Response Time</dt>
                      <dd className="text-sm mt-1">{request.responseTime || 0}ms</dd>
                    </div>
                    {request.country && (
                      <div>
                        <dt className="text-sm text-muted-foreground">Location</dt>
                        <dd className="text-sm mt-1">
                          {request.city}, {request.country}
                        </dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-sm text-muted-foreground">Content Type</dt>
                      <dd className="text-sm mt-1">{request.contentType || "N/A"}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              {request.wafHitsJson ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      WAF Rule Hits
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {(Array.isArray(request.wafHitsJson) ? request.wafHitsJson : []).map((hit: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted"
                        >
                          <div>
                            <p className="font-medium text-sm">{hit.ruleName}</p>
                            <p className="text-xs text-muted-foreground">
                              {hit.category}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <SeverityBadge severity={hit.severity || "medium"} />
                            <Badge variant="outline">+{hit.score}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : null}
            </TabsContent>

            <TabsContent value="request" className="mt-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileJson className="h-4 w-4" />
                    Request Headers
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(JSON.stringify(request.headersJson, null, 2))
                    }
                    data-testid="button-copy-headers"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <pre className="text-xs font-mono p-4 bg-muted rounded-lg overflow-auto">
                      {JSON.stringify(request.headersJson, null, 2)}
                    </pre>
                  </ScrollArea>
                </CardContent>
              </Card>

              {request.bodyPreview && (
                <Card className="mt-6">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Code className="h-4 w-4" />
                      Request Body
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(request.bodyPreview || "")}
                      data-testid="button-copy-body"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[300px]">
                      <pre className="text-xs font-mono p-4 bg-muted rounded-lg overflow-auto whitespace-pre-wrap">
                        {request.bodyPreview}
                      </pre>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="response" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileJson className="h-4 w-4" />
                    Response Headers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {request.responseHeadersJson ? (
                    <ScrollArea className="h-[400px]">
                      <pre className="text-xs font-mono p-4 bg-muted rounded-lg overflow-auto">
                        {JSON.stringify(request.responseHeadersJson, null, 2)}
                      </pre>
                    </ScrollArea>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      No response headers available.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analysis" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Score Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Total Score</span>
                      <ScoreIndicator
                        score={request.analysis?.totalScore || 0}
                        size="lg"
                        showLabel
                      />
                    </div>
                    <ScoreBar score={request.analysis?.totalScore || 0} />
                  </div>

                  <Separator className="my-6" />

                  <ScoreBreakdown breakdown={analysisBreakdown} />

                  {request.analysis?.explanationText && (
                    <>
                      <Separator className="my-6" />
                      <div>
                        <h4 className="text-sm font-medium mb-2">Explanation</h4>
                        <p className="text-sm text-muted-foreground">
                          {request.analysis.explanationText}
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                data-testid="button-whitelist-ip"
                onClick={() => whitelistMutation.mutate()}
                disabled={whitelistMutation.isPending}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {whitelistMutation.isPending ? "Whitelisting..." : "Whitelist IP"}
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                data-testid="button-blacklist-ip"
                onClick={() => blacklistMutation.mutate()}
                disabled={blacklistMutation.isPending}
              >
                <XCircle className="h-4 w-4 mr-2" />
                {blacklistMutation.isPending ? "Blacklisting..." : "Blacklist IP"}
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                data-testid="button-create-rule"
                onClick={() => setRuleDialogOpen(true)}
              >
                <Shield className="h-4 w-4 mr-2" />
                Create Rule
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Processing Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Processing Time</span>
                <span>{request.analysis?.processingTimeMs || 0}ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Suggested Action</span>
                <StatusBadge status={request.analysis?.suggestedAction || "allow"} />
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Final Action</span>
                <StatusBadge status={request.analysis?.finalAction || "allow"} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Override Dialog */}
      <Dialog open={overrideDialogOpen} onOpenChange={setOverrideDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {overrideAction === "allow" ? "Allow Request" : "Block Request"}
            </DialogTitle>
            <DialogDescription>
              This will create a manual override for this request and similar future requests.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Reason (optional)</Label>
              <Textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Why are you overriding this decision?"
                data-testid="input-override-reason"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOverrideDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleOverride}
              disabled={overrideMutation.isPending}
              variant={overrideAction === "deny" ? "destructive" : "default"}
              data-testid="button-confirm-override"
            >
              {overrideMutation.isPending
                ? "Applying..."
                : overrideAction === "allow"
                ? "Allow"
                : "Block"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Rule Dialog */}
      <Dialog open={ruleDialogOpen} onOpenChange={setRuleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create WAF Rule</DialogTitle>
            <DialogDescription>
              Create a new rule based on this request's characteristics.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rule-name">Rule Name</Label>
              <input
                id="rule-name"
                className="w-full px-3 py-2 border border-input rounded-md text-sm"
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                placeholder="e.g., Block malicious user agents"
                data-testid="input-rule-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rule-category">Category</Label>
              <select
                id="rule-category"
                className="w-full px-3 py-2 border border-input rounded-md text-sm"
                value={ruleCategory}
                onChange={(e) => setRuleCategory(e.target.value)}
                data-testid="select-rule-category"
              >
                <option value="custom">Custom</option>
                <option value="sql_injection">SQL Injection</option>
                <option value="xss">XSS</option>
                <option value="rfi">Remote File Inclusion</option>
                <option value="lfi">Local File Inclusion</option>
                <option value="protocol_violation">Protocol Violation</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rule-description">Description</Label>
              <Textarea
                id="rule-description"
                value={ruleDescription}
                onChange={(e) => setRuleDescription(e.target.value)}
                placeholder="What does this rule protect against?"
                data-testid="input-rule-description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRuleDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createRuleMutation.mutate({ name: ruleName, category: ruleCategory, description: ruleDescription })}
              disabled={createRuleMutation.isPending || !ruleName}
              data-testid="button-confirm-create-rule"
            >
              {createRuleMutation.isPending ? "Creating..." : "Create Rule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
