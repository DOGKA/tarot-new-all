import React from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useTranslation } from "react-i18next";

interface PremiumPreviewProps {
  spreadType: string;
  focusArea?: string;
  onUnlock: () => void;
}

interface PreviewItem {
  titleKey: string;
  descKey: string;
}

// Premium output items by spread type
const SPREAD_PREVIEW_ITEMS: Record<string, PreviewItem[]> = {
  // YES/NO
  yes_no: [
    { titleKey: "premiumPreviewDeepAnalysis", descKey: "premiumPreviewDeepAnalysisDesc" },
    { titleKey: "premiumPreviewTimingInsight", descKey: "premiumPreviewTimingInsightDesc" },
    { titleKey: "premiumPreviewConditions", descKey: "premiumPreviewConditionsDesc" },
    { titleKey: "premiumPreviewEnergyFlow", descKey: "premiumPreviewEnergyFlowDesc" },
  ],
  // GENERAL
  single_card: [
    { titleKey: "overall", descKey: "premiumPreviewOverallDesc" },
    { titleKey: "deepDive", descKey: "premiumPreviewDeepDiveDesc" },
    { titleKey: "shadow", descKey: "premiumPreviewShadowDesc" },
    { titleKey: "nextStep", descKey: "premiumPreviewDirectionDesc" },
    { titleKey: "journal", descKey: "premiumPreviewJournalDesc" },
  ],
  past_present_future: [
    { titleKey: "overall", descKey: "premiumPreviewOverallDesc" },
    { titleKey: "throughline", descKey: "premiumPreviewThroughlineDesc" },
    { titleKey: "timeline", descKey: "premiumPreviewTimelineDesc" },
    { titleKey: "nextStep", descKey: "premiumPreviewDirectionDesc" },
    { titleKey: "journal", descKey: "premiumPreviewJournalDesc" },
  ],
  situation_obstacle_advice: [
    { titleKey: "overall", descKey: "premiumPreviewOverallDesc" },
    { titleKey: "throughline", descKey: "premiumPreviewThroughlineDesc" },
    { titleKey: "nextStep", descKey: "premiumPreviewDirectionDesc" },
    { titleKey: "journal", descKey: "premiumPreviewJournalDesc" },
  ],
  // LOVE
  destinys_embrace: [
    { titleKey: "overall", descKey: "premiumPreviewOverallDesc" },
    { titleKey: "premiumPreviewBondAnalysis", descKey: "premiumPreviewBondAnalysisDesc" },
    { titleKey: "emotionalTone", descKey: "premiumPreviewEmotionalToneDesc" },
    { titleKey: "nextStep", descKey: "premiumPreviewDirectionDesc" },
    { titleKey: "journal", descKey: "premiumPreviewHeartJournalDesc" },
  ],
  love_choice: [
    { titleKey: "overall", descKey: "premiumPreviewOverallDesc" },
    { titleKey: "decisionFrame", descKey: "premiumPreviewDecisionFrameDesc" },
    { titleKey: "pathA", descKey: "premiumPreviewPathADesc" },
    { titleKey: "pathB", descKey: "premiumPreviewPathBDesc" },
    { titleKey: "emotionalTone", descKey: "premiumPreviewEmotionalToneDesc" },
    { titleKey: "journal", descKey: "premiumPreviewHeartJournalDesc" },
  ],
  path_to_love: [
    { titleKey: "overall", descKey: "premiumPreviewOverallDesc" },
    { titleKey: "emotionalTone", descKey: "premiumPreviewEmotionalToneDesc" },
    { titleKey: "nextStep", descKey: "premiumPreviewDirectionDesc" },
    { titleKey: "journal", descKey: "premiumPreviewHeartJournalDesc" },
  ],
  // CAREER
  career_clarity: [
    { titleKey: "overall", descKey: "premiumPreviewCareerOverallDesc" },
    { titleKey: "throughline", descKey: "premiumPreviewCareerThemeDesc" },
    { titleKey: "directionHint", descKey: "premiumPreviewCareerDirectionDesc" },
    { titleKey: "journal", descKey: "premiumPreviewCareerJournalDesc" },
  ],
  career_path_guide: [
    { titleKey: "overall", descKey: "premiumPreviewCareerOverallDesc" },
    { titleKey: "premiumPreviewHighlights", descKey: "premiumPreviewHighlightsDesc" },
    { titleKey: "directionHint", descKey: "premiumPreviewCareerDirectionDesc" },
    { titleKey: "journal", descKey: "premiumPreviewCareerJournalDesc" },
  ],
  new_business_exploration: [
    { titleKey: "overall", descKey: "premiumPreviewBusinessOverallDesc" },
    { titleKey: "businessStrategy", descKey: "premiumPreviewStrategyDesc" },
    { titleKey: "riskNote", descKey: "premiumPreviewRiskDesc" },
    { titleKey: "directionHint", descKey: "premiumPreviewCareerDirectionDesc" },
    { titleKey: "journal", descKey: "premiumPreviewCareerJournalDesc" },
  ],
  wealth_flow: [
    { titleKey: "overall", descKey: "premiumPreviewWealthOverallDesc" },
    { titleKey: "flowInsight", descKey: "premiumPreviewFlowInsightDesc" },
    { titleKey: "optimization", descKey: "premiumPreviewOptimizationDesc" },
    { titleKey: "directionHint", descKey: "premiumPreviewCareerDirectionDesc" },
    { titleKey: "journal", descKey: "premiumPreviewCareerJournalDesc" },
  ],
  // SPIRITUAL
  new_moon_ritual: [
    { titleKey: "overall", descKey: "premiumPreviewSpiritualEnergyDesc" },
    { titleKey: "ritualTheme", descKey: "premiumPreviewRitualThemeDesc" },
    { titleKey: "affirmation", descKey: "premiumPreviewAffirmationDesc" },
    { titleKey: "nextStep", descKey: "premiumPreviewDirectionDesc" },
    { titleKey: "journal", descKey: "premiumPreviewSpiritualJournalDesc" },
  ],
  full_moon_release: [
    { titleKey: "overall", descKey: "premiumPreviewSpiritualEnergyDesc" },
    { titleKey: "releaseTheme", descKey: "premiumPreviewReleaseThemeDesc" },
    { titleKey: "cleansingAdvice", descKey: "premiumPreviewCleansingDesc" },
    { titleKey: "affirmation", descKey: "premiumPreviewAffirmationDesc" },
    { titleKey: "journal", descKey: "premiumPreviewSpiritualJournalDesc" },
  ],
  mind_body_spirit: [
    { titleKey: "overall", descKey: "premiumPreviewSpiritualEnergyDesc" },
    { titleKey: "harmonyScore", descKey: "premiumPreviewHarmonyDesc" },
    { titleKey: "alignmentAdvice", descKey: "premiumPreviewAlignmentDesc" },
    { titleKey: "nextStep", descKey: "premiumPreviewDirectionDesc" },
    { titleKey: "journal", descKey: "premiumPreviewSpiritualJournalDesc" },
  ],
  celestial_illumination: [
    { titleKey: "overall", descKey: "premiumPreviewSpiritualEnergyDesc" },
    { titleKey: "celestialMessage", descKey: "premiumPreviewCosmicWhisperDesc" },
    { titleKey: "omenKeywords", descKey: "premiumPreviewOmenDesc" },
    { titleKey: "nextStep", descKey: "premiumPreviewDirectionDesc" },
    { titleKey: "journal", descKey: "premiumPreviewSpiritualJournalDesc" },
  ],
};

