package com.testautomation.listeners;

import com.testautomation.utils.ConfigReader;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.testng.ITestContext;
import org.testng.ITestListener;
import org.testng.ITestResult;

import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

/**
 * Builds a standalone Excel (.xlsx) workbook of test results using Apache
 * POI — this is the format a manual QA lead or a non-technical stakeholder
 * can open directly without needing a browser, alongside the HTML
 * ExtentReport produced by {@link ExtentReportListener}.
 *
 * Both listeners run side by side (both are valid ITestListener
 * implementations registered in testng.xml's <listeners> block) — they
 * don't interfere with each other, each just reacts to the same TestNG
 * events independently.
 *
 * One row per test method, columns: # | Test Name | Description |
 * Status | Duration (sec) | Failure Reason. PASS rows are shaded green,
 * FAIL rows red, SKIP rows amber, so the result is readable at a glance
 * even before anyone reads a single cell.
 */
public class ExcelReportListener implements ITestListener {

    private static final Logger logger = LogManager.getLogger(ExcelReportListener.class);
    private final List<RowData> rows = new ArrayList<>();

    /**
     * Plain holder class (not a Java record — this framework targets
     * Java 11, and records require Java 16+).
     */
    private static final class RowData {
        final String name;
        final String description;
        final String status;
        final double durationSeconds;
        final String failureReason;

        RowData(String name, String description, String status, double durationSeconds, String failureReason) {
            this.name = name;
            this.description = description;
            this.status = status;
            this.durationSeconds = durationSeconds;
            this.failureReason = failureReason;
        }
    }

    @Override
    public void onTestSuccess(ITestResult result) {
        rows.add(new RowData(
                result.getMethod().getMethodName(),
                safeDescription(result),
                "PASS",
                durationSeconds(result),
                ""));
    }

    @Override
    public void onTestFailure(ITestResult result) {
        rows.add(new RowData(
                result.getMethod().getMethodName(),
                safeDescription(result),
                "FAIL",
                durationSeconds(result),
                result.getThrowable() != null ? result.getThrowable().toString() : "Unknown failure"));
    }

    @Override
    public void onTestSkipped(ITestResult result) {
        rows.add(new RowData(
                result.getMethod().getMethodName(),
                safeDescription(result),
                "SKIP",
                durationSeconds(result),
                result.getThrowable() != null ? result.getThrowable().toString() : "Skipped (dependency failed)"));
    }

    private String safeDescription(ITestResult result) {
        String desc = result.getMethod().getDescription();
        return desc == null ? "" : desc;
    }

    private double durationSeconds(ITestResult result) {
        return (result.getEndMillis() - result.getStartMillis()) / 1000.0;
    }

    @Override
    public void onFinish(ITestContext context) {
        writeWorkbook();
    }

    private void writeWorkbook() {
        String path = ConfigReader.get("excelReportPath", "test-output/Test_Results.xlsx");

        try {
            Files.createDirectories(Paths.get(path).getParent());
        } catch (IOException e) {
            logger.error("Could not create output directory for Excel report: {}", e.getMessage());
            return;
        }

        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Test Results");

            CellStyle headerStyle = buildHeaderStyle(workbook);
            CellStyle passStyle = buildColoredStyle(workbook, IndexedColors.LIGHT_GREEN.getIndex());
            CellStyle failStyle = buildColoredStyle(workbook, IndexedColors.ROSE.getIndex());
            CellStyle skipStyle = buildColoredStyle(workbook, IndexedColors.LIGHT_YELLOW.getIndex());
            CellStyle plainStyle = workbook.createCellStyle();
            plainStyle.setWrapText(true);
            plainStyle.setVerticalAlignment(VerticalAlignment.TOP);

            // ---- Summary header block ----
            int rIdx = 0;
            Row titleRow = sheet.createRow(rIdx++);
            titleRow.createCell(0).setCellValue("Selenium + TestNG Automation — Test Results");
            titleRow.getCell(0).setCellStyle(headerStyle);

            Row metaRow = sheet.createRow(rIdx++);
            metaRow.createCell(0).setCellValue("Generated: " +
                    LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));

            long passCount = rows.stream().filter(r -> r.status.equals("PASS")).count();
            long failCount = rows.stream().filter(r -> r.status.equals("FAIL")).count();
            long skipCount = rows.stream().filter(r -> r.status.equals("SKIP")).count();

            Row summaryRow = sheet.createRow(rIdx++);
            summaryRow.createCell(0).setCellValue(
                    String.format("Total: %d | Passed: %d | Failed: %d | Skipped: %d",
                            rows.size(), passCount, failCount, skipCount));

            rIdx++; // blank spacer row

            // ---- Table header ----
            String[] headers = {"#", "Test Name", "Description", "Status", "Duration (sec)", "Failure Reason"};
            Row headerRow = sheet.createRow(rIdx++);
            for (int c = 0; c < headers.length; c++) {
                Cell cell = headerRow.createCell(c);
                cell.setCellValue(headers[c]);
                cell.setCellStyle(headerStyle);
            }

            // ---- Data rows ----
            int testNumber = 1;
            for (RowData r : rows) {
                Row row = sheet.createRow(rIdx++);
                CellStyle rowStyle;
                switch (r.status) {
                    case "PASS":
                        rowStyle = passStyle;
                        break;
                    case "FAIL":
                        rowStyle = failStyle;
                        break;
                    default:
                        rowStyle = skipStyle;
                        break;
                }

                setCell(row, 0, String.valueOf(testNumber++), rowStyle);
                setCell(row, 1, r.name, rowStyle);
                setCell(row, 2, r.description, rowStyle);
                setCell(row, 3, r.status, rowStyle);
                setCell(row, 4, String.format("%.2f", r.durationSeconds), rowStyle);
                setCell(row, 5, truncate(r.failureReason, 500), plainStyle);
            }

            // ---- Column widths ----
            int[] widths = {1500, 7000, 11000, 2500, 3500, 14000};
            for (int c = 0; c < widths.length; c++) {
                sheet.setColumnWidth(c, widths[c]);
            }

            try (FileOutputStream fos = new FileOutputStream(path)) {
                workbook.write(fos);
            }

            logger.info("Excel test-result workbook written to: {}", path);

        } catch (IOException e) {
            logger.error("Failed to write Excel report: {}", e.getMessage());
        }
    }

    private void setCell(Row row, int col, String value, CellStyle style) {
        Cell cell = row.createCell(col);
        cell.setCellValue(value);
        cell.setCellStyle(style);
    }

    private String truncate(String text, int max) {
        if (text == null) return "";
        return text.length() > max ? text.substring(0, max) + "..." : text;
    }

    private CellStyle buildHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setColor(IndexedColors.WHITE.getIndex());
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.BLUE_GREY.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        return style;
    }

    private CellStyle buildColoredStyle(Workbook workbook, short colorIndex) {
        CellStyle style = workbook.createCellStyle();
        style.setFillForegroundColor(colorIndex);
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setWrapText(true);
        style.setVerticalAlignment(VerticalAlignment.TOP);
        return style;
    }
}
