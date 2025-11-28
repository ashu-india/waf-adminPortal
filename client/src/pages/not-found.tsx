import { Link } from "wouter";
import { AlertTriangle, Home, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
        <AlertTriangle className="h-10 w-10 text-muted-foreground" />
      </div>
      <h1 className="text-3xl font-bold mb-2">Page Not Found</h1>
      <p className="text-muted-foreground max-w-md mb-8">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="flex items-center gap-4">
        <Button variant="outline" asChild data-testid="button-go-back">
          <Link href="javascript:history.back()">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Link>
        </Button>
        <Button asChild data-testid="button-home">
          <Link href="/">
            <Home className="h-4 w-4 mr-2" />
            Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
