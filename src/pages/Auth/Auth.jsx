import React, { useState } from "react";
import { supabase } from "../../supabaseClient";
import "./sass/index.scss";

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // handle submit logic
  const handleAuth = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else alert("Check your email!");
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setError(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        <h2>{isSignUp ? "Создать аккаунт" : "Войти в банк"}</h2>
        <p className="auth-subtitle">
          {isSignUp
            ? "Зарегистрируйтесь для начала работы"
            : "Введите свои данные для входа"}
        </p>

        <form onSubmit={handleAuth}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              className={`input-default ${error ? "input-error" : ""}`}
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Пароль</label>
            <input
              type="password"
              className={`input-default ${error ? "input-error" : ""}`}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <div className="error-message">{error}</div>}
          </div>

          <button
            type="submit"
            className="btn-pill btn-primary"
            style={{ width: "100%" }}
            disabled={loading}
          >
            {loading
              ? "Загрузка..."
              : isSignUp
                ? "Зарегистрироваться"
                : "Войти"}
          </button>
        </form>

        <div className="auth-switch">
          {isSignUp ? "Уже есть аккаунт? " : "Впервые у нас? "}
          <span
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError("");
            }}
          >
            {isSignUp ? "Войти" : "Создать"}
          </span>
        </div>
      </div>
    </div>
  );
}
