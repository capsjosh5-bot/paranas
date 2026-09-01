import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import ScholarshipCard from "../../components/scholarships/ScholarshipCard";
import { getPublicScholarships } from "../../services/scholarship.service";
export default function StudentScholarshipsPage() {
    const [items, setItems] = useState([]);
    const [query, setQuery] = useState("");
    useEffect(() => { getPublicScholarships().then(setItems); }, []);
    const filtered = useMemo(() => items.filter((item) => `${item.title} ${item.category}`.toLowerCase().includes(query.toLowerCase())), [items, query]);
    return <>
    <PageHeader eyebrow="STUDENT PORTAL" title="Browse Scholarships" description="Open a scholarship to review eligibility, application capacity, requirements, and deadlines."/>
    <div className="workspace-toolbar"><label className="search-box"><Search size={18}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search scholarship programs"/></label><span>{filtered.length} published program{filtered.length === 1 ? "" : "s"}</span></div>
    <div className="scholarship-grid workspace-scholarships">{filtered.map((item) => <ScholarshipCard key={item.id} scholarship={item}/>)}</div>
  </>;
}

