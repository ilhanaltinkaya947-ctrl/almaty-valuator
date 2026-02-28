import { View, Text } from "@react-pdf/renderer";
import { styles, colors } from "./styles";
import type { ReportData } from "./types";

function formatPrice(n: number): string {
  return new Intl.NumberFormat("ru-RU").format(n);
}

export function PriceAnalysis({ data }: { data: ReportData }) {
  const coefficients = [
    { label: "Базовая ставка", value: `${formatPrice(data.baseRate)} тг/м²` },
    { label: "K комплекс", value: `×${data.kComplex.toFixed(2)}` },
    { label: "K год", value: `×${data.kYear.toFixed(2)}` },
    { label: "K материал", value: `×${data.kMaterial.toFixed(2)}` },
    ...(data.kFloor != null ? [{ label: "K этаж", value: `×${data.kFloor.toFixed(2)}` }] : []),
  ];

  return (
    <View style={styles.section}>
      <Text style={styles.label}>ЦЕНОВОЙ АНАЛИЗ</Text>
      <View style={styles.card}>
        {/* Buyback offer — primary */}
        <View style={{ alignItems: "center", marginBottom: 12 }}>
          <Text style={styles.caption}>Цена срочного выкупа</Text>
          <View style={{ ...styles.row, marginTop: 4 }}>
            <Text style={styles.priceText}>{formatPrice(data.totalPrice)}</Text>
            <Text style={styles.priceUnit}>тенге</Text>
          </View>
          <Text style={{ ...styles.body, marginTop: 4 }}>
            {formatPrice(data.pricePerSqm)} тг/м²
          </Text>
        </View>

        {/* Market reference */}
        <View style={{
          backgroundColor: "rgba(200,164,78,0.06)",
          borderRadius: 6,
          padding: 10,
          marginBottom: 12,
        }}>
          <View style={styles.spaceBetween}>
            <Text style={styles.body}>Рыночная стоимость</Text>
            <Text style={{ fontSize: 10, fontWeight: "bold", color: colors.textMuted }}>
              {formatPrice(data.marketPrice)} тг
            </Text>
          </View>
          <View style={{ ...styles.spaceBetween, marginTop: 4 }}>
            <Text style={styles.caption}>Скидка за срочность</Text>
            <Text style={{ fontSize: 9, color: colors.gold }}>−30%</Text>
          </View>
        </View>

        {/* Advantages of buyback */}
        <View style={{
          ...styles.row,
          justifyContent: "center",
          gap: 12,
          marginBottom: 14,
        }}>
          {["Выкуп за 24ч", "Без комиссий", "Оплата сразу"].map((tag) => (
            <View key={tag} style={{
              backgroundColor: "rgba(37,211,102,0.08)",
              borderRadius: 4,
              paddingHorizontal: 8,
              paddingVertical: 3,
            }}>
              <Text style={{ fontSize: 7, color: "#25D366", fontWeight: "bold" }}>{tag}</Text>
            </View>
          ))}
        </View>

        <View style={styles.divider} />

        {/* Coefficient breakdown */}
        <Text style={{ ...styles.h3, marginBottom: 10 }}>Разбивка коэффициентов</Text>
        {coefficients.map((c) => (
          <View key={c.label} style={{ ...styles.spaceBetween, marginBottom: 6 }}>
            <Text style={styles.body}>{c.label}</Text>
            <Text style={{ fontSize: 10, fontWeight: "bold", color: colors.white }}>
              {c.value}
            </Text>
          </View>
        ))}

        {/* Formula */}
        <View style={{ ...styles.divider, marginTop: 8 }} />
        <Text style={{ ...styles.caption, textAlign: "center" }}>
          Рынок = Площадь × Ставка × K_комплекс × K_год × K_материал
        </Text>
        <Text style={{ ...styles.caption, textAlign: "center", marginTop: 2 }}>
          Выкуп = Рынок × 0.70 (дисконт за срочность сделки)
        </Text>
      </View>
    </View>
  );
}
