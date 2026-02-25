import { StyleSheet } from "@react-pdf/renderer";

export const colors = {
  bg: "#0B0E17",
  card: "#121829",
  cardBorder: "#1E2A45",
  gold: "#C8A44E",
  goldLight: "#E8D5A0",
  goldMuted: "rgba(200,164,78,0.15)",
  text: "#E8ECF4",
  textSecondary: "#8892A8",
  textMuted: "#5A6478",
  white: "#FFFFFF",
  green: "#25D366",
};

export const styles = StyleSheet.create({
  page: {
    backgroundColor: colors.bg,
    padding: 40,
    fontFamily: "Helvetica",
    color: colors.text,
    fontSize: 10,
  },

  // Section containers
  section: {
    marginBottom: 24,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 8,
    padding: 20,
    border: `1px solid ${colors.cardBorder}`,
  },

  // Typography
  h1: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.white,
    marginBottom: 4,
  },
  h2: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.white,
    marginBottom: 8,
  },
  h3: {
    fontSize: 12,
    fontWeight: "bold",
    color: colors.goldLight,
    marginBottom: 6,
  },
  label: {
    fontSize: 8,
    fontWeight: "bold",
    color: colors.gold,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  body: {
    fontSize: 10,
    color: colors.textSecondary,
    lineHeight: 1.5,
  },
  caption: {
    fontSize: 8,
    color: colors.textMuted,
  },

  // Price
  priceText: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.gold,
  },
  priceUnit: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },

  // Layout
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  spaceBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  divider: {
    height: 1,
    backgroundColor: colors.cardBorder,
    marginVertical: 12,
  },

  // Badge / chip
  chip: {
    backgroundColor: colors.goldMuted,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 6,
    marginBottom: 4,
  },
  chipText: {
    fontSize: 8,
    fontWeight: "bold",
    color: colors.gold,
  },

  // Table
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
    paddingVertical: 8,
  },
  tableCell: {
    flex: 1,
    fontSize: 9,
    color: colors.textSecondary,
  },
  tableCellBold: {
    flex: 1,
    fontSize: 9,
    fontWeight: "bold",
    color: colors.white,
  },
});
