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
import AdminSubscriptions from "@/pages/admin/AdminSubscriptions";

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
      <Route path="/app/test-checkout" component={TestCheckout} />
      <Route path="/app/order-success" component={OrderSuccess} />
      <Route path="/app/order-cancel" component={OrderCancel} />
      <Route path="/register" component={Register} />
      <Route path="/login" component={Login} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/book-demo" component={BookDemo} />
      <Route path="/app/admin" component={AdminDashboard} />
      <Route path="/app/admin/orders" component={AdminOrders} />
      <Route path="/app/admin/users" component={AdminUsers} />
      <Route path="/app/admin/exports" component={AdminExports} />
      <Route path="/app/admin/emails" component={AdminEmails} />
      <Route path="/app/admin/subscriptions" component={AdminSubscriptions} />
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