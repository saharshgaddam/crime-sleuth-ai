
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { toast } from "sonner";

export default function Profile() {
  const { user, updateUserProfile, updatePassword } = useAuth();
  const { profile, loading: profileLoading, updateProfile, toggleTwoFactor } = useProfile();
  
  // Local state for form controls
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isTogglingTwoFactor, setIsTogglingTwoFactor] = useState(false);

  // Sync local state when profile is loaded
  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setEmail(profile.email || "");
      setIsTwoFactorEnabled(profile.two_factor_enabled || false);
    }
  }, [profile]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile) {
      toast.error("Profile not loaded");
      return;
    }
    
    try {
      setIsUpdating(true);
      
      await updateUserProfile({ name, email });
      
      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    try {
      setIsChangingPassword(true);
      
      await updatePassword(newPassword);
      
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
      toast.success("Password updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleTwoFactorToggle = async () => {
    try {
      setIsTogglingTwoFactor(true);
      const newValue = !isTwoFactorEnabled;
      
      console.log("Toggling 2FA:", newValue);
      const result = await toggleTwoFactor(newValue);
      
      if (result) {
        setIsTwoFactorEnabled(newValue);
        toast.success(`Two-factor authentication ${newValue ? 'enabled' : 'disabled'}`);
      }
    } catch (error: any) {
      console.error("Failed to toggle 2FA:", error);
      toast.error(error.message || "Failed to update two-factor authentication settings");
    } finally {
      setIsTogglingTwoFactor(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 container py-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        <div className="container max-w-screen-lg py-8">
          <h1 className="text-3xl font-bold mb-8">My Profile</h1>
          
          <div className="grid gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your account details and preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <label htmlFor="name" className="font-medium">Name</label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <label htmlFor="email" className="font-medium">Email</label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <Button type="submit" disabled={isUpdating}>
                    {isUpdating ? "Updating..." : "Update Profile"}
                  </Button>
                </form>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Security</CardTitle>
                <CardDescription>Manage your account security settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-medium mb-4">Two-Factor Authentication</h3>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p>Enhance your account security</p>
                      <p className="text-sm text-muted-foreground">
                        Receive an email code when logging in on new devices
                      </p>
                    </div>
                    <Switch
                      checked={isTwoFactorEnabled}
                      onCheckedChange={handleTwoFactorToggle}
                      disabled={isTogglingTwoFactor}
                      aria-label="Toggle two-factor authentication"
                    />
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-medium mb-4">Change Password</h3>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <label htmlFor="current-password" className="font-medium">Current Password</label>
                        <Input
                          id="current-password"
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <label htmlFor="new-password" className="font-medium">New Password</label>
                        <Input
                          id="new-password"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <label htmlFor="confirm-password" className="font-medium">Confirm New Password</label>
                        <Input
                          id="confirm-password"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <Button type="submit" disabled={isChangingPassword}>
                      {isChangingPassword ? "Updating..." : "Update Password"}
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
