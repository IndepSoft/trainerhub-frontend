import { SidebarLayout } from "@/shared/layouts/AppLayout";
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<h1>Login</h1>} />
        <Route path="/" element={<SidebarLayout/>}>
          <Route index element={<h1>Dashboard</h1>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
