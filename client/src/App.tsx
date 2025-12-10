import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Prototype from "@/pages/app/Prototype";
import CreateAlbum from "@/pages/app/CreateAlbum";
import EditBook from "@/pages/app/EditBook";
import PrebuiltBookEditor from "@/pages/app/PrebuiltBookEditor";
import EditProfile from "@/pages/app/EditProfile";
import NotificationSettings from "@/pages/app/NotificationSettings";
import Register from "@/pages/Register";
import Login from "@/pages/Login";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Onboarding from "@/pages/Onboarding";
import BookDemo from "@/pages/BookDemo";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/app" component={Prototype} />
      <Route path="/app/create" component={CreateAlbum} />
      <Route path="/app/edit" component={EditBook} />
      <Route path="/app/book/:id/edit" component={EditBook} />
      <Route path="/app/book/:id/prebuilt" component={PrebuiltBookEditor} />
      <Route path="/app/profile" component={EditProfile} />
      <Route path="/app/notifications" component={NotificationSettings} />
      <Route path="/register" component={Register} />
      <Route path="/login" component={Login} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/book-demo" component={BookDemo} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;