import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useApp } from "../context/AppContext";
import { GradientBackground, GemstoneIcon } from "../components/ui";
import { LinearGradient } from "expo-linear-gradient";
import Constants from "expo-constants";

const host = Constants.expoConfig?.hostUri?.split(":")[0] || "localhost";
const API_URL = `http://${host}:3001/api/dream`;

interface GemPackage {
  id: string;
  gems: number;
  bonus: number;
  total: number;
  priceUSD: number;
  premiumPriceUSD: number;
}

interface PremiumPlan {
  id: string;
  priceUSD: number;
  normalPriceUSD?: number;
  bonusGems: number;
  durationDays: number;
}

export default function MarketScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { gemstoneBalance, isPremium, fetchUserInfo } = useApp();

  const [packages, setPackages] = useState<GemPackage[]>([
    { id: "pack_20", gems: 20, bonus: 0, total: 20, priceUSD: 3.99, premiumPriceUSD: 2.99 },
    { id: "pack_50", gems: 35, bonus: 15, total: 50, priceUSD: 6.99, premiumPriceUSD: 4.99 },
    { id: "pack_100", gems: 75, bonus: 25, total: 100, priceUSD: 14.99, premiumPriceUSD: 10.99 },
    { id: "pack_200", gems: 125, bonus: 75, total: 200, priceUSD: 24.99, premiumPriceUSD: 17.99 },
  ]);
  const [plans, setPlans] = useState<{ monthly?: PremiumPlan; semiannual?: PremiumPlan; yearly?: PremiumPlan }>({
    monthly: { id: "premium_monthly", priceUSD: 4.99, bonusGems: 10, durationDays: 30 },
    semiannual: { id: "premium_semiannual", priceUSD: 19.99, normalPriceUSD: 29.94, bonusGems: 80, durationDays: 180 },
    yearly: { id: "premium_yearly", priceUSD: 34.99, normalPriceUSD: 59.88, bonusGems: 150, durationDays: 365 },
  });

  useEffect(() => {
    fetchPrices();
  }, []);

  const fetchPrices = async () => {
    try {
      const res = await fetch(`${API_URL}/prices`);
      if (res.ok) {
        const data = await res.json();
        if (data.packages?.length) setPackages(data.packages);
        if (data.premiumSubscription) {
          setPlans({
            monthly: data.premiumSubscription.monthly,
            semiannual: data.premiumSubscription.semiannual,
            yearly: data.premiumSubscription.yearly,
          });
        }
      }
    } catch (err) {
      console.warn("Market: fetch error", err);
    }
  };

  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Market</Text>
          <View style={styles.balancePill}>
            <GemstoneIcon size={42} />
            <Text style={styles.balanceText}> {gemstoneBalance}</Text>
          </View>
        </View>

        {/* Premium Status */}
        {isPremium && (
          <LinearGradient colors={["rgba(168,85,247,0.3)", "rgba(99,102,241,0.15)"]} style={styles.premiumBanner}>
            <Text style={styles.premiumBannerText}>★ Premium Aktif</Text>
            <Text style={styles.premiumBannerSub}>İndirimli taş fiyatları uygulanıyor</Text>
          </LinearGradient>
        )}

        {/* ═══════════════════════════════════ */}
        {/* PREMIUM ABONELIK */}
        {/* ═══════════════════════════════════ */}
        <Text style={styles.section}>Premium Abonelik</Text>

        {/* Premium Avantajlari */}
        <View style={styles.perksCard}>
          <PerkItem icon="🌕" text="Moon Astro — tüm slotlar açık" />
          <PerkItem icon="✦" text="Taş paketlerinde %25 indirim" />
          <PerkItem icon="🎁" text="Her dönem bonus taş hediye" />
        </View>

        {/* 12 Aylik */}
        {plans.yearly && (
          <TouchableOpacity activeOpacity={0.85}>
            <LinearGradient
              colors={["rgba(245,158,11,0.4)", "rgba(234,88,12,0.15)", "rgba(30,20,60,0.9)"]}
              style={styles.planCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.bestTag}>
                <Text style={styles.bestTagText}>En Avantajlı</Text>
              </View>
              <View style={styles.planHeader}>
                <Text style={styles.planName}>12 Aylık</Text>
                <Text style={styles.planMonthly}>$2.92/ay</Text>
              </View>
              <View style={styles.planPriceRow}>
                <Text style={styles.planOldPrice}>${plans.yearly.normalPriceUSD}</Text>
                <Text style={styles.planPrice}>${plans.yearly.priceUSD}</Text>
                <View style={styles.saveBadge}><Text style={styles.saveText}>%42</Text></View>
              </View>
              <View style={styles.planBonus}>
                <Text style={styles.planBonusText}>🎁 {plans.yearly.bonusGems} taş hediye</Text>
                <Text style={styles.planBonusValue}>${(plans.yearly.bonusGems * 3.99 / 20).toFixed(2)} değerinde</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* 6 Aylik */}
        {plans.semiannual && (
          <TouchableOpacity activeOpacity={0.85}>
            <LinearGradient
              colors={["rgba(168,85,247,0.35)", "rgba(99,102,241,0.15)", "rgba(30,20,60,0.9)"]}
              style={styles.planCard}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.planHeader}>
                <Text style={styles.planName}>6 Aylık</Text>
                <Text style={styles.planMonthly}>$3.33/ay</Text>
              </View>
              <View style={styles.planPriceRow}>
                <Text style={styles.planOldPrice}>${plans.semiannual.normalPriceUSD}</Text>
                <Text style={styles.planPrice}>${plans.semiannual.priceUSD}</Text>
                <View style={styles.saveBadge}><Text style={styles.saveText}>%33</Text></View>
              </View>
              <View style={styles.planBonus}>
                <Text style={styles.planBonusText}>🎁 {plans.semiannual.bonusGems} taş hediye</Text>
                <Text style={styles.planBonusValue}>${(plans.semiannual.bonusGems * 3.99 / 20).toFixed(2)} değerinde</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Aylik */}
        {plans.monthly && (
          <TouchableOpacity activeOpacity={0.85}>
            <View style={styles.planCardSimple}>
              <View style={styles.planHeader}>
                <Text style={styles.planName}>Aylık</Text>
                <Text style={styles.planPrice}>${plans.monthly.priceUSD}<Text style={styles.planPeriod}>/ay</Text></Text>
              </View>
              <View style={styles.planBonus}>
                <Text style={styles.planBonusText}>🎁 {plans.monthly.bonusGems} taş hediye</Text>
                <Text style={styles.planBonusValue}>${(plans.monthly.bonusGems * 3.99 / 20).toFixed(2)} değerinde</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* ═══════════════════════════════════ */}
        {/* TAS PAKETLERI */}
        {/* ═══════════════════════════════════ */}
        <Text style={[styles.section, { marginTop: 32 }]}>Taş Paketleri</Text>

        {packages.map((pkg, i) => {
          const isBest = i === packages.length - 1;
          return (
            <TouchableOpacity key={pkg.id} activeOpacity={0.85}>
              <View style={[styles.gemCard, isBest && styles.gemCardBest]}>
                {isBest && (
                  <View style={styles.popTag}><Text style={styles.popTagText}>En Popüler</Text></View>
                )}
                <View style={styles.gemRow}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <GemstoneIcon size={42} />
                    <Text style={styles.gemTotal}>{pkg.total}</Text>
                    {pkg.bonus > 0 && <Text style={styles.gemBonusLarge}>+{pkg.bonus} bonus</Text>}
                  </View>
                  <Text style={styles.gemPrice}>${pkg.priceUSD}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* ═══════════════════════════════════ */}
        {/* PREMIUM TAS PAKETLERI */}
        {/* ═══════════════════════════════════ */}
        <Text style={[styles.section, { marginTop: 28 }]}>Premium Taş Paketleri</Text>
        <Text style={styles.premiumTableNote}>Premium üyelere özel indirimli fiyatlar</Text>

        {packages.map((pkg, i) => {
          const isBest = i === packages.length - 1;
          const discount = Math.round((1 - pkg.premiumPriceUSD / pkg.priceUSD) * 100);
          return (
            <TouchableOpacity key={`prem_${pkg.id}`} activeOpacity={0.85}>
              <LinearGradient
                colors={["rgba(168,85,247,0.15)", "rgba(99,102,241,0.08)", "rgba(30,20,60,0.9)"]}
                style={[styles.gemCard, isBest && styles.gemCardBest]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {isBest && (
                  <View style={styles.popTag}><Text style={styles.popTagText}>En Popüler</Text></View>
                )}
                <View style={styles.gemRow}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <GemstoneIcon size={42} />
                    <Text style={styles.gemTotal}>{pkg.total}</Text>
                    {pkg.bonus > 0 && <Text style={styles.gemBonusLarge}>+{pkg.bonus} bonus</Text>}
                  </View>
                  <View style={styles.gemPriceCol}>
                    <Text style={styles.gemOldPrice}>${pkg.priceUSD}</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={styles.gemPricePremium}>${pkg.premiumPriceUSD}</Text>
                      <View style={styles.discountBadge}><Text style={styles.discountText}>%{discount}</Text></View>
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          );
        })}

        {/* ═══════════════════════════════════ */}
        {/* FIYAT TABLOSU */}
        {/* ═══════════════════════════════════ */}
        <Text style={[styles.section, { marginTop: 32 }]}>Ne Kadar Taş Harcanır?</Text>
        <View style={styles.table}>
          <TableRow label="Tekli Tarot / Evet-Hayır" cost={3} />
          <TableRow label="Üçlü Tarot" cost={5} />
          <TableRow label="Beşli Tarot" cost={8} />
          <TableRow label="Hızlı Çözümleme (A)" cost={4} />
          <TableRow label="Dönüştürme Planı (C)" cost={5} />
          <TableRow label="Derin Çözümleme (B)" cost={8} />
          <TableRow label="Kendine Sor+" cost={2} />
          <TableRow label="Sembol Açma" cost={1} last />
        </View>

        <View style={{ height: 50 }} />
      </ScrollView>
    </GradientBackground>
  );
}

function PerkItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.perkRow}>
      <Text style={styles.perkIcon}>{icon}</Text>
      <Text style={styles.perkText}>{text}</Text>
    </View>
  );
}

function TableRow({ label, cost, last }: { label: string; cost: number; last?: boolean }) {
  return (
    <View style={[styles.tableRow, !last && styles.tableRowBorder]}>
      <Text style={styles.tableLabel}>{label}</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        <GemstoneIcon size={38} />
        <Text style={styles.tableCost}>{cost}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20 },

  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  backBtn: { paddingRight: 8 },
  backText: { color: "#fff", fontSize: 28, fontWeight: "300" },
  headerTitle: { color: "#fff", fontSize: 24, fontWeight: "800", flex: 1, textAlign: "center" },
  balancePill: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.1)", borderWidth: 1, borderColor: "rgba(255,255,255,0.15)" },
  balanceText: { color: "#fff", fontWeight: "600", fontSize: 13 },

  premiumBanner: { borderRadius: 14, padding: 14, alignItems: "center", marginBottom: 20 },
  premiumBannerText: { color: "#c084fc", fontSize: 15, fontWeight: "700" },
  premiumBannerSub: { color: "rgba(255,255,255,0.5)", fontSize: 11, marginTop: 2 },

  section: { color: "rgba(255,255,255,0.55)", fontSize: 14, fontWeight: "700", letterSpacing: 0.5, marginBottom: 12, textTransform: "uppercase" },

  perksCard: { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 14, padding: 14, marginBottom: 14, gap: 10 },
  perkRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  perkIcon: { fontSize: 18 },
  perkText: { color: "rgba(255,255,255,0.75)", fontSize: 13, fontWeight: "500" },

  planCard: { borderRadius: 16, padding: 18, marginBottom: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", overflow: "hidden" },
  planCardSimple: { borderRadius: 16, padding: 18, marginBottom: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.04)" },
  bestTag: { position: "absolute", top: 0, right: 0, backgroundColor: "#f59e0b", paddingHorizontal: 12, paddingVertical: 4, borderBottomLeftRadius: 10 },
  bestTagText: { color: "#000", fontSize: 10, fontWeight: "800" },
  planHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" },
  planName: { color: "#fff", fontSize: 18, fontWeight: "700" },
  planMonthly: { color: "#fbbf24", fontSize: 14, fontWeight: "700" },
  planPriceRow: { flexDirection: "row", alignItems: "baseline", gap: 8, marginTop: 6 },
  planOldPrice: { color: "rgba(255,255,255,0.3)", fontSize: 15, textDecorationLine: "line-through" },
  planPrice: { color: "#fff", fontSize: 26, fontWeight: "900" },
  planPeriod: { color: "rgba(255,255,255,0.4)", fontSize: 13, fontWeight: "400" },
  saveBadge: { backgroundColor: "rgba(34,197,94,0.25)", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  saveText: { color: "#4ade80", fontSize: 12, fontWeight: "800" },
  planBonus: { marginTop: 10, backgroundColor: "rgba(34,197,94,0.1)", borderRadius: 8, padding: 8, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  planBonusText: { color: "#4ade80", fontSize: 13, fontWeight: "600" },
  planBonusValue: { color: "#fff", fontSize: 13, fontWeight: "700" },
  planDetail: { color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 8, textAlign: "center" },

  gemCard: { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", overflow: "hidden" },
  gemCardBest: { borderColor: "rgba(34,197,94,0.3)", borderWidth: 1.5 },
  popTag: { position: "absolute", top: 0, right: 0, backgroundColor: "#22c55e", paddingHorizontal: 10, paddingVertical: 3, borderBottomLeftRadius: 8, zIndex: 10 },
  popTagText: { color: "#000", fontSize: 9, fontWeight: "800" },
  gemRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  gemLeftRow: { flexDirection: "row", alignItems: "baseline", gap: 6 },
  gemTotal: { color: "#fff", fontSize: 20, fontWeight: "800" },
  gemBonus: { color: "#4ade80", fontSize: 11, fontWeight: "600", marginTop: 2 },
  gemBonusLarge: { color: "#4ade80", fontSize: 14, fontWeight: "700", marginTop: 3 },
  gemPriceCol: { alignItems: "flex-end" },
  gemOldPrice: { color: "rgba(255,255,255,0.3)", fontSize: 13, textDecorationLine: "line-through", marginBottom: 2 },
  gemPrice: { color: "#fff", fontSize: 20, fontWeight: "900" },
  gemPricePremium: { color: "#fff", fontSize: 20, fontWeight: "900" },
  discountBadge: { backgroundColor: "rgba(168,85,247,0.25)", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  discountText: { color: "#c084fc", fontSize: 11, fontWeight: "700" },
  premiumTableNote: { color: "rgba(192,132,252,0.6)", fontSize: 11, marginBottom: 10, marginTop: -6 },

  table: { backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 14, overflow: "hidden" },
  tableRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  tableRowBorder: { borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  tableLabel: { color: "rgba(255,255,255,0.65)", fontSize: 13 },
  tableCost: { color: "#fff", fontSize: 13, fontWeight: "700" },
});
