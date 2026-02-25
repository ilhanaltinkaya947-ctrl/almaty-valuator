import { View, Text } from "@react-pdf/renderer";
import { styles, colors } from "./styles";
import type { ReportData } from "./types";

export function DeveloperInfo({ data }: { data: ReportData }) {
  const items = [
    { label: "Застройщик", value: data.developer },
    { label: "Класс жилья", value: data.classLabel },
    { label: "Индекс ликвидности", value: `${(data.liquidityIndex * 100).toFixed(0)}%` },
    { label: "Источник данных", value: "krisha.kz" },
  ];

  return (
    <View style={styles.section}>
      <Text style={styles.label}>АНАЛИТИКА ЗАСТРОЙЩИКА</Text>
      <View style={styles.card}>
        <Text style={styles.h2}>{data.developer}</Text>
        <Text style={{ ...styles.caption, marginBottom: 16 }}>
          Историческая динамика и аналитика
        </Text>

        {items.map((item, i) => (
          <View
            key={item.label}
            style={{
              ...styles.spaceBetween,
              paddingVertical: 6,
              borderBottomWidth: i < items.length - 1 ? 1 : 0,
              borderBottomColor: colors.cardBorder,
            }}
          >
            <Text style={styles.body}>{item.label}</Text>
            <Text style={{ fontSize: 10, fontWeight: "bold", color: colors.white }}>
              {item.value}
            </Text>
          </View>
        ))}

        {/* Liquidity bar */}
        <View style={{ marginTop: 16 }}>
          <Text style={{ ...styles.caption, marginBottom: 4 }}>Ликвидность объекта</Text>
          <View style={{ height: 8, backgroundColor: colors.cardBorder, borderRadius: 4 }}>
            <View
              style={{
                height: 8,
                width: `${data.liquidityIndex * 100}%`,
                backgroundColor: colors.gold,
                borderRadius: 4,
              }}
            />
          </View>
          <View style={{ ...styles.spaceBetween, marginTop: 2 }}>
            <Text style={styles.caption}>Низкая</Text>
            <Text style={styles.caption}>Высокая</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
