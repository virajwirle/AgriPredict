import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Scan from "./pages/Scan";
import Result from "./pages/Result";
import History from "./pages/History";
import Weather from "./pages/Weather";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";

import Login from "./pages/Login";
import Register from "./pages/Register";

import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* =====================================================
            DEFAULT ROUTE
        ===================================================== */}

        <Route
          path="/"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />


        {/* =====================================================
            PUBLIC ROUTES
        ===================================================== */}

        {/* Login */}

        <Route
          path="/login"
          element={<Login />}
        />


        {/* Register */}

        <Route
          path="/register"
          element={<Register />}
        />


        {/* Dashboard */}

        <Route
          path="/dashboard"
          element={<Dashboard />}
        />


        {/* Weather */}

        <Route
          path="/weather"
          element={<Weather />}
        />


        {/* =====================================================
            PROTECTED ROUTES
        ===================================================== */}

        <Route element={<ProtectedRoute />}>

          {/* Scan */}

          <Route
            path="/scan"
            element={<Scan />}
          />


          {/* Prediction Result */}

          <Route
            path="/result"
            element={<Result />}
          />


          {/* History */}

          <Route
            path="/history"
            element={<History />}
          />


          {/* Profile */}

          <Route
            path="/profile"
            element={<Profile />}
          />


          {/* Settings */}

          <Route
            path="/settings"
            element={<Settings />}
          />

        </Route>


        {/* =====================================================
            FALLBACK
        ===================================================== */}

        <Route
          path="*"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;