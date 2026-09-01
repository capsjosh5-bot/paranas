import { CheckCircle2, FileSignature, GraduationCap, HandHeart, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import { DEFAULT_SITE_CONTENT, getSiteContent } from "../../services/content.service";
const policyItems = [
    [UsersRound, "Residency and registration", "The program is intended for qualified residents and registered constituents of Paranas, subject to the eligibility rules of each published scholarship."],
    [GraduationCap, "Academic responsibility", "Applicants and beneficiaries are expected to maintain the academic standards required by the LGU scholarship program and the specific scholarship cycle."],
    [HandHeart, "Family and community responsibility", "The scholarship program may require family confirmation and participation in LGU/community activities as stated in the published policy."],
    [FileSignature, "Truthful information and consent", "Applicants certify that submitted information is complete and correct and provide an electronic signature as part of the application record."],
];
export default function ProgramPolicyPage() {
    const [content, setContent] = useState(DEFAULT_SITE_CONTENT);
    useEffect(() => { getSiteContent().then(setContent); }, []);
    return (<section className="public-section policy-page">
      <div className="directory-hero"><span className="section-kicker">LGU SCHOLARSHIP PROGRAM</span><h1>Program policy and applicant responsibilities</h1><p>{content.policyIntro}</p></div>
      <div className="policy-grid">{policyItems.map(([Icon, title, text]) => <article className="policy-card" key={title}><div className="policy-icon"><Icon size={22}/></div><h2>{title}</h2><p>{text}</p></article>)}</div>
      <article className="policy-notice"><CheckCircle2 size={24}/><div><h2>Scholarship-specific rules take priority</h2><p>Each scholarship posting can define its own applicant limit, deadline, benefits, eligibility requirements, and additional questions. Applicants should review the published scholarship page before submitting.</p></div></article>
    </section>);
}

