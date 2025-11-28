import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, AlertCircle, Lock, Zap, CheckCircle, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.message || "Invalid credentials or user not found");
        setLoading(false);
        return;
      }

      const data = await response.json();
      if (data) {
        // Immediately set user in cache so Router sees the user
        queryClient.setQueryData(["/api/auth/user"], data);
        
        toast({
          title: "Welcome back!",
          description: "Redirecting to dashboard...",
        });
        
        // Redirect to dashboard
        navigate("/");
      }
    } catch (err) {
      setError("An error occurred during login");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col items-center justify-center px-4 py-12">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-40 left-10 w-96 h-96 bg-chart-2/5 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Header Logo */}
        <div className="mb-10 text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
                <Shield className="h-9 w-9 text-primary-foreground" />
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            WAF Admin
          </h1>
          <p className="text-muted-foreground text-sm mt-2 font-medium">Enterprise Security Dashboard</p>
        </div>

        {/* Main Card */}
        <Card className="shadow-2xl border-0 backdrop-blur-sm bg-card/95">
          <CardHeader className="space-y-3 pb-4">
            <CardTitle className="text-2xl">Sign In</CardTitle>
            <CardDescription className="text-base">
              Enter your email to access the WAF admin dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-start gap-3 p-4 bg-destructive/10 text-destructive rounded-lg text-sm border border-destructive/20 animate-in fade-in">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">Authentication Failed</p>
                    <p className="text-destructive/80 mt-1">{error}</p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Email Address</label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    type="email"
                    placeholder="admin@waf.local"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    data-testid="input-email"
                    required
                    className="pl-10 h-11 border-2 border-border focus:border-primary transition-all placeholder:text-muted-foreground/50"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-200 relative overflow-hidden group"
                disabled={loading}
                data-testid="button-submit"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                    Signing in...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Sign In
                  </div>
                )}
              </Button>
            </form>

            {/* Demo Info Card */}
            <div className="mt-6 p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20 space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <p className="font-semibold text-sm">Demo Credentials</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between p-2.5 bg-card/50 rounded border border-border">
                  <span className="text-muted-foreground">Email:</span>
                  <code className="font-mono font-medium text-foreground">admin@waf.local</code>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Email-only authentication for demo purposes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features Info */}
        <div className="mt-8 grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-lg bg-card/50 border border-border hover:bg-card/80 transition-colors">
            <Shield className="h-5 w-5 text-primary mx-auto mb-2" />
            <p className="text-xs font-medium">Real-time</p>
            <p className="text-xs text-muted-foreground">Protection</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-card/50 border border-border hover:bg-card/80 transition-colors">
            <Zap className="h-5 w-5 text-chart-2 mx-auto mb-2" />
            <p className="text-xs font-medium">Instant</p>
            <p className="text-xs text-muted-foreground">Enforcement</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-card/50 border border-border hover:bg-card/80 transition-colors">
            <Lock className="h-5 w-5 text-chart-4 mx-auto mb-2" />
            <p className="text-xs font-medium">Enterprise</p>
            <p className="text-xs text-muted-foreground">Grade</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center space-y-2">
          <Button asChild variant="ghost" className="w-full" data-testid="button-back-landing">
            <Link href="/" className="gap-2">
              <Home className="h-4 w-4" />
              Back to Landing
            </Link>
          </Button>
          <p className="text-xs text-muted-foreground/60">
            Enterprise Web Application Firewall Solution
          </p>
        </div>
      </div>
    </div>
  );
}
