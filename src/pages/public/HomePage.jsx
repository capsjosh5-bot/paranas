import {
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  FileText,
  GraduationCap,
  Landmark,
  MapPin,
  ShieldCheck,
  Sparkles,
  UserRoundPlus,
  UsersRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ScholarshipCard from "../../components/scholarships/ScholarshipCard";
import {
  PARANAS_DISCOVER,
  PARANAS_FACTS,
  PARANAS_REFERENCES,
} from "../../config/paranas-home";
import { DEFAULT_SITE_CONTENT, getSiteContent } from "../../services/content.service";
import { getPublicScholarships } from "../../services/scholarship.service";
import { formatDate, isApplicationOpen } from "../../utils/date";

export default function HomePage() {
  const [scholarships, setScholarships] = useState([]);
  const [content, setContent] = useState(DEFAULT_SITE_CONTENT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    Promise.all([getPublicScholarships(), getSiteContent()])
      .then(([items, siteContent]) => {
        if (!mounted) return;
        setScholarships(
          [...items].sort((a, b) =>
            String(a.closeDate || "").localeCompare(String(b.closeDate || "")),
          ),
        );
        setContent(siteContent);
      })
      .catch((error) => {
        console.error("Unable to load public homepage data:", error);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const openScholarships = useMemo(
    () => scholarships.filter((item) => isApplicationOpen(item)),
    [scholarships],
  );

  const featured = openScholarships[0] || null;

  return (
    <div className="reference-home">
      <section className="reference-hero">
        <div className="reference-hero-media" aria-hidden="true" />
        <div className="reference-hero-overlay" aria-hidden="true" />

        <div className="reference-hero-inner">
          <div className="reference-hero-copy">
            <span className="reference-eyebrow">
              INVESTING IN EDUCATION. BUILDING THE FUTURE.
            </span>
            <h1>LGU Scholarship Program</h1>
            <p>
              {content.heroText ||
                "Empowering the youth of Paranas, Samar through accessible and inclusive educational opportunities."}
            </p>

            <div className="reference-hero-actions">
              <Link to="/scholarships" className="reference-button reference-button-gold">
                <GraduationCap size={19} /> View Scholarships
              </Link>
              <a href="#how-to-apply" className="reference-button reference-button-outline">
                <FileText size={18} /> How to Apply
              </a>
            </div>

            <div className="reference-value-grid">
              <ValuePoint
                icon={GraduationCap}
                title="Quality Education"
                text="Support for deserving Paranas students"
              />
              <ValuePoint
                icon={UsersRound}
                title="Equal Opportunity"
                text="Inclusive assistance for qualified learners"
              />
              <ValuePoint
                icon={Sparkles}
                title="Brighter Future"
                text="Building a stronger Paranas together"
              />
            </div>
          </div>

          <aside className="reference-open-card">
            <div className="reference-open-card-heading">
              <div className="reference-open-icon">
                <GraduationCap size={29} />
              </div>
              <div>
                <span>SCHOLARSHIPS OPEN NOW</span>
                <strong>{loading ? "—" : openScholarships.length}</strong>
                <small>{openScholarships.length === 1 ? "Active Program" : "Active Programs"}</small>
              </div>
            </div>

            <p>
              {featured
                ? "Applications are currently being accepted for published scholarship opportunities."
                : "There is no scholarship currently accepting applications."}
            </p>

            <div className="reference-open-meta">
              <div>
                <span>Applicant Capacity</span>
                <strong>{featured?.maxApplicants || "—"}</strong>
              </div>
              <div>
                <span>Deadline</span>
                <strong>{featured ? formatDate(featured.closeDate) : "—"}</strong>
              </div>
            </div>

            {featured ? (
              <Link
                to={`/scholarships/${featured.id}`}
                className="reference-apply-button"
              >
                Apply / View Details <ArrowRight size={18} />
              </Link>
            ) : (
              <Link to="/scholarships" className="reference-apply-button">
                View Scholarship Page <ArrowRight size={18} />
              </Link>
            )}
          </aside>
        </div>
      </section>

      <section className="reference-fact-band" aria-label="Paranas municipality facts">
        <div className="reference-fact-band-inner">
          {PARANAS_FACTS.map((fact, index) => (
            <FactItem key={fact.label} index={index} {...fact} />
          ))}
        </div>
      </section>

      <section className="reference-section reference-scholarship-section">
        <div className="reference-section-heading">
          <div>
            <span>AVAILABLE OPPORTUNITIES</span>
            <h2>Available Scholarships</h2>
            <p>
              Browse current scholarship opportunities. Review eligibility, requirements,
              applicant capacity, and deadlines before applying.
            </p>
          </div>
          <Link to="/scholarships" className="reference-section-link">
            View all scholarships <ArrowRight size={17} />
          </Link>
        </div>

        {loading ? (
          <div className="reference-scholarship-skeletons">
            <div />
            <div />
            <div />
          </div>
        ) : openScholarships.length ? (
          <div className="reference-scholarship-grid">
            {openScholarships.slice(0, 3).map((scholarship) => (
              <ScholarshipCard key={scholarship.id} scholarship={scholarship} />
            ))}
          </div>
        ) : (
          <div className="reference-empty-state">
            <div><GraduationCap size={30} /></div>
            <section>
              <span>APPLICATION UPDATE</span>
              <h3>No scholarship application is open right now.</h3>
              <p>
                When the LGU publishes a new application period, it will automatically appear
                here. You can create your student account in advance.
              </p>
            </section>
            <Link to="/register" className="reference-button reference-button-green">
              Create Account
            </Link>
          </div>
        )}
      </section>

      <section id="how-to-apply" className="reference-process-section">
        <div className="reference-section reference-process-inner">
          <div className="reference-process-heading">
            <span>HOW IT WORKS</span>
            <h2>A simple process to apply for a scholarship</h2>
          </div>

          <div className="reference-process-grid">
            <ProcessStep
              number="1"
              icon={UserRoundPlus}
              title="Create Account"
              text="Register and complete your student profile."
            />
            <ProcessStep
              number="2"
              icon={BookOpenCheck}
              title="Choose Scholarship"
              text="Browse and select the scholarship that fits your qualifications."
            />
            <ProcessStep
              number="3"
              icon={FileText}
              title="Submit Application"
              text="Fill out the official form and complete the required information."
            />
            <ProcessStep
              number="4"
              icon={BadgeCheck}
              title="Track Status"
              text="Monitor your application status, revisions, and decision."
            />
          </div>
        </div>
      </section>

      <section className="reference-section reference-discover-section">
        <div className="reference-discover-heading">
          <div>
            <span>DISCOVER PARANAS</span>
            <h2>Paranas, Samar</h2>
            <p>
              The scholarship portal serves students from a municipality shaped by education,
              resilient communities, river landscapes, forest ecosystems, and ecotourism.
            </p>
          </div>
        </div>

        <div className="reference-discover-layout">
          <div className="reference-discover-cards">
            {PARANAS_DISCOVER.map((item) => (
              <a
                className="reference-discover-card"
                href={item.href}
                target="_blank"
                rel="noreferrer"
                key={item.title}
              >
                <div className="reference-discover-image">
                  <img src={item.image} alt={item.title} loading="lazy" />
                </div>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <span>{item.source} <ArrowRight size={14} /></span>
                </div>
              </a>
            ))}
          </div>

          <article className="reference-municipality-card">
            <div className="reference-municipality-copy">
              <span>ABOUT THE MUNICIPALITY</span>
              <h2>{content.aboutTitle}</h2>
              <p>{content.aboutText}</p>

              <ul>
                <li><CheckCircle2 size={17} /> First-class municipality in Samar</li>
                <li><CheckCircle2 size={17} /> 44 barangays across the municipality</li>
                <li><CheckCircle2 size={17} /> Ulot River and protected forest landscapes</li>
                <li><CheckCircle2 size={17} /> Strong commitment to education and community development</li>
              </ul>

              <Link to="/about" className="reference-button reference-button-white">
                Learn more about Paranas <ArrowRight size={17} />
              </Link>
            </div>
            <div className="reference-municipality-seal">
              <img src="/paranas-seal.png" alt="Municipality of Paranas official seal" />
              <strong>Municipality of Paranas</strong>
              <span>Samar, Eastern Visayas</span>
            </div>
          </article>
        </div>

        <div className="reference-source-row">
          <span>Information references:</span>
          {PARANAS_REFERENCES.map((source) => (
            <a key={source.label} href={source.href} target="_blank" rel="noreferrer">
              {source.label}
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}

function ValuePoint({ icon: Icon, title, text }) {
  return (
    <div className="reference-value-point">
      <div><Icon size={23} /></div>
      <section>
        <strong>{title}</strong>
        <span>{text}</span>
      </section>
    </div>
  );
}

function FactItem({ index, value, label, note }) {
  const icons = [UsersRound, Landmark, ShieldCheck, CalendarDays];
  const Icon = icons[index] || Landmark;

  return (
    <article className="reference-fact-item">
      <div><Icon size={24} /></div>
      <section>
        <strong>{value}</strong>
        <span>{label}</span>
        <small>{note}</small>
      </section>
    </article>
  );
}

function ProcessStep({ number, icon: Icon, title, text }) {
  return (
    <article className="reference-process-step">
      <span className="reference-process-number">{number}</span>
      <div className="reference-process-icon"><Icon size={24} /></div>
      <section>
        <h3>{title}</h3>
        <p>{text}</p>
      </section>
      {number !== "4" ? <ArrowRight className="reference-process-arrow" size={21} /> : null}
    </article>
  );
}
