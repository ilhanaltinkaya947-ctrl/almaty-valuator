import { View, Text } from "@react-pdf/renderer";
import { styles, colors } from "./styles";
import type { ReportData } from "./types";

function formatPrice(n: number): string {
  return new Intl.NumberFormat("ru-RU").format(n);
}

export function PriceAnalysis({ data }: { data: ReportData }) {
  const coefficients = [
    { label: "Базовая ставка", value: `${formatPrice(data.baseRate)} тг/м²` },
    { label: "K комплекс", value: `×${data.kComplex.toFixed(2)}`, impact: data.kComplex >= 1 ? "+" : "-" },
    { label: "K этаж", value: `×${data.kFloor.toFixed(2)}`, impact: data.kFloor >= 1 ? "+" : "-" },
    { label: "K год", value: `×${data.kYear.toFixed(2)}`, impact: data.kYear >= 1 ? "+" : "-" },
    { label: "K вид", value: `×${data.kView.toFixed(2)}`, impact: data.kView >= 1 ? "+" : "-" },
    { label: "K состояние", value: `×${data.kCondition.toFixed(2)}`, impact: data.kCondition >= 1 ? "+" : "-" },
  ];

  return (
    <View style={styles.section}>
      <Text style={styles.label}>ЦЕНОВОЙ АНАЛИЗ</Text>
      <View style={styles.card}>
        {/* Main price */}
        <View style={{ alignItems: "center", marginBottom: 16 }}>
          <Text style={styles.caption}>Рыночная стоимость</Text>
          <View style={{ ...styles.row, marginTop: 4 }}>
            <Text style={styles.priceText}>{formatPrice(data.totalPrice)}</Text>
            <Text style={styles.priceUnit}>тенге</Text>
          </View>
          <Text style={{ ...styles.body, marginTop: 4 }}>
            {formatPrice(data.pricePerSqm)} тг/м²
          </Text>
        </View>

        <View style={styles.divider} />

        {/* Coefficient breakdown */}
        <Text style={{ ...styles.h3, marginBottom: 10 }}>Разбивка коэффициентов</Text>
        {coefficients.map((c) => (
          <View key={c.label} style={{ ...styles.spaceBetween, marginBottom: 6 }}>
            <Text style={styles.body}>{c.label}</Text>
            <View style={styles.row}>
              <Text style={{ fontSize: 10, fontWeight: "bold", color: colors.white }}>
                {c.value}
              </Text>
            </View>
          </View>
        ))}

        {/* Formula */}
        <View style={{ ...styles.divider, marginTop: 8 }} />
        <Text style={{ ...styles.caption, textAlign: "center" }}>
          Формула: Площадь × Базовая ставка × K_комплекс × K_этаж × K_год × K_вид × K_состояние
        </Text>
      </View>
    </View>
  );
}
