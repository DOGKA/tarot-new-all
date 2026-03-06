import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useApp } from "../context/AppContext";
import { GradientBackground, GlassCard, SpreadCard, GemstoneIcon } from "../components/ui";
import type { SpreadType, FocusArea } from "../types/tarot";

// Category colors
const COLORS = {
  general: "#a855f7",
  love: "#ec4899",
  career: "#f59e0b",
  spiritual: "#6366f1",
};

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { gemstoneBalance, isPremium, setSpreadType, setFocusArea } = useApp();

  const handleSpreadSelect = (spread: SpreadType, focus: FocusArea = "general") => {
    setSpreadType(spread);
    setFocusArea(focus);
    router.push(`/pick/${spread}`);
  };

  const getDesc = (key: string) => t(key);

  // Premium-only spreads need gemstone + isPremium
  const isLocked = !isPremium;

  return (
    <GradientBackground>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backButton}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{t("appName")}</Text>
          <View style={styles.balanceBadge}>
            <GemstoneIcon size={26} />
            <Text style={styles.balanceText}> {gemstoneBalance}</Text>
          </View>
        </View>

        {/* General Category */}
        <View style={styles.section}>
          <Text style={[styles.categoryTitle, { color: COLORS.general }]}>
            ✨ {t("generalCategory")}
          </Text>
          
          <SpreadCard title={t("singleCard")} description={getDesc("singleCardDesc")} cardCount="single" categoryColor={COLORS.general}
            gemCost={6}
            onPress={() => handleSpreadSelect("single_card", "general")} />
          
          <SpreadCard title={t("threeCards")} description={getDesc("threeCardsDesc")} cardCount="three" categoryColor={COLORS.general}
            gemCost={14} locked={isLocked}
            onPress={() => handleSpreadSelect("past_present_future")} />
          
          <SpreadCard title={t("yesNo")} description={getDesc("yesNoGeneralDesc")} cardCount="single" categoryColor={COLORS.general}
            gemCost={6}
            onPress={() => handleSpreadSelect("yes_no", "general")} />
          
          <SpreadCard title={t("situationObstacleAdvice")} description={getDesc("situationObstacleAdviceDesc")} cardCount="three" categoryColor={COLORS.general}
            gemCost={14} locked={isLocked}
            onPress={() => handleSpreadSelect("situation_obstacle_advice")} />
        </View>

        {/* Love Category */}
        <View style={styles.section}>
          <Text style={[styles.categoryTitle, { color: COLORS.love }]}>
            💖 {t("loveCategory")}
          </Text>
          
          <SpreadCard title={t("singleCard")} description={getDesc("singleCardDesc")} cardCount="single" categoryColor={COLORS.love}
            gemCost={6}
            onPress={() => handleSpreadSelect("single_card", "love")} />
          
          <SpreadCard title={t("yesNo")} description={getDesc("yesNoLoveDesc")} cardCount="single" categoryColor={COLORS.love}
            gemCost={6}
            onPress={() => handleSpreadSelect("yes_no", "love")} />
          
          <SpreadCard title={t("destinysEmbrace")} description={getDesc("destinysEmbraceDesc")} cardCount="three" categoryColor={COLORS.love}
            gemCost={14} locked={isLocked}
            onPress={() => handleSpreadSelect("destinys_embrace", "love")} />
          
          <SpreadCard title={t("loveChoice")} description={getDesc("loveChoiceDesc")} cardCount="five" categoryColor={COLORS.love}
            gemCost={22} locked={isLocked}
            onPress={() => handleSpreadSelect("love_choice", "love")} />
          
          <SpreadCard title={t("pathToLove")} description={getDesc("pathToLoveDesc")} cardCount="five" categoryColor={COLORS.love}
            gemCost={22} locked={isLocked}
            onPress={() => handleSpreadSelect("path_to_love", "love")} />
        </View>

        {/* Career Category */}
        <View style={styles.section}>
          <Text style={[styles.categoryTitle, { color: COLORS.career }]}>
            💼 {t("careerCategory")}
          </Text>
          
          <SpreadCard title={t("singleCard")} description={getDesc("singleCardDesc")} cardCount="single" categoryColor={COLORS.career}
            gemCost={6}
            onPress={() => handleSpreadSelect("single_card", "career")} />
          
          <SpreadCard title={t("yesNo")} description={getDesc("yesNoCareerDesc")} cardCount="single" categoryColor={COLORS.career}
            gemCost={6}
            onPress={() => handleSpreadSelect("yes_no", "career")} />
          
          <SpreadCard title={t("careerClarity")} description={getDesc("careerClarityDesc")} cardCount="three" categoryColor={COLORS.career}
            gemCost={14} locked={isLocked}
            onPress={() => handleSpreadSelect("career_clarity", "career")} />
          
          <SpreadCard title={t("careerPathGuide")} description={getDesc("careerPathGuideDesc")} cardCount="three" categoryColor={COLORS.career}
            gemCost={14} locked={isLocked}
            onPress={() => handleSpreadSelect("career_path_guide", "career")} />
          
          <SpreadCard title={t("newBusinessExploration")} description={getDesc("newBusinessExplorationDesc")} cardCount="five" categoryColor={COLORS.career}
            gemCost={22} locked={isLocked}
            onPress={() => handleSpreadSelect("new_business_exploration", "career")} />
          
          <SpreadCard title={t("wealthFlow")} description={getDesc("wealthFlowDesc")} cardCount="five" categoryColor={COLORS.career}
            gemCost={22} locked={isLocked}
            onPress={() => handleSpreadSelect("wealth_flow", "career")} />
        </View>

        {/* Spiritual Category */}
        <View style={styles.section}>
          <Text style={[styles.categoryTitle, { color: COLORS.spiritual }]}>
            🔮 {t("spiritualCategory")}
          </Text>
          
          <SpreadCard title={t("singleCard")} description={getDesc("singleCardDesc")} cardCount="single" categoryColor={COLORS.spiritual}
            gemCost={6}
            onPress={() => handleSpreadSelect("single_card", "spiritual")} />
          
          <SpreadCard title={t("yesNo")} description={getDesc("yesNoSpiritualDesc")} cardCount="single" categoryColor={COLORS.spiritual}
            gemCost={6}
            onPress={() => handleSpreadSelect("yes_no", "spiritual")} />
          
          <SpreadCard title={t("newMoonRitual")} description={getDesc("newMoonRitualDesc")} cardCount="five" categoryColor={COLORS.spiritual}
            gemCost={22} locked={isLocked}
            onPress={() => handleSpreadSelect("new_moon_ritual", "spiritual")} />
          
          <SpreadCard title={t("fullMoonRelease")} description={getDesc("fullMoonReleaseDesc")} cardCount="five" categoryColor={COLORS.spiritual}
            gemCost={22} locked={isLocked}
            onPress={() => handleSpreadSelect("full_moon_release", "spiritual")} />
          
          <SpreadCard title={t("mindBodySpirit")} description={getDesc("mindBodySpiritDesc")} cardCount="three" categoryColor={COLORS.spiritual}
            gemCost={14} locked={isLocked}
            onPress={() => handleSpreadSelect("mind_body_spirit", "spiritual")} />
          
          <SpreadCard title={t("celestialIllumination")} description={getDesc("celestialIlluminationDesc")} cardCount="three" categoryColor={COLORS.spiritual}
            gemCost={14} locked={isLocked}
            onPress={() => handleSpreadSelect("celestial_illumination", "spiritual")} />
        </View>
        
        <View style={styles.bottomPadding} />
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
    marginTop: 40,
  },
  backButton: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "300",
    paddingRight: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    flex: 1,
    textAlign: "center",
  },
  balanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  balanceText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13,
  },
  section: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
    marginTop: 8,
  },
  bottomPadding: {
    height: 40,
  },
});
