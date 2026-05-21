import { Bell, DoorOpen, Menu, Search } from "lucide-react";

export default function Topbar({ title, subtitle, user, onLogout }) {
  const initials = user?.name
    ? user.name
        .split(" ")
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase()
    : "AD";

  function handleLogout() {
    if (onLogout) {
      onLogout();
      return;
    }

    localStorage.removeItem("roger_token");
    window.location.reload();
  }

  return (
    <header className="topbar topbar-modern">
      <div className="topbar-left">
        <button className="icon-button">
          <Menu size={20} />
        </button>

        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>

      <div className="topbar-actions">
        <div className="search-box">
          <Search size={17} />
          <input placeholder="Buscar..." />
        </div>

        <button className="icon-button notification">
          <Bell size={19} />
          <span>3</span>
        </button>

        <div className="topbar-user-area">
          <div className="topbar-user-chip">
            <span>{initials}</span>

            <div>
              <strong>{user?.login || user?.name || "ROGER"}</strong>
              <small>{user?.profile || "Usuário"}</small>
            </div>
          </div>

          <button className="topbar-logout-button" onClick={handleLogout}>
            <DoorOpen size={16} />
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
