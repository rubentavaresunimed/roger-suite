import { DoorOpen, ExternalLink, PanelLeft, RefreshCw } from "lucide-react";
import CostaDashboard from "./CostaDashboard";

export default function ModuleFrame({ module, user, onLogout, onBack }) {
  if (!module) {
    return (
      <section className="module-frame-empty">
        <h1>Nenhum módulo selecionado</h1>
        <p>Escolha um módulo liberado no menu lateral.</p>
        <button className="primary-small" onClick={onBack}>
          Voltar para Meus Módulos
        </button>
      </section>
    );
  }

  const isInternalCosta = module?.slug === "costa";

  function reloadFrame() {
    const iframe = document.getElementById("roger-module-frame");
    if (iframe) {
      iframe.src = iframe.src;
    }
  }

  return (
    <section className="module-frame-shell">
      <header className="module-frame-topbar">
        <div>
          <span>Módulo ativo</span>
          <h1>{module.name}</h1>
        </div>

        <div className="module-frame-actions">
          <button onClick={onBack}>
            <PanelLeft size={16} />
            Meus Módulos
          </button>

          <button onClick={reloadFrame}>
            <RefreshCw size={16} />
            Atualizar
          </button>

          {!isInternalCosta && module.url && (
            <a href={module.url} target="_blank" rel="noreferrer">
              <ExternalLink size={16} />
              Abrir fora
            </a>
          )}

          <button className="logout-top-button" onClick={onLogout}>
            <DoorOpen size={16} />
            Sair
          </button>
        </div>
      </header>

      {isInternalCosta ? (
        <div className="module-frame-internal">
          <CostaDashboard user={user} />
        </div>
      ) : (
        <>
          <div className="module-frame-container">
            <iframe
              id="roger-module-frame"
              title={module.name}
              src={module.url}
              className="module-frame"
            />
          </div>

          <div className="module-frame-note">
            Se o módulo não carregar, ele provavelmente está bloqueando abertura por iframe.
            Como os próximos módulos serão nossos, vamos configurar todos para abrir dentro do ROGER.
          </div>
        </>
      )}
    </section>
  );
}
