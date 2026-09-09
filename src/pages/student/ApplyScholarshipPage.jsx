import { ArrowLeft, ArrowRight, CheckCircle2, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import CustomQuestionField from "../../components/forms/CustomQuestionField";
import PhotoUploader from "../../components/forms/PhotoUploader";
import SignaturePad from "../../components/forms/SignaturePad";
import Loader from "../../components/common/Loader";
import { useAuth } from "../../hooks/useAuth";
import {
  getOwnApplication,
  resubmitApplication,
  submitApplication,
} from "../../services/application.service";
import { getPublicScholarship } from "../../services/scholarship.service";
import { humanizeFirebaseError } from "../../utils/validation";

const TOTAL_STEPS = 6;

const STEP_LABELS = [
  "Student Information",
  "Parent / Guardian",
  "Scholarship Questions",
  "Review",
  "Policy Agreement",
  "Certification",
];

const emptyForm = {
  student: {
    fullName: "",
    birthday: "",
    age: "",
    sex: "",
    address: "",
    phone: "",
    schoolGraduated: "",
    schoolYear: "",
    generalAverage: "",
    honors: "",
    course: "",
    schoolNamePlace: "",
    messenger: "",
    fourPs: "",
  },
  parents: {
    fatherName: "",
    fatherAge: "",
    fatherOccupation: "",
    motherName: "",
    motherAge: "",
    motherOccupation: "",
    numberOfChildren: "",
    grossMonthlyIncome: "",
    guardianName: "",
    guardianRelationship: "",
  },
  customAnswers: {},
  policyAgreement: {
    studentName: "",
    parentGuardianName: "",
    barangay: "",
    accepted: false,
    parentSignatureDataUrl: "",
  },
  certification: false,
};

export default function ApplyScholarshipPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [scholarship, setScholarship] = useState(null);
  const [existing, setExisting] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [photo, setPhoto] = useState("");
  const [signature, setSignature] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      getPublicScholarship(id),
      getOwnApplication(id, user.uid),
    ])
      .then(([program, app]) => {
        setScholarship(program);
        setExisting(app);

        if (app?.status === "revision_required") {
          const saved = app.formData || {};

          setForm({
            ...emptyForm,
            ...saved,
            student: {
              ...emptyForm.student,
              ...(saved.student || {}),
            },
            parents: {
              ...emptyForm.parents,
              ...(saved.parents || {}),
            },
            customAnswers: {
              ...(saved.customAnswers || {}),
            },
            policyAgreement: {
              ...emptyForm.policyAgreement,
              ...(saved.policyAgreement || {}),
              accepted: false,
              parentSignatureDataUrl: "",
            },
            // A revised application must be certified and signed again before resubmission.
            certification: false,
          });

          setPhoto(app.photoDataUrl || "");
          setSignature("");
        } else {
          setForm((current) => ({
            ...current,
            student: {
              ...current.student,
              fullName: profile?.fullName || "",
              phone: profile?.phone || "",
              address: profile?.address || "",
            },
            policyAgreement: {
              ...current.policyAgreement,
              studentName: current.policyAgreement.studentName || profile?.fullName || "",
              barangay:
                current.policyAgreement.barangay || extractBarangay(profile?.address || ""),
            },
          }));
        }
      })
      .finally(() => setLoading(false));
  }, [id, user.uid, profile?.fullName, profile?.phone, profile?.address]);

  const revising = existing?.status === "revision_required";
  const locked = existing && !revising;
  const progress = useMemo(
    () => Math.round((step / TOTAL_STEPS) * 100),
    [step]
  );

  const missingRequirements = useMemo(
    () => getMissingRequirements({ form, photo, scholarship }),
    [form, photo, scholarship]
  );

  function changeSection(section, key, value) {
    setForm((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [key]: value,
      },
    }));
  }

  function changeCustom(questionId, value) {
    setForm((current) => ({
      ...current,
      customAnswers: {
        ...current.customAnswers,
        [questionId]: value,
      },
    }));
  }

  function changePolicy(key, value) {
    setForm((current) => ({
      ...current,
      policyAgreement: {
        ...current.policyAgreement,
        [key]: value,
      },
    }));
  }

  function changePolicyStudentName(value) {
    setForm((current) => ({
      ...current,
      student: {
        ...current.student,
        fullName: value,
      },
      policyAgreement: {
        ...current.policyAgreement,
        studentName: value,
      },
    }));
  }

  function preparePolicyAgreement() {
    setForm((current) => {
      const policy = current.policyAgreement || emptyForm.policyAgreement;
      return {
        ...current,
        policyAgreement: {
          ...policy,
          studentName: policy.studentName || current.student.fullName || "",
          parentGuardianName:
            policy.parentGuardianName || chooseParentGuardian(current.parents),
          barangay: policy.barangay || extractBarangay(current.student.address),
        },
      };
    });
  }

  function validateStep(currentStep = step) {
    if (currentStep === 1) {
      const student = form.student;

      if (
        !student.fullName ||
        !student.birthday ||
        !student.sex ||
        !student.address ||
        !student.phone ||
        !student.course ||
        !student.schoolNamePlace
      ) {
        setError(
          "Please complete all required Student Information fields before continuing."
        );
        return false;
      }
    }

    if (currentStep === 2) {
      const parents = form.parents;

      if (
        !parents.fatherName &&
        !parents.motherName &&
        !parents.guardianName
      ) {
        setError(
          "Please provide at least one parent or guardian name before continuing."
        );
        return false;
      }
    }

    if (currentStep === 3) {
      for (const question of scholarship?.customQuestions || []) {
        const value = form.customAnswers[question.id];

        if (
          question.required &&
          (!value || (Array.isArray(value) && value.length === 0))
        ) {
          setError(`Please answer the required question: ${question.label}`);
          return false;
        }
      }
    }

    if (currentStep === 5) {
      const policyMissing = getMissingPolicyRequirements(form.policyAgreement);
      if (policyMissing.length > 0) {
        setError(
          `Please complete the LGU Scholars Policy Agreement before continuing: ${policyMissing.join(", ")}.`
        );
        return false;
      }
    }

    setError("");
    return true;
  }

  function goToStep(targetStep) {
    setError("");
    setStep(targetStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function next() {
    if (step <= 3 && !validateStep(step)) return;

    if (step === 4 && missingRequirements.length > 0) {
      setError(
        `Your application still has ${missingRequirements.length} required ${
          missingRequirements.length === 1 ? "item" : "items"
        } to complete. Please review the items marked "Required" below.`
      );
      return;
    }

    if (step === 4) {
      preparePolicyAgreement();
    }

    if (step === 5 && !validateStep(5)) return;

    setError("");
    setStep((current) => Math.min(TOTAL_STEPS, current + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit(event) {
    event.preventDefault();
    setError("");

    const missing = getMissingRequirements({ form, photo, scholarship });

    if (missing.length > 0) {
      setStep(4);
      setError(
        "Your application is incomplete. Please review and complete all required information before submitting."
      );
      return;
    }

    const policyMissing = getMissingPolicyRequirements(form.policyAgreement);
    if (policyMissing.length > 0) {
      setStep(5);
      setError(
        "Please complete and sign the LGU Scholars Policy Agreement before submitting your application."
      );
      return;
    }

    if (!form.certification) {
      setError(
        "Please confirm the certification statement before submitting your application."
      );
      return;
    }

    if (scholarship.requireSignature !== false && !signature) {
      setError("Please provide your electronic signature before submitting.");
      return;
    }

    setSubmitting(true);

    try {
      if (revising) {
        await resubmitApplication({
          scholarshipId: id,
          user,
          formData: form,
          photoDataUrl: photo,
          signatureDataUrl: signature,
        });
      } else {
        await submitApplication({
          scholarship,
          user,
          profile,
          formData: form,
          photoDataUrl: photo,
          signatureDataUrl: signature,
        });
      }

      navigate(`/student/applications/${id}`, { replace: true });
    } catch (err) {
      setError(humanizeFirebaseError(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <Loader fullPage label="Preparing application form…" />;
  }

  if (!scholarship) {
    return (
      <div className="panel-card">
        <h1>Scholarship Unavailable</h1>
        <p>This scholarship is not currently published.</p>
      </div>
    );
  }

  if (locked) {
    return (
      <div className="panel-card">
        <h1>Application Already Submitted</h1>
        <p>
          Your application is currently locked while it is under review.
        </p>
        <Link
          className="button button-primary"
          to={`/student/applications/${id}`}
        >
          View Application
        </Link>
      </div>
    );
  }

  const studentReviewRows = [
    { label: "Complete Name", value: form.student.fullName, required: true },
    { label: "Birthday", value: form.student.birthday, required: true },
    { label: "Age", value: form.student.age },
    { label: "Sex", value: form.student.sex, required: true },
    { label: "Cellphone Number", value: form.student.phone, required: true },
    { label: "4Ps Member", value: form.student.fourPs },
    { label: "Complete Address", value: form.student.address, required: true },
    { label: "School Graduated", value: form.student.schoolGraduated },
    { label: "School Year", value: form.student.schoolYear },
    { label: "General Average", value: form.student.generalAverage },
    { label: "Honors Received", value: form.student.honors },
    { label: "Course to Be Taken", value: form.student.course, required: true },
    {
      label: "College / University Name",
      value: form.student.schoolNamePlace,
      required: true,
    },
    { label: "Facebook Account", value: form.student.messenger },
  ];

  const parentReviewRows = [
    { label: "Father's Name", value: form.parents.fatherName },
    { label: "Father's Age", value: form.parents.fatherAge },
    { label: "Father's Occupation", value: form.parents.fatherOccupation },
    { label: "Mother's Name", value: form.parents.motherName },
    { label: "Mother's Age", value: form.parents.motherAge },
    { label: "Mother's Occupation", value: form.parents.motherOccupation },
    { label: "Number of Children", value: form.parents.numberOfChildren },
    {
      label: "Gross Monthly Family Income",
      value: form.parents.grossMonthlyIncome
        ? `PHP ${form.parents.grossMonthlyIncome}`
        : "",
    },
    { label: "Guardian Name", value: form.parents.guardianName },
    {
      label: "Guardian Relationship",
      value: form.parents.guardianRelationship,
    },
  ];

  const customReviewRows = (scholarship.customQuestions || []).map(
    (question) => ({
      label: question.label,
      value: form.customAnswers[question.id],
      required: question.required,
    })
  );

  const hasParentOrGuardian = Boolean(
    form.parents.fatherName || form.parents.motherName || form.parents.guardianName
  );

  const studentHasMissing = missingRequirements.some(
    (item) => item.step === 1
  );
  const parentHasMissing = missingRequirements.some((item) => item.step === 2);
  const questionsHaveMissing = missingRequirements.some(
    (item) => item.step === 3
  );

  return (
    <div className="application-form-page">
      <Link to={`/scholarships/${id}`} className="back-link">
        <ArrowLeft size={17} /> Scholarship Details
      </Link>

      <div className="google-form-banner application-hero">
        <div>
          <span>
            {revising ? "REVISION REQUEST" : "OFFICIAL ONLINE APPLICATION"}
          </span>
          <h1>{scholarship.title}</h1>
          <p>
            Complete the required information, review your application, sign the
            LGU Scholars Policy Agreement, and certify it before final submission.
          </p>
        </div>

        <div className="form-progress-box">
          <strong>{progress}%</strong>
          <span>
            Step {step} of {TOTAL_STEPS}
          </span>
        </div>
      </div>

      <ApplicationStepper currentStep={step} />

      <div className="application-instructions">
        <span>
          Required fields are marked with <b>*</b>.
        </span>
        <span>You will review all entries and complete the policy agreement before final submission.</span>
      </div>

      {revising && existing?.adminReview?.remarks ? (
        <div className="revision-banner">
          <strong>Administrator Revision Request</strong>
          <p>{existing.adminReview.remarks}</p>
        </div>
      ) : null}

      {error ? (
        <div className="form-alert error sticky-alert" role="alert">
          {error}
        </div>
      ) : null}

      <form onSubmit={submit}>
        {step === 1 ? (
          <FormSection
            title="A. Student Information"
            description="Enter your personal, contact, and academic information exactly as it should appear on the official scholarship application."
          >
            <PhotoUploader
              value={photo}
              onChange={setPhoto}
              required={scholarship.requirePhoto !== false}
            />

            <FormSubsection
              title="Personal Details"
              description="Provide your basic personal information."
            >
              <div className="form-grid application-grid">
                <Field label="Complete Name" required full>
                  <input
                    autoComplete="name"
                    value={form.student.fullName}
                    onChange={(event) =>
                      changeSection("student", "fullName", event.target.value)
                    }
                  />
                </Field>

                <Field label="Birthday" required>
                  <input
                    type="date"
                    value={form.student.birthday}
                    onChange={(event) =>
                      changeSection("student", "birthday", event.target.value)
                    }
                  />
                </Field>

                <Field label="Age">
                  <input
                    type="number"
                    min="1"
                    inputMode="numeric"
                    value={form.student.age}
                    onChange={(event) =>
                      changeSection("student", "age", event.target.value)
                    }
                  />
                </Field>

                <Field label="Sex" required>
                  <select
                    value={form.student.sex}
                    onChange={(event) =>
                      changeSection("student", "sex", event.target.value)
                    }
                  >
                    <option value="">Select an option</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Prefer not to say</option>
                  </select>
                </Field>

                <Field label="4Ps Member">
                  <select
                    value={form.student.fourPs}
                    onChange={(event) =>
                      changeSection("student", "fourPs", event.target.value)
                    }
                  >
                    <option value="">Select an option</option>
                    <option>Yes</option>
                    <option>No</option>
                  </select>
                </Field>
              </div>
            </FormSubsection>

            <FormSubsection
              title="Contact Details"
              description="Use contact details that the scholarship office can reach."
            >
              <div className="form-grid application-grid">
                <Field label="Cellphone Number" required>
                  <input
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    placeholder="e.g. 09XXXXXXXXX"
                    value={form.student.phone}
                    onChange={(event) =>
                      changeSection("student", "phone", event.target.value)
                    }
                  />
                </Field>

                <Field label="Facebook Account">
                  <input
                    placeholder="Facebook name or profile link"
                    value={form.student.messenger}
                    onChange={(event) =>
                      changeSection("student", "messenger", event.target.value)
                    }
                  />
                </Field>

                <Field label="Complete Address" required full>
                  <textarea
                    rows="3"
                    autoComplete="street-address"
                    placeholder="House / Street / Barangay / Municipality / Province"
                    value={form.student.address}
                    onChange={(event) =>
                      changeSection("student", "address", event.target.value)
                    }
                  />
                </Field>
              </div>
            </FormSubsection>

            <FormSubsection
              title="Academic Details"
              description="Provide your most recent school information, intended course, and college or university."
            >
              <div className="form-grid application-grid">
                <Field label="School Graduated">
                  <input
                    value={form.student.schoolGraduated}
                    onChange={(event) =>
                      changeSection(
                        "student",
                        "schoolGraduated",
                        event.target.value
                      )
                    }
                  />
                </Field>

                <Field label="School Year">
                  <input
                    value={form.student.schoolYear}
                    onChange={(event) =>
                      changeSection("student", "schoolYear", event.target.value)
                    }
                    placeholder="e.g. 2025–2026"
                  />
                </Field>

                <Field label="General Average">
                  <input
                    inputMode="decimal"
                    value={form.student.generalAverage}
                    onChange={(event) =>
                      changeSection(
                        "student",
                        "generalAverage",
                        event.target.value
                      )
                    }
                  />
                </Field>

                <Field label="Honors Received">
                  <input
                    value={form.student.honors}
                    onChange={(event) =>
                      changeSection("student", "honors", event.target.value)
                    }
                    placeholder="Leave blank if none"
                  />
                </Field>

                <Field label="Course to Be Taken" required full>
                  <input
                    value={form.student.course}
                    onChange={(event) =>
                      changeSection("student", "course", event.target.value)
                    }
                  />
                </Field>

                <Field label="College / University Name" required full>
                  <input
                    placeholder="Enter college or university name"
                    value={form.student.schoolNamePlace}
                    onChange={(event) =>
                      changeSection(
                        "student",
                        "schoolNamePlace",
                        event.target.value
                      )
                    }
                  />
                </Field>
              </div>
            </FormSubsection>
          </FormSection>
        ) : null}

        {step === 2 ? (
          <FormSection
            title="B. Parent / Guardian Information"
            description="Provide the family information requested for scholarship evaluation. At least one parent or guardian name is required."
          >
            <FormSubsection
              title="Parent Details"
              description="Complete the available information for your parent or parents."
            >
              <div className="form-grid application-grid">
                <Field label="Father's Name">
                  <input
                    value={form.parents.fatherName}
                    onChange={(event) =>
                      changeSection("parents", "fatherName", event.target.value)
                    }
                  />
                </Field>

                <Field label="Father's Age">
                  <input
                    type="number"
                    min="1"
                    inputMode="numeric"
                    value={form.parents.fatherAge}
                    onChange={(event) =>
                      changeSection("parents", "fatherAge", event.target.value)
                    }
                  />
                </Field>

                <Field label="Father's Occupation" full>
                  <input
                    value={form.parents.fatherOccupation}
                    onChange={(event) =>
                      changeSection(
                        "parents",
                        "fatherOccupation",
                        event.target.value
                      )
                    }
                  />
                </Field>

                <Field label="Mother's Name">
                  <input
                    value={form.parents.motherName}
                    onChange={(event) =>
                      changeSection("parents", "motherName", event.target.value)
                    }
                  />
                </Field>

                <Field label="Mother's Age">
                  <input
                    type="number"
                    min="1"
                    inputMode="numeric"
                    value={form.parents.motherAge}
                    onChange={(event) =>
                      changeSection("parents", "motherAge", event.target.value)
                    }
                  />
                </Field>

                <Field label="Mother's Occupation" full>
                  <input
                    value={form.parents.motherOccupation}
                    onChange={(event) =>
                      changeSection(
                        "parents",
                        "motherOccupation",
                        event.target.value
                      )
                    }
                  />
                </Field>
              </div>
            </FormSubsection>

            <FormSubsection
              title="Household and Guardian Details"
              description="Add household information and guardian details when applicable."
            >
              <div className="form-grid application-grid">
                <Field label="Number of Children">
                  <input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    value={form.parents.numberOfChildren}
                    onChange={(event) =>
                      changeSection(
                        "parents",
                        "numberOfChildren",
                        event.target.value
                      )
                    }
                  />
                </Field>

                <Field label="Gross Monthly Family Income">
                  <input
                    type="number"
                    min="0"
                    inputMode="decimal"
                    value={form.parents.grossMonthlyIncome}
                    onChange={(event) =>
                      changeSection(
                        "parents",
                        "grossMonthlyIncome",
                        event.target.value
                      )
                    }
                    placeholder="PHP"
                  />
                </Field>

                <Field label="Guardian Name">
                  <input
                    value={form.parents.guardianName}
                    onChange={(event) =>
                      changeSection(
                        "parents",
                        "guardianName",
                        event.target.value
                      )
                    }
                  />
                </Field>

                <Field label="Guardian Relationship">
                  <input
                    value={form.parents.guardianRelationship}
                    onChange={(event) =>
                      changeSection(
                        "parents",
                        "guardianRelationship",
                        event.target.value
                      )
                    }
                  />
                </Field>
              </div>
            </FormSubsection>
          </FormSection>
        ) : null}

        {step === 3 ? (
          <FormSection
            title="C. Scholarship-Specific Questions"
            description={
              scholarship.customQuestions?.length
                ? "Answer the additional questions required for this scholarship program."
                : "This scholarship has no additional questions."
            }
          >
            {scholarship.customQuestions?.length ? (
              <div className="custom-question-list">
                {scholarship.customQuestions.map((question, index) => (
                  <div className="custom-question-card" key={question.id}>
                    <div className="custom-question-number">
                      Question {index + 1}
                    </div>
                    <label htmlFor={question.id}>
                      {question.label}
                      {question.required ? <b> *</b> : null}
                    </label>
                    <CustomQuestionField
                      question={question}
                      value={form.customAnswers[question.id]}
                      onChange={(value) => changeCustom(question.id, value)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="compact-empty">
                <CheckCircle2 size={24} />
                <p>No additional questions are required for this program.</p>
              </div>
            )}
          </FormSection>
        ) : null}

        {step === 4 ? (
          <FormSection
            title="D. Review Your Application"
            description="Review every section carefully. Required information must be complete before you can proceed to certification and electronic signature."
          >
            <div className="application-review">
              <div
                className={`application-review-status ${
                  missingRequirements.length ? "needs-attention" : "complete"
                }`}
              >
                <div className="application-review-status-icon">
                  <CheckCircle2 size={22} />
                </div>
                <div>
                  <strong>
                    {missingRequirements.length
                      ? "Application Needs Attention"
                      : "Application Ready for Certification"}
                  </strong>
                  <p>
                    {missingRequirements.length
                      ? `${missingRequirements.length} required ${
                          missingRequirements.length === 1 ? "item is" : "items are"
                        } still incomplete.`
                      : "All required information is complete. Please verify that every entry is accurate before continuing."}
                  </p>
                </div>
              </div>

              {missingRequirements.length ? (
                <div className="review-missing-list">
                  <div className="review-missing-heading">
                    <strong>Required Items to Complete</strong>
                    <span>Please return to the indicated section.</span>
                  </div>
                  <div className="review-missing-items">
                    {missingRequirements.map((item) => (
                      <button
                        key={`${item.step}-${item.label}`}
                        type="button"
                        className="review-missing-item"
                        onClick={() => goToStep(item.step)}
                      >
                        <span>{item.label}</span>
                        <small>Edit Section {item.step}</small>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <ReviewSection
                title="Student Information"
                rows={studentReviewRows}
                onEdit={() => goToStep(1)}
                hasIssue={studentHasMissing}
              >
                <div className="review-photo-block">
                  {photo ? (
                    <img src={photo} alt="Applicant 2x2 preview" />
                  ) : (
                    <div className="review-photo-placeholder">2×2</div>
                  )}
                  <div>
                    <strong>Applicant 2×2 Photo</strong>
                    <span
                      className={
                        scholarship.requirePhoto !== false && !photo
                          ? "review-required-text"
                          : ""
                      }
                    >
                      {photo
                        ? "Photo uploaded"
                        : scholarship.requirePhoto !== false
                          ? "Required — not uploaded"
                          : "Not provided"}
                    </span>
                  </div>
                </div>
              </ReviewSection>

              <ReviewSection
                title="Parent / Guardian Information"
                rows={parentReviewRows}
                onEdit={() => goToStep(2)}
                hasIssue={parentHasMissing}
                note={
                  hasParentOrGuardian
                    ? "Parent / guardian requirement satisfied."
                    : "At least one parent or guardian name is required."
                }
              />

              <ReviewSection
                title="Scholarship-Specific Questions"
                rows={customReviewRows}
                onEdit={() => goToStep(3)}
                hasIssue={questionsHaveMissing}
                emptyText="No additional scholarship questions are required."
              />

              <div className="policy-next-step-note">
                <strong>Next: LGU Scholars Policy Agreement</strong>
                <p>
                  After this review, the official policy agreement will open with your
                  information pre-filled. You can verify or edit the required policy details
                  before signing it.
                </p>
              </div>
            </div>
          </FormSection>
        ) : null}

        {step === 5 ? (
          <FormSection
            title="E. LGU Scholars Policy Agreement"
            description="Review the official municipal scholarship policy, complete the required agreement information, and obtain the parent or guardian electronic signature. This information will be submitted to the administrator with your application."
          >
            <div className="policy-form-document">
              <header className="policy-form-header">
                <img src="/paranas-seal.png" alt="Municipality of Paranas seal" />
                <div>
                  <span>Republic of the Philippines</span>
                  <span>Province of Samar</span>
                  <strong>MUNICIPALITY OF PARANAS</strong>
                </div>
              </header>

              <div className="policy-form-rule" />
              <h3>PALISIYA HAN MUNOCIPYO HA PROGRAMA HAN LGU-SCHOLARS</h3>

              <div className="policy-form-fields">
                <Field label="Parent / Guardian Name" required>
                  <input
                    value={form.policyAgreement.parentGuardianName}
                    onChange={(event) =>
                      changePolicy("parentGuardianName", event.target.value)
                    }
                    placeholder="Name of parent or legal guardian"
                  />
                </Field>

                <Field label="Student Name" required>
                  <input
                    value={form.policyAgreement.studentName}
                    onChange={(event) => changePolicyStudentName(event.target.value)}
                    placeholder="Complete Name"
                  />
                </Field>

                <Field label="Barangay" required full>
                  <input
                    value={form.policyAgreement.barangay}
                    onChange={(event) => changePolicy("barangay", event.target.value)}
                    placeholder="e.g. Brgy. Poblacion 1"
                  />
                </Field>
              </div>

              <p className="policy-form-intro">
                Ako hi Mayor Elvira U. Babalcon ha pagrepresentar han bungto han Paranas,
                ngan <strong>{form.policyAgreement.parentGuardianName || "[Parent / Guardian]"}</strong>,
                komo kag anak ni <strong>{form.policyAgreement.studentName || "[Student Name]"}</strong>
                nga taga Brgy. <strong>{form.policyAgreement.barangay || "[Barangay]"}</strong>,
                Paranas, Samar, nauyon ngan magsusunod han mga palisiya nga guin dudumara
                hine nga programa.
              </p>

              <ol className="policy-form-list">
                <li>Ine nga programa para gudla han mga tuminongnong ngan rehistrado ha Paranas;</li>
                <li>Usa la nga anak ha kada pamilya an pwede makatagamtam han programa;</li>
                <li>An kantidad nga matatagamtaman ha kada semester dire malabaw hin <strong>SINGKO MIL (P 5,000.00) PESOS</strong> ha kada estudyante kada semester ano man nga kurso an iya kuhaon;</li>
                <li>Kumo kag-anak, responsibilidad ko an pagsuporta han iba pa nga mga panginahanglan han akon estudyante (board &amp; lodging, allowance, miscellaneous, etc.);</li>
                <li>Kinahanglan pasar an estudyante ha ngatanan nga kinuha nga mga subject; an hulog han grado, uutdon na ngan waray na tsantsa ha sunod nga mga tuig;</li>
                <li>An mga programa nga ipapatuman han munocipyo para ha kaupayan han barangay kinahanglan tangkod ngan tup-top nga pagtutumanon han estudyante;</li>
                <li>Magkakamay-ada duha nga ebaluwasyon ha kada semester para kita-on an pagtuman han mga kag-anak ngan estudyante an mga palisiya nga pagbubuhaton ha urhi nga Sabado hit Hulyo, Oktobre, Desyembre ngan Marso.</li>
              </ol>

              <p className="policy-form-closing">
                <strong>HA PAGKAMATUOD,</strong> kami nga mga benepisyado in nagpirma ngan kon
                anuman an mga pagkukulang o pagtalapas hine nga kasarabutan andam kami
                pag-akseptar han magigin desisyon han nagkakatin hine nga programa.
              </p>

              <div className="policy-parent-signature-block">
                <div className="policy-signature-heading">
                  <span>Parent / Guardian Electronic Signature</span>
                  <small>
                    The parent or guardian named above should sign inside the box below.
                  </small>
                </div>
                <SignaturePad
                  value={form.policyAgreement.parentSignatureDataUrl}
                  onChange={(value) => changePolicy("parentSignatureDataUrl", value)}
                  required
                  label="Parent / Guardian Signature"
                  helpText="The parent or legal guardian should sign using the mouse, touchscreen, stylus, or trackpad. This signature will be included in the submitted policy agreement and official printout."
                />
              </div>

              <label className="policy-acceptance-box">
                <input
                  type="checkbox"
                  checked={form.policyAgreement.accepted}
                  onChange={(event) => changePolicy("accepted", event.target.checked)}
                />
                <span>
                  <strong>We have read and agree to the LGU Scholars Policy.</strong>
                  The student and parent / guardian understand that this agreement forms
                  part of the scholarship application submitted to the Municipality of Paranas.
                </span>
              </label>
            </div>
          </FormSection>
        ) : null}

        {step === 6 ? (
          <FormSection
            title="F. Certification and Electronic Signature"
            description="Certify that your information is true and complete, then sign electronically to submit your application."
          >
            <div className="certification-ready-card">
              <CheckCircle2 size={22} />
              <div>
                <strong>Application Reviewed</strong>
                <p>
                  You may return to the previous step if you need to make any
                  final changes before signing.
                </p>
              </div>
            </div>

            <label className="certification-box">
              <input
                type="checkbox"
                checked={form.certification}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    certification: event.target.checked,
                  }))
                }
              />
              <span>
                <strong>I hereby certify</strong> that the information provided
                in this application is true, complete, and correct. I understand
                that false or misleading information may result in
                disqualification from the LGU Scholarship Program.
              </span>
            </label>

            <SignaturePad
              value={signature}
              onChange={setSignature}
              required={scholarship.requireSignature !== false}
            />
          </FormSection>
        ) : null}

        <div className="application-form-actions">
          {step > 1 ? (
            <button
              type="button"
              className="button button-secondary"
              onClick={() => goToStep(step - 1)}
            >
              <ArrowLeft size={17} /> Previous
            </button>
          ) : (
            <span />
          )}

          {step < TOTAL_STEPS ? (
            <button
              type="button"
              className="button button-primary"
              onClick={next}
            >
              {step === 4
                ? "Continue to Policy Agreement"
                : step === 5
                  ? "Continue to Certification"
                  : "Continue"}
              <ArrowRight size={17} />
            </button>
          ) : (
            <button
              type="submit"
              className="button button-primary application-submit-button"
              disabled={submitting}
            >
              <Save size={17} />
              {submitting
                ? revising
                  ? "Resubmitting…"
                  : "Submitting…"
                : revising
                  ? "Resubmit Revised Application"
                  : "Submit Application"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function ApplicationStepper({ currentStep }) {
  return (
    <nav className="application-stepper" aria-label="Application progress">
      {STEP_LABELS.map((label, index) => {
        const stepNumber = index + 1;
        const complete = stepNumber < currentStep;
        const active = stepNumber === currentStep;

        return (
          <div
            key={label}
            className={`application-step ${active ? "active" : ""} ${
              complete ? "complete" : ""
            }`}
            aria-current={active ? "step" : undefined}
          >
            <div className="application-step-number">
              {complete ? <CheckCircle2 size={16} /> : stepNumber}
            </div>
            <div className="application-step-copy">
              <small>Step {stepNumber}</small>
              <strong>{label}</strong>
            </div>
          </div>
        );
      })}
    </nav>
  );
}

function FormSection({ title, description, children }) {
  return (
    <section className="google-form-section scholarship-form-section">
      <div className="google-section-accent" />
      <div className="google-section-heading">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {children}
    </section>
  );
}

function FormSubsection({ title, description, children }) {
  return (
    <div className="application-subsection">
      <div className="application-subsection-heading">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      {children}
    </div>
  );
}

function Field({ label, required = false, full = false, children }) {
  return (
    <label className={`field-label application-field ${full ? "full" : ""}`}>
      <span className="application-field-label">
        {label}
        {required ? (
          <b className="required-mark" aria-label="required">
            *
          </b>
        ) : null}
      </span>
      {children}
    </label>
  );
}

function ReviewSection({
  title,
  rows,
  onEdit,
  hasIssue = false,
  note = "",
  emptyText = "No information provided.",
  children,
}) {
  return (
    <section className={`application-review-card ${hasIssue ? "has-issue" : ""}`}>
      <div className="application-review-card-header">
        <div>
          <span className={`review-section-status ${hasIssue ? "issue" : "ok"}`}>
            {hasIssue ? "Needs Attention" : "Reviewed"}
          </span>
          <h3>{title}</h3>
        </div>
        <button type="button" className="review-edit-button" onClick={onEdit}>
          Edit
        </button>
      </div>

      {children}

      {note ? (
        <p className={`review-section-note ${hasIssue ? "issue" : ""}`}>
          {note}
        </p>
      ) : null}

      {rows?.length ? (
        <dl className="application-review-grid">
          {rows.map((row) => {
            const missing = row.required && isBlank(row.value);
            return (
              <div
                className={`application-review-row ${missing ? "missing" : ""}`}
                key={row.label}
              >
                <dt>{row.label}</dt>
                <dd>{displayValue(row.value, missing)}</dd>
              </div>
            );
          })}
        </dl>
      ) : (
        <p className="review-empty-text">{emptyText}</p>
      )}
    </section>
  );
}

function displayValue(value, requiredMissing = false) {
  if (Array.isArray(value)) {
    return value.length ? value.join(", ") : requiredMissing ? "Required" : "Not provided";
  }

  if (isBlank(value)) {
    return requiredMissing ? "Required" : "Not provided";
  }

  return String(value);
}

function isBlank(value) {
  if (Array.isArray(value)) return value.length === 0;
  return value === undefined || value === null || String(value).trim() === "";
}

function chooseParentGuardian(parents = {}) {
  return parents.guardianName || parents.motherName || parents.fatherName || "";
}

function extractBarangay(address) {
  const text = String(address || "").trim();
  if (!text) return "";

  const explicit = text.match(/(?:brgy\.?|barangay)\s+([^,;]+)/i);
  if (explicit?.[1]) return explicit[1].trim();

  const parts = text
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => !/^paranas$/i.test(part) && !/^samar$/i.test(part));

  return parts.length ? parts[parts.length - 1] : "";
}

function getMissingPolicyRequirements(policy = {}) {
  const missing = [];
  if (isBlank(policy.studentName)) missing.push("Student Name");
  if (isBlank(policy.parentGuardianName)) missing.push("Parent / Guardian Name");
  if (isBlank(policy.barangay)) missing.push("Barangay");
  if (!policy.parentSignatureDataUrl) missing.push("Parent / Guardian Signature");
  if (!policy.accepted) missing.push("Policy Agreement Confirmation");
  return missing;
}

function getMissingRequirements({ form, photo, scholarship }) {
  if (!scholarship) return [];

  const missing = [];
  const student = form?.student || {};
  const parents = form?.parents || {};
  const customAnswers = form?.customAnswers || {};

  const require = (step, label, value) => {
    if (isBlank(value)) missing.push({ step, label });
  };

  if (scholarship.requirePhoto !== false && !photo) {
    missing.push({ step: 1, label: "Applicant 2×2 Photo" });
  }

  require(1, "Complete Name", student.fullName);
  require(1, "Birthday", student.birthday);
  require(1, "Sex", student.sex);
  require(1, "Cellphone Number", student.phone);
  require(1, "Complete Address", student.address);
  require(1, "Course to Be Taken", student.course);
  require(1, "College / University Name", student.schoolNamePlace);

  if (!parents.fatherName && !parents.motherName && !parents.guardianName) {
    missing.push({ step: 2, label: "Parent or Guardian Name" });
  }

  for (const question of scholarship.customQuestions || []) {
    if (question.required && isBlank(customAnswers[question.id])) {
      missing.push({ step: 3, label: question.label });
    }
  }

  return missing;
}
