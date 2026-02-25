import { View, Text, Link } from "@react-pdf/renderer";
import { styles, colors } from "./styles";

export function CTABlock() {
  return (
    <View style={styles.section}>
      <View
        style={{
          ...styles.card,
          backgroundColor: "rgba(200,164,78,0.06)",
          borderColor: colors.gold,
          alignItems: "center",
          padding: 24,
        }}
      >
        <Text style={{ ...styles.h2, color: colors.gold, textAlign: "center", marginBottom: 8 }}>
          Хотите продать быстро и выгодно?
        </Text>
        <Text style={{ ...styles.body, textAlign: "center", marginBottom: 16, maxWidth: 300 }}>
          Свяжитесь с нашим экспертом для точной оценки и срочного выкупа вашей недвижимости
        </Text>

        {/* Contact info */}
        <View style={{ ...styles.row, marginBottom: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: "bold", color: colors.white }}>
            +7 (707) 450-32-77
          </Text>
        </View>

        <Link src="https://wa.me/77074503277?text=%D0%97%D0%B4%D1%80%D0%B0%D0%B2%D1%81%D1%82%D0%B2%D1%83%D0%B9%D1%82%D0%B5!%20%D0%9C%D0%B5%D0%BD%D1%8F%20%D0%B8%D0%BD%D1%82%D0%B5%D1%80%D0%B5%D1%81%D1%83%D0%B5%D1%82%20%D0%BE%D1%86%D0%B5%D0%BD%D0%BA%D0%B0">
          <View
            style={{
              backgroundColor: "#25D366",
              borderRadius: 6,
              paddingHorizontal: 20,
              paddingVertical: 10,
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: "bold", color: colors.white }}>
              Написать в WhatsApp
            </Text>
          </View>
        </Link>

        <Text style={{ ...styles.body, textAlign: "center" }}>
          Алмавыкуп — срочный выкуп недвижимости в Алматы
        </Text>
        <Text style={{ ...styles.caption, textAlign: "center", marginTop: 4 }}>
          г. Алматы, Мамыр 4 / дом 119 | Пн-Пт: 9:00 - 18:00
        </Text>
      </View>

      {/* Disclaimer */}
      <Text style={{ ...styles.caption, textAlign: "center", marginTop: 12 }}>
        Данная оценка носит информационный характер и не является официальным заключением.
        © 2026 Алмавыкуп. Все права защищены.
      </Text>
    </View>
  );
}
