import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { StyleSheet, Text, View } from "react-native";

export function EmptyState({ icon, title, detail }: { icon: keyof typeof MaterialIcons.glyphMap; title: string; detail: string }) {
  return (
    <View className="bg-surface border-border" style={styles.card}>
      <View className="bg-primary" style={styles.iconWrap}>
        <MaterialIcons name={icon} size={22} color="#FFFFFF" />
      </View>
      <Text className="text-foreground" style={styles.title}>{title}</Text>
      <Text className="text-muted" style={styles.detail}>{detail}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: "center", borderRadius: 20, borderWidth: 1, marginTop: 12, padding: 24 },
  iconWrap: { alignItems: "center", borderRadius: 999, height: 46, justifyContent: "center", marginBottom: 12, width: 46 },
  title: { fontSize: 16, fontWeight: "700", lineHeight: 22, textAlign: "center" },
  detail: { fontSize: 13, lineHeight: 19, marginTop: 5, maxWidth: 285, textAlign: "center" },
});
