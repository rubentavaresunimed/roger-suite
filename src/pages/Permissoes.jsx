import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Circle, MinusCircle } from "lucide-react";

import Topbar from "../components/Topbar";
import { api } from "../services/api";

const ACTION_LABELS = {
  visualizar: "Visualizar",
  incluir: "Incluir",
  alterar: "Alterar",
  excluir: "Excluir",
  administrar: "Administrar",
};

function can(user, key) {
  return Boolean(user?.permissions?.[key]);
}

export default function Permissoes({ user }) {
  const [tab, setTab] = useState("perfil");
  const [profiles, setProfiles] = useState([]);
  const [users, setUsers] = useState([]);
  const [catalog, setCatalog] = useState({ actions: [], systems: [] });
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [profilePermissions, setProfilePermissions] = useState([]);
  const [userPermissions, setUserPermissions] = useState([]);
  const [message, setMessage] = useState("");

  const canAdminPermissions = can(user, "roger.permissoes.administrar");

  async function loadBase() {
    const [profilesData, usersData, catalogData] = await Promise.all([
      api.listProfiles(),
      api.listUsers(),
      api.listPermissionCatalog(),
    ]);

    setProfiles(profilesData.profiles);
    setUsers(usersData.users);
    setCatalog(catalogData);

    if (!selectedProfileId && profilesData.profiles[0]) {
      setSelectedProfileId(String(profilesData.profiles[0].id));
    }

    if (!selectedUserId && usersData.users[0]) {
      setSelectedUserId(String(usersData.users[0].id));
    }
  }

  useEffect(() => {
    loadBase().catch((err) => setMessage(err.message));
  }, []);

  useEffect(() => {
    if (!selectedProfileId) return;

    api
      .getProfilePermissions(selectedProfileId)
      .then((data) => setProfilePermissions(data.permissions))
      .catch((err) => setMessage(err.message));
  }, [selectedProfileId]);

  useEffect(() => {
    if (!selectedUserId) return;

    api
      .getUserEffectivePermissions(selectedUserId)
      .then((data) => setUserPermissions(data.permissions))
      .catch((err) => setMessage(err.message));
  }, [selectedUserId]);

  const profilePermissionMap = useMemo(() => {
    return new Map(
      profilePermissions.map((permission) => [
        `${permission.resourceId}:${permission.action}`,
        permission,
      ])
    );
  }, [profilePermissions]);

  const userPermissionMap = useMemo(() => {
    return new Map(
      userPermissions.map((permission) => [
        `${permission.resourceId}:${permission.action}`,
        permission,
      ])
    );
  }, [userPermissions]);

  function toggleProfilePermission(resourceId, action) {
    if (!canAdminPermissions) {
      setMessage("Você não possui permissão para administrar permissões.");
      return;
    }

    const key = `${resourceId}:${action}`;
    const current = profilePermissionMap.get(key);

    if (current) {
      setProfilePermissions((items) =>
        items.map((item) =>
          item.resourceId === resourceId && item.action === action
            ? { ...item, allowed: !item.allowed }
            : item
        )
      );
      return;
    }

    setProfilePermissions((items) => [
      ...items,
      {
        profileId: Number(selectedProfileId),
        resourceId,
        action,
        allowed: true,
      },
    ]);
  }

  function cycleUserException(permission) {
    if (!canAdminPermissions) {
      setMessage("Você não possui permissão para administrar exceções.");
      return;
    }

    const next = (() => {
      if (!permission.hasException) {
        return {
          ...permission,
          hasException: true,
          exceptionAllowed: true,
          allowed: true,
          source: "usuario",
          reason: "Exceção individual criada no ROGER",
        };
      }

      if (permission.exceptionAllowed === true) {
        return {
          ...permission,
          hasException: true,
          exceptionAllowed: false,
          allowed: false,
          source: "usuario",
          reason: "Exceção individual criada no ROGER",
        };
      }

      return {
        ...permission,
        hasException: false,
        exceptionAllowed: null,
        allowed: permission.profileAllowed,
        source: "perfil",
        reason: "",
        clear: true,
      };
    })();

    setUserPermissions((items) =>
      items.map((item) =>
        item.resourceId === permission.resourceId && item.action === permission.action
          ? next
          : item
      )
    );
  }

  async function saveProfile() {
    if (!canAdminPermissions) {
      setMessage("Você não possui permissão para salvar permissões.");
      return;
    }

    try {
      const payload = profilePermissions.map((permission) => ({
        resourceId: permission.resourceId,
        action: permission.action,
        allowed: permission.allowed,
      }));

      await api.saveProfilePermissions(selectedProfileId, payload);
      setMessage("Permissões do perfil salvas com sucesso.");
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function saveUserExceptions() {
    if (!canAdminPermissions) {
      setMessage("Você não possui permissão para salvar exceções.");
      return;
    }

    try {
      const payload = userPermissions
        .filter((permission) => permission.hasException || permission.clear)
        .map((permission) => ({
          resourceId: permission.resourceId,
          action: permission.action,
          allowed: permission.exceptionAllowed === true,
          reason: permission.reason || "Exceção individual criada no ROGER",
          clear: permission.clear || false,
        }));

      await api.saveUserExceptions(selectedUserId, payload);

      const updated = await api.getUserEffectivePermissions(selectedUserId);
      setUserPermissions(updated.permissions);
      setMessage("Exceções do usuário salvas com sucesso.");
    } catch (err) {
      setMessage(err.message);
    }
  }

  function renderPermissionIcon({ allowed, hasException, exceptionAllowed }) {
    if (hasException && exceptionAllowed === true) {
      return <CheckCircle2 className="allowed exception-allowed" size={20} />;
    }

    if (hasException && exceptionAllowed === false) {
      return <MinusCircle className="denied exception-denied" size={20} />;
    }

    if (allowed) {
      return <CheckCircle2 className="allowed" size={20} />;
    }

    return <Circle className="empty-permission-icon" size={20} />;
  }

  return (
    <>
      <Topbar
        title="Permissões"
        subtitle="Controle por perfil e exceções individuais por usuário"
      />

      <section className="panel roger-card-highlight">
        <div className="permission-tabs">
          <button
            className={tab === "perfil" ? "active" : ""}
            onClick={() => setTab("perfil")}
          >
            Por perfil
          </button>

          <button
            className={tab === "usuario" ? "active" : ""}
            onClick={() => setTab("usuario")}
          >
            Por usuário / exceções
          </button>
        </div>

        {message && <div className="form-info">{message}</div>}

        {tab === "perfil" && (
          <>
            <div className="panel-header">
              <div>
                <h3>Permissões por perfil</h3>
                <p>Regra padrão aplicada para todos os usuários do perfil</p>
              </div>

              <div className="panel-actions">
                <select
                  value={selectedProfileId}
                  onChange={(event) => setSelectedProfileId(event.target.value)}
                >
                  {profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.name}
                    </option>
                  ))}
                </select>

                {canAdminPermissions && (
                  <button className="primary-small" onClick={saveProfile}>
                    Salvar perfil
                  </button>
                )}
              </div>
            </div>

            <div className="permission-matrix">
              <table>
                <thead>
                  <tr>
                    <th>Sistema / Recurso</th>
                    {catalog.actions.map((action) => (
                      <th key={action}>{ACTION_LABELS[action] || action}</th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {catalog.systems.map((system) =>
                    system.resources.map((resource) => (
                      <tr key={`${system.slug}-${resource.id}`}>
                        <td>
                          <strong>{system.name} — {resource.name}</strong>
                          <small>{resource.description}</small>
                        </td>

                        {catalog.actions.map((action) => {
                          const permission = profilePermissionMap.get(
                            `${resource.id}:${action}`
                          );

                          return (
                            <td key={`${resource.id}-${action}`}>
                              <button
                                className="permission-cell-button"
                                onClick={() =>
                                  toggleProfilePermission(resource.id, action)
                                }
                              >
                                {permission?.allowed ? (
                                  <CheckCircle2 className="allowed" size={20} />
                                ) : (
                                  <Circle className="empty-permission-icon" size={20} />
                                )}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === "usuario" && (
          <>
            <div className="panel-header">
              <div>
                <h3>Exceções por usuário</h3>
                <p>
                  A exceção individual sobrescreve a permissão herdada do perfil
                </p>
              </div>

              <div className="panel-actions">
                <select
                  value={selectedUserId}
                  onChange={(event) => setSelectedUserId(event.target.value)}
                >
                  {users.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} — {item.profile}
                    </option>
                  ))}
                </select>

                {canAdminPermissions && (
                  <button className="primary-small" onClick={saveUserExceptions}>
                    Salvar exceções
                  </button>
                )}
              </div>
            </div>

            <div className="permission-legend">
              <span><CheckCircle2 className="allowed" size={16} /> Permitido pelo perfil</span>
              <span><CheckCircle2 className="allowed exception-allowed" size={16} /> Permitido por exceção</span>
              <span><MinusCircle className="denied exception-denied" size={16} /> Negado por exceção</span>
              <span><Circle className="empty-permission-icon" size={16} /> Negado</span>
            </div>

            <div className="permission-matrix">
              <table>
                <thead>
                  <tr>
                    <th>Sistema / Recurso</th>
                    {catalog.actions.map((action) => (
                      <th key={action}>{ACTION_LABELS[action] || action}</th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {catalog.systems.map((system) =>
                    system.resources.map((resource) => (
                      <tr key={`${system.slug}-${resource.id}`}>
                        <td>
                          <strong>{system.name} — {resource.name}</strong>
                          <small>{resource.description}</small>
                        </td>

                        {catalog.actions.map((action) => {
                          const permission = userPermissionMap.get(
                            `${resource.id}:${action}`
                          );

                          return (
                            <td key={`${resource.id}-${action}`}>
                              {permission && (
                                <button
                                  className="permission-cell-button"
                                  title="Clique para alternar: herdar → permitir exceção → negar exceção"
                                  onClick={() => cycleUserException(permission)}
                                >
                                  {renderPermissionIcon(permission)}
                                </button>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </>
  );
}
