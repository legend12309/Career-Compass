import { jsPDF } from 'jspdf';
import { Resume } from '../types';

export function exportResumeToPdf(resume: Resume): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 44;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const addSectionHeader = (title: string) => {
    ensureSpace(32);
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(28, 36, 48);
    doc.text(title.toUpperCase(), margin, y);
    y += 5;
    doc.setDrawColor(190, 198, 210);
    doc.setLineWidth(0.75);
    doc.line(margin, y, pageWidth - margin, y);
    y += 13;
  };

  const addWrappedParagraph = (
    text: string,
    fontSize = 9.5,
    fontStyle: 'normal' | 'bold' | 'italic' = 'normal',
    color: [number, number, number] = [45, 55, 72],
    indent = 0
  ) => {
    if (!text.trim()) return;
    doc.setFont('helvetica', fontStyle);
    doc.setFontSize(fontSize);
    doc.setTextColor(color[0], color[1], color[2]);
    const lines: string[] = doc.splitTextToSize(text.trim(), contentWidth - indent);
    const lineHeight = fontSize * 1.38;
    for (const line of lines) {
      ensureSpace(lineHeight + 2);
      doc.text(line, margin + indent, y);
      y += lineHeight;
    }
  };

  // Header (Single-column ATS-safe, no photos, no icons, no graphics)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(19);
  doc.setTextColor(18, 24, 34);
  const fullName = resume.personal.name.trim() || 'Your Name';
  doc.text(fullName, margin, y);
  y += 16;

  const contactParts = [
    resume.personal.location,
    resume.personal.email,
    resume.personal.phone,
    ...(resume.personal.links || []),
  ]
    .map((s) => s?.trim())
    .filter(Boolean);

  if (contactParts.length > 0) {
    addWrappedParagraph(contactParts.join('  |  '), 9, 'normal', [75, 85, 99]);
    y += 4;
  }

  // Summary
  if (resume.summary.trim()) {
    addSectionHeader('Professional Summary');
    addWrappedParagraph(resume.summary, 9.5, 'normal', [45, 55, 72]);
  }

  const renderExperience = () => {
    const validExp = resume.experience.filter((e) => e.role.trim() || e.company.trim());
    if (validExp.length === 0) return;
    addSectionHeader('Work & Practical Experience');
    for (const exp of validExp) {
      ensureSpace(34);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(22, 28, 36);
      const titleLine = [exp.role.trim(), exp.company.trim()].filter(Boolean).join(' — ');
      doc.text(titleLine, margin, y);

      const dateAndLoc = [
        [exp.startDate.trim(), exp.endDate.trim()].filter(Boolean).join(' - '),
        exp.location.trim(),
      ]
        .filter(Boolean)
        .join(' | ');

      if (dateAndLoc) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(95, 105, 120);
        doc.text(dateAndLoc, pageWidth - margin, y, { align: 'right' });
      }
      y += 13;
      if (exp.description.trim()) {
        addWrappedParagraph(exp.description, 9.5, 'normal', [50, 60, 75]);
      }
      y += 5;
    }
  };

  const renderEducation = () => {
    const validEdu = resume.education.filter((e) => e.degree.trim() || e.institution.trim());
    if (validEdu.length === 0) return;
    addSectionHeader('Education');
    for (const edu of validEdu) {
      ensureSpace(28);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(22, 28, 36);
      doc.text(edu.degree.trim() || 'Qualification', margin, y);

      const years = [edu.startYear.trim(), edu.endYear.trim()].filter(Boolean).join(' - ');
      if (years) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(95, 105, 120);
        doc.text(years, pageWidth - margin, y, { align: 'right' });
      }
      y += 13;

      const subLine = [
        edu.institution.trim(),
        edu.scoreOrCgpa.trim() ? `Grade / Score: ${edu.scoreOrCgpa.trim()}` : '',
      ]
        .filter(Boolean)
        .join('  •  ');
      if (subLine) {
        addWrappedParagraph(subLine, 9.5, 'normal', [60, 70, 85]);
      }
      y += 4;
    }
  };

  const renderProjects = () => {
    const validProjects = resume.projects.filter((p) => p.title.trim() || p.description.trim());
    if (validProjects.length === 0) return;
    addSectionHeader(resume.mode === 'academic' ? 'Research & Key Projects' : 'Projects & Case Studies');
    for (const proj of validProjects) {
      ensureSpace(32);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(22, 28, 36);
      const header = [
        proj.title.trim() || 'Project',
        proj.techStack.length > 0 ? `(${proj.techStack.join(', ')})` : '',
      ]
        .filter(Boolean)
        .join(' ');
      doc.text(header, margin, y);

      if (proj.link?.trim()) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(30, 58, 95);
        doc.text(proj.link.trim(), pageWidth - margin, y, { align: 'right' });
      }
      y += 13;
      if (proj.description.trim()) {
        addWrappedParagraph(proj.description, 9.5, 'normal', [50, 60, 75]);
      }
      y += 5;
    }
  };

  // Mode-adaptive section order
  if (resume.mode === 'experienced') {
    renderExperience();
    renderProjects();
    renderEducation();
  } else if (resume.mode === 'academic') {
    renderEducation();
    renderProjects();
    renderExperience();
  } else {
    // fresher default
    renderEducation();
    renderProjects();
    renderExperience();
  }

  // Skills
  const cleanSkills = resume.skills.map((s) => s.trim()).filter(Boolean);
  if (cleanSkills.length > 0) {
    addSectionHeader('Skills & Competencies');
    addWrappedParagraph(cleanSkills.join('  •  '), 9.5, 'normal', [40, 50, 65]);
  }

  // Certifications
  const cleanCerts = resume.certifications.map((c) => c.trim()).filter(Boolean);
  if (cleanCerts.length > 0) {
    addSectionHeader('Certifications & Licenses');
    for (const cert of cleanCerts) {
      addWrappedParagraph(`•  ${cert}`, 9.5, 'normal', [45, 55, 72], 4);
      y += 2;
    }
  }

  // Optional Sections (Volunteering, Languages, Achievements, Publications, Extracurricular)
  for (const sec of resume.optionalSections || []) {
    const validItems = sec.items.map((i) => i.trim()).filter(Boolean);
    if (validItems.length === 0) continue;
    addSectionHeader(sec.title || sec.type);
    for (const item of validItems) {
      addWrappedParagraph(`•  ${item}`, 9.5, 'normal', [45, 55, 72], 4);
      y += 2;
    }
  }

  const safeSlug =
    fullName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'career-compass';
  doc.save(`${safeSlug}-resume.pdf`);
}
