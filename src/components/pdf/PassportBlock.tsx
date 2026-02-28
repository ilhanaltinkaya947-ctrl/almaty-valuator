import { View, Text } from "@react-pdf/renderer";
import { styles, colors } from "./styles";
import type { ReportData } from "./types";

export function PassportBlock({ data }: { data: ReportData }) {
  const rows = [
    { label: "Жилой комплекс", value: data.complexName },
    { label: "Район", value: data.district },
    { label: "Застройщик", value: data.developer },
    { label: "Класс", value: data.classLabel },
    { label: "Год постройки", value: String(data.yearBuilt) },
    { label: "Этажность", value: `${data.totalFloors} этажей` },
    { label: "Площадь квартиры", value: `${data.area} м²` },
    { label: "Этаж", value: data.floorPositionLabel },
    { label: "Вид из окна", value: data.viewLabel },
    { label: "Состояние", value: data.conditionLabel },
    { label: "Статус клиента", value: data.intentLabel },
  ];

  return (
    <View style={styles.section}>
      <Text style={styles.label}>ПАСПОРТ ОБЪЕКТА</Text>
      <View style={styles.card}>
        <Text style={styles.h2}>{data.complexName}</Text>
        <Text style={{ ...styles.caption, marginBottom: 16 }}>
          {data.district} район, Алматы
        </Text>

        {rows.map((row, i) => (
          <View
            key={row.label}
            style={{
              ...styles.spaceBetween,
              paddingVertical: 6,
              borderBottomWidth: i < rows.length - 1 ? 1 : 0,
              borderBottomColor: colors.cardBorder,
            }}
          >
            <Text style={styles.body}>{row.label}</Text>
            <Text style={{ fontSize: 10, fontWeight: "bold", color: colors.white }}>
              {row.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
