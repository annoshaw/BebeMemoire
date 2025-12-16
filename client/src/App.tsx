import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SubscriptionGuard } from "@/components/SubscriptionGuard";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Prototype from "@/pages/app/Prototype";
import CreateAlbum from "@/pages/app/CreateAlbum";
import EditBook from "@/pages/app/EditBook";
import PrebuiltBookEditor from "@/pages/app/PrebuiltBookEditor";
import EditProfile from "@/pages/app/EditProfile";
import NotificationSettings from "@/pages/app/NotificationSettings";
import TestCheckout from "@/pages/app/TestCheckout";
import OrderSuccess from "@/pages/app/OrderSuccess";
import OrderCancel from "@/pages/app/OrderCancel";
import Register from "@/pages/Register";
import Login from "@/pages/Login";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Onboarding from "@/pages/Onboarding";
import BookDemo from "@/pages/BookDemo";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminOrders from "@/pages/admin/AdminOrders";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminExports from "@/pages/admin/AdminExports";
import AdminEmails from "@/pages/admin/AdminEmails";
import SubscriptionRequired from "@/pages/SubscriptionRequired";

function ProtectedRoute({ component: Component }: { component: React.ComponentType<any> }) {
  return (
    <SubscriptionGuard>
      <Component />
    </SubscriptionGuard>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/app">{() => <ProtectedRoute component={Prototype} />}</Route>
      <Route path="/app/create">{() => <ProtectedRoute component={CreateAlbum} />}</Route>
      <Route path="/app/edit">{() => <ProtectedRoute component={EditBook} />}</Route>
      <Route path="/app/book/:id/edit">{() => <SubscriptionGuard><EditBook /></SubscriptionGuard>}</Route>
      <Route path="/app/book/:id/prebuilt">{() => <SubscriptionGuard><PrebuiltBookEditor /></SubscriptionGuard>}</Route>
      <Route path="/app/profile">{() => <ProtectedRoute component={EditProfile} />}</Route>
      <Route path="/app/notifications">{() => <ProtectedRoute component={NotificationSettings} />}</Route>
      <Route path="/app/test-checkout">{() => <ProtectedRoute component={TestCheckout} />}</Route>
      <Route path="/app/order-success" component={OrderSuccess} />
      <Route path="/app/order-cancel" component={OrderCancel} />
      <Route path="/register" component={Register} />
      <Route path="/login" component={Login} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/book-demo" component={BookDemo} />
      <Route path="/subscription" component={SubscriptionRequired} />
      <Route path="/app/admin" component={AdminDashboard} />
      <Route path="/app/admin/orders" component={AdminOrders} />
      <Route path="/app/admin/users" component={AdminUsers} />
      <Route path="/app/admin/exports" component={AdminExports} />
      <Route path="/app/admin/emails" component={AdminEmails} />
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