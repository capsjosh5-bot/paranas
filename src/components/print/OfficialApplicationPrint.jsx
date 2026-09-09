import { formatDateTime } from "../../utils/date";
import "../../styles/official-print.css";

const DEFAULT_SIGNATORY_NAME = "HON. ELVIRA U. BABALCON";
const DEFAULT_SIGNATORY_TITLE = "Municipal Mayor";

function valueOrLine(value) {
  const text = String(value ?? "").trim();
  return text || "\u00a0";
}

function money(value) {
  if (value === "" || value === null || value === undefined) return "";
  const number = Number(value);
  return Number.isFinite(number) ? `₱${number.toLocaleString("en-PH")}` : String(value);
}

function mark(condition) {
  return condition ? "✓" : "";
}

function extractBarangay(address) {
  const text = String(address || "").trim();
  if (!text) return "";

  const explicit = text.match(/(?:brgy\.?|barangay)\s+([^,;]+)/i);
  if (explicit?.[1]) return explicit[1].trim();

  const withoutLocation = text
    .replace(/,?\s*paranas\s*,?\s*samar\s*$/i, "")
    .replace(/,?\s*samar\s*$/i, "")
    .trim();

  return withoutLocation;
}

function inlineMayorName(name) {
  const cleaned = String(name || DEFAULT_SIGNATORY_NAME)
    .replace(/^HON\.\s*/i, "")
    .trim();

  return cleaned
    .toLowerCase()
    .replace(/(^|[\s-])([a-z])/g, (_, prefix, letter) => `${prefix}${letter.toUpperCase()}`)
    .replace(/\bU\b/, "U.")
    .replace(/U\.\./g, "U.");
}

function Field({ label, value, className = "" }) {
  return (
    <div className={`official-form-field ${className}`.trim()}>
      <span className="official-form-field__label">{label}</span>
      <span className="official-form-field__value">{valueOrLine(value)}</span>
    </div>
  );
}

