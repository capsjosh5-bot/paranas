import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  FileText,
  GraduationCap,
  WalletCards,
  Plus,
  Save,
  Settings2,
  TicketCheck,
  Trash2,
  UsersRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Loader from "../../components/common/Loader";
import PageHeader from "../../components/common/PageHeader";
import { useAuth } from "../../hooks/useAuth";
import {
  createScholarship,
  getAdminScholarship,
  updateScholarship,
} from "../../services/scholarship.service";
import { humanizeFirebaseError } from "../../utils/validation";

const blank = {
  title: "",
  code: "",
  category: "General Scholarship",
  description: "",
  benefits: "",
  eligibility: "",
  academicYear: "",
  semester: "",
  amount: "",
  maxApplicants: 50,
  openDate: "",
  closeDate: "",
  requirements: [
    "2×2 applicant photo",
    "Completed online application form",
    "Electronic signature",
  ],
  customQuestions: [],
  requirePhoto: true,
  requireSignature: true,
  status: "",
};

const steps = [
  {
    label: "Program Details",
    short: "Details",
    description: "Basic public information",
    icon: FileText,
  },
  {
    label: "Schedule & Grant",
    short: "Schedule",
    description: "Dates, funding, and slots",
    icon: CalendarDays,
  },
  {
    label: "Eligibility & Requirements",
    short: "Requirements",
    description: "Who may apply and what to prepare",
    icon: ClipboardCheck,
  },
  {
    label: "Application Questions",
    short: "Questions",
    description: "Optional program-specific questions",
    icon: FileText,
  },
  {
    label: "Review & Publish",
    short: "Review",
    description: "Confirm everything before saving",
    icon: Eye,
  },
];

const choiceTypes = ["select", "radio", "checkbox"];

