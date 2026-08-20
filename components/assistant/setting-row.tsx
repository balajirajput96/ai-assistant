import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { StyleSheet, Switch, Text, View } from "react-native";

export function SettingRow({
  icon,
  title,
  detail,
  value,
  onValueChange,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  detail: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <View className="bg-primary" style={styles.iconWrap}>
        <MaterialIcons name={icon} size={17} color="#FFFFFF" />
      </View>
      <View style={styles.copy}>
        <Text className="text-foreground" style={styles.title}>{title}</Text>
        <Text className="text-muted" style={styles.detail}>{detail}</Text>
      </View>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ false: "#CBD5E5", true: "#83A5FF" }} thumbColor={value ? "#2F6BFF" : "#FFFFFF"} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: "center", flexDirection: "row", gap: 11, minHeight: 64, paddingVertical: 8 },
  iconWrap: { alignItems: "center", borderRadius: 11, height: 34, justifyContent: "center", width: 34 },
  copy: { flex: 1 },
  title: { fontSize: 15, fontWeight: "700", lineHeight: 20 },
  detail: { fontSize: 12, lineHeight: 17, marginTop: 1 },
});
