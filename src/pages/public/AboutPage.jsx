import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Building2,
  CalendarDays,
  ExternalLink,
  GraduationCap,
  History,
  Landmark,
  Leaf,
  MapPinned,
  Mountain,
  ShieldCheck,
  Sparkles,
  TreePine,
  UsersRound,
  Waves,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DEFAULT_SITE_CONTENT, getSiteContent } from "../../services/content.service";
import {
  MUNICIPAL_FACTS,
  MUNICIPAL_LEADERS,
  PARANAS_BARANGAYS,
  PARANAS_REFERENCES,
  PARANAS_STORIES,
  PARANAS_TOURISM,
  SANGGUNIANG_BAYAN,
} from "../../config/paranas-about";
import "../../styles/about-paranas.css";

const STORY_ICONS = {
  graduation: GraduationCap,
  leaf: Leaf,
  users: UsersRound,
};

const TOURISM_ICONS = [Waves, TreePine, Mountain, Leaf];

export default function AboutPage() {
  const [content, setContent] = useState(DEFAULT_SITE_CONTENT);

  useEffect(() => {
    getSiteContent().then(setContent).catch(() => {});
  }, []);

  return (
    <main className="paranas-about-page">
      <Hero />
      <Facts />

      <section className="paranas-about-section paranas-leadership" id="leadership">
        <SectionHeading
          eyebrow="MUNICIPAL LEADERSHIP"
          title="Leadership dedicated to public service"
          description="Meet the elected municipal officials serving Paranas for the 2025–2028 term."
        />

        <div className="paranas-executive-grid">
          {MUNICIPAL_LEADERS.map((leader) => (
            <ExecutiveCard key={leader.title} leader={leader} />
          ))}
        </div>

        <div className="paranas-council-heading">
          <div>
            <span className="paranas-kicker">SANGGUNIANG BAYAN</span>
            <h3>Municipal Council Members</h3>
            <p>
              The Sangguniang Bayan works with the Vice Mayor and Municipal Mayor in local legislation,
              public policy, development planning, and community programs.
            </p>
          </div>
          <span className="paranas-term"><CalendarDays size={16} /> 2025–2028 term</span>
        </div>

        <div className="paranas-council-grid">
          {SANGGUNIANG_BAYAN.map((official, index) => (
            <CouncilCard key={official.name} official={official} number={index + 1} />
          ))}
        </div>
      </section>

      <section className="paranas-tourism-band" id="tourism">
        <div className="paranas-about-section">
          <SectionHeading
            eyebrow="DISCOVER PARANAS"
            title="Nature, adventure, and community tourism"
            description="Paranas is one of Samar's important gateways to river adventure, forest experiences, biodiversity, and community-led ecotourism."
            light
          />

          <div className="paranas-tourism-grid">
            {PARANAS_TOURISM.map((spot, index) => {
              const Icon = TOURISM_ICONS[index] || Sparkles;
              return <TourismCard key={spot.title} spot={spot} icon={Icon} featured={index === 0} />;
            })}
          </div>
        </div>
      </section>

      <section className="paranas-about-section paranas-identity-grid">
        <article className="paranas-profile-card">
          <div className="paranas-profile-seal">
            <img src="/paranas-seal.png" alt="Official seal of the Municipality of Paranas" />
          </div>
          <div>
            <span className="paranas-kicker">MUNICIPAL PROFILE</span>
            <h2>Paranas, Samar</h2>
            <p>
              Paranas is a first-class municipality in the Province of Samar, Eastern Visayas. It has 44
              barangays and a 2024 population of 35,281 according to the Philippine Statistics Authority.
              The municipality is closely associated with the Ulot River watershed and the wider Samar
              Island Natural Park landscape.
            </p>
            <div className="paranas-profile-tags">
              <span><MapPinned size={16}/> Samar · Region VIII</span>
              <span><Building2 size={16}/> 1st-class municipality</span>
              <span><UsersRound size={16}/> 35,281 population</span>
            </div>
          </div>
        </article>

        <article className="paranas-scholarship-card">
          <div className="paranas-scholarship-icon"><GraduationCap size={30}/></div>
          <span className="paranas-kicker">EDUCATION FOR THE FUTURE</span>
          <h2>The municipality behind the scholarship portal</h2>
          <p>
            This portal places education at the center of the LGU's digital service experience—helping
            qualified students find opportunities, complete official requirements, submit applications,
            and monitor decisions with greater transparency.
          </p>
          <Link to="/scholarships" className="paranas-primary-link">
            Explore scholarships <ArrowRight size={17}/>
          </Link>
        </article>
      </section>

      <section className="paranas-about-section">
        <SectionHeading
          eyebrow="PARANAS TODAY"
          title="People, environment, and the next generation"
          description="Local development is connected to education, environmental stewardship, public service, and community livelihood."
        />
        <div className="paranas-story-grid">
          {PARANAS_STORIES.map((story) => {
            const Icon = STORY_ICONS[story.icon] || Sparkles;
            return (
              <article className="paranas-story-card" key={story.title}>
                <div className="paranas-story-icon"><Icon size={24}/></div>
                <span>{story.kicker}</span>
                <h3>{story.title}</h3>
                <p>{story.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="paranas-community-band">
        <div className="paranas-about-section paranas-community-grid">
          <article className="paranas-history-card">
            <div className="paranas-history-icon"><History size={28}/></div>
            <div>
              <span className="paranas-kicker">MUNICIPAL HISTORY</span>
              <h2>From Wright to Paranas</h2>
              <p>{content.historyText}</p>
              <div className="paranas-history-law">Republic Act No. 6681 · Approved November 4, 1988</div>
            </div>
          </article>

          <article className="paranas-barangays-card">
            <span className="paranas-kicker">44 BARANGAYS</span>
            <h2>Communities across the municipality</h2>
            <p>
              Paranas is composed of 44 barangays listed in the Philippine Standard Geographic Code.
            </p>
            <details>
              <summary>View all barangays <ArrowRight size={16}/></summary>
              <div className="paranas-barangay-list">
                {PARANAS_BARANGAYS.map((barangay) => <span key={barangay}>{barangay}</span>)}
              </div>
            </details>
          </article>
        </div>
      </section>

      <section className="paranas-about-section paranas-reference-section">
        <div className="paranas-reference-intro">
          <div className="paranas-reference-icon"><ShieldCheck size={26}/></div>
          <div>
            <span className="paranas-kicker">VERIFIED INFORMATION</span>
            <h2>Government and institutional references</h2>
            <p>
              Municipal statistics, tourism highlights, environmental context, and local history are
              presented with links to government or institutional sources.
            </p>
          </div>
        </div>
        <div className="paranas-reference-links">
          {PARANAS_REFERENCES.map((source) => (
            <a key={source.label} href={source.href} target="_blank" rel="noreferrer">
              <span>{source.label}</span><ArrowUpRight size={17}/>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}

function Hero() {
  return (
    <section className="paranas-about-hero">
      <div className="paranas-about-hero-inner">
        <div className="paranas-about-hero-copy">
          <span className="paranas-hero-eyebrow">MUNICIPALITY OF PARANAS · SAMAR</span>
          <h1>Know the community behind the scholarship program.</h1>
          <p>
            A municipality shaped by education, public service, river and forest landscapes, community
            traditions, and a strong connection to Samar's natural heritage.
          </p>
          <div className="paranas-hero-actions">
            <a href="#leadership" className="paranas-hero-button primary"><Landmark size={17}/> Meet the leadership</a>
            <a href="#tourism" className="paranas-hero-button secondary"><Leaf size={17}/> Discover Paranas</a>
          </div>
        </div>

        <div className="paranas-hero-seal-card">
          <div className="paranas-hero-seal-glow"></div>
          <img src="/paranas-seal.png" alt="Municipality of Paranas official seal" />
          <span>OFFICIAL MUNICIPAL PROFILE</span>
          <strong>Paranas, Samar</strong>
          <small>Eastern Visayas · Region VIII</small>
          <div><BadgeCheck size={17}/> Municipality profile</div>
        </div>
      </div>
    </section>
  );
}

function Facts() {
  return (
    <section className="paranas-facts-bar" aria-label="Paranas municipal facts">
      <div className="paranas-facts-inner">
        {MUNICIPAL_FACTS.map((fact) => (
          <article key={fact.label}>
            <strong>{fact.value}</strong>
            <span>{fact.label}</span>
            <small>{fact.note}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

function SectionHeading({ eyebrow, title, description, light = false }) {
  return (
    <div className={`paranas-section-heading ${light ? "light" : ""}`}>
      <span className="paranas-kicker">{eyebrow}</span>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}

function ExecutiveCard({ leader }) {
  return (
    <article className="paranas-executive-card">
      <div className="paranas-executive-photo">
        <img src={leader.photo} alt={`${leader.name}, ${leader.title}`} loading="eager" />
        <span>{leader.term}</span>
      </div>
      <div className="paranas-executive-copy">
        <span>{leader.title}</span>
        <h3>{leader.name}</h3>
        <p>{leader.description}</p>
        <div className="paranas-office-badge"><Landmark size={16}/> Municipal Government of Paranas</div>
      </div>
    </article>
  );
}

function CouncilCard({ official, number }) {
  return (
    <article className="paranas-council-card">
      <div className="paranas-council-photo">
        <img src={official.photo} alt={`${official.displayName}, Municipal Councilor`} loading="lazy" />
        <span>{String(number).padStart(2, "0")}</span>
      </div>
      <div className="paranas-council-copy">
        <span>MUNICIPAL COUNCILOR</span>
        <h4>{official.displayName}</h4>
        <small>Sangguniang Bayan · 2025–2028</small>
      </div>
    </article>
  );
}

function TourismCard({ spot, icon: Icon, featured }) {
  return (
    <article className={`paranas-tourism-card ${featured ? "featured" : ""}`}>
      <div className="paranas-tourism-image">
        <img
          src={spot.image}
          alt={`${spot.title} in Paranas, Samar`}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(event) => {
            event.currentTarget.onerror = null;
            event.currentTarget.src = "/paranas-seal.png";
            event.currentTarget.classList.add("fallback-seal");
          }}
        />
        <span><Icon size={16}/> {spot.category}</span>
      </div>
      <div className="paranas-tourism-copy">
        <h3>{spot.title}</h3>
        <p>{spot.description}</p>
        <div className="paranas-tourism-footer">
          <small>{spot.source}</small>
          <a href={spot.href} target="_blank" rel="noreferrer" aria-label={`Open source for ${spot.title}`}>
            Source <ExternalLink size={14}/>
          </a>
        </div>
      </div>
    </article>
  );
}