export default function ScholarshipEditorPage() {
  const { id } = useParams();
  const editing = Boolean(id);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(blank);
  const [step, setStep] = useState(0);
  const [furthestStep, setFurthestStep] = useState(editing ? steps.length - 1 : 0);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [publishConfirmOpen, setPublishConfirmOpen] = useState(false);

  useEffect(() => {
    if (!editing) return;

    getAdminScholarship(id)
      .then((data) => {
        if (data) setForm({ ...blank, ...data });
        else setError("Scholarship program could not be found.");
      })
      .catch((err) => setError(humanizeFirebaseError(err)))
      .finally(() => setLoading(false));
  }, [editing, id]);

  const completion = useMemo(() => {
    const checks = [
      Boolean(form.title?.trim()),
      Boolean(form.closeDate),
      Number(form.maxApplicants) >= 1,
      Boolean(form.description?.trim()),
      Boolean(form.eligibility?.trim()),
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [form]);

  function change(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function addRequirement() {
    change("requirements", [...(form.requirements || []), ""]);
  }

  function changeRequirement(index, value) {
    change(
      "requirements",
      (form.requirements || []).map((item, currentIndex) =>
        currentIndex === index ? value : item,
      ),
    );
  }

  function removeRequirement(index) {
    change(
      "requirements",
      (form.requirements || []).filter((_, currentIndex) => currentIndex !== index),
    );
  }

  function addQuestion() {
    change("customQuestions", [
      ...(form.customQuestions || []),
      {
        id: `q_${Date.now()}`,
        label: "",
        type: "text",
        required: false,
        options: [],
      },
    ]);
  }

  function updateQuestion(index, key, value) {
    change(
      "customQuestions",
      (form.customQuestions || []).map((question, currentIndex) =>
        currentIndex === index ? { ...question, [key]: value } : question,
      ),
    );
  }

  function removeQuestion(index) {
    change(
      "customQuestions",
      (form.customQuestions || []).filter((_, currentIndex) => currentIndex !== index),
    );
  }

  function validateStep(stepIndex) {
    if (stepIndex === 0) {
      if (!form.title?.trim()) return "Enter the Scholarship Title before continuing.";
    }

    if (stepIndex === 1) {
      if (!form.closeDate) return "Set the Application Deadline before continuing.";
      if (Number(form.maxApplicants) < 1) return "Maximum Applicants must be at least 1.";
      if (form.openDate && form.closeDate && form.openDate > form.closeDate) {
        return "Application Opening Date cannot be later than the Application Deadline.";
      }
      if (Number(form.amount || 0) < 0) return "Grant Amount cannot be negative.";
    }

    if (stepIndex === 3) {
      const questions = form.customQuestions || [];
      for (let index = 0; index < questions.length; index += 1) {
        const question = questions[index];
        if (!question.label?.trim()) {
          return `Complete or remove Question ${index + 1} before continuing.`;
        }
        if (choiceTypes.includes(question.type)) {
          const options = (question.options || []).map((item) => String(item).trim()).filter(Boolean);
          if (options.length < 2) {
            return `Question ${index + 1} needs at least two answer options.`;
          }
        }
      }
    }

    return "";
  }

  function validateAll() {
    for (let index = 0; index < 4; index += 1) {
      const message = validateStep(index);
      if (message) return { message, stepIndex: index };
    }
    return null;
  }

  function goNext() {
    const message = validateStep(step);
    if (message) {
      setError(message);
      return;
    }

    setError("");
    const nextStep = Math.min(step + 1, steps.length - 1);
    setStep(nextStep);
    setFurthestStep((current) => Math.max(current, nextStep));
  }

  function goBack() {
    setError("");
    setStep((current) => Math.max(0, current - 1));
  }

  function goToStep(index) {
    if (index > furthestStep) return;
    setError("");
    setStep(index);
  }

  async function persist(nextForm) {
    if (editing) await updateScholarship(id, nextForm, user.uid);
    else await createScholarship(nextForm, user.uid);
    navigate("/admin/scholarships");
  }

  async function saveWithStatus(status) {
    setSaving(true);
    try {
      await persist({ ...form, status });
    } catch (err) {
      setError(humanizeFirebaseError(err));
    } finally {
      setSaving(false);
    }
  }

  async function saveDraftAndExit() {
    setError("");
    if (!form.title?.trim()) {
      setStep(0);
      setError("Enter the Scholarship Title before saving a draft.");
      return;
    }

    await saveWithStatus("draft");
  }

  function submit(event) {
    event.preventDefault();
    if (step !== steps.length - 1) return;

    setError("");
    const validation = validateAll();
    if (validation) {
      setStep(validation.stepIndex);
      setError(validation.message);
      return;
    }

    if (!form.status) {
      setError("Choose whether to Save as Draft or Publish the Scholarship before continuing.");
      return;
    }

    if (form.status === "published") {
      setPublishConfirmOpen(true);
      return;
    }

    void saveWithStatus(form.status);
  }

  function confirmPublish() {
    setPublishConfirmOpen(false);
    setError("");
    void saveWithStatus("published");
  }

  if (loading) return <Loader fullPage label="Loading scholarship editor…" />;

  return (
    <div className="admin-page-pro scholarship-wizard-page">
      <PageHeader
        eyebrow={editing ? "EDIT SCHOLARSHIP" : "CREATE SCHOLARSHIP"}
        title={editing ? "Edit Scholarship Program" : "Create a Scholarship Program"}
        description="Complete the guided steps below. You can review all information before the program is published."
        actions={
          <Link className="button button-secondary" to="/admin/scholarships">
            <ArrowLeft size={17} /> Back to Scholarships
          </Link>
        }
      />

      <div className="scholarship-wizard-progress panel-card">
        <div className="wizard-progress-copy">
          <span>SETUP PROGRESS</span>
          <strong>{completion}% program information completed</strong>
        </div>
        <div className="wizard-progress-track" aria-hidden="true">
          <span style={{ width: `${completion}%` }} />
        </div>
      </div>

      <nav className="scholarship-wizard-stepper" aria-label="Scholarship setup steps">
        {steps.map((item, index) => {
          const Icon = item.icon;
          const active = index === step;
          const completed = index < step || (index < furthestStep && index !== step);
          const available = index <= furthestStep;

          return (
            <button
              type="button"
              key={item.label}
              className={`wizard-step ${active ? "active" : ""} ${completed ? "completed" : ""}`}
              onClick={() => goToStep(index)}
              disabled={!available}
              aria-current={active ? "step" : undefined}
            >
              <span className="wizard-step-number">
                {completed ? <CheckCircle2 size={16} /> : <Icon size={17} />}
              </span>
              <span className="wizard-step-copy">
                <small>Step {index + 1}</small>
                <strong>{item.label}</strong>
                <em>{item.description}</em>
              </span>
            </button>
          );
        })}
      </nav>

      {error ? (
        <div className="form-alert error scholarship-wizard-alert" role="alert">
          {error}
        </div>
      ) : null}

      <form className="scholarship-wizard-form" onSubmit={submit}>
        <div className="scholarship-wizard-layout">
          <main className="wizard-stage">
            {step === 0 ? (
              <WizardSection
                number="01"
                icon={GraduationCap}
                title="Program Details"
                description="Enter the main information students will see when they browse this scholarship."
              >
                <div className="wizard-section-note">
                  <FileText size={17} />
                  <p>
                    Start with the scholarship name and a clear public description. Fields marked with <b>*</b> are required.
                  </p>
                </div>

                <div className="form-grid wizard-form-grid">
                  <Field label="Scholarship Title" required full hint="Use the official name of the scholarship program.">
                    <input
                      value={form.title}
                      onChange={(event) => change("title", event.target.value)}
                      required
                      placeholder="e.g. Municipal College Scholarship Program"
                      autoFocus
                    />
                  </Field>

                  <Field label="Program Code" hint="Optional internal or public reference code.">
                    <input
                      value={form.code}
                      onChange={(event) => change("code", event.target.value)}
                      placeholder="e.g. MCS-2026"
                    />
                  </Field>

                  <Field label="Category" hint="Choose or type the category that best describes the program.">
                    <input
                      list="scholarship-category-options"
                      value={form.category}
                      onChange={(event) => change("category", event.target.value)}
                      placeholder="General Scholarship"
                    />
                    <datalist id="scholarship-category-options">
                      <option value="General Scholarship" />
                      <option value="Academic Excellence" />
                      <option value="Financial Assistance" />
                      <option value="College Scholarship" />
                      <option value="Senior High School Scholarship" />
                      <option value="Technical / Vocational Scholarship" />
                      <option value="Special Program" />
                    </datalist>
                  </Field>

                  <Field label="Public Description" full hint="Briefly explain the purpose of the program and who it is intended for.">
                    <textarea
                      rows="5"
                      value={form.description}
                      onChange={(event) => change("description", event.target.value)}
                      placeholder="Describe the scholarship program in clear, student-friendly language."
                    />
                  </Field>

                  <Field label="Scholarship Benefits" full hint="State what qualified scholars may receive.">
                    <textarea
                      rows="4"
                      value={form.benefits}
                      onChange={(event) => change("benefits", event.target.value)}
                      placeholder="e.g. Tuition support, educational allowance, or other approved benefits."
                    />
                  </Field>
                </div>
              </WizardSection>
            ) : null}

            {step === 1 ? (
              <WizardSection
                number="02"
                icon={CalendarDays}
                title="Schedule & Grant"
                description="Set when applications are accepted, the grant information, and the applicant capacity."
              >
                <div className="wizard-section-note">
                  <CalendarDays size={17} />
                  <p>
                    The deadline controls when students can submit. Make sure the opening date is not later than the deadline.
                  </p>
                </div>

                <div className="wizard-field-group">
                  <div className="wizard-field-group-heading">
                    <div>
                      <strong>Academic Period</strong>
                      <span>Identify the school year and term covered by this program.</span>
                    </div>
                  </div>
                  <div className="form-grid wizard-form-grid">
                    <Field label="Academic Year" hint="Example: 2026–2027">
                      <input
                        value={form.academicYear}
                        onChange={(event) => change("academicYear", event.target.value)}
                        placeholder="2026–2027"
                      />
                    </Field>
                    <Field label="Semester / Term" hint="Example: 1st Semester or Whole Academic Year">
                      <input
                        list="semester-options"
                        value={form.semester}
                        onChange={(event) => change("semester", event.target.value)}
                        placeholder="1st Semester"
                      />
                      <datalist id="semester-options">
                        <option value="1st Semester" />
                        <option value="2nd Semester" />
                        <option value="Summer / Midyear" />
                        <option value="Whole Academic Year" />
                      </datalist>
                    </Field>
                  </div>
                </div>

                <div className="wizard-field-group">
                  <div className="wizard-field-group-heading">
                    <div>
                      <strong>Grant & Capacity</strong>
                      <span>Enter the financial value, if applicable, and how many applications the program can accept.</span>
                    </div>
                  </div>
                  <div className="form-grid wizard-form-grid">
                    <Field label="Grant Amount (PHP)" hint="Enter 0 if the program does not have a fixed cash amount.">
                      <div className="wizard-input-prefix">
                        <span>₱</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={form.amount}
                          onChange={(event) => change("amount", event.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                    </Field>
                    <Field label="Maximum Applicants" required hint="Maximum number of applications the program can accept.">
                      <input
                        type="number"
                        min="1"
                        value={form.maxApplicants}
                        onChange={(event) => change("maxApplicants", event.target.value)}
                        required
                      />
                    </Field>
                  </div>
                </div>

                <div className="wizard-field-group">
                  <div className="wizard-field-group-heading">
                    <div>
                      <strong>Application Period</strong>
                      <span>Set the dates shown to students.</span>
                    </div>
                  </div>
                  <div className="form-grid wizard-form-grid">
                    <Field label="Application Opening Date" hint="Optional. Leave blank if applications may open immediately after publishing.">
                      <input
                        type="date"
                        value={form.openDate}
                        onChange={(event) => change("openDate", event.target.value)}
                      />
                    </Field>
                    <Field label="Application Deadline" required hint="Students must submit on or before this date.">
                      <input
                        type="date"
                        value={form.closeDate}
                        onChange={(event) => change("closeDate", event.target.value)}
                        required
                      />
                    </Field>
                  </div>
                </div>
              </WizardSection>
            ) : null}

            {step === 2 ? (
              <WizardSection
                number="03"
                icon={ClipboardCheck}
                title="Eligibility & Requirements"
                description="Explain who may apply and what applicants should prepare before starting the form."
              >
                <Field
                  label="Eligibility Criteria"
                  full
                  hint="Use short, clear conditions. You may place each condition on a separate line."
                >
                  <textarea
                    rows="6"
                    value={form.eligibility}
                    onChange={(event) => change("eligibility", event.target.value)}
                    placeholder={"e.g.\n• Resident of the municipality\n• Currently enrolled in an eligible school\n• Meets the required academic standing"}
                  />
                </Field>

                <div className="wizard-subsection-heading">
                  <div>
                    <span>APPLICATION CHECKLIST</span>
                    <h3>Requirements Students Should Prepare</h3>
                    <p>Add only items applicants need to know before they begin their application.</p>
                  </div>
                  <button type="button" className="button button-secondary button-sm" onClick={addRequirement}>
                    <Plus size={16} /> Add Requirement
                  </button>
                </div>

                {(form.requirements || []).length ? (
                  <div className="wizard-requirement-list">
                    {(form.requirements || []).map((requirement, index) => (
                      <div className="wizard-requirement-row" key={index}>
                        <span className="wizard-requirement-index">{index + 1}</span>
                        <input
                          value={requirement}
                          onChange={(event) => changeRequirement(index, event.target.value)}
                          placeholder="Enter a requirement"
                          aria-label={`Requirement ${index + 1}`}
                        />
                        <button
                          type="button"
                          className="icon-button danger-text"
                          onClick={() => removeRequirement(index)}
                          aria-label={`Remove requirement ${index + 1}`}
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="wizard-empty-builder">
                    <ClipboardCheck size={22} />
                    <div>
                      <strong>No additional requirements listed</strong>
                      <p>Add requirements if students need to prepare documents or information before applying.</p>
                    </div>
                  </div>
                )}

                <div className="wizard-built-in-fields">
                  <div className="wizard-built-in-copy">
                    <span>BUILT-IN APPLICATION ITEMS</span>
                    <h3>Required Applicant Verification</h3>
                    <p>These controls determine whether the standard application form asks for a photo and signature.</p>
                  </div>
                  <label className="wizard-toggle-card">
                    <input
                      type="checkbox"
                      checked={form.requirePhoto !== false}
                      onChange={(event) => change("requirePhoto", event.target.checked)}
                    />
                    <span className="wizard-toggle-icon"><FileText size={19} /></span>
                    <span>
                      <strong>Require 2×2 Applicant Photo</strong>
                      <small>Student must upload a photo before submission.</small>
                    </span>
                  </label>
                  <label className="wizard-toggle-card">
                    <input
                      type="checkbox"
                      checked={form.requireSignature !== false}
                      onChange={(event) => change("requireSignature", event.target.checked)}
                    />
                    <span className="wizard-toggle-icon"><BadgeCheck size={19} /></span>
                    <span>
                      <strong>Require Electronic Signature</strong>
                      <small>Student must sign the application before submission.</small>
                    </span>
                  </label>
                </div>
              </WizardSection>
            ) : null}

            {step === 3 ? (
              <WizardSection
                number="04"
                icon={FileText}
                title="Application Questions"
                description="Add only questions that are specific to this scholarship. Standard student information is already collected by the application form."
              >
                <div className="wizard-section-note success-note">
                  <CheckCircle2 size={17} />
                  <p>
                    You do not need to recreate standard fields such as Complete Name, Birthday, Address, School, Course, and Contact Number.
                  </p>
                </div>

                <div className="wizard-subsection-heading question-heading">
                  <div>
                    <span>OPTIONAL</span>
                    <h3>Program-Specific Questions</h3>
                    <p>Use this only when the scholarship needs information beyond the standard application form.</p>
                  </div>
                  <button type="button" className="button button-secondary" onClick={addQuestion}>
                    <Plus size={17} /> Add Question
                  </button>
                </div>

                {(form.customQuestions || []).length ? (
                  <div className="wizard-question-list">
                    {(form.customQuestions || []).map((question, index) => (
                      <div className="wizard-question-card" key={question.id || index}>
                        <div className="wizard-question-card-head">
                          <div>
                            <span>QUESTION {index + 1}</span>
                            <strong>{question.label?.trim() || "Untitled Question"}</strong>
                          </div>
                          <button
                            type="button"
                            className="icon-button danger-text"
                            onClick={() => removeQuestion(index)}
                            aria-label={`Remove question ${index + 1}`}
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>

                        <div className="form-grid wizard-form-grid">
                          <Field label="Question" required full hint="Write the exact question applicants will see.">
                            <input
                              value={question.label}
                              onChange={(event) => updateQuestion(index, "label", event.target.value)}
                              placeholder="e.g. Why are you applying for this scholarship?"
                            />
                          </Field>

                          <Field label="Answer Type" hint="Choose the most appropriate response format.">
                            <select
                              value={question.type}
                              onChange={(event) => updateQuestion(index, "type", event.target.value)}
                            >
                              <option value="text">Short Answer</option>
                              <option value="textarea">Paragraph</option>
                              <option value="number">Number</option>
                              <option value="date">Date</option>
                              <option value="email">Email Address</option>
                              <option value="phone">Phone Number</option>
                              <option value="select">Dropdown</option>
                              <option value="radio">Multiple Choice</option>
                              <option value="checkbox">Checkboxes</option>
                            </select>
                          </Field>

                          <div className="wizard-required-control">
                            <span>Response Requirement</span>
                            <label className="wizard-switch-row">
                              <input
                                type="checkbox"
                                checked={Boolean(question.required)}
                                onChange={(event) => updateQuestion(index, "required", event.target.checked)}
                              />
                              <span>
                                <strong>Required Question</strong>
                                <small>Applicant cannot continue without answering.</small>
                              </span>
                            </label>
                          </div>

                          {choiceTypes.includes(question.type) ? (
                            <Field
                              label="Answer Options"
                              required
                              full
                              hint="Enter one option per line. At least two options are required."
                            >
                              <textarea
                                rows="5"
                                value={(question.options || []).join("\n")}
                                onChange={(event) => updateQuestion(index, "options", event.target.value.split("\n"))}
                                placeholder={"Option 1\nOption 2\nOption 3"}
                              />
                            </Field>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="wizard-empty-builder large">
                    <FileText size={28} />
                    <div>
                      <strong>No additional questions</strong>
                      <p>This is okay. The standard scholarship application can be used without adding custom questions.</p>
                      <button type="button" className="button button-secondary button-sm" onClick={addQuestion}>
                        <Plus size={16} /> Add Your First Question
                      </button>
                    </div>
                  </div>
                )}
              </WizardSection>
            ) : null}

            {step === 4 ? (
              <WizardSection
                number="05"
                icon={Eye}
                title="Review & Publish"
                description="Check the program details below before saving. Use Edit if you need to return to a section."
              >
                <div className="wizard-review-ready">
                  <CheckCircle2 size={22} />
                  <div>
                    <strong>Ready for final review</strong>
                    <p>Required setup fields are complete. Review the information and choose the program status.</p>
                  </div>
                </div>

                <ReviewBlock title="Program Details" stepIndex={0} onEdit={goToStep}>
                  <ReviewRow label="Scholarship Title" value={form.title} />
                  <ReviewRow label="Program Code" value={form.code || "Not specified"} />
                  <ReviewRow label="Category" value={form.category || "Not specified"} />
                  <ReviewRow label="Public Description" value={form.description || "Not specified"} wide />
                  <ReviewRow label="Scholarship Benefits" value={form.benefits || "Not specified"} wide />
                </ReviewBlock>

                <ReviewBlock title="Schedule & Grant" stepIndex={1} onEdit={goToStep}>
                  <ReviewRow label="Academic Year" value={form.academicYear || "Not specified"} />
                  <ReviewRow label="Semester / Term" value={form.semester || "Not specified"} />
                  <ReviewRow
                    label="Grant Amount"
                    value={Number(form.amount || 0) ? `₱${Number(form.amount).toLocaleString("en-PH")}` : "Not specified"}
                  />
                  <ReviewRow label="Maximum Applicants" value={Number(form.maxApplicants || 0).toLocaleString()} />
                  <ReviewRow label="Opening Date" value={formatDate(form.openDate)} />
                  <ReviewRow label="Application Deadline" value={formatDate(form.closeDate)} />
                </ReviewBlock>

                <ReviewBlock title="Eligibility & Requirements" stepIndex={2} onEdit={goToStep}>
                  <ReviewRow label="Eligibility Criteria" value={form.eligibility || "Not specified"} wide />
                  <div className="wizard-review-wide-row">
                    <span>Requirements</span>
                    {(form.requirements || []).filter((item) => item?.trim()).length ? (
                      <ol>
                        {(form.requirements || []).filter((item) => item?.trim()).map((item, index) => (
                          <li key={`${item}-${index}`}>{item}</li>
                        ))}
                      </ol>
                    ) : (
                      <strong>None listed</strong>
                    )}
                  </div>
                  <ReviewRow label="2×2 Photo" value={form.requirePhoto !== false ? "Required" : "Not required"} />
                  <ReviewRow label="Electronic Signature" value={form.requireSignature !== false ? "Required" : "Not required"} />
                </ReviewBlock>

                <ReviewBlock title="Application Questions" stepIndex={3} onEdit={goToStep}>
                  <ReviewRow
                    label="Additional Questions"
                    value={`${(form.customQuestions || []).length} ${(form.customQuestions || []).length === 1 ? "question" : "questions"}`}
                    wide
                  />
                  {(form.customQuestions || []).map((question, index) => (
                    <div className="wizard-review-question" key={question.id || index}>
                      <span>Question {index + 1}</span>
                      <strong>{question.label}</strong>
                      <small>{prettyQuestionType(question.type)} · {question.required ? "Required" : "Optional"}</small>
                    </div>
                  ))}
                </ReviewBlock>

                <div className="wizard-publish-section">
                  <div className="wizard-subsection-heading">
                    <div>
                      <span>FINAL STEP</span>
                      <h3>Choose Program Status <b className="wizard-required-mark">*</b></h3>
                      <p>This choice is required. Nothing is published automatically.</p>
                    </div>
                  </div>

                  <div className="wizard-status-options">
                    <StatusOption
                      value="draft"
                      current={form.status}
                      onChange={(value) => change("status", value)}
                      icon={FileText}
                      title="Save as Draft"
                      description="Visible only to administrators. You can continue editing later."
                    />
                    <StatusOption
                      value="published"
                      current={form.status}
                      onChange={(value) => change("status", value)}
                      icon={Eye}
                      title="Publish Program"
                      description="The scholarship becomes visible to public visitors and students."
                    />
                    {editing ? (
                      <StatusOption
                        value="archived"
                        current={form.status}
                        onChange={(value) => change("status", value)}
                        icon={Settings2}
                        title="Archive Program"
                        description="Remove the scholarship from public listings while keeping its record."
                      />
                    ) : null}
                  </div>

                  {!form.status ? (
                    <div className="wizard-status-required-notice">
                      <FileText size={17} />
                      <p><strong>No status selected yet.</strong> Choose <b>Save as Draft</b> or <b>Publish Program</b> before saving.</p>
                    </div>
                  ) : null}

                  {form.status === "published" ? (
                    <div className="wizard-publish-notice">
                      <Eye size={17} />
                      <p>
                        <strong>This program will be publicly visible after saving.</strong>
                        Students will still be subject to the application opening and deadline rules configured above.
                      </p>
                    </div>
                  ) : null}
                </div>
              </WizardSection>
            ) : null}

            <div className="wizard-footer-actions">
              <button type="button" className="button button-secondary" onClick={goBack} disabled={step === 0 || saving}>
                <ArrowLeft size={17} /> Previous
              </button>

              <div className="wizard-footer-right">
                <span>Step {step + 1} of {steps.length}</span>
                {step < steps.length - 1 ? (
                  <button type="button" className="button button-primary" onClick={goNext}>
                    {step === steps.length - 2 ? "Review Scholarship" : "Continue"} <ArrowRight size={17} />
                  </button>
                ) : (
                  <button type="submit" className="button button-primary" disabled={saving}>
                    <Save size={17} />
                    {saving
                      ? "Saving…"
                      : !form.status
                        ? "Choose Status First"
                        : form.status === "published"
                          ? editing ? "Review & Publish Changes" : "Review & Publish Scholarship"
                          : form.status === "archived"
                            ? "Save as Archived"
                            : "Save as Draft"}
                  </button>
                )}
              </div>
            </div>
          </main>

          <aside className="wizard-sidebar">
            <section className="panel-card wizard-sidebar-card wizard-current-step-card">
              <span>CURRENT STEP</span>
              <div className="wizard-sidebar-step-icon">
                {(() => {
                  const CurrentIcon = steps[step].icon;
                  return <CurrentIcon size={21} />;
                })()}
              </div>
              <h2>{steps[step].label}</h2>
              <p>{getStepHelp(step)}</p>
            </section>

            <section className="panel-card wizard-sidebar-card">
              <span>PROGRAM SUMMARY</span>
              <SummaryRow icon={GraduationCap} label="Program" value={form.title?.trim() || "Not named yet"} />
              <SummaryRow icon={TicketCheck} label="Applicant Slots" value={Number(form.maxApplicants || 0).toLocaleString()} />
              <SummaryRow icon={CalendarDays} label="Deadline" value={formatDate(form.closeDate)} />
              <SummaryRow
                icon={WalletCards}
                label="Grant Amount"
                value={Number(form.amount || 0) ? `₱${Number(form.amount).toLocaleString("en-PH")}` : "Not set"}
              />
              <SummaryRow icon={UsersRound} label="Custom Questions" value={String((form.customQuestions || []).length)} />
            </section>

            {!editing ? (
              <section className="panel-card wizard-sidebar-card wizard-draft-card">
                <span>NEED TO FINISH LATER?</span>
                <h3>Save your progress as a draft</h3>
                <p>You only need a Scholarship Title to save an unfinished program and continue later.</p>
                <button
                  type="button"
                  className="button button-secondary button-block"
                  onClick={saveDraftAndExit}
                  disabled={saving}
                >
                  <Save size={16} /> {saving ? "Saving…" : "Save Draft & Exit"}
                </button>
              </section>
            ) : null}
          </aside>
        </div>
      </form>

      {publishConfirmOpen ? (
        <div className="wizard-confirm-backdrop" role="presentation">
          <section
            className="wizard-confirm-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="publish-confirm-title"
          >
            <div className="wizard-confirm-icon"><Eye size={24} /></div>
            <div className="wizard-confirm-copy">
              <span>FINAL CONFIRMATION</span>
              <h2 id="publish-confirm-title">Publish this scholarship?</h2>
              <p>
                <strong>{form.title || "This scholarship"}</strong> will become visible to students and public visitors immediately after publishing, subject to the opening and deadline dates you configured.
              </p>
            </div>
            <div className="wizard-confirm-summary">
              <div><span>Status</span><strong>Published</strong></div>
              <div><span>Opening Date</span><strong>{formatDate(form.openDate)}</strong></div>
              <div><span>Deadline</span><strong>{formatDate(form.closeDate)}</strong></div>
            </div>
            <div className="wizard-confirm-actions">
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setPublishConfirmOpen(false)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="button button-primary"
                onClick={confirmPublish}
                disabled={saving}
              >
                <Eye size={17} /> {saving ? "Publishing…" : "Yes, Publish Scholarship"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function WizardSection({ number, icon: Icon, title, description, children }) {
  return (
    <section className="panel-card scholarship-wizard-section">
      <div className="wizard-section-heading">
        <div className="wizard-section-number">{number}</div>
        <div className="wizard-section-title-icon"><Icon size={20} /></div>
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      <div className="wizard-section-body">{children}</div>
    </section>
  );
}

function Field({ label, required = false, full = false, hint, children }) {
  return (
    <label className={`field-label wizard-field ${full ? "full" : ""}`}>
      <span className="wizard-field-label">
        {label} {required ? <b>*</b> : null}
      </span>
      {children}
      {hint ? <small className="wizard-field-help">{hint}</small> : null}
    </label>
  );
}

function ReviewBlock({ title, stepIndex, onEdit, children }) {
  return (
    <section className="wizard-review-block">
      <div className="wizard-review-block-head">
        <h3>{title}</h3>
        <button type="button" onClick={() => onEdit(stepIndex)}>Edit</button>
      </div>
      <div className="wizard-review-grid">{children}</div>
    </section>
  );
}

function ReviewRow({ label, value, wide = false }) {
  return (
    <div className={`wizard-review-row ${wide ? "wide" : ""}`}>
      <span>{label}</span>
      <strong>{value || "Not specified"}</strong>
    </div>
  );
}

function StatusOption({ value, current, onChange, icon: Icon, title, description }) {
  const selected = current === value;
  return (
    <label className={`wizard-status-option ${selected ? "selected" : ""}`}>
      <input
        type="radio"
        name="scholarship-status"
        value={value}
        checked={selected}
        onChange={() => onChange(value)}
      />
      <span className="wizard-status-icon"><Icon size={20} /></span>
      <span className="wizard-status-copy">
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      <span className="wizard-status-check">
        {selected ? <CheckCircle2 size={20} /> : <span className="wizard-status-empty-circle" />}
      </span>
    </label>
  );
}

function SummaryRow({ icon: Icon, label, value }) {
  return (
    <div className="wizard-summary-row">
      <span><Icon size={17} /></span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "Not set";
  const [year, month, day] = String(value).split("-").map(Number);
  if (!year || !month || !day) return value;
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(year, month - 1, day));
}

function prettyQuestionType(type) {
  const labels = {
    text: "Short Answer",
    textarea: "Paragraph",
    number: "Number",
    date: "Date",
    email: "Email Address",
    phone: "Phone Number",
    select: "Dropdown",
    radio: "Multiple Choice",
    checkbox: "Checkboxes",
  };
  return labels[type] || "Short Answer";
}

function getStepHelp(stepIndex) {
  const help = [
    "Use the official scholarship name and write the public information in simple, clear language.",
    "Set the academic period, grant value, applicant limit, and application dates.",
    "State who is qualified to apply and list only the requirements students should prepare.",
    "Add only questions that are not already part of the standard student application form.",
    "Review every section, choose Draft or Published, then save the scholarship program.",
  ];
  return help[stepIndex];
}
