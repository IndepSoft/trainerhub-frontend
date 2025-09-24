import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { AppProviders } from "./providers/AppProviders";

const App = () => {
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
};

export default App;
