import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { queryClient } from "./lib/queryClient";
import NotFound from "@/pages/not-found";

import DashboardPage from "@/pages/DashboardPage";
import FilesPage from "@/pages/FilesPage";
import ApprenticesPage from "@/pages/ApprenticesPage";
import CompaniesPage from "@/pages/CompaniesPage";
import MentorsPage from "@/pages/MentorsPage";
import DocumentsPage from "@/pages/DocumentsPage";
import ReportsPage from "@/pages/ReportsPage";
import SettingsPage from "@/pages/SettingsPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={DashboardPage} />
      <Route path="/files" component={FilesPage} />
      <Route path="/apprentices" component={ApprenticesPage} />
      <Route path="/companies" component={CompaniesPage} />
      <Route path="/mentors" component={MentorsPage} />
      <Route path="/documents" component={DocumentsPage} />
      <Route path="/reports" component={ReportsPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
