import { jsPDF } from 'jspdf';
import { Subject, Lesson } from '@/types/database';

export function exportSubjectLessonPlanPdf(
  subject: Subject,
  lessons: Lesson[],
  completionPercentage: number,
  completedTopics: number,
  totalTopics: number
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 18;

  // Header branding
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(37, 99, 235); // Blue 600
  doc.text('CampusFlow', 14, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Plan smarter. Teach on track. • Faculty Lesson Plan Export', 14, y + 5);

  y += 14;

  // Subject title card
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, pageWidth - 28, 22, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  const titleText = subject.subject_code
    ? `${subject.name} (${subject.subject_code})`
    : subject.name;
  doc.text(titleText, 18, y + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Semester: ${subject.semester_start_date} to ${subject.semester_end_date}  |  Exported: ${new Date().toLocaleDateString('en-GB')}`,
    18,
    y + 14
  );

  doc.text(
    `Topic Progress: ${completedTopics}/${totalTopics} topics (${completionPercentage}%)  |  Total Lessons: ${lessons.length}`,
    18,
    y + 18.5
  );

  y += 28;

  // Table Headers
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, pageWidth - 28, 7, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('#', 16, y + 5);
  doc.text('Date', 24, y + 5);
  doc.text('Period', 45, y + 5);
  doc.text('Topic & Unit Name', 70, y + 5);
  doc.text('Status', 165, y + 5);

  y += 8;

  // Table Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  lessons.forEach((l, idx) => {
    // Check page overflow
    if (y > 275) {
      doc.addPage();
      y = 18;
      // Re-draw subheader
      doc.setFillColor(241, 245, 249);
      doc.rect(14, y, pageWidth - 28, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text('#', 16, y + 5);
      doc.text('Date', 24, y + 5);
      doc.text('Period', 45, y + 5);
      doc.text('Topic & Unit Name', 70, y + 5);
      doc.text('Status', 165, y + 5);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      y += 8;
    }

    doc.setTextColor(15, 23, 42);
    doc.text(String(idx + 1), 16, y + 4);
    doc.text(l.scheduled_date, 24, y + 4);
    doc.text(`${l.period_start}–${l.period_end}`, 45, y + 4);

    const topicLabel = `${l.unit_title ? `[${l.unit_title}] ` : ''}${l.topic_title || 'Topic'}`;
    const truncatedTopic = topicLabel.length > 55 ? topicLabel.substring(0, 52) + '...' : topicLabel;
    doc.text(truncatedTopic, 70, y + 4);

    // Status styling
    if (l.status === 'completed') {
      doc.setTextColor(16, 185, 129); // Emerald
      doc.text('COMPLETED', 165, y + 4);
    } else if (l.status === 'not_completed') {
      doc.setTextColor(244, 63, 94); // Rose
      doc.text('MISSED', 165, y + 4);
    } else {
      doc.setTextColor(100, 116, 139); // Slate
      doc.text('PLANNED', 165, y + 4);
    }

    doc.setDrawColor(241, 245, 249);
    doc.line(14, y + 6, pageWidth - 14, y + 6);

    y += 6.5;
  });

  // Save the PDF
  const safeFilename = `${subject.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_lesson_plan.pdf`;
  doc.save(safeFilename);
}
