import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  loginUser,
  registerUser,
} from "../services/api";


// =====================================================
// CREATE AUTH CONTEXT
// =====================================================

const AuthContext = createContext(null);


// =====================================================
// AUTH PROVIDER
// =====================================================

export function AuthProvider({ children }) {

  // -----------------------------------------------------
  // AUTH STATE
  // -----------------------------------------------------

  const [user, setUser] = useState(null);

  const [token, setToken] = useState(null);

  const [loading, setLoading] = useState(true);


  // =====================================================
  // RESTORE LOGIN SESSION
  // =====================================================

  useEffect(() => {

    const savedToken =
      localStorage.getItem("access_token");

    const savedUser =
      localStorage.getItem("user");


    // ---------------------------------------------------
    // RESTORE TOKEN
    // ---------------------------------------------------

    if (savedToken) {
      setToken(savedToken);
    }


    // ---------------------------------------------------
    // RESTORE USER
    // ---------------------------------------------------

    if (savedUser) {

      try {

        const parsedUser =
          JSON.parse(savedUser);

        setUser(parsedUser);

      } catch (error) {

        console.error(
          "Failed to restore saved user:",
          error
        );

        localStorage.removeItem("user");
      }
    }


    // ---------------------------------------------------
    // AUTH RESTORE COMPLETE
    // ---------------------------------------------------

    setLoading(false);

  }, []);


  // =====================================================
  // LOGIN
  // =====================================================

  const login = async (
    email,
    password
  ) => {

    const response =
      await loginUser({
        email,
        password,
      });


    // ---------------------------------------------------
    // EXTRACT RESPONSE
    // ---------------------------------------------------

    const accessToken =
      response.access_token;

    const loggedInUser =
      response.user;


    // ---------------------------------------------------
    // SAVE TO LOCAL STORAGE
    // ---------------------------------------------------

    localStorage.setItem(
      "access_token",
      accessToken
    );

    localStorage.setItem(
      "user",
      JSON.stringify(loggedInUser)
    );


    // ---------------------------------------------------
    // UPDATE REACT STATE
    // ---------------------------------------------------

    setToken(accessToken);

    setUser(loggedInUser);


    return response;
  };


  // =====================================================
  // REGISTER
  // =====================================================

  const register = async ({
    email,
    password,
    full_name,
    preferred_language = "en",
  }) => {

    const response =
      await registerUser({
        email,
        password,
        full_name,
        preferred_language,
      });


    return response;
  };


  // =====================================================
  // LOGOUT
  // =====================================================

  const logout = () => {

    // ---------------------------------------------------
    // REMOVE STORED AUTH DATA
    // ---------------------------------------------------

    localStorage.removeItem(
      "access_token"
    );

    localStorage.removeItem(
      "user"
    );


    // ---------------------------------------------------
    // CLEAR REACT STATE
    // ---------------------------------------------------

    setToken(null);

    setUser(null);
  };


  // =====================================================
  // AUTH CONTEXT VALUE
  // =====================================================

  const value = {

    user,

    token,

    loading,

    isAuthenticated: !!token,

    login,

    register,

    logout,
  };


  // =====================================================
  // PROVIDER
  // =====================================================

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}


// =====================================================
// CUSTOM AUTH HOOK
// =====================================================

export function useAuth() {

  return useContext(AuthContext);
}