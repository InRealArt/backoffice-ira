"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  getUmamiStatsForArtwork,
  getUmamiMonthlyStatsForArtwork,
  generateArtworkSlug,
} from "@/lib/actions/umami-actions";
import Modal from "@/app/components/Common/Modal";

interface PresaleArtworkStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  artworkName: string;
  artworkId: number;
}

export default function PresaleArtworkStatsModal({
  isOpen,
  onClose,
  artworkName,
  artworkId,
}: PresaleArtworkStatsModalProps) {
  const [monthlyStats, setMonthlyStats] = useState<
    Array<{
      year: number;
      month: number;
      viewCount: number;
      monthLabel: string;
    }>
  >([]);
  const [overallStats, setOverallStats] = useState<{
    pageviews?: { value: number; delta?: number };
    visitors?: { value: number; delta?: number };
    visits?: { value: number; delta?: number };
    bounces?: { value: number; delta?: number };
    totaltime?: { value: number; delta?: number };
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && artworkName) {
      loadStats();
    } else if (!isOpen) {
      // Réinitialiser les stats quand la modale se ferme
      setMonthlyStats([]);
      setOverallStats(null);
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, artworkName]);

  async function loadStats() {
    setIsLoading(true);
    setError(null);

    try {
      // Générer le slug à partir du nom de l'œuvre
      const slug = await generateArtworkSlug(artworkName);

      // Récupérer les stats mensuelles
      const monthlyResult = await getUmamiMonthlyStatsForArtwork(slug);

      if (!monthlyResult.success) {
        setError(
          monthlyResult.error ||
            "Erreur lors du chargement des statistiques mensuelles"
        );
        setIsLoading(false);
        return;
      }

      setMonthlyStats(monthlyResult.data || []);

      // Récupérer les stats globales (30 derniers jours)
      const overallResult = await getUmamiStatsForArtwork(slug);

      if (overallResult.success && overallResult.data?.stats) {
        // Logger pour debug si nécessaire
        console.log("Stats Umami reçues:", overallResult.data.stats);
        setOverallStats(overallResult.data.stats);
      } else if (overallResult.success && !overallResult.data?.stats) {
        // Pas de stats disponibles mais pas d'erreur
        console.log("Aucune statistique globale disponible pour cette période");
      }
    } catch (err) {
      console.error("Erreur lors du chargement des stats:", err);
      setError("Erreur lors du chargement des statistiques");
    } finally {
      setIsLoading(false);
    }
  }

  // Inverser l'ordre pour afficher du plus ancien au plus récent
  const chartData = [...monthlyStats].reverse();

  const totalViews = monthlyStats.reduce(
    (sum, stat) => sum + stat.viewCount,
    0
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Statistiques Umami - ${artworkName}`}
      maxWidth="max-w-4xl"
    >
      <div className="w-full">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Chargement des statistiques...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-red-500">{error}</div>
          </div>
        ) : monthlyStats.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">
              Aucune statistique disponible pour cette œuvre
            </div>
          </div>
        ) : (
          <>
            {/* Statistiques globales */}
            {overallStats && (
              <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                {overallStats.pageviews &&
                  overallStats.pageviews.value !== undefined && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="text-xs text-gray-600 mb-1">
                        Pages vues
                      </div>
                      <div className="text-2xl font-semibold text-indigo-600">
                        {overallStats.pageviews.value.toLocaleString("fr-FR")}
                      </div>
                      {overallStats.pageviews.delta !== undefined && (
                        <div className="text-xs text-gray-500 mt-1">
                          {overallStats.pageviews.delta >= 0 ? "+" : ""}
                          {overallStats.pageviews.delta.toLocaleString("fr-FR")}
                        </div>
                      )}
                    </div>
                  )}
                {overallStats.visitors &&
                  overallStats.visitors.value !== undefined && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="text-xs text-gray-600 mb-1">
                        Visiteurs uniques
                      </div>
                      <div className="text-2xl font-semibold text-indigo-600">
                        {overallStats.visitors.value.toLocaleString("fr-FR")}
                      </div>
                      {overallStats.visitors.delta !== undefined && (
                        <div className="text-xs text-gray-500 mt-1">
                          {overallStats.visitors.delta >= 0 ? "+" : ""}
                          {overallStats.visitors.delta.toLocaleString("fr-FR")}
                        </div>
                      )}
                    </div>
                  )}
                {overallStats.visits &&
                  overallStats.visits.value !== undefined && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="text-xs text-gray-600 mb-1">Visites</div>
                      <div className="text-2xl font-semibold text-indigo-600">
                        {overallStats.visits.value.toLocaleString("fr-FR")}
                      </div>
                      {overallStats.visits.delta !== undefined && (
                        <div className="text-xs text-gray-500 mt-1">
                          {overallStats.visits.delta >= 0 ? "+" : ""}
                          {overallStats.visits.delta.toLocaleString("fr-FR")}
                        </div>
                      )}
                    </div>
                  )}
                {overallStats.bounces &&
                  overallStats.bounces.value !== undefined &&
                  overallStats.visits &&
                  overallStats.visits.value !== undefined && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="text-xs text-gray-600 mb-1">
                        Taux de rebond
                      </div>
                      <div className="text-2xl font-semibold text-indigo-600">
                        {(
                          (overallStats.bounces.value /
                            overallStats.visits.value) *
                          100
                        ).toFixed(1)}
                        %
                      </div>
                    </div>
                  )}
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Vues mensuelles
              </h3>
              <p className="text-sm text-gray-600">
                Nombre total de vues :{" "}
                <span className="font-semibold">
                  {totalViews.toLocaleString("fr-FR")}
                </span>
              </p>
            </div>

            <div className="w-full" style={{ height: "400px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{
                    top: 20,
                    right: 30,
                    left: 20,
                    bottom: 60,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="monthLabel"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: 12 }}
                    interval={0}
                  />
                  <YAxis
                    label={{
                      value: "Nombre de vues",
                      angle: -90,
                      position: "insideLeft",
                    }}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      padding: "8px 12px",
                    }}
                    formatter={(value: number) => [
                      value.toLocaleString("fr-FR"),
                      "Vues",
                    ]}
                    labelFormatter={(label) => `Période : ${label}`}
                  />
                  <Legend />
                  <Bar
                    dataKey="viewCount"
                    name="Vues"
                    fill="#6366f1"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {monthlyStats.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                  Détails par mois
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {monthlyStats.map((stat) => (
                    <div
                      key={`${stat.year}-${stat.month}`}
                      className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                    >
                      <div className="text-xs text-gray-600 mb-1">
                        {stat.monthLabel}
                      </div>
                      <div className="text-lg font-semibold text-indigo-600">
                        {stat.viewCount.toLocaleString("fr-FR")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
