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

  // Track native window location pathname for client-side routing
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [txFilter, setTxFilter] = useState("all");
  const [repeatTransaction, setRepeatTransaction] = useState(null);

  // Synchronize path navigation via browser History state pushes
  const navigateTo = (path, stateFilter = "all") => {
    window.history.pushState({}, "", path);
    setCurrentPath(path);
    if (stateFilter) setTxFilter(stateFilter);
  };

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
    // Listen to native browser forward and back navigation events
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener("popstate", handlePopState);

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
        navigateTo("/");
        setLoading(false);
      } else {
        setLoading(true);
        checkUserProfile(currentSession);
      }
    });

    return () => {
      window.removeEventListener("popstate", handlePopState);
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="dashboard-wrapper">
        <div className="loader"></div>
      </div>
    );
  }

  // Guard routing context: unauthenticated view access limits
  if (!session) {
    return <Auth />;
  }

  // Component page router evaluation tree
  switch (currentPath) {
    case "/profile":
      return (
        <ProfilePage
          profile={profile}
          onBack={() => navigateTo("/")}
          onNavigate={navigateTo}
        />
      );

    case "/transactions":
      return (
        <TransactionsPage
          initialFilter={txFilter}
          onBack={() => navigateTo("/")}
          onRepeat={(tx) => {
            setRepeatTransaction(tx);
            navigateTo("/");
          }}
        />
      );

    case "/verification-form":
      return (
        <div
          className="dashboard-wrapper"
          style={{ flexDirection: "column", overflowY: "auto", height: "auto" }}
        >
          {/* Breadcrumbs structural rendering wrapper block */}
          <div
            style={{
              maxWidth: "580px",
              width: "100%",
              textAlign: "left",
              padding: "12px 16px",
              color: "#7d8591",
              fontSize: "14px",
              fontWeight: "500",
            }}
          >
            <span
              style={{ cursor: "pointer", color: "#a30146" }}
              onClick={() => navigateTo("/")}
            >
              Главная
            </span>
            <span> &gt; </span>
            <span
              style={{ cursor: "pointer", color: "#a30146" }}
              onClick={() => navigateTo("/profile")}
            >
              Личный кабинет
            </span>
            <span> &gt; </span>
            <span style={{ color: "#070c14" }}>Верификация</span>
          </div>

          {/* Forward session registration email safely into the input handler */}
          <EnterpriseForm
            userId={session.user.id}
            userEmail={session.user.email}
            onProfileCreated={() => {
              checkUserProfile(session);
              navigateTo("/profile");
            }}
          />
        </div>
      );

    case "/":
    default:
      return (
        <Dashboard
          profile={profile}
          repeatTransaction={repeatTransaction}
          clearRepeatTransaction={() => setRepeatTransaction(null)}
          onNavigate={(target, filter = "all") => {
            const targetRoute = target === "dashboard" ? "/" : `/${target}`;
            navigateTo(targetRoute, filter);
          }}
        />
      );
  }
}
