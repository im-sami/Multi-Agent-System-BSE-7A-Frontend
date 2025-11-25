"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    notifications: true,
    emailReminders: false,
    weeklyReport: true,
    darkMode: false,
    autoLogSessions: false,
    defaultSessionDuration: 60,
  })

  const handleSave = () => {
    localStorage.setItem("app-settings", JSON.stringify(settings))
    alert("Settings saved successfully!")
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your preferences and account settings</p>
      </div>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Configure how you receive reminders and updates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="notifications">Push Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive browser notifications for reminders</p>
            </div>
            <Switch
              id="notifications"
              checked={settings.notifications}
              onCheckedChange={(checked) => setSettings({ ...settings, notifications: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="emailReminders">Email Reminders</Label>
              <p className="text-sm text-muted-foreground">Get reminder emails for upcoming sessions</p>
            </div>
            <Switch
              id="emailReminders"
              checked={settings.emailReminders}
              onCheckedChange={(checked) => setSettings({ ...settings, emailReminders: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="weeklyReport">Weekly Progress Report</Label>
              <p className="text-sm text-muted-foreground">Receive a weekly summary of your activity</p>
            </div>
            <Switch
              id="weeklyReport"
              checked={settings.weeklyReport}
              onCheckedChange={(checked) => setSettings({ ...settings, weeklyReport: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Customize your study tracking experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="autoLogSessions">Auto-log Sessions</Label>
              <p className="text-sm text-muted-foreground">Automatically track study time</p>
            </div>
            <Switch
              id="autoLogSessions"
              checked={settings.autoLogSessions}
              onCheckedChange={(checked) => setSettings({ ...settings, autoLogSessions: checked })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="defaultDuration">Default Session Duration (minutes)</Label>
            <Input
              id="defaultDuration"
              type="number"
              min="1"
              value={settings.defaultSessionDuration}
              onChange={(e) => setSettings({ ...settings, defaultSessionDuration: parseInt(e.target.value) })}
              className="max-w-xs"
            />
          </div>
        </CardContent>
      </Card>

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Manage your account and privacy</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <p className="text-sm text-muted-foreground">student@edu.com</p>
          </div>
          <div className="space-y-2">
            <Label>Account Type</Label>
            <p className="text-sm text-muted-foreground">Student</p>
          </div>
          <div className="pt-4 flex gap-2">
            <Button variant="outline">Change Password</Button>
            <Button variant="outline">Export Data</Button>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg">
          Save Settings
        </Button>
      </div>
    </div>
  )
}
