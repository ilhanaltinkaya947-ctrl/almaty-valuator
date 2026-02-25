import { Document, Page, View, Text } from "@react-pdf/renderer";
import { styles, colors } from "./styles";
import { PassportBlock } from "./PassportBlock";
import { PriceAnalysis } from "./PriceAnalysis";
import { BenchmarkTable } from "./BenchmarkTable";
import { DeveloperInfo } from "./DeveloperInfo";
import { CTABlock } from "./CTABlock";
import type { ReportData } from "./types";

export function ReportDocument({ data }: { data: ReportData }) {
  return (
    <Document
      title={`Оценка — ${data.complexName}`}
      author="Алмавыкуп"
      subject="Отчёт по оценке недвижимости"
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={{ ...styles.spaceBetween, marginBottom: 24 }}>
          <View>
            <Text style={{ fontSize: 18, fontWeight: "bold", color: colors.gold }}>
              Алмавыкуп
            </Text>
            <Text style={{ fontSize: 8, color: colors.textMuted }}>
              Срочный выкуп недвижимости в Алматы
            </Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontSize: 8, color: colors.textMuted }}>
              Отчёт от {data.generatedAt}
            </Text>
            <Text style={{ fontSize: 8, color: colors.textMuted }}>
              almavykup.kz
            </Text>
          </View>
        </View>

        {/* Gold divider */}
        <View style={{ height: 2, backgroundColor: colors.gold, marginBottom: 24, borderRadius: 1 }} />

        {/* Block 1: Property Passport */}
        <PassportBlock data={data} />

        {/* Block 2: Price Analysis */}
        <PriceAnalysis data={data} />
      </Page>

      <Page size="A4" style={styles.page}>
        {/* Block 3: Benchmark Comparison */}
        <BenchmarkTable data={data} />

        {/* Block 4: Developer Analytics */}
        <DeveloperInfo data={data} />

        {/* Block 5: CTA */}
        <CTABlock />
      </Page>
    </Document>
  );
}
