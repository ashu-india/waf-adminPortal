import { Shield, Activity, Lock, Zap, BarChart3, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";

const features = [
  {
    icon: Shield,
    title: "Real-time Protection",
    description: "Block malicious requests instantly with OWASP-compliant rule sets and custom patterns.",
  },
  {
    icon: Activity,
    title: "Live Monitoring",
    description: "Watch traffic flow in real-time with detailed analysis and threat scoring.",
  },
  {
    icon: Lock,
    title: "Multi-tenant Security",
    description: "Manage multiple websites with isolated policies and configurations.",
  },
  {
    icon: Zap,
    title: "Instant Enforcement",
    description: "Toggle between monitor and block modes with immediate effect.",
  },
  {
    icon: BarChart3,
    title: "Analytics & Insights",
    description: "Understand attack patterns with comprehensive analytics and reports.",
  },
  {
    icon: Globe,
    title: "Global Coverage",
    description: "Protect sites across regions with distributed threat intelligence.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <span className="text-lg font-semibold">WAF Admin</span>
              <span className="hidden sm:inline text-muted-foreground ml-2">Security Dashboard</span>
            </div>
          </div>
          <Button asChild data-testid="button-login-header">
            <Link href="/sign-in">Sign In</Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-chart-2/5" />
        <div className="relative max-w-7xl mx-auto px-6 py-24 sm:py-32">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
              <Shield className="h-4 w-4" />
              Enterprise-Grade Web Application Firewall
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Protect Your Web Applications with{" "}
              <span className="text-primary">Intelligent Security</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Multi-tenant WAF solution with real-time threat detection, OWASP rule integration, 
              and comprehensive analytics. Monitor, analyze, and protect your web infrastructure.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="min-w-[200px]" asChild data-testid="button-get-started">
                <Link href="/sign-in">Get Started</Link>
              </Button>
              <Button size="lg" variant="outline" className="min-w-[200px]" data-testid="button-learn-more">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-primary" data-testid="stat-requests">10M+</div>
              <div className="text-sm text-muted-foreground mt-1">Requests Analyzed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-chart-2" data-testid="stat-threats">500K+</div>
              <div className="text-sm text-muted-foreground mt-1">Threats Blocked</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-chart-3" data-testid="stat-rules">1000+</div>
              <div className="text-sm text-muted-foreground mt-1">Security Rules</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-bold text-chart-4" data-testid="stat-uptime">99.9%</div>
              <div className="text-sm text-muted-foreground mt-1">Uptime SLA</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Comprehensive Security Features
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to protect your web applications from modern threats.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="hover-elevate transition-all duration-200" data-testid={`card-feature-${index}`}>
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-card border-t border-border">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Secure Your Applications?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Start protecting your web infrastructure today with our enterprise-grade WAF solution.
          </p>
          <Button size="lg" className="min-w-[200px]" asChild data-testid="button-cta-signin">
            <a href="/sign-in">Sign In to Get Started</a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Shield className="h-4 w-4" />
              <span>WAF Admin Dashboard</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Enterprise Web Application Firewall Solution
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
