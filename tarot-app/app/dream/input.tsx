import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useDream } from "../../context/DreamContext";
import { useApp } from "../../context/AppContext";
import { GradientBackground, GemstoneIcon } from "../../components/ui";
import { LinearGradient } from "expo-linear-gradient";
import Constants from "expo-constants";
import type { FeelingTag, LifeContextTag } from "../../types/dream";

const host = Constants.expoConfig?.hostUri?.split(":")[0] || "localhost";
const API_URL = `http://${host}:3001/api/dream`;

const MAX_CHARS = 300;

const FEELING_KEYS: { value: FeelingTag; i18nKey: string }[] = [
  { value: "korku", i18nKey: "feelingFear" },
  { value: "özlem", i18nKey: "feelingLonging" },
  { value: "merak", i18nKey: "feelingCuriosity" },
  { value: "rahatlık", i18nKey: "feelingComfort" },
  { value: "utanç", i18nKey: "feelingShame" },
  { value: "öfke", i18nKey: "feelingAnger" },
  { value: "hüzün", i18nKey: "feelingSadness" },
  { value: "şaşkınlık", i18nKey: "feelingSurprise" },
  { value: "mutluluk", i18nKey: "feelingHappiness" },
  { value: "hayal kırıklığı", i18nKey: "feelingDisappointment" },
  { value: "endişe", i18nKey: "feelingAnxiety" },
  { value: "suçluluk", i18nKey: "feelingGuilt" },
  { value: "güvensizlik", i18nKey: "feelingInsecurity" },
  { value: "huzur", i18nKey: "feelingPeace" },
  { value: "çaresizlik", i18nKey: "feelingHelplessness" },
  { value: "kıskançlık", i18nKey: "feelingJealousy" },
];

const CONTEXT_KEYS: { value: LifeContextTag; i18nKey: string }[] = [
  { value: "iş", i18nKey: "contextWork" },
  { value: "aşk", i18nKey: "contextLove" },
  { value: "para", i18nKey: "contextMoney" },
  { value: "aile", i18nKey: "contextFamily" },
  { value: "sağlık", i18nKey: "contextHealth" },
  { value: "arkadaşlık", i18nKey: "contextFriendship" },
  { value: "kayıp", i18nKey: "contextLoss" },
  { value: "değişim", i18nKey: "contextChange" },
  { value: "eğitim", i18nKey: "contextEducation" },
];

const MAX_TAGS = 3;

