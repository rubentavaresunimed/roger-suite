import { Layers } from "lucide-react";

export default function ModuleCard({ module }) {
  return (
    <div className={`module-card ${module.accent}`}>
      <div className="module-icon">
        <Layers size={24} />
      </div>

      <div>
        <h3>{module.name}</h3>
        <p>{module.description}</p>
      </div>

      <span className={`status ${module.status === "Ativo" ? "ok" : "soon"}`}>
        {module.status}
      </span>
    </div>
  );
}
