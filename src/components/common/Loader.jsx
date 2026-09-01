export default function Loader({ fullPage = false, label = "Loading…" }) {
    return (<div className={fullPage ? "loader-screen" : "loader-inline"} role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true"/>
      <span>{label}</span>
    </div>);
}