export default function DreamInputScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const {
    dreamMode,
    dreamText,
    setDreamText,
    feelingTags,
    setFeelingTags,
    lifeContextTags,
    setLifeContextTags,
    setCurrentResult,
    gemstoneBalance,
    prices,
    deviceId,
    fetchUserInfo,
  } = useDream();
  const { language, isPremium } = useApp();

  const [loading, setLoading] = useState(false);

  const cost = prices[dreamMode];
  const canAfford = gemstoneBalance >= cost;
  const isValid = dreamText.trim().length >= 20;

  const modeLabels: Record<string, string> = {
    A: t("quickDecode") || "Quick Decode",
    B: t("deepDecode") || "Deep Decode",
    C: t("rewritePlan") || "Rewrite Plan",
  };

  const handleDecode = async () => {
    if (!isValid || !canAfford) return;

    setLoading(true);
    try {
      const requestId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const response = await fetch(`${API_URL}/decode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: dreamMode,
          dreamText: dreamText.trim(),
          feelingTags: feelingTags.length > 0 ? feelingTags : undefined,
          lifeContextTags: lifeContextTags.length > 0 ? lifeContextTags : undefined,
          deviceId,
          requestId,
          language,
          isPremium,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        if (err.error === "INSUFFICIENT_GEMSTONES") {
          Alert.alert(
            t("insufficientGemstone") || "Yetersiz Gemstone",
            `${err.required} gemstone gerekli, bakiyen: ${err.balance}`
          );
        } else {
          Alert.alert("Hata", err.message || err.error || "Bilinmeyen hata");
        }
        return;
      }

      const data = await response.json();
      setCurrentResult(data);
      fetchUserInfo(); // refresh balance
      router.push("/dream/result");
    } catch (err) {
      Alert.alert("Bağlantı Hatası", "Sunucuya bağlanılamadı. Tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <GradientBackground>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.backButton}>←</Text>
            </TouchableOpacity>
            <Text style={styles.title}>{modeLabels[dreamMode]}</Text>
            <View style={[styles.costContainer, { flexDirection: "row", alignItems: "center", gap: 4 }]}>
              <GemstoneIcon size={30} />
              <Text style={styles.costText}>{cost}</Text>
            </View>
          </View>

          {/* Dream Text Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>
              {t("dreamInputLabel") || "Rüyanı anlat"}
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder={t("dreamPlaceholder") || "Rüyamda karanlık bir koridorda yürüyordum..."}
              placeholderTextColor="rgba(255, 255, 255, 0.25)"
              multiline
              maxLength={MAX_CHARS}
              value={dreamText}
              onChangeText={setDreamText}
              textAlignVertical="top"
            />
            <Text style={[styles.charCount, dreamText.length > MAX_CHARS - 50 && styles.charCountWarn]}>
              {dreamText.length}/{MAX_CHARS}
            </Text>
          </View>

          {/* Feeling Tag (Optional) */}
          <View style={styles.tagSection}>
            <Text style={styles.tagLabel}>
              {t("feelingTagLabel") || "Baskın duygu"} <Text style={styles.optional}>(opsiyonel)</Text>
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagRow}>
              {FEELING_KEYS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.tagChip, feelingTags.includes(opt.value) && styles.tagChipSelected]}
                  onPress={() => {
                    if (feelingTags.includes(opt.value)) {
                      setFeelingTags(feelingTags.filter(t => t !== opt.value));
                    } else if (feelingTags.length < MAX_TAGS) {
                      setFeelingTags([...feelingTags, opt.value]);
                    }
                  }}
                >
                  <Text style={[styles.tagChipText, feelingTags.includes(opt.value) && styles.tagChipTextSelected]}>
                    {t(opt.i18nKey)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Life Context Tag (Optional) */}
          <View style={styles.tagSection}>
            <Text style={styles.tagLabel}>
              {t("lifeContextLabel") || "Yaşam bağlamı"} <Text style={styles.optional}>(opsiyonel)</Text>
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagRow}>
              {CONTEXT_KEYS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.tagChip, lifeContextTags.includes(opt.value) && styles.tagChipSelected]}
                  onPress={() => {
                    if (lifeContextTags.includes(opt.value)) {
                      setLifeContextTags(lifeContextTags.filter(t => t !== opt.value));
                    } else if (lifeContextTags.length < MAX_TAGS) {
                      setLifeContextTags([...lifeContextTags, opt.value]);
                    }
                  }}
                >
                  <Text style={[styles.tagChipText, lifeContextTags.includes(opt.value) && styles.tagChipTextSelected]}>
                    {t(opt.i18nKey)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Decode Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleDecode}
            disabled={loading || !isValid || !canAfford}
          >
            <LinearGradient
              colors={
                !isValid || !canAfford
                  ? ["rgba(100,100,100,0.4)", "rgba(80,80,80,0.3)"]
                  : ["#a855f7", "#6366f1"]
              }
              style={styles.decodeButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.decodeButtonText}>
                  {!isValid
                    ? t("dreamTooShort") || "En az 20 karakter yaz"
                    : !canAfford
                      ? t("insufficientGemstone") || "Yetersiz Gemstone"
                      : t("decodeButton") || "Decode Et"}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Min length hint */}
          {dreamText.length > 0 && dreamText.length < 20 && (
            <Text style={styles.hintText}>
              {t("minLengthHint") || `Henüz ${20 - dreamText.length} karakter daha gerekiyor`}
            </Text>
          )}

          <View style={styles.bottomPadding} />
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  backButton: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "300",
    paddingRight: 8,
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
  },
  costContainer: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: "rgba(168, 85, 247, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(168, 85, 247, 0.4)",
  },
  costText: {
    color: "#c084fc",
    fontSize: 12,
    fontWeight: "700",
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 16,
    padding: 16,
    color: "#fff",
    fontSize: 15,
    lineHeight: 22,
    minHeight: 140,
    maxHeight: 220,
  },
  charCount: {
    color: "rgba(255, 255, 255, 0.3)",
    fontSize: 12,
    textAlign: "right",
    marginTop: 6,
  },
  charCountWarn: {
    color: "#f59e0b",
  },
  tagSection: {
    marginBottom: 18,
  },
  tagLabel: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 10,
  },
  optional: {
    color: "rgba(255, 255, 255, 0.3)",
    fontWeight: "400",
  },
  tagRow: {
    gap: 8,
    paddingRight: 20,
  },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    gap: 5,
  },
  tagChipSelected: {
    backgroundColor: "rgba(168, 85, 247, 0.2)",
    borderColor: "rgba(168, 85, 247, 0.5)",
  },
  tagChipText: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 12,
    fontWeight: "500",
  },
  tagChipTextSelected: {
    color: "#c084fc",
  },
  decodeButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 8,
  },
  decodeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  hintText: {
    color: "rgba(255, 255, 255, 0.3)",
    fontSize: 12,
    textAlign: "center",
    marginTop: 10,
  },
  bottomPadding: {
    height: 40,
  },
});
