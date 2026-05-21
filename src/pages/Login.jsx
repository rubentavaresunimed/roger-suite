import { useState } from "react";
import rogerLogo from "../assets/roger-logo.png";
import { api, setToken } from "../services/api";

export default function Login({ onLogin }) {
  const [login, setLogin] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const data = await api.login({ login, password });
      setToken(data.token);
      onLogin(data.user);
    } catch (err) {
      setError(err.message || "Não foi possível entrar no ROGER");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-shell login-clean-shell">
        <div className="login-brand-panel login-brand-clean">
          <div className="network-glow" />

          <div className="login-logo-wrap login-logo-clean">
            <img src={rogerLogo} alt="Logo ROGER" className="login-logo-img" />
          </div>
        </div>

        <form className="login-form-panel" onSubmit={handleSubmit}>
          <h2>Bem-vindo de volta!</h2>
          <p>Acesse sua conta para continuar</p>

          <label>Usuário</label>
          <input
            value={login}
            onChange={(event) => setLogin(event.target.value)}
            placeholder="Digite seu usuário"
          />

          <label>Senha</label>
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            placeholder="Digite sua senha"
          />

          {error && <div className="form-error">{error}</div>}

          <div className="login-options">
            <label className="checkbox-line">
              <input type="checkbox" defaultChecked />
              Lembrar-me
            </label>

            <button type="button">Esqueci minha senha</button>
          </div>

          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </section>
    </main>
  );
}
