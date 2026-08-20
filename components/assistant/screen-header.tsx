import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { StyleSheet, Text, View } from "react-native";

export function ScreenHeader({ title, subtitle, icon }: { title: string; subtitle: string; icon: keyof typeof MaterialIcons.glyphMap }) {
  return (
    <View style={styles.wrap}>
      <View className="bg-primary" style={styles.iconWrap}>
        <MaterialIcons name={icon} size={20} color="#FFFFFF" />
      </View>
      <View style={styles.copy}>
        <Text className="text-foreground" style={styles.title}>{title}</Text>
        <Text className="text-muted" style={styles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", flexDirection: "row", gap: 12, paddingBottom: 18 },
  iconWrap: { alignItems: "center", borderRadius: 14, height: 42, justifyContent: "center", width: 42 },
  copy: { flex: 1 },
  title: { fontSize: 27, fontWeight: "800", letterSpacing: -0.6, lineHeight: 32 },
  subtitle: { fontSize: 13, lineHeight: 18, marginTop: 2 },
});
