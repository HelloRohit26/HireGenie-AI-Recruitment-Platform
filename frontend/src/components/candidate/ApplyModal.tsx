import React, { useState, useRef } from 'react';
import { JobRequisition } from '../../types';
import { candidateService } from '../../services/candidateService';

interface ApplyModalProps {
  job: JobRequisition;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ApplyModal: React.FC<ApplyModalProps> = ({
  job,
  isOpen,
  onClose,
  onSuccess
}) => {
  const storedName = localStorage.getItem('hg_user_name') || 'Candidate User';
  const storedEmail = localStorage.getItem('hg_user_email') || 'candidate@gmail.com';
  const initials = storedName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'CU';

  const [coverNote, setCoverNote] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [resumeName, setResumeName] = useState<string>(`${storedName.replace(/\s+/g, '_')}_Resume.pdf`);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setResumeName(file.name);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setResumeName(file.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrorMsg('');
    let uploadedResumeId: number | undefined = undefined;

    try {
      if (selectedFile) {
        const uploadRes = await candidateService.uploadResume(selectedFile);
        if (uploadRes.data?.resume_id) {
          uploadedResumeId = uploadRes.data.resume_id;
        }
      }

      await candidateService.applyForJob({
        jobId: job.id,
        resumeId: uploadedResumeId,
        coverNote
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Application submission error:", err);
      const msg = err?.message || 'Unable to submit application. Please try again.';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'PDF Document';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(2)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg bg-[#181815] border border-[#2A2A28] rounded-xl shadow-2xl shadow-black/70 overflow-hidden animate-fadeIn p-6 space-y-5"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#2A2A28] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#79A89A]/15 text-[#79A89A] border border-[#79A89A]/30">
                Application Form
              </span>
            </div>
            <h2 className="text-base font-bold text-[#F4F1E9] mt-1">{job.title}</h2>
            <p className="text-xs text-[#A1A19A] font-mono">{job.department} • {job.location}</p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[#A1A19A] hover:text-[#F4F1E9] hover:bg-[#20201C] transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Profile Auto-Fill Preview */}
        <div className="bg-[#11110F] rounded-lg p-3 border border-[#2A2A28] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#79A89A]/20 border border-[#79A89A]/40 flex items-center justify-center font-bold text-xs text-[#79A89A]">
              {initials}
            </div>
            <div>
              <div className="text-xs font-semibold text-[#F4F1E9]">{storedName}</div>
              <div className="text-[10px] text-[#A1A19A] font-mono">{storedEmail}</div>
            </div>
          </div>
          <span className="text-[9px] font-mono text-[#79A89A] font-bold">Auto-Filled</span>
        </div>

        {/* Resume Interactive Upload Dropzone */}
        <div>
          <label className="text-[10px] text-[#A1A19A] uppercase tracking-wider font-mono block mb-1.5 flex items-center justify-between">
            <span>Resume / CV Attachment</span>
            <span className="text-[9px] text-[#79A89A]">PDF, DOCX, TXT</span>
          </label>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.txt"
            className="hidden"
          />

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border border-dashed rounded-lg p-4 cursor-pointer transition-all ${
              isDragging
                ? 'border-[#79A89A] bg-[#79A89A]/15 scale-[1.01]'
                : selectedFile
                ? 'border-emerald-500/50 bg-emerald-500/5'
                : 'border-[#79A89A]/40 bg-[#79A89A]/5 hover:border-[#79A89A] hover:bg-[#79A89A]/10'
            }`}
          >
            {selectedFile ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <span className="material-symbols-outlined text-lg">description</span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#F4F1E9] font-mono flex items-center gap-1.5">
                      {selectedFile.name}
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                        Ready
                      </span>
                    </div>
                    <div className="text-[10px] text-[#A1A19A] font-mono mt-0.5">
                      {formatFileSize(selectedFile.size)} • Click or drop to change
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                  }}
                  className="p-1 rounded hover:bg-rose-500/20 text-rose-400 transition-colors"
                  title="Remove File"
                >
                  <span className="material-symbols-outlined text-base">delete</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-2 text-center space-y-1">
                <div className="w-10 h-10 rounded-full bg-[#11110F] border border-[#2A2A28] flex items-center justify-center text-[#79A89A]">
                  <span className="material-symbols-outlined text-xl">upload_file</span>
                </div>
                <div className="text-xs font-bold text-[#F4F1E9]">
                  Click to select resume file or drag & drop here
                </div>
                <div className="text-[10px] text-[#A1A19A] font-mono">
                  Default profile resume ({resumeName}) will be attached if none selected.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Cover Note */}
        <div>
          <label className="text-[10px] text-[#A1A19A] uppercase tracking-wider font-mono block mb-1.5">
            Cover Note (Optional)
          </label>
          <textarea
            rows={3}
            value={coverNote}
            onChange={e => setCoverNote(e.target.value)}
            placeholder="Brief note highlighting your experience..."
            className="w-full bg-[#11110F] border border-[#2A2A28] rounded-lg px-3 py-2 text-xs text-[#F4F1E9] placeholder-[#A1A19A] outline-none focus:border-[#79A89A] transition-colors resize-none"
          />
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300 font-mono">
            {errorMsg}
          </div>
        )}

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full py-2.5 rounded-lg bg-[#79A89A] text-[#11110F] font-bold text-xs shadow-lg hover:bg-[#AACEFF] transition-all flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <span className="w-4 h-4 rounded-full border-2 border-[#11110F] border-t-transparent animate-spin" />
              Uploading Resume & Submitting...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-sm">send</span>
              Submit Application & Trigger AI Screening
            </>
          )}
        </button>
      </div>
    </div>
  );
};

