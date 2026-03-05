import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDate } from "./helpers";

function safeNaira(amount) {
  const normalized = Number(
    typeof amount === "string" ? amount.replace(/,/g, "") : amount || 0,
  );
  const safe = Number.isFinite(normalized) ? normalized : 0;
  return `N ${Math.round(safe).toLocaleString("en-NG")}`;
}

function download(doc, filename) {
  doc.save(filename);
}

function drawGeneratedWithTradeEase(doc, centerX, y) {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.8);
  const textLeft = "Generated with Trade";
  const textRight = "Ease";
  const leftWidth = doc.getTextWidth(textLeft);
  const rightWidth = doc.getTextWidth(textRight);
  const startX = centerX - (leftWidth + rightWidth) / 2;

  doc.setTextColor(75, 89, 118);
  doc.text(textLeft, startX, y);
  doc.setTextColor(0, 200, 150);
  doc.text(textRight, startX + leftWidth, y);
}

export function exportSessionPdf(session, user) {
  const doc = new jsPDF({ orientation: "landscape" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 12;
  const date = formatDate(session.createdAt);

  // Premium top header with brand colors.
  doc.setFillColor(9, 22, 47);
  doc.roundedRect(margin, 10, pageWidth - margin * 2, 24, 3, 3, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text("Trade", margin + 6, 24);
  const tradeWidth = doc.getTextWidth("Trade");
  doc.setTextColor(0, 200, 150);
  doc.text("Ease", margin + 6 + tradeWidth + 1, 24);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(225, 236, 255);
  doc.text(`User: ${user?.name || "Trader"}`, pageWidth - margin - 4, 18, {
    align: "right",
  });
  doc.text(`Session: ${session.name}`, pageWidth - margin - 4, 24, {
    align: "right",
  });
  doc.text(`Date: ${date}`, pageWidth - margin - 4, 30, { align: "right" });

  // Long shipment details strip with 4 segments.
  const stripY = 39;
  const stripH = 13;
  const stripW = pageWidth - margin * 2;
  const segmentW = stripW / 4;

  doc.setFillColor(238, 251, 246);
  doc.setDrawColor(0, 200, 150);
  doc.roundedRect(margin, stripY, stripW, stripH, 2, 2, "FD");
  doc.setDrawColor(189, 225, 211);
  doc.line(margin + segmentW, stripY, margin + segmentW, stripY + stripH);
  doc.line(
    margin + segmentW * 2,
    stripY,
    margin + segmentW * 2,
    stripY + stripH,
  );
  doc.line(
    margin + segmentW * 3,
    stripY,
    margin + segmentW * 3,
    stripY + stripH,
  );

  doc.setTextColor(12, 32, 65);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.2);
  doc.text(
    `Dollar Rate: $1 = ${safeNaira(session.constants.dollarRate)}`,
    margin + 2,
    stripY + 8,
  );
  doc.text(
    `Freight: $${Number(session.constants.freightUSD || 0).toLocaleString("en-US")}`,
    margin + segmentW + 2,
    stripY + 8,
  );
  doc.text(
    `Shipping Fee: ${safeNaira(session.constants.clearingNGN)}`,
    margin + segmentW * 2 + 2,
    stripY + 8,
  );
  doc.text(
    `Container CBM: ${Number(session.constants.containerCBM || 0).toLocaleString("en-US")}`,
    margin + segmentW * 3 + 2,
    stripY + 8,
  );

  const totals = session.items.reduce(
    (acc, item) => {
      acc.costPiece += Number(item.result?.costPerPiece || 0);
      acc.costCarton += Number(item.result?.totalCartonCost || 0);
      acc.sellingPiece += Number(item.pricing?.sellingPricePerPiece || 0);
      acc.sellingCarton += Number(item.pricing?.sellingPricePerCarton || 0);
      acc.profitCarton += Number(item.pricing?.profitPerCarton || 0);
      return acc;
    },
    {
      costPiece: 0,
      costCarton: 0,
      sellingPiece: 0,
      sellingCarton: 0,
      profitCarton: 0,
    },
  );

  autoTable(doc, {
    startY: 58,
    head: [
      [
        "#",
        "Item",
        "Cost/Piece",
        "Cost/Carton",
        "Selling/Piece",
        "Selling/Carton",
        "Profit/Carton",
      ],
    ],
    body: session.items.map((item, index) => [
      index + 1,
      item.itemName,
      safeNaira(item.result.costPerPiece),
      safeNaira(item.result.totalCartonCost),
      safeNaira(item.pricing?.sellingPricePerPiece || 0),
      safeNaira(item.pricing?.sellingPricePerCarton || 0),
      safeNaira(item.pricing?.profitPerCarton || 0),
    ]),
    foot: [
      [
        "",
        "TOTAL",
        safeNaira(totals.costPiece),
        safeNaira(totals.costCarton),
        safeNaira(totals.sellingPiece),
        safeNaira(totals.sellingCarton),
        safeNaira(totals.profitCarton),
      ],
    ],
    styles: { fontSize: 8.3, cellPadding: 3, textColor: [28, 32, 43] },
    headStyles: {
      fillColor: [11, 29, 67],
      textColor: [236, 244, 255],
    },
    footStyles: {
      fillColor: [11, 29, 67],
      textColor: [236, 244, 255],
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [246, 248, 252],
    },
  });
  doc.setTextColor(38, 52, 81);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(
    "Generated by TradeEase · tradeease.app",
    margin,
    doc.lastAutoTable.finalY + 12,
  );

  const filename = `${(user?.name || "Trader").replace(/\s+/g, "")}_${session.name.replace(/\s+/g, "-")}_${session.createdAt.slice(0, 10)}.pdf`;
  download(doc, filename);
}

export function exportInvoicePdf(invoice, business) {
  const rows = invoice.items || [];
  const itemTextMaxWidth = 46;
  const measureDoc = new jsPDF({ unit: "mm", format: [80, 180] });
  measureDoc.setFont("helvetica", "normal");
  measureDoc.setFontSize(10.5);
  const rowsHeight = rows.reduce((sum, row) => {
    const label = `${row.name} x${row.quantity}`;
    const lineCount = measureDoc.splitTextToSize(label, itemTextMaxWidth).length;
    return sum + lineCount * 4.6 + 2;
  }, 0);
  const paperHeight = Math.max(130, 94 + rowsHeight + 20);
  const doc = new jsPDF({ unit: "mm", format: [80, paperHeight] });
  const left = 6;
  const right = 74;
  let y = 10;

  const line = () => {
    doc.setDrawColor(205, 215, 234);
    doc.line(left, y, right, y);
    y += 4;
  };

  const kv = (label, value, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setTextColor(25, 31, 46);
    doc.text(label, left, y);
    doc.text(value, right, y, { align: "right" });
    y += 6;
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(20, 31, 50);
  doc.text((business?.name || "OUR STORE").toUpperCase(), left, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.8);
  doc.setTextColor(74, 84, 108);
  doc.text(
    `${business?.phone || ""}${business?.address ? " | " + business.address : ""}`.trim(),
    left,
    y,
  );
  y += 4;
  line();

  doc.setFontSize(10.5);
  kv("INVOICE", invoice.invoiceNumber, true);
  kv("Date:", formatDate(invoice.createdAt));
  kv("Customer:", invoice.customerName || "-");
  line();

  rows.forEach((row) => {
    const label = `${row.name} x${row.quantity}`;
    const lines = doc.splitTextToSize(label, itemTextMaxWidth);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(27, 35, 52);
    doc.text(lines, left, y);
    doc.setFont("helvetica", "bold");
    doc.text(safeNaira(row.subtotal), right, y, { align: "right" });
    y += lines.length * 4.6 + 2;
  });

  line();
  kv("TOTAL", safeNaira(invoice.grandTotal), true);
  y += 2;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(93, 105, 130);
  doc.text("Generated with TradeEase", left, y);

  const safeCustomer = (invoice.customerName || "Customer").replace(/\s+/g, "");
  const filename = `${invoice.invoiceNumber}_${safeCustomer}_${invoice.createdAt.slice(0, 10)}.pdf`;
  download(doc, filename);
}

export function exportInvoiceDetailedPdf(invoice, business) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const centerX = pageWidth / 2;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);
  doc.setTextColor(20, 31, 50);
  doc.text((business?.name || "Our Store").toUpperCase(), centerX, 18, {
    align: "center",
  });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(68, 82, 112);
  doc.text(
    `${business?.phone || ""} ${business?.address ? "| " + business.address : ""}`.trim(),
    centerX,
    25,
    { align: "center" },
  );
  doc.setDrawColor(191, 203, 228);
  doc.line(14, 29.5, pageWidth - 14, 29.5);

  doc.setTextColor(25, 31, 46);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11.2);
  doc.text("INVOICE", 14, 37);
  doc.text(invoice.invoiceNumber, pageWidth - 14, 37, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.text("Date:", 14, 43);
  doc.text(formatDate(invoice.createdAt), pageWidth - 14, 43, {
    align: "right",
  });
  doc.text("Customer:", 14, 49);
  doc.text(invoice.customerName || "-", pageWidth - 14, 49, {
    align: "right",
  });

  autoTable(doc, {
    startY: 55,
    head: [["Item", "Qty", "Price", "Total"]],
    body: invoice.items.map((row) => [
      row.name,
      String(row.quantity),
      safeNaira(row.unitPrice),
      safeNaira(row.subtotal),
    ]),
    foot: [
      [
        "",
        "",
        { content: "TOTAL", styles: { halign: "right" } },
        { content: safeNaira(invoice.grandTotal), styles: { halign: "right" } },
      ],
    ],
    theme: "grid",
    styles: {
      fontSize: 10,
      cellPadding: 3.2,
      textColor: [25, 32, 48],
    },
    headStyles: {
      fillColor: [232, 238, 249],
      textColor: [25, 32, 48],
      fontStyle: "bold",
    },
    footStyles: {
      fillColor: [232, 238, 249],
      textColor: [25, 32, 48],
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: 84 },
      1: { cellWidth: 18, halign: "right" },
      2: { cellWidth: 42, halign: "right" },
      3: { cellWidth: 42, halign: "right" },
    },
  });
  drawGeneratedWithTradeEase(doc, centerX, doc.lastAutoTable.finalY + 12);

  const safeCustomer = (invoice.customerName || "Customer").replace(/\s+/g, "");
  const filename = `${invoice.invoiceNumber}_${safeCustomer}_${invoice.createdAt.slice(0, 10)}.pdf`;
  download(doc, filename);
}
