import { LockKeyhole } from "lucide-react";
import Topbar from "../components/Topbar";

export default function AcessoNegado({ permission }) {
  return (
    <>
      <Topbar
        title="Acesso negado"
        subtitle="O ROGER bloqueou esta área conforme suas permissões"
      />

      <section className="panel access-denied-panel">
        <div className="access-denied-icon">
          <LockKeyhole size={42} />
        </div>

        <h2>Você não possui permissão para acessar esta tela.</h2>
        <p>
          Permissão necessária: <strong>{permission}</strong>
        </p>
        <p>
          Solicite ao administrador uma liberação por perfil ou uma exceção
          individual de usuário.
        </p>
      </section>
    </>
  );
}
