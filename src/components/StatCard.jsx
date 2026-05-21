export default function StatCard({ icon: Icon, label, value, description }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">
        <Icon size={23} />
      </div>

      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <span>{description}</span>
      </div>
    </div>
  );
}
