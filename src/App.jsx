// src/App.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import Dashboard from "./pages/Dashboard/Dashboard";
import Auth from "./pages/Auth/Auth";

function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    // get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="App">
      {session ? <Dashboard session={session} /> : <Auth />}
    </div>
  );
}

export default App;
