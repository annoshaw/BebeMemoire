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
import EditProfile from "@/pages/app/EditProfile";
import Register from "@/pages/Register";
import Onboarding from "@/pages/Onboarding";
import BookDemo from "@/pages/BookDemo";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/app" component={Prototype} />
      <Route path="/app/create" component={CreateAlbum} />
      <Route path="/app/edit" component={EditBook} />
      <Route path="/app/profile" component={EditProfile} />
      <Route path="/register" component={Register} />
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