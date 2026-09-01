export default function StatCard({ icon: Icon, label, value, note, tone = "green" }) {
    return (<article className={`stat-card stat-${tone}`}>
      <div className="stat-icon">{Icon ? <Icon size={21}/> : null}</div>
      <div className="stat-copy">
        <span>{label}</span>
        <strong>{value}</strong>
        {note ? <small>{note}</small> : null}
      </div>
    </article>);
}

