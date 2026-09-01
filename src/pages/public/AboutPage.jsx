import { Building2, History, MapPinned, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import { DEFAULT_SITE_CONTENT, getSiteContent } from "../../services/content.service";
export default function AboutPage() {
    const [content, setContent] = useState(DEFAULT_SITE_CONTENT);
    useEffect(() => { getSiteContent().then(setContent); }, []);
    return (<section className="public-section about-page">
      <div className="directory-hero"><span className="section-kicker">ABOUT PARANAS</span><h1>{content.aboutTitle}</h1><p>A municipal profile presented within the LGU Scholarship Portal.</p></div>
      <div className="about-feature-grid">
        <div className="about-seal-card"><img src="/paranas-seal.png" alt="Municipality of Paranas seal"/><h2>Municipality of Paranas</h2><p>Province of Samar · Eastern Visayas</p></div>
        <div className="about-copy-card"><p>{content.aboutText}</p><div className="fact-grid"><Fact icon={Building2} label="Income classification" value="First-class municipality"/><Fact icon={UsersRound} label="Barangays" value="44"/><Fact icon={UsersRound} label="2024 POPCEN" value="35,281"/><Fact icon={MapPinned} label="Province" value="Samar"/></div></div>
      </div>
      <article className="history-card"><History size={24}/><div><span className="section-kicker">MUNICIPAL HISTORY</span><h2>From Wright to Paranas</h2><p>{content.historyText}</p></div></article>
      <div className="source-note"><strong>Information note:</strong> Population, barangay count, and income-class references are based on the Philippine Statistics Authority's Philippine Standard Geographic Code. The municipal name history is based on Republic Act No. 6681.</div>
    </section>);
}
function Fact({ icon: Icon, label, value }) { return <div className="fact-item"><Icon size={18}/><span>{label}</span><strong>{value}</strong></div>; }

