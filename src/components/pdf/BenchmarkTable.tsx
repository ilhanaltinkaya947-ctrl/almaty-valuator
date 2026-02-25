import { View, Text } from "@react-pdf/renderer";
import { styles, colors } from "./styles";
import type { ReportData } from "./types";

function formatPrice(n: number): string {
  return new Intl.NumberFormat("ru-RU").format(n);
}

export function BenchmarkTable({ data }: { data: ReportData }) {
  const benchmarks = data.benchmarks;

  if (!benchmarks || benchmarks.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.label}>СРАВНЕНИЕ С АНАЛОГАМИ</Text>
      <View style={styles.card}>
        <Text style={{ ...styles.h3, marginBottom: 12 }}>
          Похожие объекты в {data.district} районе
        </Text>

        {/* Table header */}
        <View style={{ ...styles.tableRow, borderBottomWidth: 2 }}>
          <Text style={{ ...styles.tableCellBold, flex: 2 }}>ЖК</Text>
          <Text style={styles.tableCellBold}>Класс</Text>
          <Text style={styles.tableCellBold}>Ср. цена/м²</Text>
          <Text style={styles.tableCellBold}>Разница</Text>
        </View>

        {/* Current property (highlighted) */}
        <View style={{ ...styles.tableRow, backgroundColor: "rgba(200,164,78,0.08)" }}>
          <Text style={{ ...styles.tableCellBold, flex: 2, color: colors.gold }}>
            {data.complexName} (ваш)
          </Text>
          <Text style={{ ...styles.tableCell, color: colors.gold }}>{data.classLabel}</Text>
          <Text style={{ ...styles.tableCell, color: colors.gold }}>
            {formatPrice(data.pricePerSqm)}
          </Text>
          <Text style={{ ...styles.tableCell, color: colors.gold }}>—</Text>
        </View>

        {/* Benchmark rows */}
        {benchmarks.map((b) => {
          const diff = ((b.avgPriceSqm - data.pricePerSqm) / data.pricePerSqm) * 100;
          const diffStr = diff > 0 ? `+${diff.toFixed(1)}%` : `${diff.toFixed(1)}%`;
          const diffColor = diff > 0 ? "#4CAF50" : "#F44336";

          return (
            <View key={b.name} style={styles.tableRow}>
              <Text style={{ ...styles.tableCell, flex: 2, color: colors.white }}>
                {b.name}
              </Text>
              <Text style={styles.tableCell}>{b.classLabel}</Text>
              <Text style={styles.tableCell}>{formatPrice(b.avgPriceSqm)}</Text>
              <Text style={{ ...styles.tableCell, color: diffColor }}>{diffStr}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
