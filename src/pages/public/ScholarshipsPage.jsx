import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import ScholarshipCard from "../../components/scholarships/ScholarshipCard";
import EmptyState from "../../components/common/EmptyState";
import Loader from "../../components/common/Loader";
import { getPublicScholarships } from "../../services/scholarship.service";
export default function ScholarshipsPage() {
    const [items, setItems] = useState([]);
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        getPublicScholarships().then(setItems).finally(() => setLoading(false));
    }, []);
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return items.filter((item) => !q || `${item.title} ${item.category} ${item.description}`.toLowerCase().includes(q));
    }, [items, query]);
    return (<section className="public-section scholarships-directory">
      <div className="directory-hero"><span className="section-kicker">SCHOLARSHIP DIRECTORY</span><h1>Find an LGU scholarship opportunity</h1><p>All opportunities shown here have been published by the scholarship program administrator.</p></div>
      <div className="directory-toolbar">
        <label className="search-box"><Search size={18}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search scholarship name or category"/></label>
        <span>{filtered.length} program{filtered.length === 1 ? "" : "s"}</span>
      </div>
      {loading ? <Loader label="Loading scholarships…"/> : filtered.length ? <div className="scholarship-grid">{filtered.map((item) => <ScholarshipCard key={item.id} scholarship={item}/>)}</div> : <EmptyState title="No scholarships found" description="Try another search term or check again when new opportunities are published."/>}
    </section>);
}

