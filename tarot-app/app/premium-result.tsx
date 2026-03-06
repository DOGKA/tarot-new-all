import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useApp } from "../context/AppContext";
import { useReading } from "../hooks/useReading";
import { GradientBackground, GlassCard } from "../components/ui";
import { LinearGradient } from "expo-linear-gradient";
import type { SingleCardReading, ThreeCardReading, SOAReading, DestinysEmbraceReading, LoveChoiceReading, PathToLoveReading, NewMoonRitualReading, FullMoonReleaseReading, MindBodySpiritReading, CelestialIlluminationReading, CareerClarityReading, CareerPathGuideReading, NewBusinessExplorationReading, WealthFlowReading } from "../types/tarot";

export default function PremiumResultScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { selectedCards, spreadType, language, resetReading, focusArea } = useApp();
  const { loading, error, getSingleCardReading, getThreeCardReading, getSOAReading, getDestinysEmbraceReading, getLoveChoiceReading, getPathToLoveReading, getNewMoonRitualReading, getFullMoonReleaseReading, getMindBodySpiritReading, getCelestialIlluminationReading, getCareerClarityReading, getCareerPathGuideReading, getNewBusinessExplorationReading, getWealthFlowReading, resetPremiumLogs } =
    useReading();

  const [singleReading, setSingleReading] = useState<SingleCardReading | null>(null);
  const [threeReading, setThreeReading] = useState<ThreeCardReading | null>(null);
  const [soaReading, setSOAReading] = useState<SOAReading | null>(null);
  const [destinyReading, setDestinyReading] = useState<DestinysEmbraceReading | null>(null);
  const [loveChoiceReading, setLoveChoiceReading] = useState<LoveChoiceReading | null>(null);
  const [pathToLoveReading, setPathToLoveReading] = useState<PathToLoveReading | null>(null);
  const [newMoonReading, setNewMoonReading] = useState<NewMoonRitualReading | null>(null);
  const [fullMoonReading, setFullMoonReading] = useState<FullMoonReleaseReading | null>(null);
  const [mbsReading, setMbsReading] = useState<MindBodySpiritReading | null>(null);
  const [celestialReading, setCelestialReading] = useState<CelestialIlluminationReading | null>(null);
  const [careerClarityReading, setCareerClarityReading] = useState<CareerClarityReading | null>(null);
  const [careerPathGuideReading, setCareerPathGuideReading] = useState<CareerPathGuideReading | null>(null);
  const [newBusinessReading, setNewBusinessReading] = useState<NewBusinessExplorationReading | null>(null);
  const [wealthFlowReading, setWealthFlowReading] = useState<WealthFlowReading | null>(null);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    console.log("[premium-result] useEffect triggered");
    console.log("[premium-result] spreadType:", spreadType);
    console.log("[premium-result] selectedCards count:", selectedCards.length);
    console.log("[premium-result] language:", language);
    
    const fetchReading = async () => {
      console.log("[premium-result] fetchReading called");
      if (spreadType === "single_card" && selectedCards[0]) {
        console.log("[premium-result] Fetching single_card reading...");
        const reading = await getSingleCardReading(language, selectedCards[0], focusArea);
        console.log("[premium-result] single_card reading result:", reading ? "success" : "null");
        setSingleReading(reading);
      } else if (spreadType === "past_present_future" && selectedCards.length === 3) {
        const reading = await getThreeCardReading(language, selectedCards);
        setThreeReading(reading);
      } else if (spreadType === "situation_obstacle_advice" && selectedCards.length === 3) {
        const reading = await getSOAReading(language, selectedCards);
        setSOAReading(reading);
      } else if (spreadType === "destinys_embrace" && selectedCards.length === 3) {
        const reading = await getDestinysEmbraceReading(language, selectedCards);
        setDestinyReading(reading);
      } else if (spreadType === "love_choice" && selectedCards.length === 5) {
        const reading = await getLoveChoiceReading(language, selectedCards);
        setLoveChoiceReading(reading);
      } else if (spreadType === "path_to_love" && selectedCards.length === 5) {
        const reading = await getPathToLoveReading(language, selectedCards);
        setPathToLoveReading(reading);
      } else if (spreadType === "new_moon_ritual" && selectedCards.length === 5) {
        const reading = await getNewMoonRitualReading(language, selectedCards);
        setNewMoonReading(reading);
      } else if (spreadType === "full_moon_release" && selectedCards.length === 5) {
        const reading = await getFullMoonReleaseReading(language, selectedCards);
        setFullMoonReading(reading);
      } else if (spreadType === "mind_body_spirit" && selectedCards.length === 3) {
        const reading = await getMindBodySpiritReading(language, selectedCards);
        setMbsReading(reading);
      } else if (spreadType === "celestial_illumination" && selectedCards.length === 3) {
        const reading = await getCelestialIlluminationReading(language, selectedCards);
        setCelestialReading(reading);
      } else if (spreadType === "career_clarity" && selectedCards.length === 3) {
        const reading = await getCareerClarityReading(language, selectedCards);
        setCareerClarityReading(reading);
      } else if (spreadType === "career_path_guide" && selectedCards.length === 3) {
        const reading = await getCareerPathGuideReading(language, selectedCards);
        setCareerPathGuideReading(reading);
      } else if (spreadType === "new_business_exploration" && selectedCards.length === 5) {
        const reading = await getNewBusinessExplorationReading(language, selectedCards);
        setNewBusinessReading(reading);
      } else if (spreadType === "wealth_flow" && selectedCards.length === 5) {
        const reading = await getWealthFlowReading(language, selectedCards);
        setWealthFlowReading(reading);
      } else {
        // No spread type matched - set error
        console.warn("[premium-result] No spread type matched!", { spreadType, cardsCount: selectedCards.length });
      }
    };
    
    // Only fetch if we have cards
    if (selectedCards.length > 0 && spreadType) {
      fetchReading();
    } else {
      console.warn("[premium-result] Missing data:", { spreadType, cardsCount: selectedCards.length });
    }
  }, [spreadType, selectedCards.length]);

  const handleNewReading = () => {
    resetReading();
    router.replace("/");
  };

  const handleResetLogs = () => {
    Alert.alert(t("resetLogsTitle"), t("resetLogsConfirm"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("reset"),
        style: "destructive",
        onPress: async () => {
          setResetting(true);
          const ok = await resetPremiumLogs();
          setResetting(false);
          if (!ok) {
            Alert.alert(t("resetLogsFailedTitle"), t("resetLogsFailedBody"));
          }
        },
      },
    ]);
  };

  // Loading state
  if (loading) {
    return (
      <GradientBackground>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#a855f7" />
          <Text style={styles.loadingText}>Yorumunuz hazırlanıyor...</Text>
        </View>
      </GradientBackground>
    );
  }

  // Error state
  if (error) {
    return (
      <GradientBackground>
        <View style={styles.errorContainer}>
          <GlassCard style={styles.errorCard}>
            <Text style={styles.errorText}>Hata: {error}</Text>
            <TouchableOpacity onPress={handleNewReading}>
              <LinearGradient
                colors={["#a855f7", "#6366f1"]}
                style={styles.retryButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.retryButtonText}>{t("newReading")}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </GlassCard>
        </View>
      </GradientBackground>
    );
  }

  // Header component
  const Header = ({ title }: { title: string }) => (
    <View style={styles.header}>
      <Text style={styles.title} numberOfLines={2}>{title}</Text>
      <View style={styles.headerActions}>
        <TouchableOpacity onPress={handleNewReading}>
          <Text style={styles.newReadingLink}>{t("newReading")}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleResetLogs} disabled={resetting}>
          <Text style={styles.resetLink}>
            {resetting ? t("resetting") : t("reset")}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Overall section
  const OverallSection = ({ text }: { text: string }) => (
    <GlassCard style={styles.overallSection}>
      <Text style={styles.overallText}>{text}</Text>
    </GlassCard>
  );

  // Throughline section with accent
  const AccentSection = ({ label, text, color = "#a855f7" }: { label: string; text: string; color?: string }) => (
    <GlassCard style={styles.accentSection}>
      <Text style={[styles.accentLabel, { color }]}>{label}</Text>
      <Text style={styles.accentText}>{text}</Text>
    </GlassCard>
  );

  // Beat card
  const BeatCard = ({ label, text, variant = "default" }: { label: string; text: string; variant?: "default" | "warning" | "success" }) => {
    const colors = {
      default: "#a855f7",
      warning: "#ef4444",
      success: "#22c55e",
    };
    return (
      <GlassCard style={styles.beatCard}>
        <Text style={[styles.beatLabel, { color: colors[variant] }]}>{label}</Text>
        <Text style={styles.beatText}>{text}</Text>
      </GlassCard>
    );
  };

  // Next step section with gradient
  const NextStepSection = ({ label, text }: { label: string; text: string }) => (
    <LinearGradient
      colors={["#22c55e", "#16a34a"]}
      style={styles.nextStepSection}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <Text style={styles.nextStepLabel}>{label}</Text>
      <Text style={styles.nextStepText}>{text}</Text>
    </LinearGradient>
  );

  // Journal section
  const JournalSection = ({ text }: { text: string }) => (
    <GlassCard style={styles.journalSection}>
      <Text style={styles.journalLabel}>📝 {t("journal")}</Text>
      <Text style={styles.journalText}>{text}</Text>
    </GlassCard>
  );

  // Keywords
  const Keywords = ({ keywords }: { keywords: string[] }) => (
    <View style={styles.keywordsRow}>
      {keywords.map((kw, i) => (
        <View key={i} style={styles.keywordBadge}>
          <Text style={styles.keywordText}>{kw}</Text>
        </View>
      ))}
    </View>
  );

  // Single Card Reading
  if (spreadType === "single_card" && singleReading) {
    return (
      <GradientBackground>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Header title={singleReading.title} />
          <OverallSection text={singleReading.overall} />
          
          <View style={styles.focusBadgeContainer}>
            <View style={styles.focusBadge}>
              <Text style={styles.focusBadgeText}>{t(singleReading.focusArea)}</Text>
            </View>
          </View>
          
          <View style={styles.contentPadding}>
            <AccentSection label={t("deepDive")} text={singleReading.deepDive} />
            <AccentSection label={`🌑 ${t("shadow")}`} text={singleReading.shadow} color="#6366f1" />
            <NextStepSection label={t("nextStep")} text={singleReading.nextStep} />
            <JournalSection text={singleReading.journal} />
          </View>
        </ScrollView>
      </GradientBackground>
    );
  }

  // Three Card Reading
  if (spreadType === "past_present_future" && threeReading) {
    return (
      <GradientBackground>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Header title={threeReading.title} />
          <OverallSection text={threeReading.overall} />
          
          <View style={styles.contentPadding}>
            <AccentSection label={t("throughline")} text={threeReading.throughline} />
            <AccentSection label={t("story")} text={threeReading.story} color="#6366f1" />
            
            <Text style={styles.sectionTitle}>{t("timeline")}</Text>
            <BeatCard label={t("past")} text={threeReading.beats.past} />
            <BeatCard label={t("present")} text={threeReading.beats.present} />
            <BeatCard label={t("future")} text={threeReading.beats.future} />
            
            <Text style={styles.sectionTitle}>{t("decisionFrame")}</Text>
            <BeatCard label={t("pathA")} text={threeReading.choice.pathA} variant="success" />
            <BeatCard label={t("pathB")} text={threeReading.choice.pathB} variant="warning" />
            
            <GlassCard style={styles.metaSection}>
              <Text style={styles.metaLabel}>{t("emotionalTone")}</Text>
              <Text style={styles.metaValue}>{threeReading.mood}</Text>
              <View style={{ marginTop: 12 }}>
                <Keywords keywords={threeReading.keywords} />
              </View>
            </GlassCard>
            
            <NextStepSection label={t("actionStep")} text={threeReading.nextStep} />
          </View>
        </ScrollView>
      </GradientBackground>
    );
  }

  // SOA Reading
  if (spreadType === "situation_obstacle_advice" && soaReading) {
    return (
      <GradientBackground>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Header title={soaReading.title} />
          <OverallSection text={soaReading.overall} />
          
          <View style={styles.contentPadding}>
            <BeatCard label={t("situation")} text={soaReading.beats.situation} />
            <BeatCard label={t("obstacle")} text={soaReading.beats.obstacle} variant="warning" />
            <BeatCard label={t("advice")} text={soaReading.beats.advice} variant="success" />
            <NextStepSection label={t("nextStep")} text={soaReading.nextStep} />
          </View>
        </ScrollView>
      </GradientBackground>
    );
  }

  // Destiny's Embrace Reading
  if (spreadType === "destinys_embrace" && destinyReading) {
    return (
      <GradientBackground>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Header title={destinyReading.title} />
          <OverallSection text={destinyReading.overall} />
          
          <View style={styles.contentPadding}>
            <BeatCard label={t("destiny")} text={destinyReading.beats.destiny} />
            <BeatCard label={t("path")} text={destinyReading.beats.path} />
            <BeatCard label={t("union")} text={destinyReading.beats.union} variant="success" />
            
            <GlassCard style={styles.metaSection}>
              <Keywords keywords={destinyReading.keywords} />
            </GlassCard>
            
            <NextStepSection label={t("nextStep")} text={destinyReading.nextStep} />
          </View>
        </ScrollView>
      </GradientBackground>
    );
  }

  // Love Choice Reading
  if (spreadType === "love_choice" && loveChoiceReading) {
    return (
      <GradientBackground>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Header title={loveChoiceReading.title} />
          <OverallSection text={loveChoiceReading.overall} />
          
          <View style={styles.contentPadding}>
            <BeatCard label={t("optionA")} text={loveChoiceReading.beats.optionA} />
            <BeatCard label={t("optionA_outcome")} text={loveChoiceReading.beats.optionA_outcome} />
            <BeatCard label={t("optionB")} text={loveChoiceReading.beats.optionB} variant="warning" />
            <BeatCard label={t("optionB_outcome")} text={loveChoiceReading.beats.optionB_outcome} variant="warning" />
            <BeatCard label={t("heartGuidance")} text={loveChoiceReading.beats.advice} variant="success" />
            
            <AccentSection label={t("decisionLens")} text={loveChoiceReading.decisionLens} color="#ec4899" />
            
            <GlassCard style={styles.metaSection}>
              <Keywords keywords={loveChoiceReading.keywords} />
            </GlassCard>
            
            <NextStepSection label={t("nextStep")} text={loveChoiceReading.nextStep} />
          </View>
        </ScrollView>
      </GradientBackground>
    );
  }

  // Path to Love Reading
  if (spreadType === "path_to_love" && pathToLoveReading) {
    return (
      <GradientBackground>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Header title={pathToLoveReading.title} />
          <OverallSection text={pathToLoveReading.overall} />
          
          <View style={styles.contentPadding}>
            <BeatCard label={t("self")} text={pathToLoveReading.beats.self} />
            <BeatCard label={t("block")} text={pathToLoveReading.beats.block} variant="warning" />
            <BeatCard label={t("need")} text={pathToLoveReading.beats.need} />
            <BeatCard label={t("action")} text={pathToLoveReading.beats.action} />
            <BeatCard label={t("potential")} text={pathToLoveReading.beats.potential} variant="success" />
            
            <AccentSection label={t("strategy")} text={pathToLoveReading.strategy} color="#f59e0b" />
            
            <GlassCard style={styles.metaSection}>
              <Keywords keywords={pathToLoveReading.keywords} />
            </GlassCard>
            
            <NextStepSection label={t("nextStep")} text={pathToLoveReading.nextStep} />
          </View>
        </ScrollView>
      </GradientBackground>
    );
  }

  // New Moon Ritual Reading
  if (spreadType === "new_moon_ritual" && newMoonReading) {
    return (
      <GradientBackground>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Header title={newMoonReading.title} />
          <OverallSection text={newMoonReading.overall} />
          
          <View style={styles.contentPadding}>
            <AccentSection label={t("ritualTheme")} text={newMoonReading.ritualTheme} color="#6366f1" />
            
            <BeatCard label={t("intention")} text={newMoonReading.beats.intention} />
            <BeatCard label={t("seed")} text={newMoonReading.beats.seed} />
            <BeatCard label={t("hiddenResistance")} text={newMoonReading.beats.shadow} variant="warning" />
            <BeatCard label={t("support")} text={newMoonReading.beats.support} />
            <BeatCard label={t("firstStep")} text={newMoonReading.beats.firstStep} variant="success" />
            
            <AccentSection label={t("affirmation")} text={newMoonReading.affirmation} color="#ec4899" />
            <NextStepSection label={t("nextStep")} text={newMoonReading.nextStep} />
            <JournalSection text={newMoonReading.journal} />
          </View>
        </ScrollView>
      </GradientBackground>
    );
  }

  // Full Moon Release Reading
  if (spreadType === "full_moon_release" && fullMoonReading) {
    return (
      <GradientBackground>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Header title={fullMoonReading.title} />
          <OverallSection text={fullMoonReading.overall} />
          
          <View style={styles.contentPadding}>
            <AccentSection label={t("releaseTheme")} text={fullMoonReading.releaseTheme} color="#6366f1" />
            
            <BeatCard label={t("illumination")} text={fullMoonReading.beats.illumination} />
            <BeatCard label={t("tension")} text={fullMoonReading.beats.tension} variant="warning" />
            <BeatCard label={t("lesson")} text={fullMoonReading.beats.lesson} />
            <BeatCard label={t("release")} text={fullMoonReading.beats.release} />
            <BeatCard label={t("integration")} text={fullMoonReading.beats.integration} variant="success" />
            
            <AccentSection label={t("cleansingAdvice")} text={fullMoonReading.cleansingAdvice} color="#f59e0b" />
            <AccentSection label={t("affirmation")} text={fullMoonReading.affirmation} color="#ec4899" />
            <NextStepSection label={t("nextStep")} text={fullMoonReading.nextStep} />
            <JournalSection text={fullMoonReading.journal} />
          </View>
        </ScrollView>
      </GradientBackground>
    );
  }

  // Mind Body Spirit Reading
  if (spreadType === "mind_body_spirit" && mbsReading) {
    return (
      <GradientBackground>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Header title={mbsReading.title} />
          <OverallSection text={mbsReading.overall} />
          
          <View style={styles.focusBadgeContainer}>
            <View style={styles.focusBadge}>
              <Text style={styles.focusBadgeText}>{t("harmonyScore")}: {mbsReading.harmonyScore}%</Text>
            </View>
          </View>
          
          <View style={styles.contentPadding}>
            <BeatCard label={t("mind")} text={mbsReading.beats.mind} />
            <BeatCard label={t("body")} text={mbsReading.beats.body} />
            <BeatCard label={t("spirit")} text={mbsReading.beats.spirit} />
            
            <AccentSection label={t("alignmentAdvice")} text={mbsReading.alignmentAdvice} color="#6366f1" />
            <NextStepSection label={t("nextStep")} text={mbsReading.nextStep} />
            <JournalSection text={mbsReading.journal} />
          </View>
        </ScrollView>
      </GradientBackground>
    );
  }

  // Celestial Illumination Reading
  if (spreadType === "celestial_illumination" && celestialReading) {
    return (
      <GradientBackground>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Header title={celestialReading.title} />
          <OverallSection text={celestialReading.overall} />
          
          <View style={styles.contentPadding}>
            <AccentSection label={t("celestialMessage")} text={celestialReading.celestialMessage} color="#6366f1" />
            
            <BeatCard label={t("signal")} text={celestialReading.beats.signal} />
            <BeatCard label={t("guidance")} text={celestialReading.beats.guidance} />
            <BeatCard label={t("integration")} text={celestialReading.beats.integration} variant="success" />
            
            <GlassCard style={styles.metaSection}>
              <Text style={styles.metaLabel}>{t("omenKeywords")}</Text>
              <Keywords keywords={celestialReading.omenKeywords} />
            </GlassCard>
            
            <NextStepSection label={t("nextStep")} text={celestialReading.nextStep} />
            <JournalSection text={celestialReading.journal} />
          </View>
        </ScrollView>
      </GradientBackground>
    );
  }

  // Career Clarity Reading
  if (spreadType === "career_clarity" && careerClarityReading) {
    return (
      <GradientBackground>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Header title={careerClarityReading.title} />
          <OverallSection text={careerClarityReading.overall} />
          
          <View style={styles.contentPadding}>
            <AccentSection label={t("throughline")} text={careerClarityReading.throughline} color="#f59e0b" />
            <NextStepSection label={t("directionHint")} text={careerClarityReading.directionHint} />
            <JournalSection text={careerClarityReading.journal} />
          </View>
        </ScrollView>
      </GradientBackground>
    );
  }

  // Career Path Guide Reading
  if (spreadType === "career_path_guide" && careerPathGuideReading) {
    return (
      <GradientBackground>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Header title={careerPathGuideReading.title} />
          <OverallSection text={careerPathGuideReading.overall} />
          
          <View style={styles.contentPadding}>
            <BeatCard label={t("strength")} text={careerPathGuideReading.beats.strength} />
            <BeatCard label={t("opportunity")} text={careerPathGuideReading.beats.opportunity} />
            <BeatCard label={t("direction")} text={careerPathGuideReading.beats.direction} variant="success" />
            
            <NextStepSection label={t("directionHint")} text={careerPathGuideReading.directionHint} />
            <JournalSection text={careerPathGuideReading.journal} />
          </View>
        </ScrollView>
      </GradientBackground>
    );
  }

  // New Business Exploration Reading
  if (spreadType === "new_business_exploration" && newBusinessReading) {
    return (
      <GradientBackground>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Header title={newBusinessReading.title} />
          <OverallSection text={newBusinessReading.overall} />
          
          <View style={styles.contentPadding}>
            <AccentSection label={t("businessStrategy")} text={newBusinessReading.strategy} color="#f59e0b" />
            <AccentSection label={t("riskNote")} text={newBusinessReading.riskNote} color="#ef4444" />
            <NextStepSection label={t("directionHint")} text={newBusinessReading.directionHint} />
            <JournalSection text={newBusinessReading.journal} />
          </View>
        </ScrollView>
      </GradientBackground>
    );
  }

  // Wealth Flow Reading
  if (spreadType === "wealth_flow" && wealthFlowReading) {
    return (
      <GradientBackground>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Header title={wealthFlowReading.title} />
          <OverallSection text={wealthFlowReading.overall} />
          
          <View style={styles.contentPadding}>
            <AccentSection label={t("flowInsight")} text={wealthFlowReading.flowInsight} color="#f59e0b" />
            <AccentSection label={t("optimization")} text={wealthFlowReading.optimization} color="#22c55e" />
            <NextStepSection label={t("directionHint")} text={wealthFlowReading.directionHint} />
            <JournalSection text={wealthFlowReading.journal} />
          </View>
        </ScrollView>
      </GradientBackground>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "rgba(255, 255, 255, 0.5)",
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorCard: {
    alignItems: "center",
    width: "100%",
    maxWidth: 320,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 20,
    gap: 16,
  },
  headerActions: {
    alignItems: "flex-end",
    gap: 8,
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    flex: 1,
  },
  newReadingLink: {
    color: "#a855f7",
    fontSize: 14,
    fontWeight: "500",
  },
  resetLink: {
    color: "#ef4444",
    fontSize: 14,
    fontWeight: "500",
  },
  contentPadding: {
    padding: 16,
    gap: 12,
  },
  overallSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  overallText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 16,
    lineHeight: 26,
  },
  focusBadgeContainer: {
    alignItems: "center",
    marginBottom: 8,
  },
  focusBadge: {
    backgroundColor: "rgba(168, 85, 247, 0.3)",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#a855f7",
  },
  focusBadgeText: {
    color: "#a855f7",
    fontSize: 13,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  accentSection: {
    // Clean design - no border
  },
  accentLabel: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  accentText: {
    color: "#fff",
    fontSize: 15,
    lineHeight: 24,
    fontStyle: "italic",
  },
  sectionTitle: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 4,
  },
  beatCard: {
    // Clean design - no border
  },
  beatLabel: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 4,
  },
  beatText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 15,
    lineHeight: 24,
  },
  nextStepSection: {
    padding: 16,
    borderRadius: 16,
  },
  nextStepLabel: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  nextStepText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 24,
  },
  journalSection: {
    marginTop: 8,
  },
  journalLabel: {
    color: "#a855f7",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  journalText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 15,
    lineHeight: 24,
    fontStyle: "italic",
  },
  metaSection: {
    marginTop: 8,
  },
  metaLabel: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 12,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  metaValue: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  keywordsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  keywordBadge: {
    backgroundColor: "rgba(168, 85, 247, 0.3)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(168, 85, 247, 0.5)",
  },
  keywordText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
});
