import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, User } from "lucide-react";

export default function LoginScreen({ onLogin, onRegister }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  const [userCount, setUserCount] = useState(null);

  useEffect(() => {
    fetch("/api/system/status")
      .then((r) => r.json())
      .then((data) => {
        if (data.userCount !== undefined) {
          setUserCount(data.userCount);
        }
      })
      .catch((err) => console.error("Failed to check system status", err));
  }, []);

  const [activeTab, setActiveTab] = useState("login");

  // Auto-switch to register if no users exist
  useEffect(() => {
    if (userCount === 0) {
      setActiveTab("register");
    }
  }, [userCount]);

  // Check if passwords match for registration
  const passwordsMatch = password === confirmPassword;
  const canRegister = username && password && confirmPassword && passwordsMatch;

  const handleSubmit = async (action) => {
    setIsLoading(true);
    setAuthError(null);
    
    // Validate password confirmation for registration
    if (action === "register" && !passwordsMatch) {
      setAuthError("Passwords do not match");
      setIsLoading(false);
      return;
    }
    
    try {
      let result;
      if (action === "login") {
        result = await onLogin(username, password);
      } else {
        result = await onRegister(username, password);
      }
      
      if (result && !result.success) {
        setAuthError(result.error);
      }
    } catch (err) {
      setAuthError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>
            Enter your credentials to access your notes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            {userCount === 0 && (
               <div className="bg-primary/15 text-primary text-sm p-3 rounded-md mb-4 font-medium border border-primary/20">
                 Welcome! You are the first user. Please register to become the Administrator.
               </div>
            )}

            {authError && (
              <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md mb-4">
                {authError}
              </div>
            )}

            <TabsContent value="login" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    placeholder="Enter your username"
                    className="pl-9"
                    maxLength={16}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit("login")}
                    onMouseEnter={(e) => e.target.select()}
                  />
                </div>
                <p className="text-xs text-muted-foreground">16 characters max</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    className="pl-9"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubmit("login")}
                    onMouseEnter={(e) => e.target.select()}
                  />
                </div>
              </div>
              <Button 
                className="w-full" 
                onClick={() => handleSubmit("login")}
                disabled={isLoading || !username || !password}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </TabsContent>

            <TabsContent value="register" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reg-username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="reg-username"
                    placeholder="Choose a username"
                    className="pl-9"
                    maxLength={16}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onMouseEnter={(e) => e.target.select()}
                  />
                </div>
                <p className="text-xs text-muted-foreground">16 characters max</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="reg-password"
                    type="password"
                    placeholder="Choose a password"
                    className="pl-9"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onMouseEnter={(e) => e.target.select()}
                  />
                </div>
              </div>
              {password.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="reg-confirm-password">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reg-confirm-password"
                      type="password"
                      placeholder="Confirm your password"
                      className={`pl-9 ${confirmPassword && !passwordsMatch ? 'border-destructive' : ''}`}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && canRegister && handleSubmit("register")}
                      onMouseEnter={(e) => e.target.select()}
                    />
                  </div>
                  {confirmPassword && !passwordsMatch && (
                    <p className="text-destructive text-xs">Passwords do not match</p>
                  )}
                </div>
              )}
              <Button 
                className="w-full" 
                onClick={() => handleSubmit("register")}
                disabled={isLoading || !canRegister}
              >
                {isLoading ? "Creating account..." : "Create Account"}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