// Default fallback
const DEFAULT_PREVIEW: PreviewItem[] = [
  { titleKey: "overall", descKey: "premiumPreviewOverallDesc" },
  { titleKey: "throughline", descKey: "premiumPreviewThroughlineDesc" },
  { titleKey: "nextStep", descKey: "premiumPreviewDirectionDesc" },
  { titleKey: "journal", descKey: "premiumPreviewJournalDesc" },
];

export default function PremiumPreview({ spreadType, focusArea, onUnlock }: PremiumPreviewProps) {
  const { t } = useTranslation();
  const items = SPREAD_PREVIEW_ITEMS[spreadType] || DEFAULT_PREVIEW;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.lockIcon}>🔒</Text>
        <Text style={styles.title}>{t("premiumPreviewTitle")}</Text>
      </View>

      {/* Preview Items */}
      <BlurView intensity={20} tint="dark" style={styles.blurContainer}>
        <LinearGradient
          colors={["rgba(168, 85, 247, 0.1)", "rgba(139, 92, 246, 0.05)"]}
          style={styles.gradient}
        >
          {items.map((item, index) => (
            <View key={index} style={styles.previewItem}>
              <View style={styles.itemHeader}>
                <View style={styles.dot} />
                <Text style={styles.itemTitle}>{t(item.titleKey)}</Text>
              </View>
              <Text style={styles.itemDesc}>{t(item.descKey)}</Text>
            </View>
          ))}
        </LinearGradient>
      </BlurView>

      {/* CTA Button */}
      <TouchableOpacity onPress={onUnlock} activeOpacity={0.8}>
        <LinearGradient
          colors={["#a855f7", "#7c3aed"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.ctaButton}
        >
          <Text style={styles.ctaIcon}>✨</Text>
          <Text style={styles.ctaText}>{t("premiumUnlock")}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  lockIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  title: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  blurContainer: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
  },
  gradient: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(168, 85, 247, 0.3)",
  },
  previewItem: {
    marginBottom: 14,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#a855f7",
    marginRight: 10,
  },
  itemTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  itemDesc: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 13,
    marginLeft: 16,
    lineHeight: 18,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 14,
  },
  ctaIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  ctaText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "700",
  },
});