export default function OfficialApplicationPrint({ application }) {
  if (!application) return null;

  const s = application.formData?.student || {};
  const p = application.formData?.parents || {};
  const review = application.adminReview || {};
  const customAnswers = application.formData?.customAnswers || {};
  const policy = application.formData?.policyAgreement || {};
  const customEntries = Object.entries(customAnswers).filter(([, value]) => {
    if (Array.isArray(value)) return value.length > 0;
    return String(value ?? "").trim() !== "";
  });

  const approved = application.status === "approved";
  const rejected = application.status === "rejected";
  const signatoryName = review.approvalSignatoryName || DEFAULT_SIGNATORY_NAME;
  const signatoryTitle = review.approvalSignatoryTitle || DEFAULT_SIGNATORY_TITLE;
  const approvalDate = review.approvalSignedAt || review.reviewedAt || application.updatedAt;
  const policyStudentName = policy.studentName || s.fullName || application.applicantName || "";
  const policyParentName = policy.parentGuardianName || p.guardianName || p.motherName || p.fatherName || "";
  const policyBarangay = policy.barangay || extractBarangay(s.address);
  const policyMayorName = inlineMayorName(signatoryName);

  return (
    <div className="official-print-only" aria-hidden="true">
      <section className="official-print-sheet">
        <header className="official-form-header">
          <div className="official-form-seal-wrap">
            <img src="/paranas-seal.png" className="official-form-seal" alt="Municipality of Paranas official seal" />
          </div>
          <div className="official-form-heading">
            <p>Republic of the Philippines</p>
            <h1>LGU SCHOLARSHIP PROGRAM</h1>
            <h2>Municipality of Paranas</h2>
            <h3>Paranas, Samar</h3>
            <strong>APPLICATION FORM</strong>
          </div>
          <div className="official-form-photo-box">
            {application.photoDataUrl ? (
              <img src={application.photoDataUrl} alt="2×2 applicant" />
            ) : (
              <div className="official-form-photo-placeholder">
                <span>ID PICTURE</span>
                <small>2×2</small>
              </div>
            )}
          </div>
        </header>

        <div className="official-form-meta">
          <span><b>Scholarship:</b> {application.scholarshipTitle || "LGU Scholarship Program"}</span>
          <span><b>Application No.:</b> {application.scholarshipCode ? `${application.scholarshipCode}-${String(application.applicantUid || "").slice(0, 8).toUpperCase()}` : String(application.applicantUid || "").slice(0, 12).toUpperCase()}</span>
        </div>

        <section className="official-form-section">
          <h4>A. STUDENT'S INFORMATION</h4>
          <div className="official-form-grid official-form-grid--four">
            <Field label="Name" value={s.fullName || application.applicantName} className="span-2" />
            <Field label="Age" value={s.age} />
            <Field label="Sex" value={s.sex} />
            <Field label="Birthday" value={s.birthday} />
            <Field label="Address" value={s.address} className="span-3" />
            <Field label="Cell phone number" value={s.phone} className="span-2" />
            <Field label="School year" value={s.schoolYear} className="span-2" />
            <Field label="School graduated" value={s.schoolGraduated} className="span-2" />
            <Field label="General Average (Grades)" value={s.generalAverage} />
            <Field label="Honors received (if any)" value={s.honors} />
            <Field label="Course to be taken" value={s.course} className="span-2" />
            <Field label="College / University Name" value={s.schoolNamePlace} className="span-2" />
            <Field label="Facebook Account" value={s.messenger} className="span-2" />
            <Field label="4Ps Member (Yes or No)" value={s.fourPs} className="span-2" />
          </div>
        </section>

        <section className="official-form-section">
          <h4>B. PARENT'S / GUARDIAN'S INFORMATION</h4>
          <div className="official-form-grid official-form-grid--four">
            <Field label="Name of Father" value={p.fatherName} className="span-3" />
            <Field label="Age" value={p.fatherAge} />
            <Field label="Occupation" value={p.fatherOccupation} className="span-4" />
            <Field label="Name of Mother" value={p.motherName} className="span-3" />
            <Field label="Age" value={p.motherAge} />
            <Field label="Occupation" value={p.motherOccupation} className="span-2" />
            <Field label="Number of Children" value={p.numberOfChildren} className="span-2" />
            <Field label="Gross Monthly Income (Father and Mother)" value={money(p.grossMonthlyIncome)} className="span-2" />
            <Field label="Guardian / Relationship" value={[p.guardianName, p.guardianRelationship].filter(Boolean).join(" — ")} className="span-2" />
          </div>
        </section>

        <section className="official-form-certification">
          <p>
            I HEREBY CERTIFY that the information stated in this application is true and correct. I understand that false or misleading information may be grounds for disqualification from the LGU Scholarship Program.
          </p>
          <div className="official-signature-row">
            <div className="official-parent-signature">
              <span className="signature-line" />
              <b>{p.motherName || "Mother / Guardian"}</b>
              <small>Mother / Guardian</small>
            </div>
            <div className="official-applicant-signature">
              {application.signatureDataUrl ? <img src={application.signatureDataUrl} alt="Applicant electronic signature" /> : null}
              <span className="signature-line" />
              <b>{s.fullName || application.applicantName || "Applicant"}</b>
              <small>Applicant's electronic signature over printed name</small>
            </div>
            <div className="official-parent-signature">
              <span className="signature-line" />
              <b>{p.fatherName || "Father / Guardian"}</b>
              <small>Father / Guardian</small>
            </div>
          </div>
        </section>

        <section className="official-form-evaluation">
          <h4>C. ASSESSMENT / EVALUATION</h4>
          <p>{review.assessment || "\u00a0"}</p>
          <div className="official-evaluation-lines"><span /><span /></div>
        </section>

        <section className="official-form-recommendation">
          <div className="official-recommendation-left">
            <h4>D. RECOMMENDATION</h4>
            <div className="official-check-grid">
              <div><span className="official-checkbox">{mark(approved)}</span><b>Approved</b></div>
              <div><span className="official-checkbox">{mark(rejected)}</span><b>Disapproved</b></div>
            </div>
            <div className="official-final-action">
              <h4>E. FINAL ACTION</h4>
              <strong>{approved ? "APPROVED" : rejected ? "DISAPPROVED" : "PENDING FINAL ACTION"}</strong>
              {review.remarks ? <p><b>Remarks:</b> {review.remarks}</p> : null}
            </div>
          </div>

          <div className={`official-mayor-approval ${approved ? "is-approved" : ""}`}>
            <span className="official-approval-caption">MUNICIPAL MAYOR'S APPROVAL</span>
            {approved && review.approvalSignatureDataUrl ? (
              <img className="official-mayor-signature" src={review.approvalSignatureDataUrl} alt="Authorized municipal mayor approval signature" />
            ) : (
              <div className="official-mayor-signature-space" />
            )}
            <span className="official-mayor-line" />
            <strong>{signatoryName}</strong>
            <small>{signatoryTitle}</small>
            {approved ? <em>Approved {formatDateTime(approvalDate)}</em> : <em>Signature appears after official approval.</em>}
          </div>
        </section>

        <footer className="official-form-footer">
          <div>
            <b>Application record:</b> {application.scholarshipTitle || "LGU Scholarship Program"}<br />
            <span>Submitted {formatDateTime(application.submittedAt)}</span>
          </div>
          <div className="official-form-verification">
            <b>Status:</b> {approved ? "APPROVED" : rejected ? "DISAPPROVED" : String(application.status || "PENDING").replaceAll("_", " ").toUpperCase()}<br />
            <span>Last updated {formatDateTime(application.updatedAt)}</span>
          </div>
        </footer>
      </section>

      {customEntries.length > 0 ? (
        <section className="official-print-sheet official-print-appendix">
          <header className="official-appendix-header">
            <img src="/paranas-seal.png" alt="Municipality of Paranas official seal" />
            <div>
              <span>LGU SCHOLARSHIP PROGRAM · MUNICIPALITY OF PARANAS</span>
              <h2>Additional Scholarship Information</h2>
              <p>{application.applicantName} · {application.scholarshipTitle}</p>
            </div>
          </header>
          <div className="official-appendix-grid">
            {customEntries.map(([label, value], index) => (
              <div key={label} className="official-appendix-item">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div><b>{label}</b><p>{Array.isArray(value) ? value.join(", ") : String(value)}</p></div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="official-print-sheet official-policy-sheet">
        <header className="official-policy-header">
          <img src="/paranas-seal.png" alt="Municipality of Paranas official seal" />
          <div>
            <p>Republic of the Philippines</p>
            <p>Province of Samar</p>
            <strong>MUNICIPALITY OF PARANAS</strong>
          </div>
        </header>

        <div className="official-policy-rule" />
        <h2>PALISIYA HAN MUNOCIPYO HA PROGRAMA HAN LGU-SCHOLARS</h2>

        <p className="official-policy-intro">
          Ako hi Mayor {policyMayorName} ha pagrepresentar han bungto han Paranas, ngan{" "}
          <span className="official-policy-inline">{valueOrLine(policyParentName)}</span>, nga kag-anak ni{" "}
          <span className="official-policy-inline">{valueOrLine(policyStudentName)}</span> nga taga Brgy.{" "}
          <span className="official-policy-inline official-policy-inline--short">{valueOrLine(policyBarangay)}</span>, Paranas, Samar,
          nauyon ngan magsusunod han mga palisiya nga guin dudumara hine nga programa.
        </p>

        <ol className="official-policy-list">
          <li>Ine nga programa para gudla han mga tuminongnong ngan rehistrado ha Paranas;</li>
          <li>Usa la nga anak ha kada pamilya an pwede makatagamtam han programa;</li>
          <li>An kantidad nga matatagamtaman ha kada semester dire malabaw hin <strong>SINGKO MIL (P 5,000.00) PESOS</strong> ha kada estudyante kada semester ano man nga kurso an iya kuhaon;</li>
          <li>Kumo kag-anak, responsibilidad ko an pagsuporta han iba pa nga mga panginahanglan han akon estudyante (board &amp; lodging, allowance, miscellaneous, etc.);</li>
          <li>Kinahanglan pasar an estudyante ha ngatanan nga kinuha nga mga subject; an hulog han grado, uutdon na ngan waray na tsantsa ha sunod nga mga tuig;</li>
          <li>An mga programa nga ipapatuman han munocipyo para ha kaupayan han barangay kinahanglan tangkod ngan tup-top nga pagtutumanon han estudyante;</li>
          <li>Magkakamay-ada duha nga ebaluwasyon ha kada semester para kita-on an pagtuman han mga kag-anak ngan estudyante an mga palisiya nga pagbubuhaton ha urhi nga Sabado hit Hulyo, Oktobre, Desyembre ngan Marso.</li>
        </ol>

        <p className="official-policy-closing">
          <strong>HA PAGKAMATUOD,</strong> kami nga mga benepisyado in nagpirma ngan kon anuman an mga pagkukulang o pagtalapas hine nga kasarabutan andam kami pag-akseptar han magigin desisyon han nagkakatin hine nga programa.
        </p>

        <div className="official-policy-signatures">
          <div className="official-policy-signature-block official-policy-parent-signature">
            {policy.parentSignatureDataUrl ? (
              <img src={policy.parentSignatureDataUrl} alt="Parent or guardian electronic signature" />
            ) : null}
            <span className="official-policy-signature-space" />
            <span className="official-policy-signature-line" />
            <strong>{policyParentName || "Kag-anak"}</strong>
            <small>Kag-anak / Guardian</small>
          </div>

          <div className="official-policy-signature-block official-policy-student-signature">
            {application.signatureDataUrl ? (
              <img src={application.signatureDataUrl} alt="Student electronic signature" />
            ) : null}
            <span className="official-policy-signature-space" />
            <span className="official-policy-signature-line" />
            <strong>{policyStudentName || "Estudyante"}</strong>
            <small>Estudyante</small>
          </div>
        </div>

        <div className="official-policy-mayor">
          {approved && review.approvalSignatureDataUrl ? (
            <img src={review.approvalSignatureDataUrl} alt="Authorized municipal mayor signature" />
          ) : (
            <span className="official-policy-mayor-space" />
          )}
          <strong>{signatoryName}</strong>
          <small>{signatoryTitle}</small>
        </div>

        <footer className="official-policy-footer">
          <span>{application.scholarshipTitle || "LGU Scholarship Program"}</span>
          <span>Application No. {application.scholarshipCode ? `${application.scholarshipCode}-${String(application.applicantUid || "").slice(0, 8).toUpperCase()}` : String(application.applicantUid || "").slice(0, 12).toUpperCase()}</span>
        </footer>
      </section>
    </div>
  );
}
