import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { CompleteScanResult } from "@/types/scanner";

export function generateSecurityReportPdf(scan: CompleteScanResult) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // 1. Header Banner (Dark Navy Theme)
  doc.setFillColor(8, 11, 17); // #080b11
  doc.rect(0, 0, pageWidth, 40, "F");

  // Title & Subtitle
  doc.setTextColor(0, 255, 136); // Emerald / Neon Green #00ff88
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("SENTINEL CYBERSECURITY", 14, 18);

  doc.setTextColor(148, 163, 184); // Slate 400
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("EXECUTIVE POSTURE & COMPLIANCE HEALTH AUDIT", 14, 26);

  // Metadata block (Right side)
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text(`Target: ${scan.domain}`, pageWidth - 14, 16, { align: "right" });
  doc.text(`Scanned: ${new Date(scan.scannedAt).toLocaleDateString()} ${new Date(scan.scannedAt).toLocaleTimeString()}`, pageWidth - 14, 22, { align: "right" });
  doc.text(`Duration: ${scan.durationMs}ms`, pageWidth - 14, 28, { align: "right" });

  // 2. Executive Summary Box
  doc.setFillColor(15, 21, 34); // Surface card
  doc.roundedRect(14, 46, pageWidth - 28, 36, 3, 3, "F");

  doc.setTextColor(241, 245, 249);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("SECURITY RATING & POSTURE", 20, 56);

  // Grade & Score callout
  doc.setFontSize(26);
  if (scan.overallScore >= 85) {
    doc.setTextColor(16, 185, 129); // Green
  } else if (scan.overallScore >= 70) {
    doc.setTextColor(6, 182, 212); // Cyan
  } else if (scan.overallScore >= 55) {
    doc.setTextColor(245, 158, 11); // Amber
  } else {
    doc.setTextColor(239, 68, 68); // Red
  }
  doc.text(`GRADE: ${scan.grade}`, 20, 72);

  doc.setFontSize(14);
  doc.setTextColor(203, 213, 225);
  doc.text(`Overall Score: ${scan.overallScore}/100`, 90, 71);

  // Findings pill summaries
  doc.setFontSize(9);
  doc.setTextColor(239, 68, 68);
  doc.text(`Critical: ${scan.summary.criticalFindings}`, pageWidth - 20, 56, { align: "right" });
  doc.setTextColor(249, 115, 22);
  doc.text(`High: ${scan.summary.highFindings}`, pageWidth - 20, 62, { align: "right" });
  doc.setTextColor(234, 179, 8);
  doc.text(`Medium: ${scan.summary.mediumFindings}`, pageWidth - 20, 68, { align: "right" });
  doc.setTextColor(16, 185, 129);
  doc.text(`Passed Checks: ${scan.summary.totalPassed}`, pageWidth - 20, 74, { align: "right" });

  // 3. Category Score Table
  const categoryRows = [
    [
      "SSL / TLS Encryption",
      `${scan.categories.ssl.score} / ${scan.categories.ssl.maxScore} pts`,
      scan.categories.ssl.status.toUpperCase(),
      scan.categories.ssl.summary,
    ],
    [
      "HTTP Security Headers",
      `${scan.categories.headers.score} / ${scan.categories.headers.maxScore} pts`,
      scan.categories.headers.status.toUpperCase(),
      scan.categories.headers.summary,
    ],
    [
      "DNS & Email Hygiene",
      `${scan.categories.dns.score} / ${scan.categories.dns.maxScore} pts`,
      scan.categories.dns.status.toUpperCase(),
      scan.categories.dns.summary,
    ],
    [
      "HTTPS Redirection & Routing",
      `${scan.categories.https.score} / ${scan.categories.https.maxScore} pts`,
      scan.categories.https.status.toUpperCase(),
      scan.categories.https.summary,
    ],
  ];

  autoTable(doc, {
    startY: 88,
    head: [["Category", "Score", "Rating", "Summary Telemetry"]],
    body: categoryRows,
    theme: "grid",
    headStyles: {
      fillColor: [18, 24, 44],
      textColor: [0, 255, 136],
      fontStyle: "bold",
    },
    styles: {
      fontSize: 9,
      cellPadding: 3.5,
    },
  });

  // 4. SSL & DNS Details Breakdown
  let currentY = (doc as any).lastAutoTable.finalY + 8;

  doc.setTextColor(241, 245, 249);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("CORE TECHNICAL ATTRIBUTES", 14, currentY);

  const techRows = [
    ["TLS Protocol & Cipher", `${scan.sslDetails.protocol} | ${scan.sslDetails.cipherSuite || "Standard"}`],
    ["Certificate Expiration", `${scan.sslDetails.daysRemaining} days remaining (Valid to: ${scan.sslDetails.validTo ? new Date(scan.sslDetails.validTo).toLocaleDateString() : "N/A"})`],
    ["Certificate Issuer", `${scan.sslDetails.issuer.organization || scan.sslDetails.issuer.commonName || "Trusted Authority"}`],
    ["SPF Email Record", scan.dnsDetails.spf.rawRecord || "Missing (Vulnerable to spoofing)"],
    ["DMARC Policy", scan.dnsDetails.dmarc.rawRecord || "Missing (Vulnerable to BEC)"],
    ["DNSSEC Cryptographic Status", scan.dnsDetails.dnssec.details],
    ["Public Server Headers", scan.serverDisclosure.detectedTechnologies.join(", ") || "No server disclosure leaks"],
  ];

  autoTable(doc, {
    startY: currentY + 3,
    head: [["Inspection Point", "Observed Value"]],
    body: techRows,
    theme: "striped",
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [241, 245, 249],
    },
    styles: {
      fontSize: 8.5,
      cellPadding: 3,
    },
  });

  // 5. Findings & Recommendations Table
  currentY = (doc as any).lastAutoTable.finalY + 8;

  if (currentY > 240) {
    doc.addPage();
    currentY = 20;
  }

  doc.setTextColor(241, 245, 249);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("DETECTED FINDINGS & REMEDIATION MATRIX", 14, currentY);

  const findingRows = scan.findings.map((f) => [
    f.severity.toUpperCase(),
    f.title,
    f.description,
    f.recommendation,
  ]);

  autoTable(doc, {
    startY: currentY + 3,
    head: [["Severity", "Finding Title", "Vulnerability Impact", "Remediation Action"]],
    body: findingRows,
    theme: "grid",
    headStyles: {
      fillColor: [18, 24, 44],
      textColor: [241, 245, 249],
    },
    styles: {
      fontSize: 8,
      cellPadding: 3,
      overflow: "linebreak",
    },
    columnStyles: {
      0: { cellWidth: 22, fontStyle: "bold" },
      1: { cellWidth: 38 },
      2: { cellWidth: 60 },
      3: { cellWidth: 62 },
    },
  });

  // Footer on each page
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Sentinel Cybersecurity Monitor | Page ${i} of ${totalPages} | Confidential Audit`,
      pageWidth / 2,
      290,
      { align: "center" }
    );
  }

  // Trigger download
  doc.save(`Sentinel_Security_Report_${scan.domain.replace(/\./g, "_")}.pdf`);
}

