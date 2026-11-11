import React from 'react';
import { Resume } from '../../types';

interface ResumeLivePreviewProps {
  resume: Resume;
}

export const ResumeLivePreview: React.FC<ResumeLivePreviewProps> = ({ resume }) => {
  const {
    mode,
    personal,
    summary,
    education,
    experience,
    projects,
    skills,
    certifications,
    optionalSections,
  } = resume;

  const contactItems = [
    personal.location,
    personal.email,
    personal.phone,
    ...(personal.links || []),
  ]
    .map((s) => s?.trim())
    .filter(Boolean);

  const validEducation = education.filter((e) => e.degree.trim() || e.institution.trim());
  const validExperience = experience.filter((e) => e.role.trim() || e.company.trim());
  const validProjects = projects.filter((p) => p.title.trim() || p.description.trim());
  const validSkills = skills.map((s) => s.trim()).filter(Boolean);
  const validCerts = certifications.map((c) => c.trim()).filter(Boolean);
  const validOptional = (optionalSections || []).filter((sec) =>
    sec.items.some((item) => item.trim())
  );

  const educationBlock = validEducation.length > 0 && (
    <section className="mb-4">
      <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-1 mb-2">
        Education
      </h2>
      <div className="space-y-2.5">
        {validEducation.map((edu, idx) => (
          <div key={idx} className="text-xs">
            <div className="flex flex-wrap justify-between gap-2 font-semibold text-slate-900">
              <span>{edu.degree || 'Qualification'}</span>
              <span className="text-slate-600 font-normal">
                {[edu.startYear, edu.endYear].filter(Boolean).join(' – ')}
              </span>
            </div>
            <div className="text-slate-700 flex flex-wrap justify-between gap-2 mt-0.5">
              <span>{edu.institution}</span>
              {edu.scoreOrCgpa && (
                <span className="font-medium text-slate-800">Grade: {edu.scoreOrCgpa}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  const experienceBlock = validExperience.length > 0 && (
    <section className="mb-4">
      <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-1 mb-2">
        Work & Practical Experience
      </h2>
      <div className="space-y-3">
        {validExperience.map((exp, idx) => (
          <div key={idx} className="text-xs">
            <div className="flex flex-wrap justify-between gap-2 font-semibold text-slate-900">
              <span>{[exp.role, exp.company].filter(Boolean).join(' — ')}</span>
              <span className="text-slate-600 font-normal">
                {[
                  [exp.startDate, exp.endDate].filter(Boolean).join(' – '),
                  exp.location,
                ]
                  .filter(Boolean)
                  .join(' | ')}
              </span>
            </div>
            {exp.description && (
              <p className="text-slate-700 leading-relaxed mt-1 whitespace-pre-line">
                {exp.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );

  const projectsBlock = validProjects.length > 0 && (
    <section className="mb-4">
      <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-1 mb-2">
        {mode === 'academic' ? 'Research & Key Projects' : 'Projects & Case Studies'}
      </h2>
      <div className="space-y-3">
        {validProjects.map((proj, idx) => (
          <div key={idx} className="text-xs">
            <div className="flex flex-wrap justify-between gap-2 font-semibold text-slate-900">
              <div>
                <span>{proj.title || 'Project'}</span>
                {proj.techStack.length > 0 && (
                  <span className="text-slate-600 font-normal ml-1.5">
                    ({proj.techStack.join(', ')})
                  </span>
                )}
              </div>
              {proj.link && (
                <span className="text-[#1E3A5F] font-normal break-all">{proj.link}</span>
              )}
            </div>
            {proj.description && (
              <p className="text-slate-700 leading-relaxed mt-1 whitespace-pre-line">
                {proj.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );

  return (
    <div className="bg-white text-slate-900 border border-slate-200/90 rounded-[24px] shadow-sm p-6 sm:p-8 font-sans text-left">
      {/* Header: Single-column ATS-safe */}
      <header className="border-b border-slate-300 pb-3 mb-4">
        <div className="flex items-baseline justify-between gap-2">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            {personal.name.trim() || 'Your Full Name'}
          </h1>
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
            {mode === 'experienced'
              ? 'Experienced Format'
              : mode === 'academic'
                ? 'Academic / Research CV'
                : 'Fresher / Entry-Level Format'}
          </span>
        </div>
        {contactItems.length > 0 ? (
          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed break-words">
            {contactItems.join('  |  ')}
          </p>
        ) : (
          <p className="text-xs text-slate-400 mt-1 italic">
            Add your email, phone, city, and portfolio/profile links
          </p>
        )}
      </header>

      {/* Summary */}
      {summary.trim() && (
        <section className="mb-4">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-1 mb-2">
            Professional Summary
          </h2>
          <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">{summary}</p>
        </section>
      )}

      {/* Mode-based section ordering */}
      {mode === 'experienced' ? (
        <>
          {experienceBlock}
          {projectsBlock}
          {educationBlock}
        </>
      ) : (
        <>
          {educationBlock}
          {projectsBlock}
          {experienceBlock}
        </>
      )}

      {/* Skills */}
      {validSkills.length > 0 && (
        <section className="mb-4">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-1 mb-2">
            Skills & Competencies
          </h2>
          <p className="text-xs text-slate-800 leading-relaxed">{validSkills.join('  •  ')}</p>
        </section>
      )}

      {/* Certifications */}
      {validCerts.length > 0 && (
        <section className="mb-4">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-1 mb-2">
            Certifications & Licenses
          </h2>
          <ul className="list-disc list-inside text-xs text-slate-700 space-y-1">
            {validCerts.map((cert, idx) => (
              <li key={idx}>{cert}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Optional Sections */}
      {validOptional.map((sec, sIdx) => (
        <section key={sIdx} className="mb-4 last:mb-0">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-900 border-b border-slate-300 pb-1 mb-2">
            {sec.title || sec.type}
          </h2>
          <ul className="list-disc list-inside text-xs text-slate-700 space-y-1">
            {sec.items
              .map((i) => i.trim())
              .filter(Boolean)
              .map((item, iIdx) => (
                <li key={iIdx}>{item}</li>
              ))}
          </ul>
        </section>
      ))}
    </div>
  );
};
