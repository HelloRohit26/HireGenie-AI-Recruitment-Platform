import React, { useState } from 'react';
import { jobService } from '../../services/jobService';
import { ScreeningQuestionItem } from '../../types';

interface CreateJobWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJobCreated?: (newJob: any) => void;
}

const PREDEFINED_DEPARTMENTS = [
  'AI Research & Engineering',
  'Software Engineering',
  'Product Management',
  'Data & Analytics',
  'Design & Creative',
  'Operations & Strategy',
  'Finance & Accounting',
  'Human Resources',
  'Sales & Marketing',
  'Customer Success',
  'Legal & Compliance',
  'Other'
];

export const CreateJobWizardModal: React.FC<CreateJobWizardModalProps> = ({
  isOpen,
  onClose,
  onJobCreated
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});

  // ─── Step 1: Basic Role & Company ──────────────────────────────
  const [title, setTitle] = useState('');
  const [departmentSelect, setDepartmentSelect] = useState('AI Research & Engineering');
  const [customDepartment, setCustomDepartment] = useState('');
  const [companyName, setCompanyName] = useState('HireGenie AI');
  const [companyWebsite, setCompanyWebsite] = useState('https://hiregenie.ai');
  const [companyLocation, setCompanyLocation] = useState('San Francisco, CA');
  const [companySize, setCompanySize] = useState('51-200');
  const [companyDescription, setCompanyDescription] = useState('Autonomous AI-powered recruitment and intelligence platform.');
  
  const [location, setLocation] = useState('San Francisco, CA / Hybrid');
  const [workMode, setWorkMode] = useState<'REMOTE' | 'HYBRID' | 'ON_SITE'>('HYBRID');
  const [employmentType, setEmploymentType] = useState<'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP'>('FULL_TIME');
  const [experienceLevel, setExperienceLevel] = useState<'ENTRY_LEVEL' | 'MID_LEVEL' | 'SENIOR' | 'LEAD'>('SENIOR');
  const [minExperience, setMinExperience] = useState<number>(3);
  const [maxExperience, setMaxExperience] = useState<number>(7);

  const [description, setDescription] = useState('');
  const [responsibilities, setResponsibilities] = useState('');
  const [requiredQualifications, setRequiredQualifications] = useState('');
  const [preferredQualifications, setPreferredQualifications] = useState('');

  // Skills Tag Inputs
  const [requiredSkills, setRequiredSkills] = useState<string[]>(['Python', 'FastAPI', 'PyTorch']);
  const [reqSkillInput, setReqSkillInput] = useState('');
  const [preferredSkills, setPreferredSkills] = useState<string[]>(['Docker', 'PostgreSQL', 'WebRTC']);
  const [prefSkillInput, setPrefSkillInput] = useState('');

  // Compensation
  const [salaryDisclosed, setSalaryDisclosed] = useState(true);
  const [currency, setCurrency] = useState('INR');
  const [salaryType, setSalaryType] = useState('ANNUAL');
  const [minSalary, setMinSalary] = useState<number | ''>(800000);
  const [maxSalary, setMaxSalary] = useState<number | ''>(1200000);

  // ─── Step 2: Screening ─────────────────────────────────────────
  const [screeningEnabled, setScreeningEnabled] = useState(true);
  const [educationRequirements, setEducationRequirements] = useState("Bachelor's Degree");
  const [certifications, setCertifications] = useState<string[]>([]);
  const [certInput, setCertInput] = useState('');
  const [resumeRequired, setResumeRequired] = useState(true);
  const [screeningQuestions, setScreeningQuestions] = useState<ScreeningQuestionItem[]>([
    {
      question_text: 'How many years of experience do you have building production AI/ML systems or backend pipelines?',
      category: 'Experience',
      weight: 1.0,
      is_required: true
    },
    {
      question_text: 'Are you comfortable working in a fast-paced environment and collaborating across autonomous workflows?',
      category: 'Behavioral',
      weight: 1.0,
      is_required: true
    }
  ]);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionCategory, setNewQuestionCategory] = useState('Technical');
  const [newQuestionRequired, setNewQuestionRequired] = useState(true);

  // ─── Step 3: Shortlist ─────────────────────────────────────────
  const [targetShortlistCount, setTargetShortlistCount] = useState<number>(10);
  const [shortlistThreshold, setShortlistThreshold] = useState<number>(75);
  const [maxInterviewCandidates, setMaxInterviewCandidates] = useState<number>(15);
  const [autoShortlist, setAutoShortlist] = useState(true);

  // ─── Step 4: Interview ─────────────────────────────────────────
  const [interviewDurationMins, setInterviewDurationMins] = useState<number>(15);
  const [interviewDifficulty, setInterviewDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT'>('MEDIUM');
  const [techTopics, setTechTopics] = useState<string[]>(['System Design', 'Algorithms & Data Structures', 'API Development']);
  const [techTopicInput, setTechTopicInput] = useState('');
  const [behavioralTopics, setBehavioralTopics] = useState<string[]>(['Problem Solving', 'Team Collaboration', 'Ownership']);
  const [behavioralTopicInput, setBehavioralTopicInput] = useState('');
  const [rubric, setRubric] = useState({
    communication: 25,
    technical: 35,
    problemSolving: 25,
    roleFit: 15
  });

  if (!isOpen) return null;

  const resolvedDepartment = departmentSelect === 'Other' ? (customDepartment || 'Other') : departmentSelect;

  // ─── Tag Handlers ──────────────────────────────────────────────
  const handleAddReqSkill = () => {
    const trimmed = reqSkillInput.trim();
    if (trimmed && !requiredSkills.includes(trimmed)) {
      setRequiredSkills([...requiredSkills, trimmed]);
      setReqSkillInput('');
    }
  };

  const handleRemoveReqSkill = (skill: string) => {
    setRequiredSkills(requiredSkills.filter(s => s !== skill));
  };

  const handleAddPrefSkill = () => {
    const trimmed = prefSkillInput.trim();
    if (trimmed && !preferredSkills.includes(trimmed)) {
      setPreferredSkills([...preferredSkills, trimmed]);
      setPrefSkillInput('');
    }
  };

  const handleRemovePrefSkill = (skill: string) => {
    setPreferredSkills(preferredSkills.filter(s => s !== skill));
  };

  const handleAddCert = () => {
    const trimmed = certInput.trim();
    if (trimmed && !certifications.includes(trimmed)) {
      setCertifications([...certifications, trimmed]);
      setCertInput('');
    }
  };

  const handleRemoveCert = (cert: string) => {
    setCertifications(certifications.filter(c => c !== cert));
  };

  const handleAddTechTopic = () => {
    const trimmed = techTopicInput.trim();
    if (trimmed && !techTopics.includes(trimmed)) {
      setTechTopics([...techTopics, trimmed]);
      setTechTopicInput('');
    }
  };

  const handleRemoveTechTopic = (topic: string) => {
    setTechTopics(techTopics.filter(t => t !== topic));
  };

  const handleAddBehavioralTopic = () => {
    const trimmed = behavioralTopicInput.trim();
    if (trimmed && !behavioralTopics.includes(trimmed)) {
      setBehavioralTopics([...behavioralTopics, trimmed]);
      setBehavioralTopicInput('');
    }
  };

  const handleRemoveBehavioralTopic = (topic: string) => {
    setBehavioralTopics(behavioralTopics.filter(t => t !== topic));
  };

  const handleAddScreeningQuestion = () => {
    if (!newQuestionText.trim()) return;
    setScreeningQuestions([
      ...screeningQuestions,
      {
        question_text: newQuestionText.trim(),
        category: newQuestionCategory,
        weight: 1.0,
        is_required: newQuestionRequired
      }
    ]);
    setNewQuestionText('');
  };

  const handleRemoveScreeningQuestion = (index: number) => {
    setScreeningQuestions(screeningQuestions.filter((_, i) => i !== index));
  };

  // ─── Step Validation ───────────────────────────────────────────
  const validateStep1 = (): boolean => {
    const errors: Record<string, string> = {};
    if (!title.trim()) errors.title = 'Job title is required.';
    if (!companyName.trim()) errors.companyName = 'Company name is required.';
    if (departmentSelect === 'Other' && !customDepartment.trim()) {
      errors.department = 'Please specify the department name.';
    }
    if (!location.trim()) errors.location = 'Job location is required.';
    if (!description.trim()) errors.description = 'Job description is required.';
    if (requiredSkills.length === 0) errors.requiredSkills = 'Add at least one required skill.';
    
    if (minExperience < 0) errors.minExperience = 'Min experience must be 0 or greater.';
    if (maxExperience < minExperience) errors.maxExperience = 'Max experience must be ≥ Min experience.';

    if (salaryDisclosed) {
      if (minSalary !== '' && maxSalary !== '' && Number(minSalary) > Number(maxSalary)) {
        errors.salary = 'Minimum salary cannot exceed maximum salary.';
      }
    }

    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = (): boolean => {
    setStepErrors({});
    return true;
  };

  const validateStep3 = (): boolean => {
    const errors: Record<string, string> = {};
    if (targetShortlistCount < 1) errors.targetShortlist = 'Target shortlist count must be at least 1.';
    if (shortlistThreshold < 1 || shortlistThreshold > 100) errors.shortlistThreshold = 'Threshold must be between 1% and 100%.';
    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep4 = (): boolean => {
    const errors: Record<string, string> = {};
    const totalRubric = rubric.communication + rubric.technical + rubric.problemSolving + rubric.roleFit;
    if (totalRubric !== 100) {
      errors.rubric = `Rubric weights must total exactly 100% (currently ${totalRubric}%).`;
    }
    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    setErrorMsg('');
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    if (currentStep === 3 && !validateStep3()) return;
    if (currentStep === 4 && !validateStep4()) return;

    if (currentStep < 5) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleSubmit = async (submitStatus: 'OPEN' | 'DRAFT') => {
    if (!validateStep1() || !validateStep3() || !validateStep4()) {
      setErrorMsg('Please review and correct errors before publishing.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    const payload = {
      title: title.trim(),
      company: companyName.trim(),
      department: resolvedDepartment,
      location: location.trim(),
      work_mode: workMode,
      employment_type: employmentType,
      experience_level: experienceLevel,
      min_experience: Number(minExperience),
      max_experience: Number(maxExperience),
      description: description.trim(),
      responsibilities: responsibilities.trim(),
      required_qualifications: requiredQualifications.trim(),
      preferred_qualifications: preferredQualifications.trim(),
      must_have_skills: requiredSkills,
      nice_to_have_skills: preferredSkills,
      salary_disclosed: salaryDisclosed,
      salary_type: salaryType,
      currency: currency,
      min_salary: salaryDisclosed && minSalary !== '' ? Number(minSalary) : null,
      max_salary: salaryDisclosed && maxSalary !== '' ? Number(maxSalary) : null,
      company_website: companyWebsite.trim(),
      company_description: companyDescription.trim(),
      company_size: companySize,
      status: submitStatus,
      screening_enabled: screeningEnabled,
      education_requirements: educationRequirements,
      certifications: certifications,
      resume_required: resumeRequired,
      target_shortlist_count: Number(targetShortlistCount),
      shortlist_threshold: Number(shortlistThreshold),
      max_interview_candidates: Number(maxInterviewCandidates),
      auto_shortlist: autoShortlist,
      interview_mode: 'WEBRTC',
      interview_duration_minutes: Number(interviewDurationMins),
      technical_topics: techTopics,
      behavioral_topics: behavioralTopics,
      interview_difficulty: interviewDifficulty,
      interview_rubric: {
        Communication: rubric.communication,
        "Technical Knowledge": rubric.technical,
        "Problem Solving": rubric.problemSolving,
        "Role Fit": rubric.roleFit
      },
      screening_questions: screeningQuestions
    };

    try {
      const res = await jobService.createJob(payload);
      if (onJobCreated) {
        onJobCreated(res.data);
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save job campaign requisition.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { num: '01', title: 'Basic Role', desc: 'Title, company & specs' },
    { num: '02', title: 'Screening', desc: 'Skills & questions' },
    { num: '03', title: 'Shortlist', desc: 'Thresholds & quotas' },
    { num: '04', title: 'Interview', desc: 'AI Voice & rubric' },
    { num: '05', title: 'Review', desc: 'Summary & publish' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div 
        className="bg-[#181815] border border-[#2A2A28] rounded-2xl max-w-4xl w-full p-5 sm:p-7 shadow-2xl space-y-6 my-auto text-[#E5E2DE] max-h-[92vh] flex flex-col"
        role="dialog"
        aria-labelledby="wizard-modal-title"
      >
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between border-b border-[#2A2A28] pb-4 shrink-0">
          <div>
            <h2 id="wizard-modal-title" className="text-lg font-bold text-[#F4F1E9] flex items-center gap-2">
              <span className="material-symbols-outlined text-[#D6A85F]">campaign</span>
              Create Job Campaign Wizard
            </h2>
            <p className="text-xs text-[#A1A19A] mt-0.5 font-mono">
              Configure autonomous AI screening, ranking criteria, and voice interview rubrics
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#A1A19A] hover:text-[#F4F1E9] text-base p-1.5 rounded-lg hover:bg-[#20201C] transition-colors"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* STEPPER NAV BAR */}
        <div className="grid grid-cols-5 gap-1.5 sm:gap-3 border-b border-[#2A2A28] pb-4 shrink-0">
          {steps.map((step, idx) => {
            const stepNum = idx + 1;
            const isActive = currentStep === stepNum;
            const isCompleted = currentStep > stepNum;

            return (
              <button
                key={step.num}
                type="button"
                onClick={() => {
                  if (stepNum < currentStep) setCurrentStep(stepNum);
                  else if (stepNum === currentStep + 1) handleNext();
                }}
                className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-[#D6A85F]/20 border-[#D6A85F] text-[#F4C377] ring-1 ring-[#D6A85F]/50' 
                    : isCompleted
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-[#11110F] border-[#2A2A28] text-[#A1A19A] hover:border-[#3E3E3A]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold">{step.num}</span>
                  {isCompleted && <span className="material-symbols-outlined text-xs text-emerald-400">check_circle</span>}
                </div>
                <div className="text-[11px] sm:text-xs font-semibold truncate mt-0.5">{step.title}</div>
              </button>
            );
          })}
        </div>

        {/* STEP CONTENT BODY (Scrollable) */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-6">

          {/* ══════════════════ STEP 01 — BASIC ROLE & COMPANY ══════════════════ */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-[#2A2A28] pb-3">
                <h3 className="text-sm font-bold text-[#F4F1E9] flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-[#D6A85F]">badge</span>
                  01. Role Specifications & Company Profile
                </h3>
                <p className="text-xs text-[#A1A19A]">Define the core requisition metadata, experience bounds, and organization profile.</p>
              </div>

              {/* Title & Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-[#A1A19A] mb-1">
                    Job Title <span className="text-rose-400">*</span>
                  </label>
                  <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Staff AI Systems Engineer"
                    className={`w-full bg-[#11110F] border rounded-lg px-3 py-2 text-xs text-[#E5E2DE] focus:outline-none focus:ring-1 ${
                      stepErrors.title ? 'border-rose-500 focus:ring-rose-500' : 'border-[#2A2A28] focus:border-[#D6A85F] focus:ring-[#D6A85F]'
                    }`}
                  />
                  {stepErrors.title && <p className="text-[10px] text-rose-400 mt-1">{stepErrors.title}</p>}
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#A1A19A] mb-1">
                    Department <span className="text-rose-400">*</span>
                  </label>
                  <select 
                    value={departmentSelect}
                    onChange={(e) => setDepartmentSelect(e.target.value)}
                    className="w-full bg-[#11110F] border border-[#2A2A28] rounded-lg px-3 py-2 text-xs text-[#E5E2DE] focus:border-[#D6A85F] focus:outline-none"
                  >
                    {PREDEFINED_DEPARTMENTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  {departmentSelect === 'Other' && (
                    <input 
                      type="text"
                      value={customDepartment}
                      onChange={(e) => setCustomDepartment(e.target.value)}
                      placeholder="Specify custom department name..."
                      className="w-full mt-2 bg-[#11110F] border border-[#2A2A28] rounded-lg px-3 py-2 text-xs text-[#E5E2DE] focus:border-[#D6A85F] focus:outline-none"
                    />
                  )}
                  {stepErrors.department && <p className="text-[10px] text-rose-400 mt-1">{stepErrors.department}</p>}
                </div>
              </div>

              {/* Work Mode, Employment Type, Experience Level */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-mono text-[#A1A19A] mb-1">
                    Work Mode <span className="text-rose-400">*</span>
                  </label>
                  <select 
                    value={workMode}
                    onChange={(e: any) => setWorkMode(e.target.value)}
                    className="w-full bg-[#11110F] border border-[#2A2A28] rounded-lg px-3 py-2 text-xs text-[#E5E2DE] focus:border-[#D6A85F] focus:outline-none"
                  >
                    <option value="REMOTE">Remote</option>
                    <option value="HYBRID">Hybrid</option>
                    <option value="ON_SITE">On-site</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#A1A19A] mb-1">
                    Employment Type <span className="text-rose-400">*</span>
                  </label>
                  <select 
                    value={employmentType}
                    onChange={(e: any) => setEmploymentType(e.target.value)}
                    className="w-full bg-[#11110F] border border-[#2A2A28] rounded-lg px-3 py-2 text-xs text-[#E5E2DE] focus:border-[#D6A85F] focus:outline-none"
                  >
                    <option value="FULL_TIME">Full-Time</option>
                    <option value="PART_TIME">Part-Time</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="INTERNSHIP">Internship</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#A1A19A] mb-1">
                    Experience Level <span className="text-rose-400">*</span>
                  </label>
                  <select 
                    value={experienceLevel}
                    onChange={(e: any) => setExperienceLevel(e.target.value)}
                    className="w-full bg-[#11110F] border border-[#2A2A28] rounded-lg px-3 py-2 text-xs text-[#E5E2DE] focus:border-[#D6A85F] focus:outline-none"
                  >
                    <option value="ENTRY_LEVEL">Entry Level</option>
                    <option value="MID_LEVEL">Mid Level</option>
                    <option value="SENIOR">Senior</option>
                    <option value="LEAD">Lead / Principal</option>
                  </select>
                </div>
              </div>

              {/* Location & Experience Range */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-mono text-[#A1A19A] mb-1">
                    Location <span className="text-rose-400">*</span>
                  </label>
                  <input 
                    type="text" 
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. San Francisco, CA / Remote"
                    className="w-full bg-[#11110F] border border-[#2A2A28] rounded-lg px-3 py-2 text-xs text-[#E5E2DE] focus:border-[#D6A85F] focus:outline-none"
                  />
                  {stepErrors.location && <p className="text-[10px] text-rose-400 mt-1">{stepErrors.location}</p>}
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#A1A19A] mb-1">
                    Min Experience (Yrs) <span className="text-rose-400">*</span>
                  </label>
                  <input 
                    type="number" 
                    min="0"
                    max="50"
                    value={minExperience}
                    onChange={(e) => setMinExperience(Number(e.target.value))}
                    className="w-full bg-[#11110F] border border-[#2A2A28] rounded-lg px-3 py-2 text-xs text-[#E5E2DE] focus:border-[#D6A85F] focus:outline-none"
                  />
                  {stepErrors.minExperience && <p className="text-[10px] text-rose-400 mt-1">{stepErrors.minExperience}</p>}
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#A1A19A] mb-1">
                    Max Experience (Yrs) <span className="text-rose-400">*</span>
                  </label>
                  <input 
                    type="number" 
                    min="0"
                    max="50"
                    value={maxExperience}
                    onChange={(e) => setMaxExperience(Number(e.target.value))}
                    className="w-full bg-[#11110F] border border-[#2A2A28] rounded-lg px-3 py-2 text-xs text-[#E5E2DE] focus:border-[#D6A85F] focus:outline-none"
                  />
                  {stepErrors.maxExperience && <p className="text-[10px] text-rose-400 mt-1">{stepErrors.maxExperience}</p>}
                </div>
              </div>

              {/* Company Information Card */}
              <div className="p-4 bg-[#11110F] border border-[#2A2A28] rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#F4F1E9]">
                  <span className="material-symbols-outlined text-sm text-[#D6A85F]">business</span>
                  Company Information
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-[#A1A19A] mb-1">Company Name *</label>
                    <input 
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. HireGenie AI"
                      className="w-full bg-[#181815] border border-[#2A2A28] rounded px-2.5 py-1.5 text-xs text-[#E5E2DE] focus:border-[#D6A85F] focus:outline-none"
                    />
                    {stepErrors.companyName && <p className="text-[10px] text-rose-400 mt-1">{stepErrors.companyName}</p>}
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-[#A1A19A] mb-1">Company Website</label>
                    <input 
                      type="text"
                      value={companyWebsite}
                      onChange={(e) => setCompanyWebsite(e.target.value)}
                      placeholder="https://company.com"
                      className="w-full bg-[#181815] border border-[#2A2A28] rounded px-2.5 py-1.5 text-xs text-[#E5E2DE] focus:border-[#D6A85F] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-[#A1A19A] mb-1">Company Size</label>
                    <select
                      value={companySize}
                      onChange={(e) => setCompanySize(e.target.value)}
                      className="w-full bg-[#181815] border border-[#2A2A28] rounded px-2.5 py-1.5 text-xs text-[#E5E2DE] focus:border-[#D6A85F] focus:outline-none"
                    >
                      <option value="1-10">1-10 Employees (Seed)</option>
                      <option value="11-50">11-50 Employees (Early Stage)</option>
                      <option value="51-200">51-200 Employees (Growth)</option>
                      <option value="201-500">201-500 Employees (Scaleup)</option>
                      <option value="501-1000">501-1000 Employees (Enterprise)</option>
                      <option value="1000+">1000+ Employees (Global)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Description & Responsibilities */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-mono text-[#A1A19A] mb-1">
                    Job Description <span className="text-rose-400">*</span>
                  </label>
                  <textarea 
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide an overview of the role, mission, and day-to-day context..."
                    className="w-full bg-[#11110F] border border-[#2A2A28] rounded-lg p-3 text-xs text-[#E5E2DE] focus:border-[#D6A85F] focus:outline-none"
                  />
                  {stepErrors.description && <p className="text-[10px] text-rose-400 mt-1">{stepErrors.description}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-[#A1A19A] mb-1">Responsibilities</label>
                    <textarea 
                      rows={3}
                      value={responsibilities}
                      onChange={(e) => setResponsibilities(e.target.value)}
                      placeholder="• Architect distributed AI services&#10;• Optimize model latency & real-time audio"
                      className="w-full bg-[#11110F] border border-[#2A2A28] rounded-lg p-3 text-xs text-[#E5E2DE] focus:border-[#D6A85F] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-[#A1A19A] mb-1">Qualifications</label>
                    <textarea 
                      rows={3}
                      value={requiredQualifications}
                      onChange={(e) => setRequiredQualifications(e.target.value)}
                      placeholder="• B.S./M.S. in Computer Science&#10;• Experience with vector databases and LLM APIs"
                      className="w-full bg-[#11110F] border border-[#2A2A28] rounded-lg p-3 text-xs text-[#E5E2DE] focus:border-[#D6A85F] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Required & Preferred Skills */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Required Skills */}
                <div className="p-4 bg-[#11110F] border border-[#2A2A28] rounded-xl space-y-2">
                  <label className="block text-xs font-mono font-bold text-[#F4F1E9]">
                    Required Skills <span className="text-rose-400">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={reqSkillInput}
                      onChange={(e) => setReqSkillInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddReqSkill(); } }}
                      placeholder="Type skill & press Enter..."
                      className="flex-1 bg-[#181815] border border-[#2A2A28] rounded px-3 py-1.5 text-xs text-[#E5E2DE] focus:border-[#D6A85F] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddReqSkill}
                      className="px-3 py-1.5 rounded bg-[#D6A85F]/20 text-[#F4C377] text-xs font-bold hover:bg-[#D6A85F]/30"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 min-h-[32px] pt-1">
                    {requiredSkills.map(skill => (
                      <span 
                        key={skill}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#D6A85F]/15 border border-[#D6A85F]/30 text-[#F4C377] text-xs font-mono"
                      >
                        {skill}
                        <button 
                          type="button" 
                          onClick={() => handleRemoveReqSkill(skill)}
                          className="text-xs hover:text-rose-400"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  {stepErrors.requiredSkills && <p className="text-[10px] text-rose-400">{stepErrors.requiredSkills}</p>}
                </div>

                {/* Preferred Skills */}
                <div className="p-4 bg-[#11110F] border border-[#2A2A28] rounded-xl space-y-2">
                  <label className="block text-xs font-mono font-bold text-[#A1A19A]">
                    Preferred / Nice-to-Have Skills
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={prefSkillInput}
                      onChange={(e) => setPrefSkillInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddPrefSkill(); } }}
                      placeholder="Type preferred skill..."
                      className="flex-1 bg-[#181815] border border-[#2A2A28] rounded px-3 py-1.5 text-xs text-[#E5E2DE] focus:border-[#D6A85F] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddPrefSkill}
                      className="px-3 py-1.5 rounded bg-[#20201C] text-[#E5E2DE] text-xs font-semibold hover:bg-[#2A2A28]"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 min-h-[32px] pt-1">
                    {preferredSkills.map(skill => (
                      <span 
                        key={skill}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#20201C] border border-[#2A2A28] text-[#A1A19A] text-xs font-mono"
                      >
                        {skill}
                        <button 
                          type="button" 
                          onClick={() => handleRemovePrefSkill(skill)}
                          className="text-xs hover:text-rose-400"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Compensation & Salary */}
              <div className="p-4 bg-[#11110F] border border-[#2A2A28] rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#F4F1E9]">
                    <span className="material-symbols-outlined text-sm text-[#D6A85F]">payments</span>
                    Compensation & Salary Range
                  </div>
                  <label className="flex items-center gap-2 text-xs font-mono text-[#A1A19A] cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={salaryDisclosed}
                      onChange={(e) => setSalaryDisclosed(e.target.checked)}
                      className="rounded border-[#2A2A28] text-[#D6A85F] focus:ring-0"
                    />
                    Disclose Salary
                  </label>
                </div>

                {salaryDisclosed ? (
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-mono text-[#A1A19A] mb-1">Currency</label>
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-full bg-[#181815] border border-[#2A2A28] rounded px-2.5 py-1.5 text-xs text-[#E5E2DE] focus:border-[#D6A85F] focus:outline-none"
                      >
                        <option value="INR">INR (₹)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-[#A1A19A] mb-1">Frequency</label>
                      <select
                        value={salaryType}
                        onChange={(e) => setSalaryType(e.target.value)}
                        className="w-full bg-[#181815] border border-[#2A2A28] rounded px-2.5 py-1.5 text-xs text-[#E5E2DE] focus:border-[#D6A85F] focus:outline-none"
                      >
                        <option value="ANNUAL">Annual</option>
                        <option value="MONTHLY">Monthly</option>
                        <option value="HOURLY">Hourly</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-[#A1A19A] mb-1">Minimum Salary</label>
                      <input 
                        type="number"
                        min="0"
                        value={minSalary}
                        onChange={(e) => setMinSalary(e.target.value ? Number(e.target.value) : '')}
                        placeholder="e.g. 120000"
                        className="w-full bg-[#181815] border border-[#2A2A28] rounded px-2.5 py-1.5 text-xs text-[#E5E2DE] focus:border-[#D6A85F] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-[#A1A19A] mb-1">Maximum Salary</label>
                      <input 
                        type="number"
                        min="0"
                        value={maxSalary}
                        onChange={(e) => setMaxSalary(e.target.value ? Number(e.target.value) : '')}
                        placeholder="e.g. 180000"
                        className="w-full bg-[#181815] border border-[#2A2A28] rounded px-2.5 py-1.5 text-xs text-[#E5E2DE] focus:border-[#D6A85F] focus:outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[#A1A19A] italic py-2">
                    Salary will be marked as "Salary not disclosed" on public candidate job portals.
                  </p>
                )}
                {stepErrors.salary && <p className="text-[10px] text-rose-400">{stepErrors.salary}</p>}
              </div>
            </div>
          )}

          {/* ══════════════════ STEP 02 — SCREENING CONFIGURATION ══════════════════ */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-[#2A2A28] pb-3">
                <h3 className="text-sm font-bold text-[#F4F1E9] flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-[#D6A85F]">filter_alt</span>
                  02. Autonomous Screening Rules & Questions
                </h3>
                <p className="text-xs text-[#A1A19A]">Configure resume parsing, required credentials, and custom screening questions.</p>
              </div>

              {/* Toggles & Core Requirements */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-[#11110F] border border-[#2A2A28] rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#F4F1E9]">Enable AI Resume Screening</span>
                    <input 
                      type="checkbox"
                      checked={screeningEnabled}
                      onChange={(e) => setScreeningEnabled(e.target.checked)}
                      className="rounded border-[#2A2A28] text-[#D6A85F] focus:ring-0"
                    />
                  </div>
                  <p className="text-[11px] text-[#A1A19A]">
                    Parses candidate resumes with semantic vector embeddings and scores relevance against job requirements.
                  </p>

                  <div className="pt-2 border-t border-[#2A2A28]">
                    <label className="block text-[11px] font-mono text-[#A1A19A] mb-1">Education Requirement</label>
                    <select
                      value={educationRequirements}
                      onChange={(e) => setEducationRequirements(e.target.value)}
                      className="w-full bg-[#181815] border border-[#2A2A28] rounded px-3 py-1.5 text-xs text-[#E5E2DE] focus:border-[#D6A85F] focus:outline-none"
                    >
                      <option value="Any / No Requirement">Any / No Requirement</option>
                      <option value="High School / GED">High School / GED</option>
                      <option value="Associate Degree">Associate Degree</option>
                      <option value="Bachelor's Degree">Bachelor's Degree</option>
                      <option value="Master's Degree">Master's Degree</option>
                      <option value="Ph.D. / Doctorate">Ph.D. / Doctorate</option>
                    </select>
                  </div>
                </div>

                <div className="p-4 bg-[#11110F] border border-[#2A2A28] rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#F4F1E9]">Mandatory Resume Upload</span>
                    <input 
                      type="checkbox"
                      checked={resumeRequired}
                      onChange={(e) => setResumeRequired(e.target.checked)}
                      className="rounded border-[#2A2A28] text-[#D6A85F] focus:ring-0"
                    />
                  </div>
                  <p className="text-[11px] text-[#A1A19A]">
                    Candidates must upload a PDF/DOCX resume when submitting their application.
                  </p>

                  {/* Certifications Input */}
                  <div className="pt-2 border-t border-[#2A2A28]">
                    <label className="block text-[11px] font-mono text-[#A1A19A] mb-1">Certifications (Optional)</label>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={certInput}
                        onChange={(e) => setCertInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCert(); } }}
                        placeholder="e.g. AWS Solutions Architect..."
                        className="flex-1 bg-[#181815] border border-[#2A2A28] rounded px-2.5 py-1 text-xs text-[#E5E2DE] focus:border-[#D6A85F] focus:outline-none"
                      />
                      <button 
                        type="button"
                        onClick={handleAddCert}
                        className="px-2.5 py-1 bg-[#20201C] text-xs font-semibold rounded text-[#E5E2DE]"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {certifications.map(c => (
                        <span key={c} className="text-[10px] font-mono bg-[#20201C] border border-[#2A2A28] px-2 py-0.5 rounded text-[#A1A19A] flex items-center gap-1">
                          {c}
                          <button type="button" onClick={() => handleRemoveCert(c)}>×</button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Custom Screening Questions Section */}
              <div className="p-4 bg-[#11110F] border border-[#2A2A28] rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-[#F4F1E9] flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-[#D6A85F]">quiz</span>
                      Candidate Screening Questions ({screeningQuestions.length})
                    </h4>
                    <p className="text-[11px] text-[#A1A19A]">Applicants answer these questions during submission for AI evaluation.</p>
                  </div>
                </div>

                {/* List of Questions */}
                <div className="space-y-2">
                  {screeningQuestions.map((q, idx) => (
                    <div key={idx} className="flex items-start justify-between gap-3 p-3 bg-[#181815] border border-[#2A2A28] rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#D6A85F]/20 text-[#F4C377]">
                            {q.category || 'General'}
                          </span>
                          {q.is_required && (
                            <span className="text-[10px] font-mono text-rose-300">Required</span>
                          )}
                          <span className="text-[10px] font-mono text-[#A1A19A]">Weight: {q.weight ?? 1.0}x</span>
                        </div>
                        <p className="text-xs text-[#E5E2DE] font-medium">{q.question_text}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveScreeningQuestion(idx)}
                        className="text-[#A1A19A] hover:text-rose-400 text-sm p-1"
                        title="Delete question"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Question Form */}
                <div className="pt-3 border-t border-[#2A2A28] space-y-2">
                  <label className="block text-[11px] font-mono text-[#A1A19A]">Add New Screening Question</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input 
                      type="text"
                      value={newQuestionText}
                      onChange={(e) => setNewQuestionText(e.target.value)}
                      placeholder="e.g. Do you have experience deploying models on Kubernetes?"
                      className="flex-1 bg-[#181815] border border-[#2A2A28] rounded-lg px-3 py-2 text-xs text-[#E5E2DE] focus:border-[#D6A85F] focus:outline-none"
                    />
                    <select
                      value={newQuestionCategory}
                      onChange={(e) => setNewQuestionCategory(e.target.value)}
                      className="bg-[#181815] border border-[#2A2A28] rounded-lg px-3 py-2 text-xs text-[#E5E2DE] focus:border-[#D6A85F] focus:outline-none"
                    >
                      <option value="Technical">Technical</option>
                      <option value="Experience">Experience</option>
                      <option value="Behavioral">Behavioral</option>
                      <option value="General">General</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleAddScreeningQuestion}
                      className="px-4 py-2 bg-[#D6A85F] text-[#11110F] text-xs font-bold rounded-lg hover:bg-[#F4C377] transition-all"
                    >
                      + Add Question
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════ STEP 03 — SHORTLIST CONFIGURATION ══════════════════ */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-[#2A2A28] pb-3">
                <h3 className="text-sm font-bold text-[#F4F1E9] flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-[#D6A85F]">leaderboard</span>
                  03. Shortlisting Quotas & Cutoff Thresholds
                </h3>
                <p className="text-xs text-[#A1A19A]">Control the autonomous shortlisting pipeline, target counts, and qualification score cutoffs.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-[#11110F] border border-[#2A2A28] rounded-xl space-y-4">
                  <div>
                    <label className="block text-xs font-mono font-bold text-[#F4F1E9] mb-1">
                      Target Shortlist Count <span className="text-rose-400">*</span>
                    </label>
                    <p className="text-[11px] text-[#A1A19A] mb-2">
                      The desired number of top-tier candidates the AI should shortlist for this campaign.
                    </p>
                    <input 
                      type="number"
                      min="1"
                      max="500"
                      value={targetShortlistCount}
                      onChange={(e) => setTargetShortlistCount(Number(e.target.value))}
                      className="w-full bg-[#181815] border border-[#2A2A28] rounded-lg px-3 py-2 text-xs text-[#E5E2DE] focus:border-[#D6A85F] focus:outline-none"
                    />
                    {stepErrors.targetShortlist && <p className="text-[10px] text-rose-400 mt-1">{stepErrors.targetShortlist}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold text-[#F4F1E9] mb-1">
                      Shortlist Match Threshold (%) <span className="text-rose-400">*</span>
                    </label>
                    <p className="text-[11px] text-[#A1A19A] mb-2">
                      Minimum AI overall match percentage required for a candidate to qualify for shortlisting.
                    </p>
                    <div className="flex items-center gap-3">
                      <input 
                        type="range"
                        min="50"
                        max="95"
                        value={shortlistThreshold}
                        onChange={(e) => setShortlistThreshold(Number(e.target.value))}
                        className="flex-1 accent-[#D6A85F]"
                      />
                      <span className="font-mono text-xs font-bold text-[#F4C377] w-12 text-right">
                        {shortlistThreshold}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-[#11110F] border border-[#2A2A28] rounded-xl space-y-4">
                  <div>
                    <label className="block text-xs font-mono font-bold text-[#F4F1E9] mb-1">
                      Max Interview Candidates
                    </label>
                    <p className="text-[11px] text-[#A1A19A] mb-2">
                      Upper bound of shortlisted candidates allowed to conduct voice interviews concurrently.
                    </p>
                    <input 
                      type="number"
                      min="1"
                      max="100"
                      value={maxInterviewCandidates}
                      onChange={(e) => setMaxInterviewCandidates(Number(e.target.value))}
                      className="w-full bg-[#181815] border border-[#2A2A28] rounded-lg px-3 py-2 text-xs text-[#E5E2DE] focus:border-[#D6A85F] focus:outline-none"
                    />
                  </div>

                  <div className="pt-2 border-t border-[#2A2A28]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-[#F4F1E9]">Autonomous Auto-Shortlist</span>
                      <input 
                        type="checkbox"
                        checked={autoShortlist}
                        onChange={(e) => setAutoShortlist(e.target.checked)}
                        className="rounded border-[#2A2A28] text-[#D6A85F] focus:ring-0"
                      />
                    </div>
                    <p className="text-[11px] text-[#A1A19A]">
                      When enabled, applicants meeting threshold will be automatically shortlisted and dispatched interview invitations without manual recruiter gating.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════ STEP 04 — INTERVIEW CONFIGURATION ══════════════════ */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-[#2A2A28] pb-3">
                <h3 className="text-sm font-bold text-[#F4F1E9] flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-[#D6A85F]">mic</span>
                  04. Autonomous AI Voice Interview & Rubric
                </h3>
                <p className="text-xs text-[#A1A19A]">Configure real-time voice interview mode, duration, difficulty, topics, and evaluation rubric.</p>
              </div>

              {/* Mode, Duration, Difficulty */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-[#11110F] border border-[#2A2A28] rounded-xl space-y-1">
                  <label className="block text-[11px] font-mono text-[#A1A19A]">Interview Mode</label>
                  <div className="text-xs font-bold text-[#F4C377] flex items-center gap-1.5 pt-1">
                    <span className="material-symbols-outlined text-sm text-teal-400">record_voice_over</span>
                    Autonomous AI Voice (WebRTC)
                  </div>
                </div>

                <div className="p-4 bg-[#11110F] border border-[#2A2A28] rounded-xl space-y-1">
                  <label className="block text-[11px] font-mono text-[#A1A19A]">Duration</label>
                  <select
                    value={interviewDurationMins}
                    onChange={(e) => setInterviewDurationMins(Number(e.target.value))}
                    className="w-full bg-[#181815] border border-[#2A2A28] rounded px-2.5 py-1 text-xs text-[#E5E2DE] focus:border-[#D6A85F] focus:outline-none"
                  >
                    <option value={10}>10 Minutes (Express Screen)</option>
                    <option value={15}>15 Minutes (Standard)</option>
                    <option value={20}>20 Minutes (In-Depth)</option>
                    <option value={30}>30 Minutes (Comprehensive)</option>
                  </select>
                </div>

                <div className="p-4 bg-[#11110F] border border-[#2A2A28] rounded-xl space-y-1">
                  <label className="block text-[11px] font-mono text-[#A1A19A]">Difficulty</label>
                  <select
                    value={interviewDifficulty}
                    onChange={(e: any) => setInterviewDifficulty(e.target.value)}
                    className="w-full bg-[#181815] border border-[#2A2A28] rounded px-2.5 py-1 text-xs text-[#E5E2DE] focus:border-[#D6A85F] focus:outline-none"
                  >
                    <option value="EASY">Easy (Foundational)</option>
                    <option value="MEDIUM">Medium (Production Applied)</option>
                    <option value="HARD">Hard (Advanced Architecture)</option>
                    <option value="EXPERT">Expert (Deep Research/Systems)</option>
                  </select>
                </div>
              </div>

              {/* Technical & Behavioral Topics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Tech Topics */}
                <div className="p-4 bg-[#11110F] border border-[#2A2A28] rounded-xl space-y-2">
                  <label className="block text-xs font-mono font-bold text-[#F4F1E9]">Technical Focus Topics</label>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={techTopicInput}
                      onChange={(e) => setTechTopicInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTechTopic(); } }}
                      placeholder="e.g. Distributed Caching..."
                      className="flex-1 bg-[#181815] border border-[#2A2A28] rounded px-2.5 py-1.5 text-xs text-[#E5E2DE] focus:border-[#D6A85F] focus:outline-none"
                    />
                    <button type="button" onClick={handleAddTechTopic} className="px-3 py-1.5 bg-[#20201C] rounded text-xs font-semibold">
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 min-h-[30px] pt-1">
                    {techTopics.map(t => (
                      <span key={t} className="text-xs font-mono px-2 py-0.5 rounded bg-teal-500/15 text-teal-300 border border-teal-500/30 flex items-center gap-1">
                        {t}
                        <button type="button" onClick={() => handleRemoveTechTopic(t)}>×</button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Behavioral Topics */}
                <div className="p-4 bg-[#11110F] border border-[#2A2A28] rounded-xl space-y-2">
                  <label className="block text-xs font-mono font-bold text-[#F4F1E9]">Behavioral Focus Topics</label>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={behavioralTopicInput}
                      onChange={(e) => setBehavioralTopicInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddBehavioralTopic(); } }}
                      placeholder="e.g. Conflict Resolution..."
                      className="flex-1 bg-[#181815] border border-[#2A2A28] rounded px-2.5 py-1.5 text-xs text-[#E5E2DE] focus:border-[#D6A85F] focus:outline-none"
                    />
                    <button type="button" onClick={handleAddBehavioralTopic} className="px-3 py-1.5 bg-[#20201C] rounded text-xs font-semibold">
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 min-h-[30px] pt-1">
                    {behavioralTopics.map(t => (
                      <span key={t} className="text-xs font-mono px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                        {t}
                        <button type="button" onClick={() => handleRemoveBehavioralTopic(t)}>×</button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Rubric Weights */}
              <div className="p-4 bg-[#11110F] border border-[#2A2A28] rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#F4F1E9] flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-[#D6A85F]">tune</span>
                    Evaluation Rubric Weights (Total: {rubric.communication + rubric.technical + rubric.problemSolving + rubric.roleFit}%)
                  </h4>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Technical Knowledge', key: 'technical', val: rubric.technical },
                    { label: 'Communication', key: 'communication', val: rubric.communication },
                    { label: 'Problem Solving', key: 'problemSolving', val: rubric.problemSolving },
                    { label: 'Role Fit', key: 'roleFit', val: rubric.roleFit },
                  ].map(r => (
                    <div key={r.key} className="p-2.5 bg-[#181815] border border-[#2A2A28] rounded-lg space-y-1">
                      <div className="flex justify-between text-[11px] font-mono text-[#A1A19A]">
                        <span>{r.label}</span>
                        <span className="font-bold text-[#F4C377]">{r.val}%</span>
                      </div>
                      <input 
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={r.val}
                        onChange={(e) => setRubric({ ...rubric, [r.key]: Number(e.target.value) })}
                        className="w-full accent-[#D6A85F]"
                      />
                    </div>
                  ))}
                </div>
                {stepErrors.rubric && <p className="text-[10px] text-rose-400">{stepErrors.rubric}</p>}
              </div>
            </div>
          )}

          {/* ══════════════════ STEP 05 — REVIEW & LAUNCH ══════════════════ */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b border-[#2A2A28] pb-3">
                <h3 className="text-sm font-bold text-[#F4F1E9] flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-[#D6A85F]">fact_check</span>
                  05. Comprehensive Campaign Review
                </h3>
                <p className="text-xs text-[#A1A19A]">Verify all job specifications and autonomous agent settings before publishing.</p>
              </div>

              {/* Review Cards Grid */}
              <div className="space-y-3">
                {/* 1. Job Role Card */}
                <div className="p-4 bg-[#11110F] border border-[#2A2A28] rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-mono font-bold text-[#F4C377] uppercase">Role & Organization</h4>
                    <button type="button" onClick={() => setCurrentStep(1)} className="text-[10px] text-[#D6A85F] underline">Edit</button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] font-mono text-[#A1A19A] block">Title</span>
                      <span className="font-bold text-[#F4F1E9]">{title || 'Untitled'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-[#A1A19A] block">Department</span>
                      <span className="text-[#E5E2DE]">{resolvedDepartment}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-[#A1A19A] block">Company</span>
                      <span className="text-[#E5E2DE]">{companyName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-[#A1A19A] block">Location & Mode</span>
                      <span className="text-[#E5E2DE]">{location} ({workMode})</span>
                    </div>
                  </div>
                </div>

                {/* 2. Skills & Salary */}
                <div className="p-4 bg-[#11110F] border border-[#2A2A28] rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-mono font-bold text-[#F4C377] uppercase">Skills & Compensation</h4>
                    <button type="button" onClick={() => setCurrentStep(1)} className="text-[10px] text-[#D6A85F] underline">Edit</button>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div>
                      <span className="text-[10px] font-mono text-[#A1A19A]">Required Skills: </span>
                      <span className="text-[#F4C377] font-mono">{requiredSkills.join(', ') || 'None specified'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-[#A1A19A]">Salary: </span>
                      <span className="text-[#E5E2DE] font-mono">
                        {salaryDisclosed && minSalary !== '' && maxSalary !== ''
                          ? `${currency} ${Number(minSalary).toLocaleString()} - ${Number(maxSalary).toLocaleString()} / ${salaryType}`
                          : 'Salary not disclosed'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Screening & Shortlist Config */}
                <div className="p-4 bg-[#11110F] border border-[#2A2A28] rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-mono font-bold text-[#F4C377] uppercase">Autonomous Screening & Shortlist</h4>
                    <button type="button" onClick={() => setCurrentStep(2)} className="text-[10px] text-[#D6A85F] underline">Edit</button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] font-mono text-[#A1A19A] block">AI Screening</span>
                      <span className="text-emerald-400 font-bold">{screeningEnabled ? 'ENABLED' : 'DISABLED'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-[#A1A19A] block">Shortlist Threshold</span>
                      <span className="text-[#F4C377] font-bold">{shortlistThreshold}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-[#A1A19A] block">Target Shortlist</span>
                      <span className="text-[#E5E2DE]">{targetShortlistCount} Candidates</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-[#A1A19A] block">Screening Questions</span>
                      <span className="text-[#E5E2DE]">{screeningQuestions.length} Custom Qs</span>
                    </div>
                  </div>
                </div>

                {/* 4. Interview Setup */}
                <div className="p-4 bg-[#11110F] border border-[#2A2A28] rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-mono font-bold text-[#F4C377] uppercase">AI Voice Interview Setup</h4>
                    <button type="button" onClick={() => setCurrentStep(4)} className="text-[10px] text-[#D6A85F] underline">Edit</button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] font-mono text-[#A1A19A] block">Mode & Duration</span>
                      <span className="text-[#E5E2DE]">WebRTC AI Voice • {interviewDurationMins}m</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-[#A1A19A] block">Difficulty</span>
                      <span className="text-[#E5E2DE]">{interviewDifficulty}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-[#A1A19A] block">Tech Topics</span>
                      <span className="text-[#E5E2DE]">{techTopics.length} configured</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-[#A1A19A] block">Rubric Distribution</span>
                      <span className="text-[#E5E2DE]">Tech {rubric.technical}% • Comm {rubric.communication}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ERROR NOTIFICATION BANNER */}
        {errorMsg && (
          <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-mono flex items-center gap-2 shrink-0">
            <span className="material-symbols-outlined text-sm">error</span>
            {errorMsg}
          </div>
        )}

        {/* MODAL FOOTER */}
        <div className="flex items-center justify-between border-t border-[#2A2A28] pt-4 shrink-0">
          <button
            type="button"
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            disabled={currentStep === 1 || isSubmitting}
            className="px-4 py-2 rounded-xl bg-[#20201C] text-[#E5E2DE] text-xs font-semibold hover:bg-[#2A2A28] disabled:opacity-30 transition-all"
          >
            ← Back
          </button>

          <div className="flex items-center gap-2">
            {currentStep === 5 ? (
              <>
                <button
                  type="button"
                  onClick={() => handleSubmit('DRAFT')}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-[#20201C] border border-[#2A2A28] text-[#E5E2DE] text-xs font-bold hover:bg-[#2A2A28] transition-all disabled:opacity-40"
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit('OPEN')}
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#D6A85F] text-[#11110F] text-xs font-bold shadow-lg hover:bg-[#F4C377] flex items-center gap-2 disabled:opacity-50 transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-[#11110F] border-t-transparent animate-spin" />
                      <span>Publishing Campaign...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">rocket_launch</span>
                      <span>Publish & Launch Campaign</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-[#D6A85F] text-[#11110F] text-xs font-bold shadow-md hover:bg-[#F4C377] flex items-center gap-1.5 transition-all"
              >
                <span>Continue</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
