import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import Dashboard from "./pages/Dashboard/Dashboard";
import Auth from "./pages/Auth/Auth";
import EnterpriseForm from "./components/EnterpriseForm/EnterpriseForm";
import ProfilePage from "./pages/Profile/Profile";
import TransactionsPage from "./pages/Transactions/Transactions";

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("dashboard");
  const [txFilter, setTxFilter] = useState("all");
  const [repeatTransaction, setRepeatTransaction] = useState(null);

  // Fetch whole table data to provide full profile sync
  const checkUserProfile = async (userSession) => {
    if (!userSession) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userSession.user.id)
      .maybeSingle();

    if (!error && data) {
      setProfile(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      checkUserProfile(currentSession);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      if (!currentSession) {
        setProfile(null);
        setView("dashboard");
        setLoading(false);
      } else {
        setLoading(true);
        checkUserProfile(currentSession);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-wrapper">
        <div className="loader"></div>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  if (!profile) {
    return (
      <EnterpriseForm
        userId={session.user.id}
        onProfileCreated={() => checkUserProfile(session)}
      />
    );
  }

  // Separation page component routing layer
  if (view === "profile") {
    return (
      <ProfilePage profile={profile} onBack={() => setView("dashboard")} />
    );
  }

  if (view === "transactions") {
    return (
      <TransactionsPage
        initialFilter={txFilter}
        onBack={() => setView("dashboard")}
        onRepeat={(tx) => {
          setRepeatTransaction(tx);
          setView("dashboard");
        }}
      />
    );
  }

  return (
    <Dashboard
      profile={profile}
      repeatTransaction={repeatTransaction}
      clearRepeatTransaction={() => setRepeatTransaction(null)}
      onNavigate={(target, filter = "all") => {
        setTxFilter(filter);
        setView(target);
      }}
    />
  );
}
